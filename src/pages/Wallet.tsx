// src/pages/Wallet.tsx — Fully Redesigned ApexBee Customer Wallet (Balances, Topup, Withdrawals & Transactions)
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Wallet as WalletIcon,
  PlusCircle,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  CheckCircle2,
  XCircle,
  QrCode,
  CreditCard,
  Building2,
  Send,
  RefreshCw,
  Search,
  AlertCircle,
  ShieldCheck,
  Sparkles,
  Zap,
  TrendingUp
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { openRazorpayModal } from "@/utils/razorpay";

const API_BASE = import.meta.env.VITE_API_URL || "https://server.apexbee.in/api";

type LedgerEntry = {
  _id?: string;
  transactionId?: string;
  type: "credit" | "debit";
  amount: number;
  category?: string;
  source?: string;
  remarks?: string;
  description?: string;
  status?: string;
  createdAt?: string;
  date?: string;
};

type WithdrawalRecord = {
  _id: string;
  amount: number;
  status: "pending" | "approved" | "rejected";
  note?: string;
  feeAmount?: number;
  netAmount?: number;
  createdAt?: string;
  date?: string;
};

const formatCurrency = (val: number) =>
  `₹${Number(val || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatDate = (dateStr?: string) => {
  if (!dateStr) return "Just now";
  try {
    const d = new Date(dateStr);
    return d.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
};

const WalletPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);

  const [availableBalance, setAvailableBalance] = useState(0);
  const [pendingBalance, setPendingBalance] = useState(0);
  const [totalCredits, setTotalCredits] = useState(0);
  const [totalDebits, setTotalDebits] = useState(0);
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRecord[]>([]);

  // Active tab state
  const [activeTab, setActiveTab] = useState<"transactions" | "withdrawals">("transactions");
  const [txFilter, setTxFilter] = useState<"all" | "credit" | "debit">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals state
  const [addFundsOpen, setAddFundsOpen] = useState(false);
  const [addAmount, setAddAmount] = useState<string>("500");
  const [addMethod, setAddMethod] = useState<"upi" | "card" | "netbanking">("upi");
  const [submittingAdd, setSubmittingAdd] = useState(false);
  const [addSuccessMsg, setAddSuccessMsg] = useState("");

  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState<string>("");
  const [withdrawMethod, setWithdrawMethod] = useState<"upi" | "bank">("upi");
  const [withdrawUpiId, setWithdrawUpiId] = useState("");
  const [withdrawAccountName, setWithdrawAccountName] = useState("");
  const [withdrawAccountNumber, setWithdrawAccountNumber] = useState("");
  const [withdrawIfsc, setWithdrawIfsc] = useState("");
  const [withdrawNote, setWithdrawNote] = useState("");
  const [submittingWithdraw, setSubmittingWithdraw] = useState(false);
  const [withdrawMsg, setWithdrawMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Fetch Wallet Data
  const fetchWalletData = useCallback(async () => {
    const token = localStorage.getItem("token");
    const userRaw = localStorage.getItem("user");
    if (!token || !userRaw) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const user = JSON.parse(userRaw);
      const userId = user._id || user.id;
      const headers = { Authorization: `Bearer ${token}` };

      // 1. Fetch wallet status
      let walletObj: any = null;
      try {
        const res = await fetch(`${API_BASE}/wallet/my-wallet`, { headers });
        const json = await res.json();
        if (json?.success && json?.wallet) {
          walletObj = json.wallet;
        }
      } catch (e) {
        console.error("my-wallet endpoint error:", e);
      }

      if (!walletObj && userId) {
        try {
          const res = await fetch(`${API_BASE}/user/wallet/${userId}`, { headers });
          const json = await res.json();
          if (json?.wallet) {
            walletObj = json.wallet;
          } else if (json?.walletBalance !== undefined) {
            setAvailableBalance(Number(json.walletBalance));
          }
        } catch (e) {
          console.error("user wallet fallback error:", e);
        }
      }

      if (walletObj) {
        setAvailableBalance(Number(walletObj.balance || walletObj.withdrawableBalance || 0));
        setPendingBalance(Number(walletObj.pendingBalance || 0));
        setTotalCredits(Number(walletObj.totalEarned || walletObj.totalCredited || 0));
        setTotalDebits(Number(walletObj.totalWithdrawn || walletObj.totalDebited || 0));

        if (Array.isArray(walletObj.transactions) && walletObj.transactions.length > 0) {
          const mappedTx: LedgerEntry[] = walletObj.transactions.map((tx: any, idx: number) => ({
            _id: tx._id || `tx-${idx}`,
            transactionId: tx.transactionId || tx._id || `TXN-${idx + 1}`,
            type: tx.type === "credit" || tx.type === "CREDIT" || tx.amount > 0 ? "credit" : "debit",
            amount: Math.abs(Number(tx.amount || 0)),
            description: tx.description || tx.reason || "Wallet Transaction",
            remarks: tx.remarks || tx.description || tx.reason || "Wallet Transaction",
            category: tx.category || "General",
            status: tx.status?.toLowerCase() === "success" || tx.status?.toLowerCase() === "completed" ? "completed" : "pending",
            createdAt: tx.createdAt || new Date().toISOString(),
          }));
          setLedgerEntries(mappedTx.reverse());
        }

        if (Array.isArray(walletObj.withdrawals) && walletObj.withdrawals.length > 0) {
          const mappedWd: WithdrawalRecord[] = walletObj.withdrawals.map((wd: any, idx: number) => ({
            _id: wd._id || `wd-${idx}`,
            amount: Number(wd.amount || 0),
            status: wd.status || "pending",
            note: wd.note || wd.payoutMethod || "Bank Payout",
            feeAmount: wd.feeAmount,
            netAmount: wd.netAmount,
            createdAt: wd.requestedAt || wd.createdAt || new Date().toISOString(),
          }));
          setWithdrawals(mappedWd.reverse());
        }
      }
    } catch (err) {
      console.error("Error fetching wallet:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWalletData();
  }, [fetchWalletData]);

  // Handle Add Funds Submit via Razorpay
  const handleAddFunds = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmt = Number(addAmount);
    if (isNaN(numAmt) || numAmt <= 0) {
      toast({ title: "Invalid Amount", description: "Please enter a valid amount to add.", variant: "destructive" });
      return;
    }

    const token = localStorage.getItem("token");
    const userRaw = localStorage.getItem("user");
    if (!token || !userRaw) {
      toast({ title: "Authentication Required", description: "Please login to add funds.", variant: "destructive" });
      navigate("/login");
      return;
    }

    const user = JSON.parse(userRaw);

    // Normalize phone number to avoid country code misinterpretation (e.g. 9550379505 => +919550379505)
    const rawPhone = String(user.phone || user.mobile || "").trim();
    const phoneDigits = rawPhone.replace(/\D/g, "");
    const cleanPhone = phoneDigits.length === 10 ? `+91${phoneDigits}` : (phoneDigits.length === 12 && phoneDigits.startsWith("91") ? `+${phoneDigits}` : rawPhone);

    try {
      setSubmittingAdd(true);

      // 1. Create Razorpay Wallet Deposit Order on Backend
      const res = await fetch(`${API_BASE}/payment/create-wallet-order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: numAmt,
          paymentMethod: addMethod,
        }),
      });

      const orderData = await res.json();
      if (!res.ok || !orderData.success) {
        throw new Error(orderData.message || "Failed to initialize Razorpay wallet recharge.");
      }

      // 2. Open Razorpay Checkout Modal with ApexBee brand logo & #F5B800 theme
      let rzpResponse: any;
      try {
        rzpResponse = await openRazorpayModal({
          order_id: orderData.orderId,
          amount: orderData.amount,
          currency: orderData.currency || "INR",
          name: "ApexBee Wallet Recharge",
          description: `Add ${formatCurrency(numAmt)} to Wallet`,
          image: "/logo.png",
          theme: {
            color: "#F5B800",
          },
          prefill: {
            name: user.name || user.username || "Customer",
            email: user.email || "",
            contact: cleanPhone,
          },
        });
      } catch (modalErr: any) {
        toast({
          title: "Top-up Cancelled",
          description: modalErr.message || "Wallet deposit payment was cancelled.",
          variant: "destructive",
        });
        return;
      }

      // 3. Verify Razorpay Payment and Credit Wallet on Backend
      const verifyRes = await fetch(`${API_BASE}/payment/verify-wallet-deposit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: numAmt,
          razorpayOrderId: rzpResponse.razorpay_order_id,
          razorpayPaymentId: rzpResponse.razorpay_payment_id,
          razorpaySignature: rzpResponse.razorpay_signature,
        }),
      });

      const verifyData = await verifyRes.json();
      if (verifyRes.ok && verifyData.success) {
        setAddSuccessMsg(`Successfully added ${formatCurrency(numAmt)} to your ApexWallet!`);
        toast({
          title: "Wallet Top-up Successful! 💰",
          description: `Payment ID: ${rzpResponse.razorpay_payment_id}. Balance credited!`,
        });
        setTimeout(() => {
          setAddFundsOpen(false);
          setAddSuccessMsg("");
          fetchWalletData();
        }, 1500);
      } else {
        toast({
          title: "Top-up Verification Failed",
          description: verifyData.message || "Failed to verify wallet credit. Please contact support.",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Error adding funds to wallet.", variant: "destructive" });
    } finally {
      setSubmittingAdd(false);
    }
  };

  // Handle Withdrawal Request Submit
  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawMsg(null);
    const numAmt = Number(withdrawAmount);
    if (isNaN(numAmt) || numAmt <= 0) {
      setWithdrawMsg({ type: "error", text: "Please enter a valid withdrawal amount." });
      return;
    }

    if (numAmt > availableBalance) {
      setWithdrawMsg({ type: "error", text: `Requested amount exceeds available balance (${formatCurrency(availableBalance)}).` });
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      setWithdrawMsg({ type: "error", text: "Please login to request withdrawal." });
      return;
    }

    const noteDetails =
      withdrawMethod === "upi"
        ? `UPI Payout to ${withdrawUpiId || "Registered UPI"}`
        : `Bank Transfer to ${withdrawAccountName} (${withdrawAccountNumber}, IFSC: ${withdrawIfsc})`;

    try {
      setSubmittingWithdraw(true);
      const res = await fetch(`${API_BASE}/wallet/withdrawals`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: numAmt,
          note: `${withdrawNote ? withdrawNote + " - " : ""}${noteDetails}`,
          bankDetails: {
            accountName: withdrawAccountName,
            accountNumber: withdrawAccountNumber,
            ifscCode: withdrawIfsc,
            upiId: withdrawUpiId,
          },
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setWithdrawMsg({ type: "success", text: `Withdrawal request for ${formatCurrency(numAmt)} submitted successfully!` });
        setTimeout(() => {
          setWithdrawOpen(false);
          setWithdrawMsg(null);
          setWithdrawAmount("");
          fetchWalletData();
        }, 1800);
      } else {
        setWithdrawMsg({ type: "error", text: json.message || "Failed to submit withdrawal request." });
      }
    } catch (err: any) {
      setWithdrawMsg({ type: "error", text: err.message || "Error submitting withdrawal request." });
    } finally {
      setSubmittingWithdraw(false);
    }
  };

  // Filtered Transactions
  const filteredTransactions = useMemo(() => {
    return ledgerEntries.filter((tx) => {
      const matchType =
        txFilter === "all" ? true : tx.type?.toLowerCase() === txFilter.toLowerCase();

      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        tx.transactionId?.toLowerCase().includes(q) ||
        tx.remarks?.toLowerCase().includes(q) ||
        tx.description?.toLowerCase().includes(q) ||
        tx.category?.toLowerCase().includes(q);

      return matchType && matchSearch;
    });
  }, [ledgerEntries, txFilter, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 font-sans flex flex-col transition-colors duration-200">
      <Navbar />

      <main className="flex-1 container mx-auto px-3.5 sm:px-6 py-6 sm:py-10 max-w-6xl">
        {/* Brand Header Section with ApexBee Logo */}
        <div className="bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#0A1128] border border-amber-500/20 rounded-3xl p-5 sm:p-7 mb-8 shadow-xl text-white relative overflow-hidden">
          {/* Subtle Honeycomb / Golden Glow Background Decor */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#F5B800]/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
          <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-amber-500/5 rounded-full blur-2xl pointer-events-none"></div>

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#F5B800] p-1.5 flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0 border border-amber-300">
                <img
                  src="/logo.png"
                  alt="ApexBee"
                  className="w-full h-full object-contain filter drop-shadow"
                />
              </div>
              <div className="text-left">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    Apex<span className="text-[#F5B800]">Wallet</span>
                  </h1>
                  <span className="bg-[#F5B800]/20 text-[#F5B800] border border-[#F5B800]/40 text-[10px] sm:text-xs font-black px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <Zap className="h-3 w-3 fill-current" /> 1-Click Instant Checkout
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
                  Manage your balance, add funds securely via Razorpay UPI/Cards, and track your instant savings & payouts.
                </p>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2.5 w-full md:w-auto">
              <Button
                onClick={fetchWalletData}
                variant="outline"
                size="sm"
                className="bg-slate-800/80 hover:bg-slate-700 text-slate-200 border-slate-700 rounded-2xl font-bold text-xs gap-1.5 py-2.5 px-3.5"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-[#F5B800]" : ""}`} />
                <span>Refresh</span>
              </Button>

              <Button
                onClick={() => setAddFundsOpen(true)}
                className="flex-1 md:flex-initial bg-[#F5B800] hover:bg-[#E5A800] text-slate-950 font-black rounded-2xl px-5 py-2.5 text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#F5B800]/25 transition-all transform hover:-translate-y-0.5"
              >
                <PlusCircle className="h-4 w-4" />
                <span>+ Add Funds</span>
              </Button>

              <Button
                onClick={() => setWithdrawOpen(true)}
                className="bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl px-4 py-2.5 text-xs flex items-center justify-center gap-1.5 border border-slate-700 shadow-md"
              >
                <Send className="h-3.5 w-3.5 text-[#F5B800]" />
                <span>Withdraw</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Balance Cards Summary Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Card 1: Main Available Balance */}
          <Card className="border border-amber-500/30 bg-gradient-to-br from-[#1E293B] to-[#0F172A] text-white rounded-3xl shadow-xl overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#F5B800]/15 rounded-full blur-2xl pointer-events-none group-hover:bg-[#F5B800]/25 transition-all"></div>
            <CardContent className="p-5 sm:p-6 text-left relative z-10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                  <WalletIcon className="h-4 w-4 text-[#F5B800]" />
                  Available Balance
                </span>
                <Badge className="bg-[#F5B800] text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-full">
                  ACTIVE
                </Badge>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mt-1">
                {formatCurrency(availableBalance)}
              </h2>
              <p className="text-[11px] text-slate-300 mt-2 flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                <span>Ready for 1-Click checkout & subscriptions</span>
              </p>

              <div className="mt-4 pt-3 border-t border-slate-700/60 flex gap-2">
                <button
                  onClick={() => setAddFundsOpen(true)}
                  className="flex-1 py-2 bg-[#F5B800] hover:bg-[#E5A800] text-slate-950 font-black rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1 shadow-md shadow-[#F5B800]/20"
                >
                  <PlusCircle className="h-3.5 w-3.5" />
                  + Add Money
                </button>
                <button
                  onClick={() => setWithdrawOpen(true)}
                  className="flex-1 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs border border-slate-700 transition cursor-pointer"
                >
                  Withdraw
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Pending Balance */}
          <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131B2E] rounded-3xl shadow-sm text-left">
            <CardContent className="p-5 sm:p-6">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider">
                  Pending / In-Transit
                </span>
                <Clock className="h-4 w-4 text-amber-500" />
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
                {formatCurrency(pendingBalance)}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                Reserved for active orders & pending payouts.
              </p>
            </CardContent>
          </Card>

          {/* Card 3: Total Credits */}
          <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131B2E] rounded-3xl shadow-sm text-left">
            <CardContent className="p-5 sm:p-6">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Total Credited (+)
                </span>
                <ArrowDownLeft className="h-4 w-4 text-emerald-500" />
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                {formatCurrency(totalCredits)}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                Lifetime top-ups, referral bonuses & cashbacks.
              </p>
            </CardContent>
          </Card>

          {/* Card 4: Total Debits */}
          <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131B2E] rounded-3xl shadow-sm text-left">
            <CardContent className="p-5 sm:p-6">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Total Spent (-)
                </span>
                <ArrowUpRight className="h-4 w-4 text-red-500" />
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
                {formatCurrency(totalDebits)}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                Total spent on orders & subscriptions.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tab Controls & Filters */}
        <div className="bg-white dark:bg-[#131B2E] border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-7 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/60 p-1.5 rounded-2xl w-full sm:w-auto overflow-x-auto">
              <button
                onClick={() => setActiveTab("transactions")}
                className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${activeTab === "transactions"
                  ? "bg-[#0F172A] text-[#F5B800] shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
              >
                📜 All Transactions ({ledgerEntries.length})
              </button>

              <button
                onClick={() => setActiveTab("withdrawals")}
                className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${activeTab === "withdrawals"
                  ? "bg-[#0F172A] text-[#F5B800] shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
              >
                💸 Withdrawals ({withdrawals.length})
              </button>
            </div>

            {activeTab === "transactions" && (
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                <div className="relative w-full sm:w-64">
                  <Search className="h-4 w-4 absolute left-3.5 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by ID or description..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:border-[#F5B800]"
                  />
                </div>

                <div className="flex items-center gap-1 border border-slate-200 dark:border-slate-700 rounded-xl p-1 bg-slate-50 dark:bg-slate-900 text-xs w-full sm:w-auto justify-center">
                  {(["all", "credit", "debit"] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setTxFilter(type)}
                      className={`flex-1 sm:flex-initial px-3 py-1 rounded-lg font-bold capitalize transition ${txFilter === type
                        ? "bg-white dark:bg-slate-800 text-slate-950 dark:text-[#F5B800] font-black shadow-xs border border-slate-200 dark:border-slate-700"
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-900"
                        }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* TAB 1: TRANSACTIONS LIST */}
          {activeTab === "transactions" && (
            <div>
              {loading ? (
                <div className="text-center py-14 space-y-3">
                  <RefreshCw className="h-8 w-8 animate-spin text-[#F5B800] mx-auto opacity-70" />
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">Loading wallet transactions...</p>
                </div>
              ) : filteredTransactions.length === 0 ? (
                <div className="text-center py-14 sm:py-16 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 px-4">
                  <WalletIcon className="h-12 w-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">No Transactions Found</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                    {searchQuery || txFilter !== "all"
                      ? "No ledger entries matched your search filter."
                      : "You haven't made any wallet transactions yet. Top up your balance to get started."}
                  </p>
                  <Button
                    onClick={() => setAddFundsOpen(true)}
                    className="mt-4 bg-[#F5B800] hover:bg-[#E5A800] text-slate-950 font-black text-xs rounded-xl px-5 py-2"
                  >
                    + Add Funds Now
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredTransactions.map((tx, idx) => {
                    const isCredit = tx.type?.toLowerCase() === "credit";

                    return (
                      <div
                        key={tx._id || tx.transactionId || idx}
                        className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 hover:border-amber-500/30 transition shadow-2xs text-left"
                      >
                        <div className="flex items-start sm:items-center gap-3.5">
                          <div
                            className={`p-3 rounded-2xl shrink-0 ${isCredit
                              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                              : "bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-500/20"
                              }`}
                          >
                            {isCredit ? (
                              <ArrowDownLeft className="h-5 w-5" />
                            ) : (
                              <ArrowUpRight className="h-5 w-5" />
                            )}
                          </div>

                          <div className="space-y-0.5">
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="font-black text-slate-900 dark:text-white text-sm">
                                {tx.remarks || tx.description || (isCredit ? "Wallet Credit" : "Wallet Debit")}
                              </h4>
                              <Badge
                                variant="outline"
                                className="text-[9px] uppercase font-black border-slate-200 dark:border-slate-700 py-0.5 px-2 text-slate-600 dark:text-slate-400"
                              >
                                {tx.category || tx.source || "Wallet"}
                              </Badge>
                            </div>

                            <p className="text-[10px] sm:text-[11px] text-slate-400 font-mono">
                              ID: {tx.transactionId || tx._id || "TXN-SYSTEM"} • {formatDate(tx.createdAt || tx.date)}
                            </p>
                          </div>
                        </div>

                        <div className="text-right w-full sm:w-auto flex sm:flex-col justify-between items-center sm:items-end border-t sm:border-t-0 pt-2.5 sm:pt-0 border-slate-100 dark:border-slate-800">
                          <span
                            className={`text-base font-black ${isCredit ? "text-emerald-600 dark:text-emerald-400" : "text-slate-900 dark:text-white"
                              }`}
                          >
                            {isCredit ? "+" : "-"}{formatCurrency(tx.amount)}
                          </span>

                          <span
                            className={`text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full mt-1 ${tx.status === "completed" || !tx.status
                              ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30"
                              : tx.status === "pending"
                                ? "bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-500/30"
                                : "bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300 border border-red-500/30"
                              }`}
                          >
                            {tx.status || "Completed"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: WITHDRAWALS HISTORY LIST */}
          {activeTab === "withdrawals" && (
            <div>
              {withdrawals.length === 0 ? (
                <div className="text-center py-14 sm:py-16 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 px-4">
                  <Send className="h-12 w-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">No Withdrawal Requests</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                    You haven't requested any payouts yet. You can withdraw your available wallet funds anytime.
                  </p>
                  <Button
                    onClick={() => setWithdrawOpen(true)}
                    className="mt-4 bg-[#0F172A] hover:bg-[#1E293B] text-[#F5B800] font-black text-xs rounded-xl px-5 py-2"
                  >
                    Withdraw Available Balance
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {withdrawals.map((w) => {
                    const isApproved = w.status === "approved";
                    const isRejected = w.status === "rejected";

                    return (
                      <div
                        key={w._id}
                        className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-left shadow-2xs"
                      >
                        <div className="flex items-start sm:items-center gap-3.5">
                          <div
                            className={`p-3 rounded-2xl shrink-0 ${isApproved
                              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                              : isRejected
                                ? "bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-500/20"
                                : "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                              }`}
                          >
                            {isApproved ? (
                              <CheckCircle2 className="h-5 w-5" />
                            ) : isRejected ? (
                              <XCircle className="h-5 w-5" />
                            ) : (
                              <Clock className="h-5 w-5" />
                            )}
                          </div>

                          <div className="space-y-0.5">
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="font-black text-slate-900 dark:text-white text-sm">
                                Withdrawal Request: {formatCurrency(w.amount)}
                              </h4>
                              <Badge
                                className={`text-[9px] font-black uppercase ${isApproved
                                  ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30"
                                  : isRejected
                                    ? "bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300 border border-red-500/30"
                                    : "bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-500/30"
                                  }`}
                              >
                                {w.status === "approved"
                                  ? "Approved & Transferred"
                                  : w.status === "rejected"
                                    ? "Rejected"
                                    : "Pending Approval"}
                              </Badge>
                            </div>

                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                              {w.note || "Payout Request"} • Submitted on {formatDate(w.createdAt || w.date)}
                            </p>
                          </div>
                        </div>

                        <div className="text-right w-full sm:w-auto flex sm:flex-col justify-between items-center sm:items-end border-t sm:border-t-0 pt-2.5 sm:pt-0 border-slate-100 dark:border-slate-800">
                          <span className="text-base font-black text-slate-900 dark:text-white">
                            Net Payout: {formatCurrency(w.netAmount ?? w.amount)}
                          </span>
                          {w.feeAmount && w.feeAmount > 0 ? (
                            <span className="text-[10px] text-slate-400 font-bold">
                              TDS/Fee: {formatCurrency(w.feeAmount)}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* ➕ MODAL 1: ADD FUNDS / TOPUP WALLET VIA RAZORPAY */}
      <Dialog open={addFundsOpen} onOpenChange={setAddFundsOpen}>
        <DialogContent className="w-[92vw] max-w-md bg-white dark:bg-[#111827] text-slate-900 dark:text-white rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-left max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#F5B800] p-1 flex items-center justify-center shadow-md">
                <img src="/logo.png" alt="ApexBee" className="w-full h-full object-contain" />
              </div>
              <div>
                <DialogTitle className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                  Add Money to ApexWallet
                </DialogTitle>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Instant recharge via Razorpay UPI, Cards & NetBanking
                </p>
              </div>
            </div>
          </DialogHeader>

          {addSuccessMsg ? (
            <div className="py-8 text-center space-y-3 animate-in fade-in">
              <CheckCircle2 className="h-14 w-14 text-emerald-500 mx-auto" />
              <h4 className="text-lg font-black text-slate-900 dark:text-white">{addSuccessMsg}</h4>
            </div>
          ) : (
            <form onSubmit={handleAddFunds} className="space-y-4 pt-3 text-xs">
              <div>
                <label className="font-black text-slate-800 dark:text-slate-200 block mb-1.5">Enter Top-up Amount (₹) *</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 font-black text-slate-400 text-base">₹</span>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    required
                    placeholder="Enter amount (e.g. 500)"
                    value={addAmount}
                    onChange={(e) => setAddAmount(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 border-2 border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-900 outline-none text-lg font-black text-slate-900 dark:text-white focus:border-[#F5B800]"
                  />
                </div>
              </div>

              {/* Preset Buttons */}
              <div>
                <label className="font-bold text-slate-500 dark:text-slate-400 block mb-1.5">Quick Presets</label>
                <div className="grid grid-cols-5 gap-1.5">
                  {["100", "250", "500", "1000", "2000"].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setAddAmount(preset)}
                      className={`py-2 rounded-xl text-xs font-black border transition cursor-pointer ${addAmount === preset
                        ? "bg-[#F5B800] text-slate-950 border-[#F5B800] shadow-sm"
                        : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                        }`}
                    >
                      +₹{preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment Method Select */}
              <div>
                <label className="font-black text-slate-800 dark:text-slate-200 block mb-1.5">Payment Method</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: "upi", label: "Instant UPI / QR", icon: <QrCode className="h-4 w-4 text-[#F5B800]" /> },
                    { key: "card", label: "Debit/Credit Card", icon: <CreditCard className="h-4 w-4 text-[#F5B800]" /> },
                    { key: "netbanking", label: "NetBanking", icon: <Building2 className="h-4 w-4 text-[#F5B800]" /> },
                  ].map((method) => (
                    <button
                      key={method.key}
                      type="button"
                      onClick={() => setAddMethod(method.key as any)}
                      className={`p-3 rounded-2xl border-2 text-center flex flex-col items-center gap-1 font-bold transition cursor-pointer ${addMethod === method.key
                        ? "bg-amber-500/10 border-[#F5B800] text-slate-900 dark:text-white"
                        : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                        }`}
                    >
                      {method.icon}
                      <span className="text-[10px] font-black">{method.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-amber-500/10 border border-[#F5B800]/30 rounded-2xl p-3 flex items-center justify-between text-xs text-slate-800 dark:text-amber-200 font-bold">
                <span className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-[#F5B800]" />
                  Secured by Razorpay Official Gateway
                </span>
                <span className="text-[10px] bg-[#F5B800] text-slate-950 px-2 py-0.5 rounded font-black uppercase">
                  Zero Fee
                </span>
              </div>

              <div className="pt-2 flex gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 rounded-xl py-2.5 text-xs font-bold border-slate-200 dark:border-slate-700"
                  onClick={() => setAddFundsOpen(false)}
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  disabled={submittingAdd}
                  className="flex-1 bg-[#F5B800] hover:bg-[#E5A800] text-slate-950 font-black rounded-xl py-2.5 text-xs border-none shadow-lg shadow-[#F5B800]/25 flex items-center justify-center gap-2"
                >
                  {submittingAdd ? "Processing..." : (
                    <>
                      <Zap className="h-4 w-4 fill-current" />
                      {`Pay ₹${addAmount || "0"} with Razorpay`}
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* 💸 MODAL 2: WITHDRAW FUNDS */}
      <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
        <DialogContent className="w-[92vw] max-w-md bg-white dark:bg-[#111827] text-slate-900 dark:text-white rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-left max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <DialogTitle className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Send className="h-5 w-5 text-[#F5B800]" />
              Withdraw Wallet Balance
            </DialogTitle>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Transfer available funds directly to your Bank Account or UPI ID.
            </p>
          </DialogHeader>

          {withdrawMsg && (
            <div
              className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${withdrawMsg.type === "success"
                ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                : "bg-red-50 dark:bg-red-950/60 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800"
                }`}
            >
              {withdrawMsg.type === "success" ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
              )}
              <span>{withdrawMsg.text}</span>
            </div>
          )}

          <form onSubmit={handleWithdrawSubmit} className="space-y-4 pt-2 text-xs">
            <div className="bg-slate-50 dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span className="font-bold text-slate-500 dark:text-slate-400">Withdrawable Balance:</span>
              <span className="font-black text-emerald-600 dark:text-emerald-400 text-base">
                {formatCurrency(availableBalance)}
              </span>
            </div>

            <div>
              <label className="font-bold text-slate-800 dark:text-slate-200 block mb-1">Withdrawal Amount (₹) *</label>
              <input
                type="number"
                min="1"
                max={availableBalance}
                required
                placeholder={`Max ₹${availableBalance}`}
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 outline-none text-sm font-black text-slate-900 dark:text-white focus:border-[#F5B800]"
              />
            </div>

            <div>
              <label className="font-bold text-slate-800 dark:text-slate-200 block mb-1">Payout Destination</label>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => setWithdrawMethod("upi")}
                  className={`py-2 rounded-xl font-extrabold border transition cursor-pointer ${withdrawMethod === "upi"
                    ? "bg-[#0F172A] text-[#F5B800] border-[#0F172A]"
                    : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                    }`}
                >
                  Instant UPI
                </button>
                <button
                  type="button"
                  onClick={() => setWithdrawMethod("bank")}
                  className={`py-2 rounded-xl font-extrabold border transition cursor-pointer ${withdrawMethod === "bank"
                    ? "bg-[#0F172A] text-[#F5B800] border-[#0F172A]"
                    : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                    }`}
                >
                  Bank Transfer
                </button>
              </div>

              {withdrawMethod === "upi" ? (
                <div>
                  <label className="font-bold text-slate-500 dark:text-slate-400 block mb-1">UPI ID (e.g. mobile@upi) *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 9848012345@ybl"
                    value={withdrawUpiId}
                    onChange={(e) => setWithdrawUpiId(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 outline-none font-bold text-slate-900 dark:text-white focus:border-[#F5B800]"
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <div>
                    <label className="font-bold text-slate-500 dark:text-slate-400 block mb-0.5">Account Holder Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="Full Name as in Bank"
                      value={withdrawAccountName}
                      onChange={(e) => setWithdrawAccountName(e.target.value)}
                      className="w-full px-3.5 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 outline-none font-bold text-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-bold text-slate-500 dark:text-slate-400 block mb-0.5">Account Number *</label>
                      <input
                        type="text"
                        required
                        placeholder="Bank Account No."
                        value={withdrawAccountNumber}
                        onChange={(e) => setWithdrawAccountNumber(e.target.value)}
                        className="w-full px-3.5 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 outline-none font-mono text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-500 dark:text-slate-400 block mb-0.5">IFSC Code *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. SBIN0001234"
                        value={withdrawIfsc}
                        onChange={(e) => setWithdrawIfsc(e.target.value)}
                        className="w-full px-3.5 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 outline-none font-mono uppercase text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="font-bold text-slate-500 dark:text-slate-400 block mb-1">Remarks / Note (Optional)</label>
              <input
                type="text"
                placeholder="Reason or notes..."
                value={withdrawNote}
                onChange={(e) => setWithdrawNote(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 outline-none text-slate-900 dark:text-white"
              />
            </div>

            <div className="pt-2 flex gap-2.5">
              <Button
                type="button"
                variant="outline"
                className="flex-1 rounded-xl py-2.5 text-xs font-bold border-slate-200 dark:border-slate-700"
                onClick={() => setWithdrawOpen(false)}
              >
                Cancel
              </Button>

              <Button
                type="submit"
                disabled={submittingWithdraw}
                className="flex-1 bg-[#0F172A] hover:bg-[#1E293B] text-[#F5B800] font-black rounded-xl py-2.5 text-xs border-none shadow-md"
              >
                {submittingWithdraw ? "Submitting..." : "Submit Withdrawal Request"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default WalletPage;
