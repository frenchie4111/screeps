module.exports = function( grunt ) {

    // Pull defaults (including username and password) from .screeps.json
    var config = require( grunt.option( 'config' ) || './.screeps.json' )
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
    var ptr = grunt.option( 'ptr' ) ? true : config.ptr;
    var host = grunt.option( 'host' ) || config.host || null;
    var port = grunt.option( 'port' ) || config.port || null;

    // Load needed tasks
    grunt.loadNpmTasks( 'grunt-screeps-customserver' );
    grunt.loadNpmTasks( 'grunt-contrib-clean' );

    var screeps_options = {
        username: email,
        password: password,
        branch: branch,
        hostname: host,
        port: port,
        'use-https': false,
        ptr: ptr
    };
    
    console.log( screeps_options );

    grunt.initConfig( {
        // Push all files in the dist folder to screeps
        screeps: {
            options: screeps_options,
            dist: {
                src: [ 'dist/*.js' ]
            }
        },

        // Clean the dist folder.
        clean: {
            'dist': [ 'dist' ]
        }
    } );

    // Combine the above into a default task
    grunt.registerTask( 'default', [ 'screeps' ] );
};
