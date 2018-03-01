const flat = require( 'flat' );

let loopItem = require( '~/lib/loopItem' );

module.exports = () => {
    // Put in your main loop

    if( Memory.stats == undefined ) {
        Memory.stats = {}
    }

    let rooms = Game.rooms;
    let spawns = Game.spawns;
    for( let roomKey in rooms ) {
        let room = Game.rooms[ roomKey ]
        let isMyRoom = ( room.controller ? room.controller.my : 0 );
        if( isMyRoom ) {
            Memory.stats[ 'room.' + room.name + '.myRoom' ] = 1;
            Memory.stats[ 'room.' + room.name + '.energyAvailable' ] = room.energyAvailable;
            Memory.stats[ 'room.' + room.name + '.energyCapacityAvailable' ] = room.energyCapacityAvailable;
            Memory.stats[ 'room.' + room.name + '.controllerProgress' ] = room.controller.progress;
            Memory.stats[ 'room.' + room.name + '.controllerProgressTotal' ] = room.controller.progressTotal;
            Memory.stats[ 'room.' + room.name + '.creep_count' ] = room.memory.creeps.length;
            let stored = 0;
            let storedTotal = 0;

            if( room.storage ) {
                stored = room.storage.store[ RESOURCE_ENERGY ]
                storedTotal = room.storage.storeCapacity[ RESOURCE_ENERGY ]
            } else {
                stored = 0
                storedTotal = 0
            }

            Memory.stats[ 'room.' + room.name + '.storedEnergy' ] = stored
        } else {
            Memory.stats[ 'room.' + room.name + '.myRoom' ] = undefined
        }
    }

    Memory.stats[ 'gcl.progress' ] = Game.gcl.progress
    Memory.stats[ 'gcl.progressTotal' ] = Game.gcl.progressTotal
    Memory.stats[ 'gcl.level' ] = Game.gcl.level

    // Memory.stats[ 'profile' ] = loopItem.getProfile();

    for ( let spawnKey in spawns ) {
        let spawn = Game.spawns[ spawnKey ]
        Memory.stats[ 'spawn.' + spawn.name + '.defenderIndex' ] = spawn.memory[ 'defenderIndex' ]
    }

    Memory.stats.cpu_used = Game.cpu.getUsed();

    let creeps = _
        .reduce( Game.creeps, ( full, creep ) => {
            if( creep.my ) {
                full[ creep.id ] = {
                    ticks_to_live: creep.ticksToLive
                }
            }
            return full;
        }, {} );
    Memory.stats.creeps = creeps;

    Memory.stats = flat( Memory.stats );
}
