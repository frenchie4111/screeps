const position = require( '~/lib/position' );

const MetricCollector = require( './MetricCollector' );

class CreepPositionCollector extends MetricCollector {
    constructor() {
        super( 'position' );
    }

    _positionToKey( pos ) {
        return pos.roomName + '-' + pos.x + '-' + pos.y;
    }

    _setLastPos( memory, creep ) {
        memory.creeps[ creep.id ] = position.clone( creep.pos );
    }

    _getLastPos( memory, creep ) {
        return memory.creeps[ creep.id ];
    }

    _hasMoved( memory, creep ) {
        let last_pos = this._getLastPos( memory, creep );
        if( !last_pos ) return true;
        return !position.equal( last_pos, creep.pos );
    }

    _collect( room, memory ) {
        if( !memory.hasOwnProperty( 'creeps' ) ) memory.creeps = {};
        if( !memory.hasOwnProperty( 'positions' ) ) memory.positions = {};

        room
            .find( FIND_MY_CREEPS, {
                filter: ( creep ) => {
                    let moved = this._hasMoved( memory, creep );
                    this._setLastPos( memory, creep );
                    return moved;
                }
            } )
            .forEach( ( creep ) => {
                const key = this._positionToKey( creep.pos );
                if( !memory.positions.hasOwnProperty( key ) ) memory.positions[ key ] = 0;
                memory.positions[ key ]++;
            } );
    }
}

module.exports = CreepPositionCollector;
