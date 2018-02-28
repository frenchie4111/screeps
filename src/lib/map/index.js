const position = require( '~/lib/position' );

const MAP_VERSION = 7;

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

    storeRoom: ( creep, room ) => {
        let room_map = module.exports.getRoomMap();

        // Always overwrite the previous storage, so we don't get weird artifacts
        room_map[ room.name ] = {};

        room_map[ room.name ]._version = MAP_VERSION;

        room_map[ room.name ].sources = room
            .find( FIND_SOURCES )
            .map( ( source ) => {
                let path = creep.pos.findPathTo( source );
                return {
                    source_id: source.id,
                    path_length: path.length,
                    pos: position.clone( source.pos )
                }
            } );

        room_map[ room.name ].mineral_ids = room.find( FIND_MINERALS ).map( ( mineral ) => mineral.id );
        room_map[ room.name ].controller_id = room.controller ? room.controller.id : null;
        room_map[ room.name ].exits = Game.map.describeExits( room.name );
        room_map[ room.name ].saw_enemies = ( room.find( FIND_HOSTILE_CREEPS ).length > 0 || room.find( FIND_HOSTILE_STRUCTURES ).length > 0 );
    }
};
