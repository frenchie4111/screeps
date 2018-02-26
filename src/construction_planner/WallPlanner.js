const constants = require( '~/constants' );

const ConstructionPlanner = require( './ConstructionPlanner' );

const DISTANCE = 9;

class WallPlanner extends ConstructionPlanner {
    constructor( name, dry_run ) {
        super( name, constants.STRUCTURE_WALL, dry_run );
    }

    _nearThing( room, position ) {
        let things = room.lookAtArea( position.y - 1, position.x - 1, position.y + 1, position.x + 1, true );
        
        things = _.filter( things, this.filterForConstructionBlockers );
        things = _
            .filter( things, ( thing ) => {
                return thing.type !== 'terrain';
            } );

        return things.length > 0;
    }

    _getNewPositions( room, spawn ) {
        let direction = [ DISTANCE, DISTANCE ];
        let pending = [];
        let debug = [];
        let center_size = 2;

        for( let vert_or_horiz = 0; vert_or_horiz <= 1; vert_or_horiz++ ) {
            for( let pos_or_negative = -1; pos_or_negative <= 1; pos_or_negative += 2 ) {
                let wall_direction = direction.slice();
                wall_direction[ ( vert_or_horiz + 1 ) % 2 ] *= pos_or_negative;

                for( let z = 0 - DISTANCE; z <= DISTANCE; z++ ) {
                    if( Math.abs( z ) < center_size ) {
                        console.log( 'Skipping', z );
                        continue;
                    }

                    wall_direction[ vert_or_horiz ] = z;

                    let position = this._directionToPosition( room, spawn.pos, wall_direction );
                    if( this.isValidConstruction( room, position, pending ) && !this._nearThing( room, position ) ) {
                        pending.push( position );
                    }
                }
            }
        }

        return pending;
    }
}

module.exports = WallPlanner;
