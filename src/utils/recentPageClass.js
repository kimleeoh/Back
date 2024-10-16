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
        // 중복 체크: 이미 값이 큐에 있으면 추가하지 않음
        if (this.contains(value)) {
            return;
        }

        const newNode = new Node(value);

        // 리스트 크기가 10을 초과하면 가장 오래된 요소를 제거
        if (this.size >= 10) {
            this.dequeue();
        }

        if (this.size === 0) {
            this.head = this.tail = newNode;
        } else {
            newNode.next = this.head;
            this.head.prev = newNode;
            this.head = newNode;
        }

        this.size++;
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

    // 중복된 값이 있는지 확인
    contains(value) {
        let currentNode = this.head;
        while (currentNode !== null) {
            if (currentNode.value === value) {
                return true;
            }
            currentNode = currentNode.next;
        }
        return false;
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
