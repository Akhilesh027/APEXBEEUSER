import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Truck,
  Package,
  MapPin,
  Phone,
  Clock,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  Navigation,
  DollarSign,
  ShieldCheck,
  Check,
  X,
  Store,
  ChevronRight,
  ExternalLink,
  Calendar,
  Layers,
  ArrowRight,
  Bell,
  Volume2,
  VolumeX
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const API_BASE = import.meta.env.VITE_API_URL || "https://server.apexbee.in/api";

export default function DeliveryPartnerPortal() {
  const navigate = useNavigate();
  const [token, setToken] = useState<string>("");
  const [user, setUser] = useState<any>(null);

  // Active Tab
  const [activeTab, setActiveTab] = useState<"broadcast" | "assigned" | "subscriptions" | "earnings">("assigned");

  // Portal Data States
  const [dashboard, setDashboard] = useState<any>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [wallet, setWallet] = useState<any>(null);
  const [codData, setCodData] = useState<any>(null);

  // Action states
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  // OTP inputs map
  const [pickupOtps, setPickupOtps] = useState<Record<string, string>>({});
  const [deliveryOtps, setDeliveryOtps] = useState<Record<string, string>>({});

  // Failure Modal
  const [failureModalOpen, setFailureModalOpen] = useState<boolean>(false);
  const [targetFailureOrder, setTargetFailureOrder] = useState<any>(null);
  const [failureReason, setFailureReason] = useState<string>("Customer phone unreachable / Doorstep closed");

  // Broadcast Alert and Sound notification state
  const [dismissedBroadcastIds, setDismissedBroadcastIds] = useState<string[]>([]);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const prevBroadcastCount = React.useRef(0);

  // Synthesized chime audio for order alert
  const playAlertChime = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.setValueAtTime(880.00, now + 0.15); // A5
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.5);
    } catch (_) { }
  }, [soundEnabled]);

  // Authentication check
  useEffect(() => {
    const savedToken = localStorage.getItem("token") || "";
    const savedUser = JSON.parse(localStorage.getItem("user") || "null");

    if (!savedToken || !savedUser) {
      navigate("/login?redirect=/delivery/portal");
      return;
    }

    setToken(savedToken);
    setUser(savedUser);
  }, [navigate]);

  // Load all partner data
  const loadDeliveryData = useCallback(async () => {
    if (!token) return;
    try {
      setRefreshing(true);
      const headers = { Authorization: `Bearer ${token}` };

      const [dashRes, ordersRes, subsRes, walletRes, codRes] = await Promise.all([
        fetch(`${API_BASE}/delivery/dashboard`, { headers }).catch(() => null),
        fetch(`${API_BASE}/delivery/orders`, { headers }).catch(() => null),
        fetch(`${API_BASE}/delivery/subscriptions`, { headers }).catch(() => null),
        fetch(`${API_BASE}/delivery/wallet`, { headers }).catch(() => null),
        fetch(`${API_BASE}/delivery/cod`, { headers }).catch(() => null)
      ]);

      if (dashRes && dashRes.ok) {
        const d = await dashRes.json();
        setDashboard(d.dashboard || d.data || d);
      }

      if (ordersRes && ordersRes.ok) {
        const o = await ordersRes.json();
        setAssignments(o.assignments || []);
      }

      if (subsRes && subsRes.ok) {
        const s = await subsRes.json();
        setSubscriptions(s.subscriptions || []);
      }

      if (walletRes && walletRes.ok) {
        const w = await walletRes.json();
        setWallet(w.wallet || w);
      }

      if (codRes && codRes.ok) {
        const c = await codRes.json();
        setCodData(c.cod || c);
      }
    } catch (err) {
      console.error("Error loading delivery portal data:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      void loadDeliveryData();
    }
  }, [token, loadDeliveryData]);

  // Periodic polling every 10 seconds to auto-detect new packed broadcast orders
  useEffect(() => {
    if (!token) return;
    const interval = setInterval(() => {
      void loadDeliveryData();
    }, 10000);
    return () => clearInterval(interval);
  }, [token, loadDeliveryData]);

  // Duty Toggle
  const handleToggleDuty = async (isOnline: boolean) => {
    if (!token) return;
    try {
      const endpoint = isOnline ? "/delivery/checkin" : "/delivery/checkout";
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setDashboard((prev: any) => ({
          ...prev,
          partner: { ...prev?.partner, status: isOnline ? "active" : "offline" }
        }));
        void loadDeliveryData();
      }
    } catch (err) {
      console.error("Duty toggle error:", err);
    }
  };

  // Accept Broadcast Order
  const handleAcceptOrder = async (orderId: string) => {
    if (!token) return;
    setActionInProgress(orderId);
    try {
      const res = await fetch(`${API_BASE}/delivery/orders/${orderId}/accept`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || "Order accepted successfully! Proceed to merchant store.");
        setActiveTab("assigned");
        void loadDeliveryData();
      } else {
        alert(data.message || "Could not accept order. It may have been claimed by another rider.");
      }
    } catch (err: any) {
      alert(err.message || "Error accepting order.");
    } finally {
      setActionInProgress(null);
    }
  };

  // Decline / Reject Broadcast Offer
  const handleDeclineOrder = async (orderId: string) => {
    if (!token) return;
    setActionInProgress(orderId);
    try {
      await fetch(`${API_BASE}/delivery/orders/${orderId}/reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ reason: "Declined by rider" })
      }).catch(() => null);

      setDismissedBroadcastIds((prev) => [...prev, String(orderId)]);
    } catch (err) {
      console.error("Decline order error:", err);
    } finally {
      setActionInProgress(null);
    }
  };

  // Lifecycle Transitions
  const handleOrderStatusStep = async (orderId: string, endpoint: string, bodyPayload?: any) => {
    if (!token) return;
    setActionInProgress(orderId);
    try {
      const res = await fetch(`${API_BASE}/delivery/orders/${orderId}/${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: bodyPayload ? JSON.stringify(bodyPayload) : undefined
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || "Delivery step updated successfully!");
        void loadDeliveryData();
      } else {
        alert(data.message || "Failed to update delivery status.");
      }
    } catch (err: any) {
      alert(err.message || "Error executing delivery update.");
    } finally {
      setActionInProgress(null);
    }
  };

  // Submit Failure
  const handleConfirmFailure = async () => {
    if (!targetFailureOrder) return;
    const orderId = targetFailureOrder.orderId?._id || targetFailureOrder.orderId?.id || targetFailureOrder._id;
    await handleOrderStatusStep(orderId, "failed", { reason: failureReason });
    setFailureModalOpen(false);
  };

  // Filter broadcast vs assigned
  const broadcastOrders = useMemo(() => {
    return assignments.filter((a) => {
      const ordId = String(a.orderId?._id || a.orderId || a._id);
      if (dismissedBroadcastIds.includes(ordId)) return false;
      return a.isBroadcast || a.status === "Broadcast";
    });
  }, [assignments, dismissedBroadcastIds]);

  const myAssignedOrders = useMemo(() => {
    return assignments.filter((a) => !a.isBroadcast && a.status !== "Broadcast");
  }, [assignments]);

  // Audio chime notification when a new packed broadcast order arrives
  useEffect(() => {
    if (broadcastOrders.length > prevBroadcastCount.current) {
      playAlertChime();
    }
    prevBroadcastCount.current = broadcastOrders.length;
  }, [broadcastOrders.length, playAlertChime]);

  return (
    <div className="min-h-screen bg-[#F4F6FA] text-[#0A1128] font-sans">
      <Navbar />

      <main className="container mx-auto px-4 py-6 max-w-6xl pb-24">
        {/* Top Header & Status Banner */}
        <div className="bg-[#0A1128] text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-indigo-950 mb-6 relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full text-xs font-bold text-[#F3BA12] mb-2 border border-white/10">
                <Truck size={14} /> Territory Delivery Partner Hub
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white">
                Rider Dispatch & Execution Portal
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-1">
                Territory: <strong className="text-white">{dashboard?.partner?.zone || dashboard?.partner?.mandal || "Adilabad Zone"}</strong> · Partner ID: <span className="font-mono text-amber-300 font-bold">{dashboard?.partner?.deliveryPartnerId || user?.phone}</span>
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => void loadDeliveryData()}
                disabled={refreshing}
                className="rounded-2xl text-xs font-bold bg-white text-navy border-none"
              >
                <RefreshCw size={13} className={`mr-1.5 ${refreshing ? "animate-spin" : ""}`} />
                Refresh Tasks
              </Button>

              <button
                onClick={() => handleToggleDuty(dashboard?.partner?.status !== "active")}
                className={`px-4 py-2 rounded-2xl text-xs font-black transition flex items-center gap-2 ${dashboard?.partner?.status === "active"
                    ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                    : "bg-slate-700 hover:bg-slate-600 text-slate-200"
                  }`}
              >
                <span className={`w-2.5 h-2.5 rounded-full ${dashboard?.partner?.status === "active" ? "bg-white animate-pulse" : "bg-red-400"}`} />
                {dashboard?.partner?.status === "active" ? "Online on Duty" : "Offline / Off Duty"}
              </button>
            </div>
          </div>

          {/* Quick Counter Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-white/10 text-xs">
            <div className="bg-white/5 p-3 rounded-2xl border border-white/10">
              <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">Territory Broadcasts</span>
              <span className="text-xl font-black text-[#F3BA12]">{broadcastOrders.length} Ready</span>
            </div>
            <div className="bg-white/5 p-3 rounded-2xl border border-white/10">
              <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">My Active Runs</span>
              <span className="text-xl font-black text-sky-400">{myAssignedOrders.length} In Progress</span>
            </div>
            <div className="bg-white/5 p-3 rounded-2xl border border-white/10">
              <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">Today’s Subscriptions</span>
              <span className="text-xl font-black text-emerald-400">{subscriptions.length} Stops</span>
            </div>
            <div className="bg-white/5 p-3 rounded-2xl border border-white/10">
              <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">Wallet Balance</span>
              <span className="text-xl font-black text-amber-300">₹{wallet?.availableBalance ?? wallet?.balance ?? 0}</span>
            </div>
          </div>
        </div>

        {/* PROMINENT INCOMING ORDER BROADCAST ALERT ON HOME PAGE */}
        {broadcastOrders.length > 0 && (
          <div className="mb-6 bg-gradient-to-r from-amber-500/15 via-red-500/10 to-orange-500/15 border-2 border-amber-500/50 rounded-3xl p-4 sm:p-6 shadow-xl">
            {/* Alert Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-500/30 pb-4 mb-4">
              <div className="flex items-start sm:items-center gap-3">
                <span className="relative flex h-5 w-5 mt-0.5 sm:mt-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-5 w-5 bg-red-600 items-center justify-center text-white text-[10px] font-black">
                    !
                  </span>
                </span>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base sm:text-lg font-black text-navy flex items-center gap-2">
                      <Bell className="text-red-600 animate-bounce" size={20} />
                      NEW ORDER PACKED &amp; WAITING FOR RIDER!
                    </h2>
                    <Badge className="bg-red-600 text-white font-black text-xs px-2.5 py-0.5 rounded-full animate-pulse">
                      {broadcastOrders.length} Ready in Your Territory
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-600 font-medium mt-0.5">
                    Vendor has packed the order. Review pickup details, time slot, and tap <strong className="text-emerald-700">Accept &amp; Claim</strong> before another rider takes it.
                  </p>
                </div>
              </div>

              {/* Sound alert control */}
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => {
                    const next = !soundEnabled;
                    setSoundEnabled(next);
                    if (next) playAlertChime();
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black border transition ${soundEnabled
                      ? "bg-amber-100 border-amber-300 text-amber-900"
                      : "bg-slate-100 border-slate-300 text-slate-600"
                    }`}
                  title="Toggle audio alert chime"
                >
                  {soundEnabled ? <Volume2 size={15} className="text-amber-700" /> : <VolumeX size={15} />}
                  <span>{soundEnabled ? "Alert Sound ON" : "Sound Muted"}</span>
                </button>
              </div>
            </div>

            {/* Broadcast Order Cards */}
            <div className="space-y-4">
              {broadcastOrders.map((item) => {
                const ord = item.orderId || {};
                const ordId = ord._id || ord.id || item._id;
                const ordNum = ord.orderNumber || ordId;
                const vend = item.vendorId || {};
                const cust = item.customerId || ord.shippingAddress || {};
                const slotStr = item.deliverySlot || ord.deliverySlot || ord.preOrderTimeSlot || "Standard Delivery";
                const isExtended = item.slotExtended || ord.slotExtended;
                const extendedUntil = item.slotExtendedUntil || ord.slotExtendedUntil;
                const payout = ord.deliveryCharge || 45;
                const paymentMethod = ord.paymentMethod || "PREPAID";
                const totalAmount = ord.totalAmount || 0;

                return (
                  <div
                    key={item._id}
                    className="bg-white border-2 border-amber-300/80 rounded-2xl p-4 sm:p-5 shadow-md hover:shadow-lg transition space-y-4 text-left"
                  >
                    {/* Top Bar of Alert Card */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-black text-navy text-base">#{ordNum}</span>
                        <span className="bg-amber-100 text-amber-900 font-extrabold text-[11px] px-2.5 py-0.5 rounded-md border border-amber-200">
                          📦 Status: Packed &amp; Ready
                        </span>
                        <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-md border ${isExtended
                            ? "bg-amber-50 text-amber-800 border-amber-300"
                            : "bg-blue-50 text-blue-900 border-blue-200"
                          }`}>
                          🕒 Time Slot: {slotStr}
                          {isExtended && extendedUntil && (
                            <span className="text-[10px] ml-1.5 font-bold text-amber-900">
                              (Extended until {new Date(extendedUntil).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })})
                            </span>
                          )}
                        </span>
                        {paymentMethod === "COD" ? (
                          <span className="bg-emerald-100 text-emerald-900 text-[10px] font-black px-2 py-0.5 rounded border border-emerald-300">
                            💵 Collect COD: ₹{totalAmount}
                          </span>
                        ) : (
                          <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded border border-slate-200">
                            💳 Prepaid Order
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="text-[10px] uppercase font-bold text-slate-500 block">Rider Payout</span>
                          <span className="text-emerald-700 font-black text-lg">₹{payout}</span>
                        </div>
                      </div>
                    </div>

                    {/* Pickup & Customer Route */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      {/* Pickup Vendor */}
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                        <div className="flex items-center justify-between font-black text-navy text-[11px] uppercase tracking-wider text-indigo-700">
                          <span className="flex items-center gap-1.5">
                            <Store size={14} className="text-indigo-600" />
                            1. Pickup Store (Vendor Packed)
                          </span>
                          {vend.phone && (
                            <a href={`tel:${vend.phone}`} className="text-indigo-700 hover:underline flex items-center gap-1 normal-case font-bold">
                              <Phone size={11} /> {vend.phone}
                            </a>
                          )}
                        </div>
                        <p className="font-extrabold text-slate-900 text-sm">{vend.businessName || vend.name || "Merchant Store"}</p>
                        <p className="text-slate-600 text-[11px] leading-relaxed">{vend.address || "Store Address"}</p>
                        {vend.address && (
                          <a
                            href={`https://maps.google.com/?q=${encodeURIComponent(vend.address)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 hover:underline pt-0.5"
                          >
                            <Navigation size={11} /> Store Directions
                          </a>
                        )}
                      </div>

                      {/* Dropoff Customer */}
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                        <div className="flex items-center justify-between font-black text-navy text-[11px] uppercase tracking-wider text-emerald-700">
                          <span className="flex items-center gap-1.5">
                            <MapPin size={14} className="text-emerald-600" />
                            2. Customer Doorstep Dropoff
                          </span>
                          {cust.phone && (
                            <a href={`tel:${cust.phone}`} className="text-emerald-700 hover:underline flex items-center gap-1 normal-case font-bold">
                              <Phone size={11} /> {cust.phone}
                            </a>
                          )}
                        </div>
                        <p className="font-extrabold text-slate-900 text-sm">{cust.name || cust.recipientName || "Customer"}</p>
                        <p className="text-slate-600 text-[11px] leading-relaxed">{cust.address || "Delivery Address"}</p>
                        {cust.address && (
                          <a
                            href={`https://maps.google.com/?q=${encodeURIComponent(cust.address)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:underline pt-0.5"
                          >
                            <Navigation size={11} /> Doorstep Directions
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons: Accept & Reject side-by-side */}
                    <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2 border-t border-gray-150">
                      <Button
                        type="button"
                        variant="outline"
                        disabled={actionInProgress === ordId}
                        onClick={() => handleDeclineOrder(ordId)}
                        className="w-full sm:w-auto border-red-300 text-red-700 hover:bg-red-50 hover:text-red-800 rounded-xl font-extrabold text-xs px-5 py-2.5 flex items-center justify-center gap-2"
                      >
                        <X size={15} />
                        Decline / Reject
                      </Button>

                      <Button
                        type="button"
                        disabled={actionInProgress === ordId}
                        onClick={() => handleAcceptOrder(ordId)}
                        className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs px-6 py-2.5 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                      >
                        <Check size={16} />
                        {actionInProgress === ordId ? "Accepting..." : "✅ Accept & Claim Order"}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {[
            { id: "assigned", label: `My Assigned Runs (${myAssignedOrders.length})`, icon: Truck },
            { id: "broadcast", label: `Broadcast Offers (${broadcastOrders.length})`, icon: Package },
            { id: "subscriptions", label: `Dairy Subscriptions (${subscriptions.length})`, icon: Calendar },
            { id: "earnings", label: "Wallet & COD Cash", icon: DollarSign }
          ].map((tab) => {
            const isSel = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-black transition flex items-center gap-2 border ${isSel
                    ? "bg-[#0A1128] text-[#F3BA12] border-[#0A1128] shadow-sm"
                    : "bg-white text-gray-700 border-gray-200 hover:bg-slate-50"
                  }`}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: MY ASSIGNED RUNS */}
        {activeTab === "assigned" && (
          <div className="space-y-4">
            {myAssignedOrders.length === 0 ? (
              <div className="bg-white border border-gray-150 rounded-3xl p-12 text-center text-gray-400 space-y-3">
                <Truck size={36} className="mx-auto text-slate-300" />
                <h3 className="text-base font-extrabold text-navy">No active orders assigned</h3>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">
                  Switch to the Broadcast Offers tab to accept ready packages packed by local merchants.
                </p>
                <Button
                  size="sm"
                  onClick={() => setActiveTab("broadcast")}
                  className="bg-[#0A1128] text-[#F3BA12] rounded-xl text-xs font-bold"
                >
                  View Available Territory Offers
                </Button>
              </div>
            ) : (
              myAssignedOrders.map((item) => {
                const ord = item.orderId || {};
                const ordId = ord._id || ord.id || item._id;
                const ordNum = ord.orderNumber || ordId;
                const currentStatus = String(item.status || ord.orderStatus || "Assigned").trim();
                const isDelivered = ["Delivered", "delivered", "completed"].includes(currentStatus);
                const isFailed = ["Failed to Deliver", "Failed", "failed"].includes(currentStatus);

                // Slot and extension metadata
                const slotStr = item.deliverySlot || ord.deliverySlot || ord.preOrderTimeSlot || "Scheduled Slot";
                const isExtended = Boolean(item.slotExtended || ord.slotExtended);
                const extendedUntil = item.slotExtendedUntil || ord.slotExtendedUntil;
                const extensionReason = item.slotExtensionReason || ord.slotExtensionReason;

                const cust = item.customerId || ord.shippingAddress || {};
                const vend = item.vendorId || {};

                return (
                  <div
                    key={item._id}
                    className="bg-white border border-gray-150 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4 hover:border-gray-300 transition"
                  >
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-black text-navy text-sm sm:text-base">#{ordNum}</span>
                        <Badge className={`text-[10px] font-black rounded-full px-2.5 py-0.5 ${isDelivered
                            ? "bg-emerald-100 text-emerald-900 border-emerald-300"
                            : isFailed
                              ? "bg-rose-100 text-rose-900 border-rose-300"
                              : "bg-indigo-100 text-indigo-900 border-indigo-300"
                          }`}>
                          {currentStatus}
                        </Badge>

                        {/* Delivery Slot Badge */}
                        <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-900 border border-blue-200 flex items-center gap-1">
                          🕒 Slot: {slotStr}
                        </span>

                        {isExtended && (
                          <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1" title={extensionReason}>
                            ⏳ Extended to {extendedUntil ? new Date(extendedUntil).toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit" }) : "Later"}
                          </span>
                        )}
                      </div>

                      <div className="text-xs font-bold text-navy">
                        COD Expected: <span className="text-emerald-700 font-black">₹{ord.totalAmount || 0}</span>
                      </div>
                    </div>

                    {/* Slot Warning Notice */}
                    {isFailed ? (
                      <div className="bg-rose-50 border border-rose-200 text-rose-900 rounded-2xl p-3 text-xs flex items-center gap-2">
                        <AlertCircle size={16} className="text-rose-600 shrink-0" />
                        <div>
                          <strong>Delivery Failed:</strong> Delivery slot window passed without fulfillment. Package to be returned to store.
                        </div>
                      </div>
                    ) : isExtended ? (
                      <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl p-3 text-xs flex items-center gap-2">
                        <Clock size={16} className="text-amber-700 shrink-0" />
                        <div>
                          <strong>Store Extended Delivery Slot:</strong> Deliver before {extendedUntil ? new Date(extendedUntil).toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit" }) : "updated deadline"}. Notice: <em>{extensionReason || "Operation delayed"}</em>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-blue-50/60 border border-blue-200/80 text-blue-900 rounded-2xl p-2.5 text-[11px] flex items-center gap-2">
                        <Clock size={14} className="text-blue-700 shrink-0" />
                        <span>Deliver under scheduled time slot <strong>{slotStr}</strong> to prevent auto-failure.</span>
                      </div>
                    )}

                    {/* Store & Customer Locations */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      {/* Merchant Pickup */}
                      <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-3.5 space-y-1.5">
                        <div className="flex items-center justify-between font-black text-navy">
                          <span className="flex items-center gap-1.5">
                            <Store size={14} className="text-indigo-600" />
                            Store Pickup Location
                          </span>
                          {vend.phone && (
                            <a href={`tel:${vend.phone}`} className="text-indigo-600 hover:underline flex items-center gap-1">
                              <Phone size={11} /> {vend.phone}
                            </a>
                          )}
                        </div>
                        <p className="font-extrabold text-slate-800">{vend.businessName || vend.name || "ApexBee Store"}</p>
                        <p className="text-slate-600 text-[11px] leading-relaxed">{vend.address || "Main Storefront Location"}</p>
                        <a
                          href={`https://maps.google.com/?q=${encodeURIComponent(vend.address || "")}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 hover:underline pt-1"
                        >
                          <Navigation size={11} /> Open in Google Maps
                        </a>
                      </div>

                      {/* Customer Dropoff */}
                      <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-3.5 space-y-1.5">
                        <div className="flex items-center justify-between font-black text-navy">
                          <span className="flex items-center gap-1.5">
                            <MapPin size={14} className="text-emerald-600" />
                            Customer Doorstep
                          </span>
                          {cust.phone && (
                            <a href={`tel:${cust.phone}`} className="text-emerald-700 hover:underline flex items-center gap-1">
                              <Phone size={11} /> {cust.phone}
                            </a>
                          )}
                        </div>
                        <p className="font-extrabold text-slate-800">{cust.name || cust.recipientName || "Customer"}</p>
                        <p className="text-slate-600 text-[11px] leading-relaxed">{cust.address || "Doorstep Address"}</p>
                        <a
                          href={`https://maps.google.com/?q=${encodeURIComponent(cust.address || "")}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 hover:underline pt-1"
                        >
                          <Navigation size={11} /> Open in Google Maps
                        </a>
                      </div>
                    </div>

                    {/* Step-by-Step Delivery Progression Controls */}
                    {!isDelivered && !isFailed && (
                      <div className="pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
                        {/* Step 1: Heading to Store */}
                        {["Assigned", "Accepted"].includes(currentStatus) && (
                          <Button
                            size="sm"
                            disabled={actionInProgress === ordId}
                            onClick={() => handleOrderStatusStep(ordId, "reached-pickup")}
                            className="bg-[#0A1128] hover:bg-navy/90 text-[#F3BA12] rounded-xl text-xs font-bold"
                          >
                            📍 Reached Merchant Store
                          </Button>
                        )}

                        {/* Step 2: At Store - Verify Pickup OTP */}
                        {["Reached Vendor", "reached_vendor"].includes(currentStatus) && (
                          <div className="flex flex-wrap items-center gap-2">
                            <Input
                              placeholder="Merchant Pickup OTP"
                              value={pickupOtps[ordId] || ""}
                              onChange={(e) => setPickupOtps({ ...pickupOtps, [ordId]: e.target.value })}
                              className="w-36 text-xs rounded-xl"
                            />
                            <Button
                              size="sm"
                              disabled={actionInProgress === ordId}
                              onClick={() => handleOrderStatusStep(ordId, "pickup", { otp: pickupOtps[ordId] })}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold"
                            >
                              Verify Pickup OTP & Collect Package
                            </Button>
                          </div>
                        )}

                        {/* Step 3: Package in Hand - Start Delivery */}
                        {["Picked Up", "picked_up"].includes(currentStatus) && (
                          <Button
                            size="sm"
                            disabled={actionInProgress === ordId}
                            onClick={() => handleOrderStatusStep(ordId, "out-for-delivery")}
                            className="bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold"
                          >
                            🚚 Start Delivery Run (Out for Delivery)
                          </Button>
                        )}

                        {/* Step 4: On the way - Reached Doorstep */}
                        {["Out for Delivery", "out_for_delivery", "Shipped"].includes(currentStatus) && (
                          <Button
                            size="sm"
                            disabled={actionInProgress === ordId}
                            onClick={() => handleOrderStatusStep(ordId, "reached-customer")}
                            className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold"
                          >
                            📍 Arrived at Customer Doorstep
                          </Button>
                        )}

                        {/* Step 5: At Doorstep - Verify Customer Delivery OTP */}
                        {["Reached Customer", "reached_customer"].includes(currentStatus) && (
                          <div className="flex flex-wrap items-center gap-2">
                            <Input
                              placeholder="Customer Delivery OTP"
                              value={deliveryOtps[ordId] || ""}
                              onChange={(e) => setDeliveryOtps({ ...deliveryOtps, [ordId]: e.target.value })}
                              className="w-36 text-xs rounded-xl font-mono text-center tracking-widest font-bold"
                            />
                            <Button
                              size="sm"
                              disabled={actionInProgress === ordId}
                              onClick={() => handleOrderStatusStep(ordId, "delivered", { otp: deliveryOtps[ordId] })}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold"
                            >
                              ✅ Verify OTP & Confirm Delivered
                            </Button>
                          </div>
                        )}

                        {/* Mark Failed Button */}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setTargetFailureOrder(item);
                            setFailureModalOpen(true);
                          }}
                          className="border-rose-300 text-rose-700 hover:bg-rose-50 rounded-xl text-xs font-bold ml-auto"
                        >
                          ⚠️ Report Missed / Delivery Failed
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* TAB 2: BROADCAST OFFERS */}
        {activeTab === "broadcast" && (
          <div className="space-y-4">
            {broadcastOrders.length === 0 ? (
              <div className="bg-white border border-gray-150 rounded-3xl p-12 text-center text-gray-400 space-y-3">
                <Package size={36} className="mx-auto text-slate-300" />
                <h3 className="text-base font-extrabold text-navy">No broadcast offers available</h3>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">
                  When local stores mark an order as Packed & Ready, it will broadcast to active territory riders here for first-come acceptance.
                </p>
              </div>
            ) : (
              broadcastOrders.map((item) => {
                const ord = item.orderId || {};
                const ordId = ord._id || ord.id || item._id;
                const ordNum = ord.orderNumber || ordId;
                const vend = item.vendorId || {};
                const cust = item.customerId || ord.shippingAddress || {};
                const slotStr = item.deliverySlot || ord.deliverySlot || ord.preOrderTimeSlot || "Standard Delivery";

                return (
                  <div
                    key={item._id}
                    className="bg-white border-2 border-indigo-200/80 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4 text-left"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-black text-navy text-base">#{ordNum}</span>
                        <Badge className="bg-amber-400 text-navy font-black text-[10px] px-2.5 py-0.5 rounded-full">
                          ⚡ LIVE BROADCAST
                        </Badge>
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-50 text-blue-900 border border-blue-200">
                          🕒 Slot: {slotStr}
                        </span>
                      </div>

                      <div className="text-xs font-bold text-navy">
                        Payout: <span className="text-emerald-700 font-black text-sm">₹{ord.deliveryCharge || 45}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                        <p className="text-[10px] font-black uppercase text-indigo-700">Pickup From Store</p>
                        <p className="font-extrabold text-navy mt-0.5">{vend.businessName || vend.name || "Merchant Store"}</p>
                        <p className="text-gray-500 text-[11px] leading-relaxed">{vend.address || "Store Address"}</p>
                      </div>

                      <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                        <p className="text-[10px] font-black uppercase text-emerald-700">Deliver To Customer</p>
                        <p className="font-extrabold text-navy mt-0.5">{cust.name || "Customer"}</p>
                        <p className="text-gray-500 text-[11px] leading-relaxed">{cust.address || "Delivery Address"}</p>
                      </div>
                    </div>

                    <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-3 border-t border-gray-100">
                      <Button
                        type="button"
                        variant="outline"
                        disabled={actionInProgress === ordId}
                        onClick={() => handleDeclineOrder(ordId)}
                        className="w-full sm:w-auto border-red-300 text-red-700 hover:bg-red-50 hover:text-red-800 rounded-xl font-extrabold text-xs px-5 py-2 flex items-center justify-center gap-2"
                      >
                        <X size={15} />
                        Decline / Reject
                      </Button>

                      <Button
                        type="button"
                        size="sm"
                        disabled={actionInProgress === ordId}
                        onClick={() => handleAcceptOrder(ordId)}
                        className="w-full sm:w-auto bg-[#0A1128] hover:bg-navy/90 text-[#F3BA12] font-black text-xs rounded-xl px-6 py-2 shadow-sm flex items-center justify-center gap-2"
                      >
                        <Check size={16} />
                        {actionInProgress === ordId ? "Claiming..." : "⚡ Accept & Claim Delivery"}
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* TAB 3: DAIRY SUBSCRIPTIONS */}
        {activeTab === "subscriptions" && (
          <div className="space-y-4">
            {subscriptions.length === 0 ? (
              <div className="bg-white border border-gray-150 rounded-3xl p-12 text-center text-gray-400 space-y-3">
                <Calendar size={36} className="mx-auto text-slate-300" />
                <h3 className="text-base font-extrabold text-navy">No subscription delivery runs today</h3>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">
                  Scheduled household milk and dairy subscriptions will appear here with delivery time slots.
                </p>
              </div>
            ) : (
              subscriptions.map((sub: any) => {
                const subId = sub._id || sub.id;
                const isDelivered = sub.runStatus === "Delivered" || sub.completedDates?.includes(new Date().toISOString().slice(0, 10));

                return (
                  <div
                    key={subId}
                    className="bg-white border border-gray-150 rounded-3xl p-5 shadow-sm space-y-3 text-left"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-2.5">
                      <div>
                        <span className="font-black text-navy text-sm">#{subId} · {sub.productName}</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-blue-800 rounded-full">
                            🕒 {sub.deliverySlot || "Morning (6 AM - 8 AM)"}
                          </span>
                          <span className="text-[10px] text-gray-400">Qty: {sub.quantity || 1} packs</span>
                        </div>
                      </div>

                      <Badge className={`text-[10px] font-black rounded-full px-2.5 py-0.5 ${isDelivered ? "bg-emerald-100 text-emerald-900 border-emerald-300" : "bg-amber-100 text-amber-900 border-amber-300"
                        }`}>
                        {isDelivered ? "Delivered" : "Pending Run"}
                      </Badge>
                    </div>

                    <div className="text-xs space-y-1 text-slate-600">
                      <p><strong>Customer:</strong> {sub.customerName} · <a href={`tel:${sub.customerPhone}`} className="text-indigo-600 font-bold">{sub.customerPhone}</a></p>
                      <p><strong>Address:</strong> {sub.address}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* TAB 4: WALLET & EARNINGS */}
        {activeTab === "earnings" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-left">
            <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="font-black text-navy text-base">Rider Earnings Wallet</h3>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <span className="text-xs text-gray-500 font-bold block">Available Wallet Balance</span>
                <span className="text-2xl font-black text-emerald-600 mt-1 block">
                  ₹{wallet?.availableBalance ?? wallet?.balance ?? 0}
                </span>
              </div>
              <p className="text-xs text-gray-400">
                Delivery payouts are credited per verified completed delivery. Payouts can be withdrawn directly to your registered bank account.
              </p>
            </div>

            <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="font-black text-navy text-base">Cash on Delivery (COD) In Hand</h3>
              <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200">
                <span className="text-xs text-amber-800 font-bold block">Pending Cash to Deposit</span>
                <span className="text-2xl font-black text-amber-900 mt-1 block">
                  ₹{codData?.totalCashCollected ?? codData?.cashInHand ?? 0}
                </span>
              </div>
              <p className="text-xs text-gray-400">
                Cash collected from customers during COD deliveries must be deposited to the merchant or settled daily.
              </p>
            </div>
          </div>
        )}

        {/* FAILURE REPORTING MODAL */}
        {failureModalOpen && targetFailureOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-150 space-y-4 animate-in fade-in zoom-in-95 duration-150 text-left">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <AlertCircle size={18} className="text-rose-600" />
                  <h3 className="font-black text-navy text-base">Report Delivery Failure</h3>
                </div>
                <button
                  onClick={() => setFailureModalOpen(false)}
                  className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-gray-600 flex items-center justify-center"
                >
                  <X size={14} />
                </button>
              </div>

              <p className="text-xs text-gray-500 leading-relaxed">
                If the delivery slot expired, the customer was unavailable, or the doorstep was closed, select the reason to update status to <strong>Failed to Deliver</strong>.
              </p>

              <div className="space-y-2 text-xs">
                <label className="block font-bold text-navy">Reason for failure:</label>
                {[
                  "Customer unreachable / phone not answered",
                  "Door locked / customer unavailable at address",
                  "Delivery slot expired without customer presence",
                  "Incorrect / incomplete address provided"
                ].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setFailureReason(r)}
                    className={`w-full text-left p-2.5 rounded-xl border text-xs font-semibold transition ${failureReason === r
                        ? "bg-rose-50 text-rose-900 border-rose-300 font-bold"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                  >
                    {r}
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setFailureModalOpen(false)}
                  className="rounded-xl text-xs"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleConfirmFailure}
                  className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold"
                >
                  Confirm Failed to Deliver
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

