import * as Colors from "https://deno.land/std@0.157.0/fmt/colors.ts"

type UUID = ReturnType<typeof crypto.randomUUID>

export type VertexType<G> = G extends Graph<infer T, infer V> ? Vertex<T, V> : never
export type EdgeType<G> = G extends Graph<infer T, infer V> ? Edge<T, V> : never
export type PathType<G> = G extends Graph<infer T, infer V> ? Path<T, V> : never
/** Given an edge, this function should return the weight of that edge. */
export type WeightFn<Graph> = (this: Graph, e: EdgeType<Graph>) => number

interface GraphOpts<G> {
    directed: boolean
    weights: WeightFn<G>
}

interface EdgeOpts {
    directed: boolean
    id: UUID
}

/**
 * Represents a graph, consisting of vertices and edges.
 * @author MindfulMinun
 * @since 2022-07-26
 */
export class Graph<vData, eData> {
    /** A map of the vertices in the graph. To add a new vertex, please use the {@link Graph.createVertex} method instead. */
    readonly vertices: Map<UUID, Vertex<vData, eData>>
    /** A map of the edges in the graph. To add a new edge, please use the {@link Graph.createEdge} method instead. */
    readonly edges: Map<UUID, Edge<vData, eData>>
    /**
     * Whether or not edges created in the graph are directed when the value is omitted.
     * Note that edges created with the `directed` option will use that value instead.
     */
    directed: boolean
    /** A function that returns the weight of an edge. */
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

    createEdge(u: Vertex<vData, eData>, v: Vertex<vData, eData>, data: eData, opts: Partial<EdgeOpts> = {}) {
        const options: EdgeOpts = {
            directed: this.directed,
            id: crypto.randomUUID(),
            ...opts
        }
        const E = new Edge(this, options.id, u, v, options.directed, data)
        this.edges.set(options.id, E)
        v.adjacentEdges.add(E)
        u.adjacentEdges.add(E)
        return E
    }

    deleteEdge(E: Edge<vData, eData>) {
        // Remove me from the caches of my connecting nodes, then delete me
        E.u.adjacentEdges.delete(E)
        E.v.adjacentEdges.delete(E)
        this.edges.delete(E.id)
    }


    createPath(start: Vertex<vData, eData>) {
        return new Path<vData, eData>(this, start)
    }

    toJSON(
        vertexReplacer: (this: Graph<vData, eData>, data: vData) => unknown = data => data,
        edgeReplacer: (this: Graph<vData, eData>, data: eData) => unknown = data => data
    ) {
        return {
            "@graph": Graph.signature,
            v: Array.from(this.vertices.values()).map(v => v.toJSON(vertexReplacer)),
            e: Array.from(this.edges.values()).map(e => e.toJSON(edgeReplacer))
        }
    }

    static fromJSON<vData, eData>(
        json: unknown,
        vertexReviver: (this: Graph<vData, eData>, json: unknown) => vData = data => data as vData,
        edgeReviver: (this: Graph<vData, eData>, json: unknown) => eData = data => data as eData
    ) {
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
            G.createVertex(vertexReviver.call(G, data), uuid)
        }

        for (const E of obj.e) {
            if (!Array.isArray(E)) throw Error("Failed to parse: One of the edges isn't a tuple!")
            const [uuid, u, v, isDirected, data] = E as [UUID, UUID, UUID, boolean, eData]
            if (typeof uuid != 'string') throw Error("Failed to parse: UUID wasn't a string!")
            if (typeof u != 'string') throw Error("Failed to parse: U wasn't a string!")
            if (typeof v != 'string') throw Error("Failed to parse: V wasn't a string!")

            const U = G.vertices.get(u)
            const V = G.vertices.get(v)

            if (!U) throw Error(`Vertex ${U} doesn't exist!`)
            if (!V) throw Error(`Vertex ${V} doesn't exist!`)

            G.createEdge(U, V, edgeReviver.call(G, data), {
                id: uuid,
                directed: isDirected
            })
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
    /* The graph this vertex belongs to */
    graph: Graph<VertexData, EdgeData>
    /* The value stored in this vertex, up to you! */
    data: VertexData
    /* The unique identifier of this vertex */
    id: UUID
    /* The edges connected to this vertex */
    adjacentEdges: Set<Edge<VertexData, EdgeData>>

    constructor(parentGraph: Graph<VertexData, EdgeData>, id: UUID, data: VertexData) {
        this.graph = parentGraph
        this.data = data
        this.id = id
        this.adjacentEdges = new Set()
    }

    delete() { this.graph.deleteVertex(this) }

    toJSON(replacer: (this: Graph<VertexData, EdgeData>, data: VertexData) => unknown = data => data) {
        return [this.id, replacer.call(this.graph, this.data)]
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
    /** The graph this edge belongs to */
    graph: Graph<vData, eData>
    /** The value stored in this edge, up to you! */
    data: eData
    /** A unique identifier for this edge. */
    id: UUID
    /** If directed, the vertex that this edge is coming from. */
    u: Vertex<vData, eData>
    /** If directed, the vertex that this edge is going to */
    v: Vertex<vData, eData>
    /** Whether or not this edge is directed */
    directed: boolean

    constructor(
        parentGraph: Graph<vData, eData>,
        id: UUID,
        u: Vertex<vData, eData>,
        v: Vertex<vData, eData>,
        directed: boolean,
        data: eData
    ) {
        this.graph = parentGraph
        this.data = data
        this.id = id
        this.directed = directed

        if (u.graph !== v.graph || u.graph !== parentGraph)
            throw Error("Both vertices and the new edge must all belong to the same graph.")
        
        this.u = u
        this.v = v
    }

    /** Given one vertex, get the opposite vertex of this edge */
    not(v: typeof this.u | typeof this.v) {
        return this.v !== v ? this.v : this.u
    }

    delete() { this.graph.deleteEdge(this) }

    toJSON(replacer: (this: Graph<vData, eData>, data: eData) => unknown = data => data) {
        // tuple!
        return [
            this.id,
            this.u.id,
            this.v.id,
            this.directed,
            replacer.call(this.graph, this.data)
        ]
    }

    toString() {
        return Colors.magenta(`<${this.id.slice(0, 8)}>: ${this.u} ${!this.directed ? '<' : ''}--> ${this.v}`)
    }

    [Symbol.for("Deno.customInspect")]() {
        return this.toString()
    }
}

export class Path<vData, eData> {
    /** The graph this path belongs to */
    graph: Graph<vData, eData>
    /** The vertex this path starts with */
    start: Vertex<vData, eData> | null
    /** The edges belonging to this path */
    edges: Edge<vData, eData>[]
    /** An internal cache of the vertices. */
    #vertices: Vertex<vData, eData>[] | null

    constructor(graph: Graph<vData, eData>, start?: Vertex<vData, eData>) {
        this.graph = graph
        this.edges = []
        this.start = start ?? null
        this.#vertices = null
    }

    addEdge(e: Edge<vData, eData>) {
        if (!this.start) this.start = e.u
        if (e.graph !== this.graph) throw Error("The edges in a path must all belong to the same graph.")
        this.edges.push(e)
        this.#vertices = null
    }

    /** The vertices belonging to this path */
    get vertices() {
        if (this.#vertices) return this.#vertices

        const vertices: Vertex<vData, eData>[] = []
        if (!this.start) return vertices

        let current = this.start
        vertices.push(current)

        for (const e of this.edges) {
            current = e.u !== current ? e.u : e.v
            vertices.push(current)
        }

        this.#vertices = vertices
        return this.#vertices
    }

    copy() {
        const path = new Path<vData, eData>(this.graph, this.start ?? undefined)
        path.edges = this.edges.slice()
        path.#vertices = this.#vertices?.slice() ?? null
        return path
    }
}
