#!/usr/bin/env python3
"""
Metadata data generators for activity categorization
"""

def generate_difficulty_levels():
    """Generate difficulty levels test data"""
    return [
        (1, "Beginner", "Easy for newcomers"),
        (2, "Intermediate", "Requires some experience"),
        (3, "Advanced", "Challenging for experienced practitioners"),
        (4, "Expert", "Very challenging, requires significant experience")
    ]

def generate_body_areas():
    """Generate body areas test data"""
    return [
        (1, "Chest"),
        (2, "Back"),
        (3, "Arms"),
        (4, "Shoulders"),
        (5, "Core"),
        (6, "Legs"),
        (7, "Full Body"),
        (8, "Mind")
    ]

def generate_tags():
    """Generate tags test data"""
    return [
        (1, "Morning", "Activities suitable for morning routine", "universal"),
        (2, "Evening", "Activities suitable for evening routine", "universal"),
        (3, "Relaxation", "Activities for stress relief", "universal"),
        (4, "Energy", "Activities for increasing energy", "universal"),
        (5, "Short Duration", "Activities taking less than 10 minutes", "universal"),
        (6, "Long Duration", "Activities taking more than 20 minutes", "universal"),
        (7, "No Equipment", "Activities requiring no equipment", "universal"),
        (8, "Beginner Friendly", "Activities suitable for beginners", "universal"),
        (9, "Advanced", "Activities for experienced practitioners", "universal")
    ]

def insert_difficulty_levels(cursor, difficulty_levels):
    """Insert difficulty levels into database"""
    cursor.executemany("INSERT INTO DifficultyLevels VALUES (?, ?, ?)", difficulty_levels)

def insert_body_areas(cursor, body_areas):
    """Insert body areas into database"""
    cursor.executemany("INSERT INTO BodyAreas VALUES (?, ?)", body_areas)

def insert_tags(cursor, tags):
    """Insert tags into database"""
    cursor.executemany("INSERT INTO Tags VALUES (?, ?, ?, ?)", tags)
