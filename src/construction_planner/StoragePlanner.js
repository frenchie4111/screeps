const constants = require( '~/constants' );

const ConstructionPlanner = require( './ConstructionPlanner' );

class StoragePlanner extends ConstructionPlanner {
    constructor( name, dry_run ) {
        super( name, constants.STRUCTURE_STORAGE, dry_run );
    }

    _getNewPositions( room, spawn ) {
        return [ room.getPositionAt( spawn.pos.x, spawn.pos.y + 2 ) ]
    }
}

module.exports = StoragePlanner;
