"use node";

import { action } from './_generated/server'; // Or from './auth' if you're using the custom auth context
import { v } from 'convex/values';
import { Doc, Id } from './_generated/dataModel'; // Import Doc type for type safety

import { DateTime } from 'luxon';

/**
 * Converts a date string in 'YYYY-MM-DD' format and a specified timezone
 * into a Unix timestamp in milliseconds (UTC).
 *
 * This timestamp represents midnight (00:00:00) of the given date
 * in the context of the specified timezone.
 *
 * @param {string} dateString - The date string in 'YYYY-MM-DD' format (e.g., '2025-05-06').
 * @param {string} timezone - The IANA timezone identifier (e.g., 'America/Los_Angeles', 'Europe/London').
 * @returns {number | null} The Unix timestamp in milliseconds (UTC), or null if the inputs are invalid.
 */
function dateAndTimeToUtcTimestampMs(dateString, timezone) {
  // Attempt to create a DateTime object from the date string,
  // interpreting it as a date in the specified timezone.
  // We explicitly set the time to 00:00:00 (midnight) in that timezone.
  const dateTimeInTimezone = DateTime.fromISO(`${dateString}T00:00:00`, { zone: timezone });

  // Check if the DateTime object is valid.
  // This covers cases where the dateString is malformed or the timezone is invalid.
  if (!dateTimeInTimezone.isValid) {
    console.error(
      `Error: Invalid date string ('${dateString}') or timezone ('${timezone}').` +
      ` Luxon error: ${dateTimeInTimezone.invalidReason} - ${dateTimeInTimezone.invalidExplanation}`
    );
    return null;
  }

  // Convert this DateTime object to a Unix timestamp in milliseconds (UTC).
  // Luxon's toMillis() always returns the UTC timestamp.
  return dateTimeInTimezone.toMillis();
}

export const dateStrToMsUTC = action({
    args: {
        dateStr: v.string(),
        timezone: v.string(),
    },
    handler: async (ctx, args) => {
        const { dateStr, timezone } = args;
        return dateAndTimeToUtcTimestampMs(dateStr, timezone);
    }
});

/**
 * Extracts a date string from note content.
 * Looks for common date formats at the beginning of the note.
 * 
 * @param {string} content - The note content to extract date from
 * @returns {string | null} The extracted date string in YYYY-MM-DD format, or null if not found
 */
function extractDateFromNoteContent(content) {
    if (!content) return null;
    
    // Common date formats to look for
    const datePatterns = [
        // YYYY-MM-DD format
        /^\s*(\d{4}-\d{2}-\d{2})\s*$/m,
        // MM/DD/YYYY format
        /^\s*(\d{1,2}\/\d{1,2}\/\d{4})\s*$/m,
        // DD/MM/YYYY format
        /^\s*(\d{1,2}\/\d{1,2}\/\d{4})\s*$/m,
        // Month DD, YYYY format
        /^\s*([A-Za-z]+\s+\d{1,2},?\s+\d{4})\s*$/m,
        // DD Month YYYY format
        /^\s*(\d{1,2}\s+[A-Za-z]+\s+\d{4})\s*$/m
    ];
    
    // Try each pattern until we find a match
    for (const pattern of datePatterns) {
        const match = content.match(pattern);
        if (match && match[1]) {
            // Try to parse the matched date string
            try {
                const parsedDate = parseToYYYYMMDD(match[1]);
                if (parsedDate) return parsedDate;
            } catch (error) {
                console.error(`Error parsing date: ${match[1]}`, error);
            }
        }
    }
    
    return null;
}

/**
 * Parses a date string in various formats to YYYY-MM-DD format
 * 
 * @param {string} dateStr - The date string to parse
 * @returns {string | null} The date in YYYY-MM-DD format, or null if parsing fails
 */
function parseToYYYYMMDD(dateStr) {
    // Try to parse with Luxon
    let dt;
    
    // Try different formats
    const formats = [
        'yyyy-MM-dd',           // YYYY-MM-DD
        'M/d/yyyy',             // MM/DD/YYYY
        'd/M/yyyy',             // DD/MM/YYYY
        'MMMM d, yyyy',         // Month DD, YYYY
        'MMMM d yyyy',          // Month DD YYYY
        'd MMMM yyyy'           // DD Month YYYY
    ];
    
    for (const format of formats) {
        dt = DateTime.fromFormat(dateStr, format);
        if (dt.isValid) {
            return dt.toFormat('yyyy-MM-dd');
        }
    }
    
    // If all parsing attempts fail, try ISO parsing as a last resort
    dt = DateTime.fromISO(dateStr);
    if (dt.isValid) {
        return dt.toFormat('yyyy-MM-dd');
    }
    
    return null;
}

/**
 * Action to extract a date from note content and convert it to a timestamp
 */
export const extractDateFromNote = action({
    args: {
        content: v.string(),
        timezone: v.string(),
    },
    handler: async (ctx, args) => {
        const { content, timezone } = args;
        
        // Extract date string from content
        const dateStr = extractDateFromNoteContent(content);
        if (!dateStr) return null;
        
        // Convert to timestamp
        return dateAndTimeToUtcTimestampMs(dateStr, timezone);
    }
});