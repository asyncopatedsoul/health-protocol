// import { zustandStore } from "./zustandStore";
import { mobxStore, mobxRootStore } from "./mobxStore";

// export const storeFactory = {
//   zustandStore,
//   mobxStore,
// };

// export const mobxCount = mobxStore({ count: 0 });
// <button class="btn btn-secondary" on: click = {() => mobxCount.count++}>
//   Mobx Count is: { $mobxCount.count }
// </button>

// https://www.restack.io/docs/supabase-knowledge-supabase-zustand-integration
// https://www.sveltelab.dev/n9hjyu945l8g482

// export const createFishSlice = (set) => ({
//   fishes: 0,
//   addFish: () => set((state) => ({ fishes: state.fishes + 1 })),
// })

// export const createBearSlice = (set) => ({
//   bears: 0,
//   addBear: () => set((state) => ({ bears: state.bears + 1 })),
//   eatFish: () => set((state) => ({ fishes: state.fishes - 1 })),
// })

// interface ZustandCount {
//   count: number;
//   increment: VoidFunction;
// }

// export const zustandCount = zustandStore<ZustandCount>((set) => ({
//   count: 0,
//   increment: () => set((state) => ({ count: state.count + 1 }))
// }));

// export const useBoundStore = create((...a) => ({
//   ...createBearSlice(...a),
//   ...createFishSlice(...a),
// }))

export const rootStore = mobxRootStore();