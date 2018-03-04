const constants = require( '~/constants' ),
    move = require( '~/lib/move' );

const StateWorker = require( './StateWorker' );

const STATES = {
    GO_TO_RESERVE_ROOM: 'GO_TO_RESERVE_ROOM',
    GO_TO_CONTROLLER: 'GO_TO_CONTROLLER',
    RESERVE: 'RESERVE'
};

class LongDistanceReserver extends StateWorker {
    constructor( assigner ) {
        super( assigner );
        this.default_state = STATES.GO_TO_RESERVE_ROOM;
        this.controller_message = 'Reserved for long distance mining';
    }

    getBody( energy ) {
        let body = [ constants.MOVE, constants.CLAIM, constants.MOVE, constants.CLAIM ];

        if( energy > this.getEnergyOf( body ) ) {
            return body;
        }

        return [];
    }

    _getStates() {
        return {
            [ STATES.GO_TO_RESERVE_ROOM ]: ( creep, state_memory, worker_memory ) => {
                if( !worker_memory.reserve_room_name ) {
                    worker_memory.reserve_room_name = this.assigner.getAssigned( creep, this.assigner.types.LONG_DISTANCE_RESERVER );
                }

                if( this.moveToRoom( worker_memory.reserve_room_name ) === move.ERR_IN_ROOM ) {
                    return STATES.GO_TO_CONTROLLER;
                }
            },
            [ STATES.GO_TO_CONTROLLER ]: ( creep, state_memory, worker_memory ) => {
                if( creep.reserveController( creep.room.controller ) === OK ) {
                    return STATES.RESERVE;
                }

                this.moveTo( creep.room.controller.pos );
            },
            [ STATES.RESERVE ]: ( creep, state_memory, worker_memory ) => {
                let reserve_response = null;
                if( !creep.room.controller.sign || creep.room.controller.sign.text !== this.controller_message ) {
                    console.log( 'Signing', creep.room.controller.sign, this.controller_message );
                    reserve_response = creep.signController( creep.room.controller, this.controller_message );
                } else {
                    reserve_response = creep.reserveController( creep.room.controller );
                }

                if( reserve_response !== OK ) {
                    console.log( 'INVALID RESERVE RESPONSE', reserve_response );
                }

                Memory.rooms[ creep.room.name ].resevered_until = Game.time + ( ( creep.room.controller.reservation ) ? creep.room.controller.reservation.ticksToEnd : 0 );
            }
        }
    }
}

module.exports = LongDistanceReserver;