const constants = require( '~/constants' );

class ConstructionPlanner {
    constructor( structure_type ) {
        this.structure_type = structure_type;
    }

    _getNewAllowedStructureCount( room ) {
        const max_count = constants.CONTROLLER_STRUCTURES[ this.structure_type ][ room.controller.level ];

        const current_count = room
            .find( constants.FIND_MY_STRUCTURES, {
                filter: {
                    structureType: this.structure_type 
                }
            } )
            .length;

        const current_construction_site_count = room
            .find( constants.FIND_MY_CONSTRUCTION_SITES, {
                filter: {
                    structureType: this.structure_type
                }
            } )
            .length;

        return max_count - current_count - current_construction_site_count;
    };

    isValidConstruction( room, position, pending=[] ) {
        return ( 
            position && 
            room.lookAt( position ).length === 1 && 
            !_.some( pending, ( pending_location ) => position.isEqualTo( pending_location ) )
        );
    };

    _getNewPosition( room ) {
        throw new Error( 'Abstract Method' );
    }
    
    getNewPosition( room ) {
        return this._getNewPosition( room );
    }

    createConstructionSites( room ) {
        const num_new_extensions = this._getNewAllowedStructureCount( room );
        const pending = [];
        for( let i = 0; i < num_new_extensions; i++ ) {
            let position = this.getNewPosition( room, pending );
            pending.push( position );
            room.createConstructionSite( position, constants.STRUCTURE_EXTENSION );
        }
    }
}

module.exports = ConstructionPlanner;
