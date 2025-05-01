// Wellness Platform - Sample Data Creation Script
// This script populates the database with example data

// Clear existing data (optional)
// MATCH (n) DETACH DELETE n;

// ----- BASIC ENTITIES -----

// Create base motion types
CREATE (simple:MotionType {name: "simple", description: "Basic single movement exercise"})
CREATE (compound:MotionType {name: "compound", description: "Exercise combining multiple movement patterns"})
CREATE (isometric:MotionType {name: "isometric", description: "Exercise maintaining static muscle contraction"})
CREATE (cardio:MotionType {name: "cardio", description: "Exercise elevating heart rate for extended periods"});

// Create media types
CREATE (image:MediaType {name: "image", formats: ["jpg", "png", "gif"]})
CREATE (video:MediaType {name: "video", formats: ["mp4", "mov", "webm"]})
CREATE (audio:MediaType {name: "audio", formats: ["mp3", "wav", "ogg"]})
CREATE (document:MediaType {name: "document", formats: ["md", "html", "pdf"]});

// Create version nodes
CREATE (v1:Version {number: "1.0.0", createdAt: datetime(), notes: "Initial version"})
CREATE (v2:Version {number: "1.1.0", createdAt: datetime(), notes: "Added modifications"})
CREATE (v3:Version {number: "2.0.0", createdAt: datetime(), notes: "Major update with new features"})
CREATE (vVariant:Version {number: "1.0.0-var1", createdAt: datetime(), notes: "Variant for special populations"});

// Create users
CREATE (john:User {
    id: "user123",
    name: "John Smith",
    email: "john@example.com",
    joinDate: datetime({year: 2024, month: 1, day: 15}),
    lastActive: datetime()
})
CREATE (sarah:User {
    id: "user456",
    name: "Sarah Johnson",
    email: "sarah@example.com",
    joinDate: datetime({year: 2024, month: 2, day: 3}),
    lastActive: datetime()
})
CREATE (mike:User {
    id: "user789",
    name: "Mike Williams",
    email: "mike@example.com",
    joinDate: datetime({year: 2024, month: 3, day: 22}),
    lastActive: datetime({year: 2025, month: 4, day: 15})
});

// Create communities
CREATE (fitComm:Community {
    name: "Fitness Enthusiasts",
    description: "Community for fitness lovers",
    type: "public",
    createdAt: datetime({year: 2024, month: 1, day: 1})
})
CREATE (beginners:Community {
    name: "Beginners Group",
    description: "Group for those new to fitness",
    type: "public",
    createdAt: datetime({year: 2024, month: 2, day: 15})
})
CREATE (friendGroup:Community {
    name: "Weekend Warriors",
    description: "Private group for friends",
    type: "private",
    createdAt: datetime({year: 2024, month: 3, day: 10})
});

// Create tags
CREATE (breathwork:Tag {name: "breathwork", description: "Techniques focused on breathing", category: "technique"})
CREATE (strength:Tag {name: "strength", description: "Builds muscle strength", category: "goal"})
CREATE (flexibility:Tag {name: "flexibility", description: "Improves range of motion", category: "goal"})
CREATE (cardioTag:Tag {name: "cardio", description: "Cardiovascular exercises", category: "type"})
CREATE (legs:Tag {name: "legs", description: "Lower body exercises", category: "bodypart"})
CREATE (arms:Tag {name: "arms", description: "Upper body exercises", category: "bodypart"})
CREATE (fullBody:Tag {name: "full-body", description: "Engages entire body", category: "bodypart"})
CREATE (core:Tag {name: "core", description: "Abdominal and back exercises", category: "bodypart"})
CREATE (stressResilience:Tag {name: "stress-resilience", description: "Builds mental fortitude", category: "benefit"})
CREATE (beginner:Tag {name: "beginner", description: "Suitable for beginners", category: "level"})
CREATE (intermediate:Tag {name: "intermediate", description: "Requires some experience", category: "level"})
CREATE (advanced:Tag {name: "advanced", description: "Challenging exercises", category: "level"});

// ----- BASIC ACTIVITIES -----

// Create base activities
CREATE (pushup:Activity {
    name: "Push-up",
    description: "Upper body exercise performed in a prone position",
    duration: 30,
    difficulty: "intermediate",
    energyExpenditure: "medium"
})
CREATE (squat:Activity {
    name: "Squat",
    description: "Lower body exercise performed by bending knees",
    duration: 30,
    difficulty: "beginner",
    energyExpenditure: "medium"
})
CREATE (jump:Activity {
    name: "Jump",
    description: "Explosive movement jumping off the ground",
    duration: 15,
    difficulty: "beginner",
    energyExpenditure: "high"
})
CREATE (plank:Activity {
    name: "Plank",
    description: "Core exercise holding a push-up position",
    duration: 60,
    difficulty: "intermediate",
    energyExpenditure: "medium"
})
CREATE (breathing:Activity {
    name: "Deep Breathing",
    description: "Slow, controlled breathing exercise",
    duration: 120,
    difficulty: "beginner",
    energyExpenditure: "low"
})
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
    createdAt: datetime({year: 2024, month: 1, day: 10})
})
CREATE (upperBody:Protocol {
    name: "Upper Body Strength",
    description: "Focus on building upper body strength",
    totalDuration: 1200,
    difficulty: "intermediate",
    createdAt: datetime({year: 2024, month: 2, day: 5})
})
CREATE (stressRelief:Protocol {
    name: "Stress Relief",
    description: "Combination of breathing and movement to reduce stress",
    totalDuration: 900,
    difficulty: "beginner",
    createdAt: datetime({year: 2024, month: 3, day: 15})
});

// ----- RELATIONSHIPS -----

// Create tag relationships
MATCH (breathwork:Tag {name: "breathwork"})
MATCH (stressResilience:Tag {name: "stress-resilience"})
CREATE (breathwork)-[:RELATED_TO {strength: 0.9, type: "semantic"}]->(stressResilience)

MATCH (legs:Tag {name: "legs"})
MATCH (squat:Activity {name: "Squat"})
CREATE (squat)-[:TAGGED {addedBy: "user123", addedOn: datetime()}]->(legs)

MATCH (arms:Tag {name: "arms"})
MATCH (pushup:Activity {name: "Push-up"})
CREATE (pushup)-[:TAGGED {addedBy: "user123", addedOn: datetime()}]->(arms)

MATCH (fullBody:Tag {name: "full-body"})
MATCH (burpee:Activity {name: "Burpee"})
CREATE (burpee)-[:TAGGED {addedBy: "user456", addedOn: datetime()}]->(fullBody)

MATCH (breathwork:Tag {name: "breathwork"})
MATCH (breathing:Activity {name: "Deep Breathing"})
CREATE (breathing)-[:TAGGED {addedBy: "user123", addedOn: datetime()}]->(breathwork)

MATCH (stressResilience:Tag {name: "stress-resilience"})
MATCH (stressRelief:Protocol {name: "Stress Relief"})
CREATE (stressRelief)-[:TAGGED {addedBy: "user456", addedOn: datetime()}]->(stressResilience)

MATCH (core:Tag {name: "core"})
MATCH (plank:Activity {name: "Plank"})
CREATE (plank)-[:TAGGED {addedBy: "user789", addedOn: datetime()}]->(core);

// Activity motion types
MATCH (burpee:Activity {name: "Burpee"})
MATCH (compound:MotionType {name: "compound"})
CREATE (burpee)-[:IS_TYPE]->(compound)

MATCH (pushup:Activity {name: "Push-up"})
MATCH (simple:MotionType {name: "simple"})
CREATE (pushup)-[:IS_TYPE]->(simple)

MATCH (plank:Activity {name: "Plank"})
MATCH (isometric:MotionType {name: "isometric"})
CREATE (plank)-[:IS_TYPE]->(isometric);

// Create protocol components
MATCH (morningRoutine:Protocol {name: "Morning Energizer"})
MATCH (pushup:Activity {name: "Push-up"})
CREATE (pushup)-[:PART_OF {position: 1}]->(morningRoutine)

MATCH (morningRoutine:Protocol {name: "Morning Energizer"})
MATCH (breathing:Activity {name: "Deep Breathing"})
CREATE (breathing)-[:PART_OF {position: 2}]->(morningRoutine)

MATCH (upperBody:Protocol {name: "Upper Body Strength"})
MATCH (pushup:Activity {name: "Push-up"})
CREATE (pushup)-[:PART_OF {position: 1}]->(upperBody)

MATCH (upperBody:Protocol {name: "Upper Body Strength"})
MATCH (plank:Activity {name: "Plank"})
CREATE (plank)-[:PART_OF {position: 2}]->(upperBody)

MATCH (stressRelief:Protocol {name: "Stress Relief"})
MATCH (breathing:Activity {name: "Deep Breathing"})
CREATE (breathing)-[:PART_OF {position: 1}]->(stressRelief);

// Community memberships
MATCH (john:User {id: "user123"})
MATCH (fitComm:Community {name: "Fitness Enthusiasts"})
CREATE (john)-[:MEMBER_OF {joinDate: datetime({year: 2024, month: 1, day: 20}), role: "admin"}]->(fitComm)

MATCH (sarah:User {id: "user456"})
MATCH (fitComm:Community {name: "Fitness Enthusiasts"})
CREATE (sarah)-[:MEMBER_OF {joinDate: datetime({year: 2024, month: 2, day: 10}), role: "member"}]->(fitComm)

MATCH (mike:User {id: "user789"})
MATCH (beginners:Community {name: "Beginners Group"})
CREATE (mike)-[:MEMBER_OF {joinDate: datetime({year: 2024, month: 3, day: 25}), role: "member"}]->(beginners)

MATCH (sarah:User {id: "user456"})
MATCH (beginners:Community {name: "Beginners Group"})
CREATE (sarah)-[:MEMBER_OF {joinDate: datetime({year: 2024, month: 2, day: 20}), role: "admin"}]->(beginners);

// Friend relationships
MATCH (john:User {id: "user123"})
MATCH (sarah:User {id: "user456"})
CREATE (john)-[:FRIENDS_WITH {since: datetime({year: 2024, month: 2, day: 15})}]->(sarah)
CREATE (sarah)-[:FRIENDS_WITH {since: datetime({year: 2024, month: 2, day: 15})}]->(john);

// ----- VERSIONING -----

// Activity versions
MATCH (pushup:Activity {name: "Push-up"})
MATCH (v1:Version {number: "1.0.0"})
CREATE (pushup)-[:HAS_VERSION]->(pushupV1:ActivityVersion {
    createdAt: datetime({year: 2024, month: 1, day: 10}),
    modifiedAt: null,
    description: "Standard push-up form",
    duration: 30,
    difficulty: "intermediate"
})-[:VERSION]->(v1)

MATCH (pushup:Activity {name: "Push-up"})
MATCH (v2:Version {number: "1.1.0"})
CREATE (pushup)-[:HAS_VERSION]->(pushupV2:ActivityVersion {
    createdAt: datetime({year: 2024, month: 2, day: 20}),
    modifiedAt: datetime({year: 2024, month: 3, day: 15}),
    description: "Enhanced push-up form with elbow positioning guidance",
    duration: 30,
    difficulty: "intermediate"
})-[:VERSION]->(v2)

// Create a variant
MATCH (pushup:Activity {name: "Push-up"})
MATCH (u:User {id: "user123"})
MATCH (vVariant:Version {number: "1.0.0-var1"})
CREATE (pushup)-[:HAS_VARIANT {
    createdBy: u.id,
    createdAt: datetime({year: 2024, month: 3, day: 1}),
    reason: "Modified for beginners"
}]->(beginnerPushup:ActivityVersion {
    createdAt: datetime({year: 2024, month: 3, day: 1}),
    modifiedAt: null,
    description: "Knee push-up variation for beginners",
    duration: 30,
    difficulty: "beginner"
})-[:VERSION]->(vVariant);

// Protocol versions
MATCH (morningRoutine:Protocol {name: "Morning Energizer"})
MATCH (v1:Version {number: "1.0.0"})
CREATE (morningRoutine)-[:HAS_VERSION]->(mrV1:ProtocolVersion {
    createdAt: datetime({year: 2024, month: 1, day: 10}),
    modifiedAt: null,
    description: "Original morning routine",
    totalDuration: 300
})-[:VERSION]->(v1)

MATCH (upperBody:Protocol {name: "Upper Body Strength"})
MATCH (v1:Version {number: "1.0.0"})
CREATE (upperBody)-[:HAS_VERSION]->(ubV1:ProtocolVersion {
    createdAt: datetime({year: 2024, month: 2, day: 5}),
    modifiedAt: null,
    description: "Standard upper body workout",
    totalDuration: 1200
})-[:VERSION]->(v1);

// Connect activity versions to protocol versions
MATCH (mrV1:ProtocolVersion)<-[:HAS_VERSION]-(:Protocol {name: "Morning Energizer"})
MATCH (pushupV1:ActivityVersion)<-[:HAS_VERSION]-(:Activity {name: "Push-up"})
WHERE mrV1.createdAt.year = 2024 AND pushupV1.createdAt.year = 2024
CREATE (mrV1)-[:INCLUDES {position: 1}]->(pushupV1);

// ----- GUIDES -----

// Create guides for activities
MATCH (pushup:Activity {name: "Push-up"})
MATCH (video:MediaType {name: "video"})
MATCH (john:User {id: "user123"})
CREATE (pushup)-[:HAS_GUIDE]->(g1:Guide {
    title: "Push-up Basics by John",
    url: "https://example.com/videos/john_pushup.mp4",
    uploadedAt: datetime({year: 2024, month: 1, day: 25}),
    fileSize: 24500000,
    duration: 180,
    format: "mp4"
})-[:OF_TYPE]->(video)
CREATE (john)-[:CREATED {timestamp: datetime({year: 2024, month: 1, day: 25})}]->(g1)

MATCH (pushup:Activity {name: "Push-up"})
MATCH (video:MediaType {name: "video"})
MATCH (sarah:User {id: "user456"})
CREATE (pushup)-[:HAS_GUIDE]->(g2:Guide {
    title: "Advanced Push-up Techniques by Sarah",
    url: "https://example.com/videos/sarah_pushup.mp4",
    uploadedAt: datetime({year: 2024, month: 2, day: 12}),
    fileSize: 32800000,
    duration: 240,
    format: "mp4"
})-[:OF_TYPE]->(video)
CREATE (sarah)-[:CREATED {timestamp: datetime({year: 2024, month: 2, day: 12})}]->(g2)

MATCH (breathing:Activity {name: "Deep Breathing"})
MATCH (document:MediaType {name: "document"})
MATCH (sarah:User {id: "user456"})
CREATE (breathing)-[:HAS_GUIDE]->(g3:Guide {
    title: "Proper Deep Breathing Technique",
    url: "https://example.com/guides/breathing.md",
    uploadedAt: datetime({year: 2024, month: 3, day: 5}),
    content: "# Deep Breathing Guide\n\n1. Sit comfortably with your back straight...",
    format: "md"
})-[:OF_TYPE]->(document)
CREATE (sarah)-[:CREATED {timestamp: datetime({year: 2024, month: 3, day: 5})}]->(g3);

// Guide ratings
MATCH (g1:Guide {title: "Push-up Basics by John"})
MATCH (mike:User {id: "user789"})
CREATE (mike)-[:RATED {
    rating: 4.5, 
    comment: "Very clear instructions",
    timestamp: datetime({year: 2024, month: 3, day: 10})
}]->(g1)

MATCH (g2:Guide {title: "Advanced Push-up Techniques by Sarah"})
MATCH (john:User {id: "user123"})
CREATE (john)-[:RATED {
    rating: 5.0, 
    comment: "Excellent progression techniques",
    timestamp: datetime({year: 2024, month: 3, day: 15})
}]->(g2);

// ----- COMPOUND ACTIVITIES -----

// Create compound activity relationships
MATCH (burpee:Activity {name: "Burpee"})
MATCH (squat:Activity {name: "Squat"})
MATCH (pushup:Activity {name: "Push-up"})
MATCH (jump:Activity {name: "Jump"})

CREATE (burpee)-[:COMPOSED_OF {sequence: 1, notes: "Begin with squat position"}]->(squat)
CREATE (burpee)-[:COMPOSED_OF {sequence: 2, notes: "Move to push-up position"}]->(pushup)
CREATE (burpee)-[:COMPOSED_OF {sequence: 3, notes: "Return to squat and jump"}]->(jump);

// ----- PERFORMANCE DATA -----

// User performance data
MATCH (john:User {id: "user123"})
MATCH (pushup:Activity {name: "Push-up"})
CREATE (john)-[:PERFORMED {
    date: datetime({year: 2024, month: 1, day: 30}),
    completionTime: 45,
    difficulty: 3,
    notes: "Completed 20 reps with good form"
}]->(pushup)

CREATE (john)-[:PERFORMED {
    date: datetime({year: 2024, month: 2, day: 15}),
    completionTime: 40,
    difficulty: 3,
    notes: "Completed 22 reps with good form"
}]->(pushup)

MATCH (sarah:User {id: "user456"})
MATCH (burpee:Activity {name: "Burpee"})
CREATE (sarah)-[:PERFORMED {
    date: datetime({year: 2024, month: 2, day: 20}),
    completionTime: 60,
    difficulty: 4,
    notes: "Completed 15 reps, challenging"
}]->(burpee)

MATCH (mike:User {id: "user789"})
MATCH (plank:Activity {name: "Plank"})
CREATE (mike)-[:PERFORMED {
    date: datetime({year: 2024, month: 3, day: 5}),
    completionTime: 90,
    difficulty: 4,
    notes: "Held for 90 seconds"
}]->(plank)

// Protocol completions
MATCH (john:User {id: "user123"})
MATCH (morningRoutine:Protocol {name: "Morning Energizer"})
CREATE (john)-[:COMPLETED {
    startDate: datetime({year: 2024, month: 2, day: 1}),
    endDate: datetime({year: 2024, month: 2, day: 1}),
    adherenceRate: 1.0
}]->(morningRoutine)

MATCH (sarah:User {id: "user456"})
MATCH (upperBody:Protocol {name: "Upper Body Strength"})
CREATE (sarah)-[:COMPLETED {
    startDate: datetime({year: 2024, month: 3, day: 1}),
    endDate: datetime({year: 2024, month: 3, day: 1}),
    adherenceRate: 0.9
}]->(upperBody)

// ----- SOCIAL SHARING DATA -----

// Protocol sharing
MATCH (john:User {id: "user123"})  // Sharer
MATCH (mike:User {id: "user789"})  // Recipient
MATCH (morningRoutine:Protocol {name: "Morning Energizer"})
CREATE (john)-[:SHARED {
    timestamp: datetime({year: 2024, month: 2, day: 10}), 
    message: "Try this one out!"
}]->(morningRoutine)
CREATE (mike)-[:RECEIVED {
    timestamp: datetime({year: 2024, month: 2, day: 10}),
    status: "unread"
}]->(morningRoutine)

// Share with community
MATCH (sarah:User {id: "user456"})
MATCH (upperBody:Protocol {name: "Upper Body Strength"})
MATCH (fitComm:Community {name: "Fitness Enthusiasts"})
CREATE (sarah)-[:SHARED_WITH_COMMUNITY {
    timestamp: datetime({year: 2024, month: 3, day: 5}),
    message: "Great for intermediate users!"
}]->(s:Share {
    timestamp: datetime({year: 2024, month: 3, day: 5})
})-[:OF_PROTOCOL]->(upperBody)
CREATE (s)-[:TO_COMMUNITY]->(fitComm)

// Favorites
MATCH (mike:User {id: "user789"})  
MATCH (morningRoutine:Protocol {name: "Morning Energizer"})
CREATE (mike)-[:FAVORITED {timestamp: datetime({year: 2024, month: 2, day: 15})}]->(morningRoutine)

MATCH (john:User {id: "user123"})  
MATCH (stressRelief:Protocol {name: "Stress Relief"})
CREATE (john)-[:FAVORITED {timestamp: datetime({year: 2024, month: 3, day: 20})}]->(stressRelief)

// ----- TIME SERIES HEALTH DATA -----

// Create user weight measurements
CREATE (weight1:HealthMetric {
    type: "weight",
    value: 185.5,
    unit: "lbs",
    timestamp: datetime({year: 2024, month: 1, day: 1})
})
CREATE (weight2:HealthMetric {
    type: "weight",
    value: 183.2,
    unit: "lbs",
    timestamp: datetime({year: 2024, month: 2, day: 1})
})
CREATE (weight3:HealthMetric {
    type: "weight",
    value: 181.0,
    unit: "lbs",
    timestamp: datetime({year: 2024, month: 3, day: 1})
})

// Connect to user
MATCH (john:User {id: "user123"})
MATCH (weight1:HealthMetric {timestamp: datetime({year: 2024, month: 1, day: 1})})
MATCH (weight2:HealthMetric {timestamp: datetime({year: 2024, month: 2, day: 1})})
MATCH (weight3:HealthMetric {timestamp: datetime({year: 2024, month: 3, day: 1})})
CREATE (john)-[:RECORDED]->(weight1)
CREATE (john)-[:RECORDED]->(weight2)
CREATE (john)-[:RECORDED]->(weight3)

// Create sleep metrics
CREATE (sleep1:HealthMetric {
    type: "sleep",
    value: 7.5,
    unit: "hours",
    timestamp: datetime({year: 2024, month: 2, day: 15})
})
CREATE (sleep2:HealthMetric {
    type: "sleep",
    value: 8.2,
    unit: "hours",
    timestamp: datetime({year: 2024, month: 2, day: 16})
})

// Connect to user
MATCH (sarah:User {id: "user456"})
MATCH (sleep1:HealthMetric {timestamp: datetime({year: 2024, month: 2, day: 15})})
MATCH (sleep2:HealthMetric {timestamp: datetime({year: 2024, month: 2, day: 16})})
CREATE (sarah)-[:RECORDED]->(sleep1)
CREATE (sarah)-[:RECORDED]->(sleep2)