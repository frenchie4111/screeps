const constants = require( '~/constants' ),
    move = require( '~/lib/move' ),
    position = require( '~/lib/position' ),
    map = require( '~/lib/map' );

const RenewWorker = require( './RenewWorker' );

const BoostManager = require( '../room_manager/BoostManager' );

let STATES = {
    MOVE_BOOST: 'MOVE_BOOST',
    BOOST: 'BOOST',
    MOVE_TO_FLAG: 'MOVE_TO_FLAG',
    MOVE_TO_ROOM: 'MOVE_TO_ROOM',
    CLEAR: 'CLEAR'
};

class AttackPairLead extends RenewWorker {
    constructor( assigner ) {
        super( assigner, STATES.MOVE_BOOST );
        
        this.should_renew = false;
    }

    setRenew() {
        this.getMemory().queued = false;
        super.setRenew();
    }

    getAssigned() {
        let worker_memory = this.getMemory();

        if( !worker_memory.assigned_room ) {
            worker_memory.assigned_room = this.assigner.getAssigned( this.creep, this.assigner.types.ATTACK_PAIR_LEAD );
        }

        return worker_memory.assigned_room;
    }

    getHostileThings( room, creep ) {
        let flag = room.find( FIND_FLAGS )[ 0 ];
        if( flag ) {
            let walls = creep.room.lookForAt( LOOK_STRUCTURES, flag.pos.x, flag.pos.y );
            let wall = _.find( walls, ( wall ) => wall.structureType === STRUCTURE_WALL || wall.structureType === STRUCTURE_RAMPART );
            if( wall ) {
                return [ wall ];
            }
        }

        let hostile_things = []

        let blocked_by = false;

        let hostile_spawns = room
            .find( FIND_HOSTILE_SPAWNS, {
                filter: ( spawn ) => {
                    let path = creep.pos
                        .findPathTo( spawn.pos, {
                            ignoreDestructibleStructures: true,
                            costCallback: ( room_name, cost_matrix ) => {
                                if( !Game.rooms[ room_name ] ) return cost_matrix;
                    
                                let walls = Game.rooms[ room_name ]
                                    .find( FIND_STRUCTURES, {
                                        filter: ( structure ) => {
                                            return (
                                                structure.structureType === STRUCTURE_WALL ||
                                                structure.structureType === STRUCTURE_RAMPART
                                            );
                                        }
                                    } );
                                console.log( 'walls.length', walls.length );
                                if( walls.length === 0 ) return cost_matrix;
            
                
                                cost_matrix = cost_matrix.clone();
                                _
                                    .each( walls, ( wall ) => {
                                        Game.rooms[ room_name ].visual.circle( wall.pos.x, wall.pos.y, { color: 'red' } );
                                        cost_matrix.set( wall.pos.x, wall.pos.y, 20 );
                                    } );
                                return cost_matrix;
                    
                                return cost_matrix;
                            }
                        } );

                    let blocked = _
                        .find( path, ( step ) => {
                            let walls = creep.room.lookForAt( LOOK_STRUCTURES, step.x, step.y );

                            console.log( walls )
                            let wall = _.find( walls, ( wall ) => wall.structureType === STRUCTURE_WALL || wall.structureType === STRUCTURE_RAMPART );
                            if( wall ) {
                                blocked_by = wall;
                                return true;
                            }
                        } );

                    if( blocked ) {
                        return false;
                    }

                    return true;
                }
            } );

        if( hostile_spawns.length > 0 ) {
            return hostile_spawns;
        }

        if( blocked_by ) {
            console.log( 'BLOCKED', blocked_by );

            

            return [ blocked_by ];
        }

        let towers = room.find( FIND_HOSTILE_STRUCTURES, {
            filter: {
                structureType: STRUCTURE_TOWER
            }
        } );

        if( towers.length > 0 ) {
            return towers;
        }

        let hostile_creeps = room.find( FIND_HOSTILE_CREEPS );
        if( hostile_creeps.length > 0 ) {
            return hostile_creeps;
        }

        let hostile_structures = room.find( FIND_HOSTILE_STRUCTURES );
        let walls = room
            .find( FIND_STRUCTURES, {
                filter: {
                    structureType: STRUCTURE_WALL
                }
            } );
        
         hostile_things = hostile_things.concat( hostile_structures, walls );

         return hostile_things;
    }

    _getStates() {
        return {
            [ STATES.MOVE_BOOST ]: ( creep, state_memory, worker_memory ) => {
                let lab = null;
                if( worker_memory.lab_id ) {
                    lab = Game.getObjectById( worker_memory.lab_id );
                } else {
                    lab = creep.pos
                        .findClosestByPath( FIND_MY_STRUCTURES, {
                            filter: {
                                structureType: STRUCTURE_LAB
                            }
                        } );
                    worker_memory.lab_id = lab.id;
                }

                console.log( this.isNear( creep, lab.id ) );
                if( this.isNear( creep, lab.id ) ) return STATES.BOOST;

                this.moveTo( lab );
            },
            [ STATES.BOOST ]: ( creep, state_memory, worker_memory ) => {
                if( !worker_memory.queued ) {
                    BoostManager.addCreepToBoostQueue( creep );
                    worker_memory.queued = true;
                }

                let all_boosted = _.every( creep.body, ( bodypart ) => bodypart.boost );

                console.log( 'all_boosted' );
                if( all_boosted ) {
                    return STATES.CLEAR;
                }
            },
            [ STATES.MOVE_TO_FLAG ]: ( creep, state_memory, worker_memory ) => {
                return STATES.CLEAR;
            },
            [ STATES.MOVE_TO_ROOM ]: ( creep, state_memory, worker_memory ) => {
                let assigned = this.getAssigned();
                if( this.moveToRoom( assigned ) === move.ERR_IN_ROOM ) {
                    return STATES.CLEAR;
                }
            },
            [ STATES.CLEAR ]: ( creep, state_memory, worker_memory ) => {
                if( creep.room.name !== this.getAssigned() ) {
                    console.log( 'Moving back' );
                    return STATES.MOVE_TO_ROOM;
                }

                map.storeController( creep.room );

                if( creep.room.safeMode ) {
                    console.log( 'Done' );
                    map.invalidateRoom( creep.room.name );
                    this.setSuicide();
                    return;
                }

                let follower_id = this.assigner.getAssignedTo( this.assigner.types.ATTACK_PAIR_FOLLOW, creep.name );
                let follower = Game.getObjectById( follower_id );

                let targets = this.getHostileThings( creep.room, creep );

                let target = targets[ 0 ];
                console.log( 'target', target, JSON.stringify( target.pos ) );
                worker_memory.target_id = target.id;

                if( this.isNear( creep, follower_id ) ) {
                    this.moveTo( target );
                }

                if( creep.hits < creep.hitsMax ) {
                    creep.heal( creep );
                    let attack_response = creep.rangedAttack( target );
                    console.log( 'attack_response', constants.lookup( attack_response ) );
                } else {
                    if( this.isNear( creep, follower.id ) ) {
                        console.log( 'heal follower' );
                        creep.heal( follower );
                        let attack_response = creep.rangedAttack( target );
                        console.log( 'attack_response', constants.lookup( attack_response ) );
                    } else {
                        console.log( 'ranged heal follower' );
                        creep.rangedHeal( follower );
                    }
                }

                map.updateController( creep.room );
            }
        }
    }

    getBody( available_energy ) {
        let body = [
            TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, // 8

            RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK,

            HEAL, HEAL, HEAL, HEAL,

            MOVE, MOVE, // Tough Move
            MOVE, MOVE, // Attack Move
            MOVE, // Heal Move
        ];

        console.log( 'this.getEnergyOf( body )', this.getEnergyOf( body ) );
        if( available_energy >= this.getEnergyOf( body ) ) {
            return body;
        }

        return [];
    }
}

AttackPairLead.STATES = STATES;

module.exports = AttackPairLead;
