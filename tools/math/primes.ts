/**
 * A cache of prime numbers.
 * 
 * This cache is unfortunately bounded by the memory constraints JavaScript
 * imposes on arrays. This means the highest prime number that can be generated
 * is NOT anywhere close to `Number.MAX_SAFE_INTEGER` (2^53 - 1), but instead
 * much lower, at around the (2^32 - 2)th prime.
 * @private
 */
const knownPrimesArr: number[] = [2]

/**
 * Yields prime numbers in ascending order
 *
 * @remarks
 * 
 * This function has a heavy memory footprint, is unfortunately bounded
 * by the memory constraints JavaScript imposes on arrays. This means
 * the highest prime number that can be generated is NOT `Number.MAX_SAFE_INTEGER`, but
 * instead the (2^32 - 2)th prime.
 * 
 * However, since primality only needs to be verified for numbers up to sqrt(n), this
 * function is sufficient for telling if any number between 2 and `Number.MAX_SAFE_INTEGER` is prime
 * 
 * @example
 * for (const prime of primes()) {
 *     if (prime > 100) break
 *     console.log(prime)
 * }
 * 
 * @author MindfulMinun
 * @since 2022-10-13
 */
export function* primes(): Generator<number, never, undefined> {
    // First we yield all the known primes
    // yield* knownPrimes.values()
    yield* knownPrimesArr
    
    // Then we generate new primes using the sieve of Eratosthenes
    while (true) {
        const length = knownPrimesArr.length
        let n = knownPrimesArr[length - 1] + 1

        while (!_isPrime(n)) n++

        if (2 ** 32 - 3 < length) throw Error("Too many primes!")

        knownPrimesArr.push(n)
        yield n
    }
}

function _isPrime(n: number) {
    if (n < 2) return false

    if (Number.MAX_SAFE_INTEGER < n) throw Error("Number is too large to verify X(")

    const sqrt = Math.ceil(Math.sqrt(n))

    for (const prime of knownPrimesArr) {
        if (n % prime === 0) return false
        if (sqrt < prime) break
    }
    return true
}

/**
 * Verify if a given number is prime.
 * @author MindfulMinun
 * @since 2022-10-13
 */
export function isPrime(n: number): boolean {
    // To verify if a number is prime, we only need to check if it is divisible by
    // any of the primes less than or equal to its square root.

    const sqrt = Math.ceil(Math.sqrt(n))

    for (const prime of primes()) {
        if (n % prime === 0) return false
        if (sqrt < prime) break
    }
    return true
}
