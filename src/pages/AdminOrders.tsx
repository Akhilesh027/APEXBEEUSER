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
  RotateCcw,
  Repeat,
  Coins,
  Sparkles,
  Layers,
  Send,
  CheckCircle2,
  DollarSign,
  Droplets,
  ExternalLink
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

  // Active Hub Tab: Orders vs Subscriptions
  const [activeAdminTab, setActiveAdminTab] = useState<'orders' | 'subscriptions'>('orders');

  // Subscriptions State
  const [subscriptionsList, setSubscriptionsList] = useState<any[]>([]);
  const [loadingSubscriptions, setLoadingSubscriptions] = useState<boolean>(false);
  const [selectedSubAudit, setSelectedSubAudit] = useState<any | null>(null);

  // Commission Release State
  const [releasingCommissions, setReleasingCommissions] = useState<boolean>(false);
  const [distributingOrderId, setDistributingOrderId] = useState<string | null>(null);

  // Filters for Orders
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deliveryTypeFilter, setDeliveryTypeFilter] = useState<string>('all');
  const [speedFilter, setSpeedFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 12;

  // Filters for Subscriptions
  const [subSearchQuery, setSubSearchQuery] = useState<string>('');
  const [subStatusFilter, setSubStatusFilter] = useState<string>('all');
  const [subFrequencyFilter, setSubFrequencyFilter] = useState<string>('all');
  const [subPortalFilter, setSubPortalFilter] = useState<string>('all');
  const [subCurrentPage, setSubCurrentPage] = useState<number>(1);
  const subItemsPerPage = 10;

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
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      setLoadingSubscriptions(true);
      const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE}/admin/product-subscriptions`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      const data = await res.json();
      if (res.ok && data.success) {
        const localSubs = (data.subscriptions || []).map((s: any) => {
          const qty = Number(s.quantity || 1);
          const unitPrice = Number(s.unitPrice || s.productId?.price || 0);
          const daysInCycle = s.frequency === 'daily' ? 30 : s.frequency === 'alternate' ? 15 : s.frequency === 'weekly' ? 4 : 1;
          const cycleSubtotal = qty * unitPrice * daysInCycle;
          const estTax = Math.round(cycleSubtotal * 0.05 * 100) / 100;
          const estTotal = cycleSubtotal + estTax;

          return {
            ...s,
            isLocalSub: true,
            subscriptionId: s._id,
            displayId: `SUB-${s._id.toString().slice(-6).toUpperCase()}`,
            customerName: s.customerName || s.userId?.name || 'Subscribed Customer',
            customerPhone: s.customerPhone || s.userId?.phone || 'N/A',
            deliveryAddress: s.deliveryAddress || s.address || 'Doorstep Delivery Address',
            productName: s.productName || s.productId?.name || 'Recurring Product',
            productImage: s.productImage || s.productId?.thumbnail || (Array.isArray(s.productId?.images) ? s.productId.images[0] : '') || '',
            quantity: qty,
            unitPrice: unitPrice,
            frequency: s.frequency || 'daily',
            deliverySlot: s.deliverySlot || 'Morning (6:00 AM - 8:30 AM)',
            status: (s.status || 'active').toLowerCase(),
            autoRenew: s.autoRenew !== false,
            startDate: s.startDate || (s.createdAt ? new Date(s.createdAt).toISOString().split('T')[0] : 'Today'),
            currentPeriodEnd: s.currentPeriodEnd || '',
            storeName: s.vendorId?.businessName || s.vendorId?.shopName || s.vendorId?.name || 'Local Store Partner',
            storePhone: s.vendorId?.phone || '',
            fulfillmentMode: (s.deliveryAgentType === 'self_delivery' || !s.deliveryAgentType) ? 'Store Partner Self-Delivery Fleet' : 'Platform Logistics Courier',
            deliveryAgentName: s.deliveryAgentName || '',
            subtotal: cycleSubtotal,
            tax: estTax,
            shippingFee: 0,
            grandTotal: estTotal,
            commissionStatus: s.commissionReleased ? 'Released' : 'Pending',
            portalType: s.portalType || (s.productName?.toLowerCase().includes('water') ? 'water' : s.productName?.toLowerCase().includes('milk') ? 'dairy' : 'general'),
            deliveryHistory: s.deliveryHistory || [],
            createdAt: s.createdAt
          };
        });

        const subOrders = (data.orders || []).map((o: any) => {
          const summary = o.orderSummary || {};
          const firstItem = (o.items && o.items[0]) || {};
          const freq = o.scheduleDetails?.frequency || o.frequency || 'daily';
          const isSelf = o.deliveryType === 'self_delivery' || o.isSelfDelivery || Boolean(o.sellerId?.deliveryMode === 'self_delivery');
          const title = firstItem.productName || firstItem.name || 'Subscribed Order Item';

          return {
            ...o,
            isLocalSub: false,
            subscriptionId: o._id,
            displayId: o.orderNumber || `#AB-${o._id.toString().slice(-6).toUpperCase()}`,
            customerName: o.shippingAddress?.name || o.customerId?.name || o.customerName || 'Subscriber Customer',
            customerPhone: o.shippingAddress?.phone || o.customerId?.phone || o.customerPhone || 'N/A',
            deliveryAddress: [o.shippingAddress?.address || o.deliveryAddress, o.shippingAddress?.city, o.shippingAddress?.pincode].filter(Boolean).join(', ') || 'Doorstep Delivery',
            productName: title,
            productImage: firstItem.image || firstItem.productId?.thumbnail || (Array.isArray(firstItem.productId?.images) ? firstItem.productId.images[0] : '') || '',
            quantity: Number(firstItem.quantity || 1),
            unitPrice: Number(firstItem.price || firstItem.unitPrice || 0),
            frequency: freq,
            deliverySlot: o.deliverySlot || o.preOrderTimeSlot || o.scheduleDetails?.deliverySlot || 'Morning (6:00 AM - 8:30 AM)',
            status: (o.orderStatus || 'active').toLowerCase(),
            autoRenew: o.autoRenew !== false,
            startDate: o.createdAt ? new Date(o.createdAt).toISOString().split('T')[0] : 'Today',
            currentPeriodEnd: '',
            storeName: o.sellerId?.businessName || o.sellerId?.shopName || o.sellerId?.name || 'Local Merchant Partner',
            storePhone: o.sellerId?.phone || '',
            fulfillmentMode: isSelf ? 'Store Partner Self-Delivery Fleet' : 'Platform Logistics Courier',
            deliveryAgentName: o.assignedDeliveryAgent || o.deliveryAgentName || '',
            subtotal: Number(summary.subtotal || o.subtotal || 0),
            tax: Number(summary.tax || (Number(summary.cgst || 0) + Number(summary.sgst || 0)) || 0),
            shippingFee: Number(summary.shipping ?? summary.shippingFee ?? o.shippingCharge ?? 0),
            grandTotal: Number(summary.grandTotal || summary.total || o.totalAmount || 0),
            commissionStatus: (o.commissionReleaseStatus === 'Released' || o.isCommissionReleased) ? 'Released' : 'Pending',
            portalType: title.toLowerCase().includes('water') ? 'water' : title.toLowerCase().includes('milk') ? 'dairy' : 'general',
            deliveryHistory: o.deliveryHistory || [],
            createdAt: o.createdAt
          };
        });

        setSubscriptionsList([...localSubs, ...subOrders]);
      }
    } catch (err: any) {
      console.error('Failed to load subscriptions:', err);
    } finally {
      setLoadingSubscriptions(false);
    }
  };

  const handleReleaseAllCommissions = async () => {
    if (!window.confirm('Are you sure you want to release and distribute all eligible platform commissions, vendor payouts, and referral rewards to their respective wallets?')) {
      return;
    }
    try {
      setReleasingCommissions(true);
      setErrorMsg('');
      const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE}/admin/settlements/release`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to release commissions');
      }

      setSuccessMsg(data.message || 'All platform commissions and settlements distributed successfully! Partner wallets credited.');
      setTimeout(() => setSuccessMsg(''), 6000);
      await Promise.all([fetchOrders(), fetchSubscriptions()]);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error releasing commissions');
    } finally {
      setReleasingCommissions(false);
    }
  };

  const handleDistributeOrderCommission = async (orderId: string) => {
    try {
      setDistributingOrderId(orderId);
      setErrorMsg('');
      const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE}/admin/orders/${orderId}/distribute-commission`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to distribute commission for this order');
      }

      setSuccessMsg(data.message || 'Commission for order distributed and credited successfully.');
      setTimeout(() => setSuccessMsg(''), 5000);

      // Update local orders and selected order
      setOrders(prev => prev.map(o => (o._id === orderId || o.id === orderId) ? { ...o, isCommissionReleased: true, commissionReleaseStatus: 'Released' } : o));
      if (selectedOrder && (selectedOrder._id === orderId || selectedOrder.id === orderId)) {
        setSelectedOrder((prev: any) => ({ ...prev, isCommissionReleased: true, commissionReleaseStatus: 'Released' }));
      }
      setSubscriptionsList(prev => prev.map(s => (s._id === orderId || s.subscriptionId === orderId) ? { ...s, commissionStatus: 'Released', isCommissionReleased: true } : s));
    } catch (err: any) {
      alert(err.message || 'Error distributing commission');
    } finally {
      setDistributingOrderId(null);
    }
  };

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

  // Subscriptions Stats
  const subStats = useMemo(() => {
    let totalMRV = 0;
    let activeCount = 0;
    let dairyCount = 0;
    let waterCount = 0;

    subscriptionsList.forEach(s => {
      totalMRV += Number(s.grandTotal || 0);
      if (s.status === 'active') activeCount++;
      if (s.portalType === 'dairy' || s.productName?.toLowerCase().includes('milk') || s.productName?.toLowerCase().includes('dairy')) dairyCount++;
      if (s.portalType === 'water' || s.productName?.toLowerCase().includes('water')) waterCount++;
    });

    return {
      totalCount: subscriptionsList.length,
      activeCount,
      dairyCount,
      waterCount,
      totalMRV
    };
  }, [subscriptionsList]);

  // Filtered subscriptions computation
  const filteredSubscriptions = useMemo(() => {
    return subscriptionsList.filter(s => {
      if (subSearchQuery.trim()) {
        const q = subSearchQuery.toLowerCase();
        const dispId = (s.displayId || '').toLowerCase();
        const custName = (s.customerName || '').toLowerCase();
        const custPhone = (s.customerPhone || '').toLowerCase();
        const prod = (s.productName || '').toLowerCase();
        const store = (s.storeName || '').toLowerCase();
        const addr = (s.deliveryAddress || '').toLowerCase();
        if (!dispId.includes(q) && !custName.includes(q) && !custPhone.includes(q) && !prod.includes(q) && !store.includes(q) && !addr.includes(q)) {
          return false;
        }
      }

      if (subStatusFilter !== 'all') {
        const st = (s.status || '').toLowerCase();
        if (subStatusFilter === 'active' && st !== 'active') return false;
        if (subStatusFilter === 'paused' && st !== 'paused') return false;
        if (subStatusFilter === 'cancelled' && !['cancelled', 'expired'].includes(st)) return false;
      }

      if (subFrequencyFilter !== 'all') {
        const freq = (s.frequency || '').toLowerCase();
        if (freq !== subFrequencyFilter) return false;
      }

      if (subPortalFilter !== 'all') {
        if (subPortalFilter === 'dairy' && !(s.portalType === 'dairy' || s.productName?.toLowerCase().includes('milk') || s.productName?.toLowerCase().includes('dairy'))) return false;
        if (subPortalFilter === 'water' && !(s.portalType === 'water' || s.productName?.toLowerCase().includes('water'))) return false;
        if (subPortalFilter === 'general' && (s.portalType === 'dairy' || s.portalType === 'water')) return false;
      }

      return true;
    });
  }, [subscriptionsList, subSearchQuery, subStatusFilter, subFrequencyFilter, subPortalFilter]);

  const subTotalPages = Math.ceil(filteredSubscriptions.length / subItemsPerPage) || 1;
  const paginatedSubscriptions = useMemo(() => {
    const start = (subCurrentPage - 1) * subItemsPerPage;
    return filteredSubscriptions.slice(start, start + subItemsPerPage);
  }, [filteredSubscriptions, subCurrentPage, subItemsPerPage]);

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
                  <span>{activeAdminTab === 'orders' ? '📦' : '🔁'}</span>
                  <span>{activeAdminTab === 'orders' ? 'Admin Order Management & Logistics Hub' : 'Product Subscribe Hub & Recurring Delivery Management'}</span>
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  {activeAdminTab === 'orders'
                    ? 'Universal administrative order tracking, financial breakdown, tax calculations, and fulfillment monitoring.'
                    : 'Manage recurring subscription deliveries, daily schedules, customer doorstep orders, vendor fulfillment, and commission releases.'}
                </p>
              </div>
            </div>

            {/* Quick Admin Navigation Tabs */}
            <div className="flex items-center gap-2 mt-4 flex-wrap">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">Admin Switcher:</span>
              <button
                onClick={() => setActiveAdminTab('orders')}
                className={`px-3.5 py-1.5 font-black text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5 ${activeAdminTab === 'orders' ? 'bg-[#0A1128] text-[#F3BA12]' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
              >
                <span>📦</span> Orders Hub
              </button>
              <button
                onClick={() => setActiveAdminTab('subscriptions')}
                className={`px-3.5 py-1.5 font-black text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5 ${activeAdminTab === 'subscriptions' ? 'bg-[#0A1128] text-[#F3BA12]' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
              >
                <Repeat size={13} />
                <span>🔁 Product Subscribe Hub</span>
                {subscriptionsList.length > 0 && (
                  <span className="px-1.5 py-0.2 bg-amber-400 text-slate-950 rounded-full text-[10px] font-black">
                    {subscriptionsList.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => navigate('/admin/transactions')}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                💳 Transactions
              </button>
              <button
                onClick={() => navigate('/admin/reviews')}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                ⭐ Review Moderation
              </button>
              <button
                onClick={() => navigate('/admin/personalization')}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                🎯 Store Personalization
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleReleaseAllCommissions}
              disabled={releasingCommissions}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 text-xs font-black rounded-xl shadow-md transition cursor-pointer disabled:opacity-50"
              title="Release and distribute all eligible platform commissions and referral rewards"
            >
              <Coins size={15} className={releasingCommissions ? 'animate-spin' : ''} />
              <span>{releasingCommissions ? 'Distributing Commissions...' : '⚡ Distribute All Commissions'}</span>
            </button>
            <button
              onClick={() => { fetchOrders(); fetchSubscriptions(); }}
              disabled={loading || loadingSubscriptions}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition cursor-pointer"
            >
              <RefreshCw size={14} className={(loading || loadingSubscriptions) ? 'animate-spin' : ''} />
              <span>Refresh</span>
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

        {activeAdminTab === 'orders' ? (
          <>
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
                      <th className="py-3.5 px-4">Commission</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 font-medium">
                    {loading ? (
                      <tr>
                        <td colSpan={8} className="text-center py-12 text-slate-400">
                          <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-amber-500" />
                          Loading platform orders...
                        </td>
                      </tr>
                    ) : paginatedOrders.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-12 text-slate-400">
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

                            {/* Commission */}
                            <td className="py-3.5 px-4">
                              <div className="flex flex-col gap-1 items-start">
                                {o.isCommissionReleased || o.commissionReleaseStatus === 'Released' ? (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-50 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1">
                                    <CheckCircle2 size={10} className="text-emerald-600" /> Released
                                  </span>
                                ) : (
                                  <>
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-50 text-amber-800 border border-amber-200 inline-flex items-center gap-1">
                                      <Clock size={10} className="text-amber-600" /> Pending
                                    </span>
                                    <button
                                      onClick={() => handleDistributeOrderCommission(orderId)}
                                      disabled={distributingOrderId === orderId}
                                      className="px-2 py-0.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-[10px] rounded-lg transition flex items-center gap-1 shadow-2xs cursor-pointer disabled:opacity-50"
                                      title="Distribute and credit vendor & partner commission"
                                    >
                                      <Coins size={10} className={distributingOrderId === orderId ? 'animate-spin' : ''} />
                                      <span>{distributingOrderId === orderId ? 'Releasing...' : 'Distribute'}</span>
                                    </button>
                                  </>
                                )}
                              </div>
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
          </>
        ) : (
          <>
            {/* Subscriptions Overview Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
              <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs text-left">
                <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">Total Subscriptions</span>
                <span className="text-2xl font-black text-slate-900 mt-1 block">{subStats.totalCount}</span>
                <span className="text-[10px] text-slate-500 font-medium">All recurring routines</span>
              </div>

              <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs text-left">
                <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">Active Deliveries</span>
                <span className="text-2xl font-black text-emerald-600 mt-1 block">{subStats.activeCount}</span>
                <span className="text-[10px] text-emerald-700 font-semibold">Live recurring cycles</span>
              </div>

              <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs text-left">
                <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">Milk &amp; Dairy Routines</span>
                <span className="text-2xl font-black text-blue-600 mt-1 block">{subStats.dairyCount}</span>
                <span className="text-[10px] text-blue-700 font-medium">Daily doorstep bottles/packs</span>
              </div>

              <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs text-left">
                <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">Water Can Routes</span>
                <span className="text-2xl font-black text-cyan-600 mt-1 block">{subStats.waterCount}</span>
                <span className="text-[10px] text-cyan-700 font-medium">20L daily &amp; weekly cans</span>
              </div>

              <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs text-left">
                <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">Monthly Recurring Value</span>
                <span className="text-2xl font-black text-amber-600 mt-1 block">₹{subStats.totalMRV.toLocaleString('en-IN')}</span>
                <span className="text-[10px] text-slate-500 font-medium">Total gross cycle value</span>
              </div>
            </div>

            {/* Subscription Filter & Search Bar */}
            <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-xs space-y-4">
              <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
                <div className="relative w-full md:w-96">
                  <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by Subscriber, Phone, Address, Product, Store..."
                    value={subSearchQuery}
                    onChange={(e) => { setSubSearchQuery(e.target.value); setSubCurrentPage(1); }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                  <select
                    value={subStatusFilter}
                    onChange={(e) => { setSubStatusFilter(e.target.value); setSubCurrentPage(1); }}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none"
                  >
                    <option value="all">Status: All Statuses</option>
                    <option value="active">🟢 Active</option>
                    <option value="paused">⏸️ Paused</option>
                    <option value="cancelled">❌ Cancelled / Expired</option>
                  </select>

                  <select
                    value={subFrequencyFilter}
                    onChange={(e) => { setSubFrequencyFilter(e.target.value); setSubCurrentPage(1); }}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none"
                  >
                    <option value="all">Frequency: All Frequencies</option>
                    <option value="daily">☀️ Daily</option>
                    <option value="alternate">🔄 Alternate Days</option>
                    <option value="weekly">📅 Weekly</option>
                    <option value="monthly">🗓️ Monthly</option>
                  </select>

                  <select
                    value={subPortalFilter}
                    onChange={(e) => { setSubPortalFilter(e.target.value); setSubCurrentPage(1); }}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none"
                  >
                    <option value="all">Category: All Categories</option>
                    <option value="dairy">🥛 Milk &amp; Dairy Essentials</option>
                    <option value="water">💧 20L Water Cans</option>
                    <option value="general">📦 General Recurring Packs</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Subscriptions Table */}
            <div className="bg-white border border-slate-200 rounded-3xl shadow-xs overflow-hidden text-left">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs divide-y divide-slate-100">
                  <thead className="bg-slate-50/80 text-[10px] font-black uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="py-3.5 px-4">Subscription &amp; Schedule</th>
                      <th className="py-3.5 px-4">Subscriber Details</th>
                      <th className="py-3.5 px-4">Subscribed Product</th>
                      <th className="py-3.5 px-4">Fulfillment Mode &amp; Merchant</th>
                      <th className="py-3.5 px-4">Calculations (Subtotal / GST / Total)</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4">Commission</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 font-medium">
                    {loadingSubscriptions ? (
                      <tr>
                        <td colSpan={8} className="text-center py-12 text-slate-400">
                          <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-amber-500" />
                          Loading recurring product subscriptions...
                        </td>
                      </tr>
                    ) : paginatedSubscriptions.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-12 text-slate-400">
                          No subscriptions found matching the selected filters.
                        </td>
                      </tr>
                    ) : (
                      paginatedSubscriptions.map((s) => {
                        const subId = s.subscriptionId || s._id;
                        const isReleased = s.commissionStatus === 'Released' || s.isCommissionReleased;

                        return (
                          <tr key={subId} className="hover:bg-slate-50/70 transition-colors">
                            {/* Subscription & Schedule */}
                            <td className="py-3.5 px-4">
                              <span className="font-mono font-black text-navy text-xs block">
                                {s.displayId}
                              </span>
                              <span className="text-[10px] text-slate-400 block mt-0.5">
                                Started: {s.startDate}
                              </span>
                              <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-purple-50 text-purple-800 border border-purple-200">
                                  {s.frequency === 'daily' ? '☀️ Daily' : s.frequency === 'alternate' ? '🔄 Alternate' : s.frequency === 'weekly' ? '📅 Weekly' : '🗓️ Monthly'}
                                </span>
                                {s.autoRenew && (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    Auto-Renew
                                  </span>
                                )}
                              </div>
                              <span className="text-[9px] text-blue-700 font-mono block mt-1">
                                🕒 {s.deliverySlot}
                              </span>
                            </td>

                            {/* Subscriber Details */}
                            <td className="py-3.5 px-4">
                              <span className="font-bold text-slate-900 block truncate max-w-[150px]">
                                {s.customerName}
                              </span>
                              <span className="text-[10px] text-slate-500 font-mono block flex items-center gap-1 mt-0.5">
                                <Phone size={10} className="text-slate-400" /> {s.customerPhone}
                              </span>
                              <span className="text-[10px] text-slate-400 block truncate max-w-[160px] mt-0.5 flex items-start gap-1">
                                <MapPin size={10} className="text-slate-400 shrink-0 mt-0.5" />
                                <span className="truncate">{s.deliveryAddress}</span>
                              </span>
                            </td>

                            {/* Subscribed Product */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-2.5">
                                {s.productImage ? (
                                  <img
                                    src={s.productImage}
                                    alt={s.productName}
                                    className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0 bg-slate-50"
                                    onError={(e) => { (e.target as any).style.display = 'none'; }}
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 text-slate-400">
                                    <Package size={16} />
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <span className="font-bold text-navy block text-xs truncate max-w-[140px]">
                                    {s.productName}
                                  </span>
                                  <span className="text-[10px] text-slate-500 font-medium block">
                                    Qty: <strong className="text-slate-900">{s.quantity}</strong> · ₹{Number(s.unitPrice).toFixed(2)}/unit
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* Fulfillment Mode & Merchant */}
                            <td className="py-3.5 px-4">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase border inline-flex items-center gap-1 ${s.fulfillmentMode.includes('Self-Delivery')
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : 'bg-sky-50 text-sky-800 border-sky-200'
                                }`}>
                                {s.fulfillmentMode.includes('Self-Delivery') ? '🛵 Store Fleet' : '🚚 Platform Rider'}
                              </span>
                              <span className="font-bold text-navy text-xs block truncate max-w-[140px] mt-1">
                                {s.storeName}
                              </span>
                              {s.storePhone && (
                                <span className="text-[10px] text-slate-400 font-mono block">
                                  📞 {s.storePhone}
                                </span>
                              )}
                            </td>

                            {/* Calculations */}
                            <td className="py-3.5 px-4">
                              <div className="font-black text-sm text-navy font-mono">
                                ₹{Number(s.grandTotal).toFixed(2)}
                              </div>
                              <div className="text-[10px] text-slate-500 space-y-0.5 mt-0.5">
                                <div>Items: ₹{Number(s.subtotal).toFixed(2)}</div>
                                {Number(s.tax) > 0 && <div className="text-amber-700 font-semibold">GST: ₹{Number(s.tax).toFixed(2)}</div>}
                                <div className="text-emerald-700 font-bold">
                                  {Number(s.shippingFee) === 0 ? 'Free Delivery' : `₹${Number(s.shippingFee)} Del.`}
                                </div>
                              </div>
                            </td>

                            {/* Status */}
                            <td className="py-3.5 px-4">
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase inline-block ${s.status === 'active'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : s.status === 'paused'
                                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                  : 'bg-rose-100 text-rose-800 border border-rose-300'
                                }`}>
                                {s.status === 'active' ? '🟢 Active' : s.status === 'paused' ? '⏸️ Paused' : '❌ Cancelled'}
                              </span>
                            </td>

                            {/* Commission Settlement */}
                            <td className="py-3.5 px-4">
                              <div className="flex flex-col gap-1 items-start">
                                {isReleased ? (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-50 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1">
                                    <CheckCircle2 size={10} className="text-emerald-600" /> Released
                                  </span>
                                ) : (
                                  <>
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-50 text-amber-800 border border-amber-200 inline-flex items-center gap-1">
                                      <Clock size={10} className="text-amber-600" /> Pending
                                    </span>
                                    <button
                                      onClick={() => handleDistributeOrderCommission(subId)}
                                      disabled={distributingOrderId === subId}
                                      className="px-2 py-0.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-[10px] rounded-lg transition flex items-center gap-1 shadow-2xs cursor-pointer disabled:opacity-50"
                                      title="Release and distribute commission for this subscription"
                                    >
                                      <Coins size={10} className={distributingOrderId === subId ? 'animate-spin' : ''} />
                                      <span>{distributingOrderId === subId ? 'Releasing...' : 'Distribute'}</span>
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>

                            {/* Actions */}
                            <td className="py-3.5 px-4 text-right">
                              <button
                                onClick={() => setSelectedSubAudit(s)}
                                className="px-3 py-1.5 bg-[#0A1128] hover:bg-navy text-[#F3BA12] font-black text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5 ml-auto shadow-xs"
                              >
                                <Eye size={12} />
                                <span>Audit &amp; History</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Subscriptions Pagination */}
              <div className="bg-slate-50 border-t border-slate-100 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 font-medium">
                <span>
                  Showing {filteredSubscriptions.length === 0 ? 0 : (subCurrentPage - 1) * subItemsPerPage + 1} to{' '}
                  {Math.min(subCurrentPage * subItemsPerPage, filteredSubscriptions.length)} of {filteredSubscriptions.length} subscriptions
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSubCurrentPage(p => Math.max(1, p - 1))}
                    disabled={subCurrentPage === 1}
                    className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-white transition cursor-pointer"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="font-bold text-slate-700">
                    Page {subCurrentPage} of {subTotalPages}
                  </span>
                  <button
                    onClick={() => setSubCurrentPage(p => Math.min(subTotalPages, p + 1))}
                    disabled={subCurrentPage === subTotalPages}
                    className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-white transition cursor-pointer"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* MODAL: SUBSCRIPTION AUDIT & DELIVERY HISTORY */}
        {selectedSubAudit && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-7 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 my-8 text-left max-h-[92vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-[#0A1128] text-[#F3BA12] flex items-center justify-center font-bold">
                    <Repeat size={20} />
                  </div>
                  <div>
                    <h3 className="font-black text-navy text-base sm:text-lg">
                      Subscription Audit #{selectedSubAudit.displayId}
                    </h3>
                    <p className="text-xs text-slate-400">
                      Active since {selectedSubAudit.startDate} · {selectedSubAudit.frequency.toUpperCase()} Routine
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedSubAudit(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Logistics & Route Card */}
              <div className="bg-gradient-to-br from-slate-900 to-[#0A1128] text-white p-5 rounded-2xl space-y-3.5 shadow-md">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-700/60 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">
                      {selectedSubAudit.portalType === 'water' ? '💧' : selectedSubAudit.portalType === 'dairy' ? '🥛' : '🔁'}
                    </span>
                    <div>
                      <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider block">
                        Recurring Fulfillment Channel
                      </span>
                      <h4 className="font-extrabold text-sm text-white">
                        {selectedSubAudit.fulfillmentMode}
                      </h4>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-white/10 text-white border border-white/20">
                      {selectedSubAudit.frequency}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
                      {selectedSubAudit.status}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">
                      🕒 Scheduled Window
                    </span>
                    <span className="font-bold text-amber-300 block">
                      {selectedSubAudit.deliverySlot}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {selectedSubAudit.autoRenew ? '✓ Auto-Renew Enabled' : 'Manual Renew'}
                    </span>
                  </div>

                  <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">
                      🏪 Store Partner
                    </span>
                    <span className="font-extrabold text-white block truncate">
                      {selectedSubAudit.storeName}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {selectedSubAudit.storePhone}
                    </span>
                  </div>

                  <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">
                      🛵 Assigned Driver / Fleet
                    </span>
                    <span className="font-extrabold text-white block truncate">
                      {selectedSubAudit.deliveryAgentName || 'Merchant Store Fleet'}
                    </span>
                    <span className="text-[10px] text-emerald-400">
                      Doorstep Assigned
                    </span>
                  </div>
                </div>
              </div>

              {/* Customer and Merchant Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-1.5 text-left">
                  <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">Subscriber Customer Details</span>
                  <div className="font-extrabold text-navy text-sm">
                    {selectedSubAudit.customerName}
                  </div>
                  <div className="text-slate-600 font-mono">
                    📞 {selectedSubAudit.customerPhone}
                  </div>
                  <div className="text-slate-600 leading-relaxed text-xs">
                    📍 {selectedSubAudit.deliveryAddress}
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-1.5 text-left">
                  <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">Subscribed Product Details</span>
                  <div className="flex items-center gap-3 pt-1">
                    {selectedSubAudit.productImage ? (
                      <img
                        src={selectedSubAudit.productImage}
                        alt={selectedSubAudit.productName}
                        className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-slate-200 flex items-center justify-center shrink-0">
                        <Package size={20} className="text-slate-500" />
                      </div>
                    )}
                    <div>
                      <div className="font-extrabold text-navy text-sm">
                        {selectedSubAudit.productName}
                      </div>
                      <div className="text-slate-600 text-xs">
                        Quantity: <strong>{selectedSubAudit.quantity}</strong> pack(s)
                      </div>
                      <div className="text-amber-700 font-bold font-mono text-xs">
                        ₹{Number(selectedSubAudit.unitPrice).toFixed(2)} per unit
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Financial Calculation & Commission Allocation */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3 text-xs">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                  <h4 className="font-black text-navy text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <span>🧾</span> Bill Breakdown &amp; Commission Allocation
                  </h4>
                  <span className="font-extrabold text-[11px] text-slate-500">
                    Cycle Value
                  </span>
                </div>

                <div className="space-y-1.5 text-slate-700">
                  <div className="flex justify-between font-bold text-slate-900">
                    <span>Items Subtotal</span>
                    <span className="font-mono">₹{Number(selectedSubAudit.subtotal).toFixed(2)}</span>
                  </div>

                  {Number(selectedSubAudit.tax) > 0 && (
                    <div className="flex justify-between text-amber-700 font-semibold">
                      <span>GST Tax (5%)</span>
                      <span className="font-mono">₹{Number(selectedSubAudit.tax).toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>Doorstep Delivery Fee</span>
                    <span className="font-mono">{Number(selectedSubAudit.shippingFee) === 0 ? 'FREE' : `₹${Number(selectedSubAudit.shippingFee).toFixed(2)}`}</span>
                  </div>

                  <div className="flex justify-between font-black text-base border-t border-slate-300 pt-2 text-navy">
                    <span>Total Cycle Amount</span>
                    <span className="font-mono text-navy">₹{Number(selectedSubAudit.grandTotal).toFixed(2)}</span>
                  </div>
                </div>

                <div className="mt-3 bg-white border border-slate-200 rounded-xl p-3.5 space-y-2 text-[11px] text-slate-600">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-slate-900 text-xs uppercase tracking-wider">
                      💰 Commission Settlement Status
                    </span>
                    {selectedSubAudit.commissionStatus === 'Released' || selectedSubAudit.isCommissionReleased ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                        <CheckCircle2 size={12} className="text-emerald-600" /> Released to Wallets
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                        <Clock size={12} className="text-amber-600" /> Pending Release
                      </span>
                    )}
                  </div>

                  {!(selectedSubAudit.commissionStatus === 'Released' || selectedSubAudit.isCommissionReleased) && (
                    <div className="pt-2 border-t border-slate-100 flex justify-end">
                      <button
                        onClick={() => handleDistributeOrderCommission(selectedSubAudit.subscriptionId || selectedSubAudit._id)}
                        disabled={distributingOrderId === (selectedSubAudit.subscriptionId || selectedSubAudit._id)}
                        className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                      >
                        <Coins size={14} className={distributingOrderId === (selectedSubAudit.subscriptionId || selectedSubAudit._id) ? 'animate-spin' : ''} />
                        <span>{distributingOrderId === (selectedSubAudit.subscriptionId || selectedSubAudit._id) ? 'Distributing...' : '💸 Distribute Commission Now'}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Delivery History Log */}
              <div className="space-y-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">
                  Recurring Delivery History &amp; Dispatch Proofs ({selectedSubAudit.deliveryHistory?.length || 0} runs)
                </h4>
                <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-48 overflow-y-auto">
                  {selectedSubAudit.deliveryHistory && selectedSubAudit.deliveryHistory.length > 0 ? (
                    <table className="w-full text-left text-xs divide-y divide-slate-100">
                      <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 sticky top-0">
                        <tr>
                          <th className="py-2.5 px-3">Date</th>
                          <th className="py-2.5 px-3">Status</th>
                          <th className="py-2.5 px-3">Notes / Proof</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {selectedSubAudit.deliveryHistory.map((h: any, idx: number) => (
                          <tr key={idx}>
                            <td className="py-2.5 px-3 font-mono text-slate-800">{h.date}</td>
                            <td className="py-2.5 px-3">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${h.status === 'delivered' ? 'bg-emerald-100 text-emerald-800' : h.status === 'skipped' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                                }`}>
                                {h.status}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-slate-500">{h.notes || 'Routine doorstep dropoff'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="p-4 text-center text-xs text-slate-400">
                      No delivery runs logged yet. Delivery cycles begin from {selectedSubAudit.startDate}.
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end pt-3 border-t border-slate-100">
                <button
                  onClick={() => setSelectedSubAudit(null)}
                  className="px-5 py-2 bg-[#0A1128] text-white hover:bg-navy rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Close Audit View
                </button>
              </div>
            </div>
          </div>
        )}

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

                      <div className="mt-3 pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold text-slate-500">Commission Settlement:</span>
                          {selectedOrder.isCommissionReleased || selectedOrder.commissionReleaseStatus === 'Released' ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                              <CheckCircle2 size={12} className="text-emerald-600" /> Released to Wallets
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                              <Clock size={12} className="text-amber-600" /> Pending Release
                            </span>
                          )}
                        </div>

                        {!(selectedOrder.isCommissionReleased || selectedOrder.commissionReleaseStatus === 'Released') && (
                          <button
                            onClick={() => handleDistributeOrderCommission(selectedOrder._id || selectedOrder.id)}
                            disabled={distributingOrderId === (selectedOrder._id || selectedOrder.id)}
                            className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                          >
                            <Coins size={14} className={distributingOrderId === (selectedOrder._id || selectedOrder.id) ? 'animate-spin' : ''} />
                            <span>{distributingOrderId === (selectedOrder._id || selectedOrder.id) ? 'Distributing...' : '💸 Distribute Commission Now'}</span>
                          </button>
                        )}
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
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Receipt size={14} /> Tax Invoice PDF
                  </button>
                  <button
                    onClick={() => window.open(`${API_BASE}/orders/${selectedOrder._id || selectedOrder.id}/packing-slip`, '_blank')}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Printer size={14} /> Packing Slip PDF
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {!(selectedOrder.isCommissionReleased || selectedOrder.commissionReleaseStatus === 'Released') && (
                    <button
                      onClick={() => handleDistributeOrderCommission(selectedOrder._id || selectedOrder.id)}
                      disabled={distributingOrderId === (selectedOrder._id || selectedOrder.id)}
                      className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                    >
                      <Coins size={14} className={distributingOrderId === (selectedOrder._id || selectedOrder.id) ? 'animate-spin' : ''} />
                      <span>Distribute Commission</span>
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="px-5 py-2 bg-[#0A1128] text-white hover:bg-navy rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Close Audit View
                  </button>
                </div>
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

