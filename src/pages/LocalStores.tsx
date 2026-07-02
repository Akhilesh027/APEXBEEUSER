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

  // Filters
  const filteredStores = useMemo(() => {
    const q = query.trim().toLowerCase();
    return stores.filter((s) => {
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
  }, [stores, query, categoryFilter]);

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
          {/* Category Chips */}
          <div className="flex gap-2 overflow-x-auto pb-4 mb-4">
            {shopCategories.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setCategoryFilter(cat.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-semibold whitespace-nowrap transition ${
                  categoryFilter === cat.key
                    ? "bg-accent text-white border-accent shadow-md"
                    : "bg-white text-navy hover:bg-muted/30"
                }`}
              >
                <span className="text-base">{cat.icon}</span>
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative mb-6">
            <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search stores by name, city, pincode..."
              className="pl-9"
            />
          </div>

          {/* Range, Pincode & Sort Filter Bar */}
          <div className="flex flex-col md:flex-row gap-4 mb-6 items-start md:items-center justify-between bg-white p-4 rounded-2xl border shadow-sm">
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <span className="text-xs font-bold text-navy uppercase tracking-wider">Radius:</span>
              {[5, 10, 20].map((r) => (
                <button
                  key={r}
                  onClick={() => setRadiusFilter(r)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition ${
                    radiusFilter === r
                      ? "bg-navy text-white border-navy"
                      : "bg-white text-navy hover:bg-muted/50"
                  }`}
                >
                  {r} KM
                </button>
              ))}

              {/* Pincode Fallback Input */}
              {!userLocation?.lat && (
                <div className="flex items-center gap-1.5 ml-2">
                  <span className="text-xs font-bold text-accent uppercase tracking-wider">📍 Pincode:</span>
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

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <span className="text-xs font-bold text-navy uppercase tracking-wider">Sort:</span>
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
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition ${
                    sortFilter === s.key
                      ? "bg-navy text-white border-navy"
                      : "bg-white text-navy hover:bg-muted/50"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Stores Grid — gate: show grid as long as we have GPS or pincode or even just loading */}
          {(!userLocation?.lat && !userLocation?.pincode && !manualPincode) ? (
            <div className="rounded-3xl border bg-muted/20 p-12 text-center">
              <div className="mx-auto h-14 w-14 rounded-2xl bg-white border flex items-center justify-center">
                <MapPin className="h-7 w-7 text-accent" />
              </div>
              <h3 className="mt-4 text-lg font-bold text-navy">Set your location</h3>
              <p className="text-muted-foreground mt-1">Choose your location or enter your pincode to load local stores near you.</p>
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
            <div className="rounded-3xl border bg-red-50 p-12 text-center">
              <p className="text-red-600 font-semibold">{error}</p>
              <Button
                className="mt-5"
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
          ) : filteredStores.length === 0 ? (
            <div className="rounded-3xl border bg-muted/20 p-12 text-center">
              <div className="mx-auto h-14 w-14 rounded-2xl bg-white border flex items-center justify-center">
                <Store className="h-7 w-7 text-navy" />
              </div>
              <h3 className="mt-4 text-lg font-bold text-navy">No stores found</h3>
              <p className="text-muted-foreground mt-1">Try expanding your search radius or select another category.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredStores.map((shop) => {
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

                return (
                  <div
                    key={shop._id}
                    onClick={() => navigate(`/business/${shop._id}`)}
                    className="group flex flex-col rounded-3xl border bg-white overflow-hidden hover:shadow-xl transition-all cursor-pointer"
                  >
                    {/* Store Banner */}
                    <div className="relative h-32 w-full bg-slate-100 overflow-hidden border-b shrink-0">
                      {banner ? (
                        <img src={banner} alt={shop.businessName} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                      ) : (
                        <div className="h-full w-full bg-gradient-to-r from-navy/10 to-accent/10 flex items-center justify-center">
                          <Store className="h-10 w-10 text-muted-foreground/30" />
                        </div>
                      )}
                      {/* Availability status badge */}
                      <span className={`absolute top-3 left-3 text-[10px] px-2 py-0.5 rounded-full font-bold border shadow-sm ${availability.classes}`}>
                        {availability.label}
                      </span>
                    </div>

                    <div className="flex-1 p-5 flex flex-col">
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
                          <div className="flex items-center gap-1.5">
                            <h3 className="font-extrabold text-navy text-base truncate leading-tight">{shop.businessName}</h3>
                            {shop.verifiedBadge && (
                              <span className="text-[9px] bg-blue-100 text-blue-700 px-1 py-0.2 rounded font-black shrink-0">VERIFIED</span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
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

                      {/* Offer details */}
                      {firstOffer && (
                        <div className="mt-3.5 px-3 py-1.5 bg-green-50 border border-green-100 rounded-xl flex items-center gap-1.5 text-xs text-green-700 font-bold shrink-0">
                          <Gift className="h-4 w-4 shrink-0 text-green-600" />
                          <span className="truncate">{firstOffer.title}</span>
                        </div>
                      )}

                      <div className="mt-auto pt-4 border-t border-dashed flex items-center justify-between text-xs text-muted-foreground gap-2 shrink-0">
                        <div>
                          <p className="text-[10px] uppercase font-bold text-slate-400">ETA</p>
                          <p className="font-extrabold text-navy mt-0.5">{deliveryTime}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-[10px] uppercase font-bold text-slate-400">Min Order</p>
                          <p className="font-extrabold text-navy mt-0.5">₹{minOrder}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] uppercase font-bold text-slate-400">Delivery</p>
                          <p className="font-extrabold text-navy mt-0.5">
                            {deliveryCharge === 0 ? "FREE" : `₹${deliveryCharge}`}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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
                  className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-semibold whitespace-nowrap transition ${
                    subTab === tab.key
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

