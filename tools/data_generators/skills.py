#!/usr/bin/env python3
"""
Skills data generators
"""
import random
from .utils import current_timestamp_ms, random_past_timestamp_ms

def generate_skill_categories():
    """Generate skill categories test data"""
    return [
        (1, "Breathwork", "Various breathing techniques", "#4287f5"),
        (2, "Meditation", "Mindfulness and meditation practices", "#42f5a7"),
        (3, "Calisthenics", "Bodyweight exercises", "#f54242"),
        (4, "Strength", "Resistance training exercises", "#f5c242")
    ]

def generate_activity_skills():
    """Generate activity skills test data"""
    return [
        (1, 1, "Breath Control", "Maintaining consistent breathing rhythm", 1, 1),
        (2, 1, "Extended Holds", "Holding breath for longer periods", 2, 1),
        (3, 2, "Power Breathing", "Intense breath work for energy", 2, 1),
        (4, 2, "Cold Exposure", "Tolerance to cold stimuli", 3, 1),
        (5, 3, "Relaxation Breathing", "Using breath to induce relaxation", 1, 1),
        (6, 4, "Present Awareness", "Focusing on the present moment", 1, 2),
        (7, 5, "Body Awareness", "Detailed attention to bodily sensations", 2, 2),
        (8, 6, "Compassion Cultivation", "Developing feelings of goodwill", 2, 2),
        (9, 7, "Basic Push-up Form", "Proper push-up technique", 1, 3),
        (10, 7, "Push-up Endurance", "Building push-up stamina", 2, 3),
        (11, 8, "Pull-up Grip Strength", "Hand and forearm strength for pull-ups", 2, 3),
        (12, 8, "Pull-up Technique", "Proper pull-up execution", 3, 3),
        (13, 9, "Squat Form", "Proper squat technique", 1, 3),
        (14, 9, "Squat Depth", "Achieving full range of motion", 2, 3),
        (15, 10, "Deadlift Form", "Proper deadlift technique", 2, 4),
        (16, 10, "Hip Hinge", "Proper hip movement pattern", 1, 4),
        (17, 11, "Bench Press Setup", "Proper positioning for bench press", 1, 4),
        (18, 11, "Press Technique", "Proper movement pattern for pressing", 2, 4),
        (19, 12, "Shoulder Stability", "Maintaining stable shoulders", 2, 4),
        (20, 12, "Overhead Position", "Safe and effective overhead positioning", 3, 4)
    ]

def generate_skill_prerequisites():
    """Generate skill prerequisites test data"""
    return [
        (1, 2, 1, 0.7),  # Extended Holds requires Breath Control
        (2, 3, 1, 0.6),  # Power Breathing requires Breath Control
        (3, 4, 3, 0.8),  # Cold Exposure requires Power Breathing
        (4, 7, 6, 0.6),  # Body Awareness requires Present Awareness
        (5, 8, 7, 0.7),  # Compassion Cultivation requires Body Awareness
        (6, 10, 9, 0.8),  # Push-up Endurance requires Basic Push-up Form
        (7, 12, 11, 0.7),  # Pull-up Technique requires Pull-up Grip Strength
        (8, 14, 13, 0.8),  # Squat Depth requires Squat Form
        (9, 15, 16, 0.7),  # Deadlift Form requires Hip Hinge
        (10, 18, 17, 0.6),  # Press Technique requires Bench Press Setup
        (11, 20, 19, 0.8)   # Overhead Position requires Shoulder Stability
    ]

def generate_user_skill_progress(activity_history, activity_protocols, activity_skills):
    """
    Generate user skill progress based on activity history.
    
    Args:
        activity_history: List of activity history records
        activity_protocols: List of activity protocol records
        activity_skills: List of activity skill records
        
    Returns:
        List of user skill progress records
    """
    user_skill_progress = []
    now = current_timestamp_ms()
    
    # Create a mapping of activity IDs to their skills
    activity_to_skills = {}
    for skill in activity_skills:
        skill_id, activity_id = skill[0], skill[1]
        if activity_id not in activity_to_skills:
            activity_to_skills[activity_id] = []
        activity_to_skills[activity_id].append(skill_id)
    
    # Create a mapping of activity protocol IDs to activity IDs
    protocol_to_activity = {}
    for ap in activity_protocols:
        protocol_id, activity_id = ap[0], ap[1]
        protocol_to_activity[protocol_id] = activity_id
    
    # Find which activities each user has practiced
    user_activities = {}
    for history in activity_history:
        user_id, protocol_id = history[1], history[2]
        if user_id not in user_activities:
            user_activities[user_id] = set()
        if protocol_id in protocol_to_activity:
            activity_id = protocol_to_activity[protocol_id]
            user_activities[user_id].add(activity_id)
    
    # Generate skill progress for each user based on their activities
    for user_id, activities in user_activities.items():
        for activity_id in activities:
            if activity_id in activity_to_skills:
                skills = activity_to_skills[activity_id]
                for skill_id in skills:
                    # Generate random mastery level between 0.1 and 0.9
                    mastery = random.uniform(0.1, 0.9)
                    
                    # Generate random practice data
                    total_practice_time = random.randint(1800000, 7200000)  # 30 min to 2 hours in ms
                    practice_count = random.randint(3, 20)
                    
                    # Last practiced time (random in last 30 days)
                    last_practiced = random_past_timestamp_ms(30)
                    
                    user_skill_progress.append((
                        len(user_skill_progress) + 1,  # id
                        user_id,
                        skill_id,
                        mastery,
                        last_practiced,
                        total_practice_time,
                        practice_count
                    ))
    
    return user_skill_progress

def insert_skill_categories(cursor, skill_categories):
    """Insert skill categories into database"""
    cursor.executemany("INSERT INTO skill_categories VALUES (?, ?, ?, ?)", skill_categories)

def insert_activity_skills(cursor, activity_skills):
    """Insert activity skills into database"""
    cursor.executemany("INSERT INTO activity_skills VALUES (?, ?, ?, ?, ?, ?)", activity_skills)

def insert_skill_prerequisites(cursor, skill_prerequisites):
    """Insert skill prerequisites into database"""
    cursor.executemany("INSERT INTO skill_prerequisites VALUES (?, ?, ?, ?)", skill_prerequisites)

def insert_user_skill_progress(cursor, user_skill_progress):
    """Insert user skill progress into database"""
    cursor.executemany(
        "INSERT INTO user_skill_progress VALUES (?, ?, ?, ?, ?, ?, ?)", 
        user_skill_progress
    )
