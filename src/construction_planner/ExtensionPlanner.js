const constants = require( '~/constants' );

const ConstructionPlanner = require( './ConstructionPlanner' );

const MAX_DIST = 4;
const CONSIDER_CORNERS_AFTER = 2;

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
        this._direction_lists = {};
    }

    _shouldCreateNewStructure( room, pending=[] ) {
        return (
            ( !this.hasRunBefore( room ) ) &&
            ( this.getNewAllowedStructureCount( room ) - pending.length ) > 0
        );
    }

    _generateDirectionList( dist ) {
        if( this._direction_lists[ dist ] ) {
            return this._direction_lists[ dist ];
        }

        let direction_list = [];

        for( let direction_i in DIRECTIONS ) {
            let direction = DIRECTIONS[ direction_i ].slice();
            direction[ 0 ] *= dist;
            direction[ 1 ] *= dist;

            // Corner
            direction_list.push( direction );

            if( dist <= CONSIDER_CORNERS_AFTER ) {
                continue;
            }

            // Sides, increment in x and y direction towards center

            for( let dir_to_increment = 0; dir_to_increment < 2; dir_to_increment++ ) {
                let side_direction = direction.slice();

                let start = Math.abs( direction[ dir_to_increment ] );
                let ceil_or_floor = start > 0 ? Math.floor : Math.ceil;
                let position_count = ceil_or_floor( start / 2 );

                for( let i = 0; i < position_count; i++ ) {
                    if( side_direction[ dir_to_increment ] > 0 ) {
                        side_direction[ dir_to_increment ] -= 2;
                    } else {
                        side_direction[ dir_to_increment ] += 2;
                    }

                    direction_list.push( side_direction.slice() );
                }

            }
        }

        this._direction_lists[ dist ] = direction_list;
        return direction_list;
    }

    _directionToPosition( room, start_pos, direction ) {
        return room.getPositionAt( start_pos.x + direction[ 0 ], start_pos.y + direction[ 1 ] );
    }

    _getNewPosition( room, pending=[] ) {
        let start_pos = this.spawn.pos;

        for( let curr_dist = 1; curr_dist <= MAX_DIST; curr_dist++ ) {  
            let direction_list = this._generateDirectionList( curr_dist );

            for( let direction_list_i in direction_list ) {
                let direction = direction_list[ direction_list_i ];

                let position = this._directionToPosition( room, start_pos, direction );
                if( this.isValidConstruction( room, position, pending ) ) {
                    return position;
                }
            }
        }
    }
}

module.exports = ExtensionPlanner;
