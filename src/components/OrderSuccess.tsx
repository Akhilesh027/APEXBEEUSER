import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  Package,
  MapPin,
  CreditCard,
  Home,
  Truck,
  Gift,
  Printer,
  MessageCircle,
  Store,
  Calendar,
  Star,
  ShoppingBag,
  Phone,
} from "lucide-react";
import Navbar from "@/components/Navbar";

const API_ORIGIN = "http://localhost:5500";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
type OrderItem = {
  name: string;
  image?: string;
  color?: string;
  size?: string;
  quantity?: number;
  price?: number;
  itemTotal?: number;
  vendorId?: string;
  vendorName?: string;
};

type SubOrder = {
  subOrderId: string;
  vendorId: string;
  vendorName: string;
  estimatedDelivery: string;
  items: OrderItem[];
  summary: {
    subtotal: number;
    deliveryFee: number;
    tax: number;
    total: number;
  };
  status?: string;
};

type ShippingAddress = {
  name?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
};

type OrderSummary = {
  subtotal?: number;
  discount?: number;
  couponDiscount?: number;
  walletDeduction?: number;
  rewardsDeduction?: number;
  shipping?: number;
  tax?: number;
  total?: number;
  grandTotal?: number;
  itemsCount?: number;
};

type FullOrder = {
  _id?: string;
  orderNumber?: string;
  createdAt?: string;
  status?: string;
  orderItems?: OrderItem[];
  subOrders?: SubOrder[];
  shippingAddress?: ShippingAddress;
  paymentDetails?: {
    method?: string;
    status?: string;
    amount?: number;
  };
  orderSummary?: OrderSummary;
  deliveryDetails?: {
    expectedDelivery?: string;
    shippingMethod?: string;
  };
  coupon?: { code?: string } | null;
};

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
const formatCurrency = (v?: number | null) => {
  const n = typeof v === "number" && !isNaN(v) ? v : 0;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
};

const formatDate = (d?: string | number | null) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const formatDateTime = (d?: string | null) => {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getImageUrl = (img?: string) => {
  if (!img) return "/placeholder-product.png";
  if (img.startsWith("http")) return img;
  return `${API_ORIGIN}${img.startsWith("/") ? "" : "/"}${img}`;
};

const paymentLabel: Record<string, string> = {
  cod: "Cash on Delivery",
  upi: "UPI",
  wallet: "ApexBee Wallet",
  card: "Card Payment",
  netbanking: "Net Banking",
  rewards: "Reward Points",
};

// ─────────────────────────────────────────────
// Invoice Print Styles
// ─────────────────────────────────────────────
const INVOICE_PRINT_STYLE = `
  @media print {
    body > *:not(#invoice-print-root) { display: none !important; }
    #invoice-print-root { display: block !important; }
    @page { margin: 16mm; }
  }
  @media screen {
    #invoice-print-root { display: none; }
  }
`;

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────
const OrderSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [phase, setPhase] = useState<"anim" | "confirm">("anim");
  const [order, setOrder] = useState<FullOrder | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("upi");
  const invoiceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const state: any = location.state;
    if (state?.order) {
      setOrder(state.order);
    }
    if (state?.paymentMethod) {
      setPaymentMethod(state.paymentMethod);
    }

    // Brief celebration animation, then reveal full confirmation
    const t = setTimeout(() => setPhase("confirm"), 2800);
    return () => clearTimeout(t);
  }, [location.state]);

  // Build sub-orders from order.subOrders or fall back to flat grouping
  const subOrders: SubOrder[] = (() => {
    if (!order) return [];
    if (order.subOrders && order.subOrders.length > 0) return order.subOrders;

    // Fallback: group orderItems by vendorId
    const map: Record<string, SubOrder> = {};
    (order.orderItems || []).forEach((item) => {
      const vid = item.vendorId || "unknown";
      if (!map[vid]) {
        map[vid] = {
          subOrderId: `SUB-${vid.replace("vendor_", "").toUpperCase()}-${Date.now().toString().slice(-4)}`,
          vendorId: vid,
          vendorName: item.vendorName || "ApexBee Store",
          estimatedDelivery: order.deliveryDetails?.expectedDelivery || new Date(Date.now() + 4 * 86400000).toISOString(),
          items: [],
          summary: { subtotal: 0, deliveryFee: 0, tax: 0, total: 0 },
        };
      }
      map[vid].items.push(item);
      const lineTotal = (item.price || 0) * (item.quantity || 1);
      map[vid].summary.subtotal += lineTotal;
      map[vid].summary.total += lineTotal;
    });
    return Object.values(map);
  })();

  const handleDownloadInvoice = () => {
    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) return;

    const addr = order?.shippingAddress;
    const summary = order?.orderSummary;

    const itemRows = (order?.orderItems || [])
      .map(
        (item, i) => `
        <tr style="border-bottom:1px solid #e5e7eb;">
          <td style="padding:8px 4px;">${i + 1}</td>
          <td style="padding:8px 4px;">${item.name || "—"}</td>
          <td style="padding:8px 4px;">${item.quantity || 1}</td>
          <td style="padding:8px 4px;text-align:right;">₹${(item.price || 0).toLocaleString("en-IN")}</td>
          <td style="padding:8px 4px;text-align:right;">₹${((item.price || 0) * (item.quantity || 1)).toLocaleString("en-IN")}</td>
        </tr>`
      )
      .join("");

    printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>Invoice - ${order?.orderNumber || ""}</title>
  <style>
    body { font-family: Arial, sans-serif; color: #111; margin: 0; padding: 24px; font-size: 13px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
    .brand { font-size: 28px; font-weight: 800; color: #0f2057; letter-spacing: 1px; }
    .badge { font-size: 11px; color: #6b7280; }
    h2 { font-size: 18px; font-weight: 700; margin: 0 0 4px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
    th { background: #f1f5f9; padding: 8px 4px; text-align: left; font-size: 12px; text-transform: uppercase; color: #374151; }
    .totals-table td { padding: 6px 4px; }
    .grand-total { font-weight: 700; font-size: 16px; border-top: 2px solid #0f2057; }
    .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #9ca3af; }
    @media print { @page { margin: 14mm; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">🐝 ApexBee</div>
      <div class="badge">Multi-Vendor Marketplace</div>
    </div>
    <div style="text-align:right;">
      <h2>TAX INVOICE</h2>
      <div>Order #: <strong>${order?.orderNumber || "—"}</strong></div>
      <div>Date: ${formatDateTime(order?.createdAt)}</div>
      <div>Payment: ${paymentLabel[paymentMethod] || paymentMethod}</div>
    </div>
  </div>

  <div style="display:flex;gap:32px;margin-bottom:24px;">
    <div style="flex:1;">
      <strong>Bill To:</strong>
      <div>${addr?.name || "—"}</div>
      <div>${addr?.phone || ""}</div>
      <div>${addr?.address || ""}</div>
      <div>${addr?.city || ""}, ${addr?.state || ""} - ${addr?.pincode || ""}</div>
    </div>
    <div style="flex:1;">
      <strong>Ship To:</strong>
      <div>${addr?.name || "—"}</div>
      <div>${addr?.address || ""}</div>
      <div>${addr?.city || ""}, ${addr?.state || ""} - ${addr?.pincode || ""}</div>
      <div>Expected: ${formatDate(order?.deliveryDetails?.expectedDelivery)}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>#</th><th>Product</th><th>Qty</th><th style="text-align:right;">Unit Price</th><th style="text-align:right;">Amount</th>
      </tr>
    </thead>
    <tbody>${itemRows}</tbody>
  </table>

  <table class="totals-table" style="width:300px;margin-left:auto;">
    <tr><td>Subtotal</td><td style="text-align:right;">₹${(summary?.subtotal || 0).toLocaleString("en-IN")}</td></tr>
    ${(summary?.discount || 0) > 0 ? `<tr><td>Product Discount</td><td style="text-align:right;color:green;">-₹${(summary?.discount || 0).toLocaleString("en-IN")}</td></tr>` : ""}
    ${(summary?.couponDiscount || 0) > 0 ? `<tr><td>Coupon (${order?.coupon?.code || ""})</td><td style="text-align:right;color:green;">-₹${(summary?.couponDiscount || 0).toLocaleString("en-IN")}</td></tr>` : ""}
    ${(summary?.walletDeduction || 0) > 0 ? `<tr><td>Wallet Used</td><td style="text-align:right;color:green;">-₹${(summary?.walletDeduction || 0).toLocaleString("en-IN")}</td></tr>` : ""}
    ${(summary?.rewardsDeduction || 0) > 0 ? `<tr><td>Rewards Points</td><td style="text-align:right;color:green;">-₹${(summary?.rewardsDeduction || 0).toLocaleString("en-IN")}</td></tr>` : ""}
    <tr><td>Delivery</td><td style="text-align:right;">${(summary?.shipping || 0) === 0 ? "Free" : `₹${(summary?.shipping || 0).toLocaleString("en-IN")}`}</td></tr>
    <tr><td>GST (5%)</td><td style="text-align:right;">₹${(summary?.tax || 0).toLocaleString("en-IN")}</td></tr>
    <tr class="grand-total"><td>Grand Total</td><td style="text-align:right;">₹${(summary?.grandTotal || summary?.total || 0).toLocaleString("en-IN")}</td></tr>
  </table>

  <div class="footer">
    <p>Thank you for shopping with ApexBee! This is a computer-generated invoice. No signature required.</p>
    <p>For support: support@apexbee.in | WhatsApp: +91-9999-888-777</p>
  </div>

  <script>window.onload = function() { window.print(); }</script>
</body>
</html>`);
    printWindow.document.close();
  };

  // ─── ANIMATION PHASE ───────────────────────────────────────────────────────
  if (phase === "anim") {
    return (
      <>
        <style>{`
          @keyframes popIn { 0%{transform:scale(0) rotate(-20deg);opacity:0} 60%{transform:scale(1.15) rotate(4deg)} 100%{transform:scale(1) rotate(0);opacity:1} }
          @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
          @keyframes ringPulse { 0%,100%{box-shadow:0 0 0 0 rgba(234,179,8,0.4)} 50%{box-shadow:0 0 0 24px rgba(234,179,8,0)} }
          .pop-in { animation: popIn 0.6s cubic-bezier(0.34,1.56,0.64,1) forwards; }
          .fade-up-1 { animation: fadeUp 0.5s 0.5s ease both; }
          .fade-up-2 { animation: fadeUp 0.5s 0.9s ease both; }
          .ring-pulse { animation: ringPulse 1.5s 0.6s infinite; }
        `}</style>
        <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-6">
          <div className="ring-pulse w-28 h-28 rounded-full bg-yellow-50 flex items-center justify-center">
            <Gift className="w-16 h-16 text-yellow-500 pop-in" strokeWidth={1.5} />
          </div>
          <div className="text-center fade-up-1">
            <h1 className="text-4xl font-extrabold text-yellow-500">Congratulations!</h1>
            <p className="text-muted-foreground mt-2 text-lg">Your order has been placed successfully.</p>
          </div>
          <div className="fade-up-2 flex items-center gap-2 text-muted-foreground text-sm">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            Preparing your order confirmation…
          </div>
        </div>
      </>
    );
  }

  // ─── NO ORDER DATA FALLBACK ──────────────────────────────────────────────
  if (!order) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-20 flex items-center justify-center">
          <Card className="max-w-lg w-full">
            <CardContent className="p-8 text-center space-y-4">
              <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
              <p className="text-lg font-semibold text-navy">Order Placed Successfully!</p>
              <p className="text-sm text-muted-foreground">
                We couldn't load the order details right now. Check My Orders for full information.
              </p>
              <div className="flex justify-center gap-3 pt-2">
                <Button onClick={() => navigate("/my-orders")}>
                  <Package className="w-4 h-4 mr-2" /> My Orders
                </Button>
                <Button variant="outline" onClick={() => navigate("/")}>
                  <Home className="w-4 h-4 mr-2" /> Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const summary = order.orderSummary || {};
  const addr = order.shippingAddress;

  // ─── FULL CONFIRMATION PAGE ──────────────────────────────────────────────
  return (
    <>
      <style>{INVOICE_PRINT_STYLE + `
        @keyframes slideDown { from{opacity:0;transform:translateY(-16px)} to{opacity:1;transform:translateY(0)} }
        .slide-down { animation: slideDown 0.45s ease both; }
      `}</style>

      <div className="min-h-screen bg-background">
        <Navbar />

        <div className="max-w-5xl mx-auto px-4 py-10 space-y-6 slide-down">

          {/* ── Success Banner ── */}
          <div className="rounded-2xl bg-gradient-to-r from-yellow-50 to-green-50 border border-yellow-200 p-6 flex flex-col sm:flex-row items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-10 h-10 text-yellow-500" />
            </div>
            <div className="text-center sm:text-left">
              <h1 className="text-2xl font-bold text-navy">Order Placed Successfully!</h1>
              <p className="text-muted-foreground mt-1">
                Order <strong className="text-navy">#{order.orderNumber}</strong> &nbsp;|&nbsp; {formatDateTime(order.createdAt)}
              </p>
            </div>
            <div className="sm:ml-auto flex flex-wrap gap-2 justify-center">
              <Badge className="bg-green-100 text-green-700 border-green-200">
                {order.status === "payment_pending" ? "⏳ Awaiting Payment" : "✓ Confirmed"}
              </Badge>
              <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                {paymentLabel[paymentMethod] || paymentMethod}
              </Badge>
            </div>
          </div>

          {/* ── Quick Actions ── */}
          <div className="flex flex-wrap gap-3 justify-center">
            <Button className="bg-navy hover:bg-navy/90 text-white" onClick={() => navigate("/my-orders")}>
              <Truck className="w-4 h-4 mr-2" /> Track Order
            </Button>
            <Button variant="outline" onClick={handleDownloadInvoice}>
              <Printer className="w-4 h-4 mr-2" /> Download Invoice
            </Button>
            <Button variant="outline" onClick={() => navigate("/")}>
              <ShoppingBag className="w-4 h-4 mr-2" /> Continue Shopping
            </Button>
            <Button variant="outline" asChild>
              <a href="https://wa.me/919999888777" target="_blank" rel="noreferrer">
                <MessageCircle className="w-4 h-4 mr-2" /> Contact Support
              </a>
            </Button>
          </div>

          {/* ── Vendor Sub-Orders ── */}
          <div className="space-y-4">
            {subOrders.map((sub, idx) => (
              <Card key={sub.subOrderId} className="border-l-4 border-l-yellow-400">
                <CardContent className="p-5">
                  {/* Vendor Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-4 border-b">
                    <div className="flex items-center gap-2">
                      <Store className="w-5 h-5 text-navy" />
                      <div>
                        <p className="font-semibold text-navy">{sub.vendorName}</p>
                        <p className="text-xs text-muted-foreground">Sub-order: {sub.subOrderId}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        Est. Delivery: <strong className="text-navy ml-1">{formatDate(sub.estimatedDelivery)}</strong>
                      </span>
                      <Badge className={idx === 0 ? "bg-green-100 text-green-700 border-green-200" : "bg-orange-100 text-orange-700 border-orange-200"}>
                        {sub.status || "Confirmed"}
                      </Badge>
                    </div>
                  </div>

                  {/* Items */}
                  <div className="space-y-3">
                    {sub.items.map((item, i) => (
                      <div key={i} className="flex gap-3 items-start">
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                          <img
                            src={getImageUrl(item.image)}
                            alt={item.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-navy truncate">{item.name}</p>
                          <div className="text-sm text-muted-foreground flex flex-wrap gap-2 mt-0.5">
                            {item.color && item.color !== "default" && <span>Color: {item.color}</span>}
                            {item.size && item.size !== "One Size" && <span>Size: {item.size}</span>}
                            <span>Qty: {item.quantity || 1}</span>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-semibold text-navy">{formatCurrency((item.price || 0) * (item.quantity || 1))}</p>
                          <p className="text-xs text-muted-foreground">{formatCurrency(item.price)} × {item.quantity || 1}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Sub-order mini total */}
                  <div className="mt-3 pt-3 border-t flex justify-between text-sm">
                    <span className="text-muted-foreground">Sub-total (incl. ₹{sub.summary.tax} GST + ₹{sub.summary.deliveryFee} delivery)</span>
                    <span className="font-semibold text-navy">{formatCurrency(sub.summary.total)}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* ── Bottom Grid: Delivery + Summary ── */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Delivery Address */}
            <Card>
              <CardContent className="p-5">
                <h3 className="font-semibold text-navy mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4" /> Delivery Address
                </h3>
                {addr ? (
                  <div className="text-sm space-y-1">
                    <p className="font-medium">{addr.name}</p>
                    <p className="text-muted-foreground flex items-center gap-1">
                      <Phone className="w-3 h-3" /> {addr.phone}
                    </p>
                    <p className="text-muted-foreground">{addr.address}</p>
                    <p className="text-muted-foreground">
                      {addr.city}, {addr.state} — {addr.pincode}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Address not available</p>
                )}

                <div className="mt-4 pt-3 border-t">
                  <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                    <CreditCard className="w-4 h-4" /> Payment
                  </h4>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>Method: <strong className="text-navy capitalize">{paymentLabel[paymentMethod] || paymentMethod}</strong></p>
                    <p>Status: <Badge className={order.paymentDetails?.status === "payment_pending" ? "bg-orange-100 text-orange-700 text-xs" : "bg-green-100 text-green-700 text-xs"}>
                      {order.paymentDetails?.status === "payment_pending" ? "Pending Verification" : "Confirmed"}
                    </Badge></p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Order Summary */}
            <Card>
              <CardContent className="p-5">
                <h3 className="font-semibold text-navy mb-3 flex items-center gap-2">
                  <Star className="w-4 h-4" /> Order Summary
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal ({summary.itemsCount || (order.orderItems || []).length} items)</span>
                    <span>{formatCurrency(summary.subtotal)}</span>
                  </div>
                  {(summary.discount || 0) > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Product Discount</span>
                      <span>-{formatCurrency(summary.discount)}</span>
                    </div>
                  )}
                  {(summary.couponDiscount || 0) > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Coupon {order.coupon?.code ? `(${order.coupon.code})` : ""}</span>
                      <span>-{formatCurrency(summary.couponDiscount)}</span>
                    </div>
                  )}
                  {(summary.walletDeduction || 0) > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Wallet Used</span>
                      <span>-{formatCurrency(summary.walletDeduction)}</span>
                    </div>
                  )}
                  {(summary.rewardsDeduction || 0) > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Reward Points</span>
                      <span>-{formatCurrency(summary.rewardsDeduction)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Delivery</span>
                    <span className={(summary.shipping || 0) === 0 ? "text-green-600 font-medium" : ""}>
                      {(summary.shipping || 0) === 0 ? "Free" : formatCurrency(summary.shipping)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">GST (5%)</span>
                    <span>{formatCurrency(summary.tax)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-base pt-2 border-t text-navy">
                    <span>Grand Total</span>
                    <span>{formatCurrency(summary.grandTotal || summary.total)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ── Future tracking note ── */}
          <div className="rounded-xl border border-dashed border-blue-200 bg-blue-50/50 p-4 text-sm text-blue-700 text-center">
            🔔 <strong>Live tracking coming soon!</strong> &nbsp;You will receive WhatsApp & SMS updates as your order moves.
          </div>

        </div>
      </div>
    </>
  );
};

export default OrderSuccess;
