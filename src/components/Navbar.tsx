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

const API_BASE = "https://server.apexbee.in/api";
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

  const [portalDropdownOpen, setPortalDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const closeAllPopovers = useCallback(() => {
    setEarnDropdownOpen(false);
    setShopByOpen(false);
    setMobileEarnOpen(false);
    setPortalDropdownOpen(false);
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
        setUnreadCount(list.filter((n: any) => !n.isRead).length);
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
          prev.map(n => n._id === notifId ? { ...n, isRead: true } : n)
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
      setCartItemsCount(0);
      setOrdersCount(0);
      setWalletTotal(0);
      setWalletHold(0);
      setNotifications([]);
      setUnreadCount(0);
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

    // Load initial wishlist count
    const fetchWishlistCount = () => {
      try {
        const stored = localStorage.getItem("mock_wishlist");
        if (stored) {
          setWishlistCount(JSON.parse(stored).length);
        } else {
          setWishlistCount(2); // seed default count of 2
        }
      } catch {
        setWishlistCount(2);
      }
    };
    fetchWishlistCount();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === USER_KEY || e.key === TOKEN_KEY) fetchUserData();
      if (e.key === "user_location") {
        const nextLoc = localStorage.getItem("user_location");
        setUserLocation(nextLoc ? JSON.parse(nextLoc) : null);
      }
      if (e.key === "mock_wishlist") {
        fetchWishlistCount();
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
    };

    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeAllPopovers();
    };

    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onEsc);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onEsc);
    };
  }, [shopByOpen, earnDropdownOpen, portalDropdownOpen, closeAllPopovers]);

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
            <div className="flex items-center space-x-4">
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
        <div className="flex-1 relative max-w-2xl">
          <Input
            type="text"
            placeholder="Search for products, brands, or categories..."
            className="w-full bg-white text-foreground pr-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                navigate(`/products?q=${encodeURIComponent(searchQuery)}`);
              }
            }}
          />
          <Search
            className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground cursor-pointer hover:text-navy transition-colors"
            onClick={() => {
              if (searchQuery.trim()) {
                navigate(`/products?q=${encodeURIComponent(searchQuery)}`);
              }
            }}
          />
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
            <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 text-navy p-4">
              <div className="flex items-center justify-between border-b pb-2 mb-2">
                <p className="font-bold text-sm text-navy">Notifications ({unreadCount})</p>
                <button
                  className="text-xs text-accent font-bold hover:underline"
                  onClick={() => setNotificationsOpen(false)}
                >
                  Close
                </button>
              </div>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="text-center text-xs text-muted-foreground py-4">No notifications yet.</p>
                ) : (
                  notifications.map((n) => (
                    <div key={n._id} className="border-b last:border-0 pb-2 last:pb-0 text-left flex justify-between items-start gap-2">
                      <div className="flex-1">
                        <p className={`font-semibold text-xs text-navy leading-tight ${n.isRead ? "opacity-60" : ""}`}>{n.title}</p>
                        <p className={`text-[10px] text-muted-foreground mt-0.5 leading-normal ${n.isRead ? "opacity-60" : ""}`}>
                          {n.message}
                        </p>
                        <p className="text-[8px] text-muted-foreground mt-1 font-medium text-slate-500">
                          {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      {!n.isRead && (
                        <button
                          onClick={() => handleMarkAsRead(n._id)}
                          className="text-[9px] text-accent font-bold hover:underline shrink-0"
                        >
                          Mark read
                        </button>
                      )}
                    </div>
                  ))
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

