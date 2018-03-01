const constants = require( '~/constants' );

class Assigner {
    constructor( room ) {
        this.room = room;
    }

    _getAssignedForType( type ) {
        if( !this.room.memory.hasOwnProperty( '_assigner' ) ) this.room.memory._assigner = {};
        if( !this.room.memory._assigner.hasOwnProperty( type ) ) this.room.memory._assigner[ type ] = {};
        return this.room.memory._assigner[ type ];
    }

    _isPreviouslyAssignedTo( key_name, thing_id, creep_id ) {
        if( !this._getAssignedForType( key_name ).hasOwnProperty( thing_id ) ) return false;
        return this._getAssignedForType( key_name )[ thing_id ].indexOf( creep_id ) !== -1;
    }

    _getAssignedToForCreep( type, creep_id ) {
        let all = this._getAssignedForType( type );
        for( let thing_id in all ) {
            if( this._isPreviouslyAssignedTo( type, thing_id, creep_id ) ) {
                return thing_id;
            }
        }
        return null;
    }

    _canBeAssigned( key_name, thing_id, allowed_count=1 ) {
        if( !this._getAssignedForType( key_name ).hasOwnProperty( thing_id ) ) {
            console.log( 'nokey' );
            return true;
        }
        return this._getAssignedForType( key_name )[ thing_id ].length < allowed_count;
    }

    _setAssigned( type, thing_id, creep_id ) {
        let assignations = this._getAssignedForType( type );
        if( !assignations.hasOwnProperty( thing_id ) ) assignations[ thing_id ] = [];
        assignations[ thing_id ].push( creep_id );
    }

    garbageCollect() {
        _
            .forEach( Assigner.types, ( type ) => {
                let previously_assigned = this._getAssignedForType( type );
                for( let thing_id in previously_assigned ) {
                    let assigned_for_thing_id = previously_assigned[ thing_id ];

                    let gone_indexes = [];
                    for( let assigned_i in assigned_for_thing_id ) {
                        let creep_id = assigned_for_thing_id[ assigned_i ];
                        if( !Game.getObjectById( creep_id ) ) {
                            gone_indexes.push( assigned_i );
                        }
                    }

                    if( gone_indexes.length > 0 ) {
                        console.log( 'LOST CREEPS IN ASSIGNER' );
                        gone_indexes.forEach( ( i ) => assigned_for_thing_id.splice( i, 1 ) );
                    }
                }
            } );
    }

    getAssigned( creep, type ) {
        switch( type ) {
            case Assigner.types.CONTAINER_MINER:
                let cm_source_assigned_to_me = this._getAssignedToForCreep( type, creep.id );
                if( cm_source_assigned_to_me ) {
                    console.log( 'was previously_assigned', cm_source_assigned_to_me, Game.getObjectById( cm_source_assigned_to_me ) );
                    return Game.getObjectById( cm_source_assigned_to_me );
                }
                let previously_assigned = this._getAssignedForType( type );

                let unassigned_structures = creep
                    .room
                    .find( FIND_SOURCES, {
                        filter: ( structure ) => {
                            return (
                                this._canBeAssigned( type, structure.id )
                            );
                        }
                    } );

                if( unassigned_structures.length === 0 ) throw new Error( 'Out of sturctures: ', type );
                this._setAssigned( type, unassigned_structures[ 0 ].id, creep.id );

                return unassigned_structures[ 0 ];
                break;
            case Assigner.types.LONG_DISTANCE_CONTAINER_MINER:
            case Assigner.types.LONG_DISTANCE_HAULER:
                let source_assigned_to_me = this._getAssignedToForCreep( type, creep.id );
                if( source_assigned_to_me ) {
                    console.log( 'was previously_assigned', source_assigned_to_me, JSON.stringify( this.room.memory._long_distance[ source_assigned_to_me ] ) );
                    return this.room.memory._long_distance[ source_assigned_to_me ];
                }

                let unassigned_sources = _
                    .filter( this.room.memory._long_distance, ( long_distance, source_id ) => {
                        let allowed_count = ( type === Assigner.types.LONG_DISTANCE_HAULER ) ? long_distance.haulers : 1;
                        return this._canBeAssigned( type, source_id, allowed_count );
                    } );

                if( unassigned_sources.length === 0 ) throw new Error( 'Out of sturctures: ', type );
                this._setAssigned( type, unassigned_sources[ 0 ].source_id, creep.id );

                console.log( JSON.stringify( unassigned_sources[ 0 ] ) );

                console.log( 'Assigning', creep.id, 'to', unassigned_sources[ 0 ].source_id );
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
