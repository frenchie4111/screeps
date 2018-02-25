class Deque {
    constructor( memory_item={}, maxlen ) {
        this.queue = memory_item.queue || {};
        this.maxlen = memory_item.maxlen || maxlen || 10;
    }

    push( item ) {
        this.queue.push( item );

        if( this.queue.length > this.maxlen ) {
            this.queue.shift();
        }
    }

    toJSON() {
        return {
            queue: this.queue,
            maxlen: this.maxlen
        }
    }
}

module.exports = Deque;
