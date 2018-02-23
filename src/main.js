const _ = require( 'lodash' );

const Deque = require( '~/lib/deque' ),
    Logger = require( '~/lib/logger' );

const workers = require( '~/workers' ),
    constants = require( '~/constants' ),
    RoomState = require( '~/room_state/RoomState' ),
    RenewWorker = require( '~/workers/RenewWorker' );

const ExtensionPlanner = require( '~/construction_planner/ExtensionPlanner' ),
    SourceRoadPlanner = require( '~/construction_planner/SourceRoadPlanner' ),
    ContainerPlanner = require( '~/construction_planner/ContainerPlanner' );

const CreepPositionCollector = require( '~/metrics/CreepPositionCollector' );

const STATES_VERSION = 2; // Increment this and the code will automatically reset current state on next deploy

const loopItem = ( name, func ) => {
    logger = new Logger( name );
    logger.patch();

    try {
        return func();
    } catch ( error ) {
        Memory.error_log = new Deque( Memory.error_log );
        Memory.error_log.push( {
            name: name,
            error: {
                time: new Date(),
                name: error.name,
                message: error.message,
                stack: error.stack
            }
        } );

        console.log( 'Error in ' + name );
        console.log( error );
        console.log( error.stack );
    }
    finally {
        logger.unpatch();
    }
};

const room_states = [
    {
        isComplete: ( room ) => {
            return room.controller.level === 2
        },
        worker_counts: {
            [ workers.types.HARVESTER ]: 1,
            [ workers.types.UPGRADER ]: 1
        },
        construction_planners: []
    },
    {
        isComplete: ( room ) => {
            let extensions = room
                .find( FIND_MY_STRUCTURES, {
                    filter: {
                        structureType: constants.STRUCTURE_EXTENSION
                    }
                } );
            return extensions.length === 5;
        },
        worker_counts: {
            [ workers.types.BUILDER ]: 2,
            [ workers.types.HARVESTER ]: 2
        },
        construction_planners: [
            new ExtensionPlanner( Game.spawns[ 'Spawn1' ] )
        ]
    },
    {
        isComplete: ( room ) => {
            let construction_sites = room.find( FIND_MY_CONSTRUCTION_SITES );
            return construction_sites.length === 0;
        },
        worker_counts: {
            [ workers.types.HARVESTER ]: 1,
            [ workers.types.BUILDER ]: 3,
            [ workers.types.REPAIRER ]: 1
        },
        construction_planners: [
            new SourceRoadPlanner( 'spawn', Game.spawns[ 'Spawn1' ] ),
            new SourceRoadPlanner( 'controller', Game.spawns[ 'Spawn1' ].room.controller )
        ]
    },
    // Make containers for container farming
    {
        isComplete: ( room ) => {
            let construction_sites = room.find( FIND_MY_CONSTRUCTION_SITES );
            return construction_sites.length === 0;
        },
        worker_counts: {
            [ workers.types.HARVESTER ]: 1,
            [ workers.types.BUILDER ]: 3,
            [ workers.types.REPAIRER ]: 1
        },
        construction_planners: [
            new ContainerPlanner( 'container', Game.spawns[ 'Spawn1' ] )
        ]
    },
    {
        isComplete: ( room ) => {
            return room.controller.level === 3;
        },
        worker_counts: {
            [ workers.types.HARVESTER ]: 1,
            [ workers.types.UPGRADER ]: 3,
            [ workers.types.REPAIRER ]: 1
        },
        construction_planners: []
    },
    {
        isComplete: ( room ) => {
            let extensions = room
                .find( FIND_MY_STRUCTURES, {
                    filter: {
                        structureType: constants.STRUCTURE_EXTENSION
                    }
                } );
            return extensions.length === 10;
        },
        worker_counts: {
            [ workers.types.HARVESTER ]: 1,
            [ workers.types.BUILDER ]: 3,
            [ workers.types.REPAIRER ]: 1
        },
        construction_planners: [
            new ExtensionPlanner( 'extension-2', Game.spawns[ 'Spawn1' ] )
        ]
    },
    {
        isComplete: ( room ) => {
            return false;
        },
        worker_counts: {
            [ workers.types.HARVESTER ]: 1,
            [ workers.types.UPGRADER ]: 3,
            [ workers.types.REPAIRER ]: 1
        },
        construction_planners: []
    }
];

const _getCurrentState = ( room ) => {
    if( !room.memory.hasOwnProperty( '_state' ) ) room.memory._state = {};
    const room_state_memory = room.memory._state;

    if( !room_state_memory.hasOwnProperty( 'current_state' ) ) room_state_memory.current_state = 0;
    if( !room_state_memory.hasOwnProperty( 'current_version' ) ) room_state_memory.current_version = STATES_VERSION;

    if( room_state_memory.current_version !== STATES_VERSION ) {
        room_state_memory.current_state = 0;
        room_state_memory.current_version = STATES_VERSION;
    }

    return room_states[ room_state_memory.current_state ];
};

const spawnCreep = ( spawn, worker_type ) => {
    spawn
        .spawnCreep( [ 
            constants.WORK, 
            constants.CARRY, 
            constants.MOVE, 
            constants.MOVE, 
            constants.CARRY 
        ], worker_type + '-' + Game.time.toString(), {
            memory: {
                worker_type: worker_type
            }
        } );
};

const canSpawn = ( spawn ) => {
    return spawn.energy >= 300;
};

const getNeededSpawns = ( room, worker_counts ) => {
    const all_creeps = room.find( FIND_MY_CREEPS );

    let current_counts = _
        .reduce( all_creeps, ( counts, creep ) => {
            if( !counts.hasOwnProperty( creep.memory.worker_type ) ) counts[ creep.memory.worker_type ] = 0;
            counts[ creep.memory.worker_type ]++;
            return counts;
        }, {} );

    let needed_counts = _
        .reduce( worker_counts, ( needed, val, type ) => {
            let current_val = current_counts.hasOwnProperty( type ) ? current_counts[ type ] : 0;
            if( val - current_val > 0 ) {
                needed[ type ] = val - current_val;
            }
            return needed;
        }, {} );

    return needed_counts;
};

const handleRoomState = ( room ) => {
    const current_state = _getCurrentState( room );

    if( current_state.isComplete( room ) ) {
        console.log( 'Room Progressed to next state' );
        room.memory._state.current_state++;
        return;
    }

    const spawn = room.find( FIND_MY_SPAWNS )[ 0 ];
    
    if( canSpawn( spawn ) ) {
        const needed_spawns = getNeededSpawns( room, current_state.worker_counts );

        if( Object.keys( needed_spawns ).length > 0 ) {
            console.log( 'Spawning' );
            if( needed_spawns[ workers.types.HARVESTER ] ) {
                spawnCreep( spawn, workers.types.HARVESTER );
            }
            spawnCreep( spawn, Object.keys( needed_spawns )[ 0 ] )
        } else {
            let renewing_creeps = room
                .find( FIND_MY_CREEPS, {
                    filter: ( creep ) => {
                        if( creep ) {
                            return RenewWorker.isRenewing( creep );
                        }
                    }
                } );

            if( renewing_creeps.length === 0 ) {
                console.log( 'Telling a creep to renew' );
                let room_creeps = room.find( FIND_MY_CREEPS );
                room_creeps = _.sortBy( room_creeps, ( creep ) => creep.ticksToLive );

                if( room_creeps.length > 0 ) {
                    let temp_worker = new RenewWorker();
                    temp_worker.setCreep( room_creeps[ 0 ] );
                    temp_worker.setRenew( spawn.id );
                }
            }
        }
    }

    room
        .find( FIND_MY_CREEPS )
        .forEach( ( creep ) => {
            loopItem( 'creep-work-' + creep.name, () => {
                const WorkerClass = workers.getClass( creep.memory.worker_type );
                const worker = new WorkerClass();
                worker.setCreep( creep );
                worker.doWork();
            } );
        } );

    current_state
        .construction_planners
        .forEach( ( planner ) => {
            planner.createConstructionSites( room );
        } );
}

module.exports.loop = function() {
    const spawn = Game.spawns[ 'Spawn1' ];
    const room = spawn.room;

    loopItem( 'collectors', () => {
        const collectors = [
            new CreepPositionCollector()
        ];

        collectors
            .forEach( ( collector ) => {
                collector.collect( room );
            } );

        // collectors[ 0 ].drawHotSpots( room );
    } );
    
    loopItem( 'garbage-collector', () => {
        for( let i in Memory.creeps ) {
            if( !Game.creeps[ i ] ) {
                delete Memory.creeps[ i ];
            }
        }
    } );

    loopItem( 'handleRoomState', () => {
        handleRoomState( room );
    } );

    console.log( ' -- Tick End ' + Game.cpu.getUsed() + ' -- ' );
}
