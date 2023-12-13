/**
 * HTML escape sequences for unsafe characters
 */
export const HTML_ESCAPES = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#x27;",
    "/": "&#x2F;",
} as const

/**
 * Removes indentation from multiline strings.
 * @since 2021-08-07
 */
export function dedent(
    templ: TemplateStringsArray | string,
    ...values: unknown[]
): string {
    let strings = Array.from(typeof templ === 'string' ? [templ] : templ)

    // 1. Remove trailing whitespace.
    strings[strings.length - 1] = strings[strings.length - 1].trimEnd()

    // 2. Find all line breaks to determine the highest common indentation level.
    const indentLengths = strings.reduce((arr, str) => {
        const matches = str.match(/\n([\t ]+|(?!\s).)/g)
        if (matches) {
            return arr.concat(
                matches.map((match) => match.match(/[\t ]/g)?.length ?? 0)
            )
        }
        return arr
    }, <number[]>[])

    // 3. Remove the common indentation from all strings.
    if (indentLengths.length) {
        const pattern = new RegExp(`\n[\t ]{${Math.min(...indentLengths)}}`, 'g')

        strings = strings.map((str) => str.replace(pattern, '\n'))
    }

    // 4. Remove leading whitespace.
    strings[0] = strings[0].trimStart()

    // 5. Perform interpolation.
    let string = strings[0]

    values.forEach((value, i) => {
        // 5.1 Read current indentation level
        const endentations = string.match(/(?:^|\n)( *)$/)
        const endentation = endentations ? endentations[1] : ''
        let indentedValue = value
        // 5.2 Add indentation to values with multiline strings
        if (typeof value === 'string' && value.includes('\n')) {
            indentedValue = String(value)
                .split('\n')
                .map((str, i) => i === 0 ? str : `${endentation}${str}`)
                .join('\n')
        }

        string += indentedValue + strings[i + 1]
    })

    return string
}

/**
 * A no-operation function for tagged template string literals
 * @author MindfulMinun
 * @since 2022-05-20
 */
export function templateNoop(
    templ: TemplateStringsArray | string,
    ...values: unknown[]
): string {
    if (typeof templ === 'string') return templ
    return templ.reduce((result, currentString, i) =>
        result + currentString + (typeof values[i] !== 'undefined' ? values[i] : ''),
        '' // Start with the empty string
    )
}

/**
 * Escapes HTML on the server-side.
 * 
 * @remarks Avoid calling this method twice on the same string.
 * 
 * @author MindfulMinun
 * @since 2022-05-20
 */
export function html(
    templ: TemplateStringsArray | string,
    ...values: unknown[]
): string {
    if (typeof templ === 'string') return xss(templ)
    return templ.reduce((result, currentString, i) =>
        result + currentString + (typeof values[i] !== 'undefined' ? xss('' + values[i]) : ''),
        '' // Start with the empty string
    )
}

/**
 * Escapes unsafe strings for use in HTML
 * 
 * @remarks Avoid calling this method twice on the same string.
 * 
 * @example
 * xss(`<img src=":(" onerror="alert('xss')">`)
 * // -> `&lt;img src=":(" onerror="alert('xss')"&gt;`
 * 
 * const unsafe = `Bobby Tables <img src=":(" onerror="alert('xss')">`
 * xss`<p>My name is <strong>${unsafe}</strong></p>`
 * // -> `<p>My name is <strong>Bobby Tables &lt;img src=":(" onerror="alert('xss')"&gt;</strong></p>`
 * @author MindfulMinun
 * @since 2020-06-23
 */
export function xss(unsafe: string): string
export function xss(templ: TemplateStringsArray, ...values: unknown[]): string
export function xss(templ: string | TemplateStringsArray, ...values: unknown[]): string {
    if (typeof templ === 'string') {
        return templ.replace(/[&<>"'\/]/g, key => HTML_ESCAPES[key as keyof typeof HTML_ESCAPES])
    }
    return templ.reduce((result, currentString, i) =>
        result + currentString + (typeof values[i] !== 'undefined' ? xss('' + values[i]) : ''),
        '' // Start with the empty string
    )
}
