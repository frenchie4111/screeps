const constants = require( '~/constants' );

const position = require( '~/lib/position' );

const ConstructionPlanner = require( './ConstructionPlanner' );

class ControllerLinkPlanner extends ConstructionPlanner {
    constructor( name, dry_run ) {
        super( name, constants.STRUCTURE_LINK, dry_run );
        this.color = 'orange';
    }

    _getNewPositions( room, spawn ) {
        let path_to_controller = spawn.pos.findPathTo( room.controller.pos );
        let link_pos = room.getPositionAt( path_to_controller[ path_to_controller.length - 2 ].x, path_to_controller[ path_to_controller.length - 2 ].y );

        let step_direction = room.controller.pos.getDirectionTo( link_pos );
        link_pos = position.intDirectionToPosition( link_pos, step_direction );

        return [ link_pos ];
    }
}

module.exports = ControllerLinkPlanner;
