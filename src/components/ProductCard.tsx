import { Link } from "react-router-dom";
import { Star, Heart } from "lucide-react";
import { useState, useEffect } from "react";
import axios from "axios";

interface ProductCardProps {
  product: {
    _id: string;
    name: string;
    price: number;
    image: string;
    category: string;
    subcategory: string;
    stock: number;
    vendorId?: string;
    description?: string;
  };
}

const ProductCard = ({ product }: ProductCardProps) => {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [loadingWishlist, setLoadingWishlist] = useState(true);

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  // Check if product is already wishlisted
  useEffect(() => {
    const fetchWishlistStatus = async () => {
      if (!user?._id) {
        setLoadingWishlist(false);
        return;
      }

      try {
        const res = await axios.get(
          `https://server.apexbee.in/api/wishlist/status?userId=${user._id}&productId=${product._id}`
        );
        setIsWishlisted(res.data.isWishlisted);
      } catch (err) {
        console.error("Wishlist status error:", err);
      } finally {
        setLoadingWishlist(false);
      }
    };

    fetchWishlistStatus();
  }, [product._id, user?._id]);

  // Toggle wishlist
  const handleWishlist = async () => {
    if (!user?._id) {
      alert("Please login to manage your wishlist.");
      return;
    }

    try {
      const res = await axios.post("https://server.apexbee.in/api/wishlist/toggle", {
        userId: user._id,
        productId: product._id,
      });

      if (res.data.success) {
        setIsWishlisted(!isWishlisted);
      } else {
        alert(res.data.message || "Failed to update wishlist.");
      }
    } catch (err) {
      console.error("Wishlist toggle error:", err);
      alert("Server error while updating wishlist.");
    }
  };

  // Add to Cart
  const handleAddToCart = async () => {
    if (!user?._id) {
      alert("Please login to add to cart.");
      return;
    }

    try {
      const item = {
        userId: user._id,
        productId: product._id,
        name: product.name,
        price: product.price,
        image: product.image,
        quantity,
        selectedColor: "default",
        vendorId: product.vendorId,
      };

      const token = localStorage.getItem("token");
      const res = await axios.post("https://server.apexbee.in/api/cart/add", item, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        alert("Added to cart successfully!");
      } else {
        alert(res.data.message || "Failed to add to cart.");
      }
    } catch (err) {
      console.error("Add to cart error:", err);
      alert("Server error while adding to cart.");
    }
  };

  return (
    <div className="bg-white border rounded-2xl overflow-hidden group hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 relative flex flex-col justify-between h-full">
      {/* Wishlist */}
      <button
        onClick={handleWishlist}
        disabled={loadingWishlist}
        className="absolute z-10 top-3 right-3 bg-white/90 backdrop-blur rounded-full p-1.5 shadow hover:scale-110 transition disabled:opacity-50 border border-slate-100"
      >
        <Heart
          className={`h-4.5 w-4.5 ${isWishlisted ? "fill-red-500 text-red-500" : "text-gray-500"}`}
        />
      </button>

      <Link to={`/product/${product._id}`} className="flex flex-col flex-1">
        <div className="relative aspect-square w-full bg-slate-50 overflow-hidden flex items-center justify-center border-b">
          <img
            src={`${product.image}`}
            alt={product.name}
            className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300 p-2"
          />
          {product.stock === 0 ? (
            <div className="absolute top-2 left-2 bg-red-600 text-white px-2.5 py-1 text-[9px] font-black rounded-full shadow-sm">
              Out of Stock
            </div>
          ) : (
            <>
              {/* 1. Discount */}
              {product.discountPercent && product.discountPercent > 0 ? (
                <div className="absolute top-2 left-2 bg-green-600 text-white px-2.5 py-1 text-[9px] font-black rounded-full shadow-sm">
                  🔥 {product.discountPercent}% OFF
                </div>
              ) : null}
              {/* 2. Fast Delivery */}
              {product.estimatedDeliveryMinutes ? (
                <div className="absolute bottom-2 left-2 bg-accent/90 text-white px-2.5 py-1 text-[9px] font-black rounded-full shadow-sm backdrop-blur-sm hidden md:inline">
                  ⚡ Fast [{product.estimatedDeliveryMinutes} MINS]
                </div>
              ) : null}
            </>
          )}
        </div>

        <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2">
          <div>
            {/* 3. Store Name with Store Rating */}
            <div className="flex items-center justify-between text-[9px] font-bold text-slate-500 mb-1">
              <span className="truncate max-w-[70%] hidden md:inline">🏪 {product.brand || "ApexBee Seller"}</span>
              {product.storeRating && (
                <span className="text-amber-600 bg-amber-50 px-1 rounded shrink-0">★ {product.storeRating}</span>
              )}
            </div>

            <h3 className="text-xs font-extrabold text-navy leading-snug line-clamp-2 min-h-[32px] group-hover:text-accent transition-colors">
              {product.name}
            </h3>

            {product.category && (
              <p className="text-[9px] text-muted-foreground mt-0.5 truncate">
                {product.category} {product.subcategory && `/ ${product.subcategory}`}
              </p>
            )}
          </div>

          <div className="space-y-1.5 mt-auto">
            {/* Price & MRP */}
            <div className="flex items-baseline gap-1.5">
              <span className="text-sm font-black text-navy">₹{product.sellingPrice || product.baseSellingPrice || product.price || 0}</span>
              {(product.baseMrp || product.mrp || product.originalPrice) && (product.baseMrp || product.mrp || product.originalPrice) > (product.sellingPrice || product.baseSellingPrice || product.price || 0) && (
                <span className="text-[10px] text-slate-400 line-through">₹{product.baseMrp || product.mrp || product.originalPrice}</span>
              )}
            </div>

            {/* 4. Product Rating & 5. Sold Count */}
            <div className="flex items-center justify-between text-[9px] text-slate-500 font-bold border-t border-dashed pt-1.5">
              <span className="flex items-center gap-0.5">
                {product.rating && Number(product.rating) > 0 && (product.reviews || 0) > 0 ? `⭐ ${Number(product.rating).toFixed(1)} (${product.reviews})` : '⭐ New'}
              </span>
              <span>👥 {product.soldCount && product.soldCount > 0 ? `${product.soldCount}+ Sold` : '0 Sold'}</span>
            </div>

            {/* 6. Delivery Type & 7. Distance + Delivery Charges */}
            <div className="bg-slate-50 rounded-xl p-1.5 text-[9px] text-slate-600 font-bold space-y-0.5 mt-2">
              <div className="flex items-center justify-between">
                <span className="text-accent shrink-0 font-extrabold">
                  {(product as any).isCourierShipping || ((product as any).calculatedDistanceKm && (product as any).calculatedDistanceKm > 20)
                    ? "🌐 Courier [2-4 Days]"
                    : "⚡ Fast Delivery (15-30 Mins)"}
                </span>
                <span className="text-primary font-black uppercase text-[8px] bg-primary/10 px-1 rounded">
                  {(product as any).deliveryMode === "platform_delivery" || (product as any).deliveryMode === "Platform" ? "Platform" : "Vendor"}
                </span>
              </div>
              <div className="flex items-center justify-between text-[8px] text-slate-500 pt-0.5 border-t border-slate-100/50">
                <span className="font-bold">
                  {(product as any).isCourierShipping || ((product as any).calculatedDistanceKm && (product as any).calculatedDistanceKm > 20)
                    ? `📦 ${(product as any).vendorLocationName ? `${(product as any).vendorLocationName} Seller` : "Pan India Courier"}`
                    : "📍 Nearby You (Local Store)"}
                </span>
                <span className="font-extrabold text-emerald-600">
                  Delivery: {((product as any).shippingCharge || (product as any).adminPricing?.shippingCharge) ? `₹${(product as any).shippingCharge || (product as any).adminPricing?.shippingCharge}` : "FREE"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Link>

      {/* Add to Cart */}
      <button
        disabled={product.stock === 0}
        onClick={handleAddToCart}
        className={`w-full py-2.5 text-xs font-black rounded-b-2xl transition-colors border-t cursor-pointer ${product.stock === 0
          ? "bg-slate-100 text-slate-400 cursor-not-allowed border-slate-200"
          : "bg-navy hover:bg-accent text-white border-navy hover:border-accent"
          }`}
      >
        {product.stock === 0 ? "Out of Stock" : "Add to Cart"}
      </button>
    </div>
  );
};

export default ProductCard;


