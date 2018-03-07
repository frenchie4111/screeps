const constants = require( '~/constants' );

const position = require( '~/lib/position' );

const profiler = require( '~/profiler' );

const _drawPath = ( creep, path ) => {
    for( let i = 0; i < path.length - 1; i++ ) {
        creep.room.visual.line( path[ i ], path[ i + 1 ], { color: 'white' } );
    }
};

const moveTo = ( creep, move_memory, target ) => {
    if( target.pos ) {
        target = target.pos;
    }

    if( !position.equal( target, move_memory.path_target ) ) {
        console.log( 'Need new path' );
        move_memory.path = null;
    }

    if( !move_memory.path ) {
        profiler.incrementCallsFor( 'move.findPathTo' );
        move_memory.path = creep.pos.findPathTo( target );
    } else {
        // Make sure we aren't stuck
        if( !move_memory.was_tired && move_memory.previous_position && position.equal( creep.pos, move_memory.previous_position ) ) {
            profiler.incrementCallsFor( 'move.findPathTo' );
            move_memory.path = creep.pos.findPathTo( target );
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
}
module.exports.moveTo = moveTo;

const _canMoveTo = ( room, pos ) => {
    let things_at = room.lookAt( pos );
    console.log( JSON.stringify( things_at ) );
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
    let move_target = position.intDirectionToPosition( creep.pos, direction );
    if( _canMoveTo( creep.room, move_target ) ) {
        console.log( 'moveIn', direction );
        return creep.move( direction );
    }

    console.log( 'Cant move there' );

    let rot_90_direction = position.normalizeDir( direction + 1 );
    move_target = position.intDirectionToPosition( creep.pos, rot_90_direction );
    if( _canMoveTo( creep.room, move_target ) ) {
        console.log( 'moveIn', rot_90_direction );
        return creep.move( rot_90_direction );
    }

    console.log( 'Cant move there' );

    let rot_neg_90_direction = position.normalizeDir( direction - 1 );
    console.log( 'rot_neg_90_direction', rot_neg_90_direction );
    move_target = position.intDirectionToPosition( creep.pos, rot_neg_90_direction );
    if( _canMoveTo( creep.room, move_target ) ) {
        console.log( 'moveIn', rot_neg_90_direction );
        return creep.move( rot_neg_90_direction );
    }
};

module.exports.ERR_IN_ROOM = 'ERR_IN_ROOM';

const moveToRoom = ( creep, move_memory, target_room_name, use_exit_direction=null, use_exit=null ) => {
    if( move_memory.target_room_name !== target_room_name ) {
        move_memory.exit = null;
        move_memory.target_room_name = target_room_name;
    }

    if( creep.room.name === target_room_name ) {
        let move_response = moveIn( creep, move_memory );
        return module.exports.ERR_IN_ROOM;
    }

    if( !move_memory.exit || move_memory.current_room_name !== creep.room.name ) {
        move_memory.current_room_name = creep.room.name;

        let exit_direction = use_exit_direction;
        if( !exit_direction ) {
            let route = Game.map.findRoute( creep.room, target_room_name );

            if( route.length === 0 ) {
                console.log( 'Already there, moving in' );
                let move_response = moveIn( creep, move_memory );
                console.log( move_memory.direction, move_response );
                return;
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

    return module.exports.moveTo( creep, move_memory, position.fromJSON( move_memory.exit ) );
}
module.exports.moveToRoom = moveToRoom;
