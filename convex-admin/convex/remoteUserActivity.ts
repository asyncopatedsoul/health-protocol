import { v } from 'convex/values';
import { internalAction, internalQuery, internalMutation } from './_generated/server';
import { Id } from './_generated/dataModel';
import { internal, api } from './_generated/api';

// Types for activity data - imported from remoteSourceSupabase.ts
export interface UserActivity {
  id: string;
  user_id: string;
  notes?: string;
  content?: string;
  created_at: string;
  last_saved_at?: string;
  [key: string]: any;
}

export interface SupabaseUser {
  id: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
  };
  [key: string]: any;
}

// Interface for Convex User
export interface ConvexUser {
  _id: Id<"users">;
  email: string;
  fullName: string;
  tokenId: string;
  timezone: string;
  supabaseUserId: string;
}

// Interface for Convex Note
export interface ConvexNote {
  _id: Id<"notes">;
  userId: Id<"users">;
  content: string;
  createdAtMs?: bigint;
  lastSavedMs?: bigint;
  source: string;
}

// Table name for storing snapshot metadata
export const SNAPSHOTS_TABLE = "user_activity_snapshots";

// Store activity snapshot in Convex storage
export const storeActivitySnapshot = internalMutation({
  args: {
    userId: v.string(),
    fileName: v.string(),
    storageId: v.string(),
    recordCount: v.number(),
    uploadedToSupabase: v.boolean(),
    createdAt: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const { db } = ctx;
    
    // Store metadata about the snapshot in the database
    const snapshotId = await db.insert(SNAPSHOTS_TABLE, {
      userId: args.userId,
      fileName: args.fileName,
      storageId: args.storageId,
      recordCount: args.recordCount,
      uploadedToSupabase: args.uploadedToSupabase,
      createdAt: args.createdAt || Date.now()
    });
    
    return snapshotId;
  }
});

// Save activity data to Convex storage
export const saveActivityToStorage = internalAction({
  args: {
    csvContent: v.string(),
    fileName: v.string()
  },
  handler: async (ctx, args) => {
    // Store the CSV content in Convex storage
    const storageId = await ctx.storage.store(
      new Blob([args.csvContent], { type: 'text/csv' })
    );
    
    return {
      storageId: storageId,
      fileName: args.fileName
    };
  }
});

// Query to check the status of the last snapshot
export const getLastSnapshotStatus = internalQuery({
  args: {
    userId: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const { db } = ctx;
    
    // Create a query for the snapshots table
    // let query = db.query(SNAPSHOTS_TABLE).order('createdAt', 'desc');
    let query = db.query(SNAPSHOTS_TABLE).order('desc');

    // Apply filter if userId is provided
    if (args.userId) {
      query = query.filter(q => q.eq('userId', args.userId));
    }
    
    // Get the first (latest) snapshot
    const latestSnapshot = await query.first();
    
    if (!latestSnapshot) {
      return {
        found: false,
        message: 'No snapshots found'
      };
    }
    
    return {
      found: true,
      snapshot: latestSnapshot
    };
  }
});

// Query to retrieve a snapshot by its storage ID
export const getSnapshotContent = internalQuery({
  args: {
    storageId: v.string()
  },
  handler: async (ctx, args) => {
    const { storage } = ctx;
    
    try {
      // Get the URL for the stored file
      const url = await storage.getUrl(args.storageId as Id<"_storage">);
      
      if (!url) {
        return { success: false, error: 'Snapshot not found' };
      }
      
      // Fetch the content from the URL
      const response = await fetch(url);
      if (!response.ok) {
        return { success: false, error: `Failed to fetch snapshot: ${response.status}` };
      }
      
      const text = await response.text();
      return { success: true, content: text };
    } catch (error) {
      console.error('Error retrieving snapshot:', error);
      return { success: false, error: String(error) };
    }
  }
});

// List all snapshots
export const listSnapshots = internalQuery({
  args: {
    userId: v.optional(v.string()),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const { db } = ctx;
    
    // Create a query for the snapshots table
    // let query = db.query(SNAPSHOTS_TABLE).order('createdAt', 'desc');
    let query = db.query(SNAPSHOTS_TABLE).order('desc');

    // Apply filter if userId is provided
    if (args.userId) {
      query = query.filter(q => q.eq('userId', args.userId));
    }
    
    // Apply limit
    const limit = args.limit || 100; // Default limit
    
    // Execute the query and return results
    return await query.take(limit);
  }
});

// Find or create a user in Convex database from Supabase user
export const findOrCreateUser = internalMutation({
  args: {
    supabaseUser: v.any()
  },
  handler: async (ctx, args) => {
    const { db } = ctx;
    const { supabaseUser } = args;
    
    try {
      // Check if user already exists by supabaseUserId
      const existingUser = await db
        .query('users')
        .withIndex('by_supabaseUserId', q => q.eq('supabaseUserId', supabaseUser.id))
        .unique();
      
      if (existingUser) {
        return existingUser;
      }
      
      // If not found by supabaseUserId, try by email
      if (supabaseUser.email) {
        const userByEmail = await db
          .query('users')
          .withIndex('by_email', q => q.eq('email', supabaseUser.email))
          .unique();
        
        if (userByEmail) {
          // Update existing user with supabaseUserId
          return await db.patch(userByEmail._id, {
            supabaseUserId: supabaseUser.id
          });
        }
      }
      
      // Create new user
      const fullName = supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0] || 'Unknown';
    //   const tokenId = await ctx.runMutation(api.remoteSourceSupabase.generateTokenId);
      const tokenId = fullName.replace(/\s/g, '').toLowerCase();
      
      const newUser = await db.insert('users', {
        email: supabaseUser.email || `user_${supabaseUser.id}@example.com`,
        fullName,
        tokenId,
        timezone: 'America/Los_Angeles',
        supabaseUserId: supabaseUser.id
      });
      
      return await db.get(newUser);
    } catch (error) {
      console.error('Error finding or creating user:', error);
      throw error;
    }
  }
});

// Create a note in Convex database from Supabase activity
export const createNoteFromActivity = internalMutation({
  args: {
    activity: v.any(),
    userId: v.id('users')
  },
  handler: async (ctx, args) => {
    const { db } = ctx;
    const { activity, userId } = args;
    
    try {
      // Extract content from activity
      const content = activity.content || activity.notes || '';
      
      // Parse timestamps
      const createdAtMs = activity.created_at ? BigInt(new Date(activity.created_at).getTime()) : BigInt(Date.now());
      const lastSavedMs = activity.last_saved_at ? BigInt(new Date(activity.last_saved_at).getTime()) : createdAtMs;
      
      // Create note
      const noteId = await db.insert('notes', {
        userId,
        content,
        createdAtMs,
        lastSavedMs,
        source: 'supabase',
        externalId: activity.id
      });
      
      return await db.get(noteId);
    } catch (error) {
      console.error('Error creating note from activity:', error);
      throw error;
    }
  }
});

// Process all users and activities from Supabase
export const processSupabaseData = internalAction({
  args: {
    activities: v.array(v.any()),
    users: v.record(v.string(), v.any())
  },
  handler: async (ctx, args) => {
    const { activities, users } = args;
    const userValues = Object.values(users);
    
    try {
      // Save users and activities to files
      await ctx.runAction(api.remoteSourceSupabase.saveSupabaseUsersToFile, { 
        users: userValues 
      });
      
      await ctx.runAction(api.remoteSourceSupabase.saveSupabaseNotesToFile, { 
        notes: activities 
      });
      
      const results = {
        users: [] as any[],
        notes: [] as any[]
      };
      
      // Process each user
      for (const user of userValues) {
        try {
          const convexUser = await ctx.runMutation(internal.remoteUserActivity.findOrCreateUser, { 
            supabaseUser: user 
          });
          
          if (convexUser) {
            results.users.push(convexUser);
            
            // Find activities for this user
            const userActivities = activities.filter(activity => activity.user_id === user.id);
            
            // Process each activity for this user
            for (const activity of userActivities) {
              try {
                const note = await ctx.runMutation(internal.remoteUserActivity.createNoteFromActivity, {
                  activity,
                  userId: convexUser._id
                });
                
                if (note) {
                  results.notes.push(note);
                }
              } catch (error) {
                console.error(`Error processing activity ${activity.id} for user ${user.id}:`, error);
              }
            }
          }
        } catch (error) {
          console.error(`Error processing user ${user.id}:`, error);
        }
      }
      
      return results;
    } catch (error) {
      console.error('Error processing Supabase data:', error);
      throw error;
    }
  }
});
