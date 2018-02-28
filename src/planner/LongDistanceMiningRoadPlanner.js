const map = require( '~/lib/map' ),
    position = require( '~/lib/position' );

const constants = require( '~/constants' );

const ConstructionPlanner = require( './ConstructionPlanner' );

const BASE_EXITS = [
    [  0, -9 ],
    [  0, +9 ],
    [ +9,  0 ],
    [ -9,  0 ]
];

let cache = null;

class LongDistanceMiningRoadPlanner extends ConstructionPlanner {
    constructor( name, long_distance_operation, dry_run ) {
        super( name, constants.STRUCTURE_ROAD, dry_run );
        this.long_distance_operation = long_distance_operation;
        this.rerun_on_fail = false;
    }

    _getNewPositions( room, spawn ) {
        if( cache ) {
            console.log( 'cached' );
            return cache;
        }

        let target_room = map.getRoom( this.long_distance_operation.room_name );

        let target_source = _.find( target_room.sources, ( source ) => source.source_id === this.long_distance_operation.source_id );
        if( !target_source ) throw new Error( 'Couldnt find source in room on map' );
        let target_source_pos = position.fromJSON( target_source.pos );
        
        let map_exit = spawn.pos.findClosestByPath( +this.long_distance_operation.direction );
        let potential_base_exits = BASE_EXITS.map( ( direction ) => this._directionToPosition( room, spawn.pos, direction ) );
        let base_exit_point = map_exit.findClosestByPath( potential_base_exits );
        let positions = target_source_pos.findPathTo( base_exit_point );

        positions = positions
            .map( ( position ) => {
                console.log( JSON.stringify( position ) );
                position = new RoomPosition( position.x, position.y, room.name )
                if( this.isValidConstruction( room, position ) ) {
                    return position;
                }
            } );

        cache = positions;
        return positions;
    }
}

module.exports = LongDistanceMiningRoadPlanner;
