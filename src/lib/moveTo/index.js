const constants = require( '~/constants' );

const position = require( '~/lib/position' );

const _drawPath = ( creep, path ) => {
    for( let i = 0; i < path.length - 1; i++ ) {
        creep.room.visual.line( path[ i ], path[ i + 1 ], { color: 'white' } );
    }
};

const moveTo = ( creep, move_memory, target ) => {
    if( target.id !== move_memory.path_target ) {
        console.log( JSON.stringify( move_memory.path_target ) );
        console.log( 'New Target' );
        move_memory.path = null;
    }

    if( !move_memory.path ) {
        console.log( 'Finding new path' );
        move_memory.path = creep.pos.findPathTo( target );
    } else {
        // Make sure we aren't stuck
        if( !move_memory.was_tired && move_memory.previous_position && position.equal( creep.pos, move_memory.previous_position ) ) {
            console.log( 'Was Stuck' );
            move_memory.path = creep.pos.findPathTo( target );
        }
    }

    move_memory.path_target = target.id;

    _drawPath( creep, move_memory.path );

    move_memory.previous_position = position.clone( creep.pos );
    move_memory.was_tired = false;
    let move_result = creep.moveByPath( move_memory.path );

    switch( move_result ) {
        case constants.OK:
            return;
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

module.exports = moveTo;
