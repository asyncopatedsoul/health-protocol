import { createStore, type StateCreator } from 'zustand/vanilla';

export const zustandStore = <T>(zustandSchema: StateCreator<T>) => {
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