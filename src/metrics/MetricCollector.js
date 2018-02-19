class MetricCollector {
    constructor( name ) {
        this.name = name;
    }

    _collect( room, memory ) {
        throw new Error( 'Abstract method' );
    }

    getMemory( room ) {
        console.log( 'getMemory', room );
        if( !room.memory.hasOwnProperty( '_metrics' ) ) room.memory._metrics = {};
        if( !room.memory._metrics.hasOwnProperty( this.name ) ) room.memory._metrics[ this.name ] = {};
        return room.memory._metrics[ this.name ];
    }

    collect( room ) {
        this._collect( room, this.getMemory( room ) );
    }
}

module.exports = MetricCollector;
