#!/bin/bash

# Usage: bash run_batch_extract_audio.sh
# This script runs the batch audio extraction using the sample CSV

# Ensure the output directory exists
mkdir -p tools/temp_audio

# Run the batch extraction
python3 tools/extract_audio.py batch sample_extract_audio.csv --video_dir tools/temp_video