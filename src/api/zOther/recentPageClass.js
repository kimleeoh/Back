class Node {
    constructor(value) {
        this.value = value;
        this.timestamp = Date.now();
        this.next = null;
        this.prev = null;
    }
}

class Queue {
    constructor() {
        this.head = null;
        this.tail = null;
        this.size = 0;
    }

    // Enqueue element at the top
    enqueue(value) {
        const newNode = new Node(value);
        if (this.size === 0) {
            this.head = this.tail = newNode;
        } else {
            newNode.next = this.head;
            this.head.prev = newNode;
            this.head = newNode;
        }
        this.size++;
        
         // Schedule removal of this element after 1 hour
         setTimeout(() => {
            this.removeNode(newNode);
        }, 3600000); // 1 hour in milliseconds
    }

    // Dequeue element from the bottom
    dequeue() {
        if (this.size === 0) {
            throw new Error("Queue is empty");
        }
        const value = this.tail.value;
        if (this.size === 1) {
            this.head = this.tail = null;
        } else {
            this.tail = this.tail.prev;
            this.tail.next = null;
        }
        this.size--;
        return value;
    }

    // Remove elements that have been in the queue for more than an hour
    removeNode(node) {
        if (node === this.head) {
            this.head = node.next;
        }
        if (node === this.tail) {
            this.tail = node.prev;
        }
        if (node.prev) {
            node.prev.next = node.next;
        }
        if (node.next) {
            node.next.prev = node.prev;
        }
        this.size--;
    }

    // Check if the queue is empty
    isEmpty() {
        return this.size === 0;
    }

    // Get the size of the queue
    getSize() {
        return this.size;
    }
}

export { Queue };