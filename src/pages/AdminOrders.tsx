import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  Search,
  Filter,
  Eye,
  Download,
  RefreshCw,
  Clock,
  Truck,
  Store,
  CheckCircle,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  ShieldCheck,
  Calendar,
  Phone,
  MapPin,
  Tag,
  CreditCard,
  Printer,
  X,
  Check,
  Smile,
  Receipt,
  RotateCcw
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const API_BASE = import.meta.env.VITE_API_URL || 'https://server.apexbee.in/api';

export const AdminOrders: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deliveryTypeFilter, setDeliveryTypeFilter] = useState<string>('all');
  const [speedFilter, setSpeedFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 12;

  // Selected Order for Full Modal / Inspection
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);

  // User auth validation
  const currentUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}');
    } catch {
      return {};
    }
  }, []);

  const isAdmin = currentUser?.role === 'admin' || (Array.isArray(currentUser?.roles) && currentUser.roles.includes('admin'));

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE}/orders?limit=150`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setOrders(data.orders || []);
      } else {
        throw new Error(data.message || 'Failed to fetch platform orders');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error loading orders. Please ensure you are logged in as admin.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      setUpdatingStatusId(orderId);
      const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE}/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          orderStatus: newStatus,
          deliveryStatus: newStatus
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to update order status');
      }

      setOrders(prev => prev.map(o => (o._id === orderId || o.id === orderId) ? { ...o, orderStatus: newStatus, deliveryStatus: newStatus } : o));
      if (selectedOrder && (selectedOrder._id === orderId || selectedOrder.id === orderId)) {
        setSelectedOrder((prev: any) => ({ ...prev, orderStatus: newStatus, deliveryStatus: newStatus }));
      }

      setSuccessMsg(`Order status updated to "${newStatus}" successfully.`);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      alert(err.message || 'Error updating status');
    } finally {
      setUpdatingStatusId(null);
    }
  };

  // Filtered orders computation
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const ordNum = (o.orderNumber || o.id || o._id || '').toLowerCase();
        const custName = (o.shippingAddress?.name || o.customerId?.name || o.customerName || '').toLowerCase();
        const custPhone = (o.shippingAddress?.phone || o.customerId?.phone || o.customerPhone || '').toLowerCase();
        const storeName = (o.sellerId?.businessName || o.sellerId?.shopName || o.sellerId?.name || '').toLowerCase();
        const itemsMatch = (o.items || o.orderItems || []).some((it: any) =>
          (it.name || it.productName || '').toLowerCase().includes(q) ||
          (it.sku || '').toLowerCase().includes(q)
        );

        if (!ordNum.includes(q) && !custName.includes(q) && !custPhone.includes(q) && !storeName.includes(q) && !itemsMatch) {
          return false;
        }
      }

      // Status Filter
      if (statusFilter !== 'all') {
        const st = (o.orderStatus || o.deliveryStatus || '').toLowerCase();
        if (statusFilter === 'pending' && !['placed', 'pending', 'new'].includes(st)) return false;
        if (statusFilter === 'processing' && !['confirmed', 'processing', 'preparing'].includes(st)) return false;
        if (statusFilter === 'packed' && st !== 'packed') return false;
        if (statusFilter === 'shipped' && !['shipped', 'out for delivery', 'out_for_delivery', 'accepted', 'assigned'].includes(st)) return false;
        if (statusFilter === 'delivered' && st !== 'delivered') return false;
        if (statusFilter === 'cancelled' && !['cancelled', 'returned', 'refunded', 'failed'].includes(st)) return false;
      }

      // Delivery Type Filter
      if (deliveryTypeFilter !== 'all') {
        const isSelfDelivery = o.deliveryType === 'self_delivery' || o.isSelfDelivery || Boolean(o.sellerId?.deliveryMode === 'self_delivery');
        const isPickup = o.fulfillment?.type === 'pickup' || o.deliveryType === 'pickup' || o.isSelfPickup;
        const isSub = Boolean(o.isScheduledSubscription || o.isSubscription);

        if (deliveryTypeFilter === 'self_delivery' && !isSelfDelivery) return false;
        if (deliveryTypeFilter === 'pickup' && !isPickup) return false;
        if (deliveryTypeFilter === 'subscribed' && !isSub) return false;
        if (deliveryTypeFilter === 'platform' && (isSelfDelivery || isPickup || isSub)) return false;
      }

      // Speed Filter
      if (speedFilter !== 'all') {
        const mode = (o.fulfillment?.deliveryMode || o.deliveryMode || 'standard').toLowerCase();
        if (speedFilter === 'express' && mode !== 'express') return false;
        if (speedFilter === 'same_day' && mode !== 'same_day') return false;
        if (speedFilter === 'standard' && mode !== 'standard') return false;
      }

      return true;
    });
  }, [orders, searchQuery, statusFilter, deliveryTypeFilter, speedFilter]);

  // High-level Stats
  const stats = useMemo(() => {
    let totalGMV = 0;
    let totalTax = 0;
    let storeDeliveryCount = 0;
    let platformDeliveryCount = 0;
    let pickupCount = 0;

    orders.forEach(o => {
      const summary = o.orderSummary || {};
      totalGMV += Number(summary.grandTotal || summary.total || o.totalAmount || 0);
      totalTax += Number(summary.tax || (Number(summary.cgst || 0) + Number(summary.sgst || 0)) || 0);

      const isSelfDelivery = o.deliveryType === 'self_delivery' || o.isSelfDelivery;
      const isPickup = o.fulfillment?.type === 'pickup' || o.deliveryType === 'pickup' || o.isSelfPickup;

      if (isSelfDelivery) storeDeliveryCount++;
      else if (isPickup) pickupCount++;
      else platformDeliveryCount++;
    });

    return {
      totalCount: orders.length,
      totalGMV,
      totalTax,
      storeDeliveryCount,
      platformDeliveryCount,
      pickupCount
    };
  }, [orders]);

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage) || 1;
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredOrders.slice(start, start + itemsPerPage);
  }, [filteredOrders, currentPage, itemsPerPage]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Navigation & Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white border border-slate-200 p-6 rounded-3xl shadow-sm">
          <div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/account')}
                className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 transition text-slate-600"
                title="Back to Account"
              >
                <ArrowLeft size={18} />
              </button>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
                  <span>📦</span> Admin Order Management &amp; Logistics Hub
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Universal administrative order tracking, financial breakdown, tax calculations, and fulfillment monitoring.
                </p>
              </div>
            </div>

            {/* Quick Admin Navigation Tabs */}
            <div className="flex items-center gap-2 mt-4 flex-wrap">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">Admin Switcher:</span>
              <button
                onClick={() => navigate('/admin/orders')}
                className="px-3.5 py-1.5 bg-[#0A1128] text-[#F3BA12] font-black text-xs rounded-xl shadow-xs"
              >
                📦 Orders Hub
              </button>
              <button
                onClick={() => navigate('/admin/transactions')}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
              >
                💳 Transactions
              </button>
              <button
                onClick={() => navigate('/admin/reviews')}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
              >
                ⭐ Review Moderation
              </button>
              <button
                onClick={() => navigate('/admin/personalization')}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
              >
                🎯 Store Personalization
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchOrders}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition cursor-pointer"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              <span>Refresh Orders</span>
            </button>
          </div>
        </div>

        {/* Alerts */}
        {errorMsg && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs flex items-center gap-2 font-medium">
            <AlertTriangle size={16} className="text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs flex items-center gap-2 font-medium">
            <CheckCircle size={16} className="text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* High-Level Overview Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs text-left">
            <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">Total Platform Orders</span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">{stats.totalCount}</span>
            <span className="text-[10px] text-slate-500 font-medium">Across all merchants</span>
          </div>

          <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs text-left">
            <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">Gross Merchandise (GMV)</span>
            <span className="text-2xl font-black text-navy mt-1 block">₹{stats.totalGMV.toLocaleString('en-IN')}</span>
            <span className="text-[10px] text-emerald-600 font-semibold">Total Customer Value</span>
          </div>

          <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs text-left">
            <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">GST Tax Volume (CGST+SGST)</span>
            <span className="text-2xl font-black text-amber-600 mt-1 block">₹{stats.totalTax.toLocaleString('en-IN')}</span>
            <span className="text-[10px] text-slate-500 font-medium">Government tax accrued</span>
          </div>

          <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs text-left">
            <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">Store Self-Delivery</span>
            <span className="text-2xl font-black text-emerald-600 mt-1 block">{stats.storeDeliveryCount}</span>
            <span className="text-[10px] text-emerald-700 font-medium">Fulfilled by merchant staff</span>
          </div>

          <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs text-left">
            <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">Platform Courier Orders</span>
            <span className="text-2xl font-black text-sky-600 mt-1 block">{stats.platformDeliveryCount}</span>
            <span className="text-[10px] text-sky-700 font-medium">Assigned territory riders</span>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by Order #, Customer, Phone, Merchant, SKU..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none"
              >
                <option value="all">Status: All Statuses</option>
                <option value="pending">⏳ Placed / Pending</option>
                <option value="processing">⚙️ Confirmed / Processing</option>
                <option value="packed">📦 Packed / Ready</option>
                <option value="shipped">🛵 Out for Delivery</option>
                <option value="delivered">✅ Delivered</option>
                <option value="cancelled">❌ Cancelled / Returned</option>
              </select>

              <select
                value={deliveryTypeFilter}
                onChange={(e) => { setDeliveryTypeFilter(e.target.value); setCurrentPage(1); }}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none"
              >
                <option value="all">Delivery: All Fulfillment Modes</option>
                <option value="self_delivery">🛵 Store Partner Self-Delivery</option>
                <option value="platform">🚚 Platform Logistics Partner</option>
                <option value="pickup">🏪 In-Store Self Pickup</option>
                <option value="subscribed">🔁 Recurring Subscribed Order</option>
              </select>

              <select
                value={speedFilter}
                onChange={(e) => { setSpeedFilter(e.target.value); setCurrentPage(1); }}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none"
              >
                <option value="all">Speed: All Speeds</option>
                <option value="express">🚀 Express (15-30m / 24h)</option>
                <option value="same_day">⚡ Same Day Slot</option>
                <option value="standard">📦 Standard Local</option>
              </select>
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white border border-slate-200 rounded-3xl shadow-xs overflow-hidden text-left">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs divide-y divide-slate-100">
              <thead className="bg-slate-50/80 text-[10px] font-black uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="py-3.5 px-4">Order # &amp; Date</th>
                  <th className="py-3.5 px-4">Delivery Type &amp; Speed</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Store / Vendor</th>
                  <th className="py-3.5 px-4">Calculations (MRP / Tax / Total)</th>
                  <th className="py-3.5 px-4">Order Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 font-medium">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-400">
                      <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-amber-500" />
                      Loading platform orders...
                    </td>
                  </tr>
                ) : paginatedOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-400">
                      No orders found matching the active filters.
                    </td>
                  </tr>
                ) : (
                  paginatedOrders.map((o) => {
                    const orderId = o._id || o.id;
                    const orderNum = o.orderNumber || o.id || o._id;
                    const summary = o.orderSummary || {};
                    const totalMrp = Number(summary.mrp || summary.totalMrp || 0);
                    const subtotal = Number(summary.subtotal || o.subtotal || 0);
                    const grandTotal = Number(summary.grandTotal || summary.total || o.totalAmount || 0);
                    const shippingFee = Number(summary.shipping ?? summary.shippingFee ?? o.shippingCharge ?? 0);
                    const totalTax = Number(summary.tax ?? (Number(summary.cgst || 0) + Number(summary.sgst || 0)) ?? 0);

                    const isSelfDelivery = o.deliveryType === 'self_delivery' || o.isSelfDelivery || Boolean(o.sellerId?.deliveryMode === 'self_delivery');
                    const isPickup = o.fulfillment?.type === 'pickup' || o.deliveryType === 'pickup' || o.isSelfPickup;
                    const isSub = Boolean(o.isScheduledSubscription || o.isSubscription);

                    const status = o.orderStatus || o.deliveryStatus || 'Placed';
                    const isPaid = o.paymentStatus === 'Paid' || o.paymentDetails?.status === 'completed' || o.isPaid;

                    return (
                      <tr key={orderId} className="hover:bg-slate-50/70 transition-colors">
                        {/* Order # & Date */}
                        <td className="py-3.5 px-4">
                          <span className="font-mono font-black text-navy text-xs block">
                            #{orderNum}
                          </span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            {o.createdAt ? new Date(o.createdAt).toLocaleString('en-IN', {
                              timeZone: 'Asia/Kolkata',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            }) : 'Recent'}
                          </span>
                        </td>

                        {/* Delivery Type & Speed */}
                        <td className="py-3.5 px-4">
                          <div className="flex flex-col gap-1 items-start">
                            {isSub ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-purple-50 text-purple-800 border border-purple-200 inline-flex items-center gap-1">
                                🔁 Subscribed
                              </span>
                            ) : isPickup ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-50 text-amber-800 border border-amber-200 inline-flex items-center gap-1">
                                🏪 Store Pickup
                              </span>
                            ) : isSelfDelivery ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-50 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1">
                                🛵 Store Self-Delivery
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-sky-50 text-sky-800 border border-sky-200 inline-flex items-center gap-1">
                                🚚 Platform Courier
                              </span>
                            )}

                            <div className="flex items-center gap-1 text-[9px] text-slate-500 font-semibold">
                              <span>
                                {o.fulfillment?.deliveryMode === 'express' || o.deliveryMode === 'express'
                                  ? '🚀 Express'
                                  : o.fulfillment?.deliveryMode === 'same_day' || o.deliveryMode === 'same_day'
                                    ? '⚡ Same Day'
                                    : '📦 Standard'}
                              </span>
                              <span>•</span>
                              <span className={shippingFee === 0 ? 'text-emerald-700 font-bold' : 'text-slate-700 font-bold'}>
                                {shippingFee === 0 ? 'Free Del.' : `₹${shippingFee} Del.`}
                              </span>
                            </div>

                            {(o.deliverySlot || o.preOrderTimeSlot) && (
                              <span className="text-[9px] text-blue-700 font-mono">
                                🕒 {o.deliverySlot || o.preOrderTimeSlot}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Customer */}
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-slate-900 block truncate max-w-[140px]">
                            {o.shippingAddress?.name || o.customerId?.name || o.customerName || 'Customer'}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono block">
                            {o.shippingAddress?.phone || o.customerId?.phone || o.customerPhone || 'N/A'}
                          </span>
                          <span className="text-[10px] text-slate-400 block truncate max-w-[140px]">
                            {o.shippingAddress?.city || o.deliveryAddress || 'Local Area'}
                          </span>
                        </td>

                        {/* Store / Vendor */}
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-navy block truncate max-w-[140px]">
                            {o.sellerId?.businessName || o.sellerId?.shopName || o.sellerId?.name || 'Local Merchant'}
                          </span>
                          <span className="text-[10px] text-slate-500 block">
                            {isSelfDelivery ? '✓ Self-Delivering' : 'Platform Rider Pool'}
                          </span>
                        </td>

                        {/* Calculations */}
                        <td className="py-3.5 px-4">
                          <div className="font-black text-sm text-navy font-mono">
                            ₹{grandTotal.toFixed(2)}
                          </div>
                          <div className="text-[10px] text-slate-500 space-y-0.5 mt-0.5">
                            <div>Items: ₹{subtotal.toFixed(2)}</div>
                            {totalTax > 0 && <div className="text-amber-700 font-semibold">GST: ₹{totalTax.toFixed(2)}</div>}
                            <div className={isPaid ? 'text-emerald-600 font-bold' : 'text-amber-600 font-bold'}>
                              {isPaid ? '✓ Paid' : 'Payment Pending'} · {String(o.paymentMethod || o.paymentDetails?.method || 'COD').toUpperCase()}
                            </div>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4">
                          <select
                            value={status}
                            disabled={updatingStatusId === orderId}
                            onChange={(e) => handleUpdateStatus(orderId, e.target.value)}
                            className="bg-white border border-slate-200 rounded-xl px-2.5 py-1 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-400 shadow-2xs"
                          >
                            <option value="Placed">Placed</option>
                            <option value="Confirmed">Confirmed</option>
                            <option value="Packed">Packed</option>
                            <option value="Shipped">Shipped</option>
                            <option value="Delivered">Delivered</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => setSelectedOrder(o)}
                            className="px-3 py-1.5 bg-[#0A1128] hover:bg-navy text-[#F3BA12] font-black text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5 ml-auto shadow-xs"
                          >
                            <Eye size={12} />
                            <span>Audit &amp; Details</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="bg-slate-50 border-t border-slate-100 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 font-medium">
            <span>
              Showing {filteredOrders.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} to{' '}
              {Math.min(currentPage * itemsPerPage, filteredOrders.length)} of {filteredOrders.length} orders
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-white transition"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="font-bold text-slate-700">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-white transition"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* MODAL: COMPREHENSIVE ORDER AUDIT & FULL BREAKDOWN */}
        {selectedOrder && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-7 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 my-8 text-left max-h-[92vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-[#0A1128] text-[#F3BA12] flex items-center justify-center font-bold">
                    <Package size={20} />
                  </div>
                  <div>
                    <h3 className="font-black text-navy text-base sm:text-lg">
                      Order Audit #{selectedOrder.orderNumber || selectedOrder.id || selectedOrder._id}
                    </h3>
                    <p className="text-xs text-slate-400">
                      Placed on {new Date(selectedOrder.createdAt || Date.now()).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition"
                >
                  <X size={18} />
                </button>
              </div>

              {/* 🚚 DELIVERY & FULFILLMENT LOGISTICS OVERVIEW */}
              {(() => {
                const isPickup = selectedOrder.fulfillment?.type === 'pickup' || selectedOrder.deliveryType === 'pickup' || selectedOrder.isSelfPickup;
                const isSelfDelivery = selectedOrder.deliveryType === 'self_delivery' || selectedOrder.isSelfDelivery || Boolean(selectedOrder.sellerId?.deliveryMode === 'self_delivery');
                const isSub = Boolean(selectedOrder.isScheduledSubscription || selectedOrder.isSubscription);
                const shippingFee = Number(selectedOrder.orderSummary?.shipping ?? selectedOrder.shippingCharge ?? 0);

                return (
                  <div className="bg-gradient-to-br from-slate-900 to-[#0A1128] text-white p-5 rounded-2xl space-y-3.5 shadow-md">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-700/60 pb-3">
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl">
                          {isPickup ? '🏪' : isSelfDelivery ? '🛵' : isSub ? '🔁' : '🚚'}
                        </span>
                        <div>
                          <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider block">
                            Fulfillment Logistics &amp; Delivery Channel
                          </span>
                          <h4 className="font-extrabold text-sm text-white">
                            {isPickup
                              ? 'In-Store Customer Counter Pickup'
                              : isSelfDelivery
                                ? 'Store Partner Self-Delivery (Fulfilled by Store Fleet)'
                                : isSub
                                  ? 'Recurring Subscription Delivery Route'
                                  : 'ApexBee Platform Logistics Partner Delivery'}
                          </h4>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-white/10 text-white border border-white/20">
                          {selectedOrder.fulfillment?.deliveryMode === 'express' || selectedOrder.deliveryMode === 'express'
                            ? '🚀 Express'
                            : selectedOrder.fulfillment?.deliveryMode === 'same_day' || selectedOrder.deliveryMode === 'same_day'
                              ? '⚡ Same Day'
                              : '📦 Standard'}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${shippingFee === 0
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
                            : 'bg-amber-500/20 text-amber-300 border-amber-400/40'
                          }`}>
                          {shippingFee === 0 ? 'Delivery: FREE' : `Delivery Fee: ₹${shippingFee}`}
                        </span>

                        {selectedOrder.pickupVerification?.otp && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-slate-950 font-mono">
                            Pickup OTP: {selectedOrder.pickupVerification.otp}
                          </span>
                        )}
                        {selectedOrder.deliveryVerification?.otp && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-400 text-slate-950 font-mono">
                            Doorstep OTP: {selectedOrder.deliveryVerification.otp}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">
                          🚚 Dispatch Provider
                        </span>
                        <span className="font-extrabold text-white block">
                          {isSelfDelivery
                            ? 'Store Rider / Staff Fleet'
                            : isPickup
                              ? 'Customer Self-Pickup'
                              : 'ApexBee Rider Broadcast'}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {shippingFee > 0 && isSelfDelivery
                            ? '✓ Delivery fee credited to Store'
                            : shippingFee > 0
                              ? 'Platform courier charge'
                              : 'Free delivery applied'}
                        </span>
                      </div>

                      <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">
                          🕒 Scheduled Slot / Window
                        </span>
                        <span className="font-bold text-amber-300 block">
                          {selectedOrder.deliverySlot || selectedOrder.preOrderTimeSlot || (selectedOrder.fulfillment?.pickupSlot ? `${selectedOrder.fulfillment.pickupSlot.date} • ${selectedOrder.fulfillment.pickupSlot.time}` : 'Standard Delivery Window')}
                        </span>
                        {selectedOrder.slotExtended && (
                          <span className="text-[10px] text-amber-400 block font-semibold">
                            ⏳ Extended: {selectedOrder.slotExtendedUntil ? new Date(selectedOrder.slotExtendedUntil).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' }) : 'Extended'}
                          </span>
                        )}
                      </div>

                      <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">
                          👤 Delivery Agent / Phone
                        </span>
                        <span className="font-extrabold text-white block truncate">
                          {selectedOrder.assignedDeliveryAgent || selectedOrder.deliveryAgentName || (isSelfDelivery ? (selectedOrder.sellerId?.ownerName || 'Store Personnel') : 'Awaiting Assignment')}
                        </span>
                        <span className="text-[10px] text-emerald-400 font-mono">
                          {selectedOrder.deliveryAgentPhone || selectedOrder.assignedDeliveryAgentPhone || ''}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Customer and Merchant Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-1.5 text-left">
                  <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">Customer Details</span>
                  <div className="font-extrabold text-navy text-sm">
                    {selectedOrder.shippingAddress?.name || selectedOrder.customerId?.name || selectedOrder.customerName || 'Customer'}
                  </div>
                  <div className="text-slate-600 font-mono">
                    📞 {selectedOrder.shippingAddress?.phone || selectedOrder.customerId?.phone || selectedOrder.customerPhone || 'N/A'}
                  </div>
                  <div className="text-slate-600 leading-relaxed text-xs">
                    📍 {selectedOrder.shippingAddress?.address || selectedOrder.deliveryAddress || 'Delivery Address Registered'}
                  </div>
                  <div className="text-slate-500 text-[11px] font-medium">
                    {[selectedOrder.shippingAddress?.city, selectedOrder.shippingAddress?.state, selectedOrder.shippingAddress?.pincode].filter(Boolean).join(', ')}
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-1.5 text-left">
                  <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">Merchant / Store Details</span>
                  <div className="font-extrabold text-navy text-sm">
                    {selectedOrder.sellerId?.businessName || selectedOrder.sellerId?.shopName || selectedOrder.sellerId?.name || 'Local Store Partner'}
                  </div>
                  <div className="text-slate-600 font-mono">
                    📞 {selectedOrder.sellerId?.phone || selectedOrder.sellerId?.mobile || 'Store Phone'}
                  </div>
                  <div className="text-slate-600 text-xs">
                    Owner: {selectedOrder.sellerId?.ownerName || selectedOrder.sellerId?.name || 'Store Manager'}
                  </div>
                  <div className="text-slate-500 text-[11px]">
                    GSTIN: {selectedOrder.sellerId?.gstNumber || 'Unregistered / Composite'}
                  </div>
                </div>
              </div>

              {/* Itemized Order Content */}
              <div className="space-y-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">
                  Itemized Order Products ({selectedOrder.items?.length || selectedOrder.orderItems?.length || 0} items)
                </h4>
                <div className="border border-slate-200 rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-xs divide-y divide-slate-100">
                    <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500">
                      <tr>
                        <th className="py-2.5 px-3">Product</th>
                        <th className="py-2.5 px-3 text-right">Unit Price</th>
                        <th className="py-2.5 px-3 text-center">Qty</th>
                        <th className="py-2.5 px-3 text-right">Line Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {(selectedOrder.items || selectedOrder.orderItems || []).map((it: any, idx: number) => {
                        const title = it.productName || it.name || it.itemName || 'Product';
                        const qty = Number(it.quantity || 1);
                        const price = Number(it.price || it.sellingPrice || 0);
                        const orig = Number(it.originalPrice || it.mrp || price);

                        return (
                          <tr key={it._id || idx}>
                            <td className="py-2.5 px-3">
                              <span className="font-bold text-navy block text-xs">{title}</span>
                              {it.sku && <span className="text-[10px] text-slate-400 font-mono">SKU: {it.sku}</span>}
                            </td>
                            <td className="py-2.5 px-3 text-right text-slate-600">₹{price.toFixed(2)}</td>
                            <td className="py-2.5 px-3 text-center font-bold text-navy">{qty}</td>
                            <td className="py-2.5 px-3 text-right font-black text-navy font-mono">₹{(price * qty).toFixed(2)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 🧾 COMPLETE FINANCIAL BILL BREAKDOWN & CALCULATIONS */}
              {(() => {
                const summary = selectedOrder.orderSummary || {};
                const itemsList = selectedOrder.items || selectedOrder.orderItems || [];
                const calcMrp = itemsList.reduce((sum: number, it: any) => {
                  const orig = Number(it.originalPrice || it.mrp || it.price || 0);
                  return sum + (orig * Number(it.quantity || 1));
                }, 0);

                const subtotal = Number(summary.subtotal || selectedOrder.subtotal || 0);
                const totalMrp = Number(summary.mrp || summary.totalMrp || (calcMrp > subtotal ? calcMrp : subtotal));
                const mrpDiscount = Number(summary.discount || summary.mrpDiscount || Math.max(0, totalMrp - subtotal));

                const cgstVal = summary.cgst != null ? Number(summary.cgst) : (summary.tax != null ? Math.round((Number(summary.tax) / 2) * 100) / 100 : null);
                const sgstVal = summary.sgst != null ? Number(summary.sgst) : (summary.tax != null ? Math.round((Number(summary.tax) / 2) * 100) / 100 : null);
                const totalTax = (cgstVal != null && sgstVal != null)
                  ? Math.round((cgstVal + sgstVal) * 100) / 100
                  : Number(summary.tax || 0);

                // Derived GST percentage
                let cgstPct = '14';
                let sgstPct = '14';
                if (subtotal > 0 && cgstVal != null && cgstVal > 0) {
                  const calculated = Math.round((cgstVal / subtotal) * 100);
                  cgstPct = String(calculated);
                  sgstPct = String(calculated);
                }

                const shippingCharge = Number(summary.shipping ?? summary.shippingFee ?? selectedOrder.shippingCharge ?? 0);
                const packingCharge = Number(summary.packing ?? summary.packageCharge ?? selectedOrder.packingCharge ?? 0);
                const platformFee = Number(summary.platformFee ?? 0);
                const couponDiscount = Number(summary.couponDiscount || selectedOrder.couponDiscount || selectedOrder.discount || 0);
                const couponCode = selectedOrder.couponCode || summary.couponCode || selectedOrder.coupon?.code || '';
                const walletUsed = Number(summary.walletDeduction ?? 0);
                const rewardsUsed = Number(summary.rewardsDeduction ?? 0);
                const grandTotal = Number(summary.grandTotal || summary.total || selectedOrder.totalAmount || 0);

                // Commission & Vendor Net Settlement
                const commission = Number(selectedOrder.commissionAmount || selectedOrder.vendorCommissionAmount || 0);
                const isSelfDelivered = selectedOrder.deliveryType === 'self_delivery' || selectedOrder.isSelfDelivery || Boolean(selectedOrder.sellerId?.deliveryMode === 'self_delivery');
                const vendorDeliveryFee = isSelfDelivered ? shippingCharge : 0;
                const netVendorPayout = Math.max(0, grandTotal - commission);

                return (
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3.5 text-xs">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                      <h4 className="font-black text-navy text-xs uppercase tracking-wider flex items-center gap-1.5">
                        <span>🧾</span> Complete Bill Breakdown &amp; Tax Calculation
                      </h4>
                      <span className="font-extrabold text-[11px] text-slate-500">
                        {String(selectedOrder.paymentMethod || selectedOrder.paymentDetails?.method || 'COD').toUpperCase()} · {selectedOrder.paymentStatus === 'Paid' ? 'Paid ✅' : 'Pending'}
                      </span>
                    </div>

                    <div className="space-y-2 text-slate-700">
                      {totalMrp > subtotal && (
                        <div className="flex justify-between text-slate-400">
                          <span>Total Retail Items MRP</span>
                          <span className="line-through font-mono">₹{totalMrp.toFixed(2)}</span>
                        </div>
                      )}

                      {mrpDiscount > 0 && (
                        <div className="flex justify-between text-emerald-600 font-bold">
                          <span>Product Discount on MRP</span>
                          <span className="font-mono">-₹{mrpDiscount.toFixed(2)}</span>
                        </div>
                      )}

                      <div className="flex justify-between font-bold text-slate-900">
                        <span>Items Subtotal (Price After Discount)</span>
                        <span className="font-mono">₹{subtotal.toFixed(2)}</span>
                      </div>

                      {/* GST Split */}
                      {(cgstVal != null && cgstVal > 0) || (sgstVal != null && sgstVal > 0) ? (
                        <div className="bg-white rounded-xl p-2.5 border border-slate-200 space-y-1.5 my-1">
                          <div className="flex justify-between text-slate-600">
                            <span>🏛️ Central GST (CGST {cgstPct}%)</span>
                            <span className="font-mono font-bold text-amber-700">₹{cgstVal?.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-slate-600">
                            <span>🏢 State GST (SGST {sgstPct}%)</span>
                            <span className="font-mono font-bold text-amber-700">₹{sgstVal?.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-slate-500 text-[10px] pt-1 border-t border-slate-100">
                            <span>Total GST Tax Amount</span>
                            <span className="font-mono font-bold text-slate-800">₹{totalTax.toFixed(2)}</span>
                          </div>
                        </div>
                      ) : totalTax > 0 ? (
                        <div className="flex justify-between text-slate-600">
                          <span>Government Tax &amp; GST</span>
                          <span className="font-mono font-bold text-amber-700">₹{totalTax.toFixed(2)}</span>
                        </div>
                      ) : null}

                      <div className="flex justify-between text-slate-700">
                        <span>🚚 Delivery / Shipping Charge</span>
                        <span className={shippingFee === 0 ? 'text-emerald-600 font-bold font-mono' : 'font-mono font-bold text-slate-900'}>
                          {shippingFee === 0 ? 'FREE' : `₹${shippingFee.toFixed(2)}`}
                        </span>
                      </div>

                      {packingCharge > 0 && (
                        <div className="flex justify-between text-slate-600">
                          <span>📦 Packaging &amp; Handling Charge</span>
                          <span className="font-mono">₹{packingCharge.toFixed(2)}</span>
                        </div>
                      )}

                      {platformFee > 0 && (
                        <div className="flex justify-between text-slate-600">
                          <span>⚡ Platform &amp; Service Fee</span>
                          <span className="font-mono">₹{platformFee.toFixed(2)}</span>
                        </div>
                      )}

                      {couponDiscount > 0 && (
                        <div className="flex justify-between text-emerald-600 font-bold bg-emerald-50/70 p-2 rounded-xl border border-emerald-200">
                          <span>🎟️ Coupon Discount {couponCode ? `(${couponCode})` : ''}</span>
                          <span className="font-mono">-₹{couponDiscount.toFixed(2)}</span>
                        </div>
                      )}

                      {walletUsed > 0 && (
                        <div className="flex justify-between text-emerald-600 font-bold">
                          <span>ApexBee Wallet Credit Deducted</span>
                          <span className="font-mono">-₹{walletUsed.toFixed(2)}</span>
                        </div>
                      )}

                      {rewardsUsed > 0 && (
                        <div className="flex justify-between text-emerald-600 font-bold">
                          <span>Reward Points Deducted</span>
                          <span className="font-mono">-₹{rewardsUsed.toFixed(2)}</span>
                        </div>
                      )}

                      <div className="flex justify-between font-black text-base border-t border-slate-300 pt-2.5 text-navy">
                        <span>Grand Total (Customer Paid)</span>
                        <span className="font-mono text-navy">₹{grandTotal.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Revenue & Settlement Breakdown */}
                    <div className="mt-3 bg-white border border-slate-200 rounded-xl p-3.5 space-y-1.5 text-[11px] text-slate-600">
                      <div className="font-black text-slate-900 text-xs uppercase tracking-wider mb-1">
                        💰 Admin Settlement &amp; Revenue Allocation
                      </div>

                      <div className="flex justify-between">
                        <span>Total Customer Value</span>
                        <span className="font-mono font-bold text-slate-900">₹{grandTotal.toFixed(2)}</span>
                      </div>

                      {commission > 0 ? (
                        <div className="flex justify-between text-rose-600 font-medium">
                          <span>Platform Commission Collected</span>
                          <span className="font-mono font-bold">+₹{commission.toFixed(2)}</span>
                        </div>
                      ) : (
                        <div className="flex justify-between text-slate-400">
                          <span>Platform Commission</span>
                          <span className="font-mono text-emerald-600 font-bold">₹0.00 (Zero Commission Model)</span>
                        </div>
                      )}

                      {isSelfDelivered && vendorDeliveryFee > 0 && (
                        <div className="flex justify-between text-emerald-700">
                          <span>Store Delivery Share</span>
                          <span className="font-mono font-bold">+₹{vendorDeliveryFee.toFixed(2)}</span>
                        </div>
                      )}

                      <div className="flex justify-between items-center text-xs font-black text-navy border-t border-slate-100 pt-1.5 mt-1">
                        <span>Net Merchant Payout</span>
                        <span className="font-mono text-sm text-emerald-600">₹{netVendorPayout.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Modal Footer Actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.open(`${API_BASE}/orders/${selectedOrder._id || selectedOrder.id}/invoice`, '_blank')}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <Receipt size={14} /> Tax Invoice PDF
                  </button>
                  <button
                    onClick={() => window.open(`${API_BASE}/orders/${selectedOrder._id || selectedOrder.id}/packing-slip`, '_blank')}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <Printer size={14} /> Packing Slip PDF
                  </button>
                </div>

                <button
                  onClick={() => setSelectedOrder(null)}
                  className="px-5 py-2 bg-[#0A1128] text-white hover:bg-navy rounded-xl text-xs font-bold transition"
                >
                  Close Audit View
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default AdminOrders;

