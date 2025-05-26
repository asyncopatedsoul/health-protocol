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