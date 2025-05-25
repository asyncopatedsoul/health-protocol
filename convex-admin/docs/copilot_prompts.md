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