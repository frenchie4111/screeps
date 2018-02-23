const lodash = require( 'lodash' );

const constants = require( '~/constants' );

const HarvestWorker = require( './HarvestWorker' );

class ContainerHarvester extends HarvestWorker {
    getTarget( creep ) {
        return creep.room.controller;
    }

    shouldStopHarvesting( creep, container ) {
        console.log( container );
        return container.store[ constants.RESOURCE_ENERGY ] === 0;
    }

    getSource( creep ) {
        let container = creep
            .pos
            .findClosestByPath( constants.FIND_STRUCTURES, {
                filter: ( structure ) => {
                    return (
                        structure.structureType === constants.STRUCTURE_CONTAINER &&
                        structure.store[ constants.RESOURCE_ENERGY ] > 0
                    );
                }
            } );

        return container;
    }
    
    doHarvest( creep, container ) {
        return creep.withdraw( container, constants.RESOURCE_ENERGY );
    }
}

module.exports = ContainerHarvester;
