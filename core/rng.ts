import { swap } from './iterable.ts'

/**
 * The base class for creating a (potentially seeded) random number generator.
 * Provides a plethora of methods for manipulating objects with randomness.
 * (I predicted you might need them, you are not random)
 * 
 * Take a look at [this list of JavaScript PRNGs](https://github.com/bryc/code/blob/master/jshash/PRNGs.md)
 * for guidance on implementation.
 * @author MindfulMinun
 * @since 2022-07-08
 */
export abstract class RNG implements Iterable<number> {
    /**
     * This is the main number generation function. It should return a number
     * between 0 (inclusive) and 1 (exclusive) as well as update its internal state.
     * @author MindfulMinun
     * @since 2022-07-16
     */
    abstract nextValue(): number

    /**
     * Yields numbers between zero and one
     * @author MindfulMinun
     * @since 2022-07-16
     */
    *[Symbol.iterator]() {
        while (true) yield this.float()
    }

    /**
     * Returns a floating point number between 0 (inclusive) and 1 (exclusive),
     * using the algorithm implemented in {@link nextValue()}
     * @author MindfulMinun
     * @since 2022-07-16
     */
    float() {
        return this.nextValue()
    }

    /**
     * Returns an integer between the provided bounds. This returns integers *up to* `upper`, without including it.
     * @author MindfulMinun
     * @since 2022-07-16
     */
    int(upper: number): number
    int(lower: number, upper: number): number
    int(a: number, b?: number): number {
        const [min, max] = typeof b === "undefined" ? [0, a] : [a, b]
        return Math.floor(this.float() * (max - min + 1) + min)
    }

    /**
     * Chooses a random element from a provided array
     * @author MindfulMinun
     * @since 2022-07-16
     */
    choose<T>(arr: T[]) {
        return arr[Math.floor(this.float() * arr.length)]
    }

    /**
     * Shuffles an array. Note that this function swaps the elements
     * *in place*, meaning the original array is modified.
     * @author MindfulMinun
     * @since 2022-07-16
     */
    shuffle<T>(arr: T[]) {
        let i, j
        for (i = arr.length - 1; i > 0; i--) {
            j = Math.floor(this.float() * (i + 1))
            swap(arr, i, j)
        }
        return arr
    }

    /**
     * Chooses an element from an array randomly, but with weighted probabilities.
     * @param weights - An array of numbers. `weights[i]` corresponds to the probability
     * of `items[i]` being chosen. The weights can be any nonnegative number, decimal or otherwise,
     * and the sum of weights *does not* have to be 1.
     * @example
     * // 'paper' will be returned about half of the time, and 'rock' and 'scissors'
     * // will be returned about a 1/4th of the time each.
     * BaseClass.chooseWithWeights(
     *    ['rock', 'paper', 'scissors'],
     *    [1, 2, 1]
     * )
     * @author MindfulMinun
     * @since 2022-07-16
     */
    chooseWithWeights<T>(items: T[], weights: number[]) {
        if (items.length != weights.length) throw Error(`Expected items and weights to have the same number of elements, but items has ${items.length} elements, and weights has ${weights.length}.`)

        const sumOfWeights = weights.reduce((acc, v) => acc + v)
        const picked = this.float() * sumOfWeights

        let i = 0
        let currentSum = 0

        for (; i < weights.length - 1; i++) {
            currentSum += weights[i]
            if (currentSum > picked) break
        }

        return items[i]
    }
}

/**
 * A simple RNG which returns numbers generated by {@link https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Math/random Math.random()}
 * @author MindfulMinun
 * @since 2022-07-08
 */
export class Random extends RNG {
    nextValue() { return Math.random() }
}

/**
 * A seeded RNG which implements Mulberry32
 * @author MindfulMinun
 * @since 2022-07-08
 */
export class Mulberry32 extends RNG {
    #seed!: number
    originalSeed!: number

    constructor(seed = Date.now()) {
        super()
        this.resetSeed(seed)
    }

    /** Resets the seed */
    resetSeed(seed = this.#seed) {
        this.originalSeed = seed
        this.#seed = seed
    }

    nextValue() {
        // Mulberry32
        let a = this.#seed
        a |= 0
        a = a + 0x6D2B79F5 | 0
        let t = Math.imul(a ^ a >>> 15, 1 | a)
        t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
        this.#seed = a
        return ((t ^ t >>> 14) >>> 0) / 4294967296
    }
}
