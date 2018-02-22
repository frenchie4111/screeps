const constants = require( '~/constants' );

const ConstructionPlanner = require( './ConstructionPlanner' );

const MAX_DIST = 4;

const DIRECTIONS = [
    [ -1, -1 ],
    [ -1, 1 ],
    [ 1, 1 ],
    [ 1, -1 ]
];

class ExtensionPlanner extends ConstructionPlanner {
    constructor( name, spawn ) {
        super( name, constants.STRUCTURE_EXTENSION );
        this.spawn = spawn;
    }

    _shouldCreateNewStructure( room ) {
        return this.getNewAllowedStructureCount( room ) > 0;
    }

    _getNewPosition( room, pending=[] ) {
        let start_pos = this.spawn.pos;

        for( let curr_dist = 1; curr_dist <= MAX_DIST; curr_dist++ ) {  
            for( let direction_i in DIRECTIONS ) {
                let direction = DIRECTIONS[ direction_i ];
                let position = room.getPositionAt( start_pos.x + ( direction[ 0 ] * curr_dist ), start_pos.y + ( direction[ 1 ] * curr_dist ) );
                if( this.isValidConstruction( room, position, pending ) ) {
                    return position;
                }
            }
        }
    }
}

module.exports = ExtensionPlanner;
