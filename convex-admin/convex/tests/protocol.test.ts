import { expect, test, describe, beforeEach, afterEach } from 'vitest'
import { sum } from '../sum.js'
import { api } from '../_generated/api.js'
import { ConvexTestingHelper } from "convex-helpers/testing";

describe("testingExample", () => {
  let t: ConvexTestingHelper;

  beforeEach(() => {
    t = new ConvexTestingHelper();
  });

  afterEach(async () => {
    // await t.mutation(api.testingFunctions.clearAll, {});
    // await t.close();
  });

  test('adds 1 + 2 to equal 3', () => {
    expect(sum(1, 2)).toBe(3)
  })  

  test("relationship test", async () => {
    let user = await t.query(api.relationshipsExample.relationshipTest, {});
    expect(user?.email).toBe("michael.garrido@getconvex.dev");
  });
});