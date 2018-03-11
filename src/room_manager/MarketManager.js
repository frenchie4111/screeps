const loopItem = require( '~/lib/loopItem' ),
    position = require( '~/lib/position' );

const constants = require( '~/constants' ),
    workers = require( '~/workers' );

const Assigner = require( './Assigner' );

const SELL_THRESHOLDS = {
    [ RESOURCE_ENERGY ]: 100000,
    [ RESOURCE_LEMERGIUM ]: 3000
};

const SELL_AMOUNTS = {
    [ RESOURCE_ENERGY ]: 10000,
    [ RESOURCE_LEMERGIUM ]: 2000
};

const REASONABLE_PRICES = {
    [ RESOURCE_ENERGY ]: 0.029,
    [ RESOURCE_LEMERGIUM ]: 0.110
};

class MarketManager {
    getMemory( room ) {
        let memory = room.memory.market = room.memory.market || {};
        return memory;
    }

    getBestBuyOrderFor( room, resource_type, quantity, current_energy ) {
        let orders = Game.market
            .getAllOrders( ( order ) => {
                return (
                    order.resourceType == resource_type &&
                    REASONABLE_PRICES.hasOwnProperty( resource_type ) &&
                    order.type == ORDER_BUY &&
                    order.price > REASONABLE_PRICES[ resource_type ] &&
                    order.amount >= quantity &&
                    Game.market.calcTransactionCost( quantity, room.name, order.roomName ) < 10000 &&
                    ( Game.market.calcTransactionCost( quantity, room.name, order.roomName ) + ( resource_type === RESOURCE_ENERGY ? order.amount : 0 ) ) < current_energy
                )
            } );

        orders = _
            .forEach( orders, ( order ) => {
                // Cost of transaction evaluated using reasonable price for energy
                let transaction_cost_eng = Game.market.calcTransactionCost( quantity, room.name, order.roomName );
                let transaction_cost_credits = REASONABLE_PRICES[ RESOURCE_ENERGY ] * transaction_cost_eng;

                let profit = order.price * quantity;
                let per_resource_profit = profit / ( profit + transaction_cost_credits );

                order.transaction_cost_eng = transaction_cost_eng;
                order.per_resource_profit = per_resource_profit;
            } );

        orders = _.sortBy( orders, order => order.per_resource_profit );
        orders.reverse();
        orders = orders.slice( 0, 10 );

        return orders[ 0 ];
    }

    doManage( room, spawn ) {
        let memory = this.getMemory( room );

        let current_energy = room.terminal.store[ RESOURCE_ENERGY ];
        if( current_energy < 10000 ) return;
        if( room.terminal.cooldown > 0 ) return;

        let thing_to_sell = _
            .chain( room.terminal.store )
            .map( ( amount, type ) => {
                return { amount, type }
            } )
            .find( thing => thing.amount > SELL_THRESHOLDS[ thing.type ] )
            .value();

        if( !thing_to_sell ) return;

        console.log( 'thing_to_sell', thing_to_sell );
        let order = this.getBestBuyOrderFor( room, thing_to_sell.type, SELL_AMOUNTS[ thing_to_sell.type ], current_energy );

        console.log( JSON.stringify( order ) );

        let response = Game.market.deal( order.id, SELL_AMOUNTS[ thing_to_sell.type ], room.name );
        console.log( 'Market response ', response, constants.lookup( response ) );
    }
}

MarketManager.SELL_THRESHOLDS = SELL_THRESHOLDS;

module.exports = MarketManager;
