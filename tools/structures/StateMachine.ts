export type Transition<State extends string | number | symbol, InputAlphabet, Context> = (
    this: StateMachine<State, InputAlphabet, Context>,
    input: InputAlphabet,
    machine: StateMachine<State, InputAlphabet, Context>
) => void

export class StateMachine<State extends string | number | symbol = 0, InputAlphabet = string, Context = null> {
    #initialState: State
    #transitionTable: Partial<Record<State, Transition<State, InputAlphabet, Context>>>
    #acceptStates: Set<State>
    #contextFactory: () => Context
    currentState!: State
    context!: Context

    constructor(
        initialState: State,
        transitionTable: Partial<Record<State, Transition<State, InputAlphabet, Context>>>,
        acceptStates: Iterable<State> = [],
        contextFactory: () => Context = () => (null as Context)
    ) {
        this.#initialState = initialState
        this.#transitionTable = transitionTable
        this.#acceptStates = new Set(acceptStates)
        this.#contextFactory = contextFactory
        this.reset()
    }

    runWithInput(elements: Iterable<InputAlphabet>) {
        for (const element of elements) {
            this.transitionWith(element)
        }
        return this
    }

    transitionWith(input: InputAlphabet) {
        const fn = this.#transitionTable[this.currentState]
        if (!fn) throw new Error(`No transition function for state ${String(this.currentState)}`)
        fn.call(this, input, this)
        return this
    }

    goto(state: State) {
        this.currentState = state
        return this
    }

    accepts(state = this.currentState) { return this.#acceptStates.has(state) }

    reset() {
        this.currentState = this.#initialState
        this.context = this.#contextFactory()
    }
}


if (import.meta.main) {
    // S1: initial state, accept.
    //      0 -> S2
    //      1 -> S1
    // S2: reject.
    //      0 -> S1
    //      1 -> S2

    const enum MyState {
        P = 'P',
        R = 'R',
        N = 'N',
        D = 'D',
        L = 'L'
    }

    const enum Direction {
        UP = 'UP',
        DOWN = 'DOWN',
    }

    const M = new StateMachine<MyState, Direction>(MyState.P, {
        [MyState.P]: (input, m) => input === Direction.UP ? m.goto(MyState.P) : m.goto(MyState.R),
        [MyState.R]: (input, m) => input === Direction.UP ? m.goto(MyState.P) : m.goto(MyState.N),
        [MyState.N]: (input, m) => input === Direction.UP ? m.goto(MyState.R) : m.goto(MyState.D),
        [MyState.D]: (input, m) => input === Direction.UP ? m.goto(MyState.N) : m.goto(MyState.L),
        [MyState.L]: (input, m) => input === Direction.UP ? m.goto(MyState.D) : m.goto(MyState.L),
    }, [MyState.P])
    // const M = new StateMachine<MyState, '1' | '0'>(MyState.even, {
    //     [MyState.even]: (input, m) => input === '1' ? m.goto(MyState.even) : m.goto(MyState.odd),
    //     [MyState.odd ]: (input, m) => input === '0' ? m.goto(MyState.even) : m.goto(MyState.odd),
    // }, [MyState.even])

    M.runWithInput([
        Direction.DOWN,
        Direction.DOWN,
        Direction.DOWN,
    ])
    
    console.log(M)
    console.log(M.accepts())
}
