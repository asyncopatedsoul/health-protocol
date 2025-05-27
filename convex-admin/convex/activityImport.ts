import { v } from 'convex/values';
import { action, mutation, query } from './_generated/server';
import { api } from './_generated/api';
import { Id } from './_generated/dataModel';

// Interface for parsed activity
export interface ParsedActivity {
  nameRaw: string;
  metadataRaw?: string[];
  metadataParsed?: any;
}

// Interface for parsed set data
export interface ParsedSet {
  reps?: number;
  weight?: number;
  time?: number;
  distance?: number;
  notes?: string;
}

/**
 * Parse a note's content to extract activities
 */
export const parseNoteContent = query({
  args: {
    content: v.string()
  },
  handler: async (ctx, args) => {
    return parseActivitiesFromNote(args.content);
  }
});

/**
 * Match or create an activity based on parsed activity data
 */
export const matchOrCreateActivity = action({
  args: {
    parsedActivity: v.any(),
    threshold: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const { parsedActivity } = args;
    const threshold = args.threshold || 0.7;

    if (!parsedActivity || !parsedActivity.nameRaw) {
      return { success: false, error: 'Invalid parsed activity data' };
    }

    try {
      // Try to find a matching activity using fuzzy search
      const matchResult = await ctx.runAction(api.fuzzySearchExternal.fuzzyMatchActivityName, {
        name: parsedActivity.nameRaw,
        threshold
      });

      if (matchResult.success && matchResult.matched && matchResult.activity) {
        // Found a matching activity
        return {
          success: true,
          activity: matchResult.activity,
          created: false,
          score: matchResult.score
        };
      }

      // No match found, create a new activity
      const newActivity = await ctx.runMutation(api.fuzzySearchInternal.createActivity, {
        name: parsedActivity.nameRaw,
        description: `Imported from note. Raw metadata: ${JSON.stringify(parsedActivity.metadataRaw || [])}`
      });

      // Add the new activity to the search index
      if (matchResult.fuzzyServiceAvailable) {
        await ctx.runAction(api.fuzzySearchExternal.addActivitiesToIndex, {
          activities: [newActivity]
        });
      }

      return {
        success: true,
        activity: newActivity,
        created: true
      };
    } catch (error) {
      console.error('Error matching or creating activity:', error);
      return { success: false, error: String(error) };
    }
  }
});

/**
 * Create an event record for an activity
 */
export const createActivityEvent = mutation({
  args: {
    userId: v.id('users'),
    noteId: v.id('notes'),
    activityId: v.id('activities'),
    parsedActivity: v.any(),
    activityRecord: v.any(),
    noteRecord: v.optional(v.any())
  },
  handler: async (ctx, args) => {
    const { db } = ctx;
    const { userId, noteId, activityId, parsedActivity, activityRecord, noteRecord } = args;

    try {
      // Create the event record
      const eventId = await db.insert('events', {
        userId,
        type: 'activity',
        status: 'imported',
        context: {
          activityId,
          noteId
        },
        metadata: {
          activity: activityRecord,
          // parsedActivity,
          note: noteRecord
        }
      });

      return {
        success: true,
        eventId,
        message: `Created activity event for ${parsedActivity.nameRaw}`
      };
    } catch (error) {
      console.error('Error creating activity event:', error);
      throw error;
    }
  }
});

/**
 * Process a note to extract activities and create events
 */
export const processNoteActivities = action({
  args: {
    noteId: v.string()
  },
  handler: async (ctx, args) => {
    const { noteId } = args;

    try {
      // Get the note
      const note = await ctx.runQuery(api.notes.get, { id: noteId });

      if (!note) {
        return { success: false, error: `Note with ID ${noteId} not found` };
      }

      // Parse the note content
      const parsedActivities = parseActivitiesFromNote(note.content);

      if (!parsedActivities || parsedActivities.length === 0) {
        return { 
          success: true, 
          message: 'No activities found in note',
          activitiesFound: 0,
          eventsCreated: 0
        };
      }

      const results = {
        success: true,
        activitiesFound: parsedActivities.length,
        eventsCreated: 0,
        activities: [] as any[]
      };

      // Process each parsed activity
      for (const parsedActivity of parsedActivities) {
        // Match or create the activity
        const activityResult = await ctx.runAction(api.activityImport.matchOrCreateActivity, {
          parsedActivity
        });

        if (activityResult.success && activityResult.activity) {
          // Create an event for this activity
          const eventResult = await ctx.runMutation(api.activityImport.createActivityEvent, {
            userId: note.userId as Id<'users'>,
            noteId,
            activityId: activityResult.activity._id,
            parsedActivity,
            activityRecord: activityResult.activity,
            noteRecord: note
          });

          if (eventResult.success) {
            results.eventsCreated++;
            results.activities.push({
              parsedActivity,
              activity: activityResult.activity,
              event: eventResult.eventId,
              created: activityResult.created
            });
          }
        }
      }

      return results;
    } catch (error) {
      console.error('Error processing note activities:', error);
      return { success: false, error: String(error) };
    }
  }
});

/**
 * Process multiple notes to extract activities and create events
 */
export const processMultipleNotes = action({
  args: {
    noteIds: v.array(v.id('notes'))
  },
  handler: async (ctx, args) => {
    const { noteIds } = args;
    
    const results = {
      success: true,
      notesProcessed: 0,
      activitiesFound: 0,
      eventsCreated: 0,
      details: [] as any[]
    };

    // Process each note
    for (const noteId of noteIds) {
      try {
        const noteResult = await ctx.runAction(api.activityImport.processNoteActivities, { noteId });
        
        results.notesProcessed++;
        
        if (noteResult.success) {
          results.activitiesFound += noteResult.activitiesFound || 0;
          results.eventsCreated += noteResult.eventsCreated || 0;
          results.details.push({
            noteId,
            success: true,
            activitiesFound: noteResult.activitiesFound,
            eventsCreated: noteResult.eventsCreated
          });
        } else {
          results.details.push({
            noteId,
            success: false,
            error: noteResult.error
          });
        }
      } catch (error) {
        console.error(`Error processing note ${noteId}:`, error);
        results.details.push({
          noteId,
          success: false,
          error: String(error)
        });
      }
    }

    return results;
  }
});

// Helper functions

/**
 * Parse activities from note content
 */
function parseActivitiesFromNote(content: string): ParsedActivity[] {
  if (!content) return [];

  // Split the content into sections (one per activity)
  const activitySections = splitIntoActivitySections(content);
  
  // Parse each section
  return activitySections.map(section => {
    // Extract activity name and metadata
    const { name, metadata } = extractActivityNameAndMetadata(section);
    
    // Parse metadata
    const parsedMetadata = parseActivityMetadata(metadata);
    
    return {
      nameRaw: name,
      metadataRaw: metadata,
      metadataParsed: parsedMetadata
    };
  }).filter(activity => activity.nameRaw); // Filter out activities without names
}

/**
 * Split note content into sections, one per activity
 */
function splitIntoActivitySections(content: string): string[] {
  // Remove date headers (lines that look like dates)
  const contentWithoutDates = content.replace(/^\d{4}-\d{2}-\d{2}.*$/gm, '');
  
  // Split by double newlines or more
  const sections = contentWithoutDates
    .split(/\n{2,}/)
    .map(s => s.trim())
    .filter(s => s.length > 0);
  
  return sections;
}

/**
 * Extract activity name and metadata from a section
 */
function extractActivityNameAndMetadata(section: string): { name: string, metadata: string[] } {
  const lines = section.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  if (lines.length === 0) {
    return { name: '', metadata: [] };
  }
  
  // First line is typically the activity name
  const name = lines[0];
  
  // Remaining lines are metadata
  const metadata = lines.slice(1);
  
  return { name, metadata };
}

/**
 * Parse activity metadata into structured format
 */
function parseActivityMetadata(metadataLines: string[]): any {
  if (!metadataLines || metadataLines.length === 0) {
    return {};
  }

  // Check for different patterns in the metadata
  
  // Pattern 1: Weight x Reps format (e.g., "90 x 8")
  const weightRepsPattern = metadataLines.filter(line => /^\d+\s*x\s*\d+/.test(line));
  if (weightRepsPattern.length > 0) {
    return parseWeightRepsFormat(metadataLines);
  }
  
  // Pattern 2: Time-based format (e.g., "Goal: 33 in 12 mins")
  const timeBasedPattern = metadataLines.filter(line => /\d+\s*(min|mins|minutes)/.test(line));
  if (timeBasedPattern.length > 0) {
    return parseTimeBasedFormat(metadataLines);
  }
  
  // Pattern 3: Simple weight or reps (e.g., "100 x 5" on a single line)
  if (metadataLines.length === 1) {
    return parseSingleLineMetadata(metadataLines[0]);
  }
  
  // Default: Return raw metadata as is
  return { raw: metadataLines };
}

/**
 * Parse weight x reps format metadata
 */
function parseWeightRepsFormat(lines: string[]): { sets: ParsedSet[] } {
  const sets: ParsedSet[] = [];
  
  for (const line of lines) {
    // Match patterns like "90 x 8" or "90x8" or "90 kg x 8 reps"
    const match = line.match(/(\d+)\s*(?:kg|lbs|lb)?\s*x\s*(\d+)(?:\s*reps)?/i);
    
    if (match) {
      const weight = parseInt(match[1], 10);
      const reps = parseInt(match[2], 10);
      
      // Check for additional notes
      const notes = line.replace(match[0], '').trim();
      
      sets.push({
        weight,
        reps,
        notes: notes.length > 0 ? notes : undefined
      });
    } else {
      // Try to extract just a weight
      const weightMatch = line.match(/^(\d+)(?:\s*(?:kg|lbs|lb))?$/i);
      if (weightMatch) {
        sets.push({
          weight: parseInt(weightMatch[1], 10),
          reps: 1 // Assume 1 rep if not specified
        });
      }
    }
  }
  
  return { sets };
}

/**
 * Parse time-based format metadata
 */
function parseTimeBasedFormat(lines: string[]): any {
  let result: any = {};
  
  // Look for goal information
  const goalLine = lines.find(line => line.toLowerCase().includes('goal'));
  if (goalLine) {
    const goalRepsMatch = goalLine.match(/(\d+)/);
    const goalTimeMatch = goalLine.match(/(\d+)\s*(?:min|mins|minutes)/i);
    
    if (goalRepsMatch) result.goalReps = parseInt(goalRepsMatch[1], 10);
    if (goalTimeMatch) result.goalTime = parseInt(goalTimeMatch[1], 10);
  }
  
  // Look for actual reps information
  const repsLine = lines.find(line => /\d+\s*in\s*\d+\s*(?:min|mins|minutes)/i.test(line));
  if (repsLine) {
    const match = repsLine.match(/(\d+)\s*in\s*(\d+)\s*(?:min|mins|minutes)/i);
    if (match) {
      result.reps = parseInt(match[1], 10);
      result.time = parseInt(match[2], 10);
    }
  }
  
  // Look for reps as space-separated numbers
  const numbersLine = lines.find(line => /^\d+(\s+\d+)+$/.test(line));
  if (numbersLine) {
    const numbers = numbersLine.split(/\s+/).map(n => parseInt(n, 10));
    result.repSets = numbers;
    
    // Calculate total reps if not already set
    if (!result.reps) {
      result.reps = numbers.reduce((sum, num) => sum + num, 0);
    }
  }
  
  return result;
}

/**
 * Parse single line metadata
 */
function parseSingleLineMetadata(line: string): any {
  // Check for "weight x reps" format
  const weightRepsMatch = line.match(/(\d+)\s*x\s*(\d+)/);
  if (weightRepsMatch) {
    return {
      weight: parseInt(weightRepsMatch[1], 10),
      reps: parseInt(weightRepsMatch[2], 10)
    };
  }
  
  // Check for just weight
  const weightMatch = line.match(/^(\d+)(?:\s*(?:kg|lbs|lb))?$/i);
  if (weightMatch) {
    return {
      weight: parseInt(weightMatch[1], 10)
    };
  }
  
  // Check for just reps
  const repsMatch = line.match(/^(\d+)\s*reps?$/i);
  if (repsMatch) {
    return {
      reps: parseInt(repsMatch[1], 10)
    };
  }
  
  // Return raw line if no pattern matches
  return { raw: line };
}
