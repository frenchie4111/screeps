const position = require( '~/lib/position' );

const MAP_VERSION = 8;

module.exports = {
    getRoomMap: () => {
        let memory = Memory._room_map = Memory._room_map || {};
        return memory;
    },

    hasRoom: ( room_name ) => {
        let room_map = module.exports.getRoomMap();
        if( !room_map.hasOwnProperty( room_name ) || room_map[ room_name ]._version !== MAP_VERSION ) return false;
        return true;
    },

    getRoom: ( room_name ) => {
        let room_map = module.exports.getRoomMap();
        if( room_map.hasOwnProperty( room_name ) ) return room_map[ room_name ];
        return null;
    },

    needsScout: ( room_name ) => {
        if( module.exports.hasRoom( room_name ) ) {
            let exits = module.exports.getRoom( room_name ).exits;
            for( let direction in exits ) {
                let exit_room_name = exits[ direction ];

                if( !module.exports.hasRoom( exit_room_name ) ) {
                    return true;
                }
            }
            
            return false;
        }

        return true;
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
                let exit_pos = source.pos.findClosestByPath( oposite_entrance_dir );
                if( !exit_pos ) exit_pos = source.pos.findClosestByRange( oposite_entrance_dir );
                console.log( 'exit_pos', JSON.stringify( exit_pos ) );
                let exit_path = source.pos.findPathTo( exit_pos );
                console.log( 'exit_path', JSON.stringify( exit_path ) );

                source_info.exit_pos = position.clone( exit_pos );
                source_info.exit_path_length = exit_path.length;

                return source_info;
            } );

        room_map[ room.name ].mineral_ids = room.find( FIND_MINERALS ).map( ( mineral ) => mineral.id );
        room_map[ room.name ].controller_id = room.controller ? room.controller.id : null;
        room_map[ room.name ].exits = Game.map.describeExits( room.name );
        room_map[ room.name ].saw_enemies = ( room.find( FIND_HOSTILE_CREEPS ).length > 0 || room.find( FIND_HOSTILE_STRUCTURES ).length > 0 );

        room_map[ room.name ]._version = MAP_VERSION;
    }
};
