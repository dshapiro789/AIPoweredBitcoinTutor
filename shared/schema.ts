import { pgTable, text, serial, integer, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const subjects = pgTable("subjects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  description: text("description").notNull(),
});

export const chatSessions = pgTable("chat_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  subjectId: integer("subject_id").notNull(),
  messages: jsonb("messages").$type<{role: string, content: string}[]>().notNull(),
  isActive: boolean("is_active").notNull().default(true),
});

export const progress = pgTable("progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  subjectId: integer("subject_id").notNull(),
  sessionsCompleted: integer("sessions_completed").notNull().default(0),
  lastActive: timestamp("last_active").notNull(),
});

export const insertUserSchema = createInsertSchema(users);
export const insertSubjectSchema = createInsertSchema(subjects);
export const insertChatSessionSchema = createInsertSchema(chatSessions);
export const insertProgressSchema = createInsertSchema(progress);

export type User = typeof users.$inferSelect;
export type Subject = typeof subjects.$inferSelect;
export type ChatSession = typeof chatSessions.$inferSelect;
export type Progress = typeof progress.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertSubject = z.infer<typeof insertSubjectSchema>;
export type InsertChatSession = z.infer<typeof insertChatSessionSchema>;
export type InsertProgress = z.infer<typeof insertProgressSchema>;
