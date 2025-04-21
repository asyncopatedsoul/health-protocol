import Database from "@tauri-apps/plugin-sql";
import { get } from "svelte/store";

type User = {
  id: number;
  name: string;
  email: string;
};

type Protocol = {
  id: number;
  name: string;
  sourceCode: string;
  description: string;
}

type Activity = {
  id: number;
  name: string;
  description: string;
  videoGuide: string;
  imageGuide: string;
  activityType?: string;
  complexityLevel?: number;
}

type ActivityProtocol = {
  id: number;
  activityId: number;
  protocolId: number;
  parameters: string;
  createdAt: number;
}

type ActivityHistory = {
  id: number;
  userId: number;
  activityProtocolId: number;
  parameters: string;
  startTime: string;
  endTime: string;
  startTimeMs: number;
  endTimeMs: number;
  status: string;
  notes: string;
}

type SkillCategory = {
  id: number;
  name: string;
  description: string;
  color: string;
}

type ActivitySkill = {
  id: number;
  activityId: number;
  name: string;
  description: string;
  difficulty: number;
  categoryId?: number;
}

type SkillPrerequisite = {
  id: number;
  skillId: number;
  prerequisiteSkillId: number;
  requiredMasteryLevel: number;
}

type UserSkillProgress = {
  id: number;
  userId: number;
  skillId: number;
  masteryLevel: number;
  lastPracticedAt?: number;
  totalPracticeTimeMs: number;
  practiceCount: number;
}

type AvailableUserSkill = {
  userId: number;
  skillId: number;
  skillName: string;
  difficulty: number;
  masteryLevel: number;
  isAvailable: number;
}

let sqlite_path = "sqlite:local.db";
// let db: Database = {} as Database;

let users: User[] = $state([] as User[]);
let protocols: Protocol[] = $state([] as Protocol[]);
let activities: Activity[] = $state([] as Activity[]);
let activityProtocols: ActivityProtocol[] = $state([] as ActivityProtocol[]);
let activityHistory: ActivityHistory[] = $state([] as ActivityHistory[]);
let skillCategories: SkillCategory[] = $state([] as SkillCategory[]);
let activitySkills: ActivitySkill[] = $state([] as ActivitySkill[]);
let skillPrerequisites: SkillPrerequisite[] = $state([] as SkillPrerequisite[]);
let userSkillProgress: UserSkillProgress[] = $state([] as UserSkillProgress[]);
let availableUserSkills: AvailableUserSkill[] = $state([] as AvailableUserSkill[]);

let currentUser: User = $state({} as User);

// getUsers();
// getActivities();
// getProtocols();
// getActivityHistory();

async function getUsers(db: Database) {
  try {
    const dbRecords = await db.select("SELECT * FROM users");
    console.log(dbRecords);
    users = dbRecords as User[];
  } catch (error) {
    console.log(error);
    return [] as User[];
  }
}

async function addUser(user: User) {
  try {
    const db = await Database.load(sqlite_path);
    await db.execute("INSERT INTO users (name, email) VALUES ($1, $2)", [
      user.name,
      user.email,
    ]);
    await getUsers(db);
  } catch (error) {
    console.log(error);
  }
}

async function getActivities(db: Database) {
  try {
    const dbRecords = await db.select("SELECT * FROM activities");
    console.log(dbRecords);
    activities = dbRecords as Activity[];
  } catch (error) {
    console.log(error);
    return [] as Activity[];
  }
}

async function getProtocols(db: Database) {
  try {
    const dbRecords = await db.select("SELECT * FROM protocols");
    console.log(dbRecords);
    protocols = dbRecords as Protocol[];
  } catch (error) {
    console.log(error);
    return [] as Protocol[];
  }
}

async function getActivityProtocols(db: Database) {
  try {
    const dbRecords = await db.select("SELECT * FROM activity_protocols");
    console.log(dbRecords);
    activityProtocols = dbRecords as ActivityProtocol[];
  } catch (error) {
    console.log(error);
    return [] as ActivityProtocol[];
  }
}

async function getActivityHistory(db: Database) {
  try {
    const dbRecords = await db.select("SELECT * FROM activity_history");
    console.log(dbRecords);
    activityHistory = dbRecords as ActivityHistory[];
  } catch (error) {
    console.log(error);
    return [] as ActivityHistory[];
  }
}

async function getSkillCategories(db: Database) {
  try {
    const dbRecords = await db.select("SELECT * FROM skill_categories");
    console.log(dbRecords);
    skillCategories = dbRecords as SkillCategory[];
  } catch (error) {
    console.log(error);
    return [] as SkillCategory[];
  }
}

async function getActivitySkills(db: Database) {
  try {
    const dbRecords = await db.select("SELECT * FROM activity_skills");
    console.log(dbRecords);
    activitySkills = dbRecords as ActivitySkill[];
  } catch (error) {
    console.log(error);
    return [] as ActivitySkill[];
  }
}

async function getSkillPrerequisites(db: Database) {
  try {
    const dbRecords = await db.select("SELECT * FROM skill_prerequisites");
    console.log(dbRecords);
    skillPrerequisites = dbRecords as SkillPrerequisite[];
  } catch (error) {
    console.log(error);
    return [] as SkillPrerequisite[];
  }
}

async function getUserSkillProgress(db: Database, userId: number) {
  try {
    const dbRecords = await db.select("SELECT * FROM user_skill_progress WHERE user_id = $1", [userId]);
    console.log(dbRecords);
    userSkillProgress = dbRecords as UserSkillProgress[];
  } catch (error) {
    console.log(error);
    return [] as UserSkillProgress[];
  }
}

async function getAvailableUserSkills(db: Database, userId: number) {
  try {
    const dbRecords = await db.select("SELECT * FROM available_user_skills WHERE user_id = $1", [userId]);
    console.log(dbRecords);
    availableUserSkills = dbRecords as AvailableUserSkill[];
  } catch (error) {
    console.log(error);
    return [] as AvailableUserSkill[];
  }
}

async function addProtocol(protocol: Protocol) {
  try {
    const db = await Database.load(sqlite_path);
    const result = await db.execute(
      "INSERT INTO protocols (name, source_code, description) VALUES ($1, $2, $3) RETURNING id",
      [protocol.name, protocol.sourceCode, protocol.description || ""]
    );
    console.log("Protocol created:", result);
    await getProtocols(db);
    return result.lastInsertId;
  } catch (error) {
    console.log(error);
    return null;
  }
}

async function addActivity(activity: Omit<Activity, 'id'>) {
  try {
    const db = await Database.load(sqlite_path);
    const result = await db.execute(
      "INSERT INTO activities (name, description, video_guide, image_guide, activity_type, complexity_level) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
      [
        activity.name, 
        activity.description || "", 
        activity.videoGuide || "", 
        activity.imageGuide || "",
        activity.activityType || "exercise",
        activity.complexityLevel || 1
      ]
    );
    console.log("Activity created:", result);
    await getActivities(db);
    return result.lastInsertId;
  } catch (error) {
    console.log(error);
    return null;
  }
}

async function findActivityByName(name: string) {
  try {
    const db = await Database.load(sqlite_path);
    const activities = await db.select(
      "SELECT * FROM activities WHERE name = $1",
      [name]
    );
    return activities.length > 0 ? activities[0] : null;
  } catch (error) {
    console.log(error);
    return null;
  }
}

async function addActivityProtocol(activityProtocol: Omit<ActivityProtocol, 'id'>) {
  try {
    const db = await Database.load(sqlite_path);

    // Check if this activity_protocol already exists
    const existing = await db.select(
      "SELECT * FROM activity_protocols WHERE activity_id = $1 AND protocol_id = $2 AND parameters = $3",
      [activityProtocol.activityId, activityProtocol.protocolId, activityProtocol.parameters]
    );

    if (existing.length > 0) {
      console.log("Activity protocol already exists:", existing[0]);
      return existing[0].id;
    }

    const result = await db.execute(
      "INSERT INTO activity_protocols (activity_id, protocol_id, parameters, created_at) VALUES ($1, $2, $3, $4) RETURNING id",
      [activityProtocol.activityId, activityProtocol.protocolId, activityProtocol.parameters, Date.now()]
    );
    console.log("Activity protocol created:", result);
    await getActivityProtocols(db);
    return result.lastInsertId;
  } catch (error) {
    console.log(error);
    return null;
  }
}

async function addSkillCategory(category: Omit<SkillCategory, 'id'>) {
  try {
    const db = await Database.load(sqlite_path);
    const result = await db.execute(
      "INSERT INTO skill_categories (name, description, color) VALUES ($1, $2, $3) RETURNING id",
      [category.name, category.description || "", category.color || "#808080"]
    );
    console.log("Skill category created:", result);
    await getSkillCategories(db);
    return result.lastInsertId;
  } catch (error) {
    console.log(error);
    return null;
  }
}

async function addActivitySkill(skill: Omit<ActivitySkill, 'id'>) {
  try {
    const db = await Database.load(sqlite_path);
    
    // Check if this skill already exists for this activity
    const existing = await db.select(
      "SELECT * FROM activity_skills WHERE activity_id = $1 AND name = $2",
      [skill.activityId, skill.name]
    );

    if (existing.length > 0) {
      console.log("Activity skill already exists:", existing[0]);
      return existing[0].id;
    }

    const result = await db.execute(
      "INSERT INTO activity_skills (activity_id, name, description, difficulty, category_id) VALUES ($1, $2, $3, $4, $5) RETURNING id",
      [skill.activityId, skill.name, skill.description || "", skill.difficulty, skill.categoryId || null]
    );
    console.log("Activity skill created:", result);
    await getActivitySkills(db);
    return result.lastInsertId;
  } catch (error) {
    console.log(error);
    return null;
  }
}

async function addSkillPrerequisite(prerequisite: Omit<SkillPrerequisite, 'id'>) {
  try {
    const db = await Database.load(sqlite_path);
    
    // Check if this prerequisite relationship already exists
    const existing = await db.select(
      "SELECT * FROM skill_prerequisites WHERE skill_id = $1 AND prerequisite_skill_id = $2",
      [prerequisite.skillId, prerequisite.prerequisiteSkillId]
    );

    if (existing.length > 0) {
      console.log("Skill prerequisite already exists:", existing[0]);
      return existing[0].id;
    }

    const result = await db.execute(
      "INSERT INTO skill_prerequisites (skill_id, prerequisite_skill_id, required_mastery_level) VALUES ($1, $2, $3) RETURNING id",
      [prerequisite.skillId, prerequisite.prerequisiteSkillId, prerequisite.requiredMasteryLevel || 0.6]
    );
    console.log("Skill prerequisite created:", result);
    await getSkillPrerequisites(db);
    return result.lastInsertId;
  } catch (error) {
    console.log(error);
    return null;
  }
}

async function updateUserSkillProgress(progress: UserSkillProgress) {
  try {
    const db = await Database.load(sqlite_path);
    
    // Check if the user already has progress for this skill
    const existing = await db.select(
      "SELECT * FROM user_skill_progress WHERE user_id = $1 AND skill_id = $2",
      [progress.userId, progress.skillId]
    );

    if (existing.length > 0) {
      // Update existing record
      const result = await db.execute(
        "UPDATE user_skill_progress SET mastery_level = $1, last_practiced_at = $2, total_practice_time_ms = $3, practice_count = $4 WHERE id = $5 RETURNING id",
        [
          progress.masteryLevel, 
          progress.lastPracticedAt || Date.now(), 
          progress.totalPracticeTimeMs, 
          progress.practiceCount,
          existing[0].id
        ]
      );
      console.log("User skill progress updated:", result);
      await getUserSkillProgress(db, progress.userId);
      return existing[0].id;
    } else {
      // Insert new record
      const result = await db.execute(
        "INSERT INTO user_skill_progress (user_id, skill_id, mastery_level, last_practiced_at, total_practice_time_ms, practice_count) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
        [
          progress.userId, 
          progress.skillId, 
          progress.masteryLevel, 
          progress.lastPracticedAt || Date.now(), 
          progress.totalPracticeTimeMs || 0, 
          progress.practiceCount || 1
        ]
      );
      console.log("User skill progress created:", result);
      await getUserSkillProgress(db, progress.userId);
      return result.lastInsertId;
    }
  } catch (error) {
    console.log(error);
    return null;
  }
}

function parseProtocolSourceCode(sourceCode: string) {
  const lines = sourceCode.trim().split('\n');
  const parsedActivities = lines.map(line => {
    // Match pattern: activity_name followed by optional parameters
    // Look for the first digit or 'x' to determine where parameters begin
    const firstNumIndex = line.search(/[0-9x]/);
    if (firstNumIndex === -1) {
      // No numbers found, entire line is activity name
      return {
        name: line.trim(),
        parameters: ""
      };
    }

    // Split at the first number or 'x'
    let activityName = line.substring(0, firstNumIndex).trim();
    let parameters = line.substring(firstNumIndex).trim();

    // Handle cases where activity name might end with letters after a space
    // but before numbers (e.g., "Senada get up 8 x 4")
    if (!activityName && parameters) {
      // If activity name is empty but we have parameters, the whole line is the activity
      return {
        name: line.trim(),
        parameters: ""
      };
    }

    return {
      name: activityName,
      parameters: parameters
    };
  }).filter(activity => activity && activity.name);

  return parsedActivities;
}

export function bindUsers() {
  return {
    get all() { return users; },
    add: async function (user: User) {
      await addUser(user);
    },
  };
}

export function bindActivities() {
  return {
    get all() { return activities; },
    findByName: async function (name: string) {
      return await findActivityByName(name);
    },
    add: async function (activity: Omit<Activity, 'id'>) {
      return await addActivity(activity);
    },
  };
}

export function bindProtocols() {
  return {
    get all() { return protocols; },
    add: async function (protocol: Protocol) {
      return await addProtocol(protocol);
    },
    createWithParsing: async function (name: string, sourceCode: string, description?: string) {
      const protocol = {
        id: 0, // temporary
        name,
        sourceCode,
        description: description || ""
      };

      const protocolId = await addProtocol(protocol);
      if (!protocolId) {
        throw new Error("Failed to create protocol");
      }

      const parsedActivities = parseProtocolSourceCode(sourceCode);

      for (const parsedActivity of parsedActivities) {
        let activity = await findActivityByName(parsedActivity.name);

        if (!activity) {
          const newActivityId = await addActivity({
            name: parsedActivity.name,
            description: "",
            videoGuide: "",
            imageGuide: ""
          });

          if (!newActivityId) {
            console.error(`Failed to create activity: ${parsedActivity.name}`);
            continue;
          }

          activity = await findActivityByName(parsedActivity.name);
        }

        if (activity) {
          await addActivityProtocol({
            activityId: activity.id,
            protocolId: protocolId,
            parameters: parsedActivity.parameters,
            createdAt: Date.now()
          });
        }
      }

      return protocolId;
    }
  };
}

export function bindActivityProtocols() {
  return {
    get all() { return activityProtocols; },
    getByProtocolId: function (protocolId: number) {
      return activityProtocols.filter(ap => ap.protocolId === protocolId);
    },
    getWithDetails: function (protocolId: number) {
      console.log("getWithDetails", protocolId);
      console.log("activityProtocols",activityProtocols);
      console.log("activities", activities);
      return activityProtocols
        .filter(ap => ap.protocol_id === protocolId)
        .map(ap => {
          console.log(activities);
          const activity = activities.find(a => a.id === ap.activity_id);
          return {
            ...ap,
            activityName: activity?.name || ""
          };
        });
    }
  };
}

export function bindActivityHistory() {
  return {
    get all() { return activityHistory; },
  };
}

export function bindSkillCategories() {
  return {
    get all() { return skillCategories; },
    add: async function(category: Omit<SkillCategory, 'id'>) {
      return await addSkillCategory(category);
    }
  };
}

export function bindActivitySkills() {
  return {
    get all() { return activitySkills; },
    getByActivity: function(activityId: number) {
      return activitySkills.filter(skill => skill.activityId === activityId);
    },
    getByCategory: function(categoryId: number) {
      return activitySkills.filter(skill => skill.categoryId === categoryId);
    },
    add: async function(skill: Omit<ActivitySkill, 'id'>) {
      return await addActivitySkill(skill);
    }
  };
}

export function bindSkillPrerequisites() {
  return {
    get all() { return skillPrerequisites; },
    getBySkill: function(skillId: number) {
      return skillPrerequisites.filter(prereq => prereq.skillId === skillId);
    },
    getPrerequisitesForSkill: function(skillId: number) {
      return skillPrerequisites
        .filter(prereq => prereq.skillId === skillId)
        .map(prereq => {
          const prerequisiteSkill = activitySkills.find(skill => skill.id === prereq.prerequisiteSkillId);
          return {
            ...prereq,
            prerequisiteSkillName: prerequisiteSkill?.name || ""
          };
        });
    },
    add: async function(prerequisite: Omit<SkillPrerequisite, 'id'>) {
      return await addSkillPrerequisite(prerequisite);
    }
  };
}

export function bindUserSkillProgress() {
  return {
    get all() { return userSkillProgress; },
    getByUser: function(userId: number) {
      return userSkillProgress.filter(progress => progress.userId === userId);
    },
    getByUserWithDetails: function(userId: number) {
      return userSkillProgress
        .filter(progress => progress.userId === userId)
        .map(progress => {
          const skill = activitySkills.find(skill => skill.id === progress.skillId);
          const activity = skill ? activities.find(activity => activity.id === skill.activityId) : null;
          return {
            ...progress,
            skillName: skill?.name || "",
            activityName: activity?.name || "",
            difficulty: skill?.difficulty || 1
          };
        });
    },
    updateProgress: async function(progress: UserSkillProgress) {
      return await updateUserSkillProgress(progress);
    }
  };
}

export function bindAvailableUserSkills() {
  return {
    get all() { return availableUserSkills; },
    getByUser: function(userId: number) {
      return availableUserSkills.filter(skill => skill.userId === userId);
    },
    getAvailableSkills: function(userId: number) {
      return availableUserSkills.filter(skill => skill.userId === userId && skill.isAvailable === 1);
    }
  };
}

export function bindSession() {
  return {
    get currentUser() { return currentUser; },
    set currentUser(user: User) { currentUser = user; },
    loadData: async function () {
      const db = await Database.load(sqlite_path);
      console.log(db);

      await getUsers(db);
      await getActivities(db);
      await getProtocols(db);
      await getActivityProtocols(db);
      await getActivityHistory(db);
      await getSkillCategories(db);
      await getActivitySkills(db);
      await getSkillPrerequisites(db);
      
      // Only load user-specific data if there's a current user
      if (currentUser && currentUser.id) {
        await getUserSkillProgress(db, currentUser.id);
        await getAvailableUserSkills(db, currentUser.id);
      }
    }
  };
}