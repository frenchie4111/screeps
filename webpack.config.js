const path = require( 'path' );

module.exports = {
    devtool: 'source-map',
    entry: {
        main: path.join( __dirname, 'src', 'main.js' ),
        test: path.join( __dirname, 'src', 'test.js' ),
    },
    output: {
        path: path.join( __dirname, 'dist' ),
        filename: '[name]/main.js',
        sourceMapFilename: '[file].map',
        libraryTarget: 'commonjs-module'
    },
    resolve: {
        alias: {
            '~': path.resolve( __dirname, 'src' )
        }
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /(node_modules|bower_components)/,
                use: {
                    loader: 'babel-loader'
                }
            }
        ]
    }
};
