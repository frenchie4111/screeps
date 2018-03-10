const loopItem = require( '~/lib/loopItem' ),
    position = require( '~/lib/position' );

const constants = require( '~/constants' ),
    workers = require( '~/workers' );

const Assigner = require( './Assigner' );

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

    // handleRoomState : doManage-E44S3 : market : 
    // false 
    // {"created":4165479,"type":"buy","amount":10000,"remainingAmount":10000,"resourceType":"energy","price":0.031,"roomName":"W1S19","id":"5a226d6ef30e5c2ce1d2c582","transaction_cost_eng":7842,"per_eng_profit":0.017374733774240557,"per_resource_profit":0.5768321864917066} {"created":6528896,"type":"buy","amount":242550,"remainingAmount":8992810,"resourceType":"energy","price":0.03,"roomName":"E9N21","id":"5a9a249d621ca73755b491c0","transaction_cost_eng":6886,"per_resource_profit":0.6003674248640167}


    doManage( room, spawn ) {
        let memory = this.getMemory( room );

        let current_energy = room.terminal.store[ RESOURCE_ENERGY ];
        if( current_energy < 100000 ) return;
        if( room.terminal.cooldown > 0 ) return;

        let order = this.getBestBuyOrderFor( room, RESOURCE_ENERGY, 10000, current_energy );

        let response = Game.market.deal( order.id, 10000, room.name );
        console.log( 'Market response ', response, constants.lookup( response ) );
    }
}

module.exports = MarketManager;
