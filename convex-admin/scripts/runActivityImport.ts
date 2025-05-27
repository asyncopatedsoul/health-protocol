#!/usr/bin/env tsx
// scripts/runActivityImport.ts
import { ConvexHttpClient } from 'convex/browser';
import { internal, api } from '../convex/_generated/api'; // If you need to call internal functions
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function main() {
    // Check for required environment variables
    const convexUrl = process.env.VITE_CONVEX_URL;
    // const supabaseUrl = process.env.SUPABASE_URL;
    // const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!convexUrl) {
        console.error('❌ VITE_CONVEX_URL environment variable not set');
        process.exit(1);
    }

    // if (!supabaseUrl || !supabaseKey) {
    //     console.error('❌ Supabase environment variables not set. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    //     process.exit(1);
    // }

    // Create logs directory if it doesn't exist
    const logsDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
    }

    // Initialize Convex client
    const client = new ConvexHttpClient(convexUrl);
    console.log(`🔌 Connected to Convex at ${convexUrl}`);

    try {
        // Get command line arguments
        const args = process.argv.slice(2);
        const noteId = args[0];

        if (!noteId) {
            console.error('❌ Note ID not provided');
            process.exit(1);
        }

        const result = await client.action(api.activityImport.processNoteActivities, {
            noteId
        });

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
    