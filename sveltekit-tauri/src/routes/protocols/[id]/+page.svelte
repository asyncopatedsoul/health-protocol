<script lang="ts">
  import { getPlatform } from "../../../data/store-factory";
  import { page } from "$app/stores";
  import {
    bindProtocols,
    bindActivityProtocols,
  } from "../../../data/models.svelte";
  import { onMount } from "svelte";

  const protocols = bindProtocols();
  const activityProtocols = bindActivityProtocols();

  let protocol = $state(null);
  let protocolActivities = $state([]);

  import { appDataDir, join } from "@tauri-apps/api/path";
  import { convertFileSrc } from "@tauri-apps/api/core";

  // export let data;
  let { data } = $props();

  onMount(async () => {
    const platform = getPlatform();

    console.log(`Initializing data store for platform: ${platform}`);

    // Create the appropriate data store implementation based on platform
    switch (platform) {
      case "web":
        // dataStore = new WebStore();
        break;
      case "desktop":
      case "mobile":
        // dataStore = new SQLiteStore();
        const appDataDirPath = await appDataDir();
        const filePath = await join(
          appDataDirPath,
          "video/full_body_calisthenics.mp4",
        );
        const assetUrl = convertFileSrc(filePath);

        const video = document.getElementById(
          "video-guide",
        ) as HTMLVideoElement;
        const source = document.createElement("source");
        source.type = "video/mp4";
        source.src = assetUrl;
        video.appendChild(source);
        video.load();
        break;
      default:
        // Fallback to WebStore if platform cannot be determined
        console.warn("Unknown platform, using WebStore as fallback");
      // dataStore = new WebStore();
    }
  });
  $effect(() => {
    const id = Number($page.params.id);
    if (id) {
      protocol = protocols.all.find((p) => p.id === id);
      console.log("protocol", protocol);
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

    <section class="supabase">
      {#each data.countries as country}
        <li>{country.name}</li>
      {/each}
    </section>

    <section class="video-section">
      <h2>Activity Guide</h2>
      <!-- svelte-ignore a11y_media_has_caption -->
      <video id="video-guide" controls>
        <p>Your browser does not support HTML5 video :(</p>
      </video>
    </section>
    <section class="source-code-section">
      <h2>Source Code</h2>
      <pre class="source-code">{protocol.source_code}</pre>
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
