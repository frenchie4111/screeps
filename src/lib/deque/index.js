class Deque {
    constructor( maxlen=10 ) {
        this.queue = [];
        this.maxlen = maxlen;
    }

    push( item ) {
        this.queue.push( item );

        if( this.queue.length > this.maxlen ) {
            this.queue.pop();
        }
    }
}

module.exports = Deque;
