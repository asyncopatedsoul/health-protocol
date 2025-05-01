import os
import mimetypes
from dotenv import load_dotenv
from supabase import create_client, Client
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
    return response

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
        
        upload_file(file_path, filename, bucket_name, mime_type)
        print(f"Successfully uploaded {filename} (MIME type: {mime_type})")
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
