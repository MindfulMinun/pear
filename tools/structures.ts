/**
 * Data structure allowing for the insertion and removal of
 * elements in a LIFO manner in `O(1)` time.
 * @author MindfulMinun
 * @since 2022-10-22
 */
export class Stack<T> implements Iterable<T> {
    #elements: Record<number, T>
    #head: number

    constructor(initials?: Iterable<T>) {
        this.#elements = {}
        this.#head = 0
        if (!initials) return
        for (const el of initials) this.push(el)
    }

    /** Add an element to the stack */
    push(element: T): void {
        this.#elements[this.#head++] = element
    }

    /** Remove an element from the stack and return it. */
    pop(): T | undefined {
        if (this.length === 0) return undefined
        const el = this.#elements[--this.#head]
        delete this.#elements[this.#head]
        return el
    }

    /** Preview the topmost element of the stack without removing it. */
    peek(): T | undefined {
        if (this.length === 0) return undefined
        return this.#elements[this.#head - 1]
    }

    /** The number of elements remaining in the stack */
    get length() { return this.#head }

    *[Symbol.iterator]() {
        while (this.length !== 0) yield this.pop()!
    }
}

/**
 * Data structure allowing for the insertion and removal of
 * elements in a FIFO manner in `O(1)` time.
 * @author MindfulMinun
 * @since 2022-10-22
 */
export class Queue<T> implements Iterable<T> {
    #elements: Record<number, T>
    #head: number
    #tail: number

    constructor(initials?: Iterable<T>) {
        this.#elements = {}
        this.#head = 0
        this.#tail = 0
        if (!initials) return
        for (const el of initials) this.enqueue(el)
    }

    /** Add an element to the queue */
    enqueue(element: T): void {
        this.#elements[this.#tail++] = element
    }

    /** Remove an element from the queue and return it. */
    dequeue(): T | undefined {
        if (this.length === 0) return undefined
        const el = this.#elements[this.#head]
        delete this.#elements[this.#head++]
        return el
    }

    /** Preview the next element in the queue without removing it. */
    peek(): T | undefined {
        if (this.length === 0) return undefined
        return this.#elements[this.#head]
    }

    /** The number of elements remaining in the queue */
    get length() { return this.#tail - this.#head }

    *[Symbol.iterator]() {
        while (this.length !== 0) yield this.dequeue()!
    }
}
