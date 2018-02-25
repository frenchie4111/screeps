const position = require( '~/lib/position' );

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
    getRoomMap() {
        let memory = Memory._room_map = Memory._room_map || {};
        return memory;
    }

    hasRoom( room_name ) {
        let room_map = this.getRoomMap();
        if( !room_map.hasOwnProperty( room_name ) || room_map[ room_name ]._version !== MAP_VERSION ) return false;
        return true;
    }

    getRoom( room_name ) {
        let room_map = this.getRoomMap();
        if( room_map.hasOwnProperty( room_name ) ) return room_map[ room_name ];
        return null;
    }

    storeRoom( room ) {
        let room_map = this.getRoomMap();

        if( !room_map.hasOwnProperty( room.name ) ) room_map[ room.name ] = {};

        room_map[ room.name ]._version = MAP_VERSION;
        room_map[ room.name ].source_ids = room.find( FIND_SOURCES ).map( ( source ) => source.id );
        room_map[ room.name ].mineral_ids = room.find( FIND_MINERALS ).map( ( mineral ) => mineral.id );
        room_map[ room.name ].controller_id = room.controller ? room.controller.id : null;
        room_map[ room.name ].exits = Game.map.describeExits( room.name );
        room_map[ room.name ].saw_enemies = ( room.find( FIND_HOSTILE_CREEPS ).length > 0 || room.find( FIND_HOSTILE_STRUCTURES ).length > 0 );
    }
    
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

        if( !this.hasRoom( creep.room.name ) ) {
            this.storeRoom( creep.room );
        }

        if( creep.room.name === memory.start_room_name ) {
            let current_room_map = this.getRoom( memory.start_room_name );
            let target_room_name = current_room_map.exits[ current_direction ];

            if( !this.hasRoom( target_room_name ) ) {
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
