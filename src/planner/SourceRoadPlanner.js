const constants = require( '~/constants' );

const ConstructionPlanner = require( './ConstructionPlanner' );

class SourceRoadPlanner extends ConstructionPlanner {
    constructor( name, dry_run, max_sources=2 ) {
        super( name, constants.STRUCTURE_ROAD, dry_run );
        this.max_sources = max_sources;
        this.rerun_on_fail = false;
    }

    getSources( room, target ) {
        let sources = room.find( FIND_SOURCES );

        sources = sources
            .map( ( source ) => {
                let path = target.pos
                    .findPathTo( source, {
                        ignoreCreeps: true,
                        swampCost: 1
                    } );

                return {
                    source: source,
                    path: path
                }
            } );

        sources = _.sortBy( sources, ( source ) => source.path.length );

        return sources;
    }

    getTarget( room, spawn ) {
        return spawn;
    }

    _getNewPositions( room, spawn, pending=[] ) {
        const target = this.getTarget( room, spawn );
        const sources = this.getSources( room, target );

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

module.exports = SourceRoadPlanner;
