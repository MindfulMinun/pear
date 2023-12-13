export interface ShellSpawnerOpts extends Omit<Deno.CommandOptions, 'args'> {
    shell: string
    shellArgs: (commandStr: string) => string[]
    autospawn: boolean,
}

/**
 * Shell spawner.
 * ```
 * const $: ShellSpawner = koopa()
 * await $`rm -rf /home/*`
 * ```
 */
export type ShellSpawner<R = Deno.Command> = (a: string | TemplateStringsArray, ...values: unknown[]) => R

/**
 * Run a shell script.
 * Factory facade to easily interact and run shell scripts
 * @since 2023-11-25
 */
export default function koopa(opts: Partial<ShellSpawnerOpts> = {}) {
    const actualOpts: ShellSpawnerOpts = {
        shell: 'sh',
        shellArgs: cmd => ['-c', cmd],
        autospawn: true,
        ...opts,
    }

    const factory: ShellSpawner = function (
        templ: TemplateStringsArray | string,
        ...values: unknown[]
    ) {
        // TODO: Implement actual escaping
        const escape = (a: string) => a
        let execStr = ''
        if (typeof templ === 'string') {
            execStr += templ
        } else {
            for (let i = 0; i < templ.length; i++) {
                execStr += templ[i]
                execStr += typeof values[i] !== 'undefined'
                    ? escape('' + values[i])
                    : ''
            }
        }

        return new Deno.Command(actualOpts.shell, {
            args: actualOpts.shellArgs(execStr),
            ...opts
        })
    }

    return factory
}
