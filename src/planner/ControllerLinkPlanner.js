const constants = require( '~/constants' );

const ConstructionPlanner = require( './ConstructionPlanner' );

class ControllerLinkPlanner extends ConstructionPlanner {
    constructor( name, dry_run ) {
        super( name, constants.STRUCTURE_LINK, dry_run );
    }

    _getNewPositions( room, spawn ) {
        let path_to_controller = spawn.pos.findPathTo( room.controller.pos );
        return [ room.getPositionAt( path_to_controller[ path_to_controller.length - 2 ].x, path_to_controller[ path_to_controller.length - 2 ].y ) ]
    }
}

module.exports = ControllerLinkPlanner;
