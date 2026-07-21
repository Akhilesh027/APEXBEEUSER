import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Trash2, Plus, Minus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

// Helper function to format currency
const formatCurrency = (amount) => {
  const value = typeof amount === "number" && !isNaN(amount) ? amount : 0;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
  }).format(value);
};

// ✅ Read pickup/preorder flags safely (rename fields if needed)
const readItemFlags = (item) => {
  const allowPickup = Boolean(item?.allowPickup ?? item?.pickupAvailable ?? false);
  const isPreOrder = Boolean(item?.isPreOrder ?? item?.preOrder ?? false);
  const availableOn = item?.availableOn || item?.preOrderDate || null; // string/ISO
  return { allowPickup, isPreOrder, availableOn };
};

const API_BASE = "https://server.apexbee.in/api";

const Cart = () => {
  const [cartItems, setCartItems] = useState([]);
  const [savedItems, setSavedItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Guest Checkout states
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [otpLoading, setOtpLoading] = useState(false);

  // Countdown timer logic
  useEffect(() => {
    let timer;
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
      // Register guest customer
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

      // Navigate to checkout directly
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
      window.dispatchEvent(new Event("storage"));
    }, 600);
  };

  const user = JSON.parse(localStorage.getItem("user") || "null");
  const userId = user?.id || user?._id;

  // Fetch cart items from backend
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
      setCartItems(data.cart?.items || data.cart || []);
    } catch (err) {
      console.error("Error fetching cart:", err);
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
  const updateQuantity = async (itemId, delta) => {
    if (!userId) {
      const local = localStorage.getItem("local_cart");
      let list = [];
      if (local) {
        try { list = JSON.parse(local); } catch { list = []; }
      }
      if (!Array.isArray(list)) list = [];

      const itemIdx = list.findIndex((i) => i._id === itemId || i.productId === itemId);
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

    if (delta > 0 && item.stock !== undefined && newQuantity > item.stock) {
      alert(`Only ${item.stock} units are in stock for this product.`);
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/cart/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: item.productId || item._id, quantity: newQuantity }),
      });

      const data = await res.json();

      if (res.ok) {
        setCartItems((prev) =>
          prev.map((i) =>
            i._id === itemId || i.productId === itemId ? { ...i, quantity: newQuantity } : i
          )
        );
        window.dispatchEvent(new Event("storage"));
      } else {
        alert(data.message || "Failed to update quantity");
      }
    } catch (err) {
      console.error("Error updating quantity:", err);
    } finally {
      setLoading(false);
    }
  };

  // Remove item
  const removeItem = async (itemId) => {
    if (!userId) {
      const local = localStorage.getItem("local_cart");
      let list = [];
      if (local) {
        try { list = JSON.parse(local); } catch { list = []; }
      }
      if (!Array.isArray(list)) list = [];

      const updated = list.filter((i) => i._id !== itemId && i.productId !== itemId);
      localStorage.setItem("local_cart", JSON.stringify(updated));
      setCartItems(updated);
      window.dispatchEvent(new Event("storage"));
      return;
    }
    const item = cartItems.find((i) => i._id === itemId || i.productId === itemId);
    if (!item) return;

    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/cart/${userId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: item.productId || item._id }),
      });

      if (res.ok) {
        setCartItems((prev) => prev.filter((i) => i._id !== itemId && i.productId !== itemId));
        window.dispatchEvent(new Event("storage"));
      } else {
        console.error("Failed to remove item");
      }
    } catch (err) {
      console.error("Error removing item:", err);
    } finally {
      setLoading(false);
    }
  };

  // Save for Later
  const saveForLater = async (item) => {
    if (!userId) return;
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/cart/${userId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: item.productId || item._id }),
      });

      if (res.ok) {
        const itemCopy = { ...item };
        const updatedSaved = [...savedItems.filter(i => (i.productId || i._id) !== (item.productId || item._id)), itemCopy];
        setSavedItems(updatedSaved);
        localStorage.setItem("mock_save_for_later", JSON.stringify(updatedSaved));

        setCartItems((prev) => prev.filter((i) => i._id !== item._id && i.productId !== item.productId));
        window.dispatchEvent(new Event("storage"));
      }
    } catch (err) {
      console.error("Error saving for later:", err);
    } finally {
      setLoading(false);
    }
  };

  // Move to Cart from Saved list
  const moveToCart = async (item) => {
    if (!userId) return;
    // Check stock before moving to cart
    if (item.stock !== undefined && item.stock <= 0) {
      alert("This item is currently out of stock and cannot be moved to cart.");
      return;
    }
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/cart/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          userId,
          productId: item.productId || item._id,
          quantity: item.quantity || 1,
          color: item.color || "default",
          size: item.size || "One Size",
        }),
      });

      if (res.ok) {
        const updatedSaved = savedItems.filter(i => (i.productId || i._id) !== (item.productId || item._id));
        setSavedItems(updatedSaved);
        localStorage.setItem("mock_save_for_later", JSON.stringify(updatedSaved));

        await fetchCart();
        window.dispatchEvent(new Event("storage"));
      }
    } catch (err) {
      console.error("Error moving to cart:", err);
    } finally {
      setLoading(false);
    }
  };

  // Delete Saved Item
  const deleteSavedItem = (item) => {
    const updatedSaved = savedItems.filter(i => (i.productId || i._id) !== (item.productId || item._id));
    setSavedItems(updatedSaved);
    localStorage.setItem("mock_save_for_later", JSON.stringify(updatedSaved));
  };

  // Move to Wishlist
  const moveToWishlist = async (item) => {
    if (!userId) return;
    try {
      setLoading(true);
      const resWish = await fetch(`${API_BASE}/wishlist/toggle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, productId: item.productId || item._id }),
      });
      const dataWish = await resWish.json();

      if (dataWish.success) {
        const resCart = await fetch(`${API_BASE}/cart/${userId}`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId: item.productId || item._id }),
        });

        if (resCart.ok) {
          setCartItems((prev) => prev.filter((i) => i._id !== item._id && i.productId !== item.productId));
          window.dispatchEvent(new Event("storage"));
          alert("Moved to Wishlist!");
        }
      }
    } catch (err) {
      console.error("Error moving to wishlist:", err);
    } finally {
      setLoading(false);
    }
  };

  // Group cart items by vendor
  const groupedCartItems = useMemo(() => {
    const groups = {};
    cartItems.forEach((item: any) => {
      const vendorId = item.vendorId || "unknown";
      const vendorName = item.vendorName || "ApexBee Seller";
      if (!groups[vendorId]) {
        groups[vendorId] = { vendorId, vendorName, items: [] };
      }
      groups[vendorId].items.push(item);
    });
    return Object.values(groups);
  }, [cartItems]);

  // Subtotal (product selling price)
  const subtotal = cartItems.reduce(
    (sum, item) => sum + (item.afterDiscount || item.price) * item.quantity,
    0
  );

  // Original total before discounts (MRP)
  const originalTotal = cartItems.reduce(
    (sum, item) => sum + (item.originalPrice || item.salesPrice || item.price) * item.quantity,
    0
  );
  const discount = Math.max(0, originalTotal - subtotal);

  // delivery fee (display only, already included in selling price)
  const totalDeliveryFee = cartItems.reduce(
    (sum, item) => sum + (item.deliveryFee ?? 0) * item.quantity,
    0
  );

  // Grand total = subtotal only (shipping is already included, not added)
  const total = subtotal;

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

  // pickup possible if ANY item allows pickup
  const pickupPossible = useMemo(() => {
    return cartItems.some((it) => readItemFlags(it).allowPickup);
  }, [cartItems]);

  const handleCheckout = () => {
    if (cartItems.length === 0) return alert("Your cart is empty!");

    // Stock validation check
    const outOfStockItems = cartItems.filter(item => !item.stock || item.stock <= 0);
    if (outOfStockItems.length > 0) {
      alert(`The following items are out of stock: ${outOfStockItems.map(i => i.itemName || i.name).join(", ")}. Please remove them to proceed.`);
      return;
    }

    const overStockItems = cartItems.filter(item => item.quantity > (item.stock || 0));
    if (overStockItems.length > 0) {
      alert(`The following items exceed available stock: ${overStockItems.map(i => `${i.itemName || i.name} (Available: ${i.stock})`).join(", ")}. Please adjust their quantities.`);
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
        total,
        pickupPossible,
        preOrderInfo,
      },
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-navy mb-8">Shopping Cart</h1>

        {/* quick info banners */}
        {cartItems.length > 0 && (
          <div className="mb-5 space-y-2">
            {pickupPossible && (
              <div className="rounded-lg border bg-blue-50 border-blue-200 p-3 text-sm text-blue-800">
                ✅ Self Pickup available for some items (choose in checkout)
              </div>
            )}
            {preOrderInfo.hasPreOrder && (
              <div className="rounded-lg border bg-amber-50 border-amber-200 p-3 text-sm text-amber-800">
                ⏳ Pre-order items in cart. Ready on / after:{" "}
                <strong>{new Date(preOrderInfo.availableOnMax).toDateString()}</strong>
              </div>
            )}
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-6">
            {cartItems.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg border p-6">
                <p className="text-muted-foreground text-lg mb-4">Your cart is empty</p>
                <Button
                  onClick={() => navigate("/products")}
                  className="bg-navy hover:bg-navy/90 text-white"
                >
                  Continue Shopping
                </Button>
              </div>
            ) : (
              groupedCartItems.map((group: any) => (
                <div key={group.vendorId} className="bg-white rounded-lg p-5 shadow-sm border border-gray-100">
                  <h2 className="text-base font-bold text-navy border-b pb-3 mb-4 flex items-center gap-2">
                    <span className="bg-accent/15 text-accent text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                      Seller
                    </span>
                    {group.vendorName}
                  </h2>

                  <div className="space-y-6">
                    {group.items.map((item) => {
                      const { allowPickup, isPreOrder, availableOn } = readItemFlags(item);
                      const isLowStock = item.stock > 0 && item.stock <= 5;
                      const isOutOfStock = !item.stock || item.stock <= 0;

                      return (
                        <div
                          key={item._id || item.productId}
                          className="flex flex-col sm:flex-row gap-4 pb-6 border-b last:border-b-0 last:pb-0"
                        >
                          <img
                            src={item.images?.[0] || item.image || "/placeholder.svg"}
                            alt={item.itemName || item.name}
                            className="w-24 h-24 object-cover rounded border bg-gray-50 flex-shrink-0"
                          />

                          <div className="flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <h3 className="font-semibold text-navy text-base leading-snug">
                                  {item.itemName || item.name}
                                </h3>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  Category: {item.categoryName || "Marketplace"} | Return: <span className="font-semibold text-navy">{item.returnPolicy || "7-day Easy Return"}</span>
                                </p>
                              </div>

                              <div className="flex flex-wrap gap-2">
                                {allowPickup && (
                                  <span className="text-[10px] px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 font-medium">
                                    Pickup
                                  </span>
                                )}
                                {isPreOrder && (
                                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-medium">
                                    Pre-order
                                  </span>
                                )}
                              </div>
                            </div>

                            {isPreOrder && availableOn && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Available on: <strong>{new Date(availableOn).toDateString()}</strong>
                              </p>
                            )}

                            {isOutOfStock ? (
                              <p className="text-xs font-bold text-red-600 mt-1">Out of Stock</p>
                            ) : isLowStock ? (
                              <p className="text-xs font-semibold text-orange-600 mt-1">Only {item.stock} left in stock!</p>
                            ) : (
                              <p className="text-xs text-green-600 mt-1 font-medium">In Stock</p>
                            )}

                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-lg font-bold text-navy">
                                {formatCurrency(item.afterDiscount || item.price)}
                              </span>
                              {item.salesPrice && item.salesPrice > (item.afterDiscount || item.price) && (
                                <span className="text-sm text-muted-foreground line-through">
                                  {formatCurrency(item.salesPrice)}
                                </span>
                              )}
                            </div>

                            {(item.deliveryFee ?? 0) > 0 && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Delivery Fee: {formatCurrency(item.deliveryFee)} per item
                              </p>
                            )}

                            <div className="flex flex-wrap items-center gap-4 mt-3 pt-3 border-t border-gray-100">
                              <div className="flex items-center gap-2 border rounded bg-gray-50">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8"
                                  onClick={() => updateQuantity(item._id || item.productId, -1)}
                                  disabled={loading || item.quantity <= 1}
                                >
                                  <Minus className="h-3.5 w-3.5" />
                                </Button>
                                <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8"
                                  onClick={() => updateQuantity(item._id || item.productId, 1)}
                                  disabled={loading || (item.stock !== undefined && item.quantity >= item.stock)}
                                >
                                  <Plus className="h-3.5 w-3.5" />
                                </Button>
                              </div>

                              <div className="flex gap-2 text-xs">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => saveForLater(item)}
                                  disabled={loading}
                                  className="h-8 text-gray-500 hover:text-navy hover:bg-gray-100"
                                >
                                  Save for Later
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => moveToWishlist(item)}
                                  disabled={loading}
                                  className="h-8 text-gray-500 hover:text-navy hover:bg-gray-100"
                                >
                                  Move to Wishlist
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeItem(item._id || item.productId)}
                                  disabled={loading}
                                  className="h-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                >
                                  Remove
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Order Summary */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 h-fit sticky top-4">
            <h2 className="text-xl font-bold text-navy mb-4">Order Summary</h2>

            <div className="space-y-3 mb-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total MRP</span>
                <span className="font-medium text-navy">{formatCurrency(originalTotal)}</span>
              </div>

              {discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount on MRP</span>
                  <span>-{formatCurrency(discount)}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span className="text-muted-foreground">Delivery Charges</span>
                <span className="font-medium text-green-600">FREE (Included in Price)</span>
              </div>

              <div className="border-t pt-3 flex justify-between text-lg font-bold">
                <span>Total Amount</span>
                <span className="text-navy">{formatCurrency(total)}</span>
              </div>
            </div>

            <Button
              className="w-full bg-navy hover:bg-navy/90 text-white"
              onClick={handleCheckout}
              disabled={cartItems.length === 0 || loading}
            >
              {loading ? "Processing..." : "Proceed to Checkout"}
            </Button>

            {cartItems.length > 0 && (
              <Button variant="outline" className="w-full mt-3" onClick={() => navigate("/products")}>
                Continue Shopping
              </Button>
            )}
          </div>
        </div>

        {/* Saved For Later Section */}
        {savedItems.length > 0 && (
          <div className="mt-12 bg-white rounded-lg p-6 shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-navy mb-6 flex items-center gap-2">
              📂 Saved for Later ({savedItems.length})
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {savedItems.map((item: any) => (
                <div key={item._id || item.productId} className="flex gap-4 p-4 border rounded-lg hover:shadow-md transition">
                  <img
                    src={item.images?.[0] || item.image || "/placeholder.svg"}
                    alt={item.itemName || item.name}
                    className="w-20 h-20 object-cover rounded border bg-gray-50 flex-shrink-0"
                  />
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-semibold text-navy text-sm line-clamp-1">
                        {item.itemName || item.name}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Seller: {item.vendorName || "ApexBee Seller"}
                      </p>
                      <p className="text-sm font-bold text-navy mt-1">
                        {formatCurrency(item.afterDiscount || item.price)}
                      </p>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Button
                        size="sm"
                        className="bg-navy hover:bg-navy/90 text-white h-7 text-xs px-3"
                        onClick={() => moveToCart(item)}
                        disabled={loading}
                      >
                        Move to Cart
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-red-500 hover:text-red-700 px-2"
                        onClick={() => deleteSavedItem(item)}
                        disabled={loading}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <Footer />

      {/* Guest Checkout Dialog */}
      {showGuestModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in font-sans">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl relative border border-slate-100 text-left space-y-4">
            <button
              onClick={() => setShowGuestModal(false)}
              className="absolute top-4 right-4 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 p-1.5 rounded-full transition cursor-pointer border-none"
            >
              ✕
            </button>
            <div className="flex items-center gap-2 text-indigo-600 bg-indigo-50 border border-indigo-100 w-fit px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              <span>🚀</span> Guest Checkout
            </div>
            <div>
              <h3 className="text-lg font-black text-navy leading-none">Instant Verification</h3>
              <p className="text-xs text-muted-foreground mt-1.5 leading-snug">Verify your mobile number to checkout securely as a guest without creating an account.</p>
            </div>

            {!otpSent ? (
              <div className="space-y-3.5">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-navy">Enter Mobile Number</label>
                  <div className="flex gap-2">
                    <span className="bg-slate-100 border rounded-xl px-3 py-2.5 text-sm text-navy font-bold flex items-center shrink-0">+91</span>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      placeholder="9876543210"
                      className="flex-1 border rounded-xl px-3.5 py-2.5 text-sm font-bold text-navy bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>
                </div>
                <Button
                  className="w-full bg-navy hover:bg-navy/90 text-white font-bold"
                  onClick={handleSendOtp}
                  disabled={phone.length !== 10 || otpLoading}
                >
                  {otpLoading ? "Sending OTP..." : "Get OTP Verification Code"}
                </Button>
              </div>
            ) : (
              <div className="space-y-3.5">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-navy">Enter 4-Digit OTP Code</label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    placeholder="Enter 4-digit code (Use 1234)"
                    className="w-full text-center tracking-widest text-lg font-bold border rounded-xl py-2.5 text-navy bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                  <div className="flex justify-between items-center text-[10px] text-muted-foreground font-bold pt-1.5">
                    <span>Code sent to +91 {phone}</span>
                    <span>Resend OTP in: <strong className="text-red-500">{countdown}s</strong></span>
                  </div>
                </div>
                <Button
                  className="w-full bg-accent hover:bg-accent/90 text-white font-bold"
                  onClick={handleVerifyOtp}
                  disabled={otp.length !== 4 || otpLoading}
                >
                  {otpLoading ? "Verifying..." : "Verify & Complete Checkout"}
                </Button>
                <button
                  onClick={() => setOtpSent(false)}
                  className="w-full text-center text-xs font-semibold text-slate-500 hover:underline bg-transparent border-none cursor-pointer mt-1"
                >
                  ← Edit Phone Number
                </button>
              </div>
            )}

            <div className="text-[10px] text-muted-foreground text-center border-t pt-3">
              By checking out, you agree to our Terms and receive order notifications.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
