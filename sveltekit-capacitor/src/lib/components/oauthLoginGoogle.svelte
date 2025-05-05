<script lang="ts">
  import { onMount } from "svelte";
  import {
      initializeSocialLogin,
      handleSignInWithGoogleMobile,
      handleSignInWithGoogleWeb,
      isNative,
      platform,
      autoSignInPassword,
  } from "$lib/shared/supabaseClient";

  
  import { browser } from "$app/environment";
  let setGoogleSignInCallback = () => {
      console.log("setGoogleSignInCallback");
      if (browser) {
          window.handleSignInWithGoogle = handleSignInWithGoogleWeb;
          return true;
      }
      return false;
  };
  let delayedGoogleSignIn = new Promise((resolve) => {
      setTimeout(() => {
          resolve(setGoogleSignInCallback());
      }, 2000);
  });

  let autoSignInGoogle = false;

  if (browser) {
      console.log(window.innerWidth);
  }

  onMount(() => {
      console.log("onMount");
      if (!isNative) {
          console.log("Web platform detected");
          // Initialize the web-specific logic here
          console.log("handleSignInWithGoogleWeb", handleSignInWithGoogleWeb);
      } else {
          console.log("Native platform detected");
          // Initialize the native-specific logic here
          initializeSocialLogin();
      }

      autoSignInPassword();
  });
</script>

{#if isNative}
  <p>Running on {platform}</p>
{:else}
  <p>Running on web</p>
{/if}

{#if isNative}
  <button
      class="button secondary small"
      on:click={handleSignInWithGoogleMobile}>Sign in with google</button
  >
{:else}
  {#await delayedGoogleSignIn}
      Loading...
  {:then value}
      {#if autoSignInGoogle}
      auto sign in Google
      <script src="https://accounts.google.com/gsi/client" async></script>
      <div
          id="g_id_onload"
          data-client_id="259278640793-40shultnr3ibgg6lf5h8e3m4hpripvg9.apps.googleusercontent.com"
          data-context="signin"
          data-callback="handleSignInWithGoogle"
          data-auto_select="true"
          data-itp_support="true"
          ></div>
      {:else}
      No auto sign in Google

      {/if}
  {:catch error}
      <pre><code>{error}</code></pre>
  {/await}
{/if}

<style>

</style>
