// convex/users.ts
import { mutation } from './_generated/server'; // Or from './auth' if you're using the custom auth context
import { v } from 'convex/values';
import { Doc } from './_generated/dataModel'; // Import Doc type for type safety

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

// You might also want a mutation to update user details
export const updateUserProfile = mutation({
    args: {
        userId: v.id("users"), // The Convex ID of the user to update
        updates: v.object({
            email: v.optional(v.string()),
            name: v.optional(v.string()),
            // Add other updatable fields here
        }),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();

        if (!identity) {
            throw new Error("Not authenticated");
        }

        // IMPORTANT SECURITY CHECK: Ensure the authenticated user is updating THEIR OWN profile
        const supabaseUserId = identity.tokenIdentifier.split('|')[1];
        const userToUpdate = await ctx.db.get(args.userId);

        if (!userToUpdate || userToUpdate.supabaseUserId !== supabaseUserId) {
            throw new Error("Unauthorized: You can only update your own profile.");
        }

        await ctx.db.patch(args.userId, args.updates);

        console.log(`Updated user profile for Convex ID: ${args.userId}`);
    },
});