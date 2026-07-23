import { useEffect, useMemo, useState, useCallback } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  MapPin, Store, Filter, Loader2, Star, Phone, ShieldCheck, Tag, ShoppingBag,
  Clock, Percent, Calendar, Heart, ArrowLeft, Plus, Minus, Check, CalendarDays,
  Sparkles, CheckCircle2, ChevronRight, ChevronLeft, X, AlertCircle, Truck
} from "lucide-react";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";

const API_BASE = "https://server.apexbee.in/api";

const getStatusDisplay = (status: string) => {
  switch (status) {
    case "open":
      return { label: "Accepting Orders", classes: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" };
    case "opening_soon":
      return { label: "Opening Soon", classes: "bg-amber-500/20 text-amber-300 border-amber-500/30" };
    case "closing_soon":
      return { label: "Closing Soon", classes: "bg-orange-500/20 text-orange-300 border-orange-500/30" };
    case "busy":
      return { label: "Busy", classes: "bg-red-500/20 text-red-300 border-red-500/30" };
    case "vacation":
      return { label: "On Vacation", classes: "bg-slate-500/20 text-slate-300 border-slate-500/30" };
    case "temporarily_closed":
      return { label: "Temporarily Closed", classes: "bg-red-500/20 text-red-300 border-red-500/30" };
    case "accepting_preorders":
      return { label: "Accepting Pre-orders", classes: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30" };
    default:
      return { label: "Currently Closed", classes: "bg-red-500/20 text-red-300 border-red-500/30" };
  }
};

type Business = {
  _id: string;
  userId: string;
  vendorId: string;
  businessName: string;
  ownerName: string;
  mobile: string;
  email: string;
  address: string;
  pincode: string;
  categories: string[];
  estimatedDeliveryMinutes: number;
  minOrder: number;
  deliveryCharge: number;
  fssaiNumber?: string;
  verifiedBadge?: boolean;
  rating?: {
    average: number;
    totalReviews: number;
  };
  liveStatus: string;
  computedAvailability?: string;
  businessHours: any;
  whatsappNumber?: string;
  gallery?: string[];
  offers?: { title: string; discount: number; startDate: string; endDate: string }[];
  storeDesign?: {
    logoUrl?: string;
    bannerUrl?: string;
    description?: string;
  };
};

type CategoryObj = {
  _id: string;
  name: string;
  image?: string;
};

type Product = {
  _id: string;
  vendorId: string;
  itemName: string;
  images: string[];
  afterDiscount?: number;
  userPrice?: number;
  category?: CategoryObj;
  subcategory?: string;
  status?: string;
  isSubscriptionAvailable?: boolean;
  brand?: string;
  deliveryFee?: number;
};

const StorePage = () => {
  const { id } = useParams(); // id = businessId
  const navigate = useNavigate();
  const [store, setStore] = useState<Business | null>(null);
  const [products, setProducts] = useState<Product[]>([]);

  const [loadingStore, setLoadingStore] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | "ALL">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<'products' | 'about' | 'gallery' | 'policies' | 'hours' | 'reviews'>('products');

  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  // Admin moderation states
  const [editingReview, setEditingReview] = useState<any>(null);
  const [editRating, setEditRating] = useState<number>(5);
  const [editComment, setEditComment] = useState<string>("");

  useEffect(() => {
    if (!store?.vendorId) return;

    const fetchVendorReviews = async () => {
      try {
        setReviewsLoading(true);
        const res = await fetch(`${API_BASE}/reviews/vendor/${store.vendorId}`);
        const data = await res.json();
        if (res.ok && data?.reviews) {
          setReviews(data.reviews);
        }
      } catch (err) {
        console.error("Error loading vendor reviews:", err);
      } finally {
        setReviewsLoading(false);
      }
    };
    fetchVendorReviews();
  }, [store?.vendorId]);

  const handleAdminDelete = async (reviewId: string) => {
    if (!window.confirm("Are you sure you want to delete this review?")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/reviews/${reviewId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to delete review");
      alert("Review deleted successfully!");
      setReviews((prev) => prev.filter((r) => r._id !== reviewId));
    } catch (e: any) {
      alert(e.message || "Delete failed");
    }
  };

  const handleAdminEdit = (review: any) => {
    setEditingReview(review);
    setEditRating(review.rating || 5);
    setEditComment(review.comment || "");
  };

  const handleSaveAdminEdit = async () => {
    if (!editingReview) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/reviews/${editingReview._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          rating: editRating,
          comment: editComment
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update review");
      alert("Review updated successfully!");
      setReviews((prev) =>
        prev.map((r) =>
          r._id === editingReview._id
            ? { ...r, rating: editRating, comment: editComment }
            : r
        )
      );
      setEditingReview(null);
    } catch (e: any) {
      alert(e.message || "Update failed");
    }
  };

  // Cart / Subscriptions modal states
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [subQuantity, setSubQuantity] = useState(1);
  const [subFrequency, setSubFrequency] = useState<"daily" | "alternate" | "weekly" | "monthly" | "custom">("daily");
  const [subCustomDays, setSubCustomDays] = useState<string[]>(["Mon", "Wed", "Fri"]);
  const [subSlot, setSubSlot] = useState("06:00 AM - 07:00 AM");
  const [subSuccess, setSubSuccess] = useState(false);
  const [submittingSub, setSubmittingSub] = useState(false);
  const [cartAddingId, setCartAddingId] = useState<string | null>(null);

  const user = JSON.parse(localStorage.getItem("user") || "null");
  const userId = user?.id || user?._id || "mock-user-123";

  // ✅ Fetch store info
  useEffect(() => {
    if (!id) return;

    (async () => {
      try {
        setLoadingStore(true);
        setError(null);

        const res = await fetch(`${API_BASE}/vendor/${id}`);
        const json = await res.json();

        if (!res.ok || !json?.success) {
          throw new Error(json?.message || "Failed to load store");
        }

        const vendorData = {
          ...json.vendor,
          vendorId: json.vendor._id
        };
        setStore(vendorData);

        // Track recently viewed
        try {
          const list = JSON.parse(localStorage.getItem("mock_recently_viewed") || "[]");
          const filtered = list.filter((item: any) => !(item.id === vendorData.vendorId && item.type === "shop"));
          filtered.unshift({
            id: vendorData.vendorId,
            type: "shop",
            title: vendorData.businessName,
            image: vendorData.storeDesign?.logoUrl || vendorData.logo || "",
            url: `/business/${id}`,
            categoryName: (vendorData.categories && vendorData.categories[0]) || "Local Shop",
            rating: vendorData.rating?.average || 4.7,
            timestamp: new Date().toISOString()
          });
          localStorage.setItem("mock_recently_viewed", JSON.stringify(filtered.slice(0, 15)));
        } catch (e) {
          console.error("Error tracking shop:", e);
        }
      } catch (e: any) {
        setStore(null);
        setError(e?.message || "Failed to load store");
      } finally {
        setLoadingStore(false);
      }
    })();
  }, [id]);

  // ✅ Fetch vendor products
  useEffect(() => {
    if (!store?.vendorId) return;

    (async () => {
      try {
        setLoadingProducts(true);

        const res = await fetch(`${API_BASE}/products/vendor/${store.vendorId}`);
        const json = await res.json();

        if (!res.ok || !json?.success) {
          throw new Error(json?.message || "Failed to load products");
        }

        setProducts(Array.isArray(json.data) ? json.data : []);
      } catch (e: any) {
        setProducts([]);
        setError(e?.message || "Failed to load products");
      } finally {
        setLoadingProducts(false);
      }
    })();
  }, [store?.vendorId]);

  // Unique categories
  const vendorCategories = useMemo(() => {
    const map = new Map<string, CategoryObj>();
    for (const p of products) {
      if (p.category && p.category._id) {
        map.set(p.category._id, p.category);
      }
    }
    return Array.from(map.values());
  }, [products]);

  // Filter products by selected category + search query
  const filteredProducts = useMemo(() => {
    let list = products;
    if (selectedCategoryId !== "ALL") {
      list = list.filter((p) => p.category?._id === selectedCategoryId);
    }
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      list = list.filter((p) =>
        p.itemName.toLowerCase().includes(q) ||
        p.brand?.toLowerCase().includes(q) ||
        p.subcategory?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [products, selectedCategoryId, searchQuery]);

  // ✅ Pagination state for handling 200+ products
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 12;

  // Reset page when search or category changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategoryId, searchQuery]);

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);

  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  // Add to Cart handler
  const handleAddToCart = async (product: Product, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (cartAddingId) return;

    setCartAddingId(product._id);
    const item = {
      userId,
      productId: product._id,
      name: product.itemName,
      price: product.afterDiscount,
      image: product.images?.[0],
      quantity: 1,
      selectedColor: "default",
      vendorId: product.vendorId,
      deliveryFee: product.deliveryFee ?? 0,
    };

    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_BASE}/cart/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(item),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to add to cart.");
      } else {
        // Dispatch storage event to trigger navbar update
        window.dispatchEvent(new Event("storage"));
        alert(`${product.itemName} added to cart!`);
      }
    } catch {
      alert("Error adding to cart");
    } finally {
      setCartAddingId(null);
    }
  };

  // Open Subscription configuration modal
  const openSubscribeModal = (product: Product, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedProduct(product);
    setSubQuantity(1);
    setSubFrequency("daily");
    setSubSuccess(false);
    setIsSubModalOpen(true);
  };

  // Submit subscription
  const handleConfirmSubscription = async () => {
    if (!selectedProduct) return;
    setSubmittingSub(true);

    let userLocation = null;
    try {
      const savedLoc = localStorage.getItem("user_location");
      if (savedLoc) {
        userLocation = JSON.parse(savedLoc);
      }
    } catch (e) {
      console.error(e);
    }

    const subscriptionPayload = {
      userId,
      productId: selectedProduct._id,
      vendorId: selectedProduct.vendorId,
      productName: selectedProduct.itemName,
      productImage: selectedProduct.images?.[0] || "",
      quantity: subQuantity,
      unitPrice: selectedProduct.afterDiscount || 0,
      frequency: subFrequency,
      customDays: subFrequency === "custom" ? subCustomDays : undefined,
      deliverySlot: subSlot,
      autoRenew: true,
      userLocation
    };

    try {
      const res = await fetch(`${API_BASE}/local-shop/subscriptions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscriptionPayload),
      });
      const json = await res.json();
      if (json?.success) {
        setSubSuccess(true);
        setTimeout(() => {
          setIsSubModalOpen(false);
          setSubSuccess(false);
        }, 1800);
      } else {
        alert(json?.message || "Failed to create subscription.");
      }
    } catch {
      alert("Error creating subscription. Please try again.");
    } finally {
      setSubmittingSub(false);
    }
  };

  const toggleCustomDay = (day: string) => {
    if (subCustomDays.includes(day)) {
      if (subCustomDays.length > 1) {
        setSubCustomDays(subCustomDays.filter((d) => d !== day));
      }
    } else {
      setSubCustomDays([...subCustomDays, day]);
    }
  };

  const estimatedMonthlyDeliveries = useMemo(() => {
    if (subFrequency === "daily") return 30;
    if (subFrequency === "alternate") return 15;
    if (subFrequency === "weekly") return 4;
    if (subFrequency === "monthly") return 1;
    if (subFrequency === "custom") return subCustomDays.length * 4;
    return 30;
  }, [subFrequency, subCustomDays]);

  const estimatedCost = useMemo(() => {
    if (!selectedProduct) return 0;
    const price = selectedProduct.afterDiscount || 0;
    return price * subQuantity * estimatedMonthlyDeliveries;
  }, [selectedProduct, subQuantity, estimatedMonthlyDeliveries]);

  const formatPrice = (n?: number) =>
    typeof n === "number" ? `₹${n.toFixed(0)}` : "₹0";

  if (loadingStore) {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-between">
        <div>
          <Navbar />
          <div className="container mx-auto px-4 py-10">
            <div className="rounded-3xl border bg-white p-6 animate-pulse">
              <div className="flex items-center gap-4">
                <Skeleton className="h-20 w-20 rounded-2xl bg-muted" />
                <div className="flex-1 space-y-3">
                  <Skeleton className="h-5 w-1/3 bg-muted" />
                  <Skeleton className="h-4 w-2/3 bg-muted" />
                </div>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !store) {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-between">
        <div>
          <Navbar />
          <div className="container mx-auto px-4 py-20 text-center">
            <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-navy mb-2">Store Unreachable</h2>
            <p className="text-muted-foreground mb-6">{error || "The local shop details could not be loaded."}</p>
            <Link to="/local-stores">
              <Button className="bg-navy hover:bg-navy/90 text-white rounded-xl">
                Back to Local Shops
              </Button>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const isDailyEssentialVendor = ["Dairy & Milk", "Grocery", "Fruits & Vegetables", "Bakery", "Water Suppliers"].includes(store.category || "");

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <div>
        <Navbar />

        {/* BREADCRUMB / BACK ACTION */}
        <div className="container mx-auto px-4 pt-6">
          <button
            onClick={() => navigate("/local-stores")}
            className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-navy transition"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Local Shops
          </button>
        </div>

        {/* ✅ STORE BANNER */}
        <section className="container mx-auto px-4 pt-4">
          <div className="relative overflow-hidden rounded-3xl border border-navy/10 bg-slate-950 text-white shadow-xl min-h-[220px] flex items-end">
            {/* Banner Background Image */}
            {store.storeDesign?.bannerUrl ? (
              <div className="absolute inset-0 z-0">
                <img src={store.storeDesign.bannerUrl} alt="Store Cover" className="w-full h-full object-cover opacity-40" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
              </div>
            ) : (
              <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/95 to-slate-900 z-0">
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute -top-16 -left-16 h-72 w-72 rounded-full bg-accent blur-3xl" />
                  <div className="absolute -bottom-20 -right-16 h-72 w-72 rounded-full bg-indigo-500 blur-3xl" />
                </div>
              </div>
            )}

            <div className="relative z-10 p-6 sm:p-8 w-full flex flex-col md:flex-row gap-6 md:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-6 sm:items-center">
                {/* Logo Avatar */}
                <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl bg-white border border-white/20 overflow-hidden flex items-center justify-center shrink-0 shadow-lg">
                  {store.storeDesign?.logoUrl || store.logo ? (
                    <img src={store.storeDesign?.logoUrl || store.logo} alt={store.businessName} className="h-full w-full object-cover" />
                  ) : (
                    <Store className="h-10 w-10 text-slate-400" />
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight truncate">
                      {store.businessName}
                    </h1>
                    {store.verifiedBadge && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500 text-white text-[10px] font-black uppercase tracking-wider shadow-sm">
                        Verified
                      </span>
                    )}
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-xs font-semibold shadow-sm ${getStatusDisplay(store.computedAvailability || "closed").classes}`}>
                      ● {getStatusDisplay(store.computedAvailability || "closed").label}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs sm:text-sm text-slate-300">
                    <div className="inline-flex items-center gap-1">
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                      <span className="font-bold text-white">{store.rating?.average || 5.0}</span>
                      <span className="text-slate-400">({store.rating?.totalReviews || 0} reviews)</span>
                    </div>

                    <div className="inline-flex items-center gap-1.5 min-w-0">
                      <MapPin className="h-4 w-4 text-accent" />
                      <span className="truncate max-w-[200px]">
                        {store.pincode ? `Pincode: ${store.pincode}` : "Local Store"}
                      </span>
                    </div>

                    {store.fssaiNumber && (
                      <span className="inline-flex items-center gap-1 bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[10px] font-mono border border-slate-700">
                        FSSAI: {store.fssaiNumber}
                      </span>
                    )}
                  </div>

                  <p className="mt-2.5 text-xs text-slate-400 line-clamp-2 max-w-xl">
                    {store.address}
                  </p>
                </div>
              </div>

              {/* Actions & Logistics */}
              <div className="flex flex-wrap gap-2.5 self-start md:self-center">
                {store.mobile && (
                  <Button
                    variant="outline"
                    className="bg-white/10 hover:bg-white/20 text-white border-white/20 font-bold rounded-xl flex items-center gap-1.5 shrink-0 shadow-md transition"
                    onClick={() => window.open(`tel:${store.mobile}`, "_self")}
                  >
                    <Phone className="h-4 w-4 text-accent" />
                    Call
                  </Button>
                )}

                {store.whatsappNumber && (
                  <Button
                    className="bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl flex items-center gap-1.5 shrink-0 shadow-md transition border-0"
                    onClick={() => window.open(`https://wa.me/${store.whatsappNumber.replace(/[^0-9]/g, "")}`, "_blank")}
                  >
                    💬 WhatsApp
                  </Button>
                )}

                {store.location?.coordinates && (
                  <Button
                    variant="outline"
                    className="bg-white/10 hover:bg-white/20 text-white border-white/20 font-bold rounded-xl flex items-center gap-1.5 shrink-0 shadow-md transition"
                    onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${store.location?.coordinates[1]},${store.location?.coordinates[0]}`, "_blank")}
                  >
                    🗺️ Directions
                  </Button>
                )}

                <div className="px-3.5 py-1.5 rounded-xl bg-white/15 border border-white/15 text-center shrink-0">
                  <p className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Delivery Time</p>
                  <p className="text-xs font-extrabold text-white">{store.estimatedDeliveryMinutes || 30} Mins</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ✅ ACTIVE OFFERS / COUPONS */}
        <section className="container mx-auto px-4 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {store.offers && store.offers.length > 0 ? (
              store.offers.map((offer, idx) => (
                <div key={idx} className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 text-emerald-800">
                  <div className="p-3 rounded-xl bg-emerald-600 text-white shadow-md">
                    <Percent className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">Promo Offer</p>
                    <h3 className="text-sm font-extrabold text-navy">{offer.title}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Discount: {offer.discount}% • Valid until {new Date(offer.endDate).toLocaleDateString()}</p>
                  </div>
                </div>
              ))
            ) : (
              <>
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-orange-500/20 text-orange-800">
                  <div className="p-3 rounded-xl bg-accent text-white shadow-md">
                    <Percent className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold uppercase tracking-wider text-accent">Daily essentials special</p>
                    <h3 className="text-sm font-extrabold text-navy">Subscribe & Save 10% on monthly bill</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Applies automatically on checkout of subscriptions</p>
                  </div>
                  <div className="px-3 py-1 rounded-lg border border-dashed border-orange-400 bg-orange-500/5 text-xs font-mono font-bold tracking-wider">
                    APEXDAILY
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-500/20 text-blue-800">
                  <div className="p-3 rounded-xl bg-indigo-600 text-white shadow-md">
                    <Truck className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold uppercase tracking-wider text-indigo-600 font-bold">First time discount</p>
                    <h3 className="text-sm font-extrabold text-navy">Free Delivery on items above ₹150</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">For one-time purchase or instant orders</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </section>

        {/* STORE SUB-TABS NAVIGATION BAR */}
        <section className="container mx-auto px-4 mt-6 select-none">
          <div className="flex gap-2 border-b border-slate-200 overflow-x-auto pb-1 scrollbar-none">
            {[
              { key: 'products', label: 'Products Catalog', icon: '🛍️' },
              { key: 'reviews', label: `Reviews (${reviews.length})`, icon: '⭐' },
              { key: 'about', label: 'About Store', icon: 'ℹ️' },
              { key: 'gallery', label: 'Store Gallery', icon: '🖼️' },
              { key: 'policies', label: 'Return Policies', icon: '🛡️' },
              { key: 'hours', label: 'Operating Hours', icon: '⏰' }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`px-5 py-3 text-xs sm:text-sm font-extrabold border-b-2 transition whitespace-nowrap ${activeTab === tab.key
                  ? 'border-accent text-accent'
                  : 'border-transparent text-muted-foreground hover:text-navy'
                  }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </section>

        {/* TAB CONTENT: PRODUCTS CATALOG */}
        {activeTab === 'products' && (
          <>
            {/* SEARCH & FILTERS BAR */}
            <section className="container mx-auto px-4 py-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-navy flex items-center gap-2">
                    <ShoppingBag className="h-5 w-5 text-accent" />
                    Browse Store Products
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Select a category or search below to order or subscribe</p>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                  <div className="relative flex-1 md:w-72">
                    <Input
                      type="text"
                      placeholder="Search products..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="rounded-xl border border-slate-200 bg-white pr-10 focus:ring-accent"
                    />
                  </div>
                  {searchQuery && (
                    <Button variant="ghost" className="rounded-xl" onClick={() => setSearchQuery("")}>
                      Clear
                    </Button>
                  )}
                </div>
              </div>

              {/* CATEGORIES CHIPS */}
              <div className="mt-5 flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                <button
                  onClick={() => setSelectedCategoryId("ALL")}
                  className={`px-5 py-2.5 rounded-full border text-xs font-bold transition whitespace-nowrap shadow-sm ${selectedCategoryId === "ALL"
                    ? "bg-accent text-white border-accent"
                    : "bg-white text-navy border-slate-200 hover:bg-slate-50"
                    }`}
                >
                  🛍️ All Products
                </button>

                {vendorCategories.map((c) => (
                  <button
                    key={c._id}
                    onClick={() => setSelectedCategoryId(c._id)}
                    className={`px-5 py-2.5 rounded-full border text-xs font-bold transition whitespace-nowrap shadow-sm ${selectedCategoryId === c._id
                      ? "bg-accent text-white border-accent"
                      : "bg-white text-navy border-slate-200 hover:bg-slate-50"
                      }`}
                  >
                    📦 {c.name}
                  </button>
                ))}
              </div>
            </section>

            {/* PRODUCTS GRID */}
            <section className="container mx-auto px-4 pb-16">
              {loadingProducts ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-6">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="rounded-2xl sm:rounded-3xl border bg-white p-3 sm:p-4 space-y-3 shadow-sm animate-pulse">
                      <Skeleton className="h-36 sm:h-48 w-full rounded-xl sm:rounded-2xl bg-slate-100" />
                      <Skeleton className="h-4 w-3/4 bg-slate-100" />
                      <Skeleton className="h-4 w-1/2 bg-slate-100" />
                      <Skeleton className="h-8 w-full rounded-xl bg-slate-100" />
                    </div>
                  ))}
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="rounded-3xl border bg-white p-8 sm:p-12 text-center shadow-sm max-w-lg mx-auto">
                  <ShoppingBag className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground/60 mx-auto mb-3" />
                  <h3 className="font-extrabold text-navy text-base sm:text-lg">No Matching Items</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">We couldn't find any products in this view. Try adjusting your query or category selection.</p>
                  <Button
                    variant="outline"
                    className="mt-5 rounded-xl border-navy/20 hover:bg-slate-50 text-xs"
                    onClick={() => {
                      setSelectedCategoryId("ALL");
                      setSearchQuery("");
                    }}
                  >
                    Reset Search
                  </Button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-6">
                    {paginatedProducts.map((p) => {
                      const subAvailable =
                        p.isSubscriptionAvailable === true &&
                        (p.status === 'Live' || p.status === undefined) &&
                        p.isStoreProduct !== false;
                      return (
                        <div
                          key={p._id}
                          className="group flex flex-col justify-between rounded-2xl sm:rounded-3xl border border-slate-100 bg-white overflow-hidden hover:shadow-xl transition duration-300 relative"
                        >
                          <div>
                            {/* Image */}
                            <div className="h-36 sm:h-48 bg-slate-50 overflow-hidden relative border-b border-slate-100">
                              <img
                                src={p.images?.[0] || "/placeholder-product.png"}
                                alt={p.itemName}
                                className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                                loading="lazy"
                              />
                              <div className="absolute top-2 left-2 flex flex-col gap-1">
                                {subAvailable && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-500 text-white text-[8px] sm:text-[10px] font-extrabold tracking-wide uppercase shadow-sm">
                                    <Sparkles className="h-2.5 w-2.5 fill-white" />
                                    Subscribe
                                  </span>
                                )}
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-navy text-white text-[8px] sm:text-[10px] font-extrabold tracking-wide uppercase shadow-sm">
                                  <Clock className="h-2.5 w-2.5" />
                                  Fast Delivery
                                </span>
                              </div>
                            </div>

                            <div className="p-3 sm:p-5 text-left">
                              <p className="text-[9px] sm:text-[10px] font-bold text-accent uppercase tracking-wider mb-1 hidden md:block">
                                {p.brand || "Fresh & Local"}
                              </p>
                              <h3 className="font-extrabold text-navy line-clamp-2 min-h-[32px] sm:min-h-[44px] leading-tight text-xs sm:text-base hover:text-accent transition">
                                {p.itemName}
                              </h3>

                              <div className="mt-2 sm:mt-3 flex items-baseline gap-1.5">
                                <span className="text-base sm:text-xl font-black text-navy">
                                  {formatPrice(p.afterDiscount)}
                                </span>
                                {p.userPrice && p.userPrice > (p.afterDiscount || 0) ? (
                                  <span className="text-[10px] sm:text-xs text-muted-foreground line-through font-semibold">
                                    {formatPrice(p.userPrice)}
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          </div>

                          <div className="px-3 pb-3 sm:px-5 sm:pb-5 pt-0 flex flex-col gap-1.5 sm:gap-2">
                            <Button
                              className="w-full bg-navy hover:bg-navy/90 text-white rounded-xl py-1.5 sm:py-2 flex items-center justify-center gap-1.5 font-bold transition shadow-sm text-[10px] sm:text-xs"
                              disabled={cartAddingId === p._id}
                              onClick={(e) => handleAddToCart(p, e)}
                            >
                              {cartAddingId === p._id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <ShoppingBag className="h-3 w-3" />
                              )}
                              Buy Now
                            </Button>

                            {subAvailable && (
                              <Button
                                variant="outline"
                                className="w-full border-orange-500/30 bg-orange-50/20 text-accent hover:bg-orange-50 hover:text-accent-dark rounded-xl py-1.5 sm:py-2 font-extrabold transition text-[10px] sm:text-xs border flex items-center justify-center gap-1 shadow-sm"
                                onClick={(e) => openSubscribeModal(p, e)}
                              >
                                <CalendarDays className="h-3 w-3" />
                                Subscribe
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* ✅ Pagination Controls Bar for 200+ products */}
                  {totalPages > 1 && (
                    <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                      <div className="text-xs font-bold text-slate-500">
                        Showing <span className="text-navy font-black">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> - <span className="text-navy font-black">{Math.min(currentPage * ITEMS_PER_PAGE, filteredProducts.length)}</span> of <span className="text-accent font-black">{filteredProducts.length}</span> Products
                      </div>

                      <div className="flex items-center gap-1.5 font-sans">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={currentPage === 1}
                          onClick={() => {
                            setCurrentPage((p) => Math.max(1, p - 1));
                            window.scrollTo({ top: 400, behavior: "smooth" });
                          }}
                          className="rounded-xl text-xs font-bold text-navy"
                        >
                          <ChevronLeft className="h-4 w-4 mr-1" /> Prev
                        </Button>

                        {Array.from({ length: totalPages }).map((_, idx) => {
                          const pageNum = idx + 1;
                          if (
                            pageNum === 1 ||
                            pageNum === totalPages ||
                            (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                          ) {
                            return (
                              <button
                                key={pageNum}
                                onClick={() => {
                                  setCurrentPage(pageNum);
                                  window.scrollTo({ top: 400, behavior: "smooth" });
                                }}
                                className={`w-8 h-8 rounded-xl text-xs font-black transition cursor-pointer border ${
                                  currentPage === pageNum
                                    ? "bg-[#0A1128] text-white border-[#0A1128] shadow-sm"
                                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          }
                          if (pageNum === 2 && currentPage > 3) {
                            return <span key="dots-left" className="px-1 text-slate-400 font-bold">...</span>;
                          }
                          if (pageNum === totalPages - 1 && currentPage < totalPages - 2) {
                            return <span key="dots-right" className="px-1 text-slate-400 font-bold">...</span>;
                          }
                          return null;
                        })}

                        <Button
                          variant="outline"
                          size="sm"
                          disabled={currentPage === totalPages}
                          onClick={() => {
                            setCurrentPage((p) => Math.min(totalPages, p + 1));
                            window.scrollTo({ top: 400, behavior: "smooth" });
                          }}
                          className="rounded-xl text-xs font-bold text-navy"
                        >
                          Next <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </section>
          </>
        )}

        {/* TAB CONTENT: ABOUT STORE */}
        {activeTab === 'about' && (
          <section className="container mx-auto px-4 py-8 max-w-4xl">
            <div className="bg-white border rounded-3xl p-6 sm:p-8 text-left shadow-sm space-y-6">
              <div className="space-y-2">
                <h2 className="text-lg font-bold text-navy">About Our Shop</h2>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {store.storeDesign?.description || "Welcome to our hyperlocal store! We deliver high quality products directly to your doorstep in minutes."}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-100 pt-5 text-xs text-navy">
                <div className="space-y-1">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold">Authorized Owner</span>
                  <p className="font-bold">{store.ownerName}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold">Corporate Address</span>
                  <p className="font-bold leading-normal">{store.address}</p>
                </div>
                {store.fssaiNumber && (
                  <div className="space-y-1">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold">FSSAI Registry</span>
                    <p className="font-bold">{store.fssaiNumber}</p>
                  </div>
                )}
                <div className="space-y-1">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold">Marketplace Status</span>
                  <div className="flex items-center gap-1 mt-0.5">
                    <ShieldCheck className="h-4 w-4 text-emerald-500" />
                    <span className="font-bold">Verified Hyperlocal Merchant</span>
                  </div>
                </div>
              </div>

              {/* Services & tags */}
              {((store as any).storeServices?.length > 0 || (store as any).storeTags?.length > 0) && (
                <div className="border-t border-slate-100 pt-5 space-y-4">
                  {(store as any).storeServices?.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold block">Available Delivery Services</span>
                      <div className="flex flex-wrap gap-2">
                        {(store as any).storeServices.map((s: string) => (
                          <span key={s} className="px-3 py-1 rounded-xl bg-primary/10 border border-primary/20 text-primary text-xs font-semibold">{s}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {(store as any).storeTags?.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold block">Discoverability Badges</span>
                      <div className="flex flex-wrap gap-2">
                        {(store as any).storeTags.map((t: string) => (
                          <span key={t} className="px-3 py-1 rounded-xl bg-slate-100 border text-slate-600 text-xs font-semibold">#{t}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
        )}

        {/* TAB CONTENT: STORE GALLERY */}
        {activeTab === 'gallery' && (
          <section className="container mx-auto px-4 py-8 max-w-4xl">
            <div className="bg-white border rounded-3xl p-6 sm:p-8 text-center shadow-sm">
              {store.gallery && store.gallery.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {store.gallery.map((imgUrl, index) => (
                    <div key={index} className="h-48 rounded-2xl overflow-hidden border bg-slate-50 shadow-sm relative group">
                      <img src={imgUrl} alt={`Store Gallery ${index + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" loading="lazy" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 space-y-2 text-muted-foreground text-xs select-none">
                  <Store className="h-10 w-10 text-muted-foreground/45 mx-auto" />
                  <p className="font-semibold text-navy">No gallery photos uploaded</p>
                  <p>Check back later to see photos of this shop's inventory & premises.</p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* TAB CONTENT: POLICIES */}
        {activeTab === 'policies' && (
          <section className="container mx-auto px-4 py-8 max-w-4xl">
            <div className="bg-white border rounded-3xl p-6 sm:p-8 text-left shadow-sm space-y-6">
              <div className="space-y-2.5">
                <h3 className="font-bold text-navy flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  Storefront Refund Policy
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed pl-5.5">
                  {(store as any).refundPolicy || "Standard marketplace refund policy applies. Refunds are processed automatically if request is made within 24 hours of delivery and items are returned in unopened condition."}
                </p>
              </div>

              <div className="space-y-2.5 border-t border-slate-100 pt-5">
                <h3 className="font-bold text-navy flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  Storefront Replacement Policy
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed pl-5.5">
                  {(store as any).replacementPolicy || "Standard replacement policy applies. Free replacement is initiated if damaged, wrong, or spoiled goods are delivered. Contact support with images within 2 hours of receipt."}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* TAB CONTENT: OPERATING HOURS */}
        {activeTab === 'hours' && (
          <section className="container mx-auto px-4 py-8 max-w-4xl">
            <div className="bg-white border rounded-3xl p-6 sm:p-8 text-left shadow-sm space-y-4">
              <h3 className="font-bold text-navy flex items-center gap-1.5 border-b pb-3 mb-2">
                <Clock className="h-4.5 w-4.5 text-accent" />
                Weekly Business Hours Schedule
              </h3>

              {store.businessHours && Object.keys(store.businessHours).length > 0 ? (
                <div className="border border-slate-100 rounded-2xl overflow-hidden text-xs text-navy">
                  <div className="grid grid-cols-3 bg-slate-50 p-3 font-bold border-b border-slate-100 text-muted-foreground">
                    <span>Day</span>
                    <span>Status</span>
                    <span>Timing</span>
                  </div>
                  {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => {
                    const settings = store.businessHours[day] || { open: '09:00', close: '21:00', enabled: false };
                    return (
                      <div key={day} className="grid grid-cols-3 p-3 items-center border-b border-slate-50 last:border-none">
                        <span className="font-bold capitalize">{day}</span>
                        <div>
                          <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${settings.enabled ? 'bg-green-50 text-green-700' : 'bg-rose-50 text-rose-700'
                            }`}>
                            {settings.enabled ? 'Open' : 'Closed'}
                          </span>
                        </div>
                        <span className="font-mono text-muted-foreground">
                          {settings.enabled ? `${settings.open} - ${settings.close}` : '—'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-12 text-center text-muted-foreground text-xs select-none">
                  <Clock className="h-10 w-10 text-muted-foreground/45 mx-auto" />
                  <p className="font-semibold text-navy">Business hours not configured</p>
                  <p>Operating times are subject to vendor availability.</p>
                </div>
              )}
            </div>
          </section>
        )}

        {activeTab === 'reviews' && (
          <section className="container mx-auto px-4 py-8 max-w-4xl">
            <div className="bg-white border border-gray-150 rounded-3xl p-6 sm:p-8 text-left shadow-sm">
              <h3 className="font-bold text-navy flex items-center gap-1.5 border-b pb-3 mb-6">
                <Star className="h-4.5 w-4.5 text-accent" />
                Customer Reviews
              </h3>

              {reviewsLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="rounded-2xl border bg-white p-5 animate-pulse">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-28 bg-slate-100 rounded" />
                        <div className="h-4 w-40 bg-slate-100 rounded" />
                      </div>
                      <div className="mt-3 h-4 w-2/3 bg-slate-100 rounded" />
                    </div>
                  ))}
                </div>
              ) : reviews.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground text-xs select-none">
                  <Star className="h-10 w-10 text-muted-foreground/45 mx-auto mb-2" />
                  <p className="font-semibold text-navy">No reviews yet</p>
                  <p>Be the first customer to purchase and write a review!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((r) => (
                    <div key={r._id} className="rounded-2xl border bg-slate-50/50 p-5">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className="flex text-amber-400">
                            {Array.from({ length: r.rating || 5 }).map((_, i) => (
                              <Star key={i} className="w-3.5 h-3.5 fill-current" />
                            ))}
                          </div>
                          <span className="text-sm font-semibold text-[#0A1128]">
                            {r.userId?.name || r.userId?.email || "Customer"}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground">
                            {r.createdAt ? new Date(r.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : ""}
                          </span>
                          {user?.role === "admin" && (
                            <div className="flex items-center gap-2 border-l pl-3 border-gray-200">
                              <button
                                onClick={() => handleAdminEdit(r)}
                                className="text-xs text-blue-600 hover:underline font-bold"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleAdminDelete(r._id)}
                                className="text-xs text-red-600 hover:underline font-bold"
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {r.productId && (
                        <div className="mt-3 flex items-center gap-2 bg-white rounded-xl p-2 border border-slate-100 max-w-sm">
                          {r.productId.thumbnail && (
                            <img
                              src={r.productId.thumbnail}
                              alt={r.productId.name}
                              className="w-8 h-8 object-cover rounded-lg border"
                            />
                          )}
                          <span className="text-xs font-bold text-navy truncate">
                            Reviewed: {r.productId.name}
                          </span>
                        </div>
                      )}

                      {r.title && <h4 className="mt-3 font-bold text-navy text-sm">{r.title}</h4>}
                      {r.comment && <p className="mt-2 text-xs sm:text-sm text-gray-500 leading-relaxed">{r.comment}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}
      </div>

      {editingReview && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-xl text-left border border-gray-150">
            <h3 className="text-lg font-black text-navy mb-4">Edit Customer Review</h3>

            <div className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setEditRating(num)}
                      className={`w-10 h-10 rounded-xl border text-sm font-black transition ${editRating === num
                        ? "bg-[#F3BA12] text-[#0A1128] border-[#F3BA12]"
                        : "bg-slate-50 text-gray-400 border-gray-200 hover:bg-slate-100"
                        }`}
                    >
                      {num}★
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">Review Comment</label>
                <textarea
                  value={editComment}
                  onChange={(e) => setEditComment(e.target.value)}
                  rows={4}
                  className="w-full rounded-xl border border-gray-200 p-3 text-sm focus:border-navy focus:outline-none bg-slate-50 text-navy font-medium"
                  placeholder="Write review details..."
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setEditingReview(null)}
                className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-700 bg-slate-50 hover:bg-slate-100 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAdminEdit}
                className="px-4 py-2 text-xs font-bold bg-[#0A1128] text-white hover:bg-navy rounded-xl transition"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />

      {/* ✅ SUBSCRIPTION SETUP MODAL */}
      {isSubModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-navy/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsSubModalOpen(false)}
          />

          {/* Dialog Content */}
          <div className="relative bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            {/* Close Button */}
            <button
              onClick={() => setIsSubModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-navy hover:bg-slate-100 transition"
            >
              <X className="h-5 w-5" />
            </button>

            {subSuccess ? (
              <div className="text-center py-10 flex flex-col items-center justify-center">
                <div className="h-20 w-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6 animate-bounce shadow-md">
                  <Check className="h-10 w-10 stroke-[3]" />
                </div>
                <h3 className="text-2xl font-black text-navy">Subscription Scheduled!</h3>
                <p className="text-sm text-muted-foreground mt-2 max-w-sm">
                  Your daily essential subscription for <strong>{selectedProduct.itemName}</strong> was successfully setup.
                </p>
                <p className="text-xs text-accent font-bold mt-4">Enjoy early morning door delivery! 🚚</p>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-2 text-accent font-extrabold text-xs uppercase tracking-wider mb-2">
                  <Sparkles className="h-4 w-4 fill-accent" />
                  ApexBee Essentials Subscription
                </div>
                <h3 className="text-xl font-extrabold text-navy">Configure Subscription</h3>

                {/* Product Detail Strip */}
                <div className="flex gap-4 p-4 bg-slate-50 border border-slate-100 rounded-2xl mt-4">
                  <div className="h-16 w-16 rounded-xl overflow-hidden bg-white shrink-0 border border-slate-200/60 shadow-sm">
                    <img src={selectedProduct.images?.[0]} alt={selectedProduct.itemName} className="h-full w-full object-cover" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-navy leading-tight line-clamp-1">{selectedProduct.itemName}</h4>
                    <p className="text-xs text-muted-foreground font-semibold mt-0.5">{selectedProduct.brand}</p>
                    <p className="text-sm font-black text-navy mt-1.5">{formatPrice(selectedProduct.afterDiscount)} <span className="text-[10px] text-muted-foreground font-normal">/ unit</span></p>
                  </div>
                </div>

                {/* Quantity Selector */}
                <div className="mt-6">
                  <label className="text-sm font-extrabold text-navy block mb-2">Quantity per Delivery</label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setSubQuantity(Math.max(1, subQuantity - 1))}
                      className="h-10 w-10 border border-slate-200 rounded-xl flex items-center justify-center font-bold text-navy hover:bg-slate-50 transition shadow-sm"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="text-base font-black w-8 text-center text-navy">{subQuantity}</span>
                    <button
                      onClick={() => setSubQuantity(subQuantity + 1)}
                      className="h-10 w-10 border border-slate-200 rounded-xl flex items-center justify-center font-bold text-navy hover:bg-slate-50 transition shadow-sm"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                    <span className="text-xs text-muted-foreground ml-2">Estimated daily needs.</span>
                  </div>
                </div>

                {/* Frequency Settings */}
                <div className="mt-6">
                  <label className="text-sm font-extrabold text-navy block mb-2">Delivery Schedule</label>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {[
                      { key: "daily", label: "Daily" },
                      { key: "alternate", label: "Alternate" },
                      { key: "weekly", label: "Weekly" },
                      { key: "monthly", label: "Monthly" },
                      { key: "custom", label: "Custom" },
                    ].map((f) => (
                      <button
                        key={f.key}
                        type="button"
                        onClick={() => setSubFrequency(f.key as any)}
                        className={`py-2 px-1 rounded-xl text-xs font-bold border transition ${subFrequency === f.key
                          ? "bg-accent border-accent text-white shadow-sm"
                          : "bg-white border-slate-200 text-navy hover:bg-slate-50"
                          }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>

                  {/* Custom Days selection */}
                  {subFrequency === "custom" && (
                    <div className="mt-3 bg-slate-50 border border-slate-100 p-3 rounded-2xl">
                      <p className="text-xs font-bold text-navy mb-2">Select Delivery Days:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => {
                          const active = subCustomDays.includes(day);
                          return (
                            <button
                              key={day}
                              type="button"
                              onClick={() => toggleCustomDay(day)}
                              className={`py-1.5 px-3 rounded-lg text-xs font-bold border transition ${active
                                ? "bg-navy border-navy text-white shadow-sm"
                                : "bg-white border-slate-200 text-navy hover:bg-slate-50"
                                }`}
                            >
                              {day}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Delivery Slot Selection */}
                <div className="mt-6">
                  <label className="text-sm font-extrabold text-navy block mb-2">Preferred Delivery Time Slot</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                      { key: "06:00 AM - 07:00 AM", desc: "Early Morning (Milk/Newspaper recommended)" },
                      { key: "07:00 AM - 08:00 AM", desc: "Morning Rush" },
                      { key: "08:00 AM - 09:00 AM", desc: "Breakfast Delivery" },
                      { key: "05:00 PM - 07:00 PM", desc: "Evening Delivery" },
                    ].map((slot) => (
                      <button
                        key={slot.key}
                        type="button"
                        onClick={() => setSubSlot(slot.key)}
                        className={`p-3 rounded-2xl text-left border transition flex flex-col gap-0.5 ${subSlot === slot.key
                          ? "bg-navy/5 border-navy text-navy font-extrabold ring-2 ring-navy/20"
                          : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                          }`}
                      >
                        <span className="text-xs font-extrabold">{slot.key}</span>
                        <span className="text-[10px] text-muted-foreground font-normal">{slot.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Billing Summary Preview */}
                <div className="mt-6 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20">
                  <div className="flex justify-between items-center text-xs font-bold text-navy">
                    <span>Item price:</span>
                    <span>{formatPrice(selectedProduct.afterDiscount)} x {subQuantity} unit(s)</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-bold text-navy mt-1.5">
                    <span>Delivery frequency:</span>
                    <span className="capitalize">{subFrequency} ({estimatedMonthlyDeliveries} days/month)</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-bold text-emerald-600 mt-1.5">
                    <span>Delivery Fee:</span>
                    <span className="font-extrabold">FREE Subscription Delivery</span>
                  </div>
                  <div className="h-px bg-slate-200 my-2.5" />
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-extrabold text-navy">Est. Monthly Cost:</span>
                    <span className="text-lg font-black text-navy">{formatPrice(estimatedCost)}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1.5 leading-normal">
                    *Estimated monthly cost assumes standard 30-day month. Actual billing is dynamic based on exact deliveries. You will only be billed when the order is packed and dispatched.
                  </p>
                </div>

                {/* Action button */}
                <div className="mt-6 flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1 rounded-xl py-3 border-slate-200 text-navy font-bold hover:bg-slate-50 text-xs"
                    onClick={() => setIsSubModalOpen(false)}
                    disabled={submittingSub}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1 bg-accent hover:bg-accent-dark text-white font-extrabold rounded-xl py-3 text-xs flex items-center justify-center gap-1.5 shadow-md shadow-orange-500/20"
                    onClick={handleConfirmSubscription}
                    disabled={submittingSub}
                  >
                    {submittingSub ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                    Confirm Subscription
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StorePage;

