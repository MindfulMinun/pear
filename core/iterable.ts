/**
 * Represents a tuple, or a homogenous array of a fixed length.
 * 
 *     const deck: Tuple<Card, 52> = [Card, Card, Card, ...];
 */
export type Tuple<
 T,
 N extends number,
 R extends readonly T[] = [],
> = R['length'] extends N ? R : Tuple<T, N, readonly [T, ...R]>;

/**
 * Creates an iterable that always yields the given value.
 * @author MindfulMinun
 * @since 2022-04-21
 */
export function* fill<T>(value = 0 as unknown as T, length = Infinity): Generator<T, void, unknown> {
    for (let i = 0; i < length; i++)
        yield value
}

/**
 * Creates an iterable that yields numbers between a range.
 * @author MindfulMinun
 * @since 2022-04-27
 */
export function range(end: number): Generator<number, void, unknown>
export function range(start: number, end: number): Generator<number, void, unknown>
export function range(start: number, end: number, step: number): Generator<number, void, unknown>
export function* range(a: number, b?: number, c?: number) {
    const [start, end, step] = (
        typeof b === "undefined" ? [0, a, 1] :
        typeof c === "undefined" ? [a, b, 1] : [a, b, Math.abs(c)]
    )
    const delta = end < start ? -step : step
    for (let i = start; i < end; i += delta)
        yield i
}

/**
 * Given an iterable, yields the first `count` items, then returns.
 * @author MindfulMinun
 * @since 2022-07-07
 */
export function* limit<T>(count: number, iterable: Iterable<T>) {
    let i = 0
    for (const value of iterable) {
        if (i < count) {
            yield value
            i++
        } else break
    }
    return
}

/**
 * Given an async iterable, yields the first `count` items, then returns.
 * @author MindfulMinun
 * @since 2022-07-07
 */
export async function* limitAsync<T>(count: number, iterable: AsyncIterable<T>) {
    let i = 0
    for await (const value of iterable) {
        if (i < count) {
            yield value
            i++
        } else break
    }
    return
}

/**
 * Removes elements from an array. Non-destructive, as all array operations should be :D
 *
 *     // Removes 'b', at index 1
 *     removeFromArraybyIndexes(['a', 'b', 'c'], 1) // ['a', 'c']
 *     // Removes 'b' and 'd', at indexes 1 and 3
 *     removeFromArraybyIndexes(['a', 'b', 'c', 'd'], [1, 3]) // ['a', 'c']
 * @since 2020-07-12
 */
export function removeFromArraybyIndexes<T>(
    arr: T[],
    indexes: number | number[]
): T[] {
    if (Array.isArray(indexes)) {
        return arr.filter((_, i) => indexes.indexOf(i) === -1)
    } else {
        return arr.filter((_, i) => i !== indexes)
    }
}

/**
 * Divides an array into two by a given predicate function. Those that pass are put into the first, the rest are put in the second.
 * 
 * @author MindfulMinun
 * @since 2022-06-28
 */
export function divide<T>(list: T[], predicate: (this: typeof list, value: T, index: number, array: typeof list) => boolean): [T[], T[]] {
    const pass: T[] = []
    const fail: T[] = []

    list.forEach((v, i, arr) => {
        const passed = predicate.apply(list, [v, i, arr])
        ;(passed ? pass : fail).push(v)
    })

    return [pass, fail]
}

/**
 * Chooses a random element from an array
 *
 *     choose(document.all).click()
 * @since 2020-06-29
 */
 export function choose<T>(arr: T[]): T {
    if (!arr.length) throw new Error('Cannot choose from an empty array')
    return arr[Math.floor(Math.random() * arr.length)]
}

/**
 * Shuffles an array. Note that this function swaps the elements
 * *in place*, meaning the original array is modified.
 * @since 2020-07-19
 */
export function shuffle<T>(arr: T[]): T[] {
    let j, i
    for (i = arr.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1))
        swap(arr, i, j)
    }
    return arr
}

/**
 * Swaps two elements of an array. Note that this function swaps
 * the elements *in place*, meaning the original array is modified.
 * @since 2020-07-19
 */
export function swap<T>(arr: T[], i: number, j: number): void {
    const carry = arr[i]
    arr[i] = arr[j]
    arr[j] = carry
}

/**
 * Helper class to handle events and turn them into async iterables
 *
 * ```ts
 * const stream = new EventStream<MouseEvent>()
 * 
 * document.body.addEventListener('click', ev => stream.emit(ev))
 * wait(10e3).then(() => stream.end())
 * 
 * for await (const event of stream) {
 *     alert("Clicked!")
 * }
 * ```
 * @since 2021-08-07
 */
export class EventStream<T> implements AsyncIterable<T> {
    #done: boolean
    #events: T[]
    #resolve: () => void
    #promise!: Promise<void>

    constructor() {
        this.#done = false
        this.#events = []
        this.#resolve = () => { }
        this.#defer()
    }

    #defer() {
        this.#promise = new Promise(r => this.#resolve = r)
    }

    async*[Symbol.asyncIterator]() {
        while (!this.#done) {
            await this.#promise
            yield* this.#events
            this.#events = []
        }
    }

    /**
     * Dispatches an event. For-await-of listeners of this class instance will recieve this event.
     * Note that once an event is emitted, it cannot be cancelled.
     * @since 2021-08-07
     */
    emit(event: T) {
        this.#events.push(event)
        this.#resolve()
        this.#defer()
    }

    /**
     * Waits for a specific event to be emitted according to a predicate.
     * 
     * @example
     * const stream = new EventStream<MouseEvent>()
     * // Some events happen...
     * const click = stream.once(ev => ev.type === 'click')
     * @since 2021-12-22
     */
    once(predicate: (value: T) => boolean) {
        return once(this, predicate)
    }
    
    /**
     * Stops the iterator. This terminates for-await-of loops listening for events,
     * and any newly dispatched events will not be sent to the iterator.
     * @since 2021-08-07
     */
    end() {
        this.#done = true
        this.#resolve()
    }
}

/**
 * Wait for any async iterable to yield a specific value according to a predicate.
 * 
 * @example
 * const stream = new EventStream<MouseEvent>()
 * // Some events happen...
 * const click = once(stream, ev => ev.type === 'click')
 * @since 2021-12-22
 */
export async function once<T>(source: AsyncIterable<T>, predicate: (value: T) => boolean) {
    for await (const value of source) {
        if (predicate(value)) return value
    }
}

/**
 * A "destructured" Promise, useful for waiting for callbacks.
 * @example
 * // When awaited, this function returns a promise that resolves to
 * // an *OPEN* WebSocket
 * () => {
 *     const sock = new WebSocket('wss://wss.example.com')
 *     const [p, res, rej] = pinkyPromise<typeof sock>()
 *     sock.onerror = err => rej(err)
 *     sock.onopen = () => res(sock)
 *     return p
 * }
 * 
 * @author MindfulMinun
 * @since 2022-06-05
 */
export function pinkyPromise(): [Promise<void>, () => void, (reason?: unknown) => void]
export function pinkyPromise<T>(): [Promise<T>, (value: T) => void, (reason?: unknown) => void]
export function pinkyPromise<T>(): [
    Promise<T | void>,
    (value?: T | PromiseLike<T>) => void,
    (reason?: unknown) => void
] {
    let resolve: (value?: T | PromiseLike<T>) => void
    let reject: (error: unknown) => void

    // This works because callbacks to the Promise constructor are called synchronously.
    const p = new Promise<T | void>((yay, nay) => {
        resolve = value => yay(value)
        reject = reason => nay(reason)
    })

    // HACK: This works because callbacks to the Promise constructor are called synchronously.
    // In other words, they're immediately invoked, so they're available immediately after
    // the assignment to `p`
    return [p, resolve!, reject!]
}
