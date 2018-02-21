const constants = require( '~/constants' );

const ConstructionPlanner = require( './ConstructionPlanner' );

const MAX_DIST = 4;

const DIRECTIONS = [
    [ -1, -1 ],
    [ -1, 1 ],
    [ 1, 1 ],
    [ 1, -1 ]
];

class SourceRoadPlanner extends ConstructionPlanner {
    constructor( name, target, dry_run, max_sources=2 ) {
        super( constants.STRUCTURE_ROAD, dry_run );
        this.name = name;
        this.target = target;
        this.max_sources = max_sources;
    }

    _shouldCreateNewStructure( room ) {
        if( !room.memory.hasOwnProperty( '_construction_planners' ) ) room.memory._construction_planners = {};
        return !room.memory._construction_planners[ this.name ];
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
    
        if( !room.memory.hasOwnProperty( '_construction_planners' ) ) room.memory._construction_planners = {};
        room.memory._construction_planners[ this.name ] = true;

        return positions;
    }
}

module.exports = SourceRoadPlanner;
