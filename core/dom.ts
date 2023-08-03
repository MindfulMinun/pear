/// <reference lib="dom" />
import { templateNoop, HTML_ESCAPES, xss } from "./string.ts"

export { HTML_ESCAPES }

/**
 * Parses HTML, kinda smart.
 * 
 * As a function, it just parses the string as HTML. When used as a tagged template, expressions are XSS escaped using {@link xss}, except Nodes, which are added to the tree.
 *
 * ```js
 * html("<p>Hello world!</p>")
 * // DocumentFragment
 * // └─ p
 * //    └─ "Hello world!"
 * html`<strong>
 *     ${html`<em>Look ma, nested HTML!</em>`}
 *     ${`<img src="/bogus/path" onerror="alert('xss')">`}
 * </strong>`
 *
 * // DocumentFragment
 * // └─ strong
 * //    ├─ em
 * //    │  └─ "Look ma, nested HTML!"
 * //    └─ "<img src="/bogus/path" onerror="alert('xss')">"
 * ```
 * @author MindfulMinun
 * @since 2020-06-23
 */
export function html(content: string): DocumentFragment
export function html(strings: TemplateStringsArray, ...exprs: unknown[]): DocumentFragment
export function html(strings: TemplateStringsArray | string, ...exprs: unknown[]): DocumentFragment {
    const temp = document.createElement("template")
    let out = ""

    if (typeof strings === "string") {
        temp.innerHTML = strings
        return temp.content.cloneNode(true) as DocumentFragment
    }

    // Join the strings together
    for (let i = 0; i < strings.length; i++) {
        // If it's another Node, put a template in its place so we can replace it later
        if (exprs[i] instanceof Node) {
            out += strings[i] + `<template data-replaceindex="${i}"></template>`
            continue
        }
        // Otherwise, just join the expressions together, escaping dynamic content
        out += strings[i] + (typeof exprs[i] != 'undefined' ? xss("" + exprs[i]) : "")
    }
    temp.innerHTML = out
    const clone = temp.content.cloneNode(true) as DocumentFragment

    // Replace all templates with the real nodes
    clone.querySelectorAll("template[data-replaceindex]").forEach(node => {
        if (!(node instanceof HTMLElement)) return
        if (!node.parentNode) return
        const index = parseInt(node.getAttribute("data-replaceindex") || "", 10)
        node.parentNode.replaceChild(exprs[index] as Node, node);
    })

    return clone
}

/**
 * Creates a text node for use in the DOM.
 * @remarks
 * The text content is escaped using
 * the browser's built-in HTML escaping via `document.createTextNode`.
 * @author MindfulMinun
 * @since 2022-06-04
 */
export function textNode(templ: string): Text
export function textNode(templ: TemplateStringsArray, ...values: unknown[]): Text
export function textNode(templ: string | TemplateStringsArray, ...values: unknown[]): Text {
    const string = templateNoop(templ, ...values)
    return document.createTextNode(string)
}

/**
 * FLIP is a mnemonic device for effective JavaScript animations: First, Last, Invert, Play.
 * This helper class makes it easy to perform FLIP animations.
 *
 * https://aerotwist.com/blog/flip-your-animations/
 *
 * @author MindfulMinun
 * @since 2022-12-31
 */
class _FlipAnimator {
    el: Element
    #first: DOMRect | null = null

    constructor(el: Element) {
        this.el = el
        this.#first = null
    }
    
    /**
     * This method immediately performs a FLIP animation.
     * The caller must pass in a callback that describes the transition between the first and last states.
     */
    async flip(cb: (this: Element, el: Element, rect: DOMRect) => Promise<void> | void, options: KeyframeAnimationOptions = {}) {
        // Get the current state of the element
        this.recordFirstState()
        
        // Call the callback. The callback should change the element's DOMRect.
        await cb.call(this.el, this.el, this.#first!)
        
        // Animate the element from the first state to the last state
        return this.animateFromFirst(options)
    }

    /**
     * Captures the initial DOMRect of the element.
     * The caller may also pass in a DOMRect to use instead of querying the DOM.
     */
    recordFirstState(rect: DOMRect = this.el.getBoundingClientRect()) {
        this.#first = rect
        return this
    }

    /**
     * Using the captured first state, this method will animate the element
     * from the first state to the last state.
     * Then this method will clear the DOMRects.
     */
    animateFromFirst(options: KeyframeAnimationOptions = {}) {
        if (!this.#first) throw new Error('No first state recorded.')
        const last = this.el.getBoundingClientRect()

        const deltaX = this.#first.left   - last.left
        const deltaY = this.#first.top    - last.top
        const scaleX = this.#first.width  / last.width
        const scaleY = this.#first.height / last.height

        this.#first = null

        return this.el.animate([
            { transform: `translate(${deltaX}px, ${deltaY}px) scale(${scaleX}, ${scaleY})` },
            { transform: 'none' }
        ], {
            duration: 300,
            easing: 'ease-in-out',
            ...options
        })
    }
}

/**
 * Walks the DOM recursively, calling the callback for each node.
 * @deprecated
 * @param root - The root of the DOM walk
 * @param callback - If this callback returns true, stop tree traversal.
 * @param filters - A bitmask of what nodes to show. Defaults to `NodeFilter.SHOW_ELEMENT`.
 * @author MindfulMinun
 * @since 2020-06-29
 */
export function domWalker(
    root: Node,
    callback: (node: Node, root: Node, walker: TreeWalker) => boolean,
    filters: number = NodeFilter.SHOW_ELEMENT
) {
    const walker = document.createTreeWalker(root, filters);
    let guard = false;
    let current: Node | null = walker.currentNode
    while (true) {
        if (!current) break
        if (guard) break
        guard = callback.call(null, current, root, walker);
        current = walker.nextNode()
    }
}
