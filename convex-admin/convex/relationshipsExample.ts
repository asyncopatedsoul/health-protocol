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

function testUser(
  fields: Partial<Doc<"users">>,
): WithoutSystemFields<Doc<"users">> {
  return {
    email: "test@test.com",
    fullName: "test user",
    tokenId: "test",
    ...fields,
  };
}

export const relationshipTest = query({
  args: {},
  returns: v.object({
    _id: v.id("users"),
    _creationTime: v.number(),
    preferencesId: v.optional(v.id("preferences")),
    email: v.string(),
    fullName: v.string(),
    tokenId: v.string(),
  }),
  handler: async ({ db }) => {
    const user = await db
      .query("users")
      .filter((q) => q.eq(q.field("email"), "michael.garrido@getconvex.dev"))
      .first();
    console.log(user)
    return user;
  },
});

export const addRandomFile = internalAction({
  args: {},
  handler: async (ctx, args): Promise<void> => {
    await ctx.storage.store(new Blob(["test"]));
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

function assertLength(list: any[], length: number) {
  if (list.length !== length) {
    throw new Error(`Expected length ${length}, got ${list.length}`);
  }
}
function assertHasNull(value: any[]) {
  if (value.findIndex((v) => v === null) === -1) {
    throw new Error("Expected to find null");
  }
}
function assertNull(value: any) {
  if (value !== null) {
    throw new Error(`Expected null, got ${value}`);
  }
}

function assertNotNull(value: any) {
  if (value === null) {
    throw new Error(`Expected not null, got ${value}`);
  }
}

// export default relationshipTest;