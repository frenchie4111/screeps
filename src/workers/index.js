const worker_type_conversion = {
    HARVESTER: require( './HarvestWorker' ),
    BUILDER: require( './BuildWorker' )
};

const types = {
    HARVESTER: 'HARVESTER',
    BUILDER: 'BUILDER'
};

module.exports = {
    getClass: ( type ) => {
        return worker_type_conversion[ type ];
    },
    types: types
};
