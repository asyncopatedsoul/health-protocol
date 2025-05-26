"use node"
// libraries only available in node runtime
import fs from 'fs';
import path from 'path';
import { randomBytes } from 'crypto';

import { createClient } from '@supabase/supabase-js';
import { v } from 'convex/values';
import { action } from './_generated/server';
import { internal } from './_generated/api';
import { Id } from './_generated/dataModel';
import { UserActivity, SupabaseUser, SNAPSHOTS_TABLE } from './remoteUserActivity';
// Types and constants are now imported from remoteUserActivity.ts

// Initialize Supabase client
export const createSupabaseClient = () => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase URL or Service Role Key');
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
};

// Fetch user activity from Supabase
export const fetchRemoteUserActivity = async (
  supabaseClient: any,
  tableName: string = 'notes'
): Promise<{ activities: UserActivity[], users: Record<string, SupabaseUser> }> => {
  console.log(`Fetching user activities from ${tableName} table`);
  
  // Fetch activities from the specified table
  const { data: activities, error } = await supabaseClient
    .from(tableName)
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching activities:', error);
    throw new Error(`Error fetching activities: ${error.message}`);
  }

  console.log(`Found ${activities?.length || 0} activities`);

  // Extract unique user IDs from activities
  const userIds = [...new Set(activities?.map((a: any) => a.user_id) || [])];
  console.log(`Found ${userIds.length} unique users`);

  // Fetch user details from Supabase Auth
  const { data: usersData, error: userError } = await supabaseClient.auth.admin.listUsers();
  
  if (userError) {
    console.error('Error fetching users:', userError);
    throw new Error(`Error fetching users: ${userError.message}`);
  }

  // Create a map of user IDs to user objects
  const userMap: Record<string, SupabaseUser> = {};
  usersData.users.forEach((user: any) => {
    userMap[user.id] = user;
  });

  return {
    activities: activities || [],
    users: userMap
  };
};

// Save activity snapshots and upload to Supabase Storage
export const saveRemoteUserActivitySnapshot = async (
  ctx: { runAction: Function, runMutation: Function },
  supabaseClient: any,
  activities: UserActivity[],
  users: Record<string, SupabaseUser>,
  bucketName: string = 'activity-snapshots'
): Promise<{ storageIds: string[], uploadedFiles: string[] }> => {
  console.log(`Saving ${activities.length} activities to snapshots`);
  
  // Group activities by user
  const userActivities: Record<string, UserActivity[]> = {};
  
  activities.forEach(activity => {
    const userId = activity.user_id;
    if (!userActivities[userId]) {
      userActivities[userId] = [];
    }
    userActivities[userId].push(activity);
  });
  
  const storageIds: string[] = [];
  const uploadedFiles: string[] = [];
  
  // Check if bucket exists, create it if it doesn't
  const { data: buckets } = await supabaseClient.storage.listBuckets();
  const bucketExists = buckets?.some(bucket => bucket.name === bucketName);
  
  if (!bucketExists) {
    console.log(`Creating bucket: ${bucketName}`);
    await supabaseClient.storage.createBucket(bucketName, {
      public: false
    });
  }
  
  // Process each user's activities
  for (const userId in userActivities) {
    const userActivity = userActivities[userId];
    const user = users[userId] || { id: userId, email: 'unknown' };
    
    // Create CSV content
    const headers = Object.keys(userActivity[0]).join(',');
    const rows = userActivity.map(activity => {
      return Object.values(activity).map(value => {
        // Handle values with commas by wrapping in quotes
        if (typeof value === 'string' && value.includes(',')) {
          return `"${value}"`;
        }
        return value;
      }).join(',');
    });
    
    const csvRows = [headers, ...rows].join('\n');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `${userId}_${timestamp}.csv`;
    
    try {
      // Store in Convex storage using the internal action
      const storageResult = await ctx.runAction(internal.remoteUserActivity.saveActivityToStorage, {
        csvContent: csvRows,
        fileName: fileName
      });
      
      storageIds.push(storageResult.storageId);
      
      // Upload to Supabase storage
      const { data, error } = await supabaseClient.storage
        .from(bucketName)
        .upload(fileName, new Blob([csvRows], { type: 'text/csv' }));
      
      if (error) {
        console.error(`Error uploading ${fileName} to Supabase:`, error);
      } else {
        console.log(`Uploaded ${fileName} to Supabase bucket ${bucketName}`);
        uploadedFiles.push(fileName);
        
        // Store metadata in Convex database
        await ctx.runMutation(internal.remoteUserActivity.storeActivitySnapshot, {
          userId: userId,
          fileName: fileName,
          storageId: storageResult.storageId,
          recordCount: userActivity.length,
          uploadedToSupabase: true
        });
      }
    } catch (error) {
      console.error(`Error processing snapshot for user ${userId}:`, error);
    }
  }
  
  return { storageIds, uploadedFiles };
};

// Convex API functions
export const fetchUserActivity = action({
  args: {
    tableName: v.optional(v.string()),
    createConvexRecords: v.optional(v.boolean())
  },
  handler: async (ctx, args) => {
    const supabase = createSupabaseClient();
    const result = await fetchRemoteUserActivity(supabase, args.tableName);
    
    // If createConvexRecords is true, create users and notes in Convex database
    if (args.createConvexRecords) {
      console.log('Creating Convex records from Supabase data...');
      const processResult = await ctx.runAction(internal.remoteUserActivity.processSupabaseData, {
        activities: result.activities,
        users: result.users
      });
      
      return {
        ...result,
        convexRecords: processResult
      };
    }
    
    return result;
  }
});

export const createActivitySnapshot = action({
  args: {
    tableName: v.optional(v.string()),
    bucketName: v.optional(v.string()),
    createConvexRecords: v.optional(v.boolean())
  },
  handler: async (ctx, args) => {
    try {
      console.log('Starting activity snapshot process...');
      
      // Create Supabase client
      const supabase = createSupabaseClient();
      
      // Fetch user activities from Supabase
      console.log(`Fetching activities from ${args.tableName || 'notes'} table`);
      const { activities, users } = await fetchRemoteUserActivity(supabase, args.tableName);
      
      if (!activities || activities.length === 0) {
        console.log('No activities found to snapshot');
        return { storageIds: [], uploadedFiles: [] };
      }
      
      console.log(`Found ${activities.length} activities for ${Object.keys(users).length} users`);
      
      // Create Convex records if requested
      let convexRecords = null;
      if (args.createConvexRecords) {
        console.log('Creating Convex records from Supabase data...');
        convexRecords = await ctx.runAction(internal.remoteUserActivity.processSupabaseData, {
          activities,
          users
        });
        console.log(`Created ${convexRecords.users.length} users and ${convexRecords.notes.length} notes in Convex`);
      }
      
      // Save snapshots and upload to Supabase
      const snapshotResult = await saveRemoteUserActivitySnapshot(
        ctx,
        supabase, 
        activities, 
        users, 
        args.bucketName
      );
      
      return {
        ...snapshotResult,
        convexRecords: convexRecords || { users: [], notes: [] }
      };
    } catch (error) {
      console.error('Error creating activity snapshot:', error);
      throw error;
    }
  }
});

// Wrapper functions that call the internal functions from remoteUserActivity.ts

// Get the status of the last snapshot
export const getLastSnapshotStatus = action({
  args: {
    userId: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    return await ctx.runQuery(internal.remoteUserActivity.getLastSnapshotStatus, {
      userId: args.userId
    });
  }
});

// Get the content of a snapshot by its storage ID
export const getSnapshotContent = action({
  args: {
    storageId: v.string()
  },
  handler: async (ctx, args) => {
    return await ctx.runQuery(internal.remoteUserActivity.getSnapshotContent, {
      storageId: args.storageId
    });
  }
});

// List all snapshots
export const listSnapshots = action({
  args: {
    userId: v.optional(v.string()),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    return await ctx.runQuery(internal.remoteUserActivity.listSnapshots, {
      userId: args.userId,
      limit: args.limit
    });
  }
});

// Generate a random token ID
export const generateTokenId = action({
    handler: async (ctx, args) => {
        return randomBytes(4).toString('hex');
    }
});

// Save Supabase users to a JSONL file
export const saveSupabaseUsersToFile = action({
  args: {
    users: v.array(v.any())
  },
  handler: async (ctx, args) => {
    const { users } = args;
    
    // Create logs directory if it doesn't exist
    const logsDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    
    // Write users to JSONL file
    const filePath = path.join(logsDir, 'supabase_users.jsonl');
    const jsonlContent = users.map(user => JSON.stringify(user)).join('\n');
    
    fs.writeFileSync(filePath, jsonlContent);
    
    return { filePath, count: users.length };
  }
});

// Save Supabase notes to a JSONL file
export const saveSupabaseNotesToFile = action({
  args: {
    notes: v.array(v.any())
  },
  handler: async (ctx, args) => {
    const { notes } = args;
    
    // Create logs directory if it doesn't exist
    const logsDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    
    // Process notes to escape newlines in content
    const processedNotes = notes.map(note => {
      const processed = { ...note };
      if (processed.content) {
        processed.content = processed.content.replace(/\n/g, '\\n');
      }
      return processed;
    });
    
    // Write notes to JSONL file
    const filePath = path.join(logsDir, 'supabase_notes.jsonl');
    const jsonlContent = processedNotes.map(note => JSON.stringify(note)).join('\n');
    
    fs.writeFileSync(filePath, jsonlContent);
    
    return { filePath, count: notes.length };
  }
});