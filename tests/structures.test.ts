import { range } from "../core/iterable.ts";
import { BinaryHeap, Queue, Stack } from "../tools/structures.ts"

import { assertEquals } from "https://deno.land/std@0.140.0/testing/asserts.ts"

Deno.test("Data structures - Stack", () => {
    const stack = new Stack([1, 2, 3])
    stack.push(4)
    stack.push(5)

    for (const i of range(5, 0)) {
        assertEquals(stack.pop(), i)
    }
    assertEquals(stack.length, 0)
})

Deno.test("Data structures - Queue", () => {
    const queue = new Queue([0, 1, 2, 3])
    queue.push(4)
    queue.push(5)

    for (const i of range(6)) {
        assertEquals(queue.pop(), i)
    }
    assertEquals(queue.length, 0)
})

Deno.test("Data structures - Binary Heap: Bubble up", () => {
    const heap = new BinaryHeap<number>((a, b) => a - b)

    heap.push(5)
    heap.push(3)

    assertEquals(heap.peek(), 3)
})

Deno.test("Data structures - Binary Heap", () => {
    const heap = new BinaryHeap(
        (a, b) => a - b,
        [5, 3, 8, 1, 2, 6, 9, 4, 7]
    )
    let i = 1
    for (const el of heap) {
        assertEquals(el, i++)
    }
    assertEquals(i, 10)
})
