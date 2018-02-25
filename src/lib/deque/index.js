class Deque {
    constructor( memory_item={}, maxlen ) {
        this.queue = memory_item.queue || {};
        this.maxlen = memory_item.maxlen || maxlen || 10;
    }

    push( item ) {
        this.queue.push( item );

        if( this.queue.length > this.maxlen ) {
            this.queue.pop(0);
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
