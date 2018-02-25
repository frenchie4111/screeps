const position = require( '~/lib/position' );

const Worker = require( './Worker' );

class Scout extends Worker {

    getRoomMap() {
        let memory = Memory._room_map = Memory._room_map || {};
        return memory;
    }

    storeRoom( room ) {
        let room_map = this.getRoomMap();

        if( !room_map.hasOwnProperty( room.name ) ) room_map[ room.name ] = {};

        room_map[ room.name ].sources = room.pos.find
    }

    _doWork( creep ) {
        
    }
}

module.exports = Scout;
