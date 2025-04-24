# LLM CSV Extractor

This tool extracts CSV data from LLM (Large Language Model) responses. It sends prompts to the Google Gemini API, extracts any CSV data from the responses, and saves it to a single CSV file.

## Features

- Define prompts in a YAML configuration file
- Send prompts to Google Gemini LLM
- Extract CSV data from LLM responses
- Combine and save extracted data to a single CSV file
- Support for different Gemini models

## Requirements

- Python 3.6+
- Required packages: 
  - pyyaml
  - requests

## Installation

1. Ensure you have the required packages installed:

```bash
pip install pyyaml requests
```

2. Set your Gemini API key as an environment variable (alternatively, include it in the YAML file):

```bash
export GEMINI_API_KEY="your_api_key_here"
```

## Usage

1. Create a YAML file with your prompts (see `example_prompts.yaml` for a template)
2. Run the script:

```bash
python llm_csv_extractor.py your_prompts.yaml --output output_data.csv
```

## YAML Configuration Format

Your YAML file should follow this format:

```yaml
# Optional, can be provided via environment variable GEMINI_API_KEY
api_key: "YOUR_GEMINI_API_KEY"

# Optional, defaults to gemini-2.0-flash
model: "gemini-2.0-flash"

prompts:
  - name: "prompt_name_1"
    text: "Generate a CSV of daily exercise routines"
  - name: "prompt_name_2"
    text: "Generate a CSV of meditation exercises"
```

## Example Usage

1. Using the provided example YAML:

```bash
python llm_csv_extractor.py example_prompts.yaml
```

2. Specifying a custom output file:

```bash
python llm_csv_extractor.py example_prompts.yaml --output exercise_data.csv
```

## Tips for Effective CSV Extraction

1. Be explicit in your prompts that you want CSV data with a specific format and columns
2. Specify that the CSV should use standard comma delimiters
3. Consider adding examples in your prompt for the desired format
4. If your extracted data has inconsistent headers, ensure the first prompt's structure is the one you want to keep

## Troubleshooting

- **No API key**: Set the GEMINI_API_KEY environment variable or include it in your YAML file
- **No CSV data extracted**: Make your prompts more explicit about generating CSV-formatted data
- **Inconsistent data**: Enhance your prompts to be more specific about structure and formatting

## License

This project is part of the health-protocol application and follows its licensing terms.
