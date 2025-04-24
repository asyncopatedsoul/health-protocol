#!/usr/bin/env python3
"""
User data generators
"""

def generate_users():
    """Generate user test data"""
    return [
        (1, "John", "Doe", "johndoe", "john.doe@example.com"),
        (2, "Jane", "Smith", "janesmith", "jane.smith@example.com"),
        (3, "Michael", "Johnson", "mjohnson", "michael.johnson@example.com")
    ]

def insert_users(cursor, users):
    """Insert users into database"""
    cursor.executemany("INSERT INTO users VALUES (?, ?, ?, ?, ?)", users)
