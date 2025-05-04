import { createClient } from "@supabase/supabase-js";
import { SocialLogin } from "@capgo/capacitor-social-login";
import { Capacitor } from '@capacitor/core';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, PUBLIC_GOOGLE_CLIENT_ID_IOS, PUBLIC_GOOGLE_CLIENT_ID_WEB } from "$env/static/public";
import { PUBLIC_SUPABASE_URL_CLOUD, PUBLIC_SUPABASE_ANON_KEY_CLOUD } from "$env/static/public";
console.log(PUBLIC_SUPABASE_URL)
console.log(PUBLIC_SUPABASE_ANON_KEY)

console.log("Initializing Supabase client");
export const supabase = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);
const supabaseCloud = createClient(PUBLIC_SUPABASE_URL_CLOUD, PUBLIC_SUPABASE_ANON_KEY_CLOUD);

export const initializeSocialLogin = async () => {
    console.log("Initializing Social Login");
    SocialLogin.initialize({
        google: {
            webClientId: PUBLIC_GOOGLE_CLIENT_ID_WEB,
            iOSClientId: PUBLIC_GOOGLE_CLIENT_ID_IOS,
            iOSServerClientId: PUBLIC_GOOGLE_CLIENT_ID_WEB, // "The same value as webClientId",
            // mode: "offline", // <-- important
        },
    });
}

export const handleSignInWithGoogleWeb = async (response) => {
    console.log("handleSignInWithGoogle");
    console.log(response);
    const { data, error } = await supabaseCloud.auth.signInWithIdToken({
      provider: "google",
      token: response.credential,
    });
    console.log(error);
    console.log(data);
  }

export const handleSignInWithGoogleMobile = async () => {
    console.log("handleSignInWithGoogle called");
    try {
        const response = await SocialLogin.login({
            provider: "google",
            options: {},
        });
        // handle the response. popoutStore is specific to my app
        console.log("SocialLogin response", JSON.stringify(response, null, 2));
        const provider = response.provider;
        const loginResponse = response.result;
        const idToken = loginResponse.idToken;
        const accessToken = loginResponse.accessToken.token;
        console.log('idToken', idToken);
        console.log('accessToken', accessToken);
        const supabaseAuthResponse =
            await supabase.auth.signInWithIdToken({
                provider: provider,
                token: idToken,
                access_token: accessToken,
            });
        console.log("Supabase auth response", JSON.stringify(supabaseAuthResponse, null, 2));
    } catch (error) {
        console.error("Error during Google login:", error);
    }
}

export const platform = Capacitor.getPlatform();
console.log('Capacitor Platform:', platform);
export const isNative = Capacitor.isNativePlatform();
console.log('Is Native Platform:', isNative);

// platform detection
if (isNative) {
    // Native platform detected
    console.log('Running on a native platform');
}

if (platform === 'ios') {
    console.log('Running on iOS');

} else if (platform === 'android') {
    console.log('Running on Android');
}
else if (platform === 'web') {
    console.log('Running on Web');

}
// Supabase Auth 