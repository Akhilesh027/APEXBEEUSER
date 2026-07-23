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

const API_BASE = "https://server.apexbee.in/api";

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
  const isOutOfStock = stock <= 0;

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

  // ✅ Add to Cart – now includes deliveryFee
  const handleAddToCart = async () => {
    const item = {
      productId: product._id,
      name: title + (selectedVariant ? ` (${Object.values(selectedAttrs).join(", ")})` : ""),
      price: afterDiscount,
      image: images[0],
      quantity,
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

  // ✅ Buy Now – uses product's delivery fee instead of fixed ₹50
  const handleBuyNow = () => {
    if (!user) {
      alert("Please login first.");
      navigate("/login");
      return;
    }

    const baseSellingPrice = selectedVariant
      ? selectedVariant.sellingPrice
      : (product.adminPricing?.sellingPrice ?? product.baseSellingPrice ?? 0);

    const subtotal = baseSellingPrice * quantity;
    const discount = Math.max(0, userPrice - baseSellingPrice) * quantity;
    const totalPacking = packingCharge * quantity;
    const totalShipping = deliveryFee * quantity;
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
          quantity
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

            {/* Stock status indicator */}
            <div className="mb-4 text-sm">
              {isOutOfStock ? (
                <span className="text-red-500 font-bold">Out of Stock</span>
              ) : (
                <span className="text-green-600 font-bold">
                  In Stock {stock < 10 ? `(Only ${stock} left!)` : `(${stock} available)`}
                </span>
              )}
            </div>

            {/* ✅ Optional: Show delivery fee (included in price) */}
            {deliveryFee > 0 ? (
              <div className="mb-4 text-xs font-semibold text-green-600 bg-green-50 inline-block px-2.5 py-1 rounded-lg border border-green-200">
                🚚 Delivery fee of {formatCurrency(deliveryFee)} included in price
              </div>
            ) : (
              <div className="mb-4 text-xs font-semibold text-green-600 bg-green-50 inline-block px-2.5 py-1 rounded-lg border border-green-200">
                🚚 Free Delivery
              </div>
            )}

            {/* Attribute/Variant Selectors */}
            {product.attributes && Object.keys(product.attributes).length > 0 && (
              <div className="my-6 space-y-4 border-t border-b py-4 border-border">
                {Object.keys(product.attributes).map((attrName) => {
                  const values = product.attributes[attrName];
                  if (!Array.isArray(values) || values.length === 0) return null;
                  return (
                    <div key={attrName} className="space-y-2">
                      <span className="text-sm font-semibold text-navy capitalize">{attrName}:</span>
                      <div className="flex flex-wrap gap-2">
                        {values.map((val) => {
                          const isSelected = selectedAttrs[attrName] === val;
                          return (
                            <button
                              key={val}
                              type="button"
                              onClick={() => setSelectedAttrs((prev) => ({ ...prev, [attrName]: val }))}
                              className={`px-4 py-2 text-xs font-bold rounded-lg border transition-all ${isSelected
                                ? "bg-accent text-white border-transparent shadow-sm shadow-accent/50 scale-105"
                                : "bg-white text-navy border-gray-300 hover:border-gray-400"
                                }`}
                            >
                              {val}
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
            <div className="mb-6 flex items-center gap-4">
              Quantity:
              <div className="flex items-center border rounded-lg overflow-hidden">
                <Button type="button" onClick={() => setQuantity((q) => Math.max(1, q - 1))} disabled={isOutOfStock}>
                  -
                </Button>
                <span className="px-4">{quantity}</span>
                <Button type="button" onClick={() => setQuantity((q) => q + 1)} disabled={isOutOfStock}>
                  +
                </Button>
              </div>
            </div>

            <div className="flex gap-4">
              <Button onClick={handleAddToCart} className="flex-1 bg-accent text-white" disabled={isOutOfStock}>
                Add to Cart
              </Button>
              <Button onClick={handleBuyNow} className="flex-1 bg-navy text-white" disabled={isOutOfStock}>
                Buy Now
              </Button>
            </div>


            <div className="bg-gray-100 p-6 rounded-lg mt-6">
              <h3 className="font-bold mb-2">Product Details</h3>
              <p className="text-sm">{description}</p>
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