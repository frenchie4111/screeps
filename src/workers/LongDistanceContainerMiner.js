const constants = require( '~/constants' ),
    move = require( '~/lib/move' );

const ContainerMiner = require( './ContainerMiner' );

const STATES = {
    GO_TO_SOURCE_ROOM: 'GO_TO_SOURCE_ROOM'
};

class LongDistanceContainerMiner extends ContainerMiner {
    constructor( assigner ) {
        super( assigner );
        this.default_state = STATES.GO_TO_SOURCE_ROOM;
        this.MAX_WORK_PARTS = 7;
        this.MAX_MOVE_PARTS = 7;
        this.run_from_enemy = true;
    }

    shouldRunFrom( creep, enemy ) {
        let worker_memory = this.getMemory();

        if( !worker_memory.long_distance_source ) {
            worker_memory.long_distance_source = this.assigner.getAssigned( creep, this.assigner.types.LONG_DISTANCE_CONTAINER_MINER );
        }

        let source_room_name = worker_memory.long_distance_source.room_name;

        // Only run if we are in our source room
        if( creep.room.name === source_room_name ) {
            return true;
        }
        return false;
    }

    getSource( creep, worker_memory ) {
        return Game.getObjectById( worker_memory.long_distance_source.source_id );
    }

    _getStates() {
        let super_states = super._getStates();

        super_states[ STATES.GO_TO_SOURCE_ROOM ] = ( creep, state_memory, worker_memory ) => {
            if( !worker_memory.long_distance_source ) {
                worker_memory.long_distance_source = this.assigner.getAssigned( creep, this.assigner.types.LONG_DISTANCE_CONTAINER_MINER );
            }

            if( this.moveToRoom( worker_memory.long_distance_source.room_name ) === move.ERR_IN_ROOM ) {
                return ContainerMiner.STATES.MOVE_TO_CONTAINER;
            }
        };

        return super_states;
    }
}

module.exports = LongDistanceContainerMiner;
