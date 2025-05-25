import { v } from "convex/values";
import { internalAction, mutation, query, action } from "./_generated/server";
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
import { Doc } from "./_generated/dataModel";
import { WithoutSystemFields } from "convex/server";

import {
    customAction,
    customMutation,
    customQuery,
} from "convex-helpers/server/customFunctions";
import schema from "./schema";

function testUser(
    fields: Partial<Doc<"users">>,
): WithoutSystemFields<Doc<"users">> {
    return {
        email: "test@test.com",
        fullName: "test user",
        tokenId: "test",
        ...fields,
    };
}

// Wrappers to use for function that should only be called from tests
export const testingQuery = customQuery(query, {
    args: { isTest: v.boolean() },
    input: async (_ctx, _args) => {
        if (_args.isTest === undefined) {
            throw new Error(
                "Calling a test only function in an unexpected environment",
            );
        }
        return { ctx: {}, args: {} };
    },
});

export const testingMutation = customMutation(mutation, {
    args: { isTest: v.boolean() },
    input: async (_ctx, _args) => {
        console.log(_args);
        if (_args.isTest === undefined) {
            throw new Error(
                "Calling a test only function in an unexpected environment",
            );
        }
        return { ctx: {}, args: {} };
    },
});

export const testingAction = customAction(action, {
    args: { isTest: v.boolean() },
    input: async (_ctx, _args) => {
        if (_args.isTest === undefined) {
            throw new Error(
                "Calling a test only function in an unexpected environment",
            );
        }
        return { ctx: {}, args: {} };
    },
});

export const clearAllTestUser = testingMutation({
    args: { isTest: v.boolean() },
    handler: async ({ db }) => {
        const testUser = await db
            .query("users")
            .filter((q) => q.eq(q.field("tokenId"), "testuser"))
            .first();
        console.log(testUser)
        if (testUser) {
            const userId = testUser._id;
            const protocols = await db.query("user_protocols").filter((q) => q.eq(q.field("userId"), userId)).collect();
            const plannedActivities = await db.query("planned_activities").filter((q) => q.eq(q.field("userId"), userId)).collect();
            let userDocs = [...protocols, ...plannedActivities];
            await Promise.all(userDocs.map((doc) => db.delete(doc._id)));
        }
    }
});

export const clearAll = testingMutation({
    args: { isTest: v.boolean() },
    handler: async ({ db, scheduler, storage }) => {
    for (const table of Object.keys(schema.tables)) {
        const docs = await db.query(table as any).collect();
        await Promise.all(docs.map((doc) => db.delete(doc._id)));
    }
    const scheduled = await db.system.query("_scheduled_functions").collect();
    await Promise.all(scheduled.map((s) => scheduler.cancel(s._id)));
    const storedFiles = await db.system.query("_storage").collect();
    await Promise.all(storedFiles.map((s) => storage.delete(s._id)));
    }
});

export const addRandomFile = internalAction({
    args: {},
    handler: async (ctx, args): Promise<void> => {
        await ctx.storage.store(new Blob(["test"]));
    },
});

function assertLength(list: any[], length: number) {
    if (list.length !== length) {
        throw new Error(`Expected length ${length}, got ${list.length}`);
    }
}
function assertHasNull(value: any[]) {
    if (value.findIndex((v) => v === null) === -1) {
        throw new Error("Expected to find null");
    }
}
function assertNull(value: any) {
    if (value !== null) {
        throw new Error(`Expected null, got ${value}`);
    }
}

function assertNotNull(value: any) {
    if (value === null) {
        throw new Error(`Expected value to not be null, but it was`);
    }
}

// Function to generate a summary of planned activities for a user
export const generateActivitySummary = testingQuery({
    args: { 
        isTest: v.boolean(),
        userId: v.id("users"),
        planningParams: v.optional(v.object({
            programId: v.id("programs"),
            durationDays: v.optional(v.number()),
            durationWeeks: v.optional(v.number()),
            startDate: v.optional(v.string())
        }))
    },
    handler: async ({ db }, args) => {
        // Get the user
        const user = await db.get(args.userId);
        if (!user) throw new Error("User not found");
        
        // Get all planned activities for the user, sorted by plannedTimeUtcMs
        const plannedActivities = await db
            .query("planned_activities")
            .filter((q) => q.eq(q.field("userId"), args.userId))
            .order("asc")
            .collect();
        
        if (plannedActivities.length === 0) {
            return { 
                user: {
                    id: user._id,
                    fullName: user.fullName,
                    email: user.email,
                    tokenId: user.tokenId
                },
                planningParams: args.planningParams,
                activities: []
            };
        }
        
        // Get all the activities by their IDs
        const activityIds = plannedActivities.map(pa => pa.activityId);
        const activities = await Promise.all(
            activityIds.map(id => db.get(id))
        );
        
        // Get the program
        const programIds = [...new Set(plannedActivities.map(pa => pa.programId).filter(Boolean))];
        const programs = await Promise.all(
            programIds.map(id => id ? db.get(id) : null)
        );
        
        // Create the summary
        const activitySummary = plannedActivities.map((pa, index) => {
            const activity = activities[index];
            const program = programs.find(p => p && p._id === pa.programId);
            
            const plannedDate = new Date(pa.plannedTimeUtcMs);
            const dateString = plannedDate.toISOString().replace('T', ' ').substring(0, 19);
            
            return {
                userId: pa.userId,
                userFullName: user.fullName,
                activityId: pa.activityId,
                activityName: activity ? activity.name : 'Unknown Activity',
                activitySlug: activity ? activity.slug : 'unknown',
                programId: pa.programId,
                programName: program ? program.name : 'Unknown Program',
                plannedTime: dateString,
                plannedTimeUtcMs: pa.plannedTimeUtcMs
            };
        });
        
        // Sort by planned time
        activitySummary.sort((a, b) => a.plannedTimeUtcMs - b.plannedTimeUtcMs);
        
        // Log the summary
        console.log("Activity Summary:");
        console.log("=================\n");
        console.log(`User: ${user.fullName} (${user._id})`);
        if (args.planningParams) {
            console.log("Planning Parameters:");
            console.log(JSON.stringify(args.planningParams, null, 2));
        }
        console.log("\nPlanned Activities:");
        activitySummary.forEach((summary, index) => {
            console.log(`${index + 1}. ${summary.activityName} (${summary.activitySlug}) - ${summary.plannedTime}`);
        });
        
        return {
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                tokenId: user.tokenId
            },
            planningParams: args.planningParams,
            activities: activitySummary
        };
    }
});