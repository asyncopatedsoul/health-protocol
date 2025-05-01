// Wellness Platform - Complete Neo4j Schema Setup Script
// This script creates all necessary node labels, relationship types, and constraints

// CONSTRAINTS
// Create constraints to ensure uniqueness where required
CREATE CONSTRAINT activity_name IF NOT EXISTS FOR (a:Activity) REQUIRE a.name IS UNIQUE;
CREATE CONSTRAINT protocol_name IF NOT EXISTS FOR (p:Protocol) REQUIRE p.name IS UNIQUE;
CREATE CONSTRAINT user_id IF NOT EXISTS FOR (u:User) REQUIRE u.id IS UNIQUE;
CREATE CONSTRAINT community_name IF NOT EXISTS FOR (c:Community) REQUIRE c.name IS UNIQUE;
CREATE CONSTRAINT tag_name IF NOT EXISTS FOR (t:Tag) REQUIRE t.name IS UNIQUE;
CREATE CONSTRAINT version_number IF NOT EXISTS FOR (v:Version) REQUIRE v.number IS UNIQUE;
CREATE CONSTRAINT media_type_name IF NOT EXISTS FOR (mt:MediaType) REQUIRE mt.name IS UNIQUE;
CREATE CONSTRAINT motion_type_name IF NOT EXISTS FOR (mt:MotionType) REQUIRE mt.name IS UNIQUE;
CREATE CONSTRAINT guide_url IF NOT EXISTS FOR (g:Guide) REQUIRE g.url IS UNIQUE;

// Create indexes for faster querying
CREATE INDEX activity_difficulty IF NOT EXISTS FOR (a:Activity) ON (a.difficulty);
CREATE INDEX tag_category IF NOT EXISTS FOR (t:Tag) ON (t.category);

// CORE SCHEMA - NODES
// Create basic node labels with their expected properties

// Core entity types
CALL apoc.schema.nodeLabel.create('Activity', 
    [
        {name: 'name', type: 'STRING'}, 
        {name: 'description', type: 'STRING'},
        {name: 'duration', type: 'INTEGER'},
        {name: 'difficulty', type: 'STRING'},
        {name: 'energyExpenditure', type: 'STRING'}
    ]);
    
CALL apoc.schema.nodeLabel.create('Protocol', 
    [
        {name: 'name', type: 'STRING'}, 
        {name: 'description', type: 'STRING'},
        {name: 'totalDuration', type: 'INTEGER'},
        {name: 'difficulty', type: 'STRING'},
        {name: 'createdAt', type: 'DATETIME'}
    ]);
    
CALL apoc.schema.nodeLabel.create('User', 
    [
        {name: 'id', type: 'STRING'}, 
        {name: 'name', type: 'STRING'},
        {name: 'email', type: 'STRING'},
        {name: 'joinDate', type: 'DATETIME'},
        {name: 'lastActive', type: 'DATETIME'}
    ]);
    
CALL apoc.schema.nodeLabel.create('Community', 
    [
        {name: 'name', type: 'STRING'}, 
        {name: 'description', type: 'STRING'},
        {name: 'type', type: 'STRING'},
        {name: 'createdAt', type: 'DATETIME'}
    ]);

// Tag system
CALL apoc.schema.nodeLabel.create('Tag', 
    [
        {name: 'name', type: 'STRING'}, 
        {name: 'description', type: 'STRING'},
        {name: 'category', type: 'STRING'}
    ]);

// Versioning system
CALL apoc.schema.nodeLabel.create('Version', 
    [
        {name: 'number', type: 'STRING'}, 
        {name: 'createdAt', type: 'DATETIME'},
        {name: 'notes', type: 'STRING'}
    ]);
    
CALL apoc.schema.nodeLabel.create('ActivityVersion', 
    [
        {name: 'createdAt', type: 'DATETIME'}, 
        {name: 'modifiedAt', type: 'DATETIME'},
        {name: 'description', type: 'STRING'},
        {name: 'duration', type: 'INTEGER'},
        {name: 'difficulty', type: 'STRING'}
    ]);
    
CALL apoc.schema.nodeLabel.create('ProtocolVersion', 
    [
        {name: 'createdAt', type: 'DATETIME'}, 
        {name: 'modifiedAt', type: 'DATETIME'},
        {name: 'description', type: 'STRING'},
        {name: 'totalDuration', type: 'INTEGER'}
    ]);

// Media and guides
CALL apoc.schema.nodeLabel.create('MediaType', 
    [
        {name: 'name', type: 'STRING'}, 
        {name: 'formats', type: 'LIST<STRING>'}
    ]);
    
CALL apoc.schema.nodeLabel.create('Guide', 
    [
        {name: 'title', type: 'STRING'}, 
        {name: 'url', type: 'STRING'},
        {name: 'uploadedAt', type: 'DATETIME'},
        {name: 'format', type: 'STRING'},
        {name: 'fileSize', type: 'INTEGER'},
        {name: 'duration', type: 'INTEGER'},
        {name: 'content', type: 'STRING'}
    ]);

// Activity composition
CALL apoc.schema.nodeLabel.create('MotionType', 
    [
        {name: 'name', type: 'STRING'}, 
        {name: 'description', type: 'STRING'}
    ]);

// Social sharing
CALL apoc.schema.nodeLabel.create('Share', 
    [
        {name: 'timestamp', type: 'DATETIME'}, 
        {name: 'message', type: 'STRING'}
    ]);

// CORE SCHEMA - RELATIONSHIPS

// Activity-Protocol relationships
CALL apoc.schema.relationship.create('PART_OF', 
    ['Activity'], ['Protocol'], 
    [{name: 'position', type: 'INTEGER'}]);

// User-Community relationships
CALL apoc.schema.relationship.create('MEMBER_OF', 
    ['User'], ['Community'], 
    [
        {name: 'joinDate', type: 'DATETIME'},
        {name: 'role', type: 'STRING'}
    ]);
CALL apoc.schema.relationship.create('FRIENDS_WITH', 
    ['User'], ['User'], 
    [{name: 'since', type: 'DATETIME'}]);

// Tagging relationships
CALL apoc.schema.relationship.create('TAGGED', 
    ['Activity', 'Protocol'], ['Tag'], 
    [
        {name: 'addedBy', type: 'STRING'},
        {name: 'addedOn', type: 'DATETIME'}
    ]);
CALL apoc.schema.relationship.create('RELATED_TO', 
    ['Tag'], ['Tag'], 
    [
        {name: 'strength', type: 'FLOAT'},
        {name: 'type', type: 'STRING'}
    ]);

// User Performance relationships
CALL apoc.schema.relationship.create('PERFORMED', 
    ['User'], ['Activity'], 
    [
        {name: 'date', type: 'DATETIME'},
        {name: 'completionTime', type: 'INTEGER'},
        {name: 'difficulty', type: 'INTEGER'},
        {name: 'notes', type: 'STRING'}
    ]);
CALL apoc.schema.relationship.create('COMPLETED', 
    ['User'], ['Protocol'], 
    [
        {name: 'startDate', type: 'DATETIME'},
        {name: 'endDate', type: 'DATETIME'},
        {name: 'adherenceRate', type: 'FLOAT'}
    ]);

// Versioning relationships
CALL apoc.schema.relationship.create('HAS_VERSION', 
    ['Activity'], ['ActivityVersion'], []);
CALL apoc.schema.relationship.create('VERSION', 
    ['ActivityVersion'], ['Version'], []);
CALL apoc.schema.relationship.create('HAS_VERSION', 
    ['Protocol'], ['ProtocolVersion'], []);
CALL apoc.schema.relationship.create('VERSION', 
    ['ProtocolVersion'], ['Version'], []);
CALL apoc.schema.relationship.create('INCLUDES', 
    ['ProtocolVersion'], ['ActivityVersion'], 
    [{name: 'position', type: 'INTEGER'}]);
CALL apoc.schema.relationship.create('HAS_VARIANT', 
    ['Activity'], ['ActivityVersion'], 
    [
        {name: 'createdBy', type: 'STRING'},
        {name: 'createdAt', type: 'DATETIME'},
        {name: 'reason', type: 'STRING'}
    ]);

// Media and guide relationships
CALL apoc.schema.relationship.create('HAS_GUIDE', 
    ['Activity'], ['Guide'], []);
CALL apoc.schema.relationship.create('OF_TYPE', 
    ['Guide'], ['MediaType'], []);
CALL apoc.schema.relationship.create('CREATED', 
    ['User'], ['Guide'], 
    [{name: 'timestamp', type: 'DATETIME'}]);
CALL apoc.schema.relationship.create('RATED', 
    ['User'], ['Guide'], 
    [
        {name: 'rating', type: 'FLOAT'},
        {name: 'comment', type: 'STRING'},
        {name: 'timestamp', type: 'DATETIME'}
    ]);

// Activity composition relationships
CALL apoc.schema.relationship.create('COMPOSED_OF', 
    ['Activity'], ['Activity'], 
    [
        {name: 'sequence', type: 'INTEGER'},
        {name: 'notes', type: 'STRING'}
    ]);
CALL apoc.schema.relationship.create('IS_TYPE', 
    ['Activity'], ['MotionType'], []);

// Social sharing relationships
CALL apoc.schema.relationship.create('SHARED', 
    ['User'], ['Protocol'], 
    [
        {name: 'timestamp', type: 'DATETIME'},
        {name: 'message', type: 'STRING'}
    ]);
CALL apoc.schema.relationship.create('RECEIVED', 
    ['User'], ['Protocol'], 
    [
        {name: 'timestamp', type: 'DATETIME'},
        {name: 'status', type: 'STRING'}
    ]);
CALL apoc.schema.relationship.create('SHARED_WITH_COMMUNITY', 
    ['User'], ['Share'], 
    [
        {name: 'timestamp', type: 'DATETIME'},
        {name: 'message', type: 'STRING'}
    ]);
CALL apoc.schema.relationship.create('OF_PROTOCOL', 
    ['Share'], ['Protocol'], []);
CALL apoc.schema.relationship.create('TO_COMMUNITY', 
    ['Share'], ['Community'], []);
CALL apoc.schema.relationship.create('FAVORITED', 
    ['User'], ['Protocol'], 
    [{name: 'timestamp', type: 'DATETIME'}]);