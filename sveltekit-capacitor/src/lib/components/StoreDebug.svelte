<script lang="ts">
  // import { ostate, actions } from "$lib/shared/overmind/index";
  // import { $derived, $effect } from "svelte/store";
  // $: count = $ostate.count;
  // let count = $ostate.count;

  // const count = $derived(ostate.count);
  // let doubled = 0;

  // reaction(
  //   (state) => state.count,
  //   (value) => {
  //     doubled = value * 2;
  //   },
  //   {
  //     immediate: true,
  //   },
  // );

  // $effect(() => {
  //   doubled = count * 2;
  // });

  // import { devtools } from "@xoid/devtools";
  // import { atom } from "xoid";
  // import { useAtom } from "@xoid/svelte";
  // // devtools(); // run once

  // const store = atom({ alpha: 5 }, (a) => {
  //   const $alpha = a.focus((s) => s.alpha);
  //   return {
  //     inc: () => $alpha.update((s) => s + 1),
  //     resetState: () => a.set({ alpha: 5 }),
  //     deeply: {
  //       nested: {
  //         action: () => $alpha.set(5),
  //       },
  //     },
  //   };
  // });

  // store.debugValue = "store"; // enable watching it by the devtools

  // const { deeply, inc } = store.actions; // destructuring is no problem

  // // let alpha = useAtom(store.focus((s) => s.alpha));
  // let alpha = useAtom(store.focus('alpha'))
  // console.log(alpha)
  // $: alpha = useAtom(store.focus('alpha'))

  import { rootStore } from "$lib/shared/stores";
  let mobxCount = rootStore.reactiveStores.mobxCount;
  let todos = rootStore.reactiveStores.todo;

  mobxCount.subscribe((value) => {
    console.log(value);
  });

</script>

<h1>Store Debug</h1>

<h2>Mobx Store</h2>
<button class="btn btn-secondary" on:click = {() => mobxCount.count++}>
Mobx Count is: { $mobxCount.count }
</button>

<h3>Todo Store</h3>
<p>isLoading: {todos.isLoading}</p>
{#each todos.todos as todo}
<p>{todo.id}: {todo.task}</p>
{/each}
<!-- <h2>Xoid Store</h2>
<p>store: {alpha}</p>
<button id="increase" on:click={() => inc()}>Increase</button>
<button id="increase" on:click={() => deeply.nested.action()}>Set to 5</button> -->
<!-- <p>Count: {count}</p>
<p>Doubled: {doubled}</p>
<button id="increase" on:click={() => actions.increase()}>Increase</button>
<button id="decrease" on:click={() => actions.decrease()}>Increase</button> -->
