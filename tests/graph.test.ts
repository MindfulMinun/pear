import { Graph } from '../tools/graph.ts'

// TODO: Add real tests!

const G = new Graph<string, string>()

const a = G.createVertex('A')
const b = G.createVertex('B')
const c = G.createVertex('C')

G.createEdge(a, b, 'a-b')
G.createEdge(b, c, 'b-c')
G.createEdge(c, a, 'c-a')

// console.log(G)
console.log(JSON.stringify(G))
console.log(Graph.fromJSON(
    JSON.parse(JSON.stringify(G, null, 4))
))
