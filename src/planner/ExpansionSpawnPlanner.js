const constants = require( '~/constants' );

const Planner = require( './Planner' );

class ExpansionSpawnPlanner extends Planner {
    constructor( name, dry_run ) {
        super( name, dry_run );
    }

    _doPlan( room, spawn ) {
        let flags = room
            .find( FIND_FLAGS, {
                filter: {
                    name: 'spawn'
                }
            } );

        if( !flags || flags.length === 0 ) return;
        let flag = flags[ 0 ];

        room.createConstructionSite( flag.pos, STRUCTURE_SPAWN );
        flag.remove();
    }
}

module.exports = ExpansionSpawnPlanner;
