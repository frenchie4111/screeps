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
