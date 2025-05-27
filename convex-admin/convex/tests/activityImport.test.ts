import { expect, test, describe, beforeAll, afterAll } from 'vitest';
import { api } from '../_generated/api';
import { ConvexTestingHelper } from "convex-helpers/testing";

// Sample note content for testing
const sampleNoteContent = `2025-04-17

Smith Romanian deadlift
90 x 8
110 x 6
130 x 6

Deadlift 
130 
140 x 6
160 x 5
180 x 3
180 x 3 - grip feeling week

Pull-ups 
Goal: 33 in 12 mins
7 7 4 4 3 4 4 2
35 in 10 mins

Lat pulldown
100 x 5`;

// Expected parsed activities
const expectedParsedActivities = [
  {
    nameRaw: "Smith Romanian deadlift",
    metadataRaw: ['90 x 8', '110 x 6', '130 x 6'],
    metadataParsed: {
      sets: [
        { weight: 90, reps: 8 },
        { weight: 110, reps: 6 },
        { weight: 130, reps: 6 }
      ]
    }
  },
  {
    nameRaw: "Deadlift",
    metadataRaw: ['130', '140 x 6', '160 x 5', '180 x 3', '180 x 3 - grip feeling week'],
    metadataParsed: {
      sets: [
        { weight: 130, reps: 1 },
        { weight: 140, reps: 6 },
        { weight: 160, reps: 5 },
        { weight: 180, reps: 3 },
        { weight: 180, reps: 3, notes: '- grip feeling week' }
      ]
    }
  },
  {
    nameRaw: "Pull-ups",
    metadataRaw: ['Goal: 33 in 12 mins', '7 7 4 4 3 4 4 2', '35 in 10 mins'],
    metadataParsed: {
      goalReps: 33,
      goalTime: 12,
      reps: 35,
      time: 10,
      repSets: [7, 7, 4, 4, 3, 4, 4, 2]
    }
  },
  {
    nameRaw: "Lat pulldown",
    metadataRaw: ['100 x 5'],
    metadataParsed: {
      weight: 100,
      reps: 5
    }
  }
];

describe('Activity Import', () => {
  let t: ConvexTestingHelper;
  // Store created IDs for cleanup
  const createdIds = {
    activities: [] as string[],
    notes: [] as string[],
    events: [] as string[],
    users: [] as string[]
  };

  beforeAll(async () => {
    t = new ConvexTestingHelper();

    // Create a test user
    // const user = await t.mutation(api.users.create, {
    //   email: "test@example.com",
    //   fullName: "Test User",
    //   tokenId: "test-token",
    //   timezone: "America/Los_Angeles"
    // });

    const testUser = {
      _id: "jh75s7p7ggrbcbj5jswyjgfvj97gh7bv",
      email: "test@test.com",
      fullName: "Test User",
      tokenId: "testuser",
      timezone: "America/Los_Angeles"
    }
    
    if (testUser) {
      createdIds.users.push(testUser._id.toString());
    }
  });

  afterAll(async () => {
    // Clean up created resources
    for (const eventId of createdIds.events) {
      try {
        await t.mutation(api.events.delete, { id: eventId as any });
      } catch (error) {
        console.error(`Error deleting event ${eventId}:`, error);
      }
    }

    // for (const noteId of createdIds.notes) {
    //   try {
    //     await t.mutation(api.notes.delete, { id: noteId as any });
    //   } catch (error) {
    //     console.error(`Error deleting note ${noteId}:`, error);
    //   }
    // }

    // for (const activityId of createdIds.activities) {
    //   try {
    //     await t.mutation(api.fuzzySearchInternal.deleteActivity, { activityId: activityId as any });
    //   } catch (error) {
    //     console.error(`Error deleting activity ${activityId}:`, error);
    //   }
    // }

    // for (const userId of createdIds.users) {
    //   try {
    //     await t.mutation(api.users.delete, { id: userId as any });
    //   } catch (error) {
    //     console.error(`Error deleting user ${userId}:`, error);
    //   }
    // }
  });

  test('should parse note content into activities', async () => {
    const result = await t.query(api.activityImport.parseNoteContent, {
      content: sampleNoteContent
    });

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(4);

    // Check each activity was parsed correctly
    expect(result[0].nameRaw).toBe("Smith Romanian deadlift");
    expect(result[1].nameRaw).toBe("Deadlift");
    expect(result[2].nameRaw).toBe("Pull-ups");
    expect(result[3].nameRaw).toBe("Lat pulldown");

    // Check metadata parsing
    expect(result[0].metadataRaw).toHaveLength(3);
    expect(result[0].metadataParsed.sets).toHaveLength(3);
    expect(result[0].metadataParsed.sets[0].weight).toBe(90);
    expect(result[0].metadataParsed.sets[0].reps).toBe(8);

    // Check time-based activity parsing
    expect(result[2].metadataParsed.goalReps).toBe(33);
    expect(result[2].metadataParsed.goalTime).toBe(12);
    expect(result[2].metadataParsed.reps).toBe(35);
    expect(result[2].metadataParsed.time).toBe(10);
  });

  test('should match or create an activity', async () => {
    const parsedActivity = {
      nameRaw: "Bench Press",
      metadataRaw: ["100 x 5", "120 x 3"],
      metadataParsed: {
        sets: [
          { weight: 100, reps: 5 },
          { weight: 120, reps: 3 }
        ]
      }
    };

    const result = await t.action(api.activityImport.matchOrCreateActivity, {
      parsedActivity,
      threshold: 0.6
    });

    expect(result.success).toBe(true);
    expect(result.activity).toBeDefined();
    
    if (result.activity) {
      createdIds.activities.push(result.activity._id.toString());
      expect(result.activity.name).toBe("Bench Press");
    }

    // Try to match the same activity again
    const secondResult = await t.action(api.activityImport.matchOrCreateActivity, {
      parsedActivity,
      threshold: 0.6
    });

    expect(secondResult.success).toBe(true);
    expect(secondResult.created).toBe(false); // Should find existing one
    expect(secondResult.activity).toBeDefined();
    
    if (secondResult.activity && !secondResult.created) {
      expect(secondResult.activity.name).toBe("Bench Press");
    }
  });

  test('should create an activity event', async () => {
    if (createdIds.users.length === 0) {
      console.log('Skipping test - no test user created');
      return;
    }

    // Create a test note
    const note = await t.mutation(api.notes.create, {
      userId: createdIds.users[0] as any,
      content: "Test note for activity event"
    });

    expect(note).toBeDefined();
    if (note) {
      createdIds.notes.push(note._id.toString());
    }

    // Create a test activity
    const activityResult = await t.action(api.activityImport.matchOrCreateActivity, {
      parsedActivity: {
        nameRaw: "Squat",
        metadataRaw: ["150 x 5", "170 x 3"],
        metadataParsed: {
          sets: [
            { weight: 150, reps: 5 },
            { weight: 170, reps: 3 }
          ]
        }
      }
    });

    expect(activityResult.success).toBe(true);
    expect(activityResult.activity).toBeDefined();
    
    if (activityResult.activity) {
      createdIds.activities.push(activityResult.activity._id.toString());
    }

    // Create an event
    const eventResult = await t.mutation(api.activityImport.createActivityEvent, {
      userId: createdIds.users[0] as any,
      noteId: note._id,
      activityId: activityResult.activity._id,
      parsedActivity: {
        nameRaw: "Squat",
        metadataRaw: ["150 x 5", "170 x 3"]
      },
      activityRecord: activityResult.activity
    });

    expect(eventResult.success).toBe(true);
    expect(eventResult.eventId).toBeDefined();
    
    if (eventResult.eventId) {
      createdIds.events.push(eventResult.eventId.toString());
    }
  });

  test('should process a note to extract activities and create events', async () => {
    if (createdIds.users.length === 0) {
      console.log('Skipping test - no test user created');
      return;
    }

    // Create a test note with the sample content
    const note = await t.mutation(api.notes.create, {
      userId: createdIds.users[0] as any,
      content: sampleNoteContent
    });

    expect(note).toBeDefined();
    if (note) {
      createdIds.notes.push(note._id.toString());
    }

    // Process the note
    const result = await t.action(api.activityImport.processNoteActivities, {
      noteId: note._id
    });

    expect(result.success).toBe(true);
    expect(result.activitiesFound).toBe(4);
    expect(result.eventsCreated).toBe(4);
    
    // Store created activity IDs for cleanup
    if (result.activities) {
      for (const item of result.activities) {
        if (item.activity && item.activity._id) {
          createdIds.activities.push(item.activity._id.toString());
        }
        if (item.event) {
          createdIds.events.push(item.event.toString());
        }
      }
    }
  });

  test('should process multiple notes', async () => {
    if (createdIds.users.length === 0) {
      console.log('Skipping test - no test user created');
      return;
    }

    // Create test notes
    const notes = [];
    
    const note1 = await t.mutation(api.notes.create, {
      userId: createdIds.users[0] as any,
      content: "Pushups\n20 reps\n25 reps\n15 reps"
    });
    
    const note2 = await t.mutation(api.notes.create, {
      userId: createdIds.users[0] as any,
      content: "Situps\n30 reps\n20 reps"
    });
    
    expect(note1).toBeDefined();
    expect(note2).toBeDefined();
    
    if (note1) {
      notes.push(note1._id);
      createdIds.notes.push(note1._id.toString());
    }
    
    if (note2) {
      notes.push(note2._id);
      createdIds.notes.push(note2._id.toString());
    }

    // Process multiple notes
    const result = await t.action(api.activityImport.processMultipleNotes, {
      noteIds: notes
    });

    expect(result.success).toBe(true);
    expect(result.notesProcessed).toBe(2);
    expect(result.activitiesFound).toBe(2);
    expect(result.eventsCreated).toBe(2);
    
    // Check details for each note
    expect(result.details).toHaveLength(2);
    expect(result.details[0].activitiesFound).toBe(1);
    expect(result.details[1].activitiesFound).toBe(1);
  });
});
