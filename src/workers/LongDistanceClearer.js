const constants = require( '~/constants' ),
    move = require( '~/lib/move' ),
    position = require( '~/lib/position' );

const RenewWorker = require( './RenewWorker' );

let STATES = {
    MOVE_TO_ROOM: 'MOVE_TO_ROOM',
    CLEAR: 'CLEAR'
};

class LongDistanceClearer extends RenewWorker {
    constructor( assigner ) {
        super( assigner, STATES.MOVE_TO_ROOM );
        this.MAX_RANGED_ATTACK = 6;
    }

    getAssigned() {
        let worker_memory = this.getMemory();
        if( !worker_memory.assigned_room ) {
            worker_memory.assigned_room = this.assigner.getAssigned( this.creep, this.assigner.types.LONG_DISTANCE_ROOM_CLEARER );
        }
        return worker_memory.assigned_room;
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

                let target_enemy = Game.getObjectById( worker_memory.target_id );
                if( !target_enemy ) {
                    let enemies = creep.room.find( FIND_HOSTILE_CREEPS );

                    if( enemies.length === 0 ) {
                        console.log( 'Done' );
                        this.setSuicide();
                        Memory.rooms[ this.getAssigned() ].dangerous_until = null;
                        return;
                    }

                    worker_memory.target_id = enemies[ 0 ].id;
                    target_enemy = enemies[ 0 ];
                }

                if( position.inRoom( target_enemy.pos ) ) {
                    creep.moveTo( target_enemy );
                }
                creep.rangedAttack( target_enemy );
            }
        }
    }

    getBody( available_energy ) {
        let parts = [ MOVE, RANGED_ATTACK ];
        let body = [ TOUGH, TOUGH, TOUGH, TOUGH ];

        for( let i = 0; i < this.MAX_RANGED_ATTACK && this.getEnergyOf( body ) < available_energy; i++ ) {
            body = body.concat( parts );
        }

        return body;
    }
}

LongDistanceClearer.STATES = STATES;

module.exports = LongDistanceClearer;
