#!/usr/bin/env python3
"""
Playlists data generators
"""
import json
import random
from datetime import datetime, timedelta

def generate_playlists():
    """Generate playlists test data"""
    return [
        (1, 1, "Morning Routine", "Start the day right"),
        (2, 1, "Recovery Day", "Low intensity recovery activities"),
        (3, 2, "Evening Wind Down", "Relaxation before sleep"),
        (4, 2, "Energy Boost", "Activities for energy"),
        (5, 3, "Full Body Workout", "Complete body workout"),
        (6, 3, "Mind Training", "Mental exercises")
    ]

def generate_playlist_items():
    """Generate playlist items test data"""
    return [
        # User 1: Morning Routine
        (1, 1, 1, 1),  # Box Breathing
        (2, 1, 4, 2),  # Mindfulness Meditation
        (3, 1, 7, 3),  # Push-ups
        
        # User 1: Recovery Day
        (4, 2, 3, 1),  # 4-7-8 Breathing
        (5, 2, 5, 2),  # Body Scan Meditation
        
        # User 2: Evening Wind Down
        (6, 3, 3, 1),  # 4-7-8 Breathing
        (7, 3, 6, 2),  # Loving-Kindness Meditation
        (8, 3, 5, 3),  # Body Scan Meditation
        
        # User 2: Energy Boost
        (9, 4, 2, 1),   # Wim Hof Method
        (10, 4, 9, 2),  # Squats
        (11, 4, 7, 3),  # Push-ups
        
        # User 3: Full Body Workout
        (12, 5, 7, 1),  # Push-ups
        (13, 5, 8, 2),  # Pull-ups
        (14, 5, 9, 3),  # Squats
        (15, 5, 10, 4), # Deadlift
        (16, 5, 11, 5), # Bench Press
        
        # User 3: Mind Training
        (17, 6, 1, 1),  # Box Breathing
        (18, 6, 4, 2),  # Mindfulness Meditation
        (19, 6, 6, 3)   # Loving-Kindness Meditation
    ]

def generate_playlist_performances(playlists):
    """
    Generate random playlist performance data for all users.
    
    Args:
        playlists: List of playlist tuples
        
    Returns:
        List of playlist performance tuples
    """
    playlist_performances = []
    
    for user_id in range(1, 4):
        # Get playlists for this user
        user_playlists = [(p[0]) for p in playlists if p[1] == user_id]
        
        for playlist_id in user_playlists:
            # 3-8 performances per playlist
            performance_count = random.randint(3, 8)
            
            for i in range(performance_count):
                # Random day in the past 2 months
                days_ago = random.randint(0, 60)
                performance_time = datetime.now() - timedelta(days=days_ago)
                
                # Random performance data
                performance_data = {
                    "completed": random.choice([True, True, True, False]),
                    "duration_minutes": random.randint(15, 90),
                    "energy_level": random.randint(1, 10),
                    "satisfaction": random.randint(1, 10)
                }
                
                playlist_performances.append((
                    len(playlist_performances) + 1,  # id
                    user_id,
                    playlist_id,
                    performance_time.strftime("%Y-%m-%d %H:%M:%S"),
                    json.dumps(performance_data)
                ))
    
    return playlist_performances

def insert_playlists(cursor, playlists):
    """Insert playlists into database"""
    cursor.executemany("INSERT INTO Playlists VALUES (?, ?, ?, ?)", playlists)

def insert_playlist_items(cursor, playlist_items):
    """Insert playlist items into database"""
    cursor.executemany("INSERT INTO PlaylistItems VALUES (?, ?, ?, ?)", playlist_items)

def insert_playlist_performances(cursor, playlist_performances):
    """Insert playlist performances into database"""
    cursor.executemany(
        "INSERT INTO PlaylistPerformance VALUES (?, ?, ?, ?, ?)",
        playlist_performances
    )
