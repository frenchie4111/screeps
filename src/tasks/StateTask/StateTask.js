const Task = require( '../Task' );

/*

let state_names = {
    HARVESTING: 'HARVESTING',
    TRANSFERRING: 'TRANSFERRING'
};

HARVESTING: ( creep, task_memory, state_memory ) => {
    if( creep.carry.energy === creep.energyCapacity ) {
        return state_names.TRANSFERRING;
    }

    let source = state_memory.target_source ? Game.getObjectById( state_memory.target_source ) : null;

    if( !source ) {
        let sources = creep.room.find( FIND_SOURCES );
        source = creep.pos.findClosestByPath( sources );
        state_memory.target_source = source.id;
    }

    if( creep.harvest( source ) === ERR_NOT_IN_RANGE ) {
        this.moveTo( creep, source );
    }
}

*/

class StateTask extends Task {
    constructor( default_state ) {
        super();
        this.default_state = default_state;
    }

    getStates() {
        throw new Error( 'abstract method' );
    }

    positionsEqual( a, b ) {
        return( a && b &&
            a.x === b.x &&
            a.y === b.y &&
            a.world === b.world );
    }

    moveTo( creep, thing ) {
        let state_memory = creep.memory.task_memory.state_memory;

        if( !state_memory.path ) {
            console.log( creep.id, 'finding new path ' + creep.id );
            state_memory.path = creep.pos.findPathTo( thing );
        } else {
            // Do some logic to make sure we aren't stuck
            if( state_memory.previous_position && this.positionsEqual( creep.pos, state_memory.previous_position ) ) {
                state_memory.path = creep.pos.findPathTo( thing );
            } else {
                state_memory.previous_position = creep.pos;
            }
        }

        creep.room.visual.line( creep.pos, thing.pos, { color: 'white' } );
        creep.moveByPath( state_memory.path );
    }

    performTask( creep ) {
        const task_memory = creep.memory.task_memory;
        if( !task_memory.state_memory ) task_memory.state_memory = {};
        const state_memory = task_memory.state_memory;
        const states = this.getStates();
        const current_state_name = task_memory.current_state_name || this.default_state;

        if( states.hasOwnProperty( current_state_name ) ) {
            let response = states[ current_state_name ]( creep, task_memory, state_memory );

            if( response ) {
                creep.say( response );
                task_memory.current_state_name = response;
                task_memory.state_memory = {};
            }
        } else {
            throw new Error( 'Invalid State name: ' + current_state_name );
        }
    }
};

module.exports = StateTask;
