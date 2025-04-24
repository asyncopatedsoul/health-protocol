#!/usr/bin/env python3
"""
Export activities and their relationships from SQLite database to JSON format
for use with the D3.js visualization.
"""

import sqlite3
import json
import os
import sys

def get_db_path():
    """Get the path to the health_protocol.db file"""
    # Check if the file exists in the current directory
    if os.path.exists("health_protocol.db"):
        return "health_protocol.db"
    
    # Check if running from the admin-app directory
    parent_dir = os.path.dirname(os.path.abspath(__file__))
    db_path = os.path.join(parent_dir, "health_protocol.db")
    if os.path.exists(db_path):
        return db_path
    
    # Try one level up in the tools directory
    tools_dir = os.path.dirname(parent_dir)
    db_path = os.path.join(tools_dir, "health_protocol.db")
    if os.path.exists(db_path):
        return db_path
    
    # Try the empty database
    db_path = os.path.join(tools_dir, "health_protocol_empty.db")
    if os.path.exists(db_path):
        return db_path
    
    raise FileNotFoundError("Could not find health_protocol.db file")

def export_activities_data(output_file="static/activities-data.json"):
    """
    Export activities and their relationships to a JSON file
    for use with the D3.js visualization.
    """
    try:
        db_path = get_db_path()
        print(f"Using database: {db_path}")
        
        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        # Get all activities
        cursor.execute("""
            SELECT id, name, description, type, difficulty_level, 
                   activity_type, complexity_level
            FROM activities
        """)
        activities = [dict(row) for row in cursor.fetchall()]
        
        # Get all activity relationships
        cursor.execute("""
            SELECT id, activity1_id, activity2_id, relationship_type
            FROM ActivityRelationships
        """)
        relationships = [dict(row) for row in cursor.fetchall()]
        
        # Format the data for D3.js
        data = {
            "nodes": [
                {
                    "id": activity["id"],
                    "name": activity["name"],
                    "type": activity["type"],
                    "difficulty": activity["difficulty_level"],
                    "complexity": activity["complexity_level"],
                    "activity_type": activity["activity_type"],
                    "description": activity["description"]
                }
                for activity in activities
            ],
            "links": [
                {
                    "source": rel["activity1_id"],
                    "target": rel["activity2_id"],
                    "type": rel["relationship_type"]
                }
                for rel in relationships
            ]
        }
        
        # Create directory if it doesn't exist
        os.makedirs(os.path.dirname(output_file), exist_ok=True)
        
        # Write to JSON file
        with open(output_file, 'w') as f:
            json.dump(data, f, indent=2)
        
        print(f"Data exported to {output_file}")
        print(f"Found {len(activities)} activities and {len(relationships)} relationships")
        
        conn.close()
        return data
        
    except Exception as e:
        print(f"Error exporting data: {str(e)}")
        sys.exit(1)

def main():
    # Get output file from command line arguments if provided
    output_file = "static/activities-data.json"
    if len(sys.argv) > 1:
        output_file = sys.argv[1]
    
    export_activities_data(output_file)

if __name__ == "__main__":
    main()
