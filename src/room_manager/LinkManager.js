const loopItem = require( '~/lib/loopItem' ),
    position = require( '~/lib/position' );

const constants = require( '~/constants' );

const LINK_TYPES = {
    EMPTY: 'EMPTY',
    FULL: 'FULL',
    BASE: 'BASE'
};

const ERR_TYPES = {
    ERR_NO_BASE_LINK: 'ERR_NO_BASE_LINK',
    NOOP: 'NOOP',
};

class LinkManager {
    getMemory( room ) {
        const default_memory = {
            links: [],
            pending_links: []
        };

        room.memory.links = room.memory.links || default_memory;
        return room.memory.links;
    }

    registerPendingLink( room, pos, type ) {
        let memory = this.getMemory( room );

        memory.pending_links.push( {
            pos: position.clone( pos ),
            type
        } );
    }

    registerLink( room, link, type ) {
        let memory = this.getMemory( room );
        memory.links.push( {
            id: link.id,
            type
        } );
    }

    handlePendingLinks( room ) {
        let memory = this.getMemory( room );
        memory.pending_links = _
            .reduce( memory.pending_links, ( pending_links, pending_link ) => {
                let links = room.lookForAt( LOOK_STRUCTURES, position.fromJSON( pending_link.pos ) );
                let link = _.find( links, ( structure ) => structure.structureType === STRUCTURE_LINK );
                if( link ) {
                    this.registerLink( room, link, pending_link.type );
                } else {
                    pending_links.push( pending_link );
                }
            }, [] );
    }

    getLinksWithType( room, type ) {
        let links = this.getMemory( room ).links;
        links = _.filter( links, ( link ) => link.type === type );
        links = _.forEach( links, ( link ) => link.ref = Game.getObjectById( link.id ) );
        return links;
    }

    getBaseLink( room ) {
        let links = this.getLinksWithType( room, LINK_TYPES.BASE );
        if( links.length === 0 ) return null; 
        return links[ 0 ];
    }

    baseLinkNeedsEnergy( room ) {
        let full_links = this.getLinksWithType( room, LINK_TYPES.FULL );
        return _.any( full_links, ( link_desc ) => link_desc.ref.energy === 0 );
    }

    doManage( room, spawn ) {
        this.handlePendingLinks( room );

        let base_link = this.getBaseLink( room );
        if( !base_link ) return ERR_TYPES.ERR_NO_BASE_LINK;

        let empty_links = this.getLinksWithType( room, LINK_TYPES.EMPTY );
        let full_links = this.getLinksWithType( room, LINK_TYPES.FULL );

        let links = this.getMemory( room ).links;   

        // Handle EMPTY links first
        for( let link_i in empty_links ) {
            let link_desc = empty_links[ link_i ];
            console.log( JSON.stringify( link_desc ) );
            if( link_desc.ref.energy > 0 && link_desc.ref.cooldown === 0 ) {
                let link_to_transfer_to = _.find( full_links, ( full_link_desc ) => full_link_desc.ref.energy === 0 );
                if( !link_to_transfer_to && base_link.ref.energy === 0 ) {
                    link_to_transfer_to = base_link;
                }
                if( link_to_transfer_to ) {
                    link_desc.ref.transferEnergy( link_to_transfer_to.ref );
                    return;
                }
            }
        }

        // Transfer from BASE -> FULL if we can
        for( let link_i in full_links ) {
            let link_desc = full_links[ link_i ];
            if( link_desc.ref.energy === 0 && base_link.ref.energy === base_link.ref.energyCapacity && base_link.ref.cooldown === 0 ) {
                base_link.ref.transferEnergy( link_desc.ref );
                return;
            }
        }

        return ERR_TYPES.NOOP;
    }
}

module.exports = new LinkManager();
module.exports.LINK_TYPES = LINK_TYPES;

global.addLink = ( room, link_id, type ) => {
    if( !room || !link_id || !type ) return ERR_INVALID_ARGS;
    if( !Game.getObjectById( link_id ) ) return 'Can\'t find link';
    if( !Object.keys( LINK_TYPES ).includes( type ) ) return 'Invalid type';

    module.exports.registerLink( room, Game.getObjectById( link_id ), type );
};
