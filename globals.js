const constants = require( './src/constants' );

console.log( 'before' );
global._ = require( 'lodash' );

_
    .forEach( constants, ( constant, name ) => {
        global[ name ] = constant;
    } );

console.log( global );
