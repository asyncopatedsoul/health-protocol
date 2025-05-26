#!/usr/bin/env tsx
// scripts/runActivitySnapshot.ts
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
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!convexUrl) {
        console.error('❌ VITE_CONVEX_URL environment variable not set');
        process.exit(1);
    }
    
    if (!supabaseUrl || !supabaseKey) {
        console.error('❌ Supabase environment variables not set. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
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
        // Get command line arguments
        const args = process.argv.slice(2);
        const tableName = args[0] || 'notes';
        const bucketName = args[1] || 'snapshots';
        
        console.log(`🚀 Starting activity snapshot process...`);
        console.log(`📋 Fetching data from table: ${tableName}`);
        console.log(`📦 Using storage bucket: ${bucketName}`);
        
        // Run the activity snapshot process
        const result = await client.action(api.remoteSourceSupabase.createActivitySnapshot, {
            tableName,
            bucketName
        });

        // Log the results
        console.log('✅ Snapshot process completed!');
        console.log(`📁 Created ${result.storageIds.length} snapshots in Convex storage`);
        console.log(`☁️ Uploaded ${result.uploadedFiles.length} files to Supabase storage`);
        
        // Write results to log file
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const logFile = path.join(logsDir, `snapshot_${timestamp}.log`);
        fs.writeFileSync(logFile, JSON.stringify(result, null, 2));
        console.log(`📝 Results saved to ${logFile}`);
    } catch (error) {
        console.error('❌ Error running activity snapshot:', error);
        process.exit(1);
    }
}

main();