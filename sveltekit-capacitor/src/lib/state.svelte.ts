// import { $state } from "svelte/store";
// https://svelte.dev/docs/kit/state-management
// https://svelte.dev/docs/svelte/$state
class Todo {
	done = $state(false);
	text = $state();

	constructor(text) {
		this.text = text;
	}

	reset() {
		this.text = '';
		this.done = false;
	}
}