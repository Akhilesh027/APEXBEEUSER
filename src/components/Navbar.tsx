import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Search,
  ShoppingBag,
  User,
  Menu,
  Wallet,
  ChevronDown,
  X,
  ChevronRight,
  Package,
  Layers,
  Bell,
  MapPin,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import logo from "../Web images/Web images/logo.png";
import FormModal from "./FormModal.tsx";
import LocationModal from "./LocationModal";

const API_BASE = "http://localhost:5500/api";
const TOKEN_KEY = "token";
const USER_KEY = "user";

const PORTAL_LINKS: Record<string, { label: string; url: string }> = {
  admin: { label: "Admin Panel", url: "http://localhost:5173" },
  vendor: { label: "Vendor Portal", url: "http://localhost:5177" },
  franchise: { label: "Franchise Management", url: "http://localhost:5175" },
  state_franchise: { label: "Franchise Management", url: "http://localhost:5175" },
  district_franchise: { label: "Franchise Management", url: "http://localhost:5175" },
  mandal_franchise: { label: "Franchise Management", url: "http://localhost:5175" },
  service_provider: { label: "Service Provider Portal", url: "http://localhost:5176" },
  course_provider: { label: "Course Provider Portal", url: "http://localhost:5174" },
};

type CategoryItem = {
  _id: string;
  name: string;
  image?: string;
};

const MOCK_NOTIFICATIONS = [
  { _id: "notif-1", title: "🚚 Order Dispatched!", message: "Order #AB-90412 is on the way with partner Ramesh. ETA 15 mins. OTP: 5829", category: "orders", isRead: false, createdAt: new Date().toISOString() },
  { _id: "notif-2", title: "🔥 Fresh Milk Flash Offer", message: "Same-day milk offer ends in 2 hours! Get 30% discount on local farm milk.", category: "offers", isRead: false, createdAt: new Date().toISOString() },
  { _id: "notif-3", title: "💰 Referral Commission", message: "₹50 cash bonus added to your Wallet from downline sign-up Amit Singh.", category: "wallet", isRead: true, createdAt: new Date(Date.now() - 3600000).toISOString() },
  { _id: "notif-4", title: "🏪 Support Local Shops", message: "New Nellore Supermarket is now live. Check out daily nearby store deals!", category: "offers", isRead: true, createdAt: new Date(Date.now() - 7200000).toISOString() },
  { _id: "notif-5", title: "🤝 Franchise Payout Approved", message: "Mandal level-1 partner commission of ₹1,200 cleared for JP Nagar zone.", category: "franchise", isRead: true, createdAt: new Date(Date.now() - 86400000).toISOString() },
  { _id: "notif-6", title: "🔔 KYC Complete Bonus", message: "Your KYC verification is complete. ₹50 registration bonus has unlocked.", category: "wallet", isRead: false, createdAt: new Date(Date.now() - 120000).toISOString() }
];

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [loggedInUser, setLoggedInUser] = useState<any>(null);

  const [cartItemsCount, setCartItemsCount] = useState(0);
  const [ordersCount, setOrdersCount] = useState(0);

  /** ✅ UPDATED: show AVAILABLE wallet (and support hold/total if backend returns) */
  const [walletTotal, setWalletTotal] = useState(0);
  const [walletHold, setWalletHold] = useState(0);
  const [walletAvailable, setWalletAvailable] = useState(0);

  const [loading, setLoading] = useState({
    wallet: false,
    cart: false,
    orders: false,
    categories: false,
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [openLocationModal, setOpenLocationModal] = useState(false);
  const [userLocation, setUserLocation] = useState<any | null>(null);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [earnDropdownOpen, setEarnDropdownOpen] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalEndpoint, setModalEndpoint] = useState("");

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileEarnOpen, setMobileEarnOpen] = useState(false);

  // ✅ Shop by Category dropdown
  const [shopByOpen, setShopByOpen] = useState(false);
  const [categories, setCategories] = useState<CategoryItem[]>([]);

  /** ✅ close dropdowns on outside click / Esc */
  const shopByRef = useRef<HTMLDivElement | null>(null);
  const earnRef = useRef<HTMLDivElement | null>(null);
  const portalRef = useRef<HTMLDivElement | null>(null);
  const langRef = useRef<HTMLDivElement | null>(null);
  const searchRef = useRef<HTMLDivElement | null>(null);

  const [portalDropdownOpen, setPortalDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Language selector state
  const [langOpen, setLangOpen] = useState(false);
  const [activeLang, setActiveLang] = useState(() => localStorage.getItem("user_language") || "en");
  const languages: Record<string, string> = { en: "English", te: "తెలుగు", hi: "हिन्दी" };

  // Voice/Barcode modal states
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [voiceText, setVoiceText] = useState("Try saying 'organic honey', 'milk', or 'atta'");
  const [voiceStatus, setVoiceStatus] = useState("Listening...");
  const [barcodeStatus, setBarcodeStatus] = useState("Align the barcode within the scanning frame");
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [activeNotificationTab, setActiveNotificationTab] = useState("all");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const recognitionRef = useRef<any>(null);

  // Search focus state
  const [searchFocused, setSearchFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("recent_searches") || "[]"); } catch { return []; }
  });
  const trendingSearches = ["Groceries", "Organic Ghee", "Aromatherapy", "Electrician", "Tuitions"];
  const nearbyStoresMock = ["Nellore Supermarket", "Buchireddypalem Agro Mill", "Apex Pharmacy"];

  const closeAllPopovers = useCallback(() => {
    setEarnDropdownOpen(false);
    setShopByOpen(false);
    setMobileEarnOpen(false);
    setPortalDropdownOpen(false);
    setLangOpen(false);
  }, []);

  const handleOpenForm = (title: string, endpoint: string) => {
    setModalTitle(title);
    setModalEndpoint(endpoint);
    setModalOpen(true);
    closeAllPopovers();
    setMobileMenuOpen(false);
  };

  const getUserData = useCallback(() => {
    const user = localStorage.getItem(USER_KEY);
    const token = localStorage.getItem(TOKEN_KEY);
    return { user: user ? JSON.parse(user) : null, token };
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(TOKEN_KEY);

    setLoggedInUser(null);
    setCartItemsCount(0);
    setOrdersCount(0);

    setWalletTotal(0);
    setWalletHold(0);
    setWalletAvailable(0);
    setNotifications([]);
    setUnreadCount(0);

    setMobileMenuOpen(false);
    closeAllPopovers();

    navigate("/login");
  }, [navigate, closeAllPopovers]);

  // ✅ cart count
  const fetchCartItemsCount = useCallback(
    async (userId: string, token: string) => {
      if (!userId || !token) return;

      try {
        setLoading((p) => ({ ...p, cart: true }));
        const response = await fetch(`${API_BASE}/cart/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          const items = Array.isArray(data?.cart?.items) ? data.cart.items : [];
          const totalItems = items.reduce(
            (total: number, item: any) => total + (item?.quantity || 0),
            0
          );
          setCartItemsCount(totalItems);
        } else if (response.status === 401) {
          handleLogout();
        } else {
          setCartItemsCount(0);
        }
      } catch (error) {
        console.error("Error fetching cart items count:", error);
        setCartItemsCount(0);
      } finally {
        setLoading((p) => ({ ...p, cart: false }));
      }
    },
    [handleLogout]
  );

  // ✅ orders count
  const fetchOrdersCount = useCallback(
    async (userId: string, token: string) => {
      if (!userId || !token) return;

      try {
        setLoading((p) => ({ ...p, orders: true }));
        const response = await fetch(`${API_BASE}/orders/${userId}/count`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          setOrdersCount(data?.count || 0);
        } else if (response.status === 401) {
          handleLogout();
        } else {
          setOrdersCount(0);
        }
      } catch (error) {
        console.error("Error fetching orders count:", error);
        setOrdersCount(0);
      } finally {
        setLoading((p) => ({ ...p, orders: false }));
      }
    },
    [handleLogout]
  );

  /** ✅ UPDATED: wallet split normalization (total/hold/available) */
  const fetchWalletBalance = useCallback(
    async (token: string) => {
      if (!token) return;

      try {
        setLoading((p) => ({ ...p, wallet: true }));
        const response = await fetch(`${API_BASE}/referrals/stats`, {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        });

        if (response.ok) {
          const data = await response.json();
          const statsObj = data?.stats || {};

          // Try wallet split first (recommended)
          const total = Number(statsObj.walletTotal ?? statsObj.walletBalance ?? statsObj.wallet ?? statsObj.totalEarnings ?? statsObj.totalEarned ?? 0) || 0;
          const hold = Number(statsObj.walletHold ?? statsObj.holdBalance ?? statsObj.pendingBalance ?? statsObj.walletOnHold ?? statsObj.pendingHold ?? 0) || 0;
          const available = Number(statsObj.walletAvailable ?? statsObj.availableBalance ?? 0) || 0;

          setWalletTotal(total);
          setWalletHold(hold);
          setWalletAvailable(available);
        } else if (response.status === 401) {
          handleLogout();
        } else {
          setWalletTotal(0);
          setWalletHold(0);
          setWalletAvailable(0);
        }
      } catch (error) {
        console.error("Error fetching wallet balance:", error);
        setWalletTotal(0);
        setWalletHold(0);
        setWalletAvailable(0);
      } finally {
        setLoading((p) => ({ ...p, wallet: false }));
      }
    },
    [handleLogout]
  );

  // ✅ categories for shop-by dropdown
  const fetchCategories = useCallback(async () => {
    try {
      setLoading((p) => ({ ...p, categories: true }));
      const res = await fetch(`${API_BASE}/categories`);
      const json = await res.json();

      const list = Array.isArray(json?.categories) ? json.categories : [];
      setCategories(
        list.map((c: any) => ({
          _id: c._id,
          name: c.name,
          image: c.image,
        }))
      );
    } catch (e) {
      console.error("Error loading categories:", e);
      setCategories([]);
    } finally {
      setLoading((p) => ({ ...p, categories: false }));
    }
  }, []);

  const fetchNotifications = useCallback(async (userId: string, token: string) => {
    if (!userId || !token) return;
    try {
      const res = await fetch(`${API_BASE}/notifications/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const list = data.notifications || [];
        setNotifications(list);
        setUnreadCount(list.filter((n: any) => n.status === 'unread' || (!n.isRead && n.status !== 'read')).length);
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
    }
  }, []);

  const handleMarkAsRead = async (notifId: string) => {
    const { token } = getUserData();
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/notifications/${notifId}/read`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setNotifications(prev =>
          prev.map(n => n._id === notifId ? { ...n, isRead: true, status: 'read' } : n)
        );
        setUnreadCount(c => Math.max(0, c - 1));
      }
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  const fetchUserData = useCallback(async () => {
    const { user, token } = getUserData();

    if (user && token) {
      setLoggedInUser(user);
      await Promise.all([
        fetchCartItemsCount(user._id, token),
        fetchOrdersCount(user._id, token),
        fetchWalletBalance(token),
        fetchNotifications(user._id, token),
      ]);
    } else {
      setLoggedInUser(null);
      // Load local cart count
      const local = localStorage.getItem("local_cart");
      if (local) {
        try {
          const items = JSON.parse(local);
          if (Array.isArray(items)) {
            const totalItems = items.reduce((total: number, item: any) => total + (item?.quantity || 0), 0);
            setCartItemsCount(totalItems);
          } else {
            setCartItemsCount(0);
          }
        } catch {
          setCartItemsCount(0);
        }
      } else {
        setCartItemsCount(0);
      }
      setOrdersCount(0);
      setWalletTotal(0);
      setWalletHold(0);
      setNotifications([]);
      setUnreadCount(0);
      // Load local wishlist count
      const localWish = localStorage.getItem("local_wishlist");
      if (localWish) {
        try {
          const list = JSON.parse(localWish);
          setWishlistCount(Array.isArray(list) ? list.length : 0);
        } catch {
          setWishlistCount(0);
        }
      } else {
        setWishlistCount(0);
      }
    }
  }, [getUserData, fetchCartItemsCount, fetchOrdersCount, fetchWalletBalance, fetchNotifications]);

  // initial load
  useEffect(() => {
    fetchUserData();
    fetchCategories();

    // Load initial location
    const savedLoc = localStorage.getItem("user_location");
    if (savedLoc) {
      try {
        setUserLocation(JSON.parse(savedLoc));
      } catch {
        localStorage.removeItem("user_location");
      }
    }

    // Load wishlist count from real API
    const fetchWishlistCount = async () => {
      const { user, token } = getUserData();
      if (!user || !token) {
        const local = localStorage.getItem("local_wishlist");
        if (local) {
          try {
            const list = JSON.parse(local);
            setWishlistCount(Array.isArray(list) ? list.length : 0);
          } catch {
            setWishlistCount(0);
          }
        } else {
          setWishlistCount(0);
        }
        return;
      }
      try {
        const res = await fetch(`${API_BASE}/wishlist/${user._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          const items = Array.isArray(data?.wishlist) ? data.wishlist : [];
          setWishlistCount(items.length);
        } else {
          setWishlistCount(0);
        }
      } catch {
        setWishlistCount(0);
      }
    };
    fetchWishlistCount();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === USER_KEY || e.key === TOKEN_KEY) fetchUserData();
      if (e.key === "user_location") {
        const nextLoc = localStorage.getItem("user_location");
        setUserLocation(nextLoc ? JSON.parse(nextLoc) : null);
      }
      if (e.key === "wishlist_updated" || e.key === "local_wishlist" || e.key === "local_cart" || e.key === "cart_updated") {
        fetchWishlistCount();
        fetchUserData();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [fetchUserData, fetchCategories]);

  const locationLabel = useMemo(() => {
    if (!userLocation) return "Set Location";
    const colony = userLocation.colony?.trim();
    const pin = userLocation.pincode;
    if (colony && pin) return `${colony} - ${pin}`;
    if (pin) return pin;
    return "Location set";
  }, [userLocation]);
  // Audio beep player
  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(800, audioCtx.currentTime); // 800Hz beep
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.15); // 150ms beep
    } catch (e) {
      console.error("Audio Context beep failed", e);
    }
  };

  // Voice Search Effect
  useEffect(() => {
    if (!showVoiceModal) {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      return;
    }

    setVoiceStatus("Listening...");
    setVoiceText("Speak now...");

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      recognitionRef.current = rec;
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = "en-IN";

      rec.onstart = () => {
        setVoiceStatus("Listening...");
      };

      rec.onresult = (event: any) => {
        const resultText = event.results[0][0].transcript;
        setVoiceStatus("Success!");
        setVoiceText(`You said: "${resultText}"`);
        playBeep();

        setTimeout(() => {
          setSearchQuery(resultText);
          const updated = [resultText, ...recentSearches.filter((s) => s !== resultText)].slice(0, 5);
          setRecentSearches(updated);
          localStorage.setItem("recent_searches", JSON.stringify(updated));
          setShowVoiceModal(false);
          navigate(`/products?q=${encodeURIComponent(resultText)}`);
        }, 1200);
      };

      rec.onerror = (e: any) => {
        console.error("Speech Recognition Error", e);
        setVoiceStatus("Error");
        setVoiceText("Could not understand. Trying mock fallback...");
        runMockVoiceSearch();
      };

      rec.start();
    } else {
      setVoiceStatus("Microphone Listening...");
      runMockVoiceSearch();
    }

    function runMockVoiceSearch() {
      const t1 = setTimeout(() => {
        setVoiceStatus("Processing voice...");
        setVoiceText('Detecting: "Organic Honey"');
      }, 1500);

      const t2 = setTimeout(() => {
        setVoiceStatus("Success!");
        playBeep();
        const q = "Organic Honey";
        setSearchQuery(q);
        const updated = [q, ...recentSearches.filter((s) => s !== q)].slice(0, 5);
        setRecentSearches(updated);
        localStorage.setItem("recent_searches", JSON.stringify(updated));
        setShowVoiceModal(false);
        navigate(`/products?q=${encodeURIComponent(q)}`);
      }, 3000);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [showVoiceModal]);

  // Barcode Scanner Effect
  useEffect(() => {
    if (!showBarcodeModal) {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
        setCameraStream(null);
      }
      return;
    }

    setBarcodeStatus("Initializing camera stream...");

    // Try starting physical camera
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" } })
      .then((stream) => {
        setCameraStream(stream);
        setBarcodeStatus("Align the barcode in the frame...");
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        // Mock scan detection after camera opens
        const tScan = setTimeout(() => {
          setBarcodeStatus("Barcode detected: 8901058002315 (Milk Packet)");
          playBeep();

          setTimeout(() => {
            const q = "Milk";
            setSearchQuery(q);
            const updated = [q, ...recentSearches.filter((s) => s !== q)].slice(0, 5);
            setRecentSearches(updated);
            localStorage.setItem("recent_searches", JSON.stringify(updated));
            setShowBarcodeModal(false);
            navigate(`/products?q=${encodeURIComponent(q)}`);
          }, 1500);
        }, 3500);

        return () => clearTimeout(tScan);
      })
      .catch((err) => {
        console.warn("Camera access denied or unavailable, using simulation", err);
        setBarcodeStatus("Camera blocked. Simulating product scan...");

        const t1 = setTimeout(() => {
          setBarcodeStatus("Reading barcode scanline...");
        }, 1500);

        const t2 = setTimeout(() => {
          setBarcodeStatus("Success! Barcode 8901058002315 read.");
          playBeep();

          setTimeout(() => {
            const q = "Milk";
            setSearchQuery(q);
            const updated = [q, ...recentSearches.filter((s) => s !== q)].slice(0, 5);
            setRecentSearches(updated);
            localStorage.setItem("recent_searches", JSON.stringify(updated));
            setShowBarcodeModal(false);
            navigate(`/products?q=${encodeURIComponent(q)}`);
          }, 1500);
        }, 3000);

        return () => {
          clearTimeout(t1);
          clearTimeout(t2);
        };
      });

    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [showBarcodeModal]);

  const allNotifications = useMemo(() => {
    if (notifications && notifications.length > 0) {
      return notifications.map((n: any) => {
        let category = "orders";
        const msg = (n.message || "").toLowerCase();
        if (msg.includes("wallet") || msg.includes("cashback") || msg.includes("bonus") || msg.includes("commission") || msg.includes("rupee") || msg.includes("payout")) category = "wallet";
        else if (msg.includes("offer") || msg.includes("discount") || msg.includes("coupon") || msg.includes("deal") || msg.includes("sale")) category = "offers";
        else if (msg.includes("business") || msg.includes("partner") || msg.includes("shop") || msg.includes("merchant")) category = "business";
        else if (msg.includes("franchise") || msg.includes("mandal") || msg.includes("district")) category = "franchise";
        return { ...n, category };
      });
    }
    return MOCK_NOTIFICATIONS;
  }, [notifications]);

  const filteredNotifications = useMemo(() => {
    if (activeNotificationTab === "all") return allNotifications;
    return allNotifications.filter((n: any) => n.category === activeNotificationTab);
  }, [allNotifications, activeNotificationTab]);

  // refresh counts on route change
  useEffect(() => {
    fetchUserData();
    closeAllPopovers();
    setMobileMenuOpen(false);
  }, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  // periodic refresh (counts + wallet)
  useEffect(() => {
    if (!loggedInUser) return;

    const { user, token } = getUserData();
    if (!user || !token) return;

    const interval = setInterval(() => {
      fetchCartItemsCount(user._id, token);
      fetchOrdersCount(user._id, token);
      fetchWalletBalance(token);
      fetchNotifications(user._id, token);
    }, 30000);

    return () => clearInterval(interval);
  }, [loggedInUser, fetchCartItemsCount, fetchOrdersCount, fetchWalletBalance, fetchNotifications, getUserData]);

  /** ✅ close dropdowns when clicking outside or pressing ESC */
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (shopByOpen && shopByRef.current && !shopByRef.current.contains(t)) setShopByOpen(false);
      if (earnDropdownOpen && earnRef.current && !earnRef.current.contains(t)) setEarnDropdownOpen(false);
      if (portalDropdownOpen && portalRef.current && !portalRef.current.contains(t)) setPortalDropdownOpen(false);
      if (langOpen && langRef.current && !langRef.current.contains(t)) setLangOpen(false);
      if (searchFocused && searchRef.current && !searchRef.current.contains(t)) setSearchFocused(false);
    };

    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeAllPopovers();
        setSearchFocused(false);
      }
    };

    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onEsc);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onEsc);
    };
  }, [shopByOpen, earnDropdownOpen, portalDropdownOpen, langOpen, searchFocused, closeAllPopovers]);

  const formatMoney = (balance: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(balance);
  };

  const badge = (val: number, loadingState: boolean) => {
    if (loadingState) {
      return (
        <span className="absolute -top-2 -right-2 bg-gray-400 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
          ...
        </span>
      );
    }
    if (!val) return null;
    return (
      <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
        {val > 9 ? "9+" : val}
      </span>
    );
  };

  const categoryDropdown = useMemo(() => {
    if (!shopByOpen) return null;

    return (
      <div className="absolute top-full left-0 mt-2 w-[320px] rounded-xl border bg-white text-black shadow-lg z-50 overflow-hidden">
        <div className="p-3 border-b flex items-center justify-between">
          <p className="font-bold text-navy">Shop by Category</p>
          <button
            className="text-sm text-muted-foreground hover:text-navy"
            onClick={() => {
              setShopByOpen(false);
              navigate("/categories");
            }}
          >
            View All
          </button>
        </div>

        <div className="max-h-[360px] overflow-auto">
          {loading.categories ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-gray-200" />
                  <div className="h-4 w-40 bg-gray-200 rounded" />
                </div>
              ))}
            </div>
          ) : categories.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground">No categories found.</div>
          ) : (
            categories.map((c) => (
              <button
                key={c._id}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left"
                onClick={() => {
                  setShopByOpen(false);
                  navigate(`/category/${encodeURIComponent(c.name)}`);
                }}
              >
                <div className="h-10 w-10 rounded-lg overflow-hidden bg-gray-100 border flex items-center justify-center">
                  {c.image ? (
                    <img src={c.image} alt={c.name} className="h-full w-full object-cover" />
                  ) : (
                    <Layers className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-navy capitalize">{c.name}</p>
                  <p className="text-xs text-muted-foreground">Browse products</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
            ))
          )}
        </div>
      </div>
    );
  }, [shopByOpen, categories, loading.categories, navigate]);

  const handleSwitchPortal = (role: string, url: string) => {
    localStorage.setItem("activeRole", role);
    window.location.href = url;
  };

  const userRoles = Array.isArray(loggedInUser?.roles) ? loggedInUser.roles : [];
  const rolesList = userRoles.map((r: string) => r.toLowerCase());
  if (loggedInUser && !rolesList.includes("customer")) {
    rolesList.unshift("customer");
  }
  const availablePortals = rolesList
    .map((role: string) => {
      const match = PORTAL_LINKS[role];
      return match ? { ...match, role } : null;
    })
    .filter(Boolean);

  return (
    <nav className="bg-navy-dark text-white sticky top-0 z-50">
      {/* Row 1 */}
      <div className="border-b border-navy-light">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <Link to="/" className="text-2xl font-bold" onClick={closeAllPopovers}>
              <img src={logo} alt="logo" className="w-32 h-auto" />
            </Link>

            {/* Desktop Menu */}
            <div className="hidden lg:flex items-center space-x-5 text-[11px] xl:text-xs font-bold tracking-wider">
              <Link to="/" className="hover:text-accent transition">
                HOME
              </Link>
              <Link to="/categories" className="hover:text-accent transition">
                CATEGORY
              </Link>
              <Link to="/local-stores" className="hover:text-accent transition">
                LOCAL STORES
              </Link>
              <Link to="/services" className="hover:text-accent transition">
                SERVICES
              </Link>
              <Link to="/academy" className="hover:text-accent transition">
                ACADEMY
              </Link>
              <Link to="/travel" className="hover:text-accent transition">
                TRAVEL
              </Link>
              <Link to="/community" className="hover:text-accent transition">
                COMMUNITY
              </Link>

              {/* Earn With Us */}
              <div className="relative" ref={earnRef}>
                <Button
                  variant="ghost"
                  className="flex items-center gap-1 hover:text-accent hover:bg-transparent text-[11px] xl:text-xs font-bold p-0 h-auto"
                  onClick={() => setEarnDropdownOpen((v) => !v)}
                >
                  EARN WITH US <ChevronDown className="h-3.5 w-3.5" />
                </Button>

                {earnDropdownOpen && (
                  <div className="absolute top-full left-0 bg-white text-black rounded-xl border border-slate-100 shadow-xl mt-2 w-64 z-50 overflow-hidden text-xs py-1">
                    <Link
                      to="/earn-with-apexbee"
                      className="block px-4 py-2.5 font-extrabold text-accent hover:bg-slate-50 border-b border-slate-100"
                      onClick={() => setEarnDropdownOpen(false)}
                    >
                      🚀 OPPORTUNITIES MARKETPLACE
                    </Link>
                    <button
                      className="block w-full text-left px-4 py-2 hover:bg-slate-50 font-semibold"
                      onClick={() => handleOpenForm("Become a Vendor", "vendor")}
                    >
                      BECOME A VENDOR
                    </button>
                    <button
                      className="block w-full text-left px-4 py-2 hover:bg-slate-50 font-semibold"
                      onClick={() => handleOpenForm("Become a Franchiser", "franchiser")}
                    >
                      BECOME A FRANCHISER
                    </button>
                    <button
                      className="block w-full text-left px-4 py-2 hover:bg-slate-50 font-semibold"
                      onClick={() => handleOpenForm("Become a Freelancer", "freelancer")}
                    >
                      BECOME A FREELANCER
                    </button>
                    <button
                      className="block w-full text-left px-4 py-2 hover:bg-slate-50 font-semibold"
                      onClick={() => handleOpenForm("Become an Entrepreneur", "entrepreneur")}
                    >
                      BECOME AN ENTREPRENEUR
                    </button>
                  </div>
                )}
              </div>

              <Link to="/referrals" className="hover:text-accent transition">
                REFER & EARN
              </Link>
            </div>

            <FormModal
              open={modalOpen}
              onClose={() => setModalOpen(false)}
              title={modalTitle}
              endpoint={modalEndpoint}
            />

            {/* Right Section */}
            <div className="flex items-center space-x-3">
              {/* Location selector at top right corner */}
              <div
                className="flex items-center gap-1 cursor-pointer hover:text-accent text-xs bg-white/10 px-2 py-1 rounded border border-white/10"
                onClick={() => setOpenLocationModal(true)}
              >
                <MapPin className="h-3.5 w-3.5 text-accent shrink-0" />
                <span className="font-semibold truncate max-w-[120px]" title={locationLabel}>
                  {locationLabel}
                </span>
                <span className="text-[8px] text-accent">▼</span>
              </div>

              {/* Language Selector */}
              <div className="relative" ref={langRef}>
                <div
                  className="flex items-center gap-1 cursor-pointer hover:text-accent text-xs bg-white/10 px-2.5 py-1 rounded border border-white/10"
                  onClick={() => setLangOpen((v) => !v)}
                >
                  <span className="text-xs">🌐</span>
                  <span className="font-semibold text-xs leading-none">{languages[activeLang] || "English"}</span>
                  <span className="text-[8px] text-accent leading-none">▼</span>
                </div>
                {langOpen && (
                  <div className="absolute right-0 top-full mt-1 bg-white text-black rounded-xl shadow-xl border border-slate-100 py-1 w-28 z-50 text-[11px] font-bold">
                    {Object.entries(languages).map(([code, name]) => (
                      <button
                        key={code}
                        onClick={() => {
                          setActiveLang(code);
                          localStorage.setItem("user_language", code);
                          setLangOpen(false);
                        }}
                        className={`w-full text-left px-3 py-1.5 hover:bg-slate-50 transition-colors ${activeLang === code ? "text-accent" : "text-navy"}`}
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Wishlist Link with notification badge */}
              <Link to="/wishlist" className="hidden sm:flex items-center gap-1.5 hover:text-accent transition text-xs relative">
                <span>Wishlist</span>
                {wishlistCount > 0 && (
                  <span className="bg-red-500 text-white text-[9px] rounded-full w-4 h-4 flex items-center justify-center font-bold font-sans">
                    {wishlistCount}
                  </span>
                )}
              </Link>

              {loggedInUser && (
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1 h-7 flex items-center gap-1"
                  onClick={() => navigate("/referrals")}
                  title={`Wallet Available: ${formatMoney(walletAvailable)} (Hold: ${formatMoney(walletHold)})`}
                  disabled={loading.wallet}
                >
                  <Wallet className="h-3 w-3" />
                  {loading.wallet ? <span className="animate-pulse">...</span> : formatMoney(walletAvailable)}
                </Button>
              )}

              {/* Mobile Menu Toggle */}
              <button className="lg:hidden" onClick={() => setMobileMenuOpen((v) => !v)}>
                {mobileMenuOpen ? <X className="h-6 w-6 cursor-pointer" /> : <Menu className="h-6 w-6 cursor-pointer" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2 */}
      <div className="container mx-auto px-4 py-3 flex items-center gap-4">
        {/* ✅ Shop by Category dropdown */}
        <div className="relative" ref={shopByRef}>
          <Button
            variant="outline"
            className="text-foreground bg-white border-0 hover:bg-gray-50"
            onClick={() => setShopByOpen((v) => !v)}
          >
            <Menu className="h-4 w-4 mr-2" />
            Shop by Category
            <ChevronDown className="h-4 w-4 ml-2" />
          </Button>
          {categoryDropdown}
        </div>

        {/* Search */}
        <div className="flex-1 relative max-w-2xl" ref={searchRef}>
          <Input
            type="text"
            placeholder="Search groceries, restaurants, medicines, services..."
            className="w-full bg-white text-foreground pr-24 focus:ring-2 focus:ring-accent"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const q = searchQuery.trim();
                if (q) {
                  const updated = [q, ...recentSearches.filter((s) => s !== q)].slice(0, 5);
                  setRecentSearches(updated);
                  localStorage.setItem("recent_searches", JSON.stringify(updated));
                  setSearchFocused(false);
                  navigate(`/products?q=${encodeURIComponent(q)}`);
                }
              }
            }}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2.5">
            <button
              onClick={() => setShowVoiceModal(true)}
              className="text-muted-foreground hover:text-navy cursor-pointer bg-transparent border-none p-0 text-sm leading-none"
              title="Voice Search"
            >
              🎤
            </button>
            <button
              onClick={() => setShowBarcodeModal(true)}
              className="text-muted-foreground hover:text-navy cursor-pointer bg-transparent border-none p-0 text-sm leading-none"
              title="Barcode Scan"
            >
              📷
            </button>
            <Search
              className="h-4 w-4 text-muted-foreground cursor-pointer hover:text-navy transition-colors"
              onClick={() => {
                const q = searchQuery.trim();
                if (q) {
                  const updated = [q, ...recentSearches.filter((s) => s !== q)].slice(0, 5);
                  setRecentSearches(updated);
                  localStorage.setItem("recent_searches", JSON.stringify(updated));
                  setSearchFocused(false);
                  navigate(`/products?q=${encodeURIComponent(q)}`);
                }
              }}
            />
          </div>

          {searchFocused && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white text-black border border-slate-100 shadow-2xl rounded-2xl p-4 z-50 text-left">
              {recentSearches.length > 0 && (
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Recent Searches</p>
                    <button
                      className="text-[9px] text-red-500 hover:underline font-bold"
                      onClick={() => {
                        setRecentSearches([]);
                        localStorage.removeItem("recent_searches");
                      }}
                    >
                      Clear
                    </button>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {recentSearches.map((s) => (
                      <button
                        key={s}
                        onClick={() => {
                          setSearchQuery(s);
                          setSearchFocused(false);
                          navigate(`/products?q=${encodeURIComponent(s)}`);
                        }}
                        className="text-xs bg-slate-50 hover:bg-slate-100 text-slate-700 px-3 py-1.5 rounded-xl border border-slate-100 transition-colors"
                      >
                        🕒 {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="mb-4">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">🔥 Trending Searches</p>
                <div className="flex gap-2 flex-wrap">
                  {trendingSearches.map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        setSearchQuery(s);
                        setSearchFocused(false);
                        navigate(`/products?q=${encodeURIComponent(s)}`);
                      }}
                      className="text-xs bg-slate-50 hover:bg-slate-100 text-slate-700 px-3 py-1.5 rounded-xl border border-slate-100 transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">📍 Nearby Stores</p>
                <div className="space-y-1.5">
                  {nearbyStoresMock.map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        setSearchFocused(false);
                        navigate("/local-stores");
                      }}
                      className="w-full text-left text-xs text-navy font-semibold hover:bg-slate-50 p-2 rounded-lg transition-colors flex items-center gap-2"
                    >
                      🏪 {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Notifications (bell icon with popover next to search) */}
        <div className="relative">
          <Button
            variant="ghost"
            className="text-white hover:text-accent hover:bg-transparent relative p-2"
            onClick={() => setNotificationsOpen((v) => !v)}
            title="Notifications"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            )}
          </Button>

          {notificationsOpen && (
            <div className="absolute right-0 top-full mt-2 w-96 bg-white border border-slate-100 rounded-2xl shadow-premium z-50 text-navy p-4">
              <div className="flex items-center justify-between border-b pb-2 mb-2">
                <p className="font-extrabold text-sm text-navy">Notifications ({allNotifications.filter((n: any) => !n.isRead && n.status !== 'read').length})</p>
                <div className="flex items-center gap-2">
                  <button
                    className="text-[10px] text-accent font-black hover:underline border-none bg-transparent cursor-pointer"
                    onClick={() => {
                      setNotifications(prev => prev.map(n => ({ ...n, isRead: true, status: 'read' })));
                      setUnreadCount(0);
                    }}
                  >
                    Mark all read
                  </button>
                  <span className="text-slate-300">•</span>
                  <button
                    className="text-[10px] text-slate-500 font-bold hover:underline border-none bg-transparent cursor-pointer"
                    onClick={() => setNotificationsOpen(false)}
                  >
                    Close
                  </button>
                </div>
              </div>

              {/* Grouping Tabs */}
              <div className="flex gap-1 overflow-x-auto pb-1 mb-2 border-b scrollbar-none">
                {[
                  { key: "all", label: "All" },
                  { key: "orders", label: "Orders" },
                  { key: "offers", label: "Offers" },
                  { key: "wallet", label: "Wallet" },
                  { key: "franchise", label: "Network" }
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveNotificationTab(tab.key)}
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap border-none cursor-pointer ${activeNotificationTab === tab.key
                      ? "bg-navy text-white"
                      : "text-muted-foreground hover:bg-slate-100 bg-transparent"
                      }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="space-y-3.5 max-h-72 overflow-y-auto pr-1">
                {filteredNotifications.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <p className="text-xs">No notifications in this category.</p>
                  </div>
                ) : (
                  filteredNotifications.map((n: any) => {
                    const isUnread = !n.isRead && n.status !== 'read';
                    return (
                      <div key={n._id} className={`p-2 rounded-xl transition text-left flex gap-2 relative ${isUnread ? "bg-blue-50/40" : "opacity-75 hover:bg-slate-50"}`}>
                        <div className="flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider ${n.category === 'orders' ? 'bg-blue-100 text-blue-700' :
                              n.category === 'offers' ? 'bg-amber-100 text-amber-700' :
                                n.category === 'wallet' ? 'bg-green-100 text-green-700' :
                                  'bg-purple-100 text-purple-700'
                              }`}>
                              {n.category === 'franchise' ? 'Network' : n.category}
                            </span>
                            {isUnread && <span className="w-1.5 h-1.5 bg-accent rounded-full shrink-0" />}
                          </div>
                          <p className="font-extrabold text-navy text-xs mt-1.5 leading-tight">{n.title}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5 leading-normal">
                            {n.message}
                          </p>
                          <p className="text-[8px] text-slate-400 mt-1 font-bold">
                            {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        {isUnread && (
                          <button
                            onClick={() => handleMarkAsRead(n._id)}
                            className="text-[9px] text-accent font-black hover:underline shrink-0 align-self-start mt-1.5 border-none bg-transparent cursor-pointer"
                          >
                            Mark Read
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* ✅ Orders + Cart (Desktop) */}
        <div className="hidden lg:flex items-center gap-4">
          {loggedInUser ? (
            <>
              {/* Orders */}
              <Link to="/my-orders">
                <Button
                  variant="ghost"
                  className="text-white hover:text-accent hover:bg-transparent relative flex items-center gap-2"
                  disabled={loading.orders}
                >
                  <div className="border rounded p-1 relative">
                    <Package className="h-4 w-4" />
                    {badge(ordersCount, loading.orders)}
                  </div>
                  <span className="text-sm">My Orders</span>
                </Button>
              </Link>

              {/* Cart */}
              <Link to="/cart">
                <Button
                  variant="ghost"
                  className="text-white hover:text-accent hover:bg-transparent relative flex items-center gap-2"
                  disabled={loading.cart}
                >
                  <div className="border rounded p-1 relative">
                    <ShoppingBag className="h-4 w-4" />
                    {badge(cartItemsCount, loading.cart)}
                  </div>
                  Cart
                </Button>
              </Link>

              {/* Profile + Logout */}
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-end">
                  <Link to="/profile" className="text-sm hover:text-accent transition font-medium">
                    Hi, {loggedInUser.name || "User"}
                  </Link>

                  {/* ✅ show available + hold */}
                  <span className="text-xs text-green-400">
                    Wallet: {formatMoney(walletAvailable)}
                    {walletHold > 0 ? (
                      <span className="text-yellow-300"> • Hold: {formatMoney(walletHold)}</span>
                    ) : null}
                  </span>
                </div>

                {/* Portal Switcher Dropdown */}
                {availablePortals.length > 0 && (
                  <div className="relative" ref={portalRef}>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-white/20 bg-white/10 hover:bg-white/20 text-white text-xs px-2.5 py-1 h-7 flex items-center gap-1 font-bold"
                      onClick={() => setPortalDropdownOpen(!portalDropdownOpen)}
                    >
                      Switch Portal <ChevronDown className="h-3 w-3" />
                    </Button>
                    {portalDropdownOpen && (
                      <div className="absolute top-full right-0 bg-white text-black rounded-xl border border-slate-100 shadow-xl mt-2 w-48 z-50 overflow-hidden text-xs py-1 font-semibold">
                        {availablePortals.map((portal: any, idx: number) => (
                          <button
                            key={idx}
                            onClick={() => handleSwitchPortal(portal.role, portal.url)}
                            className="block w-full text-left px-4 py-2 hover:bg-slate-50 border-b last:border-0 border-slate-100 text-navy font-bold"
                          >
                            {portal.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <Button size="sm" onClick={handleLogout} className="bg-red-500 hover:bg-red-600 text-white px-3">
                  Logout
                </Button>
              </div>
            </>
          ) : (
            <Link to="/login">
              <Button variant="ghost" className="text-white hover:text-accent hover:bg-transparent flex items-center gap-2">
                <div className="border rounded p-1">
                  <User className="h-4 w-4" />
                </div>
                <span className="text-sm">Login / Signup</span>
              </Button>
            </Link>
          )}
        </div>

        {/* ✅ Mobile Icons (Cart + Orders + Login) */}
        <div className="flex lg:hidden items-center gap-3">
          {loggedInUser ? (
            <>
              <Link to="/my-orders" className="relative">
                <Package className="h-5 w-5" />
                {badge(ordersCount, loading.orders)}
              </Link>

              <Link to="/cart" className="relative">
                <ShoppingBag className="h-5 w-5" />
                {badge(cartItemsCount, loading.cart)}
              </Link>
            </>
          ) : (
            <Link to="/login">
              <User className="h-5 w-5" />
            </Link>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-navy-dark border-t border-navy-light text-xs font-semibold">
          <div className="container mx-auto px-4 py-4">
            <div className="space-y-4">
              <Link to="/" className="block py-2 hover:text-accent transition" onClick={() => setMobileMenuOpen(false)}>
                HOME
              </Link>
              <Link
                to="/categories"
                className="block py-2 hover:text-accent transition"
                onClick={() => setMobileMenuOpen(false)}
              >
                CATEGORY
              </Link>
              <Link
                to="/local-stores"
                className="block py-2 hover:text-accent transition"
                onClick={() => setMobileMenuOpen(false)}
              >
                LOCAL STORES
              </Link>
              <Link
                to="/services"
                className="block py-2 hover:text-accent transition"
                onClick={() => setMobileMenuOpen(false)}
              >
                SERVICES
              </Link>
              <Link
                to="/academy"
                className="block py-2 hover:text-accent transition"
                onClick={() => setMobileMenuOpen(false)}
              >
                ACADEMY
              </Link>
              <Link
                to="/travel"
                className="block py-2 hover:text-accent transition"
                onClick={() => setMobileMenuOpen(false)}
              >
                TRAVEL
              </Link>
              <Link
                to="/community"
                className="block py-2 hover:text-accent transition"
                onClick={() => setMobileMenuOpen(false)}
              >
                COMMUNITY
              </Link>

              {/* Mobile Earn dropdown */}
              <div>
                <button
                  className="flex items-center justify-between w-full py-2 hover:text-accent transition"
                  onClick={() => setMobileEarnOpen((v) => !v)}
                >
                  <span>EARN WITH US</span>
                  <ChevronRight className={`h-4 w-4 transition-transform ${mobileEarnOpen ? "rotate-90" : ""}`} />
                </button>

                {mobileEarnOpen && (
                  <div className="pl-4 space-y-2 mt-2 border-l border-navy-light text-slate-300">
                    <Link
                      to="/earn-with-apexbee"
                      className="block py-2 text-accent font-bold hover:text-accent transition"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      🚀 OPPORTUNITIES MARKETPLACE
                    </Link>
                    <button
                      className="block w-full text-left py-2 hover:text-accent transition"
                      onClick={() => handleOpenForm("Become a Vendor", "vendor")}
                    >
                      BECOME A VENDOR
                    </button>
                    <button
                      className="block w-full text-left py-2 hover:text-accent transition"
                      onClick={() => handleOpenForm("Become a Franchiser", "franchiser")}
                    >
                      BECOME A FRANCHISER
                    </button>
                    <button
                      className="block w-full text-left py-2 hover:text-accent transition"
                      onClick={() => handleOpenForm("Become a Freelancer", "freelancer")}
                    >
                      BECOME A FREELANCER
                    </button>
                    <button
                      className="block w-full text-left py-2 hover:text-accent transition"
                      onClick={() => handleOpenForm("Become an Entrepreneur", "entrepreneur")}
                    >
                      BECOME AN ENTREPRENEUR
                    </button>
                  </div>
                )}
              </div>

              <Link
                to="/referrals"
                className="block py-2 hover:text-accent transition"
                onClick={() => setMobileMenuOpen(false)}
              >
                REFER & EARN
              </Link>
              <Link
                to="/wishlist"
                className="block py-2 hover:text-accent transition"
                onClick={() => setMobileMenuOpen(false)}
              >
                WISHLIST
              </Link>
            </div>

            {/* User Section - Mobile */}
            <div className="mt-6 pt-6 border-t border-navy-light">
              {loggedInUser ? (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex flex-col">
                      <span className="font-medium">Hi, {loggedInUser.name || "User"}</span>
                      <span className="text-sm text-green-400">
                        Wallet: {formatMoney(walletAvailable)}
                        {walletHold > 0 ? (
                          <span className="text-yellow-300"> • Hold: {formatMoney(walletHold)}</span>
                        ) : null}
                      </span>
                    </div>
                    <Button size="sm" onClick={handleLogout} className="bg-red-500 hover:bg-red-600 text-white px-3">
                      Logout
                    </Button>
                  </div>

                  {availablePortals.length > 0 && (
                    <div className="mb-4 p-3 rounded-lg bg-white/5 border border-white/10">
                      <p className="text-[10px] text-white/50 mb-1 font-bold">PORTALS</p>
                      <div className="flex flex-wrap gap-2">
                        {availablePortals.map((portal: any, idx: number) => (
                          <button
                            key={idx}
                            onClick={() => handleSwitchPortal(portal.role, portal.url)}
                            className="inline-flex items-center justify-center px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded text-[11px] font-bold border border-white/5"
                          >
                            {portal.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    <Link
                      to="/profile"
                      className="flex items-center py-2 hover:text-accent transition"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <User className="h-4 w-4 mr-3" />
                      My Profile
                    </Link>

                    <Link
                      to="/my-orders"
                      className="flex items-center py-2 hover:text-accent transition"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Package className="h-4 w-4 mr-3" />
                      <span>My Orders</span>
                      {ordersCount > 0 && !loading.orders && (
                        <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
                          {ordersCount > 9 ? "9+" : ordersCount}
                        </span>
                      )}
                    </Link>

                    <Link
                      to="/cart"
                      className="flex items-center py-2 hover:text-accent transition"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <ShoppingBag className="h-4 w-4 mr-3" />
                      <span>My Cart</span>
                      {cartItemsCount > 0 && !loading.cart && (
                        <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
                          {cartItemsCount > 9 ? "9+" : cartItemsCount}
                        </span>
                      )}
                    </Link>
                  </div>
                </>
              ) : (
                <Link
                  to="/login"
                  className="flex items-center py-3 hover:text-accent transition"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <User className="h-5 w-5 mr-3" />
                  <span>Login / Signup</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Voice Search Modal */}
      {showVoiceModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-navy font-black text-lg">{voiceStatus}</h3>
            <div className="w-20 h-20 bg-accent/10 border border-accent/20 rounded-full flex items-center justify-center mx-auto animate-pulse">
              <span className="text-3xl animate-bounce">🎙️</span>
            </div>
            <p className="text-xs font-semibold text-slate-700">{voiceText}</p>
            <button
              onClick={() => setShowVoiceModal(false)}
              className="text-xs text-slate-500 font-bold bg-slate-100 hover:bg-slate-200 px-5 py-2 rounded-full cursor-pointer border-none"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Barcode Scan Modal */}
      {showBarcodeModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-navy font-black text-lg">Scan Product Barcode</h3>
            <div className="w-full h-48 bg-slate-100 border-2 border-dashed border-slate-300 rounded-2xl relative overflow-hidden flex items-center justify-center mx-auto">
              {cameraStream ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover rounded-xl"
                />
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <span className="text-4xl animate-pulse">📷</span>
                  <span className="text-[10px] text-muted-foreground">Camera loading/simulating...</span>
                </div>
              )}
              <div className="absolute left-0 right-0 h-0.5 bg-red-500 animate-bounce top-1/2 shadow-[0_0_8px_red]" />
            </div>
            <p className="text-xs font-semibold text-slate-700">{barcodeStatus}</p>
            <button
              onClick={() => setShowBarcodeModal(false)}
              className="text-xs text-slate-500 font-bold bg-slate-100 hover:bg-slate-200 px-5 py-2 rounded-full cursor-pointer border-none"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <LocationModal
        open={openLocationModal}
        onOpenChange={setOpenLocationModal}
        onConfirm={(loc) => {
          setUserLocation(loc);
          localStorage.setItem("user_location", JSON.stringify(loc));
          window.dispatchEvent(new Event("storage"));
        }}
      />
    </nav>
  );
};

export default Navbar;

