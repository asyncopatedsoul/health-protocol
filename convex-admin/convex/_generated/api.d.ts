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
import type * as protocolManagement from "../protocolManagement.js";
import type * as remoteSourceSupabase from "../remoteSourceSupabase.js";
import type * as remoteUserActivity from "../remoteUserActivity.js";
import type * as sum from "../sum.js";
import type * as testFunctions from "../testFunctions.js";
import type * as userHistory from "../userHistory.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  protocolManagement: typeof protocolManagement;
  remoteSourceSupabase: typeof remoteSourceSupabase;
  remoteUserActivity: typeof remoteUserActivity;
  sum: typeof sum;
  testFunctions: typeof testFunctions;
  userHistory: typeof userHistory;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
