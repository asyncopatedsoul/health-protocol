import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    // id: v.id("users"),
    email: v.string(),
    fullName: v.string(),
    preferencesId: v.optional(v.id("preferences")),
    tokenId: v.string(),
  }),
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
    parameters: v.object({
      property: v.string(),
    }),
  }).index("activityId", ["activityId"]).index("protocolId", ["protocolId"]),
  events: defineTable({
    type: v.string(),
    userId: v.optional(v.id("users")),
  }).index("userId", ["userId"]),
  notes: defineTable({
    userId: v.optional(v.id("users")),
    createdAtMs: v.int64(),
    content: v.string(),
  }).index("userId", ["userId"]),
});