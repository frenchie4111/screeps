require( './fake_test.js' );

const loopItem = require( '~/lib/loopItem' );

const RoomManager = require( '~/room_manager/RoomManager' );

const stats = require( './stats' ),
    profiler = require( './profiler' );

module.exports.loop = function() {
    profiler.resetProfile();

    loopItem( 'garbage-collector', () => {
        for( let i in Memory.creeps ) {
            if( !Game.creeps[ i ] ) {
                delete Memory.creeps[ i ];
            }
        }
    } );

    loopItem( 'handleRoomState', () => {
        let room_manager = new RoomManager();
        for( let i in Game.rooms ) {
            loopItem( 'doManage-' + i, () => {
                room_manager.doManage( Game.rooms[ i ] );
            } );
        }
    } );

    stats();

    console.log( ' -- Tick End ' + Game.cpu.getUsed() + ' -- ' );
}
