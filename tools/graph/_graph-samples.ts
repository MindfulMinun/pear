import { Graph } from './graph.ts'

/**
 * Creates a undirected cyclic graph.
 * 
 * ```plaintext
 *    A
 *  /   \
 * C     B
 *  \   / \
 *   \ E   D
 *    \|
 *     F
 * ```
 */
export function g1() {
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
 *      0
 *    /   \
 *   1     2
 *  / \   / \
 * 3   4 5   6
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

    G.createEdge(vertices[0], vertices[1], null)
    G.createEdge(vertices[0], vertices[2], null)
    G.createEdge(vertices[1], vertices[3], null)
    G.createEdge(vertices[1], vertices[4], null)
    G.createEdge(vertices[2], vertices[5], null)
    G.createEdge(vertices[2], vertices[6], null)

    return G
}
