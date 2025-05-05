<script>
    import { state, actions, reaction } from './overmind.js'
  
    $: count = $state.count
    
    let doubled = undefined
    
    reaction(
      (state) => state.count,
      (value) => {
          doubled = value * 2
      },
      {
          immediate: true
      }
    )
  </script>
  
  <p>Count: {count}</p>
  <p>Doubled: {doubled}</p>
  <button id="increase" on:click={() => actions.increase()}>Increase</button>
  <button id="decrease" on:click={() => actions.decrease()}>Increase</button>