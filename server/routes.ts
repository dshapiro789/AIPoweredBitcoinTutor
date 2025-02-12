import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { getTutorResponse, analyzeProgress, generateLearningPath } from "./openai";
import { insertUserSchema, insertChatSessionSchema, insertLearningProgressSchema } from "@shared/schema";

export function registerRoutes(app: Express): Server {
  const httpServer = createServer(app);

  // Bitcoin topics routes
  app.get("/api/bitcoin/topics", async (req, res) => {
    try {
      const topics = await storage.getBitcoinTopics();
      res.json(topics);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch Bitcoin topics" });
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
      const session = insertChatSessionSchema.parse(req.body);
      const newSession = await storage.createChatSession(session);

      // Generate initial learning path
      const learningPath = await generateLearningPath(
        (await storage.getBitcoinTopic(session.topicId))?.name || "",
        "beginner"
      );

      res.json({ session: newSession, learningPath });
    } catch (error) {
      console.error("Error starting chat session:", error);
      res.status(400).json({ message: "Invalid session data" });
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

  return httpServer;
}