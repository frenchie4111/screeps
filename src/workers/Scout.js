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
        return [ constants.MOVE, constants.MOVE ];
    }

    _doWork( creep ) {
        let memory = this.getMemory();

        if( !memory.hasOwnProperty( 'start_room_name' ) ) {
             memory.start_room_name = creep.room.name;
        }

        let current_direction_i = memory.current_direction_i = memory.current_direction_i || 0;
        let current_direction = directions[ current_direction_i ];

        if( !map.hasRoom( creep.room.name ) ) {
            map.storeRoom( creep, creep.room );
        }

        if( creep.room.name === memory.start_room_name ) {
            let current_room_map = map.getRoom( memory.start_room_name );
            let target_room_name = current_room_map.exits[ current_direction ];

            if( !map.hasRoom( target_room_name ) ) {
                if( !memory._exit ) {
                    let exit = creep.pos.findClosestByPath( current_direction );
                    memory._exit = position.clone( exit );
                }
                let exit_pos = position.fromJSON( memory._exit );

                this.moveTo( exit_pos );
            } else {
                memory._exit = null;
                memory.current_direction_i++;
                memory.current_direction_i %= directions.length;
            }
        } else {
            console.log( 'Not in start room' );
        }
    }
}

module.exports = Scout;
