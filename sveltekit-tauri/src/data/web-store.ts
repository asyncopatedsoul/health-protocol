import { DataStore, User, Protocol, Activity, ActivityProtocol, ActivityHistory, SkillCategory, ActivitySkill, SkillPrerequisite, UserSkillProgress, AvailableUserSkill } from "./types";

// A simple query parser that accepts only basic SELECT statements
// This is not a full-fledged SQL parser but handles basic queries used in the app
function parseSimpleSelectQuery(query: string, params: any[] = []): { 
  table: string;
  where: { column: string; value: any; operator: string; }[] | null;
} {
  // Replace parameters with their values
  let processedQuery = query;
  params.forEach((param, index) => {
    processedQuery = processedQuery.replace(`$${index + 1}`, typeof param === 'string' ? `'${param}'` : String(param));
  });

  const fromRegex = /FROM\s+([a-zA-Z_]+)/i;
  const whereRegex = /WHERE\s+(.+?)(?:ORDER BY|GROUP BY|LIMIT|$)/i;
  
  const fromMatch = processedQuery.match(fromRegex);
  const whereMatch = processedQuery.match(whereRegex);
  
  if (!fromMatch) {
    throw new Error(`Cannot parse table name from query: ${query}`);
  }
  
  const table = fromMatch[1];
  let where = null;
  
  if (whereMatch) {
    const whereClause = whereMatch[1].trim();
    where = whereClause.split(/\s+AND\s+/i).map(condition => {
      // Parse a simple condition like "column = value" or "column IN (values)"
      const parts = condition.match(/([a-zA-Z_]+)\s*(=|IN|\<|\>|\<=|\>=)\s*(.+)/i);
      if (parts) {
        return {
          column: parts[1],
          operator: parts[2],
          value: parts[3].replace(/['"]/g, '')
        };
      }
      return null;
    }).filter(Boolean) as { column: string; value: any; operator: string; }[];
  }
  
  return { table, where };
}

// Helper function to apply simple WHERE filters
function applyWhere<T>(
  items: T[], 
  where: { column: string; value: any; operator: string; }[] | null
): T[] {
  if (!where) return items;
  
  return items.filter(item => {
    return where.every(condition => {
      const itemValue = (item as any)[condition.column];
      
      switch (condition.operator.toLowerCase()) {
        case '=':
          return String(itemValue) === String(condition.value);
        case 'in':
          // Very simple IN operator parsing (only handles basic cases)
          const values = condition.value
            .replace(/[()]/g, '')
            .split(',')
            .map(v => v.trim());
          return values.includes(String(itemValue));
        case '<':
          return Number(itemValue) < Number(condition.value);
        case '>':
          return Number(itemValue) > Number(condition.value);
        case '<=':
          return Number(itemValue) <= Number(condition.value);
        case '>=':
          return Number(itemValue) >= Number(condition.value);
        default:
          return false;
      }
    });
  });
}

// Web implementation of the DataStore interface using localStorage
export class WebStore implements DataStore {
  private stores: {
    users: User[];
    protocols: Protocol[];
    activities: Activity[];
    activity_protocols: ActivityProtocol[];
    activity_history: ActivityHistory[];
    skill_categories: SkillCategory[];
    activity_skills: ActivitySkill[];
    skill_prerequisites: SkillPrerequisite[];
    user_skill_progress: UserSkillProgress[];
    available_user_skills: AvailableUserSkill[];
  };

  private nextIds: {
    [key: string]: number;
  } = {};

  constructor() {
    // Initialize empty stores
    this.stores = {
      users: [],
      protocols: [],
      activities: [],
      activity_protocols: [],
      activity_history: [],
      skill_categories: [],
      activity_skills: [],
      skill_prerequisites: [],
      user_skill_progress: [],
      available_user_skills: []
    };
    
    // Initialize next IDs for each store
    Object.keys(this.stores).forEach(storeName => {
      this.nextIds[storeName] = 1;
    });
  }

  async initialize(): Promise<void> {
    try {
      // Load data from localStorage if it exists
      Object.keys(this.stores).forEach(storeName => {
        const storedData = localStorage.getItem(`health_protocol_${storeName}`);
        if (storedData) {
          this.stores[storeName as keyof typeof this.stores] = JSON.parse(storedData);
          
          // Set the next ID based on the highest existing ID
          const maxId = Math.max(
            ...this.stores[storeName as keyof typeof this.stores].map(item => (item as any).id || 0), 
            0
          );
          this.nextIds[storeName] = maxId + 1;
        }
      });
      
      // Initialize available_user_skills view
      this.updateAvailableUserSkillsView();
      
      console.log("Web store initialized from localStorage");
    } catch (error) {
      console.error("Failed to initialize web store:", error);
    }
  }

  private saveToLocalStorage(storeName: string): void {
    localStorage.setItem(
      `health_protocol_${storeName}`, 
      JSON.stringify(this.stores[storeName as keyof typeof this.stores])
    );
  }

  // Update the available_user_skills view (mimicking the SQL VIEW)
  private updateAvailableUserSkillsView(): void {
    const availableSkills: AvailableUserSkill[] = [];
    
    // Get distinct user IDs from user_skill_progress
    const userIds = [...new Set(this.stores.user_skill_progress.map(progress => progress.userId))];
    
    for (const userId of userIds) {
      for (const skill of this.stores.activity_skills) {
        const userProgress = this.stores.user_skill_progress.find(
          progress => progress.userId === userId && progress.skillId === skill.id
        );
        
        const masteryLevel = userProgress?.masteryLevel || 0;
        
        // Get all prerequisites for this skill
        const prerequisites = this.stores.skill_prerequisites.filter(
          prereq => prereq.skillId === skill.id
        );
        
        let isAvailable = 1; // Default to available
        
        if (prerequisites.length > 0) {
          // Check if all prerequisites are met
          const prereqsMet = prerequisites.every(prereq => {
            const prereqProgress = this.stores.user_skill_progress.find(
              progress => progress.userId === userId && progress.skillId === prereq.prerequisiteSkillId
            );
            
            return prereqProgress && prereqProgress.masteryLevel >= prereq.requiredMasteryLevel;
          });
          
          if (!prereqsMet) {
            isAvailable = 0;
          }
        }
        
        availableSkills.push({
          userId,
          skillId: skill.id,
          skillName: skill.name,
          difficulty: skill.difficulty,
          masteryLevel,
          isAvailable
        });
      }
    }
    
    this.stores.available_user_skills = availableSkills;
  }

  async select<T>(query: string, params: any[] = []): Promise<T[]> {
    try {
      const { table, where } = parseSimpleSelectQuery(query, params);
      
      // Map from SQL table names to our store names
      const tableMap: { [key: string]: keyof typeof this.stores } = {
        users: 'users',
        protocols: 'protocols',
        activities: 'activities',
        activity_protocols: 'activity_protocols',
        activity_history: 'activity_history',
        skill_categories: 'skill_categories',
        activity_skills: 'activity_skills',
        skill_prerequisites: 'skill_prerequisites',
        user_skill_progress: 'user_skill_progress',
        available_user_skills: 'available_user_skills'
      };
      
      const storeName = tableMap[table];
      if (!storeName) {
        throw new Error(`Unknown table name: ${table}`);
      }
      
      const items = this.stores[storeName];
      const filteredItems = applyWhere(items, where);
      
      return filteredItems as unknown as T[];
    } catch (error) {
      console.error("WebStore select error:", error);
      return [];
    }
  }

  async execute(query: string, params: any[] = []): Promise<{ lastInsertId?: number, rowsAffected?: number }> {
    try {
      // Very simple INSERT parsing - only handles the basic cases needed by the app
      const insertMatch = query.match(/INSERT\s+INTO\s+([a-zA-Z_]+)\s*\((.*?)\)\s*VALUES\s*\((.*?)\)/i);
      if (insertMatch) {
        const table = insertMatch[1];
        const columns = insertMatch[2].split(',').map(col => col.trim());
        const values = insertMatch[3].split(',').map(val => {
          // Replace param placeholders
          if (val.trim().startsWith('$')) {
            const paramIndex = parseInt(val.trim().substring(1)) - 1;
            return params[paramIndex];
          }
          return val.trim();
        });
        
        // Map from SQL table names to our store names
        const tableMap: { [key: string]: keyof typeof this.stores } = {
          users: 'users',
          protocols: 'protocols',
          activities: 'activities',
          activity_protocols: 'activity_protocols',
          activity_history: 'activity_history',
          skill_categories: 'skill_categories',
          activity_skills: 'activity_skills',
          skill_prerequisites: 'skill_prerequisites',
          user_skill_progress: 'user_skill_progress'
        };
        
        const storeName = tableMap[table];
        if (!storeName) {
          throw new Error(`Unknown table name: ${table}`);
        }
        
        // Create the new item with all columns
        const newItem: any = {};
        columns.forEach((col, index) => {
          newItem[col] = values[index];
        });
        
        // Add ID if it's not provided
        if (!('id' in newItem)) {
          newItem.id = this.nextIds[storeName]++;
        }
        
        // Add to the store
        this.stores[storeName].push(newItem);
        
        // Save to localStorage
        this.saveToLocalStorage(storeName);
        
        // Update views if needed
        if (['activity_skills', 'skill_prerequisites', 'user_skill_progress'].includes(table)) {
          this.updateAvailableUserSkillsView();
        }
        
        return {
          lastInsertId: newItem.id,
          rowsAffected: 1
        };
      }
      
      // Very simple UPDATE parsing
      const updateMatch = query.match(/UPDATE\s+([a-zA-Z_]+)\s+SET\s+(.*?)\s+WHERE\s+(.*)/i);
      if (updateMatch) {
        const table = updateMatch[1];
        const setClauses = updateMatch[2].split(',').map(clause => {
          const [column, value] = clause.trim().split('=').map(s => s.trim());
          let parsedValue = value;
          if (value.startsWith('$')) {
            const paramIndex = parseInt(value.substring(1)) - 1;
            parsedValue = params[paramIndex];
          }
          return { column, value: parsedValue };
        });
        
        const whereClause = updateMatch[3].trim();
        // Simple WHERE parsing, only handles id = value for now
        const whereMatch = whereClause.match(/id\s*=\s*(\$\d+|[0-9]+)/i);
        if (!whereMatch) {
          throw new Error(`Complex WHERE clauses not supported in UPDATE: ${whereClause}`);
        }
        
        let idValue: any = whereMatch[1];
        if (idValue.startsWith('$')) {
          const paramIndex = parseInt(idValue.substring(1)) - 1;
          idValue = params[paramIndex];
        }
        
        // Map from SQL table names to our store names
        const tableMap: { [key: string]: keyof typeof this.stores } = {
          users: 'users',
          protocols: 'protocols',
          activities: 'activities',
          activity_protocols: 'activity_protocols',
          activity_history: 'activity_history',
          skill_categories: 'skill_categories',
          activity_skills: 'activity_skills',
          skill_prerequisites: 'skill_prerequisites',
          user_skill_progress: 'user_skill_progress'
        };
        
        const storeName = tableMap[table];
        if (!storeName) {
          throw new Error(`Unknown table name: ${table}`);
        }
        
        // Find the item to update
        const itemIndex = this.stores[storeName].findIndex(item => (item as any).id === Number(idValue));
        if (itemIndex === -1) {
          return { rowsAffected: 0 };
        }
        
        // Update the item
        setClauses.forEach(({ column, value }) => {
          (this.stores[storeName][itemIndex] as any)[column] = value;
        });
        
        // Save to localStorage
        this.saveToLocalStorage(storeName);
        
        // Update views if needed
        if (['activity_skills', 'skill_prerequisites', 'user_skill_progress'].includes(table)) {
          this.updateAvailableUserSkillsView();
        }
        
        return {
          rowsAffected: 1
        };
      }
      
      // Return empty result for unsupported queries
      console.warn(`Unsupported query in WebStore: ${query}`);
      return {};
    } catch (error) {
      console.error("WebStore execute error:", error);
      return {};
    }
  }

  async getUsers(): Promise<User[]> {
    return this.stores.users;
  }

  async getActivities(): Promise<Activity[]> {
    return this.stores.activities;
  }

  async getProtocols(): Promise<Protocol[]> {
    return this.stores.protocols;
  }

  async getActivityProtocols(): Promise<ActivityProtocol[]> {
    return this.stores.activity_protocols;
  }

  async getActivityHistory(): Promise<ActivityHistory[]> {
    return this.stores.activity_history;
  }

  async getSkillCategories(): Promise<SkillCategory[]> {
    return this.stores.skill_categories;
  }

  async getActivitySkills(): Promise<ActivitySkill[]> {
    return this.stores.activity_skills;
  }

  async getSkillPrerequisites(): Promise<SkillPrerequisite[]> {
    return this.stores.skill_prerequisites;
  }

  async getUserSkillProgress(userId: number): Promise<UserSkillProgress[]> {
    return this.stores.user_skill_progress.filter(progress => progress.userId === userId);
  }

  async getAvailableUserSkills(userId: number): Promise<AvailableUserSkill[]> {
    return this.stores.available_user_skills.filter(skill => skill.userId === userId);
  }

  async findActivityByName(name: string): Promise<Activity | null> {
    const activity = this.stores.activities.find(a => a.name === name);
    return activity || null;
  }
}
