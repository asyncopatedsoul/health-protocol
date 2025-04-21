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

let sqlite_path = "sqlite:local.db";
// let db: Database = {} as Database;

let users: User[] = $state([] as User[]);
let protocols: Protocol[] = $state([] as Protocol[]);
let activities: Activity[] = $state([] as Activity[]);
let activityProtocols: ActivityProtocol[] = $state([] as ActivityProtocol[]);
let activityHistory: ActivityHistory[] = $state([] as ActivityHistory[]);

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
      "INSERT INTO activities (name, description, video_guide, image_guide) VALUES ($1, $2, $3, $4) RETURNING id",
      [activity.name, activity.description || "", activity.videoGuide || "", activity.imageGuide || ""]
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

    }
  };
}