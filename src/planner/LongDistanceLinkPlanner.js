const map = require( '~/lib/map' ),
    position = require( '~/lib/position' );

const constants = require( '~/constants' );

const ConstructionPlanner = require( './ConstructionPlanner' );

let cache = {};

const MAX_DIST = 3;

class LongDistanceLinkPlanner extends ConstructionPlanner {
    constructor( name, long_distance_operation, dry_run ) {
        super( name, constants.STRUCTURE_LINK, dry_run );
        this.long_distance_operation = long_distance_operation;
        this.rerun_on_fail = false;
    }

    _getNewPositions( room, spawn ) {
        const room_exit_pos = position.getOpositeEntrancePosition( this.long_distance_operation.source.exit_pos, room.name );

        const oposite_direction_int = position.getOpositeDirection( this.long_distance_operation.direction );
        const oposite_direction = position.directionFromIntDirection( oposite_direction_int );

        oposite_direction[ 0 ] *= 3;
        oposite_direction[ 1 ] *= 3;

        const rot_90_dir = position.normalizeDir( oposite_direction_int + 2 );
        const rot_neg_90_dir = position.normalizeDir( oposite_direction_int - 2 );

        for( let dist = 0; dist <= MAX_DIST; dist++ ) {
            const dirs = [
                position.directionFromIntDirection( rot_neg_90_dir ),
                position.directionFromIntDirection( rot_90_dir )
            ];

            for( let dir_i = 0; dir_i < dirs.length; dir_i++ ) {
                let dir = dirs[ dir_i ];
                dir[ 0 ] *= dist;
                dir[ 1 ] *= dist;
                dir = position.mergeDirs( dir, oposite_direction );

                let pos = position.directionToPosition( room_exit_pos, dir );

                if( position.inRoom( pos ) && this.isValidConstruction( room, pos ) ) {
                    return [ pos ];
                }
            }
        }
    }
}

module.exports = LongDistanceLinkPlanner;
