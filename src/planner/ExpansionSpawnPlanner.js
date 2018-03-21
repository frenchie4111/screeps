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

        let response = room.createConstructionSite( flag.pos.x, flag.pos.y, STRUCTURE_SPAWN, 'spawn-' + flag.room.name + '-1' );
        if( response !== OK ) {
            console.log( 'ExpansionSpawnPlanner non OK', constants.lookup( response ), flag.pos.x, flag.pos.y, STRUCTURE_SPAWN, 'spawn-' + flag.room.name + '-1' );
            return false;
        }
        flag.remove();
    }
}

module.exports = ExpansionSpawnPlanner;
