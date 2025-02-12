import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { getTutorResponse, analyzeProgress, generateLearningPath } from "./openai";
import { insertUserSchema, insertChatSessionSchema, insertProgressSchema } from "@shared/schema";

export function registerRoutes(app: Express): Server {
  const httpServer = createServer(app);

  // Subject routes
  app.get("/api/subjects", async (req, res) => {
    try {
      const subjects = await storage.getSubjects();
      res.json(subjects);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch subjects" });
    }
  });

  // Chat session routes
  app.post("/api/chat/start", async (req, res) => {
    try {
      const session = insertChatSessionSchema.parse(req.body);
      const newSession = await storage.createChatSession(session);

      // Generate initial learning path
      const learningPath = await generateLearningPath(
        (await storage.getSubject(session.subjectId))?.name || "",
        "beginner"
      );

      res.json({ session: newSession, learningPath });
    } catch (error) {
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
      await storage.updateProgress({
        userId: session.userId,
        subjectId: session.subjectId,
        sessionsCompleted: session.messages.length / 2, // Count message pairs
        lastActive: new Date().toISOString(),
      });

      res.json({ 
        message: tutorResponse,
        analysis 
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to process message" });
    }
  });

  // Progress routes
  app.get("/api/progress/:userId", async (req, res) => {
    try {
      const progress = await storage.getProgress(parseInt(req.params.userId));
      res.json(progress);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch progress" });
    }
  });

  return httpServer;
}