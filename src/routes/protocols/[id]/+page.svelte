<script lang="ts">
  import { page } from "$app/stores";
  import { bindProtocols, bindActivityProtocols } from "../../../data/models.svelte";
  import { onMount } from "svelte";
  
  const protocols = bindProtocols();
  const activityProtocols = bindActivityProtocols();
  
  let protocol = $state(null);
  let protocolActivities = $state([]);
  
  $effect(() => {
    const id = Number($page.params.id);
    if (id) {
      protocol = protocols.all.find(p => p.id === id);
      if (protocol) {
        protocolActivities = activityProtocols.getWithDetails(id);
      }
    }
  });
</script>

<main class="container">
  {#if protocol}
    <div class="header">
      <h1>{protocol.name}</h1>
      <a href="/protocols" class="button secondary">Back to Protocols</a>
    </div>
    
    {#if protocol.description}
      <p class="description">{protocol.description}</p>
    {/if}
    
    <section class="source-code-section">
      <h2>Source Code</h2>
      <pre class="source-code">{protocol.sourceCode}</pre>
    </section>
    
    <section class="activities-section">
      <h2>Activities</h2>
      {#if protocolActivities.length === 0}
        <p>No activities found for this protocol.</p>
      {:else}
        <div class="activities-list">
          {#each protocolActivities as activityProtocol (activityProtocol.id)}
            <div class="activity-card">
              <h3>{activityProtocol.activityName}</h3>
              <p class="parameters">{activityProtocol.parameters}</p>
            </div>
          {/each}
        </div>
      {/if}
    </section>
  {:else}
    <p>Protocol not found.</p>
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
  
  .button.secondary {
    background-color: #f44336;
    color: white;
  }
  
  .description {
    color: #666;
    margin-bottom: 2rem;
  }
  
  .source-code {
    background-color: #f5f5f5;
    padding: 1rem;
    border-radius: 4px;
    font-family: monospace;
    white-space: pre-wrap;
    overflow-x: auto;
    margin: 1rem 0;
  }
  
  section {
    margin-bottom: 2rem;
  }
  
  .activities-list {
    display: grid;
    gap: 1rem;
  }
  
  .activity-card {
    border: 1px solid #ddd;
    border-radius: 4px;
    padding: 1rem;
    background-color: #f9f9f9;
  }
  
  .activity-card h3 {
    margin: 0 0 0.5rem 0;
  }
  
  .parameters {
    font-family: monospace;
    color: #444;
    margin: 0;
  }
</style>
