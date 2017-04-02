module.exports = function( grunt ) {

    // Pull defaults (including username and password) from .screeps.json
    var config = require( './.screeps.json' )
    if ( !config.branch ) {
        config.branch = 'sim'
    }

    if ( !config.ptr ) {
        config.ptr = false
    }

    // Allow grunt options to override default configuration
    var branch = grunt.option( 'branch' ) || config.branch;
    var email = grunt.option( 'email' ) || config.email;
    var password = grunt.option( 'password' ) || config.password;
    var ptr = grunt.option( 'ptr' ) ? true : config.ptr

    // Load needed tasks
    grunt.loadNpmTasks( 'grunt-screeps' );
    grunt.loadNpmTasks( 'grunt-contrib-clean' );
    grunt.loadNpmTasks( 'grunt-webpack' );

    grunt.initConfig( {
        // Push all files in the dist folder to screeps
        screeps: {
            options: {
                email: email,
                password: password,
                branch: branch,
                ptr: ptr
            },
            dist: {
                src: [ 'dist/*.js' ]
            }
        },

        webpack: {
            prod: require( './webpack.config' )
        },

        // Clean the dist folder.
        clean: {
            'dist': [ 'dist' ]
        }
    } );

    // Combine the above into a default task
    grunt.registerTask( 'default', [ 'screeps' ] );
};
