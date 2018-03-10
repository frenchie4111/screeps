const loopItem = require( '~/lib/loopItem' ),
    position = require( '~/lib/position' );

const constants = require( '~/constants' ),
    workers = require( '~/workers' );

const Assigner = require( './Assigner' );

class MarketManager {
    getMemory( room ) {
        let memory = room.memory.market = room.memory.market || {};
        return memory;
    }

    doManage( room, spawn ) {
        let memory = this.getMemory( room );
        console.log( 'Market' );

        let current_energy = room.terminal.store[ RESOURCE_ENERGY ];
        if( current_energy < 100000 ) return;
        if( room.terminal.cooldown > 0 ) return;

        let orders = Game.market
            .getAllOrders( ( order ) => {
                return (
                    order.resourceType == RESOURCE_ENERGY &&
                    order.type == ORDER_BUY &&
                    order.price > 0.029 &&
                    order.amount >= 10000 &&
                    Game.market.calcTransactionCost( 10000, room.name, order.roomName ) < 10000 &&
                    ( Game.market.calcTransactionCost( 10000, room.name, order.roomName ) + order.amount ) < current_energy
                )
            } );

        orders = _
            .forEach( orders, ( order ) => {
                let order_total_eng_cost = ( 10000 + Game.market.calcTransactionCost( 10000, room.name, order.roomName ) );
                let total_profit = order.price * 10000;
                let per_eng_profit = total_profit / order_total_eng_cost;
                order.per_eng_profit = per_eng_profit;
            } );

        orders = _.sortBy( orders, order => order.per_eng_profit );
        orders.reverse();
        orders = orders.slice( 0, 10 );

        let order = orders[ 0 ];

        let response = Game.market.deal( order.id, 10000, room.name );

        console.log( 'Market response ', response, constants.lookup( response ) );
    }
}

module.exports = MarketManager;
