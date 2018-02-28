const MAP_VERSION = 5;

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

    storeRoom: ( creep, room ) => {
        let room_map = module.exports.getRoomMap();

        if( !room_map.hasOwnProperty( room.name ) ) room_map[ room.name ] = {};

        room_map[ room.name ]._version = MAP_VERSION;

        room_map[ room.name ].sources = room
            .find( FIND_SOURCES )
            .map( ( source ) => {
                let path = creep.pos.findPathTo( source );
                return {
                    source_id: source.id,
                    path_length: path.length
                }
            } );

        room_map[ room.name ].mineral_ids = room.find( FIND_MINERALS ).map( ( mineral ) => mineral.id );
        room_map[ room.name ].controller_id = room.controller ? room.controller.id : null;
        room_map[ room.name ].exits = Game.map.describeExits( room.name );
        room_map[ room.name ].saw_enemies = ( room.find( FIND_HOSTILE_CREEPS ).length > 0 || room.find( FIND_HOSTILE_STRUCTURES ).length > 0 );
    }
};
