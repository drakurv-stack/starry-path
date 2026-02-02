import { useState, useEffect, useMemo, useRef } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  Users,
  MessageCircle,
  Heart,
  Share2,
  Plus,
  TrendingUp,
  Clock,
  Filter,
  Send,
  Sparkles,
  ArrowLeft,
  Search
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const STORAGE_KEY = "orbit:community_v1";

const ALIAS_PREFIXES = ["NightWalker", "BlueComet", "QuietLion", "SolarWind", "StarSeeker", "LunarFox", "VoidGazer", "NeonPulse"];
const TAGS = ["#urge", "#day1", "#win", "#relapse", "#focus", "#sleep", "#stress", "#motivation"];

type Reply = {
  id: string;
  authorAlias: string;
  avatarSeed: number;
  createdAt: string;
  content: string;
};

type Post = {
  id: string;
  authorAlias: string;
  avatarSeed: number;
  createdAt: string;
  content: string;
  tags: string[];
  likeCount: number;
  likedByMe: boolean;
  replyCount: number;
  replies: Reply[];
};

function generateAlias() {
  const prefix = ALIAS_PREFIXES[Math.floor(Math.random() * ALIAS_PREFIXES.length)];
  const num = Math.floor(Math.random() * 100).toString().padStart(2, "0");
  return `${prefix}_${num}`;
}

function getAvatarColor(seed: number) {
  const colors = [
    "from-violet-500 to-fuchsia-500",
    "from-cyan-500 to-blue-500",
    "from-pink-500 to-rose-500",
    "from-amber-500 to-orange-500",
    "from-emerald-500 to-teal-500",
    "from-indigo-500 to-purple-500"
  ];
  return colors[seed % colors.length];
}

const SEEDED_POSTS: Post[] = [
  {
    id: "1",
    authorAlias: "NightWalker_04",
    avatarSeed: 1,
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    content: "Day 14. The urges are getting quieter. Urge surfing really works. If you're struggling, just wait 10 minutes.",
    tags: ["#day14", "#urge", "#win"],
    likeCount: 24,
    likedByMe: false,
    replyCount: 3,
    replies: [
      { id: "r1", authorAlias: "SolarWind_22", avatarSeed: 4, createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), content: "Proud of you! Keep going." }
    ]
  },
  {
    id: "2",
    authorAlias: "BlueComet_88",
    avatarSeed: 2,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    content: "Relapsed today after a month. Feeling discouraged but restarting now. No shame, just data.",
    tags: ["#relapse", "#restart", "#day0"],
    likeCount: 42,
    likedByMe: false,
    replyCount: 8,
    replies: []
  },
  {
    id: "3",
    authorAlias: "QuietLion_07",
    avatarSeed: 3,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    content: "Focused on deep work for 2 hours today without distractions. Feeling my brain healing slowly.",
    tags: ["#focus", "#win", "#productivity"],
    likeCount: 15,
    likedByMe: false,
    replyCount: 1,
    replies: []
  }
];

// Add 40 more seeded posts to simulate a real feed
for (let i = 4; i <= 45; i++) {
  const hoursAgo = Math.floor(Math.random() * 100) + 1;
  const alias = generateAlias();
  const seed = Math.floor(Math.random() * 100);
  SEEDED_POSTS.push({
    id: i.toString(),
    authorAlias: alias,
    avatarSeed: seed,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * hoursAgo).toISOString(),
    content: `Seeded post content ${i} - talking about ${TAGS[i % TAGS.length]} and progress. Keep the orbit steady.`,
    tags: [TAGS[i % TAGS.length], "#community"],
    likeCount: Math.floor(Math.random() * 50),
    likedByMe: false,
    replyCount: Math.floor(Math.random() * 5),
    replies: []
  });
}

export default function CommunityPage() {
  const [, navigate] = useLocation();
  const [posts, setPosts] = useState<Post[]>([]);
  const [userAlias, setUserAlias] = useState("");
  const [userSeed, setUserSeed] = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const [newPostContent, setNewPostContent] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"latest" | "top">("latest");
  const [activePost, setActivePost] = useState<Post | null>(null);
  const [replyInput, setReplyInput] = useState("");

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      setPosts(data.posts);
      setUserAlias(data.userAlias);
      setUserSeed(data.userSeed);
    } else {
      const alias = generateAlias();
      const seed = Math.floor(Math.random() * 100);
      const initialData = {
        posts: SEEDED_POSTS,
        userAlias: alias,
        userSeed: seed,
        stats: { strong: 1242, folded: 86 }
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initialData));
      setPosts(SEEDED_POSTS);
      setUserAlias(alias);
      setUserSeed(seed);
    }
  }, []);

  const sortedPosts = useMemo(() => {
    let filtered = selectedTag ? posts.filter(p => p.tags.includes(selectedTag)) : posts;
    if (sortBy === "latest") {
      return [...filtered].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else {
      return [...filtered].sort((a, b) => b.likeCount - a.likeCount);
    }
  }, [posts, sortBy, selectedTag]);

  const handleLike = (id: string) => {
    const updated = posts.map(p => {
      if (p.id === id) {
        return {
          ...p,
          likeCount: p.likedByMe ? p.likeCount - 1 : p.likeCount + 1,
          likedByMe: !p.likedByMe
        };
      }
      return p;
    });
    setPosts(updated);
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...raw, posts: updated }));
  };

  const handleCreatePost = () => {
    if (!newPostContent.trim()) return;
    
    const newPost: Post = {
      id: Math.random().toString(36).substring(7),
      authorAlias: userAlias,
      avatarSeed: userSeed,
      createdAt: new Date().toISOString(),
      content: newPostContent,
      tags: selectedTag ? [selectedTag] : ["#motivation"],
      likeCount: 0,
      likedByMe: false,
      replyCount: 0,
      replies: []
    };

    const updated = [newPost, ...posts];
    setPosts(updated);
    setNewPostContent("");
    setShowCreate(false);
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...raw, posts: updated }));

    // Simulate fake reply
    setTimeout(() => {
      const replies = ["You've got this. Keep going!", "Stay strong, we're with you.", "The 10-minute delay rule helps me a lot too."];
      const reply: Reply = {
        id: Math.random().toString(36).substring(7),
        authorAlias: generateAlias(),
        avatarSeed: Math.floor(Math.random() * 100),
        createdAt: new Date().toISOString(),
        content: replies[Math.floor(Math.random() * replies.length)]
      };
      
      setPosts(prev => prev.map(p => {
        if (p.id === newPost.id) {
          return { ...p, replyCount: p.replyCount + 1, replies: [...p.replies, reply] };
        }
        return p;
      }));
    }, 2000);
  };

  const handleAddReply = (postId: string) => {
    if (!replyInput.trim()) return;

    const reply: Reply = {
      id: Math.random().toString(36).substring(7),
      authorAlias: userAlias,
      avatarSeed: userSeed,
      createdAt: new Date().toISOString(),
      content: replyInput
    };

    const updated = posts.map(p => {
      if (p.id === postId) {
        return { ...p, replyCount: p.replyCount + 1, replies: [...p.replies, reply] };
      }
      return p;
    });

    setPosts(updated);
    setReplyInput("");
    if (activePost?.id === postId) {
      setActivePost({ ...activePost, replyCount: activePost.replyCount + 1, replies: [...activePost.replies, reply] });
    }
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...raw, posts: updated }));
  };

  return (
    <div className="min-h-dvh app-bg text-foreground flex flex-col">
      <div className="mx-auto w-full max-w-[420px] flex-1 flex flex-col px-4 pt-8 pb-4">
        <header className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate("/home")}
            className="p-2 -ml-2 rounded-full hover:bg-white/5 text-white/70"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <div className="text-center">
            <div className="text-xs font-semibold tracking-[0.25em] text-white/40 uppercase mb-1">Community</div>
            <div className="text-sm font-semibold text-white flex items-center justify-center gap-2">
              <Users className="h-4 w-4 text-cyan-400" /> Anonymous Space
            </div>
          </div>
          <button 
            onClick={() => setShowCreate(true)}
            className="p-2 rounded-full bg-white/5 border border-white/10 text-cyan-400 hover:bg-white/10"
          >
            <Plus className="h-5 w-5" />
          </button>
        </header>

        <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
          <button 
            onClick={() => setSelectedTag(null)}
            className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition ${!selectedTag ? "bg-white text-black" : "bg-white/5 text-white/60 border border-white/10"}`}
          >
            All Posts
          </button>
          {TAGS.map(tag => (
            <button 
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition ${selectedTag === tag ? "bg-white text-black" : "bg-white/5 text-white/60 border border-white/10"}`}
            >
              {tag}
            </button>
          ))}
        </div>

        <Tabs defaultValue="latest" className="mb-6" onValueChange={(v) => setSortBy(v as any)}>
          <TabsList className="w-full bg-white/5 border border-white/10 p-1 h-11 rounded-2xl">
            <TabsTrigger value="latest" className="flex-1 rounded-xl data-[state=active]:bg-white/10">
              <Clock className="h-4 w-4 mr-2" /> Latest
            </TabsTrigger>
            <TabsTrigger value="top" className="flex-1 rounded-xl data-[state=active]:bg-white/10">
              <TrendingUp className="h-4 w-4 mr-2" /> Top
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex-1 space-y-4 overflow-y-auto no-scrollbar pb-20">
          {sortedPosts.map((post) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="glass bg-white/5 border-white/10 overflow-hidden hover-elevate cursor-pointer" onClick={() => setActivePost(post)}>
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`h-10 w-10 rounded-full bg-gradient-to-br ${getAvatarColor(post.avatarSeed)} border border-white/10 shadow-inner`} />
                    <div>
                      <div className="text-sm font-bold text-white flex items-center gap-1.5">
                        {post.authorAlias}
                        {post.authorAlias === userAlias && <Badge className="bg-cyan-500/20 text-cyan-200 border-none text-[8px] h-3.5 px-1.5 uppercase tracking-tighter">You</Badge>}
                      </div>
                      <div className="text-[10px] text-white/40 font-medium">
                        {new Date(post.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Just now
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-sm text-white/80 leading-relaxed mb-4">{post.content}</p>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    {post.tags.map(tag => (
                      <span key={tag} className="text-[10px] font-bold text-cyan-400/80 bg-cyan-500/5 px-2 py-0.5 rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-6 pt-4 border-t border-white/5">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleLike(post.id); }}
                      className={`flex items-center gap-1.5 text-xs font-semibold transition ${post.likedByMe ? "text-rose-400" : "text-white/40 hover:text-white/60"}`}
                    >
                      <Heart className={`h-4 w-4 ${post.likedByMe ? "fill-rose-400" : ""}`} />
                      {post.likeCount}
                    </button>
                    <button className="flex items-center gap-1.5 text-xs font-semibold text-white/40 hover:text-white/60">
                      <MessageCircle className="h-4 w-4" />
                      {post.replyCount}
                    </button>
                    <button className="flex items-center gap-1.5 text-xs font-semibold text-white/40 hover:text-white/60 ml-auto">
                      <Share2 className="h-4 w-4" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Create Post Modal */}
        <AnimatePresence>
          {showCreate && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex flex-col"
            >
              <div className="p-6 flex-1 flex flex-col max-w-[420px] mx-auto w-full">
                <header className="flex items-center justify-between mb-8">
                  <button onClick={() => setShowCreate(false)} className="text-white/60">
                    Cancel
                  </button>
                  <div className="text-center">
                    <div className="text-xs font-semibold tracking-widest text-white/40 uppercase mb-1">Compose</div>
                    <div className="text-sm font-bold text-white">New Post</div>
                  </div>
                  <button 
                    disabled={!newPostContent.trim()}
                    onClick={handleCreatePost}
                    className="text-cyan-400 font-bold disabled:opacity-30"
                  >
                    Post
                  </button>
                </header>

                <div className="flex items-center gap-3 mb-6">
                  <div className={`h-10 w-10 rounded-full bg-gradient-to-br ${getAvatarColor(userSeed)} border border-white/10`} />
                  <div className="text-sm font-bold text-white">{userAlias}</div>
                </div>

                <textarea
                  autoFocus
                  placeholder="What's on your mind? Keep it supportive..."
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  className="flex-1 bg-transparent text-xl text-white placeholder:text-white/10 resize-none focus:outline-none"
                />

                <div className="py-4 border-t border-white/10">
                  <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mb-3">Add Tag</p>
                  <div className="flex gap-2 overflow-x-auto no-scrollbar">
                    {TAGS.map(tag => (
                      <button 
                        key={tag}
                        onClick={() => setSelectedTag(tag)}
                        className={`shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition ${selectedTag === tag ? "bg-cyan-500 text-black" : "bg-white/5 text-white/60 border border-white/10"}`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Thread View Modal */}
        <AnimatePresence>
          {activePost && (
            <motion.div 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl flex flex-col"
            >
              <div className="max-w-[420px] mx-auto w-full flex-1 flex flex-col h-full pt-8 px-4 pb-4">
                <header className="flex items-center justify-between mb-8">
                  <button onClick={() => setActivePost(null)} className="p-2 -ml-2 rounded-full hover:bg-white/5 text-white/70">
                    <ArrowLeft className="h-6 w-6" />
                  </button>
                  <div className="text-center">
                    <div className="text-xs font-semibold tracking-widest text-white/40 uppercase mb-1">Discussion</div>
                    <div className="text-sm font-bold text-white">Post Thread</div>
                  </div>
                  <div className="w-10" />
                </header>

                <div className="flex-1 overflow-y-auto no-scrollbar space-y-6">
                  {/* Original Post */}
                  <div className="pb-6 border-b border-white/10">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`h-12 w-12 rounded-full bg-gradient-to-br ${getAvatarColor(activePost.avatarSeed)} border border-white/10 shadow-lg`} />
                      <div>
                        <div className="text-base font-bold text-white">{activePost.authorAlias}</div>
                        <div className="text-[11px] text-white/40 font-medium">{new Date(activePost.createdAt).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <p className="text-lg text-white leading-relaxed mb-6">{activePost.content}</p>
                    <div className="flex flex-wrap gap-2">
                      {activePost.tags.map(tag => (
                        <span key={tag} className="text-xs font-bold text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Replies List */}
                  <div className="space-y-6 pb-20">
                    <p className="text-xs font-black uppercase tracking-widest text-white/20">Replies ({activePost.replyCount})</p>
                    {activePost.replies.map(reply => (
                      <div key={reply.id} className="flex gap-4">
                        <div className={`h-8 w-8 rounded-full bg-gradient-to-br ${getAvatarColor(reply.avatarSeed)} border border-white/10 shrink-0`} />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-bold text-white">{reply.authorAlias}</span>
                            <span className="text-[10px] text-white/40">{new Date(reply.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <p className="text-sm text-white/70 leading-relaxed bg-white/5 p-4 rounded-2xl rounded-tl-none border border-white/5">
                            {reply.content}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Reply Input */}
                <div className="pt-4 border-t border-white/10">
                  <div className="relative">
                    <input 
                      type="text" 
                      value={replyInput}
                      onChange={(e) => setReplyInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddReply(activePost.id)}
                      placeholder="Add a reply..."
                      className="w-full bg-white/5 border border-white/10 rounded-full py-4 pl-6 pr-14 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                    />
                    <button 
                      onClick={() => handleAddReply(activePost.id)}
                      disabled={!replyInput.trim()}
                      className="absolute right-2 top-2 p-2.5 rounded-full grad-pill text-white shadow-lg active:scale-95 disabled:opacity-30"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <footer className="mt-8 text-center px-4 pb-4">
          <p className="text-[10px] text-white/20 leading-relaxed uppercase tracking-[0.1em] font-bold">
            Support Tool • Not Medical Advice
          </p>
        </footer>
      </div>
    </div>
  );
}
