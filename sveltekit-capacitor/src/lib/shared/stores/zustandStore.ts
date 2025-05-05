import { createStore, type StateCreator } from 'zustand/vanilla';
import { devtools } from 'zustand/middleware'
import { persist, createJSONStorage } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
// https://zustand.docs.pmnd.rs/middlewares/devtools#debugging-a-store

export const zustandStore = <T>(zustandSchema) => {
	// const store = createStore(zustandSchema);
	const store = createStore(devtools(zustandSchema));

	const subscribe = (listener: (state: any) => void) => {
		listener(store.getState());
		return store.subscribe(listener);
	};
	return {
		...store,
		subscribe,
	}
};

export const zustandStoreDomain = (zustandSchema) => {
	// const store = createStore(zustandSchema);
	const store = createStore(devtools(zustandSchema));

	const subscribe = (listener: (state: any) => void) => {
		listener(store.getState());
		return store.subscribe(listener);
	};
	return {
		...store,
		subscribe,
	}
};

// https://zustand.docs.pmnd.rs/integrations/persisting-store-data
// type BearStore = {
//   bears: number
//   addABear: () => void
// }

// export const useBearStore = create<BearStore>()(
//   persist(
//     (set, get) => ({
//       bears: 0,
//       addABear: () => set({ bears: get().bears + 1 }),
//     }),
//     {
//       name: 'food-storage', // name of the item in the storage (must be unique)
//       storage: createJSONStorage(() => sessionStorage), // (optional) by default, 'localStorage' is used
//     },
//   ),
// )

// https://zustand.docs.pmnd.rs/middlewares/immer
// https://awesomedevin.github.io/zustand-vue/en/docs/basic/middleware
// const useBeeStore = create(
//   immer((set) => ({
//     bees: 0,
//     addBees: (by) =>
//       set((state) => {
//         state.bees += by
//       }),
//   }))
// )

// export const zustandStore = <T>(zustandSchema: StateCreator<T>) => {
// 	const store = createStore(zustandSchema);

// 	const subscribe = (listener: (state: T) => void) => {
// 		listener(store.getState());
// 		return store.subscribe(listener);
// 	};
// 	return {
// 		...store,
// 		subscribe,
// 	}
// };


export const zustandStoreSchema = <T>(zustandSchema: StateCreator<T>) => {
	const store = createStore(zustandSchema);

	return store;
};

export const zustandStoreSlices = <T>(zustandSchema: StateCreator<T>) => {
	const store = createStore(zustandSchema);

	const subscribe = (listener: (state: T) => void) => {
		listener(store.getState());
		return store.subscribe(listener);
	};
	return {
		...store,
		subscribe,
	}
};