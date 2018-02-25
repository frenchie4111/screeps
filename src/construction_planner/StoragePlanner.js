const constants = require( '~/constants' );

const ConstructionPlanner = require( './ConstructionPlanner' );

class StoragePlanner extends ConstructionPlanner {
    constructor( name, spawn, dry_run ) {
        super( name, constants.STRUCTURE_STORAGE, dry_run );
        this.spawn = spawn;
    }

    _getNewPositions( room ) {
        return [ room.getPositionAt( this.spawn.pos.x, this.spawn.pos.y + 2 ) ]
    }
}

module.exports = StoragePlanner;
