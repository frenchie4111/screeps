const constants = require( '~/constants' );

const HarvestWorker = require( './HarvestWorker' );

class ExtractorHarvester extends HarvestWorker {
    constructor( assigner ) {
        super( assigner );
    }

    getSource( creep ) {
        let minerals = creep
            .room
            .find( FIND_MINERALS );

        if( minerals.length === 0 ) {
            throw new Error( 'No Minerals' );
        }

        console.log( 'minerals', JSON.stringify( minerals ) );

        this.getMemory().mineral_type = minerals[ 0 ].mineralType;

        return minerals[ 0 ];
    }

    doHarvest( creep, container ) {
        return creep.harvest( container );
    }

    getTarget( creep ) {
        return creep.room.storage;
    }
    
    doTransfer( creep, target ) {
        return creep.transfer( target, this.getMemory().mineral_type )
    }
}

module.exports = ExtractorHarvester;
