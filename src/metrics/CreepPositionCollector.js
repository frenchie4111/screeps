const MetricCollector = require( './MetricCollector' );

class CreepPositionCollector extends MetricCollector {
    constructor() {
        super( 'position' );
    }

    _positionToKey( pos ) {
        return pos.x + '-' + pos.y;
    }

    _collect( room, memory ) {
        room
            .find( FIND_MY_CREEPS )
            .forEach( ( creep ) => {
                const key = this._positionToKey( creep.pos );
                if( !memory.hasOwnProperty( key ) ) memory[ key ] = 0;
                memory[ key ]++;
            } );
    }
}

module.exports = CreepPositionCollector;
