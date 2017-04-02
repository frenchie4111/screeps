const creeps = require( './creeps' ),
    tasks = require( './tasks' );

const UPGRADING_CONTROLLER = false;
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

    if( Game.spawns[ 'Spawn1' ].room.controller.ticksToDowngrade < 4800 || UPGRADING_CONTROLLER ) {
        things.push( Game.spawns[ 'Spawn1' ].room.controller );
    }

    return things;
};

const getThingsThatNeedBuilding = function() {
    const priorities = {
        [ STRUCTURE_ROAD ]: 1
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

const assignTasks = function( creeps, tasks ) {
    return _
        .map( tasks, ( task, i ) => {
            return {
                task,
                creeps: [
                    creeps[ i ]
                ]
            };
        } )
}

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
    let assigned_tasks = assignTasks( _.values( Game.creeps ), task_list );

    if( Game.spawns[ 'Spawn1' ].energy === Game.spawns[ 'Spawn1' ].energyCapacity && _.values( Game.creeps ).length < MAX_SPAWNED ) {
        console.log( 'Spawning' );
        createMaxCreep( Game.spawns[ 'Spawn1' ], Game.spawns[ 'Spawn1' ].energy );
    }

    _
        .each( assigned_tasks, ( assigned_task ) => {
            _
                .each( assigned_task.creeps, ( creep ) => {
                    if( !creep ) {
                        return;
                    }
                    assigned_task.task.run( creep );
                } )
        } );
}
