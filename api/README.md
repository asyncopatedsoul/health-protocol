# Health Protocol API

A RESTful API for managing health protocol data built with Flask.

## Setup

1. Create and activate a virtual environment:
```
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```
pip install -r api/requirements.txt
```

3. Run the API server:
```
python run_api.py
```

The API server will start on http://localhost:5000

## API Endpoints

### Health Check
- `GET /health`: Check if the API is running

### Users
- `GET /api/users`: Get all users
- `GET /api/users/<id>`: Get a specific user
- `POST /api/users`: Create a new user
- `PUT /api/users/<id>`: Update a user
- `DELETE /api/users/<id>`: Delete a user
- `GET /api/users/<id>/activities`: Get activities for a user
- `GET /api/users/<id>/playlists`: Get playlists for a user
- `GET /api/users/<id>/skills`: Get skills for a user

### Activities
- `GET /api/activities`: Get all activities
- `GET /api/activities/<id>`: Get a specific activity
- `POST /api/activities`: Create a new activity
- `PUT /api/activities/<id>`: Update an activity
- `DELETE /api/activities/<id>`: Delete an activity
- `GET /api/activities/<id>/media`: Get media for an activity
- `GET /api/activities/<id>/tags`: Get tags for an activity
- `GET /api/activities/<id>/body-areas`: Get body areas for an activity
- `GET /api/activities/<id>/skills`: Get skills for an activity
- `GET /api/activities/difficulty-levels`: Get all difficulty levels

### Protocols
- `GET /api/protocols`: Get all protocols
- `GET /api/protocols/<id>`: Get a specific protocol
- `POST /api/protocols`: Create a new protocol
- `PUT /api/protocols/<id>`: Update a protocol
- `DELETE /api/protocols/<id>`: Delete a protocol
- `GET /api/protocols/<id>/activities`: Get activities for a protocol
- `POST /api/protocols/activity-protocols`: Create activity-protocol association
- `PUT /api/protocols/activity-protocols/<id>`: Update activity-protocol association
- `DELETE /api/protocols/activity-protocols/<id>`: Delete activity-protocol association
- `GET /api/protocols/activity-protocols/<id>/history`: Get history for activity-protocol
- `POST /api/protocols/activity-history`: Record activity history

### Body Areas
- `GET /api/body-areas`: Get all body areas
- `GET /api/body-areas/<id>`: Get a specific body area
- `POST /api/body-areas`: Create a new body area
- `PUT /api/body-areas/<id>`: Update a body area
- `DELETE /api/body-areas/<id>`: Delete a body area
- `GET /api/body-areas/<id>/activities`: Get activities for a body area

### Tags
- `GET /api/tags`: Get all tags
- `GET /api/tags/<id>`: Get a specific tag
- `POST /api/tags`: Create a new tag
- `PUT /api/tags/<id>`: Update a tag
- `DELETE /api/tags/<id>`: Delete a tag
- `GET /api/tags/<id>/activities`: Get activities for a tag

### Guides
- `GET /api/guides`: Get all guides
- `GET /api/guides/<id>`: Get a specific guide
- `POST /api/guides`: Create a new guide
- `PUT /api/guides/<id>`: Update a guide
- `DELETE /api/guides/<id>`: Delete a guide
- `GET /api/guides/<id>/parts`: Get parts for a guide
- `POST /api/guides/<id>/parts`: Add a part to a guide
- `PUT /api/guides/<id>/parts/<part_id>`: Update a guide part
- `DELETE /api/guides/<id>/parts/<part_id>`: Delete a guide part
- `GET /api/guides/<id>/versions`: Get versions for a guide
- `POST /api/guides/<id>/versions`: Create a new guide version
- `GET /api/guides/<id>/versions/<version_id>`: Get a specific guide version

### Playlists
- `GET /api/playlists`: Get all playlists
- `GET /api/playlists/<id>`: Get a specific playlist
- `POST /api/playlists`: Create a new playlist
- `PUT /api/playlists/<id>`: Update a playlist
- `DELETE /api/playlists/<id>`: Delete a playlist
- `GET /api/playlists/<id>/items`: Get items for a playlist
- `POST /api/playlists/<id>/items`: Add an item to a playlist
- `PUT /api/playlists/<id>/items/<item_id>`: Update a playlist item
- `DELETE /api/playlists/<id>/items/<item_id>`: Delete a playlist item
- `GET /api/playlists/<id>/performances`: Get performances for a playlist
- `POST /api/playlists/<id>/performances`: Record playlist performance
- `POST /api/playlists/<id>/share`: Share a playlist with another user

### Skills
- `GET /api/skills/categories`: Get all skill categories
- `GET /api/skills/categories/<id>`: Get a specific skill category
- `POST /api/skills/categories`: Create a new skill category
- `PUT /api/skills/categories/<id>`: Update a skill category
- `DELETE /api/skills/categories/<id>`: Delete a skill category
- `GET /api/skills`: Get all skills
- `GET /api/skills/<id>`: Get a specific skill
- `POST /api/skills`: Create a new skill
- `PUT /api/skills/<id>`: Update a skill
- `DELETE /api/skills/<id>`: Delete a skill
- `GET /api/skills/<id>/prerequisites`: Get prerequisites for a skill
- `POST /api/skills/<id>/prerequisites`: Add a prerequisite to a skill
- `PUT /api/skills/<id>/prerequisites/<prereq_id>`: Update a skill prerequisite
- `DELETE /api/skills/<id>/prerequisites/<prereq_id>`: Delete a skill prerequisite
- `GET /api/skills/user/<id>/progress`: Get skill progress for a user
- `POST /api/skills/user/<id>/progress/<skill_id>`: Update skill progress for a user
- `GET /api/skills/user/<id>/available`: Get available skills for a user

## Data Structure

The API interacts with a SQLite database (`tools/health_protocol.db`) that follows the schema defined in `tools/schema.sql`.

## Authentication

This API does not currently implement authentication. For production use, it is recommended to add an authentication layer using JWT, OAuth, or API keys.

## Error Handling

The API returns appropriate HTTP status codes:
- 200: Successful request
- 201: Resource created successfully
- 400: Bad request (e.g., invalid parameters)
- 404: Resource not found
- 409: Conflict (e.g., duplicate resource)
- 500: Server error

Error responses include a JSON object with an `error` field describing the issue.
