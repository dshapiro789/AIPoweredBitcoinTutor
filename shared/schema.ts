import { pgTable, text, serial, integer, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const bitcoinTopics = pgTable("bitcoin_topics", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(), // e.g., 'basics', 'security', 'transactions'
  difficulty: text("difficulty").notNull(), // 'beginner', 'intermediate'
  description: text("description").notNull(),
});

export const chatSessions = pgTable("chat_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  topicId: integer("topic_id").notNull(),
  messages: jsonb("messages").$type<{role: string, content: string}[]>().notNull(),
  isActive: boolean("is_active").notNull().default(true),
});

export const learningProgress = pgTable("learning_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  topicId: integer("topic_id").notNull(),
  completedExercises: integer("completed_exercises").notNull().default(0),
  confidenceLevel: integer("confidence_level").notNull().default(1), // 1-5 scale
  lastActive: timestamp("last_active").notNull(),
});

export const insertUserSchema = createInsertSchema(users);
export const insertBitcoinTopicSchema = createInsertSchema(bitcoinTopics);
export const insertChatSessionSchema = createInsertSchema(chatSessions);
export const insertLearningProgressSchema = createInsertSchema(learningProgress);

export type User = typeof users.$inferSelect;
export type BitcoinTopic = typeof bitcoinTopics.$inferSelect;
export type ChatSession = typeof chatSessions.$inferSelect;
export type LearningProgress = typeof learningProgress.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertBitcoinTopic = z.infer<typeof insertBitcoinTopicSchema>;
export type InsertChatSession = z.infer<typeof insertChatSessionSchema>;
export type InsertLearningProgress = z.infer<typeof insertLearningProgressSchema>;