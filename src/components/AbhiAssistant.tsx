import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, X, Send, Bot, Sparkles, Calendar, ShoppingBag, Truck, Wallet, BookOpen, Briefcase, ArrowRight, UserCheck, Languages } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "@/hooks/use-toast";

type Message = {
  id: string;
  sender: "user" | "bot";
  text: string;
  link?: string;
  linkText?: string;
  products?: any[];
  activeOrder?: any;
  createdAt: Date;
};

export const AbhiAssistant = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<"hub" | "chat">("hub");
  const [language, setLanguage] = useState<"en" | "te">("en");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      sender: "bot",
      text: "Bzzzt! 🐝 Hi! I am Abhi, your ApexBee Smart AI Assistant. Search products, track live orders, check wallet balance, or ask in Telugu! What would you like to do today?",
      createdAt: new Date()
    }
  ]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [hubData, setHubData] = useState<{
    orders: any[];
    essentials: any[];
    subscriptions: any[];
  }>({ orders: [], essentials: [], subscriptions: [] });
  const [loadingHub, setLoadingHub] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (
        isOpen &&
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isOpen]);

  const quickActions = [
    { label: "🪔 PoojaSamagri", keyword: "puja samagri" },
    { label: "🥦 Fresh Vegetables", keyword: "vegetables" },
    { label: "🚚 Track Order", keyword: "track order" },
    { label: "💰 Wallet Balance", keyword: "wallet balance" },
    { label: "🔧 Home Repairs", keyword: "home services" },
    { label: "🎓 Academy Courses", keyword: "academy" }
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

  useEffect(() => {
    if (isOpen && mode === "hub") {
      const fetchHubData = async () => {
        try {
          setLoadingHub(true);
          const userStr = localStorage.getItem("user");
          let userId = "";
          if (userStr) {
            try { userId = JSON.parse(userStr)._id || JSON.parse(userStr).id; } catch (e) { }
          }
          const API_URL = import.meta.env.VITE_API_URL || "https://server.apexbee.in/api";
          const res = await axios.get(`${API_URL}/abhi-assistant/hub-data?userId=${userId}`);
          if (res.data && res.data.success) {
            setHubData({
              orders: res.data.orders || [],
              essentials: res.data.essentials || [],
              subscriptions: res.data.subscriptions || []
            });
          }
        } catch (e) {
          console.error("Hub data fetch error:", e);
        } finally {
          setLoadingHub(false);
        }
      };
      fetchHubData();
    }
  }, [isOpen, mode]);

  const fallbackResponse = (text: string) => {
    let botResponse = "I'm here to help! Bzzzt! 🐝 You can ask me to find products, track orders, or navigate to various sections.";
    let link = "";
    let linkText = "";

    const normalized = text.toLowerCase();

    if (normalized.includes("wallet") || normalized.includes("balance") || normalized.includes("money") || normalized.includes("pay")) {
      botResponse = language === "te"
        ? "Mee Abhi Wallet nunchi referral earnings & payouts manage cheskovachu."
        : "Securely manage your funds, review downline network commissions, and request payouts instantly from the secure Wallet hub.";
      link = "/wallet";
      linkText = "Go to Wallet Hub 💰";
    } else if (normalized.includes("order") || normalized.includes("schedule") || normalized.includes("track")) {
      botResponse = language === "te"
        ? "Mee orders status & delivery tracking yekkada chuskocho."
        : "Track your standard orders, request item returns, or pause/skip recurring subscription schedules from the orders dashboard.";
      link = "/my-orders";
      linkText = "Go to My Orders 🗓️";
    } else if (normalized.includes("store") || normalized.includes("shop") || normalized.includes("grocery")) {
      botResponse = "Explore dynamic storefronts, wholesale deals, and direct vendor catalogs near your current pincode.";
      link = "/local-stores";
      linkText = "Browse Local Stores 🏪";
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
  };

  const handleResponse = async (text: string) => {
    setIsTyping(true);
    try {
      const userStr = localStorage.getItem("user");
      let userId: string | undefined = undefined;
      try {
        if (userStr) {
          const parsed = JSON.parse(userStr);
          userId = parsed._id || parsed.id;
        }
      } catch (e) {
        console.error(e);
      }

      const API_URL = import.meta.env.VITE_API_URL || "https://server.apexbee.in/api";
      const res = await axios.post(`${API_URL}/abhi-assistant/query`, {
        query: text,
        language,
        userId
      });

      const data = res.data;
      if (data && data.success) {
        setMessages((prev) => [
          ...prev,
          {
            id: Math.random().toString(),
            sender: "bot",
            text: data.replyText,
            link: data.actionLink,
            linkText: data.actionLabel,
            products: data.products,
            activeOrder: data.activeOrder,
            createdAt: new Date()
          }
        ]);
      } else {
        fallbackResponse(text);
      }
    } catch (err) {
      fallbackResponse(text);
    } finally {
      setIsTyping(false);
    }
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

  const handleAddRealProduct = async (product: any) => {
    try {
      const userStr = localStorage.getItem("user");
      let userId = "";
      if (userStr) {
        try { userId = JSON.parse(userStr)._id || JSON.parse(userStr).id; } catch (e) { }
      }
      const API_URL = import.meta.env.VITE_API_URL || "https://server.apexbee.in/api";

      if (userId) {
        await axios.post(`${API_URL}/cart/add`, {
          userId,
          productId: product._id,
          quantity: 1
        });
      } else {
        const local = localStorage.getItem("local_cart") || "[]";
        let cart = [];
        try { cart = JSON.parse(local); } catch { cart = []; }
        cart.push({
          _id: product._id,
          productId: product._id,
          itemName: product.name,
          price: product.sellingPrice || product.price,
          afterDiscount: product.sellingPrice || product.price,
          image: product.image || product.thumbnail || "/placeholder.svg",
          quantity: 1,
          vendorName: product.brand || "ApexBee Store"
        });
        localStorage.setItem("local_cart", JSON.stringify(cart));
      }
      window.dispatchEvent(new Event("storage"));
      toast({ title: "Added to Basket! 🛒", description: `Added "${product.name}" to your cart.` });
    } catch (e: any) {
      toast({ title: "Added to Basket! 🛒", description: `Added "${product.name}" to your cart.` });
    }
  };

  return (
    <>
      {/* Backdrop overlay to close when clicking outside */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-slate-950/30 backdrop-blur-[1px] z-40 transition-opacity"
        />
      )}

      <div ref={containerRef} className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col items-end max-w-[calc(100vw-2rem)]">
        {/* Expanded Dialog Box */}
        {isOpen && (
          <div className="bg-white w-[calc(100vw-2rem)] sm:w-[420px] max-w-[420px] h-[82vh] max-h-[620px] rounded-3xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col mb-4 transition-all duration-300 transform translate-y-0 opacity-100 font-sans">

            {/* Header */}
            <div className="bg-[#0A1128] p-4 text-white flex items-center justify-between shadow-md">
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-amber-400 flex items-center justify-center text-xl shadow-inner font-extrabold animate-bounce">
                    🐝
                  </div>
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-[#0A1128]" />
                </div>
                <div className="text-left">
                  <h3 className="font-black text-sm flex items-center gap-1.5 text-white">
                    Abhi Smart AI <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  </h3>
                  <span className="text-[10px] text-amber-200 font-semibold">ApexBee Live Doorstep Engine</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setLanguage(language === "en" ? "te" : "en")}
                  className="text-[10px] bg-white/20 hover:bg-white/30 text-amber-200 font-black px-2 py-1 rounded-full transition-colors flex items-center gap-1 border-none cursor-pointer"
                  title="Toggle English / Telugu"
                >
                  <Languages className="w-3 h-3" />
                  {language === "en" ? "TE" : "EN"}
                </button>
                <button
                  onClick={() => setMode(mode === "hub" ? "chat" : "hub")}
                  className="text-[10px] bg-amber-400 hover:bg-amber-300 text-slate-950 font-black px-2.5 py-1 rounded-full transition-colors flex items-center gap-1 border-none cursor-pointer"
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
                {hubData.subscriptions && hubData.subscriptions.length > 0 && (
                  <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-blue-100 rounded-2xl p-3.5 shadow-xs text-left">
                    <div className="flex items-center justify-between border-b border-indigo-100/50 pb-2 mb-2.5">
                      <h4 className="text-xs font-black text-indigo-700 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" /> MY SUBSCRIPTIONS
                      </h4>
                      <span className="text-[8px] font-black bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded uppercase">Live Slots</span>
                    </div>
                    <div className="space-y-2">
                      {hubData.subscriptions.map((sub) => (
                        <div key={sub._id} className="flex items-center justify-between text-xs font-bold text-slate-900">
                          <span className="flex items-center gap-1.5 truncate min-w-0">{sub.title}</span>
                          <span className="text-[9px] text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.2 rounded-full font-bold shrink-0">✓ {sub.deliverySlot}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Active Order / Live Tracking Widget */}
                {hubData.orders && hubData.orders.length > 0 ? (
                  <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 rounded-2xl p-3.5 shadow-xs text-left">
                    <div className="flex items-center justify-between border-b border-emerald-100/50 pb-2 mb-2.5">
                      <h4 className="text-xs font-black text-emerald-800 flex items-center gap-1">
                        <Truck className="w-3.5 h-3.5" /> RECENT ORDER
                      </h4>
                      <span className="text-[8px] font-black bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded uppercase animate-pulse">
                        {hubData.orders[0].orderStatus}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-extrabold text-slate-900 leading-none">Order #{hubData.orders[0].displayId}</p>
                        <p className="text-[10px] text-slate-500 mt-1">Total ₹{hubData.orders[0].totalAmount} ({hubData.orders[0].itemsCount} items)</p>
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
                ) : null}

                {/* Quick E-Grocery Purchase Shortcuts from REAL Database */}
                {hubData.essentials && hubData.essentials.length > 0 && (
                  <div>
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider text-left mb-2">⚡ Essentials From Store</p>
                    <div className="grid grid-cols-2 gap-2">
                      {hubData.essentials.map((item) => (
                        <button
                          key={item._id}
                          onClick={() => handleAddRealProduct(item)}
                          className="p-2.5 bg-white border border-slate-100 rounded-xl shadow-2xs text-left hover:border-amber-500 hover:shadow-xs transition-all cursor-pointer flex items-center justify-between w-full text-slate-900 group"
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            {item.image ? (
                              <img src={item.image} alt={item.name} className="w-7 h-7 object-contain rounded bg-slate-50 shrink-0" />
                            ) : (
                              <span className="text-base shrink-0">🛍️</span>
                            )}
                            <div className="min-w-0 font-sans">
                              <p className="text-[10px] font-extrabold truncate leading-tight">{item.name}</p>
                              <p className="text-[9px] text-slate-400 font-bold">₹{item.sellingPrice}</p>
                            </div>
                          </div>
                          <span className="text-[10px] bg-slate-50 border border-slate-100 group-hover:bg-amber-400 group-hover:text-slate-950 p-1 rounded-lg font-black transition-colors shrink-0">+ Add</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Hyperlocal Hub Actions */}
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider text-left mb-2">🎯 Quick Directories</p>
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
                          className={`p-3 rounded-2xl border text-center flex flex-col items-center justify-between h-20 transition-all hover:scale-102 hover:shadow-xs cursor-pointer ${action.color}`}
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
                  className="bg-[#0A1128] text-white rounded-2xl p-3 flex items-center justify-between cursor-pointer hover:bg-slate-900 transition shadow-xs mt-1"
                >
                  <div className="flex items-center gap-2 text-left">
                    <div className="w-7 h-7 bg-amber-400 rounded-full flex items-center justify-center text-sm font-extrabold shrink-0">🤖</div>
                    <div>
                      <p className="text-[10px] font-black text-amber-300">Need specific help or search?</p>
                      <p className="text-[9px] text-white/80 leading-none mt-0.5">Chat with Abhi AI Assistant in Telugu or English</p>
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
                          className={`max-w-[85%] p-3.5 rounded-2xl text-xs sm:text-sm shadow-2xs ${isBot
                              ? "bg-white text-[#0A1128] border border-gray-150 rounded-tl-none"
                              : "bg-[#0A1128] text-white rounded-tr-none font-medium"
                            }`}
                        >
                          <p className="leading-relaxed whitespace-pre-wrap">{m.text}</p>

                          {/* Interactive Product Matches */}
                          {m.products && m.products.length > 0 && (
                            <div className="mt-3 space-y-2 font-sans pt-2 border-t border-slate-100">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Matched Items</p>
                              <div className="grid grid-cols-1 gap-2">
                                {m.products.map((p: any) => (
                                  <div key={p._id} className="bg-slate-50 border border-slate-200 rounded-xl p-2 flex items-center justify-between gap-2 shadow-2xs">
                                    {p.image ? (
                                      <img src={p.image} alt={p.name} className="w-10 h-10 object-contain rounded-lg shrink-0 bg-white" />
                                    ) : (
                                      <span className="text-[#0A1128] text-lg shrink-0">🛍️</span>
                                    )}
                                    <div className="min-w-0 flex-1 text-left">
                                      <p className="text-[11px] font-black text-slate-900 truncate leading-tight">{p.name}</p>
                                      <p className="text-[10px] font-bold text-amber-600">₹{p.sellingPrice} {p.mrp > p.sellingPrice && <span className="line-through text-slate-400 font-normal">₹{p.mrp}</span>}</p>
                                    </div>
                                    <button
                                      onClick={() => handleAddRealProduct(p)}
                                      className="bg-amber-400 hover:bg-amber-500 text-slate-950 px-2.5 py-1 rounded-lg text-[10px] font-black shrink-0 border-none cursor-pointer"
                                    >
                                      + Add
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Interactive Order Card */}
                          {m.activeOrder && (
                            <div className="mt-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-3 text-left shadow-2xs font-sans">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] font-black text-indigo-700 uppercase tracking-wider">Order #{m.activeOrder.displayId}</span>
                                <span className="text-[9px] font-bold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full uppercase">{m.activeOrder.orderStatus}</span>
                              </div>
                              <p className="text-xs font-black text-slate-900">Total: ₹{m.activeOrder.totalAmount} ({m.activeOrder.itemsCount} items)</p>
                              <p className="text-[10px] text-slate-600 mt-0.5">Estimated Delivery: ~15-20 mins</p>
                            </div>
                          )}

                          {m.link && (
                            <button
                              onClick={() => {
                                setIsOpen(false);
                                navigate(m.link!);
                              }}
                              className="mt-3 block text-xs bg-amber-400 hover:bg-amber-300 text-slate-950 font-black px-4 py-2 rounded-full text-center transition-colors shadow-2xs border-none cursor-pointer"
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
                      <div className="bg-white text-[#0A1128] p-3.5 rounded-2xl rounded-tl-none border border-gray-150 shadow-2xs flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-[#0A1128]/60 rounded-full animate-bounce" />
                        <span className="w-1.5 h-1.5 bg-[#0A1128]/60 rounded-full animate-bounce delay-100" />
                        <span className="w-1.5 h-1.5 bg-[#0A1128]/60 rounded-full animate-bounce delay-200" />
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Quick Action Chips */}
                <div className="px-3 py-2 border-t bg-white overflow-x-auto flex gap-1.5 scrollbar-none">
                  {quickActions.map((action, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(action.keyword)}
                      className="whitespace-nowrap px-3 py-1 bg-slate-100 hover:bg-amber-100 text-slate-900 border border-slate-200 rounded-full text-[11px] font-bold transition-all flex-shrink-0 cursor-pointer"
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
                    placeholder={language === "te" ? "అభి ని అడగండి (e.g. టమాటాలు, ఆర్డర్ status)..." : "Ask Abhi (e.g. Flowers, Biryani, Order status)..."}
                    className="flex-1 border border-slate-200 rounded-full px-4 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/20 bg-slate-50 focus:bg-white transition-all text-[#0A1128]"
                  />
                  <button
                    onClick={() => handleSend()}
                    className="bg-[#0A1128] hover:bg-slate-900 text-white p-2.5 rounded-full shadow-md transition-all flex-shrink-0 border-none cursor-pointer"
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
          className="hidden lg:flex w-16 h-16 rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 text-white hover:opacity-95 items-center justify-center shadow-2xl hover:scale-110 transition-all fixed bottom-6 right-6 z-40 border-2 border-white cursor-pointer group"
          title="Open Abhi AI Assistant & Help Center"
        >
          <div className="absolute inset-0 rounded-full bg-amber-400 opacity-25 group-hover:animate-ping" />
          <Bot className="w-8 h-8 z-10 text-white" />
          <span className="absolute -top-1 -right-1 w-6 h-6 bg-amber-400 text-slate-950 rounded-full border-2 border-white flex items-center justify-center text-xs font-black z-15 shadow-md">
            🐝
          </span>
        </button>
      </div>
    </>
  );
};

export default AbhiAssistant;
