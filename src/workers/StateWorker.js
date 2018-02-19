const Worker = require( './Worker' );

class StateWorker extends Worker {
    constructor( default_state_name ) {
        super();
        this.default_state = default_state_name;
        this.reset_to_default_on_error = true;
    }

    _getStates() {
        throw new Error( 'Abstract Method' );
    }

    _doWork( creep ) {
        let state_worker_memory = this.getMemory( '_state_worker' );
        let state_memory = state_worker_memory.state_memory = state_worker_memory.state_memory || {};
        let current_state_name = state_worker_memory.current_state_name = state_worker_memory.current_state_name || this.default_state;

        let states = this.states = this.states || this._getStates();
        if( states.hasOwnProperty( current_state_name ) ) {
            let response = states[ current_state_name ]( creep, state_memory, this.getMemory() );

            if( response ) {
                this.log( 'New State', response );
                this.creep.say( response );
                state_worker_memory.current_state_name = response;
                state_worker_memory.state_memory = {};
            }
        } else {
            this.log( 'Invalid State name:', current_state_name );

            if( this.reset_to_default_on_error ) {
                state_worker_memory.current_state_name = this.default_state;
            }
        }
    }
}

module.exports = StateWorker;
