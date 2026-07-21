// src/pages/Community.tsx — Module 13: Community, Support & Engagement
import { useState, useEffect, useCallback } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "https://server.apexbee.in/api";
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
  Briefcase
} from "lucide-react";

const FEED_ITEMS = [
  { id: "f1", user: "ApexBee System", avatar: "🐝", action: "Announced the Summer Super Sale", time: "2 hours ago", content: "Get up to 50% off on all electronics and fashion from top vendors. Sale starts tomorrow at 12 PM!", type: "announcement" },
  { id: "f2", user: "Rajesh Kumar", avatar: "RK", action: "became a verified Vendor", time: "5 hours ago", content: "Rajesh Electronics is now live in Delhi. Explore their store for genuine products with quick delivery.", type: "vendor_joined" },
  { id: "f3", user: "ApexBee Academy", avatar: "🎓", action: "published a new course", time: "1 day ago", content: "Course: Advanced Digital Marketing for Local Stores. Enroll now and get certified!", type: "course" },
  { id: "f4", user: "Neha Sharma", avatar: "NS", action: "earned the Top Referrer badge", time: "2 days ago", content: "Neha successfully referred 50 friends to ApexBee and earned ₹12,500 in rewards! 🏆", type: "achievement" },
  { id: "f5", user: "TechFix Computers", avatar: "🔧", action: "is offering 20% off on Computer AMCs", time: "3 days ago", content: "Keep your devices running smoothly. Verified professionals available across Mumbai.", type: "service" },
];

const Community = () => {
  const [activeTab, setActiveTab] = useState("feed");
  const [supportTab, setSupportTab] = useState("faq"); // faq, tickets, contact

  // Dynamic Feed States
  const [posts, setPosts] = useState<any[]>([]);
  const [loadingFeed, setLoadingFeed] = useState(true);
  const [postInput, setPostInput] = useState("");
  const [activeCommentsPostId, setActiveCommentsPostId] = useState<string | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [commentInput, setCommentInput] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);

  // Support Ticket Form State
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [tickets, setTickets] = useState<any[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [ticketCategory, setTicketCategory] = useState("Order Issue");
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketMessage, setTicketMessage] = useState("");

  const getAuth = () => {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    const token = localStorage.getItem("token");
    return { user, token };
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
        body: JSON.stringify({ content: postInput, postType: "general" })
      });
      if (res.ok) {
        setPostInput("");
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
      }
    } catch (err) {
      console.error("create ticket error:", err);
    }
  };

  const renderFeed = () => (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Post Box */}
      <Card className="border border-gray-200 shadow-sm rounded-2xl overflow-hidden bg-white">
        <CardContent className="p-4 flex gap-3 items-center">
          <div className="w-10 h-10 rounded-full bg-navy/10 flex items-center justify-center text-navy font-bold flex-shrink-0">
            🐝
          </div>
          <input
            type="text"
            value={postInput}
            onChange={(e) => setPostInput(e.target.value)}
            placeholder="Share something with the community..."
            className="flex-1 bg-gray-50 border-0 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20 text-navy"
          />
          <Button onClick={handleCreatePost} size="sm" className="bg-navy hover:bg-navy/90 text-white rounded-full font-bold px-5">
            Post
          </Button>
        </CardContent>
      </Card>

      {/* Feed Items */}
      <div className="space-y-4">
        {loadingFeed ? (
          [1, 2].map((i) => (
            <Card key={i} className="p-6 border border-gray-200">
              <div className="h-4 bg-gray-200 animate-pulse rounded w-1/3 mb-2" />
              <div className="h-3 bg-gray-200 animate-pulse rounded w-1/4 mb-4" />
              <div className="h-10 bg-gray-200 animate-pulse rounded w-full" />
            </Card>
          ))
        ) : posts.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-8">No community posts yet. Be the first to share!</p>
        ) : (
          posts.map((item) => {
            const isLiked = item.likes?.includes(getAuth().user?._id || getAuth().user?.id);
            const relativeTime = new Date(item.createdAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit"
            });

            return (
              <Card key={item._id} className="hover:shadow-md transition-shadow border border-gray-200 rounded-2xl overflow-hidden bg-white">
                <CardContent className="p-5">
                  <div className="flex gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-navy/20 flex items-center justify-center font-bold text-navy flex-shrink-0 text-lg">
                      {item.authorAvatar || "🐝"}
                    </div>
                    <div>
                      <p className="text-sm">
                        <strong className="text-navy cursor-pointer hover:underline">{item.authorName}</strong>{" "}
                        <Badge variant="outline" className="text-[10px] scale-95 border-gray-300 font-bold uppercase tracking-wider">
                          {item.postType}
                        </Badge>
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{relativeTime}</p>
                    </div>
                  </div>
                  <p className="text-sm leading-relaxed text-gray-800 mb-4 whitespace-pre-wrap">{item.content}</p>
                  <div className="flex items-center gap-6 border-t pt-3">
                    <button
                      onClick={() => handleLikePost(item._id)}
                      className={`flex items-center gap-1.5 text-xs font-bold transition-colors ${isLiked ? "text-red-500 hover:text-red-600" : "text-muted-foreground hover:text-navy"
                        }`}
                    >
                      <Heart className={`w-4 h-4 ${isLiked ? "fill-current" : ""}`} /> Like ({item.likes?.length || 0})
                    </button>
                    <button
                      onClick={() => handleOpenComments(item._id)}
                      className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-navy transition-colors"
                    >
                      <MessageCircle className="w-4 h-4" /> Comment
                    </button>
                    <button
                      onClick={() => handleReportPost(item._id)}
                      className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-orange-600 transition-colors ml-auto"
                    >
                      <AlertCircle className="w-4 h-4" /> Report Post
                    </button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );

  const renderSupport = () => (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-navy rounded-2xl p-8 text-white flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold mb-2">How can we help you?</h2>
          <p className="opacity-90">Search our knowledge base or raise a ticket for assistance.</p>
        </div>
        <HelpCircle className="w-16 h-16 opacity-20" />
      </div>

      <div className="flex gap-4 border-b">
        <button onClick={() => setSupportTab("faq")} className={`pb-3 font-medium text-sm transition-colors ${supportTab === "faq" ? "border-b-2 border-navy text-navy" : "text-muted-foreground hover:text-navy"}`}>FAQs</button>
        <button onClick={() => setSupportTab("tickets")} className={`pb-3 font-medium text-sm transition-colors ${supportTab === "tickets" ? "border-b-2 border-navy text-navy" : "text-muted-foreground hover:text-navy"}`}>My Tickets</button>
        <button onClick={() => setSupportTab("contact")} className={`pb-3 font-medium text-sm transition-colors ${supportTab === "contact" ? "border-b-2 border-navy text-navy" : "text-muted-foreground hover:text-navy"}`}>Contact Us</button>
      </div>

      {supportTab === "faq" && (
        <div className="grid md:grid-cols-2 gap-4">
          {[
            "How do I track my order?",
            "What is the return policy?",
            "How do I redeem my wallet balance?",
            "How can I become a vendor?",
            "How does the referral program work?",
            "My service provider didn't arrive."
          ].map((q, i) => (
            <div key={i} className="p-4 border rounded-xl hover:shadow-sm cursor-pointer flex justify-between items-center group">
              <span className="font-medium text-sm text-navy group-hover:text-blue-600 transition-colors">{q}</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
          ))}
        </div>
      )}

      {supportTab === "tickets" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-navy">Recent Tickets</h3>
            <Button size="sm" className="bg-navy hover:bg-navy/90 text-white" onClick={() => setShowTicketModal(true)}><Ticket className="w-4 h-4 mr-2" /> Raise Ticket</Button>
          </div>
          {tickets.map(t => (
            <Card key={t.id}>
              <CardContent className="p-4 flex justify-between items-center">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-sm text-navy">{t.id}</span>
                    <Badge className={t.status === "Resolved" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}>{t.status}</Badge>
                  </div>
                  <p className="font-medium text-sm">{t.subject}</p>
                  <p className="text-xs text-muted-foreground">{t.date}</p>
                </div>
                <Button variant="outline" size="sm">View</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {supportTab === "contact" && (
        <div className="grid sm:grid-cols-3 gap-4 text-center">
          <Card>
            <CardContent className="p-6">
              <MessageCircle className="w-8 h-8 text-blue-500 mx-auto mb-3" />
              <h4 className="font-bold mb-1">Live Chat</h4>
              <p className="text-xs text-muted-foreground mb-3">Available 24/7</p>
              <Button variant="outline" className="w-full text-xs">Start Chat</Button>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <Phone className="w-8 h-8 text-green-500 mx-auto mb-3" />
              <h4 className="font-bold mb-1">Call Us</h4>
              <p className="text-xs text-muted-foreground mb-3">Mon-Sat, 9AM to 6PM</p>
              <Button variant="outline" className="w-full text-xs">9999-888-777</Button>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <Mail className="w-8 h-8 text-orange-500 mx-auto mb-3" />
              <h4 className="font-bold mb-1">Email Support</h4>
              <p className="text-xs text-muted-foreground mb-3">Response in 24 hours</p>
              <Button variant="outline" className="w-full text-xs">support@apexbee.in</Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );

  const renderProfile = () => (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card className="border-0 shadow-md bg-gradient-to-r from-navy to-blue-800 text-white">
        <CardContent className="p-8 flex items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-white text-navy flex items-center justify-center text-3xl font-bold border-4 border-white/20">
            A
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-1">Akhil</h2>
            <p className="opacity-90 flex items-center gap-1 text-sm"><Phone className="w-3 h-3" /> +91 9876543210</p>
            <p className="opacity-90 flex items-center gap-1 text-sm mb-3"><Mail className="w-3 h-3" /> akhil@example.com</p>
            <div className="flex gap-2">
              <Badge className="bg-yellow-500 border-0 text-white"><Award className="w-3 h-3 mr-1" /> Gold Member</Badge>
              <Badge className="bg-white/20 border-0 hover:bg-white/30 text-white transition-colors cursor-pointer">Edit Profile</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-4">
          {[
            { icon: <UserCircle className="w-5 h-5" />, label: "Personal Information" },
            { icon: <MapPin className="w-5 h-5" />, label: "Saved Addresses" },
            { icon: <Globe className="w-5 h-5" />, label: "Language Settings" },
            { icon: <Bell className="w-5 h-5" />, label: "Notifications" },
            { icon: <Settings className="w-5 h-5" />, label: "Account Settings" },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer font-medium text-sm text-gray-700 transition-colors">
              <div className="text-navy">{item.icon}</div>
              {item.label}
            </div>
          ))}
        </div>

        <div className="md:col-span-2 space-y-6">
          <h3 className="text-xl font-bold text-navy">Achievements & Badges</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { title: "Top Referrer", desc: "Invited 50+ friends", icon: "🏆", color: "bg-yellow-50" },
              { title: "Loyal Shopper", desc: "Placed 20+ orders", icon: "🛍️", color: "bg-blue-50" },
              { title: "Avid Learner", desc: "Completed 5 courses", icon: "🎓", color: "bg-green-50" },
              { title: "Community Pillar", desc: "Helped 10 users in forum", icon: "🤝", color: "bg-purple-50" },
            ].map((b, i) => (
              <div key={i} className={`p-4 rounded-xl border flex items-center gap-4 ${b.color}`}>
                <div className="text-3xl">{b.icon}</div>
                <div>
                  <h4 className="font-bold text-navy text-sm">{b.title}</h4>
                  <p className="text-xs text-muted-foreground">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="border-b bg-white sticky top-[64px] z-10 shadow-sm">
        <div className="container mx-auto px-4 flex gap-1 overflow-x-auto scrollbar-none">
          {[
            { key: "feed", label: "Community Feed", icon: <Users className="w-4 h-4 mr-2" /> },
            { key: "support", label: "Help & Support", icon: <HelpCircle className="w-4 h-4 mr-2" /> },
            { key: "profile", label: "My Profile", icon: <UserCircle className="w-4 h-4 mr-2" /> },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center px-5 py-4 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${activeTab === tab.key ? "border-navy text-navy" : "border-transparent text-muted-foreground hover:text-navy hover:border-gray-300"
                }`}
            >
              {tab.icon}{tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {activeTab === "feed" && renderFeed()}
        {activeTab === "support" && renderSupport()}
        {activeTab === "profile" && renderProfile()}
      </div>

      <Dialog open={showTicketModal} onOpenChange={setShowTicketModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Raise a Ticket</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-sm font-medium mb-1 block">Category</label>
              <select
                value={ticketCategory}
                onChange={(e) => setTicketCategory(e.target.value)}
                className="w-full border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30"
              >
                <option value="Order Issue">Order Issue</option>
                <option value="Service Issue">Service Issue</option>
                <option value="Wallet & Payments">Wallet & Payments</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Subject</label>
              <input
                type="text"
                value={ticketSubject}
                onChange={(e) => setTicketSubject(e.target.value)}
                className="w-full border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30"
                placeholder="Brief description..."
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Details</label>
              <textarea
                value={ticketMessage}
                onChange={(e) => setTicketMessage(e.target.value)}
                className="w-full border rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30 min-h-[100px] resize-none"
                placeholder="Explain the issue in detail..."
              />
            </div>
            <Button className="w-full bg-navy hover:bg-navy/90 text-white font-bold" onClick={handleCreateTicket}>
              Submit Ticket
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Comments Modal Dialog ── */}
      <Dialog open={activeCommentsPostId !== null} onOpenChange={(open) => !open && setActiveCommentsPostId(null)}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              💬 Post Discussion
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-1">
              {loadingComments ? (
                <p className="text-center text-xs text-muted-foreground">Loading comments...</p>
              ) : comments.length === 0 ? (
                <p className="text-center text-xs text-muted-foreground py-4">No comments yet. Write a response below!</p>
              ) : (
                comments.map((c) => (
                  <div key={c._id} className="p-3 bg-muted/40 rounded-xl">
                    <div className="flex justify-between items-center mb-1">
                      <strong className="text-navy text-xs">{c.authorName}</strong>
                      <span className="text-[9px] text-muted-foreground">
                        {new Date(c.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-800 whitespace-pre-wrap">{c.content}</p>
                  </div>
                ))
              )}
            </div>

            <div className="border-t pt-3 flex gap-2">
              <input
                type="text"
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                placeholder="Add a reply..."
                className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30 bg-gray-50 focus:bg-white text-navy"
                onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
              />
              <Button onClick={handleAddComment} className="bg-navy hover:bg-navy/90 text-white font-bold">
                Reply
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
