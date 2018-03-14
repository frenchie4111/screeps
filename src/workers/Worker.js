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

    moveTo( target, opts ) {
        return move.moveTo( this.creep, this.getMemory( '_moveTo' ), target, opts );
    }

    moveToRoom( target_room_name, opts ) {
        return move.moveToRoom( this.creep, this.getMemory( '_moveToRoom' ), target_room_name, opts );
    }

    isNear( creep, id ) {
        return creep.pos.isNearTo( Game.getObjectById( id ) );
    }

    getEnergyOf( body ) {
        return _.sum( _.map( body, ( part ) => constants.BODYPART_COST[ part ] ) );
    }

    getBody( available_energy ) {
        let part_priorities = [ MOVE, WORK, CARRY ];
        let curr_part = 0;
        let parts = [];

        while( this.getEnergyOf( parts ) + BODYPART_COST[ part_priorities[ curr_part ] ] <= available_energy ) {
            parts.push( part_priorities[ curr_part ] );
            curr_part++;
            curr_part %= part_priorities.length;
        }

        return parts;
    }

    _doWork( creep, room, spawn ) {
        throw new Error( 'Abstract Method' );
    }

    doWork( creep, room, spawn ) {
        if( creep.spawning ) {
            console.log( 'Still spawning' );
            return;
        }

        this.room = room;
        this.spawn = spawn;

        this.setCreep( creep );
        this.setRoom( room );
        this._doWork( creep, room, spawn );
    }
}

module.exports = Worker;
