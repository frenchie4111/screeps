const constants = require( '~/constants' );

const ConstructionPlanner = require( './ConstructionPlanner' );

class FirstTowerPlanner extends ConstructionPlanner {
    constructor( name, dry_run ) {
        super( name, constants.STRUCTURE_TOWER, dry_run );
    }

    _getNewPositions( room, spawn ) {
        return [ room.getPositionAt( spawn.pos.x, spawn.pos.y - 2 ) ]
    }
}

module.exports = FirstTowerPlanner;
