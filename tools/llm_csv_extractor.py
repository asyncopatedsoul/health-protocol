#!/usr/bin/env python3
"""
Extract CSV data from LLM responses.

This script reads a YAML file containing LLM prompts, sends them to the Google Gemini API,
extracts any CSV data from the responses, and saves all extracted data to a single CSV file.
"""

import os
import sys
import yaml
import csv
import json
import argparse
import requests
from typing import Dict, List, Any, Optional, Union
import re


def load_prompts_from_yaml(yaml_file_path: str) -> Dict[str, Any]:
    """
    Load prompt information from a YAML file.

    Expected YAML format:
    ```yaml
    api_key: "YOUR_GEMINI_API_KEY"  # Optional, can be provided via environment variable
    model: "gemini-2.0-flash"  # Optional, defaults to gemini-2.0-flash
    prompts:
      - name: "prompt_name_1"
        text: "Generate a CSV of daily exercise routines"
      - name: "prompt_name_2"
        text: "Generate a CSV of meditation exercises"
    ```

    Parameters:
    - yaml_file_path: Path to the YAML file

    Returns:
    - Dictionary containing api_key, model, and prompts information
    """
    try:
        with open(yaml_file_path, 'r') as yaml_file:
            config = yaml.safe_load(yaml_file)

        if 'prompts' not in config or not isinstance(config['prompts'], list) or len(config['prompts']) == 0:
            raise ValueError("YAML file must contain a 'prompts' field with at least one prompt")

        for i, prompt in enumerate(config['prompts']):
            if 'name' not in prompt:
                prompt['name'] = f"prompt_{i+1}"
            if 'text' not in prompt:
                raise ValueError(f"Prompt '{prompt.get('name', f'at index {i}')}' is missing required 'text' field")

        # Set default model if not specified
        if 'model' not in config:
            config['model'] = 'gemini-2.0-flash'

        return config
    except Exception as e:
        print(f"Error loading YAML file: {e}")
        raise


def send_prompt_to_gemini(prompt_text: str, model: str, api_key: str) -> str:
    """
    Send a prompt to the Google Gemini API and return the response.

    Parameters:
    - prompt_text: The text of the prompt to send
    - model: The Gemini model ID to use
    - api_key: The API key for Google Gemini

    Returns:
    - Response text from the Gemini API
    """
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
    headers = {'Content-Type': 'application/json'}
    data = {
        "contents": [{
            "parts": [{"text": prompt_text}]
        }]
    }

    try:
        response = requests.post(url, headers=headers, json=data)
        response.raise_for_status()
        
        response_json = response.json()
        
        # Extract the text from the response
        if 'candidates' in response_json and response_json['candidates']:
            candidate = response_json['candidates'][0]
            if 'content' in candidate and 'parts' in candidate['content']:
                parts = candidate['content']['parts']
                if parts and 'text' in parts[0]:
                    return parts[0]['text']
        
        raise ValueError("Could not extract text from Gemini API response")
    except requests.exceptions.RequestException as e:
        print(f"Error sending request to Gemini API: {e}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"Response status code: {e.response.status_code}")
            print(f"Response body: {e.response.text}")
        raise
    except Exception as e:
        print(f"Error processing Gemini API response: {e}")
        raise


def extract_csv_data(text: str) -> List[List[str]]:
    """
    Extract CSV data from a text string.

    This function looks for CSV-formatted data in the text and returns it as a list of rows.
    It handles both markdown code blocks and plain CSV text.

    Parameters:
    - text: The text to extract CSV data from

    Returns:
    - List of CSV rows, where each row is a list of string values
    """
    # Try to extract from markdown code blocks first (```csv ... ```)
    csv_blocks = re.findall(r'```(?:csv)?\s*([\s\S]*?)```', text)
    
    if csv_blocks:
        # Use the first CSV block found
        csv_text = csv_blocks[0].strip()
    else:
        # Try to find CSV data directly in the text
        # Look for multiple lines with comma-separated values
        lines = text.split('\n')
        csv_lines = []
        in_csv_section = False
        
        for line in lines:
            line = line.strip()
            if not line:
                if in_csv_section and csv_lines:
                    in_csv_section = False
                continue
            
            # If line has multiple comma-separated values, it's likely CSV data
            if line.count(',') >= 1:
                if not in_csv_section and not csv_lines:
                    in_csv_section = True
                
                if in_csv_section:
                    csv_lines.append(line)
            else:
                if in_csv_section and csv_lines:
                    in_csv_section = False
        
        if not csv_lines:
            print("No CSV data found in the response.")
            return []
        
        csv_text = '\n'.join(csv_lines)
    
    # Parse the CSV text
    rows = []
    try:
        reader = csv.reader(csv_text.splitlines())
        for row in reader:
            rows.append(row)
        
        # Filter out empty rows
        rows = [row for row in rows if any(cell.strip() for cell in row)]
        
        if not rows:
            print("CSV data is empty after parsing.")
            return []
        
        return rows
    except Exception as e:
        print(f"Error parsing CSV data: {e}")
        return []


def save_to_csv(data: List[List[str]], output_file: str) -> None:
    """
    Save data to a CSV file.

    Parameters:
    - data: List of rows, where each row is a list of values
    - output_file: Path to the output CSV file
    """
    try:
        # Create directory if it doesn't exist
        os.makedirs(os.path.dirname(os.path.abspath(output_file)), exist_ok=True)
        
        with open(output_file, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerows(data)
        
        print(f"Data saved to {output_file}")
    except Exception as e:
        print(f"Error saving to CSV: {e}")
        raise


def process_prompts_and_extract_csv(yaml_file_path: str, output_file: str = "extracted_data.csv") -> None:
    """
    Process all prompts in a YAML file, send them to Gemini API,
    extract CSV data from responses, and save to a CSV file.

    Parameters:
    - yaml_file_path: Path to the YAML file with prompts
    - output_file: Path to the output CSV file
    """
    try:
        config = load_prompts_from_yaml(yaml_file_path)
        
        # Get API key from config or environment
        api_key = config.get('api_key')
        if not api_key:
            api_key = os.environ.get('GEMINI_API_KEY')
            if not api_key:
                raise ValueError("API key must be provided in YAML file or as GEMINI_API_KEY environment variable")
        
        model = config['model']
        all_csv_data = []
        
        for prompt_info in config['prompts']:
            prompt_name = prompt_info['name']
            prompt_text = prompt_info['text']
            
            print(f"Processing prompt: {prompt_name}")
            
            try:
                # Send prompt to Gemini API
                response_text = send_prompt_to_gemini(prompt_text, model, api_key)
                
                # Extract CSV data from response
                csv_data = extract_csv_data(response_text)
                
                if csv_data:
                    if not all_csv_data:
                        # First set of data - include headers
                        all_csv_data = csv_data
                    else:
                        # Skip header row for subsequent data sets
                        all_csv_data.extend(csv_data[1:])
                    
                    print(f"Extracted {len(csv_data)} rows from prompt '{prompt_name}'")
                else:
                    print(f"No CSV data found in response to prompt '{prompt_name}'")
            
            except Exception as e:
                print(f"Error processing prompt '{prompt_name}': {e}")
                continue
        
        if all_csv_data:
            save_to_csv(all_csv_data, output_file)
            print(f"Saved {len(all_csv_data)} total rows to {output_file}")
        else:
            print("No CSV data found in any responses. No output file created.")
    
    except Exception as e:
        print(f"Error processing prompts: {e}")
        sys.exit(1)


def main():
    """Parse command line arguments and execute the CSV extraction process."""
    parser = argparse.ArgumentParser(description="Process YAML prompts, extract CSV data from LLM responses, and save to CSV")
    parser.add_argument("yaml_file", help="Path to YAML file with prompt configurations")
    parser.add_argument("--output", "-o", default="extracted_data.csv", help="Output CSV file path (default: extracted_data.csv)")
    
    args = parser.parse_args()
    
    process_prompts_and_extract_csv(args.yaml_file, args.output)


if __name__ == "__main__":
    main()
