/**
 * Promise that resolves after timeout, optionally with a value to resolve with.
 *
 * @example
 * // Play hide and seek, count to 100 (seconds)
 * // Both methods are identical
 * wait(100e3).then(() => "Ready or not, here I come!").then(seek)
 * wait(100e3, "Ready or not, here I come!").then(seek)
 * @since 2020-06-23
 */
export function wait(timeout: number): Promise<void>
export function wait<T>(timeout: number, resolveWith: T): Promise<T>
export function wait<T>(timeout: number, resolveWith?: T): Promise<T | void> {
    return new Promise(resolve => setTimeout(() => resolve(resolveWith), timeout))
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
