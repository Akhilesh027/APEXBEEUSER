import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import axios from "axios";

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

interface Subcategory { _id: string; name: string; }

interface CategoryType {
  _id: string;
  name: string;
  image?: string;
  subcategories?: Subcategory[];
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
const Category = () => {
  const { categoryName } = useParams();
  const navigate = useNavigate();

  // ── Discovery state ──
  const [groups, setGroups] = useState<CategoryGroup[]>([]);
  const [trending, setTrending] = useState<TrendingCategory[]>([]);
  const [featuredVendors, setFeaturedVendors] = useState<FeaturedVendor[]>([]);
  const [serviceProviders, setServiceProviders] = useState<ServiceProvider[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<{ id: string; name: string; icon: string }[]>([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [discoveryLoading, setDiscoveryLoading] = useState(true);

  // ── Detail state ──
  const [category, setCategory] = useState<CategoryType | null>(null);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // ── If this is a virtual/service category → show service page ──
  const virtualType = categoryName ? detectVirtualCategory(categoryName) : null;

  // ─────────────── Fetch discovery data ───────────────
  useEffect(() => {
    if (categoryName) return;
    setRecentlyViewed(getRecentlyViewed());
    const go = async () => {
      setDiscoveryLoading(true);
      try {
        const [gr, tr, vd, sp, cr] = await Promise.all([
          axios.get(`${API_BASE}/discovery/groups`),
          axios.get(`${API_BASE}/discovery/trending`),
          axios.get(`${API_BASE}/discovery/featured-vendors`),
          axios.get(`${API_BASE}/discovery/service-providers`),
          axios.get(`${API_BASE}/discovery/courses`),
        ]);
        setGroups(gr.data?.groups || []);
        setTrending(tr.data?.trending || []);
        setFeaturedVendors(vd.data?.vendors || []);
        setServiceProviders(sp.data?.providers || []);
        setCourses(cr.data?.courses || []);
      } catch (e) { console.error(e); }
      finally { setDiscoveryLoading(false); }
    };
    go();
  }, [categoryName]);

  // ─────────────── Fetch category detail ───────────────
  useEffect(() => {
    if (!categoryName) return;
    // Virtual categories don't need API fetch
    if (detectVirtualCategory(categoryName)) {
      setLoading(false);
      return;
    }
    const go = async () => {
      setLoading(true);
      try {
        const catRes = await axios.get(`${API_BASE}/categories`);
        const cats: CategoryType[] = catRes?.data?.categories || [];
        const found = cats.find((c) => c.name.trim().toLowerCase() === categoryName.trim().toLowerCase());
        if (!found) {
          // Not a known product category — show virtual/service page anyway
          setCategory(null);
          setLoading(false);
          return;
        }
        addRecentlyViewed({ id: found._id, name: found.name, icon: getSubIcon(found.name) });
        setCategory(found);
        setSubcategories(found.subcategories || []);
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
    return allProducts.filter((p) => p.subcategory === selectedSubcategoryId);
  }, [allProducts, selectedSubcategoryId]);

  const selectedSubName = useMemo(
    () => subcategories.find((s) => s._id === selectedSubcategoryId)?.name ?? null,
    [selectedSubcategoryId, subcategories]
  );

  const filteredGroups = useMemo(() => {
    return groups
      .map((group) => {
        const matchFilter = activeFilter === "all" || group.id === `grp_${activeFilter}`;
        if (!matchFilter) return null;
        const q = searchQuery.toLowerCase();
        if (!q) return group;
        const items = group.items.filter((i) => i.name.toLowerCase().includes(q));
        if (!items.length && !group.title.toLowerCase().includes(q)) return null;
        return { ...group, items: items.length ? items : group.items };
      })
      .filter(Boolean) as CategoryGroup[];
  }, [groups, activeFilter, searchQuery]);

  const filterTabs = [
    { id: "all", label: "All", icon: "🌐" },
    { id: "shopping", label: "Shopping", icon: "🛍️" },
    { id: "services", label: "Services", icon: "🔧" },
    { id: "learning", label: "Learning", icon: "🎓" },
    { id: "travel", label: "Travel", icon: "✈️" },
    { id: "finance", label: "Finance", icon: "💰" },
    { id: "earn", label: "Earn", icon: "🐝" },
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
                  <Link
                    key={product._id}
                    to={`/product/${product._id}`}
                    className="group block rounded-2xl overflow-hidden border bg-white shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                  >
                    <div className="relative h-44 md:h-52 bg-muted/20 overflow-hidden">
                      <img
                        src={img} alt={title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        loading="lazy"
                      />
                      {dp > 0 && (
                        <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-extrabold px-2 py-0.5 rounded-lg shadow">
                          -{dp}%
                        </div>
                      )}
                      {product.tag && (
                        <div className="absolute top-2 right-2 text-navy text-xs font-bold px-2 py-0.5 rounded-lg"
                          style={{ background: "#fde68a" }}>
                          {product.tag}
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-navy line-clamp-2 text-sm min-h-[40px]">{title}</h3>
                      <div className="mt-3 flex items-baseline gap-2">
                        <span className="text-lg font-extrabold text-navy">{price}</span>
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
                    </div>
                  </Link>
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

      {/* ── Hero Search ── */}
      <section style={{ background: "linear-gradient(135deg,#1e1b4b 0%,#312e81 55%,#4c1d95 100%)" }} className="py-12 md:py-16">
        <div className="container mx-auto px-4 text-center">
          <p className="text-white/60 text-sm font-semibold tracking-widest uppercase mb-2">ApexBee Discovery</p>
          <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-3 drop-shadow">
            Discover Everything
          </h1>
          <p className="text-white/70 mb-8 text-base md:text-lg max-w-xl mx-auto">
            Shop · Services · Learn · Travel · Finance · Earn — all in one place
          </p>

          {/* Search */}
          <div className="max-w-2xl mx-auto relative">
            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-xl pointer-events-none">🔍</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search categories, services, courses…"
              className="w-full rounded-2xl border-0 pl-12 pr-5 py-4 text-base text-navy placeholder:text-muted-foreground shadow-2xl focus:outline-none focus:ring-4 focus:ring-white/30"
            />
          </div>
        </div>
      </section>

      {/* ── Filter Tabs ── */}
      <section className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex gap-2 overflow-x-auto scrollbar-none">
            {filterTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveFilter(tab.id)}
                className="flex-shrink-0 flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold border transition-all"
                style={
                  activeFilter === tab.id
                    ? { background: "#312e81", color: "#fff", borderColor: "transparent" }
                    : { background: "#f8fafc", color: "#1e293b", borderColor: "#e2e8f0" }
                }
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Recently Viewed ── */}
      {recentlyViewed.length > 0 && (
        <section className="container mx-auto px-4 pt-7">
          <h2 className="text-lg font-bold text-navy mb-3 flex items-center gap-2">
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

      {/* ── Trending Now ── */}
      {trending.length > 0 && (
        <section className="container mx-auto px-4 pt-7">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-navy flex items-center gap-2">
              <span>🔥</span> Trending Now
            </h2>
            <span className="text-xs bg-red-50 text-red-500 font-bold px-3 py-1 rounded-full border border-red-200 animate-pulse">
              LIVE
            </span>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
            {trending.map((item) => (
              <div
                key={item.id}
                className="flex-shrink-0 flex items-center gap-3 rounded-2xl bg-white border px-4 py-3 shadow-sm hover:shadow-md transition cursor-pointer"
                style={{ borderLeftWidth: 4, borderLeftColor: item.color }}
              >
                <span className="text-2xl">{item.icon}</span>
                <div>
                  <p className="text-sm font-bold text-navy whitespace-nowrap">{item.name}</p>
                  <p className="text-xs font-semibold" style={{ color: item.color }}>{item.growth} 🔼</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Category Groups ── */}
      {discoveryLoading ? (
        <section className="container mx-auto px-4 py-20 text-center">
          <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading categories…</p>
        </section>
      ) : filteredGroups.length === 0 ? (
        <section className="container mx-auto px-4 py-20 text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-2xl font-bold text-navy mb-2">No results found</h3>
          <p className="text-muted-foreground mb-6">Try a different search or filter</p>
          <button
            onClick={() => { setSearchQuery(""); setActiveFilter("all"); }}
            className="px-6 py-3 rounded-2xl bg-primary text-white font-semibold hover:bg-primary/90 transition"
          >
            Clear Filters
          </button>
        </section>
      ) : (
        filteredGroups.map((group) => (
          <section key={group.id} className="container mx-auto px-4 pt-10">
            {/* Group header */}
            <div
              className="flex items-center gap-4 rounded-3xl p-5 mb-5 shadow-md"
              style={{ background: group.gradient }}
            >
              <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-4xl shadow">
                {group.icon}
              </div>
              <div className="flex-1">
                <h2 className="text-xl md:text-2xl font-extrabold text-white leading-tight">{group.title}</h2>
                <p className="text-white/75 text-sm mt-0.5">{group.description}</p>
              </div>
              <Link
                to={`/category/${encodeURIComponent(group.items[0]?.name || "")}`}
                className="hidden md:flex items-center gap-1 bg-white/20 hover:bg-white/30 text-white text-sm font-semibold px-4 py-2 rounded-xl transition"
              >
                View All →
              </Link>
            </div>

            {/* Cards grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {group.items.map((item) => (
                <Link
                  key={item.id}
                  to={`/category/${encodeURIComponent(item.name)}`}
                  onClick={() => addRecentlyViewed({ id: item.id, name: item.name, icon: item.icon })}
                  className="group relative rounded-2xl overflow-hidden border bg-white shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1.5"
                  style={{ borderColor: "#f1f5f9" }}
                >
                  {/* Tag */}
                  {item.tag && (
                    <div
                      className="absolute top-2 left-2 z-10 text-white text-xs font-extrabold px-2 py-0.5 rounded-full shadow"
                      style={{ background: item.color }}
                    >
                      {item.tag}
                    </div>
                  )}

                  {/* Image */}
                  <div className="h-28 md:h-36 overflow-hidden relative">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>

                  {/* Footer */}
                  <div className="p-3 flex items-center gap-2.5">
                    <span
                      className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-lg"
                      style={{ background: `${item.color}18` }}
                    >
                      {item.icon}
                    </span>
                    <span className="text-sm font-bold text-navy line-clamp-2 leading-tight">
                      {item.name}
                    </span>
                  </div>
                  {/* Bottom accent */}
                  <div
                    className="h-0.5 w-0 group-hover:w-full transition-all duration-500 rounded-b-2xl"
                    style={{ background: item.color }}
                  />
                </Link>
              ))}
            </div>
          </section>
        ))
      )}

      {/* ── Popular Near Me ── */}
      {featuredVendors.length > 0 && (
        <section className="container mx-auto px-4 pt-12">
          <div
            className="rounded-3xl overflow-hidden shadow-xl"
            style={{ background: "linear-gradient(135deg,#0f172a 0%,#1e293b 100%)" }}
          >
            <div className="p-6 md:p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-extrabold text-white flex items-center gap-2">
                    📍 Popular Near Me
                  </h2>
                  <p className="text-white/50 text-sm mt-1">Top-rated stores in your area</p>
                </div>
                <Link
                  to="/local-stores"
                  className="text-sm text-white bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl font-semibold transition"
                >
                  View All →
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {featuredVendors.map((vendor) => (
                  <div
                    key={vendor.id}
                    className="bg-white/8 backdrop-blur rounded-2xl overflow-hidden border border-white/10 hover:bg-white/15 transition group cursor-pointer"
                  >
                    <div className="h-28 overflow-hidden">
                      <img src={vendor.image} alt={vendor.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                    </div>
                    <div className="p-4">
                      {vendor.badge && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: "#f59e0b22", color: "#fbbf24" }}>
                          ✦ {vendor.badge}
                        </span>
                      )}
                      <h3 className="font-bold text-white mt-2 text-sm line-clamp-1">{vendor.name}</h3>
                      <p className="text-white/50 text-xs mt-0.5">{vendor.location}</p>
                      <div className="flex items-center gap-1.5 mt-2">
                        <StarRating rating={vendor.rating} />
                        <span className="text-xs text-white/50">({vendor.reviews})</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Featured Service Providers ── */}
      {serviceProviders.length > 0 && (
        <section className="container mx-auto px-4 pt-12">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-xl font-bold text-navy flex items-center gap-2">🔧 Featured Service Providers</h2>
              <p className="text-sm text-muted-foreground mt-0.5">Trusted professionals at your doorstep</p>
            </div>
            <Link to="/category/Home Cleaning" className="text-sm text-primary font-semibold hover:underline">See All →</Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {serviceProviders.map((sp) => (
              <div
                key={sp.id}
                className="rounded-2xl border bg-white shadow-sm hover:shadow-lg transition group cursor-pointer overflow-hidden hover:-translate-y-1 duration-300"
              >
                <div className="h-32 overflow-hidden relative">
                  <img src={sp.image} alt={sp.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                  {sp.badge && (
                    <span className="absolute top-2 right-2 text-xs font-bold px-2 py-0.5 rounded-full bg-primary text-white shadow">
                      {sp.badge}
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-navy text-sm line-clamp-1">{sp.name}</h3>
                  <p className="text-muted-foreground text-xs mt-0.5">{sp.category}</p>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-1">
                      <StarRating rating={sp.rating} />
                      <span className="text-xs text-muted-foreground ml-0.5">{sp.rating}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{sp.jobs.toLocaleString()} jobs</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── ApexBee Academy ── */}
      {courses.length > 0 && (
        <section className="container mx-auto px-4 pt-12">
          <div
            className="rounded-3xl p-6 md:p-8 shadow-xl overflow-hidden"
            style={{ background: "linear-gradient(135deg,#064e3b 0%,#065f46 50%,#047857 100%)" }}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-7 gap-4">
              <div>
                <p className="text-emerald-300 text-xs font-bold tracking-widest uppercase mb-1">ApexBee Academy</p>
                <h2 className="text-2xl md:text-3xl font-extrabold text-white flex items-center gap-2">🎓 Learn & Grow</h2>
                <p className="text-white/60 text-sm mt-1">Expert-led courses to grow your skills & income</p>
              </div>
              <Link
                to="/category/Technology"
                className="bg-white text-emerald-800 font-bold text-sm px-5 py-2.5 rounded-2xl hover:bg-white/90 transition self-start whitespace-nowrap shadow"
              >
                Browse All Courses →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {courses.map((course) => (
                <div key={course.id} className="bg-white rounded-2xl overflow-hidden shadow group cursor-pointer hover:shadow-xl transition hover:-translate-y-1 duration-300">
                  <div className="h-28 overflow-hidden relative">
                    <img src={course.image} alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                    {course.badge && (
                      <span className="absolute top-2 left-2 text-xs font-bold px-2 py-0.5 rounded-full shadow"
                        style={{ background: "#fef3c7", color: "#92400e" }}>
                        {course.badge}
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-navy text-sm line-clamp-2 min-h-[38px]">{course.title}</h3>
                    <p className="text-muted-foreground text-xs mt-1">by {course.instructor}</p>
                    <div className="flex items-center gap-1 mt-1.5">
                      <StarRating rating={course.rating} />
                      <span className="text-xs text-muted-foreground">({course.students.toLocaleString()})</span>
                    </div>
                    <div className="flex items-baseline gap-2 mt-2">
                      <span className="font-extrabold text-navy text-base">₹{course.price.toLocaleString()}</span>
                      <span className="text-xs text-muted-foreground line-through">₹{course.originalPrice.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Earn With ApexBee banner ── */}
      <section className="container mx-auto px-4 pt-12 pb-6">
        <div
          className="rounded-3xl p-8 md:p-10 flex flex-col md:flex-row items-center gap-8 shadow-xl overflow-hidden relative"
          style={{ background: "linear-gradient(135deg,#78350f 0%,#b45309 60%,#d97706 100%)" }}
        >
          {/* BG pattern */}
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
            <div className="flex gap-6 mt-5 flex-wrap">
              {[["₹50K+", "Avg monthly"], ["50K+", "Active partners"], ["7", "Network levels"]].map(([val, lbl]) => (
                <div key={lbl}>
                  <div className="text-2xl font-extrabold text-white">{val}</div>
                  <div className="text-white/60 text-xs">{lbl}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-3 relative">
            <Link
              to="/category/Refer %26 Earn"
              className="bg-white text-amber-900 font-extrabold px-7 py-3.5 rounded-2xl hover:bg-white/90 transition text-center shadow-lg whitespace-nowrap"
            >
              Start Earning 🚀
            </Link>
            <Link
              to="/referrals"
              className="border-2 border-white/40 text-white font-semibold px-7 py-3 rounded-2xl hover:bg-white/10 transition text-center text-sm whitespace-nowrap"
            >
              Refer & Get ₹500 🎁
            </Link>
          </div>
        </div>
      </section>

      <div className="h-10" />
      <Footer />
    </div>
  );
};

export default Category;

