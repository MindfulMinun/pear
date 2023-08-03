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

    console.log(fib(1000))
}
