require( './fake_test.js' );

const loopItem = require( '~/lib/loopItem' ),
    color = require( '~/lib/color' );

const RoomManager = require( '~/room_manager/RoomManager' );

const GlobalSpawnManager = require( './GlobalSpawnManager' );

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

    loopItem( color( '02', 'handleRoomState' ), () => {
        let room_manager = new RoomManager();
        for( let i in Game.rooms ) {
            loopItem( color( '04', 'doManage-' + i ), () => {
                room_manager.doManage( Game.rooms[ i ] );
            } );
        }
    } );

    stats();

    console.log( ' -- Tick End ' + Game.cpu.getUsed() + ' -- ' );
}
