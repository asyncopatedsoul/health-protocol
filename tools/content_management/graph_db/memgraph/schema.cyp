// Wellness Platform - Complete Memgraph Schema Setup Script
// This script creates all necessary node labels, relationship types, and constraints

// CONSTRAINTS
// Create constraints to ensure uniqueness where required
CREATE CONSTRAINT ON (a:Activity) ASSERT a.name IS UNIQUE;
CREATE CONSTRAINT ON (p:Protocol) ASSERT p.name IS UNIQUE;
CREATE CONSTRAINT ON (u:User) ASSERT u.id IS UNIQUE;
CREATE CONSTRAINT ON (c:Community) ASSERT c.name IS UNIQUE;
CREATE CONSTRAINT ON (t:Tag) ASSERT t.name IS UNIQUE;
CREATE CONSTRAINT ON (v:Version) ASSERT v.number IS UNIQUE;
CREATE CONSTRAINT ON (mt:MediaType) ASSERT mt.name IS UNIQUE;
CREATE CONSTRAINT ON (mt:MotionType) ASSERT mt.name IS UNIQUE;
CREATE CONSTRAINT ON (g:Guide) ASSERT g.url IS UNIQUE;

// Create indexes for faster querying
CREATE INDEX ON :Activity(difficulty);
CREATE INDEX ON :Tag(category);

// CORE SCHEMA - NODES
// Note: Memgraph doesn't support explicit schema definition for properties
// Properties will be created dynamically when nodes are created

// Core entity types
// Activity, Protocol, User, Community, Tag, Version, MediaType, Guide, MotionType, Share
// These node labels will be created implicitly when nodes are created

// CORE SCHEMA - RELATIONSHIPS
// Note: Memgraph doesn't support explicit relationship type schema definition
// Relationship types and their properties will be created dynamically when relationships are created

// Activity-Protocol relationships
// PART_OF relationship with position property

// User-Community relationships
// MEMBER_OF relationship with joinDate and role properties
// FRIENDS_WITH relationship with since property

// Tagging relationships
// TAGGED relationship with addedBy and addedOn properties
// RELATED_TO relationship with strength and type properties

// User Performance relationships
// PERFORMED relationship with date, completionTime, difficulty, and notes properties
// COMPLETED relationship with startDate, endDate, and adherenceRate properties

// Versioning relationships
// HAS_VERSION, VERSION, INCLUDES, HAS_VARIANT relationships

// Media and guide relationships
// HAS_GUIDE, OF_TYPE, CREATED, RATED relationships

// Activity composition relationships
// COMPOSED_OF relationship with sequence and notes properties
// IS_TYPE relationship

// Social sharing relationships
// SHARED, RECEIVED, SHARED_WITH_COMMUNITY, OF_PROTOCOL, TO_COMMUNITY, FAVORITED relationships