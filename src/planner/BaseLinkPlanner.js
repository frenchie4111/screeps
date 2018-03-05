const constants = require( '~/constants' );

const ConstructionPlanner = require( './ConstructionPlanner' );

class BaseLinkPlanner extends ConstructionPlanner {
    constructor( name, dry_run ) {
        super( name, constants.STRUCTURE_LINK, dry_run );
    }

    _getNewPositions( room, spawn ) {
        return [ room.getPositionAt( spawn.pos.x + 1, spawn.pos.y + 1 ) ]
    }
}

module.exports = BaseLinkPlanner;
