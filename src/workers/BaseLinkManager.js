const constants = require( '~/constants' ),
    move = require( '~/lib/move' ),
    position = require( '~/lib/position' );

const RenewWorker = require( './RenewWorker' );

const MarketManager = require( '~/room_manager/MarketManager' );
const BoostManager = require( '~/room_manager/BoostManager' );
const LinkManager = require( '~/room_manager/LinkManager' );

let STATES = {
    MOVE_TO_POSITION: 'MOVE_TO_POSITION',
    MANAGE: 'MANAGE'
};

let position_direction = [  0, +1 ];

const WITHDRAW_THRESHOLDS = {
    [ RESOURCE_ENERGY ]: 700000,
    [ RESOURCE_LEMERGIUM ]: 15000,
    [ RESOURCE_UTRIUM ]: 3000,
};

class BaseLinkManager extends RenewWorker {
    constructor( assigner ) {
        super( assigner, STATES.MOVE_TO_POSITION );
        this.CARRY_PARTS = 16;
    }

    getWhatNeedsTransferFromStorageToTerminal() {
        if( !this.room.terminal || !this.room.storage ) return false;

        let storage_store = this.room.storage.store;
        let terminal_store = this.room.terminal.store;

        if( terminal_store.energy < MarketManager.MIN_ENERGY ) {
            return [ 
                {
                    type: RESOURCE_ENERGY,
                    amount: MarketManager.MIN_ENERGY - terminal_store.energy
                } 
            ]
        };

        return _
            .chain( storage_store )
            .map( ( amount, type ) => {
                return { amount, type };
            } )
            .filter( ( { amount, type } ) => {
                if( !storage_store[ type ] ) return false;
                if( storage_store[ type ] > WITHDRAW_THRESHOLDS[ type ] ) return true;
            } )
            .filter( ( { amount, type } ) => {
                if( !terminal_store[ type ] ) return true;
                if( terminal_store[ type ] < MarketManager.SELL_THRESHOLDS[ type ] ) return true;
            } )
            .value();
    }
    
    needToTransferToTerminal() {
        if( !this.room.terminal || !this.room.storage ) return false;
        return this.getWhatNeedsTransferFromStorageToTerminal().length > 0;
    }

    needToTransferFromTerminalToLab( room ) {
        if( !this.room.terminal || !this.room.storage ) return false;

        let mineral = BoostManager.getNeededMineral( room );
        if( !mineral ) return false;

        if( this.room.terminal.store[ mineral.mineral ] > 0 ) {
            return mineral.mineral;
        }

        return false;
    }

    getTotalCarry( creep ) {
        return _.sum( Object.values( creep.carry ) );
    }

    carryingSomethingElse( creep, resource_type ) {
        let carry_amount = _.sum( Object.values( creep.carry ) );
        return ( carry_amount - ( creep.carry.hasOwnProperty( resource_type ) ? creep.carry[ resource_type ] : 0 ) ) > 0;
    }

    transferAll( creep, target, exclude=[] ) {
        let transfer_type = _.find( Object.keys( creep.carry ), type => !exclude.includes[ type ] && creep.carry[ type ] > 0 );
        console.log( 'transferAll', transfer_type );
        return creep.transfer( target, transfer_type );
    }

    _getStates() {
        return {
            [ STATES.MOVE_TO_POSITION ]: ( creep, state_memory, worker_memory ) => {
                let target_position = position.directionToPosition( this.spawn.pos, position_direction );

                if( position.equal( creep.pos, target_position ) ) {
                    return STATES.MANAGE;
                }

                return this.moveTo( target_position );
            },
            [ STATES.MANAGE ]: ( creep, state_memory, worker_memory ) => {
                let link = LinkManager.getBaseLink( creep.room );
                if( link ) link = link.ref;

                if( link && LinkManager.baseLinkNeedsEnergy( creep.room ) ) {
                    console.log( 'To Link' );
                    if( this.carryingSomethingElse( creep, RESOURCE_ENERGY ) ) {
                        console.log( 'Something else' );
                        this.transferAll( creep, this.room.storage, [ RESOURCE_ENERGY ] );
                    } if( creep.carry[ RESOURCE_ENERGY ] >= 800 ) {
                        console.log( 'To Link' );
                        creep.transfer( link, RESOURCE_ENERGY );
                    } else {
                        console.log( 'Withdraw' );
                        creep.withdraw( this.room.storage, RESOURCE_ENERGY );
                    }
                } else if( link && link.energy > 0 ) {
                    console.log( 'From Link' );
                    let creep_available_capacity = creep.carryCapacity - this.getTotalCarry( creep );
                    if( creep_available_capacity >= link.energy ) {
                        creep.withdraw( link, RESOURCE_ENERGY );
                    } else {
                        this.transferAll( creep, this.room.storage );
                    }
                } else if( this.spawn.energy < 150 ) {
                    console.log( 'Spawn' );

                    if( this.carryingSomethingElse( creep, RESOURCE_ENERGY ) ) {
                        this.transferAll( creep, this.room.storage, [ RESOURCE_ENERGY ] );
                    } if( creep.carry[ RESOURCE_ENERGY ] >= 300 ) {
                        creep.transfer( this.spawn, RESOURCE_ENERGY );
                    } else {
                        creep.withdraw( this.room.storage, RESOURCE_ENERGY, 300 );
                    }
                } else if( this.needToTransferToTerminal() || worker_memory.thing_to_transfer ) {
                    console.log( 'transfer to terminal' );
                    let transfer_things = this.getWhatNeedsTransferFromStorageToTerminal()
                    let thing_to_transfer = worker_memory.thing_to_transfer = worker_memory.thing_to_transfer || transfer_things[ 0 ].type;

                    if( this.carryingSomethingElse( creep, thing_to_transfer ) ) {
                        console.log( 'TransferAll' );
                        this.transferAll( creep, this.room.storage, [ thing_to_transfer ] );
                    } else if( creep.carry[ thing_to_transfer ] === creep.carryCapacity ) {
                        console.log( 'Transfer' );
                        creep.transfer( this.room.terminal, thing_to_transfer );
                        worker_memory.thing_to_transfer = null;
                    } else {
                        console.log( 'Withdraw' );
                        creep.withdraw( this.room.storage, thing_to_transfer );
                    }
                } else if( this.needToTransferFromTerminalToLab( creep.room ) || worker_memory.boost_transfer ) {
                    let boost_lab = BoostManager.getBoostLab( creep.room );
                    let mineral = this.needToTransferFromTerminalToLab( creep.room );

                    let thing_to_transfer = worker_memory.boost_transfer = worker_memory.boost_transfer || mineral;

                    if( this.carryingSomethingElse( creep, thing_to_transfer ) ) {
                        console.log( 'TransferAll' );
                        this.transferAll( creep, this.room.storage, [ thing_to_transfer ] );
                    } if( boost_lab.mineralType && boost_lab.mineralType !== thing_to_transfer ) {
                        creep.withdraw( boost_lab, boost_lab.mineralType );
                    } else if( creep.carry[ thing_to_transfer ] > 0 ) {
                        console.log( 'Transfer to lab' );
                        if( creep.transfer( boost_lab, thing_to_transfer ) === OK ) {
                            worker_memory.boost_transfer = null;
                        }
                    } else {
                        console.log( 'Withdraw from terminal' );
                        creep.withdraw( this.room.terminal, thing_to_transfer );
                        creep.withdraw( this.room.storage, thing_to_transfer );
                    }
                } else if( creep.carry[ RESOURCE_ENERGY ] > 0 ) {
                    console.log( 'TransferAll dump' );
                    this.transferAll( creep, this.room.storage );
                }

                return;
            }
        }
    }
    
    getBody( available_energy ) {
        let body = [ MOVE ];

        for( let i = 0; i < this.CARRY_PARTS; i++ ) {
            body.push( CARRY );
        }

        if( available_energy < this.getEnergyOf( body ) ) {
            return [];
        }

        return body;
    }
}

BaseLinkManager.STATES = STATES;

module.exports = BaseLinkManager;
