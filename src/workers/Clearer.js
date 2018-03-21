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
        this.MAX_ATTACK = 10;
    }

    getAssigned() {
        let worker_memory = this.getMemory();
        if( !worker_memory.assigned_room ) {
            worker_memory.assigned_room = this.assigner.getAssigned( this.creep, this.assigner.types.CLEARER );
        }
        return worker_memory.assigned_room;
    }

    getHostileThings( room ) {
        let hostile_things = []

        let hostile_spawns = room.find( FIND_HOSTILE_SPAWNS );
        if( hostile_spawns.length > 0 ) {
            return hostile_spawns;
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
                    let enemies = this.getHostileThings( creep.room );

                    if( enemies.length === 0 ) {
                        console.log( 'Done' );
                        map.invalidateRoom( creep.room.name );
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
