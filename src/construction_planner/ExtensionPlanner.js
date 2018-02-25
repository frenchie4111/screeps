const constants = require( '~/constants' );

const ConstructionPlanner = require( './ConstructionPlanner' );

const MAX_DIST = 4;
const MAX_FAR_DIST = 7;
const CONSIDER_CORNERS_AFTER = 2;

const DIRECTIONS = [
    [ -1, -1 ],
    [ -1, 1 ],
    [ 1, 1 ],
    [ 1, -1 ]
];

const IGNORE_DIRECTIONS = [
    [ -2, -4 ],
    [ +2, -4 ],
];

class ExtensionPlanner extends ConstructionPlanner {
    constructor( name, spawn, dry_run=false ) {
        super( name, constants.STRUCTURE_EXTENSION, dry_run );
        this.spawn = spawn;
        this._direction_lists = {};
    }

    _shouldCreateNewStructure( room, pending=[] ) {
        return (
            ( !this.hasRunBefore( room ) ) &&
            ( this.getNewAllowedStructureCount( room ) - pending.length ) > 0
        );
    }

    shouldIgnoreDirection( direction ) {
        let ignore_directions = _
            .filter( IGNORE_DIRECTIONS, ( ignore_dir ) => {
                return (
                    direction[ 0 ] === ignore_dir[ 0 ] &&
                    direction[ 1 ] === ignore_dir[ 1 ]
                );
            } );
        return ignore_directions.length > 0;
    }

    _generateFarDirectionList( dist ) {
        if( dist <= ( MAX_DIST + 1 ) ) {
            return [];
        }
        if( this._direction_lists[ dist ] ) {
            return this._direction_lists[ dist ];
        }

        let direction = [ dist, dist ];
        let direction_list = [];

        let center_size = 1;
        let wall_size = 4;

        for( let vert_or_horiz = 0; vert_or_horiz <= 1; vert_or_horiz++ ) {
            for( let pos_or_negative = -1; pos_or_negative <= 1; pos_or_negative += 2 ) {
                let wall_direction = direction.slice();
                wall_direction[ ( vert_or_horiz + 1 ) % 2 ] *= pos_or_negative;

                for( let z = 0 - wall_size; z <= wall_size; z++ ) {
                    if( Math.abs( z ) < center_size ) {
                        continue;
                    }

                    wall_direction[ vert_or_horiz ] = z;

                    direction_list.push( wall_direction.slice() );
                }
            }
        }

        direction_list = _.filter( direction_list, ( dir ) => !this.shouldIgnoreDirection( dir ) );

        return direction_list;
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

        direction_list = _.filter( direction_list, ( dir ) => !this.shouldIgnoreDirection( dir ) );

        this._direction_lists[ dist ] = direction_list;
        return direction_list;
    }

    _getNewPosition( room, pending=[] ) {
        let start_pos = this.spawn.pos;

        for( let curr_dist = 1; curr_dist <= MAX_FAR_DIST; curr_dist++ ) {  
            let direction_list;
            if( curr_dist <= MAX_DIST ) {
                direction_list = this._generateDirectionList( curr_dist );
            } else {
                direction_list = this._generateFarDirectionList( curr_dist );
            }

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
