const constants = require( '~/constants' );

const ConstructionPlanner = require( './ConstructionPlanner' );

const DIRECTIONS = [
    [  0, -2 ],
    [ -2, -4 ],
    [ +2, -4 ],
];


class FirstTowerPlanner extends ConstructionPlanner {
    constructor( name, dry_run ) {
        super( name, constants.STRUCTURE_TOWER, dry_run );
    }

    _getNewPosition( room, spawn, pending ) {
        for( let direction_i in DIRECTIONS ) {
            let direction = DIRECTIONS[ direction_i ];
            let position = this._directionToPosition( room, spawn.pos, direction );
            if( this.isValidConstruction( room, position, pending ) ) {
                return position;
            }
        }
    }
}

module.exports = FirstTowerPlanner;
