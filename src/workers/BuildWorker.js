const HarvestWorker = require( './HarvestWorker' );

class BuildWorker extends HarvestWorker {
    doTransfer() {
        return this.creep.build( this.target );
    }
}

module.exports = BuildWorker;
