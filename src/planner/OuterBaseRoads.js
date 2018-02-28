const constants = require( '~/constants' );

const ConstructionPlanner = require( './ConstructionPlanner' );

const DISTANCES = [ 8, 5 ];
const CORNER_DISTANCES = [ 7, 6 ]

const CORNERS = [
    [ -1, -1 ],
    [ -1, +1 ],
    [ +1, -1 ],
    [ +1, +1 ]
];

class OuterBaseRoads extends ConstructionPlanner {
    constructor( name, dry_run ) {
        super( name, constants.STRUCTURE_ROAD, dry_run );
    }

    _getNewPositions( room, spawn ) {
        let pending = [];

        DISTANCES
            .forEach( ( distance ) => {
                let direction = [ distance, distance ];

                for( let vert_or_horiz = 0; vert_or_horiz <= 1; vert_or_horiz++ ) {
                    for( let pos_or_negative = -1; pos_or_negative <= 1; pos_or_negative += 2 ) {
                        let wall_direction = direction.slice();
                        wall_direction[ ( vert_or_horiz + 1 ) % 2 ] *= pos_or_negative;

                        for( let z = 0 - distance; z <= distance; z++ ) {
                            wall_direction[ vert_or_horiz ] = z;

                            let position = this._directionToPosition( room, spawn.pos, wall_direction );
                            if( this.isValidConstruction( room, position, pending ) ) {
                                pending.push( position );
                            }
                        }
                    }
                }
            } );

        CORNER_DISTANCES
            .forEach( ( corner_distance ) => {
                CORNERS
                    .forEach( ( corner ) => {
                        let corner_clone = corner.slice();
                        corner_clone[ 0 ] *= corner_distance;
                        corner_clone[ 1 ] *= corner_distance;

                        let position = this._directionToPosition( room, spawn.pos, corner_clone );
                        if( this.isValidConstruction( room, position, pending ) ) {
                            pending.push( position );
                        }
                    } );
            } );
        

        return pending;
    }
}

module.exports = OuterBaseRoads;
