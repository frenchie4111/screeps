const constants = require( '~/constants' ),
    move = require( '~/lib/move' ),
    position = require( '~/lib/position' ),
    map = require( '~/lib/map' );

const RenewWorker = require( './RenewWorker' );

let STATES = {
    DO: 'DO'
};

class Drainer extends RenewWorker {
    constructor( assigner ) {
        super( assigner, STATES.DO );
    }

    getAssigned() {
        let worker_memory = this.getMemory();

        if( !worker_memory.assigned_room ) {
            worker_memory.assigned_room = this.assigner.getAssigned( this.creep, this.assigner.types.DRAINER );
        }

        return worker_memory.assigned_room;
    }

    _getStates() {
        return {
            [ STATES.DO ]: ( creep, state_memory, worker_memory ) => {
                let assigned = this.getAssigned();

                creep.memory.dont_heal = true;
                creep.notifyWhenAttacked( false );

                console.log( 'run room', this.spawn.room.name );

                if( creep.hits === creep.hitsMax ) {
                    console.log( 'move to bad room' );
                    this.moveToRoom( assigned )
                } else if( creep.room.name !== this.spawn.room.name || !position.inRoom( creep.pos ) ) {
                    console.log( 'move to safe room' );
                    this.moveToRoom( this.spawn.room.name );
                }
                creep.heal( creep );
            }
        }
    }

    getBody( available_energy ) {
        let parts = [ MOVE, ATTACK ];
        let body = [ 
            TOUGH, TOUGH, TOUGH, TOUGH, TOUGH,
            HEAL, HEAL, HEAL, HEAL, HEAL,
            MOVE, MOVE, MOVE, MOVE, MOVE,
            MOVE, MOVE, MOVE, MOVE, MOVE
        ];

        console.log( available_energy, this.getEnergyOf( body ) );

        if( available_energy >= this.getEnergyOf( body ) ) {
            return body;
        }

        return [];
    }
}

Drainer.STATES = STATES;

module.exports = Drainer;
