import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { getTutorResponse, analyzeProgress, generateLearningPath } from "./openai";
import { insertUserSchema, insertChatSessionSchema, insertLearningProgressSchema, insertUserQuizAttemptSchema } from "@shared/schema";
import { ZodError } from "zod";

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

  // Bitcoin topics routes
  app.get("/api/bitcoin/topics", async (req, res) => {
    try {
      const topics = await storage.getBitcoinTopics();
      const lang = req.query.lang?.toString() || 'en';

      // Add localized descriptions
      const localizedTopics = topics.map(topic => {
        const descriptions = {
          en: topic.description,
          es: getSpanishDescription(topic.name),
          'es-419': getLatinAmericanSpanishDescription(topic.name),
          zh: getChineseDescription(topic.name),
          ja: getJapaneseDescription(topic.name)
        };

        return {
          ...topic,
          description: descriptions[lang] || descriptions.en
        };
      });

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
        return res.status(400).json({ message: "Invalid topic ID" });
      }

      const questions = await storage.getQuestionsByTopic(topicId);

      if (!questions || questions.length === 0) {
        return res.status(404).json({
          message: "No questions found for this topic",
          suggestion: "Try another topic or check back later when more questions are available."
        });
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

      const updatedMessages = [...session.messages, { role: "user", content: message }];

      // Get tutor's response
      const tutorResponse = await getTutorResponse(updatedMessages, subject);
      updatedMessages.push({ role: "assistant", content: tutorResponse });

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

      // Save the personalized path
      await storage.savePersonalizedPath(userId, {
        userId,
        ...personalizedPath,
        preferences,
        createdAt: new Date()
      });

      // Update user's learning progress with the new personalized path
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
            totalPoints: 0,
            metadata: {
              topicPreferences: {
                learningStyle: preferences.style,
                timeCommitment: preferences.time,
                practicalExercises: topic.practical_exercises
              }
            }
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
        // Return default path if no personalization exists
        return res.json({
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


  return httpServer;
}

// Helper functions for translations
function getSpanishDescription(topicName: string): string {
  const descriptions = {
    "Bitcoin Basics": "Comprenda qué es Bitcoin, su historia y conceptos fundamentales",
    "Blockchain Technology": "Explore la tecnología blockchain y cómo funciona Bitcoin",
    "Digital Security": "Aprenda sobre la seguridad digital y cómo proteger sus bitcoins",
    "Trading Fundamentals": "Comprenda los conceptos básicos del trading de Bitcoin",
    "Advanced Concepts": "Profundice en conceptos avanzados de Bitcoin y blockchain",
    "Wallet Security": "Aprenda cómo almacenar y gestionar sus Bitcoin de forma segura",
    "Transaction Fundamentals": "Comprenda las transacciones de Bitcoin, las comisiones y el proceso de confirmación",
    "UTXO Management": "Gestión avanzada de transacciones y optimización de UTXO",
    "Cold Storage": "Configuración y gestión de soluciones de almacenamiento en frío para Bitcoin"
  };
  return descriptions[topicName] || "";
}

function getLatinAmericanSpanishDescription(topicName: string): string {
  const descriptions = {
    "Bitcoin Basics": "Entiende qué es Bitcoin, su historia y conceptos fundamentales",
    "Blockchain Technology": "Explora la tecnología blockchain y cómo funciona Bitcoin",
    "Digital Security": "Aprende sobre la seguridad digital y cómo proteger tus bitcoins",
    "Trading Fundamentals": "Comprende los conceptos básicos del trading de Bitcoin",
    "Advanced Concepts": "Profundiza en conceptos avanzados de Bitcoin y blockchain",
    "Wallet Security": "Aprende cómo guardar y administrar tus Bitcoin de forma segura",
    "Transaction Fundamentals": "Comprende las transacciones de Bitcoin, las comisiones y el proceso de confirmación",
    "UTXO Management": "Manejo avanzado de transacciones y optimización de UTXO",
    "Cold Storage": "Configuración y administración de soluciones de almacenamiento en frío para Bitcoin"
  };
  return descriptions[topicName] || "";
}

function getChineseDescription(topicName: string): string {
  const descriptions = {
    "Bitcoin Basics": "了解比特币是什么、其历史和基本概念",
    "Blockchain Technology": "探索区块链技术和比特币的运作方式",
    "Digital Security": "学习数字安全和如何保护您的比特币",
    "Trading Fundamentals": "理解比特币交易的基本概念",
    "Advanced Concepts": "深入了解比特币和区块链的高级概念",
    "Wallet Security": "学习如何安全地存储和管理您的比特币",
    "Transaction Fundamentals": "了解比特币交易、费用和确认流程",
    "UTXO Management": "高级交易处理和UTXO优化",
    "Cold Storage": "设置和管理比特币冷存储解决方案"
  };
  return descriptions[topicName] || "";
}

function getJapaneseDescription(topicName: string): string {
  const descriptions = {
    "Bitcoin Basics": "ビットコインとは何か、その歴史と基本的な概念を理解する",
    "Blockchain Technology": "ブロックチェーン技術とビットコインの仕組みを探る",
    "Digital Security": "デジタルセキュリティとビットコインの保護方法を学ぶ",
    "Trading Fundamentals": "ビットコイン取引の基本概念を理解する",
    "Advanced Concepts": "ビットコインとブロックチェーンの高度な概念を深く学ぶ",
    "Wallet Security": "ビットコインを安全に保管・管理する方法を学ぶ",
    "Transaction Fundamentals": "ビットコインの取引、手数料、承認プロセスを理解する",
    "UTXO Management": "高度な取引処理とUTXOの最適化",
    "Cold Storage": "ビットコインのコールドストレージソリューションの設定と管理"
  };
  return descriptions[topicName] || "";
}