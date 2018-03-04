const Logger = require( '~/lib/logger' ),
    constants = require( '~/constants' ),
    move = require( '~/lib/move' );

class Worker {
    constructor( assigner ) {
        this.assigner = assigner;
        this.creep = null;
        this.memory = null;
    }

    setCreep( creep ) {
        this.creep = creep;
        creep.memory.worker_memory = creep.memory.worker_memory || {};
    }
    
    setRoom( room ) {
        this.room = room;
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
        return move.moveTo( this.creep, this.getMemory( '_moveTo' ), target );
    }
    
    moveToRoom( target_room_name ) {
        return move.moveToRoom( this.creep, this.getMemory( '_moveToRoom' ), target_room_name );
    }

    isNear( creep, id ) {
        return creep.pos.isNearTo( Game.getObjectById( id ) );
    }

    getEnergyOf( body ) {
        return _.sum( _.map( body, ( part ) => constants.BODYPART_COST[ part ] ) );
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

    _doWork( creep, room, spawn ) {
        throw new Error( 'Abstract Method' );
    }

    doWork( creep, room, spawn ) {
        this.setCreep( creep );
        this.setRoom( room );
        this._doWork( creep, room, spawn );
    }
}

module.exports = Worker;
