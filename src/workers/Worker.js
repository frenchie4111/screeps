const _ = require( 'lodash' );

const Logger = require( '~/lib/logger' ),
    constants = require( '~/constants' ),
    moveTo = require( '~/lib/moveTo' );

class Worker {
    constructor() {
        this.creep = null;
        this.memory = null;
    }

    setCreep( creep ) {
        this.creep = creep;
        creep.memory.worker_memory = creep.memory.worker_memory || {};
    }

    getMemory( private_key ) {
        if( private_key ) {
            if( !this.creep.memory.worker_memory.hasOwnProperty( private_key ) ) {
                this.creep.memory.worker_memory[ private_key ] = {};
            }
            return this.creep.memory.worker_memory[ private_key ];
        }
        return this.creep.memory.worker_memory;
    }

    moveTo( target ) {
        return moveTo( this.creep, this.getMemory( '_moveTo' ), target );
    }

    isNear( creep, id ) {
        return creep.pos.isNearTo( Game.getObjectById( id ) );
    }

    getBody( available_energy ) {
        return [
            constants.WORK, 
            constants.CARRY, 
            constants.MOVE, 
            constants.MOVE, 
            constants.CARRY
        ];
    }

    _doWork( creep ) {
        throw new Erorr( 'Abstract Method' );
    }

    doWork() {
        this._doWork( this.creep );
    }
}

module.exports = Worker;
