import { mutation, query } from './_generated/server'; // Or from './auth' if you're using the custom auth context
import { v } from 'convex/values';
import { Doc, Id } from './_generated/dataModel'; // Import Doc type for type safety

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
        const note = await ctx.db.get(args.id);
        return note;
    },
});