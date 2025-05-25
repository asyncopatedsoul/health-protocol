import { v } from "convex/values";
import { internalAction, mutation, query } from "./_generated/server";
import {
    getAll,
    getAllOrThrow,
    getOneFrom,
    getOneFromOrThrow,
    getManyFrom,
    getManyVia,
    getManyViaOrThrow,
} from "convex-helpers/server/relationships";
import { asyncMap } from "convex-helpers";
import { internal } from "./_generated/api";
import { Doc, Id } from "./_generated/dataModel";
import { WithoutSystemFields } from "convex/server";
import { addDays, addWeeks, getDay, setDay } from "date-fns";
import { toZonedTime, fromZonedTime } from "date-fns-tz";


// Create a logger for API functions
const logApiFunction = (functionName: string, message: string) => {
    console.log(`[${functionName}] ${message}`);
    // In a real environment, we would write to a log file here
    // For now, we'll just log to the console
};

// Function to plan activities for a user based on a program
export const planActivitiesForUserProgram = mutation({
    args: { 
        userId: v.id("users"), 
        programId: v.id("programs"),
        durationWeeks: v.optional(v.number()),
        durationDays: v.optional(v.number()),
        startDate: v.optional(v.string()) // ISO date string format
    },
    // Define the return type for planned activities
    returns: v.array(v.object({
        _id: v.id("planned_activities"),
        userId: v.id("users"),
        activityId: v.id("activities"),
        protocolId: v.optional(v.id("protocols")),
        programId: v.optional(v.id("programs")),
        plannedTimeUtcMs: v.number(),
        _creationTime: v.number(),
        parameters: v.optional(v.object({
            property: v.string()
        })),
    })),
    handler: async ({ db }, args) => {
        const functionName = "planActivitiesForUserProgram";
        logApiFunction(functionName, `Starting with args: ${JSON.stringify(args)}`);
        
        // Get user and program
        const user = await db.get(args.userId);
        if (!user) throw new Error("User not found");
        logApiFunction(functionName, `User found: ${user.fullName}`);
        
        const program = await db.get(args.programId);
        if (!program) throw new Error("Program not found");
        logApiFunction(functionName, `Program found: ${program.name}`);
        
        // Determine duration - prioritize durationDays over durationWeeks
        let durationDays: number;
        if (args.durationDays !== undefined) {
            durationDays = args.durationDays;
            logApiFunction(functionName, `Using provided durationDays: ${durationDays}`);
        } else if (args.durationWeeks !== undefined) {
            durationDays = args.durationWeeks * 7;
            logApiFunction(functionName, `Calculated durationDays from durationWeeks: ${durationDays}`);
        } else {
            durationDays = 30; // Default to 30 days
            logApiFunction(functionName, `Using default durationDays: ${durationDays}`);
        }
        
        // Use user's timezone or default to LA
        const userTimezone = user.timezone || "America/Los_Angeles";
        logApiFunction(functionName, `Using timezone: ${userTimezone}`);
        
        // Start date - use provided or default to today
        let startDate: Date;
        if (args.startDate) {
            startDate = new Date(args.startDate);
            logApiFunction(functionName, `Using provided startDate: ${startDate.toISOString()}`);
        } else {
            startDate = new Date();
            logApiFunction(functionName, `Using default startDate (today): ${startDate.toISOString()}`);
        }
        
        // Define the type for planned activities
        type PlannedActivity = {
            _id: Id<"planned_activities">,
            userId: Id<"users">,
            activityId: Id<"activities">,
            protocolId?: Id<"protocols">,
            programId: Id<"programs">,
            plannedTimeUtcMs: number,
            _creationTime: number,
            parameters?: { property: string }
        };
        
        // Array to store all planned activities
        const plannedActivities: PlannedActivity[] = [];
        
        // Check if program has phases
        if (!program.phases || program.phases.length === 0) {
            return plannedActivities;
        }
        
        // Process each phase
        for (const phase of program.phases) {
            // Skip if no sequence or exit criteria
            if (!phase.sequence || !phase.exitCriteria) {
                continue;
            }
            
            // Create a map of activities by slug for quick lookup
            const activitySlugsMap = new Map();
            
            // Process exit criteria to determine activity targets
            for (const criteria of phase.exitCriteria) {
                // Find the activity by slug
                const activities = await db
                    .query("activities")
                    .filter((q) => q.eq(q.field("slug"), criteria.slug))
                    .collect();
                
                if (activities.length > 0) {
                    const activity = activities[0];
                    
                    // Store the activity with its target and limit info
                    activitySlugsMap.set(criteria.slug, {
                        activity,
                        target: criteria.target?.total || 0,
                        dailyLimit: criteria.limit?.daily || 1
                    });
                }
            }
            
            // Create a schedule for the phase
            const currentDate = new Date(startDate);
            let weeksCompleted = 0;
            let activitiesScheduled = new Map();
            
            // Initialize the activities scheduled count
            for (const [slug, info] of activitySlugsMap.entries()) {
                activitiesScheduled.set(slug, 0);
            }
            
            // Schedule activities until we reach the target or duration
            let daysScheduled = 0;
            
            // Process each sequence item
            for (const sequenceItem of phase.sequence) {
                // Skip if no activities defined
                if (!sequenceItem.activities || sequenceItem.activities.length === 0) {
                    continue;
                }
                
                // Check if we've reached the duration limit
                if (daysScheduled >= durationDays) {
                    logApiFunction(functionName, `Reached duration limit of ${durationDays} days`);
                    break;
                }
                
                let targetDate: Date;
                
                // Handle day-based scheduling (absolute days from start)
                if (sequenceItem.day !== undefined) {
                    logApiFunction(functionName, `Using day-based scheduling for day ${sequenceItem.day}`);
                    // Day is 1-indexed (day 1 is the first day)
                    const dayOffset = sequenceItem.day - 1;
                    targetDate = addDays(startDate, dayOffset);
                    logApiFunction(functionName, `Scheduled for day ${sequenceItem.day} date: ${targetDate.toISOString()}`);
                }
                // Handle weekday-based scheduling (day of week)
                else if (sequenceItem.weekday !== undefined) {
                    logApiFunction(functionName, `Using weekday-based scheduling for weekday ${sequenceItem.weekday}`);
                    const targetWeekday = sequenceItem.weekday;
                    
                    // Calculate the date for this weekday
                    // Convert our weekday (1-7, Monday-Sunday) to JS day (0-6, Sunday-Saturday)
                    const jsTargetDay = targetWeekday === 7 ? 0 : targetWeekday;
                    const currentJsDay = getDay(startDate);
                    
                    // Calculate days to add to reach the target weekday
                    let daysToAdd = (jsTargetDay - currentJsDay + 7) % 7;
                    if (daysToAdd === 0 && daysScheduled > 0) {
                        daysToAdd = 7; // Move to next week if we're already on this day
                    }
                    
                    // If we've already scheduled for daysScheduled days, add weeks to get to the next occurrence
                    const weeksToAdd = Math.floor(daysScheduled / 7);
                    daysToAdd += weeksToAdd * 7;
                    
                    let utcDate = addDays(startDate, daysToAdd);
                    
                    if (weeksToAdd > 0) {
                        logApiFunction(functionName, `Days scheduled updated to: ${daysScheduled + 7} after a week`);
                    }
                    
                    logApiFunction(functionName, `Scheduled for weekday ${targetWeekday} date: ${utcDate.toISOString()}`);
                    
                    targetDate = utcDate;
                }
                else {
                    // Neither day nor weekday is defined
                    throw new Error("Sequence item must have either 'day' or 'weekday' defined");
                }
                
                // Schedule each activity for this day
                for (const activityItem of sequenceItem.activities) {
                    const activityInfo = activitySlugsMap.get(activityItem.slug);
                    
                    if (!activityInfo) {
                        continue;
                    }
                    
                    // Check if we've reached the target for this activity
                    const currentCount = activitiesScheduled.get(activityItem.slug) || 0;
                    if (activityInfo.target > 0 && currentCount >= activityInfo.target) {
                        continue;
                    }
                        
                        // Create a date at noon in the user's timezone
                    const zonedDate = toZonedTime(targetDate, userTimezone);
                    zonedDate.setHours(12, 0, 0, 0);
                    
                    // Convert back to UTC for storage
                    const utcDate = fromZonedTime(zonedDate, userTimezone);
                    
                    // Insert the planned activity
                    const plannedActivity = await db.insert("planned_activities", {
                        userId: user._id,
                        activityId: activityInfo.activity._id,
                        programId: program._id, // This is guaranteed to be defined since we check for program existence
                        plannedTimeUtcMs: utcDate.getTime(),
                    });
                    
                    // Add to our result array
                    const plannedActivityDoc = await db.get(plannedActivity);
                    if (plannedActivityDoc) {
                        // Cast the document to the expected return type
                        plannedActivities.push({
                            _id: plannedActivityDoc._id,
                            userId: plannedActivityDoc.userId,
                            activityId: plannedActivityDoc.activityId,
                            programId: plannedActivityDoc.programId,
                            protocolId: plannedActivityDoc.protocolId,
                            plannedTimeUtcMs: plannedActivityDoc.plannedTimeUtcMs,
                            _creationTime: plannedActivityDoc._creationTime,
                            parameters: plannedActivityDoc.parameters
                        });
                    }
                    
                    // Update the count
                    activitiesScheduled.set(activityItem.slug, currentCount + 1);
                    
                    // Increment days scheduled for day-based scheduling
                    if (sequenceItem.day !== undefined) {
                        daysScheduled = Math.max(daysScheduled, sequenceItem.day);
                        logApiFunction(functionName, `Days scheduled updated to: ${daysScheduled}`);
                    }
                }
                
                // Increment days scheduled for weekday-based scheduling
                if (sequenceItem.weekday !== undefined) {
                    // Move to the next week for weekday-based scheduling
                    currentDate.setDate(currentDate.getDate() + 7);
                    daysScheduled += 7;
                    logApiFunction(functionName, `Days scheduled updated to: ${daysScheduled} after a week`);
                }
            }
        }
        
        logApiFunction(functionName, `Completed planning with ${plannedActivities.length} activities scheduled`);
        return plannedActivities;
    }
});

// add activity event
export const addActivityEvent = mutation({
    args: { userId: v.id("users"), activityId: v.id("activities"), status: v.string() },
    handler: async ({ db }, args) => {
        const user = await getOneFromOrThrow(db, "users", args.userId);
        const activity = await getOneFromOrThrow(db, "activities", args.activityId);
        const event = await db.insert("events", {
            type: "activity",
            userId: user._id,
            context: {
                activityId: activity._id,
            },
            status: args.status,
        });
    }
});

export const getUserEvents = query({
    args: { userId: v.id("users") },
    returns: v.array(v.object({
        _id: v.id("events"),
        type: v.string(),
        status: v.string(),
        userId: v.id("users"),
        context: v.optional(v.object({
            activityId: v.optional(v.id("activities")),
            protocolId: v.optional(v.id("protocols")),
        })),
    })),
    handler: async ({ db }, args) => {
        const events = await db
            .query("events")
            .filter((q) => q.eq(q.field("userId"), args.userId))
            .collect();
        return events;
    },
});

// Get planned activities for a user
export const getUserPlannedActivities = query({
    args: { userId: v.id("users") },
    returns: v.array(v.object({
        _id: v.id("planned_activities"),
        _creationTime: v.number(),
        userId: v.id("users"),
        activityId: v.id("activities"),
        protocolId: v.optional(v.id("protocols")),
        programId: v.optional(v.id("programs")),
        plannedTimeUtcMs: v.number(),
    })),
    handler: async ({ db }, args) => {
        const plannedActivities = await db
            .query("planned_activities")
            .filter((q) => q.eq(q.field("userId"), args.userId))
            .collect();
        return plannedActivities;
    },
});