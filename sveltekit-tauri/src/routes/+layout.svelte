<script lang="ts">
  import { bindSession } from "../data/models.svelte";
  import { onMount } from "svelte";
  
  const session = bindSession();
  
  onMount(async () => {
    await session.loadData();
  });
</script>

<header>
  <nav class="main-nav">
    <a href="/" class="nav-link">Home</a>
    <a href="/protocols" class="nav-link">Protocols</a>
    <a href="/skills" class="nav-link">Skills</a>
    <a href="/skills/manage" class="nav-link">Manage Skills</a>
  </nav>
</header>

<div class="content">
  <slot />
</div>

<style>
  :global(body) {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  }
  
  :global(.container) {
    max-width: 1200px;
    margin: 0 auto;
    padding: 1rem;
  }
  
  header {
    background-color: #333;
    padding: 1rem;
  }
  
  .main-nav {
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    gap: 1rem;
  }
  
  .nav-link {
    color: white;
    text-decoration: none;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    transition: background-color 0.2s;
  }
  
  .nav-link:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
  
  .content {
    min-height: calc(100vh - 4rem);
  }
</style>
