import { promises as fs } from 'fs';
import { join } from 'path';

export type ApplicationStatus = 'PENDING_REVIEW' | 'UNDER_REVIEW' | 'REJECTED' | 'ACCEPTED';

export interface AgentApplication {
  id: string;
  agentId: string;
  status: ApplicationStatus;
  createdAt: string;
  updatedAt: string;
  submitterInfo?: {
    email?: string;
    contact?: string;
  };
}

export interface Database {
  applications: AgentApplication[];
}

const DB_PATH = join(process.cwd(), 'data', 'applications.json');

// Ensure data directory exists
async function ensureDataDir() {
  try {
    await fs.mkdir(join(process.cwd(), 'data'), { recursive: true });
  } catch (error) {
    // Directory might already exist
  }
}

// Initialize empty database if it doesn't exist
async function initializeDb(): Promise<Database> {
  const defaultDb: Database = {
    applications: []
  };
  
  await ensureDataDir();
  await fs.writeFile(DB_PATH, JSON.stringify(defaultDb, null, 2));
  return defaultDb;
}

// Read database
export async function readDb(): Promise<Database> {
  try {
    const data = await fs.readFile(DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // File doesn't exist, create it
    return await initializeDb();
  }
}

// Write database
export async function writeDb(db: Database): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2));
}

// Generate unique ID
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Database operations
export class ApplicationsDb {
  static async create(application: Omit<AgentApplication, 'id' | 'createdAt' | 'updatedAt'>): Promise<AgentApplication> {
    const db = await readDb();
    const now = new Date().toISOString();
    
    const newApplication: AgentApplication = {
      ...application,
      id: generateId(),
      createdAt: now,
      updatedAt: now
    };
    
    db.applications.push(newApplication);
    await writeDb(db);
    
    return newApplication;
  }
  
  static async getAll(): Promise<AgentApplication[]> {
    const db = await readDb();
    return db.applications;
  }
  
  static async getById(id: string): Promise<AgentApplication | null> {
    const db = await readDb();
    return db.applications.find(app => app.id === id) || null;
  }
  
  static async updateStatus(id: string, status: ApplicationStatus): Promise<AgentApplication | null> {
    const db = await readDb();
    const applicationIndex = db.applications.findIndex(app => app.id === id);
    
    if (applicationIndex === -1) {
      return null;
    }
    
    db.applications[applicationIndex] = {
      ...db.applications[applicationIndex],
      status,
      updatedAt: new Date().toISOString()
    };
    
    await writeDb(db);
    return db.applications[applicationIndex];
  }
  
  static async getByStatus(status: ApplicationStatus): Promise<AgentApplication[]> {
    const db = await readDb();
    return db.applications.filter(app => app.status === status);
  }
}