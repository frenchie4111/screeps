const map = require( '~/lib/map' ),
    position = require( '~/lib/position' );

const Planner = require( './Planner' );

const MAX_LONG_DISTANCE_MINER = 3;

const VERSION = 13;

const EXPANSION_ROOM_TYPE = 'expansion';
const STANDARD_ROOM_TYPE = 'standard';
const ALLOWED_ROOM_TYPES = [ 'long_distance', 'cleared' ];
const ALLOWED_ENEMY_USERNAMES = [ SYSTEM_USERNAME ];

class LongDistanceMiningPlanner extends Planner {
    getRoomType( room_name ) {
        return _.get( Memory.rooms, [ room_name, 'type' ], null );
    }

    shouldRun( room, spawn ) {
        let expansion_rooms = _
            .filter( Memory.rooms, ( room, room_name ) => {
                return [ EXPANSION_ROOM_TYPE, STANDARD_ROOM_TYPE ].includes( this.getRoomType( room_name ) );
            } );

        if( expansion_rooms.length >= Game.gcl.level ) {
            return false;
        }

        if( map.needsScout( room.name ) ) {
            return false;
        }

        return true;
    }

    _doPlan( room, spawn ) {
        let room_map = map.getRoomMap();

        let rooms_to_expand = _
            .chain( room_map )
            .map( ( room, room_name ) => {
                return _.extend( { room_name }, room );
            } )
            .filter( ( room ) => {
                return room.controller;
            } )
            .filter( ( room ) => {
                let sources = _.filter( room.sources, ( source ) => source.exit_pos_type === 'path' );
                return sources.length >= 2;
            } )
            .filter( ( room ) => {
                let room_type = this.getRoomType( room.room_name );
                if( !room_type ) return true;
                if( ALLOWED_ROOM_TYPES.includes( room_type ) ) return true;
                return false;
            } )
            .filter( ( room ) => {
                if( room.saw_enemies ) {
                    if( ALLOWED_ENEMY_USERNAMES.includes( room.enemy_username ) ) {
                        return true;
                    }
                    return false;
                }
                return true;
            } )
            .filter( ( room ) => {
                return ( !room.controller.owner || room.controller.my );
            } )
            .each( room => console.log( JSON.stringify( room ) ) )
            .value();

        if( rooms_to_expand.length === 0 ) {
            console.log( 'No expansion candidates' );
            return false;
        }

        let target_room = rooms_to_expand[ 0 ];

        _.set( Memory, [ 'rooms', target_room.room_name, 'type' ], EXPANSION_ROOM_TYPE );
        room.memory.expansion_target = target_room.room_name;

        return true;
    }
}

module.exports = LongDistanceMiningPlanner;
