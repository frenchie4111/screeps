const constants = require( '~/constants' ),
    move = require( '~/lib/move' );

const RenewWorker = require( './RenewWorker' );

let STATES = {
    MOVE_TO_HARVEST: 'MOVE_TO_HARVEST',
    MOVE_TO_HARVEST_ROOM: 'MOVE_TO_HARVEST_ROOM',
    HARVESTING: 'HARVESTING',
    MOVE_TO_TRANSFER: 'MOVE_TO_TRANSFER',
    MOVE_TO_TRANSFER_ROOM: 'MOVE_TO_TRANSFER_ROOM',
    TRANSFERRING: 'TRANSFERRING'
};

class HarvestWorker extends RenewWorker {
    constructor( assigner ) {
        super( assigner, STATES.MOVE_TO_HARVEST );
    }

    getSource( creep, worker_memory ) {
        let sources = creep.room.find( FIND_SOURCES );
        let source = creep.pos.findClosestByPath( sources, {
            filter: ( source ) => {
                return ( source.energy > 50 );
            }
        } );

        if( !source ) {
            console.log( creep.id, ' couldnt find available source' );
            return null;
        }

        return source;
    }

    getSourceRoomName( creep, worker_memory ) {
        let source = this.getSource( creep );
        if( !source ) return null;
        return source.room.name;
    }

    getTarget( creep, worker_memory ) {
        // HACK allows us to have 0 upgraders
        if( creep.room.controller.ticksToDowngrade < 1000 ) {
            return creep.room.controller;
        }

        let capacity_structures = creep.room
            .find( FIND_MY_STRUCTURES, {
                filter: ( structure ) => {
                    return ( 'energyCapacity' in structure ) &&
                        structure.structureType !== STRUCTURE_LINK &&
                        structure.energy < structure.energyCapacity &&
                        structure.structureType !== constants.STRUCTURE_TOWER;
                }
            } );
    
        if( capacity_structures.length === 0 ) {
            return creep.room.controller;
        }
    
        return capacity_structures[ 0 ];
    }

    setSuicide() {
        console.log( 'setSuicide' );
        if( this.getCurrentCarry() === 0 ) {
            super.setSuicide();
        } else {
            this.getMemory().suicide = true;
            this.setState( STATES.MOVE_TO_TRANSFER );
        }
    }

    getTargetRoomName( creep, worker_memory ) {
        let target = this.getTarget( creep, worker_memory );
        if( !target ) return null;
        return target.room.name;
    }

    getCurrentCarry() {
        return _.sum( _.values( this.creep.carry ) );
    }

    isFull() {
        return this.getCurrentCarry() == this.creep.carryCapacity;
    }
    
    doHarvest( creep, source ) {
        return creep.harvest( source );
    }

    doTransfer( creep, target ) {
        return creep.transfer( target, RESOURCE_ENERGY );
    }
    
    shouldStopHarvesting( creep, source ) {
        return false;
    }
    
    shouldStopTargetting( creep, target ) {
        return false;
    }
    
    afterTransferring( creep, worker_memory ) {
        return STATES.MOVE_TO_HARVEST;
    }

    _getStates() {
        return {
            [ STATES.MOVE_TO_HARVEST_ROOM ]: ( creep, state_memory, worker_memory ) => {
                if( !worker_memory.source_room_name ) {
                    worker_memory.source_room_name = this.getSourceRoomName( creep, worker_memory );
                }

                if( this.moveToRoom( worker_memory.source_room_name ) === move.ERR_IN_ROOM ) {
                    return STATES.MOVE_TO_HARVEST;
                }
            },
            [ STATES.MOVE_TO_HARVEST ]: ( creep, state_memory, worker_memory ) => {
                if( !worker_memory.source_room_name ) {
                    worker_memory.source_room_name = this.getSourceRoomName( creep, worker_memory );
                }

                if( creep.room.name !== worker_memory.source_room_name ) {
                    return STATES.MOVE_TO_HARVEST_ROOM;
                }

                if( !worker_memory.source_id ) {
                    let source = this.getSource( creep, worker_memory );
                    console.log( 'No available source' );
                    if( !source ) return; // Idle, no available sources
                    worker_memory.source_id = source.id;
                }
                worker_memory.target_id = null;

                if( this.isNear( creep, worker_memory.source_id ) ) return STATES.HARVESTING;
                if( this.isFull() ) return STATES.MOVE_TO_TRANSFER;

                let source = Game.getObjectById( worker_memory.source_id );
                if( !source ) {
                    worker_memory.source_id = null;
                    return STATES.MOVE_TO_HARVEST;
                }

                this.moveTo( Game.getObjectById( worker_memory.source_id ) );
            },
            [ STATES.HARVESTING ]: ( creep, state_memory, worker_memory ) => {
                if( !worker_memory.source_id ) return STATES.MOVE_TO_HARVEST;
                if( !this.isNear( creep, worker_memory.source_id ) ) return STATES.MOVE_TO_HARVEST;
                if( this.isFull() ) {
                    worker_memory.source_id = null;
                    return STATES.MOVE_TO_TRANSFER;
                }

                let source = Game.getObjectById( worker_memory.source_id );

                if( this.shouldStopHarvesting( creep, source ) ) {
                    worker_memory.source_id = null;
                    return STATES.MOVE_TO_HARVEST;
                }

                let harvest_response = this.doHarvest( creep, source );

                switch( harvest_response ) {
                    case constants.OK:
                        if( this.isFull() ) {
                            worker_memory.source_id = null;
                            return STATES.MOVE_TO_TRANSFER;
                        }
                        return;
                        break;
                    case constants.ERR_NOT_ENOUGH_ENERGY:
                        worker_memory.source_id = null;
                        break;    
                    default:
                        console.log( 'Unknown case', harvest_response, constants.lookup( harvest_response ) );
                        break;
                }
            },
            [ STATES.MOVE_TO_TRANSFER_ROOM ]: ( creep, state_memory, worker_memory ) => {
                if( !worker_memory.target_room_name ) {
                    worker_memory.target_room_name = this.getTargetRoomName( creep, worker_memory );
                }

                if( this.moveToRoom( worker_memory.target_room_name ) === move.ERR_IN_ROOM ) {
                    return STATES.MOVE_TO_TRANSFER;
                }
            },
            [ STATES.MOVE_TO_TRANSFER ]: ( creep, state_memory, worker_memory ) => {
                if( !worker_memory.target_room_name ) {
                    worker_memory.target_room_name = this.getTargetRoomName( creep, worker_memory );
                    if( !worker_memory.target_room_name ) {
                        // Idle, no available targets
                        console.log( 'No targets' );
                        return;
                    }
                }

                if( creep.room.name !== worker_memory.target_room_name ) {
                    return STATES.MOVE_TO_TRANSFER_ROOM;
                }

                if( !worker_memory.target_id ) {
                    let target = this.getTarget( creep, worker_memory );
                    console.log( 'No available targets' );
                    if( !target ) return; // Idle, no available targets
                    worker_memory.target_id = target.id;
                }

                let target = Game.getObjectById( worker_memory.target_id );
                const transfer_results = this.doTransfer( creep, target );

                if( this.getCurrentCarry() === 0 ) {
                    if( this.isSuicide() ) {
                        console.log( 'Done transfering, killing myself' );
                        super.setSuicide();
                        return;
                    }
                    return STATES.MOVE_TO_HARVEST;
                }

                switch( transfer_results ) {
                    case constants.OK:
                        return STATES.TRANSFERRING;
                        break;
                    case constants.ERR_FULL:
                        // Current target is full, get new target
                        worker_memory.target_id = null;
                        return STATES.MOVE_TO_TRANSFER;
                        break;
                    case constants.ERR_NOT_IN_RANGE:
                        this.moveTo( Game.getObjectById( worker_memory.target_id ) );
                        break;
                    case constants.ERR_INVALID_TARGET:
                        console.log( 'Tried to transfer to invalid target' );
                        worker_memory.target_id = null;
                        break;
                    default:
                        console.log( 'Unknown case', transfer_results, constants.lookup( transfer_results ) );
                }
            },
            [ STATES.TRANSFERRING ]: ( creep, state_memory, worker_memory ) => {
                if( !worker_memory.target_id ) return STATES.MOVE_TO_TRANSFER;

                if( this.getCurrentCarry() === 0 ) {
                    if( this.isSuicide() ) {
                        console.log( 'Done transfering, killing myself' );
                        super.setSuicide();
                        return;
                    }
                    return this.afterTransferring( creep, worker_memory );
                }

                let target = Game.getObjectById( worker_memory.target_id )

                if( this.shouldStopTargetting( creep, target ) ) {
                    worker_memory.target_id = null;
                    return this.instantTransition( STATES.MOVE_TO_TRANSFER );
                }

                const transfer_results = this.doTransfer( creep, Game.getObjectById( worker_memory.target_id ) );

                switch( transfer_results ) {
                    case constants.OK:
                        break;
                    case constants.ERR_FULL:
                        // Current target is full, get new target
                        worker_memory.target_id = null;
                        return this.instantTransition( STATES.MOVE_TO_TRANSFER );
                        break;
                    case constants.ERR_NOT_IN_RANGE:
                        this.moveTo( Game.getObjectById( worker_memory.target_id ) );
                        break;
                    case constants.ERR_INVALID_TARGET:
                        console.log( 'Tried to transfer to invalid target' );
                        worker_memory.target_id = null;
                        break;
                    default:
                        console.log( 'Unknown case', transfer_results, constants.lookup( transfer_results ) );
                        return this.afterTransferring( creep, worker_memory );
                }
            }
        }
    }
}

HarvestWorker.STATES = STATES;

module.exports = HarvestWorker;
