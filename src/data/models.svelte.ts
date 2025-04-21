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
  parameters: string;
  description: string;
  videoGuide: string;
  imageGuide: string;
}

type ActivityHistory = {
  id: number;
  userId: number;
  activityId: number;
  protocolId: number;
  startTime: number;
  endTime: number;
  status: string;
  notes: string;
}

let sqlite_path = "sqlite:local.db";
// let db: Database = {} as Database;

let users: User[] = $state([] as User[]);
let protocols: Protocol[] = $state([] as Protocol[]);
let activities: Activity[] = $state([] as Activity[]);
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
      await getActivityHistory(db);

    }
  };
}