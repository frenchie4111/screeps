const constants = require( '~/constants' );

const move = require( '~/lib/move' ),
    position = require( '~/lib/position' );

const ContainerHarvester = require( './ContainerHarvester' ),
    HarvestWorker = require( './HarvestWorker' );

class Hauler extends ContainerHarvester {
    constructor( assigner ) {
        super( assigner );
        this.default_state = HarvestWorker.STATES.MOVE_TO_TRANSFER;
        this.MAX_CARRY = 10;
    }

    getTarget( creep, worker_memory ) {
        return creep.room.storage;
    }

    getSource( creep, worker_memory ) {
        let tombstone = creep
            .pos
            .findClosestByPath( FIND_TOMBSTONES, {
                filter: ( tombstone ) => {
                    return tombstone.store[ RESOURCE_ENERGY ] > 0;
                }
            } );

        if( tombstone ) return tombstone;
        
        let energy = creep
            .pos
            .findClosestByPath( FIND_DROPPED_RESOURCES );

        if( energy ) return energy;

        let containers = creep.room.find( FIND_STRUCTURES, { filter: { structureType: STRUCTURE_CONTAINER } } );
        containers = _.sortBy( containers, container => container.store.energy );
        containers.reverse();
        console.log( 'Hauler getSource', JSON.stringify( containers ) );
        if( containers.length === 0 ) return;
        return containers[ 0 ];
    }

    doHarvest( creep, source ) {
        let status = super.doHarvest( creep, source );
        this.setState( HarvestWorker.STATES.MOVE_TO_TRANSFER );
        this.getMemory().source_id = null;
        return status;
    }

    getBody( available_energy ) {
        let per_parts = constants.BODYPART_COST[ constants.MOVE ] + constants.BODYPART_COST[ constants.CARRY ] + constants.BODYPART_COST[ constants.CARRY ];
        let parts = [];

        for( let i = 0; i < this.MAX_CARRY && available_energy > per_parts; i += 2 ) {
            parts = parts.concat( [ constants.MOVE, constants.CARRY, constants.CARRY ] );
            available_energy -= per_parts;
        }

        return parts;
    }
}

module.exports = Hauler;
