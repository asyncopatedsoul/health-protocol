#!/usr/bin/env tsx
// scripts/runActivitySnapshot.ts
import { ConvexHttpClient } from 'convex/browser';
import { internal, api } from '../convex/_generated/api'; // If you need to call internal functions
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

function serializeBigInt(key: string, value: any): any {
    // Check if the value is a BigInt
    if (typeof value === 'bigint') {
        // Convert BigInt to its string representation
        return value.toString();
    }
    // For all other types, return the value as is
    return value;
}

function serializeBigIntForJson(key: string, value: any): any {
    if (typeof value === 'bigint') {
        // Convert BigInt to its string representation, then remove the 'n'
        // This assumes the BigInt string format is always just the number followed by 'n'
        return value.toString().slice(0, -1);
    }
    return value;
}

// Or simply:
function serializeBigIntClean(key: string, value: any): any {
    if (typeof value === 'bigint') {
        // You could also parse it as a string from the start if it came from a database
        // that returned it as a string, or explicitly convert it if it's an actual BigInt.
        return `${value}`; // Template literal conversion also removes the 'n' for serialization
    }
    return value;
}

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
        const createConvexRecords = args[2] === '--create-convex-records' || args.includes('--create-convex-records');

        console.log(`🚀 Starting activity snapshot process...`);
        console.log(`📋 Fetching data from table: ${tableName}`);
        console.log(`📦 Using storage bucket: ${bucketName}`);
        if (createConvexRecords) {
            console.log(`🔄 Will create Convex records from Supabase data`);
        }

        // Run the activity snapshot process
        const result = await client.action(api.remoteSourceSupabase.createActivitySnapshot, {
            tableName,
            bucketName,
            createConvexRecords
        });

        // Log the results
        console.log('✅ Snapshot process completed!');
        console.log(`📁 Created ${result.storageIds.length} snapshots in Convex storage`);
        console.log(`☁️ Uploaded ${result.uploadedFiles.length} files to Supabase storage`);

        // Write results to log file
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const logFile = path.join(logsDir, `snapshot_${timestamp}.log`);
        fs.writeFileSync(logFile, JSON.stringify(result, serializeBigIntClean, 2));
        console.log(`📝 Results saved to ${logFile}`);
    } catch (error) {
        console.error('❌ Error running activity snapshot:', error);
        process.exit(1);
    }
}

main();