const HarvestWorker = require( './HarvestWorker' );

class BuildWorker extends HarvestWorker {
    getTarget( creep ) {
        return creep.room.find( FIND_MY_CONSTRUCTION_SITES )[ 0 ];
    }

    doTransfer( creep, target ) {
        return creep.build( target );
    }
}

module.exports = BuildWorker;
