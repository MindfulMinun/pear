import { Graph, VertexType, EdgeType } from "./graph.ts";

type WeightFn<Graph> = (v: VertexType<Graph>, e: EdgeType<Graph>) => number
type SearchFn<Graph> = (v: VertexType<Graph>, e: EdgeType<Graph> | null, pathmap: Map<typeof v, typeof e>) => boolean | void

export class GraphSolver<vData, eData> {
    G: Graph<vData, eData>

    constructor(G: Graph<vData, eData>) {
        this.G = G
    }

    /**
     * Performs DFS on a graph.
     * @author MindfulMinun
     * @since 2022-07-31
     */
    #DFS(root: VertexType<typeof this.G>, search: (v: typeof root) => typeof root | void) {
        const stack = [root]
        const discovered = new WeakSet<typeof root>()
        discovered.add(root)

        while (stack.length !== 0) {
            const v = stack.pop()!
            const value = search(v)
            if (value) return value
            for (const E of v.adjacentEdges) {
                const w = E.v === v ? E.u : E.v
                if (!discovered.has(w)) {
                    discovered.add(w)
                    stack.push(w)
                }
            }
        }
        return null
    }

    /**
     * Performs a breadth-first search on a graph. Returns the path from root to the found node.
     * @author MindfulMinun
     * @since 2022-07-31
     */
    BFS(root: VertexType<typeof this.G>, search: SearchFn<typeof this.G>) {
        const queue = [root]
        const backEdges = new Map<VertexType<typeof this.G>, EdgeType<typeof this.G>>()
        const discovered = new WeakSet<typeof root>()
        discovered.add(root)

        let v: VertexType<typeof this.G> | null = root

        while (queue.length !== 0) {
            v = queue.shift()!
            const value = search(v, backEdges.get(v) ?? null, backEdges)

            if (value) break
            for (const E of v.adjacentEdges) {
                if (this.G.directed && v !== E.u) continue
                const w = E.not(v)
                if (!discovered.has(w)) {
                    discovered.add(w)
                    backEdges.set(w, E)
                    queue.push(w)
                }
            }
            v = null
        }

        if (v === null) return null

        const reversed: EdgeType<typeof this.G>[] = []
        while (v != root) {
            const back = backEdges.get(v)
            if (!back) break
            v = back.not(v)
            reversed.push(back)
        }
        const path = this.G.createPath(root)
        reversed.reverse().forEach(e => path.addEdge(e))

        return path
    }
}


//      0
//     / \
//   1      2
//  / \    / \
// 3   4  5   6

if (import.meta.main) {
    const G = new Graph<number, null>({ directed: true })
    //#region Graph definition
    const vertices = [
        G.createVertex(0),
        G.createVertex(1),
        G.createVertex(2),
        G.createVertex(3),
        G.createVertex(4),
        G.createVertex(5),
        G.createVertex(6)
    ]

    G.createEdge(vertices[0], vertices[1], null)
    G.createEdge(vertices[0], vertices[2], null)
    G.createEdge(vertices[1], vertices[3], null)
    G.createEdge(vertices[1], vertices[4], null)
    G.createEdge(vertices[2], vertices[5], null)
    G.createEdge(vertices[2], vertices[6], null)
    //#endregion

    const solver = new GraphSolver(G)
    const solution = solver.BFS(vertices[1], v => v === vertices[6])

    console.log(
        G.directed ? 'directed' : 'undirected',
        solution?.edges.map(e => e),
        solution?.vertices.map(v => v.data)
    )
}
