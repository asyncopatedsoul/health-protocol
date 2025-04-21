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