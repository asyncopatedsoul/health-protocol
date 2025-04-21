import os
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
    video_to_gif(video_path, output_filename, start_time, end_time, resize_factor, fps)


def download_video(youtube_url):
    
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
    
    # Remove the temporary video file
    os.remove(video_path)
    
    print(f"GIF created at {output_filename}")
    return output_filename

def cli():
    import argparse
    
    parser = argparse.ArgumentParser(description="Convert YouTube Shorts to GIF")
    parser.add_argument("youtube_url", help="YouTube Shorts URL")
    parser.add_argument("--output", default="output.gif", help="Output GIF filename")
    parser.add_argument("--start", type=float, default=0, help="Start time in seconds")
    parser.add_argument("--end", type=float, help="End time in seconds")
    parser.add_argument("--resize", type=float, default=1, help="Resize factor")
    parser.add_argument("--fps", type=int, default=15, help="Frames per second for the GIF")
    
    args = parser.parse_args()
    
    youtube_to_gif(
        args.youtube_url,
        output_filename=args.output,
        start_time=args.start,
        end_time=args.end,
        resize_factor=args.resize,
        fps=args.fps
    )

def user_prompt():
    youtube_url = input("Enter YouTube Short URL: ")
    output_filename = input("Enter output GIF filename (default: output.gif): ") or "output.gif"
    
    # Optional parameters
    start_time = input("Enter start time in seconds (default: 0): ")
    start_time = float(start_time) if start_time else 0
    
    end_time = input("Enter end time in seconds (default: end of video): ")
    end_time = float(end_time) if end_time else None
    
    resize_factor = input("Enter resize factor (default: 1): ")
    resize_factor = float(resize_factor) if resize_factor else 1
    
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

# Example usage
if __name__ == "__main__":
    # cli()
    # user_prompt()
    # https://www.youtube.com/shorts/_P63NrBN49U
    # video_to_gif('/Users/michael.garrido/Documents/GitHub/health-protocol/tools/temp_video/temp_video.mp4', 'clip.gif',0,7,1,30)
    
    # clip_video('/Users/michael.garrido/Documents/GitHub/health-protocol/tools/temp_video/temp_video.mp4', 2, 7)
    
    video_path = '/Users/michael.garrido/Documents/GitHub/health-protocol/tools/temp_video/temp_video.mp4'
    # Senada get up 8 x 4
    # Squat jumps 12 x 4
    # Hollow body flutter kicks 12 x 4
    # Dynamic lateral Lunge to reverse Lunge 12 x 4
    # Lateral bear walks 8 x 4
    # Kneeling step up 12 x 4
    # Push-ups w/ alt leg raise 12 x 4
    clips = [
        # [3, 7, 'senada get up'],
        # [9, 11, 'squat jumps'],
        # [12, 14, 'hollow body flutter kicks'],
        # [15, 18, 'dynamic lateral lunge to reverse lunge'],
        # [20, 24, 'lateral bear walks'],
        # [25, 29, 'kneeling step up'],
        [30, None, 'push-ups w/ alt leg raise'],
    ]
    
    for clip in clips:
        start_time, end_time, name = clip
        # output_filename = f"{name}.gif"
        # video_to_gif(video_path, output_filename, start_time, end_time, resize_factor=0.5, fps=15)
        name = name.replace('/', '')
        # .replace('-', '_')
        clip_video(video_path, start_time, end_time, name)