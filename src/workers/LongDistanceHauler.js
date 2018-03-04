const constants = require( '~/constants' );

const ContainerHarvester = require( './ContainerHarvester' ),
    HarvestWorker = require( './HarvestWorker' );

class LongDistanceHauler extends ContainerHarvester {
    constructor( assigner ) {
        super( assigner );
        this.default_state = HarvestWorker.STATES.MOVE_TO_TRANSFER;
        this.MAX_CARRY = 15;
        this.run_from_enemy = true;
    }

    shouldStopHarvesting( creep, container ) {
        if( container.structureType === constants.STRUCTURE_CONTAINER ) {
            return container.store[ constants.RESOURCE_ENERGY ] <= 50;
        }
        return super.shouldStopHarvesting( creep, container );
    }

    getTarget( creep, worker_memory ) {
        let memory = this.getMemory();
        let storages = this
            .room
            .find( FIND_MY_STRUCTURES, {
                filter: {
                    structureType: STRUCTURE_STORAGE
                }
            } );

        if( !storages ) {
            throw new Error( 'Can\t find storages' );
        }
        
        return storages[ 0 ];
    }

    getSourceRoomName( creep, worker_memory ) {
        if( !worker_memory.long_distance_source ) {
            worker_memory.long_distance_source = this.assigner.getAssigned( creep, this.assigner.types.LONG_DISTANCE_HAULER );
        }

        return worker_memory.long_distance_source.room_name;
    }

    getSource( creep, worker_memory ) {
        if( !worker_memory.long_distance_source ) {
            worker_memory.long_distance_source = this.assigner.getAssigned( creep, this.assigner.types.LONG_DISTANCE_HAULER );
        }

        const source = Game.getObjectById( worker_memory.long_distance_source.source_id );
        console.log( source );

        let nearby_structures = creep.room.lookForAtArea( LOOK_STRUCTURES, source.pos.y - 1, source.pos.x - 1, source.pos.y + 1, source.pos.x + 1, true );
        nearby_structures = _.filter( nearby_structures, ( structure ) => structure.structure.structureType === constants.STRUCTURE_CONTAINER );

        if( nearby_structures.length === 0 ) {
            throw new Error( 'No containers' );
        }

        return nearby_structures[ 0 ].structure;
    }

    doHarvest( creep, container ) {
        return creep.withdraw( container, constants.RESOURCE_ENERGY );
    }

    getBody( available_energy ) {
        let per_parts = constants.BODYPART_COST[ constants.MOVE ] + constants.BODYPART_COST[ constants.CARRY ];
        let parts = [];

        for( let i = 0; i < this.MAX_CARRY && available_energy > per_parts; i++ ) {
            parts = parts.concat( [ constants.MOVE, constants.CARRY ] );
            available_energy -= per_parts;
        }

        return parts;
    }
}

module.exports = LongDistanceHauler;
