import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertCheckinSchema, insertCommunityPostSchema, insertPostReplySchema } from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Fake auth for MVP (always user 1)
  const MOCK_USER_ID = 1;

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

  return httpServer;
}
