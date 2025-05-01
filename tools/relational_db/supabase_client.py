import os
import mimetypes
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
db_client: Client = create_client(url, key)

def get_all_countries():
  data = db_client.table("countries").select("*").execute()
  # data = db_client.table("countries").select("*").eq("name", "IL").execute()

  # Assert we pulled real data.
  print(data)
  assert len(data.data) > 0

  return data.data

def upload_file(file_path: str, file_name: str, bucket_name: str, mime_type: str):
  with open(file_path, "rb") as f:
    file_options = {
      "content-type": mime_type
    }
    response = db_client.storage.from_(bucket_name).upload(file_name, f, file_options)
    print(response)
    # UploadResponse(path='squat jumps.mp4', full_path='video/squat jumps.mp4', fullPath='video/squat jumps.mp4')
    # https://cqyxglfnwcdaswovbosz.supabase.co/storage/v1/object/public/video//squat%20jumps.mp4
    return response

def get_public_url(file_name: str, bucket_name: str):
  response = db_client.storage.from_(bucket_name).get_public_url(file_name)
  print(response)
  return response

def insert_media(mime_type: str, storage_path: str, url: str):
  query = db_client.table("media").insert({
    "mime_type": mime_type,
    "storage_path": storage_path,
    "url": url
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
    file_path = os.path.join(directory_path, filename)
    if os.path.isfile(file_path):
      try:
        # Detect MIME type
        mime_type, _ = mimetypes.guess_type(file_path)
        if mime_type is None:
          mime_type = 'application/octet-stream'  # Default MIME type if detection fails
        
        response = upload_file(file_path, filename, bucket_name, mime_type)
        print(f"Successfully uploaded {filename} (MIME type: {mime_type})")

        public_url = get_public_url(filename, bucket_name)
        print(f"Successfully got public URL for {filename}")

        insert_media(mime_type, response.path, public_url)
        print(f"Successfully inserted media for {filename}")
      except Exception as e:
        print(f"Failed to upload {filename}: {str(e)}")

def main():
  # countries = get_all_countries()
  # for country in countries:
  #   print(country)

  # files = [
  #   ()
  # ]
  # upload_file("test.txt", "test.txt")
  directory_path = "video/upload"
  bucket_name = "video"
  upload_directory(directory_path, bucket_name)

if __name__ == "__main__":
  main()
