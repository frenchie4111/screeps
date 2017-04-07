


export function assignTasks( creeps, tasks, previously_assigned_tasks ) {
    const creep_pool = _.indexBy( creeps, ( creep ) => creep.id );
    let previously_assigned_creep_count = 0;

    const previously_assigned_tasks_sorted = [];

    // Loop through old/new tasks.
    // Reprioritize old tasks with new priorities list
    // Remove creeps assigned in old tasks from the creep pool
    _
        .each( tasks, ( task ) => {
            if( previously_assigned_tasks.hasOwnProperty( task.getTaskHash() ) ) {
                const previously_assigned_task = previously_assigned_tasks[ task.getTaskHash() ];


                previously_assigned_task.task = task;
                previously_assigned_task.creeps = _
                    .map( previously_assigned_task.creeps, ( previously_assigned_creep_id ) => {
                        const creep = creep_pool[ previously_assigned_creep_id ];
                        creep_pool[ previously_assigned_creep_id ] = undefined; // Remove from pool
                        previously_assigned_creep_count++;
                        return creep;
                    } );

                previously_assigned_tasks_sorted.push( previously_assigned_task );
                task.previously_assigned = previously_assigned_task;
            }
        } );

    let creep_pool_keys = _.keys( creep_pool );

    const assigned_tasks = _
        .map( tasks, ( task ) => {
            const assigned_task = {
                task
            };

            if( task.hasOwnProperty( 'previously_assigned' ) ) {
                assigned_task.creeps = task.previously_assigned.creeps;
                previously_assigned_creep_count--;
            } else {
                // If we have creeps to spare
                if( creep_pool_keys.length > 0 ) {
                    // Just take the first one
                    assigned_task.creeps = [ creep_pool[ creep_pool_keys.pop() ] ];
                } else if( previously_assigned_creep_count > 0 ) {
                    previously_assigned_creep_count--;

                    const last_previously_assigned_task = previously_assigned_tasks_sorted.pop();
                    assigned_task.creeps = [ last_previously_assigned_task.creeps ];
                    last_previously_assigned_task.creeps = [];
                }
            }

            return assigned_task;
        } );

    return assigned_tasks;
};
