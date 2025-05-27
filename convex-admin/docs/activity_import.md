# Activity Import Process

## Overview

The activity import process extracts activities from notes and creates events for them. The process includes:

1. Date extraction from note content
2. Activity matching or creation
3. Event creation with proper timestamps
4. Duplicate handling
5. Bulk importing of notes for a user

## Prerequisites

1. Run the Convex backend:
```bash
npm run dev:backend
```

2. (Optional) Run the Convex dashboard to view data:
```bash
npm run dev:dashboard
```

## Usage

### Process a Single Note

To process a single note, use the following command with the note ID:

```bash
npm run import:note -- --noteId=<noteId>
```

Example:
```bash
npm run import:note -- --noteId=kn7009x045hp1y64aq0n38bdvs7gnzhp
```

You can also specify whether to skip duplicates:
```bash
npm run import:note -- --noteId=<noteId> --skipDuplicates=false
```

### Bulk Import Notes for a User

You can bulk import all notes for a user using various identifiers:

```bash
# By User ID
npm run import:note -- --userId=<userId>

# By Supabase User ID
npm run import:note -- --supabaseUserId=<supabaseUserId>

# By Token ID
npm run import:note -- --tokenId=<tokenId>

# By Email
npm run import:note -- --email=<email>
```

### Additional Options

- **Date Range**: Specify a date range for notes to process
```bash
npm run import:note -- --userId=<userId> --startDate=<timestamp> --endDate=<timestamp>
```

- **Import By**: Choose which timestamp field to use for filtering (createdAtMs or lastSavedMs)
```bash
npm run import:note -- --userId=<userId> --importBy=lastSavedMs
```

- **Skip Duplicates**: Control whether to skip duplicate events (defaults to true for createdAtMs and false for lastSavedMs)
```bash
npm run import:note -- --userId=<userId> --skipDuplicates=false
```

## Date Extraction

The process automatically extracts dates from note content in the format `YYYY-MM-DD` at the beginning of the content, with optional time in `HH:MM` or `HH:MM AM/PM` format. The extracted date is used to set the activity timestamp for events.