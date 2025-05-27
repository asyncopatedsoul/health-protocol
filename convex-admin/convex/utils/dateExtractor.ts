import { v } from 'convex/values';
import { action } from '../_generated/server';

// Date parsing utilities
const DATE_REGEX = /^(\d{4}-\d{2}-\d{2})(?:\s|$)/;
const TIME_REGEX = /(\d{1,2}):(\d{2})\s*(?:AM|PM|am|pm)?/i;

/**
 * Extract a date from note content
 * Looks for a date string in the format YYYY-MM-DD at the beginning of the content
 * and optionally a time in HH:MM or HH:MM AM/PM format on the same line
 */
export function extractDateFromContent(content: string): { date?: Date; remainingContent: string } {
    const lines = content.split('\n');
    if (lines.length === 0) return { remainingContent: content };

    // Check the first line for a date
    const firstLine = lines[0].trim();
    const dateMatch = firstLine.match(DATE_REGEX);
    
    if (!dateMatch) {
        return { remainingContent: content };
    }

    const dateStr = dateMatch[1];
    const restOfFirstLine = firstLine.slice(dateMatch[0].length).trim();
    
    // Try to parse time from the remaining part of the first line
    let date = new Date(dateStr);
    const timeMatch = restOfFirstLine.match(TIME_REGEX);
    
    if (timeMatch) {
        let hours = parseInt(timeMatch[1], 10);
        const minutes = parseInt(timeMatch[2], 10);
        const isPM = timeMatch[0].toLowerCase().includes('pm');
        
        // Convert 12-hour to 24-hour format if needed
        if (isPM && hours < 12) hours += 12;
        if (!isPM && hours === 12) hours = 0;
        
        date.setHours(hours, minutes, 0, 0);
    } else {
        // Default to noon if no time is specified
        date.setHours(12, 0, 0, 0);
    }
    
    // Update the first line to remove the date and time
    lines[0] = timeMatch 
        ? restOfFirstLine.replace(TIME_REGEX, '').trim() 
        : restOfFirstLine;
    
    // If the first line is now empty, remove it
    const remainingContent = lines[0] 
        ? lines.join('\n') 
        : lines.slice(1).join('\n');
    
    return { date, remainingContent };
}

/**
 * Extract date from content and convert to timestamp
 */
export const extractDateAsTimestamp = action({
    args: {
        content: v.string(),
        defaultTimestamp: v.optional(v.number())
    },
    handler: async (ctx, args) => {
        const { content, defaultTimestamp } = args;
        const { date } = extractDateFromContent(content);
        
        if (date) {
            return date.getTime();
        }
        
        return defaultTimestamp || Date.now();
    }
});
