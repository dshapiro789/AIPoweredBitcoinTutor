import { Express } from "express";
import { Server, createServer } from "http";
import { storage } from "./storage";
import { getTutorResponse, analyzeProgress, generateLearningPath, testGeminiConnection } from "./ai-service";
import { insertUserSchema, insertChatSessionSchema, insertLearningProgressSchema, insertUserQuizAttemptSchema } from "@shared/schema";
import { ZodError } from "zod";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

// Update type interfaces for translations
type SupportedLanguages = 'en' | 'es' | 'es-419' | 'zh' | 'ja';
type TranslationDictionary = Record<string, string>;

const translations: Record<SupportedLanguages, TranslationDictionary> = {
  en: {},
  es: {
    "Bitcoin Basics": "Comprenda qué es Bitcoin, su historia y conceptos fundamentales",
    "Blockchain Technology": "Explore la tecnología blockchain y cómo funciona Bitcoin",
    "Digital Security": "Aprenda sobre la seguridad digital y cómo proteger sus bitcoins",
    "Trading Fundamentals": "Comprenda los conceptos básicos del trading de Bitcoin",
    "Advanced Concepts": "Profundice en conceptos avanzados de Bitcoin y blockchain",
    "Wallet Security": "Aprenda cómo almacenar y gestionar sus Bitcoin de forma segura",
    "Transaction Fundamentals": "Comprenda las transacciones de Bitcoin, las comisiones y el proceso de confirmación",
    "UTXO Management": "Gestión avanzada de transacciones y optimización de UTXO",
    "Cold Storage": "Configuración y gestión de soluciones de almacenamiento en frío para Bitcoin"
  },
  "es-419": {
    "Bitcoin Basics": "Entiende qué es Bitcoin, su historia y conceptos fundamentales",
    "Blockchain Technology": "Explora la tecnología blockchain y cómo funciona Bitcoin",
    "Digital Security": "Aprende sobre la seguridad digital y cómo proteger tus bitcoins",
    "Trading Fundamentals": "Comprende los conceptos básicos del trading de Bitcoin",
    "Advanced Concepts": "Profundiza en conceptos avanzados de Bitcoin y blockchain",
    "Wallet Security": "Aprende cómo guardar y administrar tus Bitcoin de forma segura",
    "Transaction Fundamentals": "Comprende las transacciones de Bitcoin, las comisiones y el proceso de confirmación",
    "UTXO Management": "Manejo avanzado de transacciones y optimización de UTXO",
    "Cold Storage": "Configuración y administración de soluciones de almacenamiento en frío para Bitcoin"
  },
  zh: {
    "Bitcoin Basics": "了解比特币是什么、其历史和基本概念",
    "Blockchain Technology": "探索区块链技术和比特币的运作方式",
    "Digital Security": "学习数字安全和如何保护您的比特币",
    "Trading Fundamentals": "理解比特币交易的基本概念",
    "Advanced Concepts": "深入了解比特币和区块链的高级概念",
    "Wallet Security": "学习如何安全地存储和管理您的比特币",
    "Transaction Fundamentals": "了解比特币交易、费用和确认流程",
    "UTXO Management": "高级交易处理和UTXO优化",
    "Cold Storage": "设置和管理比特币冷存储解决方案"
  },
  ja: {
    "Bitcoin Basics": "ビットコインとは何か、その歴史と基本的な概念を理解する",
    "Blockchain Technology": "ブロックチェーン技術とビットコインの仕組みを探る",
    "Digital Security": "デジタルセキュリティとビットコインの保護方法を学ぶ",
    "Trading Fundamentals": "ビットコイン取引の基本概念を理解する",
    "Advanced Concepts": "ビットコインとブロックチェーンの高度な概念を深く学ぶ",
    "Wallet Security": "ビットコインを安全に保管・管理する方法を学ぶ",
    "Transaction Fundamentals": "ビットコインの取引、手数料、承認プロセスを理解する",
    "UTXO Management": "高度な取引処理とUTXOの最適化",
    "Cold Storage": "ビットコインのコールドストレージソリューションの設定と管理"
  }
};

export function registerRoutes(app: Express): Server {
  const httpServer = createServer(app);

  // Test OpenAI integration
  app.get("/api/test-openai", async (req, res) => {
    try {
      const testResponse = await getTutorResponse([
        { role: "user", content: "What is Bitcoin?" }
      ], "Bitcoin Basics");
      res.json({ success: true, response: testResponse });
    } catch (error) {
      console.error("OpenAI test failed:", error);
      // Enhanced error response
      const isRateLimit = error instanceof Error &&
        error.message.toLowerCase().includes('rate limit');

      res.status(isRateLimit ? 429 : 500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        isRateLimit,
        fallbackAvailable: true,
        suggestion: isRateLimit ?
          "The AI service is currently at capacity. The application will use pre-defined responses temporarily." :
          "An unexpected error occurred. The application will use pre-defined responses."
      });
    }
  });

  // Test Gemini API integration
  app.get("/api/test-gemini", async (req, res) => {
    try {
      const testResult = await testGeminiConnection();
      res.json(testResult);
    } catch (error) {
      console.error("Gemini test failed:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        suggestion: "Please verify your Gemini API key and try again."
      });
    }
  });

  // Bitcoin topics routes
  app.get("/api/bitcoin/topics", async (req, res) => {
    try {
      const topics = await storage.getBitcoinTopics();
      const lang = (req.query.lang?.toString() || 'en') as SupportedLanguages;

      const localizedTopics = topics.map(topic => ({
        ...topic,
        description: getLocalizedDescription(topic.name, lang)
      }));

      res.json(localizedTopics);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch Bitcoin topics" });
    }
  });

  // Quiz routes
  app.get("/api/quiz/:topicId", async (req, res) => {
    try {
      const topicId = parseInt(req.params.topicId);
      if (isNaN(topicId)) {
        return res.status(400).json({ 
          message: "Invalid topic ID",
          error: "The topic ID must be a valid number"
        });
      }

      const questions = await storage.getQuestionsByTopic(topicId);

      // Return a default set of questions if none exist
      if (!questions || questions.length === 0) {
        const defaultQuestions = [
          {
            id: 1,
            topicId,
            type: "multiple_choice",
            difficulty: "beginner",
            points: 10,
            questionText: "What is Bitcoin?",
            options: [
              "A decentralized digital currency",
              "A central bank digital currency",
              "A type of credit card",
              "A traditional banking system"
            ],
            correctAnswer: 0,
            correctAnswerValue: null,
            explanation: "Bitcoin is a decentralized digital currency that operates without a central authority.",
            hints: ["Think about who controls traditional currencies versus Bitcoin"],
            imageUrl: null,
            context: null
          },
          {
            id: 2,
            topicId,
            type: "true_false",
            difficulty: "beginner",
            points: 5,
            questionText: "Bitcoin transactions are completely anonymous.",
            options: [],
            correctAnswer: 1,
            correctAnswerValue: false,
            explanation: "Bitcoin transactions are pseudonymous, not anonymous. All transactions are recorded on the public blockchain.",
            hints: ["Consider the public nature of the blockchain"],
            imageUrl: null,
            context: null
          }
        ];
        return res.json(defaultQuestions);
      }

      res.json(questions);
    } catch (error) {
      console.error("Error fetching quiz questions:", error);
      res.status(500).json({
        message: "Failed to fetch quiz questions",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.post("/api/quiz/attempt", async (req, res) => {
    try {
      const quizAttempt = {
        userId: req.body.userId,
        topicId: req.body.topicId,
        questionsAnswered: req.body.questionsAnswered,
        score: req.body.score,
        completedAt: new Date(),
      };

      const validatedAttempt = insertUserQuizAttemptSchema.parse(quizAttempt);
      const attempt = await storage.createQuizAttempt(validatedAttempt);

      // Update learning progress
      await storage.updateLearningProgress({
        userId: validatedAttempt.userId,
        topicId: validatedAttempt.topicId,
        completedExercises: 1,
        confidenceLevel: Math.min(5, Math.ceil(validatedAttempt.score / 20)),
        lastActive: new Date(),
        quizzesPassed: validatedAttempt.score >= 70 ? 1 : 0,
        totalPoints: validatedAttempt.score
      });

      // Check for new achievements
      const newAchievements = await storage.checkAndAwardAchievements(validatedAttempt.userId);

      res.json({
        attempt,
        newAchievements: newAchievements.length > 0 ? newAchievements : null
      });
    } catch (error) {
      console.error("Error submitting quiz attempt:", error);
      if (error instanceof ZodError) {
        return res.status(400).json({
          message: "Invalid quiz attempt data",
          details: error.errors
        });
      }
      res.status(500).json({ message: "Failed to submit quiz attempt" });
    }
  });

  app.get("/api/quiz/history/:userId/:topicId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const topicId = parseInt(req.params.topicId);
      const attempts = await storage.getUserQuizAttempts(userId, topicId);
      res.json(attempts);
    } catch (error) {
      console.error("Error fetching quiz history:", error);
      res.status(500).json({ message: "Failed to fetch quiz history" });
    }
  });

  app.get("/api/bitcoin/topics/:id", async (req, res) => {
    try {
      const topic = await storage.getBitcoinTopic(parseInt(req.params.id));
      if (!topic) {
        return res.status(404).json({ message: "Topic not found" });
      }
      res.json(topic);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch Bitcoin topic" });
    }
  });

  // Chat session routes
  app.post("/api/chat/start", async (req, res) => {
    try {
      const sessionData = {
        userId: req.body.userId,
        topicId: parseInt(req.body.topicId),
        messages: [],
        isActive: true
      };

      const validatedSession = insertChatSessionSchema.parse(sessionData);
      const newSession = await storage.createChatSession(validatedSession);

      // Default learning path in case OpenAI is not available
      const defaultLearningPath = {
        next_topics: [
          {
            topic: "Bitcoin Basics",
            description: "Learn the fundamentals of Bitcoin",
            prerequisites: [],
            practical_exercises: ["Create a wallet", "Send a test transaction"]
          }
        ],
        recommended_resources: ["Bitcoin.org documentation"],
        estimated_completion_time: "2-3 weeks"
      };

      let learningPath = defaultLearningPath;
      try {
        const topic = await storage.getBitcoinTopic(validatedSession.topicId);
        if (topic) {
          const aiLearningPath = await generateLearningPath(topic.name, "beginner");
          learningPath = aiLearningPath;
        }
      } catch (error) {
        console.error("Using default learning path due to error:", error);
      }

      res.json({ session: newSession, learningPath });
    } catch (error) {
      console.error("Error starting chat session:", error);
      if (error instanceof ZodError) {
        return res.status(400).json({
          message: "Invalid session data",
          details: error.errors
        });
      }
      res.status(500).json({
        message: "Failed to start chat session. Please try again.",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.post("/api/chat/message", async (req, res) => {
    try {
      const { sessionId, message, subject } = req.body;
      const session = await storage.getChatSession(sessionId);

      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }

      const updatedMessages: ChatCompletionMessageParam[] = [
        ...session.messages,
        { role: "user", content: message }
      ];

      // Get tutor's response
      const tutorResponse = await getTutorResponse(updatedMessages, subject);
      updatedMessages.push({
        role: "assistant",
        content: tutorResponse
      });

      // Analyze progress after interaction
      const analysis = await analyzeProgress(updatedMessages);

      await storage.updateChatSession(sessionId, updatedMessages);
      await storage.updateLearningProgress({
        userId: session.userId,
        topicId: session.topicId,
        completedExercises: Math.floor(session.messages.length / 2),
        confidenceLevel: 1,
        lastActive: new Date(),
      });

      res.json({
        message: tutorResponse,
        analysis
      });
    } catch (error) {
      console.error("Error processing message:", error);
      res.status(500).json({ message: "Failed to process message" });
    }
  });

  // Learning progress routes
  app.get("/api/progress/:userId", async (req, res) => {
    try {
      const progress = await storage.getLearningProgress(parseInt(req.params.userId));
      res.json(progress);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch learning progress" });
    }
  });

  app.post("/api/progress/update", async (req, res) => {
    try {
      const progress = {
        userId: req.body.userId,
        topicId: req.body.topicId,
        completedExercises: req.body.completedExercises || 0,
        confidenceLevel: req.body.confidenceLevel || 1,
        lastActive: new Date(),
        quizzesPassed: req.body.quizzesPassed || 0,
        totalPoints: req.body.totalPoints || 0
      };

      const validatedProgress = insertLearningProgressSchema.parse(progress);
      await storage.updateLearningProgress(validatedProgress);

      res.json({ message: "Progress updated successfully" });
    } catch (error) {
      console.error("Error updating progress:", error);
      if (error instanceof ZodError) {
        return res.status(400).json({
          message: "Invalid progress data",
          details: error.errors
        });
      }
      res.status(500).json({ message: "Failed to update progress" });
    }
  });


  // Achievement routes
  app.get("/api/achievements", async (req, res) => {
    try {
      const achievements = await storage.getAchievements();
      res.json(achievements);
    } catch (error) {
      console.error("Error fetching achievements:", error);
      res.status(500).json({ message: "Failed to fetch achievements" });
    }
  });

  app.get("/api/achievements/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const userAchievements = await storage.getUserAchievements(userId);
      res.json(userAchievements);
    } catch (error) {
      console.error("Error fetching user achievements:", error);
      res.status(500).json({ message: "Failed to fetch user achievements" });
    }
  });

  app.post("/api/achievements/check/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const newAchievements = await storage.checkAndAwardAchievements(userId);

      if (newAchievements.length > 0) {
        res.json({
          message: "New achievements unlocked!",
          achievements: newAchievements
        });
      } else {
        res.json({
          message: "No new achievements unlocked",
          achievements: []
        });
      }
    } catch (error) {
      console.error("Error checking achievements:", error);
      res.status(500).json({ message: "Failed to check achievements" });
    }
  });

  // New learning path personalization endpoint from edited code
  app.post("/api/learning-path/personalize/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const preferences = req.body;
      const topics = await storage.getBitcoinTopics();

      // Get existing progress
      const progress = await storage.getLearningProgress(userId);

      // Generate personalized learning path using OpenAI
      const personalizedPath = await generateLearningPath(
        preferences.experience,
        {
          userPreferences: preferences,
          currentProgress: progress
        }
      );

      // Save the personalized path with reading materials and quizzes
      await storage.savePersonalizedPath(userId, {
        userId,
        ...personalizedPath,
        preferences,
        createdAt: new Date()
      });

      // Update user's learning progress for each topic
      for (const topic of personalizedPath.next_topics) {
        const existingProgress = progress.find(p =>
          p.topicId === topics.find(t => t.name === topic.topic)?.id
        );

        if (!existingProgress) {
          await storage.updateLearningProgress({
            userId,
            topicId: topics.find(t => t.name === topic.topic)?.id || 0,
            completedExercises: 0,
            confidenceLevel: 0,
            lastActive: new Date(),
            quizzesPassed: 0,
            totalPoints: 0
          });
        }
      }

      res.json({
        message: "Learning path personalized successfully",
        path: personalizedPath
      });
    } catch (error) {
      console.error("Error personalizing learning path:", error);
      res.status(500).json({
        message: "Failed to personalize learning path",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.get("/api/learning-path/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const progress = await storage.getLearningProgress(userId);
      const topics = await storage.getBitcoinTopics();

      // Get the personalized path from storage
      const personalizedPath = await storage.getPersonalizedPath(userId);

      if (!personalizedPath) {
        // Return default path with reading materials and quizzes
        return res.json({
          next_topics: topics.map(topic => ({
            topic: topic.name,
            description: topic.description,
            reading_materials: [
              {
                title: "What is Bitcoin?",
                content: `Bitcoin is a decentralized digital currency that was created in 2009 by an unknown person or group using the name Satoshi Nakamoto. It enables peer-to-peer transactions without the need for intermediaries like banks or payment processors.
                
Key Points:
- Bitcoin operates on a technology called blockchain
- Transactions are verified by network nodes through cryptography
- Bitcoin has a limited supply of 21 million coins
- Transactions are irreversible and pseudonymous
                
How Bitcoin Works:
Bitcoin transactions are recorded on a public ledger called the blockchain. When you send Bitcoin, the transaction is broadcast to the network and included in a block once verified by miners. This process ensures security and prevents double-spending.`,
                estimated_time: "15 minutes"
              }
            ],
            quizzes: getDefaultQuizzes(topic.name),
            practical_exercises: getDefaultExercises(topic.name)
          })),
          recommended_resources: ["Bitcoin.org documentation"],
          estimated_completion_time: "4-6 weeks"
        });
      }

      // Update topic descriptions with the actual topic descriptions from the database
      const updatedTopics = personalizedPath.next_topics.map(topic => {
        const dbTopic = topics.find(t => t.name === topic.topic);
        return {
          ...topic,
          description: topic.description || dbTopic?.description || ""
        };
      });

      res.json({
        ...personalizedPath,
        next_topics: updatedTopics
      });
    } catch (error) {
      console.error("Error fetching learning path:", error);
      res.status(500).json({
        message: "Failed to fetch learning path",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // New endpoint to get all quiz questions
  app.get("/api/quiz/all", async (req, res) => {
    try {
      const allQuestions = await storage.getAllQuestions();

      if (!allQuestions || allQuestions.length === 0) {
        return res.status(404).json({
          message: "No questions found",
          suggestion: "Please check back later when questions are available."
        });
      }

      res.json(allQuestions);
    } catch (error) {
      console.error("Error fetching all quiz questions:", error);
      res.status(500).json({
        message: "Failed to fetch quiz questions",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  return httpServer;
}

// Update the translation helper functions to use type-safe approach
function getLocalizedDescription(topicName: string, lang: SupportedLanguages): string {
  return translations[lang]?.[topicName] || translations.en[topicName] || topicName;
}

// Update default reading materials implementation to include actual content
interface ReadingMaterial {
  title: string;
  content: string;
  estimated_time: string;
}

interface TopicQuiz {
  title: string;
  questions: Array<{
    question: string;
    options: string[];
    correct_answer: string;
    explanation: string;
  }>;
}

function getDefaultReadingMaterials(topicName: string): ReadingMaterial[] {
  const materials: Record<string, ReadingMaterial[]> = {
    "Bitcoin Basics": [
      {
        title: "What is Bitcoin?",
        content: `Bitcoin is a decentralized digital currency that was created in 2009 by an unknown person or group using the name Satoshi Nakamoto. It enables peer-to-peer transactions without the need for intermediaries like banks or payment processors.
        
Key Points:
- Bitcoin operates on a technology called blockchain
- Transactions are verified by network nodes through cryptography
- Bitcoin has a limited supply of 21 million coins
- Transactions are irreversible and pseudonymous
        
How Bitcoin Works:
Bitcoin transactions are recorded on a public ledger called the blockchain. When you send Bitcoin, the transaction is broadcast to the network and included in a block once verified by miners. This process ensures security and prevents double-spending.`,
        estimated_time: "15 minutes"
      },
      {
        title: "Bitcoin Wallets and Security",
        content: `A Bitcoin wallet is where you store your Bitcoin. Unlike traditional wallets, Bitcoin wallets don't actually store the coins themselves - they store the private keys that give you access to your Bitcoin on the blockchain.
        
Types of Bitcoin Wallets:
1. Hardware Wallets (Most Secure)
   - Physical devices that store your private keys offline
   - Examples: Ledger, Trezor
        
2. Software Wallets
   - Desktop applications
   - Mobile apps
   - Web wallets (least secure)
        
Security Best Practices:
- Never share your private keys
- Use strong passwords
- Enable two-factor authentication
- Keep backups of your wallet
- Consider using a hardware wallet for large amounts`,
        estimated_time: "20 minutes"
      }
    ],
    "Blockchain Technology": [
      {
        title: "Understanding Blockchain",
        content: `A blockchain is a distributed database that maintains a continuously growing list of records called blocks. Each block contains transaction data and is linked to the previous block, forming a chain.
        
Key Concepts:
- Decentralization: No single entity controls the network
- Transparency: All transactions are public
- Immutability: Once recorded, data cannot be altered
- Consensus: Network participants agree on the state of the system
        
Block Structure:
- Previous block hash
- Timestamp
- Transaction data
- Nonce (used in mining)`,
        estimated_time: "25 minutes"
      }
    ]
  };

  return materials[topicName] || [{
    title: `Introduction to ${topicName}`,
    content: `This section will introduce you to the key concepts of ${topicName} in the Bitcoin ecosystem.`,
    estimated_time: "15 minutes"
  }];
}

function getDefaultQuizzes(topicName: string): TopicQuiz[] {
  const quizzes: Record<string, TopicQuiz[]> = {
    "Bitcoin Basics": [
      {
        title: "Bitcoin Fundamentals Quiz",
        questions: [
          {
            question: "What is the maximum supply of Bitcoin?",
            options: ["21 million", "18 million", "25 million", "Unlimited"],
            correct_answer: "21 million",
            explanation: "Bitcoin has a fixed maximum supply of 21 million coins, which helps maintain its value through scarcity."
          }
        ]
      }
    ]
  };

  return quizzes[topicName] || [{
    title: `${topicName} Assessment`,
    questions: [
      {
        question: `What is the main purpose of ${topicName}?`,
        options: ["Option 1", "Option 2", "Option 3", "Option 4"],
        correct_answer: "Option 1",
        explanation: "This is a placeholder question. The actual quiz will contain relevant questions about the topic."
      }
    ]
  }];
}

function getDefaultExercises(topicName: string): string[] {
  const exercises: Record<string, string[]> = {
    "Bitcoin Basics": [
      "Create a paper wallet",
      "Send a test transaction",
      "Verify a transaction on the blockchain"
    ]
  };
  return exercises[topicName] || [`Practice ${topicName} concepts through hands-on exercises`];
}