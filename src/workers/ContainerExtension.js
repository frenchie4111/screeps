const constants = require( '~/constants' );

const ContainerHarvester = require( './ContainerHarvester' );

class ContainerExtension extends ContainerHarvester {
    constructor( assigner ) {
        super( assigner );
        this.MAX_MOVE = 10;
        this.match_energy = false;
        this.use_storage = false;
    }

    getSource( creep ) {
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
        
        let container = creep
            .pos
            .findClosestByPath( constants.FIND_STRUCTURES, {
                filter: ( structure ) => {
                    return (
                        structure.structureType === constants.STRUCTURE_CONTAINER &&
                        structure.store[ constants.RESOURCE_ENERGY ] > 900
                    );
                }
            } );

        if( container ) {
            return container;
        }

        let target = this.getTarget( creep );

        if( creep.room.storage && target.structureType !== STRUCTURE_STORAGE ) {
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
                        structure.structureType !== constants.STRUCTURE_TOWER &&
                        structure.structureType !== constants.STRUCTURE_SPAWN &&
                        structure.structureType !== constants.STRUCTURE_LINK &&
                        structure.structureType !== constants.STRUCTURE_LAB &&
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
