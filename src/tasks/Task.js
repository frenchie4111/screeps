const randomString = require( 'random-string' );

class Task {
    constructor() {
    }

    getTaskHash() {
        throw new Error( 'abstract method' );
    }

    getTaskName() {
        return 'Unnamed Task';
    }

    getRequirements() {
        throw new Error( 'abstract method' );
    }

    creepCanPerformTask( creep ) {
        let requirements = this.getRequirements();

        return _
            .every( requirements, ( requirement ) => {
                return creep.body.includes( requirement );
            } );
    }

    performTask( creep ) {
        throw new Error( 'abstract method' );
    }

    run( creep ) {
        if( !creep.memory.current_task_hash || creep.memory.current_task_hash !== this.getTaskHash() ) {
            console.log( 'Reassigned' );
            creep.memory.current_task_hash = this.getTaskHash();
            creep.memory.task_memory = {};
        }

        creep.say( this.getTaskName() );
        this.performTask( creep );
    }
};

module.exports = Task;
