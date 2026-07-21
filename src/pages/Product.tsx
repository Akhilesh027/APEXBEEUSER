import { useEffect, useMemo, useState, useCallback } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import {
  Filter, Search, SlidersHorizontal, Star, X, Heart, ShoppingCart, ChevronDown,
} from "lucide-react";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";

const API_BASE = "https://server.apexbee.in/api";
const RECENTLY_VIEWED_KEY = "apexbee_recently_viewed_products";

// ═══════════════════════════════════════════════════════
type Category = { _id: string; name: string; parentId?: any; level?: number };

type Product = {
  _id: string;
  itemName?: string;
  name?: string;
  images?: string[];
  afterDiscount?: number;
  userPrice?: number;
  discount?: number;
  rating?: number;
  reviews?: number;
  category?: string | Category;
  categoryName?: string;
  brand?: string;
  stock?: number;
  tag?: string;
  vendorId?: string;
  createdAt?: string;
};

// ═══════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════
function money(n: any) {
  const v = typeof n === "number" && !isNaN(n) ? n : 0;
  return new Intl.NumberFormat("en-IN").format(v);
}

function extractArray<T = any>(json: any): T[] {
  if (!json) return [];
  if (Array.isArray(json)) return json;
  for (const key of ["products", "items", "data", "result", "results", "payload"]) {
    if (Array.isArray(json[key])) return json[key];
  }
  return [];
}

// Vendor name map
const VENDOR_NAMES: Record<string, string> = {
  vendor_1: "Apex Electronics Hub",
  vendor_2: "Digital Dreams Store",
  vendor_3: "Comfort Wood Furniture",
  vendor_4: "Bangalore Organics",
  vendor_5: "Shine Jewels & Co.",
  vendor_6: "Heritage Silk House",
};

function getVendorName(vendorId?: string) {
  return VENDOR_NAMES[vendorId || ""] || "ApexBee Seller";
}

// Recently viewed
function getRecentlyViewedProducts(): Product[] {
  try { return JSON.parse(localStorage.getItem(RECENTLY_VIEWED_KEY) || "[]"); }
  catch { return []; }
}

// ═══════════════════════════════════════════════════════
// Star Rating component
// ═══════════════════════════════════════════════════════
const StarRating = ({ rating, size = 12 }: { rating: number; size?: number }) => (
  <span className="inline-flex gap-px">
    {[1, 2, 3, 4, 5].map((s) => (
      <span key={s} style={{ color: s <= Math.round(rating) ? "#f59e0b" : "#d1d5db", fontSize: size }}>★</span>
    ))}
  </span>
);

// ═══════════════════════════════════════════════════════
// Product Card
// ═══════════════════════════════════════════════════════
const ProductCard = ({
  product, wishlistSet, onToggleWishlist, onAddToCart,
}: {
  product: Product;
  wishlistSet: Set<string>;
  onToggleWishlist: (id: string) => void;
  onAddToCart: (p: Product) => void;
}) => {
  const title = product.name || product.itemName || "Product";
  const price = Number(product.adminPricing?.customerSellingAmount ?? product.baseSellingPrice ?? product.afterDiscount ?? product.userPrice ?? 0);
  const mrp = Number(product.baseMrp ?? product.userPrice ?? 0);
  const dp = mrp > price && price > 0 ? Math.round(((mrp - price) / mrp) * 100) : (product.discountPercent ?? product.discount ?? 0);
  const img = product.images?.[0] || product.thumbnail || "/placeholder-product.png";
  const isInWishlist = wishlistSet.has(product._id);
  const inStock = (product.stock ?? 1) > 0;
  const deliveryFee = product.adminPricing?.shippingCharge ?? 0;

  return (
    <div className="group relative rounded-2xl border bg-white overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col h-full">
      {/* Wishlist button */}
      <button
        type="button"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleWishlist(product._id); }}
        className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/90 shadow-md flex items-center justify-center transition hover:scale-110"
      >
        <Heart
          className={`h-4 w-4 transition ${isInWishlist ? "fill-red-500 text-red-500" : "text-gray-400"}`}
        />
      </button>

      {/* Discount badge */}
      {dp > 0 && (
        <div className="absolute top-3 left-3 z-10 bg-red-500 text-white text-xs font-extrabold px-2 py-0.5 rounded-lg shadow">
          -{dp}%
        </div>
      )}

      {/* Out of stock overlay */}
      {!inStock && (
        <div className="absolute inset-0 z-10 bg-white/70 flex items-center justify-center">
          <span className="bg-gray-800 text-white font-bold text-sm px-4 py-2 rounded-xl">Out of Stock</span>
        </div>
      )}

      {/* Image */}
      <Link to={`/product/${product._id}`} className="block h-36 md:h-48 lg:h-52 bg-muted/20 overflow-hidden relative">
        <img
          src={img} alt={title}
          className="w-full h-full object-contain bg-white p-2 group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
          onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/placeholder.svg"; }}
        />
      </Link>

      {/* Info */}
      <div className="flex-1 p-3 flex flex-col">
        {/* Vendor */}
        <p className="text-[9px] md:text-[10px] text-muted-foreground font-medium truncate mb-1">
          {getVendorName(product.vendorId)}
        </p>

        <Link to={`/product/${product._id}`}>
          <h3 className="font-semibold text-navy text-xs md:text-sm line-clamp-2 min-h-[32px] md:min-h-[40px] hover:text-primary transition-colors">
            {title}
          </h3>
        </Link>

        <div className="flex flex-wrap items-center gap-1 mt-1">
          {/* Brand */}
          {product.brand && (
            <span className="inline-block text-[9px] md:text-[10px] font-bold text-muted-foreground bg-muted/40 px-2 py-0.5 rounded-full">
              {product.brand}
            </span>
          )}

          {/* Rating */}
          <div className="flex items-center gap-1 bg-green-50 px-1.5 py-0.5 rounded-full shrink-0">
            <span className="text-[10px] font-bold text-green-700">{Number(product.rating || 4.5).toFixed(1)}</span>
            <Star className="h-2.5 w-2.5 fill-green-600 text-green-600" />
          </div>

          <span className="text-[10px] text-slate-400 font-bold ml-1">
            👥 120+ Sold
          </span>
        </div>

        {/* Delivery Charge */}
        <div className="text-[9px] md:text-[10px] font-bold text-accent mt-1 flex items-center gap-1">
          <span>⚡ Fast Delivery</span>
          <span className="text-slate-300">•</span>
          <span className="text-green-600">{deliveryFee > 0 ? `₹${deliveryFee}` : "Free"}</span>
        </div>

        {/* Price & Add to Cart row */}
        <div className="mt-auto pt-3 flex items-center justify-between gap-2 border-t border-gray-100">
          <div className="flex flex-col">
            <span className="text-base md:text-lg font-extrabold text-navy leading-tight">₹{money(price)}</span>
            {mrp > price && (
              <span className="text-[10px] md:text-xs text-muted-foreground line-through">₹{money(mrp)}</span>
            )}
          </div>

          <button
            type="button"
            onClick={(e) => { e.preventDefault(); onAddToCart(product); }}
            disabled={!inStock}
            className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-primary hover:bg-primary/90 disabled:opacity-50 text-white flex items-center justify-center transition-all shadow-md shrink-0"
            title="Add to Cart"
          >
            <ShoppingCart className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════
// Main Page
// ═══════════════════════════════════════════════════════
const ProductsPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  }, []);
  const userId = user?._id || user?.id || "";

  // Filters
  const [q, setQ] = useState(searchParams.get("q") || "");
  const [selectedCats, setSelectedCats] = useState<string[]>(
    searchParams.get("cats")?.split(",").filter(Boolean) || []
  );
  const [selectedBrands, setSelectedBrands] = useState<string[]>(
    searchParams.get("brands")?.split(",").filter(Boolean) || []
  );
  const [minPrice, setMinPrice] = useState(Number(searchParams.get("min")) || 0);
  const [maxPrice, setMaxPrice] = useState(Number(searchParams.get("max")) || 100000);
  const [minRating, setMinRating] = useState(Number(searchParams.get("rating")) || 0);
  const [inStockOnly, setInStockOnly] = useState(searchParams.get("stock") === "1");
  const [hasDiscount, setHasDiscount] = useState(searchParams.get("offers") === "1");
  const [sort, setSort] = useState(searchParams.get("sort") || "popularity");

  // Client-side pagination
  const [visibleCount, setVisibleCount] = useState(24);
  useEffect(() => {
    setVisibleCount(24);
  }, [q, selectedCats, selectedBrands, minPrice, maxPrice, minRating, inStockOnly, hasDiscount, sort]);

  // Wishlist
  const [wishlistSet, setWishlistSet] = useState<Set<string>>(new Set());

  // Derived categories structure for filters tree
  const rootCategories = useMemo(() => {
    return categories.filter((c) => c.level === 1 || !c.parentId);
  }, [categories]);

  const getSubcategories = useCallback((catId: string) => {
    return categories.filter((c) => {
      const parent = c.parentId?._id || c.parentId;
      return parent && String(parent) === String(catId);
    });
  }, [categories]);


  // Recently viewed
  const [recentlyViewed] = useState<Product[]>(() => getRecentlyViewedProducts());

  // ─── Fetch data ───
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setErrorMsg("");
        const [catRes, prodRes] = await Promise.all([
          fetch(`${API_BASE}/categories`),
          fetch(`${API_BASE}/products`),
        ]);
        if (!catRes.ok) throw new Error(`Categories API failed (${catRes.status})`);
        if (!prodRes.ok) throw new Error(`Products API failed (${prodRes.status})`);

        const catJson = await catRes.json();
        const prodJson = await prodRes.json();

        setCategories(extractArray<Category>(catJson));
        setProducts(extractArray<Product>(prodJson));
      } catch (e: any) {
        console.error("ProductsPage load error:", e);
        setErrorMsg(e?.message || "Failed to load products");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Check wishlist status
  useEffect(() => {
    if (!products.length) return;
    if (!userId) {
      const local = localStorage.getItem("local_wishlist");
      if (local) {
        try {
          const list = JSON.parse(local);
          if (Array.isArray(list)) {
            setWishlistSet(new Set(list));
          }
        } catch { }
      }
      return;
    }
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/wishlist/check`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, productIds: products.map((p) => p._id) }),
        });
        const data = await res.json();
        if (data?.inWishlist) {
          setWishlistSet(new Set(Object.entries(data.inWishlist).filter(([, v]) => v).map(([k]) => k)));
        }
      } catch { }
    })();
  }, [products, userId]);

  // Sync filters to URL
  useEffect(() => {
    const next: any = {};
    if (q.trim()) next.q = q.trim();
    if (selectedCats.length) next.cats = selectedCats.join(",");
    if (selectedBrands.length) next.brands = selectedBrands.join(",");
    if (minPrice) next.min = String(minPrice);
    if (maxPrice && maxPrice < 100000) next.max = String(maxPrice);
    if (minRating) next.rating = String(minRating);
    if (inStockOnly) next.stock = "1";
    if (hasDiscount) next.offers = "1";
    if (sort && sort !== "popularity") next.sort = sort;
    setSearchParams(next, { replace: true });
  }, [q, selectedCats, selectedBrands, minPrice, maxPrice, minRating, inStockOnly, hasDiscount, sort]);

  // ─── Derived data ───
  const brands = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => { if (p.brand) set.add(p.brand); });
    return Array.from(set).sort();
  }, [products]);

  const categoryById = useMemo(() => {
    const m = new Map<string, Category>();
    categories.forEach((c) => m.set(c._id, c));
    return m;
  }, [categories]);

  const categoryIdByName = useMemo(() => {
    const m = new Map<string, string>();
    categories.forEach((c) => m.set(c.name.toLowerCase(), c._id));
    return m;
  }, [categories]);

  const filtered = useMemo(() => {
    let list = [...products];

    // Search
    if (q.trim()) {
      const s = q.trim().toLowerCase();
      list = list.filter((p) => {
        const name = (p.itemName || p.name || "").toLowerCase();
        const brand = (p.brand || "").toLowerCase();
        const catName = (p.categoryName || "").toLowerCase();
        const vendorName = getVendorName(p.vendorId).toLowerCase();
        return name.includes(s) || brand.includes(s) || catName.includes(s) || vendorName.includes(s);
      });
    }

    // Category filter
    if (selectedCats.length) {
      list = list.filter((p) => {
        const catObj: any = p.categoryId || p.category;
        if (catObj && typeof catObj === "object" && "_id" in catObj) {
          return selectedCats.includes(catObj._id);
        }
        if (typeof catObj === "string") {
          if (selectedCats.includes(catObj)) return true;
          const possibleId = categoryIdByName.get(catObj.toLowerCase());
          return possibleId ? selectedCats.includes(possibleId) : false;
        }
        return false;
      });
    }

    // Brand filter
    if (selectedBrands.length) {
      list = list.filter((p) => p.brand && selectedBrands.includes(p.brand));
    }

    // Price
    list = list.filter((p) => {
      const price = Number(p.afterDiscount ?? p.userPrice ?? 0);
      return price >= minPrice && price <= maxPrice;
    });

    // Rating
    if (minRating > 0) {
      list = list.filter((p) => Number(p.rating || 0) >= minRating);
    }

    // In stock
    if (inStockOnly) {
      list = list.filter((p) => (p.stock ?? 1) > 0);
    }

    // Has discount
    if (hasDiscount) {
      list = list.filter((p) => (p.discount ?? 0) > 0);
    }

    // Sorting
    switch (sort) {
      case "price_low":
        list.sort((a, b) => Number(a.afterDiscount ?? a.userPrice ?? 0) - Number(b.afterDiscount ?? b.userPrice ?? 0));
        break;
      case "price_high":
        list.sort((a, b) => Number(b.afterDiscount ?? b.userPrice ?? 0) - Number(a.afterDiscount ?? a.userPrice ?? 0));
        break;
      case "rating":
        list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case "newest":
        list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        break;
      case "popularity":
      default:
        list.sort((a, b) => (b.reviews || 0) - (a.reviews || 0));
        break;
    }

    return list;
  }, [products, q, selectedCats, selectedBrands, minPrice, maxPrice, minRating, inStockOnly, hasDiscount, sort, categoryIdByName]);

  const visibleProducts = useMemo(() => {
    return filtered.slice(0, visibleCount);
  }, [filtered, visibleCount]);

  // ─── Actions ───
  const toggleCat = (id: string) =>
    setSelectedCats((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const toggleBrand = (b: string) =>
    setSelectedBrands((prev) => prev.includes(b) ? prev.filter((x) => x !== b) : [...prev, b]);

  const clearAll = () => {
    setQ(""); setSelectedCats([]); setSelectedBrands([]); setMinPrice(0); setMaxPrice(100000);
    setMinRating(0); setInStockOnly(false); setHasDiscount(false); setSort("popularity");
  };

  const toggleWishlist = useCallback(async (productId: string) => {
    if (!userId) {
      const local = localStorage.getItem("local_wishlist");
      let list = [];
      if (local) {
        try { list = JSON.parse(local); } catch { list = []; }
      }
      if (!Array.isArray(list)) list = [];
      const index = list.indexOf(productId);
      let action = "";
      if (index > -1) {
        list.splice(index, 1);
        action = "removed";
      } else {
        list.push(productId);
        action = "added";
      }
      localStorage.setItem("local_wishlist", JSON.stringify(list));

      setWishlistSet((prev) => {
        const next = new Set(prev);
        if (action === "added") next.add(productId);
        else next.delete(productId);
        return next;
      });
      localStorage.setItem("wishlist_updated", Date.now().toString());
      window.dispatchEvent(new Event("storage"));
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/wishlist/toggle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, productId }),
      });
      const data = await res.json();
      setWishlistSet((prev) => {
        const next = new Set(prev);
        if (data.action === "added") next.add(productId);
        else next.delete(productId);
        return next;
      });
      localStorage.setItem("wishlist_updated", Date.now().toString());
    } catch { }
  }, [userId]);

  const addToCart = useCallback(async (p: Product) => {
    if (!userId) {
      alert("Please login first to add products to your cart.");
      navigate("/login");
      return;
    }
    try {
      const price = p.adminPricing?.customerSellingAmount ?? p.baseSellingPrice ?? p.afterDiscount ?? p.userPrice ?? 0;
      const deliveryFee = p.adminPricing?.shippingCharge ?? 0;
      const token = localStorage.getItem("token");
      await fetch(`${API_BASE}/cart/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          userId,
          productId: p._id,
          name: p.name || p.itemName,
          price,
          image: p.images?.[0] || p.thumbnail,
          quantity: 1,
          vendorId: p.vendorId || p.sellerId?._id || p.sellerId || null,
          deliveryFee,
        }),
      });

      // Dispatch storage event to sync Navbar cart count
      window.dispatchEvent(new Event("storage"));

      // Simple notification
      const toast = document.createElement("div");
      toast.textContent = "✅ Added to cart!";
      toast.className = "fixed bottom-6 left-1/2 -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-2xl shadow-2xl z-[9999] font-bold text-sm animate-bounce";
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 2000);
    } catch { }
  }, [userId, navigate]);

  // Active filter count
  const activeFilterCount = [
    selectedCats.length > 0, selectedBrands.length > 0,
    minPrice > 0, maxPrice < 100000,
    minRating > 0, inStockOnly, hasDiscount,
  ].filter(Boolean).length;

  // ═══════════════════════════════════════════════════════
  // Filter Sidebar Component
  // ═══════════════════════════════════════════════════════
  const FiltersUI = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-navy flex items-center gap-2">
          <Filter className="h-5 w-5" /> Filters
        </h3>
        <Button variant="ghost" size="sm" onClick={clearAll} className="text-xs">
          <X className="h-3 w-3 mr-1" /> Clear All
        </Button>
      </div>

      {/* Search */}
      <div>
        <label className="text-sm font-semibold text-navy">Search</label>
        <div className="relative mt-2">
          <Input value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="Name, brand, vendor…" className="pr-10" />
          <Search className="h-4 w-4 text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      {/* Categories & Subcategories */}
      <div>
        <label className="text-sm font-semibold text-navy">Categories</label>
        <div className="mt-2 space-y-3 max-h-72 overflow-auto pr-1">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-8 w-full rounded" />)
          ) : rootCategories.length === 0 ? (
            <p className="text-sm text-muted-foreground">No categories</p>
          ) : rootCategories.map((root) => {
            const subs = getSubcategories(root._id);
            return (
              <div key={root._id} className="space-y-1.5">
                {/* Main Category */}
                <label className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg border bg-muted/10 cursor-pointer hover:bg-muted/30 transition text-sm">
                  <input type="checkbox" checked={selectedCats.includes(root._id)}
                    onChange={() => toggleCat(root._id)} className="accent-primary w-4 h-4 rounded" />
                  <span className={selectedCats.includes(root._id) ? "font-bold text-navy" : "text-navy"}>
                    {root.name}
                  </span>
                </label>

                {/* Subcategories (Indented) */}
                {subs.length > 0 && (
                  <div className="pl-6 space-y-1 border-l border-gray-200 ml-3.5">
                    {subs.map((sub) => (
                      <label key={sub._id} className="flex items-center gap-2.5 px-2.5 py-1 rounded-md border border-transparent cursor-pointer hover:bg-muted/20 transition text-xs">
                        <input type="checkbox" checked={selectedCats.includes(sub._id)}
                          onChange={() => toggleCat(sub._id)} className="accent-primary w-3.5 h-3.5 rounded" />
                        <span className={selectedCats.includes(sub._id) ? "font-semibold text-navy" : "text-navy/80"}>
                          {sub.name}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Brands */}
      {brands.length > 0 && (
        <div>
          <label className="text-sm font-semibold text-navy">Brands</label>
          <div className="mt-2 space-y-1.5 max-h-40 overflow-auto pr-1">
            {brands.map((b) => (
              <label key={b} className="flex items-center gap-2.5 px-3 py-2 rounded-lg border cursor-pointer hover:bg-muted/30 transition text-sm">
                <input type="checkbox" checked={selectedBrands.includes(b)}
                  onChange={() => toggleBrand(b)} className="accent-primary w-4 h-4 rounded" />
                <span className={selectedBrands.includes(b) ? "font-bold text-navy" : "text-navy"}>
                  {b}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Price Range */}
      <div>
        <label className="text-sm font-semibold text-navy">Price Range</label>
        <div className="grid grid-cols-2 gap-3 mt-2">
          <Input type="number" value={minPrice || ""} onChange={(e) => setMinPrice(Number(e.target.value || 0))} placeholder="Min ₹" />
          <Input type="number" value={maxPrice >= 100000 ? "" : maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value || 100000))} placeholder="Max ₹" />
        </div>
      </div>

      {/* Rating */}
      <div>
        <label className="text-sm font-semibold text-navy">Minimum Rating</label>
        <div className="mt-2 flex gap-2 flex-wrap">
          {[0, 3, 3.5, 4, 4.5].map((r) => (
            <button key={r} type="button" onClick={() => setMinRating(r)}
              className={`px-3 py-2 rounded-lg border text-sm flex items-center gap-1 transition ${minRating === r ? "bg-navy text-white border-navy" : "bg-white text-navy hover:bg-muted/30"
                }`}>
              <Star className="h-3.5 w-3.5" />
              {r === 0 ? "Any" : `${r}+`}
            </button>
          ))}
        </div>
      </div>

      {/* Toggles */}
      <div className="space-y-3">
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={inStockOnly} onChange={(e) => setInStockOnly(e.target.checked)}
            className="accent-primary w-4 h-4 rounded" />
          <span className="text-sm font-medium text-navy">In Stock Only</span>
        </label>
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={hasDiscount} onChange={(e) => setHasDiscount(e.target.checked)}
            className="accent-primary w-4 h-4 rounded" />
          <span className="text-sm font-medium text-navy">With Offers / Discounts</span>
        </label>
      </div>
    </div>
  );

  // ═══════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* ── Banner ── */}
      <div style={{ background: "linear-gradient(135deg,#1e1b4b 0%,#312e81 55%,#4c1d95 100%)" }}>
        <div className="container mx-auto px-4 py-10 md:py-14">
          <p className="text-white/50 text-xs font-bold tracking-widest uppercase mb-1">ApexBee Marketplace</p>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white">Shop Products</h1>
          <p className="text-white/70 mt-2 max-w-2xl text-sm">
            Explore the best deals from local stores. Filter by categories, brands, price & rating.
          </p>

          {/* Search bar in banner */}
          <div className="mt-6 max-w-2xl relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg pointer-events-none">🔍</span>
            <input
              type="text" value={q} onChange={(e) => setQ(e.target.value)}
              placeholder="Search by product name, brand, category, or vendor…"
              className="w-full rounded-2xl border-0 pl-11 pr-5 py-3.5 text-sm text-navy placeholder:text-muted-foreground shadow-2xl focus:outline-none focus:ring-4 focus:ring-white/30"
            />
          </div>

          {/* Active filter chips */}
          <div className="mt-4 flex flex-wrap gap-2">
            {selectedCats.map((catId) => {
              const cat = categoryById.get(catId);
              return cat ? (
                <span key={catId} className="inline-flex items-center gap-1 bg-white/15 text-white px-3 py-1 rounded-full text-xs font-semibold">
                  {cat.name}
                  <button onClick={() => toggleCat(catId)} className="hover:text-red-300"><X className="h-3 w-3" /></button>
                </span>
              ) : null;
            })}
            {selectedBrands.map((b) => (
              <span key={b} className="inline-flex items-center gap-1 bg-white/15 text-white px-3 py-1 rounded-full text-xs font-semibold">
                {b}
                <button onClick={() => toggleBrand(b)} className="hover:text-red-300"><X className="h-3 w-3" /></button>
              </span>
            ))}
            {minRating > 0 && (
              <span className="inline-flex items-center gap-1 bg-white/15 text-white px-3 py-1 rounded-full text-xs font-semibold">
                ★ {minRating}+
                <button onClick={() => setMinRating(0)} className="hover:text-red-300"><X className="h-3 w-3" /></button>
              </span>
            )}
            {inStockOnly && (
              <span className="inline-flex items-center gap-1 bg-white/15 text-white px-3 py-1 rounded-full text-xs font-semibold">
                In Stock
                <button onClick={() => setInStockOnly(false)} className="hover:text-red-300"><X className="h-3 w-3" /></button>
              </span>
            )}
            {hasDiscount && (
              <span className="inline-flex items-center gap-1 bg-white/15 text-white px-3 py-1 rounded-full text-xs font-semibold">
                With Offers
                <button onClick={() => setHasDiscount(false)} className="hover:text-red-300"><X className="h-3 w-3" /></button>
              </span>
            )}
            {!loading && (
              <span className="bg-white/10 text-white/80 px-3 py-1 rounded-full text-xs">
                {filtered.length} item{filtered.length !== 1 ? "s" : ""} found
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Main Layout ── */}
      <div className="container mx-auto px-4 py-8">
        {errorMsg && (
          <div className="rounded-2xl mb-6 border border-red-200 bg-red-50 p-5">
            <p className="font-semibold text-red-700">Could not load products</p>
            <p className="text-sm text-muted-foreground mt-1">{errorMsg}</p>
          </div>
        )}

        <div className="grid lg:grid-cols-12 gap-6">
          {/* ── Desktop Filters ── */}
          <aside className="hidden lg:block lg:col-span-3">
            <div className="sticky top-20 rounded-2xl border bg-white p-5 shadow-sm">
              <FiltersUI />
            </div>
          </aside>

          {/* ── Mobile Filter Button ── */}
          <div className="lg:hidden flex items-center justify-between mb-2 gap-3">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="gap-2 relative">
                  <SlidersHorizontal className="h-4 w-4" /> Filters
                  {activeFilterCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-primary text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                      {activeFilterCount}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[320px] sm:w-[380px] overflow-auto">
                <SheetHeader><SheetTitle>Filters</SheetTitle></SheetHeader>
                <div className="mt-4"><FiltersUI /></div>
              </SheetContent>
            </Sheet>

            {/* Sort dropdown (mobile) */}
            <div className="relative">
              <select value={sort} onChange={(e) => setSort(e.target.value)}
                className="appearance-none border rounded-xl px-4 py-2.5 pr-8 bg-white text-sm font-semibold text-navy">
                <option value="popularity">Popularity</option>
                <option value="newest">Newest</option>
                <option value="price_low">Price: Low → High</option>
                <option value="price_high">Price: High → Low</option>
                <option value="rating">Top Rated</option>
              </select>
              <ChevronDown className="h-4 w-4 absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          {/* ── Products Grid ── */}
          <main className="lg:col-span-9">
            {/* Sort bar (desktop) */}
            <div className="hidden lg:flex items-center justify-between mb-5 pb-4 border-b">
              <p className="text-sm text-muted-foreground">
                {loading ? "Loading…" : `${filtered.length} product${filtered.length !== 1 ? "s" : ""} found`}
              </p>
              <div className="flex items-center gap-2">
                <span className="text-sm text-navy font-medium">Sort by:</span>
                <div className="relative">
                  <select value={sort} onChange={(e) => setSort(e.target.value)}
                    className="appearance-none border rounded-xl px-4 py-2 pr-8 bg-white text-sm font-semibold text-navy">
                    <option value="popularity">Popularity</option>
                    <option value="newest">Newest</option>
                    <option value="price_low">Price: Low → High</option>
                    <option value="price_high">Price: High → Low</option>
                    <option value="rating">Top Rated</option>
                  </select>
                  <ChevronDown className="h-4 w-4 absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                </div>
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="rounded-2xl border bg-white p-3">
                    <Skeleton className="h-44 w-full rounded-xl" />
                    <div className="mt-3 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-10 w-full rounded-xl" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed bg-muted/10 p-14 text-center">
                <div className="text-6xl mb-4">🔍</div>
                <p className="text-xl font-bold text-navy mb-2">No products found</p>
                <p className="text-sm text-muted-foreground mb-6">Try changing your filters or search term</p>
                <div className="flex gap-3 justify-center">
                  <Button onClick={clearAll}>Clear All Filters</Button>
                  <Button variant="outline" onClick={() => window.location.reload()}>Reload</Button>
                </div>
              </div>
            ) : (
              <div>
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
                  {visibleProducts.map((p) => (
                    <ProductCard
                      key={p._id}
                      product={p}
                      wishlistSet={wishlistSet}
                      onToggleWishlist={toggleWishlist}
                      onAddToCart={addToCart}
                    />
                  ))}
                </div>
                {visibleCount < filtered.length && (
                  <div className="mt-8 flex justify-center">
                    <Button onClick={() => setVisibleCount((prev) => prev + 24)} className="px-8 rounded-xl font-bold">
                      Load More Products
                    </Button>
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* ── Recently Viewed ── */}
      {recentlyViewed.length > 0 && (
        <section className="container mx-auto px-4 pb-10">
          <h2 className="text-lg font-bold text-navy mb-4 flex items-center gap-2">
            🕐 Recently Viewed
          </h2>
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
            {recentlyViewed.slice(0, 8).map((p) => (
              <Link
                key={p._id}
                to={`/product/${p._id}`}
                className="flex-shrink-0 w-36 rounded-2xl border bg-white overflow-hidden hover:shadow-md transition group"
              >
                <div className="h-24 bg-muted/20 overflow-hidden">
                  <img src={p.images?.[0] || "/placeholder.svg"} alt={p.itemName || p.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform" loading="lazy" />
                </div>
                <div className="p-2">
                  <p className="text-xs font-semibold text-navy line-clamp-1">{p.itemName || p.name}</p>
                  <p className="text-xs font-bold text-primary mt-0.5">₹{money(Number(p.afterDiscount ?? p.userPrice ?? 0))}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
};

export default ProductsPage;

