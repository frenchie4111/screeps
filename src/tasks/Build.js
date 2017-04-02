const StateTask = require( './StateTask' );

const BUILD_STATES = {
    HARVESTING: 'HARVESTING',
    BUILDING: 'BUILDING'
};

class Build extends StateTask {
    constructor( target ) {
        super( BUILD_STATES.HARVESTING );
        this.target = target;
    }

    getTaskHash() {
        return 'build' + this.target.id;
    }

    getRequirements() {
        return [ WORK, HARVEST, MOVE ];
    }

    moveTo( creep, thing ) {
        let state_memory = creep.memory.task_memory.state_memory;

        if( !state_memory.path ) {
            state_memory.path = creep.pos.findPathTo( thing );
        }
        creep.room.visual.line( creep.pos, thing.pos, { color: 'white' } );
        creep.moveByPath( state_memory.path );
    }

    getStates() {
        return {
            [ BUILD_STATES.HARVESTING ]: ( creep, task_memory, state_memory ) => {
                let source = state_memory.target_source ? Game.getObjectById( state_memory.target_source ) : null;

                if( !source ) {
                    let sources = creep.room.find( FIND_SOURCES );
                    source = creep.pos.findClosestByPath( sources );
                    state_memory.target_source = source.id;
                }

                if( creep.harvest( source ) === ERR_NOT_IN_RANGE ) {
                    this.moveTo( creep, source );
                }

                if( creep.carry.energy === creep.carryCapacity ) {
                    return BUILD_STATES.BUILDING;
                }
            },
            [ BUILD_STATES.BUILDING ]: ( creep, task_memory, state_memory ) => {
                if( creep.build( this.target, RESOURCE_ENERGY ) === ERR_NOT_IN_RANGE ) {
                    this.moveTo( creep, this.target );
                }

                if( creep.carry.energy === 0 ) {
                    return BUILD_STATES.HARVESTING;
                }
            }
        }
    }
}

module.exports = Build;
