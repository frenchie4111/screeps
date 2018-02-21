const lodash = require( 'lodash' );

const constants = require( '~/constants' );

const RenewWorker = require( './RenewWorker' );

let STATES = {
    MOVE_TO_HARVEST: 'MOVE_TO_HARVEST',
    HARVESTING: 'HARVESTING',
    MOVE_TO_TRANSFER: 'MOVE_TO_TRANSFER',
    TRANSFERRING: 'TRANSFERRING'
};

class HarvestWorker extends RenewWorker {
    constructor() {
        super( STATES.MOVE_TO_HARVEST );
    }

    getSource( creep ) {
        let sources = creep.room.find( FIND_SOURCES );
        let source = creep.pos.findClosestByPath( sources );

        if( !source ) {
            console.log( creep.id, ' couldnt find available source' );
            return null;
        }

        return source;
    }

    getTarget( creep ) {
        // HACK allows us to have 0 upgraders
        if( creep.room.controller.ticksToDowngrade < 1000 ) {
            return creep.room.controller;
        }

        let capacity_structures = creep.room
            .find( FIND_MY_STRUCTURES, {
                filter: ( structure ) => {
                    return ( 'energyCapacity' in structure ) &&
                        structure.energy < structure.energyCapacity;
                }
            } );
    
        if( capacity_structures.length === 0 ) {
            return creep.room.controller;
        }
    
        return capacity_structures[ 0 ];
    }

    getCurrentCarry() {
        return lodash.sum( lodash.values( this.creep.carry ) );
    }

    isFull() {
        return this.getCurrentCarry() == this.creep.carryCapacity;
    }

    doTransfer( creep, target ) {
        return creep.transfer( target, RESOURCE_ENERGY );
    }

    _getStates() {
        return {
            [ STATES.MOVE_TO_HARVEST ]: ( creep, state_memory, worker_memory ) => {
                if( !worker_memory.source_id ) {
                    worker_memory.source_id = this.getSource( creep ).id;
                }
                worker_memory.target_id = null;

                if( this.isNear( creep, worker_memory.source_id ) ) return STATES.HARVESTING;
                if( this.isFull() ) return STATES.MOVE_TO_TRANSFER;

                this.moveTo( Game.getObjectById( worker_memory.source_id ) );
            },
            [ STATES.HARVESTING ]: ( creep, state_memory, worker_memory ) => {
                if( !worker_memory.source_id ) return STATES.MOVE_TO_HARVEST;
                if( !this.isNear( creep, worker_memory.source_id ) ) return STATES.MOVE_TO_HARVEST;
                if( this.isFull() ) return STATES.MOVE_TO_TRANSFER;

                creep.harvest( Game.getObjectById( worker_memory.source_id ) );
            },
            [ STATES.MOVE_TO_TRANSFER ]: ( creep, state_memory, worker_memory ) => {
                if( !worker_memory.target_id ) {
                    worker_memory.target_id = this.getTarget( creep ).id;
                }

                const transfer_results = this.doTransfer( creep, Game.getObjectById( worker_memory.target_id ) );

                if( this.getCurrentCarry() === 0 ) return STATES.MOVE_TO_HARVEST;

                switch( transfer_results ) {
                    case constants.OK:
                        return STATES.TRANSFERRING;
                        break;
                    case constants.ERR_FULL: // HACK: To make sure we don't get stuck doing nothing
                        creep.drop( constants.RESOURCE_ENERGY );
                        return STATES.MOVE_TO_HARVEST;
                        break;
                    case constants.ERR_NOT_IN_RANGE:
                        this.moveTo( Game.getObjectById( worker_memory.target_id ) );
                        break;
                    case constants.ERR_INVALID_TARGET:
                        console.log( 'Tried to transfer to invalid target' );
                        worker_memory.target_id = null;
                        break;
                    default:
                        console.log( 'Unknown case', transfer_results, constants.lookup( transfer_results ) );
                }
            },
            [ STATES.TRANSFERRING ]: ( creep, state_memory, worker_memory ) => {
                if( !worker_memory.target_id ) return STATES.MOVE_TO_TRANSFER;
                if( this.getCurrentCarry() === 0 ) return STATES.MOVE_TO_HARVEST;

                const transfer_results = this.doTransfer( creep, Game.getObjectById( worker_memory.target_id ) );

                if( transfer_results !== 0 ) return STATES.MOVE_TO_HARVEST;
            }
        }
    }
}

module.exports = HarvestWorker;
