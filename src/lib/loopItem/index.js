const Logger = require( '~/lib/logger' ),
    Deque = require( '~/lib/Deque' );

const loopItem = ( name, func ) => {
    logger = new Logger( name );
    logger.patch();

    try {
        func();
    } catch ( error ) {
        Memory.error_log = new Deque( Memory.error_log );
        Memory.error_log.push( {
            name: name,
            error: {
                time: new Date(),
                name: error.name,
                message: error.message,
                stack: error.stack
            }
        } );

        console.log( 'Error in ' + name );
        console.log( error );
        console.log( error.stack );
    } finally {
        logger.unpatch();
    }
};

module.exports = loopItem;
