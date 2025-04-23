// Define common types for data entities
export type User = {
  id: number;
  name: string;
  email: string;
};

export type Protocol = {
  id: number;
  name: string;
  sourceCode: string;
  description: string;
}

export type Activity = {
  id: number;
  name: string;
  description: string;
  videoGuide: string;
  imageGuide: string;
  activityType?: string;
  complexityLevel?: number;
}

export type ActivityProtocol = {
  id: number;
  activityId: number;
  protocolId: number;
  parameters: string;
  createdAt: number;
}

export type ActivityHistory = {
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

export type SkillCategory = {
  id: number;
  name: string;
  description: string;
  color: string;
}

export type ActivitySkill = {
  id: number;
  activityId: number;
  name: string;
  description: string;
  difficulty: number;
  categoryId?: number;
}

export type SkillPrerequisite = {
  id: number;
  skillId: number;
  prerequisiteSkillId: number;
  requiredMasteryLevel: number;
}

export type UserSkillProgress = {
  id: number;
  userId: number;
  skillId: number;
  masteryLevel: number;
  lastPracticedAt?: number;
  totalPracticeTimeMs: number;
  practiceCount: number;
}

export type AvailableUserSkill = {
  userId: number;
  skillId: number;
  skillName: string;
  difficulty: number;
  masteryLevel: number;
  isAvailable: number;
}

// Define the interface for any data store implementation
export interface DataStore {
  // Database initialization
  initialize(): Promise<void>;
  
  // Common CRUD operations
  select<T>(query: string, params?: any[]): Promise<T[]>;
  execute(query: string, params?: any[]): Promise<{lastInsertId?: number, rowsAffected?: number}>;
  
  // Entity-specific operations
  getUsers(): Promise<User[]>;
  getActivities(): Promise<Activity[]>;
  getProtocols(): Promise<Protocol[]>;
  getActivityProtocols(): Promise<ActivityProtocol[]>;
  getActivityHistory(): Promise<ActivityHistory[]>;
  getSkillCategories(): Promise<SkillCategory[]>;
  getActivitySkills(): Promise<ActivitySkill[]>;
  getSkillPrerequisites(): Promise<SkillPrerequisite[]>;
  getUserSkillProgress(userId: number): Promise<UserSkillProgress[]>;
  getAvailableUserSkills(userId: number): Promise<AvailableUserSkill[]>;
  
  // Additional operations
  findActivityByName(name: string): Promise<Activity | null>;
}
