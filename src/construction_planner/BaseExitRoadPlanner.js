const constants = require( '~/constants' );

const ConstructionPlanner = require( './ConstructionPlanner' );

const DISTANCES = [ 6, 7, 9 ];

const DIRECTIONS = [
    [  0, -1 ],
    [  0, +1 ],
    [ +1,  0 ],
    [ -1,  0 ]
];

class BaseExitRoadPlanner extends ConstructionPlanner {
    constructor( name, dry_run ) {
        super( name, constants.STRUCTURE_ROAD, dry_run );
    }

    _getNewPositions( room, spawn ) {
        let pending = [];

        DIRECTIONS
            .forEach( ( direction ) => {
                DISTANCES
                    .forEach( ( distance ) => {
                        let new_direction = direction.slice();
                        new_direction[ 0 ] *= distance;
                        new_direction[ 1 ] *= distance;

                        let position = this._directionToPosition( room, spawn.pos, new_direction );
                        if( this.isValidConstruction( room, position, pending, [ constants.STRUCTURE_RAMPART ] ) ) {
                            pending.push( position );
                        }
                    } );
            } )

        return pending;
    }
}

module.exports = BaseExitRoadPlanner;
