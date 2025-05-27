# 
let's extend the convex api and vitest tests to create planned activities for a user added to a program.
the schema is defined in convex/schema.ts
the api is defined in convex/protocolManagement.ts
the tests are defined in convex/tests/protocol.test.ts
we need a new api function to create planned activities for a user added to a program.
the function should take a userId and a programId as arguments.
the function should create planned activities for the user based on the program's phases and activity sequence per phase.
an example of a program with phases and activity sequence is defined in sample_data/programs.jsonl
an example of activities to schedule is defined in sample_data/activities.jsonl
an example of users added to a program is defined in sample_data/users.jsonl
using today as the start date to plan the activities and 4 weeks as the default duration to plan ahead, the function should use program.phases[index].sequence[index].weekday to determine the day of the week to plan the activity.
use the user's timezone or default to "America/Los_Angeles" to determine the day of the week to plan the activity.
the 'slug' in phase.exitCriteria and sequence.activities should be used to find the activity matching in sample_data/activities.jsonl
use the phase.exitCriteria.target.total as the minimum executions of the activitiy to determine the number of activities to plan for each phase.
use the phase.exitCriteria.limit.daily as the maximum executions of the activity to determine the number of activities to plan for each phase.
for each planned activity calculated insert a new row in the planned_activities table with userId, activityId, programId, and plannedTimeUtcMs per the schema.
the plannedTimeUtcMs should be calculated using the user's timezone or default to "America/Los_Angeles" on the calculated day.
the function should return the list of planned activities records created.

lastly, update the tests in convex/tests/protocol.test.ts to test the new function using the test user from sample_data/users.jsonl and the first program with phases defined from sample_data/programs.jsonl

#
let's extend the api function planActivitiesForUserProgram to accept durationDays as an optional argument to determine the number of days to plan activities for. the default durationDays should be 30 days.
also add an optional argument for startDate to determine the start date to plan the activities instead of the default as today.
also detect if the program.phases[index].sequence[index].day is defined and use it to determine the day from the start date to plan the activity.
if the program.phases[index].sequence[index].day or program.phases[index].sequence[index].weekday is not defined, throw an error
also update the tests in convex/tests/protocol.test.ts to test the new function using the test user from sample_data/users.jsonl and the first program with program.phases[index].sequence[index].day defined from sample_data/programs.jsonl
also create a logger during execution of api functions that writes all console.log() to ./logs/api_function.log
lastly, create a summary function in convex/testFunctions.ts that returns a summary of all the planned activities in chronological order with user slug, user id, user fullName, activity name, activity id, program name, program id, and planned time in date format YYYY-MM-DD HH:MM:SS for a user added to a program and writes the summary to ./logs/summary.log.
the summary also includes the input parameters to the function planActivitiesForUserProgram

#
let's create new api functions fetch remote user activity and save snapshots of the user activity to the database.
the api functions should be named fetchRemoteUserActivity and saveRemoteUserActivitySnapshot.
the functions should be defined in convex/remoteSourceSupabase.ts
the remote data sources should be decoupled from the api functions. the initial remote data source should be supabase and a supabase client should be defined in convex/remoteSourceSupabase.ts.
in function fetchRemoteUserActivity, accepts arguments for supabase client instance and table name to fetch the user activity from. 
by default for supabase data source, the associated user records should be fetched from the supabase autheentication built-in users table.
for example, user activity as is stored as text strings of exercises performed in a 'notes' table in supabase.
with all the user activity records fetched with fetchRemoteUserActivity, the function saveRemoteUserActivitySnapshot should create a snapshot of the user activity as a csv file per unique user referenced in the user activity records and mapped to the user records fetched from the supabase authentication built-in users table.
the csv file should be named as <user_id>_<timestamp>.csv and saved to ./logs/user_activity_snapshots.
then the function saveRemoteUserActivitySnapshot uploads the csv files to a supabase storage bucket with the same supabase client instance.
the function saveRemoteUserActivitySnapshot accepts arguments for supabase client instance and the storage bucket name to upload the csv files to.

##
we need to refactor the api functions in remoteSourceSupabase.ts by moving all the convex internal actions and mutations to a separate file in convex/remoteUserActivity.ts.
remoteSourceSupabase.ts should only create the supabase client instance, call supabase functions to fetch the user activity records and write to supabase storage, and call the convex internal actions or mutations that read and write to convex database and storage.
remoteSourceSupabase.ts should call the convex internal actions or mutations defined in remoteUserActivity.ts file like "ctx.runMutation(internal.mutationName)" or "ctx.runQuery(internal.queryName)" or "ctx.runAction(internal.actionName)".
functions in remoteUserActivity.ts should not create a supabase client instance and should only contain the convex internal actions or mutations that read and write to convex database and storage.

#
let's extend the api function fetchRemoteUserActivity to create new users in convex database from supabase authentication built-in users and create notes records in convex database from the user activity records fetched from 'notes' table in supabase. create new functions as needed in convex/remoteUserActivity.ts to maintain separation of concerns between supabase client functions and convex internal actions or mutations that read and write to convex database and storage.
for the new user records, set the email, fullName, supabaseUserId from the corresponding fields in the supabase user record. for the tokenId field, set it to a random string of 8 characters. for the timezone field, set it to 'America/Los_Angeles'.
also save the fetched supabase users to a jsonl file in ./logs/supabase_users.jsonl.
for the notes records, set the userId from the new user record associated with the supabase notes content. for the createdAtMs field, set it to the corresponding field in the supabase notes record. for the lastSavedMs field, set it to the corresponding field in the supabase notes record. for the content field, set it to the corresponding field in the supabase notes record. for the source field, set it to 'supabase'.
also save the fetched supabase notes records with newline escaped content to a jsonl file in ./logs/supabase_notes.jsonl.
finally, update tests in convex/tests/supabase.test.ts to test all new or updated functions.

#
let's create a process to convert notes to events referencing activities in convex database in convex/userHistory.ts. we need to parse the content of a note to extract the unique activities performed in the note and create events records in convex database for each activity. the note may contain activities that are not in the convex database. for activities not in the convex database, create a new activity record in convex database and use it to create the event record.
...

#
let's create a script that will setup a fuzzy search service for activities in convex database. the script should be named fuzzySearchExternal.ts and should be defined in convex/fuzzySearchExternal.ts. this script will expose actions using external libraries so must 'use node;' at the top of the file like remoteSourceSupabase.ts. Create any queries or mutations for this service in convex/fuzzySearchInternal.ts that does not have 'use node;' to separate the fuzzy search service from convex database functions.
the fuzzy search service is implemented using the library 'meilisearch', but the script should be decoupled from this implementation library to allow for easy replacement of the library in the future.
create a function to check if the fuzzy search service is available and return true if it is available and false if it is not available.
create a function to start the fuzzy search service at a specified port (ex. 7700) and binary path (ex. '/Users/michael.garrido/Documents/GitHub/convex-backend/meilisearch') if not available and a function to stop the fuzzy search service if available.
create a function to create a fuzzy search index for activities in convex database, save it to a jsonl file in ./logs/fuzzySearchActivities.jsonl, and seed the fuzzy search index with activities in convex database.
create a function to add activities to the fuzzy search index, a function to remove activities from the fuzzy search index, and a function to search for activities in the fuzzy search index with the options {showRankingScore: true, limit: 10}
finally create tests for the fuzzy search service in convex/tests/fuzzySearch.test.ts

#
let's create utility functions in convex/activityImport.ts to parse the content of a note to extract the unique activities performed in the note. use existing functions in convex/fuzzySearchInternal.ts and fuzzySearchExternal.ts whenever appropriate.

the first major function should accept a note content as an argument and return an array of objects as unique activities performed + activitiy metadata in the note.
here is an example of a note with content describing 4 unique activities: 
`2025-04-17

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
100 x 5`

the expected output of parsing this note content is:
[
    {nameRaw: "Smith Romanian deadlift", metadateRaw: ['90 x 8', '110 x 6', '130 x 6'], metadataParsed: [{reps: 8, weight: 90}, {reps: 6, weight: 110}, {reps: 6, weight: 130}]}, 
    {nameRaw: "Deadlift", metadataRaw: ['130', '140 x 6', '160 x 5', '180 x 3', '180 x 3 - grip feeling week'], metadataParsed: [{reps: 6, weight: 130}, {reps: 5, weight: 140}, {reps: 4, weight: 160}, {reps: 3, weight: 180}]}, 
    {nameRaw: "Pull-ups",metadataRaw: ['Goal: 33 in 12 mins', '7 7 4 4 3 4 4 2', '35 in 10 mins'], metadataParsed: { reps: 35, time: 10, goalReps: 33, goalTime: 12}}, 
    {nameRaw: "Lat pulldown", metadataParsed: {reps: 5, weight: 100}}
]

since the note content can have a general structure for activities and varying format for activity metadata, create minor parsing functions to:
- parse sections per unique activity performed in the note
- parse activity raw metadata in the note as 'metadataRaw'
- intepret raw activity metadata to standard parameters as 'metadataParsed'
it is OK to return empty 'metadataParsed' if the raw metadata cannot be interpreted to standard parameters

the second major function should accept a parsed activity object and determine if the activity 'nameRaw' matches an existing activity in convex database. use the fuzzySearchExternal action to fuzzy match with a minimum rankingScore of 0.7. for matching the activity 'nameRaw' to an existing activity in convex database, use the parsed activity 'nameRaw' field to fuzzy match on an existing activity 'name'. if the activity 'nameRaw' fuzzy matches an existing activity in convex database, return the activity record. if the activity 'nameRaw' does not fuzzy match an existing activity in convex database, create a new activity record in convex database and return the new activity record. 

the third major function accepts the parsed activity object and the matched or new activity record as arguments and creates an event record in convex database for the activity. the event record should have the following fields:
- userId: note.userId
- type: "activity"
- status: "imported"
- context: { activityId: <activityId>, noteId: <noteId> }
- metadata: { activity: <activityRecord>, note: <noteRecord> }

if the note parsing function does not return any activities, proceed to parsing the next note.

finally, create tests in convex/tests/activityImport.test.ts to test all new or updated functions.

#
let's make updates to the activity import process in convex/activityImport.ts.
when parsing note content, add a function for extracting a date string from the note content and use it to set the activityTimestamp from the note record if available.
when creating events, set the timestampMs from the note.activityTimestamp if available, otherwise set it to note.createdAtMs.
when creating events from notes, check if any events already exist for the note and skip creating duplicates if flag for skipDuplicates is true. 
create a function to bulk import all notes for a user by user id supabase id, tokenId, and/or email within a date range of notes'  createdAtMs or lastSavedMs.
if bulk importing by createdAtMs, set skipDuplicates to true since we want to create net new events.
if bulk importing by lastSavedMs, set skipDuplicates to false since we want to update existing events. when skipDuplicates is false, remove all events with the same noteId and create new events with the latest note content. 
update the activity import process to use the new functions.
update scripts/runActivityImport.ts to accept options for skipDuplicates, bulkImport, dateStart, dateEnd, userId, supabaseUserId, tokenId, email.
create or udpate functions related to read/write of users, notes, activities, events in convex/users.ts, convex/notes.ts, convex/activities.ts, convex/events.ts respectively to separate the database functions from the activity import process.
update tests in convex/tests/activityImport.test.ts to test all new or updated functions.
update documentation in docs/activity_import.md with instructions to run the activity import process with the updated options.