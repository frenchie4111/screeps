const constants = require( '~/constants' ),
    move = require( '~/lib/move' ),
    position = require( '~/lib/position' ),
    map = require( '~/lib/map' );

const RenewWorker = require( './RenewWorker' );

let STATES = {
    MOVE_TO_ROOM: 'MOVE_TO_ROOM',
    CLEAR: 'CLEAR'
};

class Clearer extends RenewWorker {
    constructor( assigner ) {
        super( assigner, STATES.MOVE_TO_ROOM );
        this.MAX_ATTACK = 20;
    }

    getAssigned() {
        let worker_memory = this.getMemory();
        if( !worker_memory.assigned_room ) {
            worker_memory.assigned_room = this.assigner.getAssigned( this.creep, this.assigner.types.CLEARER );
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

                                if( walls.length === 0 ) return cost_matrix;

                                cost_matrix = cost_matrix.clone();
                                _
                                    .each( walls, ( wall ) => {
                                        let health_ratio = ( wall.hits / wall.hitsMax );
                                        cost_matrix.set( wall.pos.x, wall.pos.y, Math.ceil( 20 + ( 150 * health_ratio ) ) );
                                        Game.rooms[ room_name ].visual.circle( wall.pos.x, wall.pos.y, { color: 'red' } );
                                        Game.rooms[ room_name ].visual.text( '' + Math.ceil( 20 + ( 150 * health_ratio ) ), wall.pos.x, wall.pos.y, { color: 'red' } );
                                    } );

                                return cost_matrix;
                            }
                        } );

                    let blocked = _
                        .find( path, ( step ) => {
                            console.log( 'step', spawn.pos, JSON.stringify( step ) );
                            if( position.equal( spawn.pos, step, true ) ) {
                                return false;
                            }

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
            let things_at_spawn = creep.room.lookForAt( LOOK_STRUCTURES, hostile_spawns[ 0 ].pos.x, hostile_spawns[ 0 ].pos.y );
            let rampart = _.find( things_at_spawn, ( thing ) => thing.structureType === STRUCTURE_RAMPART );

            console.log( 'RAPART AT SPAWN', rampart );

            if( rampart && rampart.hits > 2000 ) {
                console.log( 'Getting extensions first' );

                let extensions = room
                    .find( FIND_HOSTILE_STRUCTURES, {
                        filter: {
                            structureType: STRUCTURE_EXTENSION
                        }
                    } );

                if( extensions.length > 0 ) {
                    return extensions;
                }

                let hostile_creeps = room.find( FIND_HOSTILE_CREEPS );
                if( hostile_creeps.length > 0 ) {
                    return hostile_creeps;
                }
            }

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

        if( !this.getMemory().invalidated_map ) {
            this.setDontRenew( creep, true );
            map.invalidateRoom( room.name );
            this.getMemory().invalidated_map = true;
        }

        let ignore_structures = [
            STRUCTURE_CONTROLLER,
            STRUCTURE_RAMPART
        ];

        let hostile_structures = room
            .find( FIND_HOSTILE_STRUCTURES, {
                filter: ( structure ) => {
                    return !ignore_structures.includes( structure.structureType );
                }
            } );

         return hostile_structures;
    }

    _getStates() {
        return {
            [ STATES.MOVE_TO_ROOM ]: ( creep, state_memory, worker_memory ) => {
                let assigned = this.getAssigned();
                if( this.moveToRoom( assigned ) === move.ERR_IN_ROOM ) {
                    return STATES.CLEAR;
                }
            },
            [ STATES.CLEAR ]: ( creep, state_memory, worker_memory ) => {
                if( creep.room.name !== this.getAssigned() ) {
                    return STATES.MOVE_TO_ROOM;
                }

                map.storeController( creep.room );

                let target_enemy = Game.getObjectById( worker_memory.target_id );
                if( !target_enemy ) {
                    let enemies = this.getHostileThings( creep.room, creep );

                    if( enemies.length === 0 ) {
                        console.log( 'Done' );

                        map.invalidateRoom( creep.room.name );
                        creep.room.memory.type = 'cleared';
                        this.assigner.unassign( this.assigner.types.CLEARER, creep.id, this.getAssigned() );
                        this.setSuicide();
                        return;
                    }

                    let target = creep.pos.findClosestByPath( enemies );

                    worker_memory.target_id = target.id;
                    target_enemy = target;
                }

                if( position.inRoom( target_enemy.pos ) && creep.pos.getRangeTo( target_enemy.pos ) > 1 ) {
                    creep.moveTo( target_enemy );
                }
                if( creep.getActiveBodyparts( ATTACK ) ) {
                    let response = creep.attack( target_enemy );
                } else {
                    let response = creep.dismantle( target_enemy );
                }
            }
        }
    }

    getBody( available_energy ) {
        let parts = [ MOVE, ATTACK ];
        let body = [];

        for( let i = 0; i < this.MAX_ATTACK && ( this.getEnergyOf( body ) + this.getEnergyOf( parts ) ) < available_energy; i++ ) {
            body = body.concat( parts );
        }

        return body;
    }
}

Clearer.STATES = STATES;

module.exports = Clearer;
