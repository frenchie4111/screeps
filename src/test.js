let TestRunner = require( './test_runner' );

let test_runner = new TestRunner();

global.assert = require( 'chai' ).assert;

global.describe = test_runner.describe.bind( test_runner );
global.it = test_runner.it.bind( test_runner );

global.beforeEach = ( name, func ) => {
};

function importAll(r) {
    r.keys().forEach(r);
}

importAll( require.context( './planner' ) );

let run = false;

module.exports.loop = () => {
    if( !run ) {
        run = true;
        test_runner.run();
    }
};
