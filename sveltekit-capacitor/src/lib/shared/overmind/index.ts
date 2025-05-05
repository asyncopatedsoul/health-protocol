import { createOvermind } from 'overmind'
import { createMixin } from 'overmind-svelte'

const overmind = {
  state: {
    count: 0
  },
  actions: {
    increase({ state }) {
      state.count++;
    },
    decrease({ state }) {
      state.count--;
    }
  }
}

const store = createMixin(createOvermind(overmind))

export const state = store.state
export const actions = store.actions
export const reaction = store.reaction