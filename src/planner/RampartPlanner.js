const constants = require( '~/constants' );

const ConstructionPlanner = require( './ConstructionPlanner' );

const DISTANCE = 9;

class RampartPlanner extends ConstructionPlanner {
    constructor( name, dry_run ) {
        super( name, constants.STRUCTURE_RAMPART, dry_run );
        this.color = 'green';
    }

    _getNewPositions( room, spawn ) {
        let direction = [ DISTANCE, DISTANCE ];
        let pending = [];

        for( let vert_or_horiz = 0; vert_or_horiz <= 1; vert_or_horiz++ ) {
            for( let pos_or_negative = -1; pos_or_negative <= 1; pos_or_negative += 2 ) {
                let wall_direction = direction.slice();
                wall_direction[ ( vert_or_horiz + 1 ) % 2 ] *= pos_or_negative;

                for( let z = 0 - DISTANCE; z <= DISTANCE; z++ ) {
                    wall_direction[ vert_or_horiz ] = z;

                    let position = this._directionToPosition( room, spawn.pos, wall_direction );
                    if( this.isValidConstruction( room, position, pending, [ 'road' ] ) ) {
                        pending.push( position );
                    }
                }
            }
        }

        return pending;
    }
}

module.exports = RampartPlanner;
