import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  MapPin, Search, Store, Filter, RefreshCcw, Package, CalendarDays, Receipt,
  Trophy, Bell, Pause, Play, SkipForward, Calendar, Star, Clock, Truck,
  ChevronRight, ChevronLeft, X, Flame, Gift, CreditCard, Check, AlertCircle,
  Sparkles, Tag, ShieldCheck, Zap, TrendingUp, Award, Heart
} from "lucide-react";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LocationModal from "@/components/LocationModal";
import { DynamicHeroBanner } from "@/components/DynamicHeroBanner";
import { getDeviceCoordinates, reverseGeocode, saveActiveLocation } from "@/utils/locationHelper";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const API_BASE = import.meta.env.VITE_API_URL || (typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") ? "https://server.apexbee.in/api" : "https://server.apexbee.in/api");
const LOCATION_KEY = "user_location";

const safeJsonFetch = async (url: string, options?: RequestInit) => {
  try {
    const res = await fetch(url, options);
    const contentType = res.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      return null;
    }
    return await res.json();
  } catch (err) {
    return null;
  }
};

const getStatusDisplay = (status: string) => {
  switch (status) {
    case "open":
      return { label: "OPEN NOW", classes: "bg-emerald-500 text-white" };
    case "opening_soon":
      return { label: "Opening Soon", classes: "bg-amber-500 text-white" };
    case "closing_soon":
      return { label: "Closing Soon", classes: "bg-orange-500 text-white" };
    case "busy":
      return { label: "Busy Mode", classes: "bg-rose-500 text-white" };
    case "vacation":
      return { label: "On Vacation", classes: "bg-slate-700 text-white" };
    case "temporarily_closed":
      return { label: "Temporarily Closed", classes: "bg-rose-600 text-white" };
    case "accepting_preorders":
      return { label: "Accepting Pre-orders", classes: "bg-indigo-600 text-white" };
    default:
      return { label: "CLOSED", classes: "bg-rose-600 text-white" };
  }
};

type StoredLocation = {
  lat: number;
  lng: number;
  colony: string;
  pincode: string;
  address: string;
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

type SubNotification = {
  _id: string;
  type: string;
  message: string;
  icon: string;
  read: boolean;
  createdAt: string;
};

const HERO_BANNERS = [
  {
    id: 1,
    title: 'Fresh Daily Groceries & Organic Veggies',
    subtitle: 'Directly sourced from verified local farmers & delivered in 25 mins',
    discount: 'FLAT 30% OFF',
    code: 'LOCALGROCERY',
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1200&auto=format&fit=crop',
    gradient: 'from-emerald-700 via-teal-800 to-slate-950',
    tag: '🥦 FRESH HARVEST',
  },
  {
    id: 2,
    title: 'Pure Dairy, Fresh Milk & Bakery Delights',
    subtitle: 'Automated morning doorstep subscriptions before 7:00 AM',
    discount: 'FREE DOORSTEP DELIVERY',
    code: 'FRESHMILK',
    image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?q=80&w=1200&auto=format&fit=crop',
    gradient: 'from-amber-600 via-orange-700 to-slate-950',
    tag: '🥛 DAILY ESSENTIALS',
  },
  {
    id: 3,
    title: '24/7 Local Pharmacy & Health Supplies',
    subtitle: 'Prescription medicines, wellness products & first-aid kits delivered fast',
    discount: 'UP TO 20% CASHBACK',
    code: 'MEDSAVE',
    image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?q=80&w=1200&auto=format&fit=crop',
    gradient: 'from-blue-700 via-indigo-800 to-slate-950',
    tag: '💊 24/7 PHARMACY',
  },
  {
    id: 4,
    title: 'Neighborhood Supermarket Flash Sale',
    subtitle: 'Stock up on pantry staples, snacks & household cleaning essentials',
    discount: 'EXTRA ₹100 OFF',
    code: 'SUPERLOCAL',
    image: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?q=80&w=1200&auto=format&fit=crop',
    gradient: 'from-[#0A1128] via-purple-900 to-slate-950',
    tag: '⚡ FLASH DEALS',
  },
];

const shopCategories = [
  { key: "ALL", label: "All Shops", icon: "🏪" },
  { key: "Grocery", label: "Grocery & Supermarket", icon: "🛒" },
  { key: "Dairy", label: "Milk & Daily Essentials", icon: "🥛" },
  { key: "Fruits & Vegetables", label: "Fruits & Vegetables", icon: "🥦" },
  { key: "Bakery", label: "Bakery & Sweets", icon: "🍞" },
  { key: "Medical", label: "Pharmacy & Clinic", icon: "💊" },
  { key: "Water", label: "Water & Beverages", icon: "💧" },
  { key: "Services", label: "Home Services", icon: "🛠️" },
];

export const LocalStores: React.FC = () => {
  const navigate = useNavigate();

  // Hero Slider
  const [activeBanner, setActiveBanner] = useState(0);

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

  // Stores & API Data
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
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

  // Auto advance banner slider
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveBanner((prev) => (prev + 1) % HERO_BANNERS.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  // Sync stored location with live event listener
  useEffect(() => {
    const syncLocation = () => {
      try {
        const raw = localStorage.getItem("user_location") || localStorage.getItem("userLocation") || localStorage.getItem("apexbee_user_location");
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === "object") {
            setUserLocation(parsed);
            if (parsed.pincode) setManualPincode(parsed.pincode);
          }
        }
      } catch {
        // Ignore
      }
    };

    syncLocation();
    window.addEventListener("storage", syncLocation);
    // Auto-detect location if none stored
    if (!localStorage.getItem(LOCATION_KEY) && !localStorage.getItem("userLocation")) {
      getDeviceCoordinates()
        .then(coords => reverseGeocode(coords.lat, coords.lng))
        .then(result => {
          saveActiveLocation(result);
        })
        .catch(() => null);
    }

    return () => {
      window.removeEventListener("storage", syncLocation);
      window.removeEventListener("user_location_updated", syncLocation);
    };
  }, []);

  const handleSaveLocation = (loc: StoredLocation) => {
    setUserLocation(loc);
    try {
      localStorage.setItem(LOCATION_KEY, JSON.stringify(loc));
    } catch {
      // Ignore
    }
    if (loc.pincode) setManualPincode(loc.pincode);
    setOpenLocationModal(false);
    fetchNearbyStores(loc.lat, loc.lng, loc.pincode, radiusFilter, categoryFilter, sortFilter);
  };

  // Fetch nearby stores
  const fetchNearbyStores = useCallback(
    async (
      lat: number | null,
      lng: number | null,
      pincodeStr: string,
      radiusKm: number,
      category: string,
      sort: string
    ) => {
      setLoading(true);

      const params = new URLSearchParams();
      if (lat !== null && lng !== null) {
        params.append("lat", String(lat));
        params.append("lng", String(lng));
      }
      if (pincodeStr) {
        params.append("pincode", pincodeStr);
      }
      params.append("radius", String(radiusKm));
      if (category && category !== "ALL") {
        params.append("category", category);
      }
      if (sort) {
        params.append("sort", sort);
      }

      let json = await safeJsonFetch(`${API_BASE}/vendors/nearby?${params.toString()}`);
      if (!json || !json.success) {
        json = await safeJsonFetch(`${API_BASE}/vendor/nearby?${params.toString()}`);
      }

      if (json && json.success) {
        setStores(json.data || []);
      } else {
        setStores([]);
      }
      setLoading(false);
    },
    []
  );

  useEffect(() => {
    const lat = userLocation?.lat ?? null;
    const lng = userLocation?.lng ?? null;
    const activePin = (localStorage.getItem("userPincode") || manualPincode || userLocation?.pincode || localStorage.getItem("pincode") || "").toString().trim();
    fetchNearbyStores(lat, lng, activePin, radiusFilter, categoryFilter, sortFilter);
  }, [userLocation, manualPincode, radiusFilter, categoryFilter, sortFilter, fetchNearbyStores]);

  // Fetch subscriptions
  const fetchSubscriptions = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    setSubLoading(true);

    const subsJson = await safeJsonFetch(`${API_BASE}/local-shop/subscriptions`, { headers: { Authorization: `Bearer ${token}` } });

    if (subsJson && subsJson.success) {
      setSubscriptions(subsJson.subscriptions || []);
    }

    setSubLoading(false);
  }, []);

  useEffect(() => {
    if (mainTab === "subscriptions") {
      fetchSubscriptions();
    }
  }, [mainTab, fetchSubscriptions]);

  const handlePauseResume = async (subId: string, currentStatus: string) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const action = currentStatus === "active" ? "pause" : "resume";
    const json = await safeJsonFetch(`${API_BASE}/local-shop/subscriptions/${subId}/${action}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (json && json.success) {
      fetchSubscriptions();
    } else {
      alert(json?.message || `Failed to ${action} subscription.`);
    }
  };

  const currentBanner = HERO_BANNERS[activeBanner];

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
        (s.businessTypes || []).some((t: string) => t.toLowerCase().includes(categoryFilter.toLowerCase())) ||
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

  const activeSubs = useMemo(() => subscriptions.filter((s) => s.status === "active"), [subscriptions]);

  const locationLabel = useMemo(() => {
    if (!userLocation) return "Set delivery location";
    const colony = userLocation.colony?.trim();
    const pin = userLocation.pincode?.trim();
    if (colony && pin) return `${colony} - ${pin}`;
    if (pin) return pin;
    return "Location set";
  }, [userLocation]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">
      <Navbar />

      {/* DYNAMIC ANIMATED HERO SLIDER BANNER (MATCHING FOOD & DINING) */}
      <div className="relative bg-[#0A1128] text-white overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-500/15 rounded-full blur-[120px] pointer-events-none animate-pulse" />
        <div className="absolute -bottom-20 left-10 w-96 h-96 bg-orange-500/15 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-8 pb-12 relative z-10">
          {/* DYNAMIC LOCAL STORES HERO BANNER (Managed via Admin Panel) */}
          <DynamicHeroBanner placement="stores_hero" heightClass="h-[360px] sm:h-[420px] md:h-[480px]" />

          {/* SEARCH & LOCATION BAR */}
          <div className="mt-6 bg-white p-3 rounded-2xl shadow-2xl border border-slate-200 flex flex-col md:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search local stores, supermarkets, dairy, medicines, or pincode..."
                className="w-full pl-11 pr-4 py-2.5 bg-transparent text-sm text-slate-900 placeholder-slate-400 focus:outline-none font-medium"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
              <button
                onClick={() => setOpenLocationModal(true)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl flex items-center space-x-1.5 transition cursor-pointer"
              >
                <MapPin className="w-4 h-4 text-amber-500 shrink-0" />
                <span className="truncate max-w-[140px]">{locationLabel}</span>
              </button>

              <button
                onClick={() => {
                  const lat = userLocation?.lat ?? null;
                  const lng = userLocation?.lng ?? null;
                  const pincode = manualPincode || userLocation?.pincode || "";
                  fetchNearbyStores(lat, lng, pincode, radiusFilter, categoryFilter, sortFilter);
                }}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-lg transition cursor-pointer flex items-center space-x-1.5"
              >
                <RefreshCcw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* FLASH CASHBACK PROMO STRIP */}
      <div className="bg-amber-400 text-[#0A1128] font-extrabold text-xs py-2.5 text-center shadow-inner tracking-wide flex items-center justify-center space-x-2">
        <Sparkles className="w-4 h-4 animate-spin" />
        <span>Get Up To ₹100 Instant Wallet Cashback on Local Shop &amp; Daily Essential Orders • Code: APEXLOCAL</span>
      </div>

      {/* MAIN CONTAINER */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10 space-y-8">
        {/* VIEW SELECTOR & MAIN NAVIGATION TABS */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <button
              onClick={() => setMainTab("explore")}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center space-x-2 cursor-pointer ${mainTab === "explore"
                ? "bg-[#0A1128] text-amber-400 font-extrabold shadow-lg"
                : "text-slate-600 hover:bg-slate-100"
                }`}
            >
              <Store className="w-4 h-4" />
              <span>Explore Local Shops</span>
            </button>

            <button
              onClick={() => setMainTab("subscriptions")}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center space-x-2 cursor-pointer ${mainTab === "subscriptions"
                ? "bg-[#0A1128] text-amber-400 font-extrabold shadow-lg"
                : "text-slate-600 hover:bg-slate-100"
                }`}
            >
              <Package className="w-4 h-4" />
              <span>Daily Subscriptions</span>
              {activeSubs.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black">
                  {activeSubs.length}
                </span>
              )}
            </button>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <span className="text-xs text-slate-500 font-semibold">
              Delivering to <strong className="text-slate-900">{userLocation?.colony || "Your City"}</strong>
            </span>
          </div>
        </div>

        {/* EXPLORE SHOPS SECTION */}
        {mainTab === "explore" && (
          <div className="space-y-8 text-left">
            {/* CATEGORIES PILLS SLIDER */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-extrabold text-[#0A1128] font-heading flex items-center space-x-2">
                    <Store className="w-5 h-5 text-amber-500" />
                    <span>Explore Shop Categories</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">Filter neighborhood stores by product &amp; service type</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 overflow-x-auto pb-2 scrollbar-none">
                {shopCategories.map((c) => (
                  <button
                    key={c.key}
                    onClick={() => setCategoryFilter(c.key)}
                    className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition duration-300 flex items-center space-x-2 cursor-pointer shrink-0 border hover:-translate-y-0.5 ${categoryFilter === c.key
                      ? 'bg-[#0A1128] text-amber-400 border-[#0A1128] shadow-lg scale-105'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                  >
                    <span className="text-base">{c.icon}</span>
                    <span>{c.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* QUICK OUTLET FILTER PILLS BAR */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center space-x-2 text-xs font-bold flex-wrap gap-y-2">
                <button
                  onClick={() => setFilterOpenNow(!filterOpenNow)}
                  className={`px-3.5 py-1.5 rounded-xl border transition flex items-center space-x-1.5 cursor-pointer ${filterOpenNow ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm font-extrabold' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                >
                  <Check className={`w-3.5 h-3.5 ${filterOpenNow ? 'opacity-100' : 'opacity-30'}`} />
                  <span>Open Now</span>
                </button>

                <button
                  onClick={() => setFilterFreeDelivery(!filterFreeDelivery)}
                  className={`px-3.5 py-1.5 rounded-xl border transition flex items-center space-x-1.5 cursor-pointer ${filterFreeDelivery ? 'bg-blue-600 text-white border-blue-600 shadow-sm font-extrabold' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                >
                  <Check className={`w-3.5 h-3.5 ${filterFreeDelivery ? 'opacity-100' : 'opacity-30'}`} />
                  <span>Free Delivery</span>
                </button>

                <button
                  onClick={() => setFilterScheduledDelivery(!filterScheduledDelivery)}
                  className={`px-3.5 py-1.5 rounded-xl border transition flex items-center space-x-1.5 cursor-pointer ${filterScheduledDelivery ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm font-extrabold' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                >
                  <Check className={`w-3.5 h-3.5 ${filterScheduledDelivery ? 'opacity-100' : 'opacity-30'}`} />
                  <span>Scheduled Delivery</span>
                </button>

                <button
                  onClick={() => setFilterSubscription(!filterSubscription)}
                  className={`px-3.5 py-1.5 rounded-xl border transition flex items-center space-x-1.5 cursor-pointer ${filterSubscription ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-sm font-extrabold' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                >
                  <Check className={`w-3.5 h-3.5 ${filterSubscription ? 'opacity-100' : 'opacity-30'}`} />
                  <span>Subscriptions</span>
                </button>

                <button
                  onClick={() => setFilterOffers(!filterOffers)}
                  className={`px-3.5 py-1.5 rounded-xl border transition flex items-center space-x-1.5 cursor-pointer ${filterOffers ? 'bg-rose-500 text-white border-rose-500 shadow-sm font-extrabold' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                >
                  <Check className={`w-3.5 h-3.5 ${filterOffers ? 'opacity-100' : 'opacity-30'}`} />
                  <span>Offers</span>
                </button>

                <button
                  onClick={() => setFilterVerified(!filterVerified)}
                  className={`px-3.5 py-1.5 rounded-xl border transition flex items-center space-x-1.5 cursor-pointer ${filterVerified ? 'bg-cyan-600 text-white border-cyan-600 shadow-sm font-extrabold' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                >
                  <Check className={`w-3.5 h-3.5 ${filterVerified ? 'opacity-100' : 'opacity-30'}`} />
                  <span>Verified Stores</span>
                </button>
              </div>

              <div className="text-xs text-slate-500 font-semibold px-2">
                Found <span className="text-[#0A1128] font-black">{filteredStores.length}</span> Stores
              </div>
            </div>

            {/* STORES CARDS GRID (MATCHING FOOD & DINING STYLING) */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-80 bg-white rounded-3xl border border-slate-200 shadow animate-pulse" />
                ))}
              </div>
            ) : filteredStores.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 space-y-3 shadow-sm">
                <Store className="w-12 h-12 text-slate-300 mx-auto" />
                <h3 className="text-base font-extrabold text-slate-800">No Stores Found Nearby</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  We couldn't find local partner shops matching your filter criteria. Try adjusting your search or radius filters.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredStores.map((shop) => {
                  const availability = getStatusDisplay(shop.computedAvailability || "closed");
                  const defaultImage = 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?q=80&w=800&auto=format&fit=crop';
                  const displayImage = shop.storeDesign?.bannerUrl || shop.bannerImage || shop.logo || defaultImage;

                  const ratingAvg = shop.rating?.average || 4.8;
                  const firstOffer = shop.offers?.[0];
                  const isOpen = shop.computedAvailability === 'open' || shop.isOpen !== false;
                  const deliveryTime = `${shop.estimatedDeliveryMinutes || 25} mins`;

                  // Accurate store location calculation (avoiding hardcoded 'Hyderabad' fallback)
                  const locationText = (() => {
                    if (shop.locality && shop.locality.trim()) {
                      return shop.district && shop.district.toLowerCase() !== shop.locality.toLowerCase()
                        ? `${shop.locality}, ${shop.district}`
                        : shop.locality;
                    }
                    if (shop.mandal && shop.mandal.trim()) {
                      return shop.district && shop.district.toLowerCase() !== shop.mandal.toLowerCase()
                        ? `${shop.mandal}, ${shop.district}`
                        : shop.mandal;
                    }
                    if (shop.village && shop.village.trim()) {
                      return shop.district ? `${shop.village}, ${shop.district}` : shop.village;
                    }
                    if (shop.district && shop.district.trim()) {
                      return shop.district.trim();
                    }
                    if (shop.city && shop.city.trim()) {
                      return shop.city.trim();
                    }
                    if (shop.address && typeof shop.address === "string") {
                      const parts = shop.address.split(',').map((s: string) => s.trim()).filter(Boolean);
                      if (parts.length > 0) {
                        return parts.slice(-2).join(', ');
                      }
                    }
                    if (shop.pincode || shop.pinCode) {
                      return `PIN ${shop.pincode || shop.pinCode}`;
                    }
                    return shop.state || "Local Store";
                  })();

                  // Accurate distance calculation
                  const distanceText = (() => {
                    if (userLocation?.lat && userLocation?.lng && shop.location?.coordinates && Array.isArray(shop.location.coordinates) && shop.location.coordinates.length === 2) {
                      const [shopLng, shopLat] = shop.location.coordinates;
                      if (shopLat && shopLng && !isNaN(Number(shopLat)) && !isNaN(Number(shopLng))) {
                        const R = 6371;
                        const dLat = (Number(shopLat) - userLocation.lat) * (Math.PI / 180);
                        const dLon = (Number(shopLng) - userLocation.lng) * (Math.PI / 180);
                        const a =
                          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                          Math.cos(userLocation.lat * (Math.PI / 180)) * Math.cos(Number(shopLat) * (Math.PI / 180)) *
                          Math.sin(dLon / 2) * Math.sin(dLon / 2);
                        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                        const d = R * c;
                        return `${d.toFixed(1)} km`;
                      }
                    }
                    if (typeof shop.distanceInKm === 'number' && shop.searchMode === 'gps') {
                      return `${shop.distanceInKm.toFixed(1)} km`;
                    }
                    if (shop.pincode || shop.pinCode) {
                      return `PIN: ${shop.pincode || shop.pinCode}`;
                    }
                    return "Local Outlet";
                  })();

                  return (
                    <div
                      key={shop._id}
                      onClick={() => navigate(`/business/${shop._id}`)}
                      className="group bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-md hover:shadow-2xl hover:border-amber-400 transition-all duration-500 hover:-translate-y-1 flex flex-col justify-between cursor-pointer"
                    >
                      <div>
                        {/* BANNER COVER */}
                        <div className="h-48 bg-slate-100 relative overflow-hidden">
                          <img
                            src={displayImage}
                            alt={shop.businessName}
                            className="w-full h-full object-cover group-hover:scale-110 transition duration-700"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20" />

                          {/* CLOSED OVERLAY */}
                          {!isOpen && (
                            <div className="absolute inset-0 bg-slate-900/60 z-[5] flex items-center justify-center">
                              <div className="bg-rose-600/90 text-white px-4 py-2 rounded-2xl font-black text-sm shadow-xl border border-rose-400/50 backdrop-blur-sm">
                                🚫 CURRENTLY CLOSED
                              </div>
                            </div>
                          )}

                          {/* STATUS & OFFER BADGES */}
                          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase shadow-md ${availability.classes}`}>
                              {availability.label}
                            </span>

                            {firstOffer && (
                              <span className="px-2.5 py-0.5 bg-amber-500 text-[#0A1128] rounded-full font-black text-[10px] shadow-md flex items-center space-x-1">
                                <Tag className="w-3 h-3" />
                                <span>{firstOffer.title}</span>
                              </span>
                            )}
                          </div>

                          {/* RATING BADGE */}
                          <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-xl text-xs font-black text-amber-600 flex items-center space-x-1 shadow-md border border-amber-200 z-10">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            <span>{ratingAvg}</span>
                          </div>
                        </div>

                        {/* BODY DETAILS */}
                        <div className="p-5 space-y-3">
                          <div>
                            <div className="flex items-center justify-between">
                              <h3 className="font-black text-lg text-[#0A1128] group-hover:text-amber-600 transition font-heading truncate">
                                {shop.businessName}
                              </h3>
                              {(shop.verifiedBadge || shop.isVerified) && (
                                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" title="Verified Store" />
                              )}
                            </div>

                            <p className="text-xs text-slate-500 mt-0.5 line-clamp-1 font-medium">
                              {shop.industryType || shop.businessTypes?.join(', ') || 'Local Store & Daily Essentials'}
                            </p>
                          </div>

                          <div className="flex items-center justify-between text-xs text-slate-600 pt-3 border-t border-slate-100 font-semibold gap-2">
                            <div className="flex items-center space-x-1 shrink-0">
                              <Clock className="w-3.5 h-3.5 text-amber-500" />
                              <span>{deliveryTime}</span>
                            </div>
                            <div className="flex items-center space-x-1 truncate max-w-[65%] justify-end" title={`${distanceText} • ${locationText}`}>
                              <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                              <span className="truncate">{distanceText} • {locationText}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* BOTTOM ORDER BUTTON */}
                      <div className="px-5 pb-5 pt-1">
                        {isOpen ? (
                          <div className="w-full py-2.5 bg-slate-100 group-hover:bg-[#0A1128] text-slate-800 group-hover:text-amber-400 font-black text-xs rounded-2xl transition duration-300 text-center flex items-center justify-center space-x-1 shadow-sm">
                            <span>Explore Store &amp; Order</span>
                            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                          </div>
                        ) : (
                          <div className="w-full py-2.5 bg-rose-50 text-rose-600 border border-rose-200 font-black text-xs rounded-2xl text-center flex items-center justify-center space-x-1">
                            <span>🚫 Currently Closed — View Catalog</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* SUBSCRIPTIONS TAB SECTION */}
        {mainTab === "subscriptions" && (
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm text-left space-y-6">
            <div>
              <h3 className="text-lg font-black text-[#0A1128]">Daily Doorstep Subscriptions</h3>
              <p className="text-xs text-slate-500">Automated daily/weekly milk, grocery, water, and fresh essential deliveries</p>
            </div>

            {subLoading ? (
              <div className="py-12 text-center text-xs text-slate-500">Loading your subscription plans...</div>
            ) : subscriptions.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500 italic">No active product subscriptions found.</div>
            ) : (
              <div className="space-y-4">
                {subscriptions.map((sub) => (
                  <div key={sub._id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between text-xs">
                    <div>
                      <div className="font-extrabold text-slate-900">{sub.productName || 'Daily Subscription'}</div>
                      <div className="text-[11px] text-slate-500">Frequency: {sub.frequency} • Slot: {sub.deliverySlot}</div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${sub.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {sub.status}
                      </span>
                      <button
                        onClick={() => handlePauseResume(sub._id, sub.status)}
                        className="px-3 py-1 bg-slate-900 text-white rounded-xl text-xs font-bold"
                      >
                        {sub.status === 'active' ? 'Pause' : 'Resume'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <LocationModal
        open={openLocationModal}
        onOpenChange={setOpenLocationModal}
        onSelectLocation={handleSaveLocation}
      />

      <Footer />
    </div>
  );
};

export default LocalStores;
