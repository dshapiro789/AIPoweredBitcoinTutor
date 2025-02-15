import { pgTable, text, serial, integer, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password"),
  googleId: text("google_id").unique(),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const bitcoinTopics = pgTable("bitcoin_topics", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  difficulty: text("difficulty").notNull(),
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
  confidenceLevel: integer("confidence_level").notNull().default(1),
  lastActive: timestamp("last_active").notNull(),
  quizzesPassed: integer("quizzes_passed").notNull().default(0),
  totalPoints: integer("total_points").notNull().default(0),
});

export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  topicId: integer("topic_id").notNull(),
  questionText: text("question_text").notNull(),
  type: text("type").notNull().default('multiple_choice'),
  options: jsonb("options").$type<string[]>().notNull(),
  correctAnswer: integer("correct_answer").notNull(),
  correctAnswerValue: jsonb("correct_answer_value").$type<string | number | boolean>(),
  explanation: text("explanation").notNull(),
  difficulty: text("difficulty").notNull(),
  points: integer("points").notNull().default(10),
  hints: jsonb("hints").$type<string[]>().default(['']).notNull(),
  context: text("context"),
  imageUrl: text("image_url"),
});

export const userQuizAttempts = pgTable("user_quiz_attempts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  topicId: integer("topic_id").notNull(),
  questionsAnswered: jsonb("questions_answered").$type<{
    questionId: number,
    answer: string | number | boolean,
    timeSpent: number
  }[]>().notNull(),
  score: integer("score").notNull(),
  completedAt: timestamp("completed_at").notNull(),
});

export const exercises = pgTable("exercises", {
  id: serial("id").primaryKey(),
  topicId: integer("topic_id").notNull(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  type: text("type").notNull(),
  difficulty: text("difficulty").notNull(),
  points: integer("points").notNull().default(20),
  requirements: jsonb("requirements").$type<string[]>().notNull(),
});

export const userExerciseProgress = pgTable("user_exercise_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  exerciseId: integer("exercise_id").notNull(),
  status: text("status").notNull(),
  progress: integer("progress").notNull().default(0),
  completedAt: timestamp("completed_at"),
  feedback: text("feedback"),
});

export const achievements = pgTable("achievements", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  type: text("type").notNull(),
  requirements: jsonb("requirements").$type<{type: string, value: number}[]>().notNull(),
  points: integer("points").notNull().default(50),
  badge: text("badge").notNull(),
});

export const userAchievements = pgTable("user_achievements", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  achievementId: integer("achievement_id").notNull(),
  unlockedAt: timestamp("unlocked_at").notNull(),
});

export const insertUserSchema = createInsertSchema(users);
export const insertBitcoinTopicSchema = createInsertSchema(bitcoinTopics);
export const insertChatSessionSchema = createInsertSchema(chatSessions);
export const insertLearningProgressSchema = createInsertSchema(learningProgress);
export const insertQuestionSchema = createInsertSchema(questions);
export const insertUserQuizAttemptSchema = createInsertSchema(userQuizAttempts);
export const insertExerciseSchema = createInsertSchema(exercises);
export const insertUserExerciseProgressSchema = createInsertSchema(userExerciseProgress);
export const insertAchievementSchema = createInsertSchema(achievements);
export const insertUserAchievementSchema = createInsertSchema(userAchievements);

export type User = typeof users.$inferSelect;
export type BitcoinTopic = typeof bitcoinTopics.$inferSelect;
export type ChatSession = typeof chatSessions.$inferSelect;
export type LearningProgress = typeof learningProgress.$inferSelect;
export type Question = typeof questions.$inferSelect;
export type UserQuizAttempt = typeof userQuizAttempts.$inferSelect;
export type Exercise = typeof exercises.$inferSelect;
export type UserExerciseProgress = typeof userExerciseProgress.$inferSelect;
export type Achievement = typeof achievements.$inferSelect;
export type UserAchievement = typeof userAchievements.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertBitcoinTopic = z.infer<typeof insertBitcoinTopicSchema>;
export type InsertChatSession = z.infer<typeof insertChatSessionSchema>;
export type InsertLearningProgress = z.infer<typeof insertLearningProgressSchema>;
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type InsertUserQuizAttempt = z.infer<typeof insertUserQuizAttemptSchema>;
export type InsertExercise = z.infer<typeof insertExerciseSchema>;
export type InsertUserExerciseProgress = z.infer<typeof insertUserExerciseProgressSchema>;
export type InsertAchievement = z.infer<typeof insertAchievementSchema>;
export type InsertUserAchievement = z.infer<typeof insertUserAchievementSchema>;