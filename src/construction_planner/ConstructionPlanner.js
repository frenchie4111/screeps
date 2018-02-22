const constants = require( '~/constants' );

class ConstructionPlanner {
    constructor( name, structure_type, dry_run=false ) {
        this.structure_type = structure_type;
        this.dry_run = dry_run;
        this.name = name;
    }

    hasRunBefore( room ) {
        if( !room.memory.hasOwnProperty( '_construction_planners' ) ) room.memory._construction_planners = {};
        return room.memory._construction_planners[ this.name ];
    }

    setHasRun( room, value ) {
        if( !room.memory.hasOwnProperty( '_construction_planners' ) ) room.memory._construction_planners = {};
        return room.memory._construction_planners[ this.name ] = value;
    }

    getNewAllowedStructureCount( room ) {
        const max_count = constants.CONTROLLER_STRUCTURES[ this.structure_type ][ room.controller.level ];

        const current_count = room
            .find( constants.FIND_MY_STRUCTURES, {
                filter: {
                    structureType: this.structure_type 
                }
            } )
            .length;

        const current_construction_site_count = room
            .find( constants.FIND_MY_CONSTRUCTION_SITES, {
                filter: {
                    structureType: this.structure_type
                }
            } )
            .length;

        return max_count - current_count - current_construction_site_count;
    };

    isValidConstruction( room, position, pending=[] ) {
        return ( 
            position && 
            room.lookAt( position ).length === 1 && 
            !_.some( pending, ( pending_location ) => position.isEqualTo( pending_location ) )
        );
    };

    _shouldCreateNewStructure( room ) {
        return !this.hasRunBefore( room );
    }

    _getNewPosition( room ) {
        throw new Error( 'Abstract Method' );
    }

    _getNewPositions( room ) {
        const pending = [];
        while( this._shouldCreateNewStructure( room ) ) {
            let position = this._getNewPosition( room, pending );
            pending.push( position );
        }
        return pending;
    }

    createConstructionSites( room ) {
        if( !this._shouldCreateNewStructure( room ) ) return;

        this
            ._getNewPositions( room )
            .forEach( ( position ) => {
                console.log( position, this.dry_run );
                if( this.dry_run ) {
                    room.visual.circle( position );
                } else {
                    console.log( position, this.structure_type );
                    let return_status = room.createConstructionSite( position, this.structure_type );
                    if( return_status !== constants.OK ) {
                        console.log( 'createConstructionSite non OK status', return_status );
                    }
                }
            } );

        this.setHasRun( room, true );
    }
}

module.exports = ConstructionPlanner;
