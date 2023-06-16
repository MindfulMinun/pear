import { swap } from '../core/iterable.ts'

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
        for (const el of initials) this.push(el)
    }

    /** Add an element to the queue */
    push(element: T): void {
        this.#elements[this.#tail++] = element
    }

    /** Remove an element from the queue and return it. */
    pop(): T | undefined {
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
        while (this.length !== 0) yield this.pop()!
    }
}

/**
 * A minimum binary heap.
 * 
 * A binary heap always satisfies the following properties:
 * - The root node is the minimum element in the heap.
 * - The children of a node are always greater than or equal to that node.
 * 
 * @author MindfulMinun
 * @since 2023-03-10
 */
export class BinaryHeap<T> implements Iterable<T> {
    #comparator: (a: T, b: T) => number
    #elements: T[]

    constructor(
        comparator: (a: T, b: T) => number,
        initials: Iterable<T> = []
    ) {
        this.#comparator = comparator
        this.#elements = []

        for (const el of initials) this.push(el)
    }

    *[Symbol.iterator]() {
        while (this.length !== 0) yield this.pop()!
    }

    /**
     * Insert an element into the heap.
     */
    push(element: T): void {
        this.#elements.push(element)
        this.#bubbleUp(this.length - 1)
    }

    /**
     * Remove the minimum element from the heap and return it.
     */
    pop(): T | undefined {
        if (this.length === 0) return undefined

        // Swap the last element with the root
        swap(this.#elements, 0, this.length - 1)
        // Remove the last element
        const el = this.#elements.pop()
        // Bubble the new root down
        this.#bubbleDown(0)

        return el
    }

    /** Preview the minimum element in the heap without removing it. */
    peek(): T | undefined {
        if (this.length === 0) return undefined
        return this.#elements[0]
    }

    /** Bubble an element up the heap until it is in the correct position. */
    #bubbleUp(index: number): void {
        // If the element is the root, it is in the correct position
        if (index === 0) return

        // Bubble the element up the heap until it is in the correct position
        let current = index
        let parent = BinaryHeap.parent(current)
        const val = this.#elements[current]

        // While the element is less than its parent, swap it with its parent
        while (0 < current && this.#comparator(val, this.#elements[parent]) < 0) {
            this.#elements[current] = this.#elements[parent]
            current = parent
            parent = BinaryHeap.parent(current)
        }
        this.#elements[current] = val
    }

    /** Bubble an element down the heap until it is in the correct position. */
    #bubbleDown(index: number): void {
        // If the element is a leaf, it is in the correct position
        if (index >= this.length) return

        // Bubble the element down the heap until it is in the correct position
        let current = index
        let [left, right] = BinaryHeap.leftRight(current)
        const val = this.#elements[current]

        // While the element is greater than its children, swap it with its smallest child
        while (left < this.length) {
            // Find the smallest child
            let smallest = left
            if (right < this.length && 0 < this.#comparator(this.#elements[left], this.#elements[right])) {
                smallest = right
            }

            // If the element is smaller than its smallest child, it is in the correct position
            if (this.#comparator(val, this.#elements[smallest]) <= 0) break

            // Swap the element with its smallest child
            this.#elements[current] = this.#elements[smallest]
            current = smallest
            ;[left, right] = BinaryHeap.leftRight(current)
        }

        this.#elements[current] = val
    }

    private static leftRight(index: number) {
        return [index * 2 + 1, index * 2 + 2]
    }

    private static parent(index: number) {
        return Math.floor((index - 1) / 2)
    }

    /** The number of elements in the heap */
    get length() { return this.#elements.length }
}

/**
 * A cache-like object that can be used with {@link Memo}. This interface is
 * compatible with `Map`, but it can also be used to implement other caching
 * strategies, such as an LRU cache.
 */
export interface Cachelike<T> {
    get(key: string): T | undefined
    set(key: string, value: T): void
    has(key: string): boolean
}

export interface MemoOpts<A extends unknown[], R extends unknown> {
    fn: (...args: A) => R
    hash?: (...args: A) => string
    cache?: Cachelike<R>
}

/**
 * Converts a function into a memo.
 * 
 * A memo is a function that caches its results, allowing for faster
 * computation of the same function with the same arguments.
 * 
 * The memo can be configured with a custom hash function and cache.
 * By default, the hash function is `JSON.stringify` and the cache is a `Map`.
 * 
 * Use the memo by calling `memo.fn(...args)` on the memo object.
 * 
 * 
 * @author MindfulMinun
 * @since 2023-06-16
 */
export class Memo<A extends unknown[], R extends unknown> {
    #ogfn: (...args: A) => R
     hash: (...args: A) => string
    cache: Cachelike<R>

    hits: number
    misses: number

    constructor(fn: (...args: A) => R)
    constructor(opts: MemoOpts<A, R>)
    constructor(x: MemoOpts<A, R> | ((...args: A) => R)) {
        this.#ogfn = () => { throw new Error('Memo not initialized') }
        this.hash = (...args) => JSON.stringify(args)
        this.cache = new Map<string, R>()
        this.hits = 0
        this.misses = 0

        if (typeof x === 'function') {
            this.#ogfn = x
        } else {
            this.#ogfn = x.fn
            this.hash = x.hash ?? this.hash
            this.cache = x.cache ?? this.cache
        }
    }

    #memoHandler(...args: A): R {
        const key = this.hash.apply(this, args)
        if (this.cache.has(key)) {
            this.hits++
            return this.cache.get(key)!
        }
        const result = this.#ogfn.apply(this, args)
        this.cache.set(key, result)
        this.misses++
        return result
    }

    get ratio() {
        return this.hits / (this.hits + this.misses)
    }

    get fn() {
        return this.#memoHandler.bind(this)
    }
}

if (import.meta.main) {
    const fib = new Memo({
        fn: (n: number): number => {
            switch (n) {
                case 0: case 1: return n
                default: return fib(n - 1) + fib(n - 2)
            }
        }
    }).fn

    console.log(fib(100))
}
