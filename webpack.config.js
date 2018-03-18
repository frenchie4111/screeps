const path = require( 'path' );

module.exports = {
    entry: {
        main: path.join( __dirname, 'src', 'main.js' ),
        test: path.join( __dirname, 'src', 'test.js' ),
    },
    output: {
        path: path.join( __dirname, 'dist' ),
        filename: '[name]/main.js',
        libraryTarget: 'commonjs-module'
    },
    resolve: {
        alias: {
            '~': path.resolve( __dirname, 'src' )
        }
    }
};
