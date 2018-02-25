const constants = require( '~/constants' );

const RenewWorker = require( '~/workers/RenewWorker' );

const MAX_RENEWING = 2;

class SpawnManager {
    getTotalEnergyCapacity( spawn ) {
        let extensions = spawn
            .room
            .find( FIND_MY_STRUCTURES, {
                filter: {
                    structureType: constants.STRUCTURE_EXTENSION
                }
            } );

        let extension_total = _.sumBy( extensions, ( extension ) => extension.energyCapacity );

        return extension_total + spawn.energyCapacity;
    }

    getTotalEnergy( spawn ) {
        let extensions = spawn
            .room
            .find( FIND_MY_STRUCTURES, {
                filter: {
                    structureType: constants.STRUCTURE_EXTENSION
                }
            } );

        let extension_total = _.sumBy( extensions, ( extension ) => extension.energy );

        return extension_total + spawn.energy;
    }

    spawnCreep( room, spawn, worker_type ) {
        let WorkerClass = workers.getClass( worker_type );
        let worker = new WorkerClass();
        let parts = worker.getBody( this.getTotalEnergy( spawn ) );
        let name = worker_type + '-' + Game.time.toString();

        let spawn_response = spawn
            .spawnCreep( 
                parts,
                name, 
                {
                    memory: {
                        worker_type: worker_type
                    }
                }
            );

        if( !room.memory.hasOwnProperty( 'creeps' ) )  room.memory.creeps = [];
        room.memory.creeps.push( name );

        console.log( 'spawnCreep', spawn_response, constants.lookup( spawn_response ) );
    };

    canSpawn( spawn ) {
        return this.getTotalEnergy( spawn ) === this.getTotalEnergyCapacity( spawn );
    };
    
    getNeededSpawns( room, current_creeps, worker_counts ) {
        let current_counts = _
            .reduce( current_creeps, ( counts, creep ) => {
                if( !counts.hasOwnProperty( creep.memory.worker_type ) ) counts[ creep.memory.worker_type ] = 0;
                counts[ creep.memory.worker_type ]++;
                return counts;
            }, {} );

        let needed_counts = _
            .reduce( worker_counts, ( needed, val, type ) => {
                let current_val = current_counts.hasOwnProperty( type ) ? current_counts[ type ] : 0;
                if( val - current_val > 0 ) {
                    needed[ type ] = val - current_val;
                }
                return needed;
            }, {} );

        return needed_counts;
    }

    doManage( room, spawn, current_state, current_creeps ) {
        if( canSpawn( spawn ) ) {
            const needed_spawns = this.getNeededSpawns( room, current_creeps, current_state.worker_counts );

            if( Object.keys( needed_spawns ).length > 0 ) {
                console.log( 'Spawning', JSON.stringify( needed_spawns ) );

                if( needed_spawns[ workers.types.HARVESTER ] ) {
                    this.spawnCreep( room, spawn, workers.types.HARVESTER );
                }

                this.spawnCreep( room, spawn, Object.keys( needed_spawns )[ 0 ] )
            } else {
                let renewing_creeps = room
                    .find( FIND_MY_CREEPS, {
                        filter: ( creep ) => {
                            if( creep ) {
                                return RenewWorker.isRenewing( creep );
                            }
                            return false;
                        }
                    } );

                if( renewing_creeps.length <= MAX_RENEWING ) {
                    let room_creeps = room
                        .find( FIND_MY_CREEPS, {
                            filter: ( creep ) => {
                                return !RenewWorker.isRenewing( creep ) && RenewWorker.needsRenewing( creep );
                            }
                        } );

                    room_creeps = _.sortBy( room_creeps, ( creep ) => creep.ticksToLive );

                    if( room_creeps.length > 0 ) {
                        console.log( 'Telling a creep to renew', room_creeps[ 0 ] );

                        let temp_worker = new RenewWorker();
                        temp_worker.setCreep( room_creeps[ 0 ] );
                        temp_worker.setRenew( spawn.id );
                    }
                }
            }
        }
    }
}

module.exports = SpawnManager;
