import { fill } from "../../core/iterable.ts"
import * as Colors from "https://deno.land/std@0.157.0/fmt/colors.ts"

class Matrix {
    /** The number of rows in this matrix. */
    m: number
    /** The number of columns in this matrix. */
    n: number
    /** The values stored in this matrix, in row-major order. */
    entries: number[]

    constructor(m: number, n: number, entries: number[]) {
        const expectedLength = m * n
        if (entries.length !== expectedLength) {
            throw new Error(`Expected ${expectedLength} entries, got ${entries.length}`)
        }
        this.m = m
        this.n = n
        this.entries = entries
    }

    /** Performs naive matrix multiplication. */
    rightMultiply(right: Matrix) {
        if (this.n !== right.m) {
            throw new Error(`Cannot multiply ${this.m}x${this.n} matrix by ${right.m}x${right.n} matrix.`)
        }
        const result = Matrix.null(this.m, right.n)
        for (let i = 0; i < this.m; i++) {
            for (let j = 0; j < right.n; j++) {
                let sum = 0
                for (let k = 0; k < this.n; k++) {
                    sum += this.get(i, k) * right.get(k, j)
                }
                result.set(i, j, sum)
            }
        }
        return result
    }

    leftMultiply(left: Matrix) {
        return left.rightMultiply(this)
    }

    set(row: number, col: number, value: number) {
        const offset = this.#calculateOffset(row, col)
        this.entries[offset] = value
    }

    get(row: number, col: number) {
        const offset = this.#calculateOffset(row, col)
        return this.entries[offset]
    }

    toString() {
        const strs = this.entries.map(e => e.toString())
        const maxLen = Math.max(...strs.map(s => s.length))
        const padded = strs.map(s => s.padStart(maxLen, ' '))

        let out = ""
        for (let i = 0; i < this.m; i++) {
            if (i != 0) out += '\n'
            out += Colors.gray(i === 0 ? '┌ ' : i === this.m - 1 ? '└ ' : '│ ')
            // out += Colors.gray('│ ')

            for (let j = 0; j < this.n; j++) {
                const offset = this.#calculateOffset(i, j)
                const value = this.entries[offset]
                const txt = padded[offset]
                out += (value == 0 ? Colors.gray(txt) : txt) + ' '
            }
            out += Colors.gray(i === 0 ? '┐ ' : i === this.m - 1 ? '┘ ' : '│ ')
            // out += Colors.gray('│')
        }
        return out
    }

    [Symbol.for("Deno.customInspect")]() {
        return this.toString()
    }

    #calculateOffset(row: number, col: number) {
        if (!(0 <= row || row < this.m)) {
            throw new Error(`Row ${row} is out of bounds for ${this.m}x${this.n} matrix.`)
        }
        if (!(0 <= col || col < this.n)) {
            throw new Error(`Column ${col} is out of bounds for ${this.m}x${this.n} matrix.`)
        }
        return row * this.n + col
    }

    copy() {
        return new Matrix(this.m, this.n, this.entries.slice())
    }

    /**
     * Performs Gaussian elimination on this matrix, transforming it into an upper triangular matrix.
     * Note that this method does NOT mutate the original matrix, instead returning a new one.
     * If the matrix is singular, null is returned.
     * @author MindfulMinun
     * @since 2023-01-06
     */
    toUpperTriangular() {
        const A = this.copy()
        const m = A.m
        const n = A.n
        for (let i = 0; i < m; i++) {
            // Find the pivot row.
            let pivotRow = i
            for (let j = i + 1; j < m; j++) {
                if (Math.abs(A.get(j, i)) > Math.abs(A.get(pivotRow, i))) {
                    pivotRow = j
                }
            }

            // Swap the pivot row with the current row.
            for (let j = 0; j < n; j++) {
                const temp = A.get(i, j)
                A.set(i, j, A.get(pivotRow, j))
                A.set(pivotRow, j, temp)
            }

            // Eliminate the current column.
            for (let j = i + 1; j < m; j++) {
                const factor = A.get(j, i) / A.get(i, i)
                if (!Number.isFinite(factor)) return null
                for (let k = i; k < n; k++) {
                    A.set(j, k, A.get(j, k) - factor * A.get(i, k))
                }
            }
        }
        return A
    }

    /**
     * Creates a new matrix with the given dimensions and entries.
     * All entries are initialized to 0.
     */
    static null(m: number, n: number) {
        const zeroes = Array.from(fill(0, m * n))
        return new Matrix(m, n, zeroes)
    }

    /**
     * Creates a square identity matrix with the given dimension.
     * An identity matrix is a square matrix with 1s on the diagonal and 0s everywhere else.
     */
    static identity(n: number) {
        const I = Matrix.null(n, n)
        for (let i = 0; i < n; i++) {
            I.set(i, i, 1)
        }
        return I
    }
}


if (import.meta.main) {
    // const A = new Matrix(3, 3, [
    //     2, -1, 0,
    //     -1, 2, -1,
    //     0, -3, 4
    // ])
    const A = new Matrix(4, 4, [
        16,    2,    3,   13,
        5 ,   11,   10,    8,
        9 ,    7,    6,   12,
        4 ,   14,   15,    1,
    ])
    const x = new Matrix(3, 1, [0, 0, 1])
    // const A = Matrix.identity(10)

    console.log(A)
    console.log(A.toUpperTriangular())
    // console.log(x)
    // const b = A.rightMultiply(x)
    // console.log(b)
}
