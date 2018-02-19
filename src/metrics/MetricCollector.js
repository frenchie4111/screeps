class MetricCollector {
    constructor( name ) {
        this.name = name;
    }

    _collect( room, memory ) {
        throw new Error( 'Abstract method' );
    }

    collect( room ) {
        if( !room.memory.hasOwnProperty( '_metrics' ) ) room.memory._metrics = {};
        if( !room.memory._metrics.hasOwnProperty( this.name ) ) room.memory._metrics[ this.name ] = {};
        const memory = room.memory._metrics[ this.name ];
        this._collect( room, memory );
    }
}

module.exports = MetricCollector;
