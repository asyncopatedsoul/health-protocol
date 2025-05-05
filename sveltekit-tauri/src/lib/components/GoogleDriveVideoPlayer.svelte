<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { googleDriveService } from '../googleDriveService';
  import { googleAuthService } from '../googleAuthService';
  
  // Props
  export let fileId = $props<string>('');
  export let autoplay = $props<boolean>(false);
  export let controls = $props<boolean>(true);
  export let height = $props<string>('auto');
  export let width = $props<string>('100%');
  
  // State
  let isLoading = $state(true);
  let error = $state<string | null>(null);
  let videoUrl = $state<string>('');
  let videoElement: HTMLVideoElement;
  
  // Set up video source
  onMount(async () => {
    if (!fileId) {
      error = 'No Google Drive file ID provided';
      isLoading = false;
      return;
    }
    
    try {
      await loadVideo();
    } catch (err) {
      console.error('Error loading video:', err);
      error = 'Failed to load video from Google Drive';
      isLoading = false;
    }
  });
  
  // Clean up on component destruction
  onDestroy(() => {
    if (videoElement) {
      videoElement.pause();
      videoElement.src = '';
      videoElement.load();
    }
  });
  
  // Load video from Google Drive
  async function loadVideo() {
    isLoading = true;
    error = null;
    
    try {
      const isAuthenticated = googleAuthService.isAuthenticated();
      
      if (isAuthenticated) {
        // Try to get a streaming URL using auth
        const credentials = await googleAuthService.getCredentials();
        if (credentials) {
          videoUrl = await googleDriveService.getStreamingUrl(fileId);
        } else {
          // Fall back to public URL if auth failed
          videoUrl = await googleDriveService.getVideoFileUrl(fileId);
        }
      } else {
        // Use public URL if not authenticated
        videoUrl = await googleDriveService.getVideoFileUrl(fileId);
        
        // Check if the file is publicly accessible
        const isPublic = await googleDriveService.isFilePublic(fileId);
        if (!isPublic) {
          error = 'This video requires authentication. Please sign in with Google to view it.';
        }
      }
    } catch (err) {
      console.error('Error loading video:', err);
      error = 'Failed to load video from Google Drive';
    } finally {
      isLoading = false;
    }
  }
  
  // Attempt to reload the video
  function retryLoading() {
    loadVideo();
  }
  
  // Handle video element binding
  function bindVideoElement(el: HTMLVideoElement) {
    videoElement = el;
  }
</script>

<div class="video-player" style="width: {width}; height: {height !== 'auto' ? height : 'auto'}">
  {#if isLoading}
    <div class="loading">
      <div class="spinner"></div>
      <p>Loading video from Google Drive...</p>
    </div>
  {:else if error}
    <div class="error">
      <p>{error}</p>
      <button class="retry-button" on:click={retryLoading}>Try Again</button>
      
      {#if error.includes('requires authentication')}
        <button 
          class="google-signin-button" 
          on:click={() => googleAuthService.initiateAuthFlow()}
        >
          <img src="https://developers.google.com/identity/images/g-logo.png" alt="Google logo" />
          <span>Sign in with Google</span>
        </button>
      {/if}
    </div>
  {:else if videoUrl}
    <video 
      bind:this={videoElement}
      class="video-element"
      src={videoUrl}
      {controls}
      {autoplay}
      preload="auto"
      on:error={() => { error = 'Failed to play video. The file might be unavailable or restricted.' }}
    >
      <track kind="captions" />
      Your browser does not support HTML5 video.
    </video>
  {:else}
    <div class="empty-state">
      <p>No video file selected</p>
    </div>
  {/if}
</div>

<style>
  .video-player {
    position: relative;
    width: 100%;
    background-color: #000;
    overflow: hidden;
    border-radius: 4px;
  }

  .video-element {
    width: 100%;
    height: 100%;
    display: block;
  }

  .loading, .error, .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    min-height: 200px;
    padding: 1rem;
    text-align: center;
    background-color: #1a1a1a;
    color: #fff;
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 4px solid rgba(255, 255, 255, 0.3);
    border-top: 4px solid white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .retry-button {
    background-color: #4caf50;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 0.5rem 1rem;
    cursor: pointer;
    margin-top: 1rem;
  }

  .retry-button:hover {
    background-color: #45a049;
  }

  .google-signin-button {
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: white;
    color: #666;
    border: none;
    border-radius: 4px;
    padding: 0.5rem 1rem;
    cursor: pointer;
    margin-top: 1rem;
  }

  .google-signin-button:hover {
    background-color: #f5f5f5;
  }

  .google-signin-button img {
    width: 18px;
    height: 18px;
    margin-right: 10px;
  }
</style>
