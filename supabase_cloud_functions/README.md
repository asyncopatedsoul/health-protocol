https://supabase.com/docs/guides/local-development/cli/getting-started

brew install supabase/tap/supabase

supabase link --project-ref cqyxglfnwcdaswovbosz

supabase start
supabase stop

docker kill $(docker ps -q)

https://supabase.com/docs/reference/cli/supabase-functions-serve

supabase functions new createAccount
supabase functions list --project-ref cqyxglfnwcdaswovbosz
supabase functions download <Function name> --project-ref
supabase functions serve --inspect --env-file <string>
supabase functions deploy [Function name] [flags] --project-ref