const constants = require( '~/constants' );

const HarvestWorker = require( './HarvestWorker' );

class ExtractorHarvester extends HarvestWorker {
    constructor( assigner ) {
        super( assigner );
    }

    getSource( creep ) {
        let extractor = creep
            .room
            .find( FIND_MY_STRUCTURES, {
                filter: {
                    structureType: STRUCTURE_EXTRACTOR
                }
            } );

        return extractor;
    }

    doHarvest( creep, container ) {
        return creep.harvest( container );
    }

    getTarget( creep ) {
        return creep.room.storage;
    }
}

module.exports = ExtractorHarvester;
