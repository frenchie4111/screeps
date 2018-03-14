const constants = require( '~/constants' );

const position = require( '~/lib/position' );

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

    unassign( type, creep_id, thing_id ) {
        let assigned = this._getAssignedForType( type );

        for( let thing_id in assigned ) {
            for( let assigned_i in assigned[ thing_id ] ) {
                let assigned_creep_id = assigned[ thing_id ][ assigned_i ];
                if( creep_id === assigned_creep_id ) {
                    assigned[ thing_id ].splice( assigned_i, 1 );
                    return;
                }
            }
        }
        console.log( 'COULDNT UNASSIGN', creep_id, 'from', type, thing_id )
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

    _arrayToAllowedCounts( array, per=1 ) {
        return _
            .reduce( array, ( full, val ) => {
                full[ val ] = per;
                return full;
            }, {} );
    }

    getAssignable( type ) {
        const ROOM_TICKS_TO_UNRESERVE_THRESHOLD = 500;

        const rooms = Memory.rooms;

        switch( type ) {
            case Assigner.types.CONTAINER_MINER:
                return this._arrayToAllowedCounts( _.map( this.room.find( FIND_SOURCES ), ( source ) => source.id ) );
            case Assigner.types.LONG_DISTANCE_CONTAINER_MINER:
                return this._arrayToAllowedCounts( _.map( this.room.memory._long_distance, ( long_distance ) => long_distance.source_id ) );
            case Assigner.types.LONG_DISTANCE_HAULER:
                return _
                    .reduce( this.room.memory._long_distance, ( full, long_distance ) => {
                        full[ long_distance.source_id ] = long_distance.haulers;
                        return full;
                    }, {} );
            case Assigner.types.LONG_DISTANCE_RESERVER:
                let reserve_rooms = _.uniq( _.map( this.room.memory._long_distance, ( long_distance ) => long_distance.room_name ) );
                reserve_rooms = _
                    .filter( reserve_rooms, ( room ) => {
                        if( Memory.rooms[ room ].dangerous_until && Memory.rooms[ room ].dangerous_until > Game.time ) return false;
                        if( !Memory.rooms[ room ].hasOwnProperty( 'resevered_until' ) ) return true;
                        let ticks_til_unreserved = Memory.rooms[ room ].resevered_until - Game.time;
                        return ticks_til_unreserved < ROOM_TICKS_TO_UNRESERVE_THRESHOLD;
                    } );
                return this._arrayToAllowedCounts( reserve_rooms );
            case Assigner.types.LONG_DISTANCE_ROOM_CLEARER:
                let dangerous_rooms = [];
                for( let room_name in rooms ) {
                    if( rooms[ room_name ].dangerous_until > Game.time ) {
                        dangerous_rooms.push( room_name );
                    }
                }
                return this._arrayToAllowedCounts( dangerous_rooms );
            case Assigner.types.EXPANSION_CLEARER:
                let expansion_rooms = [];
                for( let room_name in rooms ) {
                    if( _.get( Memory, [ 'rooms', room_name, 'type' ] ) === 'expansion' &&
                        _.get( Memory, [ 'rooms', room_name, '_state', 'current_state' ] ) === 0 ) {
                        expansion_rooms.push( room_name );
                    }
                }
                return this._arrayToAllowedCounts( expansion_rooms, 4 );
            case Assigner.types.EXPANSION_RESERVER:
                let expansion_rooms_to_claim = [];
                for( let room_name in rooms ) {
                    if( _.get( Memory, [ 'rooms', room_name, 'type' ] ) === 'expansion' &&
                        _.get( Memory, [ 'rooms', room_name, '_state', 'current_state' ] ) === 1 ) {
                        expansion_rooms_to_claim.push( room_name );
                    }
                }
                return this._arrayToAllowedCounts( expansion_rooms_to_claim );
            case Assigner.types.EXPANSION_BUILDER:
                let expansion_rooms_to_build = [];
                for( let room_name in rooms ) {
                    if( _.get( Memory, [ 'rooms', room_name, 'type' ] ) === 'expansion' &&
                        _.get( Memory, [ 'rooms', room_name, '_state', 'current_state' ] ) === 2 ) {
                        expansion_rooms_to_build.push( room_name );
                    }
                }
                return this._arrayToAllowedCounts( expansion_rooms_to_build );
            case Assigner.types.CLEARER:
                let rooms_to_clear = [];
                _
                    .each( Memory._room_map, ( room_info, room_name ) => {
                        if( 
                            ![ SYSTEM_USERNAME, 'none' ].includes( _.get( room_info, [ 'controller', 'owner', 'username' ], 'none' ) ) && 
                            _.get( room_info, [ 'controller', 'level' ] ) <= 2 &&
                            _.get( room_info, [ 'saw_enemies' ] ) &&
                            ( _.get( room_info, [ 'controller', 'safeMode' ], 0 ) + _.get( room_info, [ 'run_at' ] ) ) < Game.time
                        ) {
                            rooms_to_clear.push( room_name );
                        }
                    } );
                return this._arrayToAllowedCounts( rooms_to_clear, 2 );
            case Assigner.types.WAITING_SPOT:
                let waiting_spots = [
                    [ -5, -1 ],
                    [ -5, -2 ],
                    [ -5, -3 ],
                    [ -5, -4 ],
                    [ -5, -5 ],
                    [ -5, +1 ],
                    [ -5, +2 ],
                    [ -5, +3 ],
                    [ -5, +4 ],
                    [ -5, +5 ],
                ];
                let spot_ids = _
                    .map( waiting_spots, ( waiting_spot ) => {
                        return '' + waiting_spot[ 0 ] + ':' + waiting_spot[ 1 ]
                    } );
                return this._arrayToAllowedCounts( spot_ids );
        }
    }

    getObjectFromId( type, assigned_id ) {
        switch( type ) {
            case Assigner.types.CONTAINER_MINER:
                console.log( 'getObjectById', assigned_id );
                return Game.getObjectById( assigned_id );
            case Assigner.types.LONG_DISTANCE_CONTAINER_MINER:
            case Assigner.types.LONG_DISTANCE_HAULER:
                let found_long_distance = _.find( this.room.memory._long_distance, ( long_distance ) => long_distance.source_id === assigned_id );
                console.log( assigned_id, found_long_distance );
                return found_long_distance;
            case Assigner.types.LONG_DISTANCE_RESERVER:
            case Assigner.types.LONG_DISTANCE_ROOM_CLEARER:
            case Assigner.types.EXPANSION_CLEARER:
            case Assigner.types.EXPANSION_RESERVER:
            case Assigner.types.EXPANSION_BUILDER:
            case Assigner.types.CLEARER:
                return assigned_id;
            case Assigner.types.WAITING_SPOT:
                let assigned_id_split = _.map( assigned_id.split( ':' ), ( item ) => +item );
                
                let waiting_spot_position = position.directionToPosition( this.spawn.pos, assigned_id_split );
                console.log( waiting_spot_position );
                waiting_spot_position.id = assigned_id;
                return waiting_spot_position;
        }
    }

    getUnassigned( type ) {
        let unassigned = this.getAssignable( type );

        unassigned = _
            .map( unassigned, ( allowed_count, thing_id ) => {
                return {
                    allowed_count: allowed_count,
                    id: thing_id
                }
            } );

        unassigned = _
            .filter( unassigned, ( thing_obj ) => {
                return this._canBeAssigned( type, thing_obj.id, thing_obj.allowed_count );
            } );

        return unassigned;
    }

    getSpawnCount( type ) {
        let unassigned = this.getUnassigned( type );
        let assigned = this._getAssignedForType( type );

        let unassigned_count = _.sum( _.map( unassigned, ( unassigned_for_id ) => unassigned_for_id.allowed_count ) );
        let assigned_count = _.sum( _.map( assigned, ( assigned_for_id ) => assigned_for_id.length ) );

        return unassigned_count + assigned_count;
    }

    getAssigned( creep, type ) {
        let assigned_to_me = this._getAssignedToForCreep( type, creep.id );
        if( assigned_to_me ) {
            console.log( 'creep', creep.id, 'already assigned to', type, assigned_to_me );
            return this.getObjectFromId( type, assigned_to_me );
        }

        let unassigned = this.getUnassigned( type );

        if( unassigned.length === 0 ) {
            throw new Error( 'Assigner can not assign anymore type', type );
        }

        let assigned = unassigned[ 0 ];
        this._setAssigned( type, assigned.id, creep.id );

        return this.getObjectFromId( type, assigned.id );
    }
};

Assigner.types = {
    CONTAINER_MINER: 'CONTAINER_MINER',
    LONG_DISTANCE_CONTAINER_MINER: 'LONG_DISTANCE_CONTAINER_MINER',
    LONG_DISTANCE_HAULER: 'LONG_DISTANCE_HAULER',
    LONG_DISTANCE_RESERVER: 'LONG_DISTANCE_RESERVER',
    WAITING_SPOT: 'WAITING_SPOT',
    LONG_DISTANCE_ROOM_CLEARER: 'LONG_DISTANCE_ROOM_CLEARER',
    EXPANSION_CLEARER: 'EXPANSION_CLEARER',
    EXPANSION_RESERVER: 'EXPANSION_RESERVER',
    EXPANSION_BUILDER: 'EXPANSION_BUILDER',
    CLEARER: 'CLEARER',
};

Assigner.prototype.types = Assigner.types;

module.exports = Assigner;
