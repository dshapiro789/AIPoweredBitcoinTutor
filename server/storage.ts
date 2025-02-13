import {
  type User,
  type BitcoinTopic,
  type ChatSession,
  type LearningProgress,
  type Question,
  type UserQuizAttempt,
  type InsertUser,
  type InsertBitcoinTopic,
  type InsertChatSession,
  type InsertLearningProgress,
  type InsertQuestion,
  type InsertUserQuizAttempt,
  users,
  bitcoinTopics,
  chatSessions,
  learningProgress,
  questions,
  userQuizAttempts
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  // Existing methods
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

  // New quiz-related methods
  getQuestionsByTopic(topicId: number): Promise<Question[]>;
  createQuizAttempt(attempt: InsertUserQuizAttempt): Promise<UserQuizAttempt>;
  getUserQuizAttempts(userId: number, topicId: number): Promise<UserQuizAttempt[]>;
  getQuestion(id: number): Promise<Question | undefined>;
}

export class DatabaseStorage implements IStorage {
  // Existing implementations remain unchanged
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

  // New quiz-related implementations
  async getQuestionsByTopic(topicId: number): Promise<Question[]> {
    return db.select()
      .from(questions)
      .where(eq(questions.topicId, topicId));
  }

  async getQuestion(id: number): Promise<Question | undefined> {
    const [question] = await db.select()
      .from(questions)
      .where(eq(questions.id, id));
    return question;
  }

  async createQuizAttempt(attempt: InsertUserQuizAttempt): Promise<UserQuizAttempt> {
    const [newAttempt] = await db.insert(userQuizAttempts)
      .values(attempt)
      .returning();
    return newAttempt;
  }

  async getUserQuizAttempts(userId: number, topicId: number): Promise<UserQuizAttempt[]> {
    return db.select()
      .from(userQuizAttempts)
      .where(eq(userQuizAttempts.userId, userId))
      .where(eq(userQuizAttempts.topicId, topicId));
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

// Add after initializeDefaultBitcoinTopics function
async function initializeDefaultQuestions() {
  const existingQuestions = await db.select().from(questions);
  if (existingQuestions.length === 0) {
    const defaultQuestions: InsertQuestion[] = [
      {
        topicId: 1, // Bitcoin Basics
        questionText: "What is Bitcoin?",
        options: [
          "A digital currency and payment network",
          "A traditional banking system",
          "A social media platform",
          "An email service"
        ],
        correctAnswer: 0,
        explanation: "Bitcoin is a decentralized digital currency and payment network that operates without the need for intermediaries like banks.",
        difficulty: "beginner",
        points: 10
      },
      {
        topicId: 1,
        questionText: "Who created Bitcoin?",
        options: [
          "Bill Gates",
          "Satoshi Nakamoto",
          "Mark Zuckerberg",
          "Elon Musk"
        ],
        correctAnswer: 1,
        explanation: "Bitcoin was created by an anonymous person or group using the pseudonym Satoshi Nakamoto in 2008.",
        difficulty: "beginner",
        points: 10
      },
      {
        topicId: 2, // Wallet Security
        questionText: "What is a private key in Bitcoin?",
        options: [
          "A password for your email",
          "A secret code that allows you to spend your Bitcoin",
          "Your Bitcoin address",
          "Your wallet backup file"
        ],
        correctAnswer: 1,
        explanation: "A private key is a secret piece of data that proves your right to spend Bitcoin from a specific wallet.",
        difficulty: "beginner",
        points: 10
      }
    ];

    await db.insert(questions).values(defaultQuestions);
  }
}

// Modified initialization
export const storage = new DatabaseStorage();
Promise.all([
  initializeDefaultBitcoinTopics(),
  initializeDefaultQuestions()
]).catch(console.error);