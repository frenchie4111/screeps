const screeps_launcher = require( '@screeps/launcher' ),
    mkdirp = require( 'mkdirp' ),
    path = require( 'path' ),
    process = require( 'process' ),
    net = require( 'net' ),
    fetch = require( 'node-fetch' ),
    base64 = require( 'base-64' ),
    fs = require( 'fs' ),
    WebSocket = require( 'ws' );

const STEAM_API_KEY = process.env.STEAM_API_KEY;

let listener = null;

const onNewData = ( data ) => {
    if( listener ) listener( data );
};

const waitForNewData = () => {
    return new Promise( ( resolve ) => {
        listener = resolve;
    } );
};

const getCliConnection = () => {
    return new Promise( ( resolve, reject ) => {
        let socket = net.connect( 21026, 'localhost' );

        let data_wait = waitForNewData();

        socket.on( 'connect', () => {
            data_wait
                .then( ( prompt ) => {
                    resolve( socket );
                } );
        } );

        socket.on( 'data', onNewData );

        socket.on( 'error', ( error ) => {
            reject( error );
        } );
    } );
};

const wait = ( time ) => {
    return new Promise( ( resolve ) => setTimeout( resolve, time ) );
};

const waitForCli = ( count=5 ) => {
    return wait( 1000 )
        .then( getCliConnection )
        .catch( ( error ) => {
            if( count > 0 ) {
                console.log( 'Waiting for server to start (Retries remaining: ' + count + ')...' );
                return wait( 1000 ).then( () => waitForCli( count - 1 ) )
            }
            throw error;
        } );
};

const runInCli = ( socket, command ) => {
    return new Promise( ( resolve ) => {
        let data_wait = waitForNewData();
        socket.write( command + '\n' );
        resolve( data_wait );
    } );
};

const requestServer = ( path, body, opts={} ) => {
    let headers = {
        'Content-Type': 'application/json'
    };
    if( opts.token ) {
        headers[ 'X-Token' ] = opts.token;
        headers[ 'X-Username' ] = opts.token;
    }

    return fetch( 'http://localhost:21025' + path, Object
        .assign( {
            headers: headers,
            body: JSON.stringify( body ),
            method: 'POST'
        }, opts ) 
    );
};

const setupLogSocket = ( token, user_id ) => {
    return new Promise( ( resolve, reject ) => {
        const console_socket = new WebSocket( 'ws://localhost:21025/socket/websocket' );

        let should_output = false;

        console_socket.on( 'open', () => {
            console_socket.send( 'auth ' + token );
        } );

        console_socket.on( 'message', ( message ) => {
            if( message.startsWith( 'auth ok' ) ) {
                console_socket.send( 'subscribe user:' + user_id + '/console' );
                should_output = true;
                resolve( console_socket );
            } else if( should_output ) {
                message = JSON.parse( message );
                if( message.length >= 2 && message[ 1 ].messages && message[ 1 ].messages.log && message[ 1 ].messages.log.length > 0 ) {
                    console.log( message[ 1 ].messages.log.join( '\n' ) );
                    should_output = false;
                }
            }
        } );
    } );
}

(async () => {
    let test_dir = path.join( __dirname, '.test_dir' );
    
    mkdirp.sync( test_dir );

    // Make init silent
    let old_console = console.log;
    console.log = () => {};
    await new Promise( ( resolve ) => screeps_launcher.init( test_dir, STEAM_API_KEY, resolve ) );
    console.log = old_console;

    process.chdir( test_dir );

    await screeps_launcher
        .start( {
            modfile: path.join( test_dir, '../', 'test_mods.json' )
        } );

    let cli = await waitForCli();

    // curl -X POST localhost:21025/api/register/submit -H 'Content-Type: application/json' -d '{"username":"test", "password":"test"}'
    let register_test_user = await requestServer( '/api/register/submit', { username: 'test', password: 'test' } );
    let login_test_user = await requestServer( '/api/auth/signin', {}, {
        headers: {
            Authorization: 'Basic ' + base64.encode('test' + ":" + 'test')
        }
    } );
    login_test_user = await login_test_user.json();
    let token = login_test_user.token;

    let destroy_rooms = await runInCli( cli, 'for( let w = 0; w <= 10; w++ ) { for( let n = 0; n <= 10; n++ ) { map.removeRoom( \'W\' + w + \'N\' + n ) } }' );
    let create_room = await runInCli( cli, 'map.generateRoom( \'W5N5\', { terrainType: 1, swampType: 0, sources: 2, controller: true } )' );

    let create_spawn = await requestServer( '/api/game/place-spawn', {
        room: 'W5N5',
        x: 24,
        y: 24,
        name: 'spawn1'
    }, { token } );

    let me = await requestServer( '/api/auth/me', null, { body: null, token, method: 'GET' } );
    me = await me.json();

    let console_socket = await setupLogSocket( token, me._id );

    let code = fs.readFileSync( path.join( __dirname, 'dist/', 'test/', 'main.js' ) ).toString();
    let upload_code = await requestServer( '/api/user/code', {
        modules: {
            main: code
        },
        branch: 'default'
    }, { token } );
})()
.catch( ( error ) => {
    console.error( error );
} );
