const constants = require( '~/constants' );

const HarvestWorker = require( './HarvestWorker' );

class ContainerHarvester extends HarvestWorker {
    constructor( assigner ) {
        super( assigner );
        this.match_energy = true;
        this.use_storage = true;
    }

    shouldStopHarvesting( creep, container ) {
        if( container.structureType === constants.STRUCTURE_CONTAINER || container.structureType === constants.STRUCTURE_STORAGE ) {
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
                        structure.room.name === creep.room.name &&
                        structure.structureType === constants.STRUCTURE_CONTAINER &&
                        structure.store[ constants.RESOURCE_ENERGY ] > ( this.match_energy ? creep.carryCapacity : 50 )
                    );
                }
            } );

        if( !container && this.use_storage && creep.room.storage && creep.room.storage.store[ RESOURCE_ENERGY ] > 50 ) {
            return creep.room.storage;
        }

        return container;
    }

    doHarvest( creep, container ) {
        if( container.structureType === constants.STRUCTURE_CONTAINER ||
            container.structureType === constants.STRUCTURE_STORAGE || 
            container.structureType === constants.STRUCTURE_LINK || 
            container.deathTime ) {
            return creep.withdraw( container, constants.RESOURCE_ENERGY );
        }

        if( container.energy && container.resourceType === RESOURCE_ENERGY ) {
            return creep.pickup( container );
        }

        return creep.harvest( container );
    }
}

module.exports = ContainerHarvester;
