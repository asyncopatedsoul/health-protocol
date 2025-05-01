from gqlalchemy import Memgraph, Node, Relationship, Field
from typing import Optional

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


def audit_database():
    """
    Audit the Memgraph database by retrieving and displaying all nodes of each Node class.
    """
    print("\n=== Memgraph Database Audit ===\n")

    # Audit MediaType nodes
    print("MediaType Nodes:")
    print("-" * 50)
    try:
        # Use direct Cypher query to get MediaType nodes
        media_type_query = """
        MATCH (mt:MediaType)
        RETURN mt.name as name, mt.formats as formats
        """
        media_types = db.execute_and_fetch(media_type_query)

        for mt in media_types:
            try:
                print(f"Name: {mt['name']}")
                print(f"Formats: {mt['formats']}")
                print("-" * 30)
            except Exception as e:
                print(f"Error processing MediaType node: {str(e)}")
                print(f"Raw node data: {mt}")
                print("-" * 30)
    except Exception as e:
        print(f"Error retrieving MediaType nodes: {str(e)}")

    # Audit Guide nodes
    print("\nGuide Nodes:")
    print("-" * 50)
    try:
        # Use direct Cypher query to get Guide nodes
        guide_query = """
        MATCH (g:Guide)
        RETURN g.url as url, g.title as title, g.uploadedAt as uploadedAt,
               g.format as format, g.fileSize as fileSize, g.duration as duration,
               g.content as content
        """
        guides = db.execute_and_fetch(guide_query)

        for guide in guides:
            try:
                print(f"Title: {guide['title']}")
                print(f"URL: {guide['url']}")
                print(f"Format: {guide['format']}")
                print(f"Duration: {guide['duration']}")
                print(f"File Size: {guide['fileSize']}")
                print(f"Uploaded At: {guide['uploadedAt']}")
                print(f"Content: {guide['content']}")
                print("-" * 30)
            except Exception as e:
                print(f"Error processing Guide node: {str(e)}")
                print(f"Raw node data: {guide}")
                print("-" * 30)
    except Exception as e:
        print(f"Error retrieving Guide nodes: {str(e)}")

    # Audit Activity nodes
    print("\nActivity Nodes:")
    print("-" * 50)
    try:
        # Use direct Cypher query to get Activity nodes
        activity_query = """
        MATCH (a:Activity)
        RETURN a.name as name, a.description as description, a.duration as duration,
               a.difficulty as difficulty, a.energyExpenditure as energyExpenditure
        """
        activities = db.execute_and_fetch(activity_query)

        for activity in activities:
            try:
                print(f"Name: {activity['name']}")
                print(f"Description: {activity['description']}")
                print(f"Duration: {activity['duration']}")
                print(f"Difficulty: {activity['difficulty']}")
                print(f"Energy Expenditure: {activity['energyExpenditure']}")
                print("-" * 30)
            except Exception as e:
                print(f"Error processing Activity node: {str(e)}")
                print(f"Raw node data: {activity}")
                print("-" * 30)
    except Exception as e:
        print(f"Error retrieving Activity nodes: {str(e)}")

    # Audit relationships
    print("\nRelationships:")
    print("-" * 50)
    try:
        # Count HAS_GUIDE relationships
        has_guide_query = """
        MATCH ()-[r:HAS_GUIDE]->()
        RETURN count(r) as count
        """
        has_guide_result = db.execute_and_fetch(has_guide_query)
        has_guide_count = next(has_guide_result)["count"]
        print(f"Total HAS_GUIDE relationships: {has_guide_count}")

        # Count OF_TYPE relationships
        of_type_query = """
        MATCH ()-[r:OF_TYPE]->()
        RETURN count(r) as count
        """
        of_type_result = db.execute_and_fetch(of_type_query)
        of_type_count = next(of_type_result)["count"]
        print(f"Total OF_TYPE relationships: {of_type_count}")

        # Show relationship details
        print("\nRelationship Details:")
        print("-" * 30)

        # HAS_GUIDE relationships
        has_guide_details = """
        MATCH (a:Activity)-[r:HAS_GUIDE]->(g:Guide)
        RETURN a.name as activity_name, g.title as guide_title
        """
        has_guide_details_result = db.execute_and_fetch(has_guide_details)
        print("HAS_GUIDE Relationships:")
        for row in has_guide_details_result:
            print(f"  {row['activity_name']} -> {row['guide_title']}")

        # OF_TYPE relationships
        of_type_details = """
        MATCH (g:Guide)-[r:OF_TYPE]->(mt:MediaType)
        RETURN g.title as guide_title, mt.name as media_type
        """
        of_type_details_result = db.execute_and_fetch(of_type_details)
        print("\nOF_TYPE Relationships:")
        for row in of_type_details_result:
            print(f"  {row['guide_title']} -> {row['media_type']}")

    except Exception as e:
        print(f"Error retrieving relationships: {str(e)}")

    print("\n=== Audit Complete ===\n")


def main():
    """
    Main function to run the database audit.
    """
    print("Starting Memgraph database audit...")
    audit_database()


if __name__ == "__main__":
    main()
