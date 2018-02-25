const constants = require( '~/constants' );

class Assigner {
    constructor( room ) {
        this.room = room;
    }

    _getPreviouslyAssigned( key_name ) {
        if( !this.room.memory.hasOwnProperty( '_assigner' ) ) this.room.memory._assigner = {};
        if( !this.room.memory._assigner.hasOwnProperty( key_name ) ) this.room.memory._assigner[ key_name ] = {};
        return this.room.memory._assigner[ key_name ];
    }

    garbageCollect() {  
        let previously_assigned = this._getPreviouslyAssigned( constants.STRUCTURE_CONTAINER );
        for( let key in previously_assigned ) {
            let creep_id = previously_assigned[ key ];
            if( !Game.getObjectById( creep_id ) ) {
                console.log( 'creep gone', creep_id, previously_assigned[ key ] );
                delete previously_assigned[ key ];
            }
        }
    }

    getAssigned( creep, type ) {
        switch( type ) {
            case constants.STRUCTURE_CONTAINER:
                let previously_assigned = this._getPreviouslyAssigned( type );

                let unassigned_structures = creep.room
                    .find( FIND_STRUCTURES, {
                        filter: ( structure ) => {
                            console.log( 'Considering structure', structure, previously_assigned.hasOwnProperty( structure.id ) )
                            return (
                                structure.structureType === type &&
                                !previously_assigned.hasOwnProperty( structure.id )
                            );
                        }
                    } );

                if( unassigned_structures.length === 0 ) throw new Error( 'Out of sturctures: ', type );
                previously_assigned[ unassigned_structures[ 0 ].id ] = creep.id;

                return unassigned_structures[ 0 ];
                break;
        }
    }
};

module.exports = Assigner;
