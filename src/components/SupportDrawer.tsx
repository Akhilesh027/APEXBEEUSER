import React, { useState, useEffect, useRef } from "react";
import {
  MessageSquare,
  X,
  Send,
  Phone,
  Video,
  FileText,
  AlertCircle,
  CheckCircle,
  HelpCircle,
  Play,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  ExternalLink
} from "lucide-react";
import { Button } from "./ui/button";

type Message = {
  id: string;
  sender: "user" | "bot";
  text: string;
  link?: string;
  linkText?: string;
  createdAt: Date;
};

type Ticket = {
  id: string;
  subject: string;
  category: string;
  status: "Open" | "Resolved" | "Pending";
  date: string;
  replies: string[];
};

type SupportDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
};

export const SupportDrawer: React.FC<SupportDrawerProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<"menu" | "chat" | "ticket" | "video" | "ticket-list">("menu");

  // Chat State
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      sender: "bot",
      text: "Hello! 🐝 I'm your ApexBee Live Support Bot. I can help resolve delivery, payment, or wallet issues. How can I assist you today?",
      createdAt: new Date()
    }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Ticket Form State
  const [ticketCategory, setTicketCategory] = useState("Delivery");
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketDesc, setTicketDesc] = useState("");
  const [tickets, setTickets] = useState<Ticket[]>(() => {
    try {
      const saved = localStorage.getItem("apexbee_tickets");
      return saved ? JSON.parse(saved) : [
        {
          id: "TKT-84920",
          subject: "Cashback amount not credited for level 2 direct referral",
          category: "Wallet",
          status: "Resolved",
          date: "2026-07-15",
          replies: ["We have processed the transaction. Payout of ₹150 has been credited to your active wallet balance."]
        },
        {
          id: "TKT-90412",
          subject: "Item missing from order #AB-8490",
          category: "Delivery",
          status: "Open",
          date: "2026-07-20",
          replies: ["Our dispatch executive Ramesh has departed with the missing grocery items. ETA 15 mins."]
        }
      ];
    } catch {
      return [];
    }
  });

  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  // Video State
  const [selectedVideoUrl, setSelectedVideoUrl] = useState<string | null>(null);
  const [selectedVideoTitle, setSelectedVideoTitle] = useState("");

  const videos = [
    { title: "How to Shop from Local Stores & Get Same-day Delivery", duration: "2 mins", desc: "A brief guide on ordering vegetables, groceries, and services from merchants nearby.", thumbnail: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400", videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4" },
    { title: "Understanding Reward Points, Levels & Smart Coupons", duration: "3 mins", desc: "How to build achievements, complete challenges, and apply discounts to your cart.", thumbnail: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400", videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4" },
    { title: "How to Refer Friends & Earn 3-Level Downline MLM Income", duration: "5 mins", desc: "Learn the secrets of expanding your ApexBee direct referral network to maximize commission.", thumbnail: "https://images.unsplash.com/photo-1552581230-c013741398c3?w=400", videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4" }
  ];

  useEffect(() => {
    if (activeTab === "chat" && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping, activeTab]);

  useEffect(() => {
    localStorage.setItem("apexbee_tickets", JSON.stringify(tickets));
  }, [tickets]);

  if (!isOpen) return null;

  const handleSendChat = (text?: string) => {
    const query = text || chatInput;
    if (!query.trim()) return;

    setMessages((prev) => [
      ...prev,
      { id: Math.random().toString(), sender: "user", text: query, createdAt: new Date() }
    ]);
    if (!text) setChatInput("");

    setIsTyping(true);
    setTimeout(() => {
      let reply = "I understand you need assistance. Please connect with our support agents at support@apexbee.in or call our direct helpline.";
      const low = query.toLowerCase();

      if (low.includes("delivery") || low.includes("order") || low.includes("where")) {
        reply = "For active delivery updates, you can use our Live Tracking module on the Home page or check the 'My Orders' section. Ramesh is delivering current live orders.";
      } else if (low.includes("wallet") || low.includes("cash") || low.includes("points") || low.includes("referral")) {
        reply = "Referral earnings are credited as pending and clear when the invitee registers and orders. You can verify your balance in the Wallet page.";
      } else if (low.includes("coupon") || low.includes("discount")) {
        reply = "Smart coupons are auto-applied on the checkout screen if your order values meet merchant conditions.";
      } else if (low.includes("help") || low.includes("live agent")) {
        reply = "Connecting you with an ApexBee Live Support Executive. Typical response time is under 1 minute. Please state your query.";
      }

      setMessages((prev) => [
        ...prev,
        { id: Math.random().toString(), sender: "bot", text: reply, createdAt: new Date() }
      ]);
      setIsTyping(false);
    }, 1000);
  };

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject.trim() || !ticketDesc.trim()) return;

    const newTicket: Ticket = {
      id: `TKT-${Math.floor(10000 + Math.random() * 90000)}`,
      subject: ticketSubject,
      category: ticketCategory,
      status: "Open",
      date: new Date().toISOString().split("T")[0],
      replies: ["Thank you for submitting a ticket. Our helpdesk team is analyzing your issue. Expect a resolution in 2 hours."]
    };

    setTickets((prev) => [newTicket, ...prev]);
    setTicketSubject("");
    setTicketDesc("");
    alert(`Ticket ${newTicket.id} created successfully!`);
    setActiveTab("ticket-list");
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-sans">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={onClose} />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col h-full transform transition-all duration-300">
          {/* Header */}
          <div className="bg-navy p-5 text-white flex items-center justify-between shadow-md shrink-0">
            <div className="flex items-center gap-3">
              {activeTab !== "menu" && (
                <button
                  onClick={() => {
                    setSelectedTicket(null);
                    setActiveTab("menu");
                  }}
                  className="text-white/80 hover:text-white bg-white/10 p-1.5 rounded-xl transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
              )}
              <div>
                <h3 className="font-extrabold text-base flex items-center gap-2">
                  <span>🐝</span> ApexBee Support Hub
                </h3>
                <p className="text-[10px] opacity-75">We respond in under 2 hours</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white bg-white/10 p-1.5 rounded-xl transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto bg-slate-50/50 p-5">
            {/* Main Menu Tab */}
            {activeTab === "menu" && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div className="bg-gradient-to-r from-navy to-blue-700 text-white rounded-2xl p-5 shadow-sm text-left">
                  <h4 className="font-bold text-sm">Need Instant Support?</h4>
                  <p className="text-xs text-white/80 mt-1 leading-relaxed">
                    Our AI assistant and live desk support team are available 24/7. Select your preferred support channel below.
                  </p>
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    <button
                      onClick={() => window.open("https://wa.me/919999999999?text=Hi%20ApexBee%2C%20I%20need%20assistance.")}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors border-none"
                    >
                      <span className="text-base">💬</span> WhatsApp Chat
                    </button>
                    <a
                      href="tel:+919999888777"
                      className="bg-white/20 hover:bg-white/30 text-white text-xs font-bold py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all"
                    >
                      <Phone className="w-3.5 h-3.5" /> Call Hotline
                    </a>
                  </div>
                </div>

                {/* Grid Options */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setActiveTab("chat")}
                    className="bg-white border rounded-2xl p-4 text-left shadow-sm hover:shadow-md transition shadow-premium flex flex-col justify-between h-28 group cursor-pointer"
                  >
                    <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 text-lg group-hover:scale-105 transition-transform">💬</div>
                    <div>
                      <h5 className="font-extrabold text-navy text-xs">Live Chat Bot</h5>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Solve issues instantly</p>
                    </div>
                  </button>

                  <button
                    onClick={() => setActiveTab("ticket")}
                    className="bg-white border rounded-2xl p-4 text-left shadow-sm hover:shadow-md transition shadow-premium flex flex-col justify-between h-28 group cursor-pointer"
                  >
                    <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 text-lg group-hover:scale-105 transition-transform">🎫</div>
                    <div>
                      <h5 className="font-extrabold text-navy text-xs">Raise a Ticket</h5>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Track disputes & refunds</p>
                    </div>
                  </button>

                  <button
                    onClick={() => setActiveTab("ticket-list")}
                    className="bg-white border rounded-2xl p-4 text-left shadow-sm hover:shadow-md transition shadow-premium flex flex-col justify-between h-28 group cursor-pointer"
                  >
                    <div className="w-9 h-9 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600 text-lg group-hover:scale-105 transition-transform">📋</div>
                    <div>
                      <h5 className="font-extrabold text-navy text-xs">My Tickets</h5>
                      <p className="text-[10px] text-muted-foreground mt-0.5">View resolution logs</p>
                    </div>
                  </button>

                  <button
                    onClick={() => setActiveTab("video")}
                    className="bg-white border rounded-2xl p-4 text-left shadow-sm hover:shadow-md transition shadow-premium flex flex-col justify-between h-28 group cursor-pointer"
                  >
                    <div className="w-9 h-9 bg-pink-50 rounded-xl flex items-center justify-center text-pink-600 text-lg group-hover:scale-105 transition-transform">🎥</div>
                    <div>
                      <h5 className="font-extrabold text-navy text-xs">Video Help</h5>
                      <p className="text-[10px] text-muted-foreground mt-0.5">MLM & ordering guides</p>
                    </div>
                  </button>
                </div>

                {/* FAQ Quick Links */}
                <div className="bg-white border rounded-2xl p-4 shadow-sm text-left">
                  <h4 className="font-bold text-navy text-sm mb-3">Frequently Asked Questions</h4>
                  <div className="space-y-3">
                    {[
                      { q: "How to withdraw referral cashbacks?", a: "Minimum cashout threshold is ₹500. Register your banking KYC under profile, then trigger Withdraw." },
                      { q: "What is direct and indirect downline?", a: "Level 1 are users you refer. Level 2 are referred by Level 1, earning you passive commissions!" },
                      { q: "Smart coupons are not applying?", a: "Ensure your cart subtotal matches merchant minimums and item list matches exclusions." }
                    ].map((item, idx) => (
                      <details key={idx} className="group border-b pb-2 last:border-0 last:pb-0 cursor-pointer">
                        <summary className="list-none flex justify-between items-center text-xs font-bold text-slate-700 hover:text-navy">
                          <span>{item.q}</span>
                          <ChevronRight className="w-3.5 h-3.5 transition-transform group-open:rotate-90 text-slate-400" />
                        </summary>
                        <p className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed bg-slate-50 p-2.5 rounded-lg border-l-2 border-navy">
                          {item.a}
                        </p>
                      </details>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Chatbot Interface */}
            {activeTab === "chat" && (
              <div className="flex flex-col h-[52vh] bg-white border rounded-2xl overflow-hidden shadow-sm animate-in zoom-in-95 duration-200 text-left">
                <div className="bg-slate-50 px-4 py-2 border-b text-[10px] text-slate-500 font-bold flex items-center justify-between">
                  <span>Chat status: Connected</span>
                  <span className="w-2 h-2 bg-green-500 rounded-full" />
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((m) => {
                    const isBot = m.sender === "bot";
                    return (
                      <div key={m.id} className={`flex ${isBot ? "justify-start" : "justify-end"}`}>
                        <div className={`max-w-[85%] p-3 rounded-2xl text-xs shadow-sm ${
                          isBot ? "bg-slate-100 text-slate-800 rounded-tl-none" : "bg-navy text-white rounded-tr-none font-medium"
                        }`}>
                          <p className="leading-relaxed">{m.text}</p>
                          <span className="block text-[8px] opacity-60 text-right mt-1">
                            {m.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="bg-slate-100 p-3 rounded-2xl rounded-tl-none flex gap-1">
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
                <div className="px-3 py-2 border-t bg-slate-50 overflow-x-auto flex gap-1.5 scrollbar-none">
                  {["Where is my order?", "Referral payout help", "Report damaged product"].map((q) => (
                    <button
                      key={q}
                      onClick={() => handleSendChat(q)}
                      className="whitespace-nowrap bg-white border border-slate-200 hover:border-navy text-navy font-bold text-[10px] px-3 py-1 rounded-full shadow-sm hover:bg-slate-50 transition border-none cursor-pointer"
                    >
                      {q}
                    </button>
                  ))}
                </div>
                <div className="p-3 border-t bg-white flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
                    placeholder="Ask support chat..."
                    className="flex-1 border rounded-xl px-4 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-navy text-navy bg-slate-50"
                  />
                  <button
                    onClick={() => handleSendChat()}
                    className="bg-navy hover:bg-navy/90 text-white p-2 rounded-xl transition-all shrink-0 border-none cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Raise Ticket Interface */}
            {activeTab === "ticket" && (
              <div className="bg-white border rounded-2xl p-5 shadow-sm text-left animate-in zoom-in-95 duration-200">
                <h4 className="font-extrabold text-navy text-sm mb-1">Create Support Ticket</h4>
                <p className="text-[11px] text-muted-foreground mb-4">Explain your dispute. A merchant executive will review the details.</p>

                <form onSubmit={handleCreateTicket} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Category</label>
                    <select
                      value={ticketCategory}
                      onChange={(e) => setTicketCategory(e.target.value)}
                      className="w-full border rounded-xl px-3 py-2 text-xs text-navy focus:outline-none focus:ring-1 focus:ring-navy bg-slate-50"
                    >
                      <option>Delivery</option>
                      <option>Payment & Wallet</option>
                      <option>Merchant Catalog</option>
                      <option>MLM Downline Network</option>
                      <option>Franchise System</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Subject</label>
                    <input
                      type="text"
                      required
                      value={ticketSubject}
                      onChange={(e) => setTicketSubject(e.target.value)}
                      placeholder="Summary of the problem"
                      className="w-full border rounded-xl px-3 py-2 text-xs text-navy focus:outline-none focus:ring-1 focus:ring-navy bg-slate-50"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Detailed Description</label>
                    <textarea
                      rows={4}
                      required
                      value={ticketDesc}
                      onChange={(e) => setTicketDesc(e.target.value)}
                      placeholder="Provide order number, date, transaction hash, or specifics..."
                      className="w-full border rounded-xl px-3 py-2 text-xs text-navy focus:outline-none focus:ring-1 focus:ring-navy bg-slate-50"
                    />
                  </div>

                  <Button type="submit" className="w-full bg-navy hover:bg-navy/90 text-white font-bold rounded-xl text-xs py-2.5">
                    Submit Ticket
                  </Button>
                </form>
              </div>
            )}

            {/* View Tickets List */}
            {activeTab === "ticket-list" && (
              <div className="space-y-3 animate-in zoom-in-95 duration-200 text-left">
                <h4 className="font-extrabold text-navy text-sm mb-1">Your Tickets ({tickets.length})</h4>
                {selectedTicket ? (
                  <div className="bg-white border rounded-2xl p-4 shadow-sm space-y-4">
                    <button
                      onClick={() => setSelectedTicket(null)}
                      className="text-xs font-bold text-navy hover:underline flex items-center gap-1 bg-transparent border-none cursor-pointer"
                    >
                      ← Back to Tickets list
                    </button>
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-full">{selectedTicket.category}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          selectedTicket.status === "Open" ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"
                        }`}>{selectedTicket.status}</span>
                      </div>
                      <h5 className="font-bold text-navy text-xs mt-2">{selectedTicket.subject}</h5>
                      <span className="text-[9px] text-muted-foreground">{selectedTicket.date} • {selectedTicket.id}</span>
                    </div>

                    <div className="space-y-2 border-t pt-3">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Responses</p>
                      {selectedTicket.replies.map((reply, i) => (
                        <div key={i} className="bg-slate-50 rounded-xl p-3 border-l-2 border-navy text-[11px] leading-relaxed">
                          <p>{reply}</p>
                          <span className="block text-[8px] text-muted-foreground mt-1.5 font-bold text-right">Support Desk Agent</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : tickets.length === 0 ? (
                  <div className="bg-white border rounded-2xl p-10 text-center text-muted-foreground text-xs shadow-sm">
                    No active support tickets found.
                  </div>
                ) : (
                  tickets.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => setSelectedTicket(t)}
                      className="bg-white border rounded-2xl p-4 hover:shadow-md transition shadow-premium cursor-pointer flex justify-between items-center group"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-navy font-bold">{t.id}</span>
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                            t.status === "Open" ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"
                          }`}>{t.status}</span>
                        </div>
                        <h5 className="font-extrabold text-slate-700 text-xs mt-1.5 leading-snug line-clamp-1 group-hover:text-accent transition-colors">{t.subject}</h5>
                        <p className="text-[9px] text-muted-foreground mt-1">{t.date} • Category: {t.category}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Video Help Guides */}
            {activeTab === "video" && (
              <div className="space-y-4 animate-in zoom-in-95 duration-200 text-left">
                {selectedVideoUrl ? (
                  <div className="bg-white border rounded-2xl p-4 shadow-sm space-y-3">
                    <button
                      onClick={() => {
                        setSelectedVideoUrl(null);
                        setSelectedVideoTitle("");
                      }}
                      className="text-xs font-bold text-navy hover:underline flex items-center gap-1 bg-transparent border-none cursor-pointer animate-pulse"
                    >
                      ← Back to Video Library
                    </button>
                    <h5 className="font-bold text-navy text-xs">{selectedVideoTitle}</h5>
                    <div className="w-full aspect-video rounded-xl bg-black overflow-hidden relative flex items-center justify-center border">
                      {/* HTML5 video element for premium local playback */}
                      <video
                        src={selectedVideoUrl}
                        controls
                        autoPlay
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground leading-normal">
                      Note: These video guides walk through direct sales, payouts verification, local order tracking, and coupons management setup on the portal.
                    </p>
                  </div>
                ) : (
                  <>
                    <h4 className="font-extrabold text-navy text-sm">Help Video Library ({videos.length})</h4>
                    <div className="space-y-3">
                      {videos.map((vid, idx) => (
                        <div
                          key={idx}
                          onClick={() => {
                            setSelectedVideoUrl(vid.videoUrl);
                            setSelectedVideoTitle(vid.title);
                          }}
                          className="bg-white border rounded-2xl overflow-hidden hover:shadow-md transition shadow-premium cursor-pointer flex flex-col"
                        >
                          <div className="h-32 bg-slate-200 relative overflow-hidden group">
                            <img src={vid.thumbnail} alt={vid.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                              <div className="w-10 h-10 rounded-full bg-white/90 shadow-lg flex items-center justify-center text-navy font-bold scale-90 group-hover:scale-100 transition-transform">
                                <Play className="w-4 h-4 fill-current ml-0.5" />
                              </div>
                            </div>
                            <span className="absolute bottom-2 right-2 bg-black/70 text-white font-bold text-[8px] px-2 py-0.5 rounded-full">{vid.duration}</span>
                          </div>
                          <div className="p-3">
                            <h5 className="font-bold text-navy text-xs leading-snug line-clamp-1">{vid.title}</h5>
                            <p className="text-[10px] text-muted-foreground mt-1 leading-normal line-clamp-2">{vid.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default SupportDrawer;
