import { Graph } from './graph.ts'

// Box drawing characters!
// ┌ ┬ ┐ ─│
// ├ ┼ ┤ ╱╳╲
// └ ┴ ┘ ╵╶╷╴

/**
 * Creates an *undirected cyclic graph*
 * 
 * ```plaintext
 * ┌── B ─── D
 * │   │
 * A   E ── F
 * │        │
 * └─ C ────┘
 * ```
 */
export function g1() {
    //    A
    //  /   \
    // C     B
    //  \   / \
    //   \ E   D
    //    \|
    //     F
    const G = new Graph<null, null>({ directed: false })
    
    const vertices = [
        G.createVertex(null, 'A'),
        G.createVertex(null, 'B'),
        G.createVertex(null, 'C'),
        G.createVertex(null, 'D'),
        G.createVertex(null, 'E'),
        G.createVertex(null, 'F')
    ]
    
    G.createEdge(vertices[0], vertices[1], null, { id: 'AB' })
    G.createEdge(vertices[0], vertices[2], null, { id: 'AC' })
    G.createEdge(vertices[1], vertices[3], null, { id: 'BD' })
    G.createEdge(vertices[1], vertices[4], null, { id: 'BE' })
    G.createEdge(vertices[2], vertices[5], null, { id: 'CF' })
    G.createEdge(vertices[3], vertices[5], null, { id: 'DF' })
    G.createEdge(vertices[4], vertices[5], null, { id: 'EF' })
    
    return G
}

/**
 * Creates an *undirected acyclic graph* for testing. Resembles a tree.
 * 
 * 
 * ```plaintext
 *      A
 *    /   \
 *   B     C
 *  / \   / \
 * D   E F   G
 * ```
 */
export function g2() {
    const G = new Graph<null, null>({ directed: false })

    const vertices = [
        G.createVertex(null, 'A'),
        G.createVertex(null, 'B'),
        G.createVertex(null, 'C'),
        G.createVertex(null, 'D'),
        G.createVertex(null, 'E'),
        G.createVertex(null, 'F'),
        G.createVertex(null, 'G')
    ]

    G.createEdge(vertices[0], vertices[1], null, { id: 'AB' })
    G.createEdge(vertices[0], vertices[2], null, { id: 'AC' })
    G.createEdge(vertices[1], vertices[3], null, { id: 'BD' })
    G.createEdge(vertices[1], vertices[4], null, { id: 'BE' })
    G.createEdge(vertices[2], vertices[5], null, { id: 'CF' })
    G.createEdge(vertices[2], vertices[6], null, { id: 'CG' })

    return G
}

/**
 * Creates an *undirected weighted cyclic graph.* The numbers next to the edges are the weights.
 * 
 * ```plaintext
 * 4          8       7         9
 *  ┌──── B ───── C ───── D ────┐
 *  │     │      2│ ╲     │     │
 *  A   11│ 7┌─── I   ╲4  │14   E
 *  │     │ ╱    6│     ╲ │     │
 *  └──── H ───── G ───── F ────┘
 * 8          1       2         10
 * ```
 */
export function g3() {
    const G = new Graph<null, number>({
        directed: false,
        weights: e => e.data
    })
    const vertices = [
        G.createVertex(null, 'A'),
        G.createVertex(null, 'B'),
        G.createVertex(null, 'C'),
        G.createVertex(null, 'D'),
        G.createVertex(null, 'E'),
        G.createVertex(null, 'F'),
        G.createVertex(null, 'G'),
        G.createVertex(null, 'H'),
        G.createVertex(null, 'I'),
        G.createVertex(null, 'J'),
    ]

    G.createEdge(vertices[0], vertices[1],  4, { id: 'AB' })
    G.createEdge(vertices[0], vertices[7],  8, { id: 'AH' })
    G.createEdge(vertices[1], vertices[2],  8, { id: 'BC' })
    G.createEdge(vertices[1], vertices[7], 11, { id: 'BH' })
    G.createEdge(vertices[2], vertices[3],  7, { id: 'CD' })
    G.createEdge(vertices[2], vertices[5],  4, { id: 'CF' })
    G.createEdge(vertices[2], vertices[8],  2, { id: 'CI' })
    G.createEdge(vertices[3], vertices[4],  9, { id: 'DE' })
    G.createEdge(vertices[3], vertices[5], 14, { id: 'DF' })
    G.createEdge(vertices[4], vertices[5], 10, { id: 'EF' })
    G.createEdge(vertices[5], vertices[6],  2, { id: 'FG' })
    G.createEdge(vertices[6], vertices[7],  1, { id: 'GH' })
    G.createEdge(vertices[6], vertices[8],  6, { id: 'GI' })

    return G
}
