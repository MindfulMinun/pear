import { fill } from "../../core/iterable.ts"
import * as Colors from "https://deno.land/std@0.157.0/fmt/colors.ts"
import { Memo } from "../structures.ts"


const memodDeterminant = new Memo({
      fn: (M: Matrix) => M.calculateDeterminant(),
    hash: M => M.toString()
}).fn

// const memodDeterminant = (M: Matrix) => M.calculateDeterminant()

export class Matrix<M extends number = number, N extends number = number> {
    /** The number of rows in this matrix. */
    m: M
    /** The number of columns in this matrix. */
    n: N
    /** The values stored in this matrix, in row-major order. */
    entries: number[]

    constructor(m: M, n: N, entries: number[]) {
        const expectedLength = m * n
        if (entries.length !== expectedLength) {
            throw new Error(`Expected ${expectedLength} entries, got ${entries.length}`)
        }
        this.m = m
        this.n = n
        this.entries = entries
    }

    set(row: number, col: number, value: number) {
        const offset = this.#calculateOffset(row, col)
        this.entries[offset] = value
    }

    get(row: number, col: number) {
        const offset = this.#calculateOffset(row, col)
        return this.entries[offset]
    }

    copy() {
        return new Matrix(this.m, this.n, this.entries.slice())
    }

    /**
     * Performs naive matrix multiplication.
     * @thorws If the dimensions of the matrices are incompatible.
     */
    rightMultiply<P extends number, Q extends number>(right: Matrix<P, Q>) {
        if (this.n as number !== right.m as number) {
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
        return result as N & P extends never ? never : Matrix<M, Q>
    }

    leftMultiply<P extends number, Q extends number>(left: Matrix<P, Q>): Q & M extends never ? never : Matrix<P, N> {
        return left.rightMultiply(this)
    }

    calculateDeterminant<S extends N & M>(): S extends never ? number : number {
        this.#assertSquare()

        const n = this.m
        const [a, b, c, d] = this.entries
        
        if (n === 1) return a
        if (n === 2) return a * d - b * c

        // Otherwise, use Laplace expansion.
        let total = 0
        for (let i = 0; i < n; i++) {
            // Ignore the first row and the ith column.
            const submatrix = this.laplaceExpansion(0, i)
            const determinant = memodDeterminant(submatrix)
            const sign = i % 2 === 0 ? 1 : -1
            total += sign * this.get(0, i) * determinant
        }
        return total
    }

    /**
     * Returns the submatrix obtained by removing the given row and column.
     */
    laplaceExpansion(row: number, col: number) {
        const matrix = Matrix.null(this.m - 1, this.n - 1)
        matrix.entries = this.entries.filter((_, i) => {
            const r = Math.floor(i / this.n)
            const c = i % this.n
            return r !== row && c !== col
        })
        return matrix
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
        const { m, n } = A
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
     * Returns a submatrix of this matrix.
     * @param row The row of the top-left corner of the submatrix.
     * @param col The column of the top-left corner of the submatrix.
     * @param m The number of rows in the submatrix.
     * @param n The number of columns in the submatrix.
     */
    submatrix<P extends number, Q extends number>(row: number, col: number, p: P, q: Q): Matrix<P, Q> {
        const submatrix = Matrix.null(p, q)
        for (let i = 0; i < p; i++) {
            for (let j = 0; j < q; j++) {
                submatrix.set(i, j, this.get(row + i, col + j))
            }
        }
        return submatrix
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

    #assertSquare<S extends N & M>(): asserts this is Matrix<S, S> {
        const { m, n } = this as Matrix<M, number>
        if (m !== n) {
            throw new Error(`Expected square matrix, got ${m}x${n} matrix.`)
        }
    }

    toString() {
        let out = ''
        out += 'Matrix<' + this.m + ', ' + this.n + '>['
        out += this.entries.map(e => e.toString()).join(', ')
        out += ']'
        return out
    }

    [Symbol.for("Deno.customInspect")]() {
        const strs = this.entries.map(e => e.toString())
        const maxLengths = Array.from(fill(0, this.n))

        // Find the maximum length of the strings in each column.
        for (let i = 0; i < this.m; i++) {
            for (let j = 0; j < this.n; j++) {
                const offset = this.#calculateOffset(i, j)
                maxLengths[j] = Math.max(maxLengths[j], strs[offset].length)
            }
        }

        // Pad each string to the maximum length.
        const padded = strs.map((s, i) => s.padStart(maxLengths[i % this.n], ' '))

        // Build the string.
        let out = ""
        for (let i = 0; i < this.m; i++) {
            if (i != 0) out += '\n'
            out += Colors.gray(i === 0 ? '┌ ' : i === this.m - 1 ? '└ ' : '│ ')

            for (let j = 0; j < this.n; j++) {
                const offset = this.#calculateOffset(i, j)
                const value = this.entries[offset]
                const txt = padded[offset]
                out += (value == 0 ? Colors.gray(txt) : txt) + ' '
            }
            out += Colors.gray(i === 0 ? '┐ ' : i === this.m - 1 ? '┘ ' : '│ ')
        }
        return out
    }

    /**
     * Creates a new matrix with the given numbers and entries.
     * All entries are initialized to 0.
     */
    static null<M extends number, N extends number>(m: M, n: N) {
        const zeroes = Array.from(fill(0, m * n))
        return new Matrix(m, n, zeroes)
    }

    /**
     * Creates a square identity matrix with the given number.
     * An identity matrix is a square matrix with 1s on the diagonal and 0s everywhere else.
     */
    static identity<N extends number>(n: N): Matrix<N, N> {
        const I = Matrix.null(n, n)
        for (let i = 0; i < n; i++) {
            I.set(i, i, 1)
        }
        return I
    }

    /**
     * Dr. Strang's favorite matrix.
     * Returns a tridiagonal matrix with 2s on the diagonal and -1s on the sub- and super-diagonals.
     */
    static strang<N extends number>(n: N): Matrix<N, N> {
        const S = Matrix.null(n, n)
        for (let i = 0; i < n; i++) {
            S.set(i, i, 2)
            if (i > 0) S.set(i, i - 1, -1)
            if (i < n - 1) S.set(i, i + 1, -1)
        }
        return S
    }
}
