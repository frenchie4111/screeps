const Logger = require( '~/lib/logger' ),
    Deque = require( '~/lib/Deque' );

let profile = {};

const loopItem = ( name, func ) => {
    profile[ name ] = {};
    profile[ name ].start = Game.cpu.getUsed();

    let logger = new Logger( name );
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
        profile[ name ].end = Game.cpu.getUsed();
        profile[ name ].time = profile[ name ].end - profile[ name ].start;
    }
};

module.exports = loopItem;
module.exports.getProfile = () => profile;
module.exports.resetProfile = () => profile = {};
