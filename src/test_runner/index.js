class TestRunner {
    constructor() {
        this.registered = {};
        this.curr_path = [];
        this.failures = [];
        this.status_string = '';
    }

    describe( name, func ) {
        this.curr_path.push( name );
        func();
        this.curr_path.pop();
    }

    it( name, func, run_now=false ) {
        this.registered[ this.curr_path.concat( [ name ] ).join( '.' ) ] = func;
    }

    run() {
        console.log( 'Running tests' );

        _
            .forEach( this.registered, ( func, name ) => {
                try {
                    func();
                    this.status_string += '.';
                } catch( error ) {
                    this.status_string += 'x';
                    this.failures
                        .push( {
                            name,
                            error
                        } );
                    return;
                }
            } );

        console.log( this.status_string );
        console.log('');

        _
            .forEach( this.failures, ( { name, error } ) => {
                console.log( name );
                console.log( error );
                console.log( error.stack );
                console.log( '' );
            } )
    }
}

module.exports = TestRunner;
