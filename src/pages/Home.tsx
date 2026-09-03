import { useEffect, useMemo, useState, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  MapPin,
  Flame,
  Sparkles,
  Store,
  Search,
  Bell,
  BookOpen,
  Gift,
  Share2,
  Compass,
  Users,
  Volume2,
  TrendingUp,
  Award,
  ShoppingBag,
  Briefcase as ToolIcon,
  Clock,
  Coins,
  Utensils,
  HeartPulse,
  Shirt,
  Smartphone,
  Plane,
  Truck,
  Tag,
  BadgePercent,
  AlertTriangle,
  Wallet as WalletIcon,
  Star,
  ShieldCheck,
  ShoppingCart,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { trackCategoryClick } from "../utils/categoryAnalytics";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LocationModal from "@/components/LocationModal";
import SupportDrawer from "@/components/SupportDrawer";
import ProductCard from "@/components/ProductCard";
import { ApexBeeWelcomeIntro } from "../components/welcome-intro/ApexBeeWelcomeIntro";
import { DynamicHeroBanner } from "@/components/DynamicHeroBanner";
import { DynamicBannerStrip } from "@/components/DynamicBannerStrip";
const logo = "/logo.png";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const API_BASE = import.meta.env.VITE_API_URL || "https://server.apexbee.in/api";
const API_ORIGIN = import.meta.env.VITE_API_ORIGIN || "https://server.apexbee.in";
const LOCATION_KEY = "user_location";

/** ---------------------------
 * Types
 * -------------------------- */
type CategoryItem = {
  id: string;
  label: string;
  to: string;
  image?: string;
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
  createdAt?: string;
  rating?: string;
  category?: string;
};

type Product = {
  _id: string;
  itemName?: string;
  name?: string;
  brand?: string;
  sku?: string;
  thumbnail?: string;
  images?: string[];
  afterDiscount?: number | string | null;
  userPrice?: number | string | null;
  discount?: number | string | null;
  baseMrp?: number | string | null;
  baseSellingPrice?: number | string | null;
  discountPercent?: number | string | null;
  stock?: number | string | null;
  status?: string;
  isActive?: boolean;
  adminPricing?: {
    mrp?: number;
    sellingPrice?: number;
    customerSellingAmount?: number;
    shippingCharge?: number;
    packingCharge?: number;
    platformFeeAmount?: number;
    finalSellerAmount?: number;
  };
  categoryId?: any;
  subCategoryId?: any;
  childCategoryId?: any;
  rating?: number;
  ratings?: number;
  reviews?: number;
  numberOfRatings?: number;
  tag?: string;
  calculatedDistanceKm?: number;
  estimatedDeliveryMinutes?: number;
  deliveryMode?: string;
};

/** ---------------------------
 * Helpers
 * -------------------------- */
const onlyDigits = (s: any) => String(s ?? "").replace(/\D/g, "");
const normPincode = (p: any) => onlyDigits(p).slice(0, 6);

const toNumber = (v: any) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const formatINR = (n: number) => `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

const getImageUrl = (url?: string) => {
  if (!url) return "/placeholder-product.png";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${API_ORIGIN}${url}`;
};

const flattenCategoryTree = (items: any[] = []) => {
  const result: CategoryItem[] = [];

  const walk = (list: any[]) => {
    list.forEach((cat) => {
      const name = String(cat?.name || "Category");
      result.push({
        id: cat._id,
        label: name.length ? name.charAt(0).toUpperCase() + name.slice(1) : "Category",
        to: `/category/${encodeURIComponent(name)}`,
        image: getImageUrl(cat.image),
      });
    });
  };

  walk(items);
  return result;
};

/**
 * ✅ Price logic supports both old product fields and new ApexBee product model.
 * Priority:
 * 1) adminPricing.customerSellingAmount
 * 2) adminPricing.sellingPrice + shipping + packing
 * 3) afterDiscount
 * 4) baseSellingPrice
 * 5) userPrice
 */
const getDisplayPrices = (p: Product) => {
  const admin = p.adminPricing;

  const adminSelling = toNumber(admin?.sellingPrice);
  const baseSelling = toNumber(p.baseSellingPrice);
  const sellingProp = toNumber((p as any).sellingPrice);
  const priceProp = toNumber((p as any).price);
  const after = toNumber(p.afterDiscount);

  // Base product selling price without bundled delivery/packing fees
  const price =
    adminSelling ||
    baseSelling ||
    sellingProp ||
    (after > 0 ? after : 0) ||
    priceProp ||
    0;

  const mrp =
    toNumber(admin?.mrp) ||
    toNumber(p.baseMrp) ||
    toNumber(p.userPrice) ||
    toNumber((p as any).mrp) ||
    toNumber((p as any).originalPrice) ||
    0;

  const percentOff =
    mrp > price && mrp > 0 ? Math.round(((mrp - price) / mrp) * 100) : 0;

  return { price, mrp: mrp > price ? mrp : 0, percentOff };
};

const getProductTitle = (p: Product) => p.itemName || p.name || "Product";

const getProductImage = (p: Product) =>
  getImageUrl(p.thumbnail || p.images?.[0] || "");

const getProductCategoryLabel = (p: Product) =>
  [
    p.categoryId?.name,
    p.subCategoryId?.name,
    p.childCategoryId?.name,
  ]
    .filter(Boolean)
    .join(" / ");

const INTRO_STORAGE_KEY = "apexbee-welcome-intro-viewed-v1";

// Helper to detect if the page was reloaded/refreshed
const isPageRefresh = () => {
  if (typeof window === "undefined") return false;
  try {
    const navEntries = window.performance?.getEntriesByType?.("navigation");
    if (navEntries && navEntries.length > 0) {
      return (navEntries[0] as PerformanceNavigationTiming).type === "reload";
    }
    // Fallback for older browsers
    return window.performance?.navigation?.type === 1;
  } catch (e) {
    return false;
  }
};

const Home = () => {
  const navigate = useNavigate();

  const [showIntro, setShowIntro] = useState(() => {
    if (typeof window === "undefined") return false;
    const params = new URLSearchParams(window.location.search);
    if (params.get("showIntro") === "true") {
      return true;
    }
    // If it's a page refresh, do not show the welcome animation
    if (isPageRefresh()) {
      sessionStorage.setItem(INTRO_STORAGE_KEY, "true");
      return false;
    }
    return sessionStorage.getItem(INTRO_STORAGE_KEY) !== "true";
  });

  const handleIntroComplete = useCallback(() => {
    sessionStorage.setItem(INTRO_STORAGE_KEY, "true");
    setShowIntro(false);
  }, []);

  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  const [loggedInUser, setLoggedInUser] = useState<any>(null);

  const [openLocationModal, setOpenLocationModal] = useState(false);
  const [userLocation, setUserLocation] = useState<any | null>(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Nearby shops
  const [nearbyShops, setNearbyShops] = useState<Business[]>([]);
  const [shopsLoading, setShopsLoading] = useState(false);
  const [shopsError, setShopsError] = useState<string | null>(null);

  // Featured / Deals products
  const [featuredLoading, setFeaturedLoading] = useState(false);
  const [dealsLoading, setDealsLoading] = useState(false);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [dealProducts, setDealProducts] = useState<Product[]>([]);

  // Slider state
  const [currentSlide, setCurrentSlide] = useState(0);
  const [recentlyViewed, setRecentlyViewed] = useState<any[]>([]);
  const [academyCourses, setAcademyCourses] = useState<any[]>([]);

  // Insufficient subscription wallet funds warning state
  const [insufficientSubWarning, setInsufficientSubWarning] = useState<{
    productName: string;
    nextDeliveryDate: string;
    deliverySlot: string;
    requiredAmount: string;
    walletBalance: string;
    shortfall: string;
  } | null>(null);

  const [activeUserSubscriptions, setActiveUserSubscriptions] = useState<any[]>([]);

  const checkInsufficientSubscriptionFunds = async () => {
    const token = localStorage.getItem("token");
    const userRaw = localStorage.getItem("user");
    if (!token || !userRaw) {
      setActiveUserSubscriptions([]);
      return;
    }

    try {
      const u = JSON.parse(userRaw);
      const uid = u._id || u.id;
      if (!uid) return;

      const headers = { Authorization: `Bearer ${token}` };

      let walletBalance = 0;
      try {
        const walletRes = await fetch(`${API_BASE}/user/wallet/${uid}`, { headers });
        const walletData = await walletRes.json();
        walletBalance = Number(walletData?.walletBalance ?? walletData?.wallet?.balance ?? walletData?.balance ?? 0);
      } catch (e) {
        console.error("Wallet check error:", e);
      }

      let subscriptions: any[] = [];
      try {
        const subRes = await fetch(`${API_BASE}/local-shop/subscriptions/${uid}`, { headers });
        const subData = await subRes.json();
        subscriptions = subData?.subscriptions || subData?.data || [];
      } catch (e) {
        console.error("Subscriptions check error:", e);
      }

      if (!subscriptions || subscriptions.length === 0) {
        setActiveUserSubscriptions([]);
        setInsufficientSubWarning(null);
        return;
      }

      const activeSubs = subscriptions.filter((s: any) => s.status !== "paused" && s.status !== "cancelled" && s.status !== "inactive");
      setActiveUserSubscriptions(activeSubs);

      const todayStr = new Date().toISOString().split("T")[0];
      const tomorrowObj = new Date();
      tomorrowObj.setDate(tomorrowObj.getDate() + 1);
      const tomorrowStr = tomorrowObj.toISOString().split("T")[0];

      let warningFound: any = null;

      for (const sub of subscriptions) {
        if (sub.status === "paused" || sub.status === "cancelled") continue;

        const quantity = Number(sub.quantity || 1);
        const unitPrice = Number(sub.unitPrice || 0);
        const requiredAmount = Number((quantity * unitPrice).toFixed(2));

        if (requiredAmount > 0 && walletBalance < requiredAmount) {
          const shortfall = Number((requiredAmount - walletBalance).toFixed(2));

          const isTodayScheduled = (sub.calendarHistory || []).some(
            (h: any) => h.date === todayStr && h.status !== "Skipped" && h.status !== "Delivered"
          );
          const isTomorrowScheduled = (sub.calendarHistory || []).some(
            (h: any) => h.date === tomorrowStr
          );

          const scheduledLabel = isTodayScheduled
            ? "Today's Delivery Run"
            : isTomorrowScheduled
              ? "Tomorrow's Delivery Run"
              : "Upcoming Delivery Run";

          warningFound = {
            productName: sub.productName || "Daily Subscription Product",
            nextDeliveryDate: scheduledLabel,
            deliverySlot: sub.deliverySlot || "Morning Shift",
            requiredAmount: requiredAmount.toFixed(2),
            walletBalance: walletBalance.toFixed(2),
            shortfall: shortfall.toFixed(2)
          };
          break;
        }
      }

      setInsufficientSubWarning(warningFound);
    } catch (e) {
      console.error("Error checking subscription wallet funds:", e);
    }
  };

  useEffect(() => {
    checkInsufficientSubscriptionFunds();
    const interval = setInterval(checkInsufficientSubscriptionFunds, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    try {
      const items = JSON.parse(localStorage.getItem("mock_recently_viewed") || "[]");
      setRecentlyViewed(items);
    } catch {
      // ignore
    }
  }, []);

  const [buyAgainProducts, setBuyAgainProducts] = useState<Product[]>([]);
  const [buyAgainLoading, setBuyAgainLoading] = useState(false);

  const fetchBuyAgainProducts = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setBuyAgainProducts([]);
      return;
    }
    try {
      setBuyAgainLoading(true);
      let url = `${API_BASE}/products/buy-again`;
      const queryParams = [];
      if (userLocation?.lat && userLocation?.lng) {
        queryParams.push(`lat=${userLocation.lat}`);
        queryParams.push(`lng=${userLocation.lng}`);
      } else if (userLocation?.pincode) {
        queryParams.push(`pincode=${userLocation.pincode}`);
      }
      if (queryParams.length > 0) {
        url += `?${queryParams.join("&")}`;
      }
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setBuyAgainProducts(data.products || []);
      }
    } catch (err) {
      console.error("fetchBuyAgainProducts error:", err);
    } finally {
      setBuyAgainLoading(false);
    }
  };

  useEffect(() => {
    if (loggedInUser) {
      fetchBuyAgainProducts();
    } else {
      setBuyAgainProducts([]);
    }
  }, [loggedInUser, userLocation]);

  const [dbBanners, setDbBanners] = useState<any[]>([]);
  const [supportOpen, setSupportOpen] = useState(false);

  // Dynamic time-of-day calculation based on user's current local hour
  const getInitialGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 12) {
      return {
        greeting: "Good Morning ☀",
        offer: "Fresh Morning Specials! Milk & Breakfast items delivered in 15 mins.",
        title: "Fresh Milk Deal",
        emoji: "🥛"
      };
    } else if (hour >= 12 && hour < 17) {
      return {
        greeting: "Good Afternoon 🌤",
        offer: "Lunch Combos & Fresh Juices from local diners near you.",
        title: "Lunch Combo Deal",
        emoji: "🍱"
      };
    } else if (hour >= 17 && hour < 22) {
      return {
        greeting: "Good Evening 🌇",
        offer: "Dinner Specials & Snack Platters from top local merchants.",
        title: "Snacks & Tea Offer",
        emoji: "🍕"
      };
    } else {
      return {
        greeting: "Good Night 🌙",
        offer: "Late-night cravings? Order snacks, desserts, or medicines instantly.",
        title: "Night Cravings Offer",
        emoji: "🌙"
      };
    }
  };

  const initialGreetingData = getInitialGreeting();
  const [timeGreeting, setTimeGreeting] = useState(initialGreetingData.greeting);
  const [greetingOffer, setGreetingOffer] = useState(initialGreetingData.offer);
  const [milkCountdown, setMilkCountdown] = useState("01:59:59");
  const [hasActiveOrder, setHasActiveOrder] = useState(false);
  const [festivalBanner, setFestivalBanner] = useState<any | null>(null);
  const [activeTracking, setActiveTracking] = useState<any | null>(null);
  const [personalization, setPersonalization] = useState<any>(null);
  const [offerTitle, setOfferTitle] = useState(initialGreetingData.title);
  const [offerEmoji, setOfferEmoji] = useState(initialGreetingData.emoji);
  const [petProducts, setPetProducts] = useState<Product[]>([]);
  const [kidsProducts, setKidsProducts] = useState<Product[]>([]);
  const [dbProducts, setDbProducts] = useState<any[]>([]);

  // Rotate Meal & Restaurant Specials dynamically based on current time-of-day wish
  const foodMealDetails = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 12) {
      return {
        badge: "☕ Morning Tiffins & Breakfast",
        title: "Breakfast & Morning Specials Nearby",
        subtitle: "Fresh idlis, hot vadas, crispy dosas, tea & morning breakfast tiffins delivered in 20 mins",
        heroTag: "⚡ Fresh Breakfast Delivered",
        heroHeading: "Craving Hot Breakfast?",
        heroDesc: "Order fresh Idli, Dosa, Poori, Vada & Filter Coffee from top local tiffin centers.",
        heroButton: "☕ Order Breakfast Now →"
      };
    } else if (hour >= 12 && hour < 17) {
      return {
        badge: "🍱 Afternoon Lunch Specials",
        title: "Lunch Specials & Thalis Nearby",
        subtitle: "Aromatic Biryanis, executive lunch combos & full thali meals delivered hot in 25 mins",
        heroTag: "⚡ Express Lunch Delivery",
        heroHeading: "Craving Delicious Lunch?",
        heroDesc: "Order authentic Biryanis, Veg/Non-Veg Meals, Rice Bowls & fresh juices near you.",
        heroButton: "🍱 Order Lunch Now →"
      };
    } else if (hour >= 17 && hour < 22) {
      return {
        badge: "🍕 Evening Dinner & Snacks",
        title: "Dinner Specials & Snacks Nearby",
        subtitle: "Piping hot dinners, tandoori, biryanis, curries & evening snack platters delivered in 25 mins",
        heroTag: "⚡ 30-Min Dinner Delivery",
        heroHeading: "Craving Hot Dinner?",
        heroDesc: "Order Biryanis, Pizzas, Burgers, Shawarmas & North/South Indian dinner platters.",
        heroButton: "🍽️ Order Dinner Now →"
      };
    } else {
      return {
        badge: "🌙 Midnight Food & Munchies",
        title: "Late Night Cravings & Specials Nearby",
        subtitle: "Midnight biryani, rolls, pizzas, desserts & late night cravings delivered instantly",
        heroTag: "⚡ Late Night Food Delivery",
        heroHeading: "Late Night Cravings?",
        heroDesc: "Order midnight snacks, hot desserts, fries & quick meals from open late-night kitchens.",
        heroButton: "🌙 Order Night Cravings →"
      };
    }
  }, []);

  const buildLocationParams = useCallback(() => {
    const loc = userLocation || (() => {
      try {
        return JSON.parse(localStorage.getItem("user_location") || localStorage.getItem(LOCATION_KEY) || "null");
      } catch {
        return null;
      }
    })();

    const params = new URLSearchParams();
    if (loc?.lat && loc?.lng) {
      params.append("lat", String(loc.lat));
      params.append("lng", String(loc.lng));
    } else if (loc?.pincode) {
      params.append("pincode", String(loc.pincode));
    }
    if (loc?.mandal) params.append("mandal", loc.mandal);
    if (loc?.district) params.append("district", loc.district);
    return params.toString();
  }, [userLocation]);

  useEffect(() => {
    const fetchDbProducts = async () => {
      try {
        const locParams = buildLocationParams();
        const url = `${API_BASE}/products?limit=20${locParams ? `&${locParams}` : ''}`;
        const res = await fetch(url);
        if (res.ok) {
          const json = await res.json();
          const list = Array.isArray(json?.products) ? json.products : Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : [];

          const filtered = list.filter((p: any) => {
            const isLive = (p.status === "Live" || p.status === "Active" || p.status === "Approved") && p.isActive !== false;
            if (!isLive) return false;
            const isPan = p.isPanIndia || p.deliveryScope === 'pan_india' || p.deliveryScope === 'both';
            if (isPan) return true;
            if (!userLocation?.pincode && !userLocation?.lat) return true;
            const vendorPin = p.vendorPincode || p.sellerId?.pincode;
            if (userLocation?.pincode && vendorPin && String(userLocation.pincode).trim() === String(vendorPin).trim()) return true;
            if (p.calculatedDistanceKm !== null && p.calculatedDistanceKm !== undefined) return p.calculatedDistanceKm <= 20;
            return false;
          });

          setDbProducts(filtered);
        }
      } catch (e) {
        console.error("fetchDbProducts error:", e);
      }
    };
    fetchDbProducts();
  }, [userLocation, buildLocationParams]);

  const continueShoppingProducts = useMemo(() => {
    if (personalization?.continueShopping && personalization.continueShopping.length > 0) {
      return personalization.continueShopping;
    }
    return [];
  }, [personalization]);

  const homeServices = useMemo(() => {
    return personalization?.featuredServices || [];
  }, [personalization]);


  const homeRestaurants = useMemo(() => {
    return personalization?.restaurants || [];
  }, [personalization]);

  const fetchPersonalization = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers: any = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      const res = await fetch(`${API_BASE}/home/personalization`, { headers });
      const data = await res.json();
      if (data.success) {
        setPersonalization(data);
      }
    } catch (err) {
      console.error("fetchPersonalization error:", err);
    }
  };

  const fetchCourses = async () => {
    try {
      const res = await fetch(`${API_BASE}/courses`);
      const data = await res.json();
      if (data.success && data.courses) {
        setAcademyCourses(data.courses);
      }
    } catch (err) {
      console.error("fetchCourses error:", err);
    }
  };

  const fetchPetAndKidsProducts = async () => {
    try {
      const locParams = buildLocationParams();
      const url = `${API_BASE}/products?limit=50${locParams ? `&${locParams}` : ''}`;
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        const list = Array.isArray(json?.products) ? json.products : Array.isArray(json?.data) ? json.data : [];
        const liveList = list.filter((p: any) => p.status === "Live" && p.isActive !== false);

        const pets = liveList.filter((p: any) => {
          const cat = (p.category || p.categoryName || "").toLowerCase();
          const name = (p.name || p.title || "").toLowerCase();
          const tags = Array.isArray(p.tags) ? p.tags.join(" ").toLowerCase() : "";
          return cat.includes("pet") || name.includes("dog") || name.includes("cat") || name.includes("pet") || tags.includes("pet");
        });

        const kids = liveList.filter((p: any) => {
          const cat = (p.category || p.categoryName || "").toLowerCase();
          const name = (p.name || p.title || "").toLowerCase();
          const tags = Array.isArray(p.tags) ? p.tags.join(" ").toLowerCase() : "";
          return cat.includes("kid") || cat.includes("toy") || name.includes("kid") || name.includes("toy") || name.includes("baby") || name.includes("child") || tags.includes("kids");
        });

        setPetProducts(pets);
        setKidsProducts(kids);
      }
    } catch (err) {
      console.error("fetchPetAndKidsProducts error:", err);
    }
  };

  const [dailyNeedsProducts, setDailyNeedsProducts] = useState<Product[]>([]);
  const [devotionalProducts, setDevotionalProducts] = useState<Product[]>([]);
  const [foodProducts, setFoodProducts] = useState<Product[]>([]);
  const [shoppingProducts, setShoppingProducts] = useState<Product[]>([]);

  const fetchCategoryProducts = async () => {
    try {
      const locParams = buildLocationParams();
      const url = `${API_BASE}/products?limit=100${locParams ? `&${locParams}` : ''}`;
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        const list = Array.isArray(json?.products) ? json.products : Array.isArray(json?.data) ? json.data : [];
        const liveList = list.filter((p: any) => {
          const isLive = (p.status === "Live" || p.status === "Active" || p.status === "Approved") && p.isActive !== false;
          if (!isLive) return false;
          const isPan = p.isPanIndia || p.deliveryScope === 'pan_india' || p.deliveryScope === 'both';
          if (isPan) return true;
          if (!userLocation?.pincode && !userLocation?.lat) return true;
          const vendorPin = p.vendorPincode || p.sellerId?.pincode;
          if (userLocation?.pincode && vendorPin && String(userLocation.pincode).trim() === String(vendorPin).trim()) return true;
          if (p.calculatedDistanceKm !== null && p.calculatedDistanceKm !== undefined) return p.calculatedDistanceKm <= 20;
          return false;
        });

        const daily = liveList.filter((p: any) => {
          const cat = (p.category || p.categoryName || "").toLowerCase();
          const name = (p.name || p.title || "").toLowerCase();
          return cat.includes("daily") || cat.includes("grocery") || name.includes("milk") || name.includes("water") || name.includes("vegetable") || name.includes("atta");
        });

        const dev = liveList.filter((p: any) => {
          const cat = (p.category || p.categoryName || "").toLowerCase();
          const name = (p.name || p.title || "").toLowerCase();
          return cat.includes("devotional") || cat.includes("puja") || cat.includes("pooja") || name.includes("agarbatti") || name.includes("flower") || name.includes("camphor");
        });

        const food = liveList.filter((p: any) => {
          const cat = (p.category || p.categoryName || "").toLowerCase();
          const name = (p.name || p.title || "").toLowerCase();
          return cat.includes("food") || cat.includes("dining") || cat.includes("restaurant") || name.includes("biryani") || name.includes("dosa") || name.includes("pizza");
        });

        const shopping = liveList.filter((p: any) => {
          const cat = (p.category || p.categoryName || "").toLowerCase();
          const name = (p.name || p.title || "").toLowerCase();
          return cat.includes("shopping") || cat.includes("fashion") || cat.includes("saree") || name.includes("shirt") || name.includes("dress") || name.includes("saree");
        });

        setDailyNeedsProducts(daily.slice(0, 10));
        setDevotionalProducts(dev.slice(0, 10));
        setFoodProducts(food.slice(0, 10));
        setShoppingProducts(shopping.slice(0, 10));
      }
    } catch (err) {
      console.error("fetchCategoryProducts error:", err);
    }
  };

  useEffect(() => {
    fetchPersonalization();
    fetchCourses();
    fetchPetAndKidsProducts();
    fetchCategoryProducts();
  }, [loggedInUser, userLocation]);

  // Dynamic Greeting & Timer Effect
  useEffect(() => {
    const fetchBannersAndTracking = async () => {
      try {
        const res = await fetch(`${API_BASE}/banners`);
        const data = await res.json();
        if (data.success && data.data) {
          const activeBanners = data.data;

          // Find festival banner
          const fest = activeBanners.find((b: any) => b.type === "festival" && b.isActive);
          if (fest) {
            setFestivalBanner(fest);
          } else {
            setFestivalBanner(null);
          }

          // Process time-of-day greetings from DB banners if they exist
          const hour = new Date().getHours();
          let currentType = "morning";
          if (hour >= 12 && hour < 17) currentType = "afternoon";
          else if (hour >= 17 && hour < 22) currentType = "evening";
          else if (hour >= 22 || hour < 4) currentType = "night";

          const matchingGreeting = activeBanners.find((b: any) => b.type === currentType && b.isActive);
          if (matchingGreeting) {
            setTimeGreeting(matchingGreeting.title);
            setGreetingOffer(matchingGreeting.description);

            // Set dynamic offer details based on matchingGreeting
            setOfferTitle(matchingGreeting.discount ? `${matchingGreeting.discount} Offer` : "Special Flash Deal");

            if (currentType === "morning") setOfferEmoji("🥛");
            else if (currentType === "afternoon") setOfferEmoji("🍱");
            else if (currentType === "evening") setOfferEmoji("🍕");
            else if (currentType === "night") setOfferEmoji("🌙");
            else setOfferEmoji("🔥");

            if (matchingGreeting.countdownHours > 0) {
              startMilkTimer(matchingGreeting.countdownHours * 60 * 60);
            } else {
              setMilkCountdown("");
            }
          } else {
            // fallback to precise time-based greeting logic
            if (hour >= 4 && hour < 12) {
              setTimeGreeting("Good Morning ☀");
              setGreetingOffer("Fresh Morning Specials! Milk & Breakfast items delivered in 15 mins.");
              setOfferTitle("Fresh Milk Deal");
              setOfferEmoji("🥛");
              startMilkTimer(2 * 60 * 60);
            } else if (hour >= 12 && hour < 17) {
              setTimeGreeting("Good Afternoon 🌤");
              setGreetingOffer("Lunch Combos & Fresh Juices from local diners near you.");
              setOfferTitle("Lunch Combo Deal");
              setOfferEmoji("🍱");
              setMilkCountdown("");
            } else if (hour >= 17 && hour < 22) {
              setTimeGreeting("Good Evening 🌇");
              setGreetingOffer("Dinner Specials & Snack Platters from top local merchants.");
              setOfferTitle("Snacks & Tea Offer");
              setOfferEmoji("🍕");
              setMilkCountdown("");
            } else {
              setTimeGreeting("Good Night 🌙");
              setGreetingOffer("Late-night cravings? Order snacks, desserts, or medicines instantly.");
              setOfferTitle("Night Cravings Offer");
              setOfferEmoji("🌙");
              setMilkCountdown("");
            }
          }
        }
      } catch (err) {
        console.error("Failed to load banners:", err);
      }

      try {
        const userStr = localStorage.getItem("user");
        if (userStr) {
          const user = JSON.parse(userStr);
          const userId = user.id || user._id;
          const token = localStorage.getItem("token");
          if (token) {
            // 1. Fetch user's actual orders
            const ordersRes = await fetch(`${API_BASE}/orders/user/${userId}?limit=5`, {
              headers: {
                Authorization: `Bearer ${token}`
              }
            });
            const ordersData = await ordersRes.json();
            let matchedActiveOrder = null;
            if (ordersData.success && ordersData.data && ordersData.data.length > 0) {
              // Find the most recent active order
              matchedActiveOrder = ordersData.data.find((o: any) =>
                !['Delivered', 'Completed', 'Cancelled', 'Returned', 'Refunded'].includes(o.orderStatus)
              );
            }

            // Only show tracking for real active orders — no mock data
            if (matchedActiveOrder) {
              const res = await fetch(`${API_BASE}/order-tracking/${matchedActiveOrder._id}`, {
                headers: {
                  Authorization: `Bearer ${token}`
                }
              });
              const data = await res.json();
              if (data.success && data.data) {
                setActiveTracking(data.data);
                setHasActiveOrder(true);
              }
            } else {
              setHasActiveOrder(false);
              setActiveTracking(null);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load active tracking:", err);
      }
    };

    let timerInterval: any = null;
    const startMilkTimer = (seconds: number) => {
      if (timerInterval) clearInterval(timerInterval);
      let totalSeconds = seconds;
      timerInterval = setInterval(() => {
        totalSeconds--;
        if (totalSeconds <= 0) {
          clearInterval(timerInterval);
          setMilkCountdown("Offer ended");
          return;
        }
        const hrs = Math.floor(totalSeconds / 3600);
        const mins = Math.floor((totalSeconds % 3600) / 60);
        const secs = totalSeconds % 60;
        setMilkCountdown(
          `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
        );
      }, 1000);
    };

    fetchBannersAndTracking();
    return () => {
      if (timerInterval) clearInterval(timerInterval);
    };
  }, []);

  const fetchDbBanners = async () => {
    try {
      const res = await fetch(`${API_BASE}/campaigns?status=Active`);
      const data = await res.json();
      if (data.success && data.campaigns) {
        const filtered = data.campaigns.filter((c: any) => c.type?.includes('Banner') || c.type?.includes('Carousel') || c.type === 'Banner');
        setDbBanners(filtered);
      }
    } catch (err) {
      console.error("Failed to load db campaigns:", err);
    }
  };

  useEffect(() => {
    fetchDbBanners();
  }, []);

  const heroBanners = useMemo(() => [
    {
      id: 1,
      title: "Grocery Offers — Fresh Daily Essentials",
      desc: "Order farm-fresh vegetables, dairy products, bakery items, and household essentials from local merchants. Get up to 50% Off!",
      badge: "🛒 Grocery Offers",
      image: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=1200",
      btnText: "Shop Groceries Now",
      action: () => { trackCategoryClick({ categoryName: 'Daily Needs', targetPath: '/category/🛒 Daily Needs', source: 'banner' }); navigate("/category/🛒 Daily Needs"); },
    },
    {
      id: 2,
      title: "Food Delivery — Hot Deals From Top Restaurants",
      desc: "Craving delicious biryani, mouthwatering pizzas, or fresh bakery treats? Get food delivered hot and fresh in minutes.",
      badge: "🍔 Food Delivery",
      image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&q=80&w=1200",
      btnText: "Order Food Now",
      action: () => { trackCategoryClick({ categoryName: 'Food & Dining', targetPath: '/food', source: 'banner' }); navigate("/food"); },
    },
    {
      id: 3,
      title: "Pharmacy Delivery — Essential Medicines Instantly",
      desc: "Order prescription drugs, daily vitamins, health supplements, and baby care essentials from certified local chemists.",
      badge: "💊 Pharmacy",
      image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=1200",
      btnText: "Order Medicines Now",
      action: () => { trackCategoryClick({ categoryName: 'Health & Wellness', targetPath: '/category/❤ Health & Wellness', source: 'banner' }); navigate("/category/❤ Health & Wellness"); },
    },
    {
      id: 4,
      title: "Local Services — Instant Certified Professionals",
      desc: "Book trusted plumbers, electricians, appliance repair mechanics, painters, and deep cleaning services.",
      badge: "🔧 Local Services",
      image: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=1200",
      btnText: "Book Professionals Now",
      action: () => { trackCategoryClick({ categoryName: 'Services', targetPath: '/services', source: 'banner' }); navigate("/services"); },
    },
  ], [navigate]);



  const displayBanners = useMemo(() => {
    if (personalization?.promoBanners && personalization.promoBanners.length > 0) {
      return personalization.promoBanners.map((b: any) => ({
        id: b.id || b._id,
        title: b.title,
        desc: b.desc,
        badge: b.badge || "PROMO",
        image: b.image,
        btnText: b.btnText || "Shop Now",
        action: () => navigate(b.link || "/products")
      }));
    }
    return heroBanners;
  }, [personalization, heroBanners, navigate]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % displayBanners.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [displayBanners]);


  /** ---------------------------
   * Auth: Check login
   * -------------------------- */
  useEffect(() => {
    const updateUser = () => {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user.hasPets === undefined) user.hasPets = true;
        if (user.hasKids === undefined) user.hasKids = true;
        setLoggedInUser(user);
      } else {
        setLoggedInUser(null);
      }
    };
    updateUser();
    window.addEventListener("storage", updateUser);
    window.addEventListener("user_updated", updateUser);
    return () => {
      window.removeEventListener("storage", updateUser);
      window.removeEventListener("user_updated", updateUser);
    };
  }, []);

  const handleBuyAgainAdd = async (p: any) => {
    const userStr = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    if (!userStr || !token) {
      alert("Please login first.");
      navigate("/login");
      return;
    }
    const user = JSON.parse(userStr);
    const userId = user._id || user.id;

    const item = {
      userId,
      productId: p._id,
      name: p.itemName,
      price: p.baseSellingPrice,
      image: p.thumbnail,
      quantity: 1,
      selectedColor: "default",
      selectedSize: "default",
      sku: "BUY-AGAIN-MOCK",
      vendorId: "vendor-1",
      deliveryFee: 0,
    };

    try {
      const res = await fetch(`https://server.apexbee.in/api/cart/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(item),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add to cart");
      alert(`${p.itemName} added to cart!`);
      window.dispatchEvent(new Event("storage"));
    } catch (err: any) {
      alert(err.message || "Failed to add to cart");
    }
  };

  /** ---------------------------
   * Location: load from localStorage
   * -------------------------- */
  useEffect(() => {
    const loadLocation = () => {
      const saved = localStorage.getItem(LOCATION_KEY);
      if (saved) {
        try {
          setUserLocation(JSON.parse(saved));
        } catch {
          localStorage.removeItem(LOCATION_KEY);
        }
      } else {
        setOpenLocationModal(true);
      }
    };
    loadLocation();
    window.addEventListener("storage", loadLocation);
    window.addEventListener("user_location_updated", loadLocation);
    return () => {
      window.removeEventListener("storage", loadLocation);
      window.removeEventListener("user_location_updated", loadLocation);
    };
  }, []);

  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      const res = await fetch(`${API_BASE}/categories/tree`);
      if (!res.ok) throw new Error("Failed to fetch categories");

      const data = await res.json();
      const list = Array.isArray(data?.categories) ? data.categories : [];
      const parsed = flattenCategoryTree(list);

      setCategories(parsed);
    } catch (e) {
      console.error("Error fetching categories:", e);
      setCategories([]);
    } finally {
      setLoadingCategories(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetch(`${API_BASE}/update-pan-india`).catch(() => { });
  }, []);

  /** ---------------------------
   * Fetch products (reuse)
   * -------------------------- */
  const fetchProducts = async (limit: number) => {
    let url = `${API_BASE}/products?limit=${limit}`;
    let locationUrl = url;
    if (userLocation?.lat && userLocation?.lng) {
      locationUrl += `&lat=${userLocation.lat}&lng=${userLocation.lng}`;
    } else if (userLocation?.pincode) {
      locationUrl += `&pincode=${userLocation.pincode}`;
    }
    if (userLocation?.mandal) {
      locationUrl += `&mandal=${encodeURIComponent(userLocation.mandal)}`;
    }
    if (userLocation?.district) {
      locationUrl += `&district=${encodeURIComponent(userLocation.district)}`;
    }

    try {
      const res = await fetch(locationUrl);
      if (res.ok) {
        const json = await res.json();
        const list = Array.isArray(json?.products) ? json.products : Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : [];
        const filtered = (list as Product[]).filter(
          (product: Product) => {
            const isLiveStatus = (product.status === "Live" || product.status === "Active" || product.status === "Approved" || (product as any).status === "approved") &&
              product.isActive !== false;
            if (!isLiveStatus) return false;

            const scope = (product as any).deliveryScope;
            const isPan = product.isPanIndia || scope === 'pan_india' || scope === 'both';
            if (isPan) return true;

            // If user location is not set, allow
            if (!userLocation?.pincode && !userLocation?.lat && !userLocation?.mandal && !userLocation?.district) return true;

            // Strict local check
            const vendorPin = (product as any).vendorPincode || (product as any).sellerId?.pincode;
            if (userLocation?.pincode && vendorPin && String(userLocation.pincode).trim() === String(vendorPin).trim()) {
              return true;
            }
            if ((product as any).calculatedDistanceKm !== null && (product as any).calculatedDistanceKm !== undefined) {
              return (product as any).calculatedDistanceKm <= 20;
            }
            return false;
          }
        );

        return filtered;
      }
    } catch (e) {
      console.warn("Location product query failed:", e);
    }

    return [];
  };

  const fetchFeaturedProducts = async () => {
    try {
      setFeaturedLoading(true);
      const list = await fetchProducts(12);
      setFeaturedProducts(list);
    } catch (e) {
      console.error("fetchFeaturedProducts:", e);
      setFeaturedProducts([]);
    } finally {
      setFeaturedLoading(false);
    }
  };

  const fetchDealsProducts = async () => {
    try {
      setDealsLoading(true);
      const list = await fetchProducts(12);
      setDealProducts(list);
    } catch (e) {
      console.error("fetchDealsProducts:", e);
      setDealProducts([]);
    } finally {
      setDealsLoading(false);
    }
  };

  useEffect(() => {
    fetchFeaturedProducts();
    fetchDealsProducts();
  }, [userLocation]);

  const [nearbyRestaurantsList, setNearbyRestaurantsList] = useState<any[]>([]);
  const [restaurantsLoading, setRestaurantsLoading] = useState(false);

  /** ---------------------------
   * Fetch nearby shops by GPS / Location
   * -------------------------- */
  const fetchNearbyShops = async () => {
    try {
      setShopsLoading(true);
      setShopsError(null);

      const userLocRaw = localStorage.getItem("userLocation") || localStorage.getItem("user_location") || localStorage.getItem("apexbee_user_location");
      const userLocationObj = userLocRaw ? JSON.parse(userLocRaw) : userLocation;
      const activePin = (localStorage.getItem("userPincode") || userLocationObj?.pincode || localStorage.getItem("pincode") || "").toString().trim();

      const params = new URLSearchParams();
      if (userLocationObj?.lat && userLocationObj?.lng) {
        params.append("lat", String(userLocationObj.lat));
        params.append("lng", String(userLocationObj.lng));
      }
      if (activePin) {
        params.append("pincode", activePin);
      }
      if (userLocationObj?.mandal) params.append("mandal", userLocationObj.mandal);
      if (userLocationObj?.district) params.append("district", userLocationObj.district);
      if (userLocationObj?.city) params.append("city", userLocationObj.city);
      if (userLocationObj?.state) params.append("state", userLocationObj.state);
      params.append("radius", "20");

      let res = await fetch(`${API_BASE}/vendors/nearby?${params.toString()}`);
      if (!res.ok) {
        res = await fetch(`${API_BASE}/vendor/nearby?${params.toString()}`);
      }

      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setNearbyShops(json.data);
        }
      }
    } catch (e: any) {
      console.error("fetchNearbyShops error:", e);
    } finally {
      setShopsLoading(false);
    }
  };

  const fetchNearbyRestaurants = async () => {
    try {
      setRestaurantsLoading(true);
      const userLocRaw = localStorage.getItem("userLocation") || localStorage.getItem("user_location") || localStorage.getItem("apexbee_user_location");
      const userLocationObj = userLocRaw ? JSON.parse(userLocRaw) : userLocation;

      const params = new URLSearchParams();
      if (userLocationObj?.lat && userLocationObj?.lng) {
        params.append("lat", String(userLocationObj.lat));
        params.append("lng", String(userLocationObj.lng));
      }
      if (userLocationObj?.pincode) {
        params.append("pincode", String(userLocationObj.pincode));
      }
      if (userLocationObj?.mandal) params.append("mandal", userLocationObj.mandal);
      if (userLocationObj?.district) params.append("district", userLocationObj.district);
      if (userLocationObj?.city) params.append("city", userLocationObj.city);

      const res = await fetch(`${API_BASE}/food/restaurants?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        if (json.restaurants && Array.isArray(json.restaurants)) {
          setNearbyRestaurantsList(json.restaurants);
        }
      }
    } catch (e: any) {
      console.error("fetchNearbyRestaurants error:", e);
    } finally {
      setRestaurantsLoading(false);
    }
  };

  // Nearby shops & restaurants auto fetch on location change
  useEffect(() => {
    fetchNearbyShops();
    fetchNearbyRestaurants();
  }, [userLocation]);

  // ── ACTIVE ORDER LIVE COUNTDOWN TIMER STATE & SYNC ──
  const [activeCustomerOrder, setActiveCustomerOrder] = useState<any | null>(null);
  const [timerSeconds, setTimerSeconds] = useState<number>(0);

  const fetchActiveCustomerOrder = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await fetch(`${API_BASE}/orders/active-order`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.activeOrder) {
          setActiveCustomerOrder(data.activeOrder);
        } else {
          setActiveCustomerOrder(null);
        }
      }
    } catch (e) {
      console.error("fetchActiveCustomerOrder error:", e);
    }
  };

  useEffect(() => {
    fetchActiveCustomerOrder();
    const interval = setInterval(fetchActiveCustomerOrder, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!activeCustomerOrder) return;

    const prepMins = activeCustomerOrder.estimatedDeliveryMinutes || 20;
    const baseTime = activeCustomerOrder.acceptedAt || activeCustomerOrder.createdAt;
    const targetTime = activeCustomerOrder.estimatedDeliveryTime
      ? new Date(activeCustomerOrder.estimatedDeliveryTime).getTime()
      : (baseTime ? new Date(baseTime).getTime() : Date.now()) + prepMins * 60 * 1000;

    const tick = () => {
      const now = Date.now();
      const diffSecs = Math.max(0, Math.floor((targetTime - now) / 1000));
      setTimerSeconds(diffSecs);
    };

    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [activeCustomerOrder?.estimatedDeliveryTime, activeCustomerOrder?.acceptedAt, activeCustomerOrder?.estimatedDeliveryMinutes]);

  /** ---------------------------
   * UI helpers
   * -------------------------- */
  const scrollCategories = (direction: "left" | "right") => {
    const container = document.getElementById("categories-container");
    if (!container) return;
    const amount = 240;
    container.scrollLeft += direction === "left" ? -amount : amount;
  };

  const scrollHorizontally = (id: string, direction: "left" | "right") => {
    const container = document.getElementById(id);
    if (!container) return;
    const amount = 360;
    container.scrollBy({ left: direction === "left" ? -amount : amount, behavior: "smooth" });
  };

  const handleViewAllCategories = () => navigate("/categories");

  const locationLabel = useMemo(() => {
    if (!userLocation) return "Set delivery location";
    const colony = userLocation.colony?.trim();
    const pin = normPincode(userLocation.pincode);
    if (colony && pin) return `${colony} - ${pin}`;
    if (pin) return pin;
    return "Location set";
  }, [userLocation]);

  const renderProductCard = (p: Product) => {
    const title = getProductTitle(p);
    const img = getProductImage(p);
    const { price, mrp, percentOff } = getDisplayPrices(p);

    const avgRating =
      typeof p.ratings === "number"
        ? p.ratings
        : typeof p.rating === "number"
          ? p.rating
          : 0;

    const ratingCount =
      typeof p.numberOfRatings === "number"
        ? p.numberOfRatings
        : typeof p.reviews === "number"
          ? p.reviews
          : 0;

    const categoryLabel = getProductCategoryLabel(p);

    return (
      <button
        key={p._id}
        onClick={() => navigate(`/product/${p._id}`)}
        className="text-left bg-white border rounded-2xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all group w-full flex flex-col justify-between"
      >
        <div>
          <div className="h-36 sm:h-44 bg-muted overflow-hidden relative w-full">
            <img
              src={img}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />

            {percentOff > 0 && (
              <span className="absolute left-2 top-2 text-[10px] px-2 py-1 rounded-full bg-green-600 text-white font-black shadow-sm">
                {percentOff}% OFF
              </span>
            )}

            <span className="absolute right-2 top-2 text-[9px] px-2 py-1 rounded-full bg-black/60 text-white font-bold backdrop-blur">
              LIVE
            </span>
          </div>

          <div className="p-3.5 space-y-2">
            {/* 3. Store Name with Store Rating */}
            <div className="flex items-center justify-between text-[9px] font-bold text-slate-500">
              <span className="truncate max-w-[70%] hidden md:inline">🏪 {p.brand || "ApexBee Seller"}</span>
              {p.storeRating ? (
                <span className="text-amber-500 bg-amber-50 px-1 rounded shrink-0">★ {p.storeRating}</span>
              ) : null}
            </div>

            <p className="font-extrabold text-navy text-xs leading-tight line-clamp-2 min-h-[32px] group-hover:text-accent transition-colors">{title}</p>

            {categoryLabel && (
              <p className="text-[9px] text-muted-foreground mt-0.5 truncate">
                {categoryLabel}
              </p>
            )}

            {/* 1. Discount & Prices */}
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-sm font-black text-navy">
                {price > 0 ? formatINR(price) : "₹—"}
              </span>

              {mrp > 0 && (
                <span className="text-[10px] text-slate-400 line-through">
                  {formatINR(mrp)}
                </span>
              )}
            </div>

            {/* 4. Product Rating & 5. Sold Count */}
            <div className="flex items-center justify-between text-[9px] text-slate-500 font-bold border-t border-dashed pt-1.5 mt-2">
              <span className="flex items-center gap-0.5">
                {avgRating > 0 && ratingCount > 0 ? `⭐ ${avgRating.toFixed(1)} (${ratingCount})` : '⭐ New'}
              </span>
              <span>👥 {p.soldCount && p.soldCount > 0 ? `${p.soldCount}+ Sold` : '0 Sold'}</span>
            </div>

            {/* 2. Fast Delivery, 6. Delivery Type, 7. Distance & Delivery Charges */}
            <div className="space-y-1 bg-slate-50 rounded-xl p-1.5 text-[9px] text-slate-600 font-bold mt-2">
              <div className="flex items-center justify-between">
                <span className="text-accent shrink-0 font-extrabold">
                  {(p as any).isCourierShipping || (p.calculatedDistanceKm && p.calculatedDistanceKm > 20)
                    ? "🌐 Courier [2-4 Days]"
                    : "⚡ Fast Delivery (15-30 Mins)"}
                </span>
                <span className="text-primary font-black uppercase text-[8px] bg-primary/10 px-1 rounded">
                  {p.deliveryMode === "platform_delivery" || p.deliveryMode === "Platform" ? "Platform" : "Vendor"}
                </span>
              </div>
              <div className="flex items-center justify-between text-[8px] text-slate-500 pt-0.5 border-t border-slate-100">
                <span className="font-bold">
                  {(p as any).isCourierShipping || (p.calculatedDistanceKm && p.calculatedDistanceKm > 20)
                    ? `📦 ${(p as any).vendorLocationName ? `${(p as any).vendorLocationName} Seller` : "Pan India Courier"}`
                    : "📍 Nearby You (Local Store)"}
                </span>
                <span className="font-extrabold text-emerald-600">
                  Delivery: {(p.adminPricing?.shippingCharge || (p as any).shippingCharge) ? `₹${p.adminPricing?.shippingCharge || (p as any).shippingCharge}` : "FREE"}
                </span>
              </div>
            </div>

            {p.tag && (
              <div className="mt-2">
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 font-semibold">
                  {p.tag}
                </span>
              </div>
            )}
          </div>
        </div>
      </button>
    );
  };

  const renderShortRichCard = (p: Product, categoryIcon: string) => {
    const title = getProductTitle(p);
    const img = getProductImage(p);
    const { price, mrp, percentOff } = getDisplayPrices(p);
    const avgRating = typeof p.ratings === "number" ? p.ratings : typeof p.rating === "number" ? p.rating : 4.8;

    return (
      <div
        key={p._id}
        onClick={() => navigate(`/product/${p._id}`)}
        className="group min-w-[165px] xs:min-w-[185px] sm:min-w-[210px] max-w-[210px] flex-shrink-0 bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs hover:shadow-xl hover:border-amber-400 transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between cursor-pointer text-left font-sans"
      >
        <div>
          {/* TOP THUMBNAIL CONTAINER */}
          <div className="h-32 sm:h-36 bg-slate-100 relative overflow-hidden">
            <img
              src={img}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

            {/* DISCOUNT BADGE */}
            {percentOff > 0 && (
              <span className="absolute top-2 left-2 bg-emerald-500 text-white font-black text-[9px] px-2 py-0.5 rounded-full shadow-md">
                {percentOff}% OFF
              </span>
            )}

            {/* CATEGORY ICON */}
            <span className="absolute top-2 right-2 bg-white/90 backdrop-blur text-slate-800 font-bold text-xs p-1 rounded-xl shadow-xs">
              {categoryIcon}
            </span>

            {/* RATING OVERLAY */}
            <div className="absolute bottom-2 left-2 flex items-center space-x-1 bg-white/90 backdrop-blur px-2 py-0.5 rounded-lg text-[10px] font-black text-amber-600 shadow-xs">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span>{avgRating.toFixed(1)}</span>
            </div>
          </div>

          {/* CARD DETAILS */}
          <div className="p-3 space-y-1.5">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider truncate">
              {p.brand || "ApexBee Certified"}
            </p>
            <h4 className="font-extrabold text-slate-900 text-xs leading-snug line-clamp-2 min-h-[32px] group-hover:text-amber-600 transition font-heading">
              {title}
            </h4>

            {/* PRICE ROW */}
            <div className="flex items-baseline space-x-1.5 pt-1">
              <span className="font-black text-sm text-[#0A1128]">
                {price > 0 ? formatINR(price) : "₹—"}
              </span>
              {mrp > price && (
                <span className="text-[10px] text-slate-400 line-through font-semibold">
                  {formatINR(mrp)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* BOTTOM ACTION BUTTON */}
        <div className="px-3 pb-3 pt-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/product/${p._id}`);
            }}
            className="w-full py-1.5 bg-slate-100 group-hover:bg-[#0A1128] text-slate-800 group-hover:text-amber-400 font-black text-xs rounded-xl transition duration-300 text-center flex items-center justify-center space-x-1 cursor-pointer border-none"
          >
            <span>+ Add</span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      {showIntro && (
        <ApexBeeWelcomeIntro
          logoSrc={logo}
          onComplete={handleIntroComplete}
        />
      )}
      <main id="main-content" tabIndex={-1} className="focus:outline-none">
        <div className="min-h-screen bg-background">
          <Navbar />

          {/* ⚠️ Insufficient Wallet Funds Warning Banner for Subscription Delivery */}
          {insufficientSubWarning && (
            <div className="container mx-auto px-4 mt-4">
              <div className="bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white rounded-3xl p-5 sm:p-6 shadow-xl border border-red-400/30 animate-in fade-in slide-in-from-top-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl shrink-0 text-white">
                      <AlertTriangle className="h-6 w-6 sm:h-7 sm:w-7" />
                    </div>
                    <div className="space-y-1 text-left">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 bg-white/20 text-white rounded-full text-[10px] font-black uppercase tracking-wider">
                          Action Needed • Low Wallet Balance
                        </span>
                        <span className="text-xs text-red-100 font-medium">Subscription Order Alert</span>
                      </div>

                      <h3 className="text-base sm:text-lg font-black tracking-tight">
                        Insufficient Wallet Funds for Next Subscription Delivery!
                      </h3>

                      <p className="text-xs text-red-100 leading-relaxed max-w-2xl">
                        Your scheduled delivery for <strong className="text-white underline">{insufficientSubWarning.productName}</strong> is scheduled for <strong className="text-amber-200">{insufficientSubWarning.nextDeliveryDate} ({insufficientSubWarning.deliverySlot})</strong>, but your wallet balance is insufficient.
                      </p>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs pt-1.5 font-bold">
                        <span>Order Cost: <strong className="text-amber-200 text-sm">₹{insufficientSubWarning.requiredAmount}</strong></span>
                        <span className="opacity-60">•</span>
                        <span>Available Wallet: <strong className="text-white text-sm">₹{insufficientSubWarning.walletBalance}</strong></span>
                        <span className="opacity-60">•</span>
                        <span>Shortfall: <strong className="text-amber-300 text-sm">₹{insufficientSubWarning.shortfall}</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="w-full sm:w-auto shrink-0">
                    <Button
                      onClick={() => navigate('/wallet')}
                      className="w-full sm:w-auto bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-2xl px-5 py-3 text-xs flex items-center justify-center gap-2 shadow-lg cursor-pointer transition transform hover:scale-105"
                    >
                      <WalletIcon className="h-4 w-4" />
                      Recharge Wallet Now
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!loggedInUser && (
            <div className="bg-blue-light border-b text-center py-2 text-sm font-semibold">
              On Direct <span className="font-semibold">(LI)</span> registration other complete KYC - 50/-
            </div>
          )}

          {loggedInUser && (!loggedInUser.phone || String(loggedInUser.phone).trim() === "") && (
            <div className="bg-amber-500/10 border-b border-amber-500/30 text-amber-900 px-4 py-2.5 text-xs font-bold flex items-center justify-between gap-3 text-left">
              <div className="flex items-center gap-2">
                <span className="text-base">⚠️</span>
                <span>Complete Your Profile: Please add your mobile number to unlock full features.</span>
              </div>
              <button
                onClick={() => navigate("/profile")}
                className="bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-extrabold px-3 py-1.5 rounded-lg transition shrink-0 cursor-pointer shadow-xs"
              >
                Add Mobile Number
              </button>
            </div>
          )}

          {/* ⚡ HYPER-LOCAL 15-MINUTE EXPRESS DELIVERY TICKER BAR */}
          <div className="bg-[#0A1128] text-white py-1.5 px-3 sm:px-4 shadow-sm border-b border-white/10 font-sans">
            <div className="container mx-auto flex items-center justify-between text-xs font-bold gap-2">
              <div className="flex items-center space-x-1.5 sm:space-x-2 min-w-0 overflow-hidden">
                <span className="flex h-2 w-2 relative shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
                <span className="text-amber-400 font-extrabold uppercase tracking-wider text-[9px] sm:text-[10px] shrink-0">⚡ 15-Min Delivery</span>
                <span className="text-slate-300 font-medium text-[10px] sm:text-xs truncate max-w-[200px] xs:max-w-[280px] sm:max-w-none">
                  • Guaranteed fast delivery from verified local stores in <strong className="text-white">{userLocation?.colony || userLocation?.district || "your neighborhood"}</strong>
                </span>
              </div>
              <div className="flex items-center space-x-2 sm:space-x-3 text-[10px] sm:text-[11px] shrink-0">
                <span className="bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded-full font-mono hidden md:inline">Code: APEXEXPRESS</span>
                <button onClick={() => navigate("/food")} className="hover:text-amber-400 transition font-black underline cursor-pointer border-none bg-transparent text-white whitespace-nowrap">Order Now &rarr;</button>
              </div>
            </div>
          </div>

          {/* 1. Dynamic Hero Banner Slider with Integrated Greeting Overlay */}
          <section className="container mx-auto px-3 sm:px-4 py-3 sm:py-5 space-y-3">
            {/* Floating Glass Greeting & Location Bar */}
            <div className="flex items-center justify-between gap-1.5 sm:gap-2 w-full">
              <div className="bg-card/80 backdrop-blur-md border border-border rounded-full px-2.5 sm:px-3.5 py-1 sm:py-1.5 flex items-center gap-1.5 shadow-sm min-w-0 flex-1">
                <span className="text-[11px] sm:text-xs md:text-sm font-extrabold text-foreground truncate">
                  {timeGreeting}, {personalization?.userName || (loggedInUser ? loggedInUser.name : "Valued Customer")} 👋
                </span>
              </div>

              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent("open_location_modal"))}
                className="text-[10px] sm:text-xs font-bold text-foreground flex items-center gap-1 bg-card/80 hover:bg-card backdrop-blur-md border border-border px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full transition-all cursor-pointer shadow-sm shrink-0 max-w-[50%]"
                title="Click to change your delivery location"
              >
                <span className="text-muted-foreground hidden xs:inline">Delivering to:</span>
                <span className="text-amber-500 font-black truncate max-w-[120px] xs:max-w-[150px] sm:max-w-none">
                  📍 {userLocation?.colony || userLocation?.district || (userLocation?.pincode ? `PIN: ${userLocation.pincode}` : "Set Location")}
                  {userLocation?.pincode ? ` (${userLocation.pincode})` : ""}
                </span>
                <span className="text-[8px] sm:text-[9px] text-amber-500 font-bold shrink-0">▼</span>
              </button>
            </div>

            {/* Dynamic Hero Banner Component (Controlled by Admin Panel) */}
            <DynamicHeroBanner placement="home_hero" />
          </section>

          {/* 🍱 DUAL BANNER: FOOD DELIVERY & DINEOUT RESERVATION */}
          <section className="container mx-auto px-3 sm:px-4 py-2 sm:py-3">
            <div className="flex md:grid md:grid-cols-2 gap-3 sm:gap-4 overflow-x-auto scrollbar-none snap-x snap-mandatory pb-1 -mx-3 px-3 sm:mx-0 sm:px-0 scroll-smooth">
              {/* FOOD DELIVERY CARD */}
              <div
                onClick={() => navigate("/food")}
                className="w-[80vw] sm:w-80 md:w-full h-40 sm:h-44 md:h-52 snap-start shrink-0 bg-gradient-to-r from-amber-500 via-orange-600 to-rose-700 text-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 md:p-5 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer relative overflow-hidden group flex items-center justify-between gap-2.5 sm:gap-4"
              >
                <div className="space-y-1 sm:space-y-1.5 z-10 flex-1 min-w-0 text-left">
                  <span className="inline-block bg-white/20 backdrop-blur-md px-2 py-0.5 rounded-full text-[8.5px] sm:text-[9.5px] font-black uppercase tracking-wider text-amber-100">
                    {foodMealDetails.heroTag}
                  </span>
                  <h3 className="text-sm sm:text-lg md:text-xl font-black leading-tight text-white line-clamp-1 xs:line-clamp-2">
                    {foodMealDetails.heroHeading}
                  </h3>
                  <p className="text-[10px] sm:text-xs text-amber-100 font-medium line-clamp-2">
                    {foodMealDetails.heroDesc}
                  </p>
                  <span className="inline-flex items-center gap-1 bg-[#0A1128] text-amber-400 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl font-black text-[10px] sm:text-xs mt-0.5 sm:mt-1 shadow-md group-hover:scale-105 active:scale-95 transition-transform">
                    {foodMealDetails.heroButton}
                  </span>
                </div>
                <img
                  src="https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=300&auto=format&fit=crop&q=80"
                  alt="Food"
                  className="w-16 h-16 xs:w-20 xs:h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 object-cover rounded-xl sm:rounded-2xl shadow-md group-hover:scale-110 transition duration-500 shrink-0"
                />
              </div>

              {/* DINEOUT TABLE RESERVATION CARD */}
              <div
                onClick={() => navigate("/food")}
                className="w-[80vw] sm:w-80 md:w-full h-40 sm:h-44 md:h-52 snap-start shrink-0 bg-gradient-to-r from-[#0A1128] via-[#1a2b5c] to-[#0A1128] text-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 md:p-5 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer relative overflow-hidden group flex items-center justify-between gap-2.5 sm:gap-4 border border-white/10"
              >
                <div className="space-y-1 sm:space-y-1.5 z-10 flex-1 min-w-0 text-left">
                  <span className="inline-block bg-amber-400 text-[#0A1128] px-2 py-0.5 rounded-full text-[8.5px] sm:text-[9.5px] font-black uppercase tracking-wider">
                    👑 Up to 40% OFF Bills
                  </span>
                  <h3 className="text-sm sm:text-lg md:text-xl font-black leading-tight text-white line-clamp-1 xs:line-clamp-2">
                    Dineout &amp; Table Booking
                  </h3>
                  <p className="text-[10px] sm:text-xs text-slate-300 font-medium line-clamp-2">
                    Reserve tables at luxury fine dining &amp; rooftop lounges with zero booking fees.
                  </p>
                  <span className="inline-flex items-center gap-1 bg-amber-400 text-[#0A1128] px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl font-black text-[10px] sm:text-xs mt-0.5 sm:mt-1 shadow-md group-hover:scale-105 active:scale-95 transition-transform">
                    🍽️ Reserve Table &rarr;
                  </span>
                </div>
                <img
                  src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=300&auto=format&fit=crop&q=80"
                  alt="Dineout"
                  className="w-16 h-16 xs:w-20 xs:h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 object-cover rounded-xl sm:rounded-2xl shadow-md group-hover:scale-110 transition duration-500 shrink-0"
                />
              </div>
            </div>
          </section>

          {/* ⏱️ ACTIVE ORDER LIVE COUNTDOWN TIMER CARD (FOOD ORDERS ONLY) */}
          {activeCustomerOrder && (() => {
            const isFoodOrder = activeCustomerOrder.isFoodOrder ?? Boolean(
              activeCustomerOrder.orderType === 'FOOD' ||
              JSON.stringify(activeCustomerOrder).toLowerCase().match(/food|dining|restaurant|biryani|bakery|tiffin|kitchen|hotel|fast food/)
            );

            if (!isFoodOrder) return null;

            const hasAccepted = activeCustomerOrder.hasAccepted ?? Boolean(
              activeCustomerOrder.acceptedAt ||
              ['accepted', 'preparing', 'confirmed', 'packed', 'ready', 'shipped', 'out_for_delivery'].includes((activeCustomerOrder.orderStatus || '').toLowerCase())
            );

            const prepMins = activeCustomerOrder.estimatedDeliveryMinutes || 25;
            const totalSecs = prepMins * 60;
            const minsLeft = Math.floor(timerSeconds / 60);
            const secsLeft = timerSeconds % 60;
            const clockText = `${String(minsLeft).padStart(2, '0')}:${String(secsLeft).padStart(2, '0')}`;

            const elapsedSecs = Math.max(0, totalSecs - timerSeconds);
            const progressPct = hasAccepted ? Math.min(100, Math.round((elapsedSecs / totalSecs) * 100)) : 10;

            const firstItem = activeCustomerOrder.items?.[0]?.productName || activeCustomerOrder.items?.[0]?.name || 'Delicious Food Order';
            const itemCount = activeCustomerOrder.items?.length || 1;

            return (
              <section className="container mx-auto px-3 sm:px-4 py-2">
                <div className="bg-gradient-to-br from-slate-950 via-[#0A1128] to-slate-900 text-white rounded-3xl p-5 border border-amber-400/40 shadow-xl relative overflow-hidden font-sans text-left">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-start space-x-3.5">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 text-slate-950 flex items-center justify-center font-black text-2xl shrink-0 shadow-lg animate-pulse">
                        🍲
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          {hasAccepted ? (
                            <span className="bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider">
                              🔥 Order Accepted &amp; Preparing
                            </span>
                          ) : (
                            <span className="bg-blue-400/20 text-blue-300 border border-blue-400/40 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider animate-pulse">
                              ⏳ Awaiting Restaurant Acceptance
                            </span>
                          )}
                          <span className="text-xs text-slate-300 font-bold">
                            Order #{activeCustomerOrder.orderNumber}
                          </span>
                        </div>

                        <h3 className="font-extrabold text-base sm:text-lg text-white font-heading">
                          {firstItem} {itemCount > 1 ? `+ ${itemCount - 1} more items` : ''}
                        </h3>
                        <p className="text-xs text-slate-300 font-medium">
                          🏪 Store: <strong className="text-amber-300">{activeCustomerOrder.storeName || 'ApexBee Partner Outlet'}</strong>
                          {!hasAccepted && <span className="block text-[11px] text-blue-300 mt-0.5 font-bold">Timer starts as soon as restaurant confirms prep time!</span>}
                        </p>
                      </div>
                    </div>

                    {/* ⏱️ COUNTDOWN CLOCK DISPLAY */}
                    <div className="w-full sm:w-auto bg-slate-900/90 border border-amber-400/30 rounded-2xl p-3 text-center flex sm:flex-col items-center justify-between sm:justify-center gap-2 shrink-0 shadow-inner">
                      <div>
                        <span className="text-[9.5px] font-black uppercase text-amber-400 block tracking-wider">
                          {!hasAccepted ? 'Restaurant Status' : timerSeconds > 0 ? 'Estimated Delivery In' : 'Arriving Any Moment'}
                        </span>
                        <span className="text-2xl sm:text-3xl font-black text-white font-mono leading-none tracking-tight">
                          {!hasAccepted ? 'Pending' : timerSeconds > 0 ? clockText : '00:00'}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => navigate('/my-orders')}
                        className="bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs px-4 py-2 rounded-xl transition shadow-md cursor-pointer shrink-0"
                      >
                        Track Order Live &rarr;
                      </button>
                    </div>
                  </div>

                  {/* PROGRESS BAR */}
                  <div className="mt-4 space-y-1.5 pt-2 border-t border-slate-800">
                    <div className="flex justify-between text-[11px] font-bold text-slate-300">
                      <span>Status: <strong className="text-amber-400 uppercase">{hasAccepted ? (activeCustomerOrder.orderStatus || 'Preparing') : 'Sent to Kitchen (Pending Acceptance)'}</strong></span>
                      <span>{hasAccepted ? `${progressPct}% Completed (${prepMins} Min Delivery Window)` : 'Awaiting Confirmation'}</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
                      <div
                        className={`h-full bg-gradient-to-r from-amber-400 to-emerald-400 rounded-full transition-all duration-1000 shadow-sm ${!hasAccepted ? 'animate-pulse' : ''}`}
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>
                </div>
              </section>
            );
          })()}

          {/* SCHEDULED MORNING SUBSCRIPTION DELIVERY ALERT CARD — ONLY SHOWN IF USER HAS ACTIVE SUBSCRIPTIONS */}
          {activeUserSubscriptions.length > 0 && (() => {
            const sub0 = activeUserSubscriptions[0];
            const liveStatus = (sub0.status || sub0.runStatus || 'active').trim();
            const isDelivered = liveStatus.toLowerCase() === 'delivered';
            const isOut = liveStatus.toLowerCase() === 'out for delivery';

            const statusText = isDelivered
              ? 'DELIVERED ✅'
              : isOut
                ? 'OUT FOR DELIVERY 🚚'
                : 'ACTIVE / ASSIGNED TO RIDER 🛵';

            const statusColorClass = isDelivered
              ? 'text-emerald-700 font-black'
              : isOut
                ? 'text-blue-700 font-black'
                : 'text-amber-800 font-black';

            return (
              <section className="container mx-auto px-3 sm:px-4 py-2">
                <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border-2 border-amber-300 rounded-3xl p-5 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4 font-sans text-left">
                  <div className="flex items-start space-x-3">
                    <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-2xl shrink-0 shadow-sm mt-0.5">
                      🥛
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="bg-[#0A1128] text-amber-400 text-[10px] font-black uppercase px-2.5 py-0.5 rounded">
                          📅 Scheduled Subscription Order
                        </span>
                        <span className="text-xs text-amber-800 font-extrabold">Slot: {sub0.deliverySlot || '06:00 AM - 07:00 AM'}</span>
                      </div>
                      <h3 className="font-black text-base text-slate-900 mt-1">
                        {sub0.productName || 'Idols & Spiritual - Fresh & Premium Grade (1 Pkt/Item)'}
                      </h3>
                      <p className="text-xs text-slate-600 font-medium">
                        Run #{String(sub0._id || sub0.id || '6a740a').slice(-6)} • Frequency: {sub0.frequency || 'Alternate Days'} • Status: <span className={`uppercase ${statusColorClass}`}>{statusText}</span>
                      </p>
                      <div className="flex gap-2 text-[10px] font-bold mt-2 overflow-x-auto">
                        <span className="bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded border border-emerald-300 shrink-0">08-06: Delivered</span>
                        <span className={`px-2.5 py-0.5 rounded border shrink-0 font-black ${isDelivered ? 'bg-emerald-200 text-emerald-950 border-emerald-400' : isOut ? 'bg-blue-200 text-blue-950 border-blue-400' : 'bg-amber-200 text-amber-950 border-amber-400'}`}>
                          08-08 Today: {liveStatus.toUpperCase()}
                        </span>
                        <span className="bg-white text-slate-600 px-2.5 py-0.5 rounded border border-slate-300 shrink-0">08-10: Scheduled</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex sm:flex-col gap-2 shrink-0 w-full sm:w-auto">
                    <Button
                      onClick={() => navigate("/my-orders")}
                      className="w-full sm:w-auto bg-[#0A1128] hover:bg-[#101F42] text-amber-400 font-black text-xs px-5 py-2.5 rounded-xl shadow-md"
                    >
                      Manage Roster & Orders &rarr;
                    </Button>
                  </div>
                </div>
              </section>
            );
          })()}

          {/* 2. Explore Categories (Placed FIRST after Hero Banner) */}
          <section className="container mx-auto px-3 sm:px-4 py-2 sm:py-5">
            <div className="flex items-center justify-between mb-2.5 sm:mb-5">
              <h2 className="text-lg sm:text-xl font-extrabold text-navy text-left">Explore Categories</h2>
              <Button
                variant="outline"
                size="sm"
                className="text-accent border-accent hover:bg-accent hover:text-white rounded-full font-bold text-xs px-3 py-1"
                onClick={handleViewAllCategories}
              >
                View All
              </Button>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2.5 sm:gap-4">
              {loadingCategories ? (
                Array.from({ length: 9 }).map((_, index) => (
                  <div key={index} className="flex flex-col items-center gap-2">
                    <Skeleton className="w-24 h-24 sm:w-[100px] sm:h-[100px] rounded-full" />
                    <Skeleton className="w-16 h-3 rounded mt-1" />
                  </div>
                ))
              ) : categories.length === 0 ? (
                <div className="col-span-full rounded-2xl border bg-muted/20 p-8 text-center text-muted-foreground font-semibold text-sm">
                  No categories available right now.
                </div>
              ) : (
                categories.map((category) => (
                  <button
                    type="button"
                    key={category.id}
                    onClick={() => navigate(category.to)}
                    className="flex flex-col items-center justify-between gap-1.5 p-1 group cursor-pointer border-none bg-transparent w-full"
                  >
                    {/* CLEAN PURE IMAGE ONLY — NO BACKGROUND, NO BORDER, NO BOX */}
                    <div className="w-20 h-20 sm:w-[100px] sm:h-[100px] md:w-28 md:h-28 overflow-hidden shrink-0 transition duration-300 flex items-center justify-center">
                      <img
                        src={category.image || "/placeholder.svg"}
                        alt={category.label}
                        className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                    </div>
                    <div className="w-full text-center px-0.5 mt-1">
                      <p className="text-xs sm:text-xs font-black text-[#0A1128] group-hover:text-amber-600 leading-tight text-center break-words line-clamp-2 transition-colors">
                        {category.label.includes(" & ") ? (
                          <>
                            {category.label.split(" & ")[0]} &<br />
                            {category.label.split(" & ")[1]}
                          </>
                        ) : (
                          category.label
                        )}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </section>

          {/* 3. Quick Shortcuts Bar (WITH LEFT & RIGHT NAV ARROWS) */}
          <section className="container mx-auto px-3 sm:px-4 py-2 sm:py-4">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <h2 className="text-base sm:text-lg font-black text-[#0A1128]">Quick Shortcuts</h2>
              <button onClick={() => navigate("/categories")} className="text-xs text-amber-600 font-extrabold hover:underline bg-transparent border-none cursor-pointer">
                View All →
              </button>
            </div>

            <div className="relative group px-1">
              <button
                onClick={() => scrollHorizontally("quick-shortcuts-scroll", "left")}
                className="absolute -left-2 sm:left-0 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/95 shadow-lg border border-amber-200 flex items-center justify-center text-[#0A1128] hover:bg-[#0A1128] hover:text-amber-400 transition-all cursor-pointer border-none"
                aria-label="Scroll Left"
              >
                <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>

              <div id="quick-shortcuts-scroll" className="flex md:grid md:grid-cols-9 gap-3 sm:gap-4 overflow-x-auto scrollbar-none pb-2 pt-1 px-1 sm:px-2 scroll-smooth">
                {[
                  { label: "Earn With Us", icon: Coins, gradient: "linear-gradient(135deg,#f59e0b,#f97316)", to: "/earn-with-apexbee" },
                  { label: "Groceries", icon: ShoppingBag, gradient: "linear-gradient(135deg,#FF416C,#FF4B2B)", to: "/grocery" },
                  { label: "Food & Dining", icon: Utensils, gradient: "linear-gradient(135deg,#f857a6,#ff5858)", to: "/food" },
                  { label: "Local Stores", icon: Store, gradient: "linear-gradient(135deg,#0A1128,#1e3c72)", to: "/local-stores" },
                  { label: "Services", icon: ToolIcon, gradient: "linear-gradient(135deg,#1e3c72,#2a5298)", to: "/services" },
                  { label: "Pharmacy", icon: HeartPulse, gradient: "linear-gradient(135deg,#11998e,#38ef7d)", to: "/category/Health & Wellness" },
                  { label: "Fashion", icon: Shirt, gradient: "linear-gradient(135deg,#ea00d9,#711c91)", to: "/category/Fashion & Boutique" },
                  { label: "Electronics", icon: Smartphone, gradient: "linear-gradient(135deg,#00c6ff,#0072ff)", to: "/category/Electronics & Gadgets" },
                  { label: "Community", icon: Users, gradient: "linear-gradient(135deg,#3f2b96,#a8c0ff)", to: "/community" },
                ].map((item) => {
                  const IconComponent = item.icon;
                  return (
                    <button
                      key={item.label}
                      onClick={() => {
                        trackCategoryClick({
                          categoryName: item.label,
                          targetPath: item.to,
                          source: 'shortcut_grid',
                        });
                        if (item.to.startsWith("http")) {
                          window.location.href = item.to;
                        } else {
                          navigate(item.to);
                        }
                      }}
                      className="flex flex-col items-center justify-start gap-1.5 group cursor-pointer border-none bg-transparent shrink-0 min-w-[70px] sm:min-w-[80px] md:min-w-0 md:w-full"
                    >
                      <div
                        className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-2xl flex items-center justify-center text-white shadow-md group-hover:shadow-xl group-hover:scale-110 transition-all duration-300 transform-gpu"
                        style={{ background: item.gradient }}
                      >
                        <IconComponent className="w-5 h-5 sm:w-7 sm:h-7 stroke-[2.2px]" />
                      </div>
                      <p className="font-black text-[#0A1128] text-[10px] sm:text-xs leading-tight group-hover:text-amber-600 transition-colors text-center break-words line-clamp-2">
                        {item.label}
                      </p>
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => scrollHorizontally("quick-shortcuts-scroll", "right")}
                className="absolute -right-2 sm:right-0 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/95 shadow-lg border border-amber-200 flex items-center justify-center text-[#0A1128] hover:bg-[#0A1128] hover:text-amber-400 transition-all cursor-pointer border-none"
                aria-label="Scroll Right"
              >
                <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>
          </section>

          {/* REAL BACKEND FEATURED PRODUCTS SHOWCASE (300x400 Cards) */}
          {dbProducts.length > 0 && (
            <section className="container mx-auto px-3 sm:px-4 py-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500 fill-amber-400" />
                  <h2 className="text-lg sm:text-xl font-black text-[#0A1128]">
                    Trending Products
                  </h2>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => navigate("/category/All")}
                    className="text-xs font-bold text-amber-600 hover:underline bg-transparent border-none cursor-pointer"
                  >
                    View All Products →
                  </button>

                  {/* Header mini left & right buttons */}
                  <div className="hidden sm:flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => scrollHorizontally("trending-products-scroll", "left")}
                      className="w-8 h-8 rounded-full bg-white shadow-xs border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-[#0A1128] hover:text-amber-400 transition-all cursor-pointer"
                      aria-label="Scroll Left"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => scrollHorizontally("trending-products-scroll", "right")}
                      className="w-8 h-8 rounded-full bg-white shadow-xs border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-[#0A1128] hover:text-amber-400 transition-all cursor-pointer"
                      aria-label="Scroll Right"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Scroll Container with Floating Left/Right Arrows */}
              <div className="relative group">
                <button
                  type="button"
                  onClick={() => scrollHorizontally("trending-products-scroll", "left")}
                  className="absolute -left-2 sm:-left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/95 shadow-xl border border-slate-200/90 flex items-center justify-center text-slate-800 hover:bg-[#0A1128] hover:text-amber-400 hover:scale-110 transition-all cursor-pointer opacity-90 group-hover:opacity-100"
                  aria-label="Scroll Left"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>

                <div id="trending-products-scroll" className="flex gap-4 overflow-x-auto pb-3 px-1 scrollbar-none scroll-smooth">
                  {dbProducts.map((p: any) => (
                    <ProductCard key={p._id || p.id} product={p} />
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => scrollHorizontally("trending-products-scroll", "right")}
                  className="absolute -right-2 sm:-right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/95 shadow-xl border border-slate-200/90 flex items-center justify-center text-slate-800 hover:bg-[#0A1128] hover:text-amber-400 hover:scale-110 transition-all cursor-pointer opacity-90 group-hover:opacity-100"
                  aria-label="Scroll Right"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </section>
          )}

          {/* 4. Today's Schedule Card Widget (HORIZONTAL SLIDING ON MOBILE) */}
          {loggedInUser && (
            <section className="container mx-auto px-3 sm:px-4 py-1.5 sm:py-3 text-left">
              <div className="flex md:grid md:grid-cols-3 gap-4 sm:gap-5 overflow-x-auto scrollbar-none snap-x snap-mandatory pb-3 md:pb-0">
                {/* Today’s Schedule */}
                <div className="w-[85%] sm:w-[80%] md:w-auto snap-center shrink-0 md:shrink-1 bg-gradient-to-br from-blue-50/40 to-indigo-50/50 border border-indigo-100/70 rounded-3xl p-5 shadow-sm space-y-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded uppercase tracking-wider">📅 Today’s Schedule</span>
                    <span className="text-[10px] font-bold text-slate-500 font-mono">{personalization?.todaySchedule?.slot || "6:00 AM Slot"}</span>
                  </div>
                  <div className="space-y-3">
                    {personalization?.todaySchedule?.items && personalization.todaySchedule.items.length > 0 ? (
                      personalization.todaySchedule.items.map((item: any, idx: number) => {
                        const isDelivered = item.status.toLowerCase().includes("delivered");
                        const isDispatched = item.status.toLowerCase().includes("dispatch");
                        const statusClass = isDelivered
                          ? "text-green-600 bg-green-50 border-green-100"
                          : isDispatched
                            ? "text-blue-600 bg-blue-50 border-blue-100"
                            : "text-amber-600 bg-amber-50 border-amber-100";
                        return (
                          <div key={idx} className="flex items-center justify-between gap-2 border-b border-indigo-50/20 pb-2 last:border-0 last:pb-0">
                            <div className="flex items-center gap-3">
                              <span className="text-lg shrink-0">{item.emoji}</span>
                              <div>
                                <p className="font-extrabold text-navy text-xs leading-none">{item.name}</p>
                              </div>
                            </div>
                            <span className={`text-[8px] font-bold border px-1.5 py-0.5 rounded-full shrink-0 ${statusClass}`}>
                              {item.status}
                            </span>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-6 space-y-1">
                        <p className="text-3xl font-black text-slate-400 leading-none">0</p>
                        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-wider">Scheduled Deliveries Today</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Tomorrow’s Schedule Card */}
                <div className="w-[85%] sm:w-[80%] md:w-auto snap-center shrink-0 md:shrink-1 bg-gradient-to-br from-emerald-50/30 to-teal-50/40 border border-emerald-100/70 rounded-3xl p-5 shadow-sm space-y-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded uppercase tracking-wider">🌟 Tomorrow’s Schedule</span>
                    <span className="text-[10px] font-bold text-emerald-700">Before 7:00 AM</span>
                  </div>
                  <div className="space-y-3">
                    {personalization?.tomorrowSchedule?.items && personalization.tomorrowSchedule.items.length > 0 ? (
                      personalization.tomorrowSchedule.items.map((item: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between border-b border-emerald-50/20 pb-2 last:border-0 last:pb-0">
                          <div className="flex items-center gap-3">
                            <span className="text-lg shrink-0">{item.emoji}</span>
                            <div>
                              <p className="font-extrabold text-navy text-xs leading-none">{item.name}</p>
                            </div>
                          </div>
                          <span className="text-[9px] font-bold text-slate-500 bg-white/80 border border-slate-100 px-2 py-0.5 rounded-full shrink-0 font-mono">
                            Qty: {item.qty}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6 space-y-1">
                        <p className="text-3xl font-black text-slate-400 leading-none">0</p>
                        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-wider">Scheduled Deliveries Tomorrow</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Today’s Overview */}
                <div className="w-[85%] sm:w-[80%] md:w-auto snap-center shrink-0 md:shrink-1 bg-white border border-slate-100 rounded-3xl p-5 shadow-sm flex flex-col justify-between gap-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">📊 Quick Overview</span>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-3 bg-blue-50/40 rounded-2xl border border-blue-50/50 hover:bg-blue-50 transition-colors duration-200">
                      <p className="text-xl font-black text-indigo-600">{personalization?.overview?.deliveries ?? 0}</p>
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mt-1">Deliveries</p>
                    </div>
                    <div className="p-3 bg-violet-50/40 rounded-2xl border border-violet-50/50 hover:bg-violet-50 transition-colors duration-200">
                      <p className="text-xl font-black text-purple-600">{personalization?.overview?.services ?? 0}</p>
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mt-1">Services</p>
                    </div>
                    <div className="p-3 bg-amber-50/40 rounded-2xl border border-amber-50/50 hover:bg-amber-50 transition-colors duration-200">
                      <p className="text-xl font-black text-amber-600">{personalization?.overview?.pending ?? 0}</p>
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mt-1">Pending</p>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500 italic text-center leading-snug">{personalization?.overview?.message || "No active bookings or deliveries scheduled today."}</p>
                </div>
              </div>
            </section>
          )}

          {/* Live Order Tracking Widget */}
          {hasActiveOrder && activeTracking && (
            <section className="container mx-auto px-3 sm:px-4 py-1 sm:py-2 mt-0.5 sm:mt-1">
              <div className="bg-blue-50 border border-blue-200 rounded-3xl p-5 shadow-sm text-left flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-xl shrink-0 animate-bounce">
                    {activeTracking.deliveryPartnerName ? "🛵" : "🍳"}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-navy text-xs leading-none flex items-center gap-1.5 capitalize">
                      Order {activeTracking.status.replace("_", " ")} <span className="w-2 h-2 bg-green-500 rounded-full animate-map-pulse" />
                    </h4>
                    <p className="text-[11px] text-slate-600 mt-1.5 leading-snug">
                      {activeTracking.deliveryPartnerName ? (
                        <>
                          Partner <strong>{activeTracking.deliveryPartnerName}</strong> is delivering order <strong>{activeTracking.orderNumber}</strong>. Arriving in <strong>{activeTracking.etaMinutes} mins</strong>. Security OTP: <strong className="text-navy bg-slate-100 px-1.5 py-0.5 rounded">{activeTracking.otp}</strong>
                        </>
                      ) : (
                        <>
                          Your order <strong>{activeTracking.orderNumber}</strong> is currently being prepared. Estimated delivery in <strong>{activeTracking.etaMinutes} mins</strong>.
                        </>
                      )}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => navigate(`/track-order/${activeTracking.orderId}`)}
                  className="bg-navy hover:bg-navy/95 text-white font-bold text-xs rounded-xl shrink-0 py-2.5 px-4 cursor-pointer border-none"
                >
                  {activeTracking.deliveryPartnerName ? "Track Live on Map →" : "View Order Details →"}
                </Button>
              </div>
            </section>
          )}

          {/* 5.5 Feature Badges Bar (3 Pillars with Horizontal Mobile Scroll) */}
          <section className="container mx-auto px-3 sm:px-4 py-1.5 sm:py-3">
            <div className="bg-amber-50/60 border border-amber-200/60 rounded-2xl p-2.5 sm:p-3 flex items-center justify-between sm:justify-around overflow-x-auto scrollbar-none gap-3 text-center text-[10px] sm:text-xs font-extrabold text-[#0A1128]">
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-sm sm:text-base">🚀</span>
                <div className="text-left leading-tight">
                  <p className="font-black">Fast Delivery</p>
                  <p className="text-[9px] text-slate-500 font-bold">15-30 mins</p>
                </div>
              </div>

              <div className="h-6 w-px bg-amber-200 shrink-0" />

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-sm sm:text-base">🏷️</span>
                <div className="text-left leading-tight">
                  <p className="font-black">Best Prices</p>
                  <p className="text-[9px] text-slate-500 font-bold">Guarantee</p>
                </div>
              </div>

              <div className="h-6 w-px bg-amber-200 shrink-0" />

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-sm sm:text-base">🏪</span>
                <div className="text-left leading-tight">
                  <p className="font-black">Local Stores</p>
                  <p className="text-[9px] text-slate-500 font-bold">Near You</p>
                </div>
              </div>
            </div>
          </section>

          {/* 6. Deals & Featured Products */}
          <section className="container mx-auto px-3 sm:px-4 my-6 py-6 text-left bg-gradient-to-r from-amber-500/10 via-yellow-500/5 to-amber-500/10 border border-amber-200/80 rounded-[32px] shadow-sm font-sans">
            <div className="flex items-center justify-between mb-4 px-2">
              <div>
                <span className="inline-flex items-center space-x-1.5 text-[10px] font-black uppercase tracking-wider bg-amber-500 text-[#0A1128] px-2.5 py-0.5 rounded-full shadow-xs mb-1">
                  <span>✨ HANDPICKED SELECTION</span>
                </span>
                <h2 className="text-lg sm:text-2xl font-black text-[#0A1128] font-heading flex items-center space-x-2">
                  <span>🔥</span>
                  <span>Featured Products &amp; Top Bestsellers</span>
                </h2>
                <p className="text-xs text-slate-600 font-medium mt-0.5">Top-rated items handpicked for quality with fast local delivery</p>
              </div>
              <Button variant="outline" size="sm" className="rounded-2xl border-amber-300 bg-white text-[#0A1128] font-extrabold text-xs hover:bg-[#0A1128] hover:text-amber-400 cursor-pointer shadow-xs transition" onClick={() => navigate("/products")}>
                View All →
              </Button>
            </div>

            <div className="relative group px-1">
              <button
                onClick={() => scrollHorizontally("featured-products-scroll", "left")}
                className="absolute -left-2 sm:left-0 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/95 shadow-lg border border-amber-200 flex items-center justify-center text-[#0A1128] hover:bg-[#0A1128] hover:text-amber-400 transition-all cursor-pointer border-none"
                aria-label="Scroll Left"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              {featuredLoading ? (
                <div className="flex gap-4 overflow-x-auto scrollbar-none scrollbar-hide no-scrollbar pb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="min-w-[190px] xs:min-w-[210px] sm:min-w-[240px] max-w-[240px] flex-shrink-0 rounded-2xl border bg-white overflow-hidden">
                      <Skeleton className="h-44 w-full" />
                      <div className="p-4 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : featuredProducts.length === 0 ? (
                <div className="rounded-2xl border border-amber-200 bg-white/60 p-10 text-center text-muted-foreground text-sm">
                  No featured products available right now.
                </div>
              ) : (
                <div id="featured-products-scroll" className="flex gap-4 overflow-x-auto scrollbar-none scrollbar-hide no-scrollbar pb-4 pt-1 scroll-smooth transform-gpu">
                  {featuredProducts.map((p) => (
                    <ProductCard key={p._id || (p as any).id} product={p} />
                  ))}
                </div>
              )}

              <button
                onClick={() => scrollHorizontally("featured-products-scroll", "right")}
                className="absolute -right-2 sm:right-0 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/95 shadow-lg border border-amber-200 flex items-center justify-center text-[#0A1128] hover:bg-[#0A1128] hover:text-amber-400 transition-all cursor-pointer border-none"
                aria-label="Scroll Right"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </section>

          {/* 🛒 1. DAILY NEEDS CATEGORY PRODUCTS */}
          <section className="container mx-auto px-3 sm:px-4 my-6 py-6 text-left bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-emerald-500/10 border border-emerald-200/60 rounded-[32px] shadow-sm">
            <div className="flex items-center justify-between mb-4 px-2">
              <div>
                <span className="inline-flex items-center space-x-1.5 text-[10px] font-black uppercase tracking-wider bg-emerald-600 text-white px-2.5 py-0.5 rounded-full shadow-xs mb-1">
                  <span>🥦 FRESH &amp; FAST</span>
                </span>
                <h2 className="text-lg sm:text-2xl font-black text-[#0A1128] font-heading flex items-center space-x-2">
                  <span>🛒</span>
                  <span>Daily Needs &amp; Essentials</span>
                </h2>
                <p className="text-xs text-slate-600 font-medium mt-0.5">Fresh milk, water cans, vegetables &amp; groceries in 15 mins</p>
              </div>
              <Button variant="outline" size="sm" className="rounded-2xl border-emerald-300 bg-white text-emerald-800 font-extrabold text-xs hover:bg-emerald-600 hover:text-white cursor-pointer shadow-xs transition" onClick={() => navigate("/category/🛒 Daily Needs")}>
                View All →
              </Button>
            </div>

            <div className="relative group px-1">
              <button
                onClick={() => scrollHorizontally("daily-needs-scroll", "left")}
                className="absolute -left-2 sm:left-0 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/95 shadow-lg border border-emerald-200 flex items-center justify-center text-emerald-800 hover:bg-emerald-600 hover:text-white transition-all cursor-pointer border-none"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <div id="daily-needs-scroll" className="flex gap-4 overflow-x-auto scrollbar-none pb-2 pt-1 scroll-smooth">
                {dailyNeedsProducts.map((p) => (
                  <ProductCard key={p._id || (p as any).id} product={p} />
                ))}
              </div>

              <button
                onClick={() => scrollHorizontally("daily-needs-scroll", "right")}
                className="absolute -right-2 sm:right-0 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/95 shadow-lg border border-emerald-200 flex items-center justify-center text-emerald-800 hover:bg-emerald-600 hover:text-white transition-all cursor-pointer border-none"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </section>

          {/* 📦 DUAL BANNER: GROCERY & MORNING ESSENTIALS */}
          <section className="container mx-auto px-3 sm:px-4 py-2 sm:py-3">
            <div className="flex md:grid md:grid-cols-2 gap-3 sm:gap-4 overflow-x-auto scrollbar-none snap-x snap-mandatory pb-1 -mx-3 px-3 sm:mx-0 sm:px-0 scroll-smooth">
              {/* MORNING DAIRY & MILK CARD */}
              <div
                onClick={() => navigate("/category/Daily Needs & Grocery")}
                className="w-[80vw] sm:w-80 md:w-full h-40 sm:h-44 md:h-52 snap-start shrink-0 bg-gradient-to-r from-emerald-600 via-teal-700 to-cyan-900 text-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 md:p-5 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer relative overflow-hidden group flex items-center justify-between gap-2.5 sm:gap-4"
              >
                <div className="space-y-1 sm:space-y-1.5 z-10 flex-1 min-w-0 text-left">
                  <span className="inline-block bg-white/20 backdrop-blur-md px-2 py-0.5 rounded-full text-[8.5px] sm:text-[9.5px] font-black uppercase tracking-wider text-emerald-100">
                    🥛 6 AM Morning Delivery
                  </span>
                  <h3 className="text-sm sm:text-lg md:text-xl font-black leading-tight text-white line-clamp-1 xs:line-clamp-2">
                    Fresh Milk &amp; Daily Dairy
                  </h3>
                  <p className="text-[10px] sm:text-xs text-emerald-100 font-medium line-clamp-2">
                    Daily fresh milk, curd, paneer &amp; morning tiffin supplies delivered by 7 AM.
                  </p>
                  <span className="inline-flex items-center gap-1 bg-white text-emerald-950 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl font-black text-[10px] sm:text-xs mt-0.5 sm:mt-1 shadow-md group-hover:scale-105 active:scale-95 transition-transform">
                    🥛 Order Fresh Dairy &rarr;
                  </span>
                </div>
                <img
                  src="https://images.unsplash.com/photo-1563636619-e9143da7973b?w=300&auto=format&fit=crop&q=80"
                  alt="Dairy"
                  className="w-16 h-16 xs:w-20 xs:h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 object-cover rounded-xl sm:rounded-2xl shadow-md group-hover:scale-110 transition duration-500 shrink-0"
                />
              </div>

              {/* MONTHLY GROCERY MEGA SALE CARD */}
              <div
                onClick={() => navigate("/category/Daily Needs & Grocery")}
                className="w-[80vw] sm:w-80 md:w-full h-40 sm:h-44 md:h-52 snap-start shrink-0 bg-gradient-to-r from-green-700 via-emerald-800 to-slate-900 text-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 md:p-5 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer relative overflow-hidden group flex items-center justify-between gap-2.5 sm:gap-4 border border-white/10"
              >
                <div className="space-y-1 sm:space-y-1.5 z-10 flex-1 min-w-0 text-left">
                  <span className="inline-block bg-amber-400 text-[#0A1128] px-2 py-0.5 rounded-full text-[8.5px] sm:text-[9.5px] font-black uppercase tracking-wider">
                    🛒 Up to 50% OFF
                  </span>
                  <h3 className="text-sm sm:text-lg md:text-xl font-black leading-tight text-white line-clamp-1 xs:line-clamp-2">
                    Monthly Grocery Store
                  </h3>
                  <p className="text-[10px] sm:text-xs text-slate-300 font-medium line-clamp-2">
                    Atta, Rice, Cooking Oils, Dal &amp; Spices from top verified local merchants.
                  </p>
                  <span className="inline-flex items-center gap-1 bg-amber-400 text-[#0A1128] px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl font-black text-[10px] sm:text-xs mt-0.5 sm:mt-1 shadow-md group-hover:scale-105 active:scale-95 transition-transform">
                    🛒 Shop Monthly Grocery &rarr;
                  </span>
                </div>
                <img
                  src="https://images.unsplash.com/photo-1542838132-92c53300491e?w=300&auto=format&fit=crop&q=80"
                  alt="Grocery"
                  className="w-16 h-16 xs:w-20 xs:h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 object-cover rounded-xl sm:rounded-2xl shadow-md group-hover:scale-110 transition duration-500 shrink-0"
                />
              </div>
            </div>
          </section>

          {/* 🏛️ 2. DEVOTIONAL & PUJA PRODUCTS */}
          <section className="container mx-auto px-3 sm:px-4 my-6 py-6 text-left bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-rose-500/10 border border-amber-300/60 rounded-[32px] shadow-sm">
            <div className="flex items-center justify-between mb-4 px-2">
              <div>
                <span className="inline-flex items-center space-x-1.5 text-[10px] font-black uppercase tracking-wider bg-amber-600 text-white px-2.5 py-0.5 rounded-full shadow-xs mb-1">
                  <span>🌸 VEDIC &amp; SACRED</span>
                </span>
                <h2 className="text-lg sm:text-2xl font-black text-[#0A1128] font-heading flex items-center space-x-2">
                  <span>🏛️</span>
                  <span>Devotional &amp; Puja Samagri</span>
                </h2>
                <p className="text-xs text-slate-600 font-medium mt-0.5">Fresh flowers, agarbatti, brass diyas &amp; complete pooja kits</p>
              </div>
              <Button variant="outline" size="sm" className="rounded-2xl border-amber-300 bg-white text-amber-900 font-extrabold text-xs hover:bg-amber-600 hover:text-white cursor-pointer shadow-xs transition" onClick={() => navigate("/category/Devotional")}>
                View All →
              </Button>
            </div>

            <div className="relative group px-1">
              <button
                onClick={() => scrollHorizontally("devotional-scroll", "left")}
                className="absolute -left-2 sm:left-0 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/95 shadow-lg border border-amber-200 flex items-center justify-center text-amber-900 hover:bg-amber-600 hover:text-white transition-all cursor-pointer border-none"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <div id="devotional-scroll" className="flex gap-4 overflow-x-auto scrollbar-none pb-2 pt-1 scroll-smooth">
                {devotionalProducts.map((p) => (
                  <ProductCard key={p._id || (p as any).id} product={p} />
                ))}
              </div>

              <button
                onClick={() => scrollHorizontally("devotional-scroll", "right")}
                className="absolute -right-2 sm:right-0 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/95 shadow-lg border border-amber-200 flex items-center justify-center text-amber-900 hover:bg-amber-600 hover:text-white transition-all cursor-pointer border-none"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </section>

          {/* Dynamic Mid-Page Strip (Managed via Admin Panel) */}
          <section className="container mx-auto px-3 sm:px-4 my-6 text-left">
            <DynamicBannerStrip placement="home_strip" />
          </section>

          {/* 🍔 3. FOOD & DINING SPECIALS */}
          <section className="container mx-auto px-3 sm:px-4 my-6 py-6 text-left bg-gradient-to-r from-orange-500/15 via-red-500/10 to-amber-500/10 border border-orange-300/60 rounded-[32px] shadow-sm">
            <div className="flex items-center justify-between mb-4 px-2">
              <div>
                <span className="inline-flex items-center space-x-1.5 text-[10px] font-black uppercase tracking-wider bg-orange-600 text-white px-2.5 py-0.5 rounded-full shadow-xs mb-1">
                  <span>🔥 SIZZLING HOT</span>
                </span>
                <h2 className="text-lg sm:text-2xl font-black text-[#0A1128] font-heading flex items-center space-x-2">
                  <span>🍔</span>
                  <span>Food &amp; Dining Specials</span>
                </h2>
                <p className="text-xs text-slate-600 font-medium mt-0.5">Authentic biryani, dosas, thalis &amp; gourmet tiffins</p>
              </div>
              <Button variant="outline" size="sm" className="rounded-2xl border-orange-300 bg-white text-orange-900 font-extrabold text-xs hover:bg-orange-600 hover:text-white cursor-pointer shadow-xs transition" onClick={() => navigate("/food")}>
                View All →
              </Button>
            </div>

            <div className="relative group px-1">
              <button
                onClick={() => scrollHorizontally("food-products-scroll", "left")}
                className="absolute -left-2 sm:left-0 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/95 shadow-lg border border-orange-200 flex items-center justify-center text-orange-900 hover:bg-orange-600 hover:text-white transition-all cursor-pointer border-none"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <div id="food-products-scroll" className="flex gap-4 overflow-x-auto scrollbar-none pb-2 pt-1 scroll-smooth">
                {foodProducts.map((p) => (
                  <ProductCard key={p._id || (p as any).id} product={p} />
                ))}
              </div>

              <button
                onClick={() => scrollHorizontally("food-products-scroll", "right")}
                className="absolute -right-2 sm:right-0 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/95 shadow-lg border border-orange-200 flex items-center justify-center text-orange-900 hover:bg-orange-600 hover:text-white transition-all cursor-pointer border-none"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </section>

          {/* 🎁 RAKSHA BANDHAN FESTIVAL OFFERS BANNER */}
          <section className="container mx-auto px-3 sm:px-4 my-4 sm:my-6 text-left">
            <div className="relative rounded-2xl sm:rounded-[32px] overflow-hidden p-4 sm:p-7 md:p-8 bg-gradient-to-r from-rose-700 via-purple-700 to-indigo-900 text-white shadow-xl border border-rose-400/40">
              <div className="absolute -bottom-10 right-10 w-72 h-72 bg-pink-400/20 rounded-full blur-[80px] pointer-events-none" />

              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
                <div className="space-y-2 sm:space-y-3 max-w-xl">
                  <div className="flex items-center space-x-2">
                    <span className="bg-amber-400 text-slate-950 text-[10px] sm:text-xs font-black px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full shadow-md animate-pulse">
                      ✨ 20% OFF
                    </span>
                    <span className="text-[10px] sm:text-xs font-mono font-bold bg-white/20 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full border border-white/20">
                      CODE: <span className="text-amber-300 font-extrabold">RAKHI20</span>
                    </span>
                  </div>

                  <h3 className="text-lg sm:text-2xl md:text-3.5xl font-black font-heading tracking-tight text-white leading-tight">
                    Festival Raksha Bandhan Offers 🎁
                  </h3>

                  <p className="text-[11px] sm:text-sm text-rose-100 font-medium leading-relaxed line-clamp-2 sm:line-clamp-none">
                    Send local sweet boxes, Kaju Katli, Motichoor Ladoos &amp; handcrafted designer rakhis to siblings. Get flat 20% off from verified local sweet shops near you.
                  </p>
                </div>

                <div className="shrink-0 flex flex-col items-stretch sm:items-center md:items-end justify-center space-y-1.5 sm:space-y-2">
                  <button
                    type="button"
                    onClick={() => navigate("/food")}
                    className="w-full sm:w-auto px-5 sm:px-6 py-2.5 sm:py-3.5 bg-white hover:bg-rose-50 text-rose-950 font-black text-xs sm:text-sm rounded-xl sm:rounded-2xl transition duration-300 shadow-xl flex items-center justify-center space-x-2 cursor-pointer border-none"
                  >
                    <span>🎁 Send Sweets &amp; Rakhis</span>
                    <ChevronRight className="w-4 h-4 text-rose-950" />
                  </button>
                  <span className="text-[9px] sm:text-[10px] font-bold text-rose-200 text-center">🚚 Same-day Doorstep Delivery</span>
                </div>
              </div>
            </div>
          </section>

          {/* 👗 4. SHOPPING & FASHION PRODUCTS */}
          <section className="container mx-auto px-3 sm:px-4 my-6 py-6 text-left bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-pink-500/10 border border-purple-200/60 rounded-[32px] shadow-sm">
            <div className="flex items-center justify-between mb-4 px-2">
              <div>
                <span className="inline-flex items-center space-x-1.5 text-[10px] font-black uppercase tracking-wider bg-purple-700 text-white px-2.5 py-0.5 rounded-full shadow-xs mb-1">
                  <span>✨ BOUTIQUE &amp; TRENDS</span>
                </span>
                <h2 className="text-lg sm:text-2xl font-black text-[#0A1128] font-heading flex items-center space-x-2">
                  <span>👗</span>
                  <span>Shopping &amp; Fashion Trends</span>
                </h2>
                <p className="text-xs text-slate-600 font-medium mt-0.5">Silk sarees, oxford shirts, electronics &amp; boutique apparel</p>
              </div>
              <Button variant="outline" size="sm" className="rounded-2xl border-purple-300 bg-white text-purple-900 font-extrabold text-xs hover:bg-purple-700 hover:text-white cursor-pointer shadow-xs transition" onClick={() => navigate("/categories")}>
                View All →
              </Button>
            </div>

            <div className="relative group px-1">
              <button
                onClick={() => scrollHorizontally("shopping-products-scroll", "left")}
                className="absolute -left-2 sm:left-0 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/95 shadow-lg border border-purple-200 flex items-center justify-center text-purple-900 hover:bg-purple-700 hover:text-white transition-all cursor-pointer border-none"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <div id="shopping-products-scroll" className="flex gap-4 overflow-x-auto scrollbar-none pb-2 pt-1 scroll-smooth">
                {shoppingProducts.map((p) => (
                  <ProductCard key={p._id || (p as any).id} product={p} />
                ))}
              </div>

              <button
                onClick={() => scrollHorizontally("shopping-products-scroll", "right")}
                className="absolute -right-2 sm:right-0 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/95 shadow-lg border border-purple-200 flex items-center justify-center text-purple-900 hover:bg-purple-700 hover:text-white transition-all cursor-pointer border-none"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </section>

          {/* 👕 DUAL BANNER: FASHION & LIFESTYLE */}
          <section className="container mx-auto px-3 sm:px-4 py-2 sm:py-3">
            <div className="flex md:grid md:grid-cols-2 gap-3 sm:gap-4 overflow-x-auto scrollbar-none snap-x snap-mandatory pb-1 -mx-3 px-3 sm:mx-0 sm:px-0 scroll-smooth">
              {/* ETHNIC SAREES & FESTIVE WEAR */}
              <div
                onClick={() => navigate("/category/Fashion & Boutique")}
                className="w-[80vw] sm:w-80 md:w-full h-40 sm:h-44 md:h-52 snap-start shrink-0 bg-gradient-to-r from-purple-700 via-pink-700 to-rose-900 text-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 md:p-5 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer relative overflow-hidden group flex items-center justify-between gap-2.5 sm:gap-4"
              >
                <div className="space-y-1 sm:space-y-1.5 z-10 flex-1 min-w-0 text-left">
                  <span className="inline-block bg-amber-300 text-purple-950 px-2 py-0.5 rounded-full text-[8.5px] sm:text-[9.5px] font-black uppercase tracking-wider">
                    ✨ Flat 60% OFF
                  </span>
                  <h3 className="text-sm sm:text-lg md:text-xl font-black leading-tight text-white line-clamp-1 xs:line-clamp-2">
                    Ethnic Sarees &amp; Wear
                  </h3>
                  <p className="text-[10px] sm:text-xs text-pink-100 font-medium line-clamp-2">
                    Silk sarees, festive kurtis, and designer ethnic wear from local boutiques.
                  </p>
                  <span className="inline-flex items-center gap-1 bg-white text-purple-950 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl font-black text-[10px] sm:text-xs mt-0.5 sm:mt-1 shadow-md group-hover:scale-105 active:scale-95 transition-transform">
                    👗 Explore Ethnic Wear &rarr;
                  </span>
                </div>
                <img
                  src="https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=300&auto=format&fit=crop&q=80"
                  alt="Fashion"
                  className="w-16 h-16 xs:w-20 xs:h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 object-cover rounded-xl sm:rounded-2xl shadow-md group-hover:scale-110 transition duration-500 shrink-0"
                />
              </div>

              {/* FOOTWEAR & WATCHES */}
              <div
                onClick={() => navigate("/category/Fashion & Boutique")}
                className="w-[80vw] sm:w-80 md:w-full h-40 sm:h-44 md:h-52 snap-start shrink-0 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-950 text-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 md:p-5 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer relative overflow-hidden group flex items-center justify-between gap-2.5 sm:gap-4 border border-white/10"
              >
                <div className="space-y-1 sm:space-y-1.5 z-10 flex-1 min-w-0 text-left">
                  <span className="inline-block bg-cyan-400 text-slate-950 px-2 py-0.5 rounded-full text-[8.5px] sm:text-[9.5px] font-black uppercase tracking-wider">
                    👟 Buy 1 Get 1 Free
                  </span>
                  <h3 className="text-sm sm:text-lg md:text-xl font-black leading-tight text-white line-clamp-1 xs:line-clamp-2">
                    Footwear &amp; Accessories
                  </h3>
                  <p className="text-[10px] sm:text-xs text-slate-300 font-medium line-clamp-2">
                    Trendy sneakers, formal shoes, smartwatches, and sunglasses at outlet prices.
                  </p>
                  <span className="inline-flex items-center gap-1 bg-cyan-400 text-slate-950 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl font-black text-[10px] sm:text-xs mt-0.5 sm:mt-1 shadow-md group-hover:scale-105 active:scale-95 transition-transform">
                    👟 Shop Accessories &rarr;
                  </span>
                </div>
                <img
                  src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&auto=format&fit=crop&q=80"
                  alt="Shoes"
                  className="w-16 h-16 xs:w-20 xs:h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 object-cover rounded-xl sm:rounded-2xl shadow-md group-hover:scale-110 transition duration-500 shrink-0"
                />
              </div>
            </div>
          </section>

          {/* 💊 DUAL BANNER: PHARMACY & LOCAL HOME SERVICES */}
          <section className="container mx-auto px-3 sm:px-4 py-2 sm:py-3">
            <div className="flex md:grid md:grid-cols-2 gap-3 sm:gap-4 overflow-x-auto scrollbar-none snap-x snap-mandatory pb-1 -mx-3 px-3 sm:mx-0 sm:px-0 scroll-smooth">
              {/* EXPRESS PHARMACY & MEDICINES */}
              <div
                onClick={() => navigate("/category/Health & Wellness")}
                className="w-[80vw] sm:w-80 md:w-full h-40 sm:h-44 md:h-52 snap-start shrink-0 bg-gradient-to-r from-teal-700 via-emerald-800 to-slate-950 text-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 md:p-5 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer relative overflow-hidden group flex items-center justify-between gap-2.5 sm:gap-4"
              >
                <div className="space-y-1 sm:space-y-1.5 z-10 flex-1 min-w-0 text-left">
                  <span className="inline-block bg-white/20 backdrop-blur-md px-2 py-0.5 rounded-full text-[8.5px] sm:text-[9.5px] font-black uppercase tracking-wider text-teal-100">
                    💊 15-Min Pharmacy
                  </span>
                  <h3 className="text-sm sm:text-lg md:text-xl font-black leading-tight text-white line-clamp-1 xs:line-clamp-2">
                    Essential Medicines
                  </h3>
                  <p className="text-[10px] sm:text-xs text-teal-100 font-medium line-clamp-2">
                    Prescription medicines, daily vitamins &amp; baby care from certified chemists.
                  </p>
                  <span className="inline-flex items-center gap-1 bg-white text-teal-950 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl font-black text-[10px] sm:text-xs mt-0.5 sm:mt-1 shadow-md group-hover:scale-105 active:scale-95 transition-transform">
                    💊 Order Medicines &rarr;
                  </span>
                </div>
                <img
                  src="https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&auto=format&fit=crop&q=80"
                  alt="Pharmacy"
                  className="w-16 h-16 xs:w-20 xs:h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 object-cover rounded-xl sm:rounded-2xl shadow-md group-hover:scale-110 transition duration-500 shrink-0"
                />
              </div>

              {/* HOME SERVICES & REPAIR */}
              <div
                onClick={() => navigate("/services")}
                className="w-[80vw] sm:w-80 md:w-full h-40 sm:h-44 md:h-52 snap-start shrink-0 bg-gradient-to-r from-[#0A1128] via-[#1e3c72] to-[#2a5298] text-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 md:p-5 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer relative overflow-hidden group flex items-center justify-between gap-2.5 sm:gap-4 border border-white/10"
              >
                <div className="space-y-1 sm:space-y-1.5 z-10 flex-1 min-w-0 text-left">
                  <span className="inline-block bg-amber-400 text-[#0A1128] px-2 py-0.5 rounded-full text-[8.5px] sm:text-[9.5px] font-black uppercase tracking-wider">
                    🔧 Verified Professionals
                  </span>
                  <h3 className="text-sm sm:text-lg md:text-xl font-black leading-tight text-white line-clamp-1 xs:line-clamp-2">
                    Home Repair &amp; Cleaning
                  </h3>
                  <p className="text-[10px] sm:text-xs text-slate-300 font-medium line-clamp-2">
                    Electricians, plumbers, AC repair mechanics &amp; home deep cleaning.
                  </p>
                  <span className="inline-flex items-center gap-1 bg-amber-400 text-[#0A1128] px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl font-black text-[10px] sm:text-xs mt-0.5 sm:mt-1 shadow-md group-hover:scale-105 active:scale-95 transition-transform">
                    🛠️ Book Expert Service &rarr;
                  </span>
                </div>
                <img
                  src="https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=300&auto=format&fit=crop&q=80"
                  alt="Services"
                  className="w-16 h-16 xs:w-20 xs:h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 object-cover rounded-xl sm:rounded-2xl shadow-md group-hover:scale-110 transition duration-500 shrink-0"
                />
              </div>
            </div>
          </section>

          {/* Daily Deals Block */}
          <section className="container mx-auto px-4 py-6">
            <div className="rounded-3xl border bg-gradient-to-r from-yellow-50 to-orange-50 p-6 md:p-8">
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-4">
                <div className="text-left">
                  <div className="inline-flex items-center gap-2 text-[10px] font-bold bg-white/70 px-3 py-1 rounded-full text-yellow-800">
                    <Flame className="h-3.5 w-3.5" /> DAILY DEALS
                  </div>
                  <h2 className="text-xl font-extrabold text-navy mt-3">Daily Deals</h2>
                  <p className="text-xs text-muted-foreground mt-1 font-medium">
                    Limited time offers. Grab them before they end!
                  </p>
                </div>
                <Button className="bg-yellow-500 hover:bg-yellow-600 text-navy font-bold text-xs border-none cursor-pointer" onClick={() => navigate("/products")}>
                  See All Deals
                </Button>
              </div>

              <div className="relative group">
                <button
                  onClick={() => scrollHorizontally("deals-products-scroll", "left")}
                  className="absolute -left-2 sm:left-0 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/95 shadow-xl border border-amber-200 flex items-center justify-center text-navy hover:bg-navy hover:text-white transition-all cursor-pointer"
                  aria-label="Scroll Left"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>

                {dealsLoading ? (
                  <div className="flex gap-4 overflow-x-auto scrollbar-none scrollbar-hide no-scrollbar pb-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="min-w-[190px] xs:min-w-[210px] sm:min-w-[240px] max-w-[240px] flex-shrink-0 rounded-2xl border bg-white overflow-hidden">
                        <Skeleton className="h-44 w-full" />
                        <div className="p-4 space-y-2">
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-4 w-1/2" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : dealProducts.length === 0 ? (
                  <div className="rounded-2xl border bg-white/60 p-10 text-center text-muted-foreground text-sm">
                    No deals available right now.
                  </div>
                ) : (
                  <div id="deals-products-scroll" className="flex gap-4 overflow-x-auto scrollbar-none scrollbar-hide no-scrollbar pb-4 pt-1 scroll-smooth">
                    {dealProducts.map((p) => (
                      <ProductCard key={p._id || (p as any).id} product={p} />
                    ))}
                  </div>
                )}

                <button
                  onClick={() => scrollHorizontally("deals-products-scroll", "right")}
                  className="absolute -right-2 sm:right-0 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/95 shadow-xl border border-amber-200 flex items-center justify-center text-navy hover:bg-navy hover:text-white transition-all cursor-pointer"
                  aria-label="Scroll Right"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          </section>

          {/* Buy Again (Recently Purchased) */}
          {loggedInUser && buyAgainProducts.length > 0 && (
            <section className="container mx-auto px-4 py-4 text-left">
              <h2 className="text-lg font-black text-navy mb-4 flex items-center gap-2">
                🔄 Buy Again (Recently Purchased)
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {buyAgainProducts.slice(0, 4).map((p) => {
                  const title = getProductTitle(p);
                  const img = getProductImage(p);
                  const { price } = getDisplayPrices(p);
                  return (
                    <div key={p._id} className="border border-slate-100 bg-white rounded-3xl p-4 flex flex-col justify-between hover:shadow-premium-hover shadow-sm transition">
                      <div>
                        <div className="h-28 bg-slate-50 rounded-2xl overflow-hidden mb-3">
                          <img src={img} alt={title} className="w-full h-full object-cover" />
                        </div>
                        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-wider">{p.brand || "ApexBee Seller"}</p>
                        <h4 className="font-extrabold text-navy text-xs mt-1 leading-tight line-clamp-2 min-h-[32px]">{title}</h4>
                        <p className="font-black text-navy text-sm mt-2">₹{price}</p>
                      </div>
                      <Button
                        size="sm"
                        className="w-full mt-3 bg-accent hover:bg-accent/90 text-white font-bold text-xs rounded-xl"
                        onClick={() => handleBuyAgainAdd(p)}
                      >
                        + Add One Click
                      </Button>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* 7. Nearby Stores (Premium Cards Layout) */}
          <section className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 text-left">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
              <div className="text-left">
                <h2 className="text-xl sm:text-2xl font-black text-[#0A1128] font-heading flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-500 border border-amber-200 flex items-center justify-center font-bold shrink-0">
                    <Store className="w-4 h-4" />
                  </div>
                  <span>Nearby Local Stores &amp; Essentials</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  Verified neighborhood merchants delivering same-day to{" "}
                  <strong className="text-[#0A1128] font-black">
                    {userLocation?.colony ? `${userLocation.colony} - ` : ""}
                    {userLocation?.pincode || "your area"}
                  </strong>
                </p>
              </div>
              <Button variant="outline" size="sm" className="rounded-2xl border-slate-200 text-[#0A1128] font-black text-xs hover:bg-slate-100 cursor-pointer shrink-0 shadow-xs" onClick={() => navigate("/local-stores")}>
                Explore Local Market →
              </Button>
            </div>

            {shopsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-72 bg-white rounded-3xl border border-slate-200 shadow-sm animate-pulse" />
                ))}
              </div>
            ) : (() => {
              const userLocRaw = localStorage.getItem("userLocation");
              const userLocationObj = userLocRaw ? JSON.parse(userLocRaw) : userLocation;
              const activePin = (localStorage.getItem("userPincode") || userLocationObj?.pincode || localStorage.getItem("pincode") || "").toString().trim();

              const filteredShops = (nearbyShops || []).filter((shop: any) => {
                if (activePin) {
                  const shopPin = (shop.pincode || shop.pinCode || shop.address?.pincode || "").toString().trim();
                  if (shopPin && shopPin !== activePin) return false;
                }
                return true;
              });

              if (filteredShops.length === 0) {
                return (
                  <div className="col-span-full rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm space-y-2">
                    <Store className="w-10 h-10 text-slate-300 mx-auto" />
                    <h4 className="font-extrabold text-slate-800 text-sm">No Local Stores Found Near Location</h4>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">Try setting your location via GPS or search in nearby pincodes.</p>
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 transform-gpu">
                  {filteredShops.slice(0, 6).map((shop: any) => {
                    const defaultImage = "https://images.unsplash.com/photo-1578916171728-46686eac8d58?q=80&w=800&auto=format&fit=crop";
                    const displayImage = shop.storeDesign?.bannerUrl || shop.bannerImage || shop.logo || defaultImage;
                    const ratingAvg = shop.rating?.average || 4.8;
                    const distance = shop.distanceInKm ? `${Number(shop.distanceInKm).toFixed(1)} km` : `${shop.distance || "1.2"} km`;
                    const deliveryTime = `${shop.estimatedDeliveryMinutes || 25} mins`;
                    const firstOffer = shop.offers?.[0];
                    const isOpen = shop.computedAvailability === 'open' || shop.isOpen !== false;

                    return (
                      <div
                        key={shop._id}
                        onClick={() => navigate(`/business/${shop._id}`)}
                        className="group bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-md hover:shadow-2xl hover:border-amber-400 transition-all duration-500 hover:-translate-y-1.5 flex flex-col justify-between cursor-pointer"
                      >
                        <div>
                          {/* COVER IMAGE WITH GRADIENT OVERLAY */}
                          <div className="h-48 bg-slate-100 relative overflow-hidden">
                            <img
                              src={displayImage}
                              alt={shop.businessName}
                              className="w-full h-full object-cover group-hover:scale-110 transition duration-700"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-black/30" />

                            {/* STATUS & OFFER BADGES */}
                            <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-md backdrop-blur-md flex items-center space-x-1 ${isOpen ? 'bg-emerald-500/90 text-white' : 'bg-rose-500/90 text-white'}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${isOpen ? 'bg-white animate-pulse' : 'bg-white'}`} />
                                <span>{isOpen ? 'OPEN NOW' : 'CLOSED'}</span>
                              </span>

                              {firstOffer && (
                                <span className="px-2.5 py-1 bg-amber-400 text-slate-950 rounded-full font-black text-[10px] shadow-md flex items-center space-x-1">
                                  <Tag className="w-3 h-3 text-slate-950" />
                                  <span>{firstOffer.title}</span>
                                </span>
                              )}
                            </div>

                            {/* RATING BADGE */}
                            <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-xl text-xs font-black text-amber-600 flex items-center space-x-1 shadow-md border border-amber-200/80 z-10">
                              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                              <span>{ratingAvg}</span>
                            </div>

                            {/* DISTANCE & TIME FLOATING STRIP */}
                            <div className="absolute bottom-3 left-3 flex items-center space-x-2 text-white text-[11px] font-bold z-10">
                              <span className="bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-xl flex items-center space-x-1 border border-white/10">
                                <Clock className="w-3 h-3 text-amber-400" />
                                <span>{deliveryTime}</span>
                              </span>
                              <span className="bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-xl flex items-center space-x-1 border border-white/10">
                                <MapPin className="w-3 h-3 text-amber-400" />
                                <span>{distance}</span>
                              </span>
                            </div>
                          </div>

                          {/* STORE DETAILS */}
                          <div className="p-5 space-y-2.5">
                            <div className="flex items-start justify-between gap-2">
                              <div className="space-y-0.5 min-w-0">
                                <h3 className="font-black text-lg text-[#0A1128] group-hover:text-amber-600 transition font-heading truncate">
                                  {shop.businessName}
                                </h3>
                                <p className="text-xs text-slate-500 line-clamp-1 font-medium">
                                  {shop.industryType || shop.businessTypes?.join(', ') || 'Local Store & Daily Essentials'}
                                </p>
                              </div>

                              {(shop.verifiedBadge || shop.isVerified !== false) && (
                                <span className="p-1 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-200 shrink-0" title="Verified Store">
                                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                                </span>
                              )}
                            </div>

                            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-semibold gap-2">
                              <span className="truncate">📍 {shop.locality || (shop.mandal ? `${shop.mandal}, ${shop.district || ''}` : '') || shop.district || shop.city || shop.village || (shop.pincode ? `PIN ${shop.pincode}` : shop.state) || 'Local Store'}</span>
                              <span className="text-amber-600 font-bold shrink-0">Same-Day Express</span>
                            </div>
                          </div>
                        </div>

                        {/* ACTION BUTTON */}
                        <div className="px-5 pb-5 pt-1">
                          <div className="w-full py-2.5 bg-slate-100 group-hover:bg-[#0A1128] text-slate-800 group-hover:text-amber-400 font-black text-xs rounded-2xl transition duration-300 text-center flex items-center justify-center space-x-1 shadow-xs">
                            <span>Visit Store &amp; Shop</span>
                            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </section>

          {/* 8. Nearby Restaurants & Food Outlets (Dynamic Time-of-Day Specials) */}
          <section className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 text-left">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
              <div className="text-left">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 font-bold text-[10px] uppercase tracking-wider mb-1.5">
                  {foodMealDetails.badge}
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-[#0A1128] font-heading flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-500 border border-amber-200 flex items-center justify-center font-bold shrink-0">
                    <Utensils className="w-4 h-4" />
                  </div>
                  <span>{foodMealDetails.title}</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1 font-medium">{foodMealDetails.subtitle}</p>
              </div>
              <Button variant="outline" size="sm" className="rounded-2xl border-slate-200 text-[#0A1128] font-black text-xs hover:bg-slate-100 cursor-pointer shrink-0 shadow-xs" onClick={() => navigate("/food")}>
                Explore All Food &amp; Dining →
              </Button>
            </div>

            {(() => {
              const displayList = nearbyRestaurantsList.length > 0
                ? nearbyRestaurantsList
                : (nearbyShops || []).filter(s => {
                  const cat = (s.category || (s.categories && s.categories[0]) || "").toLowerCase();
                  const name = (s.businessName || "").toLowerCase();
                  return cat.includes("food") || cat.includes("restaurant") || name.includes("restaurant") || name.includes("biryani") || name.includes("bistro") || name.includes("cafe") || name.includes("diner");
                });

              if (restaurantsLoading) {
                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="h-72 bg-white rounded-3xl border border-slate-200 shadow-sm animate-pulse" />
                    ))}
                  </div>
                );
              }

              if (displayList.length === 0) {
                return (
                  <div className="rounded-3xl border border-amber-200/60 bg-amber-50/40 p-8 text-center text-muted-foreground space-y-2">
                    <Utensils className="w-10 h-10 text-amber-500 mx-auto" />
                    <h4 className="font-extrabold text-slate-800 text-sm">No Nearby Food Outlets Registered Yet</h4>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">Food partner outlets will appear live as soon as they are approved by Admin.</p>
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 transform-gpu">
                  {displayList.slice(0, 6).map((rest: any, idx: number) => {
                    const defaultImage = "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=800&auto=format&fit=crop";
                    const displayImage = rest.bannerImage || rest.coverImage || rest.logo || rest.image || defaultImage;
                    const ratingAvg = rest.rating?.average ? rest.rating.average : (typeof rest.rating === 'string' ? rest.rating : '4.8');
                    const name = rest.name || rest.businessName || "Restaurant Partner";
                    const cuisines = Array.isArray(rest.cuisines) ? rest.cuisines.join(', ') : (rest.cuisines || rest.food || 'Multi-Cuisine');
                    const eta = `${rest.averagePreparationMinutes || rest.estimatedDeliveryMinutes || 20} mins`;
                    const locality = rest.locality || rest.city || 'Hyderabad';
                    const isOpen = rest.isOpen !== false;
                    const id = rest.id || rest._id;

                    return (
                      <div
                        key={id || idx}
                        onClick={() => navigate(`/food/restaurant/${id}`)}
                        className="group bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-md hover:shadow-2xl hover:border-amber-400 transition-all duration-500 hover:-translate-y-1.5 flex flex-col justify-between cursor-pointer"
                      >
                        <div>
                          {/* BANNER COVER */}
                          <div className="h-48 bg-slate-100 relative overflow-hidden">
                            <img
                              src={displayImage}
                              alt={name}
                              className="w-full h-full object-cover group-hover:scale-110 transition duration-700"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-black/30" />

                            {/* STATUS & ACTIVE OFFER BADGES */}
                            <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-md backdrop-blur-md flex items-center space-x-1 ${isOpen ? 'bg-emerald-500/90 text-white' : 'bg-rose-500/90 text-white'}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${isOpen ? 'bg-white animate-pulse' : 'bg-white'}`} />
                                <span>{isOpen ? 'OPEN NOW' : 'CLOSED'}</span>
                              </span>

                              {rest.activeOfferSummary && (
                                <span className="px-2.5 py-1 bg-amber-400 text-slate-950 rounded-full font-black text-[10px] shadow-md flex items-center space-x-1">
                                  <Tag className="w-3 h-3 text-slate-950" />
                                  <span>{rest.activeOfferSummary}</span>
                                </span>
                              )}
                            </div>

                            {/* RATING BADGE */}
                            <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-xl text-xs font-black text-amber-600 flex items-center space-x-1 shadow-md border border-amber-200/80 z-10">
                              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                              <span>{ratingAvg}</span>
                            </div>

                            {/* FLOATING PREP TIME STRIP */}
                            <div className="absolute bottom-3 left-3 flex items-center space-x-2 text-white text-[11px] font-bold z-10">
                              <span className="bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-xl flex items-center space-x-1 border border-white/10">
                                <Clock className="w-3 h-3 text-amber-400" />
                                <span>{eta}</span>
                              </span>
                            </div>
                          </div>

                          {/* BODY DETAILS */}
                          <div className="p-5 space-y-2.5">
                            <div className="flex items-start justify-between gap-2">
                              <div className="space-y-0.5 min-w-0">
                                <h3 className="font-black text-lg text-[#0A1128] group-hover:text-amber-600 transition font-heading truncate">
                                  {name}
                                </h3>
                                <p className="text-xs text-amber-600 font-bold line-clamp-1">
                                  {cuisines}
                                </p>
                              </div>
                              <span className="p-1 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-200 shrink-0" title="FSSAI Verified">
                                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                              </span>
                            </div>

                            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-semibold">
                              <span>📍 {locality}</span>
                              <span className="text-emerald-600 font-bold">Express Delivery</span>
                            </div>
                          </div>
                        </div>

                        {/* ACTION BUTTON */}
                        <div className="px-5 pb-5 pt-1">
                          <div className="w-full py-2.5 bg-slate-100 group-hover:bg-[#0A1128] text-slate-800 group-hover:text-amber-400 font-black text-xs rounded-2xl transition duration-300 text-center flex items-center justify-center space-x-1 shadow-xs">
                            <span>Explore Menu &amp; Order</span>
                            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </section>

          {/* 9. Nearby Services (Featured Services) */}
          {homeServices && homeServices.length > 0 && (
            <section className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 bg-blue-light/20 rounded-2xl sm:rounded-3xl border my-3 sm:my-6 text-left">
              <div className="flex items-center justify-between mb-3 sm:mb-6">
                <div className="text-left">
                  <h2 className="text-lg sm:text-xl font-bold text-navy">Featured Services</h2>
                  <p className="text-xs text-muted-foreground mt-0.5 sm:mt-1">Book reliable home & commercial services locally.</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => navigate("/services")}>
                  Book Services
                </Button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {homeServices.map((svc: any, idx) => (
                  <div key={svc.id || idx} className="bg-white border rounded-2xl overflow-hidden hover:shadow-md transition group text-left shadow-sm cursor-pointer" onClick={() => navigate("/services")}>
                    <div className="h-28 bg-muted overflow-hidden relative">
                      <img
                        src={svc.image}
                        alt={svc.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="p-3">
                      <h4 className="font-bold text-navy text-xs line-clamp-1 group-hover:text-accent transition-colors">{svc.title}</h4>
                      <p className="text-[11px] text-green-700 font-semibold mt-1">{svc.price}</p>
                      <div className="flex items-center gap-1.5 mt-2 text-[10px] text-muted-foreground">
                        <span className="text-navy font-semibold">★ {svc.rating}</span>
                        <span>({svc.reviews})</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 10. Festival Quick-Action Widget */}
          <section className="container mx-auto px-3 sm:px-4 py-1.5 sm:py-2 text-left">
            <div className="bg-gradient-to-r from-amber-600 via-rose-600 to-pink-600 text-white rounded-2xl sm:rounded-[32px] p-4 sm:p-6 shadow-md relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6 border border-amber-500/20">
              <div className="absolute right-0 top-0 opacity-10 pointer-events-none text-9xl font-bold translate-x-5 -translate-y-5">🌸</div>
              <div className="space-y-2.5 max-w-xl z-10">
                <span className="text-[9px] font-black text-amber-200 bg-white/10 px-2.5 py-0.5 rounded-full uppercase tracking-wider font-mono">Festival Specials</span>
                <h3 className="text-xl font-black text-white">{personalization?.festival?.title || "🪔 Varalakshmi Vratham is coming up!"}</h3>
                <p className="text-xs text-white/90 leading-relaxed font-semibold">{personalization?.festival?.desc || "Ensure complete puja preparation. Instantly book your bundle or custom items with 30-min guaranteed doorstep delivery."}</p>
                <div className="flex flex-wrap items-center gap-1.5 pt-1 font-bold">
                  {(personalization?.festival?.items || ["🌼 Flowers", "🍎 Fruits", "🛍 Pooja Kit", "🥥 Coconut", "🍌 Banana", "🪔 Deepam"]).map((item: string) => (
                    <span key={item} className="text-[9px] bg-white/20 border border-white/10 px-2.5 py-1 rounded-full backdrop-blur-sm cursor-pointer hover:bg-white/30 transition" onClick={() => navigate("/categories")}>{item}</span>
                  ))}
                </div>
              </div>
              <Button
                onClick={() => navigate("/categories")}
                className="bg-white hover:bg-slate-50 text-rose-600 hover:scale-105 transition-all duration-300 font-extrabold text-xs rounded-xl px-6 py-3.5 shadow-lg shrink-0 border-none cursor-pointer z-10"
              >
                {personalization?.festival?.actionLabel || "🛒 Order Puja Bundle"}
              </Button>
            </div>
          </section>

          {/* Festival Raksha Bandhan Offers Banner Card */}
          <section className="container mx-auto px-3 sm:px-4 py-1.5 text-left">
            <div className="bg-gradient-to-r from-pink-500 to-rose-600 text-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4 relative overflow-hidden">
              <div className="absolute right-0 top-0 opacity-10 pointer-events-none text-7xl font-bold">✨</div>
              <div className="z-10 max-w-lg">
                <div className="inline-block bg-white/20 text-white font-bold text-[9px] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  {festivalBanner?.discount || "20% OFF"}
                </div>
                <h4 className="font-extrabold text-sm sm:text-base mt-1.5">{festivalBanner?.title || "Festival Raksha Bandhan Offers!"} 🎁</h4>
                <p className="text-[11px] text-white/90 mt-1 leading-relaxed">{festivalBanner?.description || "Send local sweet boxes to siblings. Get 20% off from local sweet shops."}</p>
              </div>
              <Button
                onClick={() => navigate(festivalBanner?.link || "/categories")}
                className="bg-white hover:bg-slate-100 text-rose-600 font-bold text-xs rounded-xl shrink-0 z-10 py-2.5 px-4 shadow border-none cursor-pointer"
              >
                View Festive Deals
              </Button>
            </div>
          </section>

          {/* 11. AI Suggestions widget (Abhi Suggests) */}
          <section className="container mx-auto px-3 sm:px-4 py-1.5 text-left">
            <div className="bg-gradient-to-r from-amber-50/70 via-yellow-50/40 to-white border border-amber-200/60 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex items-center gap-3">
                <span className="text-2xl animate-bounce">🐝</span>
                <div>
                  <h4 className="font-extrabold text-navy text-xs leading-none font-sans flex items-center gap-1.5">
                    {personalization?.aiSuggest?.label || "Abhi Suggests"} <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping" />
                  </h4>
                  <p className="text-[11px] text-slate-600 mt-1.5 leading-snug">{personalization?.aiSuggest?.desc || "Last week list block item Tomatoes order chesaru. Need a quick reorder?"}</p>
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => {
                  alert(`${personalization?.aiSuggest?.item || "Tomatoes"} added to basket!`);
                }}
                className="bg-amber-500 hover:bg-amber-600 hover:scale-105 transition-all duration-300 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer shrink-0 border-none"
              >
                🔄 Order Again
              </Button>
            </div>
          </section>





          {/* 12. ApexBee Academy */}
          {academyCourses && academyCourses.length > 0 && (
            <section className="container mx-auto px-4 py-8 text-left">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div className="text-left">
                  <h2 className="text-xl font-bold text-navy">ApexBee Academy</h2>
                  <p className="text-xs text-muted-foreground mt-1">Upgrade your skills, build your business network, and earn certifications.</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => navigate("/academy")}>
                  Explore Academy
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {academyCourses.slice(0, 3).map((course: any, idx: number) => (
                  <div key={idx} className="border rounded-2xl bg-white overflow-hidden hover:shadow-md transition flex flex-col justify-between text-left shadow-sm">
                    <div>
                      <div className="h-36 bg-muted overflow-hidden">
                        <img src={course.image} alt={course.title} className="w-full h-full object-cover" />
                      </div>
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[9px] font-black text-rose-600 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded uppercase tracking-wider">
                            {course.badge}
                          </span>
                          <span className="text-[10px] text-slate-500 font-bold">
                            👤 {course.students} students
                          </span>
                        </div>
                        <h4 className="font-bold text-navy text-sm line-clamp-1">{course.title}</h4>
                        <p className="text-xs text-muted-foreground mt-2 line-clamp-2 leading-relaxed font-medium">{course.description}</p>
                      </div>
                    </div>
                    <div className="px-4 pb-4 pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-muted-foreground font-bold">
                      <span>{course.duration}</span>
                      <span className="font-semibold text-navy">★ {course.rating}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 13. Business Promotion Hub */}
          <section className="container mx-auto px-4 py-4 text-left">
            <div className="bg-gradient-to-br from-navy to-navy-dark border rounded-3xl p-6 text-white relative overflow-hidden shadow-xl">
              <div className="absolute right-0 top-0 opacity-10 pointer-events-none text-9xl font-bold">💼</div>
              <div className="max-w-2xl text-left">
                <span className="text-[10px] font-black text-accent uppercase tracking-wider font-mono">Business Promotion Hub</span>
                <h3 className="text-xl font-black text-white mt-1">Scale Your Business Locally 🚀</h3>
                <p className="text-xs text-white/80 mt-1 leading-relaxed">
                  Join the fastest growing hyperlocal network. List products, offer services, deliver parcels, or host courses with direct access to local audiences.
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mt-6">
                {(personalization?.businessHub || [
                  { label: "Start Selling", role: "vendor", icon: "🏪" },
                  { label: "Become Vendor", role: "vendor", icon: "🤝" },
                  { label: "Become Delivery Partner", role: "delivery", icon: "🚚" },
                  { label: "Become Franchise", role: "franchise", icon: "🗺" },
                  { label: "Become Course Creator", role: "creator", icon: "🎓" },
                  { label: "Become Business Advisor", role: "advisor", icon: "👔" }
                ]).map((hub: any, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => navigate(`/register?ref=${hub.role}`)}
                    className="p-3 bg-white/10 hover:bg-white/15 border border-white/10 rounded-2xl text-left transition flex flex-col justify-between h-24 cursor-pointer text-white"
                  >
                    <span className="text-xl">{hub.icon}</span>
                    <span className="font-extrabold text-[10px] leading-tight block">{hub.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Earn with ApexBee */}
          <section className="container mx-auto px-4 py-8 bg-navy text-white rounded-3xl my-6 relative overflow-hidden text-left">
            <div className="absolute right-0 top-0 opacity-10 pointer-events-none">
              <TrendingUp className="h-72 w-72 text-white" />
            </div>
            <div className="relative p-6 md:p-8 text-left">
              <div className="max-w-2xl">
                <h2 className="text-2xl font-extrabold text-white">Earn with ApexBee Ecosystem</h2>
                <p className="text-white/80 text-xs mt-2 leading-relaxed font-medium">
                  We offer extensive business opportunities for everyone. Register as a partner and launch your digital store, offer logistics services, or list courses.
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                {[
                  { label: "List as Vendor", desc: "Sell goods locally", icon: Store },
                  { label: "Course Provider", desc: "Sell academy courses", icon: BookOpen },
                  { label: "Logistics Partner", desc: "Deliver orders nearby", icon: Compass },
                  { label: "Franchise Partner", desc: "Manage local territories", icon: Users },
                ].map((opp, idx) => {
                  const Icon = opp.icon;
                  return (
                    <div key={idx} className="p-4 bg-white/10 rounded-2xl border border-white/10 text-left hover:bg-white/15 transition shadow-sm">
                      <Icon className="h-6 w-6 text-accent mb-2" />
                      <p className="font-bold text-sm text-white">{opp.label}</p>
                      <p className="text-[10px] text-white/60 mt-1 leading-tight">{opp.desc}</p>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 text-center md:text-left">
                <Button className="bg-accent hover:bg-accent/90 text-white font-bold" onClick={() => navigate("/register?ref=partner")}>
                  Become a Partner Now
                </Button>
              </div>
            </div>
          </section>

          {/* 14. Continue Shopping Banner */}
          <section className="container mx-auto px-4 py-6 text-left">
            <h2 className="text-lg font-black text-navy mb-4 flex items-center gap-2">
              📦 Continue Shopping
            </h2>
            <div className="flex gap-4 overflow-x-auto scrollbar-none pb-4 pt-1 scroll-smooth">
              {continueShoppingProducts.map((p: any) => (
                <ProductCard key={p._id || p.id} product={p} />
              ))}
            </div>
          </section>

          {/* 15. Recently Viewed & Activity tabs */}
          <section className="container mx-auto px-4 py-8 border-t border-slate-100 mt-6 text-left">
            <div className="flex flex-col mb-4">
              <h2 className="text-lg font-black text-navy">Recent Activity</h2>
              <p className="text-xs text-slate-500">Pick up where you left off or manage your schedules.</p>
            </div>

            {/* Tab layout */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide select-none border-b border-slate-100 mb-4">
              {[
                { key: "continue", label: "Continue Shopping", icon: "🛒" },
                { key: "scheduled", label: "Scheduled Orders", icon: "📅" },
                { key: "subs", label: "Subscriptions", icon: "🔄" },
                { key: "wishlist", label: "Wishlist", icon: "💖" },
                { key: "repeat", label: "Repeat Purchase", icon: "🔁" }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => {
                    if (tab.key === "wishlist") navigate("/profile");
                    else if (tab.key === "subs") navigate("/category/🚚 Delivery & Logistics");
                    else alert(`${tab.label} action triggered!`);
                  }}
                  className="px-3.5 py-1.5 rounded-xl text-[10px] font-black border bg-white text-navy hover:border-primary border-slate-200 transition shrink-0 cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {recentlyViewed.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {recentlyViewed.slice(0, 6).map((item) => (
                  <div
                    key={`${item.type}-${item.id}`}
                    onClick={() => navigate(item.url)}
                    className="group border border-slate-100 bg-white rounded-2xl overflow-hidden hover:shadow-lg cursor-pointer transition p-3 flex flex-col justify-between text-left shadow-sm"
                  >
                    <div>
                      <div className="h-24 bg-slate-50 rounded-xl overflow-hidden mb-2 relative">
                        <img
                          src={item.image || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=200"}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                        <span className="absolute bottom-1 right-1 text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider bg-navy/80 text-white">
                          {item.type}
                        </span>
                      </div>
                      <h4 className="font-extrabold text-navy text-[11px] leading-tight line-clamp-2 min-h-[30px] group-hover:text-accent transition-colors">
                        {item.title}
                      </h4>
                      <p className="text-[9px] text-muted-foreground mt-1 truncate">{item.categoryName}</p>
                    </div>
                    {item.price !== undefined && (
                      <p className="font-black text-navy text-xs mt-2">
                        ₹{Number(item.price).toFixed(0)}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-left text-xs text-muted-foreground py-6">
                No recent activity logged yet. Start browsing to populate your history!
              </div>
            )}
          </section>

          {/* 16. Community updates & rewards */}
          <section className="container mx-auto px-4 py-6">
            <div className="text-left">
              {/* Rewards Card */}
              <div className="p-5 sm:p-6 rounded-3xl border bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-amber-500/10 border-amber-300/60 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
                <div className="space-y-2 max-w-xl">
                  <div className="inline-flex items-center gap-1.5 text-amber-900 bg-amber-100 px-3 py-1 rounded-full text-xs font-black">
                    <Gift className="h-3.5 w-3.5 text-amber-600" /> Rewards & Cashbacks
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-[#0A1128] font-heading">KYC Verification Reward</h3>
                  <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
                    Complete your profile and verify KYC to lock in your first ₹50 sign-up bonus credited directly to your wallet.
                  </p>
                  <Button size="sm" className="bg-[#0A1128] hover:bg-amber-500 text-amber-400 hover:text-[#0A1128] font-black text-xs rounded-xl border-none cursor-pointer px-5 py-2.5 shadow-sm transition" onClick={() => navigate("/profile")}>
                    Verify Profile & Claim Bonus
                  </Button>
                </div>
                <div className="text-right bg-white p-4 rounded-2xl border border-amber-200 shrink-0 shadow-xs min-w-[140px]">
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider font-mono">Available Balance</p>
                  <p className="text-2xl sm:text-3xl font-black text-[#0A1128] mt-0.5">₹5,000</p>
                  <p className="text-[10px] text-emerald-600 font-black mt-0.5 flex items-center justify-end gap-1">
                    <span>✓</span> Wallet Loaded
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Community Updates Feed */}
          <section className="container mx-auto px-4 py-8">
            <h2 className="text-xl font-bold text-navy mb-4 flex items-center gap-2 text-left">
              <Volume2 className="h-5 w-5 text-accent" /> Community Updates & News
            </h2>
            <div className="space-y-3">
              {[
                { title: "ApexBee expands to 12 new pincodes in South Bangalore", date: "Today", desc: "Local stores across JP Nagar, Jayanagar, and BTM are now live with same-day deliveries." },
                { title: "MLM Leader Conference announced in Bangalore", date: "2 days ago", desc: "Learn building large referral teams and doubling passive earnings from top network industry leaders." },
                { title: "KYC verification guidelines updated for instant payouts", date: "5 days ago", desc: "Ensure your bank account details and PAN card match for immediate referral payout clearance." },
              ].map((feed, idx) => (
                <div key={idx} className="p-4 rounded-2xl border bg-white hover:bg-muted/5 transition flex items-start gap-3 text-left shadow-sm">
                  <div className="p-2 rounded-xl bg-muted text-navy shrink-0">
                    <Volume2 className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-bold text-navy text-sm truncate">{feed.title}</h4>
                      <span className="text-[10px] text-muted-foreground shrink-0">{feed.date}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed font-medium">{feed.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Trust Banner & Registration CTAs */}
          <section className="container mx-auto px-4 py-2 mt-1">
            <div className="bg-slate-50 border border-slate-100 rounded-2xl py-3 px-6 grid grid-cols-2 md:grid-cols-5 gap-4 text-center select-none">
              {[
                { text: "✓ Trusted Local Merchants", color: "text-emerald-600" },
                { text: "✓ Same Day Delivery", color: "text-blue-600" },
                { text: "✓ Easy Returns", color: "text-indigo-600" },
                { text: "✓ Secure Payments", color: "text-purple-600" },
                { text: "✓ 24×7 Support", color: "text-amber-600" }
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-center gap-1.5 text-xs font-bold text-navy">
                  <span className={`${item.color} text-sm`}>✓</span>
                  <span>{item.text.replace("✓ ", "")}</span>
                </div>
              ))}
            </div>
          </section>

          {!loggedInUser && (
            <section className="container mx-auto px-4 py-4 mt-1">
              <div className="bg-gradient-to-r from-navy to-navy-dark border rounded-3xl p-6 text-white relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
                <div className="text-left max-w-xl z-10">
                  <h3 className="text-lg md:text-xl font-black text-white">Join the ApexBee Ecosystem</h3>
                  <p className="text-xs text-white/80 mt-1 leading-relaxed">
                    Choose your pathway: Register as a **Guest Customer** for swift checkout, or partner with us as a **Business Partner** to scale your brand and referrals.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3 shrink-0 z-10">
                  <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 text-xs font-bold px-4 py-2" onClick={() => navigate("/register?ref=guest")}>
                    Guest Customer
                  </Button>
                  <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 text-xs font-bold px-4 py-2" onClick={() => navigate("/register?ref=partner")}>
                    Business Partner
                  </Button>
                  <button
                    onClick={() => navigate("/register")}
                    className="relative inline-flex items-center justify-center px-6 py-2.5 overflow-hidden font-bold text-white rounded-full bg-accent hover:bg-accent/90 transition duration-300 ease-out shadow-lg hover:shadow-accent/40 animate-pulse active:scale-95 text-xs uppercase tracking-wider cursor-pointer border-none"
                  >
                    Start Free
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* Location Modal */}
          <LocationModal
            open={openLocationModal}
            onOpenChange={setOpenLocationModal}
            onConfirm={(loc) => {
              setUserLocation(loc);
              localStorage.setItem(LOCATION_KEY, JSON.stringify(loc));
              const pin = normPincode(loc?.pincode);
              if (pin) fetchNearbyShops(pin);
            }}
          />

          <Footer />

          {/* Support Drawer */}
          <SupportDrawer isOpen={supportOpen} onClose={() => setSupportOpen(false)} />
        </div>
      </main>
    </>
  );
};

export default Home;
