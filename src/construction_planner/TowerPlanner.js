const constants = require( '~/constants' );

const ConstructionPlanner = require( './ConstructionPlanner' );

const POSITIONS = [
    [  0, -2 ],
    [ -2, -4 ],
    [ +2, -4 ],
];


class FirstTowerPlanner extends ConstructionPlanner {
    constructor( name, dry_run ) {
        super( name, constants.STRUCTURE_TOWER, dry_run );
    }

    _getNewPosition( room, spawn ) {
        return [ room.getPositionAt( spawn.pos.x, spawn.pos.y - 2 ) ]
    }
}

module.exports = FirstTowerPlanner;
