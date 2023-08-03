# 1.3.0
- iterable
    - Add Prettify helper type
- structures
    - Add BinaryHeap, Memo, and StateMachine
    - Split into multiple files
- graph
    - graph-solver
         - Add Kruskal's algorithm for finding a minimum spanning tree.


# 1.2.0

- core
    - async.ts
        - wait: Promise that resolves after a timeout
        - EventStream: Moved EventStream from iterable.ts to async.ts
        - pinkyPromise: Moved pinkyPromise from iterable.ts to async.ts
    - iterable.ts
        - Fixed range not working with a reversed range
        - Deprecated choose and shuffle, use the methods on the Random class in rng.ts instead!
        - EventStream: Moved EventStream from iterable.ts to async.ts
        - pinkyPromise: Moqved pinkyPromise from iterable.ts to async.ts
    - rng.ts
        - Added RNG.chooseWithWeights
    - string.ts
        - Sorted stuff from helpers.ts into here
- tools
    - structures.ts
        - Common computer science data structures, such as a stack and queue
    - graph
        - Graph implementation, as well as a few common graph theory algorithms
    - math/primes.ts
        - Functions to to help use with prime numbers

# 1.1.0

- Add limit and limitAsync by @MindfulMinun in #1
- Add rng.ts by @MindfulMinun in #2

# 1.0.0 (Initial release)
