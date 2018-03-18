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

    _getExtensionPositionsForRoad( road_pos1, road_pos2 ) {
        if( ( road_pos1.x - road_pos2.x ) !== ( road_pos1.y - road_pos2.y ) ) throw new Error( 'Should be square' );

        
    }

    _getNewPositions( room, spawn ) {
    }
}

module.exports = ExtensionTreePlanner;

describe( 'ExtensionTreePlanner', () => {
    describe( '_getExtensionPositionsForRoad', () => {
        let planner = null;
        let room = null;

        beforeEach( () => {
            planner = new ExtensionTreePlanner( 'test-planner', false );
        } );

        it( 'should only accept square', () => {
            assert.throws( () => {
                planner._getExtensionPositionsForRoad( new RoomPosition( 1, 1, 'test' ), new RoomPosition( 3, 2, 'test' ) );
            } );
        } );

        const assertCorrect = ( positions, correct ) => {
            correct = correct.slice();

            _
                .forEach( positions, ( position ) => {
                    let found_correct_i = _
                        .findIndex( correct, ( correct_item ) => {
                            return (
                                correct_item[ 0 ] === position.x &&
                                correct_item[ 1 ] === position.y
                            );
                        } );

                    assert.isDefined( found_correct_i, 'Should be able to find in correct' );
                    assert.isNotNull( found_correct_i, 'Should be able to find in correct' );
                    assert.notEqual( found_correct_i, -1, 'Should be able to find in correct' );

                    correct.splice( found_correct_i, 1 );
                } );

            assert.equal( correct.length, 0, 'Should have no more correct' );
        };

        describe( 'test assertCorrect()', () => {
            it( 'valid', () => {
                let correct = [ [ 1, 2 ], [ 2, 1 ] ];
                let positions = [ new RoomPosition( 1, 2, 'test' ), new RoomPosition( 2, 1, 'test' ) ];
                assertCorrect( positions, correct );
            } );

            it( 'invalid: different value', () => {
                let correct = [ [ 1, 3 ], [ 2, 1 ] ];
                let positions = [ new RoomPosition( 1, 2, 'test' ), new RoomPosition( 2, 1, 'test' ) ];
                assert.throws( () => {
                    assertCorrect( positions, correct );
                } );
            } );

            it( 'invalid: more correct', () => {
                let correct = [ [ 1, 2 ], [ 2, 1 ], [ 1, 1 ] ];
                let positions = [ new RoomPosition( 1, 2, 'test' ), new RoomPosition( 2, 1, 'test' ) ];
                assert.throws( () => {
                    assertCorrect( positions, correct );
                } );
            } );

            it( 'invalid: less correct', () => {
                let correct = [ [ 1, 2 ] ];
                let positions = [ new RoomPosition( 1, 2, 'test' ), new RoomPosition( 2, 1, 'test' ) ];
                assert.throws( () => {
                    assertCorrect( positions, correct );
                } );
            } );
        } );

        it( 'basic one size road', () => {
            let correct = [
                [ 1, 2 ],
                [ 2, 1 ],
            ];

            let positions = planner._getExtensionPositionsForRoad( new RoomPosition( 1, 1, 'test' ), new RoomPosition( 2, 2, 'test' ) );

            assertCorrect( positions, correct );
        } );
    } );
} );
