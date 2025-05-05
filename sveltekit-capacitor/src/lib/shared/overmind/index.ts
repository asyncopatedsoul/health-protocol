import { createOvermind } from 'overmind'
import { createMixin } from 'overmind-svelte'

const overmind = {
  state: {
    count: 0
  },
  actions: {
    increase({ state }) {
      console.log('increase', state);
      state.count++;
    },
    decrease({ state }) {
      console.log('decrease', state);
      state.count--;
    }
  }
}

const store = createMixin(createOvermind(overmind))

export const ostate = store.state
export const actions = store.actions
// export const reaction = store.reaction