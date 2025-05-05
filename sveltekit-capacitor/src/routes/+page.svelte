<script lang="ts">
    import { onMount } from "svelte";
    import { browser } from "$app/environment";
    import OauthLoginGoogle from "$lib/components/oauthLoginGoogle.svelte";
    import StoreDebug from "$lib/components/StoreDebug.svelte";

    if (browser) {
        // console.log(window.innerWidth);
    }

    onMount(() => {
        console.log("onMount");
    });
</script>

<h1>Flowcraft</h1>

<img
    src="/svelte_cap.png"
    alt="SvelteKit Capacitor"
    style="object-fit: scale-down; max-width: 20%; padding: 8px;"
/>

<OauthLoginGoogle />

<StoreDebug />

<style>
    * {
        box-sizing: border-box;
    }
    h1 {
        text-align: center;
        overflow-wrap: break-word;
    }
</style>
