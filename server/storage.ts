import {
  type User,
  type BitcoinTopic,
  type ChatSession,
  type LearningProgress,
  type Question,
  type UserQuizAttempt,
  type Achievement,
  type UserAchievement,
  type InsertUser,
  type InsertBitcoinTopic,
  type InsertChatSession,
  type InsertLearningProgress,
  type InsertQuestion,
  type InsertUserQuizAttempt,
  type InsertAchievement,
  type InsertUserAchievement,
  users,
  bitcoinTopics,
  chatSessions,
  learningProgress,
  questions,
  userQuizAttempts,
  achievements,
  userAchievements
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

  // New achievement-related methods
  getAchievements(): Promise<Achievement[]>;
  getUserAchievements(userId: number): Promise<(UserAchievement & { achievement: Achievement })[]>;
  awardAchievement(achievement: InsertUserAchievement): Promise<UserAchievement>;
  checkAndAwardAchievements(userId: number): Promise<UserAchievement[]>;
}

export class DatabaseStorage implements IStorage {
  // Existing implementations
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

  // New achievement-related implementations
  async getAchievements(): Promise<Achievement[]> {
    return db.select().from(achievements);
  }

  async getUserAchievements(userId: number): Promise<(UserAchievement & { achievement: Achievement })[]> {
    const results = await db
      .select({
        userAchievement: userAchievements,
        achievement: achievements,
      })
      .from(userAchievements)
      .leftJoin(achievements, eq(userAchievements.achievementId, achievements.id))
      .where(eq(userAchievements.userId, userId));

    return results.map(({ userAchievement, achievement }) => ({
      ...userAchievement,
      achievement,
    }));
  }

  async awardAchievement(achievement: InsertUserAchievement): Promise<UserAchievement> {
    const [newAchievement] = await db
      .insert(userAchievements)
      .values(achievement)
      .returning();
    return newAchievement;
  }

  async checkAndAwardAchievements(userId: number): Promise<UserAchievement[]> {
    const progress = await this.getLearningProgress(userId);
    const quizAttempts = await db
      .select()
      .from(userQuizAttempts)
      .where(eq(userQuizAttempts.userId, userId));
    const existingAchievements = await this.getUserAchievements(userId);
    const allAchievements = await this.getAchievements();

    const newAchievements: UserAchievement[] = [];

    for (const achievement of allAchievements) {
      // Skip if user already has this achievement
      if (existingAchievements.some(ua => ua.achievementId === achievement.id)) {
        continue;
      }

      // Check if requirements are met
      let requirementsMet = true;
      for (const requirement of achievement.requirements) {
        switch (requirement.type) {
          case 'quiz_score':
            // Check if user has achieved the required quiz score
            requirementsMet = quizAttempts.some(attempt => attempt.score >= requirement.value);
            break;
          case 'topics_completed':
            // Check if user has completed the required number of topics
            requirementsMet = progress.filter(p => p.completedExercises > 0).length >= requirement.value;
            break;
          case 'total_points':
            // Check if user has earned enough total points
            const totalPoints = progress.reduce((sum, p) => sum + p.totalPoints, 0);
            requirementsMet = totalPoints >= requirement.value;
            break;
        }

        if (!requirementsMet) break;
      }

      if (requirementsMet) {
        const awarded = await this.awardAchievement({
          userId,
          achievementId: achievement.id,
          unlockedAt: new Date(),
        });
        newAchievements.push(awarded);
      }
    }

    return newAchievements;
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

// Add after initializeDefaultQuestions function
async function initializeDefaultAchievements() {
  const existingAchievements = await db.select().from(achievements);
  if (existingAchievements.length === 0) {
    const defaultAchievements: InsertAchievement[] = [
      {
        name: "Bitcoin Beginner",
        description: "Complete your first Bitcoin topic",
        type: "topic_completion",
        requirements: [{ type: "topics_completed", value: 1 }],
        points: 50,
        badge: "🎓"
      },
      {
        name: "Quiz Master",
        description: "Score 100% on any quiz",
        type: "quiz_expert",
        requirements: [{ type: "quiz_score", value: 100 }],
        points: 100,
        badge: "🏆"
      },
      {
        name: "Dedicated Learner",
        description: "Complete 5 different topics",
        type: "topic_completion",
        requirements: [{ type: "topics_completed", value: 5 }],
        points: 200,
        badge: "📚"
      },
      {
        name: "Point Collector",
        description: "Earn a total of 500 points",
        type: "milestone",
        requirements: [{ type: "total_points", value: 500 }],
        points: 150,
        badge: "⭐"
      },
      {
        name: "Bitcoin Scholar",
        description: "Pass all quizzes with a score of 80% or higher",
        type: "quiz_expert",
        requirements: [
          { type: "topics_completed", value: 5 },
          { type: "quiz_score", value: 80 }
        ],
        points: 300,
        badge: "🎯"
      }
    ];

    await db.insert(achievements).values(defaultAchievements);
  }
}

// Modify initialization
export const storage = new DatabaseStorage();
Promise.all([
  initializeDefaultBitcoinTopics(),
  initializeDefaultQuestions(),
  initializeDefaultAchievements()
]).catch(console.error);