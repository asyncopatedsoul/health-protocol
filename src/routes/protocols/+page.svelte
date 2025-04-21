<script lang="ts">
  import { bindProtocols } from "../../data/models.svelte";
  import { onMount } from "svelte";
  
  const protocols = bindProtocols();
  
  onMount(() => {
    // Protocols are loaded from the session.loadData() in the layout
  });
</script>

<main class="container">
  <div class="header">
    <h1>Protocols</h1>
    <a href="/protocols/create" class="button primary">Create New Protocol</a>
  </div>
  
  {#if protocols.all.length === 0}
    <p>No protocols found. Create one to get started!</p>
  {:else}
    <div class="protocols-list">
      {#each protocols.all as protocol (protocol.id)}
        <div class="protocol-card">
          <h3>{protocol.name}</h3>
          {#if protocol.description}
            <p class="description">{protocol.description}</p>
          {/if}
          <pre class="source-code">{protocol.sourceCode}</pre>
          <a href={`/protocols/${protocol.id}`} class="button secondary">View Details</a>
        </div>
      {/each}
    </div>
  {/if}
</main>

<style>
  .container {
    max-width: 800px;
    margin: 2rem auto;
    padding: 1rem;
  }
  
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
  }
  
  .button {
    display: inline-block;
    padding: 0.5rem 1rem;
    text-decoration: none;
    border-radius: 4px;
    cursor: pointer;
  }
  
  .button.primary {
    background-color: #4CAF50;
    color: white;
  }
  
  .button.secondary {
    background-color: #2196F3;
    color: white;
  }
  
  .protocols-list {
    display: grid;
    gap: 1rem;
  }
  
  .protocol-card {
    border: 1px solid #ddd;
    border-radius: 4px;
    padding: 1rem;
    background-color: #f9f9f9;
  }
  
  .protocol-card h3 {
    margin-top: 0;
  }
  
  .description {
    color: #666;
    margin: 0.5rem 0;
  }
  
  .source-code {
    background-color: #f5f5f5;
    padding: 0.5rem;
    border-radius: 4px;
    font-family: monospace;
    white-space: pre-wrap;
    overflow-x: auto;
    margin: 0.5rem 0;
  }
</style>
