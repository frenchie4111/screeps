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

    getStates() {
        return {
            [ BUILD_STATES.HARVESTING ]: ( creep, task_memory, state_memory ) => {
                let source = state_memory.target_source ? Game.getObjectById( state_memory.target_source ) : null;

                if( !source ) {
                    let sources = creep.room.find( FIND_SOURCES );
                    source = creep.pos.findClosestByPath( sources );

                    if( !source ) {
                        console.log( creep.id, ' couldnt find available source' );
                        return;
                    }

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

    performTask( creep ) {
        super.performTask( creep );
        creep.room.visual.line( creep.pos, this.target.pos, { color: 'red' } );
    }
}

module.exports = Build;
