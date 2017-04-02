const creeps = require( './creeps' ),
    tasks = require( './tasks' );

const things_to_harvest_to = [
    Game.spawns[ 'Spawn1' ],
    Game.spawns[ 'Spawn1' ].room.controller
];

const getThingsThatNeedHarvesting = function() {

}

const generateTaskList = function() {
    let harvest_tasks = _
        .map( things_to_harvest_to, ( thing ) => {
            return new tasks.Harvest( thing );
        } );

    return _
        .union( harvest_tasks, [
            new tasks.Build( Game.getObjectById( '58e169fc9f9ea16831557c41' ) )
        ] );
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
