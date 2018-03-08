module.exports.equal = ( a, b ) => {
    return (
        a && b &&
        a.x === b.x &&
        a.y === b.y &&
        a.roomName === b.roomName
    );
};

module.exports.clone = ( p ) => {
    return JSON.parse( JSON.stringify( p ) );
};

module.exports.fromJSON = ( p ) => {
    return new RoomPosition( p.x, p.y, p.roomName );
}

module.exports.getOpositeEntrancePosition = ( p, other_room ) => {
    let oposite_pos = module.exports.clone( p );
    if( p.x === 49 ) {
        oposite_pos.x = 0;
    }
    if( p.x === 0 ) {
        oposite_pos.x = 49;
    }
    if( p.y === 49 ) {
        oposite_pos.y = 0;
    }
    if( p.y === 0 ) {
        oposite_pos.y = 49;
    }
    oposite_pos.roomName = other_room;

    return module.exports.fromJSON( oposite_pos );
};

module.exports.inRoom = ( p ) => {
    return ( p.x > 0 && p.x < 49 ) && ( p.y > 0 && p.y < 49 );
}

const INT_DIRECTIONS = {
    [ TOP ]:            [  0, -1 ],
    [ TOP_RIGHT ]:      [ +1, -1 ],
    [ RIGHT ]:          [ +1,  0 ],
    [ BOTTOM_RIGHT ]:   [ +1, +1 ],
    [ BOTTOM ]:         [  0, +1 ],
    [ BOTTOM_LEFT ]:    [ -1, +1 ],
    [ LEFT ]:           [ -1,  0 ],
    [ TOP_LEFT ]:       [ -1, -1 ]
};

function mod( n, m ) {
    return ( ( n % m ) + m ) % m;
}

module.exports.normalizeDir = ( int_dir ) => {
    int_dir = +int_dir;

    int_dir -= 1; // 9 (TOP) - 1 = 8   6 (BL) - 1 = 5

    // int_dir %= 8; // 8 % 8 = 0         5 % 8 = 5
    int_dir = mod( int_dir, 8 );

    int_dir += 1; // 0 + 1 = 1 (TOP)   5 + 1 = 6 (BL)
    return int_dir;
}

module.exports.directionFromIntDirection = ( int_dir ) => {
    int_dir = module.exports.normalizeDir( +int_dir );
    return INT_DIRECTIONS[ int_dir ].slice();
};

module.exports.directionToPosition = ( pos, dir ) => {
    return module.exports
        .fromJSON( {
            x: pos.x + dir[ 0 ],
            y: pos.y + dir[ 1 ],
            roomName: pos.roomName
        } );
}

module.exports.intDirectionToPosition = ( pos, int_dir ) => {
    // Make sure it's between 1 and 8
    int_dir = module.exports.normalizeDir( int_dir );
    return module.exports.directionToPosition( pos, INT_DIRECTIONS[ int_dir ] );
}

module.exports.getOpositeDirection = ( int_dir ) => {
    return module.exports.normalizeDir( (+int_dir) + 4 );
};

module.exports.mergeDirs = ( dir1, dir2 ) => {
    let new_dir = dir1.slice();
    new_dir[ 0 ] += dir2[ 0 ];
    new_dir[ 1 ] += dir2[ 1 ];
    return new_dir;
}
