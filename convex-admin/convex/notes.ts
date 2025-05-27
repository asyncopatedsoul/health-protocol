import { mutation, query } from './_generated/server';
import { v } from 'convex/values';
import { Doc, Id } from './_generated/dataModel';
import { ConvexError } from 'convex/values';

// Types
type Note = Doc<'notes'>;

export const create = mutation({
    args: {
        userId: v.id("users"),
        content: v.string(),
        source: v.optional(v.string()),
        externalId: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const note = await ctx.db.insert("notes", {
            userId: args.userId,
            content: args.content,
            source: args.source,
            externalId: args.externalId,
        });

        return note;
    },
});

export const get = query({
    args: {
        id: v.id("notes"),
    },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.id);
    },
});

export const getByUser = query({
    args: {
        userId: v.id("users"),
        startDate: v.optional(v.number()),
        endDate: v.optional(v.number()),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        // Get all notes for the user
        let notes = await ctx.db
            .query("notes")
            .withIndex("userId", (q) => q.eq("userId", args.userId))
            .collect();

        // Apply date range filter if provided
        if (args.startDate || args.endDate) {
            notes = notes.filter(note => {
                const createdAt = Number(note.createdAtMs || 0);
                const start = args.startDate || 0;
                const end = args.endDate || Date.now();
                return createdAt >= start && createdAt <= end;
            });
        }

        // Apply limit if provided
        if (args.limit) {
            notes = notes.slice(0, args.limit);
        }

        return notes;
    },
});

export const getByExternalId = query({
    args: {
        externalId: v.string(),
    },
    handler: async (ctx, args) => {
        const notes = await ctx.db
            .query("notes")
            .collect();
        return notes.find(note => note.externalId === args.externalId);
    },
});

export const update = mutation({
    args: {
        id: v.id("notes"),
        updates: v.object({
            content: v.optional(v.string()),
            lastSavedMs: v.optional(v.union(v.number(), v.bigint())),
            activityTimestamp: v.optional(v.union(v.number(), v.bigint())),
        }),
    },
    handler: async (ctx, args) => {
        const note = await ctx.db.get(args.id);
        if (!note) {
            throw new ConvexError(`Note with ID ${args.id} not found`);
        }

        // Convert number to bigint if needed for the database
        const updates: any = { ...args.updates };
        if (updates.lastSavedMs !== undefined && typeof updates.lastSavedMs === 'number') {
            updates.lastSavedMs = BigInt(updates.lastSavedMs);
        }
        if (updates.activityTimestamp !== undefined && typeof updates.activityTimestamp === 'number') {
            updates.activityTimestamp = BigInt(updates.activityTimestamp);
        }

        updates.lastSavedMs = BigInt(Date.now());

        return await ctx.db.patch(args.id, updates);
    },
});