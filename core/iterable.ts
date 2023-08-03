/**
 * Represents a homogenous array of a fixed length.
 * 
 *     const deck: Repeated<Card, 52> = [Card, Card, Card, ...];
 */
export type Repeated<
    T,
    N extends number,
    R extends readonly T[] = [],
> = R['length'] extends N ? R : Repeated<T, N, readonly [T, ...R]>

export type Prettify<T> = { [K in keyof T]: T[K] } & {}

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
 * A ganerator that yields numbers between a range, akin to Python's {@link https://docs.python.org/3.11/library/stdtypes.html#ranges range}.
 * If `start` is greater than `end`, the range will decrement accordingly
 * 
 * @example
 * for (const i of range(10)) {
 *    console.log(i) // 0, 1, 2, 3, 4, 5, 6, 7, 8, 9
 * }
 * range(6)        // ->  0, 1, 2, 3, 4, 5
 * range(3, 9)     // ->  3, 4, 5, 6, 7, 8
 * range(9, 3)     // ->  9, 8, 7, 6, 5, 4
 * range(0, 10, 2) // ->  0, 2, 4, 6, 8
 * range(10, 0, 2) // -> 10, 8, 6, 4, 2
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

    const positive = start < end
    const delta = positive ? step : -step

    for (let i = start; positive ? i < end : end < i; i += delta)
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
 * @deprecated Use the `choose` method on the `Random` class from `core/rng.ts#Random` instead!
 * 
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
 * @deprecated Use the `shuffle` method on the `Random` class from `core/rng.ts#Random` instead!
 * 
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
