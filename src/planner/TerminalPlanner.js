const constants = require( '~/constants' );

const ConstructionPlanner = require( './ConstructionPlanner' );

class TerminalPlanner extends ConstructionPlanner {
    constructor( name, dry_run ) {
        super( name, constants.STRUCTURE_TERMINAL, dry_run );
    }

    _getNewPositions( room, spawn ) {
        return [ room.getPositionAt( spawn.pos.x - 1, spawn.pos.y + 1 ) ]
    }
}

module.exports = TerminalPlanner;
