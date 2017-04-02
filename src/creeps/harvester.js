const CreepType = require( './CreepType' );

const Harvester = {
    run: ( creep ) => {
        if( creep.carry.energy < creep.carryCapacity ) {
            let sources = creep.room.find( FIND_SOURCES );
            let source = creep.pos.findClosestByPath( sources );

            if( creep.harvest( source ) === ERR_NOT_IN_RANGE ) {
                creep.moveTo( source, { visualizePathStyle: { stroke: '#ffffff' } } );
            }
        } else {
            let transfer_targets = creep.room.find( FIND_STRUCTURES, {
                filter: ( structure ) => {
                    if( structure.structureType === STRUCTURE_SPAWN ) {
                        return structure.energy < structure.energyCapacity;
                    }
                    if( structure.structureType === STRUCTURE_CONTROLLER ) {
                        return true;
                    }
                    return false;
                }
            } );

            if( creep.transfer( transfer_targets[ 0 ], RESOURCE_ENERGY ) === ERR_NOT_IN_RANGE ) {
                creep.moveTo( transfer_targets[ 0 ], { visualizePathStyle: { stroke: '#ffffff' } } );
            }
        }
    }
};

module.exports = Harvester;
