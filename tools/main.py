#!/usr/bin/env python3
"""
Main script to generate test data for Health Protocol database
"""
import sqlite3
import sys
import os

from tools.schema_utils import initialize_database
from data_generators.users import generate_users, insert_users
from data_generators.metadata import (
    generate_difficulty_levels, generate_body_areas, generate_tags,
    insert_difficulty_levels, insert_body_areas, insert_tags
)
from data_generators.activities import (
    generate_activities, generate_activity_body_areas, generate_activity_media,
    generate_activity_relationships, generate_activity_tags,
    insert_activities, insert_activity_body_areas, insert_activity_media,
    insert_activity_relationships, insert_activity_tags
)
from data_generators.skills import (
    generate_skill_categories, generate_activity_skills, generate_skill_prerequisites,
    generate_user_skill_progress, insert_skill_categories, insert_activity_skills,
    insert_skill_prerequisites, insert_user_skill_progress
)
from data_generators.protocols import (
    generate_protocols, generate_activity_protocols, generate_activity_history,
    insert_protocols, insert_activity_protocols, insert_activity_history
)
from data_generators.playlists import (
    generate_playlists, generate_playlist_items, generate_playlist_performances,
    insert_playlists, insert_playlist_items, insert_playlist_performances
)
from data_generators.guides import (
    generate_guides, generate_guide_parts, generate_guide_versions, generate_guide_part_versions,
    insert_guides, insert_guide_parts, insert_guide_versions, insert_guide_part_versions
)

def main():
    """Main function to generate and insert test data"""
    # Initialize database
    print("Initializing database...")
    conn = initialize_database()
    cursor = conn.cursor()
    
    # Generate data for each table
    print("Generating test data...")
    
    # Basic data
    users = generate_users()
    difficulty_levels = generate_difficulty_levels()
    body_areas = generate_body_areas()
    tags = generate_tags()
    skill_categories = generate_skill_categories()
    
    # Activity data
    activities = generate_activities()
    activity_body_areas = generate_activity_body_areas()
    activity_media = generate_activity_media()
    activity_tags = generate_activity_tags()
    activity_relationships = generate_activity_relationships()
    
    # Skills data
    activity_skills = generate_activity_skills()
    skill_prerequisites = generate_skill_prerequisites()
    
    # Protocol data
    protocols = generate_protocols()
    activity_protocols = generate_activity_protocols()
    
    # Dynamic data that depends on previous data
    activity_history = generate_activity_history(activity_protocols)
    user_skill_progress = generate_user_skill_progress(activity_history, activity_protocols, activity_skills)
    
    # Content data
    playlists = generate_playlists()
    playlist_items = generate_playlist_items()
    playlist_performances = generate_playlist_performances(playlists)
    
    # Guide data
    guides = generate_guides()
    guide_parts = generate_guide_parts()
    guide_versions = generate_guide_versions()
    guide_part_versions = generate_guide_part_versions()
    
    # Insert all data into database
    print("Inserting data into database...")
    
    # Users
    insert_users(cursor, users)
    
    # Metadata tables
    insert_difficulty_levels(cursor, difficulty_levels)
    insert_body_areas(cursor, body_areas)
    insert_tags(cursor, tags)
    insert_skill_categories(cursor, skill_categories)
    
    # Activity tables
    insert_activities(cursor, activities)
    insert_activity_body_areas(cursor, activity_body_areas)
    insert_activity_media(cursor, activity_media)
    insert_activity_tags(cursor, activity_tags)
    insert_activity_relationships(cursor, activity_relationships)
    
    # Skills tables
    insert_activity_skills(cursor, activity_skills)
    insert_skill_prerequisites(cursor, skill_prerequisites)
    
    # Protocol tables
    insert_protocols(cursor, protocols)
    insert_activity_protocols(cursor, activity_protocols)
    insert_activity_history(cursor, activity_history)
    
    # User progress
    insert_user_skill_progress(cursor, user_skill_progress)
    
    # Playlist tables
    insert_playlists(cursor, playlists)
    insert_playlist_items(cursor, playlist_items)
    insert_playlist_performances(cursor, playlist_performances)
    
    # Guide tables
    insert_guides(cursor, guides)
    insert_guide_parts(cursor, guide_parts)
    insert_guide_versions(cursor, guide_versions)
    insert_guide_part_versions(cursor, guide_part_versions)
    
    # Commit and close
    conn.commit()
    conn.close()
    
    print("Data generation complete. Database has been populated with test data.")

if __name__ == "__main__":
    main()
