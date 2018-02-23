const lodash = require( 'lodash' );

const constants = require( '~/constants' );

const ContainerHarvester = require( './ContainerHarvester' );

class ContainerBuilder extends ContainerHarvester {
    getTarget( creep ) {
        console.log( 'getTarget' );

        const construction_sites = creep.room.find( FIND_MY_CONSTRUCTION_SITES );
        if( construction_sites.length > 0 ) {
            return construction_sites[ 0 ];
        }
        // No more sites, revert to HarvestWorker
        let super_target = super.getTarget( creep );
        console.log( 'super_target', super_target );

        return super_target;
    }

    doTransfer( creep, target ) {
        let build_results = creep.build( target );
        if( build_results === constants.ERR_INVALID_TARGET ) {
            return creep.transfer( target, constants.RESOURCE_ENERGY );
        }
        return build_results;
    }
}

module.exports = ContainerBuilder;
