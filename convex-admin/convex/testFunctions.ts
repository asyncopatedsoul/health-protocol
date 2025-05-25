import { v } from "convex/values";
import { internalAction, mutation, query, action } from "./_generated/server";
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

import {
    customAction,
    customMutation,
    customQuery,
} from "convex-helpers/server/customFunctions";
import schema from "./schema";

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

// Wrappers to use for function that should only be called from tests
export const testingQuery = customQuery(query, {
    args: { isTest: v.boolean() },
    input: async (_ctx, _args) => {
        if (_args.isTest === undefined) {
            throw new Error(
                "Calling a test only function in an unexpected environment",
            );
        }
        return { ctx: {}, args: {} };
    },
});

export const testingMutation = customMutation(mutation, {
    args: { isTest: v.boolean() },
    input: async (_ctx, _args) => {
        console.log(_args);
        if (_args.isTest === undefined) {
            throw new Error(
                "Calling a test only function in an unexpected environment",
            );
        }
        return { ctx: {}, args: {} };
    },
});

export const testingAction = customAction(action, {
    args: { isTest: v.boolean() },
    input: async (_ctx, _args) => {
        if (_args.isTest === undefined) {
            throw new Error(
                "Calling a test only function in an unexpected environment",
            );
        }
        return { ctx: {}, args: {} };
    },
});

export const clearAllTestUser = testingMutation({
    args: { isTest: v.boolean() },
    handler: async ({ db }) => {
        const testUser = await db
            .query("users")
            .filter((q) => q.eq(q.field("tokenId"), "testuser"))
            .first();
        console.log(testUser)
        if (testUser) {
            const userId = testUser._id;
            const protocols = await db.query("user_protocols").filter((q) => q.eq(q.field("userId"), userId)).collect();
            // const protocols = await db.query("protocol_activities").filter((q) => q.eq(q.field("userId"), userId)).collect();
            let userDocs = [...protocols];
            await Promise.all(userDocs.map((doc) => db.delete(doc._id)));
        }
    }
});

export const clearAll = testingMutation({
    args: { isTest: v.boolean() },
    handler: async ({ db, scheduler, storage }) => {
    for (const table of Object.keys(schema.tables)) {
        const docs = await db.query(table as any).collect();
        await Promise.all(docs.map((doc) => db.delete(doc._id)));
    }
    const scheduled = await db.system.query("_scheduled_functions").collect();
    await Promise.all(scheduled.map((s) => scheduler.cancel(s._id)));
    const storedFiles = await db.system.query("_storage").collect();
    await Promise.all(storedFiles.map((s) => storage.delete(s._id)));
    }
});

export const addRandomFile = internalAction({
    args: {},
    handler: async (ctx, args): Promise<void> => {
        await ctx.storage.store(new Blob(["test"]));
    },
});

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