import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Store,
  Package,
  TrendingUp,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Bell,
  RefreshCw,
  ShoppingBag,
  Droplets,
  CalendarDays,
  Users,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  Sliders,
  DollarSign,
  Receipt,
  ArrowUpRight,
  ArrowDownLeft,
  Truck,
  Sparkles,
  Layers,
  ChevronDown,
  Flower2,
  Flame,
  Boxes,
  CheckSquare,
  X,
  Search,
  Eye,
  Phone,
  MapPin,
  Check,
  FileText,
  Printer,
  User,
  Route,
  Pause,
  Play,
  FileDown,
  Navigation,
  Compass,
  Building2
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

const API_BASE = import.meta.env.VITE_API_URL || "https://server.apexbee.in/api";

type LiveStatus = "open" | "busy" | "temporarily_closed";

export function getOrderItemVariantDetails(it: any): { label?: string; value: string; isPrimary?: boolean }[] {
  if (!it) return [];
  const prod = (typeof it.productId === "object" && it.productId) ? it.productId : null;
  const details: { label?: string; value: string; isPrimary?: boolean }[] = [];

  // 1. Direct variantName or selectedVariant
  let vName = it.variantName || it.variant || it.selectedVariant?.name || it.selectedVariant?.title || it.selectedVariant?.label;
  if (typeof vName === "object" && vName) {
    vName = vName.name || vName.title || vName.label || "";
  }

  // 2. Check if productId has variants and match by variantId, sku, or price
  let matchedVariant: any = null;
  if (prod?.variants && Array.isArray(prod.variants) && prod.variants.length > 0) {
    matchedVariant = prod.variants.find((v: any) =>
      (it.variantId && String(v._id) === String(it.variantId)) ||
      (it.sku && v.sku && String(v.sku).toLowerCase() === String(it.sku).toLowerCase()) ||
      (vName && (v.name === vName || v.title === vName || v.label === vName))
    );
    if (!vName && matchedVariant) {
      vName = matchedVariant.name || matchedVariant.title || matchedVariant.label;
    }
  }

  if (vName && String(vName).toLowerCase() !== "default") {
    details.push({ label: "Variant", value: String(vName), isPrimary: true });
  }

  // 3. Size and Color
  const color = it.color || it.selectedColor || matchedVariant?.attributes?.color;
  if (color && !["default", "none", "n/a"].includes(String(color).toLowerCase())) {
    details.push({ label: "Color", value: String(color) });
  }

  const size = it.size || it.selectedSize || matchedVariant?.attributes?.size;
  if (size && !["default", "none", "n/a", "one size"].includes(String(size).toLowerCase())) {
    details.push({ label: "Size", value: String(size) });
  }

  // 4. Attributes / Specifications (e.g., volume, milk_type, weight, pack, flavor, etc.)
  const rawAttrs = it.selectedAttributes || it.attributes || matchedVariant?.attributes || prod?.attributes;
  if (rawAttrs && typeof rawAttrs === "object") {
    Object.entries(rawAttrs).forEach(([k, v]) => {
      if (v === null || v === undefined) return;
      const keyLower = k.toLowerCase().trim();
      if (["color", "size", "default", "distributedfrom", "commissiontype", "commissionpercent"].includes(keyLower)) return;
      let valStr = Array.isArray(v) ? v.join(", ") : String(v);
      if (!valStr || valStr === "default" || valStr === "none") return;

      const cleanLabel = k
        .replace(/_/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());

      if (!details.some((d) => d.value.toLowerCase() === valStr.toLowerCase())) {
        details.push({ label: cleanLabel, value: valStr });
      }
    });
  }

  // 5. Water returnable details
  if (it.waterDetails) {
    if (it.waterDetails.volumeLitres) {
      details.push({ label: "Capacity", value: `${it.waterDetails.volumeLitres} Litres` });
    }
    if (it.waterDetails.returnable) {
      details.push({ label: "Container", value: "Returnable Jar" });
    }
  }

  // 6. Pre-order schedule
  if (it.isPreOrder) {
    if (it.preOrderDeliveryDate) {
      details.push({
        label: "📅 Pre-Order",
        value: new Date(it.preOrderDeliveryDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
      });
    }
    if (it.preOrderTimeSlot) {
      details.push({ label: "⏰ Slot", value: it.preOrderTimeSlot });
    }
    if (it.preOrderCustomNote) {
      details.push({ label: "✍️ Note", value: `"${it.preOrderCustomNote}"` });
    }
  }

  return details;
}

export default function VendorPortal() {
  const navigate = useNavigate();

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  }, []);

  const userId = user?._id || user?.id;
  const token = localStorage.getItem("token") || "";

  // Core States
  const [loading, setLoading] = useState(true);
  const [vendorProfile, setVendorProfile] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [activeWorkspace, setActiveWorkspace] = useState<any>(null);

  // Operational data
  const [alerts, setAlerts] = useState<{ orders: any[]; expiry: any[] }>({ orders: [], expiry: [] });
  const [dairyData, setDairyData] = useState<any>(null);
  const [waterData, setWaterData] = useState<any>(null);
  const [produceData, setProduceData] = useState<any>(null);
  const [specialistData, setSpecialistData] = useState<any>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [activeTab, setActiveTab] = useState<"workspace" | "orders" | "catalog" | "alerts">("workspace");

  // Orders Management State
  const [ordersList, setOrdersList] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [orderFilter, setOrderFilter] = useState<string>("all");
  const [orderSearch, setOrderSearch] = useState<string>("");
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [deliveryPartners, setDeliveryPartners] = useState<any[]>([]);

  // Dairy Module Specialized States
  const [dairySubTab, setDairySubTab] = useState<"demand" | "subscribers" | "routes" | "inventory" | "procurement">("demand");
  const [subscriberFilter, setSubscriberFilter] = useState<string>("all");
  const [subscriberSearch, setSubscriberSearch] = useState<string>("");
  const [activeSubActionId, setActiveSubActionId] = useState<string | null>(null);
  const [dairyMovementModalOpen, setDairyMovementModalOpen] = useState(false);
  const [movementProduct, setMovementProduct] = useState("");
  const [movementType, setMovementType] = useState<"collection" | "return" | "wastage" | "expired">("collection");
  const [movementQuantity, setMovementQuantity] = useState(10);
  const [movementNotes, setMovementNotes] = useState("");
  const [submittingMovement, setSubmittingMovement] = useState(false);
  const [dairyRoutePeriod, setDairyRoutePeriod] = useState<"morning" | "evening">("morning");
  const [optimizingRoute, setOptimizingRoute] = useState(false);
  const [optimizedRouteData, setOptimizedRouteData] = useState<any>(null);

  // Load registered delivery partners for manual assignment
  useEffect(() => {
    if (!token) return;
    fetch(`${API_BASE}/delivery/agents`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => {
        if (data?.success && Array.isArray(data.partners)) {
          setDeliveryPartners(data.partners);
        } else if (data?.success && Array.isArray(data.agents)) {
          setDeliveryPartners(data.agents);
        } else if (Array.isArray(data)) {
          setDeliveryPartners(data);
        }
      })
      .catch(() => { });
  }, [token]);

  // Load Vendor Orders
  const loadOrders = useCallback(async () => {
    if (!token) return;
    setLoadingOrders(true);
    try {
      const res = await fetch(`${API_BASE}/orders?limit=100`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        const list = Array.isArray(data.orders) ? data.orders : (Array.isArray(data.data) ? data.data : []);
        setOrdersList(list);
      }
    } catch (err) {
      console.error("Vendor portal load orders error:", err);
    } finally {
      setLoadingOrders(false);
    }
  }, [token]);

  // Open an order directly from alert
  const openAlertOrder = async (orderId: string) => {
    setActiveTab("orders");
    let found = ordersList.find((o) => o._id === orderId || o.id === orderId || o.orderNumber === orderId);
    if (!found && token) {
      try {
        let res = await fetch(`${API_BASE}/vendor/workspace/alerts/orders/${orderId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        let data = await res.json();
        if (res.ok && data.order) {
          found = data.order;
        } else {
          res = await fetch(`${API_BASE}/orders/${orderId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          data = await res.json();
          if (res.ok && data.order) {
            found = data.order;
          }
        }
      } catch (err) {
        console.error("Error fetching alert order details:", err);
      }
    }

    if (found) {
      setSelectedOrder(found);
      setOrderModalOpen(true);
    } else {
      void loadOrders();
    }
  };

  // Update Order Status handler
  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    if (!token || !orderId) return;
    setUpdatingOrderId(orderId);
    try {
      const res = await fetch(`${API_BASE}/orders/${orderId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ orderStatus: newStatus })
      });
      const data = await res.json();
      if (res.ok) {
        setOrdersList((prev) =>
          prev.map((o) => (o._id === orderId || o.id === orderId ? { ...o, orderStatus: newStatus } : o))
        );
        if (selectedOrder && (selectedOrder._id === orderId || selectedOrder.id === orderId)) {
          setSelectedOrder((prev: any) => ({ ...prev, orderStatus: newStatus }));
        }
        // Refresh alerts and stats
        const alertsRes = await fetch(`${API_BASE}/vendor/workspace/alerts`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const alertsData = await alertsRes.json();
        if (alertsRes.ok) {
          setAlerts({
            orders: alertsData.orders || [],
            expiry: alertsData.expiry || []
          });
        }
      } else {
        alert(data.message || "Failed to update order status.");
      }
    } catch (err: any) {
      alert(err.message || "Error updating order status.");
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // Assign Delivery Partner handler (Manual override)
  const handleAssignDeliveryPartner = async (orderId: string, partnerId: string) => {
    if (!token || !orderId) return;
    setUpdatingOrderId(orderId);
    try {
      const res = await fetch(`${API_BASE}/orders/${orderId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ deliveryAgentId: partnerId })
      });
      const data = await res.json();
      if (res.ok) {
        setOrdersList((prev) =>
          prev.map((o) => (o._id === orderId || o.id === orderId ? { ...o, deliveryAgentId: partnerId } : o))
        );
        if (selectedOrder && (selectedOrder._id === orderId || selectedOrder.id === orderId)) {
          const matched = deliveryPartners.find(p => String(p._id) === String(partnerId) || String(p.userId) === String(partnerId));
          setSelectedOrder((prev: any) => ({
            ...prev,
            deliveryAgentId: partnerId,
            assignedDeliveryAgent: matched?.name || "Assigned Partner",
            deliveryAgentName: matched?.name || "Assigned Partner",
            deliveryAgentPhone: matched?.mobile || ""
          }));
        }
        alert("Delivery partner assigned successfully!");
      } else {
        alert(data.message || "Failed to assign delivery partner.");
      }
    } catch (err: any) {
      alert(err.message || "Error assigning delivery partner.");
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // Filtered orders for customer orders tab
  const filteredOrders = useMemo(() => {
    return ordersList.filter((order) => {
      const st = String(order.orderStatus || "pending").toLowerCase();
      if (orderFilter !== "all") {
        if (orderFilter === "pending" && !["placed", "pending", "payment verified", "payment_verified"].includes(st)) return false;
        if (orderFilter === "preparing" && !["confirmed", "preparing", "packed"].includes(st)) return false;
        if (orderFilter === "ready" && !["ready", "ready_for_pickup", "shipped", "out for delivery", "out_for_delivery"].includes(st)) return false;
        if (orderFilter === "delivered" && !["delivered", "completed"].includes(st)) return false;
        if (orderFilter === "cancelled" && !["cancelled", "rejected"].includes(st)) return false;
      }
      if (orderSearch.trim()) {
        const q = orderSearch.toLowerCase();
        const numMatch = (order.orderNumber || String(order._id || order.id || "")).toLowerCase().includes(q);
        const custName = (order.customerId?.name || order.customerName || order.shippingAddress?.name || "").toLowerCase().includes(q);
        const custPhone = (order.customerId?.phone || order.customerId?.mobile || order.customerPhone || order.shippingAddress?.phone || "").toLowerCase().includes(q);
        const rawItems = (order.items && order.items.length) ? order.items : (order.orderItems || []);
        const itemMatch = rawItems.some((it: any) => {
          const prod = (typeof it.productId === "object" && it.productId) ? it.productId : null;
          const title = it.name || it.itemName || it.productName || prod?.name || "";
          return title.toLowerCase().includes(q);
        });
        if (!numMatch && !custName && !custPhone && !itemMatch) return false;
      }
      return true;
    });
  }, [ordersList, orderFilter, orderSearch]);

  // Devotional Kit Manifest Modal State
  const [manifestModalOpen, setManifestModalOpen] = useState(false);
  const [selectedKitProduct, setSelectedKitProduct] = useState("");
  const [manifestKitName, setManifestKitName] = useState("");
  const [manifestQuantity, setManifestQuantity] = useState(1);
  const [manifestNotes, setManifestNotes] = useState("");
  const [isSubmittingManifest, setIsSubmittingManifest] = useState(false);

  // Delivery Slot Extension Modal State
  const [slotModalOpen, setSlotModalOpen] = useState(false);
  const [slotOrderTarget, setSlotOrderTarget] = useState<any>(null);
  const [slotExtensionMinutes, setSlotExtensionMinutes] = useState(60);
  const [slotExtensionReason, setSlotExtensionReason] = useState("Store dispatch delayed due to road traffic and rain. Delivery on the way.");
  const [slotCustomSlot, setSlotCustomSlot] = useState("");
  const [isSubmittingSlotExt, setIsSubmittingSlotExt] = useState(false);

  const handleOpenSlotModal = (order: any) => {
    setSlotOrderTarget(order);
    setSlotExtensionMinutes(60);
    setSlotExtensionReason("Store dispatch delayed due to operational requirements. Rider is on the way.");
    setSlotCustomSlot(order.deliverySlot || order.preOrderTimeSlot || "");
    setSlotModalOpen(true);
  };

  const handleConfirmSlotExtension = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slotOrderTarget) return;
    setIsSubmittingSlotExt(true);
    try {
      const orderId = slotOrderTarget._id || slotOrderTarget.id;
      const res = await fetch(`${API_BASE}/orders/${orderId}/extend-slot`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          additionalMinutes: slotExtensionMinutes,
          newSlot: slotCustomSlot || undefined,
          reason: slotExtensionReason
        })
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || "Delivery time extended and customer notified!");
        setSlotModalOpen(false);
        void loadOrders();
      } else {
        alert(data.message || "Failed to extend delivery slot.");
      }
    } catch (err: any) {
      alert(err.message || "Error extending delivery slot.");
    } finally {
      setIsSubmittingSlotExt(false);
    }
  };

  // Load Vendor Profile & Workspaces
  const loadInitialData = useCallback(async () => {
    if (!token || !userId) {
      navigate("/login?redirect=/vendor/portal");
      return;
    }

    try {
      setLoading(true);
      const headers = { Authorization: `Bearer ${token}` };

      const [profRes, statsRes, wsRes, alertsRes] = await Promise.all([
        fetch(`${API_BASE}/vendor/profile/${userId}`, { headers }),
        fetch(`${API_BASE}/vendor/dashboard-stats/${userId}`, { headers }),
        fetch(`${API_BASE}/vendor/workspace`, { headers }),
        fetch(`${API_BASE}/vendor/workspace/alerts`, { headers }),
      ]);

      const profData = await profRes.json();
      if (profRes.ok && profData.vendor) {
        setVendorProfile(profData.vendor);
      }

      const statsData = await statsRes.json();
      if (statsRes.ok && statsData.stats) {
        setStats(statsData.stats);
      }

      const wsData = await wsRes.json();
      if (wsRes.ok && wsData.workspaces) {
        setWorkspaces(wsData.workspaces);
        if (wsData.workspaces.length > 0) {
          setActiveWorkspace(wsData.workspaces[0]);
        }
      }

      const alertsData = await alertsRes.json();
      if (alertsRes.ok) {
        setAlerts({
          orders: alertsData.orders || [],
          expiry: alertsData.expiry || []
        });
      }

      void loadOrders();
    } catch (err) {
      console.error("Vendor portal initial load error:", err);
    } finally {
      setLoading(false);
    }
  }, [token, userId, navigate, loadOrders]);

  useEffect(() => {
    void loadInitialData();
  }, [loadInitialData]);

  // Load Workspace-Specific Data when activeWorkspace changes
  const loadWorkspaceDetails = useCallback(async () => {
    if (!activeWorkspace || !token) return;

    try {
      const headers = { Authorization: `Bearer ${token}` };

      // 1. Dairy Workspace
      if (activeWorkspace.kind === "dairy") {
        const res = await fetch(`${API_BASE}/vendor/workspace/dairy?workspaceId=${activeWorkspace.id}`, { headers });
        const data = await res.json();
        if (res.ok) setDairyData(data);
      }

      // 2. Water Workspace
      const isWater = (activeWorkspace.name && activeWorkspace.name.toLowerCase().includes("water")) ||
        (activeWorkspace.slug && activeWorkspace.slug.toLowerCase().includes("water"));
      if (isWater) {
        const res = await fetch(`${API_BASE}/vendor/workspace/water?workspaceId=${activeWorkspace.id}`, { headers });
        const data = await res.json();
        if (res.ok) setWaterData(data);
      }

      // 3. Produce / Grocery Workspace
      if (activeWorkspace.dailyNeedsProfile) {
        const res = await fetch(`${API_BASE}/vendor/workspace/daily-needs/overview?workspaceId=${activeWorkspace.id}`, { headers });
        const data = await res.json();
        if (res.ok) setProduceData(data);
      }

      // 4. Devotional / Catalog Specialist Workspace
      const isDevo = (activeWorkspace.categoryName && activeWorkspace.categoryName.toLowerCase().includes("devotional")) ||
        (activeWorkspace.slug && activeWorkspace.slug.toLowerCase().includes("devotional")) ||
        (activeWorkspace.name && /pooja|puja|festival|flower|garland|idol|prasadam|brass/.test(activeWorkspace.name.toLowerCase()));
      if (isDevo || activeWorkspace.kind === "catalog") {
        const res = await fetch(`${API_BASE}/vendor/workspace/specialist?workspaceId=${activeWorkspace.id}`, { headers });
        const data = await res.json();
        if (res.ok) {
          setSpecialistData(data);
          if (data.products && data.products.length > 0 && !selectedKitProduct) {
            setSelectedKitProduct(data.products[0].id);
          }
        }
      }
    } catch (err) {
      console.error("Workspace details load error:", err);
    }
  }, [activeWorkspace, token, selectedKitProduct]);

  useEffect(() => {
    void loadWorkspaceDetails();
  }, [activeWorkspace, loadWorkspaceDetails]);

  // Toggle Live Status
  const handleStatusChange = async (newStatus: LiveStatus) => {
    if (!userId || !token) return;
    setUpdatingStatus(true);
    try {
      const res = await fetch(`${API_BASE}/vendor/profile/${userId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ liveStatus: newStatus })
      });
      const data = await res.json();
      if (res.ok && data.vendor) {
        setVendorProfile((prev: any) => ({ ...prev, liveStatus: newStatus }));
      }
    } catch (err) {
      alert("Unable to update live status. Please try again.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Submit Verified Devotional Kit Assembly Manifest
  const handleRecordKitManifest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWorkspace || !selectedKitProduct) return;

    if (!manifestKitName.trim()) {
      alert("Please enter the name of the ritual kit or festival combo.");
      return;
    }

    if (!manifestNotes.trim() || manifestNotes.trim().length < 5) {
      alert("Please list the verified kit components in the notes (minimum 5 characters).");
      return;
    }

    setIsSubmittingManifest(true);
    try {
      const payload = {
        kind: "bundle_manifest",
        productId: selectedKitProduct,
        quantity: Number(manifestQuantity) || 1,
        reference: manifestKitName.trim(),
        notes: manifestNotes.trim(),
        date: new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date()),
        requestId: `kit-asm-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
      };

      const res = await fetch(`${API_BASE}/vendor/workspace/specialist/records`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to record kit assembly manifest.");

      alert("Ritual kit packing verified and manifest logged successfully!");
      setManifestModalOpen(false);
      setManifestKitName("");
      setManifestNotes("");
      void loadWorkspaceDetails();
    } catch (err: any) {
      alert(err.message || "Error saving manifest.");
    } finally {
      setIsSubmittingManifest(false);
    }
  };

  // Toggle Dairy Subscription Pause / Resume
  const handleToggleSubscriptionStatus = async (subId: string, currentStatus: string) => {
    if (!token || !activeWorkspace) return;
    const action = currentStatus === "paused" ? "resume" : "pause";
    setActiveSubActionId(subId);
    try {
      const res = await fetch(`${API_BASE}/vendor/workspace/dairy/subscriptions/${subId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ action, workspaceId: activeWorkspace.id })
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || `Subscription ${action}d successfully!`);
        void loadWorkspaceDetails();
      } else {
        alert(data.message || `Failed to ${action} subscription.`);
      }
    } catch (err: any) {
      alert(err.message || `Error updating subscription status.`);
    } finally {
      setActiveSubActionId(null);
    }
  };

  // Submit Dairy Stock Movement (Milk Collection, Returned Milk, Wastage, Expired)
  const handleRecordDairyMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWorkspace || !movementProduct) {
      alert("Please select a dairy product.");
      return;
    }
    setSubmittingMovement(true);
    try {
      const payload = {
        workspaceId: activeWorkspace.id,
        productId: movementProduct,
        type: movementType,
        quantity: Number(movementQuantity),
        notes: movementNotes.trim() || `${movementType} entry logged from vendor dashboard`,
        requestId: `dairy-mov-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
      };
      const res = await fetch(`${API_BASE}/vendor/workspace/dairy/stock-movements`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || "Stock movement recorded successfully!");
        setDairyMovementModalOpen(false);
        setMovementNotes("");
        void loadWorkspaceDetails();
      } else {
        alert(data.message || "Failed to record stock movement.");
      }
    } catch (err: any) {
      alert(err.message || "Error recording stock movement.");
    } finally {
      setSubmittingMovement(false);
    }
  };

  // Run Route Optimizer for Morning or Evening shift
  const handleOptimizeDairyRoute = async (period: "morning" | "evening") => {
    if (!token || !activeWorkspace || !dairyData?.subscriptions) return;
    setOptimizingRoute(true);
    try {
      const todayStr = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
      const eligibleSubs = dairyData.subscriptions.filter((s: any) => {
        const p = s.deliveryPeriod || (s.deliverySlot?.toLowerCase().includes("evening") || s.deliverySlot?.toLowerCase().includes("pm") ? "evening" : "morning");
        return p === period && s.status === "active";
      });

      if (eligibleSubs.length === 0) {
        alert(`No active subscriptions found for ${period} shift.`);
        setOptimizingRoute(false);
        return;
      }

      const res = await fetch(`${API_BASE}/vendor/workspace/dairy/routes/optimize`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          workspaceId: activeWorkspace.id,
          date: todayStr,
          period,
          subscriptionIds: eligibleSubs.map((s: any) => s.id)
        })
      });
      const data = await res.json();
      if (res.ok) {
        setOptimizedRouteData(data);
        alert(`Route optimized! Arranged ${data.stops?.length || eligibleSubs.length} stops for ${period} shift.`);
      } else {
        // Fallback friendly alert if geocoding wasn't available
        alert(data.message || "Route optimized based on territory stop positions.");
      }
    } catch (err: any) {
      alert(err.message || "Error running route optimizer.");
    } finally {
      setOptimizingRoute(false);
    }
  };

  const currentStatus: LiveStatus = vendorProfile?.liveStatus || "open";

  return (
    <div className="min-h-screen bg-[#F4F6FA] text-[#0E1630]">
      <Navbar />

      <main className="container max-w-7xl mx-auto px-4 py-8 pb-24 text-left">
        {/* Top Header Card */}
        <div className="bg-white border border-gray-150 rounded-3xl p-6 sm:p-8 shadow-sm mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl bg-[#0A1128] text-[#F3BA12] flex items-center justify-center shrink-0 shadow-md">
                <Store size={32} />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h1 className="text-2xl sm:text-3xl font-black text-navy">
                    {vendorProfile?.businessName || user?.name || "My Business Portal"}
                  </h1>
                  <span className="bg-emerald-100 text-emerald-800 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <ShieldCheck size={13} /> Verified Vendor
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-gray-500">
                  {vendorProfile?.ownerName ? `Owner: ${vendorProfile.ownerName}` : ""}
                  {vendorProfile?.district ? ` · ${vendorProfile.district}, ${vendorProfile.state || ""}` : ""}
                  {vendorProfile?.primaryCategory ? ` · Vertical: ${vendorProfile.primaryCategory}` : ""}
                </p>
              </div>
            </div>

            {/* Live Store Status Switcher */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="bg-slate-50 border border-gray-200 p-1.5 rounded-2xl flex items-center gap-1 shadow-inner">
                <button
                  onClick={() => handleStatusChange("open")}
                  disabled={updatingStatus}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${currentStatus === "open"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-gray-600 hover:text-emerald-700 hover:bg-emerald-50"
                    }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
                  Accepting Orders
                </button>
                <button
                  onClick={() => handleStatusChange("busy")}
                  disabled={updatingStatus}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${currentStatus === "busy"
                    ? "bg-amber-500 text-white shadow-sm"
                    : "text-gray-600 hover:text-amber-700 hover:bg-amber-50"
                    }`}
                >
                  <Clock size={13} />
                  Busy Mode
                </button>
                <button
                  onClick={() => handleStatusChange("temporarily_closed")}
                  disabled={updatingStatus}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${currentStatus === "temporarily_closed"
                    ? "bg-rose-600 text-white shadow-sm"
                    : "text-gray-600 hover:text-rose-700 hover:bg-rose-50"
                    }`}
                >
                  Paused / Closed
                </button>
              </div>

              {vendorProfile?._id && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/vendor/${vendorProfile._id}`)}
                  className="rounded-xl border-gray-200 text-xs font-bold bg-white hover:bg-slate-50 shadow-sm"
                >
                  <ExternalLink size={13} className="mr-1.5" /> View Public Store
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Operational Alerts Banner */}
        {(alerts.orders.length > 0 || alerts.expiry.length > 0) && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 mb-6 space-y-2">
            <div className="flex items-center gap-2 text-xs font-extrabold text-amber-900">
              <AlertTriangle size={16} className="text-amber-600" />
              <span>Operational Priority Alerts ({alerts.orders.length + alerts.expiry.length})</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {alerts.orders.slice(0, 2).map((ord) => (
                <div key={ord.id} className="bg-white/80 p-2.5 rounded-xl border border-amber-200 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-navy">Order #{ord.number}</span>
                    <span className="text-[11px] text-amber-700 block">
                      {ord.kind === "deadline_warning" ? "Delivery deadline approaching soon!" : "New pending order ready for packing"}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openAlertOrder(ord.id)}
                    className="h-7 text-[11px] font-bold bg-amber-50 hover:bg-amber-100 border-amber-300 text-amber-900"
                  >
                    Open Order
                  </Button>
                </div>
              ))}
              {alerts.expiry.slice(0, 2).map((exp) => (
                <div key={exp.id} className="bg-white/80 p-2.5 rounded-xl border border-rose-200 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-rose-800">{exp.productName}</span>
                    <span className="text-[11px] text-gray-500 block">
                      Batch {exp.batchCode} · Expires: <strong>{exp.expiry}</strong> ({exp.remaining} units)
                    </span>
                  </div>
                  <span className="text-[10px] font-extrabold bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full">
                    Expiring Soon
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Core KPI Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white border border-gray-150 rounded-3xl p-5 shadow-sm">
            <span className="text-xs font-bold text-gray-500 block mb-1">Total Revenue</span>
            <div className="text-2xl sm:text-3xl font-black text-navy">
              ₹{stats?.totalRevenue ? Number(stats.totalRevenue).toLocaleString("en-IN") : "0"}
            </div>
            <p className="text-[11px] text-emerald-600 font-semibold mt-1">Wallet + Settlements</p>
          </div>

          <div
            onClick={() => {
              setActiveTab("orders");
              void loadOrders();
            }}
            className="bg-white border border-gray-150 rounded-3xl p-5 shadow-sm cursor-pointer hover:border-[#0A1128]/40 hover:shadow-md transition group"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-gray-500 block">Customer Orders</span>
              <span className="text-[10px] font-black text-navy bg-slate-100 group-hover:bg-[#0A1128] group-hover:text-[#F3BA12] px-2 py-0.5 rounded-full transition">
                View All →
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-navy">
              {ordersList.length || stats?.totalOrders || 0}
            </div>
            <p className="text-[11px] text-gray-400 mt-1">Processed orders</p>
          </div>

          <div className="bg-white border border-gray-150 rounded-3xl p-5 shadow-sm">
            <span className="text-xs font-bold text-gray-500 block mb-1">Active Products</span>
            <div className="text-2xl sm:text-3xl font-black text-emerald-600">
              {stats?.activeProducts || 0}
            </div>
            <p className="text-[11px] text-gray-400 mt-1">{stats?.lowStockCount ? `${stats.lowStockCount} low stock` : "In stock"}</p>
          </div>

          <div className="bg-white border border-gray-150 rounded-3xl p-5 shadow-sm">
            <span className="text-xs font-bold text-gray-500 block mb-1">Withdrawable Balance</span>
            <div className="text-2xl sm:text-3xl font-black text-[#F3BA12]">
              ₹{stats?.walletBalance ? Number(stats.walletBalance).toLocaleString("en-IN") : "0"}
            </div>
            <button onClick={() => navigate("/wallet")} className="text-[11px] text-navy font-bold underline mt-1">
              Transfer to Bank
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-gray-200 pb-3 mb-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab("workspace")}
            className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition flex items-center gap-2 shrink-0 ${activeTab === "workspace"
              ? "bg-[#0A1128] text-[#F3BA12] shadow-sm"
              : "bg-white text-gray-600 hover:bg-slate-100 border border-gray-200"
              }`}
          >
            <Layers size={16} />
            <span>Business Workspaces</span>
            {workspaces.length > 0 && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${activeTab === "workspace" ? "bg-white/10 text-white" : "bg-slate-100 text-gray-600"}`}>
                {workspaces.length}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              setActiveTab("orders");
              void loadOrders();
            }}
            className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition flex items-center gap-2 shrink-0 ${activeTab === "orders"
              ? "bg-[#0A1128] text-[#F3BA12] shadow-sm"
              : "bg-white text-gray-600 hover:bg-slate-100 border border-gray-200"
              }`}
          >
            <ShoppingBag size={16} />
            <span>Customer Orders</span>
            {alerts.orders.length > 0 ? (
              <span className="bg-amber-500 text-white text-[10px] px-2 py-0.5 rounded-full font-black animate-pulse">
                {alerts.orders.length} New
              </span>
            ) : ordersList.length > 0 ? (
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${activeTab === "orders" ? "bg-white/10 text-white" : "bg-slate-200 text-slate-800"}`}>
                {ordersList.length}
              </span>
            ) : null}
          </button>

          <button
            onClick={() => setActiveTab("alerts")}
            className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition flex items-center gap-2 shrink-0 ${activeTab === "alerts"
              ? "bg-[#0A1128] text-[#F3BA12] shadow-sm"
              : "bg-white text-gray-600 hover:bg-slate-100 border border-gray-200"
              }`}
          >
            <Bell size={16} />
            <span>Operations & Alerts</span>
            {(alerts.orders.length + alerts.expiry.length > 0) && (
              <span className="bg-rose-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                {alerts.orders.length + alerts.expiry.length}
              </span>
            )}
          </button>
        </div>

        {/* WORKSPACE SWITCHER */}
        {activeTab === "workspace" && workspaces.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Layers size={18} className="text-navy" />
                <h3 className="text-base font-extrabold text-navy">Approved Business Workspaces</h3>
              </div>
              <span className="text-xs text-gray-400 font-semibold">{workspaces.length} Active Channels</span>
            </div>

            <div className="flex flex-wrap gap-2.5">
              {workspaces.map((ws) => {
                const isSelected = activeWorkspace?.id === ws.id;
                const isWater = (ws.name && ws.name.toLowerCase().includes("water")) || (ws.slug && ws.slug.toLowerCase().includes("water"));
                const isDairy = ws.kind === "dairy";

                return (
                  <button
                    key={ws.id}
                    onClick={() => setActiveWorkspace(ws)}
                    className={`px-4 py-3 rounded-2xl border text-left transition flex items-center gap-3 ${isSelected
                      ? "bg-[#0A1128] text-white border-[#0A1128] shadow-md"
                      : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
                      }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center ${isSelected ? "bg-white/10 text-white" : "bg-slate-100 text-gray-600"
                        }`}
                    >
                      {isWater ? <Droplets size={16} /> : isDairy ? <Package size={16} /> : <Store size={16} />}
                    </div>
                    <div>
                      <div className="text-xs font-black leading-tight">{ws.name}</div>
                      <div className={`text-[10px] ${isSelected ? "text-gray-300" : "text-gray-400"}`}>
                        {ws.categoryName}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ACTIVE WORKSPACE MODULES */}
        {activeTab === "workspace" && activeWorkspace && (
          <div className="space-y-6">
            {/* 1. MILK & DAIRY WORKSPACE MODULE */}
            {activeWorkspace.kind === "dairy" && (
              <div className="bg-white border border-gray-150 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
                {/* Module Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full">
                      Milk &amp; Dairy Distribution Engine
                    </span>
                    <h2 className="text-xl font-black text-navy mt-1">
                      {activeWorkspace.name || "Milk & Dairy Vendor Module"}
                    </h2>
                    <p className="text-xs text-gray-500">
                      Manage household daily/monthly milk subscriptions, routes, dispatch calculations &amp; wholesale stock.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => setDairyMovementModalOpen(true)}
                      className="bg-[#0A1128] hover:bg-navy/90 text-[#F3BA12] rounded-xl text-xs font-bold"
                    >
                      <Plus size={14} className="mr-1" /> Log Stock Movement
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => void loadWorkspaceDetails()}
                      variant="outline"
                      className="rounded-xl text-xs font-bold"
                    >
                      <RefreshCw size={13} className="mr-1.5" /> Refresh
                    </Button>
                  </div>
                </div>

                {/* Sub-Navigation Tabs */}
                <div className="flex flex-wrap gap-2 border-b border-gray-100 pb-3">
                  {[
                    { id: "demand", label: "🥛 Demand & Forecast", badge: dairyData?.demand?.totalLitres ? `${dairyData.demand.totalLitres}L` : null },
                    { id: "subscribers", label: `👥 Subscribers`, badge: dairyData?.subscriptions?.length || 0 },
                    { id: "routes", label: "📍 Route Planning", badge: null },
                    { id: "inventory", label: "📦 Inventory & Wastage", badge: dairyData?.products?.length || null },
                    { id: "procurement", label: "🏭 Wholesale Procurement", badge: "Supplies" }
                  ].map((tab) => {
                    const isSel = dairySubTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setDairySubTab(tab.id as any)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 border ${isSel
                            ? "bg-[#0A1128] text-[#F3BA12] border-[#0A1128] shadow-xs"
                            : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                          }`}
                      >
                        <span>{tab.label}</span>
                        {tab.badge !== null && (
                          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${isSel ? "bg-white/20 text-[#F3BA12]" : "bg-slate-200 text-slate-700"
                            }`}>
                            {tab.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {dairyData ? (
                  <div className="space-y-6">
                    {/* SUB-TAB 1: DEMAND & FORECAST */}
                    {dairySubTab === "demand" && (
                      <div className="space-y-6">
                        {/* Summary Badges */}
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-left">
                          <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4">
                            <span className="text-xs font-bold text-amber-900 block mb-1">Tomorrow Deliveries</span>
                            <div className="text-2xl font-black text-amber-900">
                              {dairyData.summary?.tomorrowDeliveries || 0}
                            </div>
                            <p className="text-[11px] text-amber-700 mt-1">Scheduled doorstep runs</p>
                          </div>

                          <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-4">
                            <span className="text-xs font-bold text-blue-900 block mb-1">Active Subscribers</span>
                            <div className="text-2xl font-black text-blue-900">
                              {dairyData.summary?.active || 0}
                            </div>
                            <p className="text-[11px] text-blue-700 mt-1">Recurring households</p>
                          </div>

                          <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4">
                            <span className="text-xs font-bold text-emerald-900 block mb-1">Demand in Litres</span>
                            <div className="text-2xl font-black text-emerald-900">
                              {dairyData.demand?.totalLitres ? `${dairyData.demand.totalLitres} L` : "0 L"}
                            </div>
                            <p className="text-[11px] text-emerald-700 mt-1">Calculated at 18:00 IST</p>
                          </div>

                          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                            <span className="text-xs font-bold text-slate-700 block mb-1">Paused / Skipped</span>
                            <div className="text-2xl font-black text-slate-800">
                              {dairyData.summary?.paused || 0}
                            </div>
                            <p className="text-[11px] text-slate-500 mt-1">Temporary vacation holds</p>
                          </div>
                        </div>

                        {/* Breakdown by Product Pack */}
                        {dairyData.demand?.packs && (
                          <div className="text-left">
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                              Packaging Procurement Breakdown (Tomorrow Dispatch)
                            </h4>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                              {Object.entries(dairyData.demand.packs).map(([pack, count]: [string, any]) => (
                                <div key={pack} className="bg-slate-50 border border-gray-200 p-3 rounded-xl">
                                  <span className="text-[11px] font-bold text-gray-600 block">{pack}</span>
                                  <span className="text-lg font-black text-navy">{count} packs</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Smart Feature Notice */}
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4 text-left space-y-1">
                          <p className="font-extrabold text-blue-950 text-xs flex items-center gap-1.5">
                            <Sparkles size={14} className="text-blue-600" />
                            Smart Consumption &amp; Procurement Forecast
                          </p>
                          <p className="text-[11px] text-blue-900 leading-relaxed">
                            ApexBee AI aggregates subscriber daily milk, curd, and butter habits. Evening 6:00 PM estimates ensure you collect exact quantities from farms without overstocking or morning stockouts.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* SUB-TAB 2: SUBSCRIBERS LIST (Customer Management) */}
                    {dairySubTab === "subscribers" && (
                      <div className="space-y-4 text-left">
                        {/* Subscriber filters & Search */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex flex-wrap gap-1.5 text-xs">
                            {[
                              { id: "all", label: `All (${dairyData.subscriptions?.length || 0})` },
                              { id: "active", label: `Active (${dairyData.summary?.active || 0})` },
                              { id: "paused", label: `Paused (${dairyData.summary?.paused || 0})` },
                              { id: "expired", label: `Expired (${dairyData.summary?.expired || 0})` },
                              { id: "pending_payment", label: `Pending Payment (${dairyData.summary?.pendingPayment || 0})` }
                            ].map((f) => (
                              <button
                                key={f.id}
                                type="button"
                                onClick={() => setSubscriberFilter(f.id)}
                                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition border ${subscriberFilter === f.id
                                    ? "bg-navy text-[#F3BA12] border-navy"
                                    : "bg-white text-gray-600 border-gray-200 hover:bg-slate-50"
                                  }`}
                              >
                                {f.label}
                              </button>
                            ))}
                          </div>

                          <div className="w-full sm:w-64">
                            <Input
                              placeholder="Search subscriber name, phone..."
                              value={subscriberSearch}
                              onChange={(e) => setSubscriberSearch(e.target.value)}
                              className="text-xs rounded-xl"
                            />
                          </div>
                        </div>

                        {/* Subscribers Cards / Table */}
                        {(() => {
                          const list = (dairyData.subscriptions || []).filter((s: any) => {
                            if (subscriberFilter === "active" && s.status !== "active") return false;
                            if (subscriberFilter === "paused" && s.status !== "paused") return false;
                            if (subscriberFilter === "expired" && s.status !== "expired") return false;
                            if (subscriberFilter === "pending_payment" && !s.pendingPaymentDate) return false;
                            if (subscriberSearch.trim()) {
                              const q = subscriberSearch.toLowerCase();
                              const matchName = (s.customerName || "").toLowerCase().includes(q);
                              const matchPhone = (s.customerPhone || "").includes(q);
                              const matchProduct = (s.productName || "").toLowerCase().includes(q);
                              if (!matchName && !matchPhone && !matchProduct) return false;
                            }
                            return true;
                          });

                          if (list.length === 0) {
                            return (
                              <div className="py-12 text-center text-gray-400 bg-slate-50 rounded-2xl border border-dashed border-gray-200">
                                No subscribers match the filter or search.
                              </div>
                            );
                          }

                          return (
                            <div className="space-y-3">
                              {list.map((sub: any) => {
                                const isAct = sub.status === "active";
                                const isPaused = sub.status === "paused";
                                return (
                                  <div
                                    key={sub.id}
                                    className="bg-white border border-gray-200 rounded-2xl p-4 shadow-2xs hover:border-gray-300 transition space-y-3"
                                  >
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-2">
                                      <div className="flex flex-wrap items-center gap-2">
                                        <span className="font-extrabold text-navy text-sm">{sub.customerName || "Customer"}</span>
                                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase border ${isAct
                                            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                            : isPaused
                                              ? "bg-amber-50 text-amber-800 border-amber-200"
                                              : "bg-slate-100 text-slate-700 border-slate-200"
                                          }`}>
                                          {sub.status}
                                        </span>
                                        <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-blue-50 text-blue-900 border border-blue-200">
                                          🕒 Slot: {sub.deliverySlot || "Morning"}
                                        </span>
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-900 border border-purple-200">
                                          📅 {sub.frequency || "Daily"}
                                        </span>
                                      </div>

                                      <div className="text-xs font-bold text-slate-600">
                                        Qty: <strong className="text-navy">{sub.quantity} pack(s)</strong> ({sub.packSize || "1L"})
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                      <div className="text-slate-600 space-y-1">
                                        <p className="font-bold text-slate-900">{sub.productName || "Fresh Milk"}</p>
                                        <p className="text-[11px] text-slate-500">{sub.address || "Doorstep Address"}</p>
                                      </div>
                                      <div className="text-slate-600 space-y-1 sm:text-right">
                                        {sub.customerPhone && (
                                          <a href={`tel:${sub.customerPhone}`} className="text-navy hover:underline font-bold inline-flex items-center gap-1">
                                            <Phone size={11} /> {sub.customerPhone}
                                          </a>
                                        )}
                                        <p className="text-[11px] text-slate-500">
                                          Start: {sub.startDate || "Active"} · ₹{sub.unitPrice || 0}/day
                                        </p>
                                      </div>
                                    </div>

                                    <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-gray-100">
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        disabled={activeSubActionId === sub.id}
                                        onClick={() => handleToggleSubscriptionStatus(sub.id, sub.status)}
                                        className="h-8 text-xs font-bold rounded-xl"
                                      >
                                        {sub.status === "paused" ? (
                                          <>
                                            <Play size={12} className="mr-1 text-emerald-600" /> Resume Subscription
                                          </>
                                        ) : (
                                          <>
                                            <Pause size={12} className="mr-1 text-amber-600" /> Pause Subscription
                                          </>
                                        )}
                                      </Button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })()}
                      </div>
                    )}

                    {/* SUB-TAB 3: ROUTE PLANNING */}
                    {dairySubTab === "routes" && (
                      <div className="space-y-4 text-left">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                          <div>
                            <h3 className="font-extrabold text-navy text-sm">Delivery Route Management</h3>
                            <p className="text-xs text-gray-500">
                              Organize morning &amp; evening doorstep drops in optimal sequence to save rider fuel and time.
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <select
                              value={dairyRoutePeriod}
                              onChange={(e) => setDairyRoutePeriod(e.target.value as any)}
                              className="border border-gray-300 rounded-xl px-3 py-1.5 bg-white text-xs font-bold text-navy"
                            >
                              <option value="morning">Morning Route (06:00 AM - 08:00 AM)</option>
                              <option value="evening">Evening Route (05:00 PM - 07:00 PM)</option>
                            </select>

                            <Button
                              type="button"
                              disabled={optimizingRoute}
                              onClick={() => handleOptimizeDairyRoute(dairyRoutePeriod)}
                              className="bg-[#0A1128] hover:bg-navy/90 text-[#F3BA12] font-black text-xs rounded-xl px-4 py-2"
                            >
                              <Compass size={14} className="mr-1.5" />
                              {optimizingRoute ? "Arranging Stops..." : "⚡ Optimize Route Sequence"}
                            </Button>
                          </div>
                        </div>

                        {/* Stops Sequence Display */}
                        <div className="space-y-2">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                            Planned Route Stops ({dairyRoutePeriod.toUpperCase()})
                          </h4>
                          {(() => {
                            const stops = (dairyData.subscriptions || []).filter((s: any) => {
                              const p = s.deliveryPeriod || (s.deliverySlot?.toLowerCase().includes("evening") || s.deliverySlot?.toLowerCase().includes("pm") ? "evening" : "morning");
                              return p === dairyRoutePeriod && s.status === "active";
                            });

                            if (stops.length === 0) {
                              return (
                                <div className="py-8 text-center text-xs text-gray-400 bg-white border border-gray-200 rounded-2xl">
                                  No active subscribers assigned to {dairyRoutePeriod} shift.
                                </div>
                              );
                            }

                            return (
                              <div className="space-y-2">
                                {stops.map((sub: any, idx: number) => (
                                  <div
                                    key={sub.id}
                                    className="bg-white border border-gray-200 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                                  >
                                    <div className="flex items-center gap-3">
                                      <span className="w-6 h-6 rounded-full bg-navy text-[#F3BA12] font-black text-xs flex items-center justify-center shrink-0">
                                        {idx + 1}
                                      </span>
                                      <div>
                                        <span className="font-extrabold text-navy">{sub.customerName}</span>
                                        <span className="text-gray-500 text-[11px] block">{sub.address}</span>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-3 shrink-0">
                                      <span className="font-bold text-navy bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                                        {sub.quantity} pack(s) {sub.productName}
                                      </span>
                                      {sub.address && (
                                        <a
                                          href={`https://maps.google.com/?q=${encodeURIComponent(sub.address)}`}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="text-indigo-700 hover:underline font-bold text-[11px] inline-flex items-center gap-1"
                                        >
                                          <Navigation size={11} /> Directions
                                        </a>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    )}

                    {/* SUB-TAB 4: INVENTORY & STOCK LOG */}
                    {dairySubTab === "inventory" && (
                      <div className="space-y-4 text-left">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl">
                            <span className="text-[10px] font-bold uppercase text-slate-500 block">Total Active Products</span>
                            <span className="text-xl font-black text-navy">{dairyData.products?.length || 0}</span>
                          </div>
                          <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-2xl">
                            <span className="text-[10px] font-bold uppercase text-emerald-800 block">Packets In Stock</span>
                            <span className="text-xl font-black text-emerald-700">
                              {(dairyData.products || []).reduce((acc: number, p: any) => acc + (p.stock || 0), 0)}
                            </span>
                          </div>
                          <div className="bg-blue-50 border border-blue-200 p-3.5 rounded-2xl">
                            <span className="text-[10px] font-bold uppercase text-blue-800 block">Collection &amp; Fresh Milk</span>
                            <span className="text-xl font-black text-blue-700">Daily Inbound</span>
                          </div>
                          <div className="bg-rose-50 border border-rose-200 p-3.5 rounded-2xl">
                            <span className="text-[10px] font-bold uppercase text-rose-800 block">Wastage / Returned</span>
                            <span className="text-xl font-black text-rose-700">Audit Tracked</span>
                          </div>
                        </div>

                        {/* Product stock table */}
                        <div className="border border-gray-200 rounded-2xl overflow-hidden">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 border-b border-gray-200 text-[10px] font-bold uppercase text-slate-500">
                              <tr>
                                <th className="py-2.5 px-3">Product Name</th>
                                <th className="py-2.5 px-3">Pack Size</th>
                                <th className="py-2.5 px-3 text-right">Stock Available</th>
                                <th className="py-2.5 px-3">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {(dairyData.products || []).map((p: any) => (
                                <tr key={p.id} className="hover:bg-slate-50/50">
                                  <td className="py-2.5 px-3 font-bold text-navy">{p.name}</td>
                                  <td className="py-2.5 px-3 text-slate-600">{p.packSize || "Standard"}</td>
                                  <td className="py-2.5 px-3 text-right font-black text-navy">{p.stock || 0} units</td>
                                  <td className="py-2.5 px-3">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${p.stock > 10 ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                                      }`}>
                                      {p.stock > 10 ? "In Stock" : "Low Stock"}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* SUB-TAB 5: WHOLESALE PROCUREMENT */}
                    {dairySubTab === "procurement" && (
                      <div className="space-y-4 text-left">
                        <div className="bg-gradient-to-r from-amber-500/10 via-amber-50 to-orange-500/10 border border-amber-300 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <h3 className="font-black text-navy text-sm">Wholesale Dairy Procurement</h3>
                            <p className="text-xs text-gray-600">
                              Purchase bulk milk packets, feed supplies, packaging materials, and dairy equipment from ApexBee registered wholesalers.
                            </p>
                          </div>
                          <Button
                            type="button"
                            onClick={() => alert("ApexBee Wholesale Marketplace: Connecting with registered district dairy suppliers...")}
                            className="bg-[#0A1128] hover:bg-navy/90 text-[#F3BA12] font-black text-xs rounded-xl px-5 py-2 shrink-0"
                          >
                            Explore Wholesale Catalog
                          </Button>
                        </div>

                        {/* Procurement categories */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {[
                            { title: "Milk Packets & Milk Cans", desc: "Wholesale pouches, raw milk cans" },
                            { title: "Packaging Materials", desc: "Sealing covers, pouches, crates" },
                            { title: "Dairy Equipment", desc: "Testing lactometers, cream separators" },
                            { title: "Ice Boxes & Coolers", desc: "Insulated boxes for morning runs" },
                            { title: "Cattle Feed Supplies", desc: "Nutritional feed & supplements" },
                            { title: "Cleaning Products", desc: "Sanitizers, dairy hygiene solutions" }
                          ].map((cat, i) => (
                            <div key={i} className="bg-white border border-gray-200 rounded-xl p-3.5 space-y-1 hover:border-amber-300 transition">
                              <h4 className="font-extrabold text-navy text-xs">{cat.title}</h4>
                              <p className="text-[11px] text-gray-500">{cat.desc}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-8 text-center text-xs text-gray-400">Loading dairy demand calculations...</div>
                )}
              </div>
            )}

            {/* 2. WATER CANS WORKSPACE MODULE */}
            {((activeWorkspace.name && activeWorkspace.name.toLowerCase().includes("water")) ||
              (activeWorkspace.slug && activeWorkspace.slug.toLowerCase().includes("water"))) && (
                <div className="bg-white border border-gray-150 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                        Water & Returnable Containers
                      </span>
                      <h2 className="text-xl font-black text-navy mt-1">Water Can Balances & Empty Return Tracking</h2>
                      <p className="text-xs text-gray-500">
                        Manage customer outstanding cans, security deposits, and quick delivery reconciliation.
                      </p>
                    </div>

                    <Button
                      onClick={() => navigate("/vendor/workspace/water")}
                      className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm"
                    >
                      <Droplets size={14} className="mr-1.5 text-blue-200" /> Open Full Container Ledger
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-slate-50 border border-gray-200 p-4 rounded-2xl">
                      <span className="text-xs font-bold text-gray-500 block mb-1">Cans with Customers</span>
                      <div className="text-2xl font-black text-blue-600">
                        {waterData?.totals?.outstanding || 0} Cans
                      </div>
                      <p className="text-[11px] text-gray-400 mt-1">Outstanding returnable containers</p>
                    </div>

                    <div className="bg-slate-50 border border-gray-200 p-4 rounded-2xl">
                      <span className="text-xs font-bold text-gray-500 block mb-1">Security Deposit Held</span>
                      <div className="text-2xl font-black text-amber-600">
                        ₹{waterData?.totals?.depositPaise ? (waterData.totals.depositPaise / 100).toLocaleString("en-IN") : "0"}
                      </div>
                      <p className="text-[11px] text-gray-400 mt-1">Refundable customer deposits in custody</p>
                    </div>

                    <div className="bg-slate-50 border border-gray-200 p-4 rounded-2xl">
                      <span className="text-xs font-bold text-gray-500 block mb-1">Container Customers</span>
                      <div className="text-2xl font-black text-navy">
                        {waterData?.totals?.customers || 0}
                      </div>
                      <p className="text-[11px] text-gray-400 mt-1">Accounts with active balances</p>
                    </div>
                  </div>
                </div>
              )}

            {/* 3. PRODUCE & GROCERY BATCHES MODULE */}
            {activeWorkspace.dailyNeedsProfile && (
              <div className="bg-white border border-gray-150 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                      Fresh Produce & Batch Tracking
                    </span>
                    <h2 className="text-xl font-black text-navy mt-1">Expiry Status & Daily Stock Management</h2>
                    <p className="text-xs text-gray-500">
                      Track inventory batches, harvest freshness, and prevent expiry losses.
                    </p>
                  </div>
                </div>

                {produceData?.batches && produceData.batches.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-gray-100 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                          <th className="pb-3 px-3">Batch Code</th>
                          <th className="pb-3 px-3">Expiry Date</th>
                          <th className="pb-3 px-3">Remaining Stock</th>
                          <th className="pb-3 px-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {produceData.batches.slice(0, 5).map((batch: any) => (
                          <tr key={batch._id} className="hover:bg-slate-50/70 transition">
                            <td className="py-3 px-3 font-mono font-bold text-navy">{batch.batchCode}</td>
                            <td className="py-3 px-3 font-semibold text-gray-600">{batch.expiry}</td>
                            <td className="py-3 px-3 font-extrabold text-navy">{batch.remaining} units</td>
                            <td className="py-3 px-3">
                              <span
                                className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${batch.status === "fresh"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : batch.status === "expiring_soon"
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-rose-100 text-rose-800"
                                  }`}
                              >
                                {batch.status === "fresh"
                                  ? "Fresh Batch"
                                  : batch.status === "expiring_soon"
                                    ? "Expiring Soon"
                                    : "Expired"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="py-6 text-center text-xs text-gray-400">
                    No active stock batches recorded. When you receive fresh produce or grocery items, batches will track here.
                  </div>
                )}
              </div>
            )}

            {/* 4. DEVOTIONAL RETAIL, KITS & MERCHANDISE MODULE */}
            {((activeWorkspace.categoryName && activeWorkspace.categoryName.toLowerCase().includes("devotional")) ||
              (activeWorkspace.slug && activeWorkspace.slug.toLowerCase().includes("devotional")) ||
              specialistData?.tools?.bundles ||
              specialistData?.tools?.freshness) && (
                <div className="bg-white border border-gray-150 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full flex items-center gap-1 w-fit">
                        <Flame size={12} className="text-amber-600" />
                        Devotional Retail, Ritual Kits & Fresh Offerings
                      </span>
                      <h2 className="text-xl font-black text-navy mt-1.5">Pooja Kits, Festival Combos & Flower Freshness</h2>
                      <p className="text-xs text-gray-500">
                        Manage kit assembly packing manifests, festival advance pre-orders, and morning fresh flower dispatches.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => setManifestModalOpen(true)}
                        className="bg-[#0A1128] hover:bg-navy/90 text-[#F3BA12] rounded-xl text-xs font-bold shadow-sm"
                      >
                        <Boxes size={14} className="mr-1.5" /> Pack & Verify Kit Manifest
                      </Button>
                    </div>
                  </div>

                  {/* Subcategory Operations Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Card 1: Festival Combos & Ritual Kits */}
                    <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                          <Boxes size={15} className="text-amber-600" /> Festival & Ritual Kits
                        </span>
                        <span className="text-[10px] font-extrabold bg-amber-200/60 text-amber-900 px-2 py-0.5 rounded-full">
                          Combos
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Pre-packaged ritual kits (Satyanarayana, Homam, Gruhapravesam) & festival combos.
                      </p>
                      <div className="pt-2 border-t border-amber-200/60 flex items-center justify-between text-xs">
                        <span className="text-slate-500">Kit Assembly:</span>
                        <span className="font-bold text-navy">
                          {specialistData?.records?.filter((r: any) => r.kind === "bundle_manifest").length || 0} Verified
                        </span>
                      </div>
                    </div>

                    {/* Card 2: Fresh Flowers & Garlands */}
                    <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                          <Flower2 size={15} className="text-emerald-600" /> Flowers & Garlands
                        </span>
                        <span className="text-[10px] font-extrabold bg-emerald-200/60 text-emerald-900 px-2 py-0.5 rounded-full">
                          Fresh Batch
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Jasmine, Marigold, Lotus & Temple garlands with 12–24h freshness lifecycle.
                      </p>
                      <div className="pt-2 border-t border-emerald-200/60 flex items-center justify-between text-xs">
                        <span className="text-slate-500">Morning 6 AM Batch:</span>
                        <span className="font-bold text-emerald-800">Priority Scheduled</span>
                      </div>
                    </div>

                    {/* Card 3: Idols, Frames & Spiritual Decor */}
                    <div className="bg-blue-50/60 border border-blue-200/80 rounded-2xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                          <Sparkles size={15} className="text-blue-600" /> Idols & Deity Framing
                        </span>
                        <span className="text-[10px] font-extrabold bg-blue-200/60 text-blue-900 px-2 py-0.5 rounded-full">
                          Custom Orders
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Eco-friendly clay idols (water-soluble) and custom deity photo frames with sizing.
                      </p>
                      <div className="pt-2 border-t border-blue-200/60 flex items-center justify-between text-xs">
                        <span className="text-slate-500">Advance Pre-Orders:</span>
                        <span className="font-bold text-blue-900">Active</span>
                      </div>
                    </div>
                  </div>

                  {/* Verified Kit Manifests Audit Table */}
                  <div>
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                      Recent Verified Kit Manifests & Assembly Logs
                    </h4>
                    {specialistData?.records && specialistData.records.filter((r: any) => r.kind === "bundle_manifest").length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="border-b border-gray-100 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                              <th className="pb-3 px-3">Date</th>
                              <th className="pb-3 px-3">Kit / Combo Name</th>
                              <th className="pb-3 px-3">Assembled Quantity</th>
                              <th className="pb-3 px-3">Verified Component Checklist</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {specialistData.records
                              .filter((r: any) => r.kind === "bundle_manifest")
                              .slice(0, 5)
                              .map((rec: any) => (
                                <tr key={rec._id} className="hover:bg-slate-50/70 transition">
                                  <td className="py-3 px-3 font-semibold text-gray-600">{rec.date}</td>
                                  <td className="py-3 px-3 font-bold text-navy">{rec.reference}</td>
                                  <td className="py-3 px-3 font-extrabold text-navy">{rec.quantity} Kits</td>
                                  <td className="py-3 px-3 text-gray-600 max-w-md truncate" title={rec.notes}>
                                    {rec.notes}
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-6 text-center text-xs text-gray-400">
                        No kit packing manifests logged yet. Click <strong>"Pack & Verify Kit Manifest"</strong> to verify that all ritual items (Camphor, Kumkum, Turmeric, Sacred Thread, etc.) are packed before dispatch.
                      </div>
                    )}
                  </div>
                </div>
              )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: CUSTOMER ORDERS MANAGEMENT VIEW                     */}
        {/* ========================================================= */}
        {activeTab === "orders" && (
          <div className="space-y-6">
            {/* Header & Controls */}
            <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-navy bg-amber-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <ShoppingBag size={12} className="text-amber-800" />
                      Live Order Dispatch & Fulfillment
                    </span>
                    <span className="text-xs text-gray-400 font-semibold">
                      {ordersList.length} Total Orders
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-navy mt-1">
                    Customer Orders Management
                  </h2>
                  <p className="text-xs text-gray-500">
                    Track customer purchases, accept new incoming orders, and manage dispatch status.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void loadOrders()}
                    disabled={loadingOrders}
                    className="rounded-xl text-xs font-bold bg-white hover:bg-slate-50 border-gray-200"
                  >
                    <RefreshCw size={13} className={`mr-1.5 ${loadingOrders ? "animate-spin" : ""}`} />
                    Refresh Orders
                  </Button>
                </div>
              </div>

              {/* Filters & Search Bar */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-3 border-t border-gray-100">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                  <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search by order #, customer, phone, item..."
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    className="pl-9 text-xs rounded-xl border-gray-200 bg-slate-50/60 focus:bg-white"
                  />
                  {orderSearch && (
                    <button
                      onClick={() => setOrderSearch("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>

                {/* Status Filter Chips */}
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  {[
                    { id: "all", label: "All Orders" },
                    { id: "pending", label: "New / Pending" },
                    { id: "preparing", label: "Confirmed / Packing" },
                    { id: "ready", label: "Ready / Shipped" },
                    { id: "delivered", label: "Delivered" },
                    { id: "cancelled", label: "Cancelled" }
                  ].map((chip) => {
                    const isSelected = orderFilter === chip.id;
                    return (
                      <button
                        key={chip.id}
                        onClick={() => setOrderFilter(chip.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${isSelected
                          ? "bg-[#0A1128] text-[#F3BA12] shadow-xs"
                          : "bg-slate-100 text-gray-600 hover:bg-slate-200"
                          }`}
                      >
                        {chip.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Orders List View */}
            {loadingOrders && ordersList.length === 0 ? (
              <div className="bg-white border border-gray-150 rounded-3xl p-12 text-center text-gray-400 space-y-3">
                <RefreshCw size={24} className="animate-spin mx-auto text-navy" />
                <p className="text-xs font-bold">Loading your customer orders...</p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="bg-white border border-dashed border-gray-200 rounded-3xl p-12 text-center text-gray-400 space-y-2">
                <ShoppingBag size={36} className="mx-auto text-gray-300" />
                <h4 className="text-sm font-bold text-navy">No orders found</h4>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">
                  {orderSearch || orderFilter !== "all"
                    ? "No orders match the current search or status filter. Try clearing filters."
                    : "No orders have been placed for your store yet. When customers make a purchase, it will appear here."}
                </p>
                {(orderSearch || orderFilter !== "all") && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setOrderSearch("");
                      setOrderFilter("all");
                    }}
                    className="rounded-xl text-xs font-bold mt-2"
                  >
                    Reset Filters
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredOrders.map((ord: any) => {
                  const ordId = ord._id || ord.id;
                  const orderNum = ord.orderNumber || ordId;
                  const rawStatus = String(ord.orderStatus || "pending");
                  const st = rawStatus.toLowerCase();

                  // Customer Details
                  const custName =
                    ord.customerId?.name ||
                    ord.customerName ||
                    ord.shippingAddress?.name ||
                    "Customer";
                  const custPhone =
                    ord.customerId?.phone ||
                    ord.customerId?.mobile ||
                    ord.customerPhone ||
                    ord.shippingAddress?.phone ||
                    "";
                  const custAddress =
                    ord.shippingAddress?.address ||
                    ord.deliveryAddress ||
                    (ord.shippingAddress?.city ? `${ord.shippingAddress.city}, ${ord.shippingAddress.state || ""}` : "");

                  // Items
                  const rawItems = (ord.items && ord.items.length) ? ord.items : (ord.orderItems || []);
                  const totalItems = rawItems.reduce((acc: number, it: any) => acc + (Number(it.quantity) || 1), 0);

                  // Status Badge Styles
                  const isPending = ["placed", "pending", "payment verified", "payment_verified"].includes(st);
                  const isPreparing = ["confirmed", "preparing", "packed"].includes(st);
                  const isReady = ["ready", "ready_for_pickup", "shipped", "out for delivery", "out_for_delivery"].includes(st);
                  const isDelivered = ["delivered", "completed"].includes(st);
                  const isCancelled = ["cancelled", "rejected"].includes(st);

                  let statusBadgeClass = "bg-amber-100 text-amber-900 border-amber-200";
                  let statusLabel = rawStatus;
                  if (isPending) {
                    statusBadgeClass = "bg-amber-100 text-amber-900 border-amber-200";
                    statusLabel = "New / Placed";
                  } else if (isPreparing) {
                    statusBadgeClass = "bg-sky-100 text-sky-900 border-sky-200";
                    statusLabel = "Confirmed & Packing";
                  } else if (isReady) {
                    statusBadgeClass = "bg-indigo-100 text-indigo-900 border-indigo-200";
                    statusLabel = "Ready / Dispatched";
                  } else if (isDelivered) {
                    statusBadgeClass = "bg-emerald-100 text-emerald-900 border-emerald-200";
                    statusLabel = "Delivered";
                  } else if (["failed to deliver", "failed_to_deliver", "failed", "delivery failed"].includes(st)) {
                    statusBadgeClass = "bg-rose-100 text-rose-900 border-rose-300 font-black";
                    statusLabel = "Failed to Deliver";
                  } else if (isCancelled) {
                    statusBadgeClass = "bg-rose-100 text-rose-900 border-rose-200";
                    statusLabel = "Cancelled";
                  }

                  // Payment Status
                  const isPaid = ord.paymentStatus === "Paid" || ord.paymentDetails?.status === "completed";
                  const paymentMethod = ord.paymentMethod || ord.paymentDetails?.method || "UPI";

                  return (
                    <div
                      key={ordId}
                      className="bg-white border border-gray-150 rounded-3xl p-5 sm:p-6 shadow-sm hover:border-gray-300 transition space-y-4"
                    >
                      {/* Top Row: Order #, Date, Status */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <span className="font-black text-navy text-sm sm:text-base">
                            #{orderNum}
                          </span>
                          <span className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border ${statusBadgeClass}`}>
                            {statusLabel}
                          </span>

                          {/* Delivery Type Badge */}
                          {Boolean(ord.isScheduledSubscription || ord.isSubscription) ? (
                            <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-900 border border-purple-200 flex items-center gap-1">
                              🔁 Subscribed Order
                            </span>
                          ) : Boolean(ord.fulfillment?.type === 'pickup' || ord.deliveryType === 'pickup' || ord.isSelfPickup) ? (
                            <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200 flex items-center gap-1">
                              🏪 Store Pickup
                            </span>
                          ) : Boolean(ord.deliveryType === 'self_delivery' || profile?.deliveryMode === 'self_delivery' || ord.isSelfDelivery) ? (
                            <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-900 border border-emerald-200 flex items-center gap-1">
                              🛵 Store Self-Delivery
                            </span>
                          ) : (
                            <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-900 border border-sky-200 flex items-center gap-1">
                              🚚 Platform Delivery
                            </span>
                          )}

                          {/* Delivery Speed & Fee Badges */}
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                            {ord.fulfillment?.deliveryMode === 'express' || ord.deliveryMode === 'express'
                              ? '🚀 Express'
                              : ord.fulfillment?.deliveryMode === 'same_day' || ord.deliveryMode === 'same_day'
                                ? '⚡ Same Day'
                                : '📦 Standard'}
                            {' · '}
                            <strong className={Number(ord.orderSummary?.shipping ?? ord.shippingCharge ?? 0) === 0 ? "text-emerald-700" : "text-slate-800"}>
                              {Number(ord.orderSummary?.shipping ?? ord.shippingCharge ?? 0) === 0 ? "Free Del." : `₹${ord.orderSummary?.shipping ?? ord.shippingCharge} Del.`}
                            </strong>
                          </span>

                          {(ord.deliverySlot || ord.preOrderTimeSlot) && (
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-50 text-blue-900 border border-blue-200 flex items-center gap-1">
                              🕒 Slot: {ord.deliverySlot || ord.preOrderTimeSlot}
                            </span>
                          )}
                          {ord.slotExtended && (
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1" title={ord.slotExtensionReason}>
                              ⏳ Extended until {ord.slotExtendedUntil ? new Date(ord.slotExtendedUntil).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' }) : 'Extended'}
                            </span>
                          )}
                          {ord.pickupVerification?.otp && (
                            <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-700 border border-amber-500/30 flex items-center gap-1">
                              <span>Pickup OTP:</span>
                              <strong className="font-mono text-amber-900 tracking-wider">{ord.pickupVerification.otp}</strong>
                            </span>
                          )}
                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${isPaid ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-amber-50 text-amber-800 border border-amber-200"
                            }`}>
                            {isPaid ? "✓ Paid" : "Payment Pending"} · {String(paymentMethod).toUpperCase()}
                          </span>
                        </div>

                        <div className="text-xs text-gray-500 font-medium">
                          {ord.createdAt ? new Date(ord.createdAt).toLocaleString("en-IN", {
                            timeZone: "Asia/Kolkata",
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                          }) : ""}
                        </div>
                      </div>

                      {/* Middle Row: Customer Info, Items List, Order Amount */}
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                        {/* Customer Info (4 cols) */}
                        <div className="lg:col-span-4 space-y-1.5 text-xs text-slate-600 bg-slate-50/70 p-3.5 rounded-2xl border border-slate-100">
                          <div className="font-extrabold text-navy text-xs flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px] font-black">
                              {custName.charAt(0).toUpperCase()}
                            </span>
                            <span>{custName}</span>
                          </div>

                          {custPhone && (
                            <div className="flex items-center gap-1.5 text-slate-500">
                              <Phone size={12} className="text-slate-400 shrink-0" />
                              <a href={`tel:${custPhone}`} className="hover:text-navy hover:underline font-semibold">
                                {custPhone}
                              </a>
                            </div>
                          )}

                          {custAddress && (
                            <div className="flex items-start gap-1.5 text-slate-500 text-[11px] leading-tight">
                              <MapPin size={12} className="text-slate-400 shrink-0 mt-0.5" />
                              <span className="line-clamp-2" title={custAddress}>
                                {custAddress}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Items (5 cols) */}
                        <div className="lg:col-span-5 space-y-2">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 block">
                            Order Items ({totalItems} items)
                          </span>
                          <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                            {rawItems.map((it: any, idx: number) => {
                              const prod = (typeof it.productId === "object" && it.productId) ? it.productId : null;
                              const title = it.name || it.itemName || it.productName || prod?.name || "Product";
                              const qty = Number(it.quantity) || 1;
                              const price = Number(it.price ?? it.sellingPrice ?? prod?.baseSellingPrice ?? 0);
                              const img = it.image || it.thumbnail || prod?.thumbnail || prod?.images?.[0] || "/placeholder.svg";
                              const variantDetails = getOrderItemVariantDetails(it);

                              return (
                                <div key={it._id || idx} className="flex items-start justify-between text-xs gap-2 py-1.5 border-b border-slate-50 last:border-b-0">
                                  <div className="flex items-start gap-2 min-w-0">
                                    <img
                                      src={img}
                                      alt=""
                                      onError={(e) => { (e.target as any).src = "/placeholder.svg"; }}
                                      className="w-7 h-7 rounded-lg object-cover bg-slate-100 shrink-0 border border-slate-200 mt-0.5"
                                    />
                                    <div className="min-w-0">
                                      <span className="font-bold text-navy block truncate text-xs" title={title}>
                                        {title}
                                      </span>
                                      {variantDetails.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-0.5">
                                          {variantDetails.map((vd, vIdx) => (
                                            <span
                                              key={vIdx}
                                              className="inline-flex items-center text-[10px] font-medium bg-amber-50 text-amber-800 border border-amber-200/60 px-1.5 py-0.2 rounded"
                                            >
                                              <span className="text-amber-600 font-semibold mr-1">{vd.label}:</span> {vd.value}
                                            </span>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <span className="shrink-0 text-slate-600 font-semibold text-xs whitespace-nowrap">
                                    {qty} × ₹{price.toLocaleString("en-IN")}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Total & Action Buttons (3 cols) */}
                        <div className="lg:col-span-3 flex flex-col justify-between items-start lg:items-end gap-3 text-left lg:text-right border-t lg:border-t-0 pt-3 lg:pt-0">
                          <div>
                            <span className="text-[10px] font-extrabold uppercase text-gray-400 block">Total Amount</span>
                            <div className="text-xl font-black text-navy">
                              ₹{Number(ord.totalAmount || 0).toLocaleString("en-IN")}
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedOrder(ord);
                                setOrderModalOpen(true);
                              }}
                              className="rounded-xl text-xs font-bold bg-white hover:bg-slate-50 border-gray-200 h-8 flex-1 lg:flex-initial"
                            >
                              <Eye size={13} className="mr-1" /> View Details
                            </Button>

                            {/* Inform Customer & Extend Slot Button */}
                            {!["delivered", "completed", "cancelled", "returned", "refunded"].includes(st) && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOpenSlotModal(ord)}
                                className="rounded-xl text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300 h-8 flex-1 lg:flex-initial flex items-center gap-1"
                                title="Inform customer and extend delivery time slot to avoid order failure"
                              >
                                <Clock size={12} className="text-amber-700" />
                                Extend Time / Inform
                              </Button>
                            )}

                            {/* Quick status progression actions */}
                            {isPending && (
                              <Button
                                size="sm"
                                disabled={updatingOrderId === ordId}
                                onClick={() => handleUpdateOrderStatus(ordId, "Confirmed")}
                                className="bg-[#0A1128] hover:bg-navy/90 text-[#F3BA12] rounded-xl text-xs font-bold h-8 flex-1 lg:flex-initial"
                              >
                                {updatingOrderId === ordId ? "Updating..." : "Accept Order"}
                              </Button>
                            )}

                            {st === "confirmed" && (
                              <Button
                                size="sm"
                                disabled={updatingOrderId === ordId}
                                onClick={() => handleUpdateOrderStatus(ordId, "Packed")}
                                className="bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold h-8 flex-1 lg:flex-initial"
                              >
                                {updatingOrderId === ordId ? "Updating..." : "Mark Packed & Ready"}
                              </Button>
                            )}

                            {st === "packed" && (
                              <>
                                {(ord.fulfillment?.type === "pickup" || ord.deliveryType === "pickup" || ord.isSelfPickup) ? (
                                  <Button
                                    size="sm"
                                    disabled={updatingOrderId === ordId}
                                    onClick={() => handleUpdateOrderStatus(ordId, "Delivered")}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold h-8 flex-1 lg:flex-initial"
                                  >
                                    {updatingOrderId === ordId ? "Updating..." : "Customer Picked Up"}
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    disabled={updatingOrderId === ordId}
                                    onClick={() => handleUpdateOrderStatus(ordId, "Shipped")}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold h-8 flex-1 lg:flex-initial"
                                    title="Hand over package to rider or mark dispatched"
                                  >
                                    {updatingOrderId === ordId ? "Updating..." : "Handover / Dispatched"}
                                  </Button>
                                )}
                              </>
                            )}

                            {["accepted", "assigned", "reached vendor"].includes(st) && (
                              <span className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-xl">
                                🛵 Rider Assigned
                              </span>
                            )}

                            {["picked up", "out for delivery", "out_for_delivery", "shipped"].includes(st) && (
                              <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-xl">
                                🚚 Out for Delivery
                              </span>
                            )}

                            {["delivered", "completed"].includes(st) && (
                              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-xl">
                                ✅ Delivered
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: OPERATIONS & PRIORITY ALERTS VIEW                   */}
        {/* ========================================================= */}
        {activeTab === "alerts" && (
          <div className="space-y-6">
            <div className="bg-white border border-gray-150 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full flex items-center gap-1 w-fit">
                    <Bell size={12} className="text-amber-600" />
                    Priority Operations & Expiry Monitor
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black text-navy mt-1">
                    Operational Priority Alerts
                  </h2>
                  <p className="text-xs text-gray-500">
                    Direct warnings for pending orders ready for packing and products nearing expiration.
                  </p>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => void loadInitialData()}
                  className="rounded-xl text-xs font-bold bg-white"
                >
                  <RefreshCw size={13} className="mr-1.5" /> Refresh Alerts
                </Button>
              </div>

              {/* 1. Pending Order Alerts */}
              <div className="space-y-3">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                  <ShoppingBag size={14} className="text-amber-600" />
                  Order Dispatch Alerts ({alerts.orders.length})
                </h3>
                {alerts.orders.length === 0 ? (
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center text-xs text-slate-400">
                    No urgent pending order alerts at this time. All orders are on schedule.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    {alerts.orders.map((ord: any) => (
                      <div
                        key={ord.id}
                        className="bg-amber-50/60 p-4 rounded-2xl border border-amber-200 flex items-center justify-between gap-3 shadow-xs"
                      >
                        <div>
                          <div className="font-extrabold text-navy text-sm">Order #{ord.number}</div>
                          <span className="text-xs text-amber-800 font-medium block mt-0.5">
                            {ord.kind === "deadline_warning"
                              ? "⚠️ Delivery deadline approaching soon!"
                              : "📦 New pending customer order ready for packing"}
                          </span>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => openAlertOrder(ord.id)}
                          className="bg-[#0A1128] hover:bg-navy/90 text-[#F3BA12] text-xs font-bold rounded-xl h-8 shrink-0 shadow-xs"
                        >
                          Open Order
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 2. Stock Expiry Alerts */}
              <div className="space-y-3 pt-4 border-t border-gray-100">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                  <AlertTriangle size={14} className="text-rose-600" />
                  Product Freshness & Expiry Warnings ({alerts.expiry.length})
                </h3>
                {alerts.expiry.length === 0 ? (
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center text-xs text-slate-400">
                    No items expiring soon. All tracked inventory batches are within acceptable freshness windows.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    {alerts.expiry.map((exp: any) => (
                      <div
                        key={exp.id}
                        className="bg-rose-50/60 p-4 rounded-2xl border border-rose-200 flex items-center justify-between gap-3 shadow-xs"
                      >
                        <div>
                          <div className="font-extrabold text-rose-900 text-sm">{exp.productName}</div>
                          <span className="text-xs text-slate-600 block mt-0.5">
                            Batch: <strong>{exp.batchCode}</strong> · Remaining: <strong>{exp.remaining} units</strong>
                          </span>
                          <span className="text-[11px] text-rose-700 font-semibold block mt-0.5">
                            Expires on: {exp.expiry}
                          </span>
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-wider bg-rose-200 text-rose-900 px-2.5 py-1 rounded-full shrink-0">
                          Expiring Soon
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* MODAL: ORDER DETAILS & PACKING INSPECTION                 */}
        {/* ========================================================= */}
        {orderModalOpen && selectedOrder && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl animate-in fade-in zoom-in-95 my-8 max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="flex items-start justify-between border-b border-gray-100 pb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-black uppercase tracking-wider bg-slate-100 text-navy px-2 py-0.5 rounded-full">
                      Customer Order Details
                    </span>
                    <span className="text-xs text-gray-400 font-medium">
                      {selectedOrder.createdAt ? new Date(selectedOrder.createdAt).toLocaleString("en-IN", {
                        timeZone: "Asia/Kolkata",
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      }) : ""}
                    </span>
                  </div>
                  <h3 className="font-black text-navy text-xl sm:text-2xl">
                    Order #{selectedOrder.orderNumber || selectedOrder._id}
                  </h3>
                </div>
                <button
                  onClick={() => setOrderModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-gray-500 flex items-center justify-center transition"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Status Manager Bar */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-extrabold uppercase text-gray-400 block">Current Status</span>
                  <div className="font-black text-navy text-sm capitalize">
                    {selectedOrder.orderStatus || "Pending"}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 font-semibold">Change Status:</span>
                  <select
                    value={selectedOrder.orderStatus || "Placed"}
                    disabled={updatingOrderId === (selectedOrder._id || selectedOrder.id)}
                    onChange={(e) => handleUpdateOrderStatus(selectedOrder._id || selectedOrder.id, e.target.value)}
                    className="border border-gray-300 rounded-xl px-3 py-1.5 bg-white text-xs font-bold text-navy focus:outline-none focus:ring-2 focus:ring-navy"
                  >
                    <option value="Placed">Placed / Pending</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="Packed">Packed / Ready</option>
                    <option value="Shipped">Shipped / Out for Delivery</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              {/* Delivery Logistics & Fulfillment Type Overview */}
              {(() => {
                const isPickup = selectedOrder.fulfillment?.type === 'pickup' || selectedOrder.deliveryType === 'pickup' || selectedOrder.isSelfPickup;
                const isSelfDelivery = selectedOrder.deliveryType === 'self_delivery' || selectedOrder.isSelfDelivery || profile?.deliveryMode === 'self_delivery' || profile?.isSelfDelivery;
                const isSub = selectedOrder.isScheduledSubscription || selectedOrder.isSubscription;
                const shippingFee = Number(selectedOrder.orderSummary?.shipping ?? selectedOrder.shippingCharge ?? 0);

                return (
                  <div className="bg-gradient-to-r from-slate-50 via-amber-50/40 to-slate-50 border border-amber-300/80 rounded-2xl p-4 text-xs space-y-3 shadow-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200/60 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">
                          {isPickup ? '🏪' : isSelfDelivery ? '🛵' : isSub ? '🔁' : '🚚'}
                        </span>
                        <div>
                          <span className="text-[10px] font-black uppercase text-amber-800 tracking-wider block">
                            Delivery Logistics &amp; Fulfillment Mode
                          </span>
                          <p className="font-extrabold text-navy text-xs">
                            {isPickup
                              ? 'In-Store Customer Counter Pickup'
                              : isSelfDelivery
                                ? 'Store Partner Self-Delivery (Fulfilled by Store Fleet)'
                                : isSub
                                  ? 'Recurring Subscription Delivery Route'
                                  : 'ApexBee Platform Logistics Partner Delivery'}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-white border border-amber-300 text-navy">
                          {selectedOrder.fulfillment?.deliveryMode === 'express' || selectedOrder.deliveryMode === 'express'
                            ? '🚀 Express'
                            : selectedOrder.fulfillment?.deliveryMode === 'same_day' || selectedOrder.deliveryMode === 'same_day'
                              ? '⚡ Same Day'
                              : '📦 Standard'}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase border ${shippingFee === 0
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-amber-100 text-amber-900 border-amber-300'
                          }`}>
                          {shippingFee === 0 ? 'Delivery: FREE' : `Delivery: ₹${shippingFee}`}
                        </span>

                        {/* Pickup Verification OTP for Rider or Customer Handover */}
                        {selectedOrder.pickupVerification?.otp && (
                          <div className="bg-white border border-amber-400 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                            <span className="text-[9px] font-bold text-amber-800 uppercase">Pickup OTP:</span>
                            <span className="font-mono font-black text-amber-900 text-xs tracking-wider">
                              {selectedOrder.pickupVerification.otp}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
                      <div className="bg-white/80 p-2.5 rounded-xl border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">
                          🚚 Dispatch Provider
                        </span>
                        <span className="font-bold text-navy block text-xs">
                          {isSelfDelivery
                            ? 'Store Rider / Staff Fleet'
                            : isPickup
                              ? 'Customer Self-Pickup'
                              : 'ApexBee Assigned Courier'}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {shippingFee > 0 && isSelfDelivery
                            ? '✓ Delivery fee credited to Store'
                            : shippingFee > 0
                              ? 'Platform delivery fee'
                              : 'Free delivery applied'}
                        </span>
                      </div>

                      <div className="bg-white/80 p-2.5 rounded-xl border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">
                          🕒 Scheduled Slot / Window
                        </span>
                        <span className="font-bold text-amber-900 block text-xs">
                          {selectedOrder.deliverySlot || selectedOrder.preOrderTimeSlot || (selectedOrder.fulfillment?.pickupSlot ? `${selectedOrder.fulfillment.pickupSlot.date} • ${selectedOrder.fulfillment.pickupSlot.time}` : 'Standard Delivery Window')}
                        </span>
                        {selectedOrder.slotExtended && (
                          <span className="text-[10px] text-amber-700 block font-semibold">
                            ⏳ Extended: {selectedOrder.slotExtendedUntil ? new Date(selectedOrder.slotExtendedUntil).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' }) : 'Extended'}
                          </span>
                        )}
                      </div>

                      <div className="bg-white/80 p-2.5 rounded-xl border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">
                          👤 Delivery Agent / Staff
                        </span>
                        <span className="font-bold text-navy block text-xs truncate">
                          {selectedOrder.assignedDeliveryAgent || selectedOrder.deliveryAgentName || (isSelfDelivery ? (profile?.ownerName || 'Store Personnel') : 'Awaiting Assignment')}
                        </span>
                        {selectedOrder.deliveryAgentPhone && (
                          <span className="text-[10px] text-emerald-700 font-mono">
                            📞 {selectedOrder.deliveryAgentPhone}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Manual Rider Assignment Dropdown (for Platform Delivery mode) */}
                    {!isSelfDelivery && !isPickup && (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-amber-200/40">
                        <div className="text-slate-600 text-[11px]">
                          Territory: <strong>{selectedOrder.shippingAddress?.mandal || selectedOrder.shippingAddress?.city || "Local Territory"}</strong> ({selectedOrder.shippingAddress?.pincode || "504001"})
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-bold text-slate-700 shrink-0">Assign Partner:</span>
                          <select
                            value={selectedOrder.deliveryAgentId || ""}
                            onChange={(e) => handleAssignDeliveryPartner(selectedOrder._id || selectedOrder.id, e.target.value)}
                            className="border border-amber-300 rounded-xl px-2.5 py-1 bg-white text-[11px] font-bold text-navy focus:outline-none"
                          >
                            <option value="">-- Automated Broadcast (First to Accept) --</option>
                            {deliveryPartners.map((dp: any) => {
                              const dpId = dp.userId?._id || dp.userId || dp._id;
                              return (
                                <option key={dpId} value={String(dpId)}>
                                  {dp.name || "Delivery Partner"} ({dp.territory?.mandal || dp.mobile || "Rider"})
                                </option>
                              );
                            })}
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Customer & Delivery Address */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1.5">
                  <div className="font-black text-navy text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <User size={13} className="text-slate-400" /> Customer Information
                  </div>
                  <div className="font-bold text-navy text-sm">
                    {selectedOrder.customerId?.name || selectedOrder.customerName || selectedOrder.shippingAddress?.name || "Customer"}
                  </div>
                  {(selectedOrder.customerId?.phone || selectedOrder.customerPhone || selectedOrder.shippingAddress?.phone) && (
                    <div className="text-slate-600 flex items-center gap-1.5">
                      <Phone size={12} className="text-slate-400" />
                      <a
                        href={`tel:${selectedOrder.customerId?.phone || selectedOrder.customerPhone || selectedOrder.shippingAddress?.phone}`}
                        className="hover:underline font-semibold"
                      >
                        {selectedOrder.customerId?.phone || selectedOrder.customerPhone || selectedOrder.shippingAddress?.phone}
                      </a>
                    </div>
                  )}
                  {selectedOrder.customerId?.email && (
                    <div className="text-slate-500 text-[11px] truncate">
                      {selectedOrder.customerId.email}
                    </div>
                  )}
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1.5">
                  <div className="font-black text-navy text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin size={13} className="text-slate-400" /> Shipping & Delivery Address
                  </div>
                  <div className="text-slate-700 leading-relaxed font-medium">
                    {selectedOrder.shippingAddress?.address || selectedOrder.deliveryAddress || "Standard Delivery"}
                  </div>
                  {selectedOrder.shippingAddress?.city && (
                    <div className="text-slate-500 text-[11px]">
                      {[
                        selectedOrder.shippingAddress.locality,
                        selectedOrder.shippingAddress.city,
                        selectedOrder.shippingAddress.state,
                        selectedOrder.shippingAddress.pincode
                      ].filter(Boolean).join(", ")}
                    </div>
                  )}
                </div>
              </div>

              {/* Order Items Table */}
              <div className="space-y-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">
                  Itemized Order Content
                </h4>
                <div className="border border-gray-150 rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-gray-150 text-[10px] uppercase font-bold text-gray-500">
                      <tr>
                        <th className="py-2.5 px-3">Product</th>
                        <th className="py-2.5 px-3 text-right">Price</th>
                        <th className="py-2.5 px-3 text-center">Qty</th>
                        <th className="py-2.5 px-3 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {((selectedOrder.items && selectedOrder.items.length) ? selectedOrder.items : (selectedOrder.orderItems || [])).map((it: any, idx: number) => {
                        const prod = (typeof it.productId === "object" && it.productId) ? it.productId : null;
                        const title = it.name || it.itemName || it.productName || prod?.name || "Product";
                        const qty = Number(it.quantity) || 1;
                        const price = Number(it.price ?? it.sellingPrice ?? prod?.baseSellingPrice ?? 0);
                        const lineTotal = qty * price;
                        const img = it.image || it.thumbnail || prod?.thumbnail || prod?.images?.[0] || "/placeholder.svg";
                        const variantDetails = getOrderItemVariantDetails(it);

                        return (
                          <tr key={it._id || idx} className="hover:bg-slate-50/50">
                            <td className="py-2.5 px-3">
                              <div className="flex items-start gap-2.5">
                                <img
                                  src={img}
                                  alt=""
                                  onError={(e) => { (e.target as any).src = "/placeholder.svg"; }}
                                  className="w-10 h-10 rounded-lg object-cover bg-slate-100 shrink-0 border border-slate-200 mt-0.5"
                                />
                                <div>
                                  <div className="font-bold text-navy text-xs">{title}</div>
                                  {variantDetails.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {variantDetails.map((vd, vIdx) => (
                                        <span
                                          key={vIdx}
                                          className="inline-flex items-center text-[10px] font-medium bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded"
                                        >
                                          <span className="text-amber-600 font-semibold mr-1">{vd.label}:</span> {vd.value}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                  {(it.sku || prod?.sku) && (
                                    <span className="text-[10px] text-gray-400 block mt-0.5">SKU: {it.sku || prod?.sku}</span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-right text-slate-600">₹{price.toLocaleString("en-IN")}</td>
                            <td className="py-2.5 px-3 text-center font-bold text-navy">{qty}</td>
                            <td className="py-2.5 px-3 text-right font-black text-navy">₹{lineTotal.toLocaleString("en-IN")}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Financial Summary */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                <div>
                  <span className="text-gray-400 font-bold block text-[10px] uppercase">Payment Status</span>
                  <div className="font-black text-navy mt-0.5">
                    {selectedOrder.paymentStatus === "Paid" ? "✓ Payment Confirmed" : "Payment Pending"}
                    <span className="text-gray-500 font-normal"> · {selectedOrder.paymentMethod || selectedOrder.paymentDetails?.method || "UPI"}</span>
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-gray-400 font-bold block text-[10px] uppercase">Grand Total Amount</span>
                  <div className="text-2xl font-black text-navy">
                    ₹{Number(selectedOrder.totalAmount || 0).toLocaleString("en-IN")}
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(`${API_BASE}/orders/${selectedOrder._id || selectedOrder.id}/packing-slip`, "_blank")}
                    className="rounded-xl text-xs font-bold"
                  >
                    <Printer size={13} className="mr-1.5" /> Packing Slip
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(`${API_BASE}/orders/${selectedOrder._id || selectedOrder.id}/invoice`, "_blank")}
                    className="rounded-xl text-xs font-bold"
                  >
                    <FileText size={13} className="mr-1.5" /> Invoice PDF
                  </Button>
                </div>

                <Button
                  onClick={() => setOrderModalOpen(false)}
                  className="bg-[#0A1128] hover:bg-navy/90 text-[#F3BA12] rounded-xl text-xs font-bold px-5"
                >
                  Done
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: VERIFIED KIT ASSEMBLY MANIFEST */}
        {manifestModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                    <Boxes size={18} />
                  </div>
                  <div>
                    <h3 className="font-black text-navy text-base">Verify Kit Assembly Manifest</h3>
                    <p className="text-[11px] text-gray-400">Ensure all essential ritual items are verified before dispatch.</p>
                  </div>
                </div>
                <button onClick={() => setManifestModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleRecordKitManifest} className="space-y-4 text-left text-xs">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Ritual Kit / Festival Combo Name *</label>
                  <Input
                    placeholder="e.g. Satyanarayana Vratham Complete Kit / Diwali Laxmi Puja Kit"
                    value={manifestKitName}
                    onChange={(e) => setManifestKitName(e.target.value)}
                    required
                    className="rounded-xl font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Catalog Product Mapping *</label>
                  <select
                    value={selectedKitProduct}
                    onChange={(e) => setSelectedKitProduct(e.target.value)}
                    required
                    className="w-full border border-gray-200 rounded-xl p-2.5 bg-white text-xs font-semibold"
                  >
                    {specialistData?.products && specialistData.products.length > 0 ? (
                      specialistData.products.map((p: any) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.stock} in stock)
                        </option>
                      ))
                    ) : (
                      <option value="">No products mapped</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Kits Assembled / Packed Count *</label>
                  <Input
                    type="number"
                    min={1}
                    max={1000}
                    value={manifestQuantity}
                    onChange={(e) => setManifestQuantity(parseInt(e.target.value) || 1)}
                    required
                    className="rounded-xl font-bold text-sm"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold text-gray-700">Verified Component Checklist & Notes *</label>
                    <span className="text-[10px] text-amber-700 font-bold">Minimum 5 characters</span>
                  </div>
                  <textarea
                    rows={4}
                    value={manifestNotes}
                    onChange={(e) => setManifestNotes(e.target.value)}
                    placeholder="List all verified packed items: e.g. Turmeric, Kumkum, Agarbatti, Dhoop sticks, Camphor tablets, Cotton wicks, Deepam oil pouch, Betel nuts, Sacred threads (Yagnopaveetham), Vibhuti."
                    required
                    minLength={5}
                    maxLength={1000}
                    className="w-full border border-gray-200 rounded-xl p-3 bg-white text-xs leading-relaxed"
                  />
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {["+ Turmeric & Kumkum", "+ Camphor & Wicks", "+ Agarbatti & Dhoop", "+ Betel Nuts", "+ Sacred Thread"].map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setManifestNotes((prev) => (prev ? `${prev}, ${tag.replace("+ ", "")}` : tag.replace("+ ", "")))}
                        className="text-[10px] bg-slate-100 hover:bg-amber-100 text-slate-700 px-2 py-0.5 rounded-md font-semibold transition"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setManifestModalOpen(false)}
                    disabled={isSubmittingManifest}
                    className="rounded-xl text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmittingManifest}
                    className="bg-navy hover:bg-navy/90 text-[#F3BA12] rounded-xl text-xs font-bold"
                  >
                    {isSubmittingManifest ? "Verifying..." : "Save Assembly Log"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* MODAL: EXTEND DELIVERY TIME / INFORM CUSTOMER            */}
        {/* ========================================================= */}
        {slotModalOpen && slotOrderTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-gray-150 space-y-5 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                    <Clock size={16} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-navy">
                      Extend Delivery Window & Inform Customer
                    </h3>
                    <p className="text-[11px] text-gray-500">
                      Order #{slotOrderTarget.orderNumber || slotOrderTarget._id}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSlotModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-gray-600 flex items-center justify-center"
                >
                  <X size={15} />
                </button>
              </div>

              <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-3.5 text-xs text-amber-900 space-y-1">
                <p className="font-extrabold flex items-center gap-1.5">
                  <AlertTriangle size={14} className="text-amber-700 shrink-0" />
                  Time Slot Enforcement Notice
                </p>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Orders must be delivered within their scheduled time window. If a delivery window passes without an extension or customer notice, the platform automatically transitions the order to <strong>Failed to Deliver</strong>.
                </p>
              </div>

              <form onSubmit={handleConfirmSlotExtension} className="space-y-4 text-xs">
                <div>
                  <label className="block font-extrabold text-navy mb-1.5">
                    Select Additional Time to Extend:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { mins: 30, label: "+30 Minutes" },
                      { mins: 60, label: "+1 Hour" },
                      { mins: 120, label: "+2 Hours" },
                    ].map((opt) => (
                      <button
                        key={opt.mins}
                        type="button"
                        onClick={() => setSlotExtensionMinutes(opt.mins)}
                        className={`py-2 px-3 rounded-xl font-bold border text-xs transition ${slotExtensionMinutes === opt.mins
                            ? "bg-[#0A1128] text-[#F3BA12] border-[#0A1128]"
                            : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                          }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block font-extrabold text-navy mb-1.5">
                    Target Time Slot / Window (Optional update):
                  </label>
                  <Input
                    placeholder="e.g. 09:00 AM - 10:00 AM or Evening Shift"
                    value={slotCustomSlot}
                    onChange={(e) => setSlotCustomSlot(e.target.value)}
                    className="rounded-xl text-xs"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block font-extrabold text-navy">
                      Notice / Delay Reason to Customer:
                    </label>
                    <span className="text-[10px] text-gray-400">Sent via App Alert</span>
                  </div>
                  <textarea
                    rows={3}
                    value={slotExtensionReason}
                    onChange={(e) => setSlotExtensionReason(e.target.value)}
                    required
                    minLength={5}
                    placeholder="Explain why delivery is delayed and when to expect it..."
                    className="w-full border border-gray-200 rounded-xl p-3 bg-white text-xs leading-relaxed focus:border-navy"
                  />
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {[
                      "Rider delayed in traffic, dispatching soon",
                      "Fresh batch preparation in progress",
                      "Weather / rainfall delay, on the way"
                    ].map((quick) => (
                      <button
                        key={quick}
                        type="button"
                        onClick={() => setSlotExtensionReason(quick)}
                        className="text-[10px] bg-slate-100 hover:bg-amber-100 text-slate-700 px-2 py-0.5 rounded-md font-semibold transition"
                      >
                        + {quick}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setSlotModalOpen(false)}
                    disabled={isSubmittingSlotExt}
                    className="rounded-xl text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmittingSlotExt}
                    className="bg-[#0A1128] hover:bg-navy/90 text-[#F3BA12] rounded-xl text-xs font-bold"
                  >
                    {isSubmittingSlotExt ? "Extending..." : "Confirm Extension & Inform Customer"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
