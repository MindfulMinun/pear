export type Transition<State extends string | number | symbol, InputAlphabet, Context> = (
    this: StateMachine<State, InputAlphabet, Context>,
    input: InputAlphabet,
    machine: StateMachine<State, InputAlphabet, Context>
) => void

export class StateMachine<State extends string | number | symbol = 0, InputAlphabet = null, Context = null> {
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

    const enum MarioState {
        Mario,
        SuperMario,
        FireMario,
        CapeMario,
        DeadMario
    }

    const enum MarioStateTransition {
        Mushroom,
        FireFlower,
        Feather,
        Damage
    }

    // const M = new StateMachine<MarioState, MarioStateTransition>(
    //     MarioState.Mario,
    //     {
    //         [MarioState.Mario]: (input, m) => {
    //             switch (input) {
    //                 case MarioStateTransition.FireFlower: m.goto(MarioState.FireMario); break
    //                 case MarioStateTransition.Feather: m.goto(MarioState.CapeMario); break
    //                 case MarioStateTransition.Damage: m.goto(MarioState.Mario); break
    //             }
    //         },
    //         [MarioState.SuperMario]: (input, m) => {
    //             switch (input) {
    //                 case MarioStateTransition.FireFlower: m.goto(MarioState.FireMario); break
    //                 case MarioStateTransition.Feather: m.goto(MarioState.CapeMario); break
    //                 case MarioStateTransition.Damage: m.goto(MarioState.Mario); break
    //             }
    //         },
    //         [MarioState.FireMario]: (input, m) => {
    //             switch (input) {
    //                 case MarioStateTransition.FireFlower: m.goto(MarioState.FireMario); break
    //                 case MarioStateTransition.Feather: m.goto(MarioState.CapeMario); break
    //                 case MarioStateTransition.Damage: m.goto(MarioState.Mario); break
    //             }
    //         },
    //         [MarioState.CapeMario]: (input, m) => {
    //             switch (input) {
    //                 case MarioStateTransition.FireFlower: m.goto(MarioState.FireMario); break
    //                 case MarioStateTransition.Feather: m.goto(MarioState.CapeMario); break
    //                 case MarioStateTransition.Damage: m.goto(MarioState.Mario); break
    //             }
    //         },
    //         [MarioState.DeadMario]: () => { }
    //     },
    //     [MarioState.Mario, MarioState.SuperMario, MarioState.FireMario, MarioState.CapeMario]
    // )


    const M = new StateMachine<MarioState, MarioStateTransition>(
        MarioState.Mario,
        {},
        [MarioState.Mario, MarioState.SuperMario, MarioState.FireMario, MarioState.CapeMario]
    )

}
