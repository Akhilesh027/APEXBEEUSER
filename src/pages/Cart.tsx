import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Trash2, Plus, Minus, ShoppingBag, ShieldCheck, ArrowRight, Sparkles, Store, Tag, Bookmark, Heart, Truck, Gift } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";

// Helper function to format currency
const formatCurrency = (amount: any) => {
  const value = typeof amount === "number" && !isNaN(amount) ? amount : 0;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
  }).format(value);
};

export const getItemShippingFee = (item: any): number => {
  if (!item) return 0;
  const val = Number(
    item.deliveryFee ??
    item.shippingCharge ??
    item.shipping ??
    item.shippingFee ??
    item.adminPricing?.shippingCharge ??
    item.adminPricing?.deliveryFee ??
    item.product?.adminPricing?.shippingCharge ??
    item.product?.shippingCharge ??
    item.product?.deliveryFee ??
    item.productId?.adminPricing?.shippingCharge ??
    item.productId?.adminPricing?.deliveryFee ??
    item.productId?.shippingCharge ??
    item.productId?.deliveryFee ??
    item.productId?.shipping ??
    0
  );
  return Number.isFinite(val) && val > 0 ? val : 0;
};

export const getItemPackingFee = (item: any): number => {
  if (!item) return 0;
  const val = Number(
    item.packingCharge ??
    item.packageCharge ??
    item.packagingCharge ??
    item.packingFee ??
    item.packageFee ??
    item.packagingFee ??
    item.handlingCharge ??
    item.adminPricing?.packingCharge ??
    item.adminPricing?.packageCharge ??
    item.adminPricing?.packagingFee ??
    item.product?.adminPricing?.packingCharge ??
    item.product?.packingCharge ??
    item.product?.packageCharge ??
    item.productId?.adminPricing?.packingCharge ??
    item.productId?.adminPricing?.packageCharge ??
    item.productId?.packingCharge ??
    item.productId?.packageCharge ??
    item.productId?.packagingCharge ??
    item.productId?.packingFee ??
    0
  );
  return Number.isFinite(val) && val > 0 ? val : 0;
};

export const getItemPlatformFee = (item: any): number => {
  if (!item) return 0;

  let distFrom =
    item.distributedFrom ||
    item.adminPricing?.distributedFrom ||
    item.product?.adminPricing?.distributedFrom ||
    item.productId?.adminPricing?.distributedFrom ||
    item.attributes?.distributedFrom ||
    item.product?.attributes?.distributedFrom ||
    item.productId?.attributes?.distributedFrom ||
    item.commissionType ||
    item.adminPricing?.commissionType ||
    item.product?.adminPricing?.commissionType ||
    item.productId?.adminPricing?.commissionType;

  const vendorCommPct = Number(
    item.vendorCommissionPercent ??
    item.adminPricing?.vendorCommissionPercent ??
    item.product?.adminPricing?.vendorCommissionPercent ??
    item.productId?.adminPricing?.vendorCommissionPercent ??
    0
  );

  const platformFeePct = Number(
    item.platformFeePercent ??
    item.adminPricing?.platformFeePercent ??
    item.product?.adminPricing?.platformFeePercent ??
    item.productId?.adminPricing?.platformFeePercent ??
    0
  );

  const directFee = Number(
    item.platformFeeAmount ??
    item.platformFee ??
    item.adminPricing?.platformFeeAmount ??
    item.product?.adminPricing?.platformFeeAmount ??
    item.productId?.adminPricing?.platformFeeAmount ??
    0
  );

  // Smart fallback: if distFrom not set, check if vendorCommissionPercent is set without a platform fee
  if (!distFrom) {
    if (vendorCommPct > 0 && directFee === 0 && platformFeePct === 0) {
      distFrom = 'apexbee_commission';
    } else {
      distFrom = 'platform_fee';
    }
  }

  // If commission is apexbee_commission / vendor, taken from vendor -> customer pays ₹0 platform fee
  if (distFrom === 'apexbee_commission' || distFrom === 'vendor' || distFrom === 'vendor_commission') {
    return 0;
  }

  // If commission is platform_fee or both:
  if (Number.isFinite(directFee) && directFee > 0) return directFee;

  const price = Number(item.sellingPrice ?? item.afterDiscount ?? item.price ?? 0);

  if (platformFeePct > 0 && price > 0) {
    return (price * platformFeePct) / 100;
  }

  const fixedFee = Number(
    item.commissionAmount ??
    item.adminPricing?.vendorCommissionAmount ??
    0
  );
  if ((distFrom === 'platform_fee' || distFrom === 'platform' || distFrom === 'both') && fixedFee > 0) {
    return fixedFee;
  }

  return 0;
};

const renderVariantDetails = (item: any) => {
  const details: string[] = [];

  if (item.selectedAttributes && typeof item.selectedAttributes === "object") {
    Object.entries(item.selectedAttributes).forEach(([key, val]) => {
      if (val && val !== "default") {
        const label = key.charAt(0).toUpperCase() + key.slice(1);
        details.push(`${label}: ${val}`);
      }
    });
  }

  if (details.length === 0) {
    const color = item.selectedColor || item.color;
    const size = item.selectedSize || item.size;
    if (color && color !== "default") details.push(`Color: ${color}`);
    if (size && size !== "default") details.push(`Size: ${size}`);
  }

  if (details.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5 pt-1">
      {details.map((d, idx) => (
        <span
          key={idx}
          className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-50 text-amber-900 border border-amber-200/80 shadow-2xs"
        >
          {d}
        </span>
      ))}
    </div>
  );
};

// Read pickup/preorder flags safely
const readItemFlags = (item: any) => {
  const allowPickup = Boolean(item?.allowPickup ?? item?.pickupAvailable ?? false);
  const isPreOrder = Boolean(item?.isPreOrder ?? item?.preOrder ?? false);
  const availableOn = item?.availableOn || item?.preOrderDate || null;
  return { allowPickup, isPreOrder, availableOn };
};

const API_BASE = import.meta.env.VITE_API_URL || "https://server.apexbee.in/api";

const Cart = () => {
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [savedItems, setSavedItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Guest Checkout states
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [otpLoading, setOtpLoading] = useState(false);
  const [pendingSingleItem, setPendingSingleItem] = useState<any>(null);

  // Countdown timer logic
  useEffect(() => {
    let timer: any;
    if (otpSent && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((c) => c - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [otpSent, countdown]);

  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.type = "sine";
      oscillator.frequency.value = 820;
      gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.12);
    } catch (e) {
      console.warn("Beep audio context failure", e);
    }
  };

  const handleSendOtp = () => {
    if (phone.length !== 10) return;
    setOtpLoading(true);
    setTimeout(() => {
      setOtpLoading(false);
      setOtpSent(true);
      setCountdown(60);
      playBeep();
      alert("Simulated OTP '1234' sent to your phone number!");
    }, 600);
  };

  const handleVerifyOtp = () => {
    if (otp !== "1234") {
      alert("Incorrect OTP code. Please enter '1234' for guest verification.");
      return;
    }
    setOtpLoading(true);
    setTimeout(() => {
      setOtpLoading(false);
      const guestUser = {
        id: `guest-${Date.now()}`,
        name: "Guest Customer",
        phone: phone,
        role: "customer",
        email: `guest-${phone}@apexbee.in`,
        isGuest: true
      };
      localStorage.setItem("user", JSON.stringify(guestUser));
      localStorage.setItem("token", "mock-guest-token-12345");
      setShowGuestModal(false);

      if (pendingSingleItem) {
        handleCheckoutSingleItem(pendingSingleItem);
        setPendingSingleItem(null);
      } else {
        navigate("/checkout", {
          state: {
            cartItems,
            subtotal,
            discount,
            deliveryFee: totalDeliveryFee,
            total,
            pickupPossible,
            preOrderInfo,
          },
        });
      }
      window.dispatchEvent(new Event("storage"));
    }, 600);
  };

  const user = JSON.parse(localStorage.getItem("user") || "null");
  const userId = user?.id || user?._id;

  // Fetch cart items from backend or local_cart
  const fetchCart = async () => {
    if (!userId) {
      const local = localStorage.getItem("local_cart");
      if (local) {
        try {
          setCartItems(JSON.parse(local));
        } catch {
          setCartItems([]);
        }
      } else {
        setCartItems([]);
      }
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/cart/${userId}`);
      const data = await res.json();
      const items = data.cart?.items || data.cart || [];
      if (items.length === 0) {
        const local = localStorage.getItem("local_cart");
        if (local) {
          try {
            setCartItems(JSON.parse(local));
            return;
          } catch { }
        }
      }
      setCartItems(items);
    } catch (err) {
      console.error("Error fetching cart:", err);
      const local = localStorage.getItem("local_cart");
      if (local) {
        try { setCartItems(JSON.parse(local)); } catch { }
      }
    }
  };

  useEffect(() => {
    fetchCart();
    try {
      const saved = localStorage.getItem("mock_save_for_later");
      if (saved) setSavedItems(JSON.parse(saved));
    } catch (err) {
      console.error("Error loading saved items:", err);
    }
  }, [userId]);

  // Update quantity
  const updateQuantity = async (itemId: string, delta: number) => {
    if (!userId) {
      const local = localStorage.getItem("local_cart");
      let list = [];
      if (local) {
        try { list = JSON.parse(local); } catch { list = []; }
      }
      if (!Array.isArray(list)) list = [];

      const itemIdx = list.findIndex((i: any) => i._id === itemId || i.productId === itemId);
      if (itemIdx > -1) {
        const newQty = list[itemIdx].quantity + delta;
        if (newQty < 1) return;
        list[itemIdx].quantity = newQty;
        localStorage.setItem("local_cart", JSON.stringify(list));
        setCartItems(list);
        window.dispatchEvent(new Event("storage"));
      }
      return;
    }
    const item = cartItems.find((i) => i._id === itemId || i.productId === itemId);
    if (!item) return;

    const newQuantity = item.quantity + delta;
    if (newQuantity < 1) return;

    if (delta > 0 && item.stock !== undefined && item.stock !== null && newQuantity > item.stock) {
      alert(`Only ${item.stock} units are available.`);
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/cart/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: item.productId || item._id, quantity: newQuantity }),
      });

      if (res.ok) {
        setCartItems((prev) =>
          prev.map((i) =>
            i._id === itemId || i.productId === itemId ? { ...i, quantity: newQuantity } : i
          )
        );
        window.dispatchEvent(new Event("storage"));
      }
    } catch (err) {
      console.error("Error updating quantity:", err);
    } finally {
      setLoading(false);
    }
  };

  // Remove item
  const removeItem = async (itemId: string) => {
    const local = localStorage.getItem("local_cart");
    let list = [];
    if (local) {
      try { list = JSON.parse(local); } catch { list = []; }
    }
    const updated = list.filter((i: any) => i._id !== itemId && i.productId !== itemId);
    localStorage.setItem("local_cart", JSON.stringify(updated));

    if (!userId) {
      setCartItems(updated);
      window.dispatchEvent(new Event("storage"));
      return;
    }
    const item = cartItems.find((i) => i._id === itemId || i.productId === itemId);
    if (!item) return;

    try {
      setLoading(true);
      await fetch(`${API_BASE}/cart/${userId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: item.productId || item._id }),
      });

      setCartItems((prev) => prev.filter((i) => i._id !== itemId && i.productId !== itemId));
      window.dispatchEvent(new Event("storage"));
    } catch (err) {
      console.error("Error removing item:", err);
    } finally {
      setLoading(false);
    }
  };

  // Save for Later
  const saveForLater = async (item: any) => {
    const itemCopy = { ...item };
    const updatedSaved = [...savedItems.filter(i => (i.productId || i._id) !== (item.productId || item._id)), itemCopy];
    setSavedItems(updatedSaved);
    localStorage.setItem("mock_save_for_later", JSON.stringify(updatedSaved));
    removeItem(item._id || item.productId);
  };

  // Move to Cart from Saved list
  const moveToCart = async (item: any) => {
    const updatedSaved = savedItems.filter((i) => (i.productId || i._id) !== (item.productId || item._id));
    setSavedItems(updatedSaved);
    localStorage.setItem("mock_save_for_later", JSON.stringify(updatedSaved));

    const local = JSON.parse(localStorage.getItem("local_cart") || "[]");
    local.push({ ...item, quantity: 1 });
    localStorage.setItem("local_cart", JSON.stringify(local));

    if (userId) {
      const token = localStorage.getItem("token");
      try {
        await fetch(`${API_BASE}/cart/add`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            userId,
            productId: item.productId || item._id,
            quantity: 1,
            color: item.color || "default",
            size: item.size || "default",
          }),
        });
      } catch (err) {
        console.error("Error adding to cart:", err);
      }
    }
    fetchCart();
    window.dispatchEvent(new Event("storage"));
  };

  // Move to Wishlist
  const moveToWishlist = async (item: any) => {
    if (!userId) {
      alert("Please login to save items to your wishlist.");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      await fetch(`${API_BASE}/wishlist/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          userId,
          productId: item.productId || item._id,
        }),
      });
      removeItem(item._id || item.productId);
      alert("Moved to Wishlist!");
    } catch (e) {
      console.error("Move to wishlist error", e);
    }
  };

  // Group items by vendor / restaurant
  const groupedCartItems = useMemo(() => {
    const groups: { [key: string]: { vendorName: string; vendorId: string; items: any[] } } = {};

    cartItems.forEach((item) => {
      const vendorId = item.vendorId || item.restaurantId || "apexbee-store";
      const vendorName = item.vendorName || item.restaurantName || "ApexBee Store & Food Outlets";

      if (!groups[vendorId]) {
        groups[vendorId] = {
          vendorName,
          vendorId,
          items: [],
        };
      }
      groups[vendorId].items.push(item);
    });
    return Object.values(groups);
  }, [cartItems]);

  // Subtotal (product base selling price)
  const subtotal = cartItems.reduce(
    (sum, item) => sum + (item.sellingPrice || item.afterDiscount || item.price || 0) * (item.quantity || 1),
    0
  );

  // Original total before discounts (MRP)
  const originalTotal = cartItems.reduce(
    (sum, item) => sum + (item.originalPrice || item.salesPrice || item.mrp || item.price || 0) * (item.quantity || 1),
    0
  );
  const discount = Math.max(0, originalTotal - subtotal);

  // delivery fee
  const totalDeliveryFee = cartItems.reduce((sum, item: any) => sum + (getItemShippingFee(item) * (item.quantity || 1)), 0);

  // packing fee
  const totalPackingFee = cartItems.reduce((sum, item: any) => sum + (getItemPackingFee(item) * (item.quantity || 1)), 0);

  // platform fee (if commission type is platform or platform fee applies)
  const totalPlatformFee = cartItems.reduce((sum, item: any) => sum + (getItemPlatformFee(item) * (item.quantity || 1)), 0);

  // GST Tax 5%
  const taxableAmount = subtotal + totalPackingFee + totalDeliveryFee + totalPlatformFee;
  const gstTax = Math.round(taxableAmount * 0.05);

  const total = taxableAmount + gstTax;

  // Pre-order: compute max availableOn
  const preOrderInfo = useMemo(() => {
    const preItems = cartItems
      .map((it) => ({ ...it, ...readItemFlags(it) }))
      .filter((it) => it.isPreOrder && it.availableOn);

    if (preItems.length === 0) return { hasPreOrder: false, availableOnMax: null };

    const maxDate = preItems
      .map((it) => new Date(it.availableOn))
      .reduce((a, b) => (a > b ? a : b));

    return { hasPreOrder: true, availableOnMax: maxDate.toISOString() };
  }, [cartItems]);

  const pickupPossible = useMemo(() => {
    return cartItems.some((it) => readItemFlags(it).allowPickup);
  }, [cartItems]);

  const handleCheckout = () => {
    if (cartItems.length === 0) return alert("Your cart is empty!");

    const outOfStockItems = cartItems.filter(item => item.stock !== undefined && item.stock !== null && item.stock <= 0);
    if (outOfStockItems.length > 0) {
      alert(`The following items are out of stock: ${outOfStockItems.map(i => i.itemName || i.name).join(", ")}. Please remove them to proceed.`);
      return;
    }

    if (!userId) {
      setShowGuestModal(true);
      return;
    }

    navigate("/checkout", {
      state: {
        cartItems,
        subtotal,
        discount,
        deliveryFee: totalDeliveryFee,
        packingFee: totalPackingFee,
        platformFee: totalPlatformFee,
        tax: gstTax,
        total,
        pickupPossible,
        preOrderInfo,
      },
    });
  };

  const handleCheckoutSingleItem = (item: any) => {
    if (item.stock !== undefined && item.stock !== null && item.stock <= 0) {
      alert(`This item (${item.itemName || item.name}) is out of stock.`);
      return;
    }

    const { allowPickup, isPreOrder, availableOn } = readItemFlags(item);
    const itemSubtotal = (item.sellingPrice || item.afterDiscount || item.price || 0) * (item.quantity || 1);
    const itemOriginalTotal = (item.originalPrice || item.salesPrice || item.mrp || item.price || 0) * (item.quantity || 1);
    const itemDiscount = Math.max(0, itemOriginalTotal - itemSubtotal);

    const itemDeliveryFee = getItemShippingFee(item) * (item.quantity || 1);
    const itemPackingFee = getItemPackingFee(item) * (item.quantity || 1);
    const itemPlatformFee = getItemPlatformFee(item) * (item.quantity || 1);

    const itemTaxable = itemSubtotal + itemPackingFee + itemDeliveryFee + itemPlatformFee;
    const itemGstTax = Math.round(itemTaxable * 0.05);

    const itemTotal = itemTaxable + itemGstTax;

    const singlePreOrderInfo = {
      hasPreOrder: isPreOrder && Boolean(availableOn),
      availableOnMax: availableOn ? new Date(availableOn).toISOString() : null,
    };

    if (!userId) {
      setPendingSingleItem(item);
      setShowGuestModal(true);
      return;
    }

    navigate("/checkout", {
      state: {
        cartItems: [item],
        subtotal: itemSubtotal,
        discount: itemDiscount,
        deliveryFee: itemDeliveryFee,
        packingFee: itemPackingFee,
        platformFee: itemPlatformFee,
        tax: itemGstTax,
        total: itemTotal,
        pickupPossible: allowPickup,
        preOrderInfo: singlePreOrderInfo,
        singleItemCheckout: true,
      },
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">
      <Navbar />

      {/* TOP HEADER BANNER */}
      <div className="bg-[#0A1128] text-white py-8 px-4 sm:px-8 border-b border-amber-500/20">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center space-x-2 bg-amber-500/20 text-amber-400 px-3 py-1 rounded-full text-xs font-extrabold border border-amber-500/30">
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>APEXBEE SECURE CART</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white font-heading">Your Shopping & Dining Cart</h1>
          </div>

          <div className="flex items-center space-x-2 text-xs text-amber-300 font-bold bg-white/10 px-4 py-2 rounded-2xl backdrop-blur">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>100% Safe Payments & Fast Dispatch</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-8">
        {/* QUICK NOTIFICATION STRIP */}
        <div className="bg-amber-400 text-[#0A1128] font-black text-xs py-2.5 px-4 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 shrink-0" />
            <span>Earn 10% Instant Wallet Bonus Cashback on Checkout Today!</span>
          </div>
          <span className="hidden sm:inline font-mono">CODE: APEXCHECKOUT</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT: CART ITEMS BY VENDOR */}
          <div className="lg:col-span-2 space-y-6">
            {cartItems.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 shadow-md p-8 space-y-4">
                <ShoppingBag className="w-16 h-16 text-slate-300 mx-auto" />
                <h3 className="text-xl font-black text-[#0A1128] font-heading">Your Cart is Empty</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Explore thousands of fresh products, fashion, groceries, and delicious restaurant meals on ApexBee.
                </p>
                <div className="flex items-center justify-center space-x-3 pt-2">
                  <Button
                    onClick={() => navigate("/products")}
                    className="bg-[#0A1128] hover:bg-slate-800 text-white font-extrabold text-xs px-6 py-2.5 rounded-2xl shadow-md"
                  >
                    Browse Products
                  </Button>
                  <Button
                    onClick={() => navigate("/food")}
                    className="bg-amber-500 hover:bg-amber-400 text-[#0A1128] font-extrabold text-xs px-6 py-2.5 rounded-2xl shadow-md"
                  >
                    Explore Food & Dining
                  </Button>
                </div>
              </div>
            ) : (
              groupedCartItems.map((group: any) => (
                <div key={group.vendorId} className="bg-white rounded-3xl p-6 shadow-md border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center space-x-2">
                      <Store className="w-4 h-4 text-amber-500" />
                      <h2 className="text-base font-black text-[#0A1128] font-heading">{group.vendorName}</h2>
                    </div>
                    <span className="text-[10px] font-black bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full uppercase tracking-wider">
                      {group.items.length} {group.items.length === 1 ? 'Item' : 'Items'}
                    </span>
                  </div>

                  <div className="divide-y divide-slate-100 space-y-4">
                    {group.items.map((item: any) => {
                      const { allowPickup, isPreOrder, availableOn } = readItemFlags(item);

                      return (
                        <div key={item._id || item.productId} className="pt-4 flex flex-col sm:flex-row items-start justify-between gap-4">
                          <div className="flex items-start space-x-4 flex-1">
                            <img
                              src={item.images?.[0] || item.image || item.imageUrl || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=400&auto=format&fit=crop"}
                              alt={item.itemName || item.name}
                              className="w-20 h-20 object-cover rounded-2xl border border-slate-200 bg-slate-50 shrink-0 shadow-sm"
                            />

                            <div className="space-y-1">
                              <h3 className="font-extrabold text-slate-900 text-base leading-snug font-heading">
                                {item.itemName || item.name}
                              </h3>
                              <p className="text-xs text-slate-500 font-medium">
                                Category: <span className="font-bold text-slate-700">{item.categoryName || "Marketplace"}</span>
                              </p>
                              {renderVariantDetails(item)}

                              <div className="flex items-center space-x-2 pt-1">
                                <span className="text-base font-black text-[#0A1128] font-mono">
                                  {formatCurrency(item.sellingPrice || item.afterDiscount || item.price)}
                                </span>
                                {item.originalPrice && item.originalPrice > (item.sellingPrice || item.afterDiscount || item.price) && (
                                  <span className="text-xs text-slate-400 line-through font-normal">
                                    {formatCurrency(item.originalPrice)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* QUANTITY & ACTIONS */}
                          <div className="flex flex-col sm:items-end justify-between space-y-3 w-full sm:w-auto pt-2 sm:pt-0">
                            <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-2xl border border-slate-200">
                              <button
                                onClick={() => updateQuantity(item._id || item.productId, -1)}
                                disabled={loading || item.quantity <= 1}
                                className="w-7 h-7 rounded-xl bg-white hover:bg-slate-200 text-slate-800 flex items-center justify-center transition disabled:opacity-40 cursor-pointer shadow-sm"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="w-8 text-center text-xs font-black font-mono">{item.quantity}</span>
                              <button
                                onClick={() => updateQuantity(item._id || item.productId, 1)}
                                disabled={loading}
                                className="w-7 h-7 rounded-xl bg-white hover:bg-slate-200 text-slate-800 flex items-center justify-center transition disabled:opacity-40 cursor-pointer shadow-sm"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs font-bold">
                              <button
                                onClick={() => handleCheckoutSingleItem(item)}
                                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[11px] rounded-xl shadow-xs transition cursor-pointer flex items-center space-x-1.5 border-none"
                              >
                                <ShoppingBag className="w-3.5 h-3.5" />
                                <span>Buy Only This Item</span>
                              </button>
                              <button
                                onClick={() => saveForLater(item)}
                                className="text-slate-500 hover:text-[#0A1128] transition cursor-pointer"
                              >
                                Save for Later
                              </button>
                              <button
                                onClick={() => removeItem(item._id || item.productId)}
                                className="text-rose-600 hover:text-rose-800 font-extrabold transition cursor-pointer flex items-center space-x-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Remove</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}

            {/* SAVED FOR LATER SECTION */}
            {savedItems.length > 0 && (
              <div className="bg-white rounded-3xl p-6 shadow-md border border-slate-200 space-y-4">
                <h2 className="text-lg font-black text-[#0A1128] font-heading flex items-center space-x-2">
                  <Bookmark className="w-5 h-5 text-amber-500" />
                  <span>Saved for Later ({savedItems.length})</span>
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {savedItems.map((item: any) => (
                    <div key={item._id || item.productId} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-3">
                      <div className="flex items-center space-x-3">
                        <img
                          src={item.image || item.imageUrl || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=400&auto=format&fit=crop"}
                          alt={item.name}
                          className="w-14 h-14 object-cover rounded-xl border"
                        />
                        <div>
                          <h4 className="font-extrabold text-xs text-slate-900 line-clamp-1">{item.name || item.itemName}</h4>
                          <div className="text-xs font-black text-amber-600 font-mono mt-0.5">{formatCurrency(item.price)}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => moveToCart(item)}
                        className="px-3 py-1.5 bg-[#0A1128] hover:bg-slate-800 text-amber-400 font-black text-[11px] rounded-xl cursor-pointer shadow"
                      >
                        Move to Cart
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: ORDER SUMMARY SIDEBAR */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-200 space-y-5 sticky top-24">
              <h2 className="text-xl font-black text-[#0A1128] font-heading border-b border-slate-100 pb-3">
                Order Summary
              </h2>

              <div className="space-y-3 text-xs font-semibold text-slate-600">
                <div className="flex justify-between">
                  <span>Total Product MRP</span>
                  <span className="font-bold text-slate-900 font-mono">{formatCurrency(originalTotal)}</span>
                </div>

                {discount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-bold">
                    <span>Discount Savings</span>
                    <span className="font-mono">-{formatCurrency(discount)}</span>
                  </div>
                )}

                <div className="flex justify-between text-slate-600">
                  <span>Item Subtotal</span>
                  <span className="font-bold text-slate-900 font-mono">{formatCurrency(subtotal)}</span>
                </div>

                <div className="flex justify-between text-slate-600">
                  <span>Estimated Delivery Charge</span>
                  <span className={`font-bold font-mono ${totalDeliveryFee === 0 ? "text-emerald-600" : "text-slate-900"}`}>
                    {totalDeliveryFee === 0 ? "FREE" : formatCurrency(totalDeliveryFee)}
                  </span>
                </div>

                {totalPackingFee > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Packing Fee</span>
                    <span className="font-bold text-slate-900 font-mono">{formatCurrency(totalPackingFee)}</span>
                  </div>
                )}

                {totalPlatformFee > 0 && (
                  <div className="flex justify-between text-amber-800 font-bold bg-amber-50 p-2 rounded-xl border border-amber-200">
                    <span>Platform Fee</span>
                    <span className="font-mono">+{formatCurrency(totalPlatformFee)}</span>
                  </div>
                )}

                <div className="flex justify-between text-slate-600">
                  <span>Estimated GST Tax (5%)</span>
                  <span className="font-bold text-slate-900 font-mono">{formatCurrency(gstTax)}</span>
                </div>

                <div className="border-t border-slate-200 pt-3 flex justify-between text-base font-black text-[#0A1128]">
                  <span>Total Payable</span>
                  <span className="text-xl text-amber-600 font-mono">{formatCurrency(total)}</span>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                disabled={cartItems.length === 0 || loading}
                className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-[#0A1128] font-black text-sm rounded-2xl shadow-lg shadow-amber-500/20 transition cursor-pointer flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-[11px] text-slate-400 text-center font-medium pt-1">
                🔒 Encrypted Payments & Instant Refund Assurance
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Cart;
