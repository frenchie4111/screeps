const constants = require( '~/constants' ),
    move = require( '~/lib/move' ),
    position = require( '~/lib/position' );

const RenewWorker = require( './RenewWorker' );

let STATES = {
    MOVE_TO_POSITION: 'MOVE_TO_POSITION',
    MANAGE: 'MANAGE'
};

let position_direction = [  0, +1 ];

class BaseLinkManager extends RenewWorker {
    constructor( assigner ) {
        super( assigner, STATES.MOVE_TO_POSITION );
        this.CARRY_PARTS = 16;
    }

    getBody( available_energy ) {
        let body = [ MOVE ];

        for( let i = 0; i < this.CARRY_PARTS; i++ ) {
            body.push( CARRY );
        }

        if( available_energy < this.getEnergyOf( body ) ) {
            return [];
        }

        return body;
    }

    _getStates() {
        return {
            [ STATES.MOVE_TO_POSITION ]: ( creep, state_memory, worker_memory ) => {
                let target_position = position.directionToPosition( this.spawn.pos, position_direction );

                if( position.equal( creep.pos, target_position ) ) {
                    return STATES.MANAGE;
                }

                return this.moveTo( target_position );
            },
            [ STATES.MANAGE ]: ( creep, state_memory, worker_memory ) => {
                if( !this.room.memory.links.base ) {
                    return;
                }

                let link = Game.getObjectById( this.room.memory.links.base )

                if( link.energy > 0 ) {
                    creep.withdraw( link, RESOURCE_ENERGY );
                }

                if( creep.carry[ RESOURCE_ENERGY ] > 0 ) {
                    creep.transfer( this.room.storage, RESOURCE_ENERGY );
                }

                return;
            }
        }
    }
}

BaseLinkManager.STATES = STATES;

module.exports = BaseLinkManager;
