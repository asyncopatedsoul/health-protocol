# Supabase Local Development

https://supabase.com/docs/guides/local-development/cli/getting-started

brew install supabase/tap/supabase

supabase link --project-ref <PROJECT ID>

supabase start
supabase stop

docker kill $(docker ps -q)

## Supabase Cloud Functions

https://supabase.com/docs/reference/cli/supabase-functions-serve

supabase functions new createAccount
supabase functions list --project-ref <PROJECT ID>
supabase functions download <Function name> --project-ref
supabase functions serve --inspect --env-file <string>
supabase functions deploy [Function name] [flags] --project-ref

## Supabase Database

supabase db dump -f supabase/schema.sql
supabase db dump -f supabase/data.sql --data-only

supabase db reset --local

in database client:
- run schema.sql
- run data.sql

local supabase studio
http://127.0.0.1:54323