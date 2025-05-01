from typing import Optional
from supabase import Client, create_client
from gqlalchemy import Memgraph, Node, Relationship, Field
import json
import os
from dotenv import load_dotenv

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
    formats: list[str] = Field(db=db)


class Guide(Node):
    url: str = Field(unique=True, db=db)
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
    try:
        # Parse metadata from JSON string
        metadata = json.loads(media_record.get("metadata", "{}"))

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
        try:
            media_type = MediaType(name=media_type_name).load(db)
            media_type_id = media_type._id
        except:
            media_type = MediaType(
                name=media_type_name,
                formats=[media_record.get("mime_type", "").split("/")[-1]]
            ).save(db)
            media_type_id = media_type._id
        print(f"Media Type ID: {media_type_id}")
        # Create or load Guide
        try:
            guide = Guide(url=media_record["url"]).load(db)
            # Update guide properties
            guide.title = media_record.get("title", "")
            guide.uploadedAt = media_record.get("created_at", "")
            guide.format = media_record.get("mime_type", "").split("/")[-1]
            guide.fileSize = metadata.get("filesize")
            guide.duration = metadata.get("duration")
            guide.content = media_record.get("description", "")
            guide.save(db)
            guide_id = guide._id
        except:
            guide = Guide(
                url=media_record["url"],
                title=media_record.get("title", ""),
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
            WHERE g._id = $guide_id AND mt._id = $media_type_id
            RETURN count(r) as count
            """
            result = db.execute_and_fetch(of_type_check, {
                "guide_id": guide_id,
                "media_type_id": media_type_id
            })
            if next(result)["count"] == 0:
                # Create OF_TYPE relationship
                of_type_create = """
                MATCH (g:Guide), (mt:MediaType)
                WHERE g._id = $guide_id AND mt._id = $media_type_id
                CREATE (g)-[:OF_TYPE]->(mt)
                """
                db.execute_and_fetch(of_type_create, {
                    "guide_id": guide_id,
                    "media_type_id": media_type_id
                })

            # Check if HAS_GUIDE relationship exists
            has_guide_check = """
            MATCH (a:Activity)-[r:HAS_GUIDE]->(g:Guide)
            WHERE a._id = $activity_id AND g._id = $guide_id
            RETURN count(r) as count
            """
            result = db.execute_and_fetch(has_guide_check, {
                "activity_id": activity_id,
                "guide_id": guide_id
            })
            if next(result)["count"] == 0:
                # Create HAS_GUIDE relationship
                has_guide_create = """
                MATCH (a:Activity), (g:Guide)
                WHERE a._id = $activity_id AND g._id = $guide_id
                CREATE (a)-[:HAS_GUIDE]->(g)
                """
                db.execute_and_fetch(has_guide_create, {
                    "activity_id": activity_id,
                    "guide_id": guide_id
                })

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


def main():
    """
    Main function demonstrating the usage of all methods.
    """
    # Example media ID and activity name
    media_id = 16  # Replace with actual media ID from your Supabase database
    # Replace with actual activity name from your Memgraph database
    activity_name = "dynamic lateral lunge to reverse lunge"

    print(f"Syncing media ID {media_id} to activity '{activity_name}'...")

    # Sync media to guide
    success = sync_media_to_guide(supabase_client, media_id, activity_name)

    if success:
        print("Successfully synced media to guide!")

        # Verify the created guide
        try:
            guide = Guide(url=supabase_client.table("media").select(
                "url").eq("id", media_id).execute().data[0]["url"]).load(db)
            print(f"Created/Updated Guide:")
            print(f"  Title: {guide.title}")
            print(f"  URL: {guide.url}")
            print(f"  Format: {guide.format}")
            print(f"  Duration: {guide.duration}")
            print(f"  File Size: {guide.fileSize}")

            # Get related MediaType
            media_type = MediaType(name=guide.format.split("/")[0]).load(db)
            print(f"  Media Type: {media_type.name}")

            # Get related Activity
            activity = Activity(name=activity_name).load(db)
            print(f"  Linked to Activity: {activity.name}")
        except Exception as e:
            print(f"Error verifying created guide: {str(e)}")
    else:
        print("Failed to sync media to guide.")


if __name__ == "__main__":
    main()
