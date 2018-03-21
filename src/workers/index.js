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
    LONG_DISTANCE_ROOM_CLEARER: require( './LongDistanceClearer' ),
    EXPANSION_CLEARER: require( './ExpansionClearer' ),
    EXPANSION_RESERVER: require( './ExpansionReserver' ),
    EXPANSION_BUILDER: require( './ExpansionBuilder' ),
    CONTAINER_UPGRADER: require( './ContainerUpgrader' ),
    CLEARER: require( './Clearer' ),
    DRAINER: require( './Drainer' ),
    ATTACK_PAIR_LEAD: require( './AttackPairLead' ),
    ATTACK_PAIR_FOLLOW: require( './AttackPairFollow' ),
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
    LONG_DISTANCE_ROOM_CLEARER: 'LONG_DISTANCE_ROOM_CLEARER',
    EXPANSION_CLEARER: 'EXPANSION_CLEARER',
    EXPANSION_RESERVER: 'EXPANSION_RESERVER',
    EXPANSION_BUILDER: 'EXPANSION_BUILDER',
    CONTAINER_UPGRADER: 'CONTAINER_UPGRADER',
    CLEARER: 'CLEARER',
    DRAINER: 'DRAINER',
    ATTACK_PAIR_LEAD: 'ATTACK_PAIR_LEAD',
    ATTACK_PAIR_FOLLOW: 'ATTACK_PAIR_FOLLOW',
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
