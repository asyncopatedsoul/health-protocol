import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Table for storing user activity snapshots from Supabase
  user_activity_snapshots: defineTable({
    userId: v.string(),
    fileName: v.string(),
    storageId: v.string(),
    recordCount: v.number(),
    uploadedToSupabase: v.boolean(),
    createdAt: v.number()
  }).index("by_userId", ["userId"]).index("by_createdAt", ["createdAt"]),
  users: defineTable({
    // id: v.id("users"),
    email: v.string(),
    fullName: v.string(),
    preferencesId: v.optional(v.id("preferences")),
    tokenId: v.string(),
    timezone: v.optional(v.string()), // e.g., 'America/Los_Angeles', 'Europe/London'
    supabaseUserId: v.optional(v.string()),
  }).index("by_email", ["email"]).index("by_supabaseUserId", ["supabaseUserId"]),
  preferences: defineTable({
    userId: v.union(v.id("users"), v.null()),
  }),
  accounts: defineTable({
    id: v.id("accounts"),
    name: v.string(),
    authUserId: v.union(v.string(), v.null()),
    // number: v.number(),
    // boolean: v.boolean(),
    // nestedObject: v.object({
    //   property: v.string(),
    // }),
  }),
  profiles: defineTable({
    displayName: v.string(),
    userId: v.optional(v.id("users")),
  }).index("userId", ["userId"]),
  guides: defineTable({
    authorId: v.optional(v.id("users")),
    activityId: v.optional(v.id("activities")),
    protocolId: v.optional(v.id("protocols")),
    name: v.string(),
    slug: v.optional(v.string()),
    type: v.string(),
    description: v.optional(v.string()),
    isExternal: v.boolean(),
    mediaId: v.optional(v.id("media")),
    url: v.optional(v.string()),
    tags: v.array(v.string()),
  }).index("authorId", ["authorId"]),
  media: defineTable({
    authorId: v.optional(v.id("users")),
    url: v.string(),
    type: v.string(),
    isExternal: v.boolean(),
  }).index("authorId", ["authorId"]),
  protocols: defineTable({
    authorId: v.optional(v.id("users")),
    name: v.string(),
  }).index("authorId", ["authorId"]),
  user_protocols: defineTable({
    userId: v.id("users"),
    protocolId: v.id("protocols"),
    updatedAtMs: v.int64(),
  }).index("userId", ["userId"]).index("protocolId", ["protocolId"]),
  activities: defineTable({
    authorId: v.optional(v.id("users")),
    name: v.string(),
    slug: v.optional(v.string()),
    description: v.optional(v.string()),
    guides: v.optional(v.object({
      type: v.string(),
      id: v.optional(v.id("guides")),
    })),
  }).index("authorId", ["authorId"]),
  protocol_activities: defineTable({
    activityId: v.id("activities"),
    protocolId: v.id("protocols"),
    parameters: v.optional(v.object({
      property: v.string(),
    })),
  }).index("activityId", ["activityId"]).index("protocolId", ["protocolId"]),
  planned_activities: defineTable({
    userId: v.id("users"),
    activityId: v.id("activities"),
    protocolId: v.optional(v.id("protocols")),
    programId: v.optional(v.id("programs")),
    parameters: v.optional(v.object({
      property: v.string(),
    })),
    // Store as milliseconds since epoch (UTC)
    plannedTimeUtcMs: v.number(),
  }).index("activityId", ["activityId"]).index("protocolId", ["protocolId"]).index("programId", ["programId"]),
  programs: defineTable({
    name: v.string(),
    userId: v.id("users"),
    authorId: v.id("users"),
    phases: v.optional(v.array(v.object({
      name: v.string(),
      exitCriteria: v.array(v.object({
        slug: v.string(),
        limit: v.object({
          daily: v.number(),
        }),
        target: v.object({
          total: v.optional(v.number()),
          daily: v.optional(v.number()),
        }),
      })),
      sequence: v.array(v.object({
        day: v.optional(v.number()),
        weekday: v.optional(v.number()),
        activities: v.array(v.object({
          slug: v.string(),
        })),
      })),
    }))),
  }).index("userId", ["userId"]),
  events: defineTable({
    userId: v.id("users"),
    type: v.string(),
    status: v.string(),
    context: v.optional(v.object({
      activityId: v.optional(v.id("activities")),
      protocolId: v.optional(v.id("protocols")),
      noteId: v.optional(v.id("notes")),
      programId: v.optional(v.id("programs")),
    })),
    metadata: v.optional(v.object({
      activity: v.optional(v.any()),
      note: v.optional(v.any()),
      program: v.optional(v.any()),
      protocol: v.optional(v.any()),
      user: v.optional(v.any()),
    })),
  }).index("userId", ["userId"]),
  notes: defineTable({
    userId: v.optional(v.id("users")),
    createdAtMs: v.optional(v.int64()),
    lastSavedMs: v.optional(v.int64()),
    content: v.string(),
    source: v.optional(v.string()),
    externalId: v.optional(v.string()),
  }).index("userId", ["userId"]),
});