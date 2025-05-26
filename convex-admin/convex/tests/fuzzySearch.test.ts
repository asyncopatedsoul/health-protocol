import { expect, test, describe, beforeAll, afterAll, beforeEach } from 'vitest';
import { api } from '../_generated/api';
import path from 'path';
import fs from 'fs';
import { ConvexTestingHelper } from "convex-helpers/testing";

// Test configuration
const TEST_HOST = process.env.MEILISEARCH_HOST || 'http://localhost';
const TEST_PORT = parseInt(process.env.MEILISEARCH_PORT || '7700');
const TEST_MASTER_KEY = process.env.MEILISEARCH_API_KEY || 'masterKey';
const MEILI_BINARY_PATH = process.env.MEILI_BINARY_PATH || '/usr/local/bin/meilisearch';

// Sample activities for testing
const sampleActivities = [
  {
    _id: 'test1', // This will be replaced with actual ID in tests
    name: 'Barbell Bench Press',
    description: 'A compound exercise that targets the chest, shoulders, and triceps',
    category: 'Strength',
    muscleGroups: ['Chest', 'Shoulders', 'Triceps'],
    equipment: ['Barbell', 'Bench']
  },
  {
    _id: 'test2', // This will be replaced with actual ID in tests
    name: 'Dumbbell Romanian Deadlift',
    description: 'A hip-hinge movement that targets the hamstrings and lower back',
    category: 'Strength',
    muscleGroups: ['Hamstrings', 'Lower Back', 'Glutes'],
    equipment: ['Dumbbells']
  },
  {
    _id: 'test3', // This will be replaced with actual ID in tests
    name: 'Pull-ups',
    description: 'A bodyweight exercise that targets the back and biceps',
    category: 'Bodyweight',
    muscleGroups: ['Back', 'Biceps'],
    equipment: ['Pull-up Bar']
  }
];

describe('Fuzzy Search Service', () => {
  let t: ConvexTestingHelper;
  // Store created activity IDs
  const createdActivityIds: string[] = [];
  let serviceStarted = false;

  // Check if MeiliSearch binary exists
  const meiliExists = fs.existsSync(MEILI_BINARY_PATH);

  // Skip all tests if MeiliSearch binary not found
  beforeAll(async () => {
    t = new ConvexTestingHelper();

    if (!meiliExists) {
      console.log(`Skipping MeiliSearch tests - binary not found at ${MEILI_BINARY_PATH}`);
      console.log('Set MEILI_BINARY_PATH environment variable to run these tests');
      return;
    }

    // Create test activities in the database
    for (const activity of sampleActivities) {
      try {
        const result = await t.action(api.fuzzySearchInternal.createActivity, {
          name: activity.name,
          description: activity.description,
          category: activity.category,
          muscleGroups: activity.muscleGroups,
          equipment: activity.equipment
        });
        
        if (result && result._id) {
          createdActivityIds.push(result._id.toString());
          console.log(`Created test activity: ${activity.name}`);
        }
      } catch (error) {
        console.error(`Error creating test activity ${activity.name}:`, error);
      }
    }
  });

  beforeEach(() => {
    t = new ConvexTestingHelper();
  });

  // Clean up after tests
  afterAll(async () => {
    if (!meiliExists) return;

    // Delete test activities
    for (const id of createdActivityIds) {
      try {
        await api.fuzzySearchInternal.deleteActivity({
          activityId: id as any
        });
        console.log(`Deleted test activity with ID: ${id}`);
      } catch (error) {
        console.error(`Error deleting test activity ${id}:`, error);
      }
    }

    // Stop MeiliSearch service if it was started
    if (serviceStarted) {
      try {
        t.action(api.fuzzySearchExternal.stopFuzzySearchService, {});
        console.log('Stopped MeiliSearch service');
      } catch (error) {
        console.error('Error stopping MeiliSearch service:', error);
      }
    }
  });

  test('should check if fuzzy search service is available', async () => {
    if (!meiliExists) return;

    const result = t.action(api.fuzzySearchExternal.isFuzzySearchServiceAvailable, {});
    expect(result).toBeDefined();
    // Note: This may be true or false depending on whether MeiliSearch is already running
  });

  // test('should start fuzzy search service', async () => {
  //   if (!meiliExists) return;

  //   // Skip if service is already running
  //   const checkResult = await t.action(api.fuzzySearchExternal.isFuzzySearchServiceAvailable, {});
  //   if (checkResult.available) {
  //     console.log('MeiliSearch service already running, skipping start test');
  //     serviceStarted = true;
  //     return;
  //   }

  //   const result = await t.action(api.fuzzySearchExternal.startFuzzySearchService, {
  //     binaryPath: MEILI_BINARY_PATH,
  //     port: TEST_PORT,
  //     masterKey: TEST_MASTER_KEY,
  //     dataPath: path.join(process.cwd(), 'test_meilisearch_data')
  //   });

  //   expect(result.success).toBe(true);
  //   serviceStarted = result.success;

  //   // Verify service is running
  //   const verifyResult = await t.action(api.fuzzySearchExternal.isFuzzySearchServiceAvailable, {
  //     host: `${TEST_HOST}:${TEST_PORT}`,
  //     apiKey: TEST_MASTER_KEY
  //   });
  //   expect(verifyResult.available).toBe(true);
  // });

  test('should create and seed activities index', async () => {
    if (!meiliExists || !serviceStarted) return;

    const result = await t.action(api.fuzzySearchExternal.createAndSeedActivitiesIndex, {
      host: `${TEST_HOST}:${TEST_PORT}`,
      apiKey: TEST_MASTER_KEY,
      indexName: 'test_activities'
    });

    expect(result.success).toBe(true);
    expect(result.filePath).toBeDefined();

    // Verify file was created
    if (result.filePath) {
      const fileExists = fs.existsSync(result.filePath);
      expect(fileExists).toBe(true);
    }

    // Wait a moment for indexing to complete
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  test('should search for activities', async () => {
    if (!meiliExists || !serviceStarted) return;

    

    const result = await t.action(api.fuzzySearchExternal.searchActivities, {
      query: 'bench press',
      showRankingScore: true,
      limit: 10,
      host: `http://localhost:${TEST_PORT}`,
      apiKey: TEST_MASTER_KEY,
      indexName: 'test_activities'
    });

    expect(result.success).toBe(true);
    expect(result.activities).toBeDefined();
    
    // If we have results, the first one should be the bench press
    if (result.activities && result.activities.length > 0) {
      expect(result.activities[0].name).toContain('Bench Press');
    }
  });

  test('should fuzzy match activity name', async () => {
    if (!meiliExists || !serviceStarted) return;

    const result = await t.action(api.fuzzySearchExternal.fuzzyMatchActivityName, {
      name: 'barbell bench',
      threshold: 0.5,
      host: `${TEST_HOST}:${TEST_PORT}`,
      apiKey: TEST_MASTER_KEY,
      indexName: 'test_activities'
    });

    expect(result.success).toBe(true);
    
    // If fuzzy service is available and we have a match
    if (result.fuzzyServiceAvailable && result.matched) {
      expect(result.activity.name).toContain('Bench Press');
    }
  });

  test('should find or create activity by name', async () => {
    if (!meiliExists || !serviceStarted) return;

    // Test finding an existing activity
    const findResult = await t.action(api.fuzzySearchExternal.findOrCreateActivityByName, {
      name: 'pull ups',
      threshold: 0.5,
      host: `http://localhost:${TEST_PORT}`,
      apiKey: TEST_MASTER_KEY,
      indexName: 'test_activities'
    });

    expect(findResult.success).toBe(true);
    
    if (findResult.activity) {
      if (!findResult.created) {
        // Should match existing Pull-ups activity
        expect(findResult.activity.name).toContain('Pull-ups');
      } else {
        // If it created a new one, add to cleanup list
        createdActivityIds.push(findResult.activity._id.toString());
      }
    }

    // Test creating a new activity
    const createResult = await t.action(api.fuzzySearchExternal.findOrCreateActivityByName, {
      name: 'Overhead Tricep Extension',
      description: 'An isolation exercise for the triceps',
      category: 'Strength',
      muscleGroups: ['Triceps'],
      equipment: ['Dumbbell'],
      threshold: 0.8, // High threshold to force creation
      host: `http://localhost:${TEST_PORT}`,
      apiKey: TEST_MASTER_KEY,
      indexName: 'test_activities'
    });

    expect(createResult.success).toBe(true);
    expect(createResult.created).toBe(true);
    
    if (createResult.activity) {
      expect(createResult.activity.name).toBe('Overhead Tricep Extension');
      createdActivityIds.push(createResult.activity._id.toString());
    }
  });

  test('should add and remove activities from index', async () => {
    if (!meiliExists || !serviceStarted) return;

    // Create a test activity
    const newActivity = await api.fuzzySearchInternal.createActivity({
      name: 'Test Activity For Removal',
      description: 'This activity will be added and then removed from the index',
      category: 'Test'
    });

    expect(newActivity).toBeDefined();
    expect(newActivity._id).toBeDefined();
    createdActivityIds.push(newActivity._id.toString());

    // Add to index
    const addResult = await t.action(api.fuzzySearchExternal.addActivitiesToIndex, {
      activities: [newActivity],
      host: `http://localhost:${TEST_PORT}`,
      apiKey: TEST_MASTER_KEY,
      indexName: 'test_activities'
    });

    expect(addResult.success).toBe(true);

    // Wait for indexing
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Search to verify it was added
    const searchResult = await t.action(api.fuzzySearchExternal.searchActivities, {
      query: 'Test Activity For Removal',
      host: `http://localhost:${TEST_PORT}`,
      apiKey: TEST_MASTER_KEY,
      indexName: 'test_activities'
    });

    expect(searchResult.success).toBe(true);
    expect(searchResult.activities.length).toBeGreaterThan(0);

    // Remove from index
    const removeResult = await t.action(api.fuzzySearchExternal.removeActivitiesFromIndex, {
      activityIds: [newActivity._id.toString()],
      host: `http://localhost:${TEST_PORT}`,
      apiKey: TEST_MASTER_KEY,
      indexName: 'test_activities'
    });

    expect(removeResult.success).toBe(true);

    // Wait for removal to process
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Search again to verify it was removed
    const verifyResult = await  t.action(api.fuzzySearchExternal.searchActivities, {
      query: 'Test Activity For Removal',
      host: `http://localhost:${TEST_PORT}`,
      apiKey: TEST_MASTER_KEY,
      indexName: 'test_activities'
    });

    expect(verifyResult.success).toBe(true);
    
    // Check if the activity was removed from search results
    const activityFound = verifyResult.activities.some(
      a => a.name === 'Test Activity For Removal'
    );
    expect(activityFound).toBe(false);
  });
});
