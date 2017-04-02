const creeps = require( './creeps' ),
    tasks = require( './tasks' );

let task_list = [
    new tasks.Harvest( Game.spawns[ 'Spawn1' ] ),
    new tasks.Harvest( Game.spawns[ 'Spawn1' ].room.controller )
];

const assignTasks = function( creeps, tasks ) {
    return [
        {
            task: tasks[ 0 ],
            creeps: [ creeps[ 0 ] ]
        },
        {
            task: tasks[ 1 ],
            creeps: [ creeps[ 1 ] ]
        }
    ];
}

module.exports.loop = function() {
    let assigned_tasks = assignTasks( _.filter( Game.creeps, () => true ), task_list );
    _
        .each( assigned_tasks, ( assigned_task ) => {
            _
                .each( assigned_task.creeps, ( creep ) => {
                    assigned_task.task.run( creep );
                } )
        } );
}
