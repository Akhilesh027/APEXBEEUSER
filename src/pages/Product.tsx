import { useEffect, useMemo, useState, useCallback } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import {
  Filter, Search, SlidersHorizontal, Star, X, Heart, ShoppingCart, ChevronDown,
  ChevronLeft, ChevronRight, Sparkles, TrendingUp, Zap, Package, Truck, ShieldCheck,
  BadgePercent, LayoutGrid, List, ArrowUpDown,
} from "lucide-react";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";

const API_BASE = import.meta.env.VITE_API_URL || "https://server.apexbee.in/api";
const RECENTLY_VIEWED_KEY = "apexbee_recently_viewed_products";

// ═══════════════════════════════════════════════════════
type Category = { _id: string; name: string; parentId?: any; level?: number };

type Product = {
  _id: string;
  itemName?: string;
  name?: string;
  images?: string[];
  thumbnail?: string;
  afterDiscount?: number;
  userPrice?: number;
  discount?: number;
  discountPercent?: number;
  rating?: number;
  reviews?: number;
  category?: string | Category;
  categoryId?: any;
  categoryName?: string;
  brand?: string;
  stock?: number;
  tag?: string;
  vendorId?: string;
  sellerId?: any;
  createdAt?: string;
  adminPricing?: any;
  baseSellingPrice?: number;
  baseMrp?: number;
  sellingPrice?: number;
  price?: number;
  soldCount?: number;
  isCourierShipping?: boolean;
  calculatedDistanceKm?: number;
  deliveryMode?: string;
  vendorLocationName?: string;
  shippingCharge?: number;
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
  for (const key of ["categories", "products", "items", "data", "result", "results", "payload"]) {
    if (Array.isArray(json[key])) return json[key];
  }
  return [];
}

function getVendorName(vendorId?: string) {
  const map: Record<string, string> = {
    vendor_1: "Apex Electronics Hub",
    vendor_2: "Digital Dreams Store",
    vendor_3: "Comfort Wood Furniture",
    vendor_4: "Bangalore Organics",
    vendor_5: "Shine Jewels & Co.",
    vendor_6: "Heritage Silk House",
  };
  return map[vendorId || ""] || "ApexBee Seller";
}

function getRecentlyViewedProducts(): Product[] {
  try { return JSON.parse(localStorage.getItem(RECENTLY_VIEWED_KEY) || "[]"); }
  catch { return []; }
}

// ═══════════════════════════════════════════════════════
// PREMIUM PRODUCT CARD
// ═══════════════════════════════════════════════════════
const ProductCard = ({
  product, wishlistSet, onToggleWishlist, onAddToCart, viewMode,
}: {
  product: Product;
  wishlistSet: Set<string>;
  onToggleWishlist: (id: string) => void;
  onAddToCart: (p: Product) => void;
  viewMode: "grid" | "list";
}) => {
  const title = product.name || product.itemName || "Product";
  const price = Number(product.adminPricing?.sellingPrice ?? product.baseSellingPrice ?? product.sellingPrice ?? product.price ?? 0);
  const mrp = Number(product.baseMrp ?? product.userPrice ?? 0);
  const dp = mrp > price && price > 0 ? Math.round(((mrp - price) / mrp) * 100) : (product.discountPercent ?? product.discount ?? 0);
  const img = product.images?.[0] || product.thumbnail || "/placeholder-product.png";
  const isInWishlist = wishlistSet.has(product._id);
  const inStock = (product.stock ?? 1) > 0;
  const deliveryFee = product.adminPricing?.shippingCharge ?? 0;
  const isCourier = product.isCourierShipping || (product.calculatedDistanceKm && product.calculatedDistanceKm > 20);
  const rating = product.rating && Number(product.rating) > 0 ? Number(product.rating).toFixed(1) : null;
  const soldCount = product.soldCount && product.soldCount > 0 ? product.soldCount : 0;

  if (viewMode === "list") {
    return (
      <div className="group relative rounded-xl sm:rounded-2xl border border-slate-200/80 bg-white overflow-hidden hover:shadow-xl hover:border-amber-300/60 transition-all duration-300 flex flex-row items-center p-2.5 sm:p-4 gap-2.5 sm:gap-4">
        {/* Wishlist */}
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleWishlist(product._id); }}
          className="absolute top-2 right-2 z-10 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/90 backdrop-blur-sm shadow-md flex items-center justify-center transition hover:scale-110 border-none cursor-pointer"
        >
          <Heart className={`h-3.5 w-3.5 sm:h-4 sm:w-4 transition ${isInWishlist ? "fill-red-500 text-red-500" : "text-slate-400"}`} />
        </button>

        {/* Image - Compact 24x24 box on mobile */}
        <Link to={`/product/${product._id}`} className="block w-20 h-20 sm:w-40 sm:h-40 lg:w-[180px] lg:h-[160px] shrink-0 bg-slate-50 overflow-hidden relative rounded-lg border border-slate-100 flex items-center justify-center p-1 sm:p-3">
          <img
            src={img} alt={title}
            className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
            onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/placeholder.svg"; }}
          />
          {dp > 0 && (
            <span className="absolute top-1 left-1 sm:top-2 sm:left-2 bg-rose-500 text-white text-[8px] sm:text-[10px] font-black px-1.5 py-0.2 sm:px-2 sm:py-0.5 rounded-md shadow-xs">
              -{dp}%
            </span>
          )}
          {!inStock && (
            <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center">
              <span className="bg-slate-800 text-white font-bold text-[9px] sm:text-xs px-2 py-1 rounded-lg">Out of Stock</span>
            </div>
          )}
        </Link>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-1">
          <Link to={`/product/${product._id}`}>
            <h3 className="font-bold text-slate-800 text-xs sm:text-base line-clamp-2 hover:text-amber-600 transition-colors leading-snug">
              {title}
            </h3>
          </Link>
          <p className="text-[9px] sm:text-[10px] text-slate-400 font-semibold truncate">
            {product.brand || getVendorName(product.vendorId)}
          </p>

          <div className="flex items-center gap-1.5 flex-wrap">
            {rating && (
              <div className="flex items-center gap-0.5 bg-amber-500 text-[#0A1128] px-1.5 py-[1px] rounded text-[10px] font-black">
                <Star className="h-2.5 w-2.5 fill-[#0A1128] text-[#0A1128]" />
                <span>{rating}</span>
              </div>
            )}
            {soldCount > 0 && (
              <span className="text-[9px] sm:text-[10px] text-slate-400 font-bold hidden sm:inline">👥 {soldCount}+ Sold</span>
            )}
            <span className="text-[9px] sm:text-[10px] font-bold text-amber-600">
              {isCourier ? "🌐 Courier" : "⚡ 15–30m"}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2 pt-1">
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-sm sm:text-lg font-black text-[#0A1128]">₹{money(price)}</span>
                {mrp > price && (
                  <span className="text-[9px] sm:text-[11px] text-slate-400 line-through font-semibold">₹{money(mrp)}</span>
                )}
              </div>
              <div className="text-[9px] text-emerald-600 font-bold">
                Delivery: {deliveryFee > 0 ? `₹${deliveryFee}` : "FREE"}
              </div>
            </div>
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); onAddToCart(product); }}
              disabled={!inStock}
              className="px-3 py-1.5 sm:px-4 sm:py-2.5 rounded-lg sm:rounded-xl bg-[#0A1128] hover:bg-amber-500 text-white hover:text-[#0A1128] font-black text-xs flex items-center gap-1 transition-all duration-300 shadow-xs disabled:opacity-40 border-none cursor-pointer shrink-0"
            >
              <ShoppingCart className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              <span className="text-[10px] sm:text-xs">Add</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── GRID VIEW (default) ──
  return (
    <div className="group relative rounded-2xl border border-slate-200/80 bg-white overflow-hidden hover:shadow-2xl hover:border-amber-300/60 transition-all duration-400 hover:-translate-y-1 flex flex-col h-full">
      {/* Wishlist */}
      <button
        type="button"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleWishlist(product._id); }}
        className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm shadow-md flex items-center justify-center transition hover:scale-110 border-none cursor-pointer"
      >
        <Heart className={`h-4 w-4 transition ${isInWishlist ? "fill-red-500 text-red-500" : "text-slate-400"}`} />
      </button>

      {/* Discount badge */}
      {dp > 0 && (
        <div className="absolute top-3 left-3 z-10 bg-gradient-to-r from-rose-500 to-red-600 text-white text-[10px] font-black px-2.5 py-1 rounded-lg shadow-md flex items-center gap-1">
          <BadgePercent className="w-3 h-3" />
          <span>-{dp}%</span>
        </div>
      )}

      {/* Out of stock */}
      {!inStock && (
        <div className="absolute inset-0 z-10 bg-white/70 backdrop-blur-sm flex items-center justify-center">
          <span className="bg-slate-800 text-white font-bold text-sm px-4 py-2 rounded-xl shadow-lg">Out of Stock</span>
        </div>
      )}

      {/* Image */}
      <Link to={`/product/${product._id}`} className="block h-40 md:h-48 lg:h-52 bg-gradient-to-b from-slate-50 to-white overflow-hidden relative">
        <img
          src={img} alt={title}
          className="w-full h-full object-contain p-3 group-hover:scale-110 transition-transform duration-700 ease-out"
          loading="lazy"
          onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/placeholder.svg"; }}
        />
      </Link>

      {/* Content */}
      <div className="flex-1 p-3.5 md:p-4 flex flex-col">
        {/* Vendor */}
        <p className="text-[9px] md:text-[10px] text-slate-400 font-semibold truncate mb-1">
          {getVendorName(product.vendorId)}
        </p>

        <Link to={`/product/${product._id}`}>
          <h3 className="font-bold text-slate-800 text-xs md:text-sm line-clamp-2 min-h-[32px] md:min-h-[40px] hover:text-amber-600 transition-colors leading-snug">
            {title}
          </h3>
        </Link>

        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
          {product.brand && (
            <span className="inline-block text-[9px] md:text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              {product.brand}
            </span>
          )}

          {rating && (
            <div className="flex items-center gap-0.5 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-lg shrink-0">
              <Star className="h-2.5 w-2.5 fill-emerald-500 text-emerald-500" />
              <span className="text-[10px] font-black text-emerald-700">{rating}</span>
            </div>
          )}

          {soldCount > 0 && (
            <span className="text-[9px] text-slate-400 font-bold">👥 {soldCount}+</span>
          )}
        </div>

        {/* Delivery Info */}
        <div className="bg-gradient-to-r from-slate-50 to-slate-100/50 rounded-xl p-2 text-[9px] text-slate-600 font-bold space-y-0.5 mt-2.5 border border-slate-100">
          <div className="flex items-center justify-between">
            <span className="text-amber-600 font-extrabold shrink-0 flex items-center gap-0.5">
              {isCourier ? (
                <><Truck className="w-3 h-3" /> Courier [2–4 Days]</>
              ) : (
                <><Zap className="w-3 h-3" /> 15–30 Mins</>
              )}
            </span>
            <span className="text-emerald-600 font-black">
              {deliveryFee > 0 ? `₹${deliveryFee}` : "FREE"}
            </span>
          </div>
        </div>

        {/* Price & Add to Cart */}
        <div className="mt-auto pt-3 flex items-center justify-between gap-2 border-t border-slate-100">
          <div className="flex flex-col">
            <span className="text-base md:text-lg font-black text-[#0A1128] leading-tight">₹{money(price)}</span>
            {mrp > price && (
              <span className="text-[10px] md:text-xs text-slate-400 line-through font-medium">₹{money(mrp)}</span>
            )}
          </div>

          <button
            type="button"
            onClick={(e) => { e.preventDefault(); onAddToCart(product); }}
            disabled={!inStock}
            className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-[#0A1128] hover:bg-amber-500 disabled:opacity-40 text-white hover:text-[#0A1128] flex items-center justify-center transition-all duration-300 shadow-md shrink-0 border-none cursor-pointer"
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
// MAIN PAGE
// ═══════════════════════════════════════════════════════
const ProductsPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

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

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(12);

  useEffect(() => {
    setCurrentPage(1);
  }, [q, selectedCats, selectedBrands, minPrice, maxPrice, minRating, inStockOnly, hasDiscount, sort]);

  // Wishlist
  const [wishlistSet, setWishlistSet] = useState<Set<string>>(new Set());

  // Derived
  const rootCategories = useMemo(() => {
    return categories.filter((c) => c.level === 1 || !c.parentId);
  }, [categories]);

  const getSubcategories = useCallback((catId: string) => {
    return categories.filter((c) => {
      const parent = c.parentId?._id || c.parentId;
      return parent && String(parent) === String(catId);
    });
  }, [categories]);

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

  // Wishlist status
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

  // Sync filters → URL
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

    if (selectedBrands.length) {
      list = list.filter((p) => p.brand && selectedBrands.includes(p.brand));
    }

    list = list.filter((p) => {
      const price = Number(p.afterDiscount ?? p.userPrice ?? 0);
      return price >= minPrice && price <= maxPrice;
    });

    if (minRating > 0) {
      list = list.filter((p) => Number(p.rating || 0) >= minRating);
    }

    if (inStockOnly) {
      list = list.filter((p) => (p.stock ?? 1) > 0);
    }

    if (hasDiscount) {
      list = list.filter((p) => (p.discount ?? 0) > 0);
    }

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

  const totalPages = useMemo(() => Math.ceil(filtered.length / itemsPerPage) || 1, [filtered.length, itemsPerPage]);

  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, currentPage, itemsPerPage]);

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
      let list: string[] = [];
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
      const price = p.adminPricing?.sellingPrice ?? p.baseSellingPrice ?? (p as any).sellingPrice ?? (p as any).price ?? 0;
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

      window.dispatchEvent(new Event("storage"));

      const toast = document.createElement("div");
      toast.textContent = "✅ Added to cart!";
      toast.className = "fixed bottom-6 left-1/2 -translate-x-1/2 bg-emerald-600 text-white px-6 py-3 rounded-2xl shadow-2xl z-[9999] font-bold text-sm";
      toast.style.animation = "slideUp 0.3s ease-out";
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 2000);
    } catch { }
  }, [userId, navigate]);

  const activeFilterCount = [
    selectedCats.length > 0, selectedBrands.length > 0,
    minPrice > 0, maxPrice < 100000,
    minRating > 0, inStockOnly, hasDiscount,
  ].filter(Boolean).length;

  // ═══════════════════════════════════════════════════════
  // PREMIUM FILTER SIDEBAR
  // ═══════════════════════════════════════════════════════
  const FiltersUI = () => (
    <div className="space-y-6 font-sans">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-black text-[#0A1128] flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#0A1128] text-amber-400 flex items-center justify-center">
            <Filter className="h-4 w-4" />
          </div>
          Filters
          {activeFilterCount > 0 && (
            <span className="text-[10px] bg-amber-400 text-[#0A1128] font-black w-5 h-5 rounded-full flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </h3>
        <button onClick={clearAll} className="text-xs font-bold text-slate-500 hover:text-rose-600 flex items-center gap-1 bg-slate-100 hover:bg-rose-50 px-3 py-1.5 rounded-xl transition border-none cursor-pointer">
          <X className="h-3 w-3" /> Clear
        </button>
      </div>

      {/* Search inside filters */}
      <div>
        <label className="text-xs font-black text-slate-700 uppercase tracking-wider">Search</label>
        <div className="relative mt-2">
          <Input value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="Product, brand, vendor…" className="pr-10 rounded-xl border-slate-200 focus:border-amber-400 focus:ring-amber-400/20 bg-slate-50 text-sm font-semibold" />
          <Search className="h-4 w-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      {/* Categories */}
      <div>
        <label className="text-xs font-black text-slate-700 uppercase tracking-wider">Categories</label>
        <div className="mt-2 space-y-1.5 max-h-64 overflow-auto pr-1 scrollbar-none">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-8 w-full rounded-lg" />)
          ) : rootCategories.length === 0 ? (
            <p className="text-xs text-slate-400">No categories</p>
          ) : rootCategories.map((root) => {
            const subs = getSubcategories(root._id);
            const isActive = selectedCats.includes(root._id);
            return (
              <div key={root._id} className="space-y-1">
                <label className={`flex items-center gap-2.5 px-3 py-2 rounded-xl cursor-pointer transition text-sm font-semibold border ${isActive ? "bg-amber-50 border-amber-300 text-[#0A1128]" : "bg-white border-slate-100 text-slate-700 hover:bg-slate-50"}`}>
                  <input type="checkbox" checked={isActive}
                    onChange={() => toggleCat(root._id)} className="accent-amber-500 w-4 h-4 rounded" />
                  <span>{root.name}</span>
                </label>
                {subs.length > 0 && (
                  <div className="pl-6 space-y-1 border-l-2 border-amber-200/60 ml-4">
                    {subs.map((sub) => {
                      const subActive = selectedCats.includes(sub._id);
                      return (
                        <label key={sub._id} className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg cursor-pointer transition text-xs font-medium ${subActive ? "bg-amber-50 text-amber-800" : "text-slate-600 hover:bg-slate-50"}`}>
                          <input type="checkbox" checked={subActive}
                            onChange={() => toggleCat(sub._id)} className="accent-amber-500 w-3.5 h-3.5 rounded" />
                          <span>{sub.name}</span>
                        </label>
                      );
                    })}
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
          <label className="text-xs font-black text-slate-700 uppercase tracking-wider">Brands</label>
          <div className="mt-2 space-y-1 max-h-36 overflow-auto pr-1 scrollbar-none">
            {brands.map((b) => {
              const active = selectedBrands.includes(b);
              return (
                <label key={b} className={`flex items-center gap-2.5 px-3 py-2 rounded-xl cursor-pointer transition text-sm font-medium border ${active ? "bg-amber-50 border-amber-300 text-[#0A1128] font-bold" : "bg-white border-slate-100 text-slate-700 hover:bg-slate-50"}`}>
                  <input type="checkbox" checked={active}
                    onChange={() => toggleBrand(b)} className="accent-amber-500 w-4 h-4 rounded" />
                  <span>{b}</span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* Price Range */}
      <div>
        <label className="text-xs font-black text-slate-700 uppercase tracking-wider">Price Range</label>
        <div className="grid grid-cols-2 gap-3 mt-2">
          <Input type="number" value={minPrice || ""} onChange={(e) => setMinPrice(Number(e.target.value || 0))}
            placeholder="₹ Min" className="rounded-xl border-slate-200 bg-slate-50 text-sm font-semibold" />
          <Input type="number" value={maxPrice >= 100000 ? "" : maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value || 100000))}
            placeholder="₹ Max" className="rounded-xl border-slate-200 bg-slate-50 text-sm font-semibold" />
        </div>
      </div>

      {/* Minimum Rating */}
      <div>
        <label className="text-xs font-black text-slate-700 uppercase tracking-wider">Min Rating</label>
        <div className="mt-2 flex gap-1.5 flex-wrap">
          {[0, 3, 3.5, 4, 4.5].map((r) => (
            <button key={r} type="button" onClick={() => setMinRating(r)}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1 transition border-none cursor-pointer ${minRating === r ? "bg-[#0A1128] text-amber-400 shadow-md" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}>
              <Star className="h-3 w-3" />
              {r === 0 ? "Any" : `${r}+`}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Toggles */}
      <div className="space-y-2.5">
        <label className="flex items-center gap-3 cursor-pointer bg-slate-50 px-3 py-2.5 rounded-xl hover:bg-slate-100 transition">
          <input type="checkbox" checked={inStockOnly} onChange={(e) => setInStockOnly(e.target.checked)}
            className="accent-amber-500 w-4 h-4 rounded" />
          <div>
            <span className="text-sm font-bold text-slate-800">In Stock Only</span>
            <p className="text-[10px] text-slate-400 font-medium">Hide out of stock items</p>
          </div>
        </label>
        <label className="flex items-center gap-3 cursor-pointer bg-slate-50 px-3 py-2.5 rounded-xl hover:bg-slate-100 transition">
          <input type="checkbox" checked={hasDiscount} onChange={(e) => setHasDiscount(e.target.checked)}
            className="accent-amber-500 w-4 h-4 rounded" />
          <div>
            <span className="text-sm font-bold text-slate-800">With Offers</span>
            <p className="text-[10px] text-slate-400 font-medium">Show discounted products</p>
          </div>
        </label>
      </div>
    </div>
  );

  // ═══════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-[#f8f9fb] font-sans text-slate-900">
      <Navbar />

      {/* ══════════════════════════════════════ */}
      {/* CLEAN COMPACT SEARCH HEADER            */}
      {/* ══════════════════════════════════════ */}
      <section className="bg-white border-b border-slate-200 py-3.5 px-4 sm:px-6 shadow-xs sticky top-16 z-20">
        <div className="container mx-auto space-y-3">
          {/* Breadcrumb + Search Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500">
              <Link to="/" className="hover:text-amber-600 transition">Home</Link>
              <ChevronRight className="w-3 h-3 text-slate-400" />
              <span className="text-slate-900 font-bold">Search Results</span>
              {q.trim() && (
                <>
                  <ChevronRight className="w-3 h-3 text-slate-400" />
                  <span className="text-amber-600 font-extrabold truncate max-w-[180px]">"{q.trim()}"</span>
                </>
              )}
            </div>

            {/* Compact Search Bar */}
            <div className="relative w-full sm:w-80 md:w-96">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
              <input
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search products, brands, categories…"
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl pl-10 pr-9 py-2 text-xs font-semibold placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white transition"
              />
              {q.trim() && (
                <button
                  type="button"
                  onClick={() => setQ("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-xs font-black border-none bg-transparent cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Active Filter Chips */}
          {(selectedCats.length > 0 || selectedBrands.length > 0 || minRating > 0 || inStockOnly || hasDiscount) && (
            <div className="flex flex-wrap gap-2 items-center pt-1 border-t border-slate-100">
              <span className="text-[11px] font-bold text-slate-400">Active Filters:</span>
              {selectedCats.map((catId) => {
                const cat = categoryById.get(catId);
                return cat ? (
                  <span key={catId} className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 text-[11px] font-bold px-2.5 py-0.5 rounded-md border border-amber-200">
                    {cat.name}
                    <button onClick={() => toggleCat(catId)} className="hover:text-red-500 border-none bg-transparent cursor-pointer p-0 text-amber-800"><X className="h-3 w-3" /></button>
                  </span>
                ) : null;
              })}
              {selectedBrands.map((b) => (
                <span key={b} className="inline-flex items-center gap-1 bg-slate-100 text-slate-800 text-[11px] font-bold px-2.5 py-0.5 rounded-md border border-slate-200">
                  {b}
                  <button onClick={() => toggleBrand(b)} className="hover:text-red-500 border-none bg-transparent cursor-pointer p-0 text-slate-600"><X className="h-3 w-3" /></button>
                </span>
              ))}
              {minRating > 0 && (
                <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 text-[11px] font-bold px-2.5 py-0.5 rounded-md border border-amber-200">
                  ★ {minRating}+
                  <button onClick={() => setMinRating(0)} className="hover:text-red-500 border-none bg-transparent cursor-pointer p-0 text-amber-800"><X className="h-3 w-3" /></button>
                </span>
              )}
              {inStockOnly && (
                <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 text-[11px] font-bold px-2.5 py-0.5 rounded-md border border-emerald-200">
                  In Stock
                  <button onClick={() => setInStockOnly(false)} className="hover:text-red-500 border-none bg-transparent cursor-pointer p-0 text-emerald-800"><X className="h-3 w-3" /></button>
                </span>
              )}
              {hasDiscount && (
                <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-800 text-[11px] font-bold px-2.5 py-0.5 rounded-md border border-rose-200">
                  With Offers
                  <button onClick={() => setHasDiscount(false)} className="hover:text-red-500 border-none bg-transparent cursor-pointer p-0 text-rose-800"><X className="h-3 w-3" /></button>
                </span>
              )}
              <button
                type="button"
                onClick={clearAll}
                className="text-[11px] font-bold text-slate-500 hover:text-slate-900 underline ml-auto border-none bg-transparent cursor-pointer"
              >
                Clear All
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════ */}
      {/* MAIN CONTENT AREA                     */}
      {/* ══════════════════════════════════════ */}
      <div className="container mx-auto px-4 py-6 md:py-8">
        {errorMsg && (
          <div className="rounded-2xl mb-6 border border-red-200 bg-red-50 p-5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
              <X className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <p className="font-bold text-red-700 text-sm">Could not load products</p>
              <p className="text-xs text-red-500 mt-0.5">{errorMsg}</p>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-12 gap-6 lg:gap-8">
          {/* ── Desktop Filters ── */}
          <aside className="hidden lg:block lg:col-span-3">
            <div className="sticky top-20 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
              <FiltersUI />
            </div>
          </aside>

          {/* ── Mobile Filter Button ── */}
          <div className="lg:hidden flex items-center justify-between mb-1 gap-3">
            <Sheet>
              <SheetTrigger asChild>
                <button className="flex items-center gap-2 relative bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm cursor-pointer hover:border-amber-300 transition">
                  <SlidersHorizontal className="h-4 w-4" /> Filters
                  {activeFilterCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-amber-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center">
                      {activeFilterCount}
                    </span>
                  )}
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[320px] sm:w-[380px] overflow-auto">
                <SheetHeader><SheetTitle>Filters</SheetTitle></SheetHeader>
                <div className="mt-4"><FiltersUI /></div>
              </SheetContent>
            </Sheet>

            <div className="flex items-center gap-2">
              {/* View mode toggle (mobile) */}
              <div className="flex items-center bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <button onClick={() => setViewMode("grid")}
                  className={`p-2.5 border-none cursor-pointer transition ${viewMode === "grid" ? "bg-[#0A1128] text-amber-400" : "bg-white text-slate-400 hover:bg-slate-50"}`}>
                  <LayoutGrid className="h-4 w-4" />
                </button>
                <button onClick={() => setViewMode("list")}
                  className={`p-2.5 border-none cursor-pointer transition ${viewMode === "list" ? "bg-[#0A1128] text-amber-400" : "bg-white text-slate-400 hover:bg-slate-50"}`}>
                  <List className="h-4 w-4" />
                </button>
              </div>

              {/* Sort (mobile) */}
              <div className="relative">
                <select value={sort} onChange={(e) => setSort(e.target.value)}
                  className="appearance-none border border-slate-200 rounded-xl px-3 py-2.5 pr-8 bg-white text-xs font-bold text-slate-700 shadow-sm cursor-pointer">
                  <option value="popularity">Popularity</option>
                  <option value="newest">Newest</option>
                  <option value="price_low">Price: Low → High</option>
                  <option value="price_high">Price: High → Low</option>
                  <option value="rating">Top Rated</option>
                </select>
                <ChevronDown className="h-3.5 w-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* ── Products Section ── */}
          <main className="lg:col-span-9">
            {/* Desktop toolbar */}
            <div className="hidden lg:flex items-center justify-between mb-5 pb-4 border-b border-slate-200/80">
              <div className="flex items-center gap-3">
                <p className="text-sm text-slate-500 font-semibold">
                  {loading ? "Loading…" : (
                    <>{filtered.length} product{filtered.length !== 1 ? "s" : ""} found {q.trim() && <span className="text-slate-800 font-bold">for "{q.trim()}"</span>}</>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {/* View mode */}
                <div className="flex items-center bg-slate-100 rounded-xl overflow-hidden">
                  <button onClick={() => setViewMode("grid")}
                    className={`p-2 border-none cursor-pointer transition ${viewMode === "grid" ? "bg-[#0A1128] text-amber-400" : "bg-transparent text-slate-400 hover:bg-slate-200"}`}>
                    <LayoutGrid className="h-4 w-4" />
                  </button>
                  <button onClick={() => setViewMode("list")}
                    className={`p-2 border-none cursor-pointer transition ${viewMode === "list" ? "bg-[#0A1128] text-amber-400" : "bg-transparent text-slate-400 hover:bg-slate-200"}`}>
                    <List className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <ArrowUpDown className="h-4 w-4 text-slate-400" />
                  <span className="text-xs text-slate-500 font-bold">Sort:</span>
                  <div className="relative">
                    <select value={sort} onChange={(e) => setSort(e.target.value)}
                      className="appearance-none border border-slate-200 rounded-xl px-4 py-2 pr-8 bg-white text-sm font-bold text-slate-700 cursor-pointer shadow-sm">
                      <option value="popularity">Popularity</option>
                      <option value="newest">Newest First</option>
                      <option value="price_low">Price: Low → High</option>
                      <option value="price_high">Price: High → Low</option>
                      <option value="rating">Top Rated</option>
                    </select>
                    <ChevronDown className="h-4 w-4 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>

            {loading ? (
              <div className={viewMode === "grid" ? "grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5" : "space-y-4"}>
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className={`rounded-2xl border border-slate-200/80 bg-white ${viewMode === "list" ? "flex h-[180px]" : "p-3"}`}>
                    {viewMode === "list" ? (
                      <>
                        <Skeleton className="w-[160px] h-full rounded-l-2xl" />
                        <div className="flex-1 p-4 space-y-3">
                          <Skeleton className="h-5 w-3/4" />
                          <Skeleton className="h-4 w-1/2" />
                          <Skeleton className="h-4 w-1/3" />
                          <Skeleton className="h-10 w-32 rounded-xl" />
                        </div>
                      </>
                    ) : (
                      <>
                        <Skeleton className="h-44 w-full rounded-xl" />
                        <div className="mt-3 space-y-2">
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-4 w-1/2" />
                          <Skeleton className="h-10 w-full rounded-xl" />
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              /* ── PREMIUM EMPTY STATE ── */
              <div className="rounded-3xl bg-white border border-slate-200/80 p-10 md:p-16 text-center shadow-sm">
                <div className="relative w-28 h-28 mx-auto mb-6">
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Search className="w-12 h-12 text-amber-500/60" />
                  </div>
                </div>
                <h3 className="text-2xl md:text-3xl font-black text-[#0A1128] mb-2">
                  No products found
                </h3>
                <p className="text-sm text-slate-500 mb-8 max-w-md mx-auto font-medium">
                  {q.trim() ? (
                    <>We couldn't find any products matching "<span className="font-bold text-slate-700">{q.trim()}</span>". Try adjusting your filters or search term.</>
                  ) : (
                    "Try changing your filters to see more products."
                  )}
                </p>
                <div className="flex gap-3 justify-center flex-wrap">
                  <button onClick={clearAll} className="px-6 py-3 bg-[#0A1128] text-white rounded-xl font-bold text-sm hover:bg-amber-500 hover:text-[#0A1128] transition-all duration-300 border-none cursor-pointer shadow-md flex items-center gap-2">
                    <X className="h-4 w-4" /> Clear All Filters
                  </button>
                  <button onClick={() => navigate("/")} className="px-6 py-3 bg-white text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-50 transition border border-slate-200 cursor-pointer flex items-center gap-2">
                    <ChevronLeft className="h-4 w-4" /> Back to Home
                  </button>
                </div>

                {/* Popular searches */}
                <div className="mt-10 pt-8 border-t border-slate-100">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3">Popular Searches</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {["Flowers", "Milk", "Pooja Kit", "AC Repair", "Biryani", "Vegetables", "Water Can"].map((term) => (
                      <button
                        key={term}
                        onClick={() => setQ(term)}
                        className="px-4 py-2 bg-slate-100 hover:bg-amber-50 hover:border-amber-300 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition cursor-pointer"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <div className={viewMode === "grid" ? "grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-4 md:gap-5" : "space-y-3 sm:space-y-4"}>
                  {paginatedProducts.map((p) => (
                    <ProductCard
                      key={p._id}
                      product={p}
                      wishlistSet={wishlistSet}
                      onToggleWishlist={toggleWishlist}
                      onAddToCart={addToCart}
                      viewMode={viewMode}
                    />
                  ))}
                </div>

                {/* ── PAGINATION CONTROLS ── */}
                {filtered.length > 0 && (
                  <div className="mt-8 bg-white border border-slate-200/90 rounded-2xl px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs font-semibold text-slate-600 shadow-xs">
                    <div className="flex items-center gap-1.5 text-slate-500 text-[11px] sm:text-xs">
                      <span>Showing</span>
                      <span className="font-black text-slate-900">
                        {Math.min((currentPage - 1) * itemsPerPage + 1, filtered.length)} - {Math.min(currentPage * itemsPerPage, filtered.length)}
                      </span>
                      <span>of</span>
                      <span className="font-black text-slate-900">{filtered.length}</span>
                      <span>items</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-bold text-slate-400">Per page:</span>
                        <select
                          value={itemsPerPage}
                          onChange={(e) => {
                            setItemsPerPage(Number(e.target.value));
                            setCurrentPage(1);
                          }}
                          className="bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold px-2 py-1 focus:outline-none cursor-pointer"
                        >
                          <option value={8}>8</option>
                          <option value={12}>12</option>
                          <option value={24}>24</option>
                          <option value={36}>36</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={currentPage === 1}
                          onClick={() => {
                            setCurrentPage((p) => Math.max(p - 1, 1));
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                          className="px-2 py-1 rounded-lg border border-slate-200 text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition cursor-pointer"
                        >
                          ← Prev
                        </button>

                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                          .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                          .map((p, idx, arr) => {
                            const prev = arr[idx - 1];
                            return (
                              <span key={p} className="flex items-center">
                                {prev && p - prev > 1 && <span className="px-1 text-slate-400">…</span>}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setCurrentPage(p);
                                    window.scrollTo({ top: 0, behavior: "smooth" });
                                  }}
                                  className={`w-7 h-7 rounded-lg text-xs font-black transition cursor-pointer border-none ${currentPage === p
                                      ? "bg-[#0A1128] text-[#F3BA12] shadow-xs"
                                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                                    }`}
                                >
                                  {p}
                                </button>
                              </span>
                            );
                          })}

                        <button
                          type="button"
                          disabled={currentPage === totalPages}
                          onClick={() => {
                            setCurrentPage((p) => Math.min(p + 1, totalPages));
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                          className="px-2 py-1 rounded-lg border border-slate-200 text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition cursor-pointer"
                        >
                          Next →
                        </button>
                      </div>
                    </div>
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
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-black text-[#0A1128] flex items-center gap-2">
              🕐 Recently Viewed
            </h2>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
            {recentlyViewed.slice(0, 8).map((p) => (
              <Link
                key={p._id}
                to={`/product/${p._id}`}
                className="flex-shrink-0 w-36 rounded-2xl border border-slate-200/80 bg-white overflow-hidden hover:shadow-lg hover:border-amber-300/60 transition-all duration-300 group"
              >
                <div className="h-24 bg-gradient-to-b from-slate-50 to-white overflow-hidden">
                  <img src={p.images?.[0] || "/placeholder.svg"} alt={p.itemName || p.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                </div>
                <div className="p-2.5">
                  <p className="text-xs font-bold text-slate-800 line-clamp-1">{p.itemName || p.name}</p>
                  <p className="text-xs font-black text-amber-600 mt-0.5">₹{money(Number(p.afterDiscount ?? p.userPrice ?? 0))}</p>
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
