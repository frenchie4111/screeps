const constants = require( '~/constants' );

const ContainerHarvester = require( './ContainerHarvester' );

const LinkManager = require( '~/room_manager/LinkManager' );

class LinkUpgrader extends ContainerHarvester {
    getSource( creep ) {
        let options = [];

        if( creep.room.storage && creep.room.storage.store[ RESOURCE_ENERGY ] > 50 ) {
            options.push( creep.room.storage );
        }

        let links = LinkManager.getLinksWithType( creep.room, LinkManager.LINK_TYPES.FULL );
        links = _.map( links, link => link.ref );

        options = options.concat( links );

        return creep.pos.findClosestByPath( options );
    }

    getTarget( creep ) {
        return creep.room.controller;
    }

    getBody( available_energy ) {
        let body = [ CARRY, WORK,  MOVE ];
        let parts = [ WORK, WORK, MOVE ];

        while( this.getEnergyOf( body ) + this.getEnergyOf( parts ) <= available_energy ) {
            body = body.concat( parts );
        }

        return  body;
    }

    doTransfer( creep, target ) {
        let res = creep.transfer( target, RESOURCE_ENERGY );
        if( creep.carry.energy < 30 ) {
            creep.withdraw( this.getSource( creep ), RESOURCE_ENERGY );
        }
        return res;
    }
}

module.exports = LinkUpgrader;
