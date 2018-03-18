const flat = require( 'flat' );

let profiler = require( '~/profiler' );

module.exports = () => {
    RawMemory.setActiveSegments( [ 99 ] );

    const stats_cpu_start = Game.cpu.getUsed();

    stats = {}

    let rooms = Game.rooms;
    let spawns = Game.spawns;
    for( let roomKey in rooms ) {
        let room = Game.rooms[ roomKey ]

        let room_type = room.memory.type;

        if( !room_type ) {
            continue;
        }

        let is_my_room = ( room.controller ? room.controller.my : 0 );
        if( room_type === 'standard' ) {
            stats[ 'room.' + room.name + '.myRoom' ] = 1;
            stats[ 'room.' + room.name + '.energyAvailable' ] = room.energyAvailable;
            stats[ 'room.' + room.name + '.energyCapacityAvailable' ] = room.energyCapacityAvailable;
            stats[ 'room.' + room.name + '.controllerProgress' ] = room.controller.progress;
            stats[ 'room.' + room.name + '.controllerProgressTotal' ] = room.controller.progressTotal;
            stats[ 'room.' + room.name + '.creep_count' ] = room.memory.creeps.length;
            let stored = 0;
            let storedTotal = 0;

            if( room.storage ) {
                stored = room.storage.store[ RESOURCE_ENERGY ]
                storedTotal = room.storage.storeCapacity[ RESOURCE_ENERGY ]
                stats[ 'room.' + room.name + '.storage.store' ]  = room.storage.store;
            } else {
                stored = 0
                storedTotal = 0
            }

            if( room.terminal ) {
                stats[ 'room.' + room.name + '.terminal.store' ]  = room.terminal.store;
            }

            stats[ 'room.' + room.name + '.storedEnergy' ] = stored

            let creeps = _
                .reduce( room.memory.creeps, ( full, creep ) => {
                    creep = Game.creeps[ creep ];
                    if( creep && creep.my ) {
                        full[ creep.name.replace( '-', '.' ) ] = {
                            ticks_to_live: creep.ticksToLive,
                            one: 1
                        }
                    }
                    return full;
                }, {} );

            stats[ 'room.' + room.name + '.creeps' ] = creeps;
        }
        if( room_type === 'long_distance' ) {
            let ldm_rooms = stats.ldm_room = stats.ldm_room || {};
            let ldm_room = stats.ldm_room[ room.name ] = {};

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

    stats[ 'gcl.progress' ] = Game.gcl.progress
    stats[ 'gcl.progressTotal' ] = Game.gcl.progressTotal
    stats[ 'gcl.level' ] = Game.gcl.level

    stats[ 'profiler' ] = profiler.getProfile();    

    for ( let spawnKey in spawns ) {
        let spawn = Game.spawns[ spawnKey ]
        stats[ 'spawn.' + spawn.name + '.defenderIndex' ] = spawn.memory[ 'defenderIndex' ]
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
    stats.creeps = creeps;

    stats.credits = Game.market.credits;

    stats = flat( stats );

    stats.stats_cpu = Game.cpu.getUsed() - stats_cpu_start;
    stats.cpu_used = Game.cpu.getUsed();
    stats.cpu_bucket = Game.cpu.bucket;

    RawMemory.segments[ 99 ] = JSON.stringify( stats );
}
