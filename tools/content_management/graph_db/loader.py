from neo4j import GraphDatabase
 
# Define correct URI and AUTH arguments (no AUTH by default)
URI = "bolt://localhost:7687"
AUTH = ("", "")

def read_cyp_file(file_path):
    """
    Reads a .cyp file and returns its contents as a string.
    
    Args:
        file_path (str): Path to the .cyp file
        
    Returns:
        str: Contents of the file as a string
        
    Raises:
        FileNotFoundError: If the file doesn't exist
        IOError: If there's an error reading the file
    """
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            return file.read()
    except FileNotFoundError:
        raise FileNotFoundError(f"The file '{file_path}' was not found.")
    except IOError as e:
        raise IOError(f"Error reading the file '{file_path}': {str(e)}")
    
with GraphDatabase.driver(URI, auth=AUTH) as client:
    # Check the connection
    client.verify_connectivity()

    schema = read_cyp_file("tools/graph_db/memgraph/schema.cyp")
    sample_data = read_cyp_file("tools/graph_db/memgraph/sample_data.cyp")
 
    # Create a user in the database
    # records, summary, keys = client.execute_query(
    #     "CREATE (u:User {name: $name, password: $password}) RETURN u.name AS name;",
    #     name="John",
    #     password="pass",
    #     database_="memgraph",
    # )
    print('creating schema')
    records, summary, keys = client.execute_query(schema)
 
    # Get the result
    for record in records:
        # print(record["name"])
        print(record.to_dict())
 
    # Print the query counters
    print(summary.counters)
 
    # Find a user John in the database
    # records, summary, keys = client.execute_query(
    #     "MATCH (u:User {name: $name}) RETURN u.name AS name",
    #     name="John",
    #     database_="memgraph",
    # )
    print('creating sample data')
    records, summary, keys = client.execute_query(sample_data)

    # Get the result
    for record in records:
        # print(record["name"])
        print(record.to_dict())
 
    # Print the query
    # print(summary.query)
    print(summary.counters)