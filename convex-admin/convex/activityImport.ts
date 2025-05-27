import { v } from 'convex/values';
import { action, mutation, query } from './_generated/server';
import { api } from './_generated/api';
import { Id } from './_generated/dataModel';
import { ConvexError } from 'convex/values';
import { extractDateFromContent } from './utils/dateExtractor';

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
    noteRecord: v.optional(v.any()),
    timestampMs: v.optional(v.int64()),
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
        },
        timestampMs: args.timestampMs,
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
    noteId: v.id('notes'),
    skipDuplicates: v.optional(v.boolean(), true)
  },
  handler: async (ctx, args) => {
    const { noteId, skipDuplicates } = args;

    try {
      // Get the note
      const note = await ctx.runQuery(api.notes.get, { id: noteId });

      if (!note) {
        return { success: false, error: `Note with ID ${noteId} not found` };
      }
      
      // Extract date from note content if present
      const { date: extractedDate, remainingContent } = extractDateFromContent(note.content);
      
      // Update the note with the extracted date and cleaned content if needed
      if (extractedDate) {
        await ctx.runMutation(api.notes.update, {
          id: note._id,
          updates: {
            content: remainingContent,
            activityTimestamp: extractedDate.getTime(),
          },
        });
      }

      // Parse the note content to extract activities
      const parsedActivities = parseActivitiesFromNote(extractedDate ? remainingContent : note.content);

      if (!parsedActivities || parsedActivities.length === 0) {
        return { 
          success: true, 
          message: 'No activities found in note',
          activitiesFound: 0,
          eventsCreated: 0
        };
      }

      // Define result interface for type safety
      interface ActivityResult {
        success: boolean;
        error?: string;
        eventId?: Id<'events'>;
        skipped?: boolean;
        reason?: string;
        activity?: string;
        timestamp?: number;
        created?: boolean;
      }

      const results: ActivityResult[] = [];
      
      // Get timestamp from note's activityTimestamp or createdAtMs
      const timestamp = note.activityTimestamp || note.createdAtMs || BigInt(Date.now());

      // Process each parsed activity
      for (const activity of parsedActivities) {
        try {
          // Check if we should skip duplicates
          if (skipDuplicates) {
            // Get all activity events for this user
            const existingEvents = await ctx.runQuery(api.events.getByUser, {
              userId: note.userId as Id<'users'>,
              type: 'activity'
            });
            
            if (Array.isArray(existingEvents)) {
              // Check if an event already exists for this activity name and note
              const activityName = activity.nameRaw.toLowerCase().trim();
              const duplicateExists = existingEvents.some(event => {
                // Check if this event is for the current note
                const isSameNote = event.context?.noteId === note._id;
                // Check if the activity name matches
                const eventActivityName = event.metadata?.activity?.name?.toLowerCase()?.trim();
                return isSameNote && eventActivityName === activityName;
              });
              
              if (duplicateExists) {
                results.push({
                  success: true,
                  skipped: true,
                  reason: 'duplicate',
                  activity: activity.nameRaw,
                });
                continue;
              }
            }
          } else {
            // If not skipping duplicates, delete existing events for this note
            await ctx.runMutation(api.events.deleteByNoteId, { noteId: note._id });
          }

          // Match or create the activity
          const matchResult = await ctx.runAction(api.activityImport.matchOrCreateActivity, {
            parsedActivity: activity
          });

          if (!matchResult.success) {
            throw new Error(matchResult.error);
          }

          // Create an event for this activity
          const eventResult = await ctx.runMutation(api.events.create, {
            userId: note.userId as Id<'users'>,
            type: 'activity',
            status: 'completed',
            timestampMs: timestamp,  // Using the timestamp from note.activityTimestamp or note.createdAtMs
            context: {
              activityId: matchResult.activity._id,
              noteId: note._id,
            },
            metadata: {
              activity: {
                ...matchResult.activity,
                name: activity.nameRaw,
              },
              note: {
                id: note._id,
                content: note.content,
              },
            },
          });

          results.push({
            success: true,
            activity: activity.nameRaw,
            eventId: eventResult,
            created: true,
            timestamp: Number(timestamp)
          });
        } catch (error) {
          results.push({
            success: false,
            error: error instanceof Error ? error.message : String(error),
            activity: activity.nameRaw,
          });
        }
      }

      return {
        success: true,
        noteId: note._id,
        activitiesFound: parsedActivities.length,
        eventsCreated: results.filter(r => r.success && !r.skipped).length,
        skipped: results.filter(r => r.skipped).length,
        errors: results.filter(r => !r.success).length,
        results,
      };
    } catch (error) {
      console.error('Error processing note activities:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : String(error),
        noteId
      };
    }
  }
});

/**
 * Bulk import notes for a user
 */
export const bulkImportNotes = action({
  args: {
    userId: v.optional(v.id('users')),
    supabaseUserId: v.optional(v.string()),
    tokenId: v.optional(v.string()),
    email: v.optional(v.string()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    importBy: v.optional(v.union(v.literal('createdAtMs'), v.literal('lastSavedMs'))),
    skipDuplicates: v.optional(v.boolean())
  },
  handler: async (ctx, args) => {
    const { startDate, endDate, importBy = 'createdAtMs' } = args;
    
    // Set skipDuplicates based on importBy if not explicitly provided
    const skipDuplicates = args.skipDuplicates !== undefined 
      ? args.skipDuplicates 
      : (importBy === 'createdAtMs'); // Skip duplicates for createdAtMs, don't skip for lastSavedMs
    
    try {
      // Find the user
      let user;
      
      if (args.userId) {
        user = await ctx.runQuery(api.users.get, { id: args.userId });
      } else if (args.supabaseUserId) {
        user = await ctx.runQuery(api.users.getBySupabaseUserId, { supabaseUserId: args.supabaseUserId });
      } else if (args.tokenId) {
        user = await ctx.runQuery(api.users.getByTokenId, { tokenId: args.tokenId });
      } else if (args.email) {
        user = await ctx.runQuery(api.users.getByEmail, { email: args.email });
      } else {
        return { success: false, error: 'No user identifier provided' };
      }
      
      if (!user) {
        return { success: false, error: 'User not found' };
      }
      
      // Get notes for the user
      const notes = await ctx.runQuery(api.notes.getByUser, {
        userId: user._id,
        startDate,
        endDate
      });
      
      if (!notes || notes.length === 0) {
        return { success: true, message: 'No notes found for the user', notesProcessed: 0 };
      }
      
      // Process each note
      interface NoteProcessResult {
        noteId: Id<'notes'>;
        success: boolean;
        activitiesFound: number;
        eventsCreated: number;
        skipped: number;
        errors: number;
      }
      
      const results: NoteProcessResult[] = [];
      
      for (const note of notes) {
        const result = await ctx.runAction(api.activityImport.processNoteActivities, {
          noteId: note._id,
          skipDuplicates
        });
        
        results.push({
          noteId: note._id,
          success: result.success,
          activitiesFound: result.activitiesFound || 0,
          eventsCreated: result.eventsCreated || 0,
          skipped: result.skipped || 0,
          errors: result.errors || 0
        });
      }
      
      return {
        success: true,
        userId: user._id,
        notesProcessed: notes.length,
        activitiesFound: results.reduce((sum, r) => sum + r.activitiesFound, 0),
        eventsCreated: results.reduce((sum, r) => sum + r.eventsCreated, 0),
        skipped: results.reduce((sum, r) => sum + r.skipped, 0),
        errors: results.reduce((sum, r) => sum + r.errors, 0),
        results
      };
    } catch (error) {
      console.error('Error bulk importing notes:', error);
      return { success: false, error: error instanceof Error ? error.message : String(error) };
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
