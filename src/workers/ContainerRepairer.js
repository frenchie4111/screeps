const lodash = require( 'lodash' );

const constants = require( '~/constants' );

const ContainerHarvester = require( './ContainerHarvester' );

class ContainerRepairer extends ContainerHarvester {
    _needsRepair( target ) {
        let ratio =  ( target.hits / target.hitsMax );
        
        return ratio < 0.9;
    }
    
    getTarget( creep ) {
        // Make sure the controller doesn't die
        if( creep.room.controller.ticksToDowngrade < 1000 ) {
            return creep.room.controller;
        }

        let decaying_structures = creep.room
            .find( FIND_STRUCTURES, {
                filter: ( structure ) => {
                    return ( 'ticksToDecay' in structure ) && this._needsRepair( structure );
                }
            } );

        if( decaying_structures.length === 0 ) {
            return super.getTarget( creep );
        }

        decaying_structures = _.sortBy( decaying_structures, ( structure ) => ( structure.hits / structure.hitsMax ) );

        return decaying_structures[ 0 ];
    }
    
    doTransfer( creep, target ) {
        let repair_results = creep.repair( target );
        if( repair_results === constants.ERR_INVALID_TARGET ) {
            return creep.transfer( target, constants.RESOURCE_ENERGY );
        }
        return repair_results;
    }

    shouldStopTargetting( creep, target ) {
        if( 'ticksToDecay' in target ) {
            return !this._needsRepair( target );
        }
        return false;
    }
}

module.exports = ContainerRepairer;
