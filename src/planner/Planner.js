const constants = require( '~/constants' );

class ConstructionPlanner {
    constructor( name, dry_run=false ) {
        this.dry_run = dry_run;
        this.name = name;
        this.rerun_on_fail = true;
    }

    hasRunBefore( room ) {
        if( !room.memory.hasOwnProperty( '_planners' ) ) room.memory._planners = {};
        return room.memory._planners[ this.name ];
    }

    setHasRun( room, value ) {
        if( !room.memory.hasOwnProperty( '_planners' ) ) room.memory._planners = {};
        return room.memory._planners[ this.name ] = value;
    }

    shouldRun( room, spawn ) {
        return !this.hasRunBefore( room, spawn );
    }

    _doPlan( room, spawn ) {
        throw new Error( 'Abstract Method' );
    }

    doPlan( room, spawn ) {
        if( this.shouldRun( room, spawn ) ) {
            const succeeded = this._doPlan( room, spawn );

            if( ( !this.rerun_on_fail || succeeded ) && !this.dry_run ) {
                this.setHasRun( room, true );
            }
        }
    }
}

module.exports = ConstructionPlanner;
