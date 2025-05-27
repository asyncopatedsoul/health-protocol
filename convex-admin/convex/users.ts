import { mutation, query } from './_generated/server';
import { v } from 'convex/values';
import { Doc, Id } from './_generated/dataModel';
import { ConvexError } from 'convex/values';
import { api } from './_generated/api';

// Types
type User = Doc<'users'>;

interface UpdateUserInput {
    email?: string;
    fullName?: string;
    tokenId?: string;
    timezone?: string;
    supabaseUserId?: string;
}

/**
 * Creates a new user record in the 'users' table.
 * This mutation is typically called when a user first authenticates via Supabase
 * and you need to create their corresponding profile in Convex.
 *
 * @param args.supabaseUserId The unique ID of the user from Supabase (e.g., the 'sub' claim from their JWT).
 * @param args.email The user's email address.
 * @param args.name (Optional) The user's name.
 * @returns The ID of the newly created user document in Convex.
 * @throws An error if a user with the given `supabaseUserId` already exists (to prevent duplicates).
 */
export const create = mutation({
    args: {
        // supabaseUserId: v.string(),
        email: v.string(),
        fullName: v.string(), // Match the schema definition
        tokenId: v.string(),
    },
    handler: async (ctx, args) => {
        // Optional: Add authentication check if this mutation is meant to be called by an authenticated user
        // const identity = await ctx.auth.getUserIdentity();
        // if (!identity) {
        //   throw new Error("Not authenticated");
        // }
        // // Further check: Ensure the identity's supabaseUserId matches args.supabaseUserId
        // if (identity.tokenIdentifier.split('|')[1] !== args.supabaseUserId) {
        //   throw new Error("Unauthorized: Mismatched user ID.");
        // }

        // Check if a user with this supabaseUserId already exists
        // This prevents creating duplicate user profiles in Convex for the same Supabase user.
        const existingUser = await ctx.db
            .query("users")
            .withIndex("by_tokenId", (q) =>
                q.eq("tokenId", args.tokenId)
            )
            .first();

        if (existingUser) {
            // If the user already exists, you might want to:
            // 1. Throw an error (as done here)
            // 2. Return the existing user's ID
            // 3. Update the existing user's data (e.g., email or name) instead of creating a new one.
            //    (If updating, you'd use ctx.db.patch(existingUser._id, { email: args.email, name: args.name }));
            //   console.warn(`User with Supabase ID ${args.supabaseUserId} already exists.`);
            console.warn(`User with Token ID ${args.tokenId} already exists.`);
            // For this example, we'll return the existing ID and not create a new one.
            // If you strictly want to prevent creation if exists, throw an error:
            // throw new Error(`User with Supabase ID ${args.supabaseUserId} already exists.`);
            return existingUser._id;
        }

        // If no existing user, insert the new record
        const newUserId = await ctx.db.insert("users", {
            // supabaseUserId: args.supabaseUserId,
            email: args.email,
            fullName: args.fullName,
            tokenId: args.tokenId,
            timezone: "America/Los_Angeles",
        });

        console.log(`Created new user with Convex ID: ${newUserId} and Token ID: ${args.tokenId}`);

        return newUserId; // Return the ID of the newly created document
    },
});

/**
 * Get a user by ID
 */
export const get = query({
    args: {
        id: v.id('users'),
    },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.id);
    },
});

/**
 * Find a user by email
 */
export const getByEmail = query({
    args: {
        email: v.string(),
    },
    handler: async (ctx, args) => {
        const users = await ctx.db
            .query('users')
            .collect();
        return users.find(user => user.email === args.email);
    },
});

/**
 * Find a user by Supabase user ID
 */
export const getBySupabaseUserId = query({
    args: {
        supabaseUserId: v.string(),
    },
    handler: async (ctx, args) => {
        const users = await ctx.db
            .query('users')
            .collect();
        return users.find(user => user.supabaseUserId === args.supabaseUserId);
    },
});

/**
 * Find a user by token ID
 */
export const getByTokenId = query({
    args: {
        tokenId: v.string(),
    },
    handler: async (ctx, args) => {
        const users = await ctx.db
            .query('users')
            .collect();
        return users.find(user => user.tokenId === args.tokenId);
    },
});

/**
 * Update user profile
 */
export const update = mutation({
    args: {
        id: v.id('users'),
        updates: v.object({
            email: v.optional(v.string()),
            fullName: v.optional(v.string()),
            tokenId: v.optional(v.string()),
            timezone: v.optional(v.string()),
            supabaseUserId: v.optional(v.string()),
        }),
    },
    handler: async (ctx, args) => {
        const user = await ctx.db.get(args.id);
        if (!user) {
            throw new ConvexError(`User with ID ${args.id} not found`);
        }

        // Check for email uniqueness if email is being updated
        if (args.updates.email && args.updates.email !== user.email) {
            const existingUser = await ctx.runQuery(api.users.getByEmail, { email: args.updates.email });
            if (existingUser && existingUser._id !== args.id) {
                throw new ConvexError('Email already in use');
            }
        }

        // Check for tokenId uniqueness if tokenId is being updated
        if (args.updates.tokenId && args.updates.tokenId !== user.tokenId) {
            const existingUser = await ctx.runQuery(api.users.getByTokenId, { tokenId: args.updates.tokenId });
            if (existingUser && existingUser._id !== args.id) {
                throw new ConvexError('Token ID already in use');
            }
        }

        // Check for supabaseUserId uniqueness if supabaseUserId is being updated
        if (args.updates.supabaseUserId && args.updates.supabaseUserId !== user.supabaseUserId) {
            const existingUser = await ctx.runQuery(api.users.getBySupabaseUserId, { 
                supabaseUserId: args.updates.supabaseUserId 
            });
            if (existingUser && existingUser._id !== args.id) {
                throw new ConvexError('Supabase user ID already in use');
            }
        }

        await ctx.db.patch(args.id, args.updates);
        return await ctx.db.get(args.id);
    },
});

/**
 * Delete a user
 */
export const remove = mutation({
    args: {
        id: v.id('users'),
    },
    handler: async (ctx, args) => {
        const user = await ctx.db.get(args.id);
        if (!user) {
            throw new ConvexError(`User with ID ${args.id} not found`);
        }

        await ctx.db.delete(args.id);
        return { success: true };
    },
});