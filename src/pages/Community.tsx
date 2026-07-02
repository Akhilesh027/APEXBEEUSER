// src/pages/Community.tsx — Module 13: Community, Support & Engagement
import { useState } from "react";
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
  
  // Ticket Form State
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [tickets, setTickets] = useState([
    { id: "TKT-8902", subject: "Order Delayed", status: "Resolved", date: "10 Oct 2025" },
    { id: "TKT-9104", subject: "Refund Not Received", status: "In Progress", date: "12 Oct 2025" },
  ]);

  const renderFeed = () => (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Post Box */}
      <Card>
        <CardContent className="p-4 flex gap-3 items-center">
          <div className="w-10 h-10 rounded-full bg-navy/10 flex items-center justify-center text-navy font-bold">You</div>
          <input type="text" placeholder="Share something with the community..." className="flex-1 bg-gray-50 border-0 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20" />
          <Button size="sm" className="bg-navy hover:bg-navy/90 text-white rounded-full">Post</Button>
        </CardContent>
      </Card>

      {/* Feed Items */}
      <div className="space-y-4">
        {FEED_ITEMS.map((item) => (
          <Card key={item.id} className="hover:shadow-sm transition-shadow">
            <CardContent className="p-5">
              <div className="flex gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-navy/20 flex items-center justify-center font-bold text-navy flex-shrink-0">
                  {item.avatar}
                </div>
                <div>
                  <p className="text-sm">
                    <strong className="text-navy cursor-pointer hover:underline">{item.user}</strong>{" "}
                    <span className="text-muted-foreground">{item.action}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">{item.time}</p>
                </div>
              </div>
              <p className="text-sm leading-relaxed text-gray-800 mb-4">{item.content}</p>
              <div className="flex items-center gap-4 border-t pt-3">
                <button className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-navy transition-colors"><Heart className="w-4 h-4" /> Like</button>
                <button className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-navy transition-colors"><MessageCircle className="w-4 h-4" /> Comment</button>
                <button className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-navy transition-colors"><Share2 className="w-4 h-4" /> Share</button>
              </div>
            </CardContent>
          </Card>
        ))}
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
              className={`flex items-center px-5 py-4 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.key ? "border-navy text-navy" : "border-transparent text-muted-foreground hover:text-navy hover:border-gray-300"
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
              <select className="w-full border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30">
                <option>Order Issue</option>
                <option>Service Issue</option>
                <option>Wallet & Payments</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Subject</label>
              <input type="text" className="w-full border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30" placeholder="Brief description..." />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Details</label>
              <textarea className="w-full border rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30 min-h-[100px] resize-none" placeholder="Explain the issue in detail..." />
            </div>
            <Button className="w-full bg-navy hover:bg-navy/90 text-white" onClick={() => {
              setTickets([{ id: `TKT-${Math.floor(1000 + Math.random() * 9000)}`, subject: "New Ticket", status: "Pending", date: "Just now" }, ...tickets]);
              setShowTicketModal(false);
            }}>Submit Ticket</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default Community;
