const constants = require( '~/constants' );

const position = require( '~/lib/position' );

const profiler = require( '~/profiler' );

const _drawPath = ( creep, path ) => {
    for( let i = 0; i < path.length - 1; i++ ) {
        creep.room.visual.line( path[ i ], path[ i + 1 ], { color: 'white' } );
    }
};

const findPathTo = ( thing, target, opts ) => {
    return thing.pos.findPathTo( target );
    // return thing.pos
    //     .findPathTo( target, {
    //         costCallback: ( room_name, cost_matrix ) => {
    //             if( !Game.rooms[ room_name ] ) return cost_matrix;
    //             if( opts.avoid_enemies ) {
    //                 console.log( 'Avoiding enemies' );
    // 
    //                 let hostile_creeps = Game.rooms[ room_name ].find( FIND_HOSTILE_CREEPS );
    //                 if( hostile_creeps.length === 0 ) return cost_matrix;
    // 
    //                 cost_matrix = cost_matrix.clone();
    //                 _
    //                     .each( hostile_creeps, ( hostile_creep ) => {
    //                         let hostile_creep_pos = hostile_creep.pos;
    //                         for( let x = hostile_creep_pos.x - 3; x < hostile_creep_pos.x + 3; x++ ) {
    //                             for( let y = hostile_creep_pos.y - 3; y < hostile_creep_pos.y + 3; y++ ) {
    //                                 Game.rooms[ room_name ].visual.circle( x, y, { color: 'red' } );
    //                                 cost_matrix.set( hostile_creep.pos.x, hostile_creep.pos.y, 255 );
    //                             }
    //                         }
    //                     } );
    //                 return cost_matrix;
    //             }
    // 
    //             return cost_matrix;
    //         }
    //     } );
};

const STUCK_DEBOUNCE = 2;

const moveTo = ( creep, move_memory, target, opts={} ) => {
    if( target.pos ) {
        target = target.pos;
    }

    if( !position.equal( target, move_memory.path_target ) ) {
        move_memory.path = null;
    }

    if( !move_memory.path ) {
        profiler.incrementCallsFor( 'move.findPathTo' );
        move_memory.path = findPathTo( creep, target, opts );
    } else {
        if( !move_memory.was_tired && move_memory.previous_position && position.equal( creep.pos, move_memory.previous_position ) ) {
            if( !move_memory.hasOwnProperty( 'stuck_timer' ) ) move_memory.stuck_timer = 0;
            move_memory.stuck_timer++;
        } else {
            move_memory.stuck_timer = 0;
        }

        if( move_memory.stuck_timer >= STUCK_DEBOUNCE ) {
            console.log( 'Was stuck for too long' );
            profiler.incrementCallsFor( 'move.findPathTo' );
            move_memory.path = findPathTo( creep, target, opts );
        }
    }

    move_memory.path_target = position.clone( target );

    _drawPath( creep, move_memory.path );

    move_memory.previous_position = position.clone( creep.pos );
    move_memory.was_tired = false;
    let move_result = creep.moveByPath( move_memory.path );

    switch( move_result ) {
        case constants.OK:
            return constants.OK;
        case constants.ERR_NOT_FOUND:
            move_memory.path = null;
            break;
        case constants.ERR_TIRED:
            move_memory.was_tired = true;
            break;
        default:
            console.log( 'Got Non-Zero moveByPath result:', move_result, constants.lookup( move_result ) );
    }
    return move_result;
}
module.exports.moveTo = moveTo;

const _canMoveTo = ( room, pos ) => {
    if( !position.inRoom( pos ) ) return false;
    let things_at = room.lookAt( pos );
    return !_
        .some( things_at, ( thing_at ) => {
            return (
                OBSTACLE_OBJECT_TYPES.includes( thing_at.type ) || 
                ( thing_at.type === LOOK_STRUCTURES && OBSTACLE_OBJECT_TYPES.includes( thing_at.structure.structureType ) ) ||
                ( thing_at.type === LOOK_TERRAIN && OBSTACLE_OBJECT_TYPES.includes( thing_at.terrain ) )
            ) 
        } );
};

const moveIn = ( creep, move_memory, target_room_name ) => {
    let direction = +move_memory.direction;
    if( !direction ) return;
    let move_target = position.intDirectionToPosition( creep.pos, direction );
    if( _canMoveTo( creep.room, move_target ) ) {
        return creep.move( direction );
    }

    let rot_90_direction = position.normalizeDir( direction + 1 );
    move_target = position.intDirectionToPosition( creep.pos, rot_90_direction );
    if( _canMoveTo( creep.room, move_target ) ) {
        return creep.move( rot_90_direction );
    }

    let rot_neg_90_direction = position.normalizeDir( direction - 1 );
    move_target = position.intDirectionToPosition( creep.pos, rot_neg_90_direction );
    if( _canMoveTo( creep.room, move_target ) ) {
        return creep.move( rot_neg_90_direction );
    }
};

module.exports.ERR_IN_ROOM = 'ERR_IN_ROOM';
module.exports.ERR_NO_ROUTE = 'ERR_NO_ROUTE';

const moveToRoom = ( creep, move_memory, target_room_name, opts={}, use_exit_direction=null, use_exit=null ) => {
    if( move_memory.target_room_name !== target_room_name ) {
        move_memory.exit = null;
        move_memory.target_room_name = target_room_name;
    }

    if( creep.room.name === target_room_name ) {
        if( !opts.dont_move_in ) {
            let move_response = moveIn( creep, move_memory );
        }
        return module.exports.ERR_IN_ROOM;
    }

    if( !move_memory.exit || move_memory.current_room_name !== creep.room.name ) {
        move_memory.current_room_name = creep.room.name;

        let exit_direction = use_exit_direction;
        if( !exit_direction ) {
            let route = Game.map.findRoute( creep.room, target_room_name );

            if( route === ERR_NO_PATH ) {
                return module.exports.ERR_NO_ROUTE;
            }

            exit_direction = route[ 0 ].exit;
        }

        let exit = use_exit;
        if( !exit ) {
            exit = creep.pos.findClosestByPath( exit_direction );
        }

        move_memory.direction = exit_direction;
        move_memory.exit = position.clone( exit );
    }

    if( !move_memory.exit ) {
        return module.exports.ERR_NO_ROUTE;
    }

    return module.exports.moveTo( creep, move_memory, position.fromJSON( move_memory.exit ), opts );
}
module.exports.moveToRoom = moveToRoom;
