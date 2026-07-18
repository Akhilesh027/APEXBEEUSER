import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { ShoppingCart } from "lucide-react";

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

interface CategoryGroupItem {
  id: string;
  name: string;
  icon: string;
  color: string;
  image: string;
  tag: string;
}

interface CategoryGroup {
  id: string;
  title: string;
  icon: string;
  color: string;
  gradient: string;
  description: string;
  items: CategoryGroupItem[];
}

interface TrendingCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  growth: string;
}

interface FeaturedVendor {
  id: string;
  name: string;
  category: string;
  rating: number;
  reviews: number;
  image: string;
  location: string;
  badge: string;
}

interface ServiceProvider {
  id: string;
  name: string;
  category: string;
  rating: number;
  jobs: number;
  image: string;
  badge: string;
}

interface Course {
  id: string;
  title: string;
  category: string;
  instructor: string;
  rating: number;
  students: number;
  price: number;
  originalPrice: number;
  image: string;
  badge: string;
}

// ═══════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════

// Mapping to detect "virtual" service/non-product categories
const SERVICE_CATEGORIES = new Set([
  "plumbing","electrician","home cleaning","salon & spa","ac repair","pest control",
  "painting","interiors","cleaning","beauty","salon","spa","repair","mechanic",
  "carpenter","interior","designer",
]);
const LEARNING_CATEGORIES = new Set([
  "business","technology","digital marketing","finance","design","languages",
  "marketing","coding","course","learn","education",
]);
const TRAVEL_CATEGORIES = new Set([
  "flights","hotels","bus tickets","train","cab booking","tour packages",
  "flight","hotel","bus","cab","tour","travel",
]);
const FINANCE_CATEGORIES = new Set([
  "insurance","loans","investments","apexbee wallet","bill payments","recharge",
  "wallet","loan","invest","bill","payment",
]);
const EARN_CATEGORIES = new Set([
  "refer & earn","become a partner","sell on apexbee","build your team","franchise",
  "delivery partner","refer","partner","franchise","sell","earn","team",
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
  if (SERVICE_CATEGORIES.has(n)) return "service";
  if (LEARNING_CATEGORIES.has(n)) return "learning";
  if (TRAVEL_CATEGORIES.has(n)) return "travel";
  if (FINANCE_CATEGORIES.has(n)) return "finance";
  if (EARN_CATEGORIES.has(n)) return "earn";
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
  };
  return iconMap[(name || "").trim().toLowerCase()] || "📦";
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
  } catch {}
}

function getRecentlyViewed(): { id: string; name: string; icon: string }[] {
  try { return JSON.parse(localStorage.getItem(RECENTLY_VIEWED_KEY) || "[]"); }
  catch { return []; }
}

// ═══════════════════════════════════════════════════════
// Sub-components
// ═══════════════════════════════════════════════════════

const StarRating = ({ rating, size = 12 }: { rating: number; size?: number }) => (
  <span className="inline-flex gap-px">
    {[1,2,3,4,5].map((s) => (
      <span key={s} style={{ color: s <= Math.round(rating) ? "#f59e0b" : "#d1d5db", fontSize: size }}>★</span>
    ))}
  </span>
);

const Badge = ({ label, color }: { label: string; color?: string }) => (
  <span
    className="inline-block text-xs font-bold px-2 py-0.5 rounded-full"
    style={{ background: color ? `${color}20` : "#f59e0b22", color: color || "#b45309" }}
  >
    {label}
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

// ═══════════════════════════════════════════════════════
// Main Category Component
// ═══════════════════════════════════════════════════════
// ─────────────────────────────────────────────────────────────
// Skeleton card
// ─────────────────────────────────────────────────────────────
const SkeletonCard = () => (
  <div className="rounded-2xl overflow-hidden border bg-white animate-pulse">
    <div className="h-44 bg-gray-200" />
    <div className="p-4 space-y-2">
      <div className="h-4 bg-gray-200 rounded w-3/4" />
      <div className="h-3 bg-gray-100 rounded w-1/2" />
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────
// Inline subcategory row
// ─────────────────────────────────────────────────────────────
const SubRow = ({ subs, parentName }: { subs: CategoryType[]; parentName: string }) => {
  if (!subs.length) return null;
  return (
    <div className="mt-3 pt-3 border-t border-gray-100">
      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Subcategories</p>
      <div className="flex flex-wrap gap-2">
        {subs.map((s) => (
          <Link
            key={s._id}
            to={`/category/${encodeURIComponent(s.name)}`}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1.5 text-xs font-semibold rounded-full border px-3 py-1 bg-gray-50 text-slate-700 hover:bg-primary hover:text-white hover:border-primary transition-all duration-200"
          >
            <span>{getSubIcon(s.name)}</span>
            <span>{s.name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Main Category Component
// ─────────────────────────────────────────────────────────────
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

  // ── If this is a virtual/service category → show service page ──
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
        const found = flat.find(
          (c) => c.name.trim().toLowerCase() === categoryName.trim().toLowerCase()
        );
        if (!found) {
          setCategory(null);
          setLoading(false);
          return;
        }
        addRecentlyViewed({ id: found._id, name: found.name, icon: getSubIcon(found.name) });
        setCategory(found);
        // get children as subcategories
        const subs = flat.filter((c) => c.parentId && String(c.parentId) === found._id);
        setSubcategories(subs.map((s) => ({ _id: s._id, name: s.name, image: s.image })));
        setSelectedSubcategoryId(null);
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

  // Accent colours cycling
  const GRADIENTS = [
    "linear-gradient(135deg,#4f46e5,#7c3aed)",
    "linear-gradient(135deg,#0ea5e9,#06b6d4)",
    "linear-gradient(135deg,#f59e0b,#f97316)",
    "linear-gradient(135deg,#10b981,#059669)",
    "linear-gradient(135deg,#ec4899,#f43f5e)",
    "linear-gradient(135deg,#8b5cf6,#6d28d9)",
    "linear-gradient(135deg,#14b8a6,#0d9488)",
    "linear-gradient(135deg,#f97316,#b45309)",
    "linear-gradient(135deg,#64748b,#475569)",
    "linear-gradient(135deg,#22c55e,#16a34a)",
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
        <div className="container mx-auto px-4 py-32 text-center">
          <div className="inline-flex flex-col items-center gap-4">
            <div className="w-14 h-14 rounded-full border-4 border-primary border-t-transparent animate-spin" />
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
      <div className="min-h-screen bg-background">
        <Navbar />

        {/* ── Banner ── */}
        <section className="container mx-auto px-4 pt-6">
          <div className="overflow-hidden rounded-3xl border shadow-md bg-muted/20 relative">
            <div className="relative h-48 md:h-72">
              <img
                src={category.image || "/placeholder.svg"}
                alt={category.name}
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-5 left-5 md:bottom-7 md:left-7">
                <div className="inline-flex items-center gap-3 rounded-2xl bg-white/95 px-4 py-2 shadow-lg">
                  <span className="text-2xl">{getSubIcon(category.name)}</span>
                  <span className="text-navy font-bold text-lg capitalize">{category.name}</span>
                </div>
              </div>
            </div>
            {/* Breadcrumb */}
            <div className="px-5 py-3 bg-white/80 backdrop-blur flex items-center gap-2 text-sm text-muted-foreground">
              <Link to="/" className="hover:text-primary transition">Home</Link>
              <span>/</span>
              <Link to="/category" className="hover:text-primary transition">Categories</Link>
              <span>/</span>
              <span className="text-navy font-semibold">{category.name}</span>
            </div>
          </div>
        </section>

        {/* ── Subcategory tabs ── */}
        <section className="container mx-auto px-4 py-7">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-navy">{category.name}</h2>
            <Link to="/category" className="text-sm text-primary font-medium hover:underline">← All Categories</Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
            {[{ _id: "__all__", name: "All" }, ...subcategories].map((s) => {
              const isAll = s._id === "__all__";
              const active = isAll ? !selectedSubcategoryId : selectedSubcategoryId === s._id;
              return (
                <button
                  key={s._id}
                  type="button"
                  onClick={() => setSelectedSubcategoryId(isAll ? null : s._id)}
                  className="flex-shrink-0 flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-semibold transition-all"
                  style={active
                    ? { background: "var(--color-primary, #6C63FF)", color: "#fff", borderColor: "transparent", boxShadow: "0 2px 12px 0 #6c63ff55" }
                    : { background: "#fff", color: "#1e293b", borderColor: "#e2e8f0" }
                  }
                >
                  <span>{isAll ? "📦" : getSubIcon(s.name)}</span>
                  <span className="whitespace-nowrap">{s.name}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* ── Cashback strip ── */}
        <section className="container mx-auto px-4 mb-2">
          <div
            className="rounded-2xl py-3 px-6 text-center font-semibold text-sm shadow-sm flex items-center justify-center gap-2"
            style={{ background: "linear-gradient(90deg,#fef9c3,#fde68a)", color: "#92400e" }}
          >
            🎉 Earn <strong>10% Cashback</strong> on every order placed through the app
          </div>
        </section>

        {/* ── Products grid ── */}
        <section className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-navy">
                {selectedSubName ? `${selectedSubName} Products` : "Featured Products"}
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">{filteredProducts.length} item(s) found</p>
            </div>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 rounded-3xl border-2 border-dashed border-muted-foreground/30 bg-muted/20">
              <div className="text-6xl mb-4 animate-bounce">⏳</div>
              <h3 className="text-2xl font-extrabold text-navy mb-2">Products Coming Soon!</h3>
              <p className="text-muted-foreground text-center max-w-md px-4 mb-6">
                We're busy stocking the best items. Check back shortly for amazing deals!
              </p>
              <Link to="/category" className="px-6 py-3 rounded-2xl bg-primary text-white font-semibold hover:bg-primary/90 transition">
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
                      <h4 className="font-semibold text-gray-700 text-xs sm:text-sm leading-tight line-clamp-2 min-h-[36px]">{title}</h4>
                      <div className="mt-2.5 flex items-baseline gap-1">
                        <span className="font-bold text-[#0A1128] text-sm sm:text-base">{price}</span>
                        {typeof userPrice === "number" && (
                          <span className="text-xs text-muted-foreground line-through">
                            ₹{userPrice.toLocaleString("en-IN")}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1.5">
                        <StarRating rating={product.rating ?? 4} />
                        <span className="text-xs text-muted-foreground">({product.reviews ?? 0})</span>
                      </div>
                      {/* Add button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/product/${product._id}`);
                        }}
                        className="w-full bg-[#F3BA12] hover:bg-[#e0ab10] text-[#0A1128] font-bold text-xs py-1.5 px-3 rounded-xl flex items-center justify-center gap-1.5 mt-2 transition active:scale-95 shadow-sm"
                      >
                        <ShoppingCart className="h-3.5 w-3.5" />
                        <span>Add</span>
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

  // If a categoryName was given but no category was found and it's not virtual — still show virtual page
  if (categoryName && !category && !loading) {
    return <VirtualCategoryPage name={categoryName} />;
  }

  // ═══════════════════════════════════════════════════════
  // DISCOVERY LANDING PAGE
  // ═══════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* ── Hero ── */}
      <section
        className="relative py-10 overflow-hidden bg-white border-b border-gray-150"
      >
        {/* subtle hex pattern */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(circle at 25% 35%, #7c3aed 0%, transparent 50%), radial-gradient(circle at 75% 65%, #0ea5e9 0%, transparent 50%)",
          }}
        />
        <div className="container mx-auto px-4 text-center relative">
          <span className="inline-block text-xs font-black tracking-wider uppercase text-blue-800 mb-3 px-3 py-1 bg-blue-50 border border-blue-100 rounded-full">
            Shop by Category
          </span>
          <h1 className="text-3xl md:text-5xl font-black text-[#0A1128] mb-3 leading-tight">
            Browse All Categories
          </h1>
          <p className="text-gray-500 text-xs sm:text-sm max-w-xl mx-auto mb-6">
            Find products across Electronics, Fashion, Groceries, Beauty & more - all in one place.
          </p>
          {/* Search */}
          <div className="max-w-2xl mx-auto relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold pointer-events-none select-none text-gray-400">Search</span>
            <input
              id="cat-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search categories or subcategories..."
              className="w-full rounded-full border border-gray-200 pl-12 pr-5 py-3 text-sm text-navy placeholder:text-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#F3BA12]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xl leading-none"
              >
                ×
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ── Stats strip ── */}
      <div
        className="border-b bg-[#0A1128] text-white"
      >
        <div className="container mx-auto px-4 py-2 flex items-center justify-center gap-6 md:gap-12 flex-wrap text-white/90 text-xs font-bold">
          <span>📦 {allCats.length} Categories</span>
          <span>📂 {allCats.reduce((a, c) => a + (c.children?.length || 0), 0)} Subcategories</span>
          <span>⚡ Real-time data</span>
          <span>🎉 10% Cashback on every order</span>
        </div>
      </div>

      {/* ── Recently Viewed ── */}
      {recentlyViewed.length > 0 && (
        <section className="container mx-auto px-4 pt-8">
          <h2 className="text-base font-bold text-navy mb-3 flex items-center gap-2">
            <span>🕐</span> Recently Viewed
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
            {recentlyViewed.map((item) => (
              <Link
                key={item.id}
                to={`/category/${encodeURIComponent(item.name)}`}
                className="flex-shrink-0 flex items-center gap-2 rounded-2xl border bg-white px-4 py-2.5 shadow-sm hover:shadow-md hover:border-primary transition-all text-sm font-semibold text-navy"
              >
                <span className="text-xl">{item.icon}</span>
                <span className="whitespace-nowrap">{item.name}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Category Grid ── */}
      <section className="container mx-auto px-4 py-10">
        {discoveryLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filteredParents.length === 0 ? (
          <div className="py-28 text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-bold text-navy mb-2">No categories found</h3>
            <p className="text-muted-foreground mb-6">Try a different search term.</p>
            <button
              onClick={() => setSearchQuery("")}
              className="px-6 py-3 rounded-2xl bg-primary text-white font-semibold hover:bg-primary/90 transition"
            >
              Clear Search
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredParents.map((cat, idx) => {
              const gradient = GRADIENTS[idx % GRADIENTS.length];
              const isExpanded = expandedId === cat._id;
              const subs = cat.children || [];
              const fallbackImg = `https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=800&h=500&q=80`;

              return (
                <div
                  key={cat._id}
                  id={`cat-card-${cat._id}`}
                  className="group rounded-3xl overflow-hidden border border-gray-100 bg-white shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-1.5 flex flex-col"
                >
                  {/* Image with gradient overlay */}
                  <div className="relative h-48 overflow-hidden cursor-pointer" onClick={() => navigate(`/category/${encodeURIComponent(cat.name)}`)}>
                    <img
                      src={cat.image || fallbackImg}
                      alt={cat.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                      onError={(e) => { (e.target as HTMLImageElement).src = fallbackImg; }}
                    />
                    {/* Gradient overlay */}
                    <div
                      className="absolute inset-0"
                      style={{ background: `${gradient.replace("linear-gradient(135deg,", "linear-gradient(to top, ").replace(/,#[0-9a-f]+\)/i, ", transparent)")}` }}
                    />
                    {/* Category badge */}
                    <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                      <div className="flex items-center gap-2 bg-white/95 backdrop-blur rounded-xl px-3 py-1.5 shadow">
                        <span className="text-xl">{getSubIcon(cat.name)}</span>
                        <span className="font-bold text-navy text-sm leading-tight">{cat.name}</span>
                      </div>
                      {subs.length > 0 && (
                        <span
                          className="text-xs bg-white/90 text-slate-600 font-bold px-2 py-1 rounded-lg shadow"
                        >
                          {subs.length} sub
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-4 flex flex-col flex-1">
                    <div className="flex items-center justify-between">
                      <Link
                        to={`/category/${encodeURIComponent(cat.name)}`}
                        onClick={() => addRecentlyViewed({ id: cat._id, name: cat.name, icon: getSubIcon(cat.name) })}
                        className="flex-1 text-sm font-bold text-navy hover:text-primary transition"
                      >
                        Shop {cat.name} →
                      </Link>
                      {subs.length > 0 && (
                        <button
                          type="button"
                          id={`toggle-sub-${cat._id}`}
                          onClick={() => setExpandedId(isExpanded ? null : cat._id)}
                          className="ml-2 text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all"
                          style={isExpanded
                            ? { background: "#312e81", color: "#fff", borderColor: "#312e81" }
                            : { background: "#f8fafc", color: "#475569", borderColor: "#e2e8f0" }
                          }
                        >
                          {isExpanded ? "Hide ▲" : `Subs (${subs.length}) ▼`}
                        </button>
                      )}
                    </div>

                    {/* Subcategory row — collapsible */}
                    {isExpanded && <SubRow subs={subs} parentName={cat.name} />}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── All Subcategories flat grid ── */}
      {!discoveryLoading && allCats.length > 0 && !searchQuery && (
        <section className="container mx-auto px-4 pb-16">
          <div
            className="rounded-3xl overflow-hidden shadow-xl"
            style={{ background: "linear-gradient(135deg,#0f172a 0%,#1e293b 100%)" }}
          >
            <div className="p-6 md:p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl md:text-2xl font-extrabold text-white flex items-center gap-2">
                    📂 All Subcategories
                  </h2>
                  <p className="text-white/50 text-sm mt-1">Browse by specific subcategory</p>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {allCats.flatMap((p) =>
                  (p.children || []).map((s) => (
                    <Link
                      key={s._id}
                      to={`/category/${encodeURIComponent(s.name)}`}
                      onClick={() => addRecentlyViewed({ id: s._id, name: s.name, icon: getSubIcon(s.name) })}
                      className="group relative rounded-2xl overflow-hidden bg-white/8 border border-white/10 hover:bg-white/15 hover:border-white/30 transition-all duration-200 flex flex-col"
                    >
                      {s.image && (
                        <div className="h-24 overflow-hidden">
                          <img
                            src={s.image}
                            alt={s.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                        </div>
                      )}
                      <div className="p-3 flex items-center gap-2">
                        <span className="text-lg">{getSubIcon(s.name)}</span>
                        <span className="text-xs font-semibold text-white line-clamp-2 leading-snug">{s.name}</span>
                      </div>
                      {/* parent label */}
                      <div className="px-3 pb-2">
                        <span className="text-xs text-white/40">{p.name}</span>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Earn CTA ── */}
      <section className="container mx-auto px-4 pt-4 pb-14">
        <div
          className="rounded-3xl p-8 md:p-10 flex flex-col md:flex-row items-center gap-8 shadow-xl overflow-hidden relative"
          style={{ background: "linear-gradient(135deg,#78350f 0%,#b45309 60%,#d97706 100%)" }}
        >
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: "radial-gradient(circle at 20% 50%, #fff 1px, transparent 1px), radial-gradient(circle at 80% 20%, #fff 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }} />
          <div className="flex-1 relative">
            <p className="text-amber-300 text-xs font-bold tracking-widest uppercase mb-2">Unlimited Earning Potential</p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white leading-tight">🐝 Earn With ApexBee</h2>
            <p className="text-white/75 mt-3 text-sm md:text-base max-w-md">
              Refer friends, build a team, sell your products or services, and earn unlimited passive income.
            </p>
          </div>
          <div className="flex flex-col gap-3 relative">
            <Link
              to="/earn-with-apexbee"
              className="bg-white text-amber-900 font-extrabold px-7 py-3.5 rounded-2xl hover:bg-white/90 transition text-center shadow-lg whitespace-nowrap"
            >
              Start Earning 🚀
            </Link>
            <Link
              to="/referrals"
              className="border-2 border-white/40 text-white font-semibold px-7 py-3 rounded-2xl hover:bg-white/10 transition text-center text-sm whitespace-nowrap"
            >
              Refer &amp; Get ₹500 🎁
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Category;
