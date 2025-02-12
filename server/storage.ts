import {
  type User,
  type BitcoinTopic,
  type ChatSession,
  type LearningProgress,
  type InsertUser,
  type InsertBitcoinTopic,
  type InsertChatSession,
  type InsertLearningProgress,
  users,
  bitcoinTopics,
  chatSessions,
  learningProgress
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getBitcoinTopics(): Promise<BitcoinTopic[]>;
  getBitcoinTopic(id: number): Promise<BitcoinTopic | undefined>;
  getChatSessions(userId: number): Promise<ChatSession[]>;
  getChatSession(id: number): Promise<ChatSession | undefined>;
  createChatSession(session: InsertChatSession): Promise<ChatSession>;
  updateChatSession(id: number, messages: { role: string; content: string }[]): Promise<void>;
  getLearningProgress(userId: number): Promise<LearningProgress[]>;
  updateLearningProgress(progress: InsertLearningProgress): Promise<void>;
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

  async getBitcoinTopics(): Promise<BitcoinTopic[]> {
    return db.select().from(bitcoinTopics);
  }

  async getBitcoinTopic(id: number): Promise<BitcoinTopic | undefined> {
    const [topic] = await db.select().from(bitcoinTopics).where(eq(bitcoinTopics.id, id));
    return topic;
  }

  async getChatSessions(userId: number): Promise<ChatSession[]> {
    return db.select()
      .from(chatSessions)
      .where(eq(chatSessions.userId, userId));
  }

  async getChatSession(id: number): Promise<ChatSession | undefined> {
    const [session] = await db.select()
      .from(chatSessions)
      .where(eq(chatSessions.id, id));
    return session;
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

  async getLearningProgress(userId: number): Promise<LearningProgress[]> {
    return db.select()
      .from(learningProgress)
      .where(eq(learningProgress.userId, userId));
  }

  async updateLearningProgress(progressData: InsertLearningProgress): Promise<void> {
    await db.insert(learningProgress).values(progressData);
  }
}

// Initialize default Bitcoin topics
async function initializeDefaultBitcoinTopics() {
  const existingTopics = await db.select().from(bitcoinTopics);
  if (existingTopics.length === 0) {
    const defaultTopics: InsertBitcoinTopic[] = [
      { 
        name: "Bitcoin Basics",
        category: "basics",
        difficulty: "beginner",
        description: "Understanding what Bitcoin is, its history, and fundamental concepts"
      },
      {
        name: "Wallet Security",
        category: "security",
        difficulty: "beginner",
        description: "Learn how to securely store and manage your Bitcoin"
      },
      {
        name: "Transaction Fundamentals",
        category: "transactions",
        difficulty: "beginner",
        description: "Understanding Bitcoin transactions, fees, and confirmation process"
      },
      {
        name: "UTXO Management",
        category: "transactions",
        difficulty: "intermediate",
        description: "Advanced transaction handling and UTXO optimization"
      },
      {
        name: "Cold Storage",
        category: "security",
        difficulty: "intermediate",
        description: "Setting up and managing cold storage solutions for Bitcoin"
      }
    ];

    await db.insert(bitcoinTopics).values(defaultTopics);
  }
}

export const storage = new DatabaseStorage();
initializeDefaultBitcoinTopics().catch(console.error);