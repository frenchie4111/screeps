const worker_type_conversion = {
    HARVESTER: require( './HarvestWorker' ),
    BUILDER: require( './BuildWorker' ),
    UPGRADER: require( './UpgradeWorker' ),
    REPAIRER: require( './RepairWorker' ),
    CONTAINER_MINER: require( './ContainerMiner' ),
    CONTAINER_HARVESTER: require( './ContainerHarvester' ),
    CONTAINER_EXTENSION: require( './ContainerExtension' ),
    CONTAINER_BUILDER: require( './ContainerBuilder' ),
    CONTAINER_REPAIRER: require( './ContainerRepairer' ),
    SCOUT: require( './Scout' ),
    LONG_DISTANCE_CONTAINER_MINER: require( './LongDistanceContainerMiner' ),
    LONG_DISTANCE_HAULER: require( './LongDistanceHauler' ),
    LONG_DISTANCE_RESERVER: require( './LongDistanceReserver' ),
    EXTRACTOR_HARVESTER: require( './ExtractorHarvester' ),
    BASE_LINK_MANAGER: require( './BaseLinkManager' ),
};

const types = {
    HARVESTER: 'HARVESTER',
    BUILDER: 'BUILDER',
    UPGRADER: 'UPGRADER',
    REPAIRER: 'REPAIRER',
    REPAIRER: 'REPAIRER',
    CONTAINER_MINER: 'CONTAINER_MINER',
    CONTAINER_HARVESTER: 'CONTAINER_HARVESTER',
    CONTAINER_EXTENSION: 'CONTAINER_EXTENSION',
    CONTAINER_BUILDER: 'CONTAINER_BUILDER',
    CONTAINER_REPAIRER: 'CONTAINER_REPAIRER',
    SCOUT: 'SCOUT',
    LONG_DISTANCE_CONTAINER_MINER: 'LONG_DISTANCE_CONTAINER_MINER',
    LONG_DISTANCE_HAULER: 'LONG_DISTANCE_HAULER',
    LONG_DISTANCE_RESERVER: 'LONG_DISTANCE_RESERVER',
    EXTRACTOR_HARVESTER: 'EXTRACTOR_HARVESTER',
    BASE_LINK_MANAGER: 'BASE_LINK_MANAGER',
};

module.exports = {
    getClass: ( type ) => {
        let WorkerClass = worker_type_conversion[ type ];
        if( !WorkerClass ) {
            console.log( 'No worker class for type', type );
        }
        return WorkerClass;
    },
    workerClassHasProperty: ( type, property ) => {
        const WorkerClass = module.exports.getClass( type );
        return property in WorkerClass.prototype;
    },
    types: types
};
