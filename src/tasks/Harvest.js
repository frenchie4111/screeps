const Task = require( './Task' );

const HARVEST_STATES = {
    HARVESTING: 'HARVESTING',
    TRANSFERRING: 'TRANSFERRING'
};

class Harvest extends Task {
    constructor( target ) {
        super();
        this.target = target;
    }

    getTaskHash() {
        return 'harvest' + this.target.id;
    }

    getTaskName() {
        return 'Harvest';
    }

    getRequirements() {
        return [ WORK, HARVEST, MOVE ];
    }

    performTask( creep ) {
        const task_memory = creep.memory.task_memory;
        let state = task_memory.harvesting_state;

        if( !state ) {
            state = HARVEST_STATES.HARVESTING;
        } else if( state === HARVEST_STATES.HARVESTING ) {
            if( creep.carry.energy === creep.carryCapacity ) {
                state = HARVEST_STATES.TRANSFERRING;
            }
        } else if( state === HARVEST_STATES.TRANSFERRING ) {
            if( creep.carry.energy === 0 ) {
                state = HARVEST_STATES.HARVESTING;
            }
        }

        task_memory.harvesting_state = state;

        if( state === HARVEST_STATES.HARVESTING ) {
            let sources = creep.room.find( FIND_SOURCES );
            let source = creep.pos.findClosestByPath( sources );

            if( creep.harvest( source ) === ERR_NOT_IN_RANGE ) {
                creep.moveTo( source, { visualizePathStyle: { stroke: '#ffffff' } } );
            }
        } else if( state === HARVEST_STATES.TRANSFERRING ) {
            if( creep.transfer( this.target, RESOURCE_ENERGY ) === ERR_NOT_IN_RANGE ) {
                creep.moveTo( this.target, { visualizePathStyle: { stroke: '#ffffff' } } );
            }
        }
    }
}

module.exports = Harvest;
