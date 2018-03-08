const map = require( '~/lib/map' ),
    position = require( '~/lib/position' );

const Planner = require( './Planner' );

const MAX_LONG_DISTANCE_MINER = 3;

const VERSION = 12;

const ONE_HAULER_PER = 125;
const LINK_THRESHOLD = 25;

class LongDistanceMiningPlanner extends Planner {
    shouldRun( room, spawn ) {
        let memory = this.getRoomLongDistanceMemory( room );

        if( Object.keys( memory ).length < MAX_LONG_DISTANCE_MINER ) {
            return true;
        }

        for( let source_id in memory ) {
            if( !memory[ source_id ]._version || memory[ source_id ]._version !== VERSION ) {
                console.log( 'Re-run because of version' );
                delete memory[ source_id ];
                return true;
            }
        }

        return super.shouldRun( room, spawn );
    }

    getRoomLongDistanceMemory( room ) {
        room.memory._long_distance = room.memory._long_distance || {};
        return room.memory._long_distance;
    }

    getClosestSource( start_room, spawn ) {
        let room_map = map.getRoom( start_room.name );

        let sources = [];
        _
            .forEach( 
                room_map.exits, 
                ( exit_room_name, direction ) => {
                    if( map.hasRoom( exit_room_name ) ) {
                        let exit_room = map.getRoom( exit_room_name );
                        if( exit_room.saw_enemies ) return;

                        let exit_point = spawn.pos.findClosestByPath( +direction );
                        let exit_path = spawn.pos.findPathTo( exit_point );
                        let exit_path_length = exit_path.length;

                        exit_room
                            .sources
                            .forEach( ( source ) => {
                                let haulers = Math.ceil( ( ( source.path_length + exit_path_length ) * 2 ) / ONE_HAULER_PER );

                                let path_to_room_exit = spawn.pos.findPathTo( position.getOpositeEntrancePosition( source.exit_pos, spawn.room.name ) );
                                let use_link = false;
                                if( path_to_room_exit ) {
                                    use_link = path_to_room_exit.length > LINK_THRESHOLD;
                                }

                                sources
                                    .push( {
                                        source_id: source.source_id,
                                        path_length: source.path_length,
                                        exit_path_length: exit_path_length,
                                        room_name: exit_room_name,
                                        haulers: haulers,
                                        direction: direction,
                                        source: source,
                                        use_link: use_link,
                                        _version: VERSION
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

        console.log( JSON.stringify( sources ) );

        sources = _.sortBy( sources, ( source_map_item ) => source_map_item.path_length );

        return sources[ 0 ];
    }

    _doPlan( room, spawn ) {
        let memory = this.getRoomLongDistanceMemory( room );

        if( Object.keys( memory ).length < MAX_LONG_DISTANCE_MINER ) {
            let closest_source = this.getClosestSource( room, spawn );
            console.log( 'closest_source', JSON.stringify( closest_source ) );
            memory[ closest_source.source_id ] = closest_source;

            Memory.rooms[ closest_source.room_name ]._state = Memory.rooms[ closest_source.room_name ]._state || {};
            Memory.rooms[ closest_source.room_name ]._state.type = 'long_distance';
            console.log( 'after' );
        }

        return true;
    }
}

module.exports = LongDistanceMiningPlanner;
