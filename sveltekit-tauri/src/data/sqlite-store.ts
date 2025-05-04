import Database from "@tauri-apps/plugin-sql";
import { DataStore, User, Protocol, Activity, ActivityProtocol, ActivityHistory, SkillCategory, ActivitySkill, SkillPrerequisite, UserSkillProgress, AvailableUserSkill } from "./types";

// SQLite implementation of the DataStore interface
export class SQLiteStore implements DataStore {
  private db: Database | null = null;
  private sqlite_path = "sqlite:local.db";

  async initialize(): Promise<void> {
    try {
      this.db = await Database.load(this.sqlite_path);
      console.log("SQLite database initialized");
    } catch (error) {
      console.error("Failed to initialize SQLite database:", error);
      throw error;
    }
  }

  async select<T>(query: string, params: any[] = []): Promise<T[]> {
    if (!this.db) {
      await this.initialize();
    }
    try {
      const result = await this.db!.select<T>(query, params);
      return result;
    } catch (error) {
      console.error("SQLite select error:", error);
      return [];
    }
  }

  async execute(query: string, params: any[] = []): Promise<{ lastInsertId?: number, rowsAffected?: number }> {
    if (!this.db) {
      await this.initialize();
    }
    try {
      const result = await this.db!.execute(query, params);
      return {
        lastInsertId: result.lastInsertId,
        rowsAffected: result.rowsAffected
      };
    } catch (error) {
      console.error("SQLite execute error:", error);
      return {};
    }
  }

  async getUsers(): Promise<User[]> {
    return await this.select<User>("SELECT * FROM users");
  }

  async getActivities(): Promise<Activity[]> {
    return await this.select<Activity>("SELECT * FROM activities");
  }

  async getProtocols(): Promise<Protocol[]> {
    return await this.select<Protocol>("SELECT * FROM protocols");
  }

  async getActivityProtocols(): Promise<ActivityProtocol[]> {
    return await this.select<ActivityProtocol>("SELECT * FROM activity_protocols");
  }

  async getActivityHistory(): Promise<ActivityHistory[]> {
    return await this.select<ActivityHistory>("SELECT * FROM activity_history");
  }

  async getSkillCategories(): Promise<SkillCategory[]> {
    return await this.select<SkillCategory>("SELECT * FROM skill_categories");
  }

  async getActivitySkills(): Promise<ActivitySkill[]> {
    return await this.select<ActivitySkill>("SELECT * FROM activity_skills");
  }

  async getSkillPrerequisites(): Promise<SkillPrerequisite[]> {
    return await this.select<SkillPrerequisite>("SELECT * FROM skill_prerequisites");
  }

  async getUserSkillProgress(userId: number): Promise<UserSkillProgress[]> {
    return await this.select<UserSkillProgress>(
      "SELECT * FROM user_skill_progress WHERE user_id = $1",
      [userId]
    );
  }

  async getAvailableUserSkills(userId: number): Promise<AvailableUserSkill[]> {
    return await this.select<AvailableUserSkill>(
      "SELECT * FROM available_user_skills WHERE user_id = $1",
      [userId]
    );
  }

  async findActivityByName(name: string): Promise<Activity | null> {
    const activities = await this.select<Activity>(
      "SELECT * FROM activities WHERE name = $1",
      [name]
    );
    return activities.length > 0 ? activities[0] : null;
  }
}
