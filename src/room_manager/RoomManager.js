const loopItem = require( '~/lib/loopItem' );

const constants = require( '~/constants' ),
    workers = require( '~/workers' );

const Assigner = require( './Assigner' ),
    SpawnManager = require( './SpawnManager' );

const types = require( './types' );

class RoomManager {
    constructor() {
        this.default_type = 'standard';
    }

    _getCurrentState( room ) {
        if( !room.memory.hasOwnProperty( '_state' ) ) room.memory._state = {};
        if( !room.memory._state.hasOwnProperty( 'type' ) ) {
            throw new Error( 'Room Has No Type: ' + room.name );
        }
        const room_state_memory = room.memory._state;
        const type = room.memory._state.type;

        if( !room_state_memory.hasOwnProperty( 'current_state' ) ) room_state_memory.current_state = 0;
        if( !room_state_memory.hasOwnProperty( 'current_version' ) ) room_state_memory.current_version = STATES_VERSION;

        if( room_state_memory.current_version !== types.STATES_VERSION ) {
            room_state_memory.current_state = 0;
            room_state_memory.current_version = STATES_VERSION;
        }

        return types[ type ][ room_state_memory.current_state ];
    };

    handleSpawns( room, spawn, current_state ) {
        let manager = new SpawnManager();
        manager.doManage( room, spawn, current_state );
    }

    handleCreeps( room, spawn, current_state, assigner ) {
        room
            .find( FIND_MY_CREEPS )
            .forEach( ( creep ) => {
                loopItem( 'creep-work-' + creep.name, () => {
                    const WorkerClass = workers.getClass( creep.memory.worker_type );
                    const worker = new WorkerClass( assigner );
                    worker.setCreep( creep );
                    worker.doWork();
                } );
            } );
    }

    handleConstruction( room, spawn, current_state ) {
        current_state
            .construction_planners
            .forEach( ( planner ) => {
                loopItem( 'planner-' + planner.name, () => {
                    return planner.createConstructionSites( room, spawn );
                } );
            } );
    }

    handleTower( tower ) {
        let hostile_creeps = tower.room.find( FIND_HOSTILE_CREEPS );

        if( hostile_creeps.length > 0 ) {
            console.log( 'Attacking Hostile Creep' );
            return tower.attack( hostile_creeps[ 0 ] );
        }

        let damaged_creeps = tower.room
            .find( FIND_MY_CREEPS, {
                filter: ( creep ) => {
                    return creep.hits < creep.hitsMax
                }
            } );

        if( damaged_creeps.length > 0 ) {
            console.log( 'Healing Creep' );
            return tower.heal( damaged_creeps[ 0 ] );
        }
    };

    handleTowers( room, spawn, current_state ) {
        room
            .find( FIND_MY_STRUCTURES, {
                filter: {
                    structureType: STRUCTURE_TOWER
                }
            } )
            .forEach( ( tower ) => {
                loopItem( 'tower-' + tower.room.name + '-' + tower.id, () => {
                    return this.handleTower( tower );
                } )
            } );
    }

    doManage( room ) {
        const current_state = this._getCurrentState( room );
        const spawns = room.find( FIND_MY_SPAWNS );
        let has_spawn = spawns.length > 0;
        const spawn = spawns[ 0 ]; // TODO figure out how to do this when multi-spawns

        const assigner = new Assigner( room );
        assigner.garbageCollect();

        while( current_state.isComplete( room ) ) {
            console.log( 'Room Progressed to next state' );
            Game.notify( 'Room progressed to next state' );
            room.memory._state.current_state++;
            return;
        }

        if( this.has_spawn ) {
            this.handleSpawns( room, spawn, current_state );
        }

        this.handleCreeps( room, spawn, current_state, assigner );
        this.handleConstruction( room, spawn, current_state );
        this.handleTowers( room, spawn, current_state );
    }
};

module.exports = RoomManager;
