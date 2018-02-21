const Worker = require( './Worker' );

class StateWorker extends Worker {
    constructor( default_state_name ) {
        super();
        this.default_state = default_state_name;
        this.reset_to_default_on_error = true;
        this.states = this._getStates();
    }

    _getStates() {
        throw new Error( 'Abstract Method' );
    }

    isNear( creep, id ) {
        return creep.pos.isNearTo( Game.getObjectById( id ) );
    }

    setState( new_state_name ) {
        console.log( 'New State', new_state_name );
        this.creep.say( new_state_name );
        let state_worker_memory = this.getMemory( '_state_worker' );
        state_worker_memory.current_state_name = new_state_name;
        state_worker_memory.state_memory = {};
    }

    _doWork( creep ) {
        let state_worker_memory = this.getMemory( '_state_worker' );
        let state_memory = state_worker_memory.state_memory = state_worker_memory.state_memory || {};
        let current_state_name = state_worker_memory.current_state_name = state_worker_memory.current_state_name || this.default_state;

        let states = this.states;
        if( states.hasOwnProperty( current_state_name ) ) {
            let response = states[ current_state_name ]( creep, state_memory, this.getMemory() );

            if( response ) {
                this.setState( response );
            }
        } else {
            console.log( 'Invalid State name:', current_state_name );

            if( this.reset_to_default_on_error ) {
                state_worker_memory.current_state_name = this.default_state;
            }
        }
    }
}

module.exports = StateWorker;
