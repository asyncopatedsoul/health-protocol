<script lang="ts">
  import { onMount } from 'svelte';
  import { googleAuthService } from '../googleAuthService';
  import { googleDriveService } from '../googleDriveService';
  import type { GoogleDriveFile } from '../../data/types';
  
  // Props
  export let onVideoSelected = $props<(file: GoogleDriveFile) => void>();
  export let folderId = $props<string | null>(null);
  
  // State
  let isAuthenticated = $state(false);
  let isLoading = $state(false);
  let videos = $state<GoogleDriveFile[]>([]);
  let error = $state<string | null>(null);
  
  // Check auth status on mount
  onMount(async () => {
    isAuthenticated = googleAuthService.isAuthenticated();
    
    // If authenticated and folder ID is provided, load videos
    if (isAuthenticated && folderId) {
      await loadVideos();
    }
  });
  
  // Login with Google
  async function signInWithGoogle() {
    try {
      googleAuthService.initiateAuthFlow();
    } catch (err) {
      console.error('Google authentication error:', err);
      error = 'Failed to initiate Google authentication';
    }
  }
  
  // Fetch videos from the folder
  async function loadVideos() {
    if (!folderId) return;
    
    try {
      isLoading = true;
      error = null;
      
      // Make sure we have valid credentials
      const credentials = await googleAuthService.getCredentials();
      if (!credentials) {
        isAuthenticated = false;
        error = 'Your Google account session has expired. Please sign in again.';
        return;
      }
      
      // Fetch videos from the specified folder
      videos = await googleDriveService.listVideoFilesInFolder(folderId);
    } catch (err) {
      console.error('Error loading videos:', err);
      error = 'Failed to load videos from Google Drive';
    } finally {
      isLoading = false;
    }
  }
  
  // Handle folder ID change
  $effect(() => {
    if (folderId && isAuthenticated && !isLoading && videos.length === 0) {
      loadVideos();
    }
  });
  
  // Select a video
  function selectVideo(video: GoogleDriveFile) {
    onVideoSelected(video);
  }
</script>

<div class="google-drive-picker">
  {#if !isAuthenticated}
    <div class="auth-prompt">
      <h3>Connect to Google Drive</h3>
      <p>Sign in with Google to access your videos</p>
      <button class="google-signin-button" on:click={signInWithGoogle}>
        <img src="https://developers.google.com/identity/images/g-logo.png" alt="Google logo" />
        <span>Sign in with Google</span>
      </button>
    </div>
  {:else if isLoading}
    <div class="loading">
      <div class="spinner"></div>
      <p>Loading videos from Google Drive...</p>
    </div>
  {:else if error}
    <div class="error">
      <p>{error}</p>
      <button class="retry-button" on:click={loadVideos}>Try Again</button>
    </div>
  {:else if videos.length === 0}
    <div class="empty-state">
      <p>No videos found in this folder.</p>
      {#if folderId}
        <button class="retry-button" on:click={loadVideos}>Refresh</button>
      {:else}
        <p>Please specify a Google Drive folder ID to load videos.</p>
      {/if}
    </div>
  {:else}
    <div class="video-grid">
      {#each videos as video}
        <div class="video-card" on:click={() => selectVideo(video)}>
          <div class="video-thumbnail">
            <span class="play-icon">▶</span>
          </div>
          <div class="video-info">
            <span class="video-name">{video.name}</span>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .google-drive-picker {
    width: 100%;
    padding: 1rem;
    background-color: #f9f9f9;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .auth-prompt {
    text-align: center;
    padding: 2rem;
  }

  .auth-prompt h3 {
    margin-top: 0;
    color: #333;
  }

  .google-signin-button {
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: white;
    border: 1px solid #ddd;
    border-radius: 4px;
    padding: 0.5rem 1rem;
    cursor: pointer;
    transition: background-color 0.2s;
    margin: 1rem auto;
  }

  .google-signin-button:hover {
    background-color: #f5f5f5;
  }

  .google-signin-button img {
    width: 18px;
    height: 18px;
    margin-right: 10px;
  }

  .loading {
    text-align: center;
    padding: 2rem;
  }

  .spinner {
    margin: 0 auto 1rem;
    width: 40px;
    height: 40px;
    border: 4px solid #f3f3f3;
    border-top: 4px solid #4caf50;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .error, .empty-state {
    text-align: center;
    padding: 1.5rem;
    color: #666;
  }

  .error {
    color: #f44336;
  }

  .retry-button {
    background-color: #4caf50;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 0.5rem 1rem;
    cursor: pointer;
    margin-top: 0.5rem;
  }

  .retry-button:hover {
    background-color: #45a049;
  }

  .video-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 1rem;
  }

  .video-card {
    background-color: white;
    border-radius: 4px;
    overflow: hidden;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    cursor: pointer;
    transition: transform 0.2s;
  }

  .video-card:hover {
    transform: translateY(-5px);
  }

  .video-thumbnail {
    position: relative;
    padding-top: 56.25%; /* 16:9 aspect ratio */
    background-color: #eee;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .play-icon {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: white;
    background-color: rgba(0, 0, 0, 0.5);
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
  }

  .video-info {
    padding: 0.5rem;
  }

  .video-name {
    font-size: 0.9rem;
    color: #333;
    display: block;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
</style>
