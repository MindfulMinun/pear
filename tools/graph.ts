import * as Colors from 'https://deno.land/std/fmt/colors.ts'

type UUID = ReturnType<typeof crypto.randomUUID>

export type VertexType<G> = G extends Graph<infer T, infer V> ? Vertex<T, V> : never
export type EdgeType<G> = G extends Graph<infer T, infer V> ? Edge<T, V> : never
export type WeightFn<Graph> = (v: VertexType<Graph>, e: EdgeType<Graph>) => number

interface GraphOpts<G> {
    directed: boolean
    weights: WeightFn<G>
}

/**
 * Represents a graph, consisting of vertices and edges.
 * @author MindfulMinun
 * @since 2022-07-26
 */
export class Graph<vData, eData> {
    vertices: Map<UUID, Vertex<vData, eData>>
    edges: Map<UUID, Edge<vData, eData>>
    directed: boolean
    weights: WeightFn<typeof this>

    constructor(opts: Partial<GraphOpts<Graph<vData, eData>>> = {}) {
        const options: GraphOpts<Graph<vData, eData>> = {
            directed: false,
            weights: () => 1,
            ...opts
        }
        this.directed = options.directed
        this.weights = options.weights
        this.vertices = new Map()
        this.edges = new Map()
    }

    createVertex(data: vData, id: UUID = crypto.randomUUID()): Vertex<vData, eData> {
        const V = new Vertex(this, id, data)
        this.vertices.set(id, V)
        return V
    }

    deleteVertex(V: Vertex<vData, eData>) {
        // Delete all edges connected to V, then delete V
        for (const E of V.adjacentEdges) E.delete()
        this.vertices.delete(V.id)
    }

    deleteEdge(E: Edge<vData, eData>) {
        // Remove me from the caches of my connecting nodes, then delete me
        E.u.adjacentEdges.delete(E)
        E.v.adjacentEdges.delete(E)
        this.edges.delete(E.id)
    }

    createEdge(
        u: Vertex<vData, eData>,
        v: Vertex<vData, eData>,
        data: eData,
        id: UUID = crypto.randomUUID()
    ): Edge<vData, eData> {
        const E = new Edge(this, id, u, v, data)
        this.edges.set(id, E)
        v.adjacentEdges.add(E)
        u.adjacentEdges.add(E)
        return E
    }

    createPath(start: Vertex<vData, eData>) {
        return new Path<vData, eData>(this, start)
    }

    toJSON() {
        return {
            "@graph": Graph.signature,
            v: Array.from(this.vertices.values()).map(val => val.representAsJSON()),
            e: Array.from(this.edges.values()).map(val => val.representAsJSON())
        }
    }

    static fromJSON<vData, eData>(json: unknown) {
        const G = new Graph<vData, eData>()

        if (!json || typeof json !== 'object') throw Error("Failed to parse: Unexpected object!")
        const obj = json as Record<string, unknown>
        if (obj['@graph'] !== Graph.signature) throw Error("Failed to parse: The object isn't a graph!")


        if (!Array.isArray(obj.v)) throw Error("Failed to parse: The vertices property isn't an array!")
        if (!Array.isArray(obj.e)) throw Error("Failed to parse: The edges property isn't an array!")

        for (const V of obj.v) {
            if (!Array.isArray(V)) throw Error("Failed to parse: One of the vertices isn't a tuple!")
            const [uuid, data] = V as [UUID, vData]
            if (typeof uuid != 'string') throw Error("Failed to parse: Unexpected UUID!")
            G.createVertex(data, uuid)
        }

        for (const E of obj.e) {
            if (!Array.isArray(E)) throw Error("Failed to parse: One of the edges isn't a tuple!")
            const [uuid, u, v, data] = E as [UUID, UUID, UUID, eData]
            if (typeof uuid != 'string') throw Error("Failed to parse: UUID wasn't a string!")
            if (typeof u != 'string') throw Error("Failed to parse: U wasn't a string!")
            if (typeof v != 'string') throw Error("Failed to parse: V wasn't a string!")

            const U = G.vertices.get(u)
            const V = G.vertices.get(v)

            if (!U || !V) throw Error("Failed to parse: A vertex is never defined!")

            G.createEdge(U, V, data, uuid)
        }

        return G
    }

    static signature = "Made with love by MindfulMinun <https://benjic.xyz>" as const
}

/**
 * Represents a vertex in a graph.
 * @author MindfulMinun
 * @since 2022-07-26
 */

export class Vertex<VertexData, EdgeData> {
    graph: Graph<VertexData, EdgeData>
    data: VertexData
    id: UUID
    adjacentEdges: Set<Edge<VertexData, EdgeData>>

    constructor(parentGraph: Graph<VertexData, EdgeData>, id: UUID, data: VertexData) {
        this.graph = parentGraph
        this.data = data
        this.id = id
        this.adjacentEdges = new Set()
    }

    delete() { this.graph.deleteVertex(this) }

    representAsJSON() {
        return [this.id, this.data]
    }

    toString() {
        return Colors.cyan(`<${this.id.slice(0, 8)}>: ${this.data}`)
    }

    [Symbol.for("Deno.customInspect")]() {
        return this.toString()
    }
}

/**
 * Represents an edge in a graph which connects two vertices.
 * @author MindfulMinun
 * @since 2022-07-26
 */
export class Edge<vData, eData> {
    graph: Graph<vData, eData>
    data: eData
    id: UUID
    u: Vertex<vData, eData>
    v: Vertex<vData, eData>

    constructor(parentGraph: Graph<vData, eData>, id: UUID, u: Vertex<vData, eData>, v: Vertex<vData, eData>, data: eData) {
        this.graph = parentGraph
        this.data = data
        this.id = id

        if (u.graph !== v.graph || u.graph !== parentGraph) throw Error("Both vertices and the new edge must all belong to the same graph.")
        
        this.u = u
        this.v = v
    }

    /** Given one vertex, get the opposite vertex of this edge */
    not(v: typeof this.u | typeof this.v) {
        return this.v !== v ? this.v : this.u
    }

    delete() { this.graph.deleteEdge(this) }

    representAsJSON() {
        return [
            this.id,
            this.u.id,
            this.v.id,
            this.data
        ]
    }

    toString() {
        return Colors.magenta(`<${this.id.slice(0, 8)}>: ${this.u} ${!this.graph.directed ? '<' : ''}--> ${this.v}`)
    }

    [Symbol.for("Deno.customInspect")]() {
        return this.toString()
    }
}


export class Path<vData, eData> {
    graph: Graph<vData, eData>
    start: Vertex<vData, eData> | null
    edges: Edge<vData, eData>[]

    constructor(graph: Graph<vData, eData>, start?: Vertex<vData, eData>) {
        this.graph = graph
        this.edges = []
        this.start = start ?? null
    }

    addEdge(e: Edge<vData, eData>) {
        if (!this.start) this.start = e.u
        if (e.graph !== this.graph) throw Error("The edges in a path must all belong to the same graph.")
        this.edges.push(e)
    }

    get vertices() {
        const vertices: Vertex<vData, eData>[] = []
        if (!this.start) return vertices

        let current = this.start
        vertices.push(current)

        for (const e of this.edges) {
            current = e.u !== current ? e.u : e.v
            vertices.push(current)
        }

        return vertices
    }
}
