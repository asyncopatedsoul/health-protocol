<script lang="ts">
    // import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, PUBLIC_GOOGLE_CLIENT_ID_IOS, PUBLIC_GOOGLE_CLIENT_ID_WEB } from "$env/static/public";
    // import { createClient } from "@supabase/supabase-js";
    // import { supabase } from "$lib/supabaseClient";
    import { onMount } from "svelte";
    import {
        initializeSocialLogin,
        handleSignInWithGoogleMobile,
        handleSignInWithGoogleWeb,
        isNative,
        platform,
    } from "$lib/supabaseClient";

    import { browser } from "$app/environment";

    if (browser) {
        console.log(window.innerWidth);
    }
    // import { SocialLogin } from "@capgo/capacitor-social-login";

    // const iOSClientId = PUBLIC_GOOGLE_CLIENT_ID_IOS;
    // const webClientId = PUBLIC_GOOGLE_CLIENT_ID_WEB;

    // console.log("Initializing Supabase client");
    // const supabaseUrl = PUBLIC_SUPABASE_URL;
    // const supabaseKey = PUBLIC_SUPABASE_ANON_KEY;
    // const supabase = createClient(supabaseUrl, supabaseKey);

    onMount(() => {
        if (!isNative) {
            console.log("Web platform detected");
            // Initialize the web-specific logic here
            window.handleSignInWithGoogle = handleSignInWithGoogleWeb;
        } else {
            console.log("Native platform detected");
            // Initialize the native-specific logic here
            initializeSocialLogin();
        }
    });
</script>

<h1>Flowcraft</h1>

<img
    src="/svelte_cap.png"
    alt="SvelteKit Capacitor"
    style="object-fit: scale-down; max-width: 100%; padding: 8px;"
/>
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
    one tap
    <script src="https://accounts.google.com/gsi/client" async></script>
    <div
        id="g_id_onload"
        data-client_id="259278640793-40shultnr3ibgg6lf5h8e3m4hpripvg9.apps.googleusercontent.com"
        data-context="signin"
        data-callback="handleSignInWithGoogle"
        data-auto_select="true"
        data-itp_support="true"
    ></div>
{/if}

<style>
    * {
        box-sizing: border-box;
    }
    h1 {
        text-align: center;
        overflow-wrap: break-word;
    }
</style>
