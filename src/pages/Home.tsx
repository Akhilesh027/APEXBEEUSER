import { useEffect, useMemo, useState } from "react";
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

      if (cat.children?.length) walk(cat.children);
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

const Home = () => {
  const navigate = useNavigate();

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

  useEffect(() => {
    try {
      const items = JSON.parse(localStorage.getItem("mock_recently_viewed") || "[]");
      setRecentlyViewed(items);
    } catch {
      // ignore
    }
  }, []);
  const [dbBanners, setDbBanners] = useState<any[]>([]);

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
      title: "Fast Delivery from Local Stores",
      desc: "Order groceries, electronics, and essentials from nearby shops. Get wholesale deals instantly.",
      badge: "Wholesale Prices",
      image: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?q=80&w=1170&auto=format&fit=crop",
      btnText: "Browse Local Stores",
      action: () => navigate("/local-stores"),
    },
    {
      id: 2,
      title: "ApexBee Academy Open For Enrollment",
      desc: "Learn Digital Marketing, MLM Leadership, and Entrepreneurship skills. Earn certifications.",
      badge: "Academy Launch",
      image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1170&auto=format&fit=crop",
      btnText: "Explore Courses",
      action: () => navigate("/academy"),
    },
    {
      id: 3,
      title: "Become an Ecosystem Partner",
      desc: "Register as a Business Partner, refer friends, and unlock multilevel earnings and MLM network income.",
      badge: "Earnings Opportunity",
      image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=1115&auto=format&fit=crop",
      btnText: "Register / Referrals",
      action: () => navigate("/referrals"),
    },
  ], [navigate]);

  const displayBanners = useMemo(() => {
    if (dbBanners.length === 0) return heroBanners;
    return dbBanners.map((c, index) => ({
      id: c._id || index,
      title: c.name,
      desc: `Sponsored promotion by ${c.ownerId?.name || 'ApexBee Partner'}. Exclusive ecosystem deals.`,
      badge: c.type || "Active Ad",
      image: index % 3 === 0
        ? "https://images.unsplash.com/photo-1563013544-824ae1b704d3?q=80&w=1170&auto=format&fit=crop"
        : index % 3 === 1
          ? "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1170&auto=format&fit=crop"
          : "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=1115&auto=format&fit=crop",
      btnText: "Learn More",
      action: () => navigate("/products")
    }));
  }, [dbBanners, heroBanners, navigate]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % displayBanners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [displayBanners]);


  /** ---------------------------
   * Auth: Check login
   * -------------------------- */
  useEffect(() => {
    const user = localStorage.getItem("user");
    if (user) setLoggedInUser(JSON.parse(user));
  }, []);

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
    const res = await fetch(`${API_BASE}/products?limit=${limit}`);
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
  }, []);

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
      className="text-left bg-white border rounded-2xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all group w-full"
    >
      <div className="h-44 bg-muted overflow-hidden relative">
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

      <div className="p-4">
        <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-bold">
          {p.brand || "ApexBee Seller"}
        </p>

        <p className="font-semibold text-navy line-clamp-2 mt-1">{title}</p>

        {categoryLabel && (
          <p className="text-[10px] text-muted-foreground mt-1 line-clamp-1">
            {categoryLabel}
          </p>
        )}

        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-lg font-bold text-navy">
            {price > 0 ? formatINR(price) : "₹—"}
          </span>

          {mrp > 0 && (
            <span className="text-sm text-muted-foreground line-through">
              {formatINR(mrp)}
            </span>
          )}
        </div>

        <div className="mt-2 flex items-center gap-2">
          <span className="text-xs px-2 py-1 rounded-full bg-blue-light text-navy font-semibold">
            ⭐ {avgRating > 0 ? avgRating.toFixed(1) : "—"}
          </span>
          <span className="text-xs text-muted-foreground">
            {ratingCount > 0 ? `(${ratingCount})` : "(0)"}
          </span>

          <span className="ml-auto text-[10px] text-muted-foreground">
            Stock: {p.stock || 0}
          </span>
        </div>

        {p.tag && (
          <div className="mt-2">
            <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-800 font-semibold">
              {p.tag}
            </span>
          </div>
        )}
      </div>
    </button>
  );
};

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {!loggedInUser && (
        <div className="bg-blue-light border-b text-center py-2 text-sm">
          On Direct <span className="font-semibold">(LI)</span> registration other complete KYC - 50/-
        </div>
      )}



      {/* Hero Banner Slider */}
      <section className="container mx-auto px-4 py-6">
        <div className="relative overflow-hidden rounded-3xl border bg-gradient-to-r from-navy to-navy-dark text-white shadow-md min-h-[280px] flex items-center">
          {displayBanners.map((slide, idx) => (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-opacity duration-1000 ${
                idx === currentSlide ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
              }`}
            >
              <div className="absolute inset-0 bg-black/40" />
              <img
                src={slide.image}
                alt="banner"
                className="w-full h-full object-cover absolute inset-0"
              />
              <div className="relative p-6 sm:p-10 md:p-14 max-w-2xl flex flex-col justify-center h-full z-10 text-left">
                <div className="inline-flex self-start items-center gap-2 bg-accent px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase text-white">
                  <Sparkles className="h-3.5 w-3.5 text-white" /> {slide.badge}
                </div>
                <h2 className="mt-4 text-2xl sm:text-3xl md:text-4xl font-extrabold leading-tight text-white">
                  {slide.title}
                </h2>
                <p className="mt-3 text-sm text-white/95 leading-relaxed">
                  {slide.desc}
                </p>
                <div className="mt-6">
                  <Button className="bg-accent hover:bg-accent/90 text-white font-bold" onClick={slide.action}>
                    {slide.btnText}
                  </Button>
                </div>
              </div>
            </div>
          ))}
          {/* Dots */}
          <div className="absolute bottom-4 right-4 flex gap-2 z-20">
            {displayBanners.map((_, idx) => (
              <button
                key={idx}
                className={`w-2 h-2 rounded-full transition-all ${
                  idx === currentSlide ? "bg-accent w-4" : "bg-white/50"
                }`}
                onClick={() => setCurrentSlide(idx)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Quick Shortcuts */}
      <section className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-navy">Quick Shortcuts</h2>
          <button onClick={() => navigate("/category")} className="text-xs text-primary font-semibold hover:underline">
            View All →
          </button>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {[
            {
              label: "Shop",
              desc: "Products & Deals",
              emoji: "🛍️",
              gradient: "linear-gradient(135deg,#6C63FF,#8B5CF6)",
              to: "/products",
            },
            {
              label: "Services",
              desc: "Book Professionals",
              emoji: "🔧",
              gradient: "linear-gradient(135deg,#0EA5E9,#06B6D4)",
              to: "/services",
            },
            {
              label: "Academy",
              desc: "Learn & Grow",
              emoji: "🎓",
              gradient: "linear-gradient(135deg,#10B981,#059669)",
              to: "/academy",
            },
            {
              label: "Travel",
              desc: "Flights & Hotels",
              emoji: "✈️",
              gradient: "linear-gradient(135deg,#F59E0B,#F97316)",
              to: "/travel",
            },
            {
              label: "Community",
              desc: "Support & Connect",
              emoji: "🤝",
              gradient: "linear-gradient(135deg,#8B5CF6,#6C63FF)",
              to: "/community",
            },
            {
              label: "Earn",
              desc: "Refer & Partner",
              emoji: "🐝",
              gradient: "linear-gradient(135deg,#F97316,#F59E0B)",
              to: "/earn-with-apexbee",
            },
          ].map((item) => (
            <button
              key={item.label}
              onClick={() => navigate(item.to)}
              className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-white border hover:shadow-lg hover:-translate-y-1 transition-all duration-200 group cursor-pointer"
            >
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-md group-hover:scale-110 transition-transform duration-200"
                style={{ background: item.gradient }}
              >
                {item.emoji}
              </div>
              <div className="text-center">
                <p className="font-bold text-navy text-xs leading-tight group-hover:text-accent transition-colors">
                  {item.label}
                </p>
                <p className="text-[9px] text-muted-foreground mt-0.5 leading-tight hidden sm:block">
                  {item.desc}
                </p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Explore Categories (Vite/Dynamic Categories) */}
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
                <div key={index} className="flex flex-col items-center gap-2 min-w-[90px]">
                  <Skeleton className="w-16 h-16 rounded-full" />
                  <Skeleton className="w-16 h-4 rounded" />
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
                  className="flex flex-col items-center min-w-[92px] cursor-pointer group"
                >
                  <div className="w-16 h-16 rounded-full overflow-hidden border bg-white">
                    <img
                      src={category.image || "/placeholder.svg"}
                      alt={category.label}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      loading="lazy"
                    />
                  </div>
                  <p className="text-sm mt-2 text-center font-semibold text-navy group-hover:text-accent">
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

      {/* Featured Products */}
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

      {/* Daily Deals */}
      <section className="container mx-auto px-4 py-6">
        <div className="rounded-3xl border bg-gradient-to-r from-yellow-50 to-orange-50 p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
            <div className="text-left">
              <div className="inline-flex items-center gap-2 text-[10px] font-bold bg-white/70 px-3 py-1 rounded-full text-yellow-800">
                <Flame className="h-3.5 w-3.5" /> DAILY DEALS
              </div>
              <h2 className="text-xl font-extrabold text-navy mt-3">Daily Deals</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Limited time offers. Grab them before they end!
              </p>
            </div>
            <Button className="bg-yellow-500 hover:bg-yellow-600 text-navy font-bold text-xs" onClick={() => navigate("/products")}>
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

      {/* Nearby Stores */}
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
                className="group rounded-2xl border bg-white p-4 hover:shadow-md cursor-pointer transition flex gap-3 text-left"
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
                  <p className="text-[11px] text-accent font-semibold mt-2">
                    ★ {shop.rating || "4.5"} • {shop.category || "General Store"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Featured Services */}
      <section className="container mx-auto px-4 py-8 bg-blue-light/20 rounded-3xl border my-6">
        <div className="flex items-center justify-between mb-6">
          <div className="text-left">
            <h2 className="text-xl font-bold text-navy">Featured Services</h2>
            <p className="text-xs text-muted-foreground mt-1">Book reliable home & commercial services locally.</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate("/category/Home Cleaning")}>
            Book Services
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { title: "Home Salon & Spa", price: "Starting ₹299", image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=300", rating: "4.8", reviews: "150" },
            { title: "Plumbing & Repairs", price: "Starting ₹149", image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=300", rating: "4.7", reviews: "94" },
            { title: "Smart Home Cleaning", price: "Starting ₹499", image: "https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?w=300", rating: "4.9", reviews: "210" },
            { title: "Appliance Servicing", price: "Starting ₹199", image: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=300", rating: "4.6", reviews: "128" },
          ].map((svc, idx) => (
            <div key={idx} className="bg-white border rounded-2xl overflow-hidden hover:shadow-md transition group text-left">
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

      {/* ApexBee Academy Section */}
      <section className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="text-left">
            <h2 className="text-xl font-bold text-navy">ApexBee Academy</h2>
            <p className="text-xs text-muted-foreground mt-1">Upgrade your skills, build your business network, and earn certifications.</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate("/category/Technology")}>
            Explore Academy
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            { title: "Direct Selling Mastery", desc: "Build a solid MLM foundation, learn networking strategies, and double your referrals.", duration: "8 modules • Beginner", rating: "4.9", image: "https://images.unsplash.com/photo-1552581230-c013741398c3?w=300" },
            { title: "Digital Marketing & Brand Building", desc: "Learn how to use social media, advertisements, and content creation to gain customers.", duration: "12 modules • Intermediate", rating: "4.8", image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=300" },
            { title: "Ecosystem Entrepreneurship", desc: "A guide to registering as a vendor, setting up franchises, and scaling on ApexBee.", duration: "6 modules • Advanced", rating: "4.9", image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=300" },
          ].map((course, idx) => (
            <div key={idx} className="border rounded-2xl bg-white overflow-hidden hover:shadow-md transition flex flex-col justify-between text-left">
              <div>
                <div className="h-36 bg-muted overflow-hidden">
                  <img src={course.image} alt={course.title} className="w-full h-full object-cover" />
                </div>
                <div className="p-4">
                  <h4 className="font-bold text-navy text-sm">{course.title}</h4>
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2 leading-relaxed">{course.desc}</p>
                </div>
              </div>
              <div className="px-4 pb-4 pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-muted-foreground">
                <span>{course.duration}</span>
                <span className="font-semibold text-navy">★ {course.rating}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Earn With ApexBee Section */}
      <section className="container mx-auto px-4 py-8 bg-navy text-white rounded-3xl my-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 opacity-10 pointer-events-none">
          <TrendingUp className="h-72 w-72 text-white" />
        </div>
        <div className="relative p-6 md:p-8 text-left">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-extrabold text-white">Earn with ApexBee Ecosystem</h2>
            <p className="text-white/80 text-xs mt-2 leading-relaxed">
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
                <div key={idx} className="p-4 bg-white/10 rounded-2xl border border-white/10 text-left hover:bg-white/15 transition">
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

      {/* Rewards, Cashback & Referrals Widgets */}
      <section className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-left">
          {/* Rewards Card */}
          <div className="p-5 rounded-3xl border bg-gradient-to-r from-amber-50 to-yellow-50 flex items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 text-amber-800 bg-white/70 px-2.5 py-1 rounded-full text-xs font-bold">
                <Gift className="h-3.5 w-3.5" /> Rewards & Cashbacks
              </div>
              <h3 className="text-lg font-extrabold text-navy">KYC Complete Reward</h3>
              <p className="text-xs text-muted-foreground leading-normal">Complete your profile and verify KYC to lock in your first ₹50 sign-up bonus.</p>
              <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold" onClick={() => navigate("/profile")}>
                Verify Profile
              </Button>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-[10px] text-amber-800 font-bold uppercase tracking-wider">Available Balance</p>
              <p className="text-3xl font-extrabold text-navy mt-1">₹5,000</p>
              <p className="text-[10px] text-green-700 font-semibold mt-1">✓ Wallet Loaded</p>
            </div>
          </div>

          {/* Referral Program Widget */}
          <div className="p-5 rounded-3xl border bg-gradient-to-r from-purple-50 to-blue-50 flex flex-col justify-between min-h-[160px]">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 text-purple-800 bg-white/70 px-2.5 py-1 rounded-full text-xs font-bold">
                  <Share2 className="h-3.5 w-3.5" /> Refer & Earn MLM Income
                </div>
                <h3 className="text-lg font-extrabold text-navy mt-2">Team MLM Network</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-normal">Invite friends and earn lifetime commission on every purchase they make up to 3 levels.</p>
              </div>
              <div className="bg-white px-3 py-1.5 rounded-xl border text-center font-bold text-xs text-purple-800 shrink-0">
                Code: APEXBEE123
              </div>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <Button size="sm" className="bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold" onClick={() => navigate("/referrals")}>
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
            <div key={idx} className="p-4 rounded-2xl border bg-white hover:bg-muted/5 transition flex items-start gap-3 text-left">
              <div className="p-2 rounded-xl bg-muted text-navy shrink-0">
                <Volume2 className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-bold text-navy text-sm truncate">{feed.title}</h4>
                  <span className="text-[10px] text-muted-foreground shrink-0">{feed.date}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{feed.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Recently Viewed Section */}
      {recentlyViewed.length > 0 && (
        <section className="container mx-auto px-4 py-8 border-t border-slate-100 mt-6">
          <div className="flex items-center justify-between mb-6">
            <div className="text-left">
              <h2 className="text-xl font-bold text-navy flex items-center gap-2">
                <Clock className="h-5 w-5 text-accent" />
                Recently Viewed
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">Quickly pick up where you left off.</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                localStorage.removeItem("mock_recently_viewed");
                setRecentlyViewed([]);
              }}
              className="text-xs font-bold text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl"
            >
              Clear History
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {recentlyViewed.slice(0, 6).map((item) => (
              <div
                key={`${item.type}-${item.id}`}
                onClick={() => navigate(item.url)}
                className="group border border-slate-100 bg-white rounded-2xl overflow-hidden hover:shadow-lg cursor-pointer transition p-3 flex flex-col justify-between text-left"
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
    </div>
  );
};

export default Home;
