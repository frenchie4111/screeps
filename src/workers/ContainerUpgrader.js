const constants = require( '~/constants' );

const ContainerHarvester = require( './ContainerHarvester' );

class ContainerUpgrader extends ContainerHarvester {
    getSource( creep ) {
        let options = [];
        if( creep.room.storage && creep.room.storage.store[ RESOURCE_ENERGY ] > 50 ) {
            options.push( creep.room.storage );
        }
        options.push( super.getSource( creep ) );

        return creep.pos.findClosestByPath( options );
    }

    getTarget( creep ) {
        return creep.room.controller;
    }

    getBody( available_energy ) {
        let body = [ CARRY, WORK, MOVE ];
        let parts = [ WORK, WORK, MOVE ];

        while( this.getEnergyOf( body ) + this.getEnergyOf( parts ) <= available_energy ) {
            body = body.concat( parts );
        }

        return  body;
    }
}

module.exports = ContainerUpgrader;
