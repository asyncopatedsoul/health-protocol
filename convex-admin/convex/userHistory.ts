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
import { Doc } from "./_generated/dataModel";
import { WithoutSystemFields } from "convex/server";

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