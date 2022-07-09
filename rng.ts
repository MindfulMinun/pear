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
export abstract class BaseRNG implements Iterable<number> {
    /**
     * This is the main number generation function.
     * It should return a number between 0 (inclusive) and 1 (exclusive) as well as update its internal state.
     */
    abstract nextValue(): number

    /** nyanyanya */
    *[Symbol.iterator]() {
        while (true) yield this.nextValue()
    }

    /** Returns a floating point number between 0 (inclusive) and 1 (exclusive) */
    float() {
        return this.nextValue()
    }

    /** Returns an integer between the provided bounds. This returns integers *up to* `upper`, without including it. */
    int(upper: number): number
    int(lower: number, upper: number): number
    int(a: number, b?: number): number {
        const rand = this.float()
        const [min, max] = typeof b === "undefined" ? [0, a] : [a, b]
        return Math.floor(rand * (max - min + 1) + min)
    }

    /** Chooses a random element from a provided array */
    choose<T>(arr: T[]) {
        return arr[Math.floor(this.float() * arr.length)]
    }

    /** Shuffles an array */
    shuffle<T>(arr: T[]) {
        let i, j
        for (i = arr.length - 1; i > 0; i--) {
            j = Math.floor(this.float() * (i + 1))
            swap(arr, i, j)
        }
        return arr
    }
}

/**
 * A simple RNG which returns numbers generated by {@link https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Math/random Math.random}
 * @author MindfulMinun
 * @since 2022-07-08
 */
export class Random extends BaseRNG {
    nextValue() { return Math.random() }
}

/**
 * A seeded RNG which implements Mulberry32
 * @author MindfulMinun
 * @since 2022-07-08
 */
export class Mulberry32 extends BaseRNG {
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
