let HarvestWorker = require( './workers/HarvestWorker' );

module.exports.loop = function() {
    try {
        let target = Game.spawns[ 'Spawn1' ];
        if( target.energy == target.energyCapacity ) {
            target = Game.getObjectById( '7bbb58a0e4c2c3c9262850eb' );
        }

        let harvest_worker = new HarvestWorker( Game.getObjectById( '75ad024922814d6cddc37871' ), target );
        harvest_worker.setCreep( Game.creeps[ 'test' ] );
        harvest_worker.doWork();
    } catch( e ) {
        
    }
    
    try {
        let upgrader = new HarvestWorker( Game.getObjectById( '75ad024922814d6cddc37871' ), Game.getObjectById( '7bbb58a0e4c2c3c9262850eb' ) );
        upgrader.setCreep( Game.creeps[ 'test2' ] );
        upgrader.doWork();
    } catch( e ) {
        
    }

    console.log( ' -- Tick End ' + Game.cpu.getUsed() + ' -- ' );
}
