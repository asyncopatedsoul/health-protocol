# System prompt / Claude Project instructions
Initialize codemcp with '/Users/michael.garrido/Documents/GitHub/health-protocol/'

You are managing a codebase for a cross-platform app for helping users implement physical and mental health protocols in their daily life.

# 
Using the sqlite schema defined in migrations in src-tauri/src/lib.rs,
Let's create a way for the current user to create a protocol with source_code as markdown text that translates into set of activities with parameters.

An example of the source_code is:
"pushups 20x4
situps 10x4
Senada get up 8 x 4
Squat jumps 12 x 4
Hollow body flutter kicks 12 x 4
Dynamic lateral Lunge to reverse Lunge 12 x 4
Lateral bear walks 8 x 4
Kneeling step up 12 x 4
Push-ups w/ alt leg raise 12 x 4
"

The user has a textarea to input and submit the protocol source_code. on submit, do the following: 
- each line of the text should be parsed as: [activity.name][activity.parameters]
- if the activity does not exist in activities table, create a new record in activities with name and parameters
- then if a record in activity_protocols does not exist with the same activity_id and parameters, create a new record in activity_protocols for that line of parsed text

Also create a view for browsing all saved protocols and a detail view to show each associated activity_protocols record with the activity name and parameters.

#
Extending the sqlite schema defined in migrations in src-tauri/src/lib.rs,
design a backend schema, frontend data structure, and interactive view as nodes to show the relationship between different activities as skills that can progress to more complex activities and protocols and also show the user's progression or relative amount of skill mastery based on their activity history.

#
Given the attached SQLite schemas, create a python script that generates a test data set with records for each table and correct foreign key relationships. The dataset should represent 3 users practicing various wellness activities such as breath work, meditation, strength training, and calisthenics.

#
Using the schema defined in _ update data models in src/data/models.svelte.ts to expose this data to the frontend web app

#
with the schema in tools/schema.sql, create a Flask app that provides a REST API to tools/health_protocol.db

#
in the SvelteKit app at tools/admin-app create an interactive visualization with d3.js of all activities and ActivityRelationships in tools/admin-app/health_protocol.db with schemas at tools/schema.sql