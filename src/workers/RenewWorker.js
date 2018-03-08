const constants = require( '~/constants' ),
    move = require( '~/lib/move' ),
    position = require( '~/lib/position' );

const StateWorker = require( './StateWorker' );

let TTL_REMAINING_START_RENEW = 250;
let TTL_REMAINING_FINISH_RENEW = 1450;

let STATES = {
    MOVE_TO_SPAWN: 'MOVE_TO_SPAWN',
    RENEW: 'RENEW',
    MOVE_TO_SPAWN_ROOM: 'MOVE_TO_SPAWN_ROOM',
    WAIT_FOR_ENEMY: 'WAIT_FOR_ENEMY',
    MOVE_TO_WAITING_SPOT: 'MOVE_TO_WAITING_SPOT',
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
    
    shouldRunFrom( creep, enemy ) {
        return true;
    };

    shouldKeepRunning( worker_memory ) {
        return Game.time < worker_memory.running_until;
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
            [ STATES.MOVE_TO_WAITING_SPOT ]: ( creep, state_memory, worker_memory ) => {
                if( !worker_memory.waiting_spot ) {
                    worker_memory.waiting_spot = this.assigner.getAssigned( creep, this.assigner.types.WAITING_SPOT );
                }

                if( position.equal( creep.pos, worker_memory.waiting_spot ) ) {
                    return STATES.WAIT_FOR_ENEMY;
                }
                
                console.log( worker_memory.waiting_spot, JSON.stringify( worker_memory.waiting_spot ) );

                this.moveTo( position.fromJSON( worker_memory.waiting_spot ) );
            },
            [ STATES.WAIT_FOR_ENEMY ]: ( creep, state_memory, worker_memory ) => {
                if( !worker_memory.waiting_spot || !position.equal( creep.pos, worker_memory.waiting_spot ) ) {
                    return STATES.MOVE_TO_WAITING_SPOT;
                }

                if( this.shouldKeepRunning( worker_memory ) ) {
                    console.log( 'Waiting for enemy to leave' );
                    return;
                }

                console.log( 'Done Running' );

                worker_memory.running_until = null;
                this.assigner.unassign( this.assigner.types.WAITING_SPOT, creep.id, worker_memory.waiting_spot.id );
                worker_memory.waiting_spot = null;

                this.setRenew();
            },
            [ STATES.RENEW ]: ( creep, state_memory, worker_memory ) => {
                if( creep.ticksToLive > TTL_REMAINING_FINISH_RENEW ) {
                    worker_memory.renewing = false;

                    if( worker_memory.running_until ) {
                        return STATES.MOVE_TO_WAITING_SPOT;
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

        if( this.run_from_enemy && !this.getMemory().running_until && position.inRoom( creep.pos ) ) {
            let hostile_creeps = creep.room.find( FIND_HOSTILE_CREEPS );
            // TODO: Check for allies, etc etc

            if( hostile_creeps.length > 0 ) {
                let should_run_away = _.some( hostile_creeps, ( hostile_creep ) => this.shouldRunFrom( creep, hostile_creep ) )
                if( should_run_away ) {
                    this.setRunAway( creep, hostile_creeps[ 0 ] );
                }
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
    return creep.ticksToLive < TTL_REMAINING_START_RENEW;
};
