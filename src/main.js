const creeps = require( './creeps' ),
    tasks = require( './tasks' );

const UPGRADING_CONTROLLER = false;

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
    return Game.spawns[ 'Spawn1' ].room.find( FIND_CONSTRUCTION_SITES );
};

const generateTaskList = function() {
    let harvest_tasks = _
        .map( getThingsThatNeedHarvesting(), ( thing ) => {
            return new tasks.Harvest( thing );
        } );

    let build_tasks = _
        .map( getThingsThatNeedBuilding(), ( thing ) => {
            return new tasks.Build( thing )
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

module.exports.loop = function() {
    let task_list = generateTaskList();
    let assigned_tasks = assignTasks( _.filter( Game.creeps, () => true ), task_list );

    _
        .each( assigned_tasks, ( assigned_task ) => {
            _
                .each( assigned_task.creeps, ( creep ) => {
                    if( !creep ) {
                        console.log( 'Was not creep' );
                        return;
                    }
                    assigned_task.task.run( creep );
                } )
        } );
}
