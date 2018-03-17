global._ = require( 'lodash' );
global.assert = require( 'chai' ).assert;

const constants = require( './src/constants' );
_
    .forEach( constants, ( constant, name ) => {
        global[ name ] = constant;
    } );
