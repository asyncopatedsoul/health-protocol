<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { googleAuthService } from '../../../../lib/googleAuthService';

  let isAuthenticating = $state(true);
  let errorMessage = $state('');

  onMount(async () => {
    try {
      // Get the authorization code from the URL query parameters
      const code = $page.url.searchParams.get('code');
      
      if (!code) {
        throw new Error('No authorization code received from Google');
      }

      // Exchange code for tokens
      await googleAuthService.handleAuthCallback(code);
      
      // Authentication successful, redirect back to home
      isAuthenticating = false;
      goto('/');
    } catch (error) {
      console.error('Authentication error:', error);
      isAuthenticating = false;
      errorMessage = error instanceof Error ? error.message : 'Authentication failed';
    }
  });
</script>

<main class="auth-callback">
  <div class="container">
    {#if isAuthenticating}
      <div class="loading">
        <div class="spinner"></div>
        <h2>Completing Google authentication...</h2>
        <p>Please wait while we process your sign-in.</p>
      </div>
    {:else if errorMessage}
      <div class="error">
        <h2>Authentication Error</h2>
        <p>{errorMessage}</p>
        <a href="/" class="button">Return to Home</a>
      </div>
    {:else}
      <div class="success">
        <h2>Authentication Successful!</h2>
        <p>You are now connected to Google Drive.</p>
        <p>Redirecting you back to the application...</p>
      </div>
    {/if}
  </div>
</main>

<style>
  .auth-callback {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    background-color: #f5f5f5;
  }

  .container {
    width: 100%;
    max-width: 500px;
    padding: 2rem;
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    text-align: center;
  }

  .loading, .error, .success {
    padding: 1rem;
  }

  .spinner {
    margin: 0 auto 1rem;
    width: 50px;
    height: 50px;
    border: 5px solid #f3f3f3;
    border-top: 5px solid #4caf50;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  h2 {
    margin-top: 0;
    color: #333;
  }

  p {
    color: #666;
    margin-bottom: 1.5rem;
  }

  .error h2 {
    color: #f44336;
  }

  .success h2 {
    color: #4caf50;
  }

  .button {
    display: inline-block;
    padding: 0.75rem 1.5rem;
    background-color: #4caf50;
    color: white;
    border-radius: 4px;
    text-decoration: none;
    font-weight: bold;
    transition: background-color 0.2s;
  }

  .button:hover {
    background-color: #45a049;
  }
</style>
