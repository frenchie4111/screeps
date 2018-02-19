const _ = require( 'lodash' );

const workers = require( '~/workers' ),
    ExtensionPlanner = require( '~/construction_planner/ExtensionPlanner' ),
    constants = require( '~/constants' ),
    RoomState = require( '~/room_state/RoomState' );
    
const HarvestWorker = require( '~/workers/HarvestWorker' );
const BuildWorker = require( '~/workers/BuildWorker' );
const UpgradeWorker = require( '~/workers/UpgradeWorker' );

const CreepPositionCollector = require( '~/metrics/CreepPositionCollector' );

// const room_states = [
//     new RoomState( {
//         isComplete: ( room ) => {
//             return room.controller.level === 2
//         },
//         worker_counts: {
//             [ workers.types.HARVESTER ]: 1,
//             [ workers.types.UPGRADER ]: 1
//         },
//         construction_planners: []
//     } ),
//     new RoomState( {
//         isComplete: ( room ) => {
//             return room
//                 .find( FIND_MY_STRUCTURES, {
//                     filter: {
//                         structureType: constants.STRUCTURE_EXTENSION
//                     }
//                 } )
//                 .lenth === 5;
//         },
//         worker_counts: {
//             [ workers.types.BUILDER ]: 2,
//             [ workers.types.HARVESTER ]: 1,
//             [ workers.types.UPGRADER ]: 1
//         },
//         construction_planners: [
//             new ExtensionPlanner()
//         ]
//     } )
// ];

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
        let planner = new ExtensionPlanner( spawn );
        planner.createConstructionSites( spawn.room );
    } );

    loopItem( () => {
        const collectors = [
            new CreepPositionCollector()
        ];

        collectors
            .forEach( ( collector ) => {
                collector.collect( room );
            } );
    } );

    // loopItem( () => {
    //     let harvest_worker = new UpgradeWorker();
    //     harvest_worker.setCreep( Game.creeps[ 'test1' ] );
    //     harvest_worker.doWork( Game.creeps[ 'test1' ] );
    // } );

    loopItem( () => {
        let upgrader = new UpgradeWorker();
        upgrader.setCreep( Game.creeps[ 'test1' ] );
        upgrader.doWork( Game.creeps[ 'test1' ] );
    } );

    // 
    // loopItem( () => {
    //     let builder = new BuildWorker( Game.getObjectById( '4f8b2856c51a773cb6503612' ) );
    //     builder.setCreep( Game.creeps[ 'test3' ] );
    //     builder.doWork();
    // } );

    console.log( ' -- Tick End ' + Game.cpu.getUsed() + ' -- ' );
}
