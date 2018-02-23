const worker_type_conversion = {
    HARVESTER: require( './HarvestWorker' ),
    BUILDER: require( './BuildWorker' ),
    UPGRADER: require( './UpgradeWorker' ),
    REPAIRER: require( './RepairWorker' ),
    CONTAINER_MINER: require( './ContainerMinerWorker' ),
    CONTAINER_HARVESTER: require( './ContainerHarvester' )
};

const types = {
    HARVESTER: 'HARVESTER',
    BUILDER: 'BUILDER',
    UPGRADER: 'UPGRADER',
    REPAIRER: 'REPAIRER',
    REPAIRER: 'REPAIRER',
    CONTAINER_MINER: 'CONTAINER_MINER',
    CONTAINER_HARVESTER: 'CONTAINER_HARVESTER',
};

module.exports = {
    getClass: ( type ) => {
        return worker_type_conversion[ type ];
    },
    types: types
};
