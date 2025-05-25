import { expect, test, describe, beforeEach, afterEach, afterAll } from 'vitest'
import { sum } from '../sum.js'
import { api } from '../_generated/api.js'
import { ConvexTestingHelper } from "convex-helpers/testing";

describe("testingExample", () => {
    let t: ConvexTestingHelper;

    // console.log(process.env)
    // console.log(process.env.VITE_IS_TEST);

    beforeEach(() => {
        t = new ConvexTestingHelper();
    });

    afterEach(async () => {
        // await t.mutation(api.testFunctions.clearAllTestUser, {});
        // await t.close();
    });

    afterAll(async () => {
        await t.mutation(api.testFunctions.clearAllTestUser, { isTest: true });
        await t.close();
    });

    test('adds 1 + 2 to equal 3', () => {
        expect(sum(1, 2)).toBe(3)
    })

    test("test user exists", async () => {
        let user = await t.query(api.protocolManagement.getUser, { email: "test@test.com" });
        expect(user?.email).toBe("test@test.com");
        expect(user?.fullName).toBe("Test User");
        expect(user?.tokenId).toBe("testuser");
    });

    test("add protocol to user", async () => {
        // get records
        let user = await t.query(api.protocolManagement.getUser, { email: "test@test.com" });
        let protocol = await t.query(api.protocolManagement.getProtocol, { name: "Stress Resilience" });
        expect(protocol?.name).toBe("Stress Resilience");
        let protocol2 = await t.query(api.protocolManagement.getProtocol, { name: "Improving Endurance" });
        expect(protocol2?.name).toBe("Improving Endurance");
        // add protocols to user
        await t.mutation(api.protocolManagement.addProtocolToUser, { userId: user?._id, protocolId: protocol?._id });
        await t.mutation(api.protocolManagement.addProtocolToUser, { userId: user?._id, protocolId: protocol2?._id });
        let protocols = await t.query(api.protocolManagement.getUserProtocols, { userId: user?._id });
        expect(protocols?.length).toBe(2);
    });
});