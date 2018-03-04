const flat = require( 'flat' );

let profiler = require( '~/profiler' );

module.exports = () => {
    // Put in your main loop

    const stats_cpu_start = Game.cpu.getUsed();

    // if( Memory.stats == undefined ) {
    //     Memory.stats = {}
    // }
    if( Memory.stats && Memory.stats.read ) {
        console.log( 'WAS READ WAS READ' );
        console.log( 'WAS READ WAS READ' );
        console.log( 'WAS READ WAS READ' );
        console.log( 'WAS READ WAS READ' );
    }
    Memory.stats = {}

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

    Memory.stats[ 'profiler' ] = profiler.getProfile();

    for ( let spawnKey in spawns ) {
        let spawn = Game.spawns[ spawnKey ]
        Memory.stats[ 'spawn.' + spawn.name + '.defenderIndex' ] = spawn.memory[ 'defenderIndex' ]
    }

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
    
    Memory.stats.stats_cpu = Game.cpu.getUsed() - stats_cpu_start;
    Memory.stats.cpu_used = Game.cpu.getUsed();
}
