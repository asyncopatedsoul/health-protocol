import { createClient } from "@supabase/supabase-js";
import { SocialLogin } from "@capgo/capacitor-social-login";
import { Capacitor } from '@capacitor/core';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, PUBLIC_GOOGLE_CLIENT_ID_IOS, PUBLIC_GOOGLE_CLIENT_ID_WEB } from "$env/static/public";
import { PUBLIC_SUPABASE_URL_CLOUD, PUBLIC_SUPABASE_ANON_KEY_CLOUD } from "$env/static/public";
import { PUBLIC_TEST_USER_EMAIL, PUBLIC_TEST_USER_PASSWORD } from "$env/static/public";
console.log(PUBLIC_SUPABASE_URL)
console.log(PUBLIC_SUPABASE_ANON_KEY)

console.log("Initializing Supabase client");
export const supabase = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);
// we still need a supabase cloud client to sign in with google
const supabaseCloud = createClient(PUBLIC_SUPABASE_URL_CLOUD, PUBLIC_SUPABASE_ANON_KEY_CLOUD);

// https://supabase.com/docs/reference/javascript/auth-onauthstatechange
const subscribeToAuthStateChange = (supabaseClient) => {
    const { data } = supabaseClient.auth.onAuthStateChange((event, session) => {
        console.log(event, session)
        if (event === 'INITIAL_SESSION') {
            // handle initial session
        } else if (event === 'SIGNED_IN') {
            // handle sign in event
        } else if (event === 'SIGNED_OUT') {
            // handle sign out event
        } else if (event === 'PASSWORD_RECOVERY') {
            // handle password recovery event
        } else if (event === 'TOKEN_REFRESHED') {
            // handle token refreshed event
        } else if (event === 'USER_UPDATED') {
            // handle user updated event
        }
    })
    return data
    // call unsubscribe to remove the callback
    //   data.subscription.unsubscribe()˝
}

subscribeToAuthStateChange(supabase)
subscribeToAuthStateChange(supabaseCloud)

export const autoSignInPassword = async () => {
    console.log("autoSignInPassword")
    console.log(PUBLIC_TEST_USER_EMAIL)
    console.log(PUBLIC_TEST_USER_PASSWORD)
    const { data, error } = await supabase.auth.signInWithPassword({
        email: PUBLIC_TEST_USER_EMAIL,
        password: PUBLIC_TEST_USER_PASSWORD
    })
    console.log("signInWithPassword response", data)
    console.log("signInWithPassword error", error)
}

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

    const user = await supabaseCloud.auth.getUser()
    console.log("user", user)

    // create account if it doesn't exist
    // console.log("try to create account with verified Google user identity ")
    // await createAccount(data)

    // add password to Google Oauth account
    // retrieve all identities linked to a user
    const { data: identities, error: identitiesError } = await supabaseCloud.auth.getUserIdentities()
    console.log("identities", identities)
    console.log("identitiesError", identitiesError)
    if (!identitiesError) {
        // find the google identity linked to the user
        const googleIdentity = identities.identities.find((identity) => identity.provider === 'google')
        if (googleIdentity) {
            // unlink the google identity from the user
            // const { data, error } = await supabase.auth.unlinkIdentity(googleIdentity)

            // https://supabase.com/docs/reference/javascript/auth-updateuser
            const { data, error } = await supabaseCloud.auth.updateUser({
                password: 'flowcraft'
            })
            console.log("updateUser response", data)
            console.log("updateUser error", error)
        }
    }
}

const createAccount = async (authSignInResponse) => {
    console.log("createAccount", authSignInResponse)
    const email = authSignInResponse.user.email;
    const authProvider = authSignInResponse.user.app_metadata.provider;
    const authId = authSignInResponse.user.id;
    const name = authSignInResponse.user.user_metadata.name;
    const { data, error } = await supabase.functions.invoke('createAccount', {
        body: { email, authProvider, authId, name }
    })
    console.log("createAccount response", data)
    console.log("createAccount error", error)
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