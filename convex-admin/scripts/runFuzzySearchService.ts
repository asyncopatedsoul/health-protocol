#!/usr/bin/env tsx

import { ConvexClient } from 'convex/browser';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { api } from '../convex/_generated/api';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

async function main() {
  // Check for required environment variables
  const convexUrl = process.env.VITE_CONVEX_URL;
  
  if (!convexUrl) {
    console.error('❌ VITE_CONVEX_URL environment variable not set');
    process.exit(1);
  }
  
  try {
    // Get command line arguments
    const args = process.argv.slice(2);
    const command = args[0] || 'status';
    const indexName = args[1] || process.env.MEILI_INDEX_NAME || 'activities';
    const binaryPath = args[2] || process.env.MEILI_BINARY_PATH || '/usr/local/bin/meilisearch';
    const port = parseInt(args[3] || process.env.MEILI_PORT || '7700', 10);
    
    
    // Create Convex client
    console.log(`🔌 Connecting to Convex at ${convexUrl}`);
    const client = new ConvexClient(convexUrl);
    // await client.sync();
    console.log('✅ Connected to Convex');
    
    // Execute the requested command
    switch (command) {
      case 'status':
        await checkStatus(client, port);
        break;
      case 'start':
        await startService(client, binaryPath, port);
        break;
      case 'stop':
        await stopService(client);
        break;
      case 'seed':
        await seedIndex(client, port);
        break;
      case 'search':
        if (args.length < 2) {
          console.error('❌ Search query is required');
          console.log('Usage: npm run fuzzy-search search "your query"');
          process.exit(1);
        }
        await searchActivities(client, args[1], port, indexName);
        break;
      default:
        console.error(`❌ Unknown command: ${command}`);
        console.log('Available commands: status, start, stop, seed, search');
        process.exit(1);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error running fuzzy search service:', error);
    process.exit(1);
  }
}

async function checkStatus(client: ConvexClient, port: number) {
  console.log('🔍 Checking fuzzy search service status...');
  
  const result = await client.action(api.fuzzySearchExternal.isFuzzySearchServiceAvailable, {
    host: `http://localhost:${port}`
  });
  
  if (result.available) {
    console.log('✅ Fuzzy search service is available');
  } else {
    console.log('❌ Fuzzy search service is not available');
    if (result.error) {
      console.log(`Error: ${result.error}`);
    }
  }
  
  return result;
}

async function startService(client: ConvexClient, binaryPath: string, port: number) {
  console.log('🚀 Starting fuzzy search service...');
  
  // Check if service is already running
  const status = await checkStatus(client, port);
  
  if (status.available) {
    console.log('✅ Fuzzy search service is already running');
    return;
  }
  
  // Check if binary exists
  if (!fs.existsSync(binaryPath)) {
    console.error(`❌ MeiliSearch binary not found at ${binaryPath}`);
    console.log('Please install MeiliSearch or provide the correct path');
    process.exit(1);
  }
  
  // Start the service
  const result = await client.action(api.fuzzySearchExternal.startFuzzySearchService, {
    binaryPath,
    port,
    dataPath: path.join(process.cwd(), 'meilisearch_data')
  });
  
  if (result.success) {
    console.log(`✅ ${result.message}`);
  } else {
    console.error(`❌ Failed to start fuzzy search service: ${result.error || result.message}`);
  }
}

async function stopService(client: ConvexClient) {
  console.log('🛑 Stopping fuzzy search service...');
  
  const result = await client.action(api.fuzzySearchExternal.stopFuzzySearchService, {});
  
  if (result.success) {
    console.log(`✅ ${result.message}`);
  } else {
    console.error(`❌ Failed to stop fuzzy search service: ${result.error || result.message}`);
  }
}

async function seedIndex(client: ConvexClient, port: number, indexName: string) {
  console.log('🌱 Seeding fuzzy search index with activities...');
  
  // Check if service is running
  const status = await checkStatus(client, port);
  
  if (!status.available) {
    console.error('❌ Fuzzy search service is not available. Please start it first.');
    return;
  }
  
  // Seed the index
  const result = await client.action(api.fuzzySearchExternal.createAndSeedActivitiesIndex, {
    host: `http://localhost:${port}`,
    indexName
  });
  
  if (result.success) {
    console.log(`✅ ${result.message}`);
    if (result.filePath) {
      console.log(`📄 Activities saved to ${result.filePath}`);
    }
  } else {
    console.error(`❌ Failed to seed activities index: ${result.error || result.message}`);
  }
}

async function searchActivities(client: ConvexClient, query: string, port: number, indexName: string) {
  console.log(`🔎 Searching for activities matching "${query}"...`);
  
  // Check if service is running
  const status = await checkStatus(client, port);
  
  if (!status.available) {
    console.error('❌ Fuzzy search service is not available. Please start it first.');
    return;
  }
  
  // Search for activities
  const result = await client.action(api.fuzzySearchExternal.searchActivities, {
    query,
    showRankingScore: true,
    limit: 10,
    host: `http://localhost:${port}`,
    indexName: indexName
  });
  
  if (result.success) {
    console.log(`✅ Found ${result.activities.length} activities in ${result.processingTimeMs}ms`);
    
    if (result.activities.length > 0) {
      console.log('\nResults:');
      result.activities.forEach((activity, index) => {
        console.log(`\n${index + 1}. ${activity.name}`);
        if (activity.description) {
          console.log(`   Description: ${activity.description}`);
        }
        if (activity._rankingScore) {
          console.log(`   Score: ${activity._rankingScore.toFixed(4)}`);
        }
        if (activity.category) {
          console.log(`   Category: ${activity.category}`);
        }
        if (activity.muscleGroups && activity.muscleGroups.length > 0) {
          console.log(`   Muscle Groups: ${activity.muscleGroups.join(', ')}`);
        }
        if (activity.equipment && activity.equipment.length > 0) {
          console.log(`   Equipment: ${activity.equipment.join(', ')}`);
        }
      });
    } else {
      console.log('No activities found matching your query');
    }
  } else {
    console.error(`❌ Failed to search activities: ${result.error}`);
  }
}

main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
