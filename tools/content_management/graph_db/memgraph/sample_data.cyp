// Wellness Platform - Sample Data Creation Script for Memgraph
// This script populates the database with example data

// Clear existing data (optional)
MATCH (n) DETACH DELETE n;

// ----- BASIC ENTITIES -----

// Create base motion types
CREATE (simple:MotionType {name: "simple", description: "Basic single movement exercise"});
CREATE (compound:MotionType {name: "compound", description: "Exercise combining multiple movement patterns"});
CREATE (isometric:MotionType {name: "isometric", description: "Exercise maintaining static muscle contraction"});
CREATE (cardio:MotionType {name: "cardio", description: "Exercise elevating heart rate for extended periods"});

// Create media types
CREATE (image:MediaType {name: "image", formats: ["jpg", "png", "gif"]});
CREATE (video:MediaType {name: "video", formats: ["mp4", "mov", "webm"]});
CREATE (audio:MediaType {name: "audio", formats: ["mp3", "wav", "ogg"]});
CREATE (document:MediaType {name: "document", formats: ["md", "html", "pdf"]});

// Create version nodes - using timestamp() without arguments for current time
CREATE (v1:Version {number: "1.0.0", createdAt: timestamp(), notes: "Initial version"});
CREATE (v2:Version {number: "1.1.0", createdAt: timestamp(), notes: "Added modifications"});
CREATE (v3:Version {number: "2.0.0", createdAt: timestamp(), notes: "Major update with new features"});
CREATE (vVariant:Version {number: "1.0.0-var1", createdAt: timestamp(), notes: "Variant for special populations"});

// Create users - using LocalDateTime for specific dates
CREATE (john:User {
    id: "user123",
    name: "John Smith",
    email: "john@example.com",
    joinDate: LocalDateTime("2024-01-15T00:00:00"),
    lastActive: timestamp()
});
CREATE (sarah:User {
    id: "user456",
    name: "Sarah Johnson",
    email: "sarah@example.com",
    joinDate: LocalDateTime("2024-02-03T00:00:00"),
    lastActive: timestamp()
});
CREATE (mike:User {
    id: "user789",
    name: "Mike Williams",
    email: "mike@example.com",
    joinDate: LocalDateTime("2024-03-22T00:00:00"),
    lastActive: LocalDateTime("2025-04-15T00:00:00")
});

// Create communities
CREATE (fitComm:Community {
    name: "Fitness Enthusiasts",
    description: "Community for fitness lovers",
    type: "public",
    createdAt: LocalDateTime("2024-01-01T00:00:00")
})
CREATE (beginners:Community {
    name: "Beginners Group",
    description: "Group for those new to fitness",
    type: "public",
    createdAt: LocalDateTime("2024-02-15T00:00:00")
})
CREATE (friendGroup:Community {
    name: "Weekend Warriors",
    description: "Private group for friends",
    type: "private",
    createdAt: LocalDateTime("2024-03-10T00:00:00")
});

// Create tags
CREATE (breathwork:Tag {name: "breathwork", description: "Techniques focused on breathing", category: "technique"});
CREATE (strength:Tag {name: "strength", description: "Builds muscle strength", category: "goal"});
CREATE (flexibility:Tag {name: "flexibility", description: "Improves range of motion", category: "goal"});
CREATE (cardioTag:Tag {name: "cardio", description: "Cardiovascular exercises", category: "type"});
CREATE (legs:Tag {name: "legs", description: "Lower body exercises", category: "bodypart"});
CREATE (arms:Tag {name: "arms", description: "Upper body exercises", category: "bodypart"});
CREATE (fullBody:Tag {name: "full-body", description: "Engages entire body", category: "bodypart"});
CREATE (core:Tag {name: "core", description: "Abdominal and back exercises", category: "bodypart"});
CREATE (stressResilience:Tag {name: "stress-resilience", description: "Builds mental fortitude", category: "benefit"});
CREATE (beginner:Tag {name: "beginner", description: "Suitable for beginners", category: "level"});
CREATE (intermediate:Tag {name: "intermediate", description: "Requires some experience", category: "level"});
CREATE (advanced:Tag {name: "advanced", description: "Challenging exercises", category: "level"});

// ----- BASIC ACTIVITIES -----

// Create base activities
CREATE (pushup:Activity {
    name: "Push-up",
    description: "Upper body exercise performed in a prone position",
    duration: 30,
    difficulty: "intermediate",
    energyExpenditure: "medium"
});
CREATE (squat:Activity {
    name: "Squat",
    description: "Lower body exercise performed by bending knees",
    duration: 30,
    difficulty: "beginner"
});
CREATE (jump:Activity {
    name: "Jump",
    description: "Explosive movement jumping off the ground",
    duration: 15,
    difficulty: "beginner",
    energyExpenditure: "high"
});
CREATE (plank:Activity {
    name: "Plank",
    description: "Core exercise holding a push-up position",
    duration: 60,
    difficulty: "intermediate",
    energyExpenditure: "medium"
});
CREATE (breathing:Activity {
    name: "Deep Breathing",
    description: "Slow, controlled breathing exercise",
    duration: 120,
    difficulty: "beginner",
    energyExpenditure: "low"
});
CREATE (burpee:Activity {
    name: "Burpee",
    description: "A compound, full-body, calisthenic activity",
    duration: 45,
    difficulty: "intermediate",
    energyExpenditure: "high"
});

// ----- PROTOCOLS -----

// Create protocols
CREATE (morningRoutine:Protocol {
    name: "Morning Energizer",
    description: "Quick routine to start the day",
    totalDuration: 300,
    difficulty: "beginner",
    createdAt: LocalDateTime("2024-01-10T00:00:00")
});
CREATE (upperBody:Protocol {
    name: "Upper Body Strength",
    description: "Focus on building upper body strength",
    totalDuration: 1200,
    difficulty: "intermediate",
    createdAt: LocalDateTime("2024-02-05T00:00:00")
});
CREATE (stressRelief:Protocol {
    name: "Stress Relief",
    description: "Combination of breathing and movement to reduce stress",
    totalDuration: 900,
    difficulty: "beginner",
    createdAt: LocalDateTime("2024-03-15T00:00:00")
});

// ----- RELATIONSHIPS -----

// Create tag relationships
MATCH (breathwork:Tag {name: "breathwork"})
MATCH (stressResilience:Tag {name: "stress-resilience"})
CREATE (breathwork)-[:RELATED_TO {strength: 0.9, type: "semantic"}]->(stressResilience);

MATCH (legs:Tag {name: "legs"})
MATCH (squat:Activity {name: "Squat"})
CREATE (squat)-[:TAGGED {addedBy: "user123", addedOn: timestamp()}]->(legs);

MATCH (arms:Tag {name: "arms"})
MATCH (pushup:Activity {name: "Push-up"})
CREATE (pushup)-[:TAGGED {addedBy: "user123", addedOn: timestamp()}]->(arms);

MATCH (fullBody:Tag {name: "full-body"})
MATCH (burpee:Activity {name: "Burpee"})
CREATE (burpee)-[:TAGGED {addedBy: "user456", addedOn: timestamp()}]->(fullBody);

MATCH (breathwork:Tag {name: "breathwork"})
MATCH (breathing:Activity {name: "Deep Breathing"})
CREATE (breathing)-[:TAGGED {addedBy: "user123", addedOn: timestamp()}]->(breathwork);

MATCH (stressResilience:Tag {name: "stress-resilience"})
MATCH (stressRelief:Protocol {name: "Stress Relief"})
CREATE (stressRelief)-[:TAGGED {addedBy: "user456", addedOn: timestamp()}]->(stressResilience);

MATCH (core:Tag {name: "core"})
MATCH (plank:Activity {name: "Plank"})
CREATE (plank)-[:TAGGED {addedBy: "user789", addedOn: timestamp()}]->(core);

// Activity motion types
MATCH (burpee:Activity {name: "Burpee"})
MATCH (compound:MotionType {name: "compound"})
CREATE (burpee)-[:IS_TYPE]->(compound);

MATCH (pushup:Activity {name: "Push-up"})
MATCH (simple:MotionType {name: "simple"})
CREATE (pushup)-[:IS_TYPE]->(simple);

MATCH (plank:Activity {name: "Plank"})
MATCH (isometric:MotionType {name: "isometric"})
CREATE (plank)-[:IS_TYPE]->(isometric);

// Create protocol components
MATCH (morningRoutine:Protocol {name: "Morning Energizer"})
MATCH (pushup:Activity {name: "Push-up"})
CREATE (pushup)-[:PART_OF {position: 1}]->(morningRoutine);

MATCH (morningRoutine:Protocol {name: "Morning Energizer"})
MATCH (breathing:Activity {name: "Deep Breathing"})
CREATE (breathing)-[:PART_OF {position: 2}]->(morningRoutine);

MATCH (upperBody:Protocol {name: "Upper Body Strength"})
MATCH (pushup:Activity {name: "Push-up"})
CREATE (pushup)-[:PART_OF {position: 1}]->(upperBody);

MATCH (upperBody:Protocol {name: "Upper Body Strength"})
MATCH (plank:Activity {name: "Plank"})
CREATE (plank)-[:PART_OF {position: 2}]->(upperBody);

MATCH (stressRelief:Protocol {name: "Stress Relief"})
MATCH (breathing:Activity {name: "Deep Breathing"})
CREATE (breathing)-[:PART_OF {position: 1}]->(stressRelief);

// Community memberships
MATCH (john:User {id: "user123"})
MATCH (fitComm:Community {name: "Fitness Enthusiasts"})
CREATE (john)-[:MEMBER_OF {joinDate: LocalDateTime("2024-01-20T00:00:00"), role: "admin"}]->(fitComm);

MATCH (sarah:User {id: "user456"})
MATCH (fitComm:Community {name: "Fitness Enthusiasts"})
CREATE (sarah)-[:MEMBER_OF {joinDate: LocalDateTime("2024-02-10T00:00:00"), role: "member"}]->(fitComm);

MATCH (mike:User {id: "user789"})
MATCH (beginners:Community {name: "Beginners Group"})
CREATE (mike)-[:MEMBER_OF {joinDate: LocalDateTime("2024-03-25T00:00:00"), role: "member"}]->(beginners);

MATCH (sarah:User {id: "user456"})
MATCH (beginners:Community {name: "Beginners Group"})
CREATE (sarah)-[:MEMBER_OF {joinDate: LocalDateTime("2024-02-20T00:00:00"), role: "admin"}]->(beginners);

// Friend relationships
MATCH (john:User {id: "user123"})
MATCH (sarah:User {id: "user456"})
CREATE (john)-[:FRIENDS_WITH {since: LocalDateTime("2024-02-15T00:00:00")}]->(sarah)
CREATE (sarah)-[:FRIENDS_WITH {since: LocalDateTime("2024-02-15T00:00:00")}]->(john);

// ----- VERSIONING -----

// Activity versions
MATCH (pushup:Activity {name: "Push-up"})
MATCH (v1:Version {number: "1.0.0"})
CREATE (pushup)-[:HAS_VERSION]->(pushupV1:ActivityVersion {
    createdAt: LocalDateTime("2024-01-10T00:00:00"),
    modifiedAt: null,
    description: "Initial version of push-up",
    duration: 30,
    difficulty: "intermediate"
})
CREATE (pushupV1)-[:VERSION]->(v1);

// Protocol versions
MATCH (morningRoutine:Protocol {name: "Morning Energizer"})
MATCH (v1:Version {number: "1.0.0"})
CREATE (morningRoutine)-[:HAS_VERSION]->(morningRoutineV1:ProtocolVersion {
    createdAt: LocalDateTime("2024-01-10T00:00:00"),
    modifiedAt: null,
    description: "Initial version of morning routine",
    totalDuration: 300
})
CREATE (morningRoutineV1)-[:VERSION]->(v1);

// ----- USER PERFORMANCE -----

// Activity performance
MATCH (john:User {id: "user123"})
MATCH (pushup:Activity {name: "Push-up"})
CREATE (john)-[:PERFORMED {
    date: LocalDateTime("2024-02-01T00:00:00"),
    completionTime: 35,
    difficulty: 3,
    notes: "Good form, completed all reps"
}]->(pushup);

MATCH (sarah:User {id: "user456"})
MATCH (plank:Activity {name: "Plank"})
CREATE (sarah)-[:PERFORMED {
    date: LocalDateTime("2024-02-15T00:00:00"),
    completionTime: 45,
    difficulty: 2,
    notes: "Held for 45 seconds"
}]->(plank);

// Protocol completion
MATCH (john:User {id: "user123"})
MATCH (morningRoutine:Protocol {name: "Morning Energizer"})
CREATE (john)-[:COMPLETED {
    startDate: LocalDateTime("2024-02-01T00:00:00"),
    endDate: LocalDateTime("2024-02-01T00:05:00"),
    adherenceRate: 1.0
}]->(morningRoutine);

// ----- MEDIA AND GUIDES -----

// Create guides
CREATE (pushupGuide:Guide {
    title: "Perfect Push-up Guide",
    url: "https://example.com/pushup-guide",
    uploadedAt: LocalDateTime("2024-01-05T00:00:00"),
    format: "video",
    fileSize: 5000000,
    duration: 300,
    content: "Step-by-step guide to perfect push-up form"
});

// Link guides to activities
MATCH (pushup:Activity {name: "Push-up"})
MATCH (pushupGuide:Guide {title: "Perfect Push-up Guide"})
CREATE (pushup)-[:HAS_GUIDE]->(pushupGuide);

// Link guides to media types
MATCH (pushupGuide:Guide {title: "Perfect Push-up Guide"})
MATCH (video:MediaType {name: "video"})
CREATE (pushupGuide)-[:OF_TYPE]->(video);

// Guide ratings
MATCH (john:User {id: "user123"})
MATCH (pushupGuide:Guide {title: "Perfect Push-up Guide"})
CREATE (john)-[:RATED {
    rating: 4.5,
    comment: "Very helpful guide!",
    timestamp: LocalDateTime("2024-01-06T00:00:00")
}]->(pushupGuide);