import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { getTutorResponse, analyzeProgress } from "./openai";
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
      res.json(newSession);
    } catch (error) {
      res.status(400).json({ message: "Invalid session data" });
    }
  });

  app.post("/api/chat/message", async (req, res) => {
    try {
      const { sessionId, message, subject } = req.body;
      const session = (await storage.getChatSessions(req.body.userId)).find(
        (s) => s.id === sessionId
      );

      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }

      const updatedMessages = [...session.messages, { role: "user", content: message }];
      const tutorResponse = await getTutorResponse(updatedMessages, subject);
      
      updatedMessages.push({ role: "assistant", content: tutorResponse });
      await storage.updateChatSession(sessionId, updatedMessages);

      res.json({ message: tutorResponse });
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

  app.post("/api/progress", async (req, res) => {
    try {
      const progress = insertProgressSchema.parse(req.body);
      await storage.updateProgress(progress);
      res.json({ message: "Progress updated" });
    } catch (error) {
      res.status(400).json({ message: "Invalid progress data" });
    }
  });

  return httpServer;
}
