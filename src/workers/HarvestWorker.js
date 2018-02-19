const lodash = require( 'lodash' );

const constants = require( '~/constants' );

const StateWorker = require( './StateWorker' );

let STATES = {
    MOVE_TO_HARVEST: 'MOVE_TO_HARVEST',
    HARVESTING: 'HARVESTING',
    MOVE_TO_TRANSFER: 'MOVE_TO_TRANSFER',
    TRANSFERRING: 'TRANSFERRING'
};

class HarvestWorker extends StateWorker {
    constructor( source, target ) {
        super( STATES.MOVE_TO_HARVEST );
        this.source = source;
        this.target = target;
    }

    isNearSource() {
        return this.creep.pos.isNearTo( this.source.pos );
    }
    
    isNearTarget() {
        return this.creep.pos.isNearTo( this.target.pos );
    }

    getCurrentCarry() {
        return lodash.sum( lodash.values( this.creep.carry ) );
    }

    isFull() {
        return this.getCurrentCarry() == this.creep.carryCapacity;
    }

    doTransfer() {
        return this.creep.transfer( this.target, RESOURCE_ENERGY );
    }

    _getStates() {
        return {
            [ STATES.MOVE_TO_HARVEST ]: () => {
                if( this.isNearSource() ) return STATES.HARVESTING;
                if( this.isFull() ) return STATES.MOVE_TO_TRANSFER;

                this.moveTo( this.source );
            },
            [ STATES.HARVESTING ]: () => {
                if( !this.isNearSource() ) return STATES.MOVE_TO_HARVEST;
                if( this.isFull() ) return STATES.MOVE_TO_TRANSFER;

                this.log( this.creep.harvest( this.source ) );
            },
            [ STATES.MOVE_TO_TRANSFER ]: () => {
                const transfer_results = this.doTransfer();

                if( this.getCurrentCarry() === 0 ) return STATES.MOVE_TO_HARVEST;
                switch( transfer_results ) {
                    case constants.OK:
                        return STATES.TRANSFERRING;
                        break;
                }

                this.moveTo( this.target );
            },
            [ STATES.TRANSFERRING ]: () => {
                if( this.getCurrentCarry() === 0 ) return STATES.MOVE_TO_HARVEST;

                const transfer_results = this.doTransfer();

                if( transfer_results !== 0 ) return STATES.MOVE_TO_HARVEST;
            }
        }
    }
}

module.exports = HarvestWorker;
