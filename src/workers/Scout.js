const position = require( '~/lib/position' ),
    map = require( '~/lib/map' );

const constants = require( '~/constants' );

const Worker = require( './Worker' );

const MAP_VERSION = 4;

const directions = [
    constants.RIGHT,
    constants.TOP,
    constants.BOTTOM,
    constants.LEFT
];

class Scout extends Worker {
    getBody( available_energy ) {
        let parts = [ MOVE, MOVE ];

        if( available_energy > this.getEnergyOf( parts ) ) {
            return parts;
        }
        return [];
    }

    _doWork( creep ) {
        let memory = this.getMemory();

        if( !memory.start_room_name ) {
            memory.start_room_name = creep.room.name;
        }

        if( !memory.rooms_to_scout ) {
            memory.rooms_to_scout = map.getRoomsToScout( memory.start_room_name );
        }

        if( !map.hasRoom( creep.room.name ) ) {
            let direction = creep.memory.worker_memory._moveToRoom ? creep.memory.worker_memory._moveToRoom.direction : 0;
            map.storeRoom( creep, creep.room, direction );
            memory.rooms_to_scout = null;
        }

        // We know we are finally done
        if( !map.needsScout( memory.start_room_name ) ) {
            creep.suicide();
        }

        if( memory.rooms_to_scout ) {
            this.moveToRoom( memory.rooms_to_scout[ 0 ], { avoid_enemies: true } );
        }
    }
}

module.exports = Scout;
