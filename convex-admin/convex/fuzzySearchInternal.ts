import { v } from 'convex/values';
import { internalQuery, internalMutation } from './_generated/server';
import { Id } from './_generated/dataModel';

// Interface for Activity
export interface Activity {
  _id: Id<"activities">;
  name: string;
  description?: string;
  category?: string;
  muscleGroups?: string[];
  equipment?: string[];
  [key: string]: any;
}

// Interface for MeiliSearch document
export interface MeiliSearchActivity {
  id: string;
  name: string;
  description?: string;
  category?: string;
  muscleGroups?: string[];
  equipment?: string[];
  [key: string]: any;
}

// Get all activities from Convex database
export const getAllActivities = internalQuery({
  handler: async (ctx) => {
    const { db } = ctx;
    
    // Query all activities
    const activities = await db.query("activities").collect();
    
    return activities;
  }
});

// Get activity by ID
export const getActivityById = internalQuery({
  args: {
    activityId: v.id("activities")
  },
  handler: async (ctx, args) => {
    const { db } = ctx;
    
    // Get activity by ID
    const activity = await db.get(args.activityId);
    
    return activity;
  }
});

// Create a new activity
export const createActivity = internalMutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    muscleGroups: v.optional(v.array(v.string())),
    equipment: v.optional(v.array(v.string()))
  },
  handler: async (ctx, args) => {
    const { db } = ctx;
    
    // Create a new activity
    const activityId = await db.insert("activities", {
      name: args.name,
      description: args.description,
      // category: args.category,
      // muscleGroups: args.muscleGroups,
      // equipment: args.equipment
    });
    
    // Return the new activity
    return await db.get(activityId);
  }
});

// Update an activity
export const updateActivity = internalMutation({
  args: {
    activityId: v.id("activities"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    muscleGroups: v.optional(v.array(v.string())),
    equipment: v.optional(v.array(v.string()))
  },
  handler: async (ctx, args) => {
    const { db } = ctx;
    
    // Get the current activity
    const activity = await db.get(args.activityId);
    
    if (!activity) {
      throw new Error(`Activity with ID ${args.activityId} not found`);
    }
    
    // Update the activity
    const updates: any = {};
    
    if (args.name !== undefined) updates.name = args.name;
    if (args.description !== undefined) updates.description = args.description;
    // if (args.category !== undefined) updates.category = args.category;
    // if (args.muscleGroups !== undefined) updates.muscleGroups = args.muscleGroups;
    // if (args.equipment !== undefined) updates.equipment = args.equipment;
    
    // Apply the updates
    await db.patch(args.activityId, updates);
    
    // Return the updated activity
    return await db.get(args.activityId);
  }
});

// Delete an activity
export const deleteActivity = internalMutation({
  args: {
    activityId: v.id("activities")
  },
  handler: async (ctx, args) => {
    const { db } = ctx;
    
    // Get the activity
    const activity = await db.get(args.activityId);
    
    if (!activity) {
      throw new Error(`Activity with ID ${args.activityId} not found`);
    }
    
    // Delete the activity
    await db.delete(args.activityId);
    
    return { success: true, deletedId: args.activityId };
  }
});

// Find activities by name (basic search without fuzzy matching)
export const findActivitiesByName = internalQuery({
  args: {
    name: v.string(),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const { db } = ctx;
    
    // Get all activities
    const activities = await db.query("activities").collect();
    
    // Filter activities by name (case-insensitive)
    const filteredActivities = activities.filter(activity => 
      activity.name.toLowerCase().includes(args.name.toLowerCase())
    );
    
    // Apply limit if provided
    const limit = args.limit || 10;
    return filteredActivities.slice(0, limit);
  }
});

// Convert Convex activity to MeiliSearch document
export function convertToMeiliSearchDoc(activity: Activity): MeiliSearchActivity {
  return {
    id: activity._id.toString(),
    name: activity.name,
    description: activity.description,
    // category: activity.category,
    // muscleGroups: activity.muscleGroups,
    // equipment: activity.equipment
  };
}

// Convert MeiliSearch document to Convex activity format
export function convertToConvexActivity(doc: MeiliSearchActivity): Omit<Activity, '_id'> {
  return {
    name: doc.name,
    description: doc.description,
    // category: doc.category,
    // muscleGroups: doc.muscleGroups,
    // equipment: doc.equipment
  };
}
