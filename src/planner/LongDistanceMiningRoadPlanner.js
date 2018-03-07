const map = require( '~/lib/map' ),
    position = require( '~/lib/position' );

const constants = require( '~/constants' );

const ConstructionPlanner = require( './ConstructionPlanner' );

let cache = {};

const BASE_EXITS = [
    [  0, -9 ],
    [  0, +9 ],
    [ +9,  0 ],
    [ -9,  0 ]
];

class LongDistanceMiningRoadPlanner extends ConstructionPlanner {
    constructor( name, long_distance_operation, dry_run ) {
        super( name, constants.STRUCTURE_ROAD, dry_run );
        this.long_distance_operation = long_distance_operation;
        this.rerun_on_fail = false;
    }

    _getNewPositions( room, spawn ) {
        if( cache.hasOwnProperty( this.name ) ) {
            return cache[ this.name ];
        }

        const room_exit_pos = position.getOpositeEntrancePosition( this.long_distance_operation.source.exit_pos, room.name );

        let base_exit_poses = _.map( BASE_EXITS, ( exit_dir ) => position.directionToPosition( spawn.pos, exit_dir ) );
        const closest_base_exit_pos = room_exit_pos.findClosestByPath( base_exit_poses );

        const path = closest_base_exit_pos.findPathTo( room_exit_pos );

        let path_pos = _
            .map( path, ( pos ) => {
                return position
                    .fromJSON( {
                        x: pos.x,
                        y: pos.y,
                        roomName: room.name
                    } );
            } );

        cache[ this.name ] = path_pos;
        return path_pos;
    }
}

module.exports = LongDistanceMiningRoadPlanner;
