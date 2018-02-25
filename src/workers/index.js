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
};

module.exports = {
    getClass: ( type ) => {
        return worker_type_conversion[ type ];
    },
    types: types
};
