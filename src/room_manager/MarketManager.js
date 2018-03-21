const loopItem = require( '~/lib/loopItem' ),
    position = require( '~/lib/position' );

const constants = require( '~/constants' ),
    workers = require( '~/workers' );

const BoostManager = require( './BoostManager' );

const SELL_THRESHOLDS = {
    [ RESOURCE_ENERGY ]: 100000,
    [ RESOURCE_LEMERGIUM ]: 3000,
    [ RESOURCE_UTRIUM ]: 10000,
};

const SELL_AMOUNTS = {
    [ RESOURCE_ENERGY ]: 10000,
    [ RESOURCE_LEMERGIUM ]: 2000,
    [ RESOURCE_UTRIUM ]: 10000,
};

const REASONABLE_PRICES = {
    [ RESOURCE_ENERGY ]: 0.029,
    [ RESOURCE_LEMERGIUM ]: 0.110,
    [ RESOURCE_UTRIUM ]: 0.40,
};

const MIN_ENERGY = 10000;

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

    getBestSellorderFor( room, resource_type, quantity ) {
        let orders = Game.market
            .getAllOrders( ( order ) => {
                return (
                    order.resourceType == resource_type &&
                    order.type == ORDER_SELL &&
                    order.amount >= quantity
                )
            } );

        orders = _
            .forEach( orders, ( order ) => {
                let transaction_cost_eng = Game.market.calcTransactionCost( quantity, room.name, order.roomName );
                let transaction_cost_credits = REASONABLE_PRICES[ RESOURCE_ENERGY ] * transaction_cost_eng;
                
                order.total_cost = order.price + transaction_cost_credits;
            } );

        orders = _.sortBy( orders, order => order.total_cost );
        orders = orders.slice( 0, 10 );

        return orders[ 0 ];
    }

    doBuyBoost( room, spawn ) {
        let current_energy = room.terminal.store[ RESOURCE_ENERGY ];
        if( current_energy < MIN_ENERGY ) return;

        let memory = this.getMemory( room ).buy_boost = this.getMemory( room ).buy_boost || {};

        let mineral = BoostManager.getNeededMineral( room );
        if( !mineral ) return;
        console.log( 'Need to buy some', JSON.stringify( mineral ) );
        if( memory.creep_id === mineral.creep_id && memory.mineral === mineral.mineral ) {
            console.log( 'already bought' );
            return;
        }

        let order = this.getBestSellorderFor( room, mineral.mineral, mineral.amount );

        console.log( 'order', JSON.stringify( order ) );

        if( order ) {
            console.log( 'Buying' );
            let response = Game.market.deal( order.id, mineral.amount, room.name );
            console.log( 'Market response ', response, constants.lookup( response ) );

            memory.creep_id = mineral.creep_id;
            memory.mineral = mineral.mineral;
        }
    }

    doSell( room, spawn ) {
        let current_energy = room.terminal.store[ RESOURCE_ENERGY ];
        if( current_energy < MIN_ENERGY ) return;

        let thing_to_sell = _
            .chain( room.terminal.store )
            .map( ( amount, type ) => {
                return { amount, type }
            } )
            .find( thing => thing.amount >= SELL_THRESHOLDS[ thing.type ] )
            .value();

        if( !thing_to_sell ) return;

        console.log( 'thing_to_sell', thing_to_sell );
        let order = this.getBestBuyOrderFor( room, thing_to_sell.type, SELL_AMOUNTS[ thing_to_sell.type ], current_energy );

        console.log( JSON.stringify( order ) );

        let response = Game.market.deal( order.id, SELL_AMOUNTS[ thing_to_sell.type ], room.name );
        console.log( 'Market response ', response, constants.lookup( response ) );
    }

    doManage( room, spawn ) {
        let memory = this.getMemory( room );

        if( room.terminal.cooldown > 0 ) return;
        this.doBuyBoost( room, spawn );
        this.doSell( room, spawn );
    }
}

MarketManager.SELL_THRESHOLDS = SELL_THRESHOLDS;
MarketManager.MIN_ENERGY = MIN_ENERGY;

module.exports = MarketManager;
