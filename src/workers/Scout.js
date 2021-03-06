const position = require( '~/lib/position' ),
    map = require( '~/lib/map' ),
    move = require( '~/lib/move' );

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
        let parts = [ TOUGH, ATTACK, MOVE, MOVE ];

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

        console.log( 'memory.rooms_to_scout', JSON.stringify( memory.rooms_to_scout ) );

        // We know we are finally done
        if( !map.needsScout( memory.start_room_name ) ) {
            creep.suicide();
        }

        if( memory.rooms_to_scout ) {
            let move_response = this.moveToRoom( memory.rooms_to_scout[ 0 ], { avoid_enemies: true } );

            if( move_response === move.ERR_NO_ROUTE ) {
                map.setUnreachable( creep, memory.rooms_to_scout[ 0 ] );
                memory.rooms_to_scout = null;
            }
        }
    }
}

module.exports = Scout;
