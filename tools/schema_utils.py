#!/usr/bin/env python3
"""
Schema utilities for Health Protocol database.
Handles schema creation and validation functions.
"""
import os
import sqlite3

def setup_database(db_path="health_protocol.db"):
    """
    Set up a fresh database, removing any existing one.
    
    Args:
        db_path: Path to the database file
        
    Returns:
        Connection object to the database
    """
    # Check if DB exists and remove it to start fresh
    if os.path.exists(db_path):
        os.remove(db_path)
    
    # Connect to the database
    conn = sqlite3.connect(db_path)
    
    return conn

def create_schema_file(paste_file="paste.txt", schema_file="schema.sql"):
    """
    Create a schema.sql file from the provided paste.txt file.
    
    Args:
        paste_file: Source file containing schema SQL
        schema_file: Target file to write schema SQL
    """
    with open(schema_file, 'w') as f:
        with open(paste_file, 'r') as src:
            f.write(src.read())

def execute_schema(conn, schema_file="schema.sql"):
    """
    Execute schema SQL on the database.
    
    Args:
        conn: Database connection
        schema_file: File containing schema SQL
        
    Returns:
        conn: Database connection with schema applied
    """
    cursor = conn.cursor()
    
    # Read schema from schema file
    with open(schema_file, 'r') as f:
        schema_sql = f.read()
    
    # Execute schema
    cursor.executescript(schema_sql)
    conn.commit()
    
    return conn

def initialize_database(db_path="health_protocol.db", paste_file="paste.txt", schema_file="schema.sql"):
    """
    Initialize the database with schema from the paste file.
    
    Args:
        db_path: Path to the database file
        paste_file: Source file containing schema SQL
        schema_file: Target file to write schema SQL
        
    Returns:
        conn: Database connection with schema applied
    """
    conn = setup_database(db_path)
    create_schema_file(paste_file, schema_file)
    conn = execute_schema(conn, schema_file)
    
    return conn
