const tasks = require( './tasks' ),
    TaskManager = require( './TaskManager' );

const UPGRADING_CONTROLLER = true;
const CONTROLLER_TICK_THRESHOLD = 2000;
const MAX_SPAWNED = 8;

const things_to_harvest_to = [
    Game.spawns[ 'Spawn1' ],
    Game.spawns[ 'Spawn1' ].room.controller
];

const getThingsThatNeedHarvesting = function() {
    let things = [];

    if( Game.spawns[ 'Spawn1' ].energy < Game.spawns[ 'Spawn1' ].energyCapacity ) {
        things.push( Game.spawns[ 'Spawn1' ] );
    }

    let extensions = Game.spawns[ 'Spawn1' ].room
        .find( FIND_STRUCTURES, {
            filter: ( structure ) => {
                return structure.structureType === STRUCTURE_EXTENSION && structure.energy < structure.energyCapacity;
            }
        } );

    things = _.union( things, extensions );

    if( Game.spawns[ 'Spawn1' ].room.controller.ticksToDowngrade < CONTROLLER_TICK_THRESHOLD || UPGRADING_CONTROLLER ) {
        things.push( Game.spawns[ 'Spawn1' ].room.controller );
    }

    return things;
};

const getThingsThatNeedBuilding = function() {
    const priorities = {
        [ STRUCTURE_ROAD ]: 1,
        [ STRUCTURE_EXTENSION ]: 2
    };

    return Game.spawns[ 'Spawn1' ].room
        .find( FIND_CONSTRUCTION_SITES )
        .sort( ( a, b ) => {
            a = priorities[ a.structureType ] || 0;
            b = priorities[ b.structureType ] || 0;

            return b - a;
        } );
};

const sources = [
    Game.getObjectById( '58dbc4328283ff5308a3eac5' ),
    Game.getObjectById( '58dbc4328283ff5308a3eac6' )
];

class SourceChooser {
    constructor() {
        this.assigned_sources = {
            '58dbc4328283ff5308a3eac5': {
                assigned: 0,
                object: Game.getObjectById( '58dbc4328283ff5308a3eac5' )
            },
            '58dbc4328283ff5308a3eac6': {
                assigned: 0,
                object: Game.getObjectById( '58dbc4328283ff5308a3eac6' )
            }
        };
    }

    chooseSource() {
        let source = _
            .sortBy( this.assigned_sources, ( item ) => item.assigned )[ 0 ]

        source.assigned ++;

        return source;
    }
};

const generateTaskList = function() {
    let source_chooser = new SourceChooser();

    let harvest_tasks = _
        .map( getThingsThatNeedHarvesting(), ( thing ) => {
            return new tasks.Harvest( thing, source_chooser.chooseSource().id );
        } );

    let build_tasks = _
        .map( getThingsThatNeedBuilding(), ( thing ) => {
            return new tasks.Build( thing, source_chooser.chooseSource().id );
        } );

    return _.union( harvest_tasks, build_tasks );
};

const createMaxCreep = function( spawn, energy ) {
    let parts = [];
    let part_types = [ MOVE, WORK, CARRY ];
    let part_start = 0;

    while( energy > 0 ) {
        let found_part = null;
        let part_i = part_start;

        do {
            let current_part = part_types[ part_i ];
            if( energy >= BODYPART_COST[ current_part ] ) {
                found_part = current_part;
                break;
            }

            part_i ++;
            part_i %= part_types.length;
        } while( part_i !== part_start );

        if( !found_part ) {
            console.log( 'Couldnt fit in the last ' + energy + ' energy' );
            break;
        }
        parts.push( found_part );
        energy -= BODYPART_COST[ found_part ];
        part_start ++;
        part_start %= part_types.length;
    }

    spawn.createCreep( parts );
}

module.exports.loop = function() {
    let task_list = generateTaskList();
    let assigned_tasks = TaskManager.assignTasks( _.values( Game.creeps ), task_list, Memory.assigned_tasks );

    if( Game.spawns[ 'Spawn1' ].energy === Game.spawns[ 'Spawn1' ].energyCapacity && _.values( Game.creeps ).length < MAX_SPAWNED ) {
        console.log( 'Spawning' );

        let extensions = Game.spawns[ 'Spawn1' ].room
            .find( FIND_STRUCTURES, {
                filter: ( structure ) => {
                    return structure.structureType === STRUCTURE_EXTENSION;
                }
            } );

        let extension_energy = _.reduce( extensions, ( full, extension ) => {
            console.log( extension.energy );
            return full + extension.energy;
        }, 0 );
        console.log( 'extension_energy', extension_energy );
        console.log( 'spawn energy', Game.spawns[ 'Spawn1' ].energy );

        createMaxCreep( Game.spawns[ 'Spawn1' ], Game.spawns[ 'Spawn1' ].energy + extension_energy );
    }

    let assigned_task_json = _
        .reduce( assigned_tasks, ( assigned_task_json, assigned_task ) => {
            assigned_task_json[ assigned_task.task.getTaskHash() ] = {
                task: assigned_task.task.getTaskHash(),
                creeps:  _
                    .map( assigned_task.creeps, ( creep ) => {
                        if( !creep ) {
                            return;
                        }

                        try {
                            assigned_task.task.run( creep );
                        } catch( err ) {
                            console.log( 'Failed to run task ' + assigned_task.task.getTaskHash() + ' on creep ' + creep.id );
                            console.log( err );
                            console.log( err.stack );
                        }

                        return creep.id;
                    } )
            };
            return assigned_task_json;
        }, {} );

    Memory.assigned_tasks = assigned_task_json;

    console.log( ' -- Tick End ' + Game.cpu.getUsed() + ' -- ' );
}