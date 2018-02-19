const worker_type_conversion = {
    HARVESTER: require( './HarvestWorker' ),
    BUILDER: require( './BuildWorker' ),
    UPGRADER: require( './UpgradeWorker' ),
};

const types = {
    HARVESTER: 'HARVESTER',
    BUILDER: 'BUILDER',
    UPGRADER: 'UPGRADER'
};

module.exports = {
    getClass: ( type ) => {
        return worker_type_conversion[ type ];
    },
    types: types
};
