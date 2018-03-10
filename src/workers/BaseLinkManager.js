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
                    let creep_available_capacity = creep.carryCapacity - creep.carry[ RESOURCE_ENERGY ];
                    if( creep_available_capacity >= link.energy ) {
                        creep.withdraw( link, RESOURCE_ENERGY );
                    } else {
                        creep.transfer( this.room.storage, RESOURCE_ENERGY );
                    }
                } else if( this.spawn.energy < 150 ) {
                    if( creep.carry[ RESOURCE_ENERGY ] >= 300 ) {
                        creep.transfer( this.spawn, RESOURCE_ENERGY );
                    } else {
                        creep.withdraw( this.room.storage, RESOURCE_ENERGY, 300 );
                    }
                } else if( this.room.terminal && this.room.terminal.store[ RESOURCE_ENERGY ] < 100000 && this.room.storage.store[ RESOURCE_ENERGY ] > 700000 ) {
                    if( creep.carry[ RESOURCE_ENERGY ] === creep.carryCapacity ) {
                        creep.transfer( this.room.terminal, RESOURCE_ENERGY );
                    } else {
                        creep.withdraw( this.room.storage, RESOURCE_ENERGY );
                    }
                } else if( creep.carry[ RESOURCE_ENERGY ] > 0 ) {
                    creep.transfer( this.room.storage, RESOURCE_ENERGY, creep.carry[ RESOURCE_ENERGY ] );
                }

                return;
            }
        }
    }
}

BaseLinkManager.STATES = STATES;

module.exports = BaseLinkManager;
