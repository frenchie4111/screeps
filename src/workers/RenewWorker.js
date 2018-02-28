const constants = require( '~/constants' );

const StateWorker = require( './StateWorker' );

let STATES = {
    MOVE_TO_SPAWN: 'MOVE_TO_SPAWN',
    RENEW: 'RENEW',
    MOVE_TO_SPAWN_ROOM: 'MOVE_TO_SPAWN_ROOM'
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
            [ STATES.MOVE_TO_SPAWN_ROOM ]: ( creep, state_memory, worker_memory ) => {
                const spawn = Game.getObjectById( worker_memory.spawn_id );

                if( creep.room.name === spawn.room.name ) {
                    return STATES.MOVE_TO_SPAWN;
                }

                this.moveToRoom( worker_memory.long_distance_source.room_name );
            },
            [ STATES.MOVE_TO_SPAWN ]: ( creep, state_memory, worker_memory ) => {
                if( creep.ticksToLive > 1000 ) return this.default_state;
                if( this.isNear( creep, worker_memory.spawn_id ) ) return STATES.RENEW;
                const spawn = Game.getObjectById( worker_memory.spawn_id );

                if( creep.room.name !== spawn.room.name ) {
                    return STATES.MOVE_TO_SPAWN_ROOM;
                }

                this.moveTo( spawn );
            },
            [ STATES.RENEW ]: ( creep, state_memory, worker_memory ) => {
                if( creep.ticksToLive > 1400 ) {
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
    if( !creep.memory.hasOwnProperty( 'worker_memory' ) ) creep.memory.worker_memory = {};
    return !!creep.memory.worker_memory.renewing;
};

module.exports.needsRenewing = ( creep ) => {
    return creep.ticksToLive < 500;
};
