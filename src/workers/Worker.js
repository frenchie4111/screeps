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

    getEnergyOf( body ) {
        return _.sumBy( body, ( part ) => constants.BODYPART_COST[ part ] );
    }

    getBody( available_energy ) {
        let per_parts = constants.BODYPART_COST[ constants.MOVE ] + constants.BODYPART_COST[ constants.CARRY ] + constants.BODYPART_COST[ constants.WORK ];
        let parts = [];

        while( available_energy > per_parts ) {
            parts = parts.concat( [ constants.MOVE, constants.CARRY, constants.WORK ] );
            available_energy -= per_parts;
        }

        return parts;
    }

    _doWork( creep ) {
        throw new Erorr( 'Abstract Method' );
    }

    doWork() {
        this._doWork( this.creep );
    }
}

module.exports = Worker;
