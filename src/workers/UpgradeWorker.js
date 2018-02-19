const lodash = require( 'lodash' );

const constants = require( '~/constants' );

const HarvestWorker = require( './HarvestWorker' );

class UpgradeWorker extends HarvestWorker {
    getTarget( creep ) {
        return creep.room.controller;
    }
}

module.exports = UpgradeWorker;
