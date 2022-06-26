/**
 * Run a shell command that can be aborted using an `AbortSignal`
 * @since 2021-08-13
 */
export async function abortableExec(opts: { cmd: string[], signal?: AbortSignal }): Promise<void> {
    const { cmd, signal } = opts
    if (signal && signal.aborted) return
    const p = Deno.run({
        cmd,
        stdout: "null"
    })
    signal && signal.addEventListener('abort', () => p.kill("SIGINT"))
    await p.status()
    return
}
