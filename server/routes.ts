import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertCheckinSchema,
  insertCommunityPostSchema,
  insertPostReplySchema,
} from "@shared/schema";
import {
  createApprovalRequest,
  createPartner,
  acceptPartnerInvite,
  getApprovalRequests,
  getDailyLogs,
  getPartnerPortalApprovals,
  getPartnerPortalNotifications,
  getPartnerPortalProfile,
  getPartnerNotifications,
  getPartners,
  getUser,
  markPartnerPortalNotificationRead,
  recordDailyLog,
  resolvePartnerPortalApproval,
  updatePartnerStatus,
  updateUser,
} from "./persistence";
import { z } from "zod";
import { REQUIRED_PLANK_SECONDS, REQUIRED_PUSHUPS } from "@shared/movement";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Fake auth for MVP (always user 1)
  const MOCK_USER_ID = 1;

  app.get("/api/profile", async (_req, res) => {
    const user = await getUser(MOCK_USER_ID);
    res.json(user);
  });

  app.patch("/api/profile", async (req, res) => {
    const result = z
      .object({
        name: z.string().trim().min(1).max(80).optional(),
        email: z.string().trim().email().optional(),
        personalNote: z.string().max(500).nullable().optional(),
        shieldStatus: z.boolean().optional(),
      })
      .safeParse(req.body);
    if (!result.success) return res.status(400).json(result.error);
    const user = await updateUser(MOCK_USER_ID, result.data);
    res.json(user);
  });

  app.get("/api/daily-logs", async (_req, res) => {
    res.json(await getDailyLogs(MOCK_USER_ID));
  });

  app.post("/api/daily-logs", async (req, res) => {
    const result = z
      .object({
        logDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        status: z.enum(["completed", "slipped"]),
        details: z
          .object({
            mood: z.number().int().min(1).max(5).nullable(),
            urge: z.number().int().min(0).max(10),
            triggers: z.array(z.string().max(50)).max(20),
            wins: z.array(z.string().max(80)).max(20),
            note: z.string().max(2000).nullable(),
            movementChallenge: z.object({
              pushups: z.number().int().min(REQUIRED_PUSHUPS).max(100),
              plankSeconds: z.number().int().min(REQUIRED_PLANK_SECONDS).max(1800),
            }),
          })
          .optional(),
      })
      .safeParse(req.body);
    if (!result.success) return res.status(400).json(result.error);
    if (!result.data.details?.movementChallenge) {
      return res.status(400).json({ message: "Complete the required movement challenge before saving this check-in." });
    }
    const saved = await recordDailyLog(
      MOCK_USER_ID,
      result.data.logDate,
      result.data.status,
      result.data.details,
    );
    res.json(saved);
  });

  app.get("/api/partners", async (_req, res) => {
    res.json(await getPartners(MOCK_USER_ID));
  });

  app.post("/api/partners", async (req, res) => {
    const result = z
      .object({
        partnerEmail: z.string().trim().email(),
        partnerName: z.string().trim().max(80).nullable().optional(),
        shareNotes: z.boolean().default(false),
      })
      .safeParse(req.body);
    if (!result.success) return res.status(400).json(result.error);
    const partner = await createPartner(
      MOCK_USER_ID,
      result.data.partnerEmail,
      result.data.partnerName ?? null,
      result.data.shareNotes,
    );
    res.status(201).json(partner);
  });

  app.patch("/api/partners/:id", async (req, res) => {
    const result = z.object({ status: z.literal("revoked") }).safeParse(req.body);
    const partnerId = Number(req.params.id);
    if (!result.success || !Number.isInteger(partnerId)) {
      return res.status(400).json({ message: "Invalid partner update" });
    }
    const partner = await updatePartnerStatus(MOCK_USER_ID, partnerId, result.data.status);
    if (!partner) return res.status(404).json({ message: "Partner link not found" });
    res.json(partner);
  });

  const inviteBodySchema = z.object({
    inviteCode: z.string().regex(/^[A-F0-9]{32}$/i),
  });

  app.post("/api/partner-portal/lookup", async (req, res) => {
    const result = inviteBodySchema.safeParse(req.body);
    if (!result.success) return res.status(400).json(result.error);
    const partner = await getPartnerPortalProfile(result.data.inviteCode.toUpperCase());
    if (!partner) return res.status(404).json({ message: "Invite link not found" });
    res.json(partner);
  });

  app.post("/api/partner-portal/accept", async (req, res) => {
    const result = inviteBodySchema.safeParse(req.body);
    if (!result.success) return res.status(400).json(result.error);
    const partner = await acceptPartnerInvite(result.data.inviteCode.toUpperCase());
    if (!partner) {
      return res.status(404).json({ message: "This invite is no longer available" });
    }
    res.json(partner);
  });

  app.post("/api/partner-portal/approvals", async (req, res) => {
    const result = inviteBodySchema.safeParse(req.body);
    if (!result.success) return res.status(400).json(result.error);
    const partner = await getPartnerPortalProfile(result.data.inviteCode.toUpperCase());
    if (!partner || partner.status !== "active") {
      return res.status(403).json({ message: "Accept the invite to view approval requests" });
    }
    res.json(await getPartnerPortalApprovals(result.data.inviteCode.toUpperCase()));
  });

  app.post("/api/partner-portal/approvals/:id/resolve", async (req, res) => {
    const result = inviteBodySchema
      .extend({ status: z.enum(["approved", "denied"]) })
      .safeParse(req.body);
    const requestId = Number(req.params.id);
    if (!result.success || !Number.isInteger(requestId)) {
      return res.status(400).json({ message: "Invalid approval update" });
    }
    const request = await resolvePartnerPortalApproval(
      result.data.inviteCode.toUpperCase(),
      requestId,
      result.data.status,
    );
    if (!request) return res.status(404).json({ message: "Pending request not found" });
    res.json(request);
  });

  app.post("/api/partner-portal/notifications", async (req, res) => {
    const result = inviteBodySchema.safeParse(req.body);
    if (!result.success) return res.status(400).json(result.error);
    const partner = await getPartnerPortalProfile(result.data.inviteCode.toUpperCase());
    if (!partner || partner.status !== "active") {
      return res.status(403).json({ message: "Accept the invite to view notifications" });
    }
    res.json(await getPartnerPortalNotifications(result.data.inviteCode.toUpperCase()));
  });

  app.post("/api/partner-portal/notifications/:id/read", async (req, res) => {
    const result = inviteBodySchema.safeParse(req.body);
    const notificationId = Number(req.params.id);
    if (!result.success || !Number.isInteger(notificationId)) {
      return res.status(400).json({ message: "Invalid notification update" });
    }
    await markPartnerPortalNotificationRead(
      result.data.inviteCode.toUpperCase(),
      notificationId,
    );
    res.sendStatus(204);
  });

  app.get("/api/approvals", async (_req, res) => {
    res.json(await getApprovalRequests(MOCK_USER_ID));
  });

  app.post("/api/approvals", async (req, res) => {
    const result = z
      .object({
        partnerLinkId: z.number().int().positive().nullable(),
        actionType: z.enum(["delete_account", "disable_shield", "remove_partner"]),
      })
      .safeParse(req.body);
    if (!result.success) return res.status(400).json(result.error);
    try {
      const request = await createApprovalRequest(
        MOCK_USER_ID,
        result.data.partnerLinkId,
        result.data.actionType,
      );
      res.status(201).json(request);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Could not request approval" });
    }
  });

  app.get("/api/partner-notifications", async (_req, res) => {
    res.json(await getPartnerNotifications(MOCK_USER_ID));
  });

  app.get("/api/checkins", async (req, res) => {
    const checkins = await storage.getCheckins(MOCK_USER_ID);
    res.json(checkins);
  });

  app.post("/api/checkins", async (req, res) => {
    const result = insertCheckinSchema.safeParse({ ...req.body, userId: MOCK_USER_ID });
    if (!result.success) return res.status(400).json(result.error);
    const checkin = await storage.createCheckin(result.data);
    
    // Update streak logic
    const streak = await storage.getStreak(MOCK_USER_ID);
    let { current, longest, orbs } = streak || { current: 0, longest: 0, orbs: 0 };
    
    if (checkin.relapseBool) {
      current = 0;
    } else {
      current++;
      if (current > longest) longest = current;
      orbs += 10;
    }
    
    await storage.updateStreak(MOCK_USER_ID, { current, longest, orbs, lastCheckinDateISO: checkin.dateISO });
    res.json(checkin);
  });

  app.get("/api/streak", async (req, res) => {
    const streak = await storage.getStreak(MOCK_USER_ID);
    res.json(streak || { current: 0, longest: 0, orbs: 0 });
  });

  app.get("/api/posts", async (req, res) => {
    const posts = await storage.getPosts();
    res.json(posts);
  });

  app.post("/api/posts", async (req, res) => {
    const result = insertCommunityPostSchema.safeParse(req.body);
    if (!result.success) return res.status(400).json(result.error);
    const post = await storage.createPost(result.data);
    res.json(post);
  });

  app.post("/api/posts/:id/like", async (req, res) => {
    const post = await storage.likePost(parseInt(req.params.id));
    res.json(post);
  });

  app.post("/api/posts/:id/replies", async (req, res) => {
    const result = insertPostReplySchema.safeParse(req.body);
    if (!result.success) return res.status(400).json(result.error);
    const reply = await storage.addReply(parseInt(req.params.id), { ...result.data, postId: parseInt(req.params.id) });
    res.json(reply);
  });

  app.get("/api/lessons", async (req, res) => {
    const lessons = await storage.getLessons();
    const userLessons = await storage.getUserLessons(MOCK_USER_ID);
    res.json(lessons.map(l => ({
      ...l,
      completed: !!userLessons.find(ul => ul.lessonId === l.id)
    })));
  });

  app.post("/api/lessons/:id/complete", async (req, res) => {
    await storage.completeLesson(MOCK_USER_ID, parseInt(req.params.id));
    res.sendStatus(200);
  });

  app.get("/api/coach/messages", async (req, res) => {
    const messages = await storage.getCoachMessages(MOCK_USER_ID);
    res.json(messages);
  });

  app.post("/api/coach/messages", async (req, res) => {
    const msg = await storage.addCoachMessage(MOCK_USER_ID, req.body);
    res.json(msg);
  });

  return httpServer;
}
