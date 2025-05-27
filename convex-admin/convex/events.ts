import { mutation, query } from './_generated/server';
import { v } from 'convex/values';
import { Doc, Id } from './_generated/dataModel';
import { ConvexError } from 'convex/values';

// Types
type Event = Doc<'events'>;

interface CreateEventInput {
    userId: Id<'users'>;
    type: string;
    status: string;
    timestampMs?: number | bigint;
    context?: {
        activityId?: Id<'activities'>;
        protocolId?: Id<'protocols'>;
        noteId?: Id<'notes'>;
        programId?: Id<'programs'>;
    };
    metadata?: {
        activity?: any;
        note?: any;
        program?: any;
        protocol?: any;
        user?: any;
    };
}

/**
 * Create a new event
 */
export const create = mutation({
    args: {
        userId: v.id('users'),
        type: v.string(),
        status: v.string(),
        isVerified: v.optional(v.boolean()),
        timestampMs: v.optional(v.union(v.number(), v.bigint())),
        context: v.optional(v.object({
            activityId: v.optional(v.id('activities')),
            protocolId: v.optional(v.id('protocols')),
            noteId: v.optional(v.id('notes')),
            programId: v.optional(v.id('programs')),
        })),
        metadata: v.optional(v.object({
            activity: v.optional(v.any()),
            note: v.optional(v.any()),
            program: v.optional(v.any()),
            protocol: v.optional(v.any()),
            user: v.optional(v.any()),
        })),
    },
    handler: async (ctx, args) => {
        const eventId = await ctx.db.insert('events', {
            userId: args.userId,
            type: args.type,
            status: args.status,
            isVerified: args.isVerified || false,
            timestampMs: args.timestampMs ? BigInt(args.timestampMs.toString()) : BigInt(Date.now()),
            context: args.context || {},
            metadata: args.metadata || {},
        });

        return eventId;
    },
});

/**
 * Get an event by ID
 */
export const get = query({
    args: {
        id: v.id('events'),
    },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.id);
    },
});

/**
 * Get events by user ID with optional filters
 */
export const getByUser = query({
    args: {
        userId: v.id('users'),
        type: v.optional(v.string()),
        startDate: v.optional(v.union(v.number(), v.bigint())),
        endDate: v.optional(v.union(v.number(), v.bigint())),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        let query = ctx.db
            .query('events')
            .withIndex('userId', q => q.eq('userId', args.userId));

        // Apply type filter if provided
        if (args.type) {
            query = query.filter(q => q.eq(q.field('type'), args.type));
        }

        // Execute the query
        let events = await query.collect();

        // Apply date range filter if provided
        if (args.startDate || args.endDate) {
            const start = args.startDate ? BigInt(args.startDate.toString()) : 0n;
            const end = args.endDate ? BigInt(args.endDate.toString()) : BigInt(Date.now());
            
            events = events.filter(event => {
                const timestamp = event.timestampMs || 0n;
                return timestamp >= start && timestamp <= end;
            });
        }

        // Apply limit if provided
        if (args.limit) {
            events = events.slice(0, args.limit);
        }

        return events;
    },
});

/**
 * Delete events by note ID
 */
export const deleteByNoteId = mutation({
    args: {
        noteId: v.id('notes'),
    },
    handler: async (ctx, args) => {
        // First, find all events that reference this note
        const events = await ctx.db
            .query('events')
            .withIndex('userId')
            .filter(q => 
                q.and(
                    q.neq(q.field('context'), undefined),
                    q.eq(q.field('context.noteId'), args.noteId)
                )
            )
            .collect();

        // Delete all found events
        await Promise.all(events.map(event => ctx.db.delete(event._id)));

        return { count: events.length };
    },
});

/**
 * Check if an event already exists for the given criteria
 */
export const eventExists = query({
    args: {
        userId: v.id('users'),
        type: v.string(),
        noteId: v.optional(v.id('notes')),
        activityId: v.optional(v.id('activities')),
    },
    handler: async (ctx, args) => {
        const events = await ctx.db
            .query('events')
            .withIndex('userId')
            .filter(q => 
                q.and(
                    q.eq(q.field('userId'), args.userId),
                    q.eq(q.field('type'), args.type),
                    args.noteId ? q.eq(q.field('context.noteId'), args.noteId) : q.neq(q.field('context.noteId'), undefined),
                    args.activityId ? q.eq(q.field('context.activityId'), args.activityId) : q.neq(q.field('context.activityId'), undefined)
                )
            )
            .collect();

        return events.length > 0;
    },
});
