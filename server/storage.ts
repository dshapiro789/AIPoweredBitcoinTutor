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

// Add PersonalizedPath type
type PersonalizedPath = {
  userId: number;
  next_topics: Array<{
    topic: string;
    description: string;
    prerequisites: string[];
    practical_exercises: string[];
  }>;
  recommended_resources: string[];
  estimated_completion_time: string;
  preferences: {
    experience: string;
    goal: string;
    time: string;
    style: string;
  };
  createdAt: Date;
};

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

  // New personalization methods
  getPersonalizedPath(userId: number): Promise<PersonalizedPath | null>;
  savePersonalizedPath(userId: number, path: PersonalizedPath): Promise<void>;
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

  // New personalization implementations
  async getPersonalizedPath(userId: number): Promise<PersonalizedPath | null> {
    try {
      // For now, we'll store personalized paths in the user's learning progress
      // In a production environment, this should be in its own table
      const progress = await this.getLearningProgress(userId);
      if (!progress || progress.length === 0) return null;

      // Get the latest personalization data from metadata
      const latestProgress = progress.reduce((latest, current) => {
        if (!latest) return current;
        if (!current.metadata?.personalization) return latest;
        if (latest.metadata?.personalization.createdAt < current.metadata?.personalization.createdAt) {
          return current;
        }
        return latest;
      }, null);

      if (!latestProgress?.metadata?.personalization) return null;

      return latestProgress.metadata.personalization as PersonalizedPath;
    } catch (error) {
      console.error("Error getting personalized path:", error);
      return null;
    }
  }

  async savePersonalizedPath(userId: number, path: PersonalizedPath): Promise<void> {
    try {
      // Store the personalization data in the metadata field of learning progress
      const firstTopic = path.next_topics[0];
      if (!firstTopic) return;

      const topic = await this.getBitcoinTopicByName(firstTopic.topic);
      if (!topic) return;

      await this.updateLearningProgress({
        userId,
        topicId: topic.id,
        completedExercises: 0,
        confidenceLevel: 0,
        lastActive: new Date(),
        quizzesPassed: 0,
        totalPoints: 0,
        metadata: {
          personalization: {
            ...path,
            createdAt: new Date()
          }
        }
      });
    } catch (error) {
      console.error("Error saving personalized path:", error);
      throw error;
    }
  }

  async getBitcoinTopicByName(name: string): Promise<BitcoinTopic | undefined> {
    const [topic] = await db.select()
      .from(bitcoinTopics)
      .where(eq(bitcoinTopics.name, name));
    return topic;
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

// Add more default questions for Transaction Fundamentals topic
async function initializeDefaultQuestions() {
  const existingQuestions = await db.select().from(questions);
  if (existingQuestions.length === 0) {
    const defaultQuestions: InsertQuestion[] = [
      // Multiple choice questions
      {
        topicId: 1, // Bitcoin Basics
        questionText: "What is Bitcoin?",
        type: "multiple_choice",
        options: [
          "A digital currency and payment network",
          "A traditional banking system",
          "A social media platform",
          "An email service"
        ],
        correctAnswer: 0,
        correctAnswerValue: 0,
        explanation: "Bitcoin is a decentralized digital currency and payment network that operates without the need for intermediaries like banks.",
        difficulty: "beginner",
        points: 10,
        hints: ["Think about the key features that make Bitcoin unique", "Consider who controls Bitcoin"],
        context: "Understanding the fundamental nature of Bitcoin is crucial for beginners."
      },
      // True/False question
      {
        topicId: 3, // Transaction Fundamentals
        questionText: "Bitcoin transactions are completely anonymous.",
        type: "true_false",
        options: ["True", "False"],
        correctAnswer: 1,
        correctAnswerValue: false,
        explanation: "Bitcoin transactions are pseudonymous, not anonymous. All transactions are recorded on the public blockchain and can be traced.",
        difficulty: "beginner",
        points: 10,
        hints: ["Think about the public nature of the blockchain"],
        context: "Common misconception about Bitcoin privacy"
      },
      // Fill in the blank
      {
        topicId: 3,
        questionText: "A Bitcoin transaction requires at least ___ confirmation(s) to be considered secure for large value transfers.",
        type: "fill_blank",
        options: ["1", "3", "6", "10"],
        correctAnswer: 2,
        correctAnswerValue: "6",
        explanation: "Six confirmations are traditionally recommended for large Bitcoin transactions to ensure they are securely recorded in the blockchain.",
        difficulty: "intermediate",
        points: 15,
        hints: ["Most exchanges wait for this many confirmations", "Think about the security implications"],
        context: "Understanding transaction finality and security"
      },
      // Multiple choice with image
      {
        topicId: 2, // Wallet Security
        questionText: "Which of these shows a correct example of a paper wallet?",
        type: "multiple_choice",
        options: [
          "Option A: Single QR code",
          "Option B: Two QR codes with public and private keys",
          "Option C: Written seed phrase only",
          "Option D: Mobile wallet screenshot"
        ],
        correctAnswer: 1,
        correctAnswerValue: 1,
        explanation: "A proper paper wallet typically contains two QR codes - one for the public key (receiving address) and one for the private key, along with their text representations.",
        difficulty: "intermediate",
        points: 15,
        hints: ["Consider what information is needed to both receive and spend Bitcoin", "Think about backup best practices"],
        context: "Paper wallets are a form of cold storage",
        imageUrl: "/images/quiz/paper-wallet-examples.svg"
      },
      {
        topicId: 2, // Wallet Security
        questionText: "Which of these is NOT a recommended practice for securing your Bitcoin wallet?",
        type: "multiple_choice",
        options: [
          "Writing down your seed phrase on paper",
          "Taking a screenshot of your seed phrase",
          "Using a hardware wallet",
          "Creating encrypted backups"
        ],
        correctAnswer: 1,
        correctAnswerValue: 1,
        explanation: "Taking screenshots of your seed phrase is dangerous as they can be accessed by malware or leaked in cloud backups. Always write down your seed phrase physically and store it securely.",
        difficulty: "beginner",
        points: 10,
        hints: ["Think about digital security risks", "Consider what could be hacked"],
        context: "Understanding proper seed phrase storage is crucial for wallet security"
      },
      {
        topicId: 2,
        questionText: "A hardware wallet provides better security than a software wallet.",
        type: "true_false",
        options: ["True", "False"],
        correctAnswer: 0,
        correctAnswerValue: true,
        explanation: "Hardware wallets keep private keys offline and are therefore more secure against online threats compared to software wallets.",
        difficulty: "beginner",
        points: 10,
        hints: ["Think about online vs offline storage"],
        context: "Hardware wallets are considered one of the most secure storage solutions"
      },
      {
        topicId: 2,
        questionText: "How many words are typically in a Bitcoin seed phrase?",
        type: "fill_blank",
        options: ["12", "24"],
        correctAnswer: 0,
        correctAnswerValue: "12",
        explanation: "The most common Bitcoin seed phrase length is 12 words, though 24-word phrases are also used for enhanced security.",
        difficulty: "beginner",
        points: 10,
        hints: ["This is a BIP39 standard"],
        context: "Seed phrases are used to backup and restore Bitcoin wallets"
      },
      // Additional Bitcoin Basics Questions
      {
        topicId: 1,
        questionText: "Who created Bitcoin?",
        type: "multiple_choice",
        options: [
          "Satoshi Nakamoto",
          "Vitalik Buterin",
          "Mark Zuckerberg",
          "Bill Gates"
        ],
        correctAnswer: 0,
        correctAnswerValue: 0,
        explanation: "Bitcoin was created by an anonymous person or group using the pseudonym Satoshi Nakamoto.",
        difficulty: "beginner",
        points: 10,
        hints: ["Think about the pseudonymous creator mentioned in the Bitcoin whitepaper"],
        context: "Understanding Bitcoin's origins is crucial for beginners."
      },
      {
        topicId: 1,
        questionText: "What year was Bitcoin launched?",
        type: "fill_blank",
        options: ["2009"],
        correctAnswer: 0,
        correctAnswerValue: "2009",
        explanation: "Bitcoin's first block (the genesis block) was mined on January 3, 2009.",
        difficulty: "beginner",
        points: 10,
        hints: ["The genesis block was mined in early January of this year"],
        context: "Timeline of Bitcoin's creation"
      },
      {
        topicId: 1,
        questionText: "Bitcoin has a fixed maximum supply.",
        type: "true_false",
        options: ["True", "False"],
        correctAnswer: 0,
        correctAnswerValue: true,
        explanation: "Bitcoin has a maximum supply cap of 21 million coins.",
        difficulty: "beginner",
        points: 10,
        hints: ["Think about Bitcoin's monetary policy"],
        context: "Understanding Bitcoin's scarcity"
      },
      {
        topicId: 1,
        questionText: "What is the smallest unit of Bitcoin called?",
        type: "multiple_choice",
        options: [
          "Satoshi",
          "Bit",
          "Wei",
          "Gwei"
        ],
        correctAnswer: 0,
        correctAnswerValue: 0,
        explanation: "A Satoshi is the smallest unit of Bitcoin, equal to 0.00000001 BTC.",
        difficulty: "beginner",
        points: 10,
        hints: ["Named after Bitcoin's creator"],
        context: "Understanding Bitcoin units"
      },
      {
        topicId: 1,
        questionText: "What process creates new bitcoins?",
        type: "multiple_choice",
        options: [
          "Mining",
          "Trading",
          "Staking",
          "Lending"
        ],
        correctAnswer: 0,
        correctAnswerValue: 0,
        explanation: "Bitcoin mining is the process that creates new bitcoins and validates transactions.",
        difficulty: "beginner",
        points: 10,
        hints: ["Think about the proof-of-work system"],
        context: "Bitcoin creation process"
      },

      // Additional Wallet Security Questions
      {
        topicId: 2,
        questionText: "What is the most secure way to store large amounts of Bitcoin?",
        type: "multiple_choice",
        options: [
          "Hardware wallet",
          "Mobile wallet",
          "Exchange wallet",
          "Browser extension wallet"
        ],
        correctAnswer: 0,
        correctAnswerValue: 0,
        explanation: "Hardware wallets provide the best security by keeping private keys offline.",
        difficulty: "intermediate",
        points: 15,
        hints: ["Think about offline vs online storage"],
        context: "Best practices for Bitcoin storage"
      },
      {
        topicId: 2,
        questionText: "A seed phrase should be stored digitally for easy access.",
        type: "true_false",
        options: ["True", "False"],
        correctAnswer: 1,
        correctAnswerValue: false,
        explanation: "Seed phrases should never be stored digitally as they could be compromised by malware or hacks.",
        difficulty: "beginner",
        points: 10,
        hints: ["Consider security best practices"],
        context: "Seed phrase security"
      },
      {
        topicId: 2,
        questionText: "How many words are in a BIP39 seed phrase?",
        type: "multiple_choice",
        options: [
          "12 or 24",
          "6 or 12",
          "24 or 36",
          "8 or 16"
        ],
        correctAnswer: 0,
        correctAnswerValue: 0,
        explanation: "BIP39 seed phrases can be either 12 or 24 words long.",
        difficulty: "intermediate",
        points: 15,
        hints: ["Common wallet standards"],
        context: "Wallet recovery standards"
      },

      // Additional Transaction Fundamentals Questions
      {
        topicId: 3,
        questionText: "What determines Bitcoin transaction fees?",
        type: "multiple_choice",
        options: [
          "Transaction size and network congestion",
          "Time of day",
          "Amount being sent",
          "Wallet type"
        ],
        correctAnswer: 0,
        correctAnswerValue: 0,
        explanation: "Transaction fees are primarily determined by the transaction size in bytes and current network demand.",
        difficulty: "intermediate",
        points: 15,
        hints: ["Think about network resources"],
        context: "Understanding transaction costs"
      },
      {
        topicId: 3,
        questionText: "What is the average time between Bitcoin blocks?",
        type: "fill_blank",
        options: ["10"],
        correctAnswer: 0,
        correctAnswerValue: "10",
        explanation: "Bitcoin blocks are mined approximately every 10 minutes.",
        difficulty: "beginner",
        points: 10,
        hints: ["This is maintained by difficulty adjustments"],
        context: "Block time basics"
      },
      {
        topicId: 3,
        questionText: "Can Bitcoin transactions be reversed?",
        type: "true_false",
        options: ["True", "False"],
        correctAnswer: 1,
        correctAnswerValue: false,
        explanation: "Bitcoin transactions are irreversible once confirmed in the blockchain.",
        difficulty: "beginner",
        points: 10,
        hints: ["Think about blockchain immutability"],
        context: "Transaction finality"
      },

      // Additional UTXO Management Questions
      {
        topicId: 4,
        questionText: "What does UTXO stand for?",
        type: "multiple_choice",
        options: [
          "Unspent Transaction Output",
          "Unified Transaction Exchange Order",
          "Universal Transaction Exchange Output",
          "Unconfirmed Transaction Order"
        ],
        correctAnswer: 0,
        correctAnswerValue: 0,
        explanation: "UTXO stands for Unspent Transaction Output, representing spendable Bitcoin.",
        difficulty: "intermediate",
        points: 15,
        hints: ["Think about the components of a transaction"],
        context: "UTXO model basics"
      },
      {
        topicId: 4,
        questionText: "Can a single UTXO be partially spent?",
        type: "true_false",
        options: ["True", "False"],
        correctAnswer: 1,
        correctAnswerValue: false,
        explanation: "UTXOs must be spent in their entirety, with change returned as a new UTXO.",
        difficulty: "advanced",
        points: 20,
        hints: ["Think about how change works in Bitcoin"],
        context: "UTXO spending rules"
      },
      {
        topicId: 4,
        questionText: "What is coin selection?",
        type: "multiple_choice",
        options: [
          "Algorithm to choose which UTXOs to spend",
          "Process of mining new coins",
          "Method of creating private keys",
          "Way to verify transactions"
        ],
        correctAnswer: 0,
        correctAnswerValue: 0,
        explanation: "Coin selection algorithms determine which UTXOs to use in a transaction.",
        difficulty: "advanced",
        points: 20,
        hints: ["Related to wallet efficiency"],
        context: "Advanced UTXO management"
      },

      // Additional Cold Storage Questions
      {
        topicId: 5,
        questionText: "What defines cold storage?",
        type: "multiple_choice",
        options: [
          "Private keys never touch internet-connected devices",
          "Keys stored in a cold climate",
          "Using a mobile wallet offline",
          "Storing crypto on an exchange"
        ],
        correctAnswer: 0,
        correctAnswerValue: 0,
        explanation: "Cold storage means private keys are kept completely offline for maximum security.",
        difficulty: "intermediate",
        points: 15,
        hints: ["Think about internet connectivity"],
        context: "Cold storage basics"
      },
      {
        topicId: 5,
        questionText: "Is a paper wallet a form of cold storage?",
        type: "true_false",
        options: ["True", "False"],
        correctAnswer: 0,
        correctAnswerValue: true,
        explanation: "Paper wallets are a form of cold storage as they store private keys offline on paper.",
        difficulty: "beginner",
        points: 10,
        hints: ["Consider the offline nature"],
        context: "Types of cold storage"
      },
      {
        topicId: 5,
        questionText: "What is a multisig wallet?",
        type: "multiple_choice",
        options: [
          "Wallet requiring multiple signatures to spend",
          "Wallet with multiple addresses",
          "Wallet for multiple cryptocurrencies",
          "Wallet with multiple backups"
        ],
        correctAnswer: 0,
        correctAnswerValue: 0,
        explanation: "Multisig wallets require multiple signatures to authorize transactions, enhancing security.",
        difficulty: "advanced",
        points: 20,
        hints: ["Think about shared control"],
        context: "Advanced wallet security"
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

// Move initialization into a separate async function
async function initializeDatabase() {
  try {
    await Promise.all([
      initializeDefaultBitcoinTopics(),
      initializeDefaultQuestions(),
      initializeDefaultAchievements()
    ]);
  } catch (error) {
    console.error("Database initialization error:", error);
    // Don't throw - allow server to start even if seeding fails
  }
}

// Start initialization in background
initializeDatabase().catch(console.error);

// Remove the direct Promise.all call at the bottom of the file
export const storage = new DatabaseStorage();