import {
    choose, fill, range, removeFromArraybyIndexes, shuffle, swap, once
} from "../iterable.ts"

import { assertThrows, assertEquals, assert } from "https://deno.land/std@0.140.0/testing/asserts.ts"

Deno.test("choose: throw on empty array", () => {
    assertThrows(() => choose([]))
})

Deno.test("fill, yield the same value every time", () => {
    const count = 50_000
    const item = "hi"
    let i = 0
    for (const el of fill(item, count)) {
        assertEquals(el, item)
        i++
    }
    assertEquals(i, count)
})


Deno.test("range: one arg", () => {
    const iter = range(50_000)
    for (let i = 0; i < 50_000; i++) {
        const next = iter.next()
        assertEquals(next.value, i)
    }
    assert(iter.next().done)
})

Deno.test("range: two args", () => {
    const iter = range(40, 50)
    for (let i = 40; i < 50; i++) {
        const next = iter.next()
        assertEquals(next.value, i)
    }
    assert(iter.next().done)
})

Deno.test("range: three args", () => {
    const iter = range(60, 80, 4)
    for (let i = 60; i < 80; i += 4) {
        const next = iter.next()
        assertEquals(next.value, i)
    }
    assert(iter.next().done)
})
