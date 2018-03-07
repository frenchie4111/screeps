const flat = require( 'flat' );

let profiler = require( '~/profiler' );

module.exports = () => {
    // Put in your main loop

    const stats_cpu_start = Game.cpu.getUsed();

    Memory.stats = {}

    let rooms = Game.rooms;
    let spawns = Game.spawns;
    for( let roomKey in rooms ) {
        let room = Game.rooms[ roomKey ]

        let room_type = room.memory._state && room.memory._state.type;

        if( !room_type ) {
            continue;
        }

        let is_my_room = ( room.controller ? room.controller.my : 0 );
        if( room_type === 'standard' ) {
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
                Memory.stats[ 'room.' + room.name + '.storage.store' ]  = room.storage.store;
            } else {
                stored = 0
                storedTotal = 0
            }

            Memory.stats[ 'room.' + room.name + '.storedEnergy' ] = stored
        }
        if( room_type === 'long_distance' ) {
            let ldm_rooms = Memory.stats.ldm_room = Memory.stats.ldm_room || {};
            let ldm_room = Memory.stats.ldm_room[ room.name ] = {};

            ldm_room.source_containers = _
                .reduce( room.memory.source_containers, ( full, source_container, source_id ) => {
                    full[ source_id ] = {
                        store: source_container.store
                    };
                    return full;
                }, {} );

            ldm_room.reserved_for = room.memory.resevered_until - Game.time;
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
    Memory.stats.cpu_bucket = Game.cpu.bucket;
}
