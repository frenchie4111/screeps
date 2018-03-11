const constants = require( '~/constants' );

const workers = require( '~/workers' ),
    RenewWorker = require( '~/workers/RenewWorker' );

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

        let extension_total = _.sum( _.map( extensions, ( extension ) => extension.energyCapacity ) );

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

        let extension_total = _.sum( _.map( extensions, ( extension ) => extension.energy ) );

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

        console.log( 'spawnCreep', spawn_response, constants.lookup( spawn_response ) );

        if( spawn_response === OK ) {
            if( !room.memory.hasOwnProperty( 'creeps' ) )  room.memory.creeps = [];
            room.memory.creeps.push( name );
        } else {
            throw new Error( 'non 0 response from spawn' );
        }
    };

    canSpawn( spawn ) {
        return this.getTotalEnergy( spawn ) === this.getTotalEnergyCapacity( spawn );
    };

    getCurrentCounts( room, current_creeps ) {
        return _
            .reduce( current_creeps, ( counts, creep ) => {
                if( RenewWorker.isSuicide( creep ) ) return counts;
                if( !counts.hasOwnProperty( creep.memory.worker_type ) ) counts[ creep.memory.worker_type ] = 0;
                counts[ creep.memory.worker_type ]++;
                return counts;
            }, {} );
    }

    getOverSpawns( room, current_creeps, worker_counts ) {
        let current_counts = this.getCurrentCounts( room, current_creeps );

        let over_spawns = _
            .reduce( current_counts, ( over_counts, count, type ) => {
                let needed_val = worker_counts.hasOwnProperty( type ) ? worker_counts[ type ] : 0;
        
                if( !workers.workerClassHasProperty( type, 'setSuicide' ) ) {
                    return over_counts;
                }
        
                if( needed_val - count < 0 ) {
                    over_counts[ type ] = needed_val - count;
                }
        
                return over_counts;
            }, {} );

        return over_spawns;
    }

    getNeededSpawns( room, current_creeps, worker_counts ) {
        let current_counts = this.getCurrentCounts( room, current_creeps );

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
    
    findCurrentlyRenewingCreeps( creeps ) {
        return _.filter( creeps, ( creep ) => RenewWorker.isRenewing( creep ) );
    }

    findCreepsToRenew( creeps ) {
        let renewing_creeps = _.filter( creeps, ( creep ) => {
            if( !creep ) return false;
            const WorkerClass = workers.getClass( creep.memory.worker_type );
            return (
                WorkerClass && 'setRenew' in WorkerClass.prototype &&
                !RenewWorker.isRenewing( creep ) &&
                !RenewWorker.isSuicide( creep ) &&
                RenewWorker.needsRenewing( creep )
            );
        } );
        renewing_creeps = _.sortBy( renewing_creeps, ( creep ) => creep.ticksToLive );
        return renewing_creeps;
    }

    getMaxBodyForWorker( spawn, worker ) {
        let energy_capacity = this.getTotalEnergyCapacity( spawn );
        console.log( 'energy_capacity', energy_capacity );
        let max_body = worker.getBody( energy_capacity ).sort();
        return max_body;
    }
    
    checkForExtensionConstruction( room ) {
        let construction_sites = room
            .find( FIND_MY_CONSTRUCTION_SITES, {
                filter: {
                    structureType: STRUCTURE_EXTENSION
                }
            } );

        return construction_sites.length > 0;
    }

    doManage( room, spawn, current_state, current_creeps, assigner ) {
        let creeps_to_renew = this.findCreepsToRenew( current_creeps );
        let currently_renewing_creeps = this.findCurrentlyRenewingCreeps( current_creeps );

        let worker_counts = current_state.worker_counts;
        if( _.isFunction( worker_counts ) ) {
            worker_counts = worker_counts( room, assigner );
        }

        const over_spawns = this.getOverSpawns( room, current_creeps, worker_counts );

        _
            .forEach( over_spawns, ( count, type ) => {
                let overspawned_creep = _.find( current_creeps, ( creep ) => creep.memory.worker_type === type );
                console.log( 'overspawned_creep', overspawned_creep.name );
                const WorkerClass = workers.getClass( overspawned_creep.memory.worker_type );
                let temp_worker = new WorkerClass();
                temp_worker.setCreep( overspawned_creep );
                temp_worker.setSuicide();
            } );

        if( spawn.spawning ) {
            return;
        }

        if( currently_renewing_creeps.length < MAX_RENEWING ) {
            console.log( 'Currently renewing', currently_renewing_creeps );
            if( creeps_to_renew.length > 0 ) {
                let creep = creeps_to_renew[ 0 ];

                const WorkerClass = workers.getClass( creep.memory.worker_type );
                let temp_worker = new WorkerClass();

                if( temp_worker.setRenew ) {
                    temp_worker.setCreep( creep );

                    let max_body = this.getMaxBodyForWorker( spawn, temp_worker );
                    let current_body = _.map( creep.body, ( body_item ) => body_item.type ).sort();

                    if( !_.isEqual( max_body, current_body ) && !this.checkForExtensionConstruction( room ) ) {
                        console.log( 'Upgrading', creep.name );
                        if( !temp_worker.isSuicide() ) {
                            temp_worker.setSuicide();
                        }
                    } else {
                        console.log( 'Telling ' + creep.name + ' to renew' );
                        temp_worker.setRenew( spawn.id );
                    }
                }
            } else if( currently_renewing_creeps.length === 0 ) { // Spawn
                const needed_spawns = this.getNeededSpawns( room, current_creeps, worker_counts );
                
                console.log( 'needed_spawns', JSON.stringify( needed_spawns ) );
                
                const needed_spawns_keys = Object.keys( needed_spawns );

                if( needed_spawns_keys.length > 0 ) {
                    let spawn_type = needed_spawns_keys[ 0 ];

                    if( needed_spawns[ workers.types.LONG_DISTANCE_ROOM_CLEARER ] ) {
                        spawn_type = workers.types.LONG_DISTANCE_ROOM_CLEARER;
                    }
                    if( needed_spawns[ workers.types.CONTAINER_MINER ] ) {
                        spawn_type = workers.types.CONTAINER_MINER;
                    }
                    if( needed_spawns[ workers.types.HARVESTER ] ) {
                        spawn_type = workers.types.HARVESTER;
                    }
                    if( needed_spawns[ workers.types.CONTAINER_EXTENSION ] ) {
                        spawn_type = workers.types.CONTAINER_EXTENSION;
                    }

                    let current_energy = this.getTotalEnergy( spawn );

                    const WorkerClass = workers.getClass( spawn_type );
                    let worker = new WorkerClass();

                    let current_body = worker.getBody( current_energy ).sort();
                    let max_body = this.getMaxBodyForWorker( spawn, worker );

                    console.log( 'cur', current_body, 'max', max_body );

                    if( _.isEqual( current_body, max_body ) || current_creeps.length === 0 ) {
                        this.spawnCreep( room, spawn, spawn_type );
                    } else {
                        console.log( 'Cant spawn', current_energy );
                    }
                }
            }
        } else {
            // Max things are renewing
        }
    }
}

module.exports = SpawnManager;
