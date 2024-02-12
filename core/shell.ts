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
    cmd: Deno.Command
    #process?: Deno.ChildProcess
    #writer?: WritableStreamDefaultWriter

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

    response(src: 'stdout' | 'stderr' = 'stdout') {
        const source = this.process[src]
        return new Response(source)
    }

    async code() {
        return (await this).code
    }

    private get writer() {
        if (!this.#writer) {
            this.#writer = this.stdin.getWriter()
        }
        return this.#writer
    }

    write(input: string): Promise<this>
    write(input: Uint8Array): Promise<this>
    write(input: Blob): Promise<this>
    async write(input: string | Uint8Array | Blob) {
        let encoded: Uint8Array

        switch (true) {
            case input instanceof Uint8Array:
                encoded = input
                break
            case input instanceof Blob:
                encoded = new Uint8Array(await input.arrayBuffer())
                break
            default:
                encoded = new TextEncoder().encode(input)
        }
        
        await this.writer.write(encoded)
        return this
    }

    async close() {
        await this.writer.close()
        return this
    }

    // --

    pipe(into: Troopa): typeof into
    pipe(into: WritableStream): typeof this
    pipe(into: Troopa | WritableStream<Uint8Array>): Troopa {
        if (into instanceof Troopa) {
            this.process.stdout.pipeTo(into.process.stdin)
            return into
        }

        this.process.stdout.pipeTo(into)
        return this
    }

    then<Resolved = Deno.CommandStatus, Rejected = never>(
        onfulfilled?: ((a: Deno.CommandStatus) => Resolved | PromiseLike<Resolved>),
        onrejected?: ((a: unknown) => Rejected | PromiseLike<Rejected>)
    ): PromiseLike<Resolved | Rejected> {
        return this.process.status.then(onfulfilled, onrejected)
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
        // FIXME: Implement actual escaping
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
    const stdout = Deno.stdout.writable
    const x = await $`echo 1; sleep 1; echo 2; sleep 1; echo 3;`
        .pipe(stdout)
    
    console.log(`Exit Status: ${x.code}`)
}
