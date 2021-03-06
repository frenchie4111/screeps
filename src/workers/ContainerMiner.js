const position = require( '~/lib/position' );

const constants = require( '~/constants' );

const RenewWorker = require( './RenewWorker' );

let STATES = {
    MOVE_TO_CONTAINER: 'MOVE_TO_CONTAINER',
    HARVESTING: 'HARVESTING',
    MOVE_TO_CONSTRUCTION_SITE: 'MOVE_TO_CONSTRUCTION_SITE',
    CREATE_CONSTRUCTION_SITE: 'CREATE_CONSTRUCTION_SITE',
    BUILD_CONTAINER: 'BUILD_CONTAINER',
    REPAIR: 'REPAIR'
};

class ContainerMiner extends RenewWorker {
    constructor( assigner ) {
        super( assigner, STATES.MOVE_TO_CONTAINER );

        this.MAX_WORK_PARTS = 6;
        this.MAX_MOVE_PARTS = 3;
    }

    getBody( available_energy ) {
        let body = [ constants.MOVE, constants.CARRY ];
        let remaining_energy = available_energy - this.getEnergyOf( body );

        let work_parts = 0;
        while( remaining_energy > this.getEnergyOf( [ constants.WORK ] ) && work_parts < this.MAX_WORK_PARTS ) {
            remaining_energy -= this.getEnergyOf( [ constants.WORK ] );
            body.push( constants.WORK );
            work_parts++;
        }

        let move_parts = 1;
        while( remaining_energy > this.getEnergyOf( [ constants.MOVE ] ) && move_parts < this.MAX_MOVE_PARTS ) {
            remaining_energy -= this.getEnergyOf( [ constants.MOVE ] );
            body.push( constants.MOVE );
            move_parts++;
        }

        return body;
    }

    getCurrentCarry( creep ) {
        return _.sum( _.values( creep.carry ) );
    }

    isFull( creep ) {
        return this.getCurrentCarry( creep ) == creep.carryCapacity;
    }

    _getConstructionSite( source ) {
        let nearby_things = source.room.lookForAtArea( LOOK_CONSTRUCTION_SITES, source.pos.y - 1, source.pos.x - 1, source.pos.y + 1, source.pos.x + 1, true );

        let nearby_container = _
            .find( nearby_things, ( thing ) => {
                return (
                    thing.constructionSite.structureType === STRUCTURE_CONTAINER
                );
            } );

        if( nearby_container ) {
            return nearby_container.constructionSite;
        }
    }

    _getSourceContainers( room_name ) {
        if( !Memory.rooms[ room_name ].source_containers ) {
            Memory.rooms[ room_name ].source_containers = {};
        }
        return Memory.rooms[ room_name ].source_containers;
    }

    _updateSourceContainer( source, container ) {
        const source_containers = this._getSourceContainers( source.room.name );

        if( !source_containers[ source.id ] ) source_containers[ source.id ] = {};

        let source_container = source_containers[ source.id ];

        source_container.id = container.id;
        source_container.hits = container.hits;
        source_container.hitsMax = container.hitsMax;
        source_container.store = container.store;
    }

    _getContainerNearSource( source ) {
        let nearby_container = null;

        const source_containers = this._getSourceContainers( source.room.name );

        if( source_containers[ source.id ] ) {
            nearby_container = Game.getObjectById( source_containers[ source.id ].id );
        }

        if( nearby_container ) {
            return nearby_container;
        }

        let nearby_things = source.room.lookAtArea( source.pos.y - 1, source.pos.x - 1, source.pos.y + 1, source.pos.x + 1, true );

        nearby_container = _
            .find( nearby_things, ( thing ) => {
                return (
                    thing.type === 'structure' &&
                    thing.structure.structureType === STRUCTURE_CONTAINER
                );
            } );
        nearby_container = nearby_container ? nearby_container.structure : null;

        if( nearby_container ) {
            this._updateSourceContainer( source, nearby_container );
            return nearby_container;
        }
    }
    
    _createContainerConstructionSite( creep, source ) {
        let path = creep
            .pos
            .findPathTo( source, { 
                ignoreCreeps: true,
                swampCost: 1
            } );

        let position = path[ path.length - 2 ];
        position = creep.room.getPositionAt( position.x, position.y );

        console.log( 'Creating contruction site at ', position );

        return creep.room.createConstructionSite( position, STRUCTURE_CONTAINER );
    }
    
    _needsRepair( container ) {
        return ( container.hits / container.hitsMax ) < 0.9;
    }

    getSource( creep, worker_memory ) {
        return this.assigner.getAssigned( creep, 'CONTAINER_MINER' );
    }
    
    setRenew() {
        this.creep.drop( RESOURCE_ENERGY );
        super.setRenew();
    }

    _getStates() {
        return {
            [ STATES.MOVE_TO_CONTAINER ]: ( creep, state_memory, worker_memory ) => {
                if( !worker_memory.assigned_source_id ) {
                    worker_memory.assigned_source_id = this.getSource( creep, worker_memory ).id;
                }
                let source = Game.getObjectById( worker_memory.assigned_source_id );

                let container = this._getContainerNearSource( source );
                if( !container ) {
                    return STATES.BUILD_CONTAINER;
                }

                if( position.equal( creep.pos, container.pos ) ) return STATES.HARVESTING;

                this.moveTo( container );
            },
            [ STATES.CREATE_CONSTRUCTION_SITE ]: ( creep, state_memory, worker_memory ) => {
                let source = Game.getObjectById( worker_memory.assigned_source_id );
                let construction_site = this._getConstructionSite( source );

                console.log( 'construction_site', JSON.stringify( construction_site ) );

                if( !construction_site ) {
                    let create_response = this._createContainerConstructionSite( creep, source );
                    if( create_response === constants.OK ) {
                        console.log( 'Created Construction Site for Container' );
                    } else {
                        console.log( 'Failed to create construction site', constants.lookup( create_response ) );
                        return;
                    }
                }

                worker_memory.construction_site_id = construction_site.id;
                return STATES.MOVE_TO_CONSTRUCTION_SITE;
            },
            [ STATES.MOVE_TO_CONSTRUCTION_SITE ]: ( creep, state_memory, worker_memory ) => {
                if( !worker_memory.construction_site_id ) {
                    return STATES.CREATE_CONSTRUCTION_SITE;
                }
                let construction_site = Game.getObjectById( worker_memory.construction_site_id );

                if( position.equal( creep.pos, construction_site.pos ) ) return STATES.BUILD_CONTAINER;

                this.moveTo( construction_site );
            },
            [ STATES.BUILD_CONTAINER ]: ( creep, state_memory, worker_memory ) => {
                if( !worker_memory.construction_site_id ) {
                    return STATES.CREATE_CONSTRUCTION_SITE;
                }
                let construction_site = Game.getObjectById( worker_memory.construction_site_id );

                if( !construction_site ) {
                    console.log( 'Done contructing' );
                    worker_memory.construction_site_id = null;
                    return STATES.MOVE_TO_CONTAINER;
                }

                if( !position.equal( creep.pos, construction_site.pos ) ) {
                    return STATES.MOVE_TO_CONSTRUCTION_SITE;
                }

                let build_response = creep.build( construction_site );

                switch( build_response ) {
                    case constants.ERR_NOT_ENOUGH_RESOURCES:
                        return STATES.HARVESTING;
                        break;
                    case constants.ERR_NOT_IN_RANGE:
                        return STATES.MOVE_TO_CONSTRUCTION_SITE;
                        break;
                    case constants.OK:
                        break;
                    default:
                        console.log( 'Unknown build_response', constants.lookup( build_response ) );
                }
            },
            [ STATES.REPAIR ]: ( creep, state_memory, worker_memory ) => {
                let source = Game.getObjectById( worker_memory.assigned_source_id );
                let container = this._getContainerNearSource( source );

                worker_memory.repairing = true;

                if( !this._needsRepair( container ) ) {
                    worker_memory.repairing = false;
                    return STATES.HARVESTING;
                }

                let repair_response = creep.repair( container );
                switch( repair_response ) {
                    case constants.OK:
                        break;
                    case constants.ERR_NOT_ENOUGH_RESOURCES:
                        return STATES.HARVESTING;
                        break;
                    default:
                        console.log( 'Unknown repair_response', constants.lookup( repair_response ) );
                        break;
                }
            },
            [ STATES.HARVESTING ]: ( creep, state_memory, worker_memory ) => {
                let source = Game.getObjectById( worker_memory.assigned_source_id );

                let container = this._getContainerNearSource( source );

                if( container && this._needsRepair( container ) && this.isFull( creep ) ) {
                    return STATES.REPAIR;
                }

                if( worker_memory.construction_site_id && this.isFull( creep ) ) {
                    return STATES.BUILD_CONTAINER;
                }

                if( worker_memory.repairing && this.isFull( creep ) ) {
                    return STATES.REPAIR;
                }
                
                if( container && this.isFull( creep ) ) {
                    let current_contents = _.sum( _.values( container.store ) );

                    if( current_contents >= ( container.storeCapacity * 0.99 ) ) {
                        return;
                    }
                }

                if( container ) {
                    this._updateSourceContainer( source, container );
                }

                let harvest_response = creep.harvest( source );
                if( harvest_response !== OK ) {
                    console.log( 'harvest_response', constants.lookup( harvest_response ) );
                }
            }
        }
    }
}

ContainerMiner.STATES = STATES;

module.exports = ContainerMiner;
