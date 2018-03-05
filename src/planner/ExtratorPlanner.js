const constants = require( '~/constants' );

const ConstructionPlanner = require( './ConstructionPlanner' );

class ExtratorPlanner extends ConstructionPlanner {
    constructor( name, dry_run ) {
        super( name, constants.STRUCTURE_EXTRACTOR, dry_run );
    }

    _shouldCreateNewStructure( room, spawn, pending ) {
        const minerals = room.find( FIND_MINERALS );
        return !this.hasRunBefore( room ) && minerals.length > 0;
    }

    _getNewPositions( room, spawn ) {
        const minerals = room.find( FIND_MINERALS );
        return [ room.getPositionAt( minerals[ 0 ].pos.x, minerals[ 0 ].pos.y ) ]
    }
}

module.exports = ExtratorPlanner;
