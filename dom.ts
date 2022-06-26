/// <reference lib="dom" />
import { templateNoop, HTML_ESCAPES, xss } from "./helpers.ts"

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
export function html(strings: TemplateStringsArray, ...exprs: any[]): DocumentFragment
export function html(strings: TemplateStringsArray | string, ...exprs: any[]): DocumentFragment {
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
        out += strings[i] + (exprs[i] != null ? xss("" + exprs[i]) : "")
    }
    temp.innerHTML = out
    const clone = temp.content.cloneNode(true) as DocumentFragment

    // Replace all templates with the real nodes
    clone.querySelectorAll("template[data-replaceindex]").forEach(node => {
        if (!(node instanceof HTMLElement)) return
        if (!node.parentNode) return
        const index = parseInt(node.getAttribute("data-replaceindex") || "", 10)
        node.parentNode.replaceChild(exprs[index], node);
    })

    return clone
}

/**
 * Creates a text node for use in the DOM. The text content is NOT escaped.
 * @author MindfulMinun
 * @since 2022-06-04
 */
export function textNode(templ: string): Text
export function textNode(templ: TemplateStringsArray, ...values: any[]): Text
export function textNode(templ: string | TemplateStringsArray, ...values: any[]): Text {
    const string = templateNoop(templ, ...values)
    return document.createTextNode(string)
}

/**
 * Walks the DOM recursively, calling the callback for each node.
 * @deprecated
 * @param {Node} root The root of the DOM walk
 * @param {number} [filters] A bitmask of what nodes to show. Defaults to `NodeFilter.SHOW_ELEMENT`.
 * @param {(node: Node, root: Node, walker: TreeWalker) => boolean} callback If this callback returns true, stop tree traversal.
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
