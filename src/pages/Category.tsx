import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { ShoppingCart, Search, Filter, Star, Sparkles, MapPin, Tag, Compass, Calendar, RefreshCw, ChevronRight, Award } from "lucide-react";
import { Button } from "@/components/ui/button";

const API_BASE = "https://server.apexbee.in/api";

// ═══════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════
interface Product {
  _id: string;
  itemName?: string;
  name?: string;
  images?: string[];
  subcategory?: string;
  userPrice?: number;
  afterDiscount?: number;
  rating?: number;
  reviews?: number;
  tag?: string;
  categoryName?: string;
  [key: string]: any;
}

interface Subcategory {
  _id: string;
  name: string;
  slug?: string;
  image?: string;
  level?: number;
  parentId?: string | null;
  isActive?: boolean;
}

interface CategoryType {
  _id: string;
  name: string;
  slug?: string;
  image?: string;
  level?: number;
  parentId?: string | null;
  isActive?: boolean;
  children?: CategoryType[];
  productCount?: number;
}

// Mapping to detect "virtual" service/non-product categories
const SERVICE_CATEGORIES = new Set([
  "plumbing", "electrician", "home cleaning", "salon & spa", "ac repair", "pest control",
  "painting", "interiors", "cleaning", "beauty", "salon", "spa", "repair", "mechanic",
  "carpenter", "interior", "designer",
]);
const LEARNING_CATEGORIES = new Set([
  "business", "technology", "digital marketing", "finance", "design", "languages",
  "marketing", "coding", "course", "learn", "education",
]);
const TRAVEL_CATEGORIES = new Set([
  "flights", "hotels", "bus tickets", "train", "cab booking", "tour packages",
  "flight", "hotel", "bus", "cab", "tour", "travel",
]);
const FINANCE_CATEGORIES = new Set([
  "insurance", "loans", "investments", "apexbee wallet", "bill payments", "recharge",
  "wallet", "loan", "invest", "bill", "payment",
]);
const EARN_CATEGORIES = new Set([
  "refer & earn", "become a partner", "sell on apexbee", "build your team", "franchise",
  "delivery partner", "refer", "partner", "franchise", "sell", "earn", "team",
]);

// Colors by group for service/virtual detail pages
const GROUP_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  service: { bg: "linear-gradient(135deg,#0ea5e9 0%,#06b6d4 100%)", text: "#0ea5e9", border: "#bae6fd" },
  learning: { bg: "linear-gradient(135deg,#10b981 0%,#059669 100%)", text: "#10b981", border: "#a7f3d0" },
  travel: { bg: "linear-gradient(135deg,#f59e0b 0%,#f97316 100%)", text: "#f59e0b", border: "#fde68a" },
  finance: { bg: "linear-gradient(135deg,#8b5cf6 0%,#6c63ff 100%)", text: "#8b5cf6", border: "#ddd6fe" },
  earn: { bg: "linear-gradient(135deg,#f97316 0%,#f59e0b 100%)", text: "#f97316", border: "#fed7aa" },
};

function detectVirtualCategory(name: string): keyof typeof GROUP_COLORS | null {
  const n = name.trim().toLowerCase();
  if (n.includes("service")) return "service";
  if (n.includes("academy") || n.includes("learning") || n.includes("course")) return "learning";
  if (n.includes("travel") || n.includes("tour") || n.includes("flight")) return "travel";
  if (n.includes("finance") || n.includes("insurance") || n.includes("loan")) return "finance";
  if (n.includes("earn") || n.includes("referral")) return "earn";
  return null;
}

const VIRTUAL_LABELS: Record<string, { emoji: string; title: string; sub: string; cta: string }> = {
  service: { emoji: "🔧", title: "Service Booking", sub: "Book top-rated professionals near you", cta: "Browse All Services" },
  learning: { emoji: "🎓", title: "ApexBee Academy", sub: "Expert-led courses to grow your skills", cta: "Explore Courses" },
  travel: { emoji: "✈️", title: "ApexBee Travel", sub: "Best deals on flights, hotels & packages", cta: "Explore Travel" },
  finance: { emoji: "💰", title: "ApexBee Finance", sub: "Smart financial tools for every goal", cta: "Explore Finance" },
  earn: { emoji: "🐝", title: "Earn With ApexBee", sub: "Turn your network into unlimited income", cta: "Start Earning" },
};

function getSubIcon(name?: string): string {
  const iconMap: Record<string, string> = {
    devotional: "🙏",
    fashion: "👗", electronics: "📱", home: "🏠", "home & living": "🏠",
    beauty: "💄", sports: "⚽", books: "📚", toys: "🧸", food: "🍕",
    grocery: "🛒", jewelry: "💎", sarees: "🪡", furniture: "🪑", sale: "🔥",
    plumbing: "🔧", electrician: "⚡", "home cleaning": "🧹", "salon & spa": "💅",
    "ac repair": "❄️", "pest control": "🐛", painting: "🎨", interiors: "🛋️",
    business: "💼", technology: "💻", "digital marketing": "📣",
    design: "🎨", languages: "🌐",
    flights: "✈️", hotels: "🏨", "bus tickets": "🚌", train: "🚂",
    "cab booking": "🚕", "tour packages": "🗺️",
    insurance: "🛡️", loans: "🏦", investments: "📈",
    "apexbee wallet": "👝", "bill payments": "💡", recharge: "📲",
    "refer & earn": "🎁", "become a partner": "🤝", "sell on apexbee": "🏪",
    "build your team": "👥", franchise: "🏢", "delivery partner": "🛵",
    "daily needs": "🛒", "food & dining": "🍽️", "business hub": "💼", "shopping": "🛍️",
    "apexbee academy": "🎓", "services": "🔧", "finance": "💰", "events": "📅",
    "tours & travels": "✈️", "pets": "🐾", "health & wellness": "❤", "kids world": "👶",
    "women's empire": "👑", "delivery & logistics": "🚚"
  };
  return iconMap[(name || "").trim().toLowerCase()] || "🛍️";
}

// ═══════════════════════════════════════════════════════
// Recently Viewed (localStorage)
// ═══════════════════════════════════════════════════════
const RECENTLY_VIEWED_KEY = "apexbee_recently_viewed_cats";

function addRecentlyViewed(cat: { id: string; name: string; icon: string }) {
  try {
    const stored: any[] = JSON.parse(localStorage.getItem(RECENTLY_VIEWED_KEY) || "[]");
    const updated = [cat, ...stored.filter((c) => c.id !== cat.id)].slice(0, 6);
    localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(updated));
  } catch { }
}

function getRecentlyViewed(): { id: string; name: string; icon: string }[] {
  try { return JSON.parse(localStorage.getItem(RECENTLY_VIEWED_KEY) || "[]"); }
  catch { return []; }
}

// Dynamic rich details mapping for informative layouts
const getCategoryDetails = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes("devotional")) {
    return {
      subs: "5 Subcategories",
      prods: "200 Products",
      tags: ["Puja Kits", "Incense", "Idols", "Devotional Books"]
    };
  }
  if (n.includes("daily") || n.includes("grocery") || n.includes("need")) {
    return {
      subs: "24 Subcategories",
      prods: "18,000 Products",
      tags: ["Milk", "Water Can", "Tomatoes", "Sunflower Oil", "Aashirvaad Atta"]
    };
  }
  if (n.includes("food") || n.includes("dining") || n.includes("restaurant")) {
    return {
      subs: "45 Restaurants",
      prods: "600 Menu Items (1200+ Dishes)",
      tags: ["Biryani", "Dosa", "Nellore Breakfast", "Pizza", "Bakery Cake"]
    };
  }
  if (n.includes("service") || n.includes("cleaning") || n.includes("plumb")) {
    return {
      subs: "95 Professionals",
      prods: "35 Services (4.8 Avg Rating)",
      tags: ["AC Repair", "Plumbing", "Electrical", "Home Cleaning", "Salon & Spa"]
    };
  }
  if (n.includes("academy") || n.includes("learn")) {
    return {
      subs: "12 Curated Tracks",
      prods: "140 Courses (Certified)",
      tags: ["Direct Selling", "MLM Leadership", "Digital Marketing", "Finance"]
    };
  }
  // Default values
  return {
    subs: "8 Subcategories",
    prods: "1,200 Products",
    tags: ["Explore", "Nearby Stores", "Popular", "Offers"]
  };
};

const StarRating = ({ rating, size = 12 }: { rating: number; size?: number }) => (
  <span className="inline-flex gap-px">
    {[1, 2, 3, 4, 5].map((s) => (
      <span key={s} style={{ color: s <= Math.round(rating) ? "#f59e0b" : "#d1d5db", fontSize: size }}>★</span>
    ))}
  </span>
);

// Virtual / service category detail page
const VirtualCategoryPage = ({ name }: { name: string }) => {
  const type = detectVirtualCategory(name) || "service";
  const theme = GROUP_COLORS[type];
  const labels = VIRTUAL_LABELS[type];
  const navigate = useNavigate();

  useEffect(() => {
    if (type === "service") navigate("/services", { replace: true });
    else if (type === "learning") navigate("/academy", { replace: true });
    else if (type === "travel") navigate("/travel", { replace: true });
    else if (type === "earn") navigate("/earn-with-apexbee", { replace: true });
    else if (type === "finance") navigate("/community", { replace: true });
  }, [type, navigate]);

  const highlights = [
    { icon: "✅", label: "Verified Professionals" },
    { icon: "⚡", label: "Quick Booking" },
    { icon: "🔒", label: "Secure Payments" },
    { icon: "⭐", label: "Top Rated" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="w-full" style={{ background: theme.bg }}>
        <div className="container mx-auto px-4 py-14 text-center">
          <div className="text-7xl mb-4 drop-shadow-lg">{getSubIcon(name)}</div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-3 drop-shadow">
            {name}
          </h1>
          <p className="text-white/80 text-lg mb-6">{labels.sub}</p>
          <div className="flex justify-center gap-4 flex-wrap mb-8">
            {highlights.map((h) => (
              <div key={h.label} className="flex items-center gap-2 bg-white/20 backdrop-blur rounded-full px-4 py-2 text-white text-sm font-semibold">
                <span>{h.icon}</span> {h.label}
              </div>
            ))}
          </div>
          <Link
            to="/category"
            className="inline-flex items-center gap-2 bg-white text-navy font-bold px-8 py-3 rounded-2xl hover:bg-white/90 transition shadow-lg text-base"
          >
            ← {labels.cta}
          </Link>
        </div>
      </section>

      {/* Breadcrumb */}
      <div className="container mx-auto px-4 py-4">
        <p className="text-sm text-muted-foreground">
          <Link to="/" className="hover:underline">Home</Link>
          {" / "}
          <Link to="/category" className="hover:underline">Categories</Link>
          {" / "}
          <span className="font-medium text-navy">{name}</span>
        </p>
      </div>

      {/* Coming soon card */}
      <section className="container mx-auto px-4 pb-16">
        <div
          className="rounded-3xl border-2 p-10 text-center shadow-lg"
          style={{ borderColor: theme.border, background: `${theme.text}08` }}
        >
          <div className="text-6xl mb-5 animate-bounce inline-block">🚀</div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-navy mb-3">
            {name} — Launching Soon!
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto mb-8 text-base">
            We're onboarding the best {name.toLowerCase()} professionals in your city. Be the first to know when we go live!
          </p>

          {/* Notify form */}
          <div className="max-w-sm mx-auto flex gap-3">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2"
              style={{ "--tw-ring-color": theme.text } as any}
            />
            <button
              className="rounded-xl px-5 py-3 text-sm font-bold text-white transition hover:opacity-90"
              style={{ background: theme.bg }}
            >
              Notify Me
            </button>
          </div>

          <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: "🏙️", text: "City-wide coverage" },
              { icon: "🤝", text: "100+ partners joining" },
              { icon: "🎯", text: "Best-in-class service" },
              { icon: "💳", text: "Easy pay & cashback" },
            ].map((item) => (
              <div key={item.text} className="rounded-xl border bg-white p-4 text-center shadow-sm">
                <div className="text-3xl mb-2">{item.icon}</div>
                <p className="text-sm font-semibold text-navy">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

// Skeleton card
const SkeletonCard = () => (
  <div className="rounded-2xl overflow-hidden border bg-white animate-pulse">
    <div className="h-44 bg-gray-200" />
    <div className="p-4 space-y-2">
      <div className="h-4 bg-gray-200 rounded w-3/4" />
      <div className="h-3 bg-gray-100 rounded w-1/2" />
    </div>
  </div>
);

// Inline subcategory row
const SubRow = ({ subs, parentName }: { subs: CategoryType[]; parentName: string }) => {
  if (!subs.length) return null;
  return (
    <div className="mt-3 pt-3 border-t border-gray-100">
      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 text-left">Subcategories</p>
      <div className="flex flex-wrap gap-2">
        {subs.map((s) => (
          <Link
            key={s._id}
            to={`/category/${encodeURIComponent(s.name)}`}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1.5 text-xs font-semibold rounded-full border px-3 py-1 bg-gray-50 text-slate-700 hover:bg-accent hover:text-white hover:border-accent transition-all duration-200"
          >
            <span>{getSubIcon(s.name)}</span>
            <span>{s.name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
};

function getSubcategoryImage(name: string, slug?: string): string {
  const n = (name || "").toLowerCase();
  const s = (slug || "").toLowerCase();

  if (n.includes("milk") || n.includes("dairy")) {
    return "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=150&auto=format&fit=crop&q=60";
  }
  if (n.includes("water") || n.includes("can")) {
    return "https://images.unsplash.com/photo-1548839140-29a880455022?w=150&auto=format&fit=crop&q=60";
  }
  if (n.includes("vegetable") || n.includes("fruit") || n.includes("veg")) {
    return "https://images.unsplash.com/photo-1573244514399-52e676d0dd03?w=150&auto=format&fit=crop&q=60";
  }
  if (n.includes("flower") || n.includes("pooja") || n.includes("kit") || n.includes("devotional")) {
    return "https://images.unsplash.com/photo-1561181286-d3fee7d55364?w=150&auto=format&fit=crop&q=60";
  }
  if (n.includes("bakery") || n.includes("bread") || n.includes("dessert") || n.includes("cake")) {
    return "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=150&auto=format&fit=crop&q=60";
  }
  if (n.includes("grocery") || n.includes("groceries")) {
    return "https://images.unsplash.com/photo-1542838132-92c53300491e?w=150&auto=format&fit=crop&q=60";
  }
  if (n.includes("household") || n.includes("supply") || n.includes("supplies") || n.includes("clean")) {
    return "https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=150&auto=format&fit=crop&q=60";
  }
  if (n.includes("saree") || n.includes("ethnic") || n.includes("fashion") || n.includes("clothing") || n.includes("wear")) {
    return "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=150&auto=format&fit=crop&q=60";
  }
  if (n.includes("electronic") || n.includes("appliance") || n.includes("phone")) {
    return "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=150&auto=format&fit=crop&q=60";
  }
  if (n.includes("restaurant") || n.includes("food") || n.includes("dine") || n.includes("dining")) {
    return "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=150&auto=format&fit=crop&q=60";
  }
  if (n.includes("all")) {
    return "https://images.unsplash.com/photo-1533900298318-6b8da08a523e?w=150&auto=format&fit=crop&q=60";
  }
  const fallbacks = [
    "https://images.unsplash.com/photo-1542838132-92c53300491e?w=150&auto=format&fit=crop&q=60",
    "https://images.unsplash.com/photo-1533900298318-6b8da08a523e?w=150&auto=format&fit=crop&q=60",
    "https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=150&auto=format&fit=crop&q=60",
  ];
  const charCodeSum = n.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return fallbacks[charCodeSum % fallbacks.length];
}

const Category = () => {
  const { categoryName } = useParams();
  const navigate = useNavigate();

  // ── Discovery state ──
  const [allCats, setAllCats] = useState<CategoryType[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<{ id: string; name: string; icon: string }[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [discoveryLoading, setDiscoveryLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // ── Detail state ──
  const [category, setCategory] = useState<CategoryType | null>(null);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // ── Left Filter State ──
  const [filters, setFilters] = useState({
    products: true,
    services: true,
    nearby: true,
    offers: true,
    scheduled: true,
    subscription: true
  });

  const handleFilterToggle = (key: keyof typeof filters) => {
    setFilters(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // ── Search autocomplete suggestions ──
  const suggestions = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    const matches: string[] = [];
    if ("flowers".includes(q) || "jasmine".includes(q) || "rose".includes(q) || "pooja".includes(q)) {
      matches.push("🌼 Flowers", "🌼 Jasmine", "🌼 Rose", "🌼 Marigold", "🌼 Pooja Flowers", "🌼 Flower Subscription");
    }
    if ("water".includes(q) || "can".includes(q)) {
      matches.push("💧 Drinking Water Can 20L", "💧 Water Subscription", "💧 Mineral Water");
    }
    if ("milk".includes(q) || "dairy".includes(q)) {
      matches.push("🥛 Cow Milk 1L", "🥛 Buffalo Milk 1L", "🥛 Organic Milk", "🥛 Nandini Milk");
    }
    if ("vegetables".includes(q) || "tomato".includes(q) || "onion".includes(q)) {
      matches.push("🥬 Fresh Tomatoes 1kg", "🥬 Fresh Onions 1kg", "🥬 Green Vegetables Basket");
    }
    if ("ac".includes(q) || "repair".includes(q) || "service".includes(q)) {
      matches.push("🔧 AC Repair & Gas Refill", "🔧 AC Deep Cleaning", "🔧 Split AC Servicing");
    }
    if ("biryani".includes(q) || "food".includes(q) || "restaurant".includes(q)) {
      matches.push("🍔 Biryani Special Dhabha", "🍔 Dosa Nellore Breakfast", "🍔 Chocolate Cake Bakery");
    }
    return matches;
  }, [searchQuery]);

  const virtualType = categoryName ? detectVirtualCategory(categoryName) : null;

  // ─────────────── Fetch ALL categories for discovery ───────────────
  useEffect(() => {
    if (categoryName) return;
    setRecentlyViewed(getRecentlyViewed());
    const go = async () => {
      setDiscoveryLoading(true);
      try {
        const res = await axios.get(`${API_BASE}/categories`);
        const flat: CategoryType[] = (res.data?.categories || []).filter((c: CategoryType) => c.isActive !== false);

        // Build parent → children tree
        const parentMap = new Map<string, CategoryType>();
        const parents: CategoryType[] = [];
        flat.forEach((c) => {
          if (!c.parentId) {
            c.children = [];
            parentMap.set(c._id, c);
            parents.push(c);
          }
        });
        flat.forEach((c) => {
          if (c.parentId) {
            const p = parentMap.get(String(c.parentId));
            if (p) p.children = [...(p.children || []), c];
          }
        });

        // SORT CATEGORIES IN THE EXACT REQUESTED ORDER
        parents.sort((a, b) => {
          const nameA = a.name.toLowerCase();
          const nameB = b.name.toLowerCase();

          const getIndex = (name: string) => {
            if (name.includes("devotional")) return 0;
            if (name.includes("daily") || name.includes("grocery") || name.includes("need")) return 1;
            if (name.includes("food") || name.includes("dining") || name.includes("restaurant")) return 2;
            if (name.includes("business") || name.includes("hub")) return 3;
            if (name.includes("shopping") || name.includes("fashion") || name.includes("electronics")) return 4;
            if (name.includes("academy") || name.includes("learn")) return 5;
            if (name.includes("service") || name.includes("cleaning") || name.includes("plumb")) return 6;
            if (name.includes("finance") || name.includes("wallet")) return 7;
            if (name.includes("event")) return 8;
            if (name.includes("travel") || name.includes("tour")) return 9;
            if (name.includes("pet")) return 10;
            if (name.includes("health") || name.includes("wellness") || name.includes("pharmacy")) return 11;
            if (name.includes("kid")) return 12;
            if (name.includes("women")) return 13;
            if (name.includes("delivery") || name.includes("logistic") || name.includes("pickup")) return 14;
            return 99;
          };

          return getIndex(nameA) - getIndex(nameB);
        });

        setAllCats(parents);
      } catch (e) {
        console.error(e);
      } finally {
        setDiscoveryLoading(false);
      }
    };
    go();
  }, [categoryName]);

  // ─────────────── Fetch category detail ───────────────
  useEffect(() => {
    if (!categoryName) return;
    if (detectVirtualCategory(categoryName)) {
      setLoading(false);
      return;
    }
    const go = async () => {
      setLoading(true);
      try {
        const catRes = await axios.get(`${API_BASE}/categories`);
        const flat: CategoryType[] = catRes?.data?.categories || [];
        const cleanName = (s: string) => s.replace(/[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDC00-\uDFFF]/g, '').trim().toLowerCase();
        const found = flat.find((c) => {
          const n1 = c.name.trim().toLowerCase();
          const n2 = categoryName.trim().toLowerCase();
          return n1 === n2 || cleanName(c.name) === cleanName(categoryName) || (c.slug && n2.includes(c.slug));
        });
        if (!found) {
          setCategory(null);
          setLoading(false);
          return;
        }

        let mainCategory = found;
        let selectedSubId = null;

        if (found.parentId) {
          const parent = flat.find((c) => c._id === String(found.parentId));
          if (parent) {
            mainCategory = parent;
            selectedSubId = found._id;
          }
        }

        addRecentlyViewed({ id: mainCategory._id, name: mainCategory.name, icon: getSubIcon(mainCategory.name) });
        setCategory(mainCategory);

        // get children as subcategories of the main category
        const subs = flat.filter((c) => c.parentId && String(c.parentId) === mainCategory._id);
        const mappedSubs = subs.map((s) => ({ _id: s._id, name: s.name, image: s.image }));
        setSelectedSubcategoryId(selectedSubId);

        // Fetch active subcategories from the Subcategory collection via our new API
        try {
          const subRes = await axios.get(`${API_BASE}/categories/${mainCategory._id}/subcategories`);
          if (subRes.data?.success && Array.isArray(subRes.data.subcategories)) {
            const apiSubs = subRes.data.subcategories.map((s: any) => ({
              _id: s._id,
              name: s.name,
              image: s.image || s.banner
            }));
            const allSubsMap = new Map();
            mappedSubs.forEach(s => allSubsMap.set(String(s._id), s));
            apiSubs.forEach((s: any) => allSubsMap.set(String(s._id), s));
            setSubcategories(Array.from(allSubsMap.values()));
          } else {
            setSubcategories(mappedSubs);
          }
        } catch (subErr) {
          console.error("Error fetching database subcategories:", subErr);
          setSubcategories(mappedSubs);
        }

        // Fetch products of the categoryName
        const prodRes = await axios.get(`${API_BASE}/products?category=${encodeURIComponent(categoryName)}`);
        setAllProducts(prodRes?.data?.products || []);
      } catch (err) {
        console.error(err);
        setCategory(null);
      } finally {
        setLoading(false);
      }
    };
    go();
  }, [categoryName]);

  // ─────────────── Derived ───────────────
  const filteredProducts = useMemo(() => {
    if (!selectedSubcategoryId) return allProducts;
    return allProducts.filter(
      (p) => p.subCategoryId === selectedSubcategoryId || p.subcategory === selectedSubcategoryId
    );
  }, [allProducts, selectedSubcategoryId]);

  const selectedSubName = useMemo(
    () => subcategories.find((s) => s._id === selectedSubcategoryId)?.name ?? null,
    [selectedSubcategoryId, subcategories]
  );

  // Filter discovery parents by search
  const filteredParents = useMemo(() => {
    if (!searchQuery.trim()) return allCats;
    const q = searchQuery.toLowerCase();
    return allCats.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.children || []).some((s) => s.name.toLowerCase().includes(q))
    );
  }, [allCats, searchQuery]);

  // Accent gradients
  const GRADIENTS = [
    "linear-gradient(135deg,#1e3c72,#2a5298)",
    "linear-gradient(135deg,#0ea5e9,#06b6d4)",
    "linear-gradient(135deg,#f59e0b,#f97316)",
    "linear-gradient(135deg,#10b981,#059669)",
    "linear-gradient(135deg,#ec4899,#f43f5e)",
    "linear-gradient(135deg,#8b5cf6,#6d28d9)",
    "linear-gradient(135deg,#14b8a6,#0d9488)",
  ];

  // ═══════════════════════════════════════════════════════
  // VIRTUAL SERVICE PAGE (Plumbing, Salon, Courses, etc.)
  // ═══════════════════════════════════════════════════════
  if (categoryName && virtualType) {
    return <VirtualCategoryPage name={categoryName} />;
  }

  // ═══════════════════════════════════════════════════════
  // LOADING
  // ═══════════════════════════════════════════════════════
  if (categoryName && loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-32 text-center font-sans">
          <div className="inline-flex flex-col items-center gap-4">
            <div className="w-14 h-14 rounded-full border-4 border-navy border-t-transparent animate-spin" />
            <p className="text-muted-foreground font-medium">Loading category…</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════
  // CATEGORY DETAIL VIEW (Shopping categories with products)
  // ═══════════════════════════════════════════════════════
  if (categoryName && category) {
    const discountPct = (p: Product) => {
      const up = p.baseMrp ?? p.userPrice;
      const ad = p.baseSellingPrice ?? p.afterDiscount;
      return up && ad ? Math.round(((up - ad) / up) * 100) : 0;
    };

    return (
      <div className="min-h-screen bg-background font-sans">
        <Navbar />

        {/* ── Banner ── */}
        <section className="container mx-auto px-4 pt-6 text-left">
          <div className="overflow-hidden rounded-3xl border shadow-md bg-muted/20 relative">
            <div className="relative h-48 md:h-72">
              <img
                src={category.image || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=800"}
                alt={category.name}
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-5 left-5 md:bottom-7 md:left-7">
                <div className="inline-flex items-center gap-3 rounded-2xl bg-white/95 px-4 py-2 shadow-lg">
                  <span className="text-2xl">{getSubIcon(category.name)}</span>
                  <span className="text-navy font-black text-lg capitalize">{category.name}</span>
                </div>
              </div>
            </div>
            {/* Breadcrumb */}
            <div className="px-5 py-3 bg-white/80 backdrop-blur flex items-center gap-2 text-sm text-muted-foreground">
              <Link to="/" className="hover:text-primary transition font-bold">Home</Link>
              <span className="font-bold">/</span>
              <Link to="/category" className="hover:text-primary transition font-bold">Categories</Link>
              <span className="font-bold">/</span>
              <span className="text-navy font-black">{category.name}</span>
            </div>
          </div>
        </section>

        {/* ── Subcategory circular tiles ── */}
        <section className="container mx-auto px-4 py-6 text-left">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-black text-navy">Shop by Subcategory</h2>
            <Link to="/category" className="text-xs text-primary font-black hover:underline">All Categories →</Link>
          </div>
          <div className="flex gap-6 overflow-x-auto pb-4 pt-1 scrollbar-none">
            {[{ _id: "__all__", name: "All Products" }, ...subcategories].map((s) => {
              const isAll = s._id === "__all__";
              const active = isAll ? !selectedSubcategoryId : selectedSubcategoryId === s._id;
              const imageUrl = isAll
                ? "https://images.unsplash.com/photo-1533900298318-6b8da08a523e?w=150&auto=format&fit=crop&q=60"
                : (s.image || getSubcategoryImage(s.name, s.slug));

              return (
                <button
                  key={s._id}
                  type="button"
                  onClick={() => setSelectedSubcategoryId(isAll ? null : s._id)}
                  className="flex-shrink-0 flex flex-col items-center gap-2 group cursor-pointer focus:outline-none bg-transparent border-none p-0"
                >
                  <div
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border-2 transition-all duration-300 relative shadow-sm"
                    style={{
                      borderColor: active ? "#0ea5e9" : "#e2e8f0",
                      transform: active ? "scale(1.05)" : "scale(1)",
                      boxShadow: active ? "0 4px 12px rgba(14,165,233,0.25)" : "none"
                    }}
                  >
                    <img
                      src={imageUrl}
                      alt={s.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    {active && (
                      <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                        <div className="bg-[#0ea5e9] text-white rounded-full p-1 shadow-md">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                    )}
                  </div>
                  <span
                    className="text-xs font-black tracking-tight transition-colors group-hover:text-[#0ea5e9] max-w-[84px] text-center line-clamp-2"
                    style={{
                      color: active ? "#0ea5e9" : "#334155"
                    }}
                  >
                    {s.name}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* ── Cashback strip ── */}
        <section className="container mx-auto px-4 mb-2">
          <div
            className="rounded-2xl py-3 px-6 text-center font-bold text-sm shadow-sm flex items-center justify-center gap-2"
            style={{ background: "linear-gradient(90deg,#fef9c3,#fde68a)", color: "#92400e" }}
          >
            🎉 Earn <strong className="font-extrabold">10% Cashback</strong> on every order placed through the app
          </div>
        </section>

        {/* ── Products grid ── */}
        <section className="container mx-auto px-4 py-8 text-left">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-black text-navy">
                {selectedSubName ? `${selectedSubName} Products` : "Featured Products"}
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5 font-bold">{filteredProducts.length} item(s) found</p>
            </div>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 rounded-3xl border-2 border-dashed border-muted-foreground/30 bg-muted/20">
              <div className="text-6xl mb-4 animate-bounce">⏳</div>
              <h3 className="text-2xl font-black text-navy mb-2">Products Coming Soon!</h3>
              <p className="text-muted-foreground text-center max-w-md px-4 mb-6 font-medium">
                We're busy stocking the best items. Check back shortly for amazing deals!
              </p>
              <Link to="/category" className="px-6 py-3 rounded-2xl bg-navy text-white font-bold hover:bg-navy/90 transition">
                Explore Other Categories
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {filteredProducts.map((product) => {
                const title = product.name || product.itemName || "Product";
                const img = product.images?.[0] || product.thumbnail || "/placeholder-product.png";
                const afterDiscount = product.baseSellingPrice ?? product.afterDiscount;
                const userPrice = product.baseMrp ?? product.userPrice;
                const price = typeof afterDiscount === "number"
                  ? `₹${afterDiscount.toLocaleString("en-IN")}`
                  : "Price N/A";
                const dp = discountPct(product);

                return (
                  <div
                    key={product._id}
                    onClick={() => navigate(`/product/${product._id}`)}
                    className="bg-white border border-gray-150 rounded-2xl p-3 relative flex flex-col justify-between hover:shadow-md cursor-pointer transition text-left group"
                  >
                    <div className="relative h-32 bg-white overflow-hidden flex items-center justify-center mb-2">
                      <img
                        src={img} alt={title}
                        className="max-h-full max-w-full object-contain"
                        loading="lazy"
                      />
                      {dp > 0 && (
                        <span className="absolute left-2.5 top-2.5 text-[9px] font-black px-1.5 py-0.5 rounded bg-red-100 text-red-600 z-10">
                          {dp}% OFF
                        </span>
                      )}
                      {product.tag && (
                        <div className="absolute top-2 right-2 text-navy text-xs font-bold px-2 py-0.5 rounded-lg"
                          style={{ background: "#fde68a" }}>
                          {product.tag}
                        </div>
                      )}
                    </div>
                    <div className="p-2.5">
                      <h4 className="font-extrabold text-gray-700 text-xs sm:text-sm leading-tight line-clamp-2 min-h-[36px]">{title}</h4>
                      <div className="mt-2.5 flex items-baseline gap-1">
                        <span className="font-black text-[#0A1128] text-sm sm:text-base">{price}</span>
                        {typeof userPrice === "number" && (
                          <span className="text-xs text-muted-foreground line-through">
                            ₹{userPrice.toLocaleString("en-IN")}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1.5 font-bold">
                        <StarRating rating={product.rating ?? 4} />
                        <span className="text-xs text-muted-foreground">({product.reviews ?? 0})</span>
                      </div>
                      {/* Add button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/product/${product._id}`);
                        }}
                        className="w-full bg-[#F3BA12] hover:bg-[#e0ab10] text-[#0A1128] font-black text-xs py-1.5 px-3 rounded-xl flex items-center justify-center gap-1.5 mt-2 transition active:scale-95 shadow-sm border-none cursor-pointer"
                      >
                        <ShoppingCart className="h-3.5 w-3.5" />
                        <span>Add to Cart</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <Footer />
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════
  // DISCOVERY LANDING PAGE (Enhanced Dashboard)
  // ═══════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-background font-sans">
      <Navbar />

      {/* ── Rich Hero Banner ── */}
      <section className="relative py-12 overflow-hidden bg-navy text-white text-left">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
        <div className="absolute -right-32 -top-32 w-96 h-96 bg-primary/20 rounded-full blur-3xl pointer-events-none" />

        <div className="container mx-auto px-4 grid md:grid-cols-12 gap-8 items-center relative z-10">

          {/* Left panel showing stats summary */}
          <div className="md:col-span-7 space-y-4">
            <span className="inline-flex items-center gap-1.5 text-[9px] font-black tracking-wider uppercase text-yellow-300 bg-white/10 border border-white/15 px-3 py-1 rounded-full">
              <Sparkles className="w-3 h-3 text-yellow-300" /> Browse All Categories
            </span>
            <h1 className="text-3xl md:text-5xl font-black leading-tight">
              Hyperlocal Categories Hub
            </h1>
            <p className="text-white/70 text-xs sm:text-sm max-w-xl font-medium leading-relaxed">
              Discover verified stores, instant doorstep services, dynamic academy certifications, and wholesale deals near you.
            </p>

            {/* Live catalog counters */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-center">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
                <p className="text-lg font-black text-yellow-300">16</p>
                <p className="text-[9px] font-bold text-white/60 uppercase tracking-wider">Main Categories</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
                <p className="text-lg font-black text-yellow-300">500+</p>
                <p className="text-[9px] font-bold text-white/60 uppercase tracking-wider">Sub Categories</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
                <p className="text-lg font-black text-yellow-300">50,000+</p>
                <p className="text-[9px] font-bold text-white/60 uppercase tracking-wider">Products Live</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
                <p className="text-lg font-black text-yellow-300">300+</p>
                <p className="text-[9px] font-bold text-white/60 uppercase tracking-wider">Services Listed</p>
              </div>
            </div>
          </div>

          {/* Right panel showing trust stats */}
          <div className="md:col-span-5 bg-gradient-to-br from-white/10 to-white/5 border border-white/15 backdrop-blur p-6 rounded-3xl space-y-4">
            <h3 className="font-extrabold text-sm flex items-center gap-2">
              <MapPin className="w-4 h-4 text-yellow-300" /> DELIVERING IN BUCHIREDDYPALEM
            </h3>
            <p className="text-xs text-white/80 font-medium">Our ecosystem partners are verified for fast delivery and direct-to-door customer satisfaction.</p>
            <div className="space-y-2.5">
              <div className="flex justify-between text-xs font-bold border-b border-white/10 pb-2">
                <span>Verified Local Vendors</span>
                <span className="text-yellow-300">500 Vendors</span>
              </div>
              <div className="flex justify-between text-xs font-bold border-b border-white/10 pb-2">
                <span>Available Local Products</span>
                <span className="text-yellow-300">10,000 Products</span>
              </div>
              <div className="flex justify-between text-xs font-bold">
                <span>Home & Salon Services</span>
                <span className="text-yellow-300">1,000 Services</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── Search & Trending Section ── */}
      <section className="bg-white border-b border-slate-100 py-6 text-left">
        <div className="container mx-auto px-4 max-w-4xl space-y-4 relative">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
            <input
              id="cat-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search groceries, services, courses..."
              className="w-full rounded-full border border-gray-200 pl-11 pr-5 py-3.5 text-sm text-navy placeholder:text-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-accent bg-slate-50 focus:bg-white transition-all font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xl font-bold bg-transparent border-none cursor-pointer"
              >
                ×
              </button>
            )}
          </div>

          {/* Autocomplete dropdown suggestions popup */}
          {suggestions.length > 0 && (
            <div className="absolute left-4 right-4 bg-white rounded-2xl shadow-xl border border-slate-150 z-40 max-h-60 overflow-y-auto p-2">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider px-3.5 py-1 text-left">Autocomplete Suggestions</p>
              {suggestions.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setSearchQuery(item.substring(2));
                  }}
                  className="w-full px-3.5 py-2.5 text-xs text-navy font-bold text-left hover:bg-slate-50 rounded-xl transition flex items-center justify-between border-none bg-transparent cursor-pointer"
                >
                  <span>{item}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
              ))}
            </div>
          )}

          {/* Trending Searches chips */}
          <div className="flex items-center gap-2 flex-wrap pt-1 font-sans">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Trending:</span>
            {[
              { label: "Water Can", icon: "💧" },
              { label: "Flowers", icon: "🌼" },
              { label: "AC Repair", icon: "🔧" },
              { label: "Grocery", icon: "🛒" },
              { label: "Milk", icon: "🥛" },
              { label: "Restaurant", icon: "🍔" }
            ].map((chip) => (
              <button
                key={chip.label}
                onClick={() => setSearchQuery(chip.label)}
                className="px-3.5 py-1.5 rounded-full border border-slate-200 bg-white hover:border-accent hover:text-accent text-navy text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <span>{chip.icon}</span>
                <span>{chip.label}</span>
              </button>
            ))}
          </div>

        </div>
      </section>

      {/* ── Main Layout: Sidebar + Grid ── */}
      <section className="container mx-auto px-4 py-8 text-left">
        <div className="grid md:grid-cols-12 gap-8">

          {/* Left Side Filter Panel (Desktop only) */}
          <div className="md:col-span-3 space-y-6 hidden md:block">
            <div className="bg-white border rounded-3xl p-5 shadow-sm space-y-5">
              <div className="flex items-center gap-2 border-b pb-3">
                <Filter className="w-4 h-4 text-navy" />
                <h3 className="font-extrabold text-navy text-sm">Directory Filters</h3>
              </div>

              {/* Checkbox filters */}
              <div className="space-y-3.5">
                {[
                  { key: "products", label: "Products Catalog" },
                  { key: "services", label: "Instant Services" },
                  { key: "nearby", label: "Nearby Shops" },
                  { key: "offers", label: "Active Offers" },
                  { key: "scheduled", label: "Scheduled Deliveries" },
                  { key: "subscription", label: "Subscribed Items" },
                ].map((item) => (
                  <label key={item.key} className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-navy select-none">
                    <input
                      type="checkbox"
                      checked={filters[item.key as keyof typeof filters]}
                      onChange={() => handleFilterToggle(item.key as keyof typeof filters)}
                      className="rounded border-slate-300 text-accent focus:ring-accent w-4 h-4"
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>

              <div className="pt-3 border-t border-slate-100">
                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-3 flex items-start gap-2">
                  <Award className="w-4 h-4 text-indigo-600 shrink-0" />
                  <div className="text-[10px] text-slate-600 leading-tight">
                    <strong>ApexBee Guarantee:</strong> Same day delivery or service cashback credits on all verified listings.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side Categories Grid */}
          <div className="md:col-span-9">

            {/* Recently Viewed (if any) */}
            {recentlyViewed.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-3">🕐 Recently Visited Categories</h2>
                <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none">
                  {recentlyViewed.map((item) => (
                    <Link
                      key={item.id}
                      to={`/category/${encodeURIComponent(item.name)}`}
                      className="flex-shrink-0 flex items-center gap-2 rounded-2xl border bg-white px-4 py-2.5 shadow-sm hover:shadow hover:border-accent transition-all text-xs font-black text-navy"
                    >
                      <span className="text-lg">{item.icon}</span>
                      <span>{item.name}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {discoveryLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : filteredParents.length === 0 ? (
              <div className="py-24 text-center border-2 border-dashed rounded-3xl bg-slate-50/50">
                <div className="text-5xl mb-4">🔍</div>
                <h3 className="text-lg font-black text-navy mb-1">No categories matched</h3>
                <p className="text-xs text-muted-foreground mb-4">We couldn't find matches. Try adjusting your search query.</p>
                <Button
                  onClick={() => setSearchQuery("")}
                  className="bg-navy hover:bg-navy/90 text-white text-xs font-bold"
                >
                  Clear Filter
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredParents.map((cat, idx) => {
                  const gradient = GRADIENTS[idx % GRADIENTS.length];
                  const isExpanded = expandedId === cat._id;
                  const subs = cat.children || [];
                  const details = getCategoryDetails(cat.name);

                  return (
                    <div
                      key={cat._id}
                      id={`cat-card-${cat._id}`}
                      className="group rounded-3xl overflow-hidden border border-slate-150 bg-white shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 relative flex flex-col justify-between"
                    >

                      {/* Image section with hover Explore Overlay */}
                      <div className="relative h-44 overflow-hidden cursor-pointer" onClick={() => navigate(`/category/${encodeURIComponent(cat.name)}`)}>
                        <img
                          src={cat.image || "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=400&h=300&q=80"}
                          alt={cat.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                        <div
                          className="absolute inset-0 bg-gradient-to-t from-navy/90 via-navy/30 to-transparent transition-opacity duration-300"
                        />

                        {/* DESKTOP HOVER EXPLORE OVERLAY PANEL */}
                        <div className="absolute inset-0 bg-navy/90 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-center items-center p-4 text-center space-y-2">
                          <p className="text-yellow-300 text-xs font-black tracking-wider uppercase">Explore {cat.name}</p>
                          <div className="flex flex-col gap-1.5 w-full max-w-[160px]">
                            <span className="text-[10px] text-white/90 bg-white/10 rounded-lg py-1 font-bold">🛒 Explore Products</span>
                            <span className="text-[10px] text-white/90 bg-white/10 rounded-lg py-1 font-bold">🔧 Popular Services</span>
                            <span className="text-[10px] text-white/90 bg-white/10 rounded-lg py-1 font-bold">🔥 Direct Offers</span>
                            <span className="text-[10px] text-white/90 bg-white/10 rounded-lg py-1 font-bold">🏪 View Local Stores</span>
                          </div>
                        </div>

                        {/* Top banner tag */}
                        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur text-navy font-bold text-[9px] px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                          <span>{details.subs}</span>
                          <span>•</span>
                          <span>{details.prods}</span>
                        </div>

                        {/* Category Title bottom label */}
                        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                          <div className="flex items-center gap-2 bg-white/95 backdrop-blur rounded-xl px-3 py-1.5 shadow">
                            <span className="text-lg shrink-0">{getSubIcon(cat.name)}</span>
                            <span className="font-extrabold text-navy text-xs leading-none capitalize truncate max-w-[120px]">{cat.name}</span>
                          </div>
                        </div>
                      </div>

                      {/* Card Body */}
                      <div className="p-4 flex flex-col flex-1 justify-between bg-white">

                        {/* Popular subcategory tags list */}
                        <div className="mb-4">
                          <div className="flex flex-wrap gap-1">
                            {details.tags.map((tag, tIdx) => (
                              <span
                                key={tIdx}
                                className="text-[8px] font-black px-1.5 py-0.5 bg-slate-50 border border-slate-100 rounded text-slate-500 uppercase tracking-wider"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center justify-between border-t border-dashed pt-3 mt-auto">
                          <Link
                            to={`/category/${encodeURIComponent(cat.name)}`}
                            onClick={() => addRecentlyViewed({ id: cat._id, name: cat.name, icon: getSubIcon(cat.name) })}
                            className="text-xs font-black text-navy hover:text-accent transition flex items-center gap-1"
                          >
                            Explore Directory <ChevronRight className="w-3.5 h-3.5" />
                          </Link>

                          {subs.length > 0 && (
                            <button
                              type="button"
                              onClick={() => setExpandedId(isExpanded ? null : cat._id)}
                              className="text-[9px] font-black px-2.5 py-1 rounded-lg border transition-all cursor-pointer"
                              style={isExpanded
                                ? { background: "#0A1128", color: "#fff", borderColor: "#0A1128" }
                                : { background: "#f8fafc", color: "#475569", borderColor: "#e2e8f0" }
                              }
                            >
                              {isExpanded ? "Hide ▲" : "Subcategories ▼"}
                            </button>
                          )}
                        </div>

                        {/* Collapsible Subcategory Row */}
                        {isExpanded && <SubRow subs={subs} parentName={cat.name} />}
                      </div>

                    </div>
                  );
                })}
              </div>
            )}

          </div>
        </div>
      </section>

      {/* ── Flat subcategories panel for quick access ── */}
      {!discoveryLoading && allCats.length > 0 && !searchQuery && (
        <section className="container mx-auto px-4 pb-12 text-left">
          <div
            className="rounded-[32px] overflow-hidden shadow-xl"
            style={{ background: "linear-gradient(135deg,#0A1128 0%,#152042 100%)" }}
          >
            <div className="p-6 md:p-8">
              <h2 className="text-lg md:text-xl font-black text-white flex items-center gap-2">
                📂 All Subcategories flat directory
              </h2>
              <p className="text-white/60 text-xs mt-1">Directly jump to subcategory product listings</p>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 mt-6">
                {allCats.flatMap((p) =>
                  (p.children || []).map((s) => (
                    <Link
                      key={s._id}
                      to={`/category/${encodeURIComponent(s.name)}`}
                      onClick={() => addRecentlyViewed({ id: s._id, name: s.name, icon: getSubIcon(s.name) })}
                      className="group relative rounded-2xl overflow-hidden bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-200 flex flex-col p-3 text-left justify-between h-20"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg shrink-0">{getSubIcon(s.name)}</span>
                        <span className="text-[10px] font-bold text-white line-clamp-2 leading-tight">{s.name}</span>
                      </div>
                      <span className="text-[8px] text-white/40 block mt-1 uppercase tracking-wider">{p.name}</span>
                    </Link>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Partnership Earn CTA ── */}
      <section className="container mx-auto px-4 pb-16 text-left">
        <div
          className="rounded-[32px] p-8 md:p-10 flex flex-col md:flex-row items-center gap-8 shadow-xl overflow-hidden relative"
          style={{ background: "linear-gradient(135deg,#78350f 0%,#b45309 60%,#d97706 100%)" }}
        >
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />

          <div className="flex-1 relative">
            <p className="text-yellow-300 text-xs font-black tracking-widest uppercase mb-2">Unlimited Earning Potential</p>
            <h2 className="text-2xl md:text-3.5xl font-black text-white leading-tight">🐝 Earn With ApexBee</h2>
            <p className="text-white/80 mt-3 text-xs md:text-sm max-w-md leading-relaxed font-medium">
              Refer friends, build a 3-level team network, list your products or services, and earn unlimited passive income.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 shrink-0 relative">
            <Link
              to="/earn-with-apexbee"
              className="bg-white hover:bg-slate-50 text-amber-900 font-black px-6 py-3.5 rounded-2xl transition text-center shadow text-xs uppercase tracking-wider shrink-0"
            >
              Start Earning 🚀
            </Link>
            <Link
              to="/referrals"
              className="border-2 border-white/30 text-white hover:bg-white/10 font-bold px-6 py-3 rounded-2xl transition text-center text-xs uppercase tracking-wider shrink-0"
            >
              Refer &amp; Get ₹50 🎁
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Category;
