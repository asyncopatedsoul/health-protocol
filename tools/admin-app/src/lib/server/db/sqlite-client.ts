import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import { join } from 'path';
import { eq, and } from 'drizzle-orm';
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

// Define schema for activities and relationships
const activities = sqliteTable('activities', {
  id: integer('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  type: text('type'),
  difficulty_level: integer('difficulty_level'),
  activity_type: text('activity_type'),
  complexity_level: integer('complexity_level')
});

const activityRelationships = sqliteTable('ActivityRelationships', {
  id: integer('id').primaryKey(),
  activity1_id: integer('activity1_id'),
  activity2_id: integer('activity2_id'),
  relationship_type: text('relationship_type')
});

// Create database connection
const dbPath = `file:${join(process.cwd(), 'health_protocol.db')}`;
const client = createClient({ url: dbPath });
export const db = drizzle(client, { schema: { activities, activityRelationships } });

// Function to get all activities
export async function getAllActivities() {
  try {
    const result = await db.select().from(activities);
    return result;
  } catch (error) {
    console.error('Error fetching activities:', error);
    throw error;
  }
}

// Function to get all activity relationships
export async function getAllActivityRelationships() {
  try {
    const result = await db.select().from(activityRelationships);
    return result;
  } catch (error) {
    console.error('Error fetching activity relationships:', error);
    throw error;
  }
}

// Function to get activity by ID
export async function getActivityById(id: number) {
  try {
    const result = await db.select().from(activities).where(eq(activities.id, id));
    return result[0] || null;
  } catch (error) {
    console.error(`Error fetching activity with ID ${id}:`, error);
    throw error;
  }
}

// Function to get relationships for a specific activity
export async function getRelationshipsForActivity(activityId: number) {
  try {
    const result = await db.select().from(activityRelationships).where(
      and(
        eq(activityRelationships.activity1_id, activityId),
        eq(activityRelationships.activity2_id, activityId)
      )
    );
    return result;
  } catch (error) {
    console.error(`Error fetching relationships for activity ${activityId}:`, error);
    throw error;
  }
}

// Function to get activities with their relationships
export async function getActivitiesWithRelationships() {
  try {
    const activitiesList = await getAllActivities();
    const relationships = await getAllActivityRelationships();
    
    return {
      nodes: activitiesList.map(activity => ({
        id: activity.id,
        name: activity.name,
        type: activity.type || 'unknown',
        difficulty: activity.difficulty_level || 1,
        complexity: activity.complexity_level || 1,
        description: activity.description
      })),
      links: relationships.map(rel => ({
        source: rel.activity1_id,
        target: rel.activity2_id,
        type: rel.relationship_type
      }))
    };
  } catch (error) {
    console.error('Error getting activities with relationships:', error);
    throw error;
  }
}