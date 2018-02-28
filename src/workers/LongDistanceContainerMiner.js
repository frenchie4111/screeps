const constants = require( '~/constants' );

const ContainerMiner = require( './ContainerMiner' );

const STATES = {
    GO_TO_SOURCE_ROOM: 'GO_TO_SOURCE_ROOM'
};

class LongDistanceContainerMiner extends ContainerMiner {
    constructor( assigner ) {
        super( assigner );
        this.default_state = STATES.GO_TO_SOURCE_ROOM;
        this.MAX_WORK_PARTS = 3;
        this.MAX_MOVE_PARTS = 2;
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

            if( creep.room.name === worker_memory.long_distance_source.room_name ) {
                return ContainerMiner.STATES.MOVE_TO_CONTAINER;
            }

            this.moveToRoom( worker_memory.long_distance_source.room_name );
        };

        return super_states;
    }
}

module.exports = LongDistanceContainerMiner;
