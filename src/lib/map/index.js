const position = require( '~/lib/position' );

const MAP_VERSION = 12;

const RERUN_EVERY = 10000;

module.exports = {
    getRoomMap: () => {
        let memory = Memory._room_map = Memory._room_map || {};
        return memory;
    },

    hasRoom: ( room_name ) => {
        let room_map = module.exports.getRoomMap();
        if( !room_map.hasOwnProperty( room_name ) ) return false;
        if( room_map[ room_name ]._version !== MAP_VERSION ) return false;
        if( !room_map[ room_name ].hasOwnProperty( 'run_at' ) ) return false;
        if( room_map[ room_name ].run_at + RERUN_EVERY < Game.time ) return false;
        return true;
    },

    getRoom: ( room_name ) => {
        let room_map = module.exports.getRoomMap();
        if( room_map.hasOwnProperty( room_name ) ) return room_map[ room_name ];
        return null;
    },

    invalidateRoom: ( room_name ) => {
        let room = module.exports.getRoom( room_name );
        if( room ) room._version = 'invalid';
    },

    getRoomsToScout_rec: ( start_room_name, ret_arr=[], seen=[] ) => {
        seen.push( start_room_name );
        if( module.exports.hasRoom( start_room_name ) ) {
            if( Memory.rooms[ start_room_name ] && Memory.rooms[ start_room_name ].type ) {
                let exits = _.values( module.exports.getRoom( start_room_name ).exits );
                _.forEach( exits, ( exit ) => {
                    if( !seen.includes( exit ) ) {
                        module.exports.getRoomsToScout_rec( exit, ret_arr, seen );
                    }
                } );
            }
        } else {
            ret_arr.push( start_room_name );
            return ret_arr;
        }
    },
    
    getRoomsToScout: ( start_room_name ) => {
        let rooms = [];
        module.exports.getRoomsToScout_rec( start_room_name, rooms, [] );
        return rooms;
    },

    needsScout: ( room_name ) => {
        let rooms_to_scout = module.exports.getRoomsToScout( room_name );

        return rooms_to_scout.length > 0;
    },

    setUnreachable: ( creep, room_name ) => {
        let room_map = module.exports.getRoomMap();
        room_map[ room_name ] = {}
        room_map[ room_name ].unreachable = true;
        room_map[ room_name ]._version = MAP_VERSION;
    },

    storeController: ( room ) => {
        let room_map = module.exports.getRoomMap();

        if( room.controller ) {
            room_map[ room.name ].controller = {
                id: room.controller.id,
                owner: room.controller.owner,
                level: room.controller.level,
                reservation: room.controller.reservation,
                safeMode: room.controller.safeMode,
                safeModeAvailable: room.controller.safeModeAvailable,
                safeModeCooldown: room.controller.safeModeCooldown,
            };
        }
    },

    storeRoom: ( creep, room, entrance_direction ) => {
        let room_map = module.exports.getRoomMap();

        // Always overwrite the previous storage, so we don't get weird artifacts
        room_map[ room.name ] = {};

        room_map[ room.name ].sources = room
            .find( FIND_SOURCES )
            .map( ( source ) => {
                let path = creep.pos.findPathTo( source );
                let source_info = {
                    source_id: source.id,
                    path_length: path.length,
                    pos: position.clone( source.pos )
                }

                let oposite_entrance_dir = position.getOpositeDirection( entrance_direction );
                console.log( 'Finding Closest to', JSON.stringify( source.pos ), oposite_entrance_dir );
                let exit_pos = source.pos.findClosestByPath( +oposite_entrance_dir );
                let exit_pos_type = 'path';
                if( !exit_pos ) {
                    exit_pos_type = 'range';
                    exit_pos = source.pos.findClosestByRange( +oposite_entrance_dir );
                }
                if( !exit_pos ) {
                    source_info.exit_pos_type = null;
                    return source_info;
                }
                console.log( 'exit_pos', JSON.stringify( exit_pos ) );
                let exit_path = source.pos.findPathTo( exit_pos );
                console.log( 'exit_path', JSON.stringify( exit_path ) );

                source_info.exit_pos = position.clone( exit_pos );
                source_info.exit_path_length = exit_path.length;
                source_info.exit_pos_type = exit_pos_type;

                return source_info;
            } );

        room_map[ room.name ].minerals = room
            .find( FIND_MINERALS )
            .map( ( mineral ) => { 
                return {
                    id: mineral.id,
                    type: mineral.mineralType
                }
            } );

        room_map[ room.name ].controller = null;
        module.exports.storeController( room );

        room_map[ room.name ].exits = Game.map.describeExits( room.name );

        let hostile_creeps = room.find( FIND_HOSTILE_CREEPS );
        let hostile_structures = room.find( FIND_HOSTILE_STRUCTURES );

        let saw_enemies = false;
        let enemy_username = null;

        if( hostile_creeps.length > 0 ) {
            saw_enemies = true;
            room_map[ room.name ].enemy_username = hostile_creeps[ 0 ].owner.username;
            room_map[ room.name ].saw_enemy_creeps = true;
        }
        if( hostile_structures.length > 0 ) {
            saw_enemies = true;
            room_map[ room.name ].enemy_username = hostile_structures[ 0 ].owner.username;
            room_map[ room.name ].saw_enemy_structures = true;
        }

        room_map[ room.name ].saw_enemies = saw_enemies;

        room_map[ room.name ].run_at = Game.time;

        room_map[ room.name ]._version = MAP_VERSION;
    }
};
