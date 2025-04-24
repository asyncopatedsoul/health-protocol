#!/bin/bash
# Script to update visualization data and run the application

echo "=== Health Protocol Admin App ==="
echo "Updating visualization data from database..."

# Install dependencies if needed (commented out - run manually if needed)
# pnpm add d3 @types/d3 sqlite3

# Export activities data from database to JSON
python3 export_activities_data.py

# Make sure the JSON file is accessible in the static directory
if [ -f "static/activities-data.json" ]; then
    echo "✅ Activities data updated successfully"
else
    echo "❌ Failed to generate activities data"
    exit 1
fi

# Start the application in development mode
echo "Starting application..."
echo "Access the visualization at: http://localhost:5173/activities-visualization.html"
echo "Press Ctrl+C to stop the application"

# Run the application
pnpm run dev
