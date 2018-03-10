const constants = require( '~/constants' );

const ContainerHarvester = require( './ContainerHarvester' );

class ContainerExtension extends ContainerHarvester {
    constructor( assigner ) {
        super( assigner );
        this.MAX_MOVE = 10;
    }

    getSource( creep ) {
        let container = creep
            .pos
            .findClosestByPath( constants.FIND_STRUCTURES, {
                filter: ( structure ) => {
                    return (
                        structure.structureType === constants.STRUCTURE_CONTAINER &&
                        structure.store[ constants.RESOURCE_ENERGY ] > 1500
                    );
                }
            } );

        if( container ) {
            return container;
        }

        if( creep.room.storage ) {
            if( creep.room.storage.store[ constants.RESOURCE_ENERGY ] > 50 ) {
                return creep.room.storage;
            }
        }

        return super.getSource( creep );
    }

    getTarget( creep ) {
        let capacity_structure;
        // Tower first
        capacity_structure = creep.pos
            .findClosestByPath( FIND_MY_STRUCTURES, {
                filter: ( structure ) => {
                    return (
                        structure.structureType === constants.STRUCTURE_TOWER &&
                        ( structure.energy / structure.energyCapacity ) < 0.8
                    );
                }
            } );
        
        if( capacity_structure ) {
            return capacity_structure;
        }

        capacity_structure = creep.pos
            .findClosestByPath( FIND_MY_STRUCTURES, {
                filter: ( structure ) => {
                    return (
                        structure.structureType !== constants.STRUCTURE_TOWER &&
                        structure.structureType !== constants.STRUCTURE_SPAWN &&
                        structure.structureType !== constants.STRUCTURE_LINK &&
                        ( 'energyCapacity' in structure ) &&
                        structure.energy < structure.energyCapacity
                    );
                }
            } );

        if( capacity_structure ) {
            return capacity_structure;
        }

        capacity_structure = creep.pos
            .findClosestByPath( FIND_MY_STRUCTURES, {
                filter: ( structure ) => {
                    return (
                        structure.structureType === constants.STRUCTURE_SPAWN &&
                        ( 'energyCapacity' in structure ) &&
                        structure.energy < structure.energyCapacity
                    );
                }
            } );

        if( capacity_structure ) {
            return capacity_structure;
        }

        if( creep.room.storage ) {
            return creep.room.storage
        }
    }

    getBody( available_energy ) {
        let per_parts = ( constants.BODYPART_COST[ constants.CARRY ] * 2 ) + constants.BODYPART_COST[ constants.MOVE ];
        let parts = [];

        let count = 0;
        for( let i = 0; i < this.MAX_MOVE && available_energy > per_parts; i++ ) {
            parts = parts.concat( [ constants.MOVE, constants.CARRY, constants.CARRY ] );
            available_energy -= per_parts;
        }

        return parts;
    }
}

module.exports = ContainerExtension;
