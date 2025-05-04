<script lang="ts">
  import { bindProtocols } from "../../../data/models.svelte";
  import { goto } from "$app/navigation";
  
  const protocols = bindProtocols();
  
  let name = $state("");
  let description = $state("");
  let sourceCode = $state("");
  let error = $state("");
  let loading = $state(false);
  
  async function handleSubmit(event: Event) {
    event.preventDefault();
    
    if (!name.trim()) {
      error = "Protocol name is required";
      return;
    }
    
    if (!sourceCode.trim()) {
      error = "Source code is required";
      return;
    }
    
    loading = true;
    error = "";
    
    try {
      const protocolId = await protocols.createWithParsing(name, sourceCode, description);
      if (protocolId) {
        goto(`/protocols/${protocolId}`);
      } else {
        error = "Failed to create protocol";
      }
    } catch (err) {
      error = err instanceof Error ? err.message : "An error occurred";
    } finally {
      loading = false;
    }
  }
</script>

<main class="container">
  <h1>Create New Protocol</h1>
  
  <form onsubmit={handleSubmit}>
    <div class="form-group">
      <label for="name">Protocol Name:</label>
      <input
        id="name"
        type="text"
        bind:value={name}
        placeholder="Enter protocol name"
        required
      />
    </div>
    
    <div class="form-group">
      <label for="description">Description (optional):</label>
      <input
        id="description"
        type="text"
        bind:value={description}
        placeholder="Enter protocol description"
      />
    </div>
    
    <div class="form-group">
      <label for="sourceCode">Protocol Source Code:</label>
      <textarea
        id="sourceCode"
        bind:value={sourceCode}
        placeholder="Enter activities, one per line (e.g., pushups 20x4)"
        rows={10}
        required
      ></textarea>
      <small>
        Format: activity_name parameters (e.g., pushups 20x4, situps 10x4)
      </small>
    </div>
    
    {#if error}
      <div class="error">{error}</div>
    {/if}
    
    <div class="form-actions">
      <button type="submit" disabled={loading}>
        {loading ? "Creating..." : "Create Protocol"}
      </button>
      <a href="/protocols" class="button secondary">Cancel</a>
    </div>
  </form>
</main>

<style>
  .container {
    max-width: 600px;
    margin: 2rem auto;
    padding: 1rem;
  }
  
  .form-group {
    margin-bottom: 1rem;
  }
  
  label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: bold;
  }
  
  input, textarea {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #ccc;
    border-radius: 4px;
  }
  
  textarea {
    resize: vertical;
    font-family: monospace;
  }
  
  small {
    display: block;
    margin-top: 0.25rem;
    color: #666;
  }
  
  .error {
    color: red;
    margin: 1rem 0;
  }
  
  .form-actions {
    display: flex;
    gap: 1rem;
    margin-top: 1rem;
  }
  
  button {
    padding: 0.5rem 1rem;
    background-color: #4CAF50;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  
  button:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
  
  .button.secondary {
    display: inline-block;
    padding: 0.5rem 1rem;
    text-decoration: none;
    background-color: #f44336;
    color: white;
    border-radius: 4px;
  }
</style>
