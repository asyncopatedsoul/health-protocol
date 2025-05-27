import { mutation, query } from './_generated/server';
import { v } from 'convex/values';
import { Doc, Id } from './_generated/dataModel';
import { ConvexError } from 'convex/values';

// Types
type Activity = Doc<'activities'>;

interface CreateActivityInput {
    authorId?: Id<'users'>;
    name: string;
    slug?: string;
    description?: string;
    guides?: {
        type: string;
        id?: Id<'guides'>;
    };
}

/**
 * Create a new activity
 */
export const create = mutation({
    args: {
        authorId: v.optional(v.id('users')),
        name: v.string(),
        slug: v.optional(v.string()),
        description: v.optional(v.string()),
        guides: v.optional(v.object({
            type: v.string(),
            id: v.optional(v.id('guides')),
        })),
    },
    handler: async (ctx, args) => {
        const activityId = await ctx.db.insert('activities', {
            authorId: args.authorId,
            name: args.name,
            slug: args.slug || args.name.toLowerCase().replace(/\s+/g, '-'),
            description: args.description,
            guides: args.guides,
        });

        return activityId;
    },
});

/**
 * Get an activity by ID
 */
export const get = query({
    args: {
        id: v.id('activities'),
    },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.id);
    },
});

/**
 * Get activities by author
 */
export const getByAuthor = query({
    args: {
        authorId: v.id('users'),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        let activities = await ctx.db
            .query('activities')
            .withIndex('authorId', q => q.eq('authorId', args.authorId))
            .collect();

        if (args.limit) {
            activities = activities.slice(0, args.limit);
        }

        return activities;
    },
});

/**
 * Find activities by name (case-insensitive)
 */
export const findByName = query({
    args: {
        name: v.string(),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const activities = await ctx.db
            .query('activities')
            .collect();

        const searchTerm = args.name.toLowerCase();
        let matched = activities
            .filter(activity => 
                activity.name.toLowerCase().includes(searchTerm)
            );
            
        if (args.limit) {
            matched = matched.slice(0, args.limit);
        }

        return matched;
    },
});

/**
 * Update an activity
 */
export const update = mutation({
    args: {
        id: v.id('activities'),
        updates: v.object({
            name: v.optional(v.string()),
            slug: v.optional(v.string()),
            description: v.optional(v.string()),
            guides: v.optional(v.object({
                type: v.string(),
                id: v.optional(v.id('guides')),
            })),
        }),
    },
    handler: async (ctx, args) => {
        const activity = await ctx.db.get(args.id);
        if (!activity) {
            throw new ConvexError(`Activity with ID ${args.id} not found`);
        }

        await ctx.db.patch(args.id, args.updates);
        return await ctx.db.get(args.id);
    },
});

/**
 * Delete an activity
 */
export const remove = mutation({
    args: {
        id: v.id('activities'),
    },
    handler: async (ctx, args) => {
        const activity = await ctx.db.get(args.id);
        if (!activity) {
            throw new ConvexError(`Activity with ID ${args.id} not found`);
        }

        await ctx.db.delete(args.id);
        return { success: true };
    },
});
