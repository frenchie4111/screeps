const constants = require( '~/constants' );

const ConstructionPlanner = require( './ConstructionPlanner' );

class ContainerPlanner extends ConstructionPlanner {
    constructor( name, dry_run, max_sources=2 ) {
        super( name, constants.STRUCTURE_CONTAINER, dry_run );
        this.max_sources = max_sources;
    }

    _getNewPositions( room, spawn, pending=[] ) {
        let sources = room.find( FIND_SOURCES );

        sources = sources
            .map( ( source ) => {
                let path = spawn.pos
                    .findPathTo( source, {
                        ignoreCreeps: true
                    } );

                return {
                    source: source,
                    path: path
                }
            } );

        sources = _.sortBy( sources, ( source ) => source.path.length ).reverse();

        let positions = [];
        for( let i = 0; i < sources.length && i < this.max_sources; i++ ) {
            positions.push( sources[ i ].path[ sources[ i ].path.length - 2 ] );
        }

        positions = positions
            .map( ( position ) => {
                return new RoomPosition( position.x, position.y, room.name );
            } );

        return positions;
    }
}

module.exports = ContainerPlanner;
