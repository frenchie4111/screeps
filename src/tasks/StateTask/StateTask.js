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
