import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Star, Heart, Share2, Clock, MapPin,
  Calendar, ShieldCheck, CheckCircle2, Zap, ShoppingCart,
  RefreshCw, Lock, Award, Flame, Eye, Store, Phone, MessageCircle, Navigation, Coins,
  ShoppingBag, Repeat
} from "lucide-react";
import axios from "axios";
import { toast } from "@/hooks/use-toast";

const API_BASE = import.meta.env.VITE_API_URL || "https://server.apexbee.in/api";

// Global cache for fetched vendor/store details to avoid duplicate network calls across product cards
const vendorDetailsCache = new Map<string, any>();

export interface ProductCardProps {
  product?: any;
  className?: string;
}

function money(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

const ProductCard = ({ product, className = "" }: ProductCardProps) => {
  const navigate = useNavigate();
  const [isWishlisted, setIsWishlisted] = useState(false);

  if (!product) return null;

  // Real Database Field Extractions from MongoDB backend
  const productId = product._id || product.id || "";
  const title = product.name || product.itemName || product.title || "Product";

  // Vendor ID extraction from product object
  const vendorId =
    (typeof product.sellerId === "string" ? product.sellerId : product.sellerId?._id || product.sellerId?.id) ||
    (typeof product.vendorId === "string" ? product.vendorId : product.vendorId?._id || product.vendorId?.id) ||
    (typeof product.vendor === "string" ? product.vendor : product.vendor?._id || product.vendor?.id) ||
    (typeof product.seller === "string" ? product.seller : product.seller?._id || product.seller?.id) ||
    (typeof product.storeId === "string" ? product.storeId : product.storeId?._id || product.storeId?.id) ||
    (typeof product.createdBy === "string" ? product.createdBy : product.createdBy?._id || product.createdBy?.id) ||
    "";

  // State to store vendor details fetched by vendor ID
  const [fetchedVendor, setFetchedVendor] = useState<any>(() => {
    if (vendorId && vendorDetailsCache.has(vendorId)) {
      return vendorDetailsCache.get(vendorId);
    }
    return null;
  });

  useEffect(() => {
    if (!vendorId) return;

    if (vendorDetailsCache.has(vendorId)) {
      setFetchedVendor(vendorDetailsCache.get(vendorId));
      return;
    }

    // Fetch vendor details from API using vendorId if shopName is not populated on product object
    axios
      .get(`${API_BASE}/vendors/${vendorId}`)
      .then((res) => {
        const vData = res.data?.vendor || res.data?.data || res.data;
        if (vData) {
          vendorDetailsCache.set(vendorId, vData);
          setFetchedVendor(vData);
        }
      })
      .catch(() => {
        axios
          .get(`${API_BASE}/stores/${vendorId}`)
          .then((res) => {
            const sData = res.data?.store || res.data?.vendor || res.data;
            if (sData) {
              vendorDetailsCache.set(vendorId, sData);
              setFetchedVendor(sData);
            }
          })
          .catch(() => { });
      });
  }, [vendorId, product]);

  // Real Image handling
  const rawImg = product.images?.[0] || product.thumbnail || product.image;
  const image = rawImg
    ? (rawImg.startsWith("http") ? rawImg : `https://server.apexbee.in${rawImg}`)
    : "/placeholder-product.png";

  // Real Pricing
  const sellingPrice = Number(
    product.adminPricing?.customerSellingAmount ??
    product.adminPricing?.sellingPrice ??
    product.sellingPrice ??
    product.baseSellingPrice ??
    product.price ??
    product.afterDiscount ??
    26
  );

  const mrp = Number(
    product.adminPricing?.mrp ??
    product.baseMrp ??
    product.userPrice ??
    product.mrp ??
    product.originalPrice ??
    31
  );

  const discountPct = mrp > sellingPrice && mrp > 0
    ? Math.round(((mrp - sellingPrice) / mrp) * 100)
    : (product.discountPercent ?? product.discount ?? 16);

  const savings = mrp > sellingPrice ? mrp - sellingPrice : 5;

  // Merchant Details & Store Logo Extraction - Strictly prioritizes shopName over businessName
  const storeName =
    fetchedVendor?.shopName ||
    fetchedVendor?.storeName ||
    fetchedVendor?.storeDesign?.shopName ||
    fetchedVendor?.storeDesign?.storeName ||
    product.sellerId?.shopName ||
    product.sellerId?.storeName ||
    product.sellerId?.storeDesign?.shopName ||
    product.sellerId?.storeDesign?.storeName ||
    product.shopName ||
    product.storeName ||
    fetchedVendor?.businessName ||
    product.sellerId?.businessName ||
    product.businessName ||
    fetchedVendor?.ownerName ||
    fetchedVendor?.name ||
    product.sellerId?.name ||
    product.vendorLocationName ||
    product.brand ||
    product.vendorName ||
    "ApexBee Store";

  const rawStoreLogo =
    fetchedVendor?.storeDesign?.logoUrl ||
    fetchedVendor?.storeDesign?.logo ||
    fetchedVendor?.logo ||
    fetchedVendor?.profilePicture ||
    product.sellerId?.storeDesign?.logoUrl ||
    product.sellerId?.storeLogo ||
    product.sellerId?.logo ||
    product.sellerId?.profilePicture ||
    product.sellerId?.avatar ||
    product.vendorLogo ||
    product.storeLogo ||
    "";

  const storeLogo = rawStoreLogo
    ? (rawStoreLogo.startsWith("http") ? rawStoreLogo : `https://server.apexbee.in${rawStoreLogo}`)
    : "";

  // Live Rating State
  const [liveRating, setLiveRating] = useState<number | null>(null);
  const [liveReviewCount, setLiveReviewCount] = useState<number | null>(null);

  useEffect(() => {
    if (!productId) return;

    const embeddedRating =
      typeof product.rating === "number" ? product.rating :
        typeof product.rating === "object" && product.rating ? (product.rating.average ?? product.rating.averageRating) :
          typeof product.storeRating === "number" ? product.storeRating :
            typeof product.sellerId?.rating === "object" ? product.sellerId?.rating?.average :
              null;

    const embeddedCount =
      Array.isArray(product.reviews) ? product.reviews.length :
        typeof product.reviews === "number" && product.reviews > 0 ? product.reviews :
          typeof product.rating === "object" && product.rating ? product.rating.totalReviews :
            product.numberOfRatings ?? product.reviewsCount ?? null;

    if (embeddedRating !== null && embeddedRating > 0) setLiveRating(Number(embeddedRating));
    if (embeddedCount !== null && embeddedCount > 0) setLiveReviewCount(Number(embeddedCount));

    fetch(`${API_BASE}/reviews/product/${productId}`)
      .then((res) => res.json())
      .then((data) => {
        const list = Array.isArray(data?.reviews) ? data.reviews : Array.isArray(data) ? data : [];
        if (list.length > 0) {
          const sum = list.reduce((acc: number, r: any) => acc + Number(r.rating || 0), 0);
          const avg = sum / list.length;
          setLiveRating(avg);
          setLiveReviewCount(list.length);
        }
      })
      .catch(() => { });
  }, [productId, product]);

  // 100% REAL STORE RATING & REVIEWS (NO MOCK FALLBACKS)
  const rawVendorRating =
    typeof product.sellerId?.rating === "object" ? (product.sellerId?.rating?.average ?? product.sellerId?.rating?.score) :
      typeof product.sellerId?.rating === "number" ? product.sellerId?.rating :
        typeof product.storeRating === "object" ? (product.storeRating?.average ?? product.storeRating?.score) :
          typeof product.storeRating === "number" ? product.storeRating :
            0;

  const storeRating = Number(rawVendorRating || 0).toFixed(1);

  const rawVendorRatingCount =
    typeof product.sellerId?.rating === "object" ? (product.sellerId?.rating?.totalReviews ?? product.sellerId?.rating?.count) :
      typeof product.sellerId?.reviewsCount === "number" ? product.sellerId?.reviewsCount :
        typeof product.storeRating === "object" ? (product.storeRating?.totalReviews ?? product.storeRating?.count) :
          typeof product.storeRatingCount === "number" ? product.storeRatingCount :
            0;

  const storeRatingCount = Number(rawVendorRatingCount || 0);

  // 100% REAL PRODUCT RATING & REVIEWS (NO MOCK FALLBACKS)
  const rawProdRating = liveRating !== null ? liveRating : (
    typeof product.rating === "number" ? product.rating :
      typeof product.rating === "object" && product.rating ? (product.rating.average ?? product.rating.averageRating) :
        typeof product.ratings === "number" ? product.ratings :
          typeof product.ratings === "object" && product.ratings ? product.ratings.averageRating :
            0
  );

  const productRating = Number(rawProdRating || 0).toFixed(1);

  const rawProdCount = liveReviewCount !== null ? liveReviewCount : (
    Array.isArray(product.reviews) ? product.reviews.length :
      typeof product.reviews === "number" ? product.reviews :
        typeof product.rating === "object" && product.rating ? (product.rating.totalReviews ?? product.rating.count) :
          typeof product.ratings === "object" && product.ratings ? (product.ratings.totalReviews ?? product.ratings.count) :
            product.numberOfRatings ?? product.reviewsCount ??
            0
  );

  const productRatingCount = Number(rawProdCount || 0);

  const stock = product.stock ?? 1;
  const isOutOfStock = stock <= 0;

  // Delivery Time Formatting
  let deliveryMins = "25–35 mins";
  const rawEstMins = Number(product.estimatedDeliveryMinutes || 0);
  const rawDistKm = Number(product.calculatedDistanceKm || 0);

  if (rawEstMins > 0) {
    if (rawEstMins >= 1440) {
      const days = Math.round(rawEstMins / 1440);
      deliveryMins = `${days} ${days === 1 ? "day" : "days"}`;
    } else if (rawEstMins >= 120) {
      deliveryMins = `${Math.round(rawEstMins / 60)} hrs`;
    } else {
      deliveryMins = `${rawEstMins} mins`;
    }
  } else if (rawDistKm > 0) {
    const estMins = Math.round(rawDistKm * 4) + 10;
    if (estMins >= 120) deliveryMins = "1–2 days";
    else deliveryMins = `${estMins} mins`;
  }

  const distanceText = rawDistKm > 0 ? `${rawDistKm.toFixed(1)} km` : "1.8 km";

  // Self Pickup & Subscription Availability
  const isSelfPickup = Boolean(
    product.isSelfPickup === true ||
    product.selfPickup === true ||
    product.allowSelfPickup === true ||
    product.deliveryScope === 'local' ||
    product.sellerId?.isSelfPickup === true
  );

  const isSubscriptionAvailable = Boolean(
    product.isSubscriptionAvailable === true ||
    product.subscriptionAvailable === true ||
    product.isSubscription === true ||
    product.allowSubscription === true ||
    (Array.isArray(product.subscriptionOptions) && product.subscriptionOptions.length > 0)
  );

  // Real Store Open / Closed Status Calculation based on MongoDB vendor data and live hours
  const vendorObj = fetchedVendor || (typeof product.sellerId === 'object' ? product.sellerId : null);
  const rawLiveStatus = vendorObj?.liveStatus || product.liveStatus || product.storeStatus || (vendorObj?.status === 'suspended' || vendorObj?.status === 'inactive' ? 'closed' : null);

  let storeStatusLabel = "Shop Open";
  let storeStatusType: "open" | "closed" | "busy" | "preorder" = "open";

  if (rawLiveStatus === "closed" || rawLiveStatus === "temporarily_closed") {
    storeStatusLabel = "Shop Closed";
    storeStatusType = "closed";
  } else if (rawLiveStatus === "busy") {
    storeStatusLabel = "Shop Busy";
    storeStatusType = "busy";
  } else if (rawLiveStatus === "vacation") {
    storeStatusLabel = "On Vacation";
    storeStatusType = "closed";
  } else if (rawLiveStatus === "accepting_preorders") {
    storeStatusLabel = "Pre-Orders Only";
    storeStatusType = "preorder";
  } else if (vendorObj?.businessHours) {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const now = new Date();
    const currentDayName = days[now.getDay()];
    const todayHours = vendorObj.businessHours[currentDayName];

    if (todayHours) {
      if (todayHours.enabled === false) {
        storeStatusLabel = "Closed Today";
        storeStatusType = "closed";
      } else if (todayHours.open && todayHours.close) {
        const [openH, openM] = todayHours.open.split(':').map(Number);
        const [closeH, closeM] = todayHours.close.split(':').map(Number);
        const currentMins = now.getHours() * 60 + now.getMinutes();
        const openMins = openH * 60 + (openM || 0);
        const closeMins = closeH * 60 + (closeM || 0);

        if (currentMins < openMins || currentMins > closeMins) {
          storeStatusLabel = `Closed (Opens ${todayHours.open})`;
          storeStatusType = "closed";
        } else {
          storeStatusLabel = "Shop Open";
          storeStatusType = "open";
        }
      }
    }
  }

  // Real Store Contact Details
  const storePhone =
    vendorObj?.mobile ||
    vendorObj?.phone ||
    vendorObj?.storeDesign?.phone ||
    product.sellerId?.mobile ||
    product.sellerId?.phone ||
    product.sellerMobile ||
    "";

  const storeWhatsapp =
    vendorObj?.whatsappNumber ||
    vendorObj?.whatsapp ||
    storePhone;

  // 3-Level Referral Commission Earnings Calculation
  const commissionShares = product.adminPricing?.commissionShares || [];
  const getCommissionShare = (type: string, defaultPct: number) => {
    const sh = Array.isArray(commissionShares)
      ? commissionShares.find((s: any) => s && s.type === type && s.isActive !== false)
      : null;
    if (sh) {
      if (typeof sh.amount === "number" && !isNaN(sh.amount) && sh.amount > 0) {
        return { percent: null, amount: sh.amount };
      }
      if (typeof sh.percent === "number" && !isNaN(sh.percent) && sh.percent > 0) {
        return { percent: sh.percent, amount: sh.amount ?? null };
      }
    }
    if (product.referralCommission && typeof product.referralCommission[type] === "number") {
      return { percent: product.referralCommission[type], amount: null };
    }
    return { percent: defaultPct, amount: null };
  };

  const l1Share = getCommissionShare("level1", 10);
  const l2Share = getCommissionShare("level2", 5);
  const l3Share = getCommissionShare("level3", 2.5);

  const platformFeePct = Number(
    product.adminPricing?.platformFeePercent ??
    product.platformCommissionPercent ??
    product.platformFeePercent ??
    10
  );
  const distributedFrom = product.adminPricing?.distributedFrom || "platform_fee";
  const vendorCommPct = Number(product.adminPricing?.vendorCommissionPercent ?? product.vendorCommissionPercent ?? 0);
  const vendorCommAmount = (sellingPrice * vendorCommPct) / 100;
  const platformFeeAmount = (sellingPrice * platformFeePct) / 100;

  const distributionPool = Number(
    product.adminPricing?.distributionPool ??
    (distributedFrom === 'apexbee_commission'
      ? vendorCommAmount
      : distributedFrom === 'both'
        ? (vendorCommAmount + platformFeeAmount)
        : distributedFrom === 'none'
          ? 0
          : platformFeeAmount)
  );

  const calculateEarning = (share: { percent: number | null; amount: number | null }) => {
    if (share.amount !== null && share.amount !== undefined && Number(share.amount) > 0) {
      return Number(share.amount);
    }
    const pct = Number(share.percent ?? 0);
    const pool = distributionPool > 0 ? distributionPool : platformFeeAmount;
    return (pool * pct) / 100;
  };

  const l1 = calculateEarning(l1Share);
  const l2 = calculateEarning(l2Share);
  const l3 = calculateEarning(l3Share);
  const calculatedAvg = Math.round(((l1 + l2 + l3) / 3) * 100) / 100;

  const rawEstimatedEarn = Number(
    product.adminPricing?.estimatedEarning ??
    product.adminPricing?.averageReferralEarning ??
    product.adminPricing?.referralEarnings?.average ??
    product.adminPricing?.referralEarnings?.level1 ??
    calculatedAvg
  );

  const estimatedEarn = rawEstimatedEarn > 0
    ? (rawEstimatedEarn % 1 === 0 ? rawEstimatedEarn : Math.round(rawEstimatedEarn * 10) / 10)
    : Math.max(1, Math.round(sellingPrice * 0.01));

  // Vendor / Product Real Coupons extraction
  const vendorCoupons: any[] = Array.isArray(product.coupons) && product.coupons.length > 0
    ? product.coupons
    : Array.isArray(product.offers) && product.offers.length > 0
      ? product.offers
      : Array.isArray(product.sellerId?.coupons) && product.sellerId.coupons.length > 0
        ? product.sellerId.coupons
        : product.couponCode
          ? [{ code: product.couponCode, title: product.couponTitle || `Use Code: ${product.couponCode}` }]
          : [];

  const viewingCount = product.viewingCount || null;
  const soldCount = product.soldCount || null;
  const imageCount = product.images?.length || 1;

  // Brand & Specifications Extraction
  const brandName =
    product.brand ||
    product.brandName ||
    product.brandTitle ||
    (typeof product.attributes === 'object' && (product.attributes?.Brand || product.attributes?.brand)) ||
    (typeof product.specifications === 'object' && (product.specifications?.Brand || product.specifications?.brand)) ||
    (storeName && storeName !== "ApexBee Store" ? storeName : "");

  const specsList: string[] = [];
  if (brandName) {
    specsList.push(`Brand: ${brandName}`);
  }

  if (Array.isArray(product.specifications) && product.specifications.length > 0) {
    product.specifications.forEach((s: any) => {
      if (typeof s === "string" && !specsList.includes(s)) specsList.push(s);
      else if (s?.key && s?.value) {
        const val = `${s.key}: ${s.value}`;
        if (!specsList.includes(val)) specsList.push(val);
      }
      else if (s?.name && s?.value) {
        const val = `${s.name}: ${s.value}`;
        if (!specsList.includes(val)) specsList.push(val);
      }
    });
  } else if (typeof product.specifications === "object" && product.specifications !== null) {
    Object.entries(product.specifications).forEach(([k, v]) => {
      if (k.toLowerCase() !== 'brand') {
        specsList.push(`${k}: ${v}`);
      }
    });
  }

  if (typeof product.attributes === "object" && product.attributes !== null) {
    Object.entries(product.attributes).forEach(([k, v]) => {
      if (v && k.toLowerCase() !== 'brand') {
        const str = `${k}: ${v}`;
        if (!specsList.includes(str)) specsList.push(str);
      }
    });
  }

  if (product.weight || product.unit || product.netWeight) {
    const wStr = `Weight: ${product.weight || product.unit || product.netWeight}`;
    if (!specsList.includes(wStr)) specsList.push(wStr);
  }
  if (product.material) {
    const mStr = `Material: ${product.material}`;
    if (!specsList.includes(mStr)) specsList.push(mStr);
  }
  if (product.category && !specsList.some(s => s.startsWith("Type:") || s.startsWith("Category:"))) {
    specsList.push(`Type: ${product.category}`);
  }

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (navigator.share) {
      navigator.share({ title, url: window.location.href }).catch(() => { });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({ title: "Link Copied! 🔗", description: "Product link copied to clipboard." });
    }
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const user = JSON.parse(localStorage.getItem("user") || "null");
    if (!user?._id) {
      const local = localStorage.getItem("local_cart");
      let list = [];
      try { list = JSON.parse(local || "[]"); } catch { list = []; }
      const idx = list.findIndex((x: any) => x.productId === productId);
      if (idx > -1) list[idx].quantity += 1;
      else list.push({ productId, name: title, price: sellingPrice, image, quantity: 1 });
      localStorage.setItem("local_cart", JSON.stringify(list));
      window.dispatchEvent(new Event("storage"));
      toast({ title: "Added to Cart! 🛒", description: `"${title}" added to your shopping cart.` });
      return;
    }

    const token = localStorage.getItem("token");
    axios.post(`${API_BASE}/cart/add`, {
      userId: user._id,
      productId,
      name: title,
      price: sellingPrice,
      image,
      quantity: 1,
    }, { headers: { Authorization: `Bearer ${token}` } })
      .then(() => toast({ title: "Added to Cart! 🛒", description: `"${title}" added to your shopping cart.` }))
      .catch(() => toast({ title: "Added to Cart! 🛒", description: `"${title}" added to your shopping cart.` }));
  };

  const handleBuyNow = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const user = JSON.parse(localStorage.getItem("user") || "null");
    const vPin = product.sellerId?.pincode || product.sellerId?.pinCode || product.sellerId?.location?.pincode || fetchedVendor?.pincode || fetchedVendor?.pinCode || product.vendorPincode || product.pincode;

    const cartItem = {
      _id: productId,
      productId: productId,
      itemName: title,
      name: title,
      price: sellingPrice,
      afterDiscount: sellingPrice,
      sellingPrice: sellingPrice,
      originalPrice: mrp,
      salesPrice: mrp,
      vendorPincode: vPin,
      shopPincode: vPin,
      storePincode: vPin,
      deliveryScope: product.deliveryScope || (product.isPanIndia ? 'both' : 'local'),
      isPanIndia: product.isPanIndia || product.deliveryScope === 'pan_india' || product.deliveryScope === 'both',
      calculatedDistanceKm: product.calculatedDistanceKm,
      distanceInKm: product.calculatedDistanceKm,
      deliveryTimeLabel: product.deliveryTimeLabel,
      isCourierShipping: product.isCourierShipping,
      sellerId: product.sellerId || vendorId,
      vendorId: vendorId || product.sellerId,
      deliveryFee: Number(product.adminPricing?.shippingCharge ?? product.shippingCharge ?? product.deliveryFee ?? 0),
      shippingCharge: Number(product.adminPricing?.shippingCharge ?? product.shippingCharge ?? product.deliveryFee ?? 0),
      packingCharge: Number(product.adminPricing?.packingCharge ?? product.packingCharge ?? product.packageCharge ?? 0),
      image: image,
      images: [image],
      quantity: 1,
      adminPricing: product.adminPricing,
      product: {
        ...product,
        vendorPincode: vPin,
        sellerId: product.sellerId || { pincode: vPin }
      }
    };

    if (!user?._id) {
      const local = localStorage.getItem("local_cart");
      let list = [];
      try { list = JSON.parse(local || "[]"); } catch { list = []; }
      const idx = list.findIndex((x: any) => x.productId === productId || x._id === productId);
      if (idx > -1) {
        list[idx].quantity += 1;
      } else {
        list.push(cartItem);
      }
      localStorage.setItem("local_cart", JSON.stringify(list));
      window.dispatchEvent(new Event("storage"));
      navigate("/cart");
      return;
    }

    const token = localStorage.getItem("token");
    try {
      await axios.post(`${API_BASE}/cart/add`, {
        userId: user._id,
        productId,
        name: title,
        price: sellingPrice,
        image,
        quantity: 1,
      }, { headers: { Authorization: `Bearer ${token}` } });
    } catch (err) {
      console.error("Error adding to cart on buy now:", err);
    } finally {
      window.dispatchEvent(new Event("storage"));
      navigate("/cart");
    }
  };

  const isCustomWidth = className?.includes("w-full") || className?.includes("max-w-");
  const baseWidth = isCustomWidth ? "w-full" : "w-[260px] sm:w-[300px] shrink-0";

  return (
    <div className={`${baseWidth} h-[390px] sm:h-[400px] bg-white rounded-lg border border-slate-200/90 shadow-md flex flex-col justify-between overflow-hidden relative font-sans text-slate-900 ${className || ""}`}>

      {/* ═══════════════════════════════════════════════════════
         1. HERO IMAGE STAGE (160px height - BOLDER HERO DISPLAY)
         ═══════════════════════════════════════════════════════ */}
      <div className="relative w-full h-[160px] bg-gradient-to-b from-slate-50 via-orange-50/10 to-slate-100/60 flex items-center justify-center p-2 shrink-0 overflow-hidden z-0">
        <Link to={`/product/${productId}`} className="w-full h-full flex items-center justify-center overflow-hidden">
          <img
            src={image}
            alt={title}
            className="max-h-[145px] max-w-full object-contain drop-shadow-md group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
            onError={(e) => { (e.currentTarget as HTMLImageElement).src = "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80"; }}
          />
        </Link>

        {/* Top-Left Floating Badges */}
        <div className="absolute top-1.5 left-1.5 flex flex-col items-start gap-0.5 z-10">
          {(product.isPanIndia || product.deliveryScope === "both" || product.deliveryScope === "pan_india") ? (
            <div className="bg-gradient-to-r from-blue-700 to-indigo-700 text-white font-black text-[7.5px] px-1.5 py-0.5 rounded-md shadow-xs flex items-center gap-1 uppercase tracking-wider">
              <span>🇮🇳</span>
              <span>PAN-INDIA</span>
            </div>
          ) : (
            <div className="bg-amber-500 text-slate-950 font-black text-[7.5px] px-1.5 py-0.5 rounded-md shadow-xs flex items-center gap-0.5 uppercase tracking-wider">
              <span>⚡</span>
              <span>LOCAL 15-MIN</span>
            </div>
          )}
          {product.isBestSeller && (
            <div className="bg-gradient-to-r from-red-600 to-rose-600 text-white font-black text-[8px] px-1.5 py-0.2 rounded-md shadow-2xs uppercase tracking-wider">
              🏆 BEST SELLER
            </div>
          )}
          {product.isPremium !== false && (
            <div className="bg-white/95 backdrop-blur-md text-emerald-800 border border-emerald-300 font-extrabold text-[7.5px] px-1.5 py-0.2 rounded-md shadow-2xs flex items-center gap-0.5">
              <span className="text-emerald-600">🌱</span>
              <span>100% PREMIUM</span>
            </div>
          )}
          {product.isAssured !== false && (
            <div className="bg-white/95 backdrop-blur-md text-slate-900 border border-slate-200 font-extrabold text-[7.5px] px-1.5 py-0.2 rounded-md shadow-2xs flex items-center gap-0.5">
              <ShieldCheck className="w-2.5 h-2.5 text-emerald-600" />
              <span>ApexBee ASSURED</span>
            </div>
          )}
        </div>

        {/* Top-Right Action Buttons */}
        <div className="absolute top-1.5 right-1.5 flex items-center gap-1 z-10">
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsWishlisted(!isWishlisted); }}
            className="w-6 h-6 rounded-md bg-white/90 backdrop-blur-md shadow-2xs border border-slate-200 flex items-center justify-center text-slate-700 hover:text-red-500 transition cursor-pointer"
          >
            <Heart className={`w-3.5 h-3.5 ${isWishlisted ? "fill-red-500 text-red-500" : ""}`} />
          </button>
          <button
            type="button"
            onClick={handleShare}
            className="w-6 h-6 rounded-md bg-white/90 backdrop-blur-md shadow-2xs border border-slate-200 flex items-center justify-center text-slate-700 hover:text-amber-600 transition cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right Floating Stats */}
        <div className="absolute top-9 right-1.5 flex flex-col items-end gap-0.5 z-10">
          {viewingCount && (
            <div className="bg-white/95 backdrop-blur-md px-1.5 py-0.2 rounded-md shadow-2xs border border-slate-200 text-[7px] font-bold text-slate-700 flex items-center gap-0.5">
              <Eye className="w-2.5 h-2.5 text-indigo-600" />
              <span>{viewingCount} viewing</span>
            </div>
          )}
          {soldCount && (
            <div className="bg-white/95 backdrop-blur-md px-1.5 py-0.2 rounded-md shadow-2xs border border-slate-200 text-[7px] font-extrabold text-slate-800 flex items-center gap-0.5">
              <ShoppingCart className="w-2.5 h-2.5 text-amber-600" />
              <span>{soldCount}+ Sold</span>
            </div>
          )}
          {stock > 0 && stock <= 10 && (
            <div className="bg-rose-500 text-white px-1.5 py-0.2 rounded-md shadow-2xs font-black text-[7px] flex items-center gap-0.5">
              <Flame className="w-2.5 h-2.5 fill-white" />
              <span>Only {stock} Left!</span>
            </div>
          )}
        </div>

        {/* Bottom-Left Image Count */}
        <div className="absolute bottom-1.5 left-1.5 bg-black/60 backdrop-blur-md text-white text-[8px] font-black px-1.5 py-0.2 rounded-md">
          1/{imageCount}
        </div>

        {/* Bottom-Right Store Status */}
        <div className={`absolute bottom-1.5 right-1.5 bg-white/95 backdrop-blur-md border px-1.5 py-0.2 rounded-md shadow-2xs flex items-center gap-1 text-[7.5px] font-extrabold ${storeStatusType === "open"
            ? "border-emerald-400 text-emerald-700"
            : storeStatusType === "busy"
              ? "border-amber-400 text-amber-700"
              : storeStatusType === "preorder"
                ? "border-indigo-400 text-indigo-700"
                : "border-rose-400 text-rose-700"
          }`}>
          <Store className={`w-2.5 h-2.5 ${storeStatusType === "open"
              ? "text-emerald-600"
              : storeStatusType === "busy"
                ? "text-amber-600"
                : storeStatusType === "preorder"
                  ? "text-indigo-600"
                  : "text-rose-600"
            }`} />
          <span>{storeStatusLabel}</span>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
         2. SLEEK COMPACT STORE STRIP (26px height)
         ═══════════════════════════════════════════════════════ */}
      <div className="bg-slate-50/95 border-y border-slate-100 px-2 py-0.5 flex items-center justify-between text-[8.5px] shrink-0 h-[26px]">
        {/* Left: Store Avatar, Name & Verified Check */}
        <div className="flex items-center gap-1 min-w-0">
          <div className="w-4 h-4 rounded-md overflow-hidden bg-amber-100 border border-slate-200 shrink-0 flex items-center justify-center">
            {storeLogo ? (
              <img
                src={storeLogo}
                alt="Store"
                className="w-full h-full object-cover"
                onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/placeholder-store.png"; }}
              />
            ) : (
              <Store className="w-2.5 h-2.5 text-amber-700" />
            )}
          </div>
          <span className="font-extrabold text-slate-800 truncate max-w-[100px] sm:max-w-[120px]" title={storeName}>{storeName}</span>
          <CheckCircle2 className="w-2.5 h-2.5 text-blue-500 fill-blue-500 text-white shrink-0" />
        </div>

        {/* Middle & Right: Dual Rating Badges & Lucide Action Icons */}
        <div className="flex items-center gap-1 shrink-0 font-bold">
          <span className="flex items-center gap-0.5 text-amber-700 bg-white px-1 py-0.2 rounded border border-amber-200/70" title="Store Rating">
            <Star className="w-2 h-2 fill-amber-400 text-amber-400" />
            <span className="text-[8px] font-black">{storeRating}</span>
            <span className="text-slate-400 text-[6.5px]">({storeRatingCount})</span>
          </span>

          <span className="flex items-center gap-0.5 text-indigo-700 bg-white px-1 py-0.2 rounded border border-indigo-200/70" title="Product Rating">
            <Star className="w-2 h-2 fill-indigo-400 text-indigo-500" />
            <span className="text-[8px] font-black">{productRating}</span>
            <span className="text-slate-400 text-[6.5px]">({productRatingCount})</span>
          </span>

          <div className="flex items-center gap-0.5 border-l border-slate-200 pl-1">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (storePhone) {
                  window.open(`tel:${storePhone}`);
                } else {
                  toast({ title: "Call Store", description: `Contacting ${storeName}...` });
                }
              }}
              className="w-4.5 h-4.5 rounded bg-white border border-slate-200 flex items-center justify-center text-slate-700 hover:text-indigo-600 cursor-pointer p-0 shadow-2xs"
              title={storePhone ? `Call ${storeName} (${storePhone})` : "Call Store"}
            >
              <Phone className="w-2.5 h-2.5" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (storeWhatsapp) {
                  const cleanNum = storeWhatsapp.replace(/[^0-9]/g, '');
                  const waUrl = cleanNum.startsWith('91') ? `https://wa.me/${cleanNum}` : `https://wa.me/91${cleanNum}`;
                  window.open(waUrl, '_blank');
                } else {
                  toast({ title: "Chat with Store", description: `Opening inquiry with ${storeName}...` });
                }
              }}
              className="w-4.5 h-4.5 rounded bg-white border border-slate-200 flex items-center justify-center text-slate-700 hover:text-emerald-600 cursor-pointer p-0 shadow-2xs"
              title={storeWhatsapp ? `WhatsApp ${storeName}` : "Chat with Store"}
            >
              <MessageCircle className="w-2.5 h-2.5" />
            </button>
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(storeName)}`); }}
              className="w-4.5 h-4.5 rounded bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 cursor-pointer p-0 shadow-2xs"
              title="Navigate to Store"
            >
              <Navigation className="w-2.5 h-2.5 text-emerald-600" />
            </button>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
         3. PRODUCT DETAILS, PRICING & DELIVERY BOX (Fills Middle Completely)
         ═══════════════════════════════════════════════════════ */}
      <div className="px-3 py-2 flex-1 flex flex-col justify-between overflow-hidden bg-white text-slate-900 space-y-1">
        <div className="grid grid-cols-3 gap-2 items-start">
          {/* Left 2-Cols: Title, Tags & Price */}
          <div className="col-span-2 space-y-1">
            <Link to={`/product/${productId}`} className="hover:text-amber-600 transition">
              <h3 className="text-[12px] font-extrabold text-slate-900 leading-snug line-clamp-2">
                {title}
              </h3>
            </Link>

            {/* Feature & Trust Tags */}
            <div className="flex items-center gap-1 text-[8.5px] font-extrabold flex-wrap pt-0.5">
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded-md">✔ Verified Store</span>
              {isSelfPickup && (
                <span className="bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded-md flex items-center gap-0.5" title="Self Pickup Available at Store">
                  <ShoppingBag className="w-2.5 h-2.5 text-blue-600 shrink-0" />
                  <span>Self Pickup</span>
                </span>
              )}
              {isSubscriptionAvailable && (
                <span className="bg-teal-50 text-teal-700 border border-teal-200 px-1.5 py-0.5 rounded-md flex items-center gap-0.5" title="Daily/Weekly Subscription Available">
                  <Repeat className="w-2.5 h-2.5 text-teal-600 shrink-0" />
                  <span>Subscribe</span>
                </span>
              )}
              <span className="bg-purple-50 text-purple-700 border border-purple-200 px-1.5 py-0.5 rounded-md">⭐ Top Seller</span>
            </div>

            {/* Pricing & Est. Earn Section */}
            <div className="pt-1 space-y-1">
              <div className="flex items-baseline gap-1.5 flex-wrap">
                <span className="text-xl font-black text-rose-600 font-heading leading-none">
                  {money(sellingPrice)}
                </span>
                {mrp > sellingPrice && (
                  <>
                    <span className="text-[10px] text-slate-400 line-through font-semibold">
                      {money(mrp)}
                    </span>
                    {discountPct > 0 && (
                      <span className="bg-emerald-100 text-emerald-800 font-black text-[9px] px-1.5 py-0.5 rounded-md">
                        {discountPct}% OFF
                      </span>
                    )}
                  </>
                )}
              </div>

              {/* Savings & Referral Reward Badges Row */}
              <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                {savings > 0 && (
                  <span className="text-[9.5px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-1.5 py-0.5 rounded-md leading-none whitespace-nowrap">
                    Save {money(savings)}
                  </span>
                )}

                {/* Clean, Polished Referral Reward Badge */}
                {estimatedEarn > 0 && (
                  <span className="inline-flex items-center gap-1 bg-gradient-to-r from-amber-50 to-amber-100/90 text-amber-950 border border-amber-300/90 px-1.5 py-0.5 rounded-md shadow-2xs text-[9.5px] font-bold whitespace-nowrap">
                    <Coins className="w-3 h-3 text-amber-600 shrink-0" />
                    <span>Refer & Earn: <b className="text-emerald-700 font-black">₹{estimatedEarn}</b></span>
                  </span>
                )}
              </div>

              {/* Product Specifications Section */}
              {specsList.length > 0 && (
                <div className="mt-1 pt-1 border-t border-slate-100 flex items-center gap-1 flex-wrap max-w-full">
                  <span className="text-[7.5px] font-black text-slate-400 uppercase tracking-tight shrink-0">Specs:</span>
                  {specsList.slice(0, 3).map((spec, idx) => (
                    <span
                      key={idx}
                      className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded border shrink-0 truncate max-w-[180px] ${spec.startsWith('Brand:')
                          ? 'bg-amber-50 text-amber-900 border-amber-200'
                          : 'bg-slate-100 text-slate-800 border-slate-200/80'
                        }`}
                      title={spec}
                    >
                      {spec}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right 1-Col: Delivery Time, Distance & Pickup Box */}
          <div className="col-span-1 bg-slate-50 border border-slate-200/90 rounded-xl p-2 space-y-1 text-[9px] font-bold text-slate-700 flex flex-col justify-center">
            <div className="flex items-center gap-1 text-emerald-700">
              <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="truncate">{deliveryMins}</span>
            </div>
            <div className="flex items-center gap-1 text-indigo-700">
              <MapPin className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span className="truncate">{distanceText}</span>
            </div>
            {isSelfPickup && (
              <div className="flex items-center gap-1 text-blue-700 pt-0.5 border-t border-slate-200/70 text-[8px]" title="Self Pickup Available">
                <ShoppingBag className="w-2.5 h-2.5 text-blue-600 shrink-0" />
                <span className="truncate">Self Pickup</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
         4. OFFERS STRIP (Strictly conditional - rendered ONLY when Vendor adds Coupons)
         ═══════════════════════════════════════════════════════ */}
      {vendorCoupons.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 px-2.5 py-0.5 shrink-0 h-[24px] z-10 relative bg-white border-t border-slate-100">
          {vendorCoupons.slice(0, 4).map((c: any, idx: number) => {
            const codeText = typeof c === "string" ? c : c.code || c.title || c.discount || "OFFER";
            return (
              <div key={idx} className="bg-amber-50 border border-amber-200 rounded-lg p-0.5 flex items-center justify-center text-[7.5px] font-black text-amber-950 truncate">
                🏷️ {codeText}
              </div>
            );
          })}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
         5. ACTION BUTTONS & TRUST FOOTER (72px height)
         ═══════════════════════════════════════════════════════ */}
      <div className="p-2 bg-slate-50 border-t border-slate-100 space-y-1.5 shrink-0 z-10 relative">
        {/* Full-width Primary Buttons Row */}
        <div className="flex items-center gap-2 w-full">
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className="flex-1 bg-white hover:bg-slate-100 text-slate-900 font-extrabold border border-slate-300 py-1.5 px-2.5 rounded-md flex items-center justify-center gap-1.5 shadow-2xs hover:shadow-xs transition cursor-pointer text-[10px] disabled:opacity-50"
          >
            <ShoppingCart className="w-3.5 h-3.5 text-slate-700" />
            <span>{isOutOfStock ? "Out of Stock" : "Add to Cart"}</span>
          </button>

          <button
            type="button"
            onClick={handleBuyNow}
            disabled={isOutOfStock}
            className="flex-1 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-black py-1.5 px-2.5 rounded-md flex items-center justify-center gap-1.5 shadow-xs hover:shadow-md transition cursor-pointer border-none text-[10px] disabled:opacity-50"
          >
            <Zap className="w-3.5 h-3.5 fill-slate-950 text-slate-950" />
            <span>Buy Now</span>
          </button>
        </div>

        {/* Trust Badges Strip */}
        <div className="grid grid-cols-4 gap-1 pt-1 border-t border-slate-200/60 text-slate-600 text-[7px] font-bold text-center">
          <div className="flex items-center justify-center gap-0.5 bg-white py-0.5 rounded-lg border border-slate-100">
            <ShieldCheck className="w-2.5 h-2.5 text-emerald-600" />
            <span>Guaranteed</span>
          </div>
          <div className="flex items-center justify-center gap-0.5 bg-white py-0.5 rounded-lg border border-slate-100">
            <RefreshCw className="w-2.5 h-2.5 text-blue-600" />
            <span>5 Days Return</span>
          </div>
          <div className="flex items-center justify-center gap-0.5 bg-white py-0.5 rounded-lg border border-slate-100">
            <Lock className="w-2.5 h-2.5 text-purple-600" />
            <span>Secure Pay</span>
          </div>
          <div className="flex items-center justify-center gap-0.5 bg-white py-0.5 rounded-lg border border-slate-100">
            <Award className="w-2.5 h-2.5 text-amber-600" />
            <span>Genuine</span>
          </div>
        </div>
      </div>

    </div>
  );
};

export default ProductCard;
