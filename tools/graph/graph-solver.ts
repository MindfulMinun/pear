import { Graph, VertexType, EdgeType, Path, Vertex, PathType } from "./graph.ts";

/**
 * Describes a search function for DFS and BFS.
 */
export type SearchFn<Graph> = (v: VertexType<Graph>, e: EdgeType<Graph> | null, pathmap: Map<typeof v, PathType<Graph>>) => boolean | void

/**
 * A graph solver, which can perform various algorithms on a graph.
 */
export class GraphSolver<vData, eData> {
    G: Graph<vData, eData>

    constructor(G: Graph<vData, eData>) {
        this.G = G
    }

    /**
     * Performs a breadth-first search on a graph. Returns the path from the root to the found node.
     * @author MindfulMinun
     * @since 2022-09-28
     */
    BFS(root: Vertex<vData, eData>, search: SearchFn<typeof this.G>): Path<vData, eData> | null {
        const queue = [root]
        const backPaths = new Map<Vertex<vData, eData>, Path<vData, eData>>()
        const discovered = new WeakSet<typeof root>()
        discovered.add(root)

        let v: VertexType<typeof this.G> | null = root
        backPaths.set(root, this.G.createPath(root))

        while (queue.length !== 0) {
            v = queue.shift()!
            const found = search(v, backPaths.get(v)?.edges.at(-1) ?? null, backPaths)

            if (found) break
            for (const E of v.adjacentEdges) {
                if (E.directed && v !== E.u) continue
                const w = E.not(v)
        
                if (!discovered.has(w)) {
                    discovered.add(w)

                    const path = backPaths.get(v)!.copy()
                    path.addEdge(E)
                    backPaths.set(w, path)

                    queue.push(w)
                }
            }
            // If we iterate through all vertices without finding one that fulfills `search`,
            // then the found vertex is null and we should return null
            v = null
        }

        if (v === null) return null

        return backPaths.get(v) ?? null
    }

    /**
     * Performs a depth-first search on a graph. Returns the path from the root to the found node.
     * @author MindfulMinun
     * @since 2022-09-28
     */
    DFS(root: Vertex<vData, eData>, search: SearchFn<typeof this.G>): Path<vData, eData> | null {
        const stack = [root]
        const backPaths = new Map<VertexType<typeof this.G>, Path<vData, eData>>()

        // const discovered = new WeakSet<typeof root>()
        // discovered.add(root)

        let v: VertexType<typeof this.G> | null = root
        backPaths.set(root, this.G.createPath(root))

        while (stack.length !== 0) {
            v = stack.pop()!
            const found = search(v, backPaths.get(v)?.edges.at(-1) ?? null, backPaths)

            if (found) break
            for (const E of v.adjacentEdges) {
                if (E.directed && v !== E.u) continue
                const w = E.not(v)
                // discovered.add(w)
                stack.unshift(w)

                // Update the path!
                const path = backPaths.get(v)!.copy()
                path.addEdge(E)
                backPaths.set(w, path)
                
            }
            v = null
        }

        if (v === null) return null

        return backPaths.get(v) ?? null
    }
}
