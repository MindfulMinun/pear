#!/usr/bin/env -S deno run --allow-run
export interface ShellSpawnerOpts extends Omit<Deno.CommandOptions, 'args'> {
    shell: string
    prefix?: string
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

export class Troopa implements PromiseLike<Deno.CommandOutput> {
    [Symbol.toStringTag] = 'Promise'

    cmd: Deno.Command
    #process?: Deno.ChildProcess

    constructor(
        public cmdStr: string,
        public opts: ShellSpawnerOpts
    ) {
        this.cmd = new Deno.Command(this.opts.shell, {
            args: this.opts.shellArgs(this.cmdStr),
            stdin: 'inherit',
            stdout: 'piped',
            stderr: 'piped',
            ...opts
        })
    }

    /**
     * Starts the process, if not yet started.
     * @author MindfulMinun
     * @since 2023-12-26
     */
    start() { return this.process }

    get process() {
        if (this.#process) return this.#process
        this.#process = this.cmd.spawn()
        return this.#process
    }

    get  stdin() { return this.process.stdin }
    get stdout() { return this.process.stdout }
    get stderr() { return this.process.stderr }

    pipe(into: Troopa): Troopa
    pipe(into: WritableStream): null
    pipe(into: Troopa | WritableStream<Uint8Array>): Troopa | null {
        if (into instanceof Troopa) {
            this.process.stdout.pipeTo(into.process.stdin)
            return into
        }

        this.process.stdout.pipeTo(into)
        return null
    }

    then<Resolved = Deno.CommandOutput, Rejected = never>(
        onfulfilled?: ((a: Deno.CommandOutput) => Resolved | PromiseLike<Resolved>),
        onrejected?: ((a: unknown) => Rejected | PromiseLike<Rejected>)
    ): PromiseLike<Resolved | Rejected> {
        return this.process.output().then(onfulfilled, onrejected)
    }
}

/**
 * Run a shell script.
 * Factory facade to easily interact and run shell scripts
 * @since 2023-11-25
 */
export default function koopa(opts: Partial<ShellSpawnerOpts> = {}) {
    const actualOpts: ShellSpawnerOpts = {
        shell: 'sh',
        shellArgs: cmd => ['-c', `${opts.prefix || 'set -euo pipefail'}; ${cmd}`],
        autospawn: true,
        ...opts
    }

    const factory: ShellSpawner<Troopa> = function (
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
                    ? escape(`${values[i]}`)
                    : ''
            }
        }
        return new Troopa(execStr, actualOpts)
    }

    return factory
}

if (import.meta.main) {
    const $ = koopa({
        prefix: 'set -euox pipefail',
    })
    $`echo 1; sleep 1; echo 2; sleep 1; echo 3;`
        .pipe(Deno.stdout.writable)
}
