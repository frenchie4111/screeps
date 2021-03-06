const Worker = require( './Worker' );

class StateWorker extends Worker {
    constructor( assigner, default_state_name ) {
        super( assigner );
        this.default_state = default_state_name;
        this.reset_to_default_on_error = true;
        this.states = this._getStates();
    }

    _getStates() {
        throw new Error( 'Abstract Method' );
    }

    setState( new_state_name ) {
        console.log( 'New State', new_state_name );
        this.creep.say( new_state_name );
        let state_worker_memory = this.getMemory( '_state_worker' );
        state_worker_memory.current_state_name = new_state_name;
        state_worker_memory.state_memory = {};
    }

    instantTransition( new_state_name ) {
        return {
            instant: true,
            state_name: new_state_name
        };
    }

    _doWork( creep ) {
        let state_worker_memory = this.getMemory( '_state_worker' );
        let state_memory = state_worker_memory.state_memory = state_worker_memory.state_memory || {};
        let current_state_name = state_worker_memory.current_state_name = state_worker_memory.current_state_name || this.default_state;

        let states = this.states;
        if( states.hasOwnProperty( current_state_name ) ) {
            while( true ) {
                let response = states[ current_state_name ]( creep, state_memory, this.getMemory() );

                if( response ) {
                    if( response.instant ) {
                        this.setState( response.state_name );
                        console.log( '~~~ instant transition' );
                        continue;
                    }
                    this.setState( response );
                }
                break;
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
