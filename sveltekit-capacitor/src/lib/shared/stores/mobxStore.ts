import { makeAutoObservable, autorun, runInAction, reaction } from 'mobx';
import { createMachine, assign, createActor } from 'xstate';

// https://stately.ai/docs/xstate#create-a-more-complex-machine
const countMachine = createMachine({
  context: {
    count: 0,
  },
  on: {
    INC: {
      actions: assign({
        count: ({ context }) => context.count + 1,
      }),
    },
    DEC: {
      actions: assign({
        count: ({ context }) => context.count - 1,
      }),
    },
    SET: {
      actions: assign({
        count: ({ event }) => event.value,
      }),
    },
  },
});

const countActor = createActor(countMachine).start();

countActor.subscribe((state) => {
  console.log(state.context.count);
});

countActor.send({ type: 'INC' });
// logs 1
countActor.send({ type: 'DEC' });
// logs 0
countActor.send({ type: 'SET', value: 10 });
// logs 10

export const mobxStore = <T extends object & { subscribe?: never }>(initialState: T) => {
	const store = makeAutoObservable(initialState);
	const sub = (listener: (value: T) => void) => {
		listener(store);
		return autorun(() => listener({...store}));
	};
	return Object.assign(store, { subscribe: sub });
};

export const reactiveStore = (store: any) => {
	// const store = makeAutoObservable(initialState);
	const sub = (listener: (value: any) => void) => {
		listener(store);
		return autorun(() => listener({...store}));
	};
	return Object.assign(store, { subscribe: sub });
};

export const mobxRootStore = () => {
	// const store = makeAutoObservable(initialState);
	const store = new RootStore();
	return store;
};

// https://mobx.js.org/defining-data-stores.html#combining-multiple-stores
// https://github.com/mobxjs/mobx-utils
// https://mobx.js.org/analyzing-reactivity.html

class RootStore {
	accountStore
	todoStore
	reactiveStores

	constructor() {
			this.accountStore = new AccountStore(this)
			this.todoStore = new TodoStore(this)

			this.reactiveStores = {
				// account: reactiveStore(this.accountStore),
				todo: reactiveStore(this.todoStore),
				mobxCount: mobxStore({ count: 0 }),
			}
	}
}

class AccountStore {
	constructor(rootStore) {
			this.rootStore = rootStore
	}

	getTodos(user) {
			// Access todoStore through the root store.
			return this.rootStore.todoStore.todos.filter(todo => todo.author === user)
	}
}

// class TodoStore {
// 	todos = []
// 	rootStore

// 	constructor(rootStore) {
// 			makeAutoObservable(this)
// 			this.rootStore = rootStore
// 	}
// }

export class TodoStore {
	rootStore
	accountStore
	transportLayer
	todos = []
	isLoading = true

	constructor(rootStore, transportLayer = null, accountStore = null) {
			makeAutoObservable(this)
			this.rootStore = rootStore
			this.accountStore = accountStore // Store that can resolve authors.
			this.transportLayer = transportLayer // Thing that can make server requests.
			// this.transportLayer.onReceiveTodoUpdate(updatedTodo =>
			// 		this.updateTodoFromServer(updatedTodo)
			// )
			// this.loadTodos()
			let todo = new Todo(this,"1234")
			this.todos.push(todo)
	}

	// Fetches all Todos from the server.
	loadTodos() {
			this.isLoading = true
			this.transportLayer.fetchTodos().then(fetchedTodos => {
					runInAction(() => {
							fetchedTodos.forEach(json => this.updateTodoFromServer(json))
							this.isLoading = false
					})
			})
	}

	// Update a Todo with information from the server. Guarantees a Todo only
	// exists once. Might either construct a new Todo, update an existing one,
	// or remove a Todo if it has been deleted on the server.
	updateTodoFromServer(json) {
			let todo = this.todos.find(todo => todo.id === json.id)
			if (!todo) {
					todo = new Todo(this, json.id)
					this.todos.push(todo)
			}
			if (json.isDeleted) {
					this.removeTodo(todo)
			} else {
					todo.updateFromJson(json)
			}
	}

	// Creates a fresh Todo on the client and the server.
	createTodo() {
			const todo = new Todo(this)
			this.todos.push(todo)
			return todo
	}

	// A Todo was somehow deleted, clean it from the client memory.
	removeTodo(todo) {
			this.todos.splice(this.todos.indexOf(todo), 1)
			todo.dispose()
	}
}

// Domain object Todo.
export class Todo {
	id = null // Unique id of this Todo, immutable.
	completed = false
	task = "default task"
	author = null // Reference to an Author object (from the accountStore).
	store = null
	autoSave = true // Indicator for submitting changes in this Todo to the server.
	saveHandler = null // Disposer of the side effect auto-saving this Todo (dispose).

	constructor(store, id) {
			makeAutoObservable(this, {
					id: false,
					store: false,
					autoSave: false,
					saveHandler: false,
					dispose: false
			})
			this.store = store
			this.id = id

			this.saveHandler = reaction(
					() => this.asJson, // Observe everything that is used in the JSON.
					json => {
							// If autoSave is true, send JSON to the server.
							if (this.autoSave) {
									this.store.transportLayer.saveTodo(json)
							}
					}
			)
	}

	// Remove this Todo from the client and the server.
	delete() {
			this.store.transportLayer.deleteTodo(this.id)
			this.store.removeTodo(this)
	}

	get asJson() {
			return {
					id: this.id,
					completed: this.completed,
					task: this.task,
					authorId: this.author ? this.author.id : null
			}
	}

	// Update this Todo with information from the server.
	updateFromJson(json) {
			this.autoSave = false // Prevent sending of our changes back to the server.
			this.completed = json.completed
			this.task = json.task
			this.author = this.store.accountStore.resolveAuthor(json.authorId)
			this.autoSave = true
	}

	// Clean up the observer.
	dispose() {
			this.saveHandler()
	}
}