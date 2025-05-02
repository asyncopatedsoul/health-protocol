from typing import Optional, List
from supabase import Client, create_client
from gqlalchemy import Memgraph, Node, Relationship, Field, match, create
import json
import os
from dotenv import load_dotenv
from relational_db.supabase_client import upload_directory

# Load environment variables
load_dotenv()

# Initialize Supabase client
supabase_url: str = os.environ.get("SUPABASE_URL")
supabase_key: str = os.environ.get("SUPABASE_KEY")
supabase_client: Client = create_client(supabase_url, supabase_key)

# Initialize Memgraph client
db = Memgraph()


class MediaType(Node):
    name: str = Field(unique=True, db=db)
    # formats: list[str] = Field(db=db)
    formats: Optional[list[str]] = Field(exists=True, db=db)


class Guide(Node):
    url: str = Field(unique=True, db=db)
    name: str = Field(unique=True, db=db)
    title: str = Field(db=db)
    uploadedAt: str = Field(db=db)
    format: str = Field(db=db)
    fileSize: Optional[int] = Field(db=db)
    duration: Optional[int] = Field(db=db)
    content: str = Field(db=db)


class Activity(Node):
    name: str = Field(unique=True, db=db)
    description: str = Field(db=db)
    duration: int = Field(db=db)
    difficulty: str = Field(db=db)
    energyExpenditure: Optional[str] = Field(db=db)


class HasGuide(Relationship, type="HAS_GUIDE"):
    pass


class OfType(Relationship, type="OF_TYPE"):
    pass


def get_media_by_id(supabase_client: Client, media_id: int) -> Optional[dict]:
    """
    Retrieve a media record from Supabase by ID.

    Args:
        supabase_client: Supabase client instance
        media_id: ID of the media record to retrieve

    Returns:
        dict: Media record if found, None otherwise
    """
    try:
        response = supabase_client.table("media").select(
            "*").eq("id", media_id).execute()
        if response.data and len(response.data) > 0:
            return response.data[0]
        return None
    except Exception as e:
        print(f"Error retrieving media record: {str(e)}")
        return None


def create_guide_from_media(media_record: dict, activity_name: str) -> bool:
    """
    Create Guide and MediaType nodes in Memgraph from Supabase media record and link to Activity.

    Args:
        media_record: Media record from Supabase
        activity_name: Name of the Activity to link the guide to

    Returns:
        bool: True if successful, False otherwise
    """
    print(
        f"Creating guide from media record: {media_record} and activity name: {activity_name}")
    try:
        # Parse metadata from JSON string
        metadata = json.loads(media_record.get("metadata", "{}"))
        print(f"Metadata: {metadata}")
        # Get Activity using direct query
        activity_query = f"""
        MATCH (a:Activity)
        WHERE a.name = '{activity_name}'
        RETURN a.name as name, id(a) as id
        """
        print(f"Activity Query: {activity_query}")
        activity_result = db.execute_and_fetch(
            activity_query)
        try:
            activity_data = next(activity_result)
            activity_id = activity_data["id"]
        except StopIteration:
            print(f"Activity {activity_name} not found")
            return False
        print(f"Activity ID: {activity_id}")
        # Create or load MediaType
        media_type_name = media_record.get("mime_type", "").split("/")[0]
        print(f"Media Type Name: {media_type_name}")
        media_type = MediaType(name=media_type_name).load(db)
        media_type_id = media_type._id
        # try:
        #     media_type = MediaType(name=media_type_name).load(db)
        #     media_type_id = media_type._id
        # except:
        #     media_type = MediaType(
        #         name=media_type_name,
        #         formats=[media_record.get("mime_type", "").split("/")[-1]]
        #     ).save(db)
        #     media_type_id = media_type._id
        print(f"Media Type ID: {media_type_id}")
        # Create or load Guide

        guide_name = media_record.get("storage_path").split(".")[0]
        try:
            print(f"try updating existing Guide: {guide_name}")
            guide = Guide(url=media_record["url"]).load(db)
            # Update guide properties
            guide.name = guide_name
            guide.title = guide_name
            guide.uploadedAt = media_record.get("created_at", "")
            guide.format = media_record.get("mime_type", "").split("/")[-1]
            guide.fileSize = metadata.get("filesize")
            guide.duration = metadata.get("duration")
            guide.content = media_record.get("description", "")
            guide.save(db)
            guide_id = guide._id
        except:
            print(f"try creating new Guide: {guide_name}")
            guide = Guide(
                url=media_record["url"],
                name=guide_name,
                title=guide_name,
                uploadedAt=media_record.get("created_at", ""),
                format=media_record.get("mime_type", "").split("/")[-1],
                fileSize=metadata.get("filesize"),
                duration=metadata.get("duration"),
                content=media_record.get("description", "")
            ).save(db)
            guide_id = guide._id
        print(f"Guide ID: {guide_id}")
        # Verify we have all required IDs
        if not all([activity_id, media_type_id, guide_id]):
            print("Missing required node IDs")
            return False

        # Create relationships using direct queries
        try:
            # Check if OF_TYPE relationship exists
            of_type_check = """
            MATCH (g:Guide)-[r:OF_TYPE]->(mt:MediaType)
            WHERE id(g) = $guide_id AND id(mt) = $media_type_id
            RETURN count(r) as count
            """
            result = db.execute_and_fetch(of_type_check, {
                "guide_id": guide_id,
                "media_type_id": media_type_id
            })
            result = next(result)
            print(f"OF_TYPE check result: {result}")
            if result["count"] == 0:
                print(
                    f"Creating OF_TYPE relationship for {guide_name} and {media_type_name}")
                # Create OF_TYPE relationship
                # of_type_create = """
                # MATCH (g:Guide), (mt:MediaType)
                # WHERE id(g) = $guide_id AND id(mt) = $media_type_id
                # CREATE (g)-[:OF_TYPE]->(mt)
                # """
                # db.execute_and_fetch(of_type_create, {
                #     "guide_id": guide_id,
                #     "media_type_id": media_type_id
                # })
                query = (
                    match()
                    .node(labels="Guide", name=guide_name, variable="g")
                    .match()
                    .node(labels="MediaType", name=media_type_name, variable="mt")
                    .create()
                    .node(variable="g")
                    .to(relationship_type="OF_TYPE")
                    .node(variable="mt")
                    .execute()
                )
                print(f"OF_TYPE create result: {query}")
            # Check if HAS_GUIDE relationship exists
            has_guide_check = """
            MATCH (a:Activity)-[r:HAS_GUIDE]->(g:Guide)
            WHERE id(a) = $activity_id AND id(g) = $guide_id
            RETURN count(r) as count
            """
            result = db.execute_and_fetch(has_guide_check, {
                "activity_id": activity_id,
                "guide_id": guide_id
            })
            result = next(result)
            print(f"HAS_GUIDE check result: {result}")
            if result["count"] == 0:
                print(
                    f"Creating HAS_GUIDE relationship for {activity_name} and {guide_name}")
                # match().node(labels="User", id=0, variable="u").match().node(labels="Movie", id=0, variable="m").create().node(variable="u").to(edge_label="RATED", rating=5.0).node(variable="m").execute()
                # Create HAS_GUIDE relationship
                # has_guide_create = """
                # MATCH (a:Activity), (g:Guide)
                # WHERE id(a) = $activity_id AND id(g) = $guide_id
                # CREATE (a)-[:HAS_GUIDE]->(g)
                # """
                # result = db.execute_and_fetch(has_guide_create, {
                #     "activity_id": activity_id,
                #     "guide_id": guide_id
                # })
                # print(f"HAS_GUIDE create result: {next(result)}")
                query = (
                    match()
                    .node(labels="Activity", name=activity_name, variable="a")
                    .match()
                    .node(labels="Guide", name=guide_name, variable="g")
                    .create()
                    .node(variable="a")
                    .to(relationship_type="HAS_GUIDE")
                    .node(variable="g")
                    .execute()
                )
                print(f"HAS_GUIDE create result: {query}")

        except Exception as e:
            print(f"Error creating relationships: {str(e)}")
            return False

        return True
    except Exception as e:
        print(f"Error creating guide from media: {str(e)}")
        return False


def sync_media_to_guide(supabase_client: Client, media_id: int, activity_name: str) -> bool:
    """
    Sync a media record from Supabase to Memgraph as a Guide.

    Args:
        supabase_client: Supabase client instance
        media_id: ID of the media record in Supabase
        activity_name: Name of the Activity to link the guide to

    Returns:
        bool: True if successful, False otherwise
    """
    # Get media record from Supabase
    media_record = get_media_by_id(supabase_client, media_id)
    if not media_record:
        print(f"Media record with ID {media_id} not found")
        return False

    # Create guide in Memgraph
    return create_guide_from_media(media_record, activity_name)


def audit_database():
    """
    Audit the database by retrieving all nodes of each Node class.
    """
    # List of all Node classes
    node_classes = [Guide, Activity, MediaType]

    for node_class in node_classes:
        print(f"\nAuditing {node_class.__name__} nodes:")
        try:
            # Get all nodes of this class
            nodes = node_class.load_all(db)
            for node in nodes:
                print(f"  - {node}")
        except Exception as e:
            print(f"  Error retrieving {node_class.__name__} nodes: {str(e)}")


def upload_activity_from_media(media_record: dict):
    """
    Upload an activity from a media record.
    """
    # Extract filename without extension for activity name
    filename = os.path.basename(media_record["storage_path"])
    activity_name = os.path.splitext(filename)[0]

    metadata = json.loads(media_record.get("metadata", "{}"))
    duration = metadata.get("duration")
    # Create Activity node if it doesn't exist
    try:
        activity = Activity(name=activity_name).load(db)
        print(f"Activity '{activity_name}' already exists")
    except:
        activity = Activity(
            name=activity_name,
            description=f"Activity for {activity_name}",
            duration=duration,
            difficulty="beginner"  # Default difficulty
        ).save(db)
        print(f"Created new Activity: {activity_name}")

    # Step 4: Sync media to guide and link to activity
    print(
        f"Syncing media {media_record['id']} to guide for activity '{activity_name}'...")
    success = sync_media_to_guide(
        supabase_client, media_record["id"], activity_name)

    if success:
        print(
            f"Successfully synced media {media_record['id']} to guide for activity '{activity_name}'")
    else:
        print(
            f"Failed to sync media {media_record['id']} to guide for activity '{activity_name}'")
    pass

# export PYTHON_PATH=/Users/artlings/Documents/GitHub/health-protocol/tools:$PYTHON_PATH


def main():
    """
    Main function demonstrating the usage of all methods.
    """
    # Directory containing files to upload
    directory_path = "video/upload"
    bucket_name = "video"

    # Step 1: Upload files to Supabase
    print(f"Uploading files from {directory_path} to Supabase...")
    upload_directory(directory_path, bucket_name)

    # Step 2: Get all media records from Supabase
    print("Retrieving media records from Supabase...")
    media_records = supabase_client.table("media").select("*").execute().data

    # Step 3: Process each media record
    for media_record in media_records:
        upload_activity_from_media(media_record)

    # Step 5: Audit the database
    # print("\nAuditing database...")
    # audit_database()


if __name__ == "__main__":
    main()
