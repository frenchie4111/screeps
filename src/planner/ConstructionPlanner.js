const constants = require( '~/constants' );

const Planner = require( './Planner' );

class ConstructionPlanner extends Planner {
    constructor( name, structure_type, dry_run=false ) {
        super( name, dry_run );

        this.name = name;
        this.structure_type = structure_type;
        this.color = 'red';
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

    filterForConstructionBlockers( thing ) {
        return (
            [ 'creep' ].indexOf( thing.type ) === -1 &&
            [ 'plain', 'swamp' ].indexOf( thing.terrain ) === -1
        );
    }

    isValidConstruction( room, position, pending=[], ignore_structures=[] ) {
        let things = room.lookAt( position );
        things = _.filter( things, this.filterForConstructionBlockers )
        things = _
            .filter( things, ( thing ) => {
                if( thing.type === 'structure' ) {
                    return ignore_structures.indexOf( thing.structure.structureType ) === -1;
                }
                return true;
            } );

        return ( 
            position && 
            things.length === 0 && 
            !_.some( pending, ( pending_location ) => position.isEqualTo( pending_location ) )
        );
    };

    _directionToPosition( room, start_pos, direction ) {
        return room.getPositionAt( start_pos.x + direction[ 0 ], start_pos.y + direction[ 1 ] );
    }

    _shouldCreateNewStructure( room, spawn, pending ) {
        return !this.hasRunBefore( room );
    }

    shouldRun( room, spawn ) {
        return this._shouldCreateNewStructure( room, spawn );
    }

    _getNewPosition( room, spawn, pending ) {
        throw new Error( 'Abstract Method' );
    }

    _getNewPositions( room, spawn ) {
        const pending = [];
        while( this._shouldCreateNewStructure( room, spawn, pending ) ) {
            let position = this._getNewPosition( room, spawn, pending );
            if( !position ) {
                console.log( 'Ran out of places' );
                break;
            }
            pending.push( position );
        }
        return pending;
    }

    _doPlan( room, spawn ) {
        if( !this._shouldCreateNewStructure( room ) ) return;

        let succeeded = true;

        let new_positions = this._getNewPositions( room, spawn );
    
        console.log( 'New Position Count', new_positions.length );
    
        new_positions
            .forEach( ( position ) => {
                if( this.dry_run ) {
                    room.visual
                        .circle( position, {
                            fill: this.color,
                            radius: 0.3
                        } );
                } else {
                    console.log( position, this.structure_type );
                    let return_status = room.createConstructionSite( position, this.structure_type );
                    if( return_status !== constants.OK ) {
                        console.log( 'createConstructionSite non OK status', return_status, constants.lookup( return_status ) );
                        succeeded = false;
                    }
                }
            } );

        return succeeded;
    }
}

module.exports = ConstructionPlanner;
