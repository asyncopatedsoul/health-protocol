<script lang="ts">
    import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, PUBLIC_GOOGLE_CLIENT_ID_IOS, PUBLIC_GOOGLE_CLIENT_ID_WEB } from "$env/static/public";
    import { onMount } from "svelte";
    import { createClient } from "@supabase/supabase-js";
    import { SocialLogin } from "@capgo/capacitor-social-login";

    const iOSClientId = PUBLIC_GOOGLE_CLIENT_ID_IOS;
    const webClientId = PUBLIC_GOOGLE_CLIENT_ID_WEB;

    console.log("Initializing Supabase client");
    const supabaseUrl = PUBLIC_SUPABASE_URL;
    const supabaseKey = PUBLIC_SUPABASE_ANON_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    onMount(() => {
        console.log("Initializing SocialLogin");
        SocialLogin.initialize({
            google: {
                webClientId: webClientId,
                iOSClientId: iOSClientId,
                iOSServerClientId: webClientId, // "The same value as webClientId",
                // mode: "offline", // <-- important
            },
        });
    });

    async function handleSignInWithGoogle() {
        console.log("handleSignInWithGoogle called");
        try {
            const response = await SocialLogin.login({
                provider: "google",
                options: {},
            });
            // handle the response. popoutStore is specific to my app
            console.log("SocialLogin response", response);
            // JSON.stringify(response)
            const provider = response.provider;
            const loginResponse = response.result;
            const idToken = loginResponse.idToken;
            const accessToken = loginResponse.accessToken.token;
            console.log('idToken',idToken);
            console.log('accessToken',accessToken);
            const supabaseAuthResponse =
                await supabase.auth.signInWithIdToken({
                    provider: provider,
                    token: idToken,
                    access_token: accessToken,
                });
            console.log("Supabase auth response",supabaseAuthResponse);
        } catch (error) {
            console.error("Error during Google login:", error);
        }
    }
</script>

<h1>Welcome!!!</h1>

<img
    src="/svelte_cap.png"
    alt="SvelteKit Capacitor"
    style="object-fit: scale-down; max-width: 100%; padding: 8px;"
/>
<button class="button secondary small" on:click={handleSignInWithGoogle}
    >Sign in with google</button
>

<style>
    * {
        box-sizing: border-box;
    }
    h1 {
        text-align: center;
        overflow-wrap: break-word;
    }
</style>
