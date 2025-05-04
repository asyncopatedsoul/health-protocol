// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

console.log("CreateAccount")

const url = Deno.env.get('PUBLIC_SUPABASE_URL') ?? '';
const keyAnon = Deno.env.get('PUBLIC_SUPABASE_ANON_KEY') ?? '';
const keyService = Deno.env.get('PRIVATE_SUPABASE_SERVICE_ROLE_KEY') ?? '';
console.log(url, keyAnon, keyService)

import { corsHeaders } from '../_shared/cors.ts'
console.log(`Function "browser-with-cors" up and running!`)

// Deno.serve(async (req) => {
//   const { name } = await req.json()
//   const data = {
//     message: `Hello ${name}!`,
//   }

//   return new Response(
//     JSON.stringify(data),
//     { headers: { "Content-Type": "application/json" } },
//   )
// })


Deno.serve(async (req: Request) => {
  console.log("headers", req.headers)
  // This is needed if you're planning to invoke your function from a browser.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  try {

    const supabase = createClient(
      url,
      keyService
    )

    const requestBody = await req.json()
    console.log("requestBody", requestBody)

    const targetAuthProvider = requestBody.authProvider
    const targetAuthId = requestBody.authId
    if (targetAuthProvider === "google") {
      let { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('auth_google_uid', targetAuthId)

      console.log("data", data)
      console.log("error", error)
      if (data.data == null) {
        // create account
        
        const newAccount = {
          auth_google_uid: targetAuthId,
          email: requestBody.email,
          name: requestBody.name,
        }
        console.log("newAccount", newAccount)

        let { data, error } = await supabase
          .from('accounts')
          .insert({
            auth_google_uid: targetAuthId,
            email: requestBody.email,
            name: requestBody.name,
          })

        console.log("data", data)
        console.log("error", error)

        return new Response(JSON.stringify({ data: data, error: error }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        })

      } else {

        return new Response(JSON.stringify({ error: "Account already exists" }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        })
      }
    }

    return new Response(JSON.stringify({ error: "Invalid auth provider" }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }




  // Get the session or user object

  // const authHeader = req.headers.get('Authorization')!
  // const token = authHeader.replace('Bearer ', '')
  // console.log(token)
  // const { data } = await supabaseClient.auth.getUser(token)
  // console.log("data", data)
  // const user = data.user
  // return new Response(JSON.stringify({ user }), {
  //   headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  //   status: 200,
  // })
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/createAccount' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
