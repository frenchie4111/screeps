const lodash = require( 'lodash' );

const constants = require( '~/constants' );

const StateWorker = require( './StateWorker' );

let STATES = {
    MOVE_TO_SPAWN: 'MOVE_TO_SPAWN',
    RENEW: 'RENEW'
};

class RenewWorker extends StateWorker {
    constructor( default_state ) {
        super( default_state );

        this.states = Object.assign(
            {},
            this.states,
            this._getRenewStates()
        );
    }

    setRenew( spawn_id ) {
        this.setState( STATES.MOVE_TO_SPAWN );
        this.getMemory().spawn_id = spawn_id;
        this.getMemory().renewing = true;
    }

    _getRenewStates() {
        return {
            [ STATES.MOVE_TO_SPAWN ]: ( creep, state_memory, worker_memory ) => {
                if( this.isNear( creep, worker_memory.spawn_id ) ) return STATES.RENEW;
                this.moveTo( Game.getObjectById( worker_memory.spawn_id ) );
            },
            [ STATES.RENEW ]: ( creep, state_memory, worker_memory ) => {
                if( creep.ticksToLive > 1000 ) {
                    worker_memory.renewing = false;
                    return this.default_state;
                }
                Game.getObjectById( worker_memory.spawn_id ).renewCreep( creep );
            }
        }
    }
    
    _getStates() {
        return this._getRenewStates();
    }
}

module.exports = RenewWorker;

module.exports.isRenewing = ( creep ) => {
    return !!creep.memory.worker_memory.renewing;
};
