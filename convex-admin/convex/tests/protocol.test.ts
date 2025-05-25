import { expect, test, describe, beforeEach, afterEach, afterAll } from 'vitest'
import { sum } from '../sum.js'
import { api } from '../_generated/api.js'
import { ConvexTestingHelper } from "convex-helpers/testing";
import { format } from 'date-fns';

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
    
    test("plan activities for user based on program", async () => {
        // Get the test user
        const user = await t.query(api.protocolManagement.getUser, { email: "test@test.com" });
        expect(user).not.toBeNull();
        
        // Get the program with phases
        const program = await t.query(api.protocolManagement.getProgram, { name: "Intro to Breathwork" });
        expect(program).not.toBeNull();
        expect(program.phases).toBeDefined();
        expect(program.phases && program.phases.length).toBeGreaterThan(0);
        
        // Plan activities for the user based on the program
        const plannedActivities = await t.mutation(api.userHistory.planActivitiesForUserProgram, {
            userId: user._id,
            programId: program._id,
            durationWeeks: 4
        });
        
        // Verify planned activities were created
        expect(plannedActivities).not.toBeNull();
        expect(plannedActivities.length).toBeGreaterThan(0);
        
        // Verify the planned activities are for the correct user and program
        plannedActivities.forEach(activity => {
            expect(activity.userId).toBe(user._id);
            expect(activity.programId).toBe(program._id);
            expect(activity.plannedTimeUtcMs).toBeGreaterThan(0);
        });
        
        // Get all planned activities for the user and verify they match
        const userPlannedActivities = await t.query(api.userHistory.getUserPlannedActivities, {
            userId: user._id
        });
        
        expect(userPlannedActivities.length).toBe(plannedActivities.length);
        
        // Log some details about the planned activities for debugging
        console.log(`Planned ${plannedActivities.length} activities for user ${user.fullName}`);
        const firstActivity = plannedActivities[0];
        if (firstActivity) {
            const date = new Date(firstActivity.plannedTimeUtcMs);
            console.log(`First activity planned for: ${format(date, 'yyyy-MM-dd HH:mm:ss')}`);
        }
    });
});