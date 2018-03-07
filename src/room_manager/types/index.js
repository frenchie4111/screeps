const workers = require( '~/workers' ),
    constants = require( '~/constants' ),
    map = require( '~/lib/map' );

const ExtensionPlanner = require( '~/planner/ExtensionPlanner' ),
    SourceRoadPlanner = require( '~/planner/SourceRoadPlanner' ),
    ContainerPlanner = require( '~/planner/ContainerPlanner' ),
    StoragePlanner = require( '~/planner/StoragePlanner' ),
    TowerPlanner = require( '~/planner/TowerPlanner' ),
    WallPlanner = require( '~/planner/WallPlanner' ),
    RampartPlanner = require( '~/planner/RampartPlanner' ),
    ControllerSourceRoad = require( '~/planner/ControllerSourceRoad' ),
    OuterBaseRoads = require( '~/planner/OuterBaseRoads' ),
    BaseExitRoadPlanner = require( '~/planner/BaseExitRoadPlanner' ),
    LongDistanceMiningRoadPlanner = require( '~/planner/LongDistanceMiningRoadPlanner' ),
    LongDistanceMiningPlanner = require( '~/planner/LongDistanceMiningPlanner' ),
    BaseLinkPlanner = require( '~/planner/BaseLinkPlanner' ),
    ExtratorPlanner = require( '~/planner/ExtratorPlanner' ),
    ExtensionRoadPlanner = require( '~/planner/ExtensionRoadPlanner' );

const ROOM_TICKS_TO_UNRESERVE_THRESHOLD = 500;

const addWorkerCountsForLongDistanceMining = ( worker_counts, room ) => {
    let long_distance_operations = Object.keys( room.memory._long_distance ).length;
    worker_counts[ workers.types.LONG_DISTANCE_CONTAINER_MINER ] = long_distance_operations;
    worker_counts[ workers.types.LONG_DISTANCE_HAULER ] = _.sum( _.map( room.memory._long_distance, ( operation, key ) => operation.haulers ) );

    let rooms_to_reserve = _.uniq( _.map( room.memory._long_distance, ( long_distance ) => long_distance.room_name ) );
    rooms_to_reserve = _
        .filter( rooms_to_reserve, ( room ) => {
            if( !Memory.rooms[ room ].hasOwnProperty( 'resevered_until' ) ) return true;
            let ticks_til_unreserved = Memory.rooms[ room ].resevered_until - Game.time;
            return ticks_til_unreserved < ROOM_TICKS_TO_UNRESERVE_THRESHOLD;
        } );

    worker_counts[ workers.types.LONG_DISTANCE_RESERVER ] = rooms_to_reserve.length;
};

const addWorkerCountsForScout = ( worker_counts, room ) => {
    if( map.needsScout( room.name ) ) {
        worker_counts[ workers.types.SCOUT ] = 1;
    }
};

const addWorkerCountsForExtractor = ( worker_counts, room ) => {
    const extractors = room
        .find( FIND_MY_STRUCTURES, {
            filter: {
                structureType: STRUCTURE_EXTRACTOR
            }
        } );

    if( extractors.length > 0 ) {
        worker_counts[ workers.types.EXTRACTOR_HARVESTER ] = extractors.length;
    }
}

module.exports = { 
    STATES_VERSION: 3, // Increment this and the code will automatically reset current state on next deploy
    standard: [
        {
            isComplete: ( room ) => {
                return room.controller.level >= 2
            },
            worker_counts: {
                [ workers.types.HARVESTER ]: 1,
                [ workers.types.UPGRADER ]: 1
            },
            planners: []
        },
        {
            isComplete: ( room ) => {
                let containers = room
                    .find( FIND_MY_STRUCTURES, {
                        filter: {
                            structureType: STRUCTURE_CONTAINER
                        }
                    } );
                return containers.length >= 2;
            },
            worker_counts: {
                [ workers.types.HARVESTER ]: 1,
                [ workers.types.BUILDER ]: 3,
                [ workers.types.REPAIRER ]: 1
            },
            planners: [
                new ContainerPlanner( 'container' )
            ]
        },
        {
            isComplete: ( room ) => {
                let extensions = room
                    .find( FIND_MY_STRUCTURES, {
                        filter: {
                            structureType: constants.STRUCTURE_EXTENSION
                        }
                    } );
                return extensions.length >= 5;
            },
            worker_counts: {
                [ workers.types.HARVESTER ]: 1,
                [ workers.types.CONTAINER_BUILDER ]: 2,
                [ workers.types.CONTAINER_MINER ]: 2
            },
            planners: [
                new ExtensionPlanner( 'extension-1' )
            ]
        },
        {
            isComplete: ( room ) => {
                let construction_sites = room.find( FIND_MY_CONSTRUCTION_SITES );
                return construction_sites.length >= 0;
            },
            worker_counts: {
                [ workers.types.HARVESTER ]: 1,
                [ workers.types.CONTAINER_BUILDER ]: 3,
                [ workers.types.CONTAINER_REPAIRER ]: 1
            },
            planners: [
                new SourceRoadPlanner( 'spawn' ),
                new ControllerSourceRoad( 'controller' )
            ]
        },
        {
            isComplete: ( room ) => {
                return room.controller.level >= 3;
            },
            worker_counts: {
                [ workers.types.HARVESTER ]: 1,
                [ workers.types.CONTAINER_HARVESTER ]: 3,
                [ workers.types.CONATINER_REPAIRER ]: 1
            },
            planners: []
        },
        {
            isComplete: ( room ) => {
                let extensions = room
                    .find( FIND_MY_STRUCTURES, {
                        filter: {
                            structureType: constants.STRUCTURE_EXTENSION
                        }
                    } );
                return extensions.length === 10;
            },
            worker_counts: {
                [ workers.types.HARVESTER ]: 1, // Always keep a harvester around just in case
                [ workers.types.CONTAINER_EXTENSION ]: 1,
                [ workers.types.CONTAINER_BUILDER ]: 3,
                [ workers.types.CONTAINER_MINER ]: 2,
                [ workers.types.CONTAINER_REPAIRER ]: 1
            },
            planners: [
                new ExtensionPlanner( 'extension-2' ),
                new TowerPlanner( 'tower-1' )
            ]
        },
        {
            isComplete: ( room ) => {
                let construction_sites = room.find( FIND_MY_CONSTRUCTION_SITES );

                let storages = room
                    .find( FIND_MY_STRUCTURES, {
                        filter: {
                            structureType: STRUCTURE_STORAGE
                        }
                    } );

                return construction_sites.length === 0 && storages.length > 0;
            },
            worker_counts: {
                [ workers.types.HARVESTER ]: 1,
                [ workers.types.CONTAINER_EXTENSION ]: 1,
                [ workers.types.CONTAINER_BUILDER ]: 3,
                [ workers.types.CONTAINER_MINER ]: 2,
                [ workers.types.CONTAINER_REPAIRER ]: 1
            },
            planners: [
                new ExtensionPlanner( 'extension-3' ),
                new ExtensionRoadPlanner( 'extension-road-1' ),
                new StoragePlanner( 'storage-1' )
            ]
        },
        {
            isComplete: ( room ) => {
                return room.controller.level >= 5;
            },
            worker_counts: {
                [ workers.types.HARVESTER ]: 1,
                [ workers.types.CONTAINER_EXTENSION ]: 1,
                [ workers.types.CONTAINER_BUILDER ]: 3,
                [ workers.types.CONTAINER_MINER ]: 2,
                [ workers.types.CONTAINER_REPAIRER ]: 1,
                [ workers.types.SCOUT ]: 1
            },
            planners: []
        },
        {
            isComplete: ( room ) => {
                let extensions = room
                    .find( FIND_MY_STRUCTURES, {
                        filter: {
                            structureType: constants.STRUCTURE_EXTENSION
                        }
                    } );

                let construction_sites = room.find( FIND_MY_CONSTRUCTION_SITES );

                return extensions.length >= 30 && construction_sites.length <= 0;
            },
            worker_counts: {
                [ workers.types.HARVESTER ]: 1,
                [ workers.types.CONTAINER_EXTENSION ]: 1,
                [ workers.types.CONTAINER_BUILDER ]: 3,
                [ workers.types.CONTAINER_MINER ]: 2,
                [ workers.types.CONTAINER_REPAIRER ]: 1
            },
            planners: [
                new ExtensionPlanner( 'extension-4' ),
                new ExtensionRoadPlanner( 'extension-road-2' ),
                new WallPlanner( 'wall-planner-1' ),
                new RampartPlanner( 'rampart-planner-1' ),
                new OuterBaseRoads( 'outer-base-roads-1' ),
                new TowerPlanner( 'tower-2' ),
                new BaseExitRoadPlanner( 'base-exit-road-1' )
            ]
        },
        {
            isComplete: ( room ) => {
                return room.controller.level >= 6;
            },
            worker_counts: ( room ) => {
                let worker_counts = {
                    [ workers.types.HARVESTER ]: 1,
                    [ workers.types.CONTAINER_EXTENSION ]: 1,
                    [ workers.types.CONTAINER_BUILDER ]: 2,
                    [ workers.types.CONTAINER_MINER ]: 2,
                };

                addWorkerCountsForLongDistanceMining( worker_counts, room );
                addWorkerCountsForScout( worker_counts, room );

                return worker_counts;
            },
            planners: [
                new LongDistanceMiningPlanner( 'ldm-1' )
            ]
        },
        {
            isComplete: ( room ) => {
                return false;
            },
            worker_counts: ( room ) => {
                let worker_counts = {
                    [ workers.types.HARVESTER ]: 1,
                    [ workers.types.CONTAINER_EXTENSION ]: 1,
                    [ workers.types.CONTAINER_BUILDER ]: 1,
                    [ workers.types.CONTAINER_MINER ]: 2,
                };

                addWorkerCountsForLongDistanceMining( worker_counts, room );
                addWorkerCountsForScout( worker_counts, room );
                addWorkerCountsForExtractor( worker_counts, room );

                return worker_counts;
            },
            planners: ( room ) => {
                let planners = [
                    new ExtensionPlanner( 'extension-5' ),
                    new LongDistanceMiningPlanner( 'ldm-1' ),
                    new BaseLinkPlanner( 'base-link-planner' ),
                    new ExtratorPlanner( 'extrator-planner-1' )
                ];

                let long_distance_road_planners = _
                    .map( room.memory._long_distance, ( long_distance, source_id ) => {
                        return new LongDistanceMiningRoadPlanner( 'ldmr-' + source_id, long_distance );
                    } );

                planners = planners.concat( long_distance_road_planners );

                return planners;
            }
        }
    ],
    long_distance: null
};
