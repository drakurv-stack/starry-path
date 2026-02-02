import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const checkins = pgTable("checkins", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  dateISO: text("date_iso").notNull(),
  mood: integer("mood").notNull(),
  urge: integer("urge").notNull(),
  triggers: text("triggers").array().notNull(),
  note: text("note"),
  wins: text("wins").array().notNull(),
  relapseBool: boolean("relapse_bool").notNull().default(false),
});

export const streaks = pgTable("streaks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique(),
  current: integer("current").notNull().default(0),
  longest: integer("longest").notNull().default(0),
  lastCheckinDateISO: text("last_checkin_date_iso"),
  freeSinceISO: text("free_since_iso"),
  orbs: integer("orbs").notNull().default(0),
});

export const communityPosts = pgTable("community_posts", {
  id: serial("id").primaryKey(),
  authorAlias: text("author_alias").notNull(),
  content: text("content").notNull(),
  tags: text("tags").array().notNull(),
  likesCount: integer("likes_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const postReplies = pgTable("post_replies", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull(),
  authorAlias: text("author_alias").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const learnLessons = pgTable("learn_lessons", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: jsonb("content").notNull(), // sections, action steps
  quiz: jsonb("quiz").notNull(), // questions
});

export const userLessons = pgTable("user_lessons", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  lessonId: integer("lesson_id").notNull(),
  completed: boolean("completed").notNull().default(false),
});

// Schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertCheckinSchema = createInsertSchema(checkins).omit({ id: true });
export const insertStreakSchema = createInsertSchema(streaks).omit({ id: true });
export const insertCommunityPostSchema = createInsertSchema(communityPosts).omit({ id: true, createdAt: true });
export const insertPostReplySchema = createInsertSchema(postReplies).omit({ id: true, createdAt: true });

export const coachMessages = pgTable("coach_messages", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  role: text("role").notNull(), // 'user' | 'coach'
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  tags: text("tags").array(),
});

export const insertCoachMessageSchema = createInsertSchema(coachMessages).omit({ id: true, createdAt: true });
export type CoachMessage = typeof coachMessages.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Checkin = typeof checkins.$inferSelect;
export type InsertCheckin = z.infer<typeof insertCheckinSchema>;
export type Streak = typeof streaks.$inferSelect;
export type InsertStreak = z.infer<typeof insertStreakSchema>;
export type CommunityPost = typeof communityPosts.$inferSelect;
export type PostReply = typeof postReplies.$inferSelect;
export type LearnLesson = typeof learnLessons.$inferSelect;
export type UserLesson = typeof userLessons.$inferSelect;
