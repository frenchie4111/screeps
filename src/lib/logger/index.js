class Logger {
    constructor( name='info' ) {
        this.name = name;
        this.old_logger = null;
    }

    setName( name ) {
        this.name = name;
    }

    log() {
        let all_arguments = [ this.name, ':', ...arguments ];
        if( this.old_logger ) {
            this.old_logger.apply( null, all_arguments );
        } else {
            console.log.apply( console, all_arguments );
        }
    }
    
    patch() {
        this.old_logger = console.log;
        console.log = this.log.bind( this );
    }

    unpatch() {
        console.log = this.old_logger;
    }
}

module.exports = Logger;
