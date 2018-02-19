const _ = require( 'lodash' );

const HarvestWorker = require( '~/workers/HarvestWorker' ),
    ExtensionPlanner = require( '~/construction_planner/ExtensionPlanner' ),
    constants = require( '~/constants' );

const CreepPositionCollector = require( '~/metrics/CreepPositionCollector' );

module.exports.loop = function() {
    const spawn = Game.spawns[ 'Spawn1' ];
    const room = spawn.room;

    try {
        let planner = new ExtensionPlanner( spawn );
        planner.createConstructionSites( spawn.room );
    } catch( e ) {
        console.log( e );
    }

    try {
        const collectors = [
            new CreepPositionCollector()
        ];

        collectors
            .forEach( ( collector ) => {
                collector.collect( room );
            } );
    } catch( e ) {
        console.log( e );
    }

    try {
        let target = Game.spawns[ 'Spawn1' ];
        if( target.energy == target.energyCapacity ) {
            target = Game.getObjectById( '05a0e654974d1746539e33d6' );
        }

        let harvest_worker = new HarvestWorker( Game.getObjectById( 'f0b7e1521242debad92c9126' ), target );
        harvest_worker.setCreep( Game.creeps[ 'test' ] );
        harvest_worker.doWork();
    } catch( e ) {
        console.log( e );
    }
    
    try {
        let upgrader = new HarvestWorker( Game.getObjectById( 'f0b7e1521242debad92c9126' ), Game.getObjectById( '05a0e654974d1746539e33d6' ) );
        upgrader.setCreep( Game.creeps[ 'test2' ] );
        upgrader.doWork();
    } catch( e ) {
        console.log( e );
    }

    console.log( ' -- Tick End ' + Game.cpu.getUsed() + ' -- ' );
}
