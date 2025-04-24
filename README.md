# Health Protocol Test Data Generator

This project provides a set of Python scripts to generate test data for the Health Protocol app database. The test data includes users, activities, skills, protocols, and more, with realistic relationships between entities.

## Project Structure

```
/health-protocol/
├── schema_utils.py        # Database initialization utilities
├── main.py                # Main script to run data generation
├── paste.txt              # Original schema SQL
├── data_generators/       # Data generation modules
│   ├── __init__.py        # Package initialization
│   ├── utils.py           # Shared utility functions
│   ├── users.py           # User data generators
│   ├── metadata.py        # Metadata tables (difficulties, body areas, tags)
│   ├── activities.py      # Activity data generators
│   ├── skills.py          # Skills data generators
│   ├── protocols.py       # Protocols data generators
│   ├── playlists.py       # Playlist data generators
│   └── guides.py          # Guide data generators
```

## Usage

1. Ensure you have the schema SQL in `paste.txt` in the root directory.
2. Run the main script to generate the test data:

```bash
python main.py
```

The script will:
1. Create a new SQLite database file (`health_protocol.db`)
2. Set up the schema from `paste.txt`
3. Generate test data for all tables
4. Insert the data into the database with proper relationships

## Generated Data

The generated test data includes:

- 3 users (John Doe, Jane Smith, Michael Johnson)
- 12 different activities across 4 categories (breathwork, meditation, calisthenics, strength)
- Activity metadata (body areas, difficulties, tags, media)
- User activity history (15-30 activities per user)
- Skills for each activity with prerequisites
- User skill progress based on practice history
- Protocols that combine activities
- Playlists of activities for different goals
- Guides with content for various wellness practices

## Customization

You can modify any of the data generator files to customize the test data according to your needs. Each module has separate generator functions that you can adjust independently.

## Requirements

- Python 3.6 or higher
- SQLite3
