const workers = require( '~/workers' ),
    constants = require( '~/constants' );

const ExtensionPlanner = require( '~/construction_planner/ExtensionPlanner' ),
    SourceRoadPlanner = require( '~/construction_planner/SourceRoadPlanner' ),
    ContainerPlanner = require( '~/construction_planner/ContainerPlanner' ),
    StoragePlanner = require( '~/construction_planner/StoragePlanner' ),
    TowerPlanner = require( '~/construction_planner/TowerPlanner' ),
    WallPlanner = require( '~/construction_planner/WallPlanner' ),
    RampartPlanner = require( '~/construction_planner/RampartPlanner' ),
    ControllerSourceRoad = require( '~/construction_planner/ControllerSourceRoad' ),
    OuterBaseRoads = require( '~/construction_planner/OuterBaseRoads' ),
    ExtensionRoadPlanner = require( '~/construction_planner/ExtensionRoadPlanner' );

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
            construction_planners: []
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
            construction_planners: [
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
            construction_planners: [
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
            construction_planners: [
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
            construction_planners: []
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
            construction_planners: [
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
            construction_planners: [
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
            construction_planners: []
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
            construction_planners: [
                new ExtensionPlanner( 'extension-4' ),
                new ExtensionRoadPlanner( 'extension-road-2' ),
                new WallPlanner( 'wall-planner-1' ),
                new RampartPlanner( 'rampart-planner-1' ),
                new OuterBaseRoads( 'outer-base-roads-1' ),
                new TowerPlanner( 'tower-2' )
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
                    [ workers.types.CONTAINER_BUILDER ]: 3,
                    [ workers.types.CONTAINER_MINER ]: 2,
                    [ workers.types.SCOUT ]: 1
                };

                let long_distance_operations = Object.keys( room.memory._long_distance ).length;

                worker_counts[ workers.types.LONG_DISTANCE_CONTAINER_MINER ] = long_distance_operations;

                return worker_counts;
            },
            construction_planners: []
        }
    ],
    long_distance: null
};
