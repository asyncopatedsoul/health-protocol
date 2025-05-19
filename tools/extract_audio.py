import os
from moviepy.editor import VideoFileClip
import argparse
import csv


def extract_audio(video_path, output_audio_path=None, audio_format="mp3"):
    """
    Extract the audio track from a video file and save it as an audio file.

    Parameters:
    - video_path: Path to the input video file
    - output_audio_path: Path to save the extracted audio file (optional)
    - audio_format: Audio format to save (default: 'mp3')

    Returns:
    - Path to the saved audio file
    """
    if not os.path.isfile(video_path):
        raise FileNotFoundError(f"Video file not found: {video_path}")

    if output_audio_path is None:
        base, _ = os.path.splitext(video_path)
        output_audio_path = f"{base}.{audio_format}"
    else:
        # Ensure the output path has the correct extension
        if not output_audio_path.endswith(f".{audio_format}"):
            output_audio_path += f".{audio_format}"

    print(f"Extracting audio from {video_path} to {output_audio_path}...")
    video = VideoFileClip(video_path)
    audio = video.audio
    if audio is None:
        raise ValueError("No audio track found in the video.")
    audio.write_audiofile(output_audio_path)
    audio.close()
    video.close()
    print(f"Audio saved to {output_audio_path}")
    return output_audio_path


def batch_extract_audio(csv_path, video_dir="tools/temp_video"):
    """
    Batch process audio extraction from a CSV file.
    The CSV should have columns: video_filename, output_audio_path (optional), audio_format (optional)
    All video files are assumed to be in video_dir.
    """
    results = []
    with open(csv_path, newline='') as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader:
            video_filename = row.get('video_filename')
            if not video_filename:
                print("Skipping row with missing video_filename.")
                continue
            video_path = os.path.join(video_dir, video_filename)
            output_audio_path = row.get('output_audio_path') or None
            audio_format = row.get('audio_format') or "mp3"
            try:
                result = extract_audio(video_path, output_audio_path, audio_format)
                results.append(result)
            except Exception as e:
                print(f"Failed to extract audio for {video_filename}: {e}")
    return results


def cli():
    parser = argparse.ArgumentParser(description="Extract audio from a video file.")
    subparsers = parser.add_subparsers(dest="command", help="Command to execute")

    # Single file mode
    single_parser = subparsers.add_parser("single", help="Extract audio from a single video file")
    single_parser.add_argument("video_path", help="Path to the input video file")
    single_parser.add_argument("--output", help="Path to save the extracted audio file (optional)")
    single_parser.add_argument("--format", default="mp3", choices=["mp3", "wav", "ogg"], help="Audio format (default: mp3)")

    # Batch mode
    batch_parser = subparsers.add_parser("batch", help="Batch extract audio from a CSV file")
    batch_parser.add_argument("csv_path", help="Path to the CSV file with extraction parameters")
    batch_parser.add_argument("--video_dir", default="tools/temp_video", help="Directory containing video files (default: tools/temp_video)")

    args = parser.parse_args()

    if args.command == "single":
        extract_audio(args.video_path, args.output, args.format)
    elif args.command == "batch":
        batch_extract_audio(args.csv_path, args.video_dir)
    else:
        parser.print_help()


if __name__ == "__main__":
    cli() 