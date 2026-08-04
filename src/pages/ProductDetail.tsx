import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Star, Share2, Image as ImageIcon } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";

// Helper function for currency formatting
const formatCurrency = (amount: any) => {
  const value = typeof amount === "number" && !isNaN(amount) ? amount : Number(amount || 0);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const API_BASE = import.meta.env.VITE_API_URL || "https://server.apexbee.in/api";

const initialProduct: any = {
  _id: null,
  itemName: "Loading Product...",
  categoryName: "Loading",
  salesPrice: 0,
  userPrice: 0,
  afterDiscount: 0,
  discount: 0,
  images: ["/placeholder.svg"],
  rating: 4,
  vendorId: null,
  description: "Product details loading...",
  skuCode: "N/A",
  deliveryFee: 0, // ✅ added default
};

type Review = {
  _id: string;
  rating: number;
  title?: string;
  comment?: string;
  images?: string[];
  isVerifiedPurchase?: boolean;
  createdAt?: string;
  userId?: { _id?: string; name?: string; email?: string } | string;
};

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState<any>(initialProduct);
  const [similarProducts, setSimilarProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [quantity, setQuantity] = useState(1);
  const [mainImageIndex, setMainImageIndex] = useState(0);
  const [showShare, setShowShare] = useState(false);

  // Variant & attributes selection state
  const [selectedAttrs, setSelectedAttrs] = useState<Record<string, string>>({});

  // Deduplicate attributes for rendering (extracts from both product.attributes and product.variants)
  const formattedAttributes = useMemo(() => {
    const resultMap = new Map<string, { key: string; label: string; values: string[]; valueStr: string }>();

    // 1. Extract from product.attributes
    if (product?.attributes && typeof product.attributes === 'object') {
      Object.entries(product.attributes).forEach(([key, rawVal]) => {
        if (rawVal === undefined || rawVal === null || rawVal === '') return;
        const valArr = Array.isArray(rawVal) ? rawVal.map(String) : [String(rawVal)];
        if (valArr.length === 0) return;

        const cleanKey = key.toLowerCase().replace(/[^a-z0-9]+/g, '');
        const label = key.includes('_')
          ? key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
          : key.charAt(0).toUpperCase() + key.slice(1);

        resultMap.set(cleanKey, { key, label, values: valArr, valueStr: valArr.join(', ') });
      });
    }

    // 2. Extract from product.variants if present
    if (product?.variants && Array.isArray(product.variants)) {
      product.variants.forEach((v: any) => {
        if (v?.attributes && typeof v.attributes === 'object') {
          Object.entries(v.attributes).forEach(([key, val]) => {
            if (val === undefined || val === null || val === '') return;
            const cleanKey = key.toLowerCase().replace(/[^a-z0-9]+/g, '');
            const strVal = String(val);

            if (resultMap.has(cleanKey)) {
              const item = resultMap.get(cleanKey)!;
              if (!item.values.includes(strVal)) {
                item.values.push(strVal);
                item.valueStr = item.values.join(', ');
              }
            } else {
              const label = key.includes('_')
                ? key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
                : key.charAt(0).toUpperCase() + key.slice(1);
              resultMap.set(cleanKey, { key, label, values: [strVal], valueStr: strVal });
            }
          });
        }
      });
    }

    return Array.from(resultMap.values()).filter(item => item.values && item.values.length > 1);
  }, [product?.attributes, product?.variants]);

  // Extract all single-value specifications from attributes, specifications, compliance & rules
  const allSpecifications = useMemo(() => {
    if (!product) return [];
    const map = new Map<string, { label: string; value: string }>();

    const addSpec = (rawKey: string, rawVal: any) => {
      if (rawVal === undefined || rawVal === null || rawVal === '') return;
      if (Array.isArray(rawVal) && rawVal.length === 0) return;

      const valStr = Array.isArray(rawVal) ? rawVal.join(', ') : String(rawVal);
      const cleanKey = rawKey.toLowerCase().replace(/[^a-z0-9]+/g, '');

      if (!map.has(cleanKey)) {
        const label = rawKey.includes('_')
          ? rawKey.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
          : rawKey.charAt(0).toUpperCase() + rawKey.slice(1);
        map.set(cleanKey, { label, value: valStr });
      }
    };

    if (product.specifications && typeof product.specifications === 'object') {
      Object.entries(product.specifications).forEach(([k, v]) => addSpec(k, v));
    }
    if (product.attributes && typeof product.attributes === 'object') {
      Object.entries(product.attributes).forEach(([k, v]) => {
        if (!Array.isArray(v) || v.length === 1) {
          addSpec(k, v);
        }
      });
    }
    if (product.complianceRules && typeof product.complianceRules === 'object') {
      Object.entries(product.complianceRules).forEach(([k, v]) => addSpec(k, v));
    }

    return Array.from(map.values());
  }, [product]);

  const deliveryReachText = useMemo(() => {
    if (!product) return { icon: "📍", text: "Local Quick Delivery", badge: "Local Delivery" };
    const scope = product.deliveryScope;
    const isLocal = product.isLocalDelivery !== false && (scope === 'local' || scope === 'both' || !scope);
    const isPan = product.isPanIndia || scope === 'pan_india' || scope === 'both';

    if (isLocal && isPan) return { icon: "📍🌐", text: "Local 15-30 Min Express & Pan India Courier Shipping", badge: "Express & Pan-India" };
    if (isPan) return { icon: "🌐", text: "Pan India Courier Delivery Available", badge: "Pan-India Shipping" };
    return { icon: "📍", text: "Local Quick Delivery (15-30 mins in vendor area)", badge: "Local Quick Delivery" };
  }, [product?.deliveryScope, product?.isPanIndia, product?.isLocalDelivery]);

  useEffect(() => {
    if (product?.attributes) {
      const initial: Record<string, string> = {};
      Object.keys(product.attributes).forEach((key) => {
        const vals = product.attributes[key];
        if (Array.isArray(vals) && vals.length > 0) {
          initial[key] = vals[0];
        } else if (typeof vals === "string") {
          initial[key] = vals;
        }
      });
      setSelectedAttrs(initial);
    }
  }, [product]);

  const selectedVariant = useMemo(() => {
    if (!product?.variants || product.variants.length === 0) return null;
    return product.variants.find((variant: any) => {
      return Object.keys(selectedAttrs).every((key) => {
        return String(variant.attributes?.[key]) === String(selectedAttrs[key]);
      });
    });
  }, [product?.variants, selectedAttrs]);

  // MOQ - update quantity to MOQ when product loads or variant changes
  const moq = useMemo(() => {
    let raw = product?.minimumOrderQuantity ?? product?.moq ?? product?.wholesaleRules?.minOrderQty ?? product?.inventoryRules?.minOrderQty;

    const findInAttrs = (attrsObj: any) => {
      if (!attrsObj || typeof attrsObj !== 'object') return null;
      for (const [key, val] of Object.entries(attrsObj)) {
        const k = key.toLowerCase();
        if (k.includes('moq') || k.includes('minimum order')) {
          const num = Number(val);
          if (!isNaN(num) && num > 0) return num;
        }
      }
      return null;
    };

    const attrMoq = findInAttrs(selectedVariant?.attributes) ?? findInAttrs(product?.attributes);
    const finalMoq = attrMoq || Number(raw) || 1;
    return Math.max(1, finalMoq);
  }, [product, selectedVariant]);

  // When MOQ changes (product loads or variant selected), enforce quantity >= MOQ
  useEffect(() => {
    if (moq > 1) {
      setQuantity((q) => Math.max(moq, q));
    }
  }, [moq]);

  // Mapped fields for backend schema / legacy compatibility
  const title = product.name || product.itemName || "Product";
  const variantImages = selectedVariant?.images && selectedVariant.images.length > 0 ? selectedVariant.images : null;
  const productImages = useMemo(() => {
    const list: string[] = [];
    if (product.thumbnail) {
      list.push(product.thumbnail);
    }
    if (product.images && product.images.length > 0) {
      product.images.forEach((img: string) => {
        if (img && !list.includes(img)) {
          list.push(img);
        }
      });
    }
    if (list.length === 0) {
      list.push("/placeholder.svg");
    }
    return list;
  }, [product.thumbnail, product.images]);
  const images = variantImages || productImages;

  const customerSellingPrice = product.adminPricing?.customerSellingAmount ?? product.baseSellingPrice ?? product.afterDiscount ?? 0;
  const shippingCharge = product.adminPricing?.shippingCharge ?? product.deliveryFee ?? 0;
  const packingCharge = product.adminPricing?.packingCharge ?? 0;

  const afterDiscount = selectedVariant
    ? (selectedVariant.sellingPrice + shippingCharge + packingCharge)
    : customerSellingPrice;

  const userPrice = selectedVariant?.mrp ?? product.baseMrp ?? product.userPrice ?? 0;
  const discount = product.discountPercent ?? product.discount ?? 0;
  const deliveryFee = shippingCharge;
  const description = product.description || "";
  const stock = selectedVariant ? selectedVariant.stock : (product.stock ?? 0);
  const isOutOfStock = stock <= 0 || stock < moq;

  // ✅ Reviews state
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState<string | null>(null);

  // Admin moderation states
  const [editingReview, setEditingReview] = useState<any>(null);
  const [editRating, setEditRating] = useState<number>(5);
  const [editComment, setEditComment] = useState<string>("");

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

  // 🔑 Get referral code
  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  }, []);

  const referralCode = user?.referralCode || "";

  const baseUrl = window.location.href.split("?")[0];
  const shareUrl = referralCode ? `${baseUrl}?ref=${referralCode}` : baseUrl;

  const shareText = referralCode
    ? `Check this product on ApexBee!\nUse my referral code ${referralCode} and get ₹50 on signup!`
    : `Check this product on ApexBee!`;

  useEffect(() => {
    if (!id) return;

    const fetchProductDetails = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/products/${id}`);
        const data = await res.json();

        if (res.ok && data) {
          const prodData = data.product || data;
          setProduct(prodData);
          setMainImageIndex(0);

          // Track recently viewed
          try {
            const list = JSON.parse(localStorage.getItem("mock_recently_viewed") || "[]");
            const filtered = list.filter((item: any) => !(item.id === prodData._id && item.type === "product"));
            filtered.unshift({
              id: prodData._id,
              type: "product",
              title: prodData.name || prodData.itemName,
              image: prodData.images?.[0] || prodData.thumbnail || "/placeholder-product.png",
              price: prodData.baseSellingPrice ?? prodData.afterDiscount,
              originalPrice: prodData.baseMrp ?? prodData.userPrice,
              url: `/product/${prodData._id}`,
              categoryName: prodData.categoryId?.name || prodData.categoryName || "",
              rating: prodData.rating,
              timestamp: new Date().toISOString()
            });
            localStorage.setItem("mock_recently_viewed", JSON.stringify(filtered.slice(0, 15)));
          } catch (e) {
            console.error("Error tracking product:", e);
          }

          // fetch similar
          fetchSimilarProducts(prodData.categoryId?.name || prodData.categoryName || "", prodData._id);

          // ✅ fetch reviews
          fetchReviews(prodData._id);
        }
      } catch (error) {
        console.error("Network error:", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchSimilarProducts = async (categoryName: string, currentId: string) => {
      try {
        const res = await fetch(
          `${API_BASE}/products?category=${encodeURIComponent(
            categoryName || ""
          )}&excludeId=${currentId}&limit=4`
        );
        const data = await res.json();
        setSimilarProducts(data.products || []);
      } catch (error) {
        console.error("Error fetching similar products:", error);
      }
    };

    // ✅ Reviews fetcher
    const fetchReviews = async (productId: string) => {
      try {
        setReviewsLoading(true);
        setReviewsError(null);

        const res = await fetch(`${API_BASE}/reviews/product/${productId}`);
        const data = await res.json();

        if (!res.ok) throw new Error(data?.message || "Failed to fetch reviews");

        const list = Array.isArray(data?.reviews) ? data.reviews : Array.isArray(data) ? data : [];
        setReviews(list);
      } catch (e: any) {
        console.error("fetchReviews:", e);
        setReviews([]);
        setReviewsError(e?.message || "Failed to load reviews");
      } finally {
        setReviewsLoading(false);
      }
    };

    fetchProductDetails();
  }, [id]);

  // ⭐ Review stats
  const reviewStats = useMemo(() => {
    const count = reviews.length || 0;
    if (!count) return { avg: Number(product?.rating || 0) || 0, count: 0 };

    const sum = reviews.reduce((acc, r) => acc + Number(r.rating || 0), 0);
    const avg = sum / count;
    return { avg, count };
  }, [reviews, product?.rating]);

  // 📡 Share Handler
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: shareText,
          url: shareUrl,
        });
      } catch {
        // cancelled
      }
    } else {
      setShowShare(true);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
    alert("Referral link copied!");
  };

  const whatsappShare = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText + "\n" + shareUrl)}`);
  };

  const facebookShare = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`);
  };

  const twitterShare = () => {
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`
    );
  };

  // ✅ Add to Cart – now includes deliveryFee & MOQ check
  const handleAddToCart = async () => {
    if (quantity < moq) {
      alert(`⚠️ Minimum order quantity for this item is ${moq} units.`);
      setQuantity(moq);
      return;
    }

    const item = {
      productId: product._id,
      name: title + (selectedVariant ? ` (${Object.values(selectedAttrs).join(", ")})` : ""),
      price: afterDiscount,
      image: images[0],
      quantity: Math.max(quantity, moq),
      selectedColor: selectedAttrs.color || "default",
      selectedSize: selectedAttrs.size || "default",
      selectedAttributes: selectedAttrs,
      sku: selectedVariant?.sku || product.sku,
      vendorId: product.vendorId || product.sellerId?._id || product.sellerId,
      deliveryFee: deliveryFee,
    };

    if (!user?.id && !user?._id) {
      const local = localStorage.getItem("local_cart");
      let list = [];
      if (local) {
        try { list = JSON.parse(local); } catch { list = []; }
      }
      if (!Array.isArray(list)) list = [];

      const existingIdx = list.findIndex((x) => x.productId === product._id);
      if (existingIdx > -1) {
        list[existingIdx].quantity += quantity;
      } else {
        list.push(item);
      }
      localStorage.setItem("local_cart", JSON.stringify(list));
      localStorage.setItem("cart_updated", Date.now().toString());
      window.dispatchEvent(new Event("storage"));
      alert("Added to guest cart successfully!");
      return;
    }

    const userId = user?.id || user?._id;
    const dbItem = { ...item, userId };

    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_BASE}/cart/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(dbItem),
      });
      const data = await res.json();
      if (!res.ok) return alert(data.error || "Failed to add to cart.");

      window.dispatchEvent(new Event("storage"));
      alert("Added to cart successfully!");
    } catch {
      alert("Server error");
    }
  };

  // ✅ Buy Now – uses product's delivery fee instead of fixed ₹50 & enforces MOQ
  const handleBuyNow = () => {
    if (!user) {
      alert("Please login first.");
      navigate("/login");
      return;
    }

    const buyQuantity = Math.max(quantity, moq);

    if (quantity < moq) {
      alert(`⚠️ Minimum order quantity for this item is ${moq} units.`);
      setQuantity(moq);
    }

    const baseSellingPrice = selectedVariant
      ? selectedVariant.sellingPrice
      : (product.adminPricing?.sellingPrice ?? product.baseSellingPrice ?? 0);

    const subtotal = baseSellingPrice * buyQuantity;
    const discount = Math.max(0, userPrice - baseSellingPrice) * buyQuantity;
    const totalPacking = packingCharge * buyQuantity;
    const totalShipping = deliveryFee * buyQuantity;
    const taxableAmount = subtotal + totalPacking + totalShipping;
    const gstAmount = Math.round(taxableAmount * 0.05);
    const total = taxableAmount + gstAmount;

    navigate("/checkout", {
      state: {
        cartItems: [{
          _id: product._id,
          productId: product._id,
          itemName: title + (selectedVariant ? ` (${Object.values(selectedAttrs).join(", ")})` : ""),
          price: afterDiscount,
          afterDiscount: afterDiscount,
          originalPrice: userPrice,
          salesPrice: userPrice,
          deliveryFee: deliveryFee,
          packingCharge: packingCharge,
          sellingPrice: baseSellingPrice,
          images,
          quantity: buyQuantity
        }],
        subtotal,
        discount,
        deliveryFee: totalShipping,
        total,
        fromBuyNow: true,
      },
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl text-primary">Loading Product Details...</p>
      </div>
    );
  }

  const currentRating = Math.round(reviewStats.avg || product.rating || 4);

  const renderStars = (value: number) => (
    <div className="flex items-center gap-1">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${i < value ? "fill-accent text-accent" : "text-gray-300"}`}
        />
      ))}
    </div>
  );

  const safeUserName = (r: Review) => {
    const u: any = r.userId;
    if (!u) return "Customer";
    if (typeof u === "string") return "Customer";
    return u.name || u.email || "Customer";
  };

  const formatDate = (iso?: string) => {
    if (!iso) return "";
    const d = new Date(iso);
    return isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  };

  return (
    <div className="min-h-screen">
      <Navbar />

      <section className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-12">
          {/* LEFT IMAGES */}
          <div>
            <div className="bg-blue-light rounded-2xl overflow-hidden mb-4">
              <img
                src={images[mainImageIndex] || "/placeholder.svg"}
                alt={title}
                className="aspect-[3/4] w-full object-cover"
              />
            </div>

            <div className="flex gap-3 overflow-x-auto">
              {images.map((img: string, index: number) => (
                <div
                  key={index}
                  onClick={() => setMainImageIndex(index)}
                  className={`w-20 h-20 rounded-lg cursor-pointer p-1 border ${index === mainImageIndex ? "border-accent" : "border-gray-300"
                    }`}
                >
                  <img src={img} alt="thumb" className="w-full h-full object-cover rounded-lg" />
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT DETAILS */}
          <div>
            {product.brand && (
              <div className="text-xs font-bold text-accent mb-2 uppercase tracking-wide">
                Brand: {product.brand}
              </div>
            )}

            <div className="flex items-center gap-2 mb-2">
              {renderStars(currentRating)}
              <span className="text-sm text-muted-foreground">
                {reviewStats.count ? `(${reviewStats.count} reviews)` : "(No reviews yet)"}
              </span>

              <button onClick={handleShare} className="ml-auto text-accent flex items-center gap-1">
                <Share2 size={18} /> Share
              </button>
            </div>

            <h1 className="text-3xl font-bold text-navy mb-4">{title}</h1>

            <div className="mb-6">
              <span className="text-5xl font-bold text-navy">{formatCurrency(afterDiscount)}</span>
              {Number(userPrice || 0) > Number(afterDiscount || 0) && (
                <span className="text-xl line-through text-gray-500 ml-2">
                  {formatCurrency(userPrice)}
                </span>
              )}
            </div>

            {/* 🚨 BULK / WHOLESALE PRODUCT ALERT BANNER */}
            {moq > 1 && (
              <div className="mb-6 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border-2 border-amber-400/90 rounded-2xl p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="bg-amber-400 text-amber-950 p-2.5 rounded-xl text-xl shrink-0 font-extrabold shadow-sm">
                    📦
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center justify-between flex-wrap gap-1">
                      <span className="bg-amber-500 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-md tracking-wider shadow-xs">
                        Bulk / Wholesale Item
                      </span>
                      <span className="text-xs font-black text-amber-950 bg-amber-200/80 px-2.5 py-0.5 rounded-full border border-amber-300">
                        MOQ: {moq} Units Minimum
                      </span>
                    </div>
                    <p className="text-xs text-amber-950 font-bold leading-relaxed">
                      ⚠️ <strong>Bulk Product Alert:</strong> This product requires a minimum order quantity of <strong>{moq} units</strong> per purchase.
                    </p>
                    <div className="text-[11px] font-semibold text-amber-900 pt-2 border-t border-amber-300/60 flex items-center justify-between flex-wrap gap-1">
                      <span>Unit Price: <strong>{formatCurrency(afterDiscount)}</strong> / unit</span>
                      <span className="font-black text-amber-950 text-xs">
                        Min. Order Cost: {formatCurrency(afterDiscount * moq)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Stock status indicator */}
            <div className="mb-4 text-sm">
              {isOutOfStock ? (
                <span className="text-red-500 font-bold">
                  Out of Stock {stock > 0 ? `(Stock ${stock} is below MOQ requirement of ${moq} units)` : ""}
                </span>
              ) : (
                <span className="text-green-600 font-bold">
                  In Stock {stock < 10 ? `(Only ${stock} left!)` : `(${stock} available)`}
                </span>
              )}
            </div>

            {/* Delivery fee & Reach Badges */}
            <div className="mb-4 flex flex-wrap gap-2 items-center">
              {deliveryFee > 0 ? (
                <div className="text-xs font-semibold text-green-600 bg-green-50 inline-block px-2.5 py-1 rounded-lg border border-green-200">
                  🚚 Delivery fee of {formatCurrency(deliveryFee)} included in price
                </div>
              ) : (
                <div className="text-xs font-semibold text-green-600 bg-green-50 inline-block px-2.5 py-1 rounded-lg border border-green-200">
                  🚚 Free Delivery
                </div>
              )}

              <div className="text-xs font-semibold text-indigo-700 bg-indigo-50 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-indigo-200">
                <span>{deliveryReachText.icon}</span>
                <span>{deliveryReachText.badge}</span>
              </div>
            </div>

            {/* Attribute/Variant Selectors */}
            {formattedAttributes.length > 0 && (
              <div className="my-6 space-y-4 border-t border-b py-4 border-border">
                {formattedAttributes.map(({ key, label, values }) => {
                  if (!Array.isArray(values) || values.length === 0) return null;
                  return (
                    <div key={key} className="space-y-2">
                      <span className="text-sm font-semibold text-navy capitalize">{label}:</span>
                      <div className="flex flex-wrap gap-2">
                        {values.map((val: any) => {
                          const isSelected = selectedAttrs[key] === val;
                          return (
                            <button
                              key={String(val)}
                              type="button"
                              onClick={() => setSelectedAttrs((prev) => ({ ...prev, [key]: val }))}
                              className={`px-4 py-2 text-xs font-bold rounded-lg border transition-all ${isSelected
                                ? "bg-accent text-white border-transparent shadow-sm shadow-accent/50 scale-105"
                                : "bg-white text-navy border-gray-300 hover:border-gray-400"
                                }`}
                            >
                              {String(val)}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Quantity */}
            <div className="mb-6">
              <div className="flex items-center gap-4 text-xs font-bold text-navy mb-2">
                Quantity:
                <div className="flex items-center border rounded-lg overflow-hidden">
                  <Button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(moq, q - 1))}
                    disabled={isOutOfStock || quantity <= moq}
                    className="px-3"
                  >
                    -
                  </Button>
                  <span className="px-4 min-w-[40px] text-center">{quantity}</span>
                  <Button
                    type="button"
                    onClick={() => setQuantity((q) => q + 1)}
                    disabled={isOutOfStock}
                    className="px-3"
                  >
                    +
                  </Button>
                </div>
              </div>

              {/* MOQ badge */}
              {moq > 1 && (
                <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                  <span className="text-amber-600 font-black text-sm">📦</span>
                  <div>
                    <p className="text-xs font-extrabold text-amber-800">Bulk / Wholesale Product</p>
                    <p className="text-[10px] text-amber-700 font-medium">
                      Minimum order quantity: <strong>{moq} units</strong> — Cannot add fewer than {moq} items to cart.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-4">
              <Button onClick={handleAddToCart} className="flex-1 bg-accent text-white font-bold" disabled={isOutOfStock}>
                Add to Cart
              </Button>
              <Button onClick={handleBuyNow} className="flex-1 bg-navy text-white font-bold" disabled={isOutOfStock}>
                Buy Now
              </Button>
            </div>

            {/* Category Specifications & Dynamic Specs Table */}
            <div className="bg-slate-50 border border-slate-200/80 p-6 rounded-2xl mt-6 space-y-4 shadow-sm">
              <h3 className="font-extrabold text-sm text-navy uppercase tracking-wider border-b border-slate-200 pb-2 flex items-center justify-between">
                <span>📋 Specifications &amp; Product Details</span>
                <span className="text-[10px] text-muted-foreground font-semibold lowercase">verified product specs</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {(product.categoryName || product.categoryId?.name) && (
                  <div className="p-2.5 bg-white rounded-xl border border-slate-200 flex justify-between">
                    <span className="text-muted-foreground font-medium">Category:</span>
                    <span className="font-bold text-navy">{product.categoryName || product.categoryId?.name}</span>
                  </div>
                )}

                {product.brand && (
                  <div className="p-2.5 bg-white rounded-xl border border-slate-200 flex justify-between">
                    <span className="text-muted-foreground font-medium">Brand:</span>
                    <span className="font-bold text-navy">{product.brand}</span>
                  </div>
                )}

                {(product.sku || selectedVariant?.sku) && (
                  <div className="p-2.5 bg-white rounded-xl border border-slate-200 flex justify-between">
                    <span className="text-muted-foreground font-medium">SKU Code:</span>
                    <span className="font-mono text-indigo-600 font-bold">{selectedVariant?.sku || product.sku}</span>
                  </div>
                )}

                <div className="p-2.5 bg-white rounded-xl border border-slate-200 flex justify-between">
                  <span className="text-muted-foreground font-medium">Shipping Scope:</span>
                  <span className="font-bold text-emerald-600">{deliveryReachText.badge}</span>
                </div>

                {stock > 0 && (
                  <div className="p-2.5 bg-white rounded-xl border border-slate-200 flex justify-between">
                    <span className="text-muted-foreground font-medium">Stock Status:</span>
                    <span className="font-bold text-emerald-600">In Stock ({stock} available)</span>
                  </div>
                )}

                {moq > 1 && (
                  <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 flex justify-between">
                    <span className="text-amber-800 font-medium">Minimum Order (MOQ):</span>
                    <span className="font-extrabold text-amber-900">{moq} Units Required</span>
                  </div>
                )}

                {/* Render Dynamic Attributes & Specifications Key-Value Pairs */}
                {allSpecifications.map(({ label, value }) => (
                  <div key={label} className="p-2.5 bg-white rounded-xl border border-slate-200 flex justify-between capitalize">
                    <span className="text-muted-foreground font-medium">{label}:</span>
                    <span className="font-bold text-navy">{value}</span>
                  </div>
                ))}
              </div>

              {description && (
                <div className="pt-3 border-t border-slate-200">
                  <span className="text-xs font-bold text-navy block mb-1">Product Description:</span>
                  <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">{description}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ✅ REVIEWS SECTION */}
      <section className="container mx-auto px-4 pb-10">
        <div className="flex items-end justify-between gap-3 mb-4">
          <div>
            <h2 className="text-xl font-extrabold text-navy">Customer Reviews</h2>
            <p className="text-sm text-muted-foreground">
              {reviewStats.count ? `Average ${reviewStats.avg.toFixed(1)} / 5` : "Be the first to review this product"}
            </p>
          </div>

          {/* Optional: Later you can navigate to write review page */}
          {/* <Button variant="outline" onClick={() => navigate(`/product/${product._id}/review`)}>Write Review</Button> */}
        </div>

        {reviewsLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-2xl border bg-white p-5">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-28 bg-gray-100 rounded" />
                  <div className="h-4 w-40 bg-gray-100 rounded" />
                </div>
                <div className="mt-3 h-4 w-2/3 bg-gray-100 rounded" />
                <div className="mt-2 h-4 w-1/2 bg-gray-100 rounded" />
              </div>
            ))}
          </div>
        ) : reviewsError ? (
          <div className="rounded-2xl border bg-red-50 p-5 text-red-700">
            {reviewsError}
          </div>
        ) : reviews.length === 0 ? (
          <div className="rounded-2xl border bg-muted/20 p-8 text-center text-muted-foreground">
            No reviews yet.
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((r) => (
              <div key={r._id} className="rounded-2xl border bg-white p-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex items-center gap-3">
                    {renderStars(Math.round(Number(r.rating || 0)))}
                    <span className="text-sm font-semibold text-navy">{safeUserName(r)}</span>
                    {r.isVerifiedPurchase && (
                      <span className="text-[11px] font-bold px-2 py-1 rounded-full bg-green-100 text-green-700">
                        Verified Purchase
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">{formatDate(r.createdAt)}</span>
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

                {r.title && <h4 className="mt-3 font-bold text-navy">{r.title}</h4>}
                {r.comment && <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{r.comment}</p>}

                {Array.isArray(r.images) && r.images.length > 0 && (
                  <div className="mt-4">
                    <div className="flex items-center gap-2 text-xs font-semibold text-navy mb-2">
                      <ImageIcon className="h-4 w-4" />
                      Photos
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                      {r.images.slice(0, 10).map((img, idx) => (
                        <a key={idx} href={img} target="_blank" rel="noreferrer">
                          <img
                            src={img}
                            alt="review"
                            className="h-20 w-full object-cover rounded-lg border hover:opacity-90"
                          />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* SHARE POPUP */}
      {showShare && (
        <div className="fixed inset-0 bg-black/30 flex items-end justify-center">
          <div className="bg-white w-full p-6 rounded-t-2xl shadow-lg">
            <h2 className="font-bold text-lg mb-3 text-center">Share Product</h2>

            {referralCode ? (
              <p className="text-center font-semibold text-primary mb-3">
                Referral Code: {referralCode} — Get ₹50 on signup!
              </p>
            ) : (
              <p className="text-center text-sm text-muted-foreground mb-3">
                Share this product
              </p>
            )}

            <div className="flex flex-col gap-3">
              <Button onClick={copyLink} className="bg-gray-100 text-navy">
                Copy Link
              </Button>
              <Button onClick={whatsappShare} className="bg-green-500 text-white">
                WhatsApp
              </Button>
              <Button onClick={facebookShare} className="bg-blue-600 text-white">
                Facebook
              </Button>
              <Button onClick={twitterShare} className="bg-black text-white">
                Twitter
              </Button>
            </div>

            <Button onClick={() => setShowShare(false)} className="w-full mt-4 bg-red-500 text-white">
              Close
            </Button>
          </div>
        </div>
      )}

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

      {/* Sticky Mobile Action Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t p-3 z-40 flex gap-3 shadow-lg">
        <Button onClick={handleAddToCart} className="flex-1 bg-accent hover:bg-accent/90 text-white font-bold h-11" disabled={isOutOfStock}>
          Add to Cart
        </Button>
        <Button onClick={handleBuyNow} className="flex-1 bg-navy hover:bg-navy/90 text-white font-bold h-11" disabled={isOutOfStock}>
          Buy Now
        </Button>
      </div>

      <Footer />
    </div>
  );
};

export default ProductDetail;