// src/pages/Community.tsx — Module 13: Community, Support & Engagement
import { useState, useEffect, useCallback } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  MessageCircle,
  HelpCircle,
  Bell,
  Heart,
  Settings,
  Users,
  Award,
  BookOpen,
  MapPin,
  TrendingUp,
  AlertCircle,
  FileText,
  Mail,
  Phone,
  Ticket,
  ChevronRight,
  UserCircle,
  Share2,
  Globe,
  Briefcase,
  Sparkles,
  Send,
  Plus,
  Image as ImageIcon,
  CheckCircle,
  ShieldCheck,
  Search,
  MessageSquare,
  ThumbsUp,
  Flag,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "https://server.apexbee.in/api";

const FAQ_ITEMS = [
  {
    q: "How do I track my order in real-time?",
    a: "You can track your order live from the 'My Orders' section in your account dashboard. You can also view live GPS tracking for instant food and grocery deliveries.",
  },
  {
    q: "What is the return & refund policy?",
    a: "Products are eligible for returns within 7 days of delivery. For damaged or defective items, you can request an instant return from your 'My Orders' tab.",
  },
  {
    q: "How do I redeem my ApexBee Wallet balance?",
    a: "Your wallet balance is automatically available at checkout. Simply check the 'Use ApexBee Wallet Balance' option to apply instant discounts.",
  },
  {
    q: "How can I register as a local merchant or vendor?",
    a: "Click on 'Sell on ApexBee' in the footer or menu bar to register your store, complete your digital profile, and start selling to local customers.",
  },
  {
    q: "How does the Refer & Earn program work?",
    a: "Share your unique referral code with friends. When they complete their first order, both of you earn instant cashback credited directly to your ApexBee wallet.",
  },
  {
    q: "How do I book a table for Dineout with discounts?",
    a: "Go to the Food & Dining section (/food), switch to the 'Dineout' tab, pick your favorite restaurant venue, select date/time, and receive instant table reservation confirmation with up to 40% OFF.",
  },
];

const Community = () => {
  const [activeTab, setActiveTab] = useState<"feed" | "stores" | "support">("feed");
  const [supportTab, setSupportTab] = useState<"faq" | "tickets" | "contact">("faq");

  // Dynamic Feed States
  const [posts, setPosts] = useState<any[]>([]);
  const [loadingFeed, setLoadingFeed] = useState(true);
  const [postInput, setPostInput] = useState("");
  const [postType, setPostType] = useState("general");
  const [postMediaUrl, setPostMediaUrl] = useState("");
  const [showMediaInput, setShowMediaInput] = useState(false);
  const [activeCommentsPostId, setActiveCommentsPostId] = useState<string | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [commentInput, setCommentInput] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);
  const [faqSearch, setFaqSearch] = useState("");
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(0);

  // Support Ticket Form State
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [tickets, setTickets] = useState<any[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [ticketCategory, setTicketCategory] = useState("Order Issue");
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketMessage, setTicketMessage] = useState("");

  const getAuth = () => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "null");
      const token = localStorage.getItem("token");
      return { user, token };
    } catch {
      return { user: null, token: null };
    }
  };

  const fetchPosts = useCallback(async () => {
    try {
      setLoadingFeed(true);
      const res = await fetch(`${API_BASE}/v1/community/posts`);
      const data = await res.json();
      if (res.ok) {
        setPosts(Array.isArray(data?.posts) ? data.posts : []);
      }
    } catch (err) {
      console.error("fetchPosts error:", err);
    } finally {
      setLoadingFeed(false);
    }
  }, []);

  const fetchTickets = useCallback(async () => {
    try {
      const { user, token } = getAuth();
      if (!user || !token) return;
      const userId = user._id || user.id;
      setLoadingTickets(true);
      const res = await fetch(`${API_BASE}/support-tickets?userId=${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setTickets(Array.isArray(data?.tickets) ? data.tickets : []);
      }
    } catch (err) {
      console.error("fetchTickets error:", err);
    } finally {
      setLoadingTickets(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  useEffect(() => {
    if (activeTab === "support") {
      fetchTickets();
    }
  }, [activeTab, fetchTickets]);

  const handleCreatePost = async () => {
    if (!postInput.trim()) return;
    const { token } = getAuth();
    if (!token) {
      alert("Please login to publish community posts");
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/v1/community/posts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          content: postInput,
          postType: postType,
          mediaUrl: postMediaUrl.trim()
        })
      });
      if (res.ok) {
        setPostInput("");
        setPostMediaUrl("");
        setShowMediaInput(false);
        fetchPosts();
      } else {
        const data = await res.json();
        alert(data.message || "Failed to publish post");
      }
    } catch (err) {
      console.error("publish post error:", err);
    }
  };

  const handleLikePost = async (postId: string) => {
    const { token } = getAuth();
    if (!token) {
      alert("Please login to like posts");
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/v1/community/posts/${postId}/like`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchPosts();
      }
    } catch (err) {
      console.error("like post error:", err);
    }
  };

  const handleReportPost = async (postId: string) => {
    const { token } = getAuth();
    if (!token) {
      alert("Please login to flag posts");
      return;
    }
    const reason = prompt("Enter the reason for reporting this post:");
    if (!reason) return;
    try {
      const res = await fetch(`${API_BASE}/v1/community/posts/${postId}/report`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ reason })
      });
      if (res.ok) {
        alert("Thank you. The post has been flagged for admin review.");
        fetchPosts();
      }
    } catch (err) {
      console.error("report post error:", err);
    }
  };

  const handleOpenComments = async (postId: string) => {
    if (activeCommentsPostId === postId) {
      setActiveCommentsPostId(null);
      return;
    }
    setActiveCommentsPostId(postId);
    setLoadingComments(true);
    try {
      const res = await fetch(`${API_BASE}/v1/community/posts/${postId}/comments`);
      const data = await res.json();
      if (res.ok) {
        setComments(Array.isArray(data?.comments) ? data.comments : []);
      }
    } catch (err) {
      console.error("fetchComments error:", err);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleAddComment = async () => {
    if (!commentInput.trim() || !activeCommentsPostId) return;
    const { token } = getAuth();
    if (!token) {
      alert("Please login to add comments");
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/v1/community/posts/${activeCommentsPostId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ content: commentInput })
      });
      if (res.ok) {
        setCommentInput("");
        handleOpenComments(activeCommentsPostId);
      }
    } catch (err) {
      console.error("add comment error:", err);
    }
  };

  const handleCreateTicket = async () => {
    if (!ticketSubject.trim() || !ticketMessage.trim()) {
      alert("Subject and details are required");
      return;
    }
    const { user, token } = getAuth();
    if (!user || !token) {
      alert("Please login to raise support tickets");
      return;
    }
    try {
      const userId = user._id || user.id;
      const res = await fetch(`${API_BASE}/support-tickets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          userId,
          category: ticketCategory,
          subject: ticketSubject,
          message: ticketMessage
        })
      });
      if (res.ok) {
        setTicketSubject("");
        setTicketMessage("");
        setShowTicketModal(false);
        fetchTickets();
        alert("✅ Support ticket submitted successfully! Our team will respond shortly.");
      }
    } catch (err) {
      console.error("create ticket error:", err);
    }
  };

  const filteredFaqs = FAQ_ITEMS.filter(
    (item) =>
      item.q.toLowerCase().includes(faqSearch.toLowerCase()) ||
      item.a.toLowerCase().includes(faqSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <Navbar />

      {/* ── TOP HERO BANNER & COMMUNITY STATS STRIP ── */}
      <div className="bg-gradient-to-r from-[#0A1128] via-[#101F42] to-[#0A1128] text-white py-8 sm:py-12 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-amber-400/10 blur-3xl pointer-events-none" />
        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 bg-amber-400 text-[#0A1128] px-3.5 py-1 rounded-full font-black text-xs shadow-md mb-3">
                <Users className="w-3.5 h-3.5" /> ApexBee Social Hub & Customer Care
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                ApexBee Community & Support
              </h1>
              <p className="text-xs sm:text-sm text-slate-200 font-medium max-w-2xl mt-1.5 leading-relaxed">
                Connect with verified local buyers & merchants, share product reviews, discover community deals, or get instant customer support.
              </p>
            </div>

            {/* Quick Community Stats */}
            <div className="grid grid-cols-3 gap-3 shrink-0">
              <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-3.5 text-center min-w-[95px]">
                <p className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Members</p>
                <p className="text-xl sm:text-2xl font-black text-amber-400">12.4K+</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-3.5 text-center min-w-[95px]">
                <p className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Posts</p>
                <p className="text-xl sm:text-2xl font-black text-emerald-400">3.8K+</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-3.5 text-center min-w-[95px]">
                <p className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Merchants</p>
                <p className="text-xl sm:text-2xl font-black text-sky-400">950+</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT AREA ── */}
      <div className="container mx-auto px-2 sm:px-6 py-6 sm:py-8">

        {/* ── MAIN VIEW TABS ── */}
        <div className="bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-2 mb-8 max-w-xl mx-auto">
          <button
            onClick={() => setActiveTab("feed")}
            className={`flex-1 py-3 px-4 rounded-xl font-black text-xs sm:text-sm transition-all duration-200 flex items-center justify-center gap-2 border cursor-pointer ${activeTab === "feed"
              ? "bg-[#0A1128] text-amber-400 border-[#0A1128] shadow-md"
              : "bg-transparent text-slate-600 border-transparent hover:bg-slate-100"
              }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Community Feed</span>
          </button>

          <button
            onClick={() => setActiveTab("support")}
            className={`flex-1 py-3 px-4 rounded-xl font-black text-xs sm:text-sm transition-all duration-200 flex items-center justify-center gap-2 border cursor-pointer ${activeTab === "support"
              ? "bg-[#0A1128] text-amber-400 border-[#0A1128] shadow-md"
              : "bg-transparent text-slate-600 border-transparent hover:bg-slate-100"
              }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>Support & Help Center</span>
          </button>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TAB 1: COMMUNITY FEED & DISCUSSIONS */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === "feed" && (
          <div className="max-w-3xl mx-auto space-y-6">

            {/* POST CREATOR BOX */}
            <Card className="border border-slate-200/90 shadow-md rounded-3xl overflow-hidden bg-white">
              <CardContent className="p-4 sm:p-5 space-y-3">
                <div className="flex gap-3 items-start">
                  <div className="w-10 h-10 rounded-full bg-[#0A1128] text-amber-400 flex items-center justify-center font-black text-lg shrink-0 shadow-sm">
                    🐝
                  </div>
                  <div className="flex-1 space-y-2">
                    <textarea
                      value={postInput}
                      onChange={(e) => setPostInput(e.target.value)}
                      placeholder="Share a story, product recommendation, or question with the community..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-amber-400 min-h-[70px] resize-none font-medium"
                    />

                    {showMediaInput && (
                      <input
                        type="url"
                        value={postMediaUrl}
                        onChange={(e) => setPostMediaUrl(e.target.value)}
                        placeholder="Paste image or photo URL (http://...)"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-amber-400 font-mono"
                      />
                    )}
                  </div>
                </div>

                {/* POST TOOLBAR */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <select
                      value={postType}
                      onChange={(e) => setPostType(e.target.value)}
                      className="bg-slate-100 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 cursor-pointer focus:outline-none"
                    >
                      <option value="general">💬 General Discussion</option>
                      <option value="review">⭐ Product Review</option>
                      <option value="announcement">📢 Local Announcement</option>
                      <option value="business">💼 Franchise / Business</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => setShowMediaInput(!showMediaInput)}
                      className={`p-2 rounded-xl border text-xs font-bold transition flex items-center gap-1 cursor-pointer ${showMediaInput ? "bg-amber-50 text-amber-800 border-amber-300" : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                        }`}
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Add Photo</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleCreatePost}
                    className="bg-[#0A1128] hover:bg-amber-500 text-white hover:text-[#0A1128] font-black text-xs px-5 py-2.5 rounded-xl flex items-center gap-1.5 transition shadow-sm border-none cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Publish</span>
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* FEED POSTS LIST */}
            <div className="space-y-4">
              {loadingFeed ? (
                [1, 2, 3].map((i) => (
                  <Card key={i} className="p-6 border border-slate-200 bg-white rounded-3xl animate-pulse">
                    <div className="h-4 bg-slate-200 rounded w-1/3 mb-2" />
                    <div className="h-3 bg-slate-200 rounded w-1/4 mb-4" />
                    <div className="h-16 bg-slate-200 rounded w-full" />
                  </Card>
                ))
              ) : posts.length === 0 ? (
                <div className="bg-white rounded-3xl border border-slate-200/80 p-10 text-center space-y-3 shadow-xs">
                  <MessageCircle className="w-12 h-12 text-slate-300 mx-auto" />
                  <h3 className="text-base font-extrabold text-slate-800">No Posts Yet</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Be the first member to share a post, review, or question with the ApexBee community!
                  </p>
                </div>
              ) : (
                posts.map((item) => {
                  const isLiked = item.likes?.includes(getAuth().user?._id || getAuth().user?.id);
                  const relativeTime = new Date(item.createdAt || Date.now()).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit"
                  });

                  return (
                    <Card key={item._id} className="border border-slate-200/90 rounded-3xl overflow-hidden bg-white shadow-xs hover:shadow-md transition">
                      <CardContent className="p-4 sm:p-6 space-y-4">
                        {/* AUTHOR HEADER */}
                        <div className="flex gap-3 items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-[#0A1128] text-[#F3BA12] flex items-center justify-center font-black text-sm shrink-0 border border-slate-200 shadow-xs">
                              {item.authorAvatar && item.authorAvatar.length <= 4 ? item.authorAvatar : "🐝"}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-extrabold text-sm text-[#0A1128]">{item.authorName || "ApexBee Member"}</span>
                                <Badge className="bg-amber-100 text-amber-900 border-amber-200 text-[9px] font-black uppercase px-2 py-0.2">
                                  {item.postType || "General"}
                                </Badge>
                              </div>
                              <p className="text-[10px] text-slate-400 font-semibold">{relativeTime}</p>
                            </div>
                          </div>

                          <button
                            onClick={() => handleReportPost(item._id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition border-none cursor-pointer"
                            title="Report Post"
                          >
                            <Flag className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* CONTENT TEXT */}
                        <p className="text-xs sm:text-sm leading-relaxed text-slate-800 font-medium whitespace-pre-wrap">
                          {item.content}
                        </p>

                        {/* MEDIA ATTACHMENT */}
                        {item.mediaUrl && (
                          <div className="rounded-2xl overflow-hidden max-h-80 bg-slate-100 border border-slate-100">
                            <img src={item.mediaUrl} alt="Post media" className="w-full h-full object-cover" loading="lazy" />
                          </div>
                        )}

                        {/* ACTION BAR */}
                        <div className="flex items-center gap-6 border-t border-slate-100 pt-3 text-xs font-extrabold text-slate-500">
                          <button
                            type="button"
                            onClick={() => handleLikePost(item._id)}
                            className={`flex items-center gap-1.5 transition cursor-pointer border-none bg-transparent ${isLiked ? "text-rose-600 font-black" : "hover:text-[#0A1128]"
                              }`}
                          >
                            <Heart className={`w-4 h-4 ${isLiked ? "fill-rose-600 text-rose-600" : ""}`} />
                            <span>Like ({item.likes?.length || 0})</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenComments(item._id)}
                            className="flex items-center gap-1.5 hover:text-[#0A1128] transition cursor-pointer border-none bg-transparent"
                          >
                            <MessageCircle className="w-4 h-4 text-amber-500" />
                            <span>Comments ({item.commentsCount || 0})</span>
                          </button>
                        </div>

                        {/* COMMENTS COLLAPSIBLE DRAWER */}
                        {activeCommentsPostId === item._id && (
                          <div className="mt-3 pt-3 border-t border-slate-100 space-y-3 bg-slate-50/80 p-3 sm:p-4 rounded-2xl">
                            <h4 className="text-xs font-black text-[#0A1128]">Comments</h4>

                            {/* COMMENT INPUT */}
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={commentInput}
                                onChange={(e) => setCommentInput(e.target.value)}
                                placeholder="Write a comment..."
                                className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-amber-400 font-medium"
                              />
                              <button
                                type="button"
                                onClick={handleAddComment}
                                className="bg-[#0A1128] text-white px-3 py-2 rounded-xl text-xs font-bold hover:bg-amber-500 hover:text-[#0A1128] transition border-none cursor-pointer shrink-0"
                              >
                                Reply
                              </button>
                            </div>

                            {/* COMMENTS LIST */}
                            {loadingComments ? (
                              <p className="text-xs text-slate-400 font-semibold py-2">Loading comments...</p>
                            ) : comments.length === 0 ? (
                              <p className="text-xs text-slate-400 font-medium py-1">No comments yet. Be the first to reply!</p>
                            ) : (
                              <div className="space-y-2 max-h-48 overflow-y-auto">
                                {comments.map((c) => (
                                  <div key={c._id} className="bg-white p-2.5 rounded-xl border border-slate-200/80 text-xs">
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="font-bold text-[#0A1128]">{c.authorName || "User"}</span>
                                      <span className="text-[9px] text-slate-400">
                                        {new Date(c.createdAt || Date.now()).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                                      </span>
                                    </div>
                                    <p className="text-slate-700 font-medium">{c.content}</p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TAB 2: SUPPORT & HELP CENTER */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === "support" && (
          <div className="max-w-4xl mx-auto space-y-6">

            {/* SUPPORT BANNER */}
            <div className="bg-gradient-to-r from-[#0A1128] via-[#1a2b5c] to-[#0A1128] text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="space-y-2">
                <h2 className="text-2xl sm:text-3xl font-black text-white">How can we help you today?</h2>
                <p className="text-xs sm:text-sm text-slate-200 max-w-md font-medium">
                  Search our help desk FAQs, raise an instant support ticket, or chat directly with our customer care team.
                </p>
              </div>
              <Button
                onClick={() => setShowTicketModal(true)}
                className="bg-amber-400 hover:bg-amber-300 text-[#0A1128] font-black text-xs px-6 py-3 rounded-2xl shadow-lg border-none cursor-pointer shrink-0"
              >
                <Ticket className="w-4 h-4 mr-2" /> Raise Support Ticket
              </Button>
            </div>

            {/* SUPPORT SUB-TABS */}
            <div className="flex gap-2 border-b border-slate-200 pb-2">
              <button
                onClick={() => setSupportTab("faq")}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold cursor-pointer border ${supportTab === "faq" ? "bg-[#0A1128] text-[#F3BA12] border-[#0A1128]" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                  }`}
              >
                Frequently Asked Questions (FAQs)
              </button>
              <button
                onClick={() => setSupportTab("tickets")}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold cursor-pointer border ${supportTab === "tickets" ? "bg-[#0A1128] text-[#F3BA12] border-[#0A1128]" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                  }`}
              >
                My Tickets ({tickets.length})
              </button>
              <button
                onClick={() => setSupportTab("contact")}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold cursor-pointer border ${supportTab === "contact" ? "bg-[#0A1128] text-[#F3BA12] border-[#0A1128]" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                  }`}
              >
                Contact Support
              </button>
            </div>

            {/* ── FAQ TAB ── */}
            {supportTab === "faq" && (
              <div className="space-y-4">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={faqSearch}
                    onChange={(e) => setFaqSearch(e.target.value)}
                    placeholder="Search help topics (e.g. order tracking, returns, wallet)..."
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs sm:text-sm font-medium focus:outline-none focus:border-amber-400 shadow-xs"
                  />
                </div>

                <div className="space-y-3">
                  {filteredFaqs.map((faq, i) => {
                    const isOpen = openFaqIdx === i;
                    return (
                      <div
                        key={i}
                        className="bg-white border border-slate-200/90 rounded-2xl p-4 cursor-pointer hover:border-amber-400 transition shadow-xs"
                        onClick={() => setOpenFaqIdx(isOpen ? null : i)}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-extrabold text-xs sm:text-sm text-[#0A1128] flex items-center gap-2">
                            <HelpCircle className="w-4 h-4 text-amber-500 shrink-0" />
                            {faq.q}
                          </span>
                          {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
                        </div>
                        {isOpen && (
                          <p className="text-xs text-slate-600 mt-3 pt-3 border-t border-slate-100 leading-relaxed font-medium">
                            {faq.a}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── MY TICKETS TAB ── */}
            {supportTab === "tickets" && (
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-black text-[#0A1128]">Your Support Tickets</h3>
                  <Button size="sm" className="bg-[#0A1128] text-amber-400 hover:bg-amber-500 hover:text-[#0A1128] font-bold text-xs" onClick={() => setShowTicketModal(true)}>
                    <Ticket className="w-3.5 h-3.5 mr-1.5" /> New Ticket
                  </Button>
                </div>

                {loadingTickets ? (
                  <p className="text-xs text-slate-400 font-semibold text-center py-6">Loading tickets...</p>
                ) : tickets.length === 0 ? (
                  <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center space-y-2">
                    <Ticket className="w-10 h-10 text-slate-300 mx-auto" />
                    <p className="text-xs text-slate-500 font-semibold">You have no active support tickets.</p>
                  </div>
                ) : (
                  tickets.map((t) => (
                    <Card key={t._id || t.id} className="border border-slate-200 rounded-2xl bg-white">
                      <CardContent className="p-4 flex justify-between items-center">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-xs text-[#0A1128]">#{t.ticketNumber || t._id}</span>
                            <Badge className={t.status === "Resolved" ? "bg-emerald-100 text-emerald-800 border-emerald-200" : "bg-amber-100 text-amber-800 border-amber-200"}>
                              {t.status || "Open"}
                            </Badge>
                          </div>
                          <p className="font-extrabold text-sm text-slate-800">{t.subject}</p>
                          <p className="text-[10px] text-slate-400 font-semibold">{t.category} • {new Date(t.createdAt || Date.now()).toLocaleDateString()}</p>
                        </div>
                        <Button variant="outline" size="sm" className="rounded-xl border-slate-200 text-xs font-bold">View Ticket</Button>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            )}

            {/* ── CONTACT US TAB ── */}
            {supportTab === "contact" && (
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-5 text-center space-y-2 shadow-xs">
                  <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                    <Mail className="w-6 h-6" />
                  </div>
                  <h4 className="font-black text-sm text-[#0A1128]">Email Support</h4>
                  <p className="text-xs text-slate-500 font-medium">support@apexbee.in</p>
                  <p className="text-[10px] text-slate-400">Response within 2 hours</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-5 text-center space-y-2 shadow-xs">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                    <Phone className="w-6 h-6" />
                  </div>
                  <h4 className="font-black text-sm text-[#0A1128]">Toll-Free Helpline</h4>
                  <p className="text-xs text-slate-500 font-medium">+91-9999-888-777</p>
                  <p className="text-[10px] text-slate-400">Mon–Sat (9 AM to 9 PM)</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-5 text-center space-y-2 shadow-xs">
                  <div className="w-12 h-12 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center mx-auto">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <h4 className="font-black text-sm text-[#0A1128]">WhatsApp Support</h4>
                  <p className="text-xs text-slate-500 font-medium">+91-9999-888-777</p>
                  <p className="text-[10px] text-slate-400">Instant AI & Human Chat</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── RAISE TICKET MODAL ── */}
      <Dialog open={showTicketModal} onOpenChange={setShowTicketModal}>
        <DialogContent className="sm:max-w-lg rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-black text-[#0A1128]">
              <Ticket className="w-5 h-5 text-amber-500" /> Raise Support Ticket
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 text-xs font-semibold pt-2">
            <div>
              <label className="block text-slate-700 mb-1">Issue Category</label>
              <select
                value={ticketCategory}
                onChange={(e) => setTicketCategory(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-400 font-bold"
              >
                <option value="Order Issue">Order & Delivery Issue</option>
                <option value="Payment / Refund">Payment, Wallet & Refunds</option>
                <option value="Account & Login">Account & Login</option>
                <option value="Vendor Inquiry">Vendor Partnership</option>
                <option value="General Support">General Support</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 mb-1">Subject</label>
              <input
                type="text"
                value={ticketSubject}
                onChange={(e) => setTicketSubject(e.target.value)}
                placeholder="Brief summary of your issue..."
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-400 font-bold"
              />
            </div>

            <div>
              <label className="block text-slate-700 mb-1">Detailed Description</label>
              <textarea
                value={ticketMessage}
                onChange={(e) => setTicketMessage(e.target.value)}
                placeholder="Describe your issue in detail (order number, product details, etc.)..."
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-400 font-medium min-h-[90px] resize-none"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setShowTicketModal(false)}>
                Cancel
              </Button>
              <Button
                className="flex-1 bg-[#0A1128] text-amber-400 hover:bg-amber-500 hover:text-[#0A1128] font-black text-xs rounded-xl"
                onClick={handleCreateTicket}
              >
                Submit Ticket
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default Community;
