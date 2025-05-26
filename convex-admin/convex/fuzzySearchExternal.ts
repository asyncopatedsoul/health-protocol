"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { MeiliSearch } from "meilisearch";
import { spawn, exec } from "child_process";
import fs from "fs";
import path from "path";
import { Activity, MeiliSearchActivity } from "./fuzzySearchInternal";

// Default configuration
const DEFAULT_HOST = "http://localhost";
const DEFAULT_PORT = 7700;
const DEFAULT_INDEX = "activities";
const DEFAULT_MASTER_KEY = "4Y2pscsMeMnIeTq-7JLGnOWDIWe_stZsgiFtTCnQciY";
const DEFAULT_LOGS_DIR = path.join(process.cwd(), "logs");

// MeiliSearch client instance
let meiliSearchClient: MeiliSearch | null = null;
let meiliSearchProcess: any = null;

// Create MeiliSearch client
function getMeiliSearchClient(host: string = `${DEFAULT_HOST}:${DEFAULT_PORT}`, apiKey: string = DEFAULT_MASTER_KEY): MeiliSearch {
  if (!meiliSearchClient) {
    meiliSearchClient = new MeiliSearch({
      host,
      apiKey
    });
  }
  return meiliSearchClient;
}

// Check if MeiliSearch service is available
export const isFuzzySearchServiceAvailable = action({
  args: {
    host: v.optional(v.string()),
    apiKey: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    try {
      const client = getMeiliSearchClient(
        args.host || `${DEFAULT_HOST}:${DEFAULT_PORT}`,
        args.apiKey || DEFAULT_MASTER_KEY
      );
      
      // Check if MeiliSearch is responding
      const health = await client.health();
      return { available: health.status === "available" };
    } catch (error) {
      console.error("Error checking MeiliSearch availability:", error);
      return { available: false, error: String(error) };
    }
  }
});

// Start MeiliSearch service
export const startFuzzySearchService = action({
  args: {
    binaryPath: v.string(),
    port: v.optional(v.number()),
    masterKey: v.optional(v.string()),
    dataPath: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    try {
      // Check if service is already running
      const serviceStatus = await ctx.runAction(internal.fuzzySearchExternal.isFuzzySearchServiceAvailable, {});
      
      if (serviceStatus.available) {
        return { success: true, message: "MeiliSearch service is already running" };
      }
      
      // Prepare arguments for MeiliSearch
      const port = args.port || DEFAULT_PORT;
      const masterKey = args.masterKey || DEFAULT_MASTER_KEY;
      const dataPath = args.dataPath || path.join(process.cwd(), "meilisearch_data");
      
      // Ensure data directory exists
      if (!fs.existsSync(dataPath)) {
        fs.mkdirSync(dataPath, { recursive: true });
      }
      
      // Start MeiliSearch process
      const meiliProcess = spawn(args.binaryPath, [
        "--http-addr", `0.0.0.0:${port}`,
        "--master-key", masterKey,
        "--db-path", dataPath
      ]);
      
      meiliSearchProcess = meiliProcess;
      
      // Handle process output
      meiliProcess.stdout.on("data", (data) => {
        console.log(`MeiliSearch stdout: ${data}`);
      });
      
      meiliProcess.stderr.on("data", (data) => {
        console.error(`MeiliSearch stderr: ${data}`);
      });
      
      meiliProcess.on("close", (code) => {
        console.log(`MeiliSearch process exited with code ${code}`);
        meiliSearchProcess = null;
      });
      
      // Wait for service to become available
      let attempts = 0;
      const maxAttempts = 10;
      
      while (attempts < maxAttempts) {
        try {
          const client = getMeiliSearchClient(`http://localhost:${port}`, masterKey);
          const health = await client.health();
          
          if (health.status === "available") {
            return { 
              success: true, 
              message: `MeiliSearch service started successfully on port ${port}`,
              port
            };
          }
        } catch (error) {
          // Service not ready yet, wait and retry
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        attempts++;
      }
      
      return { 
        success: false, 
        message: "MeiliSearch service started but not responding within timeout"
      };
    } catch (error) {
      console.error("Error starting MeiliSearch service:", error);
      return { success: false, error: String(error) };
    }
  }
});

// Stop MeiliSearch service
export const stopFuzzySearchService = action({
  handler: async (ctx) => {
    try {
      if (meiliSearchProcess) {
        // Kill the process
        meiliSearchProcess.kill();
        meiliSearchProcess = null;
        meiliSearchClient = null;
        
        return { success: true, message: "MeiliSearch service stopped successfully" };
      } else {
        // Try to find and kill MeiliSearch process
        return new Promise((resolve) => {
          exec("pkill -f meilisearch", (error, stdout, stderr) => {
            if (error) {
              console.error(`Error stopping MeiliSearch: ${error}`);
              resolve({ 
                success: false, 
                message: "No running MeiliSearch process found or could not be stopped",
                error: String(error)
              });
            } else {
              meiliSearchClient = null;
              resolve({ success: true, message: "MeiliSearch service stopped successfully" });
            }
          });
        });
      }
    } catch (error) {
      console.error("Error stopping MeiliSearch service:", error);
      return { success: false, error: String(error) };
    }
  }
});

// Create and seed fuzzy search index for activities
export const createAndSeedActivitiesIndex = action({
  args: {
    host: v.optional(v.string()),
    apiKey: v.optional(v.string()),
    indexName: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    try {
      // Get MeiliSearch client
      const client = getMeiliSearchClient(
        args.host || `${DEFAULT_HOST}:${DEFAULT_PORT}`,
        args.apiKey || DEFAULT_MASTER_KEY
      );
      
      const indexName = args.indexName || DEFAULT_INDEX;
      
      // Get all activities from Convex
      const activities = await ctx.runQuery(internal.fuzzySearchInternal.getAllActivities);
      
      if (!activities || activities.length === 0) {
        return { 
          success: false, 
          message: "No activities found in Convex database"
        };
      }
      
      // Convert activities to MeiliSearch documents
      const documents = activities.map(activity => ({
        id: activity._id.toString(),
        name: activity.name,
        description: activity.description,
        category: activity.category,
        muscleGroups: activity.muscleGroups,
        equipment: activity.equipment
      }));
      
      // Ensure logs directory exists
      const logsDir = DEFAULT_LOGS_DIR;
      if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
      }
      
      // Save to JSONL file
      const filePath = path.join(logsDir, "fuzzySearchActivities.jsonl");
      const jsonlContent = documents.map(doc => JSON.stringify(doc)).join("\n");
      fs.writeFileSync(filePath, jsonlContent);
      
      // Create or get index
      const index = client.index(indexName);
      
      // Configure index settings
      await index.updateSettings({
        searchableAttributes: [
          "name",
          "description",
          "category",
          "muscleGroups",
          "equipment"
        ],
        sortableAttributes: ["name"],
        filterableAttributes: ["category", "muscleGroups", "equipment"],
        rankingRules: [
          "words",
          "typo",
          "proximity",
          "attribute",
          "sort",
          "exactness"
        ]
      });
      
      // Add documents to index
      const task = await index.addDocuments(documents);
      
      return { 
        success: true, 
        message: `Created and seeded ${indexName} index with ${documents.length} activities`,
        taskUid: task.taskUid,
        filePath
      };
    } catch (error) {
      console.error("Error creating and seeding activities index:", error);
      return { success: false, error: String(error) };
    }
  }
});

// Add activities to fuzzy search index
export const addActivitiesToIndex = action({
  args: {
    activities: v.array(v.any()),
    host: v.optional(v.string()),
    apiKey: v.optional(v.string()),
    indexName: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    try {
      // Get MeiliSearch client
      const client = getMeiliSearchClient(
        args.host || `${DEFAULT_HOST}:${DEFAULT_PORT}`,
        args.apiKey || DEFAULT_MASTER_KEY
      );
      
      const indexName = args.indexName || DEFAULT_INDEX;
      const index = client.index(indexName);
      
      // Convert activities to MeiliSearch documents
      const documents = args.activities.map(activity => ({
        id: activity._id.toString(),
        name: activity.name,
        description: activity.description,
        category: activity.category,
        muscleGroups: activity.muscleGroups,
        equipment: activity.equipment
      }));
      
      // Add documents to index
      const task = await index.addDocuments(documents);
      
      return { 
        success: true, 
        message: `Added ${documents.length} activities to ${indexName} index`,
        taskUid: task.taskUid
      };
    } catch (error) {
      console.error("Error adding activities to index:", error);
      return { success: false, error: String(error) };
    }
  }
});

// Remove activities from fuzzy search index
export const removeActivitiesFromIndex = action({
  args: {
    activityIds: v.array(v.string()),
    host: v.optional(v.string()),
    apiKey: v.optional(v.string()),
    indexName: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    try {
      // Get MeiliSearch client
      const client = getMeiliSearchClient(
        args.host || `${DEFAULT_HOST}:${DEFAULT_PORT}`,
        args.apiKey || DEFAULT_MASTER_KEY
      );
      
      const indexName = args.indexName || DEFAULT_INDEX;
      const index = client.index(indexName);
      
      // Remove documents from index
      const task = await index.deleteDocuments(args.activityIds);
      
      return { 
        success: true, 
        message: `Removed ${args.activityIds.length} activities from ${indexName} index`,
        taskUid: task.taskUid
      };
    } catch (error) {
      console.error("Error removing activities from index:", error);
      return { success: false, error: String(error) };
    }
  }
});

// Search for activities in fuzzy search index
export const searchActivities = action({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
    showRankingScore: v.optional(v.boolean()),
    filter: v.optional(v.string()),
    host: v.optional(v.string()),
    apiKey: v.optional(v.string()),
    indexName: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    try {
      // Get MeiliSearch client
      const client = getMeiliSearchClient(
        args.host || `${DEFAULT_HOST}:${DEFAULT_PORT}`,
        args.apiKey || DEFAULT_MASTER_KEY
      );
      
      const indexName = args.indexName || DEFAULT_INDEX;
      const index = client.index(indexName);
      
      // Prepare search options
      const searchOptions: any = {
        limit: args.limit || 10
      };
      
      if (args.filter) {
        searchOptions.filter = args.filter;
      }
      
      if (args.showRankingScore) {
        searchOptions.showRankingScore = true;
      }
      
      // Search for activities
      const searchResults = await index.search(args.query, searchOptions);
      
      // Get activity details from Convex for each result
      const activities = [];
      for (const hit of searchResults.hits) {
        try {
          const activity = await ctx.runQuery(internal.fuzzySearchInternal.getActivityById, {
            activityId: hit.id as any
          });
          
          if (activity) {
            activities.push({
              ...activity,
              _rankingScore: hit._rankingScore
            });
          }
        } catch (error) {
          console.error(`Error fetching activity ${hit.id}:`, error);
        }
      }
      
      return { 
        success: true,
        query: args.query,
        activities,
        totalHits: searchResults.estimatedTotalHits,
        processingTimeMs: searchResults.processingTimeMs
      };
    } catch (error) {
      console.error("Error searching activities:", error);
      return { success: false, error: String(error) };
    }
  }
});

// Fuzzy match activity name
export const fuzzyMatchActivityName = action({
  args: {
    name: v.string(),
    threshold: v.optional(v.number()),
    host: v.optional(v.string()),
    apiKey: v.optional(v.string()),
    indexName: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    try {
      // First check if MeiliSearch is available
      const serviceStatus = await ctx.runAction(internal.fuzzySearchExternal.isFuzzySearchServiceAvailable, {
        host: args.host,
        apiKey: args.apiKey
      });
      
      if (!serviceStatus.available) {
        // Fall back to basic search if MeiliSearch is not available
        console.log("MeiliSearch not available, falling back to basic search");
        const activities = await ctx.runQuery(internal.fuzzySearchInternal.findActivitiesByName, {
          name: args.name,
          limit: 1
        });
        
        if (activities && activities.length > 0) {
          return {
            success: true,
            matched: true,
            activity: activities[0],
            fuzzyServiceAvailable: false
          };
        }
        
        return {
          success: true,
          matched: false,
          fuzzyServiceAvailable: false
        };
      }
      
      // Use MeiliSearch for fuzzy matching
      const searchResults = await ctx.runAction(internal.fuzzySearchExternal.searchActivities, {
        query: args.name,
        limit: 1,
        showRankingScore: true,
        host: args.host,
        apiKey: args.apiKey,
        indexName: args.indexName
      });
      
      if (!searchResults.success || !searchResults.activities || searchResults.activities.length === 0) {
        return {
          success: true,
          matched: false,
          fuzzyServiceAvailable: true
        };
      }
      
      const bestMatch = searchResults.activities[0];
      const threshold = args.threshold || 0.7; // Default threshold
      
      // Check if the match is good enough based on ranking score
      // Note: This is a simplified approach and may need adjustment
      const isGoodMatch = bestMatch._rankingScore > threshold;
      
      return {
        success: true,
        matched: isGoodMatch,
        activity: isGoodMatch ? bestMatch : null,
        score: bestMatch._rankingScore,
        fuzzyServiceAvailable: true
      };
    } catch (error) {
      console.error("Error fuzzy matching activity name:", error);
      return { success: false, error: String(error) };
    }
  }
});

// Find or create activity by name
export const findOrCreateActivityByName = action({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    muscleGroups: v.optional(v.array(v.string())),
    equipment: v.optional(v.array(v.string())),
    threshold: v.optional(v.number()),
    host: v.optional(v.string()),
    apiKey: v.optional(v.string()),
    indexName: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    try {
      // Try to find a matching activity
      const matchResult = await ctx.runAction(internal.fuzzySearchExternal.fuzzyMatchActivityName, {
        name: args.name,
        threshold: args.threshold,
        host: args.host,
        apiKey: args.apiKey,
        indexName: args.indexName
      });
      
      if (matchResult.success && matchResult.matched && matchResult.activity) {
        return {
          success: true,
          activity: matchResult.activity,
          created: false,
          message: "Found existing activity"
        };
      }
      
      // Create a new activity
      const newActivity = await ctx.runMutation(internal.fuzzySearchInternal.createActivity, {
        name: args.name,
        description: args.description,
        category: args.category,
        muscleGroups: args.muscleGroups,
        equipment: args.equipment
      });
      
      // Add the new activity to the search index if the service is available
      if (matchResult.fuzzyServiceAvailable) {
        await ctx.runAction(internal.fuzzySearchExternal.addActivitiesToIndex, {
          activities: [newActivity],
          host: args.host,
          apiKey: args.apiKey,
          indexName: args.indexName
        });
      }
      
      return {
        success: true,
        activity: newActivity,
        created: true,
        message: "Created new activity"
      };
    } catch (error) {
      console.error("Error finding or creating activity:", error);
      return { success: false, error: String(error) };
    }
  }
});
