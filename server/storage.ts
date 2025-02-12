import {
  type User,
  type Subject,
  type ChatSession,
  type Progress,
  type InsertUser,
  type InsertSubject,
  type InsertChatSession,
  type InsertProgress,
  users,
  subjects,
  chatSessions,
  progress
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getSubjects(): Promise<Subject[]>;
  getChatSessions(userId: number): Promise<ChatSession[]>;
  createChatSession(session: InsertChatSession): Promise<ChatSession>;
  updateChatSession(id: number, messages: { role: string; content: string }[]): Promise<void>;
  getProgress(userId: number): Promise<Progress[]>;
  updateProgress(progress: InsertProgress): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getSubjects(): Promise<Subject[]> {
    return db.select().from(subjects);
  }

  async getChatSessions(userId: number): Promise<ChatSession[]> {
    return db.select()
      .from(chatSessions)
      .where(eq(chatSessions.userId, userId));
  }

  async createChatSession(session: InsertChatSession): Promise<ChatSession> {
    const [newSession] = await db.insert(chatSessions)
      .values(session)
      .returning();
    return newSession;
  }

  async updateChatSession(id: number, messages: { role: string; content: string }[]): Promise<void> {
    await db.update(chatSessions)
      .set({ messages })
      .where(eq(chatSessions.id, id));
  }

  async getProgress(userId: number): Promise<Progress[]> {
    return db.select()
      .from(progress)
      .where(eq(progress.userId, userId));
  }

  async updateProgress(progressData: InsertProgress): Promise<void> {
    await db.insert(progress).values(progressData);
  }
}

// Initialize default subjects
async function initializeDefaultSubjects() {
  const existingSubjects = await db.select().from(subjects);
  if (existingSubjects.length === 0) {
    const defaultSubjects: InsertSubject[] = [
      { name: "Python Programming", category: "Coding", description: "Learn Python programming from basics to advanced concepts" },
      { name: "Web Development", category: "Coding", description: "Master HTML, CSS, and JavaScript" },
      { name: "Calculus", category: "Math", description: "Understanding derivatives, integrals, and their applications" },
      { name: "Physics", category: "Science", description: "Explore mechanics, electricity, and modern physics" },
      { name: "Spanish", category: "Languages", description: "Learn Spanish conversation and grammar" },
    ];

    await db.insert(subjects).values(defaultSubjects);
  }
}

export const storage = new DatabaseStorage();
initializeDefaultSubjects().catch(console.error);