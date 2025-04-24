#!/usr/bin/env python3
"""
Activity data generators
"""

def generate_activities():
    """Generate activities test data"""
    return [
        (1, "Box Breathing", "4-4-4-4 breathing pattern", "breathwork", 1, "exercise", 1),
        (2, "Wim Hof Method", "Intensive breathing exercise followed by cold exposure", "breathwork", 2, "exercise", 2),
        (3, "4-7-8 Breathing", "Relaxing breathing technique", "breathwork", 1, "exercise", 1),
        (4, "Mindfulness Meditation", "Present moment awareness", "meditation", 1, "exercise", 1),
        (5, "Body Scan Meditation", "Systematic attention to body parts", "meditation", 2, "exercise", 2),
        (6, "Loving-Kindness Meditation", "Cultivating compassion", "meditation", 2, "exercise", 2),
        (7, "Push-ups", "Basic upper body exercise", "calisthenics", 2, "exercise", 1),
        (8, "Pull-ups", "Upper body pulling exercise", "calisthenics", 3, "exercise", 2),
        (9, "Squats", "Lower body compound exercise", "calisthenics", 2, "exercise", 1),
        (10, "Deadlift", "Posterior chain exercise", "strength", 3, "exercise", 2),
        (11, "Bench Press", "Upper body pushing exercise", "strength", 3, "exercise", 2),
        (12, "Shoulder Press", "Vertical pushing exercise", "strength", 2, "exercise", 2)
    ]

def generate_activity_body_areas():
    """Generate activity body areas test data"""
    return [
        (1, 1, 8),  # Box Breathing - Mind
        (2, 2, 7),  # Wim Hof Method - Full Body
        (3, 3, 8),  # 4-7-8 Breathing - Mind
        (4, 4, 8),  # Mindfulness Meditation - Mind
        (5, 5, 8),  # Body Scan Meditation - Mind
        (6, 6, 8),  # Loving-Kindness Meditation - Mind
        (7, 7, 1),  # Push-ups - Chest
        (8, 7, 3),  # Push-ups - Arms
        (9, 8, 2),  # Pull-ups - Back
        (10, 8, 3),  # Pull-ups - Arms
        (11, 9, 6),  # Squats - Legs
        (12, 9, 5),  # Squats - Core
        (13, 10, 2),  # Deadlift - Back
        (14, 10, 6),  # Deadlift - Legs
        (15, 11, 1),  # Bench Press - Chest
        (16, 11, 3),  # Bench Press - Arms
        (17, 12, 4),  # Shoulder Press - Shoulders
        (18, 12, 3)   # Shoulder Press - Arms
    ]

def generate_activity_media():
    """Generate activity media test data"""
    return [
        (1, 1, "video", "https://example.com/videos/box-breathing.mp4"),
        (2, 1, "image", "https://example.com/images/box-breathing.jpg"),
        (3, 2, "video", "https://example.com/videos/wim-hof.mp4"),
        (4, 3, "video", "https://example.com/videos/4-7-8-breathing.mp4"),
        (5, 4, "audio", "https://example.com/audio/mindfulness.mp3"),
        (6, 5, "audio", "https://example.com/audio/body-scan.mp3"),
        (7, 6, "audio", "https://example.com/audio/loving-kindness.mp3"),
        (8, 7, "video", "https://example.com/videos/pushups.mp4"),
        (9, 7, "image", "https://example.com/images/pushup-form.jpg"),
        (10, 8, "video", "https://example.com/videos/pullups.mp4"),
        (11, 9, "video", "https://example.com/videos/squats.mp4"),
        (12, 9, "image", "https://example.com/images/squat-form.jpg"),
        (13, 10, "video", "https://example.com/videos/deadlift.mp4"),
        (14, 11, "video", "https://example.com/videos/bench-press.mp4"),
        (15, 12, "video", "https://example.com/videos/shoulder-press.mp4")
    ]

def generate_activity_relationships():
    """Generate activity relationships test data"""
    return [
        (1, 1, 3, "related_skill"),      # Box Breathing related to 4-7-8 Breathing
        (2, 4, 5, "related_skill"),      # Mindfulness Meditation related to Body Scan Meditation
        (3, 4, 6, "related_skill"),      # Mindfulness Meditation related to Loving-Kindness Meditation
        (4, 7, 8, "related_skill"),      # Push-ups related to Pull-ups
        (5, 9, 10, "related_skill"),     # Squats related to Deadlift
        (6, 11, 12, "related_skill"),    # Bench Press related to Shoulder Press
        (7, 1, 4, "compound_skill"),     # Box Breathing + Mindfulness Meditation
        (8, 7, 9, "compound_skill"),     # Push-ups + Squats
        (9, 10, 11, "compound_skill"),   # Deadlift + Bench Press
        (10, 8, 7, "prerequisite_skill") # Pull-ups require Push-ups
    ]

def generate_activity_tags():
    """Generate activity tags test data"""
    return [
        (1, 1, 1),  # Box Breathing - Morning
        (2, 1, 3),  # Box Breathing - Relaxation
        (3, 1, 5),  # Box Breathing - Short Duration
        (4, 1, 7),  # Box Breathing - No Equipment
        (5, 1, 8),  # Box Breathing - Beginner Friendly
        (6, 2, 1),  # Wim Hof Method - Morning
        (7, 2, 4),  # Wim Hof Method - Energy
        (8, 2, 6),  # Wim Hof Method - Long Duration
        (9, 2, 9),  # Wim Hof Method - Advanced
        (10, 3, 2),  # 4-7-8 Breathing - Evening
        (11, 3, 3),  # 4-7-8 Breathing - Relaxation
        (12, 3, 5),  # 4-7-8 Breathing - Short Duration
        (13, 3, 7),  # 4-7-8 Breathing - No Equipment
        (14, 3, 8),  # 4-7-8 Breathing - Beginner Friendly
        (15, 4, 1),  # Mindfulness Meditation - Morning
        (16, 4, 2),  # Mindfulness Meditation - Evening
        (17, 4, 3),  # Mindfulness Meditation - Relaxation
        (18, 4, 5),  # Mindfulness Meditation - Short Duration
        (19, 4, 7),  # Mindfulness Meditation - No Equipment
        (20, 4, 8),  # Mindfulness Meditation - Beginner Friendly
        (21, 5, 2),  # Body Scan Meditation - Evening
        (22, 5, 3),  # Body Scan Meditation - Relaxation
        (23, 5, 6),  # Body Scan Meditation - Long Duration
        (24, 5, 7),  # Body Scan Meditation - No Equipment
        (25, 6, 2),  # Loving-Kindness Meditation - Evening
        (26, 6, 3),  # Loving-Kindness Meditation - Relaxation
        (27, 6, 6),  # Loving-Kindness Meditation - Long Duration
        (28, 6, 7),  # Loving-Kindness Meditation - No Equipment
        (29, 7, 1),  # Push-ups - Morning
        (30, 7, 4),  # Push-ups - Energy
        (31, 7, 5),  # Push-ups - Short Duration
        (32, 7, 7),  # Push-ups - No Equipment
        (33, 8, 4),  # Pull-ups - Energy
        (34, 8, 5),  # Pull-ups - Short Duration
        (35, 8, 9),  # Pull-ups - Advanced
        (36, 9, 4),  # Squats - Energy
        (37, 9, 5),  # Squats - Short Duration
        (38, 9, 7),  # Squats - No Equipment
        (39, 9, 8),  # Squats - Beginner Friendly
        (40, 10, 4),  # Deadlift - Energy
        (41, 10, 6),  # Deadlift - Long Duration
        (42, 10, 9),  # Deadlift - Advanced
        (43, 11, 4),  # Bench Press - Energy
        (44, 11, 6),  # Bench Press - Long Duration
        (45, 11, 9),  # Bench Press - Advanced
        (46, 12, 4),  # Shoulder Press - Energy
        (47, 12, 6),  # Shoulder Press - Long Duration
        (48, 12, 9)   # Shoulder Press - Advanced
    ]

def insert_activities(cursor, activities):
    """Insert activities into database"""
    cursor.executemany("INSERT INTO activities VALUES (?, ?, ?, ?, ?, ?, ?)", activities)

def insert_activity_body_areas(cursor, activity_body_areas):
    """Insert activity body areas into database"""
    cursor.executemany("INSERT INTO ActivityBodyAreas VALUES (?, ?, ?)", activity_body_areas)

def insert_activity_media(cursor, activity_media):
    """Insert activity media into database"""
    cursor.executemany("INSERT INTO ActivityMedia VALUES (?, ?, ?, ?)", activity_media)

def insert_activity_relationships(cursor, activity_relationships):
    """Insert activity relationships into database"""
    cursor.executemany("INSERT INTO ActivityRelationships VALUES (?, ?, ?, ?)", activity_relationships)

def insert_activity_tags(cursor, activity_tags):
    """Insert activity tags into database"""
    cursor.executemany("INSERT INTO ActivityTags VALUES (?, ?, ?)", activity_tags)
