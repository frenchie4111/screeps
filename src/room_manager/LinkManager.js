const loopItem = require( '~/lib/loopItem' ),
    position = require( '~/lib/position' );

const constants = require( '~/constants' ),
    workers = require( '~/workers' );

const Assigner = require( './Assigner' );

class LinkManager {
    getBaseLink( room, spawn ) {
        let link_memory = room.memory.links;

        if( !link_memory.base ) {
            let base_links = room.lookForAt( LOOK_STRUCTURES, position.directionToPosition( spawn.pos, [ +1, +1 ] ) );
            let base_link = _.find( base_links, ( structure ) => structure.structureType === STRUCTURE_LINK );
            if( base_link ) {
                link_memory.base = base_link.id;
            }
        }

        return link_memory.base;
    }

    getAllLinks( room ) {
        let links = room
            .find( FIND_MY_STRUCTURES, {
                filter: {
                    structureType: STRUCTURE_LINK
                }
            } );

        room.memory.links.all = _.map( links, link => link.id );

        return room.memory.links.all;
    }

    doManage( room, spawn ) {
        let links = room.memory.links = room.memory.links || {};

        let base_link_id = this.getBaseLink( room, spawn );
        let base_link = Game.getObjectById( base_link_id );
        let all_link_ids = this.getAllLinks( room, spawn );
        let transfered_to = [];

        for( let all_link_i in all_link_ids ) {
            let link = Game.getObjectById( all_link_ids[ all_link_i ] );
            if( link.energy > 700 && link.cooldown === 0 ) {
                link.transferEnergy( base_link );
                return;
            }
        }
    }
}

module.exports = LinkManager;
