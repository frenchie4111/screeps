const constants = require( '~/constants' );

const ConstructionPlanner = require( './ConstructionPlanner' );

const BASE_EXITS = [
    [  0, -9 ],
    [  0, +9 ],
    [ +9,  0 ],
    [ -9,  0 ]
];

class ExitRoadPlanner extends ConstructionPlanner {
    constructor( name, direction, dry_run ) {
        super( name, constants.STRUCTURE_ROAD, dry_run );
        this.direction = +direction;
        this.rerun_on_fail = false;
    }

    _getNewPositions( room, spawn ) {
        let map_exit_point = spawn.pos.findClosestByPath( this.direction );
        console.log( 'map_exit_point', this.direction, map_exit_point );

        let potential_base_exits = BASE_EXITS.map( ( direction ) => this._directionToPosition( room, spawn.pos, direction ) );
        let base_exit_point = map_exit_point.findClosestByRange( potential_base_exits );

        let positions = map_exit_point.findPathTo( base_exit_point );

        positions = positions
            .map( ( position ) => {
                position = new RoomPosition( position.x, position.y, room.name )
                if( this.isValidConstruction( room, position ) ) {
                    return position;
                }
            } );

        return positions;
    }
}

module.exports = ExitRoadPlanner;
