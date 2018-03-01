const loopItem = require( '~/lib/loopItem' );

const RoomManager = require( '~/room_manager/RoomManager' );

const stats = require( './stats' );

const CreepPositionCollector = require( '~/metrics/CreepPositionCollector' );

module.exports.loop = function() {
    loopItem.resetProfile();

    const spawn = Game.spawns[ 'Spawn1' ];
    const room = spawn.room;

    loopItem( 'collectors', () => {
        const collectors = [
            new CreepPositionCollector()
        ];

        collectors
            .forEach( ( collector ) => {
                collector.collect( room );
            } );

        // collectors[ 0 ].drawHotSpots( room );
    } );

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
