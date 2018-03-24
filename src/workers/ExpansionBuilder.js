const constants = require( '~/constants' );

const HarvestWorker = require( './HarvestWorker' );

class ExpansionBuilder extends HarvestWorker {
    constructor( assigner ) {
        super( assigner );
    }

    getAssigned() {
        let worker_memory = this.getMemory();
        if( !worker_memory.assigned_room ) {
            worker_memory.assigned_room = this.assigner.getAssigned( this.creep, this.assigner.types.EXPANSION_BUILDER );
        }
        return worker_memory.assigned_room;
    }

    getSourceRoomName( creep ) {
        return this.getAssigned();
    }

    getTargetRoomName( creep ) {
        return this.getAssigned();
    }

    getTarget( creep ) {
        console.log( 'getTarget' );

        const construction_sites = creep.room.find( FIND_MY_CONSTRUCTION_SITES );
        if( construction_sites.length > 0 ) {
            console.log( JSON.stringify( construction_sites ) );
            return creep.pos.findClosestByPath( construction_sites );
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

module.exports = ExpansionBuilder;
