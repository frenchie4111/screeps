const _ = require( 'lodash' );

const workers = require( '~/workers' ),
    ExtensionPlanner = require( '~/construction_planner/ExtensionPlanner' ),
    constants = require( '~/constants' ),
    RoomState = require( '~/room_state/RoomState' );
    
const HarvestWorker = require( '~/workers/HarvestWorker' );
const BuildWorker = require( '~/workers/BuildWorker' );
const UpgradeWorker = require( '~/workers/UpgradeWorker' );

const CreepPositionCollector = require( '~/metrics/CreepPositionCollector' );

const STATES_VERSION = 1; // Increment this and the code will automatically reset current state on next deploy

const room_states = [
    {
        isComplete: ( room ) => {
            return room.controller.level === 2
        },
        worker_counts: {
            [ workers.types.HARVESTER ]: 1,
            [ workers.types.UPGRADER ]: 1
        },
        construction_planners: []
    },
    {
        isComplete: ( room ) => {
            return room
                .find( FIND_MY_STRUCTURES, {
                    filter: {
                        structureType: constants.STRUCTURE_EXTENSION
                    }
                } )
                .lenth === 5;
        },
        worker_counts: {
            [ workers.types.BUILDER ]: 2,
            [ workers.types.HARVESTER ]: 1,
            [ workers.types.UPGRADER ]: 1
        },
        construction_planners: [
            new ExtensionPlanner( Game.spawns[ 'Spawn1' ] )
        ]
    },
    {
        isComplete: ( room ) => {
            return false;
        },
        worker_counts: {
            [ workers.types.HARVESTER ]: 1,
            [ workers.types.UPGRADER ]: 3
        },
        construction_planners: [
        ]
    }
];

const _getCurrentState = ( room ) => {
    if( !room.memory.hasOwnProperty( '_state' ) ) room.memory._state = {};
    const room_state_memory = room.memory._state;

    if( !room_state_memory.hasOwnProperty( 'current_state' ) ) room_state_memory.current_state = 0;
    if( !room_state_memory.hasOwnProperty( 'current_version' ) ) room_state_memory.current_version = STATES_VERSION;

    if( room_state_memory.current_version !== STATES_VERSION ) {
        room_state_memory.current_state = 0;
        room_state_memory.current_version = STATES_VERSION;
    }

    return room_states[ room_state_memory.current_state ];
};

const spawnCreep = ( spawn, worker_type ) => {
    spawn
        .spawnCreep( [ constants.WORK, constants.CARRY, constants.MOVE, constants.MOVE, constants.CARRY ], Game.time.toString(), {
            memory: {
                worker_type: worker_type
            }
        } );
};

const canSpawn = ( spawn ) => {
    return spawn.energy >= 300;
};

const getNeededSpawns = ( room, worker_counts ) => {
    const all_creeps = room.find( FIND_MY_CREEPS );

    let current_counts = _
        .reduce( all_creeps, ( counts, creep ) => {
            if( !counts.hasOwnProperty( creep.memory.worker_type ) ) counts[ creep.memory.worker_type ] = 0;
            counts[ creep.memory.worker_type ]++;
            return counts;
        }, {} );

    let needed_counts = _
        .reduce( worker_counts, ( needed, val, type ) => {
            let current_val = current_counts.hasOwnProperty( type ) ? current_counts[ type ] : 0;
            if( val - current_val > 0 ) {
                needed[ type ] = val - current_val;
            }
            return needed;
        }, {} );

    return needed_counts;
};

const handleRoomState = ( room ) => {
    const current_state = _getCurrentState( room );

    if( current_state.isComplete( room ) ) {
        console.log( 'Room Progressed to next state' );
        room.memory._state.current_state++;
        return;
    }

    const spawn = room.find( FIND_MY_SPAWNS )[ 0 ];
    const needed_spawns = getNeededSpawns( room, current_state.worker_counts );

    console.log( JSON.stringify( needed_spawns ) );

    if( Object.keys( needed_spawns ).length > 0 && canSpawn( spawn ) ) {
        console.log( 'Spawning' );
        if( needed_spawns[ workers.types.HARVESTER ] ) {
            spawnCreep( spawn, workers.types.HARVESTER );
        }
        spawnCreep( spawn, Object.keys( needed_spawns )[ 0 ] )
    }

    room
        .find( FIND_MY_CREEPS )
        .forEach( ( creep ) => {
            const WorkerClass = workers.getClass( creep.memory.worker_type );
            const worker = new WorkerClass();
            worker.setCreep( creep );
            worker.doWork();
        } );

    current_state
        .construction_planners
        .forEach( ( planner ) => {
            planner.createConstructionSites( room );
        } );
}

const loopItem = ( func ) => {
    try {
        func();
    } catch ( e ) {
        console.log( e );
        throw e;
    }
}

module.exports.loop = function() {
    const spawn = Game.spawns[ 'Spawn1' ];
    const room = spawn.room;

    loopItem( () => {
        const collectors = [
            new CreepPositionCollector()
        ];

        collectors
            .forEach( ( collector ) => {
                collector.collect( room );
            } );
    } );

    loopItem( () => {
        handleRoomState( room );
    } );

    console.log( ' -- Tick End ' + Game.cpu.getUsed() + ' -- ' );
}
