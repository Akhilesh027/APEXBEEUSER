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
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const API_BASE = "https://server.apexbee.in/api";

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
  requested:        { label: "Return Requested",    color: "bg-orange-100 text-orange-700 border-orange-200" },
  under_review:     { label: "Under Review",        color: "bg-blue-100 text-blue-700 border-blue-200" },
  approved:         { label: "Approved",             color: "bg-green-100 text-green-700 border-green-200" },
  rejected:         { label: "Rejected",             color: "bg-red-100 text-red-700 border-red-200" },
  refund_processed: { label: "Refund Processed",    color: "bg-purple-100 text-purple-700 border-purple-200" },
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
    pending:          { icon: Clock,        color: "text-orange-500", label: "Pending",          bgColor: "bg-orange-50",  borderColor: "border-orange-200" },
    confirmed:        { icon: CheckCircle,  color: "text-blue-500",   label: "Confirmed",        bgColor: "bg-blue-50",    borderColor: "border-blue-200" },
    processing:       { icon: Package,      color: "text-purple-500", label: "Processing",       bgColor: "bg-purple-50",  borderColor: "border-purple-200" },
    shipped:          { icon: Truck,        color: "text-indigo-500", label: "Shipped",          bgColor: "bg-indigo-50",  borderColor: "border-indigo-200" },
    delivered:        { icon: CheckCircle,  color: "text-green-600",  label: "Delivered",        bgColor: "bg-green-50",   borderColor: "border-green-200" },
    cancelled:        { icon: AlertCircle,  color: "text-red-500",    label: "Cancelled",        bgColor: "bg-red-50",     borderColor: "border-red-200" },
    refunded:         { icon: RotateCcw,    color: "text-gray-500",   label: "Refunded",         bgColor: "bg-gray-50",    borderColor: "border-gray-200" },
    returned:         { icon: RotateCcw,    color: "text-purple-500", label: "Returned",         bgColor: "bg-purple-50",  borderColor: "border-purple-200" },
    payment_pending:  { icon: Clock,        color: "text-orange-500", label: "Payment Pending",  bgColor: "bg-orange-50",  borderColor: "border-orange-200" },
    payment_verified: { icon: CheckCircle,  color: "text-green-600",  label: "Payment Verified", bgColor: "bg-green-50",   borderColor: "border-green-200" },
    payment_failed:   { icon: AlertCircle,  color: "text-red-500",    label: "Payment Failed",   bgColor: "bg-red-50",     borderColor: "border-red-200" },
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
const TrackingTimeline = ({ order }: { order: Order }) => {
  const currentStatus = order.orderStatus?.currentStatus || "pending";
  const normalizedStatus = currentStatus === 'payment_pending' ? 'pending' :
                           currentStatus === 'payment_verified' ? 'confirmed' :
                           currentStatus;
  const currentIdx = TRACKING_STEPS.findIndex((s) => s.key === normalizedStatus);

  return (
    <div className="relative py-2">
      {/* Horizontal bar for desktop */}
      <div className="hidden sm:flex items-start justify-between relative">
        <div className="absolute top-5 left-0 right-0 h-1 bg-gray-200 z-0" />
        <div
          className="absolute top-5 left-0 h-1 bg-green-500 z-0 transition-all duration-700"
          style={{ width: `${Math.max(0, (currentIdx / (TRACKING_STEPS.length - 1)) * 100)}%` }}
        />
        {TRACKING_STEPS.map((step, i) => {
          const done = i <= currentIdx;
          const active = i === currentIdx;
          return (
            <div key={step.key} className="flex flex-col items-center z-10 flex-1">
              <div
                className={`w-10 h-10 rounded-full border-2 flex items-center justify-center text-base transition-all ${
                  done
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
        {TRACKING_STEPS.map((step, i) => {
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
                { value: "wallet",   label: "ApexBee Wallet Credit", desc: "Instant credit to your ApexBee wallet" },
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

  useEffect(() => { fetchOrders(); fetchReturns(); }, [fetchOrders, fetchReturns]);

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

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-navy mb-6">My Orders</h1>

        {/* ── Status Tabs ── */}
        <div className="flex gap-1 overflow-x-auto pb-2 mb-6 border-b">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-t-lg text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
                activeTab === tab.key
                  ? "bg-navy text-white"
                  : "text-muted-foreground hover:text-navy hover:bg-navy/5"
              }`}
            >
              {tab.label}
              {tabCounts[tab.key] > 0 && (
                <span className={`text-xs rounded-full px-1.5 py-0.5 ${activeTab === tab.key ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"}`}>
                  {tabCounts[tab.key]}
                </span>
              )}
            </button>
          ))}
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
                    <div className="flex items-center gap-3 sm:ml-auto">
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
                            <div key={i} className="w-12 h-12 rounded-md overflow-hidden bg-muted flex-shrink-0">
                              <img src={item.image} alt={item.name} className="w-full h-full object-cover" loading="lazy" />
                            </div>
                          ))}
                          {(order.orderItems || []).length > 3 && (
                            <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center text-xs text-muted-foreground flex-shrink-0">
                              +{(order.orderItems || []).length - 3}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{order.orderItems?.[0]?.name}</p>
                          {(order.orderItems || []).length > 1 && (
                            <p className="text-xs text-muted-foreground">+{(order.orderItems || []).length - 1} more</p>
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
                                        <img src={item.image} alt={item.name} className="w-10 h-10 object-cover rounded-md" />
                                        <div className="flex-1 text-sm">
                                          <p className="font-medium truncate">{item.name}</p>
                                          <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                                        </div>
                                        <p className="text-sm font-semibold">{formatCurrency((item.price || 0) * item.quantity)}</p>
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
                                  <div key={item._id || `${order._id}-${idx}`} className="flex gap-3 p-3 border rounded-lg">
                                    <div className="w-16 h-16 bg-muted rounded-md flex-shrink-0 overflow-hidden">
                                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" loading="lazy" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <h4 className="font-semibold text-sm text-navy truncate">{item.name}</h4>
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

                        {/* Address + Payment + Delivery */}
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div className="p-3 border rounded-lg">
                            <h4 className="font-medium text-sm mb-2 flex items-center gap-1.5">
                              <MapPin className="w-4 h-4 text-navy" /> Delivery Address
                            </h4>
                            <p className="text-sm font-medium">{order.shippingAddress?.name}</p>
                            <p className="text-xs text-muted-foreground">{order.shippingAddress?.phone}</p>
                            <p className="text-xs text-muted-foreground">{order.shippingAddress?.address}</p>
                            <p className="text-xs text-muted-foreground">
                              {order.shippingAddress?.city}, {order.shippingAddress?.state} — {order.shippingAddress?.pincode}
                            </p>
                          </div>
                          <div className="p-3 border rounded-lg">
                            <h4 className="font-medium text-sm mb-2 flex items-center gap-1.5">
                              <CreditCard className="w-4 h-4 text-navy" /> Payment & Delivery
                            </h4>
                            <p className="text-xs text-muted-foreground">Method: <strong className="text-navy">{paymentLabel[order.paymentDetails?.method || ""] || order.paymentDetails?.method || "—"}</strong></p>
                            <p className="text-xs text-muted-foreground mt-0.5">Status: <strong className="capitalize">{order.paymentDetails?.status || "—"}</strong></p>
                            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                              <Calendar className="w-3 h-3" /> Est. Delivery: <strong>{formatDate(order.deliveryDetails?.expectedDelivery)}</strong>
                            </p>
                            <p className="text-xs text-muted-foreground">Method: {order.deliveryDetails?.shippingMethod || "Standard Delivery"}</p>
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
                          <Button className="bg-navy hover:bg-navy/90 text-white" size="sm" onClick={() => setExpandedOrder(isExpanded ? null : order._id)}>
                            <Truck className="w-4 h-4 mr-2" /> Track Order
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleDownloadInvoice(order)}>
                            <Printer className="w-4 h-4 mr-2" /> Download Invoice
                          </Button>
                          <Button variant="outline" size="sm" asChild>
                            <a href="https://wa.me/919999888777" target="_blank" rel="noreferrer">
                              <MessageCircle className="w-4 h-4 mr-2" /> Support
                            </a>
                          </Button>
                          <Button variant="outline" size="sm" asChild>
                            <a href="tel:+919999888777">
                              <PhoneCall className="w-4 h-4 mr-2" /> Call Support
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

      <Footer />
    </div>
  );
};

export default MyOrders;

