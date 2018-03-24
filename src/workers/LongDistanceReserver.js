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
        if( this.assigner ) this.assigner_type = this.assigner.types.LONG_DISTANCE_RESERVER;
    }

    getBody( energy ) {
        let body = [ constants.MOVE, constants.CLAIM, constants.MOVE, constants.CLAIM ];

        if( energy > this.getEnergyOf( body ) ) {
            return body;
        }

        return [];
    }

    doAttack( creep, target ) {
        
    }

    doReserve( creep, target ) {
        if( target.owner ) {
            return creep.attackController( target );
        } else {
            return creep.reserveController( target );
        }
        
    }

    _getStates() {
        return {
            [ STATES.GO_TO_RESERVE_ROOM ]: ( creep, state_memory, worker_memory ) => {
                if( !worker_memory.reserve_room_name ) {
                    worker_memory.reserve_room_name = this.assigner.getAssigned( creep, this.assigner_type );
                }
                creep.memory.ignore_death = true;

                if( this.moveToRoom( worker_memory.reserve_room_name ) === move.ERR_IN_ROOM ) {
                    return STATES.GO_TO_CONTROLLER;
                }
            },
            [ STATES.GO_TO_CONTROLLER ]: ( creep, state_memory, worker_memory ) => {
                if( creep.room.name !== worker_memory.reserve_room_name ) {
                    console.log( 'Not in controller room', creep.room.name, worker_memory.reserve_room_name );
                    return STATES.GO_TO_RESERVE_ROOM;
                }

                if( this.doReserve( creep, creep.room.controller ) === OK ) {
                    return STATES.RESERVE;
                }

                console.log( 'Moving to', creep.room.controller.pos );

                this.moveTo( creep.room.controller.pos );
            },
            [ STATES.RESERVE ]: ( creep, state_memory, worker_memory ) => {
                let reserve_response = null;

                reserve_response = this.doReserve( creep, creep.room.controller );

                if( !creep.room.controller.sign || creep.room.controller.sign.text !== this.controller_message ) {
                    console.log( 'Signing', creep.room.controller.sign, this.controller_message );
                    reserve_response = creep.signController( creep.room.controller, this.controller_message );
                }

                if( reserve_response !== OK ) {
                    console.log( 'INVALID RESERVE RESPONSE', reserve_response, constants.lookup( reserve_response ) );
                }

                Memory.rooms[ creep.room.name ].resevered_until = Game.time + ( ( creep.room.controller.reservation ) ? creep.room.controller.reservation.ticksToEnd : 0 );
            }
        }
    }
}

module.exports = LongDistanceReserver;
