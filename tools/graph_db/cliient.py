from gqlalchemy import Memgraph, Node, Relationship, Field
from typing import Optional

db = Memgraph()

class User(Node):
    id: str = Field(index=True, db=db)
    username: str = Field(exists=True, db=db)

class Streamer(User):
    id: str
    username: Optional[str] = Field(exists=True, db=db)
    followers: Optional[str]

class Language(Node, index=True, db=db):
    name: str = Field(unique=True, db=db)

class ChatsWith(Relationship, type="CHATS_WITH"):
    last_chatted: str

class Speaks(Relationship, type="SPEAKS"):
    since: Optional[str]

john = User(id="1", username="John").save(db)
jane = Streamer(id="2", username="janedoe", followers=111).save(db)
language = Language(name="en").save(db)

ChatsWith(
    _start_node_id=john._id, _end_node_id=jane._id, last_chatted="2023-02-14"
).save(db)

Speaks(_start_node_id=john._id, _end_node_id=language._id, since="2023-02-14").save(db)

streamer = Streamer(id="2").load(db=db)
language = Language(name="en").load(db=db)

speaks = Speaks(
    _start_node_id=streamer._id,
    _end_node_id=language._id,
    since="2023-02-20",
).save(db)

speaks = Speaks(_start_node_id=streamer._id, _end_node_id=language._id).load(db)
print(speaks.since)

try:
    streamer = Streamer(id="3").load(db=db)
except:
    print("Creating new Streamer node in the database.")
    streamer = Streamer(id="3", username="anne", followers=222).save(db=db)

try:
    speaks = Speaks(_start_node_id=streamer._id, _end_node_id=language._id).load(db)
except:
    print("Creating new Speaks relationship in the database.")
    speaks = Speaks(
        _start_node_id=streamer._id,
        _end_node_id=language._id,
        since="2023-02-20",
    ).save(db)

print(db.get_indexes())
print(db.get_constraints())