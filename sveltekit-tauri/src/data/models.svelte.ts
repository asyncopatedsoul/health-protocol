import { getDataStore } from './store-factory';
import { get } from "svelte/store";
import { 
  User, 
  Protocol, 
  Activity, 
  ActivityProtocol, 
  ActivityHistory, 
  SkillCategory, 
  ActivitySkill, 
  SkillPrerequisite, 
  UserSkillProgress, 
  AvailableUserSkill, 
  DataStore 
} from './types';

// State variables to hold data
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

// Helper functions to interact with the data store
async function retrieveUsers() {
  try {
    const store = await getDataStore();
    const dbRecords = await store.getUsers();
    console.log(dbRecords);
    users = dbRecords;
    return dbRecords;
  } catch (error) {
    console.log(error);
    return [] as User[];
  }
}

async function addUser(user: User) {
  try {
    const store = await getDataStore();
    await store.execute("INSERT INTO users (name, email) VALUES ($1, $2)", [
      user.name,
      user.email,
    ]);
    await retrieveUsers();
  } catch (error) {
    console.log(error);
  }
}

async function retrieveActivities() {
  try {
    const store = await getDataStore();
    const dbRecords = await store.getActivities();
    console.log(dbRecords);
    activities = dbRecords;
    return dbRecords;
  } catch (error) {
    console.log(error);
    return [] as Activity[];
  }
}

async function retrieveProtocols() {
  try {
    const store = await getDataStore();
    const dbRecords = await store.getProtocols();
    console.log(dbRecords);
    protocols = dbRecords;
    return dbRecords;
  } catch (error) {
    console.log(error);
    return [] as Protocol[];
  }
}

async function retrieveActivityProtocols() {
  try {
    const store = await getDataStore();
    const dbRecords = await store.getActivityProtocols();
    console.log(dbRecords);
    activityProtocols = dbRecords;
    return dbRecords;
  } catch (error) {
    console.log(error);
    return [] as ActivityProtocol[];
  }
}

async function retrieveActivityHistory() {
  try {
    const store = await getDataStore();
    const dbRecords = await store.getActivityHistory();
    console.log(dbRecords);
    activityHistory = dbRecords;
    return dbRecords;
  } catch (error) {
    console.log(error);
    return [] as ActivityHistory[];
  }
}

async function retrieveSkillCategories() {
  try {
    const store = await getDataStore();
    const dbRecords = await store.getSkillCategories();
    console.log(dbRecords);
    skillCategories = dbRecords;
    return dbRecords;
  } catch (error) {
    console.log(error);
    return [] as SkillCategory[];
  }
}

async function retrieveActivitySkills() {
  try {
    const store = await getDataStore();
    const dbRecords = await store.getActivitySkills();
    console.log(dbRecords);
    activitySkills = dbRecords;
    return dbRecords;
  } catch (error) {
    console.log(error);
    return [] as ActivitySkill[];
  }
}

async function retrieveSkillPrerequisites() {
  try {
    const store = await getDataStore();
    const dbRecords = await store.getSkillPrerequisites();
    console.log(dbRecords);
    skillPrerequisites = dbRecords;
    return dbRecords;
  } catch (error) {
    console.log(error);
    return [] as SkillPrerequisite[];
  }
}

async function retrieveUserSkillProgress(userId: number) {
  try {
    const store = await getDataStore();
    const dbRecords = await store.getUserSkillProgress(userId);
    console.log(dbRecords);
    userSkillProgress = dbRecords;
    return dbRecords;
  } catch (error) {
    console.log(error);
    return [] as UserSkillProgress[];
  }
}

async function retrieveAvailableUserSkills(userId: number) {
  try {
    const store = await getDataStore();
    const dbRecords = await store.getAvailableUserSkills(userId);
    console.log(dbRecords);
    availableUserSkills = dbRecords;
    return dbRecords;
  } catch (error) {
    console.log(error);
    return [] as AvailableUserSkill[];
  }
}

async function addProtocol(protocol: Protocol) {
  try {
    const store = await getDataStore();
    const result = await store.execute(
      "INSERT INTO protocols (name, source_code, description) VALUES ($1, $2, $3) RETURNING id",
      [protocol.name, protocol.sourceCode, protocol.description || ""]
    );
    console.log("Protocol created:", result);
    await retrieveProtocols();
    return result.lastInsertId;
  } catch (error) {
    console.log(error);
    return null;
  }
}

async function addActivity(activity: Omit<Activity, 'id'>) {
  try {
    const store = await getDataStore();
    const result = await store.execute(
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
    await retrieveActivities();
    return result.lastInsertId;
  } catch (error) {
    console.log(error);
    return null;
  }
}

async function findActivityByName(name: string) {
  try {
    const store = await getDataStore();
    return await store.findActivityByName(name);
  } catch (error) {
    console.log(error);
    return null;
  }
}

async function addActivityProtocol(activityProtocol: Omit<ActivityProtocol, 'id'>) {
  try {
    const store = await getDataStore();

    // Check if this activity_protocol already exists
    const existing = await store.select(
      "SELECT * FROM activity_protocols WHERE activity_id = $1 AND protocol_id = $2 AND parameters = $3",
      [activityProtocol.activityId, activityProtocol.protocolId, activityProtocol.parameters]
    );

    if (existing.length > 0) {
      console.log("Activity protocol already exists:", existing[0]);
      return existing[0].id;
    }

    const result = await store.execute(
      "INSERT INTO activity_protocols (activity_id, protocol_id, parameters, created_at) VALUES ($1, $2, $3, $4) RETURNING id",
      [activityProtocol.activityId, activityProtocol.protocolId, activityProtocol.parameters, Date.now()]
    );
    console.log("Activity protocol created:", result);
    await retrieveActivityProtocols();
    return result.lastInsertId;
  } catch (error) {
    console.log(error);
    return null;
  }
}

async function addSkillCategory(category: Omit<SkillCategory, 'id'>) {
  try {
    const store = await getDataStore();
    const result = await store.execute(
      "INSERT INTO skill_categories (name, description, color) VALUES ($1, $2, $3) RETURNING id",
      [category.name, category.description || "", category.color || "#808080"]
    );
    console.log("Skill category created:", result);
    await retrieveSkillCategories();
    return result.lastInsertId;
  } catch (error) {
    console.log(error);
    return null;
  }
}

async function addActivitySkill(skill: Omit<ActivitySkill, 'id'>) {
  try {
    const store = await getDataStore();

    // Check if this skill already exists for this activity
    const existing = await store.select(
      "SELECT * FROM activity_skills WHERE activity_id = $1 AND name = $2",
      [skill.activityId, skill.name]
    );

    if (existing.length > 0) {
      console.log("Activity skill already exists:", existing[0]);
      return existing[0].id;
    }

    const result = await store.execute(
      "INSERT INTO activity_skills (activity_id, name, description, difficulty, category_id) VALUES ($1, $2, $3, $4, $5) RETURNING id",
      [skill.activityId, skill.name, skill.description || "", skill.difficulty, skill.categoryId || null]
    );
    console.log("Activity skill created:", result);
    await retrieveActivitySkills();
    return result.lastInsertId;
  } catch (error) {
    console.log(error);
    return null;
  }
}

async function addSkillPrerequisite(prerequisite: Omit<SkillPrerequisite, 'id'>) {
  try {
    const store = await getDataStore();

    // Check if this prerequisite relationship already exists
    const existing = await store.select(
      "SELECT * FROM skill_prerequisites WHERE skill_id = $1 AND prerequisite_skill_id = $2",
      [prerequisite.skillId, prerequisite.prerequisiteSkillId]
    );

    if (existing.length > 0) {
      console.log("Skill prerequisite already exists:", existing[0]);
      return existing[0].id;
    }

    const result = await store.execute(
      "INSERT INTO skill_prerequisites (skill_id, prerequisite_skill_id, required_mastery_level) VALUES ($1, $2, $3) RETURNING id",
      [prerequisite.skillId, prerequisite.prerequisiteSkillId, prerequisite.requiredMasteryLevel || 0.6]
    );
    console.log("Skill prerequisite created:", result);
    await retrieveSkillPrerequisites();
    return result.lastInsertId;
  } catch (error) {
    console.log(error);
    return null;
  }
}

async function updateUserSkillProgress(progress: UserSkillProgress) {
  try {
    const store = await getDataStore();

    // Check if the user already has progress for this skill
    const existing = await store.select(
      "SELECT * FROM user_skill_progress WHERE user_id = $1 AND skill_id = $2",
      [progress.userId, progress.skillId]
    );

    if (existing.length > 0) {
      // Update existing record
      const result = await store.execute(
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
      await retrieveUserSkillProgress(progress.userId);
      return existing[0].id;
    } else {
      // Insert new record
      const result = await store.execute(
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
      await retrieveUserSkillProgress(progress.userId);
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
      const store = await getDataStore();
      console.log(store);

      await retrieveUsers();
      await retrieveActivities();
      await retrieveProtocols();
      await retrieveActivityProtocols();
      await retrieveActivityHistory();
      await retrieveSkillCategories();
      await retrieveActivitySkills();
      await retrieveSkillPrerequisites();

      // Only load user-specific data if there's a current user
      if (currentUser && currentUser.id) {
        await retrieveUserSkillProgress(currentUser.id);
        await retrieveAvailableUserSkills(currentUser.id);
      }
    }
  };
}