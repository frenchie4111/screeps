const constants = require( '~/constants' );

const ConstructionPlanner = require( './ConstructionPlanner' );

let DIRECTIONS = [
    [ -1, 0 ],
    [ 1, 0 ],
    [ 0, 1 ],
    [ 0, -1 ]
];

class ExtensionRoadPlanner extends ConstructionPlanner {
    constructor( name, dry_run ) {
        super( name, constants.STRUCTURE_ROAD, dry_run );
        this.rerun_on_fail = false;
    }

    _getNewPositions( room, spawn ) {
        let extensions = room
            .find( constants.FIND_MY_STRUCTURES, {
                filter: {
                    structureType: constants.STRUCTURE_EXTENSION
                }
            } );

        let extension_construction_sites = room
            .find( constants.FIND_MY_CONSTRUCTION_SITES, {
                filter: {
                    structureType: constants.STRUCTURE_EXTENSION
                }
            } );

        extensions = extensions.concat( extension_construction_sites );

        let positions = [];

        extensions
            .forEach( ( extension ) => {
                DIRECTIONS
                    .forEach( ( direction ) => {
                        let position = room.getPositionAt( extension.pos.x + direction[ 0 ], extension.pos.y + direction[ 1 ] );

                        console.log( position );
                        if( this.isValidConstruction( room, position, positions ) ) {
                            positions.push( position );
                        }
                    } );
            } );

        return positions;
    }
}

module.exports = ExtensionRoadPlanner;
