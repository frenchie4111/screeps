const worker_type_conversion = {
    HARVESTER: require( './HarvestWorker' ),
    BUILDER: require( './BuildWorker' ),
    UPGRADER: require( './UpgradeWorker' ),
    REPAIRER: require( './RepairWorker' ),
};

const types = {
    HARVESTER: 'HARVESTER',
    BUILDER: 'BUILDER',
    UPGRADER: 'UPGRADER',
    REPAIRER: 'REPAIRER',
};

module.exports = {
    getClass: ( type ) => {
        return worker_type_conversion[ type ];
    },
    types: types
};
