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

export const getUser = query({
  args: { email: v.string() },
  returns: v.object({
    _id: v.id("users"),
    _creationTime: v.number(),
    preferencesId: v.optional(v.id("preferences")),
    email: v.string(),
    fullName: v.string(),
    tokenId: v.string(),
  }),
  handler: async ({ db }, args) => {
    const user = await db
      .query("users")
      .filter((q) => q.eq(q.field("email"), args.email))
      .first();
    return user;
  },
});

export const getProtocol = query({
  args: { name: v.string() },
  returns: v.object({
    _id: v.id("protocols"),
    _creationTime: v.number(),
    authorId: v.optional(v.id("users")),
    name: v.string(),
    slug: v.optional(v.string()),
    description: v.optional(v.string()),
    guides: v.optional(v.object({
      type: v.string(),
      id: v.optional(v.id("guides")),
    })),
  }),
  handler: async ({ db }, args) => {
    const protocol = await db
      .query("protocols")
      .filter((q) => q.eq(q.field("name"), args.name))
      .first();
    return protocol;
  },
});

export const getActivity = query({
  args: { name: v.string() },
  returns: v.object({
    _id: v.id("activities"),
    _creationTime: v.number(),
    authorId: v.optional(v.id("users")),
    name: v.string(),
    slug: v.optional(v.string()),
    description: v.optional(v.string()),
    guides: v.optional(v.object({
      type: v.string(),
      id: v.optional(v.id("guides")),
    })),
  }),
  handler: async ({ db }, args) => {
    const activity = await db
      .query("activities")
      .filter((q) => q.eq(q.field("name"), args.name))
      .first();
    return activity;
  },
});

export const getUserProtocols = query({
  args: { userId: v.id("users") },
  returns: v.array(v.object({
    _id: v.id("user_protocols"),
    protocolId: v.id("protocols"),
    userId: v.id("users"),
    updatedAtMs: v.int64(),
    _creationTime: v.number(),
  })),
  handler: async ({ db }, args) => {
    const protocols = await db
      .query("user_protocols")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .collect();
    return protocols;
  },
});

export const addProtocolToUser = mutation({
  args: { userId: v.id("users"), protocolId: v.id("protocols") },
  handler: async ({ db }, args) => {
    await db.insert("user_protocols", {
      userId: args.userId,
      protocolId: args.protocolId,
      updatedAtMs: BigInt(Date.now()),
    });
  },
});

export const addActivityToProtocol = mutation({
  args: { protocolId: v.id("protocols"), activityId: v.id("activities"), parameters: v.optional(v.object({
    property: v.string(),
    value: v.string(),
  })) },
  handler: async ({ db }, args) => {
    await db.insert("protocol_activities", {
      protocolId: args.protocolId,
      activityId: args.activityId,
      parameters: args.parameters,
    });
  },
});

export const getProgram = query({
  args: { name: v.string() },
  returns: v.object({
    _id: v.id("programs"),
    _creationTime: v.number(),
    name: v.string(),
    authorId: v.optional(v.id("users")),
    userId: v.optional(v.id("users")),
    phases: v.optional(v.array(
      v.object({
        name: v.string(),
        exitCriteria: v.array(
          v.object({
            slug: v.string(),
            limit: v.optional(v.object({
              daily: v.number()
            })),
            target: v.optional(v.object({
              total: v.number()
            }))
          })
        ),
        sequence: v.array(
          v.object({
            weekday: v.optional(v.number()),
            day: v.optional(v.number()),
            activities: v.array(
              v.object({
                slug: v.string()
              })
            )
          })
        )
      })
    ))
  }),
  handler: async ({ db }, args) => {
    const program = await db
      .query("programs")
      .filter((q) => q.eq(q.field("name"), args.name))
      .first();
      
    if (!program) {
      throw new Error(`Program with name '${args.name}' not found`);
    }
    
    return program;
  },
});

// export const joinTableExample = query({
//   args: { userId: v.id("users"), sid: v.id("_storage") },
//   handler: async (ctx, args) => {
//     const sessions = await getManyVia(
//       ctx.db,
//       "join_table_example",
//       "presenceId",
//       "by_userId",
//       args.userId,
//     );
//     const files = await getManyVia(
//       ctx.db,
//       "join_storage_example",
//       "storageId",
//       "userId_storageId",
//       args.userId,
//       "userId",
//     );
//     const users = await getManyVia(
//       ctx.db,
//       "join_storage_example",
//       "userId",
//       "storageId",
//       args.sid,
//     );
//     return { sessions, files, users };
//   },
// });