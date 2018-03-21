const constants = require( '~/constants' );

const ConstructionPlanner = require( './ConstructionPlanner' );

class BoostLabPlanner extends ConstructionPlanner {
    constructor( name, dry_run ) {
        super( name, constants.STRUCTURE_LAB, dry_run );
    }

    _getNewPositions( room, spawn ) {
        return [ room.getPositionAt( spawn.pos.x - 1, spawn.pos.y + 2 ) ]
    }
}

module.exports = BoostLabPlanner;
