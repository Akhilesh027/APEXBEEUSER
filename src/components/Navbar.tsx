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
  Download,
  Heart,
  Store,
  Utensils,
  Sparkles,
  Zap,
  HelpCircle,
  Phone,
  FileText,
  LogOut,
  Globe,
  ExternalLink,
  ArrowRight,
  ShieldCheck,
  Compass,
  Briefcase,
  Gift,
  CheckCircle2,
  Mic,
  Camera,
  ScanLine,
  Clock,
  Flame,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useEffect, useMemo, useState, useCallback, useRef } from "react";
const logo = "/logo.png";
import FormModal from "./FormModal.tsx";
import LocationModal from "./LocationModal";

const API_BASE = import.meta.env.VITE_API_URL || "https://server.apexbee.in/api";
const TOKEN_KEY = "token";
const USER_KEY = "user";

const PORTAL_LINKS: Record<string, { label: string; url: string }> = {
  customer: { label: "Customer Portal", url: "/" },
  admin: { label: "Admin Panel", url: "http://localhost:5173" },
  vendor: { label: "Vendor Portal", url: "https://apexbeevendor.apexbee.in/" },
  wholesaler: { label: "Vendor Portal", url: "https://apexbeevendor.apexbee.in/" },
  manufacturer: { label: "Vendor Portal", url: "https://apexbeevendor.apexbee.in/" },
  franchise: { label: "Franchise Management", url: "https://franchser.apexbee.in/" },
  state_franchise: { label: "Franchise Management", url: "https://franchser.apexbee.in/" },
  district_franchise: { label: "Franchise Management", url: "https://franchser.apexbee.in/" },
  mandal_franchise: { label: "Franchise Management", url: "https://franchser.apexbee.in/" },
  food_partner: { label: "Food Partner Portal", url: "https://food.apexbee.in/" },
  food: { label: "Food Partner Portal", url: "https://food.apexbee.in/" },
  delivery_partner: { label: "Delivery Partner Portal", url: "https://delivery.apexbee.in/" },
  delivery: { label: "Delivery Partner Portal", url: "https://delivery.apexbee.in/" },
  service_provider: { label: "Service Provider Portal", url: "https://service.apexbee.in/login" },
  service: { label: "Service Provider Portal", url: "https://service.apexbee.in/login" },
  course_provider: { label: "Course Provider Portal", url: "http://localhost:5174" },
};

type CategoryItem = {
  _id: string;
  name: string;
  image?: string;
};

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [openLocationModal, setOpenLocationModal] = useState(false);
  const [userLocation, setUserLocation] = useState<any | null>(null);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [earnDropdownOpen, setEarnDropdownOpen] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalEndpoint, setModalEndpoint] = useState("");

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
  const notificationRef = useRef<HTMLDivElement | null>(null);

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

  // 📍 Location synchronization with localStorage and storage events
  useEffect(() => {
    const loadSavedLoc = () => {
      try {
        const stored =
          localStorage.getItem("user_location") ||
          localStorage.getItem("userLocation") ||
          localStorage.getItem("apexbee_user_location");
        if (stored) {
          setUserLocation(JSON.parse(stored));
        }
      } catch (e) {
        console.warn("Error parsing stored location", e);
      }
    };
    loadSavedLoc();
    window.addEventListener("storage", loadSavedLoc);
    window.addEventListener("user_location_updated", loadSavedLoc);
    return () => {
      window.removeEventListener("storage", loadSavedLoc);
      window.removeEventListener("user_location_updated", loadSavedLoc);
    };
  }, []);

  const locationDisplayLabel = useMemo(() => {
    if (!userLocation) return "Select Location";
    const colony = userLocation.colony || userLocation.mandal;
    const dist = userLocation.district || userLocation.state;
    const pin = userLocation.pincode ? ` - ${userLocation.pincode}` : "";
    if (colony) {
      return `${colony}${dist && dist !== colony ? `, ${dist}` : ""}${pin}`;
    }
    if (userLocation.address) {
      return userLocation.address.split(",")[0];
    }
    return "Select Location";
  }, [userLocation]);

  // 🔒 Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [mobileMenuOpen]);

  const closeAllPopovers = useCallback(() => {
    setEarnDropdownOpen(false);
    setShopByOpen(false);
    setMobileEarnOpen(false);
    setPortalDropdownOpen(false);
    setLangOpen(false);
    setNotificationsOpen(false);
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
      if (!userId || userId === "undefined" || !token) {
        setOrdersCount(0);
        return;
      }

      try {
        setLoading((p) => ({ ...p, orders: true }));
        const response = await fetch(`${API_BASE}/orders/${userId}/count?status=active`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          setOrdersCount(Number(data?.count) || 0);
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
    setNotifications(prev =>
      prev.map(n => n._id === notifId ? { ...n, isRead: true, status: 'read' } : n)
    );
    setUnreadCount(c => Math.max(0, c - 1));

    if (token) {
      try {
        await fetch(`${API_BASE}/notifications/${notifId}/read`, {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (err) {
        console.error("Error marking notification as read:", err);
      }
    }
  };

  const handleMarkAllRead = async () => {
    const { token } = getUserData();
    setNotifications(prev =>
      prev.map(n => ({ ...n, isRead: true, status: 'read' }))
    );
    setUnreadCount(0);

    if (token) {
      try {
        await fetch(`${API_BASE}/notifications/mark-all-read`, {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (err) {
        console.error("Error marking all notifications as read:", err);
      }
    }
  };

  const fetchUserData = useCallback(async () => {
    const { user, token } = getUserData();

    if (user && token) {
      setLoggedInUser(user);
      const targetUserId = user._id || user.id || user.masterCustomerId;
      await Promise.all([
        fetchCartItemsCount(targetUserId, token),
        fetchOrdersCount(targetUserId, token),
        fetchWalletBalance(token),
        fetchNotifications(targetUserId, token),
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
    const savedLoc = localStorage.getItem("user_location") || localStorage.getItem("userLocation") || localStorage.getItem("apexbee_user_location");
    if (savedLoc) {
      try {
        setUserLocation(JSON.parse(savedLoc));
      } catch {
        localStorage.removeItem("user_location");
        localStorage.removeItem("userLocation");
        localStorage.removeItem("apexbee_user_location");
        setUserLocation(null);
      }
    } else {
      // Auto-prompt user if no location is saved in user portal
      const timer = setTimeout(() => {
        setOpenLocationModal(true);
      }, 700);
      return () => clearTimeout(timer);
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
      if (e.key === "user_location" || e.key === "userLocation" || e.key === "apexbee_user_location") {
        const nextLoc = localStorage.getItem("user_location") || localStorage.getItem("userLocation") || localStorage.getItem("apexbee_user_location");
        setUserLocation(nextLoc ? JSON.parse(nextLoc) : null);
      }
      if (e.key === "wishlist_updated" || e.key === "local_wishlist" || e.key === "local_cart" || e.key === "cart_updated") {
        fetchWishlistCount();
        fetchUserData();
      }
    };

    const handleOpenLocModal = () => setOpenLocationModal(true);
    const handleNotificationEvent = () => {
      fetchUserData();
    };
    const handleUserLocationUpdated = () => {
      const nextLoc = localStorage.getItem("user_location") || localStorage.getItem("userLocation") || localStorage.getItem("apexbee_user_location");
      if (nextLoc) {
        try {
          setUserLocation(JSON.parse(nextLoc));
        } catch {
          setUserLocation(null);
        }
      } else {
        setUserLocation(null);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("open_location_modal", handleOpenLocModal);
    window.addEventListener("user_location_updated", handleUserLocationUpdated);
    window.addEventListener("refresh_notifications", handleNotificationEvent);
    window.addEventListener("notification_received", handleNotificationEvent);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("open_location_modal", handleOpenLocModal);
      window.removeEventListener("user_location_updated", handleUserLocationUpdated);
      window.removeEventListener("refresh_notifications", handleNotificationEvent);
      window.removeEventListener("notification_received", handleNotificationEvent);
    };
  }, [fetchUserData, fetchCategories]);

  const locationLabel = useMemo(() => {
    if (!userLocation) return "Set Location";
    const cleanStr = (s?: string) => (s && s !== "Unknown area" && s !== "Current Area" && s !== "undefined" ? s.trim() : "");
    const colony = cleanStr(userLocation.colony);
    const mandal = cleanStr(userLocation.mandal);
    const district = cleanStr(userLocation.district);
    const pin = userLocation.pincode ? String(userLocation.pincode).trim() : "";
    if (colony && pin) return `${colony}, ${pin}`;
    if (colony) return colony;
    if (mandal && pin) return `${mandal}, ${pin}`;
    if (mandal) return mandal;
    if (district && pin) return `${district} (${pin})`;
    if (district) return district;
    if (pin) return `PIN: ${pin}`;
    return "Location Set";
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

  const defaultSystemNotifications = useMemo(() => [
    {
      _id: "sys-notif-1",
      title: "Welcome to ApexBee Marketplace! 🛍️",
      message: "Enjoy 15-minute hyper-local delivery from verified neighborhood stores and local restaurants.",
      category: "orders",
      link: "/products",
      isRead: false,
      status: "unread",
      createdAt: new Date().toISOString()
    },
    {
      _id: "sys-notif-2",
      title: "Special Cashback Offer ⚡",
      message: "Use code APEXEXPRESS at checkout to unlock instant discounts and bonus wallet cashback.",
      category: "offers",
      link: "/products",
      isRead: false,
      status: "unread",
      createdAt: new Date(Date.now() - 3600000).toISOString()
    },
    {
      _id: "sys-notif-3",
      title: "ApexBee Business Partner Program 🚀",
      message: "Refer genuine customers and business opportunities to earn multi-tier referral incentives.",
      category: "franchise",
      link: "/referrals",
      isRead: false,
      status: "unread",
      createdAt: new Date(Date.now() - 86400000).toISOString()
    },
    {
      _id: "sys-notif-4",
      title: "Digital Wallet & Instant Refunds 💰",
      message: "Your ApexBee digital wallet is active and secured for lightning-fast 1-click checkout.",
      category: "wallet",
      link: "/referrals",
      isRead: true,
      status: "read",
      createdAt: new Date(Date.now() - 172800000).toISOString()
    }
  ], []);

  const allNotifications = useMemo(() => {
    if (notifications && notifications.length > 0) {
      return notifications.map((n: any) => {
        let category = n.category || "orders";
        const msg = (n.message || "").toLowerCase();
        if (msg.includes("wallet") || msg.includes("cashback") || msg.includes("bonus") || msg.includes("commission") || msg.includes("rupee") || msg.includes("payout")) category = "wallet";
        else if (msg.includes("offer") || msg.includes("discount") || msg.includes("coupon") || msg.includes("deal") || msg.includes("sale")) category = "offers";
        else if (msg.includes("business") || msg.includes("partner") || msg.includes("shop") || msg.includes("merchant")) category = "business";
        else if (msg.includes("franchise") || msg.includes("mandal") || msg.includes("district")) category = "franchise";
        return { ...n, category };
      });
    }
    return defaultSystemNotifications;
  }, [notifications, defaultSystemNotifications]);

  const filteredNotifications = useMemo(() => {
    if (activeNotificationTab === "all") return allNotifications;
    return allNotifications.filter((n: any) => n.category === activeNotificationTab);
  }, [allNotifications, activeNotificationTab]);

  // Keep unread count updated from allNotifications if no DB notifications
  useEffect(() => {
    if (!notifications || notifications.length === 0) {
      setUnreadCount(defaultSystemNotifications.filter(n => !n.isRead).length);
    }
  }, [notifications, defaultSystemNotifications]);

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
  }, [shopByOpen, earnDropdownOpen, portalDropdownOpen, langOpen, searchFocused, notificationsOpen, closeAllPopovers]);

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
      <div className="absolute top-full left-0 mt-2 w-[calc(100vw-2rem)] sm:w-[320px] max-w-[320px] rounded-xl border bg-white text-black shadow-lg z-50 overflow-hidden">
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
                  if (c.experienceType === 'coming_soon_lead_capture' && c.experienceRoute) {
                    navigate(c.experienceRoute);
                  } else {
                    navigate(`/category/${encodeURIComponent(c.name)}`);
                  }
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

  // Determine if user has any business partner / merchant / franchise / partner roles
  const rawRoles = Array.isArray(loggedInUser?.roles)
    ? loggedInUser.roles
    : (loggedInUser?.role ? [loggedInUser.role] : []);
  const rolesList = rawRoles.map((r: string) => String(r).toLowerCase().trim());

  const businessPartnerRoles = [
    "vendor",
    "wholesaler",
    "manufacturer",
    "franchise",
    "franchiser",
    "state_franchise",
    "district_franchise",
    "mandal_franchise",
    "entrepreneur",
    "food_partner",
    "food",
    "delivery_partner",
    "delivery",
    "service_provider",
    "service",
    "course_provider",
    "academy",
    "business_partner",
    "partner",
    "admin"
  ];

  const hasBusinessPartnerRole = rolesList.some((role: string) => businessPartnerRoles.includes(role));

  // Only assemble portals if the user has a business/partner role. Customers should NOT see Switch Portal.
  const availablePortals = useMemo(() => {
    if (!loggedInUser || !hasBusinessPartnerRole) return [];

    const effectiveRoles = [...rolesList];
    if (!effectiveRoles.includes("customer")) {
      effectiveRoles.unshift("customer");
    }

    const seenUrls = new Set<string>();
    const list: Array<{ label: string; url: string; role: string }> = [];

    for (const role of effectiveRoles) {
      const match = PORTAL_LINKS[role];
      if (match && !seenUrls.has(match.url)) {
        seenUrls.add(match.url);
        list.push({ ...match, role });
      }
    }

    return list;
  }, [loggedInUser, rolesList, hasBusinessPartnerRole]);

  return (
    <nav className="bg-[#0A1128] text-white sticky top-0 z-[60] shadow-md shrink-0 w-full font-sans">
      {/* ========================================================
          📱 MOBILE TOP BAR (Row 1 on Mobile: Logo + Location + Icons)
          ======================================================== */}
      <div className="lg:hidden border-b border-white/10 bg-[#0A1128]">
        <div className="px-3 sm:px-4 flex items-center justify-between h-14 gap-2">
          {/* Brand Logo */}
          <Link to="/" className="shrink-0 flex items-center" onClick={closeAllPopovers}>
            <img src={logo} alt="ApexBee" className="w-28 sm:w-32 h-auto object-contain" />
          </Link>

          {/* Right Action Cluster */}
          <div className="flex items-center space-x-1.5 sm:space-x-2">
            {/* Notification Bell */}
            <div className="relative flex items-center">
              <button
                type="button"
                aria-label="Notifications"
                className="relative cursor-pointer hover:text-amber-400 flex items-center bg-transparent border-none p-1.5 text-white transition-colors"
                onClick={() => setNotificationsOpen(true)}
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] rounded-full w-4 h-4 flex items-center justify-center font-bold font-sans animate-pulse">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
            </div>

            {/* Cart Icon */}
            <Link to="/cart" className="relative cursor-pointer hover:text-accent flex items-center p-1.5">
              <ShoppingBag className="h-5 w-5 text-white" />
              {cartItemsCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-[#F3BA12] text-[#0A1128] text-[9px] rounded-full w-4 h-4 flex items-center justify-center font-black font-sans shadow-sm">
                  {cartItemsCount}
                </span>
              )}
            </Link>

            {/* Mobile Drawer Trigger */}
            <button
              type="button"
              aria-label="Toggle Menu"
              className="p-1.5 text-white hover:text-amber-400 cursor-pointer bg-transparent border-none focus:outline-none transition-transform"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================
          📱 MOBILE SEARCH BAR & HORIZONTAL CATEGORY ACTION STRIP (Row 2)
          ======================================================== */}
      <div className="lg:hidden px-3 pt-2 pb-2 bg-[#0A1128] space-y-2 border-b border-white/5">
        {/* Mobile Search Input */}
        <div className="relative" ref={searchRef}>
          <div className="relative flex items-center bg-white rounded-xl shadow-xs px-3 py-1.5 focus-within:ring-2 focus-within:ring-amber-400 transition-all">
            <Search className="h-4 w-4 text-slate-400 mr-2 shrink-0" />
            <Input
              type="text"
              placeholder="Search 15-min groceries, food, stores..."
              className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-0 text-xs font-semibold text-slate-800 placeholder:text-slate-400 h-auto bg-transparent flex-1 shadow-none"
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
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="text-slate-400 hover:text-slate-600 mr-1.5 p-0.5 rounded-full border-none bg-transparent cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
            <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
              <button
                type="button"
                onClick={() => setShowVoiceModal(true)}
                className="p-1 rounded-lg text-amber-600 hover:bg-amber-50 cursor-pointer bg-transparent border-none transition-colors"
                title="Voice Search"
                aria-label="Voice Search"
              >
                <Mic className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setShowBarcodeModal(true)}
                className="p-1 rounded-lg text-indigo-600 hover:bg-indigo-50 cursor-pointer bg-transparent border-none transition-colors"
                title="Barcode / Visual Scan"
                aria-label="Barcode / Visual Scan"
              >
                <Camera className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Autocomplete / Suggestions Popover on Mobile */}
          {searchFocused && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white text-black border border-slate-100 shadow-2xl rounded-2xl p-3.5 z-50 text-left animate-in fade-in zoom-in-95 duration-150">
              {recentSearches.length > 0 && (
                <div className="mb-3">
                  <div className="flex justify-between items-center mb-1.5">
                    <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                      <Clock className="h-3 w-3 text-slate-400" />
                      Recent Searches
                    </p>
                    <button
                      className="text-[9px] text-rose-500 hover:underline font-bold border-none bg-transparent cursor-pointer"
                      onClick={() => {
                        setRecentSearches([]);
                        localStorage.removeItem("recent_searches");
                      }}
                    >
                      Clear
                    </button>
                  </div>
                  <div className="flex gap-1.5 flex-wrap">
                    {recentSearches.map((s) => (
                      <button
                        key={s}
                        onClick={() => {
                          setSearchQuery(s);
                          setSearchFocused(false);
                          navigate(`/products?q=${encodeURIComponent(s)}`);
                        }}
                        className="text-[11px] bg-slate-50 hover:bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-100 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Clock className="h-2.5 w-2.5 text-slate-400" />
                        <span>{s}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="mb-3">
                <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
                  <Flame className="h-3 w-3 text-amber-500" />
                  Trending Searches
                </p>
                <div className="flex gap-1.5 flex-wrap">
                  {trendingSearches.map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        setSearchQuery(s);
                        setSearchFocused(false);
                        navigate(`/products?q=${encodeURIComponent(s)}`);
                      }}
                      className="text-[11px] bg-amber-50/70 hover:bg-amber-100/70 text-amber-900 px-2.5 py-1 rounded-lg border border-amber-200/60 transition-colors flex items-center gap-1 cursor-pointer font-medium"
                    >
                      <Sparkles className="h-2.5 w-2.5 text-amber-500" />
                      <span>{s}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
                  <Store className="h-3 w-3 text-slate-400" />
                  Nearby Stores
                </p>
                <div className="space-y-1">
                  {nearbyStoresMock.map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        setSearchFocused(false);
                        navigate("/local-stores");
                      }}
                      className="w-full text-left text-[11px] text-navy font-semibold hover:bg-slate-50 p-1.5 rounded-lg transition-colors flex items-center gap-2 border-none bg-transparent cursor-pointer"
                    >
                      <Store className="h-3.5 w-3.5 text-emerald-600" />
                      <span>{s}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Horizontal Quick-Action Category Action Strip */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
          <Link
            to="/products"
            className="bg-gradient-to-r from-amber-500/20 to-yellow-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-300 px-2.5 py-1 rounded-full text-[10px] font-black whitespace-nowrap flex items-center gap-1 shrink-0 transition-all"
          >
            ⚡ Deals
          </Link>
          <Link
            to="/grocery"
            className="bg-white/10 hover:bg-white/20 border border-white/10 text-white px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap flex items-center gap-1 shrink-0 transition-all"
          >
            🥦 Grocery
          </Link>
          <Link
            to="/food"
            className="bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 px-2.5 py-1 rounded-full text-[10px] font-black whitespace-nowrap flex items-center gap-1 shrink-0 shadow-sm transition-all"
          >
            🍔 Food & Dining <span className="text-[8px] bg-slate-950 text-amber-400 px-1 rounded">HOT</span>
          </Link>
          <Link
            to="/fashion"
            className="bg-white/10 hover:bg-white/20 border border-white/10 text-white px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap flex items-center gap-1 shrink-0 transition-all"
          >
            👗 Fashion
          </Link>
          <Link
            to="/local-stores"
            className="bg-white/10 hover:bg-white/20 border border-white/10 text-white px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap flex items-center gap-1 shrink-0 transition-all"
          >
            🏪 Stores
          </Link>
          <Link
            to="/services"
            className="bg-white/10 hover:bg-white/20 border border-white/10 text-white px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap flex items-center gap-1 shrink-0 transition-all"
          >
            🛠️ Services
          </Link>
          <Link
            to="/academy"
            className="bg-white/10 hover:bg-white/20 border border-white/10 text-white px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap flex items-center gap-1 shrink-0 transition-all"
          >
            🎓 Academy
          </Link>
          <Link
            to="/earn-with-apexbee"
            className="bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/40 text-emerald-300 px-2.5 py-1 rounded-full text-[10px] font-black whitespace-nowrap flex items-center gap-1 shrink-0 transition-all"
          >
            💰 Earn Money
          </Link>
        </div>
      </div>

      {/* ========================================================
          💻 DESKTOP TOP HEADER (Row 1 for Desktop >= lg)
          ======================================================== */}
      <div className="hidden lg:block border-b border-white/10">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-14 shrink-0 flex-nowrap">
            {/* Logo */}
            <Link to="/" className="text-2xl font-bold shrink-0 flex items-center" onClick={closeAllPopovers}>
              <img src={logo} alt="ApexBee" className="w-32 h-auto object-contain" />
            </Link>

            {/* Desktop Navigation Links */}
            <div className="flex items-center space-x-4 xl:space-x-5 text-[11px] xl:text-xs font-extrabold tracking-wider whitespace-nowrap shrink-0">
              <Link to="/" className="hover:text-amber-400 transition">
                HOME
              </Link>
              <Link to="/categories" className="hover:text-amber-400 transition">
                CATEGORY
              </Link>
              <Link to="/food" className="hover:text-amber-400 text-amber-400 font-extrabold transition flex items-center space-x-1">
                <span>FOOD & DINING</span>
                <span className="px-1.5 py-0.2 bg-amber-500 text-slate-950 text-[9px] rounded font-black">HOT</span>
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
              <Link to="/community" className="hover:text-accent transition">
                COMMUNITY
              </Link>

              {/* Earn With Us Dropdown */}
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
                      className="block w-full text-left px-4 py-2 hover:bg-slate-50 font-semibold cursor-pointer border-none bg-transparent"
                      onClick={() => handleOpenForm("Become a Vendor", "vendor")}
                    >
                      BECOME A VENDOR
                    </button>
                    <button
                      className="block w-full text-left px-4 py-2 hover:bg-slate-50 font-semibold cursor-pointer border-none bg-transparent"
                      onClick={() => handleOpenForm("Become a Franchiser", "franchiser")}
                    >
                      BECOME A FRANCHISER
                    </button>
                    <button
                      className="block w-full text-left px-4 py-2 hover:bg-slate-50 font-semibold cursor-pointer border-none bg-transparent"
                      onClick={() => handleOpenForm("Become a Freelancer", "freelancer")}
                    >
                      BECOME A FREELANCER
                    </button>
                    <button
                      className="block w-full text-left px-4 py-2 hover:bg-slate-50 font-semibold cursor-pointer border-none bg-transparent"
                      onClick={() => handleOpenForm("Become an Entrepreneur", "entrepreneur")}
                    >
                      BECOME AN ENTREPRENEUR
                    </button>
                  </div>
                )}
              </div>

              <Link to="/referrals" className="hover:text-accent transition text-amber-400 font-extrabold">
                REFER & EARN
              </Link>
            </div>

            {/* Desktop Right Cluster */}
            <div className="flex items-center space-x-3">

              {/* Notification icon */}
              <div className="relative flex items-center" ref={notificationRef}>
                <button
                  type="button"
                  aria-label="Notifications"
                  className="relative cursor-pointer hover:text-amber-400 flex items-center bg-transparent border-none p-1 text-white transition-colors"
                  onClick={() => setNotificationsOpen((v) => !v)}
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] rounded-full w-4 h-4 flex items-center justify-center font-bold font-sans animate-pulse">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>
              </div>

              {/* Cart Icon */}
              <Link to="/cart" className="relative cursor-pointer hover:text-accent flex items-center">
                <ShoppingBag className="h-5 w-5 text-white" />
                {cartItemsCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-[#F3BA12] text-[#0A1128] text-[9px] rounded-full w-4 h-4 flex items-center justify-center font-black font-sans">
                    {cartItemsCount}
                  </span>
                )}
              </Link>

              {/* Wishlist Link */}
              <Link to="/wishlist" className="flex items-center gap-1.5 hover:text-accent transition text-xs relative">
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
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          💻 DESKTOP ROW 2 (Shop by Category + Search Bar + User Controls)
          ======================================================== */}
      <div className="hidden lg:flex container mx-auto px-4 py-3 items-center gap-4">
        {/* Shop by Category dropdown */}
        <div className="relative" ref={shopByRef}>
          <Button
            variant="outline"
            className="text-foreground bg-white border-0 hover:bg-gray-50 px-2 sm:px-4"
            onClick={() => setShopByOpen((v) => !v)}
          >
            <Menu className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Shop by Category</span>
            <ChevronDown className="h-4 w-4 ml-1 sm:ml-2" />
          </Button>
          {categoryDropdown}
        </div>

        {/* Desktop Search Bar */}
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
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="text-slate-400 hover:text-slate-600 mr-1 p-1 rounded-full border-none bg-transparent cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowVoiceModal(true)}
              className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 cursor-pointer bg-transparent border-none transition-colors"
              title="Voice Search"
              aria-label="Voice Search"
            >
              <Mic className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setShowBarcodeModal(true)}
              className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 cursor-pointer bg-transparent border-none transition-colors"
              title="Barcode / Visual Scan"
              aria-label="Barcode / Visual Scan"
            >
              <Camera className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="p-1.5 rounded-lg bg-navy text-amber-400 hover:bg-navy/90 cursor-pointer transition-colors border-none"
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
              title="Search"
              aria-label="Search"
            >
              <Search className="h-4 w-4" />
            </button>
          </div>

          {searchFocused && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white text-black border border-slate-100 shadow-2xl rounded-2xl p-4 z-50 text-left">
              {recentSearches.length > 0 && (
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      Recent Searches
                    </p>
                    <button
                      className="text-[9px] text-rose-500 hover:underline font-bold border-none bg-transparent cursor-pointer"
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
                        className="text-xs bg-slate-50 hover:bg-slate-100 text-slate-700 px-3 py-1.5 rounded-xl border border-slate-100 transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <Clock className="h-3 w-3 text-slate-400" />
                        <span>{s}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="mb-4">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1">
                  <Flame className="h-3.5 w-3.5 text-amber-500" />
                  Trending Searches
                </p>
                <div className="flex gap-2 flex-wrap">
                  {trendingSearches.map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        setSearchQuery(s);
                        setSearchFocused(false);
                        navigate(`/products?q=${encodeURIComponent(s)}`);
                      }}
                      className="text-xs bg-amber-50/70 hover:bg-amber-100/70 text-amber-900 px-3 py-1.5 rounded-xl border border-amber-200/60 transition-colors flex items-center gap-1.5 cursor-pointer font-semibold"
                    >
                      <Sparkles className="h-3 w-3 text-amber-500" />
                      <span>{s}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1">
                  <Store className="h-3.5 w-3.5 text-slate-400" />
                  Nearby Stores
                </p>
                <div className="space-y-1.5">
                  {nearbyStoresMock.map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        setSearchFocused(false);
                        navigate("/local-stores");
                      }}
                      className="w-full text-left text-xs text-navy font-semibold hover:bg-slate-50 p-2 rounded-lg transition-colors flex items-center gap-2 border-none bg-transparent cursor-pointer"
                    >
                      <Store className="h-4 w-4 text-emerald-600" />
                      <span>{s}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Orders + Cart + User (Desktop) */}
        <div className="flex items-center gap-4">
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
      </div>

      {/* ========================================================
          🚀 SLIDE-OVER MOBILE DRAWER (Modern Slide-Out Menu)
          ======================================================== */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[100] lg:hidden flex justify-end">
          {/* Backdrop Blur Overlay */}
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in cursor-pointer"
          />

          {/* Slide-out Drawer Panel */}
          <div className="relative z-[101] w-[86vw] max-w-sm h-full bg-gradient-to-b from-[#0A1128] via-[#0E1738] to-[#0A1128] text-white shadow-2xl flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-300 border-l border-white/10">
            {/* Drawer Top Bar & Profile Header */}
            <div className="p-4 border-b border-white/10 bg-white/5 shrink-0">
              <div className="flex items-center justify-between mb-4">
                <Link to="/" onClick={() => setMobileMenuOpen(false)} className="flex items-center">
                  <img src={logo} alt="ApexBee" className="w-24 h-auto object-contain" />
                </Link>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors border-none cursor-pointer"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* User Profile / Guest Card */}
              {loggedInUser ? (
                <div className="flex items-center justify-between bg-white/5 rounded-2xl p-3 border border-white/10">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-amber-400 via-yellow-400 to-amber-500 text-slate-950 font-black text-lg flex items-center justify-center shrink-0 shadow-md ring-2 ring-amber-400/40">
                      {loggedInUser.name ? loggedInUser.name.charAt(0).toUpperCase() : "U"}
                    </div>
                    <div className="min-w-0">
                      <p className="font-extrabold text-sm text-white truncate">
                        {loggedInUser.name || "Customer"}
                      </p>
                      <p className="text-[10px] text-slate-300 truncate">
                        {loggedInUser.phone || loggedInUser.email || "Active Member"}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-400/20">
                          Wallet: {formatMoney(walletAvailable)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Link
                    to="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-[10px] font-black text-amber-400 hover:underline shrink-0 bg-white/10 px-2 py-1 rounded-lg"
                  >
                    Profile ➔
                  </Link>
                </div>
              ) : (
                <div className="bg-gradient-to-r from-amber-500/20 via-yellow-500/10 to-transparent p-3.5 rounded-2xl border border-amber-400/20">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Sparkles className="h-4 w-4 text-amber-400 animate-pulse" />
                    <p className="font-extrabold text-xs text-white">Welcome to ApexBee!</p>
                  </div>
                  <p className="text-[11px] text-slate-300 mb-3">
                    Sign in to get 15-min delivery, track orders & earn wallet rewards.
                  </p>
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block w-full bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-black text-center py-2 rounded-xl text-xs shadow-md transition-transform active:scale-95"
                  >
                    Login / Sign Up ➔
                  </Link>
                </div>
              )}

              {/* 4-Action Quick Action Grid */}
              <div className="grid grid-cols-4 gap-2 mt-3 pt-3 border-t border-white/10">
                <Link
                  to="/my-orders"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex flex-col items-center justify-center p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-colors relative"
                >
                  <Package className="h-4 w-4 text-amber-400 mb-1" />
                  <span className="text-[9px] font-bold text-slate-200">Orders</span>
                  {ordersCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-black rounded-full w-3.5 h-3.5 flex items-center justify-center">
                      {ordersCount}
                    </span>
                  )}
                </Link>
                <Link
                  to="/cart"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex flex-col items-center justify-center p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-colors relative"
                >
                  <ShoppingBag className="h-4 w-4 text-emerald-400 mb-1" />
                  <span className="text-[9px] font-bold text-slate-200">Cart</span>
                  {cartItemsCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-amber-400 text-slate-950 text-[8px] font-black rounded-full w-3.5 h-3.5 flex items-center justify-center">
                      {cartItemsCount}
                    </span>
                  )}
                </Link>
                <Link
                  to="/wishlist"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex flex-col items-center justify-center p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-colors relative"
                >
                  <Heart className="h-4 w-4 text-rose-400 mb-1" />
                  <span className="text-[9px] font-bold text-slate-200">Wishlist</span>
                  {wishlistCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[8px] font-black rounded-full w-3.5 h-3.5 flex items-center justify-center">
                      {wishlistCount}
                    </span>
                  )}
                </Link>
                <Link
                  to="/referrals"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex flex-col items-center justify-center p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-colors"
                >
                  <Wallet className="h-4 w-4 text-cyan-400 mb-1" />
                  <span className="text-[9px] font-bold text-slate-200">Wallet</span>
                </Link>
              </div>
            </div>

            {/* Scrollable Navigation Menu Sections */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 text-xs font-semibold scrollbar-none">
              {/* Section 1: Marketplace & Shopping */}
              <div>
                <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 mb-2 px-1">
                  🛍️ Marketplace & Services
                </p>
                <div className="space-y-1">
                  <Link
                    to="/"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-white/5 text-slate-200 hover:text-white transition-colors"
                  >
                    <span>🏠 Home</span>
                    <ChevronRight className="h-3.5 w-3.5 text-slate-500" />
                  </Link>
                  <Link
                    to="/categories"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-white/5 text-slate-200 hover:text-white transition-colors"
                  >
                    <span>🗂️ All Categories</span>
                    <ChevronRight className="h-3.5 w-3.5 text-slate-500" />
                  </Link>
                  <Link
                    to="/food"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between px-3 py-2 rounded-xl bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 font-bold transition-colors border border-amber-400/20"
                  >
                    <span className="flex items-center gap-1.5">
                      🍔 Food & Dining
                      <span className="px-1.5 py-0.2 bg-amber-500 text-slate-950 text-[8px] rounded font-black">HOT</span>
                    </span>
                    <ChevronRight className="h-3.5 w-3.5 text-amber-400" />
                  </Link>
                  <Link
                    to="/grocery"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-white/5 text-slate-200 hover:text-white transition-colors"
                  >
                    <span>🥦 Groceries & Daily Needs</span>
                    <ChevronRight className="h-3.5 w-3.5 text-slate-500" />
                  </Link>
                  <Link
                    to="/fashion"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-white/5 text-slate-200 hover:text-white transition-colors"
                  >
                    <span>👗 Fashion & Sarees</span>
                    <ChevronRight className="h-3.5 w-3.5 text-slate-500" />
                  </Link>
                  <Link
                    to="/local-stores"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-white/5 text-slate-200 hover:text-white transition-colors"
                  >
                    <span>🏪 Local Neighborhood Stores</span>
                    <ChevronRight className="h-3.5 w-3.5 text-slate-500" />
                  </Link>
                  <Link
                    to="/services"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-white/5 text-slate-200 hover:text-white transition-colors"
                  >
                    <span>🛠️ Doorstep Home Services</span>
                    <ChevronRight className="h-3.5 w-3.5 text-slate-500" />
                  </Link>
                  <Link
                    to="/academy"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-white/5 text-slate-200 hover:text-white transition-colors"
                  >
                    <span>🎓 ApexBee Academy</span>
                    <ChevronRight className="h-3.5 w-3.5 text-slate-500" />
                  </Link>
                  <Link
                    to="/community"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-white/5 text-slate-200 hover:text-white transition-colors"
                  >
                    <span>👥 Community & Network</span>
                    <ChevronRight className="h-3.5 w-3.5 text-slate-500" />
                  </Link>
                </div>
              </div>

              {/* Section 2: Partner & Earn Programs */}
              <div>
                <p className="text-[9px] font-black uppercase tracking-wider text-amber-400 mb-2 px-1">
                  💰 Earn With ApexBee
                </p>
                <div className="space-y-1 bg-white/5 p-2.5 rounded-2xl border border-white/5">
                  <Link
                    to="/earn-with-apexbee"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-amber-300 font-extrabold hover:bg-white/5 transition-colors"
                  >
                    <span>🚀 Opportunities Marketplace</span>
                    <ChevronRight className="h-3.5 w-3.5 text-amber-400" />
                  </Link>
                  <Link
                    to="/referrals"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-white font-bold hover:bg-white/5 transition-colors"
                  >
                    <span className="flex items-center gap-1.5">
                      🤝 Refer & Earn Rewards
                      <span className="px-1.5 py-0.2 bg-emerald-500 text-white text-[8px] rounded font-black">BONUS</span>
                    </span>
                    <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleOpenForm("Become a Vendor", "vendor")}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 text-left border-none bg-transparent cursor-pointer"
                  >
                    <span>🏬 Become a Vendor</span>
                    <ChevronRight className="h-3.5 w-3.5 text-slate-500" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenForm("Become a Franchiser", "franchiser")}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 text-left border-none bg-transparent cursor-pointer"
                  >
                    <span>🏢 Become a Franchiser</span>
                    <ChevronRight className="h-3.5 w-3.5 text-slate-500" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenForm("Become a Freelancer", "freelancer")}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 text-left border-none bg-transparent cursor-pointer"
                  >
                    <span>💼 Become a Freelancer</span>
                    <ChevronRight className="h-3.5 w-3.5 text-slate-500" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenForm("Become an Entrepreneur", "entrepreneur")}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 text-left border-none bg-transparent cursor-pointer"
                  >
                    <span>💡 Become an Entrepreneur</span>
                    <ChevronRight className="h-3.5 w-3.5 text-slate-500" />
                  </button>
                </div>
              </div>

              {/* Section 3: Partner Portals Switcher (Conditional) */}
              {availablePortals.length > 0 && (
                <div>
                  <p className="text-[9px] font-black uppercase tracking-wider text-cyan-400 mb-2 px-1">
                    🏢 Partner Portals
                  </p>
                  <div className="grid grid-cols-2 gap-1.5 bg-white/5 p-2 rounded-2xl border border-white/5">
                    {availablePortals.map((portal: any, idx: number) => (
                      <button
                        key={idx}
                        onClick={() => handleSwitchPortal(portal.role, portal.url)}
                        className="px-2.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold text-left border-none cursor-pointer transition-colors truncate"
                      >
                        {portal.label} ➔
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Section 4: Language Selector */}
              <div>
                <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 mb-2 px-1">
                  🌐 Language
                </p>
                <div className="flex items-center gap-1.5 bg-white/5 p-1.5 rounded-xl border border-white/5">
                  {Object.entries(languages).map(([code, name]) => (
                    <button
                      key={code}
                      onClick={() => {
                        setActiveLang(code);
                        localStorage.setItem("user_language", code);
                      }}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all border-none cursor-pointer ${activeLang === code
                        ? "bg-amber-400 text-slate-950 shadow-sm"
                        : "text-slate-300 hover:text-white bg-transparent"
                        }`}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Section 5: Support & Policies */}
              <div>
                <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 mb-2 px-1">
                  📞 Help & Policies
                </p>
                <div className="space-y-1 text-slate-300">
                  <Link
                    to="/help"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-white/5 hover:text-white transition-colors"
                  >
                    <span>❓ 24x7 Help Center & FAQs</span>
                    <ChevronRight className="h-3.5 w-3.5 text-slate-500" />
                  </Link>
                  <Link
                    to="/contact"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-white/5 hover:text-white transition-colors"
                  >
                    <span>📞 Contact Us</span>
                    <ChevronRight className="h-3.5 w-3.5 text-slate-500" />
                  </Link>
                  <Link
                    to="/privacy-policy"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-white/5 hover:text-white transition-colors"
                  >
                    <span>🔒 Privacy & Return Policy</span>
                    <ChevronRight className="h-3.5 w-3.5 text-slate-500" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-white/10 bg-white/5 shrink-0 space-y-2.5">
              {loggedInUser && (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  Log Out
                </button>
              )}
              <div className="text-center">
                <p className="text-[10px] text-slate-400">
                  ApexBee v2.4 • Hyperlocal Fast Delivery
                </p>
              </div>
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

      {/* 🔔 Universal Notification Modal */}
      {notificationsOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[150] flex items-start sm:items-center justify-center p-3 sm:p-4 pt-16 sm:pt-4 animate-in fade-in duration-200 cursor-pointer"
          onClick={() => setNotificationsOpen(false)}
        >
          <div
            className="bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 rounded-3xl shadow-2xl w-full max-w-md max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 cursor-default"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-stone-800 bg-slate-50/70 dark:bg-stone-900 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-600 flex items-center justify-center font-bold text-base">
                  🔔
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-navy dark:text-white">
                    Notifications
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {allNotifications.filter((n: any) => !n.isRead && n.status !== "read").length} unread updates
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    className="text-[11px] text-amber-600 dark:text-amber-400 hover:underline font-bold border-none bg-transparent cursor-pointer"
                    onClick={handleMarkAllRead}
                  >
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => setNotificationsOpen(false)}
                  className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-stone-800 text-slate-500 border-none bg-transparent cursor-pointer transition"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex gap-1.5 overflow-x-auto p-3 border-b border-slate-100 dark:border-stone-800 scrollbar-none bg-white dark:bg-stone-900">
              {[
                { key: "all", label: "All" },
                { key: "orders", label: "📦 Orders" },
                { key: "offers", label: "🏷️ Offers" },
                { key: "wallet", label: "💰 Wallet" },
                { key: "franchise", label: "👥 Network" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveNotificationTab(tab.key)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all whitespace-nowrap border-none cursor-pointer ${activeNotificationTab === tab.key
                    ? "bg-navy text-white shadow-xs dark:bg-amber-400 dark:text-slate-950"
                    : "text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-stone-800 hover:bg-slate-200"
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Notifications List */}
            <div className="p-3 sm:p-4 space-y-2.5 overflow-y-auto flex-1 max-h-[60vh]">
              {filteredNotifications.length === 0 ? (
                <div className="text-center py-12 text-slate-400 space-y-2">
                  <span className="text-3xl block">📭</span>
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-300">No notifications in this category</p>
                  <p className="text-[11px]">We'll notify you when orders or new updates arrive!</p>
                </div>
              ) : (
                filteredNotifications.map((n: any) => {
                  const isUnread = !n.isRead && n.status !== "read";
                  const targetLink = n.deepLink || n.link || (n.category === 'orders' ? '/my-orders' : n.category === 'wallet' ? '/referrals' : '');
                  return (
                    <div
                      key={n._id}
                      onClick={() => {
                        if (isUnread) handleMarkAsRead(n._id);
                        if (targetLink) {
                          navigate(targetLink);
                          setNotificationsOpen(false);
                        }
                      }}
                      className={`p-3.5 rounded-2xl transition-all text-left flex gap-3 cursor-pointer border ${isUnread
                        ? "bg-amber-50/60 dark:bg-amber-950/20 border-amber-200/80 dark:border-amber-900/50 hover:bg-amber-100/60 shadow-2xs"
                        : "bg-slate-50/70 dark:bg-stone-800/40 border-slate-100 dark:border-stone-800 hover:bg-slate-100/80"
                        }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider ${n.category === "orders"
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                              : n.category === "offers"
                                ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                                : n.category === "wallet"
                                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                  : "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300"
                              }`}
                          >
                            {n.category === "franchise" ? "Network" : n.category}
                          </span>
                          {isUnread && (
                            <span className="w-2 h-2 bg-amber-500 rounded-full shrink-0 animate-pulse" />
                          )}
                          <span className="text-[9px] text-slate-400 font-mono ml-auto">
                            {new Date(n.createdAt).toLocaleDateString([], {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <h4 className="font-bold text-navy dark:text-white text-xs leading-snug">
                          {n.title}
                        </h4>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                          {n.message}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
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

      <FormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalTitle}
        endpoint={modalEndpoint}
      />
    </nav>
  );
};

export default Navbar;

