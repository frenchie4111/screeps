const constants = require( '~/constants' );

const ConstructionPlanner = require( './ConstructionPlanner' );

class ExtensionTreePlanner extends ConstructionPlanner {
    constructor( name, dry_run=false ) {
        super( name, constants.STRUCTURE_EXTENSION, dry_run );
        this.color = 'purple'
    }

    _shouldCreateNewStructure( room, spawn, pending=[] ) {
        return (
            ( !this.hasRunBefore( room ) )
        );
    }

    getNewAllowedStructureCount( room ) {
        if( this.override_count ) return this.override_count;
        return super.getNewAllowedStructureCount( room );
    }

    _getExtensionPositionsForRoad( road_x1, road_y1, road_x2, road_y2 ) {
        if( ( road_x2 - road_x1 ) !== ( road_y2 - road_y2 ) ) throw new Error( 'Should be square' );

        
    }

    _getNewPositions( room, spawn ) {
    }
}

module.exports = ExtensionTreePlanner;

describe( 'ExtensionTreePlanner', () => {
    describe( '_getExtensionPositionsForRoad', () => {
        it( 'should only accept square', () => {
            assert( 'test' );
        } );
    } );
} );
