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

    _isPreviouslyAssignedTo( key_name, id, creep_id ) {
        if( !this._getPreviouslyAssigned( key_name ).hasOwnProperty( id ) ) return false;
        return this._getPreviouslyAssigned( key_name )[ id ] === creep_id;
    }

    _isPreviouslyAssigned( key_name, id ) {
        console.log( '_isPreviouslyAssigned', key_name, id, this._getPreviouslyAssigned( key_name ).hasOwnProperty( id ) );
        return this._getPreviouslyAssigned( key_name ).hasOwnProperty( id );
    }

    garbageCollect() {
        _
            .forEach( Assigner.types, ( type ) => {
                let previously_assigned = this._getPreviouslyAssigned( type );
                for( let key in previously_assigned ) {
                    let creep_id = previously_assigned[ key ];

                    if( !Game.getObjectById( creep_id ) ) {
                        console.log( 'creep gone', type, creep_id, previously_assigned[ key ] );
                        delete previously_assigned[ key ];
                    }
                }
            } );
    }

    getAssigned( creep, type ) {
        switch( type ) {
            case Assigner.types.CONTAINER_MINER:
                let previously_assigned = this._getPreviouslyAssigned( type );

                let unassigned_structures = creep
                    .room
                    .find( FIND_SOURCES, {
                        filter: ( structure ) => {
                            return (
                                !previously_assigned.hasOwnProperty( structure.id )
                            );
                        }
                    } );

                if( unassigned_structures.length === 0 ) throw new Error( 'Out of sturctures: ', type );
                previously_assigned[ unassigned_structures[ 0 ].id ] = creep.id;

                return unassigned_structures[ 0 ];
                break;
            case Assigner.types.LONG_DISTANCE_CONTAINER_MINER:
            case Assigner.types.LONG_DISTANCE_HAULER:
                let source_assigned_to_me = _.find( this.room.memory._long_distance, ( assigned, source_id ) => this._isPreviouslyAssignedTo( type, source_id, creep.id ) );
                if( source_assigned_to_me ) {
                    console.log( 'was assigned to me' );
                    return source_assigned_to_me;
                }

                let unassigned_sources = _.filter( this.room.memory._long_distance, ( assigned, source_id ) => !this._isPreviouslyAssigned( type, source_id ) );

                if( unassigned_sources.length === 0 ) throw new Error( 'Out of sturctures: ', type );
                this._getPreviouslyAssigned( type )[ unassigned_sources[ 0 ].source_id ] = creep.id;

                return unassigned_sources[ 0 ];
                break;
        }
    }
};

Assigner.types = {
    CONTAINER_MINER: 'CONTAINER_MINER',
    LONG_DISTANCE_CONTAINER_MINER: 'LONG_DISTANCE_CONTAINER_MINER',
    LONG_DISTANCE_HAULER: 'LONG_DISTANCE_HAULER',
};

Assigner.prototype.types = Assigner.types;

module.exports = Assigner;
