const constants = require( '~/constants' );

const SourceRoadPlanner = require( './SourceRoadPlanner' );

class ExpansionRoadPlanner extends SourceRoadPlanner {
    constructor( name, dry_run ) {
        super( name, dry_run, 1 );
    }

    getTarget( room, spawn ) {
        let construction_sites = room.find( FIND_MY_CONSTRUCTION_SITES, { filter: { structureType: STRUCTURE_SPAWN } } );
        return construction_sites[ 0 ];
    }
}

module.exports = ExpansionRoadPlanner;
