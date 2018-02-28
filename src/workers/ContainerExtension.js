const constants = require( '~/constants' );

const ContainerHarvester = require( './ContainerHarvester' );

class ContainerExtension extends ContainerHarvester {
    constructor( assigner ) {
        super( assigner );
    }

    getTarget( creep ) {
        let capacity_structure = creep.pos
            .findClosestByPath( FIND_MY_STRUCTURES, {
                filter: ( structure ) => {
                    return ( 'energyCapacity' in structure ) &&
                        structure.energy < structure.energyCapacity;
                }
            } );
        
        if( capacity_structure ) {
            return capacity_structure;
        }

        // Tower second
        capacity_structure = creep.pos
            .findClosestByPath( FIND_MY_STRUCTURES, {
                filter: ( structure ) => {
                    return (
                        structure.structureType === constants.STRUCTURE_TOWER &&
                        ( structure.energy / structure.energyCapacity ) < 0.5
                    );
                }
            } );

        if( capacity_structure ) {
            return capacity_structure;
        }
    }

    getBody( available_energy ) {
        let per_parts = ( constants.BODYPART_COST[ constants.MOVE ] * 2 ) + constants.BODYPART_COST[ constants.CARRY ];
        let parts = [];

        while( available_energy > per_parts ) {
            parts = parts.concat( [ constants.MOVE, constants.CARRY, constants.CARRY ] );
            available_energy -= per_parts;
        }

        return parts;
    }
}

module.exports = ContainerExtension;
