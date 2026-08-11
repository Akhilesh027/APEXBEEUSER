// src/pages/MyOrders.tsx — Module 7: Enhanced Order Management
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Package,
  Truck,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2,
  X,
  MapPin,
  CreditCard,
  Calendar,
  ChevronDown,
  ChevronUp,
  Printer,
  MessageCircle,
  RotateCcw,
  Star,
  ShoppingBag,
  PhoneCall,
  Store,
  ArrowRight,
  Utensils,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const API_BASE = import.meta.env.VITE_API_URL || "https://server.apexbee.in/api";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
type OrderItem = {
  _id?: string;
  productId: any;
  name: string;
  image: string;
  quantity: number;
  price: number;
  originalPrice: number;
  itemTotal: number;
  color?: string;
  size?: string;
  returnEligible?: boolean;
  vendorId?: string;
  vendorName?: string;
};

type SubOrder = {
  subOrderId: string;
  vendorId: string;
  vendorName: string;
  estimatedDelivery: string;
  items: OrderItem[];
  summary: { subtotal: number; deliveryFee: number; tax: number; total: number };
  status?: string;
};

type TimelineEntry = {
  _id?: string;
  status: string;
  timestamp: string;
  description?: string;
};

type Order = {
  _id: string;
  orderNumber: string;
  createdAt: string;
  orderItems: OrderItem[];
  subOrders?: SubOrder[];
  orderSummary?: {
    total?: number;
    subtotal?: number;
    shipping?: number;
    discount?: number;
    couponDiscount?: number;
    walletDeduction?: number;
    rewardsDeduction?: number;
    tax?: number;
    grandTotal?: number;
    itemsCount?: number;
  };
  orderStatus?: {
    currentStatus?: string;
    timeline?: TimelineEntry[];
  };
  shippingAddress?: {
    name?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
  paymentDetails?: {
    method?: string;
    status?: string;
    amount?: number;
    transactionId?: string;
  };
  deliveryDetails?: {
    expectedDelivery?: string;
    shippingMethod?: string;
  };
  fulfillment?: {
    type?: string;
    pickupLocationId?: string;
    pickupSlot?: { date?: string; time?: string };
    userPincode?: string;
  };
  pickupVerification?: {
    otp?: string;
    verified?: boolean;
  };
  deliveryType?: string;
  coupon?: { code?: string } | null;
  metadata?: { source?: string };
};

type Review = {
  _id: string;
  orderId: string;
  productId: any;
  userId: string;
  rating: number;
  title?: string;
  comment?: string;
  createdAt?: string;
};

type ReturnStatus = "requested" | "under_review" | "approved" | "rejected" | "refund_processed";

type ReturnRecord = {
  _id: string;
  orderId: string;
  productId: string;
  reason: string;
  description: string;
  refundMethod: string;
  status: ReturnStatus;
  createdAt: string;
  amount: number;
};

const getItemImage = (item: any) => {
  if (!item) return "/placeholder-product.png";
  const img = item.image || item.thumbnail || item.productId?.thumbnail || item.productId?.images?.[0];
  if (img && typeof img === 'string' && img.trim() && img !== '/placeholder.png' && img !== '/placeholder.svg') {
    return img;
  }
  return "/placeholder-product.png";
};

const getItemName = (item: any) => {
  if (!item) return "Product";
  return item.name || item.itemName || item.productName || item.productId?.name || item.productId?.itemName || "Product";
};

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────
const STATUS_TABS = [
  { key: "all", label: "All Orders" },
  { key: "active", label: "Active" },
  { key: "delivered", label: "Delivered" },
  { key: "cancelled", label: "Cancelled" },
  { key: "returned", label: "Returned" },
];

const TRACKING_STEPS = [
  { key: "pending", label: "Order Placed", icon: "📦" },
  { key: "confirmed", label: "Confirmed", icon: "✅" },
  { key: "processing", label: "Packed", icon: "📫" },
  { key: "shipped", label: "Out for Delivery", icon: "🚚" },
  { key: "delivered", label: "Delivered", icon: "🎉" },
];

const RETURN_REASONS = [
  "Damaged Product",
  "Wrong Product Delivered",
  "Quality Issue",
  "Missing Item",
  "Product Not as Described",
  "Changed My Mind",
  "Other",
];

const RETURN_STATUS_LABELS: Record<ReturnStatus, { label: string; color: string }> = {
  requested: { label: "Return Requested", color: "bg-orange-100 text-orange-700 border-orange-200" },
  under_review: { label: "Under Review", color: "bg-blue-100 text-blue-700 border-blue-200" },
  approved: { label: "Approved", color: "bg-green-100 text-green-700 border-green-200" },
  rejected: { label: "Rejected", color: "bg-red-100 text-red-700 border-red-200" },
  refund_processed: { label: "Refund Processed", color: "bg-purple-100 text-purple-700 border-purple-200" },
};

const paymentLabel: Record<string, string> = {
  cod: "Cash on Delivery",
  upi: "UPI",
  wallet: "ApexBee Wallet",
  card: "Card Payment",
  netbanking: "Net Banking",
};

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
const formatCurrency = (amount: any) => {
  const v = typeof amount === "number" && !isNaN(amount) ? amount : Number(amount || 0);
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 0 }).format(v);
};

const formatDate = (d?: string) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" });
};

const formatDateTime = (d?: string) => {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-IN", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
};

const normalizeId = (v: any): string => {
  if (!v) return "";
  if (typeof v === "string") return v;
  return String(v._id || v.id || "");
};

const getStatusConfig = (status?: string) => {
  const map: Record<string, { icon: any; color: string; label: string; bgColor: string; borderColor: string }> = {
    pending: { icon: Clock, color: "text-orange-500", label: "Pending", bgColor: "bg-orange-50", borderColor: "border-orange-200" },
    confirmed: { icon: CheckCircle, color: "text-blue-500", label: "Confirmed", bgColor: "bg-blue-50", borderColor: "border-blue-200" },
    processing: { icon: Package, color: "text-purple-500", label: "Processing", bgColor: "bg-purple-50", borderColor: "border-purple-200" },
    shipped: { icon: Truck, color: "text-indigo-500", label: "Shipped", bgColor: "bg-indigo-50", borderColor: "border-indigo-200" },
    delivered: { icon: CheckCircle, color: "text-green-600", label: "Delivered", bgColor: "bg-green-50", borderColor: "border-green-200" },
    cancelled: { icon: AlertCircle, color: "text-red-500", label: "Cancelled", bgColor: "bg-red-50", borderColor: "border-red-200" },
    refunded: { icon: RotateCcw, color: "text-gray-500", label: "Refunded", bgColor: "bg-gray-50", borderColor: "border-gray-200" },
    returned: { icon: RotateCcw, color: "text-purple-500", label: "Returned", bgColor: "bg-purple-50", borderColor: "border-purple-200" },
    payment_pending: { icon: Clock, color: "text-orange-500", label: "Payment Pending", bgColor: "bg-orange-50", borderColor: "border-orange-200" },
    payment_verified: { icon: CheckCircle, color: "text-green-600", label: "Payment Verified", bgColor: "bg-green-50", borderColor: "border-green-200" },
    payment_failed: { icon: AlertCircle, color: "text-red-500", label: "Payment Failed", bgColor: "bg-red-50", borderColor: "border-red-200" },
    accepted: { icon: Truck, color: "text-amber-600", label: "Rider Accepted 🛵", bgColor: "bg-amber-50", borderColor: "border-amber-200" },
    Accepted: { icon: Truck, color: "text-amber-600", label: "Rider Accepted 🛵", bgColor: "bg-amber-50", borderColor: "border-amber-200" },
    assigned: { icon: Truck, color: "text-amber-600", label: "Rider Assigned 🛵", bgColor: "bg-amber-50", borderColor: "border-amber-200" },
    Assigned: { icon: Truck, color: "text-amber-600", label: "Rider Assigned 🛵", bgColor: "bg-amber-50", borderColor: "border-amber-200" },
    'Reached Vendor': { icon: Store, color: "text-purple-600", label: "Rider at Store 🏬", bgColor: "bg-purple-50", borderColor: "border-purple-200" },
    'Picked Up': { icon: Package, color: "text-indigo-600", label: "Picked Up 📦", bgColor: "bg-indigo-50", borderColor: "border-indigo-200" },
    'Reached Customer': { icon: MapPin, color: "text-sky-600", label: "Rider Arrived 📍", bgColor: "bg-sky-50", borderColor: "border-sky-200" },
  };
  return map[status || ""] || { icon: Package, color: "text-gray-500", label: status || "Unknown", bgColor: "bg-gray-50", borderColor: "border-gray-200" };
};

// Active = not delivered / not cancelled / not returned / not refunded
const isActiveOrder = (o: Order) => {
  const s = (o.orderStatus?.currentStatus || "").toLowerCase();
  return !["delivered", "cancelled", "returned", "refunded"].includes(s);
};

// ─────────────────────────────────────────────
// Tracking Timeline Component
// ─────────────────────────────────────────────
const PICKUP_TRACKING_STEPS = [
  { key: "pending", label: "Order Placed", icon: "📦" },
  { key: "confirmed", label: "Confirmed", icon: "✅" },
  { key: "processing", label: "Packed at Store", icon: "📫" },
  { key: "ready_for_pickup", label: "Ready for Pickup", icon: "🏪" },
  { key: "delivered", label: "Picked Up", icon: "🎉" },
];

const TrackingTimeline = ({ order }: { order: Order }) => {
  const isPickup = order.fulfillment?.type === "pickup" || order.deliveryType === "pickup";
  const steps = isPickup ? PICKUP_TRACKING_STEPS : TRACKING_STEPS;
  const currentStatus = order.orderStatus?.currentStatus || "pending";
  const normalizedStatus = currentStatus === 'payment_pending' ? 'pending' :
    currentStatus === 'payment_verified' ? 'confirmed' :
      currentStatus;
  const currentIdx = Math.max(0, steps.findIndex((s) => s.key === normalizedStatus));

  return (
    <div className="relative py-2">
      {/* Horizontal bar for desktop */}
      <div className="hidden sm:flex items-start justify-between relative">
        <div className="absolute top-5 left-0 right-0 h-1 bg-gray-200 z-0" />
        <div
          className="absolute top-5 left-0 h-1 bg-green-500 z-0 transition-all duration-700"
          style={{ width: `${Math.max(0, (currentIdx / (steps.length - 1)) * 100)}%` }}
        />
        {steps.map((step, i) => {
          const done = i <= currentIdx;
          const active = i === currentIdx;
          return (
            <div key={step.key} className="flex flex-col items-center z-10 flex-1">
              <div
                className={`w-10 h-10 rounded-full border-2 flex items-center justify-center text-base transition-all ${done
                  ? "bg-green-500 border-green-500 text-white shadow-md"
                  : "bg-white border-gray-300 text-gray-400"
                  } ${active ? "ring-4 ring-green-200" : ""}`}
              >
                {done ? "✓" : step.icon}
              </div>
              <p className={`text-xs mt-2 text-center font-medium ${done ? "text-green-700" : "text-gray-400"}`}>
                {step.label}
              </p>
            </div>
          );
        })}
      </div>

      {/* Vertical for mobile */}
      <div className="sm:hidden space-y-3">
        {steps.map((step, i) => {
          const done = i <= currentIdx;
          return (
            <div key={step.key} className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 ${done ? "bg-green-500 text-white" : "bg-gray-100 text-gray-400"}`}>
                {done ? "✓" : step.icon}
              </div>
              <p className={`text-sm font-medium ${done ? "text-green-700" : "text-gray-400"}`}>{step.label}</p>
            </div>
          );
        })}
      </div>

      {/* Timeline entries */}
      {(order.orderStatus?.timeline || []).length > 0 && (
        <div className="mt-4 space-y-2 border-t pt-4">
          {(order.orderStatus?.timeline || []).map((t, i) => (
            <div key={t._id || i} className="flex gap-3 text-sm">
              <div className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${i === 0 ? "bg-green-500" : "bg-gray-300"}`} />
              <div>
                <p className="font-medium capitalize">{t.status}</p>
                {t.description && <p className="text-muted-foreground text-xs">{t.description}</p>}
                <p className="text-xs text-muted-foreground">{formatDateTime(t.timestamp)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────
// Return Request Dialog
// ─────────────────────────────────────────────
const ReturnDialog = ({
  open,
  order,
  item,
  onClose,
  onSubmit,
}: {
  open: boolean;
  order: Order | null;
  item: OrderItem | null;
  onClose: () => void;
  onSubmit: (data: { reason: string; description: string; refundMethod: string }) => void;
}) => {
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [refundMethod, setRefundMethod] = useState("original");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) { setReason(""); setDescription(""); setRefundMethod("original"); }
  }, [open]);

  const handleSubmit = async () => {
    if (!reason) { alert("Please select a return reason."); return; }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    onSubmit({ reason, description, refundMethod });
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-orange-500" /> Request Return
          </DialogTitle>
        </DialogHeader>

        {item && (
          <div className="flex gap-3 p-3 bg-muted/40 rounded-lg mb-2">
            <img src={item.image} alt={item.name} className="w-14 h-14 object-cover rounded-md flex-shrink-0" />
            <div>
              <p className="font-medium text-sm">{item.name}</p>
              <p className="text-xs text-muted-foreground">Qty: {item.quantity} • {formatCurrency(item.price)}</p>
              <p className="text-xs text-muted-foreground">Order #{order?.orderNumber}</p>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {/* Reason */}
          <div>
            <label className="text-sm font-medium block mb-1.5">Return Reason <span className="text-red-500">*</span></label>
            <div className="grid grid-cols-1 gap-2">
              {RETURN_REASONS.map((r) => (
                <label key={r} className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer text-sm transition-colors ${reason === r ? "border-navy bg-navy/5 text-navy font-medium" : "border-gray-200 hover:border-gray-300"}`}>
                  <input type="radio" name="return-reason" value={r} checked={reason === r} onChange={() => setReason(r)} className="accent-navy" />
                  {r}
                </label>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-medium block mb-1.5">Additional Details (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm min-h-[80px] resize-none focus:outline-none focus:ring-2 focus:ring-navy/30"
              placeholder="Describe the issue in detail..."
            />
          </div>

          {/* Upload placeholder */}
          <div>
            <label className="text-sm font-medium block mb-1.5">Upload Photos (optional)</label>
            <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center text-sm text-muted-foreground">
              📷 Photo upload will be available soon
            </div>
          </div>

          {/* Refund method */}
          <div>
            <label className="text-sm font-medium block mb-1.5">Refund Method</label>
            <div className="space-y-2">
              {[
                { value: "original", label: "Original Payment Method", desc: "Refunded to the original payment source" },
                { value: "wallet", label: "ApexBee Wallet Credit", desc: "Instant credit to your ApexBee wallet" },
              ].map((opt) => (
                <label key={opt.value} className={`flex gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${refundMethod === opt.value ? "border-navy bg-navy/5" : "border-gray-200 hover:border-gray-300"}`}>
                  <input type="radio" name="refund-method" value={opt.value} checked={refundMethod === opt.value} onChange={() => setRefundMethod(opt.value)} className="accent-navy mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">{opt.label}</p>
                    <p className="text-xs text-muted-foreground">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button className="flex-1 bg-navy hover:bg-navy/90 text-white" onClick={handleSubmit} disabled={loading || !reason}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RotateCcw className="w-4 h-4 mr-2" />}
              Submit Return Request
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────
const MyOrders = () => {
  const navigate = useNavigate();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [trackingOrder, setTrackingOrder] = useState<Order | null>(null);
  const [liveTracking, setLiveTracking] = useState<any>(null);

  // Fetch real tracking data when tracking dialog opens
  useEffect(() => {
    if (!trackingOrder) { setLiveTracking(null); return; }
    const fetchTracking = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE}/order-tracking/${trackingOrder._id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success && data.data) {
          setLiveTracking(data.data);
        }
      } catch (err) {
        console.error("Failed to fetch tracking:", err);
      }
    };
    fetchTracking();
  }, [trackingOrder]);

  // Schedules, Subscriptions and Table Reservations State
  const [viewMode, setViewMode] = useState<"orders" | "schedules" | "tables">("orders");
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loadingSubs, setLoadingSubs] = useState(false);

  const [tableBookings, setTableBookings] = useState<any[]>([]);
  const [loadingTables, setLoadingTables] = useState(false);

  // Reviews
  const [reviewByProductId, setReviewByProductId] = useState<Record<string, Review>>({});
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewOrder, setReviewOrder] = useState<Order | null>(null);
  const [reviewProduct, setReviewProduct] = useState<OrderItem | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewComment, setReviewComment] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);

  // Returns
  const [returnOpen, setReturnOpen] = useState(false);
  const [returnOrder, setReturnOrder] = useState<Order | null>(null);
  const [returnItem, setReturnItem] = useState<OrderItem | null>(null);
  const [returns, setReturns] = useState<ReturnRecord[]>([]);

  const getAuth = () => {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    const token = localStorage.getItem("token");
    return { user, token };
  };

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true); setError("");
      const { user, token } = getAuth();
      if (!user || !token) { navigate("/login"); return; }
      const userId = user._id || user.id;
      const res = await fetch(`${API_BASE}/orders/user/${userId}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to fetch orders");
      setOrders(Array.isArray(data?.orders) ? data.orders : []);
    } catch (e: any) {
      setError(e?.message || "Failed to load orders. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  const fetchReturns = useCallback(async () => {
    try {
      const { user, token } = getAuth();
      if (!user || !token) return;
      const userId = user._id || user.id;
      const res = await fetch(`${API_BASE}/returns/user/${userId}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (res.ok) setReturns(Array.isArray(data?.returns) ? data.returns : []);
    } catch { /* silent */ }
  }, []);

  const fetchSubscriptions = useCallback(async () => {
    try {
      setLoadingSubs(true);
      const { user, token } = getAuth();
      if (!user || !token) return;
      const userId = user._id || user.id;
      const res = await fetch(`${API_BASE}/local-shop/subscriptions/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setSubscriptions(Array.isArray(data?.subscriptions) ? data.subscriptions : []);
      }
    } catch (err) {
      console.error("fetchSubscriptions error:", err);
    } finally {
      setLoadingSubs(false);
    }
  }, []);

  const handleToggleSubscriptionStatus = async (subId: string, currentStatus: string) => {
    try {
      const { token } = getAuth();
      const newStatus = currentStatus === 'active' ? 'paused' : 'active';
      const res = await fetch(`${API_BASE}/local-shop/subscriptions/${subId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        fetchSubscriptions();
      } else {
        alert("Failed to update subscription status");
      }
    } catch (err) {
      console.error("status update error:", err);
    }
  };

  const handleSkipNextDelivery = async (subId: string) => {
    try {
      const { token } = getAuth();
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().split('T')[0];

      const res = await fetch(`${API_BASE}/local-shop/subscriptions/${subId}/skip`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ date: dateStr })
      });
      if (res.ok) {
        alert(`Successfully skipped delivery for tomorrow (${dateStr})`);
        fetchSubscriptions();
      } else {
        const data = await res.json();
        alert(data.message || "Failed to skip delivery");
      }
    } catch (err) {
      console.error("skip date error:", err);
    }
  };

  const fetchTableBookings = useCallback(async () => {
    try {
      setLoadingTables(true);
      const { user, token } = getAuth();
      if (!user) return;
      const userId = user._id || user.id;
      const phone = user.phone || "";
      const email = user.email || "";

      const res = await fetch(`${API_BASE}/table-bookings/customer?phone=${encodeURIComponent(phone)}&email=${encodeURIComponent(email)}&userId=${userId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.bookings)) {
        setTableBookings(data.bookings);
      }
    } catch (err) {
      console.error("fetchTableBookings error:", err);
    } finally {
      setLoadingTables(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    fetchReturns();
    fetchTableBookings();
  }, [fetchOrders, fetchReturns, fetchTableBookings]);

  useEffect(() => {
    if (viewMode === 'schedules') {
      fetchSubscriptions();
    } else if (viewMode === 'tables') {
      fetchTableBookings();
    }
  }, [viewMode, fetchSubscriptions, fetchTableBookings]);

  const loadReviewedForOrder = async (orderId: string) => {
    try {
      const { user, token } = getAuth();
      if (!user || !token) return;
      const userId = user._id || user.id;
      const res = await fetch(`${API_BASE}/reviews/order/${orderId}/user/${userId}`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      const map: Record<string, Review> = {};
      (json?.reviews || []).forEach((r: Review) => { const pid = normalizeId(r.productId); if (pid) map[pid] = r; });
      setReviewByProductId(map);
    } catch { setReviewByProductId({}); }
  };

  const openReview = async (order: Order, item: OrderItem) => {
    await loadReviewedForOrder(order._id);
    const pid = normalizeId(item.productId);
    const existing = reviewByProductId[pid];
    setReviewOrder(order); setReviewProduct(item);
    if (existing) { setReviewRating(existing.rating || 5); setReviewTitle(existing.title || ""); setReviewComment(existing.comment || ""); }
    else { setReviewRating(5); setReviewTitle(""); setReviewComment(""); }
    setReviewOpen(true);
  };

  const submitReview = async () => {
    if (!reviewOrder || !reviewProduct) return;
    const pid = normalizeId(reviewProduct.productId);
    if (reviewByProductId[pid]) { alert("You already reviewed this product."); return; }
    setReviewLoading(true);
    try {
      const { user, token } = getAuth();
      if (!user || !token) { navigate("/login"); return; }
      const payload = { orderId: reviewOrder._id, productId: pid, userId: user._id || user.id, rating: Number(reviewRating), title: reviewTitle.trim(), comment: reviewComment.trim() };
      const res = await fetch(`${API_BASE}/product/reviews`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Failed to submit review");
      setReviewByProductId((prev) => ({ ...prev, [pid]: json.review }));
      setReviewOpen(false);
    } catch (e: any) { alert(e?.message || "Review submit failed"); }
    finally { setReviewLoading(false); }
  };

  const handleReturnSubmit = async (data: { reason: string; description: string; refundMethod: string }) => {
    if (!returnOrder || !returnItem) return;
    try {
      const { user, token } = getAuth();
      if (!user || !token) return;
      const payload = {
        orderId: returnOrder._id,
        productId: normalizeId(returnItem.productId),
        userId: user._id || user.id,
        reason: data.reason,
        description: data.description,
        refundMethod: data.refundMethod,
        amount: returnItem.price * returnItem.quantity,
      };
      await fetch(`${API_BASE}/returns`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) });
      fetchReturns();
      setReturnOpen(false);
      alert("✅ Return request submitted successfully! We'll review it within 24 hours.");
    } catch { alert("Failed to submit return request. Please try again."); }
  };

  const handleDownloadInvoice = (order: Order) => {
    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) return;
    const addr = order.shippingAddress;
    const summary = order.orderSummary;
    const itemRows = (order.orderItems || []).map((item, i) => `
      <tr style="border-bottom:1px solid #e5e7eb;">
        <td style="padding:8px 4px;">${i + 1}</td>
        <td style="padding:8px 4px;">${item.name}</td>
        <td style="padding:8px 4px;">${item.quantity}</td>
        <td style="padding:8px 4px;text-align:right;">₹${(item.price || 0).toLocaleString("en-IN")}</td>
        <td style="padding:8px 4px;text-align:right;">₹${((item.price || 0) * item.quantity).toLocaleString("en-IN")}</td>
      </tr>`).join("");

    printWindow.document.write(`<!DOCTYPE html><html><head><title>Invoice - ${order.orderNumber}</title>
      <style>body{font-family:Arial,sans-serif;padding:24px;font-size:13px;color:#111} table{width:100%;border-collapse:collapse;margin-bottom:16px} th{background:#f1f5f9;padding:8px 4px;text-align:left;font-size:12px;text-transform:uppercase} .brand{font-size:28px;font-weight:800;color:#0f2057} .grand{font-weight:700;font-size:16px;border-top:2px solid #0f2057}</style>
      </head><body>
      <div style="display:flex;justify-content:space-between;margin-bottom:24px;">
        <div><div class="brand">🐝 ApexBee</div><div style="font-size:11px;color:#6b7280">Multi-Vendor Marketplace</div></div>
        <div style="text-align:right;"><h2 style="margin:0 0 4px">TAX INVOICE</h2><div>Order #: <strong>${order.orderNumber}</strong></div><div>Date: ${formatDateTime(order.createdAt)}</div></div>
      </div>
      <div style="display:flex;gap:32px;margin-bottom:24px;">
        <div style="flex:1"><strong>Bill To:</strong><div>${addr?.name || ""}</div><div>${addr?.phone || ""}</div><div>${addr?.address || ""}</div><div>${addr?.city || ""}, ${addr?.state || ""} – ${addr?.pincode || ""}</div></div>
      </div>
      <table><thead><tr><th>#</th><th>Product</th><th>Qty</th><th style="text-align:right">Unit Price</th><th style="text-align:right">Amount</th></tr></thead>
      <tbody>${itemRows}</tbody></table>
      <table style="width:300px;margin-left:auto">
        <tr><td>Subtotal</td><td style="text-align:right">₹${(summary?.subtotal || 0).toLocaleString("en-IN")}</td></tr>
        <tr><td>Delivery</td><td style="text-align:right">${(summary?.shipping || 0) === 0 ? "Free" : `₹${(summary?.shipping || 0).toLocaleString("en-IN")}`}</td></tr>
        <tr><td>GST (5%)</td><td style="text-align:right">₹${(summary?.tax || 0).toLocaleString("en-IN")}</td></tr>
        <tr class="grand"><td>Grand Total</td><td style="text-align:right">₹${(summary?.grandTotal || summary?.total || 0).toLocaleString("en-IN")}</td></tr>
      </table>
      <div style="margin-top:40px;text-align:center;font-size:11px;color:#9ca3af"><p>Thank you for shopping with ApexBee! This is a computer-generated invoice.</p><p>Support: support@apexbee.in | WhatsApp: +91-9999-888-777</p></div>
      <script>window.onload=function(){window.print();}</script>
    </body></html>`);
    printWindow.document.close();
  };

  const handleRepeatOrder = async (order: Order) => {
    try {
      const { user, token } = getAuth();
      if (!user || !token) { alert("Please login first"); return; }

      let added = 0;
      for (const item of (order.orderItems || [])) {
        const payload = {
          userId: user._id || user.id,
          productId: normalizeId(item.productId),
          name: item.name,
          price: item.price,
          image: item.image,
          quantity: item.quantity,
          selectedColor: item.color || "default",
          vendorId: item.vendorId || null,
        };
        await fetch(`${API_BASE}/cart/add`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
        added++;
      }
      if (added > 0) {
        alert(`✅ Repeated ${added} items back to your cart successfully!`);
        window.dispatchEvent(new Event("storage"));
        navigate("/cart");
      }
    } catch (e) {
      console.error(e);
      alert("Failed to repeat order items.");
    }
  };

  // ── Filter orders by tab ───────────────────────────────────────────────
  const filteredOrders = orders.filter((o) => {
    const s = (o.orderStatus?.currentStatus || "").toLowerCase();
    if (activeTab === "all") return true;
    if (activeTab === "active") return isActiveOrder(o);
    if (activeTab === "delivered") return s === "delivered";
    if (activeTab === "cancelled") return s === "cancelled";
    if (activeTab === "returned") return s === "returned" || s === "refunded";
    return true;
  });

  const tabCounts: Record<string, number> = {
    all: orders.length,
    active: orders.filter(isActiveOrder).length,
    delivered: orders.filter((o) => (o.orderStatus?.currentStatus || "") === "delivered").length,
    cancelled: orders.filter((o) => (o.orderStatus?.currentStatus || "") === "cancelled").length,
    returned: orders.filter((o) => ["returned", "refunded"].includes(o.orderStatus?.currentStatus || "")).length,
  };

  // ── Loading ────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-navy mb-8">My Orders</h1>
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-navy" />
            <span className="ml-2 text-muted-foreground">Loading your orders…</span>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-navy mb-8">My Orders</h1>
          <div className="text-center py-12">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <p className="text-red-500 text-lg mb-4">{error}</p>
            <Button onClick={fetchOrders} className="bg-navy hover:bg-navy/90 text-white">Try Again</Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const existingReview = reviewProduct ? reviewByProductId[normalizeId(reviewProduct.productId)] : null;

  // ── Main Render ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-6 sm:py-8">
        {/* ── Top Header & Summary Stats Strip ── */}
        <div className="bg-gradient-to-r from-[#0A1128] via-[#101F42] to-[#0A1128] text-white rounded-3xl p-6 sm:p-8 mb-6 shadow-xl relative overflow-hidden font-sans">
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-amber-400/5 blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-amber-400 mb-3 border border-white/10">
                <Package className="w-3.5 h-3.5" /> Order History & Live Tracking
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">My Orders & Subscriptions</h1>
              <p className="text-xs sm:text-sm text-slate-300 font-medium mt-1">
                Track your active shipments, download invoices, request returns, or manage recurring schedules.
              </p>
            </div>

            {/* Quick Stat Counter Cards */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4 shrink-0">
              <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-3 text-center min-w-[90px]">
                <p className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Total</p>
                <p className="text-xl sm:text-2xl font-black text-amber-400">{orders.length}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-3 text-center min-w-[90px]">
                <p className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Active</p>
                <p className="text-xl sm:text-2xl font-black text-emerald-400">{tabCounts.active}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-3 text-center min-w-[90px]">
                <p className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Delivered</p>
                <p className="text-xl sm:text-2xl font-black text-sky-400">{tabCounts.delivered}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── View Mode Selector (Orders vs Subscriptions) ── */}
        <div className="flex gap-2 sm:gap-3 mb-6 p-1.5 bg-slate-100/90 rounded-2xl w-fit">
          <button
            onClick={() => setViewMode("orders")}
            className={`px-5 py-2.5 rounded-xl font-black text-xs sm:text-sm transition-all border-none cursor-pointer flex items-center gap-2 ${viewMode === "orders"
              ? "bg-[#0A1128] text-[#F3BA12] shadow-md"
              : "bg-transparent text-slate-600 hover:text-slate-900"
              }`}
          >
            <Package className="w-4 h-4" /> Standard Orders ({orders.length})
          </button>
          <button
            onClick={() => setViewMode("schedules")}
            className={`px-5 py-2.5 rounded-xl font-black text-xs sm:text-sm transition-all border-none cursor-pointer flex items-center gap-2 ${viewMode === "schedules"
              ? "bg-[#0A1128] text-[#F3BA12] shadow-md"
              : "bg-transparent text-slate-600 hover:text-slate-900"
              }`}
          >
            <Calendar className="w-4 h-4" /> Subscription Schedules ({subscriptions.length})
          </button>
          <button
            onClick={() => setViewMode("tables")}
            className={`px-5 py-2.5 rounded-xl font-black text-xs sm:text-sm transition-all border-none cursor-pointer flex items-center gap-2 ${viewMode === "tables"
              ? "bg-[#0A1128] text-[#F3BA12] shadow-md"
              : "bg-transparent text-slate-600 hover:text-slate-900"
              }`}
          >
            <Utensils className="w-4 h-4" /> Reserved Tables ({tableBookings.length})
          </button>
        </div>

        {viewMode === "orders" && (
          <>
            {/* ── Status Filter Tabs ── */}
            <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-none border-b border-slate-200">
              {STATUS_TABS.map((tab) => {
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold whitespace-nowrap transition-all border cursor-pointer ${isActive
                      ? "bg-[#0A1128] border-[#0A1128] text-[#F3BA12] shadow-sm"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300"
                      }`}
                  >
                    <span>{tab.label}</span>
                    {tabCounts[tab.key] > 0 && (
                      <span className={`text-[10px] font-black rounded-full px-2 py-0.5 ${isActive ? "bg-[#F3BA12] text-[#0A1128]" : "bg-slate-100 text-slate-700"
                        }`}>
                        {tabCounts[tab.key]}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* ── Orders List ── */}
            {filteredOrders.length === 0 ? (
              <div className="text-center py-16">
                <Package className="h-20 w-20 text-muted-foreground mx-auto mb-4 opacity-40" />
                <h2 className="text-xl font-semibold text-navy mb-2">
                  {activeTab === "all" ? "No Orders Yet" : `No ${STATUS_TABS.find((t) => t.key === activeTab)?.label}`}
                </h2>
                <p className="text-muted-foreground mb-6">
                  {activeTab === "all" ? "You haven't placed any orders yet." : "Nothing to show in this category."}
                </p>
                <Button onClick={() => navigate("/products")} className="bg-navy hover:bg-navy/90 text-white">
                  <ShoppingBag className="w-4 h-4 mr-2" /> Start Shopping
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredOrders.map((order) => {
                  const statusConfig = getStatusConfig(order.orderStatus?.currentStatus);
                  const StatusIcon = statusConfig.icon;
                  const isExpanded = expandedOrder === order._id;
                  const isDelivered = order.orderStatus?.currentStatus === "delivered";
                  const isCancelled = order.orderStatus?.currentStatus === "cancelled";

                  // Find return for this order (if any)
                  const orderReturn = returns.find((r) => r.orderId === order._id);

                  return (
                    <Card key={order._id} className={`border ${statusConfig.borderColor} overflow-hidden`}>
                      {/* Card Header */}
                      <div className={`${statusConfig.bgColor} px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2`}>
                        <div className="flex items-center gap-3">
                          <StatusIcon className={`h-5 w-5 ${statusConfig.color} flex-shrink-0`} />
                          <div>
                            <p className="font-semibold text-navy">Order #{order.orderNumber}</p>
                            <p className="text-xs text-muted-foreground">{formatDate(order.createdAt)} • {(order.orderItems || []).length} item(s)</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 sm:ml-auto">
                          {(order.fulfillment?.type === "pickup" || order.deliveryType === "pickup") && (
                            <Badge className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30 font-bold text-xs flex items-center gap-1">
                              🏪 Self Pickup
                            </Badge>
                          )}
                          <Badge className={`${statusConfig.bgColor} ${statusConfig.color} border ${statusConfig.borderColor} font-medium text-xs`}>
                            {statusConfig.label}
                          </Badge>
                          <span className="font-bold text-navy text-lg">{formatCurrency(order.orderSummary?.grandTotal || order.orderSummary?.total || 0)}</span>
                          <button
                            onClick={() => setExpandedOrder(isExpanded ? null : order._id)}
                            className="text-muted-foreground hover:text-navy transition-colors"
                          >
                            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>

                      {/* Quick Preview (collapsed) */}
                      {!isExpanded && (
                        <CardContent className="p-4">
                          <div className="flex gap-3 items-center">
                            <div className="flex gap-2">
                              {(order.orderItems || []).slice(0, 3).map((item, i) => (
                                <div key={i} className="w-12 h-12 rounded-md overflow-hidden bg-muted flex-shrink-0 border border-slate-100">
                                  <img src={getItemImage(item)} alt={getItemName(item)} className="w-full h-full object-cover" loading="lazy" />
                                </div>
                              ))}
                              {(order.orderItems || []).length > 3 && (
                                <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center text-xs text-muted-foreground flex-shrink-0 font-bold">
                                  +{(order.orderItems || []).length - 3}
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-navy truncate">{getItemName(order.orderItems?.[0])}</p>
                              {(order.orderItems || []).length > 1 && (
                                <p className="text-xs text-muted-foreground font-medium">+{(order.orderItems || []).length - 1} more item(s)</p>
                              )}
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-shrink-0 flex items-center gap-1"
                              onClick={() => { setExpandedOrder(order._id); loadReviewedForOrder(order._id); }}
                            >
                              View Details <ArrowRight className="w-3 h-3" />
                            </Button>
                          </div>
                        </CardContent>
                      )}

                      {/* Expanded Detail Panel */}
                      {isExpanded && (
                        <CardContent className="p-0">
                          <div className="p-5 space-y-6">

                            {/* Tracking Timeline */}
                            {!isCancelled && (
                              <div>
                                <h3 className="font-semibold text-navy mb-4 flex items-center gap-2">
                                  <Truck className="w-4 h-4" /> Order Tracking
                                </h3>
                                <TrackingTimeline order={order} />
                              </div>
                            )}

                            {/* Return Status (if return exists) */}
                            {orderReturn && (
                              <div className="p-3 rounded-lg border border-dashed border-orange-300 bg-orange-50/50">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <RotateCcw className="w-4 h-4 text-orange-500" />
                                    <span className="text-sm font-medium">Return Request</span>
                                  </div>
                                  <Badge className={RETURN_STATUS_LABELS[orderReturn.status]?.color || "bg-gray-100 text-gray-700"}>
                                    {RETURN_STATUS_LABELS[orderReturn.status]?.label || orderReturn.status}
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">Reason: {orderReturn.reason} • Refund: {formatCurrency(orderReturn.amount)}</p>
                              </div>
                            )}

                            {/* Sub-order Vendor Sections */}
                            {(order.subOrders && order.subOrders.length > 0) && (
                              <div>
                                <h3 className="font-semibold text-navy mb-3 flex items-center gap-2">
                                  <Store className="w-4 h-4" /> Items by Vendor
                                </h3>
                                <div className="space-y-3">
                                  {order.subOrders.map((sub) => (
                                    <div key={sub.subOrderId} className="border rounded-lg p-3">
                                      <div className="flex items-center justify-between mb-2">
                                        <p className="font-medium text-sm text-navy">{sub.vendorName}</p>
                                        <p className="text-xs text-muted-foreground">{sub.subOrderId}</p>
                                      </div>
                                      <div className="space-y-2">
                                        {sub.items.map((item, i) => (
                                          <div key={i} className="flex gap-3 items-center">
                                            <img src={getItemImage(item)} alt={getItemName(item)} className="w-10 h-10 object-contain rounded-md border border-slate-200 p-0.5 bg-white" />
                                            <div className="flex-1 text-sm">
                                              <p className="font-semibold text-navy truncate">{getItemName(item)}</p>
                                              <p className="text-xs text-muted-foreground font-medium">Qty: {item.quantity}</p>
                                            </div>
                                            <p className="text-sm font-bold text-navy">{formatCurrency((item.price || 0) * item.quantity)}</p>
                                          </div>
                                        ))}
                                      </div>
                                      <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        Est. Delivery: <strong className="ml-1">{formatDate(sub.estimatedDelivery)}</strong>
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* All Items (fallback if no subOrders) */}
                            {!(order.subOrders && order.subOrders.length > 0) && (
                              <div>
                                <h3 className="font-semibold text-navy mb-3">Ordered Items</h3>
                                <div className="space-y-3">
                                  {(order.orderItems || []).map((item, idx) => {
                                    const pid = normalizeId(item.productId);
                                    const reviewed = !!reviewByProductId[pid];
                                    const existingReturn = returns.find((r) => r.orderId === order._id && r.productId === pid);

                                    return (
                                      <div key={item._id || `${order._id}-${idx}`} className="flex gap-3 p-3 border rounded-xl bg-slate-50/50">
                                        <div className="w-16 h-16 bg-white rounded-lg flex-shrink-0 overflow-hidden border border-slate-200 p-0.5">
                                          <img src={getItemImage(item)} alt={getItemName(item)} className="w-full h-full object-contain rounded-md" loading="lazy" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <h4 className="font-bold text-sm text-navy truncate">{getItemName(item)}</h4>
                                          <div className="flex flex-wrap gap-2 mt-0.5 text-xs text-muted-foreground">
                                            <span>Qty: {item.quantity}</span>
                                            {item.color && item.color !== "default" && <span>Color: {item.color}</span>}
                                            {item.size && item.size !== "One Size" && <span>Size: {item.size}</span>}
                                          </div>
                                          <div className="flex items-center gap-2 mt-1">
                                            <span className="font-semibold text-sm">{formatCurrency(item.price)}</span>
                                            {item.originalPrice > item.price && (
                                              <span className="text-xs text-muted-foreground line-through">{formatCurrency(item.originalPrice)}</span>
                                            )}
                                          </div>
                                          <div className="flex flex-wrap gap-2 mt-2">
                                            {isDelivered && (
                                              reviewed ? (
                                                <div className="flex items-center gap-1.5">
                                                  <span className="text-xs text-green-600 font-medium">Reviewed ✅</span>
                                                  <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => openReview(order, item)}>View</Button>
                                                </div>
                                              ) : (
                                                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => openReview(order, item)}>
                                                  <Star className="w-3 h-3 mr-1" /> Write Review
                                                </Button>
                                              )
                                            )}
                                            {isDelivered && !existingReturn && (
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-7 text-xs text-orange-600 border-orange-300 hover:bg-orange-50"
                                                onClick={() => { setReturnOrder(order); setReturnItem(item); setReturnOpen(true); }}
                                              >
                                                <RotateCcw className="w-3 h-3 mr-1" /> Return
                                              </Button>
                                            )}
                                            {existingReturn && (
                                              <Badge className={`text-xs ${RETURN_STATUS_LABELS[existingReturn.status]?.color || "bg-gray-100 text-gray-700"}`}>
                                                Return: {RETURN_STATUS_LABELS[existingReturn.status]?.label}
                                              </Badge>
                                            )}
                                          </div>
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                          <p className="font-semibold text-sm">{formatCurrency(item.itemTotal || item.price * item.quantity)}</p>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* Address + Payment + Fulfillment Details */}
                            <div className="grid sm:grid-cols-2 gap-4">
                              {(order.fulfillment?.type === "pickup" || order.deliveryType === "pickup") ? (
                                <div className="p-3.5 border-2 border-amber-500/30 bg-amber-500/5 rounded-xl space-y-1.5">
                                  <h4 className="font-bold text-sm mb-1 text-amber-800 dark:text-amber-400 flex items-center gap-1.5">
                                    <Store className="w-4 h-4 text-amber-600" /> In-Store Self Pickup Location
                                  </h4>
                                  <p className="text-sm font-bold text-slate-900">ApexBee Partner Storefront</p>
                                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    <MapPin className="w-3 h-3 text-amber-600" /> {order.shippingAddress?.address || "Main Market Storefront, Verified ApexBee Hub"}
                                  </p>
                                  {order.fulfillment?.pickupSlot && (
                                    <p className="text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 px-2.5 py-1 rounded-md w-fit mt-1">
                                      🗓️ Pickup Slot: {order.fulfillment.pickupSlot.date} • {order.fulfillment.pickupSlot.time}
                                    </p>
                                  )}
                                  {order.pickupVerification?.otp && (
                                    <div className="mt-2 p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-700 font-extrabold text-xs flex items-center justify-between">
                                      <span>STORE PICKUP OTP:</span>
                                      <span className="font-mono text-sm tracking-widest text-emerald-800 font-black">{order.pickupVerification.otp}</span>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="p-3.5 border rounded-xl bg-slate-50/50">
                                  <h4 className="font-bold text-sm mb-1.5 flex items-center gap-1.5 text-navy">
                                    <MapPin className="w-4 h-4 text-navy" /> Home Delivery Address
                                  </h4>
                                  <p className="text-sm font-semibold text-slate-900">{order.shippingAddress?.name}</p>
                                  <p className="text-xs text-muted-foreground">{order.shippingAddress?.phone}</p>
                                  <p className="text-xs text-muted-foreground">{order.shippingAddress?.address}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {order.shippingAddress?.city}, {order.shippingAddress?.state} — {order.shippingAddress?.pincode}
                                  </p>
                                </div>
                              )}

                              <div className="p-3.5 border rounded-xl bg-slate-50/50 space-y-1">
                                <h4 className="font-bold text-sm mb-1.5 flex items-center gap-1.5 text-navy">
                                  <CreditCard className="w-4 h-4 text-navy" /> Payment &amp; Fulfillment
                                </h4>
                                <p className="text-xs text-muted-foreground">Fulfillment: <strong className="text-navy font-bold">{order.fulfillment?.type === 'pickup' || order.deliveryType === 'pickup' ? '🏬 In-Store Self Pickup' : '🚚 Home Delivery'}</strong></p>
                                <p className="text-xs text-muted-foreground">Payment Method: <strong className="text-navy">{paymentLabel[order.paymentDetails?.method || ""] || order.paymentDetails?.method || "—"}</strong></p>
                                <p className="text-xs text-muted-foreground">Payment Status: <strong className="capitalize text-emerald-600 font-bold">{order.paymentDetails?.status || "—"}</strong></p>
                                {order.fulfillment?.type !== 'pickup' && order.deliveryType !== 'pickup' && (
                                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                    <Calendar className="w-3 h-3" /> Est. Delivery: <strong>{formatDate(order.deliveryDetails?.expectedDelivery)}</strong>
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Order Summary */}
                            <div className="bg-gray-50 rounded-lg p-4">
                              <h4 className="font-semibold text-sm mb-3">Order Summary</h4>
                              <div className="space-y-1.5 text-sm">
                                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal ({order.orderSummary?.itemsCount || (order.orderItems || []).length} items)</span><span>{formatCurrency(order.orderSummary?.subtotal || 0)}</span></div>
                                {(order.orderSummary?.discount || 0) > 0 && <div className="flex justify-between text-green-600"><span>Product Discount</span><span>-{formatCurrency(order.orderSummary?.discount)}</span></div>}
                                {(order.orderSummary?.couponDiscount || 0) > 0 && <div className="flex justify-between text-green-600"><span>Coupon {order.coupon?.code ? `(${order.coupon.code})` : ""}</span><span>-{formatCurrency(order.orderSummary?.couponDiscount)}</span></div>}
                                {(order.orderSummary?.walletDeduction || 0) > 0 && <div className="flex justify-between text-green-600"><span>Wallet Used</span><span>-{formatCurrency(order.orderSummary?.walletDeduction)}</span></div>}
                                {(order.orderSummary?.rewardsDeduction || 0) > 0 && <div className="flex justify-between text-green-600"><span>Reward Points</span><span>-{formatCurrency(order.orderSummary?.rewardsDeduction)}</span></div>}
                                <div className="flex justify-between"><span className="text-muted-foreground">Delivery</span><span className={(order.orderSummary?.shipping || 0) === 0 ? "text-green-600" : ""}>{(order.orderSummary?.shipping || 0) === 0 ? "Free" : formatCurrency(order.orderSummary?.shipping)}</span></div>
                                {(order.orderSummary?.tax || 0) > 0 && <div className="flex justify-between"><span className="text-muted-foreground">GST (5%)</span><span>{formatCurrency(order.orderSummary?.tax)}</span></div>}
                                <div className="flex justify-between font-bold text-base pt-2 border-t text-navy"><span>Grand Total</span><span>{formatCurrency(order.orderSummary?.grandTotal || order.orderSummary?.total || 0)}</span></div>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-wrap gap-2 pt-2">
                              <Button className="bg-navy hover:bg-navy/90 text-white" size="sm" onClick={() => setTrackingOrder(order)}>
                                <Truck className="w-4 h-4 mr-2" /> Track Order
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => handleRepeatOrder(order)}>
                                <RotateCcw className="w-4 h-4 mr-2" /> Repeat Order
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => handleDownloadInvoice(order)}>
                                <Printer className="w-4 h-4 mr-2" /> Download Invoice
                              </Button>
                              <Button variant="outline" size="sm" asChild>
                                <a href="https://wa.me/919999888777" target="_blank" rel="noreferrer">
                                  <MessageCircle className="w-4 h-4 mr-2" /> Chat Support
                                </a>
                              </Button>
                            </div>

                            {/* Coming Soon */}
                            <div className="text-xs text-center text-blue-600 bg-blue-50 rounded-lg py-2 px-3">
                              🔔 Live driver tracking, WhatsApp & SMS updates coming soon!
                            </div>
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}
          </>)}

        {/* ── Subscriptions & Schedules View Mode ── */}
        {viewMode === "schedules" && (
          <div className="space-y-6">
            {loadingSubs ? (
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <Card key={i} className="p-6 border border-gray-200">
                    <div className="flex gap-4">
                      <div className="w-20 h-20 bg-gray-200 animate-pulse rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 animate-pulse rounded w-1/3" />
                        <div className="h-3 bg-gray-200 animate-pulse rounded w-1/4" />
                        <div className="h-3 bg-gray-200 animate-pulse rounded w-1/5" />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : subscriptions.length === 0 ? (
              <div className="text-center py-16 bg-white border rounded-2xl p-8 max-w-xl mx-auto shadow-sm">
                <Calendar className="h-16 w-16 text-muted-foreground/60 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-navy mb-2">No Active Subscriptions</h2>
                <p className="text-muted-foreground text-sm mb-6">
                  Subscribe to daily fresh milk, mineral water cans, or daily groceries to enjoy automatic home delivery!
                </p>
                <Button onClick={() => navigate("/local-stores")} className="bg-navy hover:bg-navy/90 text-white font-bold px-6 py-2.5 rounded-full">
                  🏪 Browse Local Stores
                </Button>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-1">
                {subscriptions.map((sub) => {
                  const subTotal = (sub.unitPrice || 0) * (sub.quantity || 1);
                  const isActive = sub.status === 'active';

                  return (
                    <Card key={sub._id} className="border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                      {/* Subscription Header */}
                      <div className="bg-gray-50 border-b px-6 py-4 flex flex-wrap items-center justify-between gap-4">
                        <div>
                          <span className="text-xs text-muted-foreground">SUBSCRIPTION ID</span>
                          <p className="font-mono text-sm text-navy font-bold">SUB-{sub._id.slice(-6).toUpperCase()}</p>
                        </div>
                        <div>
                          <span className="text-xs text-muted-foreground block text-right">START DATE</span>
                          <p className="text-sm font-semibold text-navy">{formatDate(sub.startDate)}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge className={isActive ? "bg-green-100 text-green-700 hover:bg-green-100" : "bg-orange-100 text-orange-700 hover:bg-orange-100"}>
                            {sub.status.toUpperCase()}
                          </Badge>
                          <Badge variant="outline" className="border-gray-300">
                            {sub.frequency.toUpperCase()}
                          </Badge>
                        </div>
                      </div>

                      {/* Subscription Core Details */}
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
                          <div className="flex gap-4">
                            <div className="w-20 h-20 border rounded-lg bg-muted flex-shrink-0 overflow-hidden">
                              <img src={sub.productImage || "/placeholder-product.png"} alt={sub.productName} className="w-full h-full object-cover" />
                            </div>
                            <div>
                              <h3 className="font-bold text-lg text-navy">{sub.productName}</h3>
                              <p className="text-xs text-muted-foreground mt-0.5">🏪 Supplied by: <strong className="text-navy">{sub.vendorName || 'Ecosystem Merchant'}</strong></p>
                              <div className="flex gap-4 mt-2 text-sm">
                                <div>
                                  <span className="text-muted-foreground text-xs block">Slot Option</span>
                                  <strong>{sub.deliverySlot || "Morning (6 AM - 8 AM)"}</strong>
                                </div>
                                <div>
                                  <span className="text-muted-foreground text-xs block">Qty per delivery</span>
                                  <strong>{sub.quantity} pack(s)</strong>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="text-right border-t md:border-t-0 pt-4 md:pt-0 w-full md:w-auto flex justify-between md:block">
                            <span className="text-xs text-muted-foreground block">COST PER DELIVERY</span>
                            <div className="mt-1">
                              <span className="text-xl font-black text-navy">{formatCurrency(subTotal)}</span>
                              <span className="text-xs text-muted-foreground block">({formatCurrency(sub.unitPrice)} each)</span>
                            </div>
                          </div>
                        </div>

                        {/* Skipped logs & Calendar logs view */}
                        {sub.skippedDates && sub.skippedDates.length > 0 && (
                          <div className="mt-6 p-4 rounded-xl border border-dashed border-gray-200 bg-gray-50/50">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Skipped Delivery Calendar Logs</h4>
                            <div className="flex flex-wrap gap-2">
                              {sub.skippedDates.map((dateStr: string) => (
                                <Badge key={dateStr} variant="destructive" className="bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 font-bold">
                                  Skip: {formatDate(dateStr)}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Interactive Buttons */}
                        <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t">
                          <Button
                            onClick={() => handleToggleSubscriptionStatus(sub._id, sub.status)}
                            className={isActive ? "bg-orange-600 hover:bg-orange-700 text-white font-bold" : "bg-green-600 hover:bg-green-700 text-white font-bold"}
                          >
                            {isActive ? "⏸️ Pause Delivery" : "▶️ Resume Delivery"}
                          </Button>

                          {isActive && (
                            <Button
                              onClick={() => handleSkipNextDelivery(sub._id)}
                              variant="outline"
                              className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 font-bold"
                            >
                              ⏭️ Skip Tomorrow
                            </Button>
                          )}

                          <Button
                            variant="outline"
                            asChild
                            className="ml-auto border-gray-300 text-navy font-bold"
                          >
                            <a href="https://wa.me/919999888777" target="_blank" rel="noreferrer">
                              💬 Modify Schedule on WhatsApp
                            </a>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── VIEW MODE 3: RESERVED TABLES ── */}
        {viewMode === "tables" && (
          <div className="space-y-6 font-sans">
            <div className="bg-[#0A1128] text-white p-6 rounded-3xl border border-indigo-900 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left">
              <div>
                <span className="text-[10px] font-black uppercase bg-amber-400 text-slate-950 px-2.5 py-0.5 rounded">
                  🍷 Dining Pass & Table Bookings
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white mt-1">Your Restaurant Reservations</h2>
                <p className="text-xs text-slate-300">View table booking confirmations, arrival times, and guest counts.</p>
              </div>
              <button
                onClick={() => navigate('/food')}
                className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-md transition border-none cursor-pointer shrink-0"
              >
                + Book New Table
              </button>
            </div>

            {loadingTables ? (
              <div className="text-center py-12 text-slate-500">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-amber-500 mb-2" />
                <span>Loading reserved tables...</span>
              </div>
            ) : tableBookings.length === 0 ? (
              <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center space-y-3 shadow-sm">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto text-2xl font-black">
                  🍷
                </div>
                <h3 className="font-black text-lg text-slate-900">No Reserved Tables Yet</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  You haven't reserved any dining tables yet. Explore top restaurants, get up to 30% OFF bills, and book your table instantly!
                </p>
                <Button onClick={() => navigate('/food')} className="bg-[#0A1128] hover:bg-[#101F42] text-amber-400 font-black text-xs px-6 py-2.5 rounded-xl">
                  Explore Dining Restaurants →
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left font-sans">
                {tableBookings.map((b: any) => {
                  const restName = b.restaurantId?.restaurantName || b.restaurantId?.name || b.restaurantName || "Restaurant Partner";
                  const restLoc = b.restaurantId?.locality || b.restaurantId?.city || b.locality || "Hyderabad";
                  const restLogo = b.restaurantId?.logo || b.restaurantId?.coverBanner || b.image || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&auto=format&fit=crop";
                  const bStatus = (b.status || "PENDING").toUpperCase();

                  const statusColors: Record<string, string> = {
                    CONFIRMED: "bg-emerald-100 text-emerald-800 border-emerald-300",
                    PENDING: "bg-amber-100 text-amber-800 border-amber-300",
                    SEATED: "bg-blue-100 text-blue-800 border-blue-300",
                    COMPLETED: "bg-purple-100 text-purple-800 border-purple-300",
                    CANCELLED: "bg-rose-100 text-rose-800 border-rose-300",
                    REJECTED: "bg-rose-100 text-rose-800 border-rose-300",
                  };

                  return (
                    <div key={b._id} className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-md hover:shadow-lg transition space-y-4">
                      <div className="flex items-start space-x-3">
                        <img src={restLogo} alt={restName} className="w-14 h-14 rounded-2xl object-cover border border-slate-200 shrink-0" />
                        <div className="flex-1 space-y-0.5">
                          <div className="flex items-center justify-between">
                            <h3 className="font-black text-base text-[#0A1128]">{restName}</h3>
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${statusColors[bStatus] || "bg-slate-100 text-slate-700"}`}>
                              {bStatus}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 font-medium">📍 {restLoc}</p>
                          <p className="text-[10px] font-mono text-slate-400">Ref: #{b.bookingNumber || b._id?.slice(-6)}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-100 text-center">
                        <div>
                          <p className="text-[9px] font-black uppercase text-slate-400">Date</p>
                          <p className="text-xs font-black text-slate-900 mt-0.5">{b.bookingDate}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-black uppercase text-slate-400">Time</p>
                          <p className="text-xs font-black text-amber-600 mt-0.5">{b.bookingTime}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-black uppercase text-slate-400">Guests</p>
                          <p className="text-xs font-black text-slate-900 mt-0.5">{b.guestCount} {b.guestCount === 1 ? 'Guest' : 'Guests'}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
                        <div className="text-slate-600">
                          <span className="font-bold">Guest:</span> {b.customerName || b.guestName} ({b.customerPhone || b.guestPhone})
                        </div>
                        <span className="font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          FLAT 25% OFF
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Review Dialog ── */}
      <Dialog open={reviewOpen} onOpenChange={(v) => { setReviewOpen(v); if (!v) { setReviewOrder(null); setReviewProduct(null); setReviewTitle(""); setReviewComment(""); setReviewRating(5); } }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{existingReview ? "Your Review" : "Write a Review"} — {reviewProduct?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {existingReview && <div className="text-xs text-muted-foreground">Submitted on: {formatDateTime(existingReview.createdAt)}</div>}

            <div>
              <label className="text-sm font-medium block mb-1.5">Rating (1–5) ⭐</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((r) => (
                  <button
                    key={r}
                    disabled={!!existingReview}
                    onClick={() => setReviewRating(r)}
                    className={`w-10 h-10 rounded-full border-2 text-lg transition-all ${reviewRating >= r ? "bg-yellow-400 border-yellow-400 text-white" : "border-gray-200 text-gray-300"} disabled:opacity-70`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium block mb-1">Title (optional)</label>
              <input value={reviewTitle} onChange={(e) => setReviewTitle(e.target.value)} disabled={!!existingReview}
                className="w-full border rounded-lg px-3 py-2 text-sm disabled:opacity-70 focus:outline-none focus:ring-2 focus:ring-navy/30" placeholder="Great quality!" />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Comment</label>
              <textarea value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} disabled={!!existingReview}
                className="w-full border rounded-lg px-3 py-2 text-sm min-h-[100px] resize-none disabled:opacity-70 focus:outline-none focus:ring-2 focus:ring-navy/30" placeholder="Share your experience…" />
            </div>

            {existingReview ? (
              <Button className="w-full" variant="outline" onClick={() => setReviewOpen(false)}>Close</Button>
            ) : (
              <Button className="w-full bg-navy hover:bg-navy/90 text-white" onClick={submitReview} disabled={reviewLoading || !reviewOrder || !reviewProduct}>
                {reviewLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Star className="w-4 h-4 mr-2" />}
                Submit Review
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Return Dialog ── */}
      <ReturnDialog
        open={returnOpen}
        order={returnOrder}
        item={returnItem}
        onClose={() => { setReturnOpen(false); setReturnOrder(null); setReturnItem(null); }}
        onSubmit={handleReturnSubmit}
      />

      {/* ── Live Tracking Dialog ── */}
      <Dialog open={!!trackingOrder} onOpenChange={(v) => !v && setTrackingOrder(null)}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-navy font-black text-lg">
              🚚 Live Order Tracking
            </DialogTitle>
          </DialogHeader>
          {trackingOrder && (
            <div className="space-y-6 text-left">
              {/* Timeline Header */}
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex justify-between items-center">
                <div>
                  <p className="text-[10px] text-muted-foreground font-black uppercase tracking-wider">Status</p>
                  <p className="font-extrabold text-navy text-sm uppercase">
                    {liveTracking ? liveTracking.status.replace("_", " ") : "Loading..."} {liveTracking?.etaMinutes ? `(${liveTracking.etaMinutes} mins away)` : ""}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-muted-foreground font-black uppercase tracking-wider">Order Number</p>
                  <p className="font-mono text-navy font-bold text-xs">{liveTracking?.orderNumber || trackingOrder.orderNumber}</p>
                </div>
              </div>

              {/* Visual Map mockup */}
              <div className="h-44 bg-blue-50 border rounded-2xl relative overflow-hidden flex flex-col items-center justify-center p-3">
                <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#ccc_1px,transparent_1px)] [background-size:16px_16px]" />
                {/* Route Path line */}
                <div className="absolute top-1/2 left-1/4 right-1/4 h-1 border-t border-dashed border-accent border-2 z-0" />
                {/* Store Pin */}
                <div className="absolute left-[20%] top-[40%] text-center z-10 flex flex-col items-center">
                  <span className="text-lg">🏪</span>
                  <span className="text-[8px] bg-navy text-white px-1 rounded font-black uppercase mt-0.5">Store</span>
                </div>
                {/* Driver */}
                {liveTracking?.deliveryPartnerName ? (
                  <div className="absolute left-[50%] top-[40%] text-center z-20 flex flex-col items-center animate-bounce">
                    <span className="text-xl">🛵</span>
                    <span className="text-[7px] bg-accent text-white px-1 rounded font-bold uppercase mt-0.5">{liveTracking.deliveryPartnerName.split(" ")[0]}</span>
                  </div>
                ) : (
                  <div className="absolute left-[50%] top-[40%] text-center z-20 flex flex-col items-center">
                    <span className="text-xl">🍳</span>
                    <span className="text-[7px] bg-amber-500 text-white px-1 rounded font-bold uppercase mt-0.5">Preparing</span>
                  </div>
                )}
                {/* Home Pin */}
                <div className="absolute right-[20%] top-[40%] text-center z-10 flex flex-col items-center">
                  <span className="text-lg">📍</span>
                  <span className="text-[8px] bg-green-700 text-white px-1 rounded font-black uppercase mt-0.5">You</span>
                </div>
                <span className="absolute bottom-1 right-2 text-[8px] bg-navy/80 text-white px-1.5 py-0.5 rounded">Live Map View (Active)</span>
              </div>

              {/* Tracking Stepper */}
              <div className="space-y-4">
                {(() => {
                  const status = liveTracking?.status || "placed";
                  const partnerName = liveTracking?.deliveryPartnerName;
                  const statusOrder = ["placed", "preparing", "out_for_delivery", "delivered"];
                  const currentIdx = statusOrder.indexOf(status);
                  const steps = [
                    { title: "Order Placed", desc: "We've received your order" },
                    { title: "Preparing Order", desc: "Seller is packaging your items" },
                    { title: "Out for Delivery", desc: partnerName ? `${partnerName} is carrying your parcel` : "Waiting for delivery partner assignment" },
                    { title: "Delivered", desc: "Delivered to your location" }
                  ];
                  return steps.map((step, idx) => {
                    const done = idx < currentIdx;
                    const active = idx === currentIdx;
                    const pending = idx > currentIdx;
                    return (
                      <div key={idx} className="flex gap-4 items-start relative">
                        {idx < 3 && (
                          <div className={`absolute left-3 top-6 bottom-0 w-0.5 ${done ? "bg-green-600" : "bg-slate-200"}`} />
                        )}
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 z-10 ${done ? "bg-green-600 text-white" :
                          active ? "bg-accent text-white animate-pulse" :
                            "bg-slate-100 text-slate-400"
                          }`}>
                          {done ? "✓" : idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className={`font-extrabold text-xs ${pending ? "text-slate-400" : "text-navy"}`}>
                            {step.title}
                          </h4>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{step.desc}</p>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>

              {/* Driver Details card - only show when partner assigned */}
              {liveTracking?.deliveryPartnerName ? (
                <div className="border border-slate-100 rounded-2xl p-4 flex items-center justify-between gap-4 bg-white shadow-sm shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-black text-navy text-sm">
                      {liveTracking.deliveryPartnerName.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                    </div>
                    <div>
                      <h5 className="font-extrabold text-navy text-xs leading-tight">{liveTracking.deliveryPartnerName}</h5>
                      <p className="text-[10px] text-slate-400 font-bold mt-0.5">⭐ {liveTracking.deliveryPartnerRating || "N/A"} Rating • {liveTracking.deliveryPartnerVehicle || "Vehicle info unavailable"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {liveTracking.deliveryPartnerPhone && (
                      <a
                        href={`tel:${liveTracking.deliveryPartnerPhone}`}
                        className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center border-none text-navy cursor-pointer transition-colors"
                      >
                        📞
                      </a>
                    )}
                    {liveTracking.deliveryPartnerPhone && (
                      <a
                        href={`https://wa.me/${liveTracking.deliveryPartnerPhone.replace(/\+/g, "")}`}
                        className="w-8 h-8 rounded-full bg-green-50 hover:bg-green-100 flex items-center justify-center border-none text-green-700 cursor-pointer transition-colors"
                      >
                        💬
                      </a>
                    )}
                  </div>
                </div>
              ) : (
                <div className="border border-amber-100 bg-amber-50 rounded-2xl p-4 text-center">
                  <p className="text-xs font-bold text-amber-700">🍳 Your order is being prepared</p>
                  <p className="text-[10px] text-amber-600 mt-1">A delivery partner will be assigned shortly</p>
                </div>
              )}

              {/* OTP Section - only show when partner assigned */}
              {liveTracking?.deliveryPartnerName && liveTracking?.otp && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-center">
                  <p className="text-[10px] text-muted-foreground font-black uppercase tracking-wider">Security OTP</p>
                  <p className="font-mono text-navy font-black text-xl tracking-[0.3em] mt-1">{liveTracking.otp}</p>
                  <p className="text-[9px] text-slate-400 mt-1">Share this code only with the delivery partner</p>
                </div>
              )}

              <DialogFooter>
                <Button className="w-full bg-navy text-white hover:bg-navy/90 font-bold text-xs" onClick={() => setTrackingOrder(null)}>
                  Close Tracker
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default MyOrders;

