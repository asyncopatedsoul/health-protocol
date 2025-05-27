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