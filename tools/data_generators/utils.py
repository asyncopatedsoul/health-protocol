#!/usr/bin/env python3
"""
Utility functions for data generation.
"""
import json
import random
import time
from datetime import datetime, timedelta

# Time utility functions
def current_timestamp_ms():
    """Get current timestamp in milliseconds"""
    return int(time.time() * 1000)

def days_ago_timestamp_ms(days):
    """Get timestamp in milliseconds from n days ago"""
    now = current_timestamp_ms()
    one_day_ms = 24 * 60 * 60 * 1000
    return now - (days * one_day_ms)

def random_past_timestamp_ms(max_days_ago=90):
    """Get random timestamp in the past, up to max_days_ago"""
    now = current_timestamp_ms()
    one_day_ms = 24 * 60 * 60 * 1000
    days_ago = random.randint(0, max_days_ago)
    return now - (days_ago * one_day_ms) - random.randint(0, one_day_ms)

def ms_to_iso_string(timestamp_ms):
    """Convert timestamp in milliseconds to ISO 8601 string"""
    return datetime.fromtimestamp(timestamp_ms / 1000).isoformat()

# Random data generation helpers
def random_duration_ms(min_minutes=5, max_minutes=60):
    """Generate random duration in milliseconds between min and max minutes"""
    return random.randint(min_minutes * 60 * 1000, max_minutes * 60 * 1000)

def random_choice_weighted(options, weights=None):
    """Choose random element from options with optional weights"""
    return random.choices(options, weights=weights, k=1)[0]
