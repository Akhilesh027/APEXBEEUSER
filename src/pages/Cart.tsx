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

  const user = JSON.parse(localStorage.getItem("user") || "null");
  const userId = user?.id || user?._id;

  // Fetch cart items from backend
  const fetchCart = async () => {
    if (!userId) return;
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
    if (!userId) return;
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
    if (!userId) return;
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
      const res = await fetch(`${API_BASE}/cart/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
    </div>
  );
};

export default Cart;
