import { zustandStore, zustandStoreDomain } from "./zustandStore";
import { mobxStore, mobxRootStore } from "./mobxStore";
import { devtools } from 'zustand/middleware'

import { createTransactionStore, transactionStoreSchema } from "./domains/transaction/transactionStore";

// examples of state management libraries integrated wth svelte store contract
// https://www.sveltelab.dev/n9hjyu945l8g482


// export const storeFactory = {
//   zustandStore,
//   mobxStore,
// };


// https://www.restack.io/docs/supabase-knowledge-supabase-zustand-integration
// import create from 'zustand'
// import { supabase } from './supabaseClient'

// const useStore = create(set => ({
//   tasks: [],
//   fetchTasks: async () => {
//     const { data } = await supabase
//       .from('tasks')
//       .select('*')
//     set({ tasks: data })
//   },
//   subscribeToTasks: () => {
//     return supabase
//       .from('tasks')
//       .on('INSERT', payload => {
//         set(state => ({ tasks: [...state.tasks, payload.new] }))
//       })
//       .subscribe()
//   }
// }))


// https://zustand.docs.pmnd.rs/guides/typescript#slices-pattern
// export const createFishSlice = (set) => ({
//   fishes: 0,
//   addFish: () => set((state) => ({ fishes: state.fishes + 1 })),
// })

// export const createBearSlice = (set) => ({
//   bears: 0,
//   addBear: () => set((state) => ({ bears: state.bears + 1 })),
//   eatFish: () => set((state) => ({ fishes: state.fishes - 1 })),
// })

// export const useBoundStore = create((...a) => ({
//   ...createBearSlice(...a),
//   ...createFishSlice(...a),
// }))

interface ZustandCount {
  count: number;
  increment: VoidFunction;
}

export const zustandCount = zustandStore<ZustandCount>((set => ({
  count: 5,
  increment: () => set((state) => ({ count: state.count + 1 }))
})));

// export const transactionStore = zustandStoreDomain(createTransactionStore);
export const transactionStore = zustandStoreDomain(transactionStoreSchema);


// export const mobxCount = mobxStore({ count: 0 });
// <button class="btn btn-secondary" on: click = {() => mobxCount.count++}>
//   Mobx Count is: { $mobxCount.count }
// </button>

export const rootStore = mobxRootStore();