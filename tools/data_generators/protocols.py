#!/usr/bin/env python3
"""
Protocols data generators
"""
import json
import time
import random
from .utils import current_timestamp_ms, random_past_timestamp_ms, random_duration_ms, ms_to_iso_string

def generate_protocols():
    """Generate protocols test data"""
    return [
        (1, "Morning Mindfulness", "console.log('Starting morning mindfulness session')", "A structured morning meditation protocol"),
        (2, "Stress Relief", "console.log('Starting stress relief protocol')", "Quick stress relief breathing exercises"),
        (3, "Beginner Calisthenics", "console.log('Starting beginner calisthenics')", "Simple bodyweight exercises for beginners"),
        (4, "Strength Foundations", "console.log('Starting strength foundations')", "Basic strength training routine")
    ]

def generate_activity_protocols():
    """Generate activity protocols test data"""
    return [
        (1, 1, 1, json.dumps({"duration": 300, "instructions": "Focus on breath"}), int(time.time())),
        (2, 3, 1, json.dumps({"duration": 180, "instructions": "4-7-8 pattern"}), int(time.time())),
        (3, 4, 1, json.dumps({"duration": 600, "instructions": "Body awareness"}), int(time.time())),
        (4, 1, 2, json.dumps({"duration": 240, "instructions": "Box breathing for stress"}), int(time.time())),
        (5, 3, 2, json.dumps({"duration": 300, "instructions": "Relaxation breathing"}), int(time.time())),
        (6, 5, 2, json.dumps({"duration": 600, "instructions": "Full body scan"}), int(time.time())),
        (7, 7, 3, json.dumps({"reps": 10, "sets": 3, "rest": 60}), int(time.time())),
        (8, 9, 3, json.dumps({"reps": 12, "sets": 3, "rest": 60}), int(time.time())),
        (9, 10, 4, json.dumps({"weight": "bodyweight", "reps": 8, "sets": 3}), int(time.time())),
        (10, 11, 4, json.dumps({"weight": "light", "reps": 10, "sets": 3}), int(time.time())),
        (11, 12, 4, json.dumps({"weight": "light", "reps": 10, "sets": 3}), int(time.time()))
    ]

def generate_activity_history(activity_protocols):
    """
    Generate random activity history data for all users.
    
    Args:
        activity_protocols: List of activity protocol tuples
        
    Returns:
        List of activity history tuples
    """
    activity_history = []
    
    # Generate activity history entries for each user
    for user_id in range(1, 4):  # 3 users
        # Each user will have practiced different activities
        activity_count = random.randint(15, 30)
        
        for i in range(activity_count):
            # Random activity protocol
            activity_protocol_id = random.randint(1, len(activity_protocols))
            
            # Random time in the past (up to 3 months)
            start_time_ms = random_past_timestamp_ms(90)
            
            # Activity duration between 5 minutes and 1 hour
            duration_ms = random_duration_ms(5, 60)
            end_time_ms = start_time_ms + duration_ms
            
            # Convert to datetime for timestamp format
            start_time = ms_to_iso_string(start_time_ms)
            end_time = ms_to_iso_string(end_time_ms)
            
            # Status (mostly completed, some in progress or abandoned)
            status_options = ["completed", "completed", "completed", "completed", "in_progress", "abandoned"]
            status = random.choice(status_options)
            
            # Random notes
            notes_options = [
                "Felt great today!",
                "Struggled with focus.",
                "Making progress.",
                "Need to work on technique.",
                "Energy was low today.",
                "Personal best!",
                "Tried new variation.",
                "",
                "",
                ""
            ]
            notes = random.choice(notes_options)
            
            # Add to activity history
            activity_history.append((
                len(activity_history) + 1,  # id
                user_id,
                activity_protocol_id,
                json.dumps({"completed": status == "completed"}),
                start_time,
                end_time,
                start_time_ms,
                end_time_ms,
                status,
                notes
            ))
    
    return activity_history

def insert_protocols(cursor, protocols):
    """Insert protocols into database"""
    cursor.executemany("INSERT INTO protocols VALUES (?, ?, ?, ?)", protocols)

def insert_activity_protocols(cursor, activity_protocols):
    """Insert activity protocols into database"""
    cursor.executemany("INSERT INTO activity_protocols VALUES (?, ?, ?, ?, ?)", activity_protocols)

def insert_activity_history(cursor, activity_history):
    """Insert activity history into database"""
    cursor.executemany(
        "INSERT INTO activity_history VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        activity_history
    )
