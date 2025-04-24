import os
import yaml
# from pytube import YouTube
from pytubefix import YouTube
from moviepy import VideoFileClip, TextClip, CompositeVideoClip

# https://pypi.org/project/moviepy/
# https://pytubefix.readthedocs.io/en/latest/user/quickstart.html

def youtube_to_gif(youtube_url, output_filename="output.gif", start_time=0, end_time=None,
                   resize_factor=0.5, fps=15):
    """
    Convert a YouTube video to a GIF

    Parameters:
    - youtube_url: URL of the YouTube video
    - output_filename: Filename for the output GIF
    - start_time: Start time in seconds for the GIF
    - end_time: End time in seconds for the GIF (None means end of video)
    - resize_factor: Resize factor for the GIF (0.5 means half the original size)
    - fps: Frames per second for the GIF

    Returns:
    - Path to the generated GIF
    """
    video_path = download_video(youtube_url)
    return video_to_gif(video_path, output_filename, start_time, end_time, resize_factor, fps)


def download_video(youtube_url):
    """
    Download a YouTube video.

    Parameters:
    - youtube_url: URL of the YouTube video

    Returns:
    - Path to the downloaded video file
    """
    # Create a temporary directory for the video
    temp_dir = "temp_video"
    os.makedirs(temp_dir, exist_ok=True)

    print(f"Downloading video from {youtube_url}...")

    # Download the video
    yt = YouTube(youtube_url)

    # For YouTube Shorts, filter for the highest resolution but smaller file size
    video = yt.streams.filter(progressive=True, file_extension='mp4').order_by('resolution').desc().first()
    video_path = video.download(output_path=temp_dir, filename="temp_video.mp4")

    print(f"Video downloaded to {video_path}")
    return video_path


def load_clips_from_yaml(yaml_file_path):
    """
    Load clip information from a YAML file.
    
    Expected YAML format:
    ```yaml
    youtube_url: "https://www.youtube.com/watch?v=XXXXXXXXXXX"
    output_dir: "output_directory"  # Optional, defaults to current directory
    clips:
      - name: "clip_name_1"
        start_time: 10
        end_time: 20
        resize_factor: 0.5  # Optional
        fps: 15  # Optional
      - name: "clip_name_2"
        start_time: 30
        end_time: 40
        # Can omit optional parameters
    ```
    
    Parameters:
    - yaml_file_path: Path to the YAML file
    
    Returns:
    - Dictionary containing youtube_url, output_dir, and clips information
    """
    try:
        with open(yaml_file_path, 'r') as yaml_file:
            config = yaml.safe_load(yaml_file)
            
        required_fields = ['youtube_url', 'clips']
        for field in required_fields:
            if field not in config:
                raise ValueError(f"Missing required field '{field}' in YAML file")
                
        if not isinstance(config['clips'], list) or len(config['clips']) == 0:
            raise ValueError("'clips' field must be a non-empty list")
            
        for i, clip in enumerate(config['clips']):
            if 'name' not in clip:
                raise ValueError(f"Clip at index {i} is missing required 'name' field")
            if 'start_time' not in clip:
                raise ValueError(f"Clip '{clip.get('name', f'at index {i}')}' is missing required 'start_time' field")
                
        # Set default output directory if not specified
        if 'output_dir' not in config:
            config['output_dir'] = '.'
            
        return config
    except Exception as e:
        print(f"Error loading YAML file: {e}")
        raise


def process_clips_from_yaml(yaml_file_path, output_format='mp4'):
    """
    Process all clips specified in a YAML file.
    
    Parameters:
    - yaml_file_path: Path to the YAML file
    - output_format: 'mp4' for video clips, 'gif' for GIFs
    
    Returns:
    - List of paths to the generated clips
    """
    config = load_clips_from_yaml(yaml_file_path)
    youtube_url = config['youtube_url']
    output_dir = config['output_dir']
    
    # Make sure output directory exists
    os.makedirs(output_dir, exist_ok=True)
    
    # Download the video
    video_path = download_video(youtube_url)
    
    output_files = []
    
    for clip in config['clips']:
        name = clip['name']
        start_time = clip['start_time']
        end_time = clip.get('end_time', None)
        
        # Clean up the name to be filename-friendly
        safe_name = name.replace('/', '').replace('\\', '').replace(':', '-').replace(' ', '_')
        
        if output_format.lower() == 'gif':
            # Extract GIF-specific parameters
            resize_factor = clip.get('resize_factor', 0.5)
            fps = clip.get('fps', 15)
            
            # Create the GIF
            output_filename = os.path.join(output_dir, f"{safe_name}.gif")
            video_to_gif(
                video_path, 
                output_filename, 
                start_time, 
                end_time, 
                resize_factor=resize_factor, 
                fps=fps
            )
            output_files.append(output_filename)
        else:  # mp4
            # Create the video clip
            output_filename = os.path.join(output_dir, safe_name)
            clipped_path = clip_video(video_path, start_time, end_time, output_filename)
            output_files.append(clipped_path)
    
    print(f"Processed {len(output_files)} clips from {yaml_file_path}")
    return output_files


def clip_video(video_path, start_time, end_time, clipped_video_path="clipped_video"):
    """
    Clip the video to the specified start and end times.

    Parameters:
    - video_path: Path to the video file
    - start_time: Start time in seconds for the clip
    - end_time: End time in seconds for the clip (None means end of video)

    Returns:
    - Path to the clipped video
    """
    print(f"Clipping video from {start_time} to {end_time}...")

    # Load the video file
    video_clip = VideoFileClip(video_path)

    # Trim the video if start or end times are specified
    if end_time:
        video_clip = video_clip.subclipped(start_time, end_time)
    elif start_time > 0:
        video_clip = video_clip.subclipped(start_time)

    # Save the clipped video
    clipped_video_path = os.path.join(os.path.dirname(video_path), f"{clipped_video_path}.mp4")
    video_clip.write_videofile(clipped_video_path, codec="libx264")

    # Close the video clip to release resources
    video_clip.close()

    return clipped_video_path


def video_to_gif(video_path, output_filename, start_time, end_time, resize_factor, fps):
    """
    Convert a video file to a GIF.

    Parameters:
    - video_path: Path to the video file
    - output_filename: Filename for the output GIF
    - start_time: Start time in seconds for the GIF
    - end_time: End time in seconds for the GIF (None means end of video)
    - resize_factor: Resize factor for the GIF (0.5 means half the original size)
    - fps: Frames per second for the GIF

    Returns:
    - Path to the generated GIF
    """
    print(f"Converting to GIF... {video_path} -> {output_filename} from {start_time} to {end_time} at {fps} fps and resize {resize_factor}")

    # Convert video to GIF
    video_clip = VideoFileClip(video_path)

    # Trim the video if start or end times are specified
    if end_time:
        video_clip = video_clip.subclipped(start_time, end_time)
    elif start_time > 0:
        video_clip = video_clip.subclipped(start_time)

    # Resize the video
    if resize_factor != 1:
        video_clip = video_clip.resize(resize_factor)

    # Create the GIF
    video_clip.write_gif(output_filename, fps=fps)

    # Close the video clip to release resources
    video_clip.close()

    print(f"GIF created at {output_filename}")
    return output_filename


def cli():
    import argparse

    parser = argparse.ArgumentParser(description="Convert YouTube video to clips or GIFs")
    
    # Create subparsers for different commands
    subparsers = parser.add_subparsers(dest="command", help="Command to execute")
    
    # Single clip/GIF command
    single_parser = subparsers.add_parser("single", help="Process a single clip")
    single_parser.add_argument("youtube_url", help="YouTube video URL")
    single_parser.add_argument("--output", default="output.gif", help="Output filename")
    single_parser.add_argument("--start", type=float, default=0, help="Start time in seconds")
    single_parser.add_argument("--end", type=float, help="End time in seconds")
    single_parser.add_argument("--resize", type=float, default=0.5, help="Resize factor")
    single_parser.add_argument("--fps", type=int, default=15, help="Frames per second for the GIF")
    single_parser.add_argument("--format", choices=["gif", "mp4"], default="gif", 
                              help="Output format: gif or mp4")
    
    # YAML-based batch processing command
    yaml_parser = subparsers.add_parser("yaml", help="Process clips from a YAML file")
    yaml_parser.add_argument("yaml_file", help="Path to YAML file with clip configurations")
    yaml_parser.add_argument("--format", choices=["gif", "mp4"], default="gif", 
                            help="Output format: gif or mp4")

    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        return
    
    if args.command == "single":
        if args.format.lower() == "gif":
            youtube_to_gif(
                args.youtube_url,
                output_filename=args.output,
                start_time=args.start,
                end_time=args.end,
                resize_factor=args.resize,
                fps=args.fps
            )
        else:  # mp4
            video_path = download_video(args.youtube_url)
            clip_video(video_path, args.start, args.end, os.path.splitext(args.output)[0])
    
    elif args.command == "yaml":
        process_clips_from_yaml(args.yaml_file, output_format=args.format)


def user_prompt():
    """
    Interactive command-line interface to download and convert YouTube videos.
    """
    print("YouTube to GIF/Video Clip Converter")
    print("==================================")
    print("1. Convert a single clip")
    print("2. Process clips from a YAML file")
    
    choice = input("Enter your choice (1/2): ")
    
    if choice == "1":
        youtube_url = input("Enter YouTube URL: ")
        output_format = input("Enter output format (gif/mp4, default: gif): ").lower() or "gif"
        output_filename = input(f"Enter output filename (default: output.{output_format}): ") or f"output.{output_format}"
        
        # Optional parameters
        start_time = input("Enter start time in seconds (default: 0): ")
        start_time = float(start_time) if start_time else 0
        
        end_time = input("Enter end time in seconds (default: end of video): ")
        end_time = float(end_time) if end_time else None
        
        if output_format == "gif":
            resize_factor = input("Enter resize factor (default: 0.5): ")
            resize_factor = float(resize_factor) if resize_factor else 0.5
            
            fps = input("Enter frames per second for the GIF (default: 15): ")
            fps = int(fps) if fps else 15
            
            youtube_to_gif(
                youtube_url,
                output_filename=output_filename,
                start_time=start_time,
                end_time=end_time,
                resize_factor=resize_factor,
                fps=fps
            )
        else:  # mp4
            video_path = download_video(youtube_url)
            clip_video(video_path, start_time, end_time, os.path.splitext(output_filename)[0])
    
    elif choice == "2":
        yaml_file = input("Enter path to YAML file: ")
        output_format = input("Enter output format (gif/mp4, default: gif): ").lower() or "gif"
        process_clips_from_yaml(yaml_file, output_format=output_format)
    
    else:
        print("Invalid choice!")


# Example usage
if __name__ == "__main__":
    # Uncomment one of these to run:
    cli()
    # user_prompt()
    
    # Example YAML file format:
    """
    youtube_url: "https://www.youtube.com/watch?v=XXXXXXXXXXX"
    output_dir: "clips"
    clips:
      - name: "exercise_1"
        start_time: 10
        end_time: 20
        resize_factor: 0.5  # Optional, for GIFs
        fps: 15  # Optional, for GIFs
      - name: "exercise_2"
        start_time: 30
        end_time: 40
    """
