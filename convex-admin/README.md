# run with local convex from repo
https://github.com/get-convex/convex-backend/blob/main/Justfile
https://github.com/get-convex/convex-backend/blob/main/BUILD.md#running-the-convex-backend

Start development server
```
cd convex-admin

npx convex dev --admin-key 0135d8598650f8f5cb0f30c34ec2e2bb62793bc28717c8eb6fb577996d50be5f4281b59181095065c5d0f86a2c31ddbe9b597ec62b47ded69782cd --url "http://127.0.0.1:3210"
```

https://github.com/get-convex/convex-backend/blob/main/Justfile
# import sample data

npx convex import --table users sample_data/users.jsonl --admin-key 0135d8598650f8f5cb0f30c34ec2e2bb62793bc28717c8eb6fb577996d50be5f4281b59181095065c5d0f86a2c31ddbe9b597ec62b47ded69782cd --url "http://127.0.0.1:3210"

npx convex import --table protocols sample_data/protocols.jsonl --admin-key 0135d8598650f8f5cb0f30c34ec2e2bb62793bc28717c8eb6fb577996d50be5f4281b59181095065c5d0f86a2c31ddbe9b597ec62b47ded69782cd --url "http://127.0.0.1:3210"

npx convex import --table programs sample_data/programs.jsonl --admin-key 0135d8598650f8f5cb0f30c34ec2e2bb62793bc28717c8eb6fb577996d50be5f4281b59181095065c5d0f86a2c31ddbe9b597ec62b47ded69782cd --url "http://127.0.0.1:3210"

npx convex import --table activities sample_data/activities.jsonl --admin-key 0135d8598650f8f5cb0f30c34ec2e2bb62793bc28717c8eb6fb577996d50be5f4281b59181095065c5d0f86a2c31ddbe9b597ec62b47ded69782cd --url "http://127.0.0.1:3210"

npx convex import --table guides sample_data/guides.jsonl --admin-key 0135d8598650f8f5cb0f30c34ec2e2bb62793bc28717c8eb6fb577996d50be5f4281b59181095065c5d0f86a2c31ddbe9b597ec62b47ded69782cd --url "http://127.0.0.1:3210"


npx convex import --table accounts sample_data/accounts.jsonl --admin-key 0135d8598650f8f5cb0f30c34ec2e2bb62793bc28717c8eb6fb577996d50be5f4281b59181095065c5d0f86a2c31ddbe9b597ec62b47ded69782cd --url "http://127.0.0.1:3210"

npx convex import --table profiles sample_data/profiles.jsonl --admin-key 0135d8598650f8f5cb0f30c34ec2e2bb62793bc28717c8eb6fb577996d50be5f4281b59181095065c5d0f86a2c31ddbe9b597ec62b47ded69782cd --url "http://127.0.0.1:3210"




npx convex import --table tasks sample_data/tasks.jsonl --admin-key 0135d8598650f8f5cb0f30c34ec2e2bb62793bc28717c8eb6fb577996d50be5f4281b59181095065c5d0f86a2c31ddbe9b597ec62b47ded69782cd --url "http://127.0.0.1:3210"

local dashboard 
http://localhost:6790/

# export sample data
npx convex export --path ~/Downloads --admin-key 0135d8598650f8f5cb0f30c34ec2e2bb62793bc28717c8eb6fb577996d50be5f4281b59181095065c5d0f86a2c31ddbe9b597ec62b47ded69782cd --url "http://127.0.0.1:3210"

# data management
https://docs.convex.dev/database/schemas
https://docs.convex.dev/database/import-export/import

## Supabase Integration

This project includes integration with Supabase for fetching remote user activity data and creating activity snapshots.

### Setup

1. Create a `.env.local` file based on the `.env.example` template:
   ```
   cp .env.example .env.local
   ```

2. Add your Supabase credentials to the `.env.local` file:
   ```
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

### Activity Snapshots

The application can fetch user activity data from Supabase and create snapshots as CSV files. These snapshots are stored in both Convex storage and Supabase storage.

#### Running Activity Snapshots

Use the provided npm script to run activity snapshots:

```bash
npm run snapshot:activity
```

You can also specify custom table and bucket names:

```bash
npm run snapshot:activity -- custom_table_name custom_bucket_name
```

#### API Functions

The following API functions are available for working with Supabase:

- `fetchRemoteUserActivity`: Fetches user activity data from a specified Supabase table
- `saveRemoteUserActivitySnapshot`: Saves user activity data as CSV files in Convex storage
- `createActivitySnapshot`: Combines the above functions to create and store activity snapshots
- `getLastSnapshotStatus`: Checks the status of the last snapshot
- `getSnapshotContent`: Retrieves the content of a snapshot by its storage ID