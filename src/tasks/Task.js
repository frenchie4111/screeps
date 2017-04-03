const randomString = require( 'random-string' );

const SPEAK_INTERVAL = 20;

class Task {
    constructor() {
    }

    getTaskHash() {
        throw new Error( 'abstract method' );
    }

    getTaskName() {
        return this.getTaskHash();
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
            console.log( 'Reassigned from', creep.memory.current_task_hash, 'to', this.getTaskHash() );
            creep.memory.current_task_hash = this.getTaskHash();
            creep.memory.task_memory = {
                speak_counter: 0
            };
        }

        if( creep.memory.speak_counter === SPEAK_INTERVAL ) {
            creep.memory.speak_counter = 0;
            creep.say( this.getTaskName() );
        }
        creep.memory.speak_counter++;

        this.performTask( creep );
    }
};

module.exports = Task;
