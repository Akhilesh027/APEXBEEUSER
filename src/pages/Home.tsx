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
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LocationModal from "@/components/LocationModal";
import SupportDrawer from "@/components/SupportDrawer";
import { ApexBeeWelcomeIntro } from "../components/welcome-intro/ApexBeeWelcomeIntro";
import logo from "../Web images/Web images/logo.png";

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

  const customerSellingAmount = toNumber(admin?.customerSellingAmount);
  const adminSellingWithCharges =
    toNumber(admin?.sellingPrice) +
    toNumber(admin?.shippingCharge) +
    toNumber(admin?.packingCharge);

  const after = toNumber(p.afterDiscount);
  const baseSelling = toNumber(p.baseSellingPrice);
  const userPrice = toNumber(p.userPrice);

  const price =
    customerSellingAmount ||
    adminSellingWithCharges ||
    after ||
    baseSelling ||
    userPrice ||
    0;

  const mrp =
    toNumber(admin?.mrp) ||
    toNumber(p.baseMrp) ||
    toNumber(p.userPrice) ||
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
  const [timeGreeting, setTimeGreeting] = useState("Good Morning ☀");
  const [greetingOffer, setGreetingOffer] = useState("Fresh Morning Specials! Milk & Breakfast items delivered in 15 mins.");
  const [milkCountdown, setMilkCountdown] = useState("01:59:59");
  const [hasActiveOrder, setHasActiveOrder] = useState(false);
  const [festivalBanner, setFestivalBanner] = useState<any | null>(null);
  const [activeTracking, setActiveTracking] = useState<any | null>(null);
  const [personalization, setPersonalization] = useState<any>(null);
  const [offerTitle, setOfferTitle] = useState("Fresh Milk Deal");
  const [offerEmoji, setOfferEmoji] = useState("🥛");

  const continueShoppingProducts = useMemo(() => {
    if (personalization?.continueShopping && personalization.continueShopping.length > 0) {
      return personalization.continueShopping;
    }
    return [
      { _id: "mock-oil", itemName: "Freedom Refined Sunflower Oil 1L", baseSellingPrice: 135, thumbnail: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=300", brand: "Cooking Oil" },
      { _id: "mock-rice", itemName: "Lalitha Brand HMT Rice 25kg", baseSellingPrice: 1450, thumbnail: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300", brand: "Rice" },
      { _id: "mock-honey", itemName: "Dabur Organic Honey 500g", baseSellingPrice: 220, thumbnail: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=300", brand: "Honey" },
      { _id: "mock-milk", itemName: "Heritage Fresh Milk 500ml", baseSellingPrice: 28, thumbnail: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=300", brand: "Milk" }
    ];
  }, [personalization]);

  const homeServices = useMemo(() => {
    return personalization?.featuredServices || [];
  }, [personalization]);


  const homeRestaurants = useMemo(() => {
    return personalization?.restaurants || [
      { id: "mock-rest-1", name: "Tasty Biryani Point", food: "Biryani, North Indian", rating: "4.7", eta: "20 mins", distance: "800m", min: "₹120", image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=300" },
      { id: "mock-rest-2", name: "Nellore Tiffins", food: "Dosa, South Indian Breakfast", rating: "4.9", eta: "15 mins", distance: "600m", min: "₹80", image: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=300" },
      { id: "mock-rest-3", name: "Sweet Magic Bakery", food: "Cakes, Desserts, Shakes", rating: "4.6", eta: "25 mins", distance: "1.1 km", min: "₹150", image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=300" }
    ];
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
        if (data.timeGreeting) {
          setTimeGreeting(data.timeGreeting);
        }
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

  useEffect(() => {
    fetchPersonalization();
    fetchCourses();
  }, [loggedInUser]);

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
          else if (hour >= 17 && hour < 21) currentType = "evening";
          else if (hour >= 21 || hour < 5) currentType = "night";

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
            // fallback to original greeting logic
            if (hour >= 5 && hour < 12) {
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
            } else if (hour >= 17 && hour < 21) {
              setTimeGreeting("Good Evening 🍕");
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
      action: () => navigate("/category/🛒 Daily Needs"),
    },
    {
      id: 2,
      title: "Food Delivery — Hot Deals From Top Restaurants",
      desc: "Craving delicious biryani, mouthwatering pizzas, or fresh bakery treats? Get food delivered hot and fresh in minutes.",
      badge: "🍔 Food Delivery",
      image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&q=80&w=1200",
      btnText: "Order Food Now",
      action: () => navigate("/category/🍽 Food & Dining"),
    },
    {
      id: 3,
      title: "Pharmacy Delivery — Essential Medicines Instantly",
      desc: "Order prescription drugs, daily vitamins, health supplements, and baby care essentials from certified local chemists.",
      badge: "💊 Pharmacy",
      image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=1200",
      btnText: "Order Medicines Now",
      action: () => navigate("/category/❤ Health & Wellness"),
    },
    {
      id: 4,
      title: "Local Services — Instant Certified Professionals",
      desc: "Book trusted plumbers, electricians, appliance repair mechanics, painters, and deep cleaning services.",
      badge: "🔧 Local Services",
      image: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=1200",
      btnText: "Book Professionals Now",
      action: () => navigate("/services"),
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
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      if (user.hasPets === undefined) user.hasPets = true;
      if (user.hasKids === undefined) user.hasKids = true;
      setLoggedInUser(user);
    }
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
    return () => window.removeEventListener("storage", loadLocation);
  }, []);

  /** ---------------------------
   * Fetch categories
   * -------------------------- */
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      const res = await fetch(`${API_BASE}/categories/tree`);
      if (!res.ok) throw new Error("Failed to fetch categories");

      const data = await res.json();
      const list = Array.isArray(data?.categories) ? data.categories : [];

      setCategories(flattenCategoryTree(list));
    } catch (e) {
      console.error("Error fetching categories:", e);
      setCategories([]);
    } finally {
      setLoadingCategories(false);
    }
  };

  /** ---------------------------
   * Fetch products (reuse)
   * -------------------------- */
  const fetchProducts = async (limit: number) => {
    let url = `${API_BASE}/products?limit=${limit}`;
    if (userLocation?.lat && userLocation?.lng) {
      url += `&lat=${userLocation.lat}&lng=${userLocation.lng}`;
    } else if (userLocation?.pincode) {
      url += `&pincode=${userLocation.pincode}`;
    }
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch products");

    const json = await res.json();

    const list =
      Array.isArray(json?.products) ? json.products :
        Array.isArray(json?.data) ? json.data :
          Array.isArray(json) ? json :
            [];

    return (list as Product[]).filter(
      (product: Product) => product.status === "Live" && product.isActive === true
    );
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

  /** ---------------------------
   * Fetch nearby shops by PINCODE
   * (kept, but not used if shops section is commented)
   * -------------------------- */
  const fetchNearbyShops = async (pincode: string) => {
    try {
      const pin = normPincode(pincode);
      if (pin.length !== 6) return;

      setShopsLoading(true);
      setShopsError(null);

      const res = await fetch(
        `${API_BASE}/business/by-pincode?pincode=${encodeURIComponent(pin)}&limit=50`
      );

      const json = await res.json();

      if (!res.ok || !json?.success) {
        throw new Error(json?.message || "Failed to fetch nearby shops");
      }

      const list: Business[] = Array.isArray(json?.data) ? json.data : [];
      setNearbyShops(list);
    } catch (e: any) {
      console.error("fetchNearbyShops error:", e);
      setNearbyShops([]);
      setShopsError(e?.message || "Failed to load nearby shops");
    } finally {
      setShopsLoading(false);
    }
  };

  // Nearby shops auto fetch
  useEffect(() => {
    const pin = normPincode(userLocation?.pincode);
    if (pin.length !== 6) return;
    fetchNearbyShops(pin);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLocation?.pincode]);

  /** ---------------------------
   * UI helpers
   * -------------------------- */
  const scrollCategories = (direction: "left" | "right") => {
    const container = document.getElementById("categories-container");
    if (!container) return;
    const amount = 240;
    container.scrollLeft += direction === "left" ? -amount : amount;
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
          <div className="h-44 bg-muted overflow-hidden relative w-full">
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
              <span className="truncate max-w-[70%]">🏪 {p.brand || "ApexBee Seller"}</span>
              <span className="text-amber-500 bg-amber-50 px-1 rounded shrink-0">★ 4.8</span>
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
              <span className="flex items-center gap-0.5">⭐ {avgRating > 0 ? avgRating.toFixed(1) : "4.5"} ({ratingCount || 24})</span>
              <span>👥 {ratingCount ? `${ratingCount * 12}+ Sold` : "120+ Sold"}</span>
            </div>

            {/* 2. Fast Delivery, 6. Delivery Type, 7. Distance & Delivery Charges */}
            <div className="space-y-1 bg-slate-50 rounded-xl p-1.5 text-[9px] text-slate-600 font-bold mt-2">
              <div className="flex items-center justify-between">
                <span className="text-accent shrink-0">⚡ Fast [{p.estimatedDeliveryMinutes || 10} MINS]</span>
                <span className="text-primary font-black uppercase text-[8px] bg-primary/10 px-1 rounded">
                  {p.deliveryMode === "platform_delivery" ? "Platform" : "Vendor"}
                </span>
              </div>
              <div className="flex items-center justify-between text-[8px] text-slate-500 pt-0.5 border-t border-slate-100">
                <span>📍 {p.calculatedDistanceKm || 1.2} km</span>
                <span>Delivery: {p.adminPricing?.shippingCharge ? `₹${p.adminPricing.shippingCharge}` : "FREE"}</span>
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

          {!loggedInUser && (
            <div className="bg-blue-light border-b text-center py-2 text-sm font-semibold">
              On Direct <span className="font-semibold">(LI)</span> registration other complete KYC - 50/-
            </div>
          )}

          {/* 1. Welcome Portal + Location Greeting Banner */}
          <section className="container mx-auto px-4 py-3 mt-4 text-left">
            <div className="bg-gradient-to-br from-white/70 to-slate-100/30 backdrop-blur-md border border-white/40 rounded-[32px] p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-premium relative overflow-hidden">
              <div className="absolute -right-16 -top-16 w-32 h-32 bg-primary/10 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -left-16 -bottom-16 w-32 h-32 bg-accent/5 rounded-full blur-2xl pointer-events-none" />

              <div className="space-y-1.5 z-10">
                <span className="text-[9px] font-black text-accent uppercase tracking-wider font-mono bg-accent/10 px-2 py-0.5 rounded-full">Hyperlocal Customer Portal</span>
                <h3 className="text-xl font-extrabold text-navy leading-tight mt-1">
                  {personalization?.timeGreeting || timeGreeting}, {personalization?.userName || (loggedInUser ? loggedInUser.name : "Guru Swamy")} 👋
                </h3>

                {/* delivers to location tag */}
                <p className="text-xs font-bold text-navy flex items-center gap-1 bg-blue-50 border border-blue-100/60 px-3 py-1.5 rounded-full w-fit">
                  Delivering to: <span className="text-accent font-black">📍 {userLocation?.colony || "Buchireddypalem"}</span>
                </p>

                <p className="text-xs text-slate-500 font-semibold mt-1">
                  {greetingOffer}
                </p>
              </div>

              {/* Flash offer countdown card */}
              {milkCountdown && (
                <div className="bg-white border rounded-2xl p-4 flex items-center gap-4 shadow-sm shrink-0 border-amber-200 bg-gradient-to-r from-amber-50/30 to-white max-w-xs w-full sm:w-auto hover:shadow-md transition-all duration-300 z-10">
                  <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 text-lg shrink-0">{offerEmoji}</div>
                  <div className="text-left">
                    <p className="font-extrabold text-navy text-xs leading-none">{offerTitle}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">Flash offer ends in:</p>
                    <p className="font-black text-red-500 text-xs mt-0.5 tracking-wider font-mono animate-pulse">{milkCountdown}</p>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* 2. Hero Banner Slider */}
          <section className="container mx-auto px-4 py-4">
            <div className="relative overflow-hidden rounded-3xl border bg-gradient-to-r from-navy to-navy-dark text-white shadow-md min-h-[280px] flex items-center">
              {displayBanners.map((slide, idx) => (
                <div
                  key={slide.id}
                  className={`absolute inset-0 transition-opacity duration-1000 ${idx === currentSlide ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                    }`}
                >
                  <div className="absolute inset-0 bg-black/40" />
                  <img
                    src={slide.image}
                    alt="banner"
                    className="w-full h-full object-cover absolute inset-0"
                  />
                  <div className="relative p-6 sm:p-10 md:p-14 max-w-2xl flex flex-col justify-center h-full z-10 text-left">
                    <div className="inline-flex self-start items-center gap-2 bg-accent px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase text-white mb-4">
                      {slide.badge}
                    </div>
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white leading-tight">
                      {slide.title}
                    </h2>
                    <p className="text-xs sm:text-sm text-white/80 mt-3 max-w-lg font-medium leading-relaxed">
                      {slide.desc}
                    </p>
                    <div className="mt-6">
                      <Button
                        onClick={slide.action}
                        className="bg-accent hover:bg-accent/90 text-white font-extrabold text-xs px-6 py-3 rounded-full shadow-lg hover:shadow-accent/30 active:scale-95 transition-all cursor-pointer border-none"
                      >
                        {slide.btnText}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              <Button
                variant="ghost"
                size="icon"
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white bg-black/10 hover:bg-black/35 rounded-full z-20"
                onClick={() => setCurrentSlide((prev) => (prev - 1 + displayBanners.length) % displayBanners.length)}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white bg-black/10 hover:bg-black/35 rounded-full z-20"
                onClick={() => setCurrentSlide((prev) => (prev + 1) % displayBanners.length)}
              >
                <ChevronRight className="h-5 w-5" />
              </Button>

              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
                {displayBanners.map((_, idx) => (
                  <button
                    key={idx}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${idx === currentSlide ? "bg-accent w-5" : "bg-white/40"
                      }`}
                    onClick={() => setCurrentSlide(idx)}
                  />
                ))}
              </div>
            </div>
          </section>

          {/* 3. Quick Shortcuts Grid (max 8 per row on desktop) */}
          <section className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-black text-navy">Quick Shortcuts</h2>
              <button onClick={() => navigate("/category")} className="text-xs text-primary font-semibold hover:underline bg-transparent border-none cursor-pointer">
                View All →
              </button>
            </div>
            <div className="grid grid-cols-5 md:grid-cols-8 lg:grid-cols-8 xl:grid-cols-8 gap-3">
              {[
                { label: "Grocery", emoji: "🛒", gradient: "linear-gradient(135deg,#FF416C,#FF4B2B)", to: "/category/🛒 Daily Needs" },
                { label: "Food", emoji: "🍔", gradient: "linear-gradient(135deg,#f857a6,#ff5858)", to: "/category/🍽 Food & Dining" },
                { label: "Pharmacy", emoji: "💊", gradient: "linear-gradient(135deg,#11998e,#38ef7d)", to: "/category/❤ Health & Wellness" },
                { label: "Fashion", emoji: "👗", gradient: "linear-gradient(135deg,#ea00d9,#711c91)", to: "/category/🛍 Shopping" },
                { label: "Electronics", emoji: "📱", gradient: "linear-gradient(135deg,#00c6ff,#0072ff)", to: "/category/🛍 Shopping" },
                { label: "Services", emoji: "🔧", gradient: "linear-gradient(135deg,#1e3c72,#2a5298)", to: "/services" },
                { label: "Academy", emoji: "🎓", gradient: "linear-gradient(135deg,#711c91,#a8c0ff)", to: "/academy" },
                { label: "Travel", emoji: "✈", gradient: "linear-gradient(135deg,#00c6ff,#3f2b96)", to: "/travel" },
                { label: "Book Delivery", emoji: "📦", gradient: "linear-gradient(135deg,#a8c0ff,#3f2b96)", to: "/category/🚚 Delivery & Logistics" },
                { label: "Pickup", emoji: "🛵", gradient: "linear-gradient(135deg,#FDC830,#F37335)", to: "/category/🚚 Delivery & Logistics" },
                { label: "Recharge", emoji: "⚡", gradient: "linear-gradient(135deg,#00F260,#0575E6)", to: "/community" },
                { label: "Offers", emoji: "🔥", gradient: "linear-gradient(135deg,#f12711,#f5af19)", to: "/category/📢 Promotional" },
              ].slice(0, 12).map((item) => (
                <button
                  key={item.label}
                  onClick={() => navigate(item.to)}
                  className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-white border hover:shadow-lg hover:-translate-y-1 transition-all duration-200 group cursor-pointer"
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-md group-hover:scale-110 transition-transform duration-200"
                    style={{ background: item.gradient }}
                  >
                    {item.emoji}
                  </div>
                  <div className="text-center">
                    <p className="font-extrabold text-navy text-[10px] leading-tight group-hover:text-accent transition-colors">
                      {item.label}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* 4. Today's Schedule Card Widget */}
          {loggedInUser && (
            <section className="container mx-auto px-4 py-3 text-left">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Today’s Schedule */}
                <div className="bg-gradient-to-br from-blue-50/40 to-indigo-50/50 border border-indigo-100/70 rounded-3xl p-5 shadow-sm space-y-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
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
                <div className="bg-gradient-to-br from-emerald-50/30 to-teal-50/40 border border-emerald-100/70 rounded-3xl p-5 shadow-sm space-y-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
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
                <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm flex flex-col justify-between gap-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
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
            <section className="container mx-auto px-4 py-2 mt-1">
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

          {/* 5. Main Categories (15 Premium Hexagon Icons) */}
          <section className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-navy text-left">Explore Categories</h2>
              <Button
                variant="outline"
                size="sm"
                className="text-accent border-accent hover:bg-accent hover:text-white"
                onClick={handleViewAllCategories}
              >
                View All
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="hidden md:flex" onClick={() => scrollCategories("left")}>
                <ChevronLeft className="h-5 w-5" />
              </Button>

              <div
                id="categories-container"
                className="flex gap-4 md:gap-6 overflow-x-auto scrollbar-hide scroll-smooth flex-1 pb-1"
              >
                {loadingCategories ? (
                  Array.from({ length: 7 }).map((_, index) => (
                    <div key={index} className="flex flex-col items-center gap-2 min-w-[100px]">
                      <Skeleton
                        className="w-[84px] h-[84px]"
                        style={{ clipPath: "polygon(50% 0%, 93.3% 25%, 93.3% 75%, 50% 100%, 6.7% 75%, 6.7% 25%)" }}
                      />
                      <Skeleton className="w-16 h-3 rounded mt-2" />
                    </div>
                  ))
                ) : categories.length === 0 ? (
                  <div className="w-full rounded-xl border bg-muted/20 p-6 text-center text-muted-foreground">
                    No categories available.
                  </div>
                ) : (
                  categories.map((category) => (
                    <button
                      type="button"
                      key={category.id}
                      onClick={() => navigate(category.to)}
                      className="flex flex-col items-center min-w-[100px] cursor-pointer group"
                    >
                      <div
                        className="w-[84px] h-[84px] bg-gradient-to-br from-primary/10 to-violet-500/10 p-[2.5px] transition-all duration-300 group-hover:scale-105 group-hover:from-accent group-hover:to-rose-500 shadow-md"
                        style={{ clipPath: "polygon(50% 0%, 93.3% 25%, 93.3% 75%, 50% 100%, 6.7% 75%, 6.7% 25%)" }}
                      >
                        <div
                          className="w-full h-full bg-white overflow-hidden flex items-center justify-center relative"
                          style={{ clipPath: "polygon(50% 0%, 93.3% 25%, 93.3% 75%, 50% 100%, 6.7% 75%, 6.7% 25%)" }}
                        >
                          <img
                            src={category.image || "/placeholder.svg"}
                            alt={category.label}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                            loading="lazy"
                          />
                        </div>
                      </div>
                      <p className="text-xs font-black mt-3 text-center text-navy group-hover:text-accent max-w-[84px] leading-tight line-clamp-2">
                        {category.label}
                      </p>
                    </button>
                  ))
                )}
              </div>

              <Button variant="ghost" size="icon" className="hidden md:flex" onClick={() => scrollCategories("right")}>
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </section>

          {/* 6. Deals & Featured Products */}
          <section className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-6">
              <div className="text-left">
                <h2 className="text-xl font-bold text-navy">Featured Products</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Handpicked best items for you.</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate("/products")}>
                View All
              </Button>
            </div>

            {featuredLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="rounded-2xl border bg-white overflow-hidden">
                    <Skeleton className="h-44 w-full" />
                    <div className="p-4 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : featuredProducts.length === 0 ? (
              <div className="rounded-2xl border bg-muted/20 p-10 text-center text-muted-foreground text-sm">
                No featured products available.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
                {featuredProducts.slice(0, 4).map(renderProductCard)}
              </div>
            )}
          </section>

          {/* Daily Deals Block */}
          <section className="container mx-auto px-4 py-6">
            <div className="rounded-3xl border bg-gradient-to-r from-yellow-50 to-orange-50 p-6 md:p-8">
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
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

              {dealsLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="rounded-2xl border bg-white overflow-hidden">
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
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
                  {dealProducts.slice(0, 4).map(renderProductCard)}
                </div>
              )}
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

          {/* 7. Nearby Stores */}
          <section className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-6">
              <div className="text-left">
                <h2 className="text-xl font-bold text-navy">Nearby Stores</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Top vendors serving{" "}
                  <span className="font-semibold text-navy">
                    {userLocation?.colony ? `${userLocation.colony} - ` : ""}
                    {userLocation?.pincode || "your location"}
                  </span>
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate("/local-stores")}>
                View All Stores
              </Button>
            </div>

            {shopsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="rounded-2xl border bg-white p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-12 w-12 rounded-xl" />
                      <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-4 w-2/3" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                    <Skeleton className="h-3 w-5/6" />
                  </div>
                ))}
              </div>
            ) : nearbyShops.length === 0 ? (
              <div className="rounded-2xl border border-dashed bg-muted/10 p-6 text-center text-muted-foreground text-sm">
                No stores registered near your pincode. Set location to Bangalore 560001 or 560038 to see demo stores!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {nearbyShops.slice(0, 3).map((shop) => (
                  <div
                    key={shop._id}
                    onClick={() => navigate(`/business/${shop._id}`)}
                    className="group rounded-2xl border bg-white p-4 hover:shadow-md cursor-pointer transition flex gap-3 text-left animate-fade-in"
                  >
                    <div className="h-12 w-12 rounded-xl overflow-hidden bg-muted flex items-center justify-center border flex-shrink-0">
                      <img
                        src={getImageUrl(shop.logo) || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=100"}
                        alt={shop.businessName}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                        loading="lazy"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h3 className="font-bold text-navy text-sm leading-tight truncate group-hover:text-accent transition-colors">
                          {shop.businessName}
                        </h3>
                        <span className="shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-light text-navy">
                          OPEN
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-1 truncate">
                        {shop.address || `${shop.city}, ${shop.state}`}
                      </p>
                      <div className="flex items-center gap-1.5 flex-wrap mt-1 text-[10px] text-slate-500 font-bold">
                        <span>📍 600m</span>
                        <span>•</span>
                        <span>⚡ 15 mins</span>
                        <span>•</span>
                        <span>Min ₹100</span>
                      </div>
                      <p className="text-[11px] text-accent font-semibold mt-1">
                        ★ {shop.rating || "4.8"} • {shop.category || "Grocery Store"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* 8. Nearby Restaurants (NEW SECTION) */}
          <section className="container mx-auto px-4 py-8 text-left">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-navy">Nearby Restaurants</h2>
                <p className="text-xs text-muted-foreground mt-1">Order delicious meals from top rated diners nearby.</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate("/category/🍽 Food & Dining")}>
                View All Diners
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {homeRestaurants.map((rest: any, idx) => (
                <div key={rest.id || idx} className="group rounded-2xl border bg-white p-4 hover:shadow-md cursor-pointer transition flex gap-3 text-left" onClick={() => navigate(rest.id.startsWith("mock-") ? "/category/🍽 Food & Dining" : `/business/${rest.id}`)}>
                  <div className="h-12 w-12 rounded-xl overflow-hidden bg-muted flex items-center justify-center border flex-shrink-0">
                    <img src={rest.image} alt={rest.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-navy text-sm leading-tight truncate group-hover:text-accent transition-colors">{rest.name}</h3>
                      <span className="shrink-0 text-[8px] font-black px-1.5 py-0.5 rounded bg-blue-light text-navy">OPEN</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1 truncate">{rest.food}</p>
                    <div className="flex items-center gap-1.5 flex-wrap mt-1 text-[10px] text-slate-500 font-bold">
                      <span>📍 {rest.distance}</span>
                      <span>•</span>
                      <span>⚡ {rest.eta}</span>
                      <span>•</span>
                      <span>Min {rest.min}</span>
                    </div>
                    <p className="text-[11px] text-accent font-semibold mt-1">★ {rest.rating} • Food & Dining</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 9. Nearby Services (Featured Services) */}
          {homeServices && homeServices.length > 0 && (
            <section className="container mx-auto px-4 py-8 bg-blue-light/20 rounded-3xl border my-6 text-left">
              <div className="flex items-center justify-between mb-6">
                <div className="text-left">
                  <h2 className="text-xl font-bold text-navy">Featured Services</h2>
                  <p className="text-xs text-muted-foreground mt-1">Book reliable home & commercial services locally.</p>
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
          {personalization?.festival && (
            <section className="container mx-auto px-4 py-2 text-left">
              <div className="bg-gradient-to-r from-amber-600 via-rose-600 to-pink-600 text-white rounded-[32px] p-6 shadow-md relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 border border-amber-500/20">
                <div className="absolute right-0 top-0 opacity-10 pointer-events-none text-9xl font-bold translate-x-5 -translate-y-5">🌸</div>
                <div className="space-y-2.5 max-w-xl z-10">
                  <span className="text-[9px] font-black text-amber-200 bg-white/10 px-2.5 py-0.5 rounded-full uppercase tracking-wider font-mono">Festival Specials</span>
                  <h3 className="text-xl font-black text-white">{personalization.festival.title}</h3>
                  <p className="text-xs text-white/90 leading-relaxed font-semibold">{personalization.festival.desc}</p>
                  <div className="flex flex-wrap items-center gap-1.5 pt-1 font-bold">
                    {(personalization.festival.items || []).map((item: string) => (
                      <span key={item} className="text-[9px] bg-white/20 border border-white/10 px-2.5 py-1 rounded-full backdrop-blur-sm">{item}</span>
                    ))}
                  </div>
                </div>
                <Button
                  onClick={() => navigate("/category/📢 Promotional")}
                  className="bg-white hover:bg-slate-50 text-rose-600 hover:scale-105 transition-all duration-300 font-extrabold text-xs rounded-xl px-6 py-3.5 shadow-lg shrink-0 border-none cursor-pointer z-10"
                >
                  {personalization.festival.actionLabel || "🛒 Order Puja Bundle"}
                </Button>
              </div>
            </section>
          )}

          {/* Festival Banner Card (from DB if set) */}
          {festivalBanner && (
            <section className="container mx-auto px-4 py-2">
              <div className="bg-gradient-to-r from-pink-500 to-rose-600 text-white rounded-3xl p-5 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4 text-left relative overflow-hidden">
                <div className="absolute right-0 top-0 opacity-10 pointer-events-none text-7xl font-bold">✨</div>
                <div className="z-10 max-w-lg">
                  {festivalBanner.discount && (
                    <div className="inline-block bg-white/20 text-white font-bold text-[9px] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      {festivalBanner.discount}
                    </div>
                  )}
                  <h4 className="font-extrabold text-sm sm:text-base mt-2">{festivalBanner.title}! 🎁</h4>
                  <p className="text-[11px] text-white/90 mt-1 leading-relaxed">{festivalBanner.description}</p>
                </div>
                {festivalBanner.link && (
                  <Button
                    onClick={() => navigate(festivalBanner.link)}
                    className="bg-white hover:bg-slate-100 text-rose-600 font-bold text-xs rounded-xl shrink-0 z-10 py-2.5 px-4 shadow border-none cursor-pointer"
                  >
                    View Festive Deals
                  </Button>
                )}
              </div>
            </section>
          )}

          {/* 11. AI Suggestions widget */}
          {personalization?.aiSuggest && (
            <section className="container mx-auto px-4 py-2 text-left">
              <div className="bg-gradient-to-r from-amber-50/70 via-yellow-50/40 to-white border border-amber-200/60 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm hover:shadow-md transition-all duration-300">
                <div className="flex items-center gap-3">
                  <span className="text-2xl animate-bounce">🐝</span>
                  <div>
                    <h4 className="font-extrabold text-navy text-xs leading-none font-sans flex items-center gap-1.5">
                      {personalization.aiSuggest.label} <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping" />
                    </h4>
                    <p className="text-[11px] text-slate-600 mt-1.5 leading-snug">{personalization.aiSuggest.desc}</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    alert(`${personalization.aiSuggest.item} added to basket!`);
                  }}
                  className="bg-amber-500 hover:bg-amber-600 hover:scale-105 transition-all duration-300 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer shrink-0 border-none"
                >
                  🔄 Order Again
                </Button>
              </div>
            </section>
          )}

          {/* Pets Corner */}
          {personalization?.hasPets && (
            <section className="container mx-auto px-4 py-2 text-left">
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-orange-100 rounded-3xl p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-navy flex items-center gap-1.5">🐶 Pets Corner</h3>
                  <span className="text-[9px] font-black text-orange-600 bg-orange-100 px-2 py-0.5 rounded uppercase tracking-wider">Pet Profile Active</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-3 bg-white rounded-2xl border border-orange-100/50 flex items-center justify-between shadow-sm">
                    <div>
                      <p className="font-extrabold text-navy text-xs">Pet Food Reminder</p>
                      <p className="text-[10px] text-slate-500 mt-1 font-medium">Next scheduled check tomorrow</p>
                    </div>
                    <Button size="sm" onClick={() => alert("Added food pack to basket!")} className="bg-orange-500 text-white font-bold text-[10px] py-1 rounded-lg">Buy Now</Button>
                  </div>
                  <div className="p-3 bg-white rounded-2xl border border-orange-100/50 flex items-center justify-between shadow-sm">
                    <div>
                      <p className="font-extrabold text-navy text-xs">Vaccination Due</p>
                      <p className="text-[10px] text-red-500 font-bold mt-1">⚠️ In 3 Days</p>
                    </div>
                    <Button size="sm" onClick={() => navigate("/services")} className="bg-navy text-white font-bold text-[10px] py-1 rounded-lg">Book Clinic</Button>
                  </div>
                  <div className="p-3 bg-white rounded-2xl border border-orange-100/50 flex items-center justify-between shadow-sm">
                    <div>
                      <p className="font-extrabold text-navy text-xs">Pet Grooming</p>
                      <p className="text-[10px] text-slate-500 mt-1 font-medium">Spa styling at home</p>
                    </div>
                    <Button size="sm" onClick={() => navigate("/services")} className="bg-navy text-white font-bold text-[10px] py-1 rounded-lg">Book Salon</Button>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Kids Corner */}
          {personalization?.hasKids && (
            <section className="container mx-auto px-4 py-2 text-left">
              <div className="bg-gradient-to-br from-pink-50 to-rose-50 border border-rose-100 rounded-3xl p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-navy flex items-center gap-1.5">👶 Kids Corner</h3>
                  <span className="text-[9px] font-black text-rose-600 bg-rose-100 px-2 py-0.5 rounded uppercase tracking-wider">Birthday in 5 Days! 🎉</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="p-3 bg-white rounded-2xl border border-rose-100/50 shadow-sm text-left">
                    <p className="font-extrabold text-navy text-xs">Return Gifts</p>
                    <p className="text-[10px] text-slate-500 mt-1 font-medium">Pack of 12 gift items</p>
                    <Button size="sm" onClick={() => navigate("/category/🛍 Shopping")} className="w-full mt-3 bg-accent text-white text-[10px] font-bold py-1.5 rounded-xl">Browse Gifts</Button>
                  </div>
                  <div className="p-3 bg-white rounded-2xl border border-rose-100/50 shadow-sm text-left">
                    <p className="font-extrabold text-navy text-xs">Decorations</p>
                    <p className="text-[10px] text-slate-500 mt-1 font-medium">Balloons & Party themes</p>
                    <Button size="sm" onClick={() => navigate("/category/🛍 Shopping")} className="w-full mt-3 bg-accent text-white text-[10px] font-bold py-1.5 rounded-xl">View Themes</Button>
                  </div>
                  <div className="p-3 bg-white rounded-2xl border border-rose-100/50 shadow-sm text-left">
                    <p className="font-extrabold text-navy text-xs">Birthday Cake</p>
                    <p className="text-[10px] text-slate-500 mt-1 font-medium">Flavor & custom print selection</p>
                    <Button size="sm" onClick={() => navigate("/category/🍽 Food & Dining")} className="w-full mt-3 bg-accent text-white text-[10px] font-bold py-1.5 rounded-xl">Order Cake</Button>
                  </div>
                  <div className="p-3 bg-white rounded-2xl border border-rose-100/50 shadow-sm text-left">
                    <p className="font-extrabold text-navy text-xs">Birthday Outfits</p>
                    <p className="text-[10px] text-slate-500 mt-1 font-medium">Kids ethnic & casual section</p>
                    <Button size="sm" onClick={() => navigate("/category/🛍 Shopping")} className="w-full mt-3 bg-accent text-white text-[10px] font-bold py-1.5 rounded-xl">Browse Outfits</Button>
                  </div>
                </div>
              </div>
            </section>
          )}



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
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {continueShoppingProducts.map((p: any) => {
                const title = getProductTitle(p);
                const img = getProductImage(p);
                const { price } = getDisplayPrices(p);
                const brandName = p.brand || "ApexBee Seller";
                return (
                  <div key={p._id} className="border border-slate-100 bg-white rounded-3xl p-4 flex flex-col justify-between hover:shadow-premium-hover shadow-sm transition cursor-pointer" onClick={() => navigate(p._id.startsWith("mock-") ? "/products" : `/product/${p._id}`)}>
                    <div>
                      <div className="h-28 bg-slate-50 rounded-2xl overflow-hidden mb-3 flex items-center justify-center">
                        <img src={img} alt={title} className="max-h-full max-w-full object-contain p-2" />
                      </div>
                      <p className="text-[10px] text-muted-foreground font-black uppercase tracking-wider">{brandName}</p>
                      <h4 className="font-extrabold text-navy text-xs mt-1 leading-tight line-clamp-2 min-h-[32px]">{title}</h4>
                      <p className="font-black text-navy text-sm mt-2">₹{price}</p>
                    </div>
                    <Button
                      size="sm"
                      className="w-full mt-3 bg-accent hover:bg-accent/90 text-white font-bold text-xs rounded-xl border-none cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBuyAgainAdd(p);
                      }}
                    >
                      Continue →
                    </Button>
                  </div>
                );
              })}
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-left">
              {/* Rewards Card */}
              <div className="p-5 rounded-3xl border bg-gradient-to-r from-amber-50 to-yellow-50 flex items-center justify-between gap-4 shadow-sm">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-1.5 text-amber-800 bg-white/70 px-2.5 py-1 rounded-full text-xs font-bold">
                    <Gift className="h-3.5 w-3.5" /> Rewards & Cashbacks
                  </div>
                  <h3 className="text-lg font-extrabold text-navy font-sans">KYC Complete Reward</h3>
                  <p className="text-xs text-muted-foreground leading-normal font-medium">Complete your profile and verify KYC to lock in your first ₹50 sign-up bonus.</p>
                  <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold border-none" onClick={() => navigate("/profile")}>
                    Verify Profile
                  </Button>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-[10px] text-amber-800 font-bold uppercase tracking-wider font-mono">Available Balance</p>
                  <p className="text-3xl font-extrabold text-navy mt-1">₹5,000</p>
                  <p className="text-[10px] text-green-700 font-semibold mt-1">✓ Wallet Loaded</p>
                </div>
              </div>

              {/* Referral Program Widget */}
              <div className="p-5 rounded-3xl border bg-gradient-to-r from-purple-50 to-blue-50 flex flex-col justify-between min-h-[160px] shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-1.5 text-purple-800 bg-white/70 px-2.5 py-1 rounded-full text-xs font-bold">
                      <Share2 className="h-3.5 w-3.5" /> Refer & Earn MLM Income
                    </div>
                    <h3 className="text-lg font-extrabold text-navy mt-2 font-sans">Team MLM Network</h3>
                    <p className="text-xs text-muted-foreground mt-1 leading-normal font-medium">Invite friends and earn lifetime commission on every purchase they make up to 3 levels.</p>
                  </div>
                  <div className="bg-white px-3 py-1.5 rounded-xl border text-center font-bold text-xs text-purple-800 shrink-0">
                    Code: APEXBEE123
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <Button size="sm" className="bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold border-none" onClick={() => navigate("/referrals")}>
                    Referral Dashboard
                  </Button>
                  <button
                    type="button"
                    className="text-xs font-bold text-purple-800 hover:underline flex items-center gap-1 bg-transparent border-none cursor-pointer"
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/register?ref=APEXBEE123`);
                      alert("Referral link copied!");
                    }}
                  >
                    Copy Invite Link
                  </button>
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

          {/* Floating Buttons */}
          <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-50 mr-16 md:mr-0">
            <button
              onClick={() => window.open("https://wa.me/919999999999?text=Hi%20ApexBee%2C%20I%20need%20assistance.")}
              className="w-12 h-12 bg-[#25D366] hover:bg-[#20ba5a] text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-transform duration-200 cursor-pointer border-none"
              title="Chat on WhatsApp"
            >
              <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 2.68 1.48 4.74 1.48 5.48 0 9.94-4.46 9.94-9.94 0-5.48-4.46-9.94-9.94-9.94-5.48 0-9.94 4.46-9.94 9.94 0 2.02.5 3.08 1.43 4.69l-.95 3.47 3.47-.95z" />
              </svg>
            </button>
            <button
              onClick={() => setSupportOpen(true)}
              className="w-12 h-12 bg-accent hover:bg-accent/90 text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-transform duration-200 text-lg font-bold cursor-pointer border-none"
              title="Help Support Chat"
            >
              💬
            </button>
          </div>

          {/* Support Drawer */}
          <SupportDrawer isOpen={supportOpen} onClose={() => setSupportOpen(false)} />
        </div>
      </main >
    </>
  );
};

export default Home;
