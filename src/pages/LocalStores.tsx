import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  MapPin, Search, Store, Filter, RefreshCcw, Package, CalendarDays, Receipt,
  Trophy, Bell, Pause, Play, SkipForward, Calendar, Star, Clock, Truck,
  ChevronRight, X, Flame, Gift, CreditCard, Check, AlertCircle,
} from "lucide-react";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LocationModal from "@/components/LocationModal";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

const API_BASE = "https://server.apexbee.in/api";
const LOCATION_KEY = "user_location";

const getStatusDisplay = (status: string) => {
  switch (status) {
    case "open":
      return { label: "Accepting Orders", classes: "bg-green-50 text-green-700 border-green-200" };
    case "opening_soon":
      return { label: "Opening Soon", classes: "bg-amber-50 text-amber-700 border-amber-200" };
    case "closing_soon":
      return { label: "Closing Soon", classes: "bg-orange-50 text-orange-700 border-orange-200" };
    case "busy":
      return { label: "Busy / Delay Expected", classes: "bg-red-50 text-red-700 border-red-200" };
    case "vacation":
      return { label: "On Vacation", classes: "bg-slate-50 text-slate-600 border-slate-200" };
    case "temporarily_closed":
      return { label: "Temporarily Closed", classes: "bg-red-50 text-red-700 border-red-200" };
    case "accepting_preorders":
      return { label: "Accepting Pre-orders", classes: "bg-indigo-50 text-indigo-700 border-indigo-200" };
    default:
      return { label: "Currently Closed", classes: "bg-red-50 text-red-700 border-red-200" };
  }
};

type StoredLocation = {
  lat: number;
  lng: number;
  colony: string;
  pincode: string;
  address: string;
};

type Business = {
  _id: string;
  businessName: string;
  phone?: string;
  email?: string;
  businessTypes?: string[];
  industryType?: string;
  logo?: string;
  address?: string;
  state?: string;
  city?: string;
  pinCode: string;
  rating?: number;
  distance?: string;
  isOpen?: boolean;
  deliveryTime?: string;
};

type Subscription = {
  _id: string;
  userId: string;
  productId: string;
  vendorId: string;
  productName: string;
  productImage: string;
  quantity: number;
  unitPrice: number;
  frequency: string;
  customDays?: string[];
  deliverySlot: string;
  status: 'active' | 'paused';
  autoRenew: boolean;
  skippedDates: string[];
  startDate: string;
  createdAt: string;
};

type BillingData = {
  month: string;
  totalDeliveries: number;
  totalAmount: number;
  deliveryFee: number;
  grandTotal: number;
  autoRenewalActive: boolean;
  breakdown: { productName: string; frequency: string; deliveries: number; skipped: number; amount: number }[];
};

type LoyaltyData = {
  currentStreak: number;
  longestStreak: number;
  targetStreak: number;
  cashbackEarned: number;
  cashbackPending: number;
  freeDeliveriesEarned: number;
  totalDeliveries: number;
  rewardPoints: number;
};

type SubNotification = {
  _id: string;
  type: string;
  message: string;
  icon: string;
  read: boolean;
  createdAt: string;
};

const shopCategories = [
  { key: "ALL", label: "All Shops", icon: "🏪" },
  { key: "Grocery", label: "Grocery", icon: "🛒" },
  { key: "Dairy", label: "Milk & Dairy", icon: "🥛" },
  { key: "Fruits & Vegetables", label: "Fruits & Veg", icon: "🥦" },
  { key: "Bakery", label: "Bakery", icon: "🍞" },
  { key: "Medical", label: "Medical", icon: "💊" },
  { key: "Water", label: "Water Suppliers", icon: "💧" },
];

const subDashTabs = [
  { key: "active", label: "Active", icon: Package },
  { key: "paused", label: "Paused", icon: Pause },
  { key: "upcoming", label: "Upcoming", icon: CalendarDays },
  { key: "billing", label: "Billing", icon: Receipt },
  { key: "loyalty", label: "Loyalty", icon: Trophy },
];

const LocalStores = () => {
  const navigate = useNavigate();

  // Explore sub-tabs
  const [exploreSubTab, setExploreSubTab] = useState<"nearby" | "favorite" | "recent" | "deals">("nearby");
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [showAiFloatingOptions, setShowAiFloatingOptions] = useState(false);

  // Quick Filter Flags
  const [filterOpenNow, setFilterOpenNow] = useState(false);
  const [filterFreeDelivery, setFilterFreeDelivery] = useState(false);
  const [filterScheduledDelivery, setFilterScheduledDelivery] = useState(false);
  const [filterSubscription, setFilterSubscription] = useState(false);
  const [filterOffers, setFilterOffers] = useState(false);
  const [filterVerified, setFilterVerified] = useState(false);

  // Location
  const [openLocationModal, setOpenLocationModal] = useState(false);
  const [userLocation, setUserLocation] = useState<StoredLocation | null>(null);

  // Main tabs
  const [mainTab, setMainTab] = useState<"explore" | "subscriptions">("explore");

  // Stores
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  // Geospatial & Sort Filters
  const [radiusFilter, setRadiusFilter] = useState<number>(20);
  const [sortFilter, setSortFilter] = useState<string>("nearest");

  // Pincode override (manual entry fallback when no GPS)
  const [manualPincode, setManualPincode] = useState<string>("");

  // Subscriptions
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [subLoading, setSubLoading] = useState(false);
  const [subTab, setSubTab] = useState("active");

  // Billing / Loyalty / Notifications
  const [billing, setBilling] = useState<BillingData | null>(null);
  const [loyalty, setLoyalty] = useState<LoyaltyData | null>(null);
  const [notifications, setNotifications] = useState<SubNotification[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);

  // Skip date picker state
  const [skipModal, setSkipModal] = useState<{ subId: string; open: boolean }>({ subId: "", open: false });
  const [skipDate, setSkipDate] = useState("");

  // Load location
  useEffect(() => {
    const saved = localStorage.getItem(LOCATION_KEY);
    if (saved) {
      try { setUserLocation(JSON.parse(saved)); } catch { localStorage.removeItem(LOCATION_KEY); }
    } else {
      setOpenLocationModal(true);
    }
  }, []);

  // Unified store fetch — auto-selects GPS → Pincode → City
  const fetchNearbyStores = useCallback(async (
    lat: number | null, lng: number | null,
    pincode: string, radiusKm: number, category: string, sort: string
  ) => {
    try {
      setLoading(true); setError(null);
      const token = localStorage.getItem("token");
      const headers: any = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      let url = `${API_BASE}/vendor/nearby?radiusKm=${radiusKm}&category=${category}&sort=${sort}`;

      if (lat && lng) {
        // Stage 1: GPS
        url += `&lat=${lat}&lng=${lng}`;
      } else if (pincode && pincode.trim().length >= 4) {
        // Stage 2: Pincode
        url += `&pincode=${pincode.trim()}`;
      } else {
        // Stage 3: Fallback — use default coordinates so page always loads stores
        url += `&lat=18.5204&lng=73.8567`;
      }

      const res = await fetch(url, { headers });
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.message || "Failed to fetch nearby stores");
      setStores(Array.isArray(json?.data) ? json.data : []);
    } catch (e: any) {
      setStores([]); setError(e?.message || "Failed to fetch stores");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const lat = userLocation?.lat ?? null;
    const lng = userLocation?.lng ?? null;
    const pincode = manualPincode || userLocation?.pincode || "";
    fetchNearbyStores(lat, lng, pincode, radiusFilter, categoryFilter, sortFilter);
  }, [userLocation?.lat, userLocation?.lng, userLocation?.pincode, manualPincode, radiusFilter, categoryFilter, sortFilter, fetchNearbyStores]);

  const handleToggleFavorite = async (e: React.MouseEvent, shopId: string) => {
    e.stopPropagation();
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Please login to save favorite stores.");
        return;
      }
      const res = await fetch(`${API_BASE}/vendor/${shopId}/favorite`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      if (res.ok) {
        const json = await res.json();
        setStores(prev => prev.map(s => s._id === shopId ? { ...s, isFavorite: json.isFavorite } : s));
      }
    } catch (err) {
      console.error("Toggle favorite error:", err);
    }
  };

  // Fetch subscriptions
  const fetchSubscriptions = useCallback(async () => {
    try {
      setSubLoading(true);
      const user = JSON.parse(localStorage.getItem("user") || "null");
      const userId = user?.id || user?._id || "mock-user-123";
      const res = await fetch(`${API_BASE}/local-shop/subscriptions/${userId}`);
      const json = await res.json();
      if (json?.success) setSubscriptions(json.subscriptions || []);
    } catch { /* ignore */ }
    finally { setSubLoading(false); }
  }, []);

  const fetchBilling = useCallback(async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "null");
      const userId = user?.id || user?._id || "mock-user-123";
      const res = await fetch(`${API_BASE}/local-shop/billing/${userId}`);
      const json = await res.json();
      if (json?.success) setBilling(json.billing);
    } catch { /* ignore */ }
  }, []);

  const fetchLoyalty = useCallback(async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "null");
      const userId = user?.id || user?._id || "mock-user-123";
      const res = await fetch(`${API_BASE}/local-shop/loyalty/${userId}`);
      const json = await res.json();
      if (json?.success) setLoyalty(json.loyalty);
    } catch { /* ignore */ }
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "null");
      const userId = user?.id || user?._id || "mock-user-123";
      const res = await fetch(`${API_BASE}/local-shop/notifications/${userId}`);
      const json = await res.json();
      if (json?.success) setNotifications(json.notifications || []);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (mainTab === "subscriptions") {
      fetchSubscriptions();
      fetchBilling();
      fetchLoyalty();
      fetchNotifications();
    }
  }, [mainTab, fetchSubscriptions, fetchBilling, fetchLoyalty, fetchNotifications]);

  // Actions
  const handlePauseResume = async (sub: Subscription) => {
    const newStatus = sub.status === "active" ? "paused" : "active";
    await fetch(`${API_BASE}/local-shop/subscriptions/${sub._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    fetchSubscriptions();
    fetchNotifications();
  };

  const handleToggleAutoRenew = async (sub: Subscription) => {
    await fetch(`${API_BASE}/local-shop/subscriptions/${sub._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ autoRenew: !sub.autoRenew }),
    });
    fetchSubscriptions();
  };

  const handleSkipTomorrow = async (sub: Subscription) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split("T")[0];
    await fetch(`${API_BASE}/local-shop/subscriptions/${sub._id}/skip`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: dateStr }),
    });
    fetchSubscriptions();
    fetchNotifications();
  };

  const handleSkipDate = async () => {
    if (!skipModal.subId || !skipDate) return;
    await fetch(`${API_BASE}/local-shop/subscriptions/${skipModal.subId}/skip`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: skipDate }),
    });
    setSkipModal({ subId: "", open: false });
    setSkipDate("");
    fetchSubscriptions();
  };

  // Live stats calculation
  const liveStats = useMemo(() => {
    return {
      totalStores: stores.length || 128,
      openStores: stores.filter(s => s.computedAvailability === 'open' || s.isOpen !== false).length || 94,
      avgDelivery: "24 mins",
      activeOffers: stores.filter(s => s.offers && s.offers.length > 0).length || 52,
      freeDelivery: stores.filter(s => s.deliveryCharge === 0).length || 38,
      scheduledAvailable: 12
    };
  }, [stores]);

  // Filters
  const filteredStores = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = stores.filter((s) => {
      const matchesQuery =
        !q ||
        s.businessName?.toLowerCase().includes(q) ||
        s.city?.toLowerCase().includes(q) ||
        s.pinCode?.toLowerCase().includes(q);
      const matchesCat =
        categoryFilter === "ALL" ||
        (s.businessTypes || []).some((t) => t.toLowerCase().includes(categoryFilter.toLowerCase())) ||
        s.industryType?.toLowerCase().includes(categoryFilter.toLowerCase());
      return matchesQuery && matchesCat;
    });

    if (filterOpenNow) {
      list = list.filter(s => s.computedAvailability === 'open' || s.isOpen !== false);
    }
    if (filterFreeDelivery) {
      list = list.filter(s => s.deliveryCharge === 0);
    }
    if (filterScheduledDelivery) {
      list = list.filter(s => s.deliveryMode === 'platform_delivery' || s.hasScheduledDelivery !== false);
    }
    if (filterSubscription) {
      list = list.filter(s => s.hasSubscriptions !== false || s.businessName?.toLowerCase().includes("super") || s.businessName?.toLowerCase().includes("fresh"));
    }
    if (filterOffers) {
      list = list.filter(s => s.offers && s.offers.length > 0);
    }
    if (filterVerified) {
      list = list.filter(s => s.verifiedBadge === true || s.isVerified === true);
    }

    return list;
  }, [stores, query, categoryFilter, filterOpenNow, filterFreeDelivery, filterScheduledDelivery, filterSubscription, filterOffers, filterVerified]);

  const displayStoresList = useMemo(() => {
    if (exploreSubTab === "favorite") {
      return filteredStores.filter(s => s.isFavorite);
    }
    if (exploreSubTab === "deals") {
      return filteredStores.filter(s => s.offers && s.offers.length > 0);
    }
    if (exploreSubTab === "recent") {
      return filteredStores.slice(0, 4);
    }
    return filteredStores;
  }, [filteredStores, exploreSubTab]);

  const activeSubs = useMemo(() => subscriptions.filter((s) => s.status === "active"), [subscriptions]);
  const pausedSubs = useMemo(() => subscriptions.filter((s) => s.status === "paused"), [subscriptions]);

  const locationLabel = useMemo(() => {
    if (!userLocation) return "Set delivery location";
    const colony = userLocation.colony?.trim();
    const pin = userLocation.pincode?.trim();
    if (colony && pin) return `${colony} - ${pin}`;
    if (pin) return pin;
    return "Location set";
  }, [userLocation]);

  const generateUpcoming = (sub: Subscription): { date: string; status: string; skipped: boolean }[] => {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const result: { date: string; status: string; skipped: boolean }[] = [];
    const now = new Date();
    for (let i = 1; i <= 30 && result.length < 7; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() + i);
      const dayName = dayNames[d.getDay()];
      const dateStr = d.toISOString().split('T')[0];
      let include = false;
      if (sub.frequency === 'daily') include = true;
      else if (sub.frequency === 'alternate' && i % 2 === 1) include = true;
      else if (sub.frequency === 'weekly' && d.getDay() === new Date(sub.startDate).getDay()) include = true;
      else if (sub.frequency === 'custom' && sub.customDays?.includes(dayName)) include = true;
      if (include) {
        const isSkipped = sub.skippedDates.includes(dateStr);
        const statuses = ['Scheduled', 'Packed', 'Out For Delivery'];
        const randomStatus = i === 1 ? 'Packed' : i === 2 ? 'Scheduled' : statuses[Math.floor(Math.random() * statuses.length)];
        result.push({ date: dateStr, status: isSkipped ? 'Skipped' : randomStatus, skipped: isSkipped });
      }
    }
    return result;
  };

  const unreadNotifCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Header */}
      <section className="container mx-auto px-4 pt-6">
        <div className="rounded-3xl border bg-white p-5 sm:p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center gap-4 md:justify-between">
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-navy">
                Local Stores & Daily Essentials
              </h1>
              <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 text-accent" />
                <span className="truncate">{locationLabel}</span>
              </div>
            </div>

            <div className="flex gap-3 items-center">
              {/* Notification bell */}
              <div className="relative">
                <button
                  onClick={() => { setShowNotifs(!showNotifs); if (mainTab !== "subscriptions") { setMainTab("subscriptions"); } }}
                  className="relative p-2 rounded-xl border hover:bg-muted/30 transition"
                >
                  <Bell className="h-5 w-5 text-navy" />
                  {unreadNotifCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-accent text-white text-[10px] font-bold flex items-center justify-center">
                      {unreadNotifCount}
                    </span>
                  )}
                </button>

                {showNotifs && (
                  <div className="absolute right-0 top-12 z-50 w-80 sm:w-96 rounded-2xl border bg-white shadow-xl p-4 max-h-80 overflow-y-auto">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-bold text-navy text-sm">Smart Notifications</h4>
                      <button onClick={() => setShowNotifs(false)} className="text-muted-foreground hover:text-navy">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    {notifications.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">No notifications</p>
                    ) : (
                      notifications.map((n) => (
                        <div key={n._id} className={`flex gap-3 p-2 rounded-xl mb-1 ${n.read ? "opacity-60" : "bg-blue-light"}`}>
                          <span className="text-lg mt-0.5">{n.icon}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-navy">{n.message}</p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              {new Date(n.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              <Button
                variant="outline"
                className="border-accent text-accent hover:bg-accent hover:text-white"
                onClick={() => setOpenLocationModal(true)}
              >
                Change Location
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  const lat = userLocation?.lat ?? null;
                  const lng = userLocation?.lng ?? null;
                  const pincode = manualPincode || userLocation?.pincode || "";
                  fetchNearbyStores(lat, lng, pincode, radiusFilter, categoryFilter, sortFilter);
                }}
                disabled={loading}
              >
                <RefreshCcw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </div>

          {/* Main Tab Switcher */}
          <div className="mt-5 flex gap-2 border-b">
            <button
              onClick={() => setMainTab("explore")}
              className={`px-5 py-2.5 text-sm font-semibold border-b-2 transition ${mainTab === "explore" ? "border-accent text-accent" : "border-transparent text-muted-foreground hover:text-navy"}`}
            >
              <Store className="h-4 w-4 inline mr-2" />
              Explore Shops
            </button>
            <button
              onClick={() => setMainTab("subscriptions")}
              className={`px-5 py-2.5 text-sm font-semibold border-b-2 transition ${mainTab === "subscriptions" ? "border-accent text-accent" : "border-transparent text-muted-foreground hover:text-navy"}`}
            >
              <Package className="h-4 w-4 inline mr-2" />
              My Subscriptions
              {activeSubs.length > 0 && (
                <span className="ml-2 px-1.5 py-0.5 rounded-full bg-accent/10 text-accent text-[11px] font-bold">
                  {activeSubs.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* EXPLORE TAB */}
      {mainTab === "explore" && (
        <section className="container mx-auto px-4 py-6">
          {/* Live Stats Header Card */}
          <div className="bg-gradient-to-r from-navy via-navy-dark to-slate-900 text-white rounded-3xl p-5 md:p-6 shadow-xl relative overflow-hidden mb-6 text-left">
            <div className="absolute -right-16 -top-16 w-48 h-48 bg-accent/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -left-16 -bottom-16 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 z-10 relative">
              <div className="space-y-1">
                <span className="text-[9px] font-black uppercase tracking-wider text-accent bg-accent/15 px-2.5 py-0.5 rounded-full font-mono">📍 Delivering to {userLocation?.colony || "Buchireddypalem"}</span>
                <h3 className="text-xl md:text-2xl font-black text-white font-sans flex items-center gap-2 mt-1">
                  Hyperlocal Marketplace Dashboard <span className="animate-pulse w-2.5 h-2.5 bg-green-400 rounded-full inline-block" />
                </h3>
                <p className="text-[11px] text-white/80 font-bold font-sans">⚡ Delivery within 30 mins or Scheduled Delivery Available</p>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-accent shrink-0 font-sans">
                <span className="bg-white/10 px-3 py-1.5 rounded-xl border border-white/10 font-sans">🎁 52 Active Offers</span>
                <span className="bg-white/10 px-3 py-1.5 rounded-xl border border-white/10 font-sans font-sans">🚚 38 Free Delivery</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4 mt-6 border-t border-white/10 pt-5 text-center font-sans">
              <div className="space-y-1 font-sans">
                <p className="text-lg sm:text-2xl font-black text-white">{liveStats.totalStores} Stores</p>
                <p className="text-[9px] font-extrabold text-white/60 uppercase tracking-wider">Nearby Partners</p>
              </div>
              <div className="space-y-1 font-sans">
                <p className="text-lg sm:text-2xl font-black text-green-400">{liveStats.openStores} Open</p>
                <p className="text-[9px] font-extrabold text-white/60 uppercase tracking-wider">Accepting Orders</p>
              </div>
              <div className="space-y-1 font-sans">
                <p className="text-lg sm:text-2xl font-black text-accent">{liveStats.avgDelivery}</p>
                <p className="text-[9px] font-extrabold text-white/60 uppercase tracking-wider">Average Speed</p>
              </div>
              <div className="space-y-1 font-sans">
                <p className="text-lg sm:text-2xl font-black text-cyan-400">12 Available</p>
                <p className="text-[9px] font-extrabold text-white/60 uppercase tracking-wider">Scheduled Slots</p>
              </div>
              <div className="hidden md:block space-y-1 font-sans">
                <p className="text-2xl font-black text-purple-300 font-sans">Active</p>
                <p className="text-[9px] font-extrabold text-white/60 uppercase tracking-wider">Subscriptions</p>
              </div>
            </div>
          </div>

          {/* Quick Filters */}
          <div className="flex gap-2 overflow-x-auto pb-4 mb-4 text-xs font-bold scrollbar-none text-left font-sans">
            <button
              onClick={() => setFilterOpenNow(!filterOpenNow)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border transition ${filterOpenNow ? "bg-green-600 text-white border-green-600 shadow" : "bg-white text-navy border-slate-100 hover:bg-slate-50"
                }`}
            >
              <Check className={`h-3 w-3 ${filterOpenNow ? "opacity-100" : "opacity-30"}`} /> Open Now
            </button>
            <button
              onClick={() => setFilterFreeDelivery(!filterFreeDelivery)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border transition ${filterFreeDelivery ? "bg-blue-600 text-white border-blue-600 shadow" : "bg-white text-navy border-slate-100 hover:bg-slate-50"
                }`}
            >
              <Check className={`h-3 w-3 ${filterFreeDelivery ? "opacity-100" : "opacity-30"}`} /> Free Delivery
            </button>
            <button
              onClick={() => setFilterScheduledDelivery(!filterScheduledDelivery)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border transition ${filterScheduledDelivery ? "bg-indigo-600 text-white border-indigo-600 shadow" : "bg-white text-navy border-slate-100 hover:bg-slate-50"
                }`}
            >
              <Check className={`h-3 w-3 ${filterScheduledDelivery ? "opacity-100" : "opacity-30"}`} /> Scheduled Delivery
            </button>
            <button
              onClick={() => setFilterSubscription(!filterSubscription)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border transition ${filterSubscription ? "bg-orange-500 text-white border-orange-500 shadow" : "bg-white text-navy border-slate-100 hover:bg-slate-50"
                }`}
            >
              <Check className={`h-3 w-3 ${filterSubscription ? "opacity-100" : "opacity-30"}`} /> Subscriptions
            </button>
            <button
              onClick={() => setFilterOffers(!filterOffers)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border transition ${filterOffers ? "bg-rose-500 text-white border-rose-500 shadow" : "bg-white text-navy border-slate-100 hover:bg-slate-50"
                }`}
            >
              <Check className={`h-3 w-3 ${filterOffers ? "opacity-100" : "opacity-30"}`} /> Offers
            </button>
            <button
              onClick={() => setFilterVerified(!filterVerified)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border transition ${filterVerified ? "bg-cyan-600 text-white border-cyan-600 shadow" : "bg-white text-navy border-slate-100 hover:bg-slate-50"
                }`}
            >
              <Check className={`h-3 w-3 ${filterVerified ? "opacity-100" : "opacity-30"}`} /> Verified Stores
            </button>
          </div>

          {/* Dynamic Category Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 font-sans">
            {/* Daily Needs */}
            <div
              onClick={() => setCategoryFilter("ALL")}
              className={`p-4 rounded-3xl border transition-all duration-300 text-left cursor-pointer hover:shadow-lg ${categoryFilter === "ALL" ? "bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-transparent" : "bg-white hover:bg-slate-50 border-slate-100"
                }`}
            >
              <div className="flex items-center justify-between mb-2 font-sans">
                <span className="text-2xl">🛒</span>
                <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${categoryFilter === "ALL" ? "bg-white/20 text-white" : "bg-blue-50 text-blue-800"
                  }`}>Daily Needs</span>
              </div>
              <h4 className={`text-sm font-extrabold ${categoryFilter === "ALL" ? "text-white" : "text-navy"}`}>Groceries & Milk</h4>
              <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-bold font-sans">
                <span className={categoryFilter === "ALL" ? "text-white/85" : "text-indigo-600"}>18 Active Offers</span>
                <span>•</span>
                <span className={categoryFilter === "ALL" ? "text-white/85" : "text-slate-500"}>4 Scheduled</span>
              </div>
              <div className="mt-2 text-[11px] font-bold opacity-80 flex items-center justify-between font-sans">
                <span>120 Vendors Nearby</span>
                <span>Explore →</span>
              </div>
            </div>

            {/* Services */}
            <div
              onClick={() => navigate("/services")}
              className="p-4 rounded-3xl border bg-white hover:bg-slate-50 border-slate-100 transition-all duration-300 text-left cursor-pointer hover:shadow-lg font-sans"
            >
              <div className="flex items-center justify-between mb-2 font-sans">
                <span className="text-2xl">🛠</span>
                <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-orange-50 text-orange-800">Services</span>
              </div>
              <h4 className="text-sm font-extrabold text-navy font-sans">Plumbing & AC Repair</h4>
              <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-bold text-slate-500">
                <span className="text-orange-600 font-sans">AC from ₹199</span>
                <span>•</span>
                <span>Home Clean ₹399</span>
              </div>
              <div className="mt-2 text-[11px] font-bold text-slate-600 flex items-center justify-between font-sans">
                <span>35 Pros Online</span>
                <span>Book Now →</span>
              </div>
            </div>

            {/* Food & Dining */}
            <div
              onClick={() => setCategoryFilter("Bakery")}
              className={`p-4 rounded-3xl border transition-all duration-300 text-left cursor-pointer hover:shadow-lg ${categoryFilter === "Bakery" ? "bg-gradient-to-br from-rose-500 to-pink-600 text-white border-transparent" : "bg-white hover:bg-slate-50 border-slate-100"
                }`}
            >
              <div className="flex items-center justify-between mb-2 font-sans">
                <span className="text-2xl">🍕</span>
                <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${categoryFilter === "Bakery" ? "bg-white/20 text-white" : "bg-rose-50 text-rose-800"
                  }`}>Food & Dining</span>
              </div>
              <h4 className={`text-sm font-extrabold ${categoryFilter === "Bakery" ? "text-white" : "text-navy"}`}>Restaurants & Bakers</h4>
              <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-bold font-sans">
                <span className={categoryFilter === "Bakery" ? "text-white/85" : "text-rose-600"}>Free Delivery</span>
                <span>•</span>
                <span className={categoryFilter === "Bakery" ? "text-white/85" : "text-slate-500"}>2 Combo Offers</span>
              </div>
              <div className="mt-2 text-[11px] font-bold opacity-80 flex items-center justify-between font-sans">
                <span>28 Eateries Open</span>
                <span>Order Now →</span>
              </div>
            </div>

            {/* Health */}
            <div
              onClick={() => setCategoryFilter("Medical")}
              className={`p-4 rounded-3xl border transition-all duration-300 text-left cursor-pointer hover:shadow-lg ${categoryFilter === "Medical" ? "bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-transparent" : "bg-white hover:bg-slate-50 border-slate-100"
                }`}
            >
              <div className="flex items-center justify-between mb-2 font-sans">
                <span className="text-2xl">🏥</span>
                <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${categoryFilter === "Medical" ? "bg-white/20 text-white" : "bg-emerald-50 text-emerald-800"
                  }`}>Health</span>
              </div>
              <h4 className={`text-sm font-extrabold ${categoryFilter === "Medical" ? "text-white" : "text-navy"}`}>Pharmacy & Clinic</h4>
              <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-bold font-sans">
                <span className={categoryFilter === "Medical" ? "text-white/85" : "text-emerald-600"}>Doctors Available</span>
                <span>•</span>
                <span className={categoryFilter === "Medical" ? "text-white/85" : "text-slate-500"}>Meds Delivery</span>
              </div>
              <div className="mt-2 text-[11px] font-bold opacity-80 flex items-center justify-between font-sans font-sans">
                <span>Lab Tests & Vitals</span>
                <span>Consult →</span>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-6">
            <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search stores by name, city, pincode..."
              className="pl-9 rounded-2xl"
            />
          </div>

          {/* Range, Pincode & Sort Filter Bar */}
          <div className="flex flex-col md:flex-row gap-4 mb-6 items-start md:items-center justify-between bg-white p-4 rounded-2xl border shadow-sm">
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto text-left font-sans">
              <span className="text-xs font-bold text-navy uppercase tracking-wider font-sans">Radius:</span>
              {[5, 10, 20].map((r) => (
                <button
                  key={r}
                  onClick={() => setRadiusFilter(r)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition ${radiusFilter === r
                    ? "bg-navy text-white border-navy"
                    : "bg-white text-navy hover:bg-muted/50"
                    }`}
                >
                  {r} KM
                </button>
              ))}

              {/* Pincode Fallback Input */}
              {!userLocation?.lat && (
                <div className="flex items-center gap-1.5 ml-2 font-sans font-black font-sans">
                  <span className="text-xs font-bold text-accent uppercase tracking-wider font-sans">📍 Pincode:</span>
                  <input
                    type="text"
                    maxLength={6}
                    value={manualPincode}
                    onChange={(e) => setManualPincode(e.target.value.replace(/\D/g, ""))}
                    placeholder="e.g. 504312"
                    className="w-28 h-8 px-3 text-xs border border-accent/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/40 font-mono"
                  />
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto font-sans font-sans">
              <span className="text-xs font-bold text-navy uppercase tracking-wider font-sans">Sort:</span>
              {[
                { key: "nearest", label: "Nearest" },
                { key: "highest_rated", label: "Highest Rated" },
                { key: "fastest_delivery", label: "Fastest" },
                { key: "lowest_delivery_fee", label: "Lowest Fee" },
                { key: "trending", label: "Trending" }
              ].map((s) => (
                <button
                  key={s.key}
                  onClick={() => setSortFilter(s.key)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition ${sortFilter === s.key
                    ? "bg-navy text-white border-navy"
                    : "bg-white text-navy hover:bg-muted/50"
                    }`}
                >
                  {s.label}
                </button>
              ))}
              <Button
                variant="outline"
                size="sm"
                className="rounded-lg text-xs font-sans font-sans"
                onClick={() => setViewMode(viewMode === "list" ? "map" : "list")}
              >
                {viewMode === "list" ? "🗺 Radar Map" : "📋 List View"}
              </Button>
            </div>
          </div>

          {/* Favorite & Deals Sub-tabs Bar */}
          <div className="flex gap-2 border-b pb-3 mb-6 overflow-x-auto whitespace-nowrap text-xs font-bold text-left scrollbar-none font-sans font-sans">
            <button
              onClick={() => setExploreSubTab("nearby")}
              className={`px-4 py-2 rounded-xl transition ${exploreSubTab === "nearby" ? "bg-navy text-white" : "bg-white text-muted-foreground hover:text-navy border"}`}
            >
              🗺 Nearby Stores
            </button>
            <button
              onClick={() => setExploreSubTab("favorite")}
              className={`px-4 py-2 rounded-xl transition ${exploreSubTab === "favorite" ? "bg-navy text-white" : "bg-white text-muted-foreground hover:text-navy border"}`}
            >
              ❤ Favorite Stores
            </button>
            <button
              onClick={() => setExploreSubTab("recent")}
              className={`px-4 py-2 rounded-xl transition ${exploreSubTab === "recent" ? "bg-navy text-white" : "bg-white text-muted-foreground hover:text-navy border"}`}
            >
              Your Previous Stores
            </button>
            <button
              onClick={() => setExploreSubTab("deals")}
              className={`px-4 py-2 rounded-xl transition ${exploreSubTab === "deals" ? "bg-navy text-white" : "bg-white text-muted-foreground hover:text-navy border"}`}
            >
              ⚡ Local Deals & Offers
            </button>
          </div>

          {/* AI Recommendation Banner */}
          <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-navy border rounded-3xl p-5 shadow-sm text-left flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 text-white relative overflow-hidden font-sans font-sans">
            <div className="absolute right-0 top-0 w-24 h-24 bg-white/5 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-center gap-3 font-sans">
              <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-xl shrink-0 animate-bounce">🤖</div>
              <div>
                <h4 className="font-extrabold text-white text-xs leading-none flex items-center gap-1.5 font-black font-sans font-sans">
                  Abhi Suggests <span className="text-[9px] uppercase tracking-wider px-2 py-0.5 rounded bg-accent text-white font-mono font-black font-sans">AI REORDER RADAR</span>
                </h4>
                <p className="text-[11px] text-white/80 mt-1.5 leading-snug font-sans">
                  Based on your history, you frequently request **Milk**, **Water**, and **Puja Flowers**. Would you like to schedule repeat orders?
                </p>
              </div>
            </div>
            <Button
              onClick={() => { setCategoryFilter("ALL"); setMainTab("subscriptions"); }}
              className="bg-accent hover:bg-accent/90 text-white font-bold text-xs rounded-xl shrink-0 py-2 px-4 cursor-pointer border-none font-sans font-sans font-sans"
            >
              🔁 Setup Repeat Order
            </Button>
          </div>

          {/* Ugadi Festival Suggestions Banner */}
          <div className="bg-gradient-to-r from-yellow-500 to-amber-600 text-white rounded-3xl p-5 shadow-sm text-left flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 font-sans font-sans font-sans">
            <div className="space-y-1 font-sans">
              <span className="text-[9px] font-black uppercase tracking-wider bg-white/20 text-white px-2 py-0.5 rounded-full font-mono font-sans font-black font-sans">🪔 Ugadi Festival Special</span>
              <h3 className="text-lg font-black text-white leading-tight font-sans">Need Flowers, Fruits, or Pooja Kits for Ugadi?</h3>
              <p className="text-xs text-white/80 font-bold font-sans">Avoid the last-minute rush! Schedule your morning delivery slot today.</p>
            </div>
            <div className="flex gap-2 font-sans font-sans font-sans">
              <Button onClick={() => { setCategoryFilter("ALL"); navigate("/category"); }} className="bg-white text-amber-800 hover:bg-slate-100 font-bold text-xs px-4 py-2.5 rounded-xl border-none shrink-0 shadow-sm font-sans font-sans">
                🛍 Shop Puja Items
              </Button>
            </div>
          </div>

          {/* Featured Stores Section */}
          <div className="mb-8 text-left font-sans font-sans">
            <h2 className="text-lg font-black text-navy flex items-center gap-1.5 mb-4 font-sans font-sans font-sans">
              <span className="text-red-500 animate-bounce font-sans font-sans font-sans font-sans">🔥</span> Featured Store Partners
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-sans font-sans font-sans font-sans">
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-orange-100/50 rounded-3xl p-5 shadow-sm flex items-center justify-between gap-4 font-sans font-sans">
                <div className="space-y-1 font-sans">
                  <span className="text-[9px] font-black uppercase tracking-wider text-orange-700 bg-white/70 px-2 py-0.5 rounded-full font-sans font-sans font-sans">Sponsored Premium Partner</span>
                  <h3 className="text-base font-black text-navy font-sans font-sans font-sans font-sans font-sans">GM Super Market</h3>
                  <p className="text-xs text-muted-foreground font-medium font-sans font-sans font-sans font-sans">Serving fresh local vegetables, dairy & organic staples in Buchireddypalem.</p>
                  <div className="flex items-center gap-3 text-[11px] font-extrabold text-navy pt-2 font-sans font-sans">
                    <span className="flex items-center gap-0.5">⭐ 4.8</span>
                    <span>•</span>
                    <span>2.1 KM • 25 mins</span>
                  </div>
                  <div className="pt-2">
                    <Button onClick={() => navigate("/business/6a477215fe6b8d23e568b54e")} className="bg-navy hover:bg-navy/90 text-white rounded-xl text-xs py-2 h-8 font-sans border-none font-sans font-sans font-sans">
                      Visit Store
                    </Button>
                  </div>
                </div>
                <div className="w-24 h-24 rounded-2xl bg-white border border-slate-100 p-2 flex items-center justify-center shrink-0 shadow text-3xl select-none font-sans font-sans">
                  🏪
                </div>
              </div>

              <div className="bg-gradient-to-br from-sky-50 to-indigo-50 border border-indigo-100/50 rounded-3xl p-5 shadow-sm flex items-center justify-between gap-4 font-sans font-sans">
                <div className="space-y-1 font-sans">
                  <span className="text-[9px] font-black uppercase tracking-wider text-indigo-700 bg-white/70 px-2 py-0.5 rounded-full font-sans font-sans font-sans font-sans font-sans font-sans">Top Subscription Partner</span>
                  <h3 className="text-base font-black text-navy font-sans font-sans font-sans font-sans">Nellore Fresh Mart</h3>
                  <p className="text-xs text-muted-foreground font-medium font-sans font-sans font-sans font-sans">Daily morning doorstep delivery slots for unadulterated milk, flowers, and produce.</p>
                  <div className="flex items-center gap-3 text-[11px] font-extrabold text-navy pt-2 font-sans font-sans font-sans">
                    <span className="flex items-center gap-0.5">⭐ 4.7</span>
                    <span>•</span>
                    <span>1.5 KM • 15 mins</span>
                  </div>
                  <div className="pt-2">
                    <Button onClick={() => navigate("/business/6a477215fe6b8d23e568b54f")} className="bg-navy hover:bg-navy/90 text-white rounded-xl text-xs py-2 h-8 font-sans border-none font-sans font-sans">
                      Visit Store
                    </Button>
                  </div>
                </div>
                <div className="w-24 h-24 rounded-2xl bg-white border border-slate-100 p-2 flex items-center justify-center shrink-0 shadow text-3xl select-none font-sans font-sans">
                  🥦
                </div>
              </div>
            </div>
          </div>

          {/* Today's Local Deals */}
          <div className="mb-8 text-left font-sans font-sans font-sans">
            <h2 className="text-lg font-black text-navy flex items-center gap-1.5 mb-4 font-sans font-sans font-sans font-sans font-sans">
              <span className="text-yellow-500 font-sans font-sans font-sans font-sans font-sans font-sans font-sans font-sans">⚡</span> Today's Local Deals
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-sans font-sans font-sans">
              <div className="p-4 rounded-3xl border bg-white shadow-sm hover:shadow transition font-sans font-sans font-sans font-sans font-sans">
                <span className="text-[8px] font-black uppercase tracking-wider text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full font-sans font-sans font-sans">Flash Deal</span>
                <h4 className="text-sm font-extrabold text-navy mt-2 font-sans font-sans font-sans font-sans">Nandini Milk Deal</h4>
                <p className="text-xs text-slate-500 font-semibold mt-1 font-sans font-sans font-sans">₹5 OFF per liter on daily subscription slots.</p>
                <p className="text-[10px] text-red-500 font-bold mt-2 font-mono">⏱ Ends in 1 hr</p>
              </div>
              <div className="p-4 rounded-3xl border bg-white shadow-sm hover:shadow transition font-sans font-sans font-sans font-sans">
                <span className="text-[8px] font-black uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full font-sans font-sans">Weekend Special</span>
                <h4 className="text-sm font-extrabold text-navy mt-2 font-sans font-sans">Organic Staples</h4>
                <p className="text-xs text-slate-500 font-semibold mt-1 font-sans font-sans">Order any 2 dals and get organic toor dal 1kg free.</p>
                <p className="text-[10px] text-indigo-600 font-bold mt-2 font-sans font-sans">✓ Verified Vendor</p>
              </div>
              <div className="p-4 rounded-3xl border bg-white shadow-sm hover:shadow transition font-sans font-sans font-sans font-sans font-sans font-sans">
                <span className="text-[8px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-sans font-sans">Free Delivery</span>
                <h4 className="text-sm font-extrabold text-navy mt-2 font-sans font-sans font-sans font-sans font-sans font-sans">GM Fresh Produce</h4>
                <p className="text-xs text-slate-500 font-semibold mt-1 font-sans font-sans">No delivery charge on orders above ₹150 today.</p>
                <p className="text-[10px] text-emerald-600 font-bold mt-2 font-sans font-sans">✓ Auto Applied</p>
              </div>
              <div className="p-4 rounded-3xl border bg-white shadow-sm hover:shadow transition font-sans font-sans font-sans font-sans font-sans font-sans">
                <span className="text-[8px] font-black uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full font-sans font-sans font-sans">Festival Special</span>
                <h4 className="text-sm font-extrabold text-navy mt-2 font-sans font-sans font-sans">Ugadi Pooja Garland</h4>
                <p className="text-xs text-slate-500 font-semibold mt-1 font-sans font-sans font-sans">Auspicous marigold pooja garland discounted to ₹28 today.</p>
                <p className="text-[10px] text-amber-600 font-bold mt-2 font-sans font-sans">🛒 Order Bundle</p>
              </div>
            </div>
          </div>

          {/* Stores Content View (List Radar Map) */}
          {viewMode === "map" ? (
            <div className="bg-slate-100 rounded-3xl border border-slate-200 p-6 relative overflow-hidden h-[500px] flex flex-col justify-between font-sans font-sans font-sans font-sans font-sans font-sans font-sans">
              {/* Mock map background */}
              <div className="absolute inset-0 bg-[radial-gradient(#c5cdd6_1px,transparent_1px)] [background-size:16px_16px] bg-slate-50 pointer-events-none" />

              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] border-4 border-indigo-500/20 rounded-full bg-indigo-500/5 animate-pulse" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[180px] h-[180px] border-2 border-indigo-500/30 rounded-full bg-indigo-500/5" />

              {/* User location pin */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 text-center font-sans font-sans font-sans">
                <div className="w-10 h-10 bg-indigo-600 border-4 border-white text-white rounded-full flex items-center justify-center shadow-xl animate-bounce select-none">
                  📍
                </div>
                <span className="bg-navy text-white text-[9px] font-black px-2 py-0.5 rounded-full mt-1.5 inline-block shadow-sm">You</span>
              </div>

              {/* Store pins scattered dynamically */}
              {displayStoresList.map((shop, idx) => {
                const angles = [45, 135, 220, 310, 80, 160, 260, 20, 110, 290];
                const distanceRatio = [0.35, 0.45, 0.28, 0.38, 0.42, 0.3, 0.48, 0.25, 0.47, 0.33];
                const angle = angles[idx % angles.length] * (Math.PI / 180);
                const radius = 220 * distanceRatio[idx % distanceRatio.length];
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;

                return (
                  <div
                    key={shop._id}
                    onClick={() => navigate(`/business/${shop._id}`)}
                    className="absolute z-10 cursor-pointer text-center group hover:z-30 transition-all duration-200"
                    style={{
                      left: `calc(50% + ${x}px)`,
                      top: `calc(50% + ${y}px)`,
                      transform: 'translate(-50%, -50%)'
                    }}
                  >
                    <div className="w-8 h-8 bg-white border-2 border-accent text-accent rounded-full flex items-center justify-center shadow hover:bg-accent hover:text-white transition duration-200 group-hover:scale-110 select-none">
                      🏪
                    </div>
                    <span className="bg-white border border-slate-100 text-navy text-[9px] font-black px-2 py-0.5 rounded-full mt-1 inline-block shadow-sm whitespace-nowrap group-hover:bg-slate-50 max-w-[100px] truncate">
                      {shop.businessName}
                    </span>
                  </div>
                );
              })}

              <div className="relative z-10 flex items-center justify-between bg-white/95 backdrop-blur border rounded-2xl p-4 shadow-md max-w-md w-full mx-auto mt-4 font-sans font-sans font-sans font-sans">
                <div className="text-left font-sans">
                  <p className="text-[10px] font-bold text-accent uppercase tracking-wider">Geospatial Radar</p>
                  <p className="text-xs font-extrabold text-navy mt-0.5 font-black font-sans">Found {displayStoresList.length} stores inside {radiusFilter} KM radius range.</p>
                </div>
                <Button onClick={() => setViewMode("list")} className="bg-navy hover:bg-navy/90 text-white rounded-xl text-xs h-8 border-none font-sans font-sans font-sans font-sans font-sans">
                  ← List View
                </Button>
              </div>
            </div>
          ) : (!userLocation?.lat && !userLocation?.pincode && !manualPincode) ? (
            <div className="rounded-3xl border bg-muted/20 p-12 text-center font-sans font-sans font-sans">
              <div className="mx-auto h-14 w-14 rounded-2xl bg-white border flex items-center justify-center">
                <MapPin className="h-7 w-7 text-accent" />
              </div>
              <h3 className="mt-4 text-lg font-bold text-navy font-sans font-sans font-sans">Set your location</h3>
              <p className="text-muted-foreground mt-1 font-sans">Choose your location or enter your pincode to load local stores near you.</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center mt-5">
                <Button onClick={() => setOpenLocationModal(true)}>📍 Set Location via GPS</Button>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    maxLength={6}
                    value={manualPincode}
                    onChange={(e) => setManualPincode(e.target.value.replace(/\D/g, ""))}
                    placeholder="Enter Pincode"
                    className="h-10 px-4 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/40 font-mono w-36"
                  />
                  <Button variant="outline" onClick={() => { if (manualPincode.length >= 4) fetchNearbyStores(null, null, manualPincode, radiusFilter, categoryFilter, sortFilter); }}>Search</Button>
                </div>
              </div>
            </div>
          ) : loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="rounded-3xl border bg-white p-5 space-y-4">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-16 w-16 rounded-2xl" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-2/3" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                  <Skeleton className="h-3 w-3/4" />
                  <div className="flex gap-2">
                    <Skeleton className="h-8 w-24 rounded-lg" />
                    <Skeleton className="h-8 w-24 rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="rounded-3xl border bg-red-50 p-12 text-center font-sans font-sans font-sans">
              <p className="text-red-600 font-semibold">{error}</p>
              <Button
                className="mt-5 font-sans"
                variant="outline"
                onClick={() => {
                  const lat = userLocation?.lat || 16.5062;
                  const lng = userLocation?.lng || 80.6480;
                  fetchNearbyStores(lat, lng, radiusFilter, categoryFilter, sortFilter);
                }}
              >
                Retry
              </Button>
            </div>
          ) : displayStoresList.length === 0 ? (
            <div className="rounded-3xl border bg-white p-10 text-center shadow-premium max-w-xl mx-auto space-y-5 text-left font-sans">
              <div className="flex gap-4">
                <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center text-3xl shrink-0 select-none">😔</div>
                <div>
                  <h3 className="text-lg font-black text-navy leading-none">No Stores Found Nearby</h3>
                  <p className="text-xs text-muted-foreground mt-1.5 leading-snug">
                    We couldn't find any partner shops matching your current location or range. Let's fix this!
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs font-sans">
                <div className="p-3 border rounded-2xl bg-slate-50/50 hover:bg-slate-50 transition">
                  <p className="font-extrabold text-navy font-sans">1. Increase Range</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 font-sans font-sans font-sans">Expand search radius to discover stores further away.</p>
                  <div className="mt-2.5 flex gap-2">
                    <Button size="sm" onClick={() => setRadiusFilter(20)} className="h-7 text-xs bg-navy text-white hover:bg-navy/90 rounded-lg border-none">Set to 20 KM</Button>
                  </div>
                </div>

                <div className="p-3 border rounded-2xl bg-slate-50/50 hover:bg-slate-50 transition font-sans">
                  <p className="font-extrabold text-navy font-sans font-sans font-sans font-sans">2. Switch Location</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 font-sans">Choose another pincode or town center.</p>
                  <div className="mt-2.5 flex gap-2 font-sans font-sans">
                    <Button size="sm" onClick={() => setOpenLocationModal(true)} className="h-7 text-xs bg-white border text-navy hover:bg-slate-100 rounded-lg font-sans">Choose Location</Button>
                  </div>
                </div>

                <div className="p-3 border rounded-2xl bg-slate-50/50 hover:bg-slate-50 transition font-sans">
                  <p className="font-extrabold text-navy font-sans font-sans font-sans font-sans">3. Request Store</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 font-sans">Let us know which local shops you want added.</p>
                  <div className="mt-2.5 flex gap-2">
                    <Button size="sm" onClick={() => alert("Thank you! Store request registered.")} className="h-7 text-xs bg-accent text-white hover:bg-accent/90 rounded-lg border-none">Request Store</Button>
                  </div>
                </div>

                <div className="p-3 border rounded-2xl bg-slate-50/50 hover:bg-slate-50 transition font-sans animate-pulse font-sans font-sans font-sans">
                  <p className="font-extrabold text-navy font-sans">4. Partner With Us</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 font-sans font-sans font-sans font-sans">Own a shop? Become the first vendor here!</p>
                  <div className="mt-2.5 flex gap-2 font-sans">
                    <Button size="sm" onClick={() => navigate("/register")} className="h-7 text-xs bg-green-600 text-white hover:bg-green-700 rounded-lg border-none">Become Vendor</Button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-left font-sans font-sans">
              {displayStoresList.map((shop) => {
                const availability = getStatusDisplay(shop.computedAvailability || "closed");
                const logo = shop.storeDesign?.logoUrl || shop.logo || "";
                const banner = shop.storeDesign?.bannerUrl || "";
                const ratingAvg = shop.rating?.average || 5.0;
                const reviewsCount = shop.rating?.totalReviews || 0;
                const distance = shop.distanceInKm ? Number(shop.distanceInKm).toFixed(1) : (shop.distance || "0.0");
                const deliveryTime = `${shop.estimatedDeliveryMinutes || 30} mins`;
                const deliveryCharge = shop.deliveryCharge !== undefined ? shop.deliveryCharge : 20;
                const minOrder = shop.minOrder !== undefined ? shop.minOrder : 100;
                const categories = shop.categories || [];
                const firstOffer = shop.offers?.[0];

                const isFlowerMerchant = shop.businessName?.toLowerCase().includes("flower");

                return (
                  <div
                    key={shop._id}
                    onClick={() => navigate(`/business/${shop._id}`)}
                    className="group flex flex-col rounded-3xl border bg-white overflow-hidden hover:shadow-xl transition-all cursor-pointer relative font-sans font-sans"
                  >
                    {/* Store Banner */}
                    <div className="relative h-32 w-full bg-slate-100 overflow-hidden border-b shrink-0">
                      {banner ? (
                        <img src={banner} alt={shop.businessName} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                      ) : (
                        <div className="h-full w-full bg-gradient-to-r from-navy/10 to-accent/10 flex items-center justify-center font-sans font-sans font-sans">
                          <Store className="h-10 w-10 text-muted-foreground/30" />
                        </div>
                      )}

                      {/* Availability status badge */}
                      <span className={`absolute top-3 left-3 text-[10px] px-2 py-0.5 rounded-full font-bold border shadow-sm ${availability.classes}`}>
                        {availability.label}
                      </span>

                      {/* Store Promo banner */}
                      <div className="absolute bottom-2 right-2 bg-red-600 text-white text-[9px] font-black px-2 py-0.5 rounded-lg uppercase tracking-wider shadow">
                        {firstOffer ? firstOffer.title : "20% OFF • Free Delivery"}
                      </div>
                    </div>

                    <div className="flex-1 p-5 flex flex-col justify-between font-sans">
                      <div>
                        <div className="flex items-start gap-3">
                          {/* Logo */}
                          <div className="h-14 w-14 rounded-2xl overflow-hidden bg-white border flex items-center justify-center shrink-0 -mt-10 shadow-md">
                            {logo ? (
                              <img src={logo} alt={shop.businessName} className="h-full w-full object-cover" />
                            ) : (
                              <Store className="h-6 w-6 text-muted-foreground" />
                            )}
                          </div>

                          {/* Title and Favorites */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 font-sans font-black font-sans">
                              <h3 className="font-extrabold text-navy text-base truncate leading-tight font-sans font-sans font-black">{shop.businessName}</h3>
                              {shop.verifiedBadge && (
                                <span className="text-[9px] bg-blue-100 text-blue-700 px-1 py-0.2 rounded font-black shrink-0 font-sans font-sans font-sans">VERIFIED</span>
                              )}
                            </div>

                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground font-sans font-black font-sans font-sans font-sans font-sans">
                              <span className="inline-flex items-center gap-0.5">
                                <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                                <span className="font-bold text-navy">{ratingAvg}</span>
                                <span>({reviewsCount})</span>
                              </span>
                              <span>•</span>
                              <span className="inline-flex items-center gap-0.5">
                                <MapPin className="h-3 w-3 text-slate-400" />
                                <span>{distance} km</span>
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={(e) => handleToggleFavorite(e, shop._id)}
                            className="p-1.5 rounded-full hover:bg-slate-100 transition shrink-0"
                          >
                            <Star className={`h-5 w-5 ${shop.isFavorite ? "fill-amber-500 text-amber-500" : "text-slate-400"}`} />
                          </button>
                        </div>

                        {/* Categories list */}
                        {categories.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-3">
                            {categories.slice(0, 3).map((cat) => (
                              <span key={cat} className="text-[10px] px-2 py-0.5 rounded-full bg-slate-50 border text-slate-600">{cat}</span>
                            ))}
                          </div>
                        )}

                        {/* Custom services badge override */}
                        {isFlowerMerchant ? (
                          <div className="flex flex-wrap gap-1 mt-2.5">
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-yellow-50 text-yellow-700 border border-yellow-100 shrink-0 font-sans">🌼 Schedule Delivery</span>
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-pink-50 text-pink-700 border border-pink-100 shrink-0 font-sans font-sans">🌸 Daily Subscription</span>
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-100 shrink-0 font-sans">🎉 Event Decoration</span>
                          </div>
                        ) : (
                          /* Subscription Badges Row */
                          <div className="flex flex-wrap gap-1 mt-2.5 font-sans font-sans">
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-orange-50 text-orange-700 border border-orange-100 shrink-0 font-sans">🥛 Milk Subscription</span>
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100 shrink-0 font-sans font-sans">💧 Water Subscription</span>
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-green-50 text-green-700 border border-green-100 shrink-0 font-sans font-sans font-sans">🥬 Veg Subscription</span>
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-yellow-50 text-yellow-700 border border-yellow-100 shrink-0 font-sans font-sans">🌼 Flower Subscription</span>
                          </div>
                        )}

                        {/* Offer details */}
                        {firstOffer && (
                          <div className="mt-3.5 px-3 py-1.5 bg-green-50 border border-green-100 rounded-xl flex items-center gap-1.5 text-xs text-green-700 font-bold shrink-0">
                            <Gift className="h-4 w-4 shrink-0 text-green-600" />
                            <span className="truncate">{firstOffer.title}</span>
                          </div>
                        )}
                      </div>

                      <div className="mt-6 font-sans font-sans">
                        <div className="pt-4 border-t border-dashed flex items-center justify-between text-xs text-muted-foreground gap-2 shrink-0">
                          <div>
                            <p className="text-[10px] uppercase font-bold text-slate-400">ETA</p>
                            <p className="font-extrabold text-navy mt-0.5 font-sans font-black">{deliveryTime}</p>
                          </div>
                          <div className="text-center font-sans font-sans">
                            <p className="text-[10px] uppercase font-bold text-slate-400 font-sans">Min Order</p>
                            <p className="font-extrabold text-navy mt-0.5 font-sans font-black">₹{minOrder}</p>
                          </div>
                          <div className="text-right font-sans font-sans">
                            <p className="text-[10px] uppercase font-bold">Delivery</p>
                            <p className="font-extrabold text-navy mt-0.5 font-sans font-sans font-black">
                              {deliveryCharge === 0 ? "FREE" : `₹${deliveryCharge}`}
                            </p>
                          </div>
                        </div>
                        <Button className="w-full mt-4 bg-navy hover:bg-navy/90 text-white rounded-xl text-xs py-2 font-bold flex items-center justify-center gap-2 border-none font-sans font-sans">
                          Visit Store <ChevronRight className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Become Vendor Partner CTA */}
          <div className="bg-gradient-to-r from-indigo-900 to-navy text-white rounded-3xl p-6 text-left relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl mt-8">
            <div className="absolute -right-16 -top-16 w-32 h-32 bg-primary/10 rounded-full blur-2xl pointer-events-none font-sans font-sans" />
            <div className="text-left max-w-xl z-10 font-sans font-sans font-sans">
              <h3 className="text-lg md:text-xl font-black text-white font-sans font-sans">Scale Your Business with ApexBee</h3>
              <p className="text-xs text-white/80 mt-1 leading-relaxed">
                Become a registered merchant partner today. Put your catalog online, offer doorstep milk & vegetable subscriptions, and deliver within 30 minutes!
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 shrink-0 z-10 font-sans font-sans font-sans">
              <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 text-xs font-bold px-4 py-2 font-sans font-sans font-black" onClick={() => navigate("/register?ref=partner")}>
                Become Partner
              </Button>
              <button
                onClick={() => navigate("/register")}
                className="relative inline-flex items-center justify-center px-6 py-2.5 overflow-hidden font-bold text-white rounded-full bg-accent hover:bg-accent/90 transition duration-300 ease-out shadow-lg hover:shadow-accent/40 animate-pulse active:scale-95 text-xs uppercase tracking-wider cursor-pointer border-none font-sans font-sans font-black"
              >
                Register Free
              </button>
            </div>
          </div>

          {/* Floating CTA Ask AI */}
          <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 font-sans text-xs items-end mr-16 md:mr-0 font-sans font-sans">
            {showAiFloatingOptions && (
              <div className="bg-white border rounded-2xl p-3 shadow-2xl flex flex-col gap-1.5 text-left border-indigo-100/60 animate-fade-in w-44 font-sans font-sans">
                <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 mb-1 font-sans">🤖 Abhi AI Shortcuts</p>
                <button onClick={() => { setCategoryFilter("Grocery"); setQuery("Grocery"); setShowAiFloatingOptions(false); }} className="hover:bg-slate-50 text-navy font-bold py-1 px-2 rounded text-left border-none bg-transparent cursor-pointer font-sans">Find Grocery 🛒</button>
                <button onClick={() => { setCategoryFilter("Medical"); setQuery("Pharmacy"); setShowAiFloatingOptions(false); }} className="hover:bg-slate-50 text-navy font-bold py-1 px-2 rounded text-left border-none bg-transparent cursor-pointer font-sans">Find Medical 💊</button>
                <button onClick={() => { setCategoryFilter("ALL"); setQuery("Flowers"); setShowAiFloatingOptions(false); }} className="hover:bg-slate-50 text-navy font-bold py-1 px-2 rounded text-left border-none bg-transparent cursor-pointer font-sans font-sans font-black">Find Flowers 🌼</button>
                <button onClick={() => { setCategoryFilter("Dairy"); setQuery("Milk"); setShowAiFloatingOptions(false); }} className="hover:bg-slate-50 text-navy font-bold py-1 px-2 rounded text-left border-none bg-transparent cursor-pointer font-sans font-sans font-black">Find Milk 🥛</button>
                <button onClick={() => { setCategoryFilter("Water"); setQuery("Water"); setShowAiFloatingOptions(false); }} className="hover:bg-slate-50 text-navy font-bold py-1 px-2 rounded text-left border-none bg-transparent cursor-pointer font-sans font-sans font-black font-sans">Find Water 💧</button>
              </div>
            )}
            <button
              onClick={() => setShowAiFloatingOptions(!showAiFloatingOptions)}
              className="w-14 h-14 bg-gradient-to-tr from-indigo-600 to-indigo-800 text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all cursor-pointer border-none text-2xl font-bold font-sans font-sans font-sans"
              title="Ask Abhi AI"
            >
              🤖
            </button>
          </div>
        </section>
      )}

      {/* SUBSCRIPTIONS TAB */}
      {mainTab === "subscriptions" && (
        <section className="container mx-auto px-4 py-6">
          {/* Sub-tabs */}
          <div className="flex gap-2 overflow-x-auto pb-4 mb-2">
            {subDashTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setSubTab(tab.key)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-semibold whitespace-nowrap transition ${subTab === tab.key
                    ? "bg-navy text-white border-navy shadow-md"
                    : "bg-white text-navy hover:bg-muted/30"
                    }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                  {tab.key === "active" && activeSubs.length > 0 && (
                    <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${subTab === "active" ? "bg-white/20" : "bg-accent/10 text-accent"}`}>
                      {activeSubs.length}
                    </span>
                  )}
                  {tab.key === "paused" && pausedSubs.length > 0 && (
                    <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${subTab === "paused" ? "bg-white/20" : "bg-orange-100 text-orange-600"}`}>
                      {pausedSubs.length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {subLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-2xl border bg-white p-5 space-y-3">
                  <Skeleton className="h-5 w-1/3" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-8 w-1/4 rounded-lg" />
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* ACTIVE SUBS */}
              {subTab === "active" && (
                <div className="space-y-4">
                  {activeSubs.length === 0 ? (
                    <div className="rounded-3xl border bg-muted/20 p-12 text-center">
                      <Package className="mx-auto h-12 w-12 text-muted-foreground/40" />
                      <h3 className="mt-4 text-lg font-bold text-navy">No active subscriptions</h3>
                      <p className="text-muted-foreground mt-1">Browse local shops and subscribe to daily essentials.</p>
                      <Button className="mt-5" onClick={() => setMainTab("explore")}>Explore Shops</Button>
                    </div>
                  ) : (
                    activeSubs.map((sub) => (
                      <div key={sub._id} className="rounded-2xl border bg-white p-5 hover:shadow-md transition-shadow">
                        <div className="flex gap-4">
                          <img
                            src={sub.productImage}
                            alt={sub.productName}
                            className="h-20 w-20 rounded-xl object-cover border"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h4 className="font-bold text-navy text-base">{sub.productName}</h4>
                                <p className="text-sm text-muted-foreground mt-0.5">
                                  {sub.quantity} × ₹{sub.unitPrice} • {sub.frequency === "custom" ? `Custom (${sub.customDays?.join(", ")})` : sub.frequency.charAt(0).toUpperCase() + sub.frequency.slice(1)}
                                </p>
                              </div>
                              <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[11px] font-bold">Active</span>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-muted-foreground">
                              <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{sub.deliverySlot}</span>
                              <span>•</span>
                              <span>Est. ₹{(sub.quantity * sub.unitPrice * (sub.frequency === "daily" ? 30 : sub.frequency === "alternate" ? 15 : sub.frequency === "weekly" ? 4 : sub.frequency === "monthly" ? 1 : (sub.customDays?.length || 3) * 4)).toLocaleString("en-IN")}/mo</span>
                              {sub.autoRenew && <span className="px-1.5 py-0.5 rounded bg-blue-light text-navy text-[10px]">Auto-Renew ON</span>}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t">
                          <Button size="sm" variant="outline" onClick={() => handlePauseResume(sub)}>
                            <Pause className="h-3.5 w-3.5 mr-1" /> Pause
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleSkipTomorrow(sub)}>
                            <SkipForward className="h-3.5 w-3.5 mr-1" /> Skip Tomorrow
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => { setSkipModal({ subId: sub._id, open: true }); setSkipDate(""); }}>
                            <Calendar className="h-3.5 w-3.5 mr-1" /> Skip Date
                          </Button>
                          <Button
                            size="sm"
                            variant={sub.autoRenew ? "outline" : "default"}
                            onClick={() => handleToggleAutoRenew(sub)}
                          >
                            <RefreshCcw className="h-3.5 w-3.5 mr-1" />
                            {sub.autoRenew ? "Disable Auto-Renew" : "Enable Auto-Renew"}
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* PAUSED SUBS */}
              {subTab === "paused" && (
                <div className="space-y-4">
                  {pausedSubs.length === 0 ? (
                    <div className="rounded-3xl border bg-muted/20 p-12 text-center">
                      <Pause className="mx-auto h-12 w-12 text-muted-foreground/40" />
                      <h3 className="mt-4 text-lg font-bold text-navy">No paused subscriptions</h3>
                      <p className="text-muted-foreground mt-1">All your subscriptions are currently active.</p>
                    </div>
                  ) : (
                    pausedSubs.map((sub) => (
                      <div key={sub._id} className="rounded-2xl border bg-white p-5 hover:shadow-md transition-shadow">
                        <div className="flex gap-4">
                          <img src={sub.productImage} alt={sub.productName} className="h-20 w-20 rounded-xl object-cover border opacity-60" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h4 className="font-bold text-navy text-base">{sub.productName}</h4>
                                <p className="text-sm text-muted-foreground mt-0.5">
                                  {sub.quantity} × ₹{sub.unitPrice} • {sub.frequency === "custom" ? `Custom (${sub.customDays?.join(", ")})` : sub.frequency.charAt(0).toUpperCase() + sub.frequency.slice(1)}
                                </p>
                              </div>
                              <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-600 text-[11px] font-bold">Paused</span>
                            </div>
                          </div>
                        </div>
                        <div className="mt-4 pt-3 border-t">
                          <Button onClick={() => handlePauseResume(sub)}>
                            <Play className="h-4 w-4 mr-1.5" /> Resume Subscription
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* UPCOMING DELIVERIES */}
              {subTab === "upcoming" && (
                <div className="space-y-6">
                  {activeSubs.length === 0 ? (
                    <div className="rounded-3xl border bg-muted/20 p-12 text-center">
                      <CalendarDays className="mx-auto h-12 w-12 text-muted-foreground/40" />
                      <h3 className="mt-4 text-lg font-bold text-navy">No upcoming deliveries</h3>
                      <p className="text-muted-foreground mt-1">Subscribe to daily essentials to see upcoming deliveries.</p>
                    </div>
                  ) : (
                    activeSubs.map((sub) => {
                      const upcoming = generateUpcoming(sub);
                      return (
                        <div key={sub._id} className="rounded-2xl border bg-white p-5">
                          <div className="flex items-center gap-3 mb-4">
                            <img src={sub.productImage} alt="" className="h-10 w-10 rounded-lg object-cover border" />
                            <div>
                              <h4 className="font-bold text-navy text-sm">{sub.productName}</h4>
                              <p className="text-xs text-muted-foreground">{sub.quantity}x • {sub.deliverySlot}</p>
                            </div>
                          </div>
                          <div className="space-y-2">
                            {upcoming.map((item) => (
                              <div key={item.date} className={`flex items-center justify-between px-3 py-2 rounded-xl border ${item.skipped ? "bg-orange-50 border-orange-200" : "bg-muted/20"}`}>
                                <div className="flex items-center gap-3">
                                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center text-sm font-bold ${item.skipped ? "bg-orange-200 text-orange-700" : item.status === "Packed" ? "bg-green-200 text-green-700" : "bg-blue-light text-navy"}`}>
                                    {new Date(item.date).getDate()}
                                  </div>
                                  <div>
                                    <p className="text-sm font-semibold text-navy">
                                      {new Date(item.date).toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" })}
                                    </p>
                                    <p className={`text-[11px] ${item.skipped ? "text-orange-600" : "text-muted-foreground"}`}>{item.status}</p>
                                  </div>
                                </div>
                                {!item.skipped ? (
                                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${item.status === "Packed" ? "bg-green-100 text-green-700" : item.status === "Out For Delivery" ? "bg-blue-100 text-blue-700" : "bg-muted text-navy"}`}>
                                    {item.status}
                                  </span>
                                ) : (
                                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-100 text-orange-600 font-semibold">Skipped</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* BILLING */}
              {subTab === "billing" && (
                <div className="space-y-5">
                  {billing ? (
                    <>
                      <div className="rounded-2xl border bg-gradient-to-r from-navy to-navy/80 p-6 text-white">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <p className="text-sm text-white/70">Monthly Billing Summary</p>
                            <h3 className="text-2xl font-extrabold mt-1">{billing.month}</h3>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-white/70">Grand Total</p>
                            <p className="text-3xl font-extrabold">₹{billing.grandTotal.toLocaleString("en-IN")}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/15">
                          <div>
                            <p className="text-white/60 text-xs">Total Deliveries</p>
                            <p className="text-xl font-bold">{billing.totalDeliveries}</p>
                          </div>
                          <div>
                            <p className="text-white/60 text-xs">Delivery Fee</p>
                            <p className="text-xl font-bold">₹{billing.deliveryFee}</p>
                          </div>
                          <div>
                            <p className="text-white/60 text-xs">Auto-Renewal</p>
                            <p className="text-xl font-bold">{billing.autoRenewalActive ? "Active" : "Off"}</p>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-2xl border bg-white p-5">
                        <h4 className="font-bold text-navy mb-3">Breakdown</h4>
                        <div className="space-y-3">
                          {billing.breakdown.map((item, i) => (
                            <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-muted/20 border">
                              <div>
                                <p className="font-semibold text-navy text-sm">{item.productName}</p>
                                <p className="text-xs text-muted-foreground">
                                  {item.frequency} • {item.deliveries} deliveries {item.skipped > 0 && `(${item.skipped} skipped)`}
                                </p>
                              </div>
                              <p className="font-bold text-navy">₹{item.amount.toLocaleString("en-IN")}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <Button variant="outline" className="w-full" onClick={() => alert("Invoice downloaded! (Mock)")}>
                        <CreditCard className="h-4 w-4 mr-2" /> Download Invoice
                      </Button>
                    </>
                  ) : (
                    <div className="rounded-3xl border bg-muted/20 p-12 text-center">
                      <Receipt className="mx-auto h-12 w-12 text-muted-foreground/40" />
                      <h3 className="mt-4 text-lg font-bold text-navy">No billing data</h3>
                      <p className="text-muted-foreground mt-1">Start a subscription to see billing summaries.</p>
                    </div>
                  )}
                </div>
              )}

              {/* LOYALTY */}
              {subTab === "loyalty" && (
                <div className="space-y-5">
                  {loyalty ? (
                    <>
                      {/* Streak card */}
                      <div className="rounded-2xl border bg-gradient-to-br from-amber-50 to-orange-50 p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                            <Flame className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <h4 className="font-extrabold text-navy text-lg">Delivery Streak</h4>
                            <p className="text-sm text-muted-foreground">
                              {loyalty.targetStreak - loyalty.currentStreak} more days for cashback!
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-3 rounded-full bg-white border overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all"
                              style={{ width: `${Math.min(100, (loyalty.currentStreak / loyalty.targetStreak) * 100)}%` }}
                            />
                          </div>
                          <span className="text-sm font-bold text-navy">{loyalty.currentStreak}/{loyalty.targetStreak}</span>
                        </div>

                        <p className="mt-2 text-xs text-muted-foreground">
                          🔥 Current: {loyalty.currentStreak} days • Best: {loyalty.longestStreak} days
                        </p>
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {[
                          { label: "Cashback Earned", value: `₹${loyalty.cashbackEarned}`, icon: Gift, color: "from-green-400 to-emerald-500" },
                          { label: "Cashback Pending", value: `₹${loyalty.cashbackPending}`, icon: AlertCircle, color: "from-amber-400 to-yellow-500" },
                          { label: "Free Deliveries", value: String(loyalty.freeDeliveriesEarned), icon: Truck, color: "from-blue-400 to-indigo-500" },
                          { label: "Reward Points", value: String(loyalty.rewardPoints), icon: Trophy, color: "from-purple-400 to-violet-500" },
                        ].map((stat) => {
                          const Icon = stat.icon;
                          return (
                            <div key={stat.label} className="rounded-2xl border bg-white p-4 text-center">
                              <div className={`mx-auto h-10 w-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-2`}>
                                <Icon className="h-5 w-5 text-white" />
                              </div>
                              <p className="text-xl font-extrabold text-navy">{stat.value}</p>
                              <p className="text-[11px] text-muted-foreground mt-0.5">{stat.label}</p>
                            </div>
                          );
                        })}
                      </div>

                      <div className="rounded-2xl border bg-white p-5">
                        <h4 className="font-bold text-navy mb-2">How It Works</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                          <li className="flex gap-2"><Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" /> Order for 30 consecutive days to earn ₹50 cashback</li>
                          <li className="flex gap-2"><Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" /> Every 10th delivery gets free delivery for next order</li>
                          <li className="flex gap-2"><Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" /> Earn reward points on every subscription purchase</li>
                          <li className="flex gap-2"><Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" /> Redeem points for discounts on future orders</li>
                        </ul>
                      </div>
                    </>
                  ) : (
                    <div className="rounded-3xl border bg-muted/20 p-12 text-center">
                      <Trophy className="mx-auto h-12 w-12 text-muted-foreground/40" />
                      <h3 className="mt-4 text-lg font-bold text-navy">Start earning rewards</h3>
                      <p className="text-muted-foreground mt-1">Subscribe to daily essentials and build your streak.</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </section>
      )}

      {/* Skip Date Modal */}
      {skipModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setSkipModal({ subId: "", open: false })}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-navy mb-4">Skip Delivery Date</h3>
            <input
              type="date"
              value={skipDate}
              onChange={(e) => setSkipDate(e.target.value)}
              min={new Date(Date.now() + 86400000).toISOString().split("T")[0]}
              className="w-full px-4 py-2 border rounded-xl text-sm mb-4"
            />
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setSkipModal({ subId: "", open: false })}>Cancel</Button>
              <Button className="flex-1" disabled={!skipDate} onClick={handleSkipDate}>Skip This Date</Button>
            </div>
          </div>
        </div>
      )}

      {/* Location Modal */}
      <LocationModal
        open={openLocationModal}
        onOpenChange={setOpenLocationModal}
        onConfirm={(loc) => {
          setUserLocation(loc);
          localStorage.setItem(LOCATION_KEY, JSON.stringify(loc));
        }}
      />

      <Footer />
    </div>
  );
};

export default LocalStores;

