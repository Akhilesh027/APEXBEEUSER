import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Search,
  Filter,
  Edit2,
  Trash2,
  Download,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  Wallet,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  X,
  ArrowLeft,
  ShieldCheck
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export interface TransactionItem {
  id: string;
  _id?: string;
  transactionId: string;
  walletId?: string;
  userId?: string;
  userName: string;
  userEmail?: string;
  userPhone?: string;
  userRole?: string;
  type: 'credit' | 'debit';
  direction?: 'credit' | 'debit';
  amount: number;
  category: string;
  source?: string;
  status: 'completed' | 'pending' | 'hold' | 'failed' | 'reversed';
  remarks?: string;
  description?: string;
  orderId?: string;
  referenceType?: string;
  createdAt: string;
}

const API_BASE = import.meta.env.VITE_API_URL || 'https://server.apexbee.in/api';

const AdminTransactions: React.FC = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'credit' | 'debit'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 15;

  // Edit Modal State
  const [editModalOpen, setEditModalOpen] = useState<boolean>(false);
  const [editingTx, setEditingTx] = useState<TransactionItem | null>(null);
  const [editForm, setEditForm] = useState({
    amount: 0,
    type: 'credit' as 'credit' | 'debit',
    category: 'General',
    status: 'completed' as TransactionItem['status'],
    remarks: '',
    orderId: ''
  });
  const [savingEdit, setSavingEdit] = useState<boolean>(false);

  // Delete Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState<boolean>(false);
  const [deletingTx, setDeletingTx] = useState<TransactionItem | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);

  // User auth validation
  const currentUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}');
    } catch {
      return {};
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE}/admin/transactions?limit=1500`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      if (data.success && Array.isArray(data.transactions)) {
        setTransactions(data.transactions);
      } else {
        // Fallback: ingest directly from wallets endpoint if transactions endpoint is empty
        const fallbackRes = await fetch(`${API_BASE}/admin/wallets`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        if (fallbackRes.ok) {
          const fbData = await fallbackRes.json();
          const list: TransactionItem[] = [];
          (fbData.wallets || []).forEach((w: any) => {
            const u = w.userId;
            const uName = u?.name || w.ownerName || 'Member';
            const uEmail = u?.email || '';
            const uRole = Array.isArray(u?.roles) ? u.roles.join(', ') : (u?.role || w.type || 'user');
            (w.ledgerEntries || []).forEach((e: any, idx: number) => {
              list.push({
                id: e._id || `tx-${w._id}-${idx}`,
                _id: e._id,
                transactionId: e.transactionId || `TXN-${String(e._id || idx).slice(-8)}`,
                walletId: w._id,
                userId: u?._id || w.userId,
                userName: uName,
                userEmail: uEmail,
                userRole: uRole,
                type: e.type?.toLowerCase() === 'debit' ? 'debit' : 'credit',
                direction: e.type?.toLowerCase() === 'debit' ? 'debit' : 'credit',
                amount: Math.abs(Number(e.amount || 0)),
                category: e.category || e.source || 'General',
                status: (e.status || 'completed').toLowerCase(),
                remarks: e.remarks || e.description || '',
                description: e.description || e.remarks || '',
                orderId: e.referenceId || '',
                createdAt: e.createdAt || e.date || new Date().toISOString()
              });
            });
          });
          list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setTransactions(list);
        }
      }
    } catch (err: any) {
      console.error('Failed to load transactions:', err);
      setErrorMsg(err.message || 'Failed to load transaction ledger');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const openEditModal = (tx: TransactionItem) => {
    setEditingTx(tx);
    setEditForm({
      amount: tx.amount,
      type: tx.type,
      category: tx.category,
      status: tx.status,
      remarks: tx.remarks || tx.description || '',
      orderId: tx.orderId || ''
    });
    setEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingTx) return;
    try {
      setSavingEdit(true);
      setErrorMsg('');
      const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
      const targetId = editingTx._id || editingTx.id;

      const res = await fetch(`${API_BASE}/admin/transactions/${targetId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(editForm)
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to update transaction');
      }

      setTransactions(prev =>
        prev.map(t =>
          (t._id === targetId || t.id === targetId)
            ? {
              ...t,
              amount: Number(editForm.amount),
              type: editForm.type,
              direction: editForm.type,
              category: editForm.category,
              status: editForm.status,
              remarks: editForm.remarks,
              description: editForm.remarks,
              orderId: editForm.orderId
            }
            : t
        )
      );

      setSuccessMsg(`Transaction ${editingTx.transactionId} updated successfully.`);
      setTimeout(() => setSuccessMsg(''), 4000);
      setEditModalOpen(false);
      setEditingTx(null);
    } catch (err: any) {
      alert(err.message || 'Error updating transaction');
    } finally {
      setSavingEdit(false);
    }
  };

  const openDeleteModal = (tx: TransactionItem) => {
    setDeletingTx(tx);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingTx) return;
    try {
      setDeleting(true);
      setErrorMsg('');
      const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
      const targetId = deletingTx._id || deletingTx.id;

      const res = await fetch(`${API_BASE}/admin/transactions/${targetId}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to delete transaction');
      }

      setTransactions(prev => prev.filter(t => t._id !== targetId && t.id !== targetId));

      setSuccessMsg(`Transaction ${deletingTx.transactionId} deleted permanently.`);
      setTimeout(() => setSuccessMsg(''), 4000);
      setDeleteModalOpen(false);
      setDeletingTx(null);
    } catch (err: any) {
      alert(err.message || 'Error deleting transaction');
    } finally {
      setDeleting(false);
    }
  };

  const exportToCSV = () => {
    if (filteredTransactions.length === 0) return;
    const headers = ['Transaction ID', 'Order ID', 'Date', 'User Name', 'User Email', 'Role', 'Direction', 'Amount (INR)', 'Category', 'Status', 'Remarks'];
    const rows = filteredTransactions.map(t => [
      `"${t.transactionId}"`,
      `"${t.orderId || ''}"`,
      `"${new Date(t.createdAt).toLocaleString('en-IN')}"`,
      `"${t.userName}"`,
      `"${t.userEmail || ''}"`,
      `"${t.userRole || ''}"`,
      `"${t.type.toUpperCase()}"`,
      t.amount,
      `"${t.category}"`,
      `"${t.status.toUpperCase()}"`,
      `"${(t.remarks || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `apexbee_transactions_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesId = t.transactionId.toLowerCase().includes(q);
        const matchesOrder = (t.orderId || '').toLowerCase().includes(q);
        const matchesName = (t.userName || '').toLowerCase().includes(q);
        const matchesEmail = (t.userEmail || '').toLowerCase().includes(q);
        const matchesPhone = (t.userPhone || '').includes(q);
        const matchesCategory = (t.category || '').toLowerCase().includes(q);
        const matchesRemarks = (t.remarks || '').toLowerCase().includes(q);

        if (!matchesId && !matchesOrder && !matchesName && !matchesEmail && !matchesPhone && !matchesCategory && !matchesRemarks) {
          return false;
        }
      }

      if (typeFilter !== 'all' && t.type !== typeFilter) return false;
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;
      if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;

      return true;
    });
  }, [transactions, searchQuery, typeFilter, statusFilter, categoryFilter]);

  const stats = useMemo(() => {
    let totalCredits = 0;
    let totalDebits = 0;
    let pendingHold = 0;

    transactions.forEach(t => {
      const amt = Number(t.amount || 0);
      if (t.status === 'hold' || t.status === 'pending') {
        pendingHold += amt;
      } else if (t.type === 'credit') {
        totalCredits += amt;
      } else {
        totalDebits += amt;
      }
    });

    return {
      totalCount: transactions.length,
      totalCredits,
      totalDebits,
      netVolume: totalCredits - totalDebits,
      pendingHold
    };
  }, [transactions]);

  const categoriesList = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach(t => {
      if (t.category) set.add(t.category);
    });
    return Array.from(set).sort();
  }, [transactions]);

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage) || 1;
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredTransactions.slice(start, start + itemsPerPage);
  }, [filteredTransactions, currentPage, itemsPerPage]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Navigation & Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
          <div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 transition text-slate-600"
              >
                <ArrowLeft size={18} />
              </button>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
                  <span>💳</span> Admin Transaction Manager
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Universal transaction ledger with real-time audit, edit, and deletion controls.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={fetchTransactions}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition cursor-pointer"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
            <button
              onClick={exportToCSV}
              disabled={filteredTransactions.length === 0}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-slate-900 hover:bg-slate-800 text-white transition cursor-pointer shadow-sm"
            >
              <Download size={14} />
              Export CSV
            </button>
          </div>
        </div>

        {/* Notifications */}
        {successMsg && (
          <div className="flex items-center gap-2 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
            <CheckCircle size={16} />
            <span>{successMsg}</span>
          </div>
        )}
        {errorMsg && (
          <div className="flex items-center gap-2 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
            <AlertTriangle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Aggregate KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
            <div className="flex justify-between items-center text-slate-500">
              <span className="text-[11px] font-bold uppercase">Total Credits</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <ArrowDownLeft size={15} />
              </div>
            </div>
            <p className="text-xl font-black text-emerald-600 mt-2 font-mono">
              ₹{stats.totalCredits.toLocaleString('en-IN')}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">Platform sales &amp; commissions</p>
          </div>

          <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
            <div className="flex justify-between items-center text-slate-500">
              <span className="text-[11px] font-bold uppercase">Total Debits</span>
              <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                <ArrowUpRight size={15} />
              </div>
            </div>
            <p className="text-xl font-black text-rose-600 mt-2 font-mono">
              ₹{stats.totalDebits.toLocaleString('en-IN')}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">Payouts &amp; wallet debits</p>
          </div>

          <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
            <div className="flex justify-between items-center text-slate-500">
              <span className="text-[11px] font-bold uppercase">Pending Escrow Hold</span>
              <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <Clock size={15} />
              </div>
            </div>
            <p className="text-xl font-black text-amber-600 mt-2 font-mono">
              ₹{stats.pendingHold.toLocaleString('en-IN')}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">7-day order return buffer</p>
          </div>

          <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
            <div className="flex justify-between items-center text-slate-500">
              <span className="text-[11px] font-bold uppercase">Net Active Volume</span>
              <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Wallet size={15} />
              </div>
            </div>
            <p className="text-xl font-black text-slate-900 mt-2 font-mono">
              ₹{stats.netVolume.toLocaleString('en-IN')}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">Circulating wallet balance</p>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs space-y-3">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by Txn ID, Order ID, User Name, Email, Phone, Category..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
              <button
                onClick={() => { setTypeFilter('all'); setCurrentPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${typeFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
              >
                All
              </button>
              <button
                onClick={() => { setTypeFilter('credit'); setCurrentPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${typeFilter === 'credit' ? 'bg-emerald-600 text-white shadow-xs' : 'text-emerald-700 hover:bg-emerald-50'
                  }`}
              >
                Credit (+)
              </button>
              <button
                onClick={() => { setTypeFilter('debit'); setCurrentPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${typeFilter === 'debit' ? 'bg-rose-600 text-white shadow-xs' : 'text-rose-700 hover:bg-rose-50'
                  }`}
              >
                Debit (-)
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-1 text-slate-400 font-bold">
              <Filter size={13} /> Filters:
            </div>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700"
            >
              <option value="all">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="hold">Hold</option>
              <option value="failed">Failed</option>
              <option value="reversed">Reversed</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700"
            >
              <option value="all">All Categories</option>
              {categoriesList.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            <span className="ml-auto text-slate-400">
              Showing <strong className="text-slate-800">{filteredTransactions.length}</strong> transactions
            </span>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          {loading ? (
            <div className="p-16 text-center space-y-3">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
              <p className="text-xs text-slate-400">Loading transaction ledger...</p>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="p-16 text-center space-y-2">
              <p className="text-sm font-bold text-slate-700">No Transactions Found</p>
              <p className="text-xs text-slate-400">Try adjusting your filters or search terms.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="p-3.5 pl-5">Txn ID &amp; Ref</th>
                    <th className="p-3.5">Date &amp; Time</th>
                    <th className="p-3.5">Member</th>
                    <th className="p-3.5">Type &amp; Category</th>
                    <th className="p-3.5 text-right">Amount (₹)</th>
                    <th className="p-3.5 text-center">Status</th>
                    <th className="p-3.5">Remarks</th>
                    <th className="p-3.5 pr-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedTransactions.map((tx) => {
                    const isCredit = tx.type === 'credit';
                    return (
                      <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3.5 pl-5 font-mono">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-800">{tx.transactionId}</span>
                            <button
                              onClick={() => handleCopy(tx.id, tx.transactionId)}
                              className="text-slate-400 hover:text-slate-700"
                            >
                              {copiedId === tx.id ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                            </button>
                          </div>
                          {tx.orderId && <span className="text-[10px] text-slate-400 block">Ref: {tx.orderId}</span>}
                        </td>

                        <td className="p-3.5 text-slate-500 whitespace-nowrap">
                          <span className="block font-medium text-slate-800">
                            {new Date(tx.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(tx.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </td>

                        <td className="p-3.5">
                          <p className="font-bold text-slate-900">{tx.userName}</p>
                          <p className="text-[10px] text-slate-400">{tx.userEmail || tx.userPhone || '—'}</p>
                        </td>

                        <td className="p-3.5">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${isCredit ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}
                          >
                            {tx.type}
                          </span>
                          <span className="text-[10.5px] font-semibold text-slate-700 block mt-0.5">{tx.category}</span>
                        </td>

                        <td className="p-3.5 text-right font-mono font-black text-sm">
                          <span className={isCredit ? 'text-emerald-600' : 'text-rose-600'}>
                            {isCredit ? '+' : '-'}₹{Number(tx.amount || 0).toLocaleString('en-IN')}
                          </span>
                        </td>

                        <td className="p-3.5 text-center">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${tx.status === 'completed'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : tx.status === 'pending'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : tx.status === 'hold'
                                  ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}
                          >
                            {tx.status}
                          </span>
                        </td>

                        <td className="p-3.5 max-w-[200px] text-slate-500 truncate" title={tx.remarks}>
                          {tx.remarks || tx.description || '—'}
                        </td>

                        <td className="p-3.5 pr-5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openEditModal(tx)}
                              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 hover:text-indigo-600 transition cursor-pointer"
                              title="Edit transaction"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              onClick={() => openDeleteModal(tx)}
                              className="p-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 transition cursor-pointer"
                              title="Delete transaction"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-slate-100 text-xs text-slate-500">
              <div>
                Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 transition font-bold"
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 transition font-bold"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Edit Modal */}
        {editModalOpen && editingTx && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden border border-slate-200">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                    <Edit2 size={16} className="text-indigo-600" /> Edit Transaction
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {editingTx.transactionId} • {editingTx.userName}
                  </p>
                </div>
                <button onClick={() => setEditModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                  <X size={18} />
                </button>
              </div>

              <div className="p-5 space-y-4 text-xs">
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 flex items-start gap-2">
                  <AlertTriangle size={15} className="shrink-0 mt-0.5" />
                  <p>
                    Adjusting the Amount or Type will automatically sync and recalculate the user's live wallet balance.
                  </p>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={editForm.amount}
                    onChange={(e) => setEditForm(prev => ({ ...prev, amount: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Direction</label>
                    <select
                      value={editForm.type}
                      onChange={(e) => setEditForm(prev => ({ ...prev, type: e.target.value as any }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold text-slate-800"
                    >
                      <option value="credit">Credit (+)</option>
                      <option value="debit">Debit (-)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Status</label>
                    <select
                      value={editForm.status}
                      onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value as any }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold text-slate-800"
                    >
                      <option value="completed">Completed</option>
                      <option value="pending">Pending</option>
                      <option value="hold">Hold</option>
                      <option value="failed">Failed</option>
                      <option value="reversed">Reversed</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Category</label>
                    <input
                      type="text"
                      value={editForm.category}
                      onChange={(e) => setEditForm(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Order Ref</label>
                    <input
                      type="text"
                      value={editForm.orderId}
                      onChange={(e) => setEditForm(prev => ({ ...prev, orderId: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Remarks</label>
                  <textarea
                    rows={3}
                    value={editForm.remarks}
                    onChange={(e) => setEditForm(prev => ({ ...prev, remarks: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl resize-none"
                  />
                </div>
              </div>

              <div className="p-4 border-t border-slate-100 flex justify-end gap-2 bg-slate-50">
                <button
                  onClick={() => setEditModalOpen(false)}
                  disabled={savingEdit}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 border border-slate-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={savingEdit}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 flex items-center gap-1.5"
                >
                  {savingEdit ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Modal */}
        {deleteModalOpen && deletingTx && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden border border-slate-200">
              <div className="p-5 border-b border-slate-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                  <Trash2 size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Delete Transaction</h3>
                  <p className="text-xs text-slate-400">Irreversible financial action</p>
                </div>
              </div>

              <div className="p-5 space-y-3 text-xs text-slate-700">
                <p>
                  Are you sure you want to delete transaction <strong>{deletingTx.transactionId}</strong> for ₹{deletingTx.amount.toLocaleString('en-IN')}?
                </p>
                <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                  <div><strong>Member:</strong> {deletingTx.userName}</div>
                  <div><strong>Type:</strong> {deletingTx.type.toUpperCase()}</div>
                  <div><strong>Category:</strong> {deletingTx.category}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-[11px]">
                  ⚠️ Deleting this transaction will automatically roll back its value from the user's wallet.
                </div>
              </div>

              <div className="p-4 border-t border-slate-100 flex justify-end gap-2 bg-slate-50">
                <button
                  onClick={() => setDeleteModalOpen(false)}
                  disabled={deleting}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 border border-slate-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={deleting}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 flex items-center gap-1.5"
                >
                  {deleting ? <RefreshCw size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  Confirm Delete
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

export default AdminTransactions;
