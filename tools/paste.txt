CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    username TEXT NOT NULL UNIQUE,
    email TEXT
);

CREATE TABLE IF NOT EXISTS protocols (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    source_code TEXT,
    description TEXT
);

-- CREATE TABLE IF NOT EXISTS activities (
--     id INTEGER PRIMARY KEY AUTOINCREMENT,
--     name TEXT NOT NULL,
--     description TEXT,
--     video_guide TEXT,
--     image_guide TEXT
-- );
CREATE TABLE IF NOT EXISTS activity_protocols (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    activity_id INTEGER NOT NULL,
    protocol_id INTEGER NOT NULL,
    parameters TEXT,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (activity_id) REFERENCES activities(id),
    FOREIGN KEY (protocol_id) REFERENCES protocols(id)
);

CREATE TABLE IF NOT EXISTS activity_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    activity_protocol_id INTEGER NOT NULL,
    parameters TEXT,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    start_time_ms INTEGER NOT NULL,
    end_time_ms INTEGER NOT NULL,
    status TEXT NOT NULL,
    notes TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (activity_protocol_id) REFERENCES activity_protocols(id)
);

-- activities
CREATE TABLE activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    type TEXT CHECK(
        type IN (
            'breathwork',
            'calisthenics',
            'meditation',
            'strength'
        )
    ),
    difficulty_level INTEGER,
    FOREIGN KEY (difficulty_level) REFERENCES DifficultyLevels(id)
);

CREATE TABLE DifficultyLevels (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT
);

CREATE TABLE ActivityRelationships (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    activity1_id INTEGER,
    activity2_id INTEGER,
    relationship_type TEXT CHECK(
        relationship_type IN (
            'related_skill',
            'compound_skill',
            'prerequisite_skill'
        )
    ),
    FOREIGN KEY (activity1_id) REFERENCES activities(id),
    FOREIGN KEY (activity2_id) REFERENCES activities(id)
);

-- Body Areas  
CREATE TABLE BodyAreas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL
);

CREATE TABLE ActivityBodyAreas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    activity_id INTEGER,
    body_area_id INTEGER,
    FOREIGN KEY (activity_id) REFERENCES activities(id),
    FOREIGN KEY (body_area_id) REFERENCES BodyAreas(id)
);

-- Media and Performance
CREATE TABLE ActivityMedia (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    activity_id INTEGER,
    media_type TEXT CHECK(media_type IN ('video', 'image', 'audio')),
    url TEXT,
    FOREIGN KEY (activity_id) REFERENCES activities(id)
);

CREATE TABLE Useractivities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    activity_id INTEGER,
    performed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    performance_data JSON,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (activity_id) REFERENCES activities(id)
);

-- Tags
CREATE TABLE Tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    type TEXT CHECK(type IN ('universal', 'user'))
);

CREATE TABLE ActivityTags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    activity_id INTEGER,
    tag_id INTEGER,
    FOREIGN KEY (activity_id) REFERENCES activities(id),
    FOREIGN KEY (tag_id) REFERENCES Tags(id)
);

-- Guides
CREATE TABLE Guides (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT
);

CREATE TABLE GuideParts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guide_id INTEGER,
    title TEXT NOT NULL,
    content TEXT,
    "order" INTEGER,
    FOREIGN KEY (guide_id) REFERENCES Guides(id)
);

CREATE TABLE GuideVersions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guide_id INTEGER,
    version_number INTEGER,
    release_notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (guide_id) REFERENCES Guides(id)
);

CREATE TABLE GuidePartVersions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guide_version_id INTEGER,
    guide_part_id INTEGER,
    content TEXT,
    FOREIGN KEY (guide_version_id) REFERENCES GuideVersions(id),
    FOREIGN KEY (guide_part_id) REFERENCES GuideParts(id)
);

-- Playlists
CREATE TABLE Playlists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    name TEXT NOT NULL,
    description TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE PlaylistItems (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    playlist_id INTEGER,
    activity_id INTEGER,
    "order" INTEGER,
    FOREIGN KEY (playlist_id) REFERENCES Playlists(id),
    FOREIGN KEY (activity_id) REFERENCES activities(id)
);

CREATE TABLE PlaylistPerformance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    playlist_id INTEGER,
    performed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    performance_data JSON,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (playlist_id) REFERENCES Playlists(id)
);

-- Sharing  
CREATE TABLE ActivitySharing (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_activity_id INTEGER,
    shared_with_id INTEGER,
    feedback TEXT,
    FOREIGN KEY (user_activity_id) REFERENCES Useractivities(id),
    FOREIGN KEY (shared_with_id) REFERENCES users(id)
);

CREATE TABLE PlaylistSharing (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    playlist_id INTEGER,
    shared_by_id INTEGER,
    shared_with_id INTEGER,
    feedback TEXT,
    FOREIGN KEY (playlist_id) REFERENCES Playlists(id),
    FOREIGN KEY (shared_by_id) REFERENCES users(id),
    FOREIGN KEY (shared_with_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS skill_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT
);

CREATE TABLE IF NOT EXISTS activity_skills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    activity_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    difficulty INTEGER NOT NULL DEFAULT 1,
    category_id INTEGER,
    FOREIGN KEY (activity_id) REFERENCES activities(id),
    FOREIGN KEY (category_id) REFERENCES skill_categories(id)
);

CREATE TABLE IF NOT EXISTS skill_prerequisites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    skill_id INTEGER NOT NULL,
    prerequisite_skill_id INTEGER NOT NULL,
    required_mastery_level REAL DEFAULT 0.6,
    FOREIGN KEY (skill_id) REFERENCES activity_skills(id),
    FOREIGN KEY (prerequisite_skill_id) REFERENCES activity_skills(id)
);

CREATE TABLE IF NOT EXISTS user_skill_progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    skill_id INTEGER NOT NULL,
    mastery_level REAL NOT NULL DEFAULT 0,
    last_practiced_at INTEGER,
    total_practice_time_ms INTEGER DEFAULT 0,
    practice_count INTEGER DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (skill_id) REFERENCES activity_skills(id),
    UNIQUE (user_id, skill_id)
);

-- Add a view to calculate the available skills based on prerequisites
CREATE VIEW IF NOT EXISTS available_user_skills AS
SELECT
    us.user_id,
    s.id as skill_id,
    s.name as skill_name,
    s.difficulty,
    us.mastery_level,
    CASE
        WHEN us.mastery_level IS NULL THEN 0
        WHEN p.prerequisite_count IS NULL THEN 1
        WHEN p.prerequisites_met >= p.prerequisite_count THEN 1
        ELSE 0
    END as is_available
FROM
    activity_skills s
    LEFT JOIN user_skill_progress us ON s.id = us.skill_id
    LEFT JOIN (
        SELECT
            sp.skill_id,
            COUNT(sp.prerequisite_skill_id) as prerequisite_count,
            SUM(
                CASE
                    WHEN usp.mastery_level >= sp.required_mastery_level THEN 1
                    ELSE 0
                END
            ) as prerequisites_met
        FROM
            skill_prerequisites sp
            LEFT JOIN user_skill_progress usp ON sp.prerequisite_skill_id = usp.skill_id
        GROUP BY
            sp.skill_id,
            usp.user_id
    ) p ON s.id = p.skill_id;

-- Add activity_type column to activities table
ALTER TABLE
    activities
ADD
    COLUMN activity_type TEXT DEFAULT 'exercise';

-- Add complexity level to activities
ALTER TABLE
    activities
ADD
    COLUMN complexity_level INTEGER DEFAULT 1;