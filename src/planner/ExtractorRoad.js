const constants = require( '~/constants' );

const SourceRoadPlanner = require( './SourceRoadPlanner' );

class ControllerSourceRoad extends SourceRoadPlanner {
    getSources( room, spawn ) {
        const minerals = room.find( FIND_MINERALS );

        return [ 
            {
                source: minerals[ 0 ],
                path: spawn.pos.findPathTo( minerals[ 0 ] )
            }
        ];
    }

    _shouldCreateNewStructure( room, spawn, pending ) {
        const minerals = room.find( FIND_MINERALS );
        return !this.hasRunBefore( room ) && minerals.length > 0;
    }
}

module.exports = ControllerSourceRoad;
