const constants = require( '~/constants' );

const ConstructionPlanner = require( './ConstructionPlanner' );

class SpawnRoadPlanner extends ConstructionPlanner {
    constructor( name, dry_run ) {
        super( name, constants.STRUCTURE_ROAD, dry_run );
        this.rerun_on_fail = false;
    }

    _getNewPositions( room, spawn ) {
        return [
            room.getPositionAt( spawn.pos.x - 1, spawn.pos.y + 1 ),
            room.getPositionAt( spawn.pos.x, spawn.pos.y + 1 ),
            room.getPositionAt( spawn.pos.x + 1, spawn.pos.y + 1 ),

            room.getPositionAt( spawn.pos.x - 1, spawn.pos.y ),
            room.getPositionAt( spawn.pos.x + 1, spawn.pos.y ),

            room.getPositionAt( spawn.pos.x - 1, spawn.pos.y - 1 ),
            room.getPositionAt( spawn.pos.x, spawn.pos.y - 1 ),
            room.getPositionAt( spawn.pos.x + 1, spawn.pos.y - 1 ),
        ]
    }
}

module.exports = SpawnRoadPlanner;
