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
    LongDistanceLinkPlanner = require( '~/planner/LongDistanceLinkPlanner' ),
    BaseLinkPlanner = require( '~/planner/BaseLinkPlanner' ),
    ExtractorPlanner = require( '~/planner/ExtractorPlanner' ),
    ExtractorRoad = require( '~/planner/ExtractorRoad' ),
    ExtensionRoadPlanner = require( '~/planner/ExtensionRoadPlanner' ),
    ExpansionPlanner = require( '~/planner/ExpansionPlanner' ),
    ExpansionSpawnPlanner = require( '~/planner/ExpansionSpawnPlanner' ),
    RoomTypeTransition = require( '~/planner/RoomTypeTransition' ),
    ExtensionTreePlanner = require( '~/planner/ExtensionTreePlanner' ),
    TerminalPlanner = require( '~/planner/TerminalPlanner' ),
    BoostLabPlanner = require( '~/planner/BoostLabPlanner' ),
    SpawnRoadPlanner = require( '~/planner/SpawnRoadPlanner' ),
    ExpansionRoadPlanner = require( '~/planner/ExpansionRoadPlanner' ),
    ControllerLinkPlanner = require( '~/planner/ControllerLinkPlanner' );

const ROOM_TICKS_TO_UNRESERVE_THRESHOLD = 500;

const addWorkerCountsForLongDistanceMining = ( worker_counts, room ) => {
    let long_distance_operations = Object.keys( room.memory._long_distance ).length;
    worker_counts[ workers.types.LONG_DISTANCE_CONTAINER_MINER ] = long_distance_operations;
    worker_counts[ workers.types.LONG_DISTANCE_HAULER ] = _.sum( _.map( room.memory._long_distance, ( operation, key ) => operation.haulers ) );

    let rooms_to_reserve = _.uniq( _.map( room.memory._long_distance, ( long_distance ) => long_distance.room_name ) );
    rooms_to_reserve = _
        .filter( rooms_to_reserve, ( room ) => {
            if( Memory.rooms[ room ].dangerous_until && Memory.rooms[ room ].dangerous_until > Game.time ) return false;
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

    worker_counts[ workers.types.EXTRACTOR_HARVESTER ] = 0;

    if( extractors.length > 0 ) {
        let minerals = room.lookForAt( LOOK_MINERALS, extractors[ 0 ].pos );
        if( minerals.length > 0 ) {
            if( minerals[ 0 ].mineralAmount > 0 ) {
                worker_counts[ workers.types.EXTRACTOR_HARVESTER ] = extractors.length;
            }
        }
    }
};

const addWorkerCountsForBuild = ( worker_counts, room ) => {
    const construction_sites = room.find( FIND_MY_CONSTRUCTION_SITES );

    if( construction_sites.length > 0 ) {
        worker_counts[ workers.types.CONTAINER_BUILDER ] = 1;
    }
};

module.exports = { 
    STATES_VERSION: 5, // Increment this and the code will automatically reset current state on next deploy
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
                    .find( FIND_STRUCTURES, {
                        filter: {
                            structureType: STRUCTURE_CONTAINER
                        }
                    } );
                let sources = room.find( FIND_SOURCES );
                console.log( 'isComplete', containers.length, sources.length );
                return containers.length === sources.length;
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
                let planners_run = room.memory._planners[ 'extension-road' ];
                let construction_sites = room.find( FIND_MY_CONSTRUCTION_SITES );
                return planners_run && construction_sites.length === 0;
            },
            worker_counts: {
                [ workers.types.HARVESTER ]: 1,
                [ workers.types.CONTAINER_BUILDER ]: 3,
                [ workers.types.CONTAINER_MINER ]: 2,
                [ workers.types.CONTAINER_REPAIRER ]: 1
            },
            planners: [
                new ExtensionRoadPlanner( 'extension-road' ),
                new SourceRoadPlanner( 'spawn' ),
                new ControllerSourceRoad( 'controller' ),
                new SpawnRoadPlanner( 'srp' )
            ]
        },
        {
            isComplete: ( room ) => {
                return room.controller.level >= 3;
            },
            worker_counts: {
                [ workers.types.HARVESTER ]: 1,
                [ workers.types.CONTAINER_HARVESTER ]: 3,
                [ workers.types.CONTAINER_MINER ]: 2,
                [ workers.types.CONTAINER_REPAIRER ]: 1
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
                return extensions.length >= 10;
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
                new ExtensionRoadPlanner( 'extension-road-lvl-3' ),
                new TowerPlanner( 'tower-1' )
            ]
        },
        {
            isComplete: ( room ) => {
                return room.controller.level >= 4;
            },
            worker_counts: {
                [ workers.types.HARVESTER ]: 1,
                [ workers.types.CONTAINER_EXTENSION ]: 1,
                [ workers.types.CONTAINER_HARVESTER ]: 1,
                [ workers.types.CONTAINER_MINER ]: 2,
                [ workers.types.CONTAINER_UPGRADER ]: 3,
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
                return extensions.length >= 20;
            },
            worker_counts: {
                [ workers.types.HARVESTER ]: 1, // Always keep a harvester around just in case
                [ workers.types.CONTAINER_EXTENSION ]: 1,
                [ workers.types.CONTAINER_BUILDER ]: 3,
                [ workers.types.CONTAINER_MINER ]: 2
            },
            planners: [
                new ExtensionPlanner( 'extension-lvl-4' )
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
                [ workers.types.CONTAINER_MINER ]: 2
            },
            planners: [
                new ExtensionRoadPlanner( 'extension-road-1' ),
                new StoragePlanner( 'storage-1' )
            ]
        },
        {
            isComplete: ( room ) => {
                return room.controller.level >= 5;
            },
            worker_counts: ( room, assigner ) => {
                let worker_counts = {
                    [ workers.types.HARVESTER ]: 1,
                    [ workers.types.CONTAINER_EXTENSION ]: 1,
                    [ workers.types.CONTAINER_HARVESTER ]: 1,
                    [ workers.types.CONTAINER_MINER ]: 2,
                    [ workers.types.CONTAINER_UPGRADER ]: 3,
                };

                addWorkerCountsForScout( worker_counts, room );

                worker_counts[ workers.types.CLEARER ] = assigner.getSpawnCount( assigner.types.CLEARER );

                return worker_counts;
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
                [ workers.types.CONTAINER_MINER ]: 2
            },
            planners: [
                new ExtensionPlanner( 'extension-4' ),
                new ExtensionRoadPlanner( 'extension-road-2' ),
                new WallPlanner( 'wall-planner-1' ),
                new BaseExitRoadPlanner( 'base-exit-road-1' ),
                new TowerPlanner( 'tower-2' )
            ]
        },
        {
            isComplete: ( room ) => {
                let planners_run = room.memory._planners[ 'clp-1' ];
                let construction_sites = room.find( FIND_MY_CONSTRUCTION_SITES );
                return planners_run && construction_sites.length <= 0;
            },
            worker_counts: {
                [ workers.types.HARVESTER ]: 1,
                [ workers.types.CONTAINER_EXTENSION ]: 1,
                [ workers.types.CONTAINER_BUILDER ]: 3,
                [ workers.types.CONTAINER_MINER ]: 2
            },
            planners: [
                new OuterBaseRoads( 'outer-base-roads-1' ),
                new RampartPlanner( 'rampart-planner-1' ),
                new BaseLinkPlanner( 'base-link-planner' ),
                new ControllerLinkPlanner( 'clp-1' )
            ]
        },
        {
            isComplete: ( room ) => {
                return room.controller.level >= 6;
            },
            worker_counts: ( room, assigner ) => {
                let worker_counts = {
                    [ workers.types.HARVESTER ]: 1,
                    [ workers.types.CONTAINER_EXTENSION ]: 1,
                    [ workers.types.LINK_UPGRADER ]: 1,
                    [ workers.types.CONTAINER_MINER ]: 2,
                    [ workers.types.BASE_LINK_MANAGER ]: 1,
                    [ workers.types.HAULER ]: 1
                };

                addWorkerCountsForLongDistanceMining( worker_counts, room );
                addWorkerCountsForScout( worker_counts, room );
                addWorkerCountsForBuild( worker_counts, room );

                worker_counts[ workers.types.LONG_DISTANCE_ROOM_CLEARER ] = assigner.getSpawnCount( assigner.types.LONG_DISTANCE_ROOM_CLEARER );
                worker_counts[ workers.types.CLEARER ] = assigner.getSpawnCount( assigner.types.CLEARER );
                // worker_counts[ workers.types.DRAINER ] = assigner.getSpawnCount( assigner.types.DRAINER );

                return worker_counts;
            },
            planners: [
                new LongDistanceMiningPlanner( 'ldm-1' ),
                new WallPlanner( 'wall-planner-re' ),
            ]
        },
        {
            isComplete: ( room ) => {
                return false;
            },
            max_renew: 2,
            worker_counts: ( room, assigner ) => {
                let worker_counts = {
                    [ workers.types.HARVESTER ]: 1,
                    [ workers.types.CONTAINER_EXTENSION ]: 1,
                    [ workers.types.LINK_UPGRADER ]: 2,
                    [ workers.types.CONTAINER_MINER ]: 2,
                    [ workers.types.BASE_LINK_MANAGER ]: 1
                };

                addWorkerCountsForLongDistanceMining( worker_counts, room );
                addWorkerCountsForScout( worker_counts, room );
                addWorkerCountsForExtractor( worker_counts, room );
                addWorkerCountsForBuild( worker_counts, room );

                worker_counts[ workers.types.ATTACK_PAIR_LEAD ] = assigner.getSpawnCount( assigner.types.ATTACK_PAIR_LEAD );
                worker_counts[ workers.types.ATTACK_PAIR_FOLLOW ] = assigner.getSpawnCount( assigner.types.ATTACK_PAIR_FOLLOW );

                worker_counts[ workers.types.CLEARER ] = assigner.getSpawnCount( assigner.types.CLEARER );

                worker_counts[ workers.types.EXPANSION_CLEARER ] = assigner.getSpawnCount( assigner.types.EXPANSION_CLEARER );
                worker_counts[ workers.types.EXPANSION_RESERVER ] = assigner.getSpawnCount( assigner.types.EXPANSION_RESERVER );
                worker_counts[ workers.types.EXPANSION_BUILDER ] = assigner.getSpawnCount( assigner.types.EXPANSION_BUILDER );

                return worker_counts;
            },
            planners: ( room ) => {
                let planners = [
                    new ExtensionPlanner( 'extension-5' ),
                    new LongDistanceMiningPlanner( 'ldm-1' ),
                    new ExtractorPlanner( 'extractor-planner-1' ),
                    new ExtractorRoad( 'extractor-road-1' ),
                    new ExtractorRoad( 'extractor-road-1' ),
                    new TerminalPlanner( 'terminal-1' ),
                    new BoostLabPlanner( 'boost-lab-1' ),
                    new ExpansionPlanner( 'expansion' ),
                ];

                let long_distance_road_planners = _
                    .map( room.memory._long_distance, ( long_distance, source_id ) => {
                        return new LongDistanceMiningRoadPlanner( 'ldmr-' + source_id, long_distance );
                    } );

                planners = planners.concat( long_distance_road_planners );

                let long_distance_link_planners = []
                _
                    .forEach( room.memory._long_distance, ( long_distance ) => {
                        if( !long_distance.use_link ) return;

                        long_distance_link_planners.push( new LongDistanceLinkPlanner( 'ldml-' + long_distance.source_id, long_distance ) );
                    } );

                planners = planners.concat( long_distance_link_planners );

                return planners;
            }
        }
    ],
    long_distance: null,
    cleared: null,
    expansion: [
        {
            isComplete: ( room ) => {
                return room.find( FIND_HOSTILE_STRUCTURES );
            },
            worker_counts: {},
            planners: []
        },
        {
            isComplete: ( room ) => {
                return room.controller.my;
            },
            worker_counts: {},
            planners: []
        },
        {
            isComplete: ( room ) => {
                return room.find( FIND_MY_SPAWNS ).length > 0;
            },
            worker_counts: {},
            planners: [
                new ExpansionSpawnPlanner( 'expansion-spawn' ),
                new ExpansionRoadPlanner( 'erp' )
            ]
        },
        {
            isComplete: () => {},
            worker_counts: {},
            planners: [
                new RoomTypeTransition( 'room-type-transition-standard', 'standard' )
            ]
        }
    ]
};
