#!/usr/bin/env python3
"""
Guides data generators
"""
from datetime import datetime

def generate_guides():
    """Generate guides test data"""
    return [
        (1, "Beginner Meditation Guide", "A comprehensive guide to starting meditation practice"),
        (2, "Breathwork Fundamentals", "Learn the basics of breathwork techniques"),
        (3, "Bodyweight Exercise Basics", "Introduction to calisthenics and bodyweight training"),
        (4, "Strength Training for Beginners", "Getting started with resistance training")
    ]

def generate_guide_parts():
    """Generate guide parts test data"""
    return [
        (1, 1, "Introduction to Meditation", "Meditation is the practice of focusing your attention...", 1),
        (2, 1, "Benefits of Meditation", "Regular meditation practice has been shown to reduce stress...", 2),
        (3, 1, "Getting Started", "Find a quiet place where you won't be disturbed...", 3),
        (4, 1, "Basic Meditation Techniques", "Start with mindfulness meditation by focusing on your breath...", 4),
        (5, 2, "What is Breathwork?", "Breathwork refers to various breathing exercises...", 1),
        (6, 2, "The Science Behind Breathwork", "Controlled breathing affects your autonomic nervous system...", 2),
        (7, 2, "Basic Breathing Techniques", "Box breathing, 4-7-8 breathing, and Wim Hof method...", 3),
        (8, 3, "Benefits of Bodyweight Training", "Calisthenics helps develop strength, flexibility...", 1),
        (9, 3, "Fundamental Movements", "Push-ups, pull-ups, squats, and planks...", 2),
        (10, 3, "Creating Your Routine", "Start with 2-3 sessions per week...", 3),
        (11, 4, "Principles of Strength Training", "Progressive overload, proper form, and recovery...", 1),
        (12, 4, "Essential Exercises", "Deadlift, bench press, shoulder press, and squats...", 2),
        (13, 4, "Getting Started Safely", "Begin with lighter weights to perfect form...", 3)
    ]

def generate_guide_versions():
    """Generate guide versions test data"""
    return [
        (1, 1, 1, "Initial release", datetime.now().timestamp()),
        (2, 2, 1, "Initial release", datetime.now().timestamp()),
        (3, 3, 1, "Initial release", datetime.now().timestamp()),
        (4, 4, 1, "Initial release", datetime.now().timestamp())
    ]

def generate_guide_part_versions():
    """Generate guide part versions test data"""
    return [
        (1, 1, 1, "Meditation is the practice of focusing your attention..."),
        (2, 1, 2, "Regular meditation practice has been shown to reduce stress..."),
        (3, 1, 3, "Find a quiet place where you won't be disturbed..."),
        (4, 1, 4, "Start with mindfulness meditation by focusing on your breath..."),
        (5, 2, 5, "Breathwork refers to various breathing exercises..."),
        (6, 2, 6, "Controlled breathing affects your autonomic nervous system..."),
        (7, 2, 7, "Box breathing, 4-7-8 breathing, and Wim Hof method..."),
        (8, 3, 8, "Calisthenics helps develop strength, flexibility..."),
        (9, 3, 9, "Push-ups, pull-ups, squats, and planks..."),
        (10, 3, 10, "Start with 2-3 sessions per week..."),
        (11, 4, 11, "Progressive overload, proper form, and recovery..."),
        (12, 4, 12, "Deadlift, bench press, shoulder press, and squats..."),
        (13, 4, 13, "Begin with lighter weights to perfect form...")
    ]

def insert_guides(cursor, guides):
    """Insert guides into database"""
    cursor.executemany("INSERT INTO Guides VALUES (?, ?, ?)", guides)

def insert_guide_parts(cursor, guide_parts):
    """Insert guide parts into database"""
    cursor.executemany("INSERT INTO GuideParts VALUES (?, ?, ?, ?, ?)", guide_parts)

def insert_guide_versions(cursor, guide_versions):
    """Insert guide versions into database"""
    cursor.executemany("INSERT INTO GuideVersions VALUES (?, ?, ?, ?, ?)", guide_versions)

def insert_guide_part_versions(cursor, guide_part_versions):
    """Insert guide part versions into database"""
    cursor.executemany("INSERT INTO GuidePartVersions VALUES (?, ?, ?, ?)", guide_part_versions)
