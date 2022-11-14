import { g1, g2, g3 } from '../tools/graph/_graph-samples.ts'
import { GraphSolver } from '../tools/graph/graph-solver.ts'
import { assertEquals } from "https://deno.land/std/testing/asserts.ts"
import { Path } from "../tools/graph/graph.ts"

// TODO: Add more tests!

Deno.test('GraphSolver::BFS w/ g1', () => {
    const G = g1()
    const solver = new GraphSolver(G)
    const path = solver.BFS(G.vertices.get('A')!, v => v.id === 'F')

    const expectedV = ['A', 'C', 'F']
    const expectedE = ['AC', 'CF']

    assertPathsEqual(path, expectedV, expectedE)
})

Deno.test('GraphSolver::BFS w/ g2', () => {
    const G = g2()
    const solver = new GraphSolver(G)
    const path = solver.BFS(G.vertices.get('A')!, v => v.id === 'G')

    const expectedV = ['A', 'C', 'G']
    const expectedE = ['AC', 'CG']

    assertPathsEqual(path, expectedV, expectedE)
})

Deno.test('GraphSolver::DFS w/ g1', () => {
    const G = g1()
    const solver = new GraphSolver(G)
    const path = solver.DFS(G.vertices.get('A')!, v => v.id === 'E')

    assertPathsEqual(
        path,
        ['A', 'C', 'F', 'E'],
        ['AC', 'CF', 'EF']
    )
})

Deno.test('GraphSolver::bidi', () => {
    const G = g3()
    const solver = new GraphSolver(G)
    const path = solver.bidi(G.vertices.get('A')!, G.vertices.get('E')!)

    assertPathsEqual(
        path,
        'ABCDE'.split(''),
        'AB-BC-CD-DE'.split('-')
    )
})

function assertPathsEqual<vData, eData>(
    path: Path<vData, eData> | null | undefined,
    expectedV: string[],
    expectedE: string[]
) {
    if (!path) throw Error("Path is null or undefined")

    try {
        assertEquals(path?.edges.length, expectedE.length)
        assertEquals(path?.vertices.length, expectedV.length)
        
        expectedV.forEach((v, i) => assertEquals(path?.vertices[i].id, v))
        expectedE.forEach((e, i) => assertEquals(path?.edges[i].id, e))
    } catch (e) {
        throw Error(`Paths are different! Expected: [${expectedV.join(' -> ')}]; Actual: [${path.vertices.map(v => v.id).join(' -> ')}]`)
    }
}
