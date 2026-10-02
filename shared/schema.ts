import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  serial,
  integer,
  boolean,
  timestamp,
  jsonb,
  date,
  index,
  unique,
  check,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").unique("users_email_key"),
  streak: integer("streak").notNull().default(0),
  orbs: integer("orbs").notNull().default(0),
  shieldStatus: boolean("shield_status").notNull().default(false),
  personalNote: text("personal_note"),
  freeSince: date("free_since"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const dailyLogs = pgTable("daily_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  logDate: date("log_date").notNull(),
  status: text("status").notNull(),
  details: jsonb("details").notNull().default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  unique("daily_logs_user_id_log_date_key").on(table.userId, table.logDate),
  index("daily_logs_user_date_idx").on(table.userId, table.logDate.desc()),
  check("daily_logs_status_check", sql`${table.status} IN ('completed', 'slipped')`),
]);

export const partnerLinks = pgTable("partner_links", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  partnerEmail: text("partner_email").notNull(),
  partnerName: text("partner_name"),
  inviteCode: text("invite_code").notNull().unique("partner_links_invite_code_key"),
  status: text("status").notNull().default("pending"),
  shareNotes: boolean("share_notes").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  linkedAt: timestamp("linked_at"),
}, (table) => [
  index("partner_links_user_idx").on(table.userId),
  check("partner_links_status_check", sql`${table.status} IN ('pending', 'active', 'revoked')`),
]);

export const approvalRequests = pgTable("approval_requests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  partnerLinkId: integer("partner_link_id").references(() => partnerLinks.id, { onDelete: "set null" }),
  actionType: text("action_type").notNull(),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  resolvedAt: timestamp("resolved_at"),
}, (table) => [
  index("approval_requests_user_idx").on(table.userId, table.createdAt.desc()),
  check(
    "approval_requests_action_type_check",
    sql`${table.actionType} IN ('delete_account', 'disable_shield', 'remove_partner')`,
  ),
  check("approval_requests_status_check", sql`${table.status} IN ('pending', 'approved', 'denied')`),
]);

export const partnerNotifications = pgTable("partner_notifications", {
  id: serial("id").primaryKey(),
  partnerLinkId: integer("partner_link_id").notNull().references(() => partnerLinks.id, { onDelete: "cascade" }),
  eventType: text("event_type").notNull(),
  message: text("message"),
  sentAt: timestamp("sent_at").notNull().defaultNow(),
  read: boolean("read").notNull().default(false),
}, (table) => [
  index("partner_notifications_link_idx").on(table.partnerLinkId, table.sentAt.desc()),
  check(
    "partner_notifications_event_type_check",
    sql`${table.eventType} IN ('streak_broken', 'approval_needed', 'milestone_hit')`,
  ),
]);

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
  name: true,
  email: true,
});

export const insertDailyLogSchema = createInsertSchema(dailyLogs).omit({ id: true, createdAt: true });
export const insertPartnerLinkSchema = createInsertSchema(partnerLinks).omit({ id: true, createdAt: true, linkedAt: true, inviteCode: true });
export const insertApprovalRequestSchema = createInsertSchema(approvalRequests).omit({ id: true, createdAt: true, resolvedAt: true });

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
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type DailyLog = typeof dailyLogs.$inferSelect;
export type PartnerLink = typeof partnerLinks.$inferSelect;
export type ApprovalRequest = typeof approvalRequests.$inferSelect;
export type PartnerNotification = typeof partnerNotifications.$inferSelect;
export type Checkin = typeof checkins.$inferSelect;
export type InsertCheckin = z.infer<typeof insertCheckinSchema>;
export type Streak = typeof streaks.$inferSelect;
export type InsertStreak = z.infer<typeof insertStreakSchema>;
export type CommunityPost = typeof communityPosts.$inferSelect;
export type PostReply = typeof postReplies.$inferSelect;
export type LearnLesson = typeof learnLessons.$inferSelect;
export type UserLesson = typeof userLessons.$inferSelect;
