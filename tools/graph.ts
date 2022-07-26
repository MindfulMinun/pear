import * as Colors from 'https://deno.land/std/fmt/colors.ts'

type UUID = ReturnType<typeof crypto.randomUUID>

/** Represents a graph, consisting of vertices and edges. */
export class Graph<vData, eData> {
    vertices: Map<UUID, Vertex<vData, eData>>
    edges: Map<UUID, Edge<vData, eData>>

    constructor() {
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

export class WeightedGraph<vData, eData> extends Graph<vData, eData> {
    
}

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

    representAsJSON() {
        return [this.id, this.data]
    }

    toString() {
        return Colors.cyan(`<${this.id.slice(0, 8)}>`)
    }

    [Symbol.for("Deno.customInspect")]() {
        return this.toString()
    }
}

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
        return Colors.magenta(`<${this.id.slice(0, 8)}>: ${this.u} --> ${this.v}`)
    }

    [Symbol.for("Deno.customInspect")]() {
        return this.toString()
    }
}
