import os
import mimetypes
import json
from moviepy import VideoFileClip
from dotenv import load_dotenv
from supabase import create_client, Client
import urllib.parse

# Basic URL escaping
# original_string = "Hello world! Special chars: &?=/"
# escaped_string = urllib.parse.quote(original_string)
load_dotenv()
# https://github.com/supabase/supabase-py
url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")
supabase_client: Client = create_client(url, key)


def get_all_countries():
    data = supabase_client.table("countries").select("*").execute()
    # data = supabase_client.table("countries").select("*").eq("name", "IL").execute()

    # Assert we pulled real data.
    print(data)
    assert len(data.data) > 0

    return data.data


def get_video_metadata(file_path: str) -> dict:
    """
    Get metadata for a video file including duration and filesize.

    Args:
        file_path (str): Path to the video file

    Returns:
        dict: Dictionary containing video metadata
    """
    try:
        with VideoFileClip(file_path) as video:
            duration = video.duration
    except Exception as e:
        print(f"Error getting video duration: {str(e)}")
        duration = None

    try:
        filesize = os.path.getsize(file_path)
    except Exception as e:
        print(f"Error getting file size: {str(e)}")
        filesize = None

    return {
        "duration": duration,
        "filesize": filesize
    }


def upload_file(file_path: str, file_name: str, bucket_name: str, mime_type: str):
    """
    Upload a file to Supabase storage with metadata.

    Args:
        file_path (str): Path to the file to upload
        file_name (str): Name to give the file in storage
        bucket_name (str): Name of the Supabase storage bucket
        mime_type (str): MIME type of the file
    """

    with open(file_path, "rb") as f:
        file_options = {
            "content-type": mime_type,
        }
        response = supabase_client.storage.from_(
            bucket_name).upload(file_name, f, file_options)
        print(response)
        return response


def get_public_url(file_name: str, bucket_name: str):
    response = supabase_client.storage.from_(
        bucket_name).get_public_url(file_name)
    print(response)
    url = response.split("://")
    protocol = url[0]
    [path, query] = url[1].split("?")
    return protocol+'://'+urllib.parse.quote(path)+'?'+query


def insert_media(mime_type: str, storage_path: str, url: str, metadata: dict):

    query = supabase_client.table("media").insert({
        "mime_type": mime_type,
        "storage_path": storage_path,
        "url": url,
        "metadata": json.dumps(metadata)
    }).execute()
    print(query)
    return query


def upload_directory(directory_path: str, bucket_name: str):
    """
    Upload all files from a directory to Supabase storage.

    Args:
        directory_path (str): Path to the directory containing files to upload
        bucket_name (str): Name of the Supabase storage bucket
    """
    if not os.path.isdir(directory_path):
        raise ValueError(f"Directory not found: {directory_path}")

    for filename in os.listdir(directory_path):
        # Skip .DS_Store files
        if filename == '.DS_Store':
            continue

        file_path = os.path.join(directory_path, filename)
        if os.path.isfile(file_path):
            try:
                # Detect MIME type
                mime_type, _ = mimetypes.guess_type(file_path)
                if mime_type is None:
                    mime_type = 'application/octet-stream'  # Default MIME type if detection fails

                response = upload_file(
                    file_path, filename, bucket_name, mime_type)
                print(
                    f"Successfully uploaded {filename} (MIME type: {mime_type})")
                # UploadResponse(path='lateral bear walks.mp4', full_path='video/lateral bear walks.mp4', fullPath='video/lateral bear walks.mp4')

                public_url = get_public_url(filename, bucket_name)
                print(f"Successfully got public URL for {filename}")

                # Get metadata if it's a video file
                metadata = {}
                if mime_type.startswith('video/'):
                    metadata = get_video_metadata(file_path)

                insert_media(mime_type, response.path, public_url, metadata)
                print(f"Successfully inserted media for {filename}")
            except Exception as e:
                print(f"Failed to upload {filename}: {str(e)}")


def sign_in_with_oauth():
    # scopes = ["https://www.googleapis.com/auth/userinfo.profile", "https://www.googleapis.com/auth/userinfo.email"]
    response = supabase_client.auth.sign_in_with_oauth({
        "provider": "google",
        "scopes": "email,profile",
        "redirect_to": "https://localhost:4000/oauth/google",
    }
    )
    print(response)


def main():
    # countries = get_all_countries()
    # for country in countries:
    #   print(country)

    # files = [
    #   ()
    # ]
    # upload_file("test.txt", "test.txt")
    # directory_path = "video/upload"
    # bucket_name = "video"
    # upload_directory(directory_path, bucket_name)

    sign_in_with_oauth()


if __name__ == "__main__":
    main()
