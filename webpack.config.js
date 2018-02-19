const path = require( 'path' );

module.exports = {
    entry: path.join( __dirname, 'src', 'main.js' ),
    output: {
        path: path.join( __dirname, 'dist' ),
        filename: 'main.js',
        libraryTarget: 'commonjs-module'
    },
    resolve: {
        alias: {
            '~': path.resolve( __dirname, 'src' )
        }
    }
};
