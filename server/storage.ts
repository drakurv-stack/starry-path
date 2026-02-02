import { 
  users, type User, type InsertUser,
  checkins, type Checkin, type InsertCheckin,
  streaks, type Streak, type InsertStreak,
  communityPosts, type CommunityPost,
  postReplies, type PostReply,
  learnLessons, type LearnLesson,
  userLessons, type UserLesson
} from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Checkins
  getCheckins(userId: number): Promise<Checkin[]>;
  createCheckin(checkin: InsertCheckin): Promise<Checkin>;

  // Streaks
  getStreak(userId: number): Promise<Streak | undefined>;
  updateStreak(userId: number, streak: Partial<InsertStreak>): Promise<Streak>;

  // Community
  getPosts(): Promise<(CommunityPost & { replies: PostReply[] })[]>;
  createPost(post: Omit<CommunityPost, "id" | "likesCount" | "createdAt">): Promise<CommunityPost>;
  likePost(postId: number): Promise<CommunityPost>;
  addReply(postId: number, reply: Omit<PostReply, "id" | "createdAt">): Promise<PostReply>;

  // Learn
  getLessons(): Promise<LearnLesson[]>;
  getUserLessons(userId: number): Promise<UserLesson[]>;
  completeLesson(userId: number, lessonId: number): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private checkins: Map<number, Checkin>;
  private streaks: Map<number, Streak>;
  private posts: Map<number, CommunityPost>;
  private replies: Map<number, PostReply[]>;
  private lessons: Map<number, LearnLesson>;
  private userLessons: Map<number, UserLesson[]>;
  private currentId: number;

  constructor() {
    this.users = new Map();
    this.checkins = new Map();
    this.streaks = new Map();
    this.posts = new Map();
    this.replies = new Map();
    this.lessons = new Map();
    this.userLessons = new Map();
    this.currentId = 1;
    this.seedLessons();
  }

  private seedLessons() {
    const lessonData = [
      { title: "Dopamine loop & habit cycle", content: {}, quiz: {} },
      { title: "Why novelty is addictive", content: {}, quiz: {} },
      { title: "Urge surfing", content: {}, quiz: {} },
      { title: "Environment design", content: {}, quiz: {} },
      { title: "Replacement habits", content: {}, quiz: {} },
      { title: "Sleep/stress relationship", content: {}, quiz: {} },
      { title: "Relapse recovery plan", content: {}, quiz: {} },
      { title: "Relationships & intimacy rebuild", content: {}, quiz: {} },
      { title: "Focus & productivity reset", content: {}, quiz: {} },
      { title: "Milestones", content: {}, quiz: {} }
    ];
    lessonData.forEach((l, i) => {
      this.lessons.set(i + 1, { id: i + 1, ...l } as LearnLesson);
    });
  }

  async getUser(id: number): Promise<User | undefined> { return this.users.get(id); }
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(u => u.username === username);
  }
  async createUser(insertUser: InsertUser): Promise<User> {
    const user: User = { ...insertUser, id: this.currentId++ };
    this.users.set(user.id, user);
    return user;
  }

  async getCheckins(userId: number): Promise<Checkin[]> {
    return Array.from(this.checkins.values()).filter(c => c.userId === userId);
  }
  async createCheckin(checkin: InsertCheckin): Promise<Checkin> {
    const newCheckin: Checkin = { ...checkin, id: this.currentId++ };
    this.checkins.set(newCheckin.id, newCheckin);
    return newCheckin;
  }

  async getStreak(userId: number): Promise<Streak | undefined> {
    return Array.from(this.streaks.values()).find(s => s.userId === userId);
  }
  async updateStreak(userId: number, update: Partial<InsertStreak>): Promise<Streak> {
    const existing = await this.getStreak(userId);
    const streak: Streak = existing 
      ? { ...existing, ...update } 
      : { id: this.currentId++, userId, current: 0, longest: 0, orbs: 0, lastCheckinDateISO: null, freeSinceISO: null, ...update };
    this.streaks.set(streak.userId, streak);
    return streak;
  }

  async getPosts(): Promise<(CommunityPost & { replies: PostReply[] })[]> {
    return Array.from(this.posts.values()).map(p => ({
      ...p,
      replies: this.replies.get(p.id) || []
    }));
  }
  async createPost(post: Omit<CommunityPost, "id" | "likesCount" | "createdAt">): Promise<CommunityPost> {
    const newPost: CommunityPost = { 
      ...post, 
      id: this.currentId++, 
      likesCount: 0, 
      createdAt: new Date() 
    };
    this.posts.set(newPost.id, newPost);
    return newPost;
  }
  async likePost(postId: number): Promise<CommunityPost> {
    const post = this.posts.get(postId);
    if (!post) throw new Error("Post not found");
    const updated = { ...post, likesCount: post.likesCount + 1 };
    this.posts.set(postId, updated);
    return updated;
  }
  async addReply(postId: number, reply: Omit<PostReply, "id" | "createdAt">): Promise<PostReply> {
    const newReply: PostReply = { ...reply, id: this.currentId++, createdAt: new Date() };
    const existing = this.replies.get(postId) || [];
    this.replies.set(postId, [...existing, newReply]);
    return newReply;
  }

  async getLessons(): Promise<LearnLesson[]> { return Array.from(this.lessons.values()); }
  async getUserLessons(userId: number): Promise<UserLesson[]> { return this.userLessons.get(userId) || []; }
  async completeLesson(userId: number, lessonId: number): Promise<void> {
    const existing = this.userLessons.get(userId) || [];
    if (!existing.find(ul => ul.lessonId === lessonId)) {
      this.userLessons.set(userId, [...existing, { id: this.currentId++, userId, lessonId, completed: true }]);
    }
  }
}

export const storage = new MemStorage();
