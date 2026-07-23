import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, X, Send, Bot, Sparkles, Calendar, ShoppingBag, Truck, Wallet, BookOpen, Briefcase, ArrowRight, UserCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";

type Message = {
  id: string;
  sender: "user" | "bot";
  text: string;
  link?: string;
  linkText?: string;
  createdAt: Date;
};

export const AbhiAssistant = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<"hub" | "chat">("hub");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      sender: "bot",
      text: "Bzzzt! 🐝 Hi! I am Abhi, your ApexBee Assistant. I can help you search local shops, manage subscriptions, view course catalogs, or check your wallet balance. What would you like to do?",
      createdAt: new Date()
    }
  ]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickActions = [
    { label: "🏪 Find Nearby Stores", keyword: "stores" },
    { label: "💰 Wallet & Balance", keyword: "wallet" },
    { label: "🗓️ Subscriptions & Schedules", keyword: "schedules" },
    { label: "🎓 Academy Courses", keyword: "academy" },
    { label: "🔧 Home Services", keyword: "services" },
    { label: "👥 Community Feed", keyword: "community" }
  ];

  useEffect(() => {
    const handleOpen = () => {
      setIsOpen(true);
      setMode("hub");
    };
    window.addEventListener("open_abhi_assistant", handleOpen);
    return () => window.removeEventListener("open_abhi_assistant", handleOpen);
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping]);

  const handleResponse = (text: string) => {
    setIsTyping(true);
    setTimeout(() => {
      let botResponse = "I'm here to help! Bzzzt! 🐝 You can ask me to navigate to various sections of the app or find nearby merchants.";
      let link = "";
      let linkText = "";

      const normalized = text.toLowerCase();

      if (normalized.includes("wallet") || normalized.includes("balance") || normalized.includes("money") || normalized.includes("pay")) {
        botResponse = "Securely manage your funds, review downline network commissions, and request payouts instantly from the secure Wallet hub.";
        link = "/wallet";
        linkText = "Go to Wallet Hub 💰";
      } else if (normalized.includes("order") || normalized.includes("schedule") || normalized.includes("subscription") || normalized.includes("skip") || normalized.includes("pause")) {
        botResponse = "Track your standard orders, request item returns, or pause/skip recurring subscription schedules from the orders dashboard.";
        link = "/my-orders";
        linkText = "Go to My Orders & Schedules 🗓️";
      } else if (normalized.includes("store") || normalized.includes("shop") || normalized.includes("grocery") || normalized.includes("groceries") || normalized.includes("nearby") || normalized.includes("seller")) {
        botResponse = "Explore dynamic storefronts, wholesale deals, and direct vendor catalogs near your current pincode.";
        link = "/local-stores";
        linkText = "Browse Local Stores 🏪";
      } else if (normalized.includes("academy") || normalized.includes("course") || normalized.includes("learn") || normalized.includes("class") || normalized.includes("study")) {
        botResponse = "Enroll in certification tracks covering Digital Marketing, MLM leadership, and business expansion strategies.";
        link = "/academy";
        linkText = "Explore Academy Courses 🎓";
      } else if (normalized.includes("service") || normalized.includes("clean") || normalized.includes("plumb") || normalized.includes("repair") || normalized.includes("fix")) {
        botResponse = "Book professional home services like appliance repair, pest control, electrical, and plumbing directly to your door.";
        link = "/services";
        linkText = "Book Doorstep Services 🔧";
      } else if (normalized.includes("community") || normalized.includes("post") || normalized.includes("member") || normalized.includes("review")) {
        botResponse = "Discuss product details, post merchant ratings, and interact with other local buyers in the ApexBee community feed.";
        link = "/community";
        linkText = "Open Community Feed 👥";
      }

      setMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(),
          sender: "bot",
          text: botResponse,
          link,
          linkText,
          createdAt: new Date()
        }
      ]);
      setIsTyping(false);
    }, 800);
  };

  const handleSend = (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim()) return;

    setMessages((prev) => [
      ...prev,
      {
        id: Math.random().toString(),
        sender: "user",
        text,
        createdAt: new Date()
      }
    ]);

    if (!textToSend) setInputText("");
    handleResponse(text);
  };

  // Mock add item to cart
  const handleQuickAdd = (itemName: string, price: number, emoji: string) => {
    const userStr = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    
    // Save to local cart if guest or backend cart if logged in
    const local = localStorage.getItem("local_cart") || "[]";
    let cart = [];
    try { cart = JSON.parse(local); } catch { cart = []; }
    
    const newItem = {
      _id: `quick-${Date.now()}`,
      productId: `prod-quick-${itemName.toLowerCase()}`,
      itemName: `${emoji} ${itemName}`,
      price: price,
      afterDiscount: price,
      image: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=100",
      quantity: 1,
      stock: 100,
      vendorName: "ApexBee Local Vendor",
      returnPolicy: "No return"
    };

    cart.push(newItem);
    localStorage.setItem("local_cart", JSON.stringify(cart));
    window.dispatchEvent(new Event("storage"));
    
    alert(`Added ${emoji} ${itemName} to your Basket!`);
  };

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col items-end max-w-[calc(100vw-2rem)]">
      {/* Expanded Dialog Box */}
      {isOpen && (
        <div className="bg-white w-[calc(100vw-2rem)] sm:w-[400px] max-w-[400px] h-[80vh] max-h-[580px] rounded-3xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col mb-4 transition-all duration-300 transform translate-y-0 opacity-100 font-sans">
          
          {/* Header */}
          <div className="bg-navy p-4 text-white flex items-center justify-between shadow-md">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-yellow-400 flex items-center justify-center text-xl shadow-inner font-extrabold animate-bounce">
                  🐝
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-navy" />
              </div>
              <div className="text-left">
                <h3 className="font-black text-sm flex items-center gap-1.5">
                  ApexBee Signature Hub <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                </h3>
                <span className="text-[10px] opacity-75">Buchireddypalem Local Deliveries</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMode(mode === "hub" ? "chat" : "hub")}
                className="text-[10px] bg-white/25 hover:bg-white/30 text-white font-black px-2.5 py-1 rounded-full transition-colors flex items-center gap-1 border-none cursor-pointer"
              >
                {mode === "hub" ? "💬 Chat AI" : "🐝 Show Hub"}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-1.5 rounded-full transition-colors border-none cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Mode 1: Quick Hub Menu */}
          {mode === "hub" && (
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
              
              {/* Today's Schedule Widget */}
              <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-blue-100 rounded-2xl p-3.5 shadow-sm text-left">
                <div className="flex items-center justify-between border-b border-indigo-100/50 pb-2 mb-2.5">
                  <h4 className="text-xs font-black text-indigo-700 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> TODAY'S SCHEDULE
                  </h4>
                  <span className="text-[8px] font-black bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded uppercase">Daily Slots</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-navy">
                    <span className="flex items-center gap-1.5">🌼 Jasmine Flowers</span>
                    <span className="text-[10px] text-green-600 bg-green-50 border border-green-100 px-1.5 py-0.2 rounded-full font-bold">✓ Delivered 6 AM</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-bold text-navy">
                    <span className="flex items-center gap-1.5">🥛 Fresh Milk 1L</span>
                    <span className="text-[10px] text-green-600 bg-green-50 border border-green-100 px-1.5 py-0.2 rounded-full font-bold">✓ Delivered 6:05 AM</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-bold text-navy">
                    <span className="flex items-center gap-1.5">💧 Water Can 20L</span>
                    <span className="text-[10px] text-amber-600 bg-amber-50 border border-amber-100 px-1.5 py-0.2 rounded-full font-bold">⏳ Scheduled 6 PM</span>
                  </div>
                </div>
              </div>

              {/* Active Order / Live Tracking Widget */}
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 rounded-2xl p-3.5 shadow-sm text-left">
                <div className="flex items-center justify-between border-b border-emerald-100/50 pb-2 mb-2.5">
                  <h4 className="text-xs font-black text-emerald-800 flex items-center gap-1">
                    <Truck className="w-3.5 h-3.5" /> TODAY'S ORDERS
                  </h4>
                  <span className="text-[8px] font-black bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded uppercase animate-pulse">Out For Delivery</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-extrabold text-navy leading-none">Order #AB-90412</p>
                    <p className="text-[10px] text-slate-500 mt-1">Delivery partner Rajesh is arriving in 12 mins. OTP: 5829</p>
                  </div>
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      navigate("/my-orders");
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[9px] px-2.5 py-1.5 rounded-lg shrink-0 border-none cursor-pointer"
                  >
                    Track Live
                  </button>
                </div>
              </div>

              {/* Quick E-Grocery Purchase Shortcuts */}
              <div>
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider text-left mb-2">⚡ Quick Order Daily Essentials</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "Puja Flowers", emoji: "🌼", price: 30 },
                    { label: "Drinking Water Can", emoji: "💧", price: 40 },
                    { label: "Cow Milk 1L", emoji: "🥛", price: 60 },
                    { label: "Fresh Tomato 1kg", emoji: "🍅", price: 45 },
                  ].map((item) => (
                    <button
                      key={item.label}
                      onClick={() => handleQuickAdd(item.label, item.price, item.emoji)}
                      className="p-2.5 bg-white border border-slate-100 rounded-xl shadow-sm text-left hover:border-accent hover:shadow transition-all cursor-pointer flex items-center justify-between w-full text-navy group"
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-base">{item.emoji}</span>
                        <div className="min-w-0 font-sans">
                          <p className="text-[10px] font-extrabold truncate leading-tight">{item.label}</p>
                          <p className="text-[9px] text-slate-400 font-bold">₹{item.price}</p>
                        </div>
                      </div>
                      <span className="text-[10px] bg-slate-50 border border-slate-100 group-hover:bg-accent group-hover:text-white p-1 rounded-lg font-black transition-colors shrink-0">+ Add</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Hyperlocal Hub Actions */}
              <div>
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider text-left mb-2">🎯 Hyperlocal Directory</p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: "Book Services", icon: Briefcase, to: "/services", color: "text-blue-600 bg-blue-50 border-blue-100" },
                    { label: "Track Orders", icon: Truck, to: "/my-orders", color: "text-emerald-700 bg-emerald-50 border-emerald-100" },
                    { label: "Wallet Cash", icon: Wallet, to: "/wallet", color: "text-amber-700 bg-amber-50 border-amber-100" },
                    { label: "Apex Academy", icon: BookOpen, to: "/academy", color: "text-purple-700 bg-purple-50 border-purple-100" },
                    { label: "Business Hub", icon: UserCheck, to: "/register?ref=partner", color: "text-pink-700 bg-pink-50 border-pink-100" },
                    { label: "Explore Shops", icon: ShoppingBag, to: "/local-stores", color: "text-sky-700 bg-sky-50 border-sky-100" },
                  ].map((action, idx) => {
                    const Icon = action.icon;
                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          setIsOpen(false);
                          navigate(action.to);
                        }}
                        className={`p-3 rounded-2xl border text-center flex flex-col items-center justify-between h-20 transition-all hover:scale-102 hover:shadow-sm cursor-pointer ${action.color}`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="text-[8px] font-black leading-none mt-1">{action.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Bot Switcher CTA Banner */}
              <div
                onClick={() => setMode("chat")}
                className="bg-navy-dark text-white rounded-2xl p-3 flex items-center justify-between cursor-pointer hover:bg-navy transition shadow-sm mt-1"
              >
                <div className="flex items-center gap-2 text-left">
                  <div className="w-7 h-7 bg-yellow-400 rounded-full flex items-center justify-center text-sm font-extrabold shrink-0">🤖</div>
                  <div>
                    <p className="text-[10px] font-black text-yellow-300">Need specific help?</p>
                    <p className="text-[9px] text-white/80 leading-none mt-0.5">Chat with Abhi AI Assistant now</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-white animate-pulse" />
              </div>

            </div>
          )}

          {/* Mode 2: AI Chatbot Assistant */}
          {mode === "chat" && (
            <>
              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50 text-left">
                {messages.map((m) => {
                  const isBot = m.sender === "bot";
                  return (
                    <div
                      key={m.id}
                      className={`flex ${isBot ? "justify-start" : "justify-end"}`}
                    >
                      <div
                        className={`max-w-[80%] p-3.5 rounded-2xl text-sm shadow-sm ${
                          isBot
                            ? "bg-white text-navy border border-gray-150 rounded-tl-none"
                            : "bg-navy text-white rounded-tr-none font-medium"
                        }`}
                      >
                        <p className="leading-relaxed">{m.text}</p>
                        {m.link && (
                          <button
                            onClick={() => {
                              setIsOpen(false);
                              navigate(m.link!);
                            }}
                            className="mt-3 block text-xs bg-yellow-400 hover:bg-yellow-500 text-navy font-black px-4 py-2 rounded-full text-center transition-colors shadow-sm border-none cursor-pointer"
                          >
                            {m.linkText}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-white text-navy p-3.5 rounded-2xl rounded-tl-none border border-gray-150 shadow-sm flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-navy/60 rounded-full animate-bounce" />
                      <span className="w-1.5 h-1.5 bg-navy/60 rounded-full animate-bounce delay-100" />
                      <span className="w-1.5 h-1.5 bg-navy/60 rounded-full animate-bounce delay-200" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Action Chips */}
              <div className="px-4 py-2 border-t bg-white overflow-x-auto flex gap-2 scrollbar-none">
                {quickActions.map((action, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(action.keyword)}
                    className="whitespace-nowrap px-3.5 py-1.5 bg-gray-100 hover:bg-navy/5 text-navy border border-gray-200 hover:border-navy/20 rounded-full text-xs font-bold transition-all flex-shrink-0 cursor-pointer"
                  >
                    {action.label}
                  </button>
                ))}
              </div>

              {/* Input Footer */}
              <div className="p-3 border-t bg-white flex gap-2 items-center">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Ask Abhi something..."
                  className="flex-1 border rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20 bg-gray-50 focus:bg-white transition-all text-navy"
                />
                <button
                  onClick={() => handleSend()}
                  className="bg-navy hover:bg-navy/90 text-white p-2.5 rounded-full shadow-lg shadow-navy/10 hover:shadow-navy/20 transition-all flex-shrink-0 border-none cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </>
          )}

        </div>
      )}

      {/* Floating Action Button (Desktop View Only, Hidden on Mobile View) */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          setMode("hub");
        }}
        className="hidden lg:flex w-16 h-16 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white hover:opacity-95 items-center justify-center shadow-2xl shadow-blue-600/40 hover:scale-110 transition-all fixed bottom-6 right-6 z-40 border-2 border-white cursor-pointer group"
        title="Open Abhi AI Assistant & Help Center"
      >
        <div className="absolute inset-0 rounded-full bg-blue-500 opacity-25 group-hover:animate-ping" />
        <Bot className="w-8 h-8 z-10 text-white" />
        <span className="absolute -top-1 -right-1 w-6 h-6 bg-amber-400 text-[#0A1128] rounded-full border-2 border-white flex items-center justify-center text-xs font-black z-15 shadow-md">
          🐝
        </span>
      </button>
    </div>
  );
};

export default AbhiAssistant;
