const lodash = require( 'lodash' );

const constants = require( '~/constants' );

const HarvestWorker = require( './HarvestWorker' );

class RepairWorker extends HarvestWorker {
    _needsRepair( target ) {
        let ratio =  ( target.hits / target.hitsMax );
        
        return ratio < 0.9;
    }
    
    getTarget( creep ) {
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
        return creep.repair( target );
    }

    shouldStopTargetting( creep, target ) {
        if( 'ticksToDecay' in target ) {
            return !this._needsRepair( target );
        }
        return false;
    }
}

module.exports = RepairWorker;
