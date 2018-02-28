const map = require( '~/lib/map' );

const MAX_LONG_DISTANCE_MINER = 2;

class LongDistanceMiningPlanner {
    getRoomLongDistanceMemory( room ) {
        room.memory._long_distance = room.memory._long_distance || {};
        return room.memory._long_distance;
    }

    getClosestSource( start_room ) {
        let room_map = map.getRoom( start_room.name );

        let sources = [];
        _
            .forEach( 
                room_map.exits, 
                ( exit_room_name, direction ) => {
                    if( map.hasRoom( exit_room_name ) ) {
                        let exit_room = map.getRoom( exit_room_name );
                        if( exit_room.saw_enemies ) return;

                        exit_room
                            .sources
                            .forEach( ( source ) => {
                                sources
                                    .push( {
                                        source_id: source.source_id,
                                        path_length: source.path_length,
                                        room_name: exit_room_name,
                                        direction: direction
                                    } );
                            } );
                    }
                } 
            );

        let long_distance_memory = this.getRoomLongDistanceMemory( start_room );

        sources = _.filter( sources, ( source_map_item ) => !long_distance_memory.hasOwnProperty( source_map_item.source_id ) );

        if( sources.length === 0 ) {
            throw new Error( 'No More Safe Sources' );
        }

        _.sortBy( sources, ( source_map_item ) => source_map_item.path_length );

        return sources[ 0 ];
    }

    doPlan( room ) {
        let memory = this.getRoomLongDistanceMemory( room );
        
        if( Object.keys( memory ).length < MAX_LONG_DISTANCE_MINER ) {
            let closest_source = this.getClosestSource( room );
            console.log( 'closest_source', JSON.stringify( closest_source ) );
            memory[ closest_source.source_id ] = closest_source;

            Memory.rooms[ closest_source.room_name ].memory._state = Memory.rooms[ closest_source.room_name ].memory._state || {};
            Memory.rooms[ closest_source.room_name ].memory._state.type = 'long_distance';
            console.log( 'after' );
        }
    }
}

module.exports = LongDistanceMiningPlanner;
