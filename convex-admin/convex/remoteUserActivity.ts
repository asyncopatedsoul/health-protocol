import { v } from 'convex/values';
import { internalAction, internalQuery, internalMutation } from './_generated/server';
import { Id } from './_generated/dataModel';

// Types for activity data - imported from remoteSourceSupabase.ts
export interface UserActivity {
  id: string;
  user_id: string;
  notes?: string;
  created_at: string;
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
    let query = db.query(SNAPSHOTS_TABLE).order('createdAt', 'desc');
    
    // Apply filter if userId is provided
    if (args.userId) {
      query = query.withIndex('by_userId', q => 
        q.eq('userId', args.userId)
      );
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
      // Convert string ID to a proper storage ID
      const storageId = args.storageId as Id<"_storage">;
      
      // Get the URL for the stored file
      const url = await storage.getUrl(storageId);
      
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
    let query = db.query(SNAPSHOTS_TABLE).order('createdAt', 'desc');
    
    // Apply filter if userId is provided
    if (args.userId) {
      query = query.withIndex('by_userId', q => 
        q.eq('userId', args.userId)
      );
    }
    
    // Apply limit
    const limit = args.limit || 100; // Default limit
    
    // Execute the query and return results
    return await query.take(limit);
  }
});
