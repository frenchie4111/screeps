const loopItem = require( '~/lib/loopItem' );

const constants = require( '~/constants' ),
    workers = require( '~/workers' );

const Assigner = require( './Assigner' ),
    SpawnManager = require( './SpawnManager' ),
    LinkManager = require( './LinkManager' ),
    MarketManager = require( './MarketManager' );

const types = require( './types' );

class RoomManager {
    constructor() {
        this.default_type = 'standard';
    }

    _getCurrentState( room ) {
        if( !room.memory.hasOwnProperty( '_state' ) ) room.memory._state = {};
        if( !room.memory.hasOwnProperty( 'type' ) ) {
            console.log( 'Room Has No Type: ' + room.name );
            return null;
        }
        const room_state_memory = room.memory._state;
        const type = room.memory.type;

        if( !room_state_memory.hasOwnProperty( 'current_state' ) ) room_state_memory.current_state = 0;
        if( !room_state_memory.hasOwnProperty( 'current_version' ) ) room_state_memory.current_version = types.STATES_VERSION;

        if( room_state_memory.current_version !== types.STATES_VERSION ) {
            room_state_memory.current_state = 0;
            room_state_memory.current_version = types.STATES_VERSION;
        }

        if( !types[ type ] ) {
            return null;
        }

        return types[ type ][ room_state_memory.current_state ];
    };

    garbageCollectRoomCreeps( room ) {
        if( !room.memory.creeps ) return;

        let remove = [];
        for( let i in room.memory.creeps ) {
            let creep_name = room.memory.creeps[ i ]

            if( !Game.creeps[ creep_name ] ) {
                console.log( 'Oops, lost creep', creep_name );
                if( !creep_name.includes( 'RESERVE' ) ) {
                    Game.notify( 'Oops, lost creep ' + creep_name );
                }
                remove.push( i );
            }
        }
        remove.forEach( ( i ) => room.memory.creeps.splice( i, 1 ) );
    }

    getRoomCreeps( room ) {
        if( !room.memory.creeps ) {
            console.log( 'init creeps' );
            room.memory.creeps = room.find( FIND_MY_CREEPS ).map( ( creep ) => creep.name );
        }

        return _
            .map( room.memory.creeps, ( creep_name ) => {
                let creep = Game.creeps[ creep_name ];
                if( !creep ) {
                    console.log( 'NO CREEP WITH NAME', creep_name );
                }
                return creep;
            } );
    }

    handleSpawns( room, spawn, current_state, assigner ) {
        let manager = new SpawnManager();
        manager.doManage( room, spawn, current_state, this.getRoomCreeps( room ), assigner );
    }

    handleCreeps( room, spawn, current_state, assigner ) {
        const creeps = this.getRoomCreeps( room );

        creeps
            .forEach( ( creep ) => {
                loopItem( 'creep-work-' + creep.name.replace( '-', '.' ), () => {
                    const WorkerClass = workers.getClass( creep.memory.worker_type );
                    if( !WorkerClass ) {
                        throw new Error( 'No workerclass for ', creep.memory.worker_type );
                    }
                    const worker = new WorkerClass( assigner );
                    worker.setCreep( creep );
                    worker.doWork( creep, room, spawn );
                } );
            } );
    }

    handleConstruction( room, spawn, current_state ) {
        let planners = current_state.planners;

        if( _.isFunction( planners ) ) {
            planners = planners( room, spawn );
        }

        console.log( 'planners', JSON.stringify( planners ) );

        planners
            .forEach( ( planner ) => {
                loopItem( 'planner-' + planner.name, () => {
                    return planner.doPlan( room, spawn );
                } );
            } );
    }

    handleTower( tower ) {
        let hostile_creeps = tower.room.find( FIND_HOSTILE_CREEPS );

        if( hostile_creeps.length > 0 ) {
            console.log( 'Attacking Hostile Creep' );
            return tower.attack( hostile_creeps[ 0 ] );
        }

        let damaged_creeps = tower.room
            .find( FIND_MY_CREEPS, {
                filter: ( creep ) => {
                    return creep.hits < creep.hitsMax
                }
            } );

        if( damaged_creeps.length > 0 ) {
            console.log( 'Healing Creep' );
            return tower.heal( damaged_creeps[ 0 ] );
        }

        if( ( tower.energy / tower.energyCapacity ) < 0.2 ) {
            // Don't repair if we have less than 20% energy, so we can still defend
            return;
        }

        const types_to_repair = {
            [ constants.STRUCTURE_ROAD ]: 0.5, 
            [ constants.STRUCTURE_WALL ]: 0.0005, 
            [ constants.STRUCTURE_RAMPART ]: 0.0005
        };

        let structures_to_repair = tower
            .room
            .find( FIND_STRUCTURES, {
                filter: ( structure ) => {
                    if( types_to_repair.hasOwnProperty( structure.structureType ) ) {
                        if( ( structure.hits / structure.hitsMax ) < types_to_repair[ structure.structureType ] ) {
                            console.log( structure, ( structure.hits / structure.hitsMax ) );
                            return true;
                        }
                    }
                }
            } );

        if( structures_to_repair.length > 0 ) {
            structures_to_repair = _.sortBy( structures_to_repair, ( structure ) => ( structure.hits / structure.hitsMax ) );
            return tower.repair( structures_to_repair[ 0 ] );
        }
    };

    handleTowers( room, spawn, current_state ) {
        room
            .find( FIND_MY_STRUCTURES, {
                filter: {
                    structureType: STRUCTURE_TOWER
                }
            } )
            .forEach( ( tower ) => {
                loopItem( 'tower-' + tower.room.name + '-' + tower.id, () => {
                    return this.handleTower( tower );
                } )
            } );
    }

    handleLinks( room, spawn, current_state ) {
        const link_manager = new LinkManager();
        link_manager.doManage( room, spawn );
    }

    handleMarket( room, spawn, current_state ) {
        const market_manager = new MarketManager();
        market_manager.doManage( room, spawn );
    }

    doManage( room ) {
        const current_state = this._getCurrentState( room );

        if( !current_state ) {
            return;
        }

        const spawns = room.find( FIND_MY_SPAWNS );
        const has_spawn = spawns.length > 0;
        const spawn = spawns[ 0 ]; // TODO figure out how to do this when multi-spawns

        const assigner = new Assigner( room, spawn );
        assigner.garbageCollect();

        this.garbageCollectRoomCreeps( room );

        while( current_state.isComplete( room ) ) {
            console.log( 'Room Progressed to next state' );
            Game.notify( 'Room ' + room.name + ' progressed to next state' );
            room.memory._state.current_state++;
            return;
        }

        loopItem( 'safe-mode', () => {
            let hostile_creeps = room
                .find( FIND_HOSTILE_CREEPS, {
                    filter: ( creep ) => {
                        return (
                            creep.owner.username !== SYSTEM_USERNAME &&
                            (
                                creep.getActiveBodyparts( ATTACK ) > 0 ||
                                creep.getActiveBodyparts( RANGED_ATTACK ) > 0
                            )
                        );
                    }
                } );
            console.log( 'hostile_creeps', hostile_creeps.length );

            if( hostile_creeps.length === 0 ) return;

            if( !room.controller.safeMode ) {
                if( !room.controller.safeModeAvailable ) {
                    Game.notify( 'Safe mode not available' );
                    throw new Error( 'Safe mode not available' );
                }

                let safe_mode_response = room.controller.activateSafeMode();
                if( safe_mode_response !== OK ) {
                    Game.notify( 'Safe mode failed ' + safe_mode_response + ' ' + constants.lookup( safe_mode_response ) );
                    throw new Error( 'Safe mode failed ' + safe_mode_response + ' ' + constants.lookup( safe_mode_response ) );;
                }
            } else {
                console.log( 'Already in safe mode' );
            }
        } );

        loopItem( 'creeps', () => {
            this.handleCreeps( room, spawn, current_state, assigner );
        } );

        loopItem( 'towers', () => {
            this.handleTowers( room, spawn, current_state );
        } );

        if( room.terminal ) {
            console.log( room.terminal );
            loopItem( 'market', () => {
                this.handleMarket( room, spawn, current_state );
            } );
        }

        if( has_spawn ) {
            loopItem( 'links', () => {
                this.handleLinks( room, spawn, current_state );
            } );

            loopItem( 'spawn', () => {
                this.handleSpawns( room, spawn, current_state, assigner );
            } );
        }
        
        loopItem( 'construction', () => {
            this.handleConstruction( room, spawn, current_state );
        } );
    }
};

module.exports = RoomManager;
