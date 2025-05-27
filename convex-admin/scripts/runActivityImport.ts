#!/usr/bin/env tsx
// scripts/runActivityImport.ts
import { ConvexHttpClient } from 'convex/browser';
import { internal, api } from '../convex/_generated/api';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function main() {
    // Parse command line arguments using yargs
    const argv = yargs(hideBin(process.argv))
        .option('noteId', {
            describe: 'ID of a specific note to process',
            type: 'string',
        })
        .option('userId', {
            describe: 'User ID to bulk import notes for',
            type: 'string',
        })
        .option('supabaseUserId', {
            describe: 'Supabase User ID to bulk import notes for',
            type: 'string',
        })
        .option('tokenId', {
            describe: 'Token ID to bulk import notes for',
            type: 'string',
        })
        .option('email', {
            describe: 'Email to bulk import notes for',
            type: 'string',
        })
        .option('startDate', {
            describe: 'Start date for notes (timestamp in ms)',
            type: 'number',
        })
        .option('endDate', {
            describe: 'End date for notes (timestamp in ms)',
            type: 'number',
        })
        .option('importBy', {
            describe: 'Field to use for filtering notes (createdAtMs or lastSavedMs)',
            choices: ['createdAtMs', 'lastSavedMs'],
            default: 'createdAtMs',
        })
        .option('skipDuplicates', {
            describe: 'Whether to skip duplicate events',
            type: 'boolean',
        })
        .help()
        .alias('help', 'h')
        .argv;

    // Check for required environment variables
    const convexUrl = process.env.VITE_CONVEX_URL;

    if (!convexUrl) {
        console.error('❌ VITE_CONVEX_URL environment variable not set');
        process.exit(1);
    }

    // Create logs directory if it doesn't exist
    const logsDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
    }

    // Initialize Convex client
    const client = new ConvexHttpClient(convexUrl);
    console.log(`🔌 Connected to Convex at ${convexUrl}`);

    try {
        let result;

        // Check if we're processing a single note or doing bulk import
        if (argv.noteId) {
            console.log(`🔍 Processing note with ID: ${argv.noteId}`);
            result = await client.action(api.activityImport.processNoteActivities, {
                noteId: argv.noteId,
                skipDuplicates: argv.skipDuplicates,
            });
        } else if (argv.userId || argv.supabaseUserId || argv.tokenId || argv.email) {
            console.log('🔍 Bulk importing notes for user');
            result = await client.action(api.activityImport.bulkImportNotes, {
                userId: argv.userId,
                supabaseUserId: argv.supabaseUserId,
                tokenId: argv.tokenId,
                email: argv.email,
                startDate: argv.startDate,
                endDate: argv.endDate,
                importBy: argv.importBy,
                skipDuplicates: argv.skipDuplicates,
            });
        } else {
            console.error('❌ No note ID or user identifier provided');
            console.log('Usage examples:');
            console.log('  npm run import:note -- --noteId=<noteId>');
            console.log('  npm run import:note -- --userId=<userId> --startDate=<timestamp> --endDate=<timestamp>');
            console.log('  npm run import:note -- --email=<email> --importBy=lastSavedMs --skipDuplicates=false');
            process.exit(1);
        }

        console.log('✅ Activity import completed!');
        console.log(result);

    } catch (error) {
        console.error('Error running activity import:', error);
        process.exit(1);
    }
}

main().catch(error => {
    console.error('Error running activity import:', error);
    process.exit(1);
});
    