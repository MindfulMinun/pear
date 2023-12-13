import { Graph, Vertex, VertexType, Edge, EdgeType, Path, PathType } from "./graph.ts"
import { Queue } from "../structures/Queue.ts"
import { Stack } from "../structures/Stack.ts"
import { BinaryHeap } from "../structures/Heap.ts"
import { DisjointSet } from "../structures/DisjointSet.ts"

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
     * @since 2022-10-23
     */
    BFS(root: Vertex<vData, eData>, search: SearchFn<typeof this.G>): Path<vData, eData> | null {
        const queue = new Queue([root])
        const backPaths = new Map<Vertex<vData, eData>, Path<vData, eData>>()

        const discovered = new WeakSet<typeof root>()
        discovered.add(root)

        backPaths.set(root, this.G.createPath(root))

        for (const v of queue) {
            const found = search(v, backPaths.get(v)?.edges.at(-1) ?? null, backPaths)
            if (found) return backPaths.get(v) ?? null

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
        }

        // If we iterate through all vertices without finding one that fulfills `search`,
        // then the found vertex is null and we should return null
        return null
    }

    /**
     * Performs a depth-first search on a graph. Returns the path from the root to the found node.
     * @author MindfulMinun
     * @since 2022-09-28
     */
    DFS(root: Vertex<vData, eData>, search: SearchFn<typeof this.G>): Path<vData, eData> | null {
        const stack = new Stack([root])
        const backPaths = new Map<VertexType<typeof this.G>, Path<vData, eData>>()

        backPaths.set(root, this.G.createPath(root))

        for (const v of stack) {
            const found = search(v, backPaths.get(v)?.edges.at(-1) ?? null, backPaths)
            if (found) return backPaths.get(v) ?? null

            for (const E of v.adjacentEdges) {
                if (E.directed && v !== E.u) continue
                const w = E.not(v)
                stack.push(w)
                // Update the path!
                const path = backPaths.get(v)!.copy()
                path.addEdge(E)
                backPaths.set(w, path)
            }
        }
        return null
    }

    /**
     * Performs a bidirectional search on a graph. Returns the shortest path from `left` to `right`.
     * @author MindfulMinun
     * @since 2022-11-14
     */
    bidi(left: Vertex<vData, eData>, right: Vertex<vData, eData>): Path<vData, eData> | null {
        const qL = new Queue([left])
        const qR = new Queue([right])

        // Map a vertex to the path that led to it. Note that paths from the right
        // will be reversed so they can be concatenated with the paths from the left.
        const backL = new Map<Vertex<vData, eData>, Path<vData, eData>>()
        const backR = new Map<Vertex<vData, eData>, Path<vData, eData>>()
        
        backL.set(left, this.G.createPath(left))
        backR.set(right, this.G.createPath(right))

        const seenL = new Set<Vertex<vData, eData>>([left])
        const seenR = new Set<Vertex<vData, eData>>([right])

        while (qL.length && qR.length) {
            const l = qL.pop()!
            const r = qR.pop()!

            // The left side will traverse the graph normally,
            // following the direction of the arrows in the edges
            for (const E of l.adjacentEdges) {
                if (E.directed && l !== E.u) continue
                const w = E.not(l)
                if (!seenL.has(w)) {
                    seenL.add(w)
                    const path = backL.get(l)!.copy()
                    path.addEdge(E)
                    backL.set(w, path)
                    qL.push(w)
                }
            }

            // For the right side, we will traverse the graph backwards
            // So, against the direction of the arrows :)
            for (const E of r.adjacentEdges) {
                // Compare against v since edges always point to v,
                // Edge u -> v
                if (E.directed && r !== E.v) continue
                const w = E.not(r)
                if (!seenR.has(w)) {
                    seenR.add(w)
                    const path = backR.get(r)!.copy()
                    path.addEdge(E)
                    backR.set(w, path)
                    qR.push(w)
                }
            }

            // If we find a vertex that has been seen from both sides, then we have found a path!
            const midpoint = [...seenL].find(x => seenR.has(x))
            if (!midpoint) continue
            // console.log("Midpoint:", midpoint)
            
            // Concatenate the paths from the left and right to get the shortest path
            // Flip the path from the right so it's in the correct order
            const path = backL.get(midpoint)!.copy()
            path.edges.push(...backR.get(midpoint)!.edges.reverse())
            return path
        }
        return null
    }

    dijkstra() {
        // TODO: Implement Dijkstra's algorithm
    }

    /**
     * Sorts the edges by their weight ascending, then performs {@link kruskalPresorted | Kruskal's algorithm},
     * an algorithm for determining a minimum-spanning forest of a graph.
     *
     * Kruskal's greedy algorithm determines a minimum-spanning forest of a weighted, *undirected* graph.
     * 
     * If you only wish to sort the edges, use {@link sortEdgesByWeight} instead.
     * @author MindfulMinun
     * @since 2023-03-30
     */
    kruskalWithSort() {
        this.sortEdgesByWeight()
        return this.kruskalPresorted()
    }

    /**
     * Performs Kruskal's algorithm, ~~assuming that the edges have been presorted.~~
     * This algorithm returns a set of the edges that span the graph.
     *
     * Kruskal's greedy algorithm determines a minimum-spanning forest of a weighted, *undirected* graph.
     *
     * ~~This method assumes that the edges have been sorted by their weight ascending, allowing it to run in `O(m)` time.
     * If the edges have not been sorted, use {@link kruskalWithSort} instead.~~
     * @author MindfulMinun
     * @since 2023-03-30
     */
    kruskalPresorted(edges?: Edge<vData, eData>[]): Set<Edge<vData, eData>>
    kruskalPresorted(edges?: Iterable<Edge<vData, eData>>): Set<Edge<vData, eData>> {
        const forest = new Set<Edge<vData, eData>>()
        const djs = new DisjointSet<string>()

        for (const V of this.G.vertices.values()) djs.makeSet(V.id)

        const sortedEdges = edges ?? new BinaryHeap((a, b) => this.G.weights(a) - this.G.weights(b))
        console.log("a")

        for (const E of sortedEdges) {
            if (djs.find(E.u.id) !== djs.find(E.v.id)) {
                forest.add(E)
                djs.union(E.u.id, E.v.id)
            }
        }

        return forest
    }
        // const forest = new Set<Edge<vData, eData>>()
        // /** Keeps track of the reachable vertices. Used to ensure that newly added edges do not create a cycle. */
        // const reach = new WeakSet<Vertex<vData, eData>>()
        // const ordered: Iterable<Edge<vData, eData>> = edges ?? this.G.edges.values()

        // for (const E of ordered) {
        //     if (forest.has(E)) continue
        //     if (reach.has(E.u) && reach.has(E.v)) continue
        //     forest.add(E)
        //     reach.add(E.u).add(E.v)
        // }

        // return forest
    // }

    /**
     * Sorts edges by their weight ascending. Useful for speeding up algorithms such as Kruskal's.
     * This algorithm runs in `O(n log n)` time
     * @author MindfulMinun
     * @since 2023-03-30
     */
    sortEdgesByWeight() {
        const edges = Array.from(this.G.edges.values())
            .sort((a, b) => this.G.weights(a) - this.G.weights(b))
            .map(e => [e.id, e] as const)
        this.G.edges = new Map(edges)
    }
}
