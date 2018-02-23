const lodash = require( 'lodash' );

const constants = require( '~/constants' );

const HarvestWorker = require( './HarvestWorker' );

class ContainerHarvester extends HarvestWorker {
    constructor( assigner, can_harvest=true ) {
        super( assigner );
        this.can_harvest = can_harvest;
    }

    shouldStopHarvesting( creep, container ) {
        if( container.structureType === constants.STRUCTURE_CONTAINER ) {
            return container.store[ constants.RESOURCE_ENERGY ] <= 50;
        }
        return super.shouldStopHarvesting( creep, container );
    }

    getSource( creep ) {
        let container = creep
            .pos
            .findClosestByPath( constants.FIND_STRUCTURES, {
                filter: ( structure ) => {
                    return (
                        structure.structureType === constants.STRUCTURE_CONTAINER &&
                        structure.store[ constants.RESOURCE_ENERGY ] > 50
                    );
                }
            } );

        if( !container && this.can_harvest ) {
            return super.getSource( creep );
        }

        return container;
    }
    
    doHarvest( creep, container ) {
        if( container.structureType === constants.STRUCTURE_CONTAINER ) {
            return creep.withdraw( container, constants.RESOURCE_ENERGY );
        }
        return creep.harvest( container );
    }
}

module.exports = ContainerHarvester;
