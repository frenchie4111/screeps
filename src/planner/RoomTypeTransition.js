const constants = require( '~/constants' );

const Planner = require( './Planner' );

class ExpansionSpawnPlanner extends Planner {
    constructor( name, new_type, dry_run ) {
        super( name, dry_run );
        this.new_type = new_type;
    }

    _doPlan( room, spawn ) {
        if( !this.new_type ) return;
        room.memory.type = this.new_type;
    }
}

module.exports = ExpansionSpawnPlanner;
