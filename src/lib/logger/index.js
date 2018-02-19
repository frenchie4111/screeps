class Logger {
    constructor( name='info' ) {
        this.name = name;
    }

    setName( name ) {
        this.name = name;
    }

    log() {
        let all_arguments = [ this.name, ':', ...arguments ];
        console.log.apply( console, all_arguments );
    }
}

module.exports = Logger;
