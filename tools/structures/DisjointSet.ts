export class DisjointSet<T> {
    parent: number[]
    rank: number[]
    #map: Map<T, number>
    #mapCount: number

    constructor(elements: Iterable<T> = []) {
        this.parent = []
        this.rank = []
        this.#map = new Map()
        this.#mapCount = 0

        for (const element of elements) this.makeSet(element)
    }

    makeSet(element: T) {
        this.parent.push(this.#mapCount)
        this.rank.push(0)
        this.#map.set(element, this.#mapCount)
        this.#mapCount++
    }

    find(element: T): number {
        const index = this.#map.get(element)
        if (index === undefined) {
            throw new Error('Element not found')
        }
        return this.findIndex(index)
    }

    private findIndex(index: number): number {
        if (this.parent[index] !== index) {
            this.parent[index] = this.findIndex(this.parent[index])
        }
        return this.parent[index]
    }

    union(a: T, b: T) {
        const aIndex = this.find(a)
        const bIndex = this.find(b)

        if (aIndex === bIndex) return

        if (this.rank[aIndex] < this.rank[bIndex]) {
            this.parent[aIndex] = bIndex
        } else if (this.rank[aIndex] > this.rank[bIndex]) {
            this.parent[bIndex] = aIndex
        } else {
            this.parent[bIndex] = aIndex
            this.rank[aIndex]++
        }
    }
}
