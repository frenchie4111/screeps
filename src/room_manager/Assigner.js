const constants = require( '~/constants' );

class Assigner {
    constructor( room, spawn ) {
        this.room = room;
        this.spawn = spawn;
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
        console.log( '_setAssigned', type, thing_id, creep_id );
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

    _arrayToAllowedCounts( array ) {
        return _
            .reduce( array, ( full, val ) => {
                full[ val ] = 1;
                return full;
            }, {} );
    }

    getAssignable( creep, type ) {
        switch( type ) {
            case Assigner.types.CONTAINER_MINER:
                return this._arrayToAllowedCounts( creep.room.find( FIND_SOURCES ) );
            case Assigner.types.LONG_DISTANCE_CONTAINER_MINER:
            case Assigner.types.LONG_DISTANCE_HAULER:
                return _
                    .reduce( this.room.memory._long_distance, ( full, long_distance ) => {
                        full[ long_distance.source_id ] = long_distance.haulers;
                        return full;
                    }, {} );
            case Assigner.types.LONG_DISTANCE_RESERVER:
                let reserve_rooms = _.uniq( _.map( this.room.memory._long_distance, ( long_distance ) => long_distance.room_name ) );
                reserve_rooms = _
                    .filter( rooms, ( room ) => {
                        if( !Memory.rooms[ room ].hasOwnProperty( 'resevered_until' ) ) return true;
                        let ticks_til_unreserved = Memory.rooms[ room ].resevered_until - Game.time;
                        return ticks_til_unreserved < ROOM_TICKS_TO_UNRESERVE_THRESHOLD;
                    } );
                return this._arrayToAllowedCounts( reserve_rooms );
        }
    }

    getObjectFromId( type, assigned_id ) {
        switch( type ) {
            case Assigner.types.CONTAINER_MINER:
                return Game.getObjectFromId( assigned_id );
            case Assigner.types.LONG_DISTANCE_CONTAINER_MINER:
            case Assigner.types.LONG_DISTANCE_HAULER:
                return _.find( this.room.memory._long_distance, ( long_distance ) => long_distance.source_id === assigned_id );
            case Assigner.types.LONG_DISTANCE_RESERVER:
                return assigned_id
        }
    }

    getAssigned( creep, type ) {
        let assigned_to_me = this._getAssignedToForCreep( type, creep.id );
        if( assigned_to_me ) {
            console.log( 'creep', creep.id, 'already assigned to', type, assigned_to_me );
            return this.getObjectFromId( type, assigned_to_me );
        }

        let assignable = this.getAssignable( creep, type );
        console.log( 'assignable', JSON.stringify( assignable ) );
        assignable = _
            .map( assignable, ( allowed_count, thing_id ) => {
                return {
                    allowed_count: allowed_count,
                    thing_id: thing_id
                }
            } );
        console.log( 'assignable map', JSON.stringify( assignable ) );
        assignable = _
            .filter( assignable, ( thing_obj ) => {
                return this._canBeAssigned( type, thing_obj.thing_id, thing_obj.allowed_count );
            } );
        console.log( 'assignable filter', JSON.stringify( assignable ) );

        if( assignable.length === 0 ) {
            throw new Error( 'Assigner can not assign anymore type', type );
        }

        let assigned = assignable[ 0 ];
        this._setAssigned( type, assigned.thing_id, creep.id );

        return this.getObjectFromId( type, assigned.thing_id );
    }
};

Assigner.types = {
    CONTAINER_MINER: 'CONTAINER_MINER',
    LONG_DISTANCE_CONTAINER_MINER: 'LONG_DISTANCE_CONTAINER_MINER',
    LONG_DISTANCE_HAULER: 'LONG_DISTANCE_HAULER',
    LONG_DISTANCE_RESERVER: 'LONG_DISTANCE_RESERVER',
    WAITING_SPOT: 'WAITING_SPOT',
};

Assigner.prototype.types = Assigner.types;

module.exports = Assigner;
