const constants = require( '~/constants' );

const ConstructionPlanner = require( './ConstructionPlanner' );

class ContainerPlanner extends ConstructionPlanner {
    constructor( name, spawn, dry_run ) {
        super( name, constants.STRUCTURE_ROAD, true );
        this.name = name;
        this.spawn = target;
    }

    _getNewPositions( room, pending=[] ) {
        let sources = room.find( FIND_SOURCES );

        sources = sources
            .map( ( source ) => {
                let path = this.target.pos
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
            positions = positions.concat( sources[ i ].path );
        }

        positions = positions
            .map( ( position ) => {
                return new RoomPosition( position.x, position.y, room.name );
            } );

        return positions;
    }
}

module.exports = ContainerPlanner;
