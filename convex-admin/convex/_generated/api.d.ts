/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as activities from "../activities.js";
import type * as activityImport from "../activityImport.js";
import type * as events from "../events.js";
import type * as fuzzySearchExternal from "../fuzzySearchExternal.js";
import type * as fuzzySearchInternal from "../fuzzySearchInternal.js";
import type * as notes from "../notes.js";
import type * as protocolManagement from "../protocolManagement.js";
import type * as remoteSourceSupabase from "../remoteSourceSupabase.js";
import type * as remoteUserActivity from "../remoteUserActivity.js";
import type * as sum from "../sum.js";
import type * as testFunctions from "../testFunctions.js";
import type * as userHistory from "../userHistory.js";
import type * as users from "../users.js";
import type * as utils from "../utils.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  activities: typeof activities;
  activityImport: typeof activityImport;
  events: typeof events;
  fuzzySearchExternal: typeof fuzzySearchExternal;
  fuzzySearchInternal: typeof fuzzySearchInternal;
  notes: typeof notes;
  protocolManagement: typeof protocolManagement;
  remoteSourceSupabase: typeof remoteSourceSupabase;
  remoteUserActivity: typeof remoteUserActivity;
  sum: typeof sum;
  testFunctions: typeof testFunctions;
  userHistory: typeof userHistory;
  users: typeof users;
  utils: typeof utils;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
