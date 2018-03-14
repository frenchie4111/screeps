const profiler = require( '~/profiler' );

const Logger = require( '~/lib/logger' ),
    Deque = require( '~/lib/Deque' );

const path = [];

const loopItem = ( name, func ) => {
    path.push( name );
    const start = Game.cpu.getUsed();

    let logger = new Logger( name );
    logger.patch();

    try {
        func();
    } catch ( error ) {
        console.log( 'Error in ' + name );
        console.log( error );
        console.log( error.stack );

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
    } finally {
        logger.unpatch();
        profiler.setCpuFor( path, Game.cpu.getUsed() - start );
        path.pop( name );
    }
};

module.exports = loopItem;
