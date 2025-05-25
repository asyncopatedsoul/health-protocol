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


// Function to plan activities for a user based on a program
export const planActivitiesForUserProgram = mutation({
    args: { 
        userId: v.id("users"), 
        programId: v.id("programs"),
        durationWeeks: v.optional(v.number())
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
        // Get user and program
        const user = await db.get(args.userId);
        if (!user) throw new Error("User not found");
        
        const program = await db.get(args.programId);
        if (!program) throw new Error("Program not found");
        
        // Default to 4 weeks if not specified
        const durationWeeks = args.durationWeeks || 4;
        
        // Get user's timezone or default to America/Los_Angeles
        const userTimezone = user.timezone || "America/Los_Angeles";
        
        // Start from today
        const startDate = new Date();
        
        // Define the type for planned activities
        type PlannedActivity = {
            _id: Id<"planned_activities">,
            userId: Id<"users">,
            activityId: Id<"activities">,
            protocolId?: Id<"protocols">,
            programId?: Id<"programs">,
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
            while (weeksCompleted < durationWeeks) {
                // Process each sequence item (day of the week)
                for (const sequenceItem of phase.sequence) {
                    // Skip if no activities defined
                    if (!sequenceItem.activities || sequenceItem.activities.length === 0) {
                        continue;
                    }
                    
                    // Get the target weekday (1-7, where 1 is Monday)
                    const targetWeekday = sequenceItem.weekday;
                    
                    if (targetWeekday === undefined) {
                        continue;
                    }
                    
                    // Calculate the date for this weekday
                    // Convert JS day (0-6, Sunday-Saturday) to our weekday (1-7, Monday-Sunday)
                    const jsDay = (targetWeekday % 7); // 7 becomes 0 (Sunday)
                    const currentDay = getDay(currentDate);
                    
                    // Calculate days to add to reach the target weekday
                    let daysToAdd = (jsDay - currentDay + 7) % 7;
                    if (daysToAdd === 0 && weeksCompleted > 0) {
                        daysToAdd = 7; // Move to next week if we're already on this day
                    }
                    
                    const targetDate = addDays(currentDate, daysToAdd);
                    
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
                            programId: program._id,
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
                    }
                }
                
                // Move to the next week
                currentDate.setDate(currentDate.getDate() + 7);
                weeksCompleted++;
            }
        }
        
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