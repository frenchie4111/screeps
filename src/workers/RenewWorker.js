const constants = require( '~/constants' ),
    move = require( '~/lib/move' );

const StateWorker = require( './StateWorker' );

let STATES = {
    MOVE_TO_SPAWN: 'MOVE_TO_SPAWN',
    RENEW: 'RENEW',
    MOVE_TO_SPAWN_ROOM: 'MOVE_TO_SPAWN_ROOM',
    WAIT_FOR_ENEMY: 'WAIT_FOR_ENEMY'
};

class RenewWorker extends StateWorker {
    constructor( assigner, default_state ) {
        super( assigner, default_state );

        this.states = Object.assign(
            {},
            this.states,
            this._getRenewStates()
        );

        this.run_from_enemy = false;
    }

    setSuicide( spawn_id ) {
        this.creep.suicide();
    }

    isSuicide() {
        return this.getMemory().suicide;
    }

    setRenew() {
        this.setState( STATES.MOVE_TO_SPAWN );
        this.getMemory().renewing = true;
    }

    setRunAway( creep, enemy ) {
        this.setState( STATES.MOVE_TO_SPAWN );
        this.getMemory().running_until = Game.time + enemy.ticksToLive;
    }

    _getRenewStates() {
        return {
            [ STATES.MOVE_TO_SPAWN_ROOM ]: ( creep, state_memory, worker_memory ) => {
                const spawn = Game.getObjectById( worker_memory.spawn_id );

                if( this.moveToRoom( spawn.room.name ) === move.ERR_IN_ROOM ) {
                    return STATES.MOVE_TO_SPAWN;
                }
            },
            [ STATES.MOVE_TO_SPAWN ]: ( creep, state_memory, worker_memory ) => {
                if( this.isNear( creep, worker_memory.spawn_id ) ) {
                    if( worker_memory.renewing ) {
                        return STATES.RENEW;
                    }
                    if( worker_memory.running_until ) {
                        return STATES.WAIT_FOR_ENEMY;
                    }
                }
                const spawn = Game.getObjectById( worker_memory.spawn_id );

                if( creep.room.name !== spawn.room.name ) {
                    return STATES.MOVE_TO_SPAWN_ROOM;
                }

                this.moveTo( spawn );
            },
            [ STATES.WAIT_FOR_ENEMY ]: ( creep, state_memory, worker_memory ) => {
                if( Game.time < worker_memory.running_until ) {
                    console.log( 'Waiting for enemy to leave' );
                    return;
                }

                this.getMemory().running_until = null;
                this.setRenew();
            },
            [ STATES.RENEW ]: ( creep, state_memory, worker_memory ) => {
                if( creep.ticksToLive > 1400 ) {
                    worker_memory.renewing = false;

                    if( worker_memory.running_until ) {
                        return STATES.WAIT_FOR_ENEMY;
                    }

                    return this.default_state;
                }
                let renew_response = Game.getObjectById( worker_memory.spawn_id ).renewCreep( creep );
                if( renew_response !== OK ) {
                    console.log( 'NOT OK RENEW RESPONSE', renew_response, constants.lookup( renew_response ) );
                }
            }
        }
    }
    
    _getStates() {
        return this._getRenewStates();
    }

    _doWork( creep, room, spawn ) {
        this.getMemory().spawn_id = spawn.id;

        if( this.run_from_enemy && !this.getMemory().running_until ) {
            let hostile_creeps = creep.room.find( FIND_HOSTILE_CREEPS );
            // TODO: Check for allies, etc etc

            if( hostile_creeps.length > 0 ) {
                this.setRunAway( creep, hostile_creeps[ 0 ] );
            }
        }

        return super._doWork( creep, room, spawn );
    }
}

module.exports = RenewWorker;

module.exports.isRenewing = ( creep ) => {
    if( !creep.memory.hasOwnProperty( 'worker_memory' ) ) creep.memory.worker_memory = {};
    return !!creep.memory.worker_memory.renewing;
};

module.exports.isSuicide = ( creep ) => {
    if( !creep.memory.hasOwnProperty( 'worker_memory' ) ) creep.memory.worker_memory = {};
    return !!creep.memory.worker_memory.suicide;
};

module.exports.needsRenewing = ( creep ) => {
    return creep.ticksToLive < 500;
};
