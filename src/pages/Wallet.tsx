// src/pages/Wallet.tsx — Fully Mobile-Responsive ApexBee Customer Wallet (Balances, Topup, Withdrawals & Transactions)
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
  Lock,
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
            id: tx._id || `tx-${idx}`,
            type: tx.type === "credit" || tx.type === "CREDIT" || tx.amount > 0 ? "credit" : "debit",
            amount: Math.abs(Number(tx.amount || 0)),
            description: tx.description || tx.reason || "Wallet Transaction",
            category: tx.category || "General",
            status: tx.status?.toLowerCase() === "success" || tx.status?.toLowerCase() === "completed" ? "completed" : "pending",
            referenceId: tx.referenceId || tx.orderId || "",
            createdAt: tx.createdAt || new Date().toISOString(),
          }));
          setLedgerEntries(mappedTx);
        }

        if (Array.isArray(walletObj.withdrawals) && walletObj.withdrawals.length > 0) {
          const mappedWd: WithdrawalRecord[] = walletObj.withdrawals.map((wd: any, idx: number) => ({
            id: wd._id || `wd-${idx}`,
            amount: Number(wd.amount || 0),
            payoutMethod: wd.payoutMethod || wd.method || "bank",
            status: wd.status || "pending",
            requestedAt: wd.requestedAt || wd.createdAt || new Date().toISOString(),
            processedAt: wd.processedAt,
            rejectionReason: wd.rejectionReason,
            accountDetails: wd.accountDetails,
          }));
          setWithdrawals(mappedWd);
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

      // 2. Open Razorpay Checkout Modal
      let rzpResponse: any;
      try {
        rzpResponse = await openRazorpayModal({
          order_id: orderData.orderId,
          amount: orderData.amount,
          currency: orderData.currency || "INR",
          name: "ApexBee Wallet Recharge",
          description: `Add ${formatCurrency(numAmt)} to Wallet`,
          prefill: {
            name: user.name || user.username || "Customer",
            email: user.email || "",
            contact: user.phone || "",
          },
          theme: {
            color: "#059669",
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
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
      <Navbar />

      <main className="flex-1 container mx-auto px-3.5 sm:px-6 py-5 sm:py-8 max-w-6xl">
        {/* Header Title Section */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-navy text-white rounded-2xl shadow-xs shrink-0">
                <WalletIcon className="h-5 w-5 sm:h-6 sm:w-6" />
              </span>
              <h1 className="text-xl sm:text-3xl font-black text-navy tracking-tight">
                ApexWallet & Balances
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Manage your balance, top-up funds for instant order payments, and request payouts.
            </p>
          </div>

          <div className="grid grid-cols-3 sm:flex sm:items-center gap-2 sm:gap-2.5 w-full sm:w-auto">
            <Button
              onClick={fetchWalletData}
              variant="outline"
              size="sm"
              className="rounded-2xl border-slate-200 text-slate-700 font-bold hover:bg-slate-100 text-[11px] sm:text-xs gap-1 py-2"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              <span className="hidden xs:inline">Refresh</span>
            </Button>

            <Button
              onClick={() => setAddFundsOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-2xl px-3 sm:px-5 py-2 sm:py-2.5 text-[11px] sm:text-xs flex items-center justify-center gap-1 sm:gap-1.5 shadow-md"
            >
              <PlusCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span>+ Add Funds</span>
            </Button>

            <Button
              onClick={() => setWithdrawOpen(true)}
              className="bg-navy hover:bg-navy/90 text-white font-extrabold rounded-2xl px-3 sm:px-5 py-2 sm:py-2.5 text-[11px] sm:text-xs flex items-center justify-center gap-1 sm:gap-1.5 shadow-md"
            >
              <Send className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span>Withdraw</span>
            </Button>
          </div>
        </div>

        {/* Balance Cards Summary Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 mb-6 sm:mb-8">
          {/* Card 1: Main Available Balance */}
          <Card className="border border-emerald-500/30 bg-gradient-to-br from-emerald-600 to-teal-800 text-white rounded-3xl shadow-xl overflow-hidden relative">
            <CardContent className="p-4 sm:p-6 text-left">
              <div className="flex items-center justify-between opacity-90 mb-1.5">
                <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-emerald-100">
                  Available Balance
                </span>
                <ShieldCheck className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-200" />
              </div>
              <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                {formatCurrency(availableBalance)}
              </h2>
              <p className="text-[10px] sm:text-[11px] text-emerald-100 mt-1.5 flex items-center gap-1">
                <span>Instant 1-Click Payments Enabled</span>
              </p>

              <div className="mt-3.5 pt-3 border-t border-white/20 flex gap-2">
                <button
                  onClick={() => setAddFundsOpen(true)}
                  className="flex-1 py-1.5 sm:py-2 bg-white text-emerald-800 hover:bg-emerald-50 font-black rounded-xl text-[11px] sm:text-xs transition cursor-pointer"
                >
                  + Add Money
                </button>
                <button
                  onClick={() => setWithdrawOpen(true)}
                  className="flex-1 py-1.5 sm:py-2 bg-emerald-900/50 hover:bg-emerald-900/80 text-white font-extrabold rounded-xl text-[11px] sm:text-xs border border-white/20 transition cursor-pointer"
                >
                  Withdraw
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Pending Balance */}
          <Card className="border border-amber-200 bg-white rounded-3xl shadow-xs text-left">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between text-slate-500 mb-1.5">
                <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider">
                  Pending / Hold
                </span>
                <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500" />
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-navy">
                {formatCurrency(pendingBalance)}
              </h3>
              <p className="text-[10px] sm:text-[11px] text-slate-500 mt-1">
                Reserved for active orders & pending payouts.
              </p>
            </CardContent>
          </Card>

          {/* Card 3: Total Credits */}
          <Card className="border border-slate-200 bg-white rounded-3xl shadow-xs text-left">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between text-slate-500 mb-1.5">
                <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider">
                  Total Credits (+)
                </span>
                <ArrowDownLeft className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-emerald-600">
                {formatCurrency(totalCredits)}
              </h3>
              <p className="text-[10px] sm:text-[11px] text-slate-500 mt-1">
                Lifetime wallet top-ups & refunds.
              </p>
            </CardContent>
          </Card>

          {/* Card 4: Total Debits */}
          <Card className="border border-slate-200 bg-white rounded-3xl shadow-xs text-left">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between text-slate-500 mb-1.5">
                <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider">
                  Total Debits (-)
                </span>
                <ArrowUpRight className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                {formatCurrency(totalDebits)}
              </h3>
              <p className="text-[10px] sm:text-[11px] text-slate-500 mt-1">
                Lifetime subscription & order payments.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tab Controls & Filters */}
        <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-6 shadow-xs space-y-4 sm:space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl w-full sm:w-auto overflow-x-auto">
              <button
                onClick={() => setActiveTab("transactions")}
                className={`flex-1 sm:flex-initial px-3 sm:px-5 py-2 rounded-xl text-[11px] sm:text-xs font-extrabold transition cursor-pointer whitespace-nowrap ${activeTab === "transactions"
                  ? "bg-navy text-white shadow-xs"
                  : "text-slate-600 hover:text-navy"
                  }`}
              >
                📜 All Transactions ({ledgerEntries.length})
              </button>

              <button
                onClick={() => setActiveTab("withdrawals")}
                className={`flex-1 sm:flex-initial px-3 sm:px-5 py-2 rounded-xl text-[11px] sm:text-xs font-extrabold transition cursor-pointer whitespace-nowrap ${activeTab === "withdrawals"
                  ? "bg-navy text-white shadow-xs"
                  : "text-slate-600 hover:text-navy"
                  }`}
              >
                💸 Withdrawals ({withdrawals.length})
              </button>
            </div>

            {activeTab === "transactions" && (
              <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto">
                <div className="relative w-full sm:w-60">
                  <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search transactions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 sm:py-2 border rounded-xl text-xs bg-slate-50 outline-none focus:border-navy"
                  />
                </div>

                <div className="flex items-center gap-1 border rounded-xl p-1 bg-slate-50 text-[11px] w-full sm:w-auto justify-center">
                  {(["all", "credit", "debit"] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setTxFilter(type)}
                      className={`flex-1 sm:flex-initial px-2.5 py-1 rounded-lg font-bold capitalize transition ${txFilter === type
                        ? "bg-white text-navy font-black shadow-2xs border"
                        : "text-slate-500 hover:text-navy"
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
                <div className="text-center py-12 space-y-3">
                  <RefreshCw className="h-8 w-8 animate-spin text-navy mx-auto opacity-40" />
                  <p className="text-xs text-slate-500 font-bold">Loading wallet ledger transactions...</p>
                </div>
              ) : filteredTransactions.length === 0 ? (
                <div className="text-center py-12 sm:py-16 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 px-4">
                  <WalletIcon className="h-10 w-10 sm:h-12 sm:w-12 text-slate-300 mx-auto mb-3" />
                  <h4 className="text-sm font-bold text-navy">No Transactions Found</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    {searchQuery || txFilter !== "all"
                      ? "No ledger entries matched your search criteria."
                      : "You haven't made any wallet transactions yet. Top-up funds to get started."}
                  </p>
                  <Button
                    onClick={() => setAddFundsOpen(true)}
                    className="mt-4 bg-emerald-600 text-white font-extrabold text-xs rounded-xl px-4 py-2"
                  >
                    + Add Funds Now
                  </Button>
                </div>
              ) : (
                <div className="space-y-2.5 sm:space-y-3">
                  {filteredTransactions.map((tx, idx) => {
                    const isCredit = tx.type?.toLowerCase() === "credit";

                    return (
                      <div
                        key={tx._id || tx.transactionId || idx}
                        className="bg-white border border-slate-200 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 sm:gap-4 hover:border-slate-300 transition shadow-2xs text-left"
                      >
                        <div className="flex items-start sm:items-center gap-3">
                          <div
                            className={`p-2.5 sm:p-3 rounded-2xl shrink-0 ${isCredit ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                              }`}
                          >
                            {isCredit ? (
                              <ArrowDownLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                            ) : (
                              <ArrowUpRight className="h-4 w-4 sm:h-5 sm:w-5" />
                            )}
                          </div>

                          <div className="space-y-0.5">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <h4 className="font-extrabold text-navy text-xs sm:text-sm">
                                {tx.remarks || tx.description || (isCredit ? "Wallet Credit" : "Wallet Debit")}
                              </h4>
                              <Badge
                                variant="outline"
                                className="text-[9px] uppercase font-extrabold border-slate-200 py-0"
                              >
                                {tx.category || tx.source || "Wallet"}
                              </Badge>
                            </div>

                            <p className="text-[10px] sm:text-[11px] text-slate-400 font-mono">
                              ID: {tx.transactionId || tx._id || "TXN-SYSTEM"} • {formatDate(tx.createdAt || tx.date)}
                            </p>
                          </div>
                        </div>

                        <div className="text-right w-full sm:w-auto flex sm:flex-col justify-between items-center sm:items-end border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                          <span
                            className={`text-sm sm:text-base font-black ${isCredit ? "text-emerald-600" : "text-slate-900"
                              }`}
                          >
                            {isCredit ? "+" : "-"}{formatCurrency(tx.amount)}
                          </span>

                          <span
                            className={`text-[9px] sm:text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full mt-0.5 ${tx.status === "completed" || !tx.status
                              ? "bg-emerald-100 text-emerald-800"
                              : tx.status === "pending"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-red-100 text-red-800"
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
                <div className="text-center py-12 sm:py-16 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 px-4">
                  <Send className="h-10 w-10 sm:h-12 sm:w-12 text-slate-300 mx-auto mb-3" />
                  <h4 className="text-sm font-bold text-navy">No Withdrawal Requests</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    You haven't requested any payouts yet. You can withdraw your available wallet funds anytime.
                  </p>
                  <Button
                    onClick={() => setWithdrawOpen(true)}
                    className="mt-4 bg-navy text-white font-extrabold text-xs rounded-xl px-4 py-2"
                  >
                    Withdraw Available Balance
                  </Button>
                </div>
              ) : (
                <div className="space-y-2.5 sm:space-y-3">
                  {withdrawals.map((w) => {
                    const isApproved = w.status === "approved";
                    const isRejected = w.status === "rejected";

                    return (
                      <div
                        key={w._id}
                        className="bg-white border border-slate-200 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 sm:gap-3 text-left shadow-2xs"
                      >
                        <div className="flex items-start sm:items-center gap-3">
                          <div
                            className={`p-2.5 sm:p-3 rounded-2xl shrink-0 ${isApproved
                              ? "bg-emerald-50 text-emerald-600"
                              : isRejected
                                ? "bg-red-50 text-red-600"
                                : "bg-amber-50 text-amber-600"
                              }`}
                          >
                            {isApproved ? (
                              <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5" />
                            ) : isRejected ? (
                              <XCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                            ) : (
                              <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
                            )}
                          </div>

                          <div className="space-y-0.5">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <h4 className="font-extrabold text-navy text-xs sm:text-sm">
                                Withdrawal Request: {formatCurrency(w.amount)}
                              </h4>
                              <Badge
                                className={`text-[9px] sm:text-[10px] font-black uppercase ${isApproved
                                  ? "bg-emerald-100 text-emerald-800"
                                  : isRejected
                                    ? "bg-red-100 text-red-800"
                                    : "bg-amber-100 text-amber-800"
                                  }`}
                              >
                                {w.status === "approved"
                                  ? "Approved & Transferred"
                                  : w.status === "rejected"
                                    ? "Rejected"
                                    : "Pending Approval"}
                              </Badge>
                            </div>

                            <p className="text-[10px] sm:text-[11px] text-slate-500 leading-snug">
                              {w.note || "Payout Request"} • Submitted on {formatDate(w.createdAt || w.date)}
                            </p>
                          </div>
                        </div>

                        <div className="text-right w-full sm:w-auto flex sm:flex-col justify-between items-center sm:items-end border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                          <span className="text-sm sm:text-base font-black text-navy">
                            Net Payout: {formatCurrency(w.netAmount ?? w.amount)}
                          </span>
                          {w.feeAmount && w.feeAmount > 0 ? (
                            <span className="text-[9px] sm:text-[10px] text-slate-400 font-bold">
                              TDS/Fee: {formatCurrency(w.feeAmount)} ({w.feePercent || 15}%)
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

      {/* ➕ MODAL 1: ADD FUNDS / TOPUP WALLET */}
      <Dialog open={addFundsOpen} onOpenChange={setAddFundsOpen}>
        <DialogContent className="w-[92vw] max-w-md bg-white rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-100 text-left max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b pb-3">
            <DialogTitle className="text-base sm:text-lg font-black text-navy flex items-center gap-2">
              <PlusCircle className="h-5 w-5 text-emerald-600" />
              Add Money to ApexWallet
            </DialogTitle>
            <p className="text-xs text-slate-500 mt-0.5">
              Top up your wallet balance for instant 1-click payments on subscriptions & orders.
            </p>
          </DialogHeader>

          {addSuccessMsg ? (
            <div className="py-8 text-center space-y-3 animate-in fade-in">
              <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto" />
              <h4 className="text-base font-black text-navy">{addSuccessMsg}</h4>
            </div>
          ) : (
            <form onSubmit={handleAddFunds} className="space-y-4 pt-2 text-xs">
              <div>
                <label className="font-bold text-navy block mb-1">Enter Top-up Amount (₹) *</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 font-extrabold text-slate-500 text-sm">₹</span>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    required
                    placeholder="Enter amount (e.g. 500)"
                    value={addAmount}
                    onChange={(e) => setAddAmount(e.target.value)}
                    className="w-full pl-8 pr-3 py-2.5 border rounded-xl bg-slate-50 outline-none text-base font-black text-navy focus:border-emerald-600"
                  />
                </div>
              </div>

              {/* Preset Buttons */}
              <div>
                <label className="font-bold text-slate-600 block mb-1.5">Quick Presets</label>
                <div className="grid grid-cols-5 gap-1 sm:gap-1.5">
                  {["100", "250", "500", "1000", "2000"].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setAddAmount(preset)}
                      className={`py-2 rounded-xl text-[11px] sm:text-xs font-black border transition cursor-pointer ${addAmount === preset
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                        }`}
                    >
                      +₹{preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment Method Select */}
              <div>
                <label className="font-bold text-navy block mb-1.5">Select Payment Method</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: "upi", label: "UPI / QR", icon: <QrCode className="h-4 w-4" /> },
                    { key: "card", label: "Card", icon: <CreditCard className="h-4 w-4" /> },
                    { key: "netbanking", label: "NetBanking", icon: <Building2 className="h-4 w-4" /> },
                  ].map((method) => (
                    <button
                      key={method.key}
                      type="button"
                      onClick={() => setAddMethod(method.key as any)}
                      className={`p-2.5 sm:p-3 rounded-2xl border text-center flex flex-col items-center gap-1 font-extrabold transition cursor-pointer ${addMethod === method.key
                        ? "bg-navy/5 border-navy text-navy ring-2 ring-navy/20"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                    >
                      {method.icon}
                      <span className="text-[10px]">{method.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-2.5 flex items-center justify-between text-[11px] text-emerald-950 font-bold">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  Secured by Razorpay Payment Gateway
                </span>
                <span className="text-[10px] bg-emerald-200/80 text-emerald-900 px-2 py-0.5 rounded font-black uppercase">
                  Instant
                </span>
              </div>

              <div className="pt-2 flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 rounded-xl py-2.5 text-xs"
                  onClick={() => setAddFundsOpen(false)}
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  disabled={submittingAdd}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl py-2.5 text-xs border-none shadow-md flex items-center justify-center gap-1.5"
                >
                  {submittingAdd ? "Processing..." : (
                    <>
                      <Sparkles className="h-3.5 w-3.5" />
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
        <DialogContent className="w-[92vw] max-w-md bg-white rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-100 text-left max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b pb-3">
            <DialogTitle className="text-base sm:text-lg font-black text-navy flex items-center gap-2">
              <Send className="h-5 w-5 text-navy" />
              Withdraw Wallet Balance
            </DialogTitle>
            <p className="text-xs text-slate-500 mt-0.5">
              Transfer available wallet balance directly to your Bank Account or UPI.
            </p>
          </DialogHeader>

          {withdrawMsg && (
            <div
              className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${withdrawMsg.type === "success"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-red-50 text-red-800 border border-red-200"
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

          <form onSubmit={handleWithdrawSubmit} className="space-y-3.5 pt-2 text-xs">
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 flex items-center justify-between">
              <span className="font-bold text-slate-600">Withdrawable Balance:</span>
              <span className="font-black text-emerald-600 text-sm">
                {formatCurrency(availableBalance)}
              </span>
            </div>

            <div>
              <label className="font-bold text-navy block mb-1">Withdrawal Amount (₹) *</label>
              <input
                type="number"
                min="1"
                max={availableBalance}
                required
                placeholder={`Max ₹${availableBalance}`}
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl bg-slate-50 outline-none text-sm font-black text-navy focus:border-navy"
              />
            </div>

            <div>
              <label className="font-bold text-navy block mb-1">Payout Destination</label>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => setWithdrawMethod("upi")}
                  className={`py-2 rounded-xl font-extrabold border transition cursor-pointer ${withdrawMethod === "upi"
                    ? "bg-navy text-white border-navy"
                    : "bg-white text-slate-600 border-slate-200"
                    }`}
                >
                  Instant UPI
                </button>
                <button
                  type="button"
                  onClick={() => setWithdrawMethod("bank")}
                  className={`py-2 rounded-xl font-extrabold border transition cursor-pointer ${withdrawMethod === "bank"
                    ? "bg-navy text-white border-navy"
                    : "bg-white text-slate-600 border-slate-200"
                    }`}
                >
                  Bank Transfer
                </button>
              </div>

              {withdrawMethod === "upi" ? (
                <div>
                  <label className="font-bold text-slate-600 block mb-1">UPI ID (e.g. mobile@upi) *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 9848012345@ybl"
                    value={withdrawUpiId}
                    onChange={(e) => setWithdrawUpiId(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl bg-slate-50 outline-none font-bold text-navy"
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <div>
                    <label className="font-bold text-slate-600 block mb-0.5">Account Holder Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="Full Name as in Bank"
                      value={withdrawAccountName}
                      onChange={(e) => setWithdrawAccountName(e.target.value)}
                      className="w-full px-3 py-2 border rounded-xl bg-slate-50 outline-none font-bold text-navy"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-bold text-slate-600 block mb-0.5">Account Number *</label>
                      <input
                        type="text"
                        required
                        placeholder="Bank Account No."
                        value={withdrawAccountNumber}
                        onChange={(e) => setWithdrawAccountNumber(e.target.value)}
                        className="w-full px-3 py-2 border rounded-xl bg-slate-50 outline-none font-mono text-navy"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-600 block mb-0.5">IFSC Code *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. SBIN0001234"
                        value={withdrawIfsc}
                        onChange={(e) => setWithdrawIfsc(e.target.value)}
                        className="w-full px-3 py-2 border rounded-xl bg-slate-50 outline-none font-mono uppercase text-navy"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="font-bold text-slate-600 block mb-1">Remarks / Note (Optional)</label>
              <input
                type="text"
                placeholder="Reason or notes..."
                value={withdrawNote}
                onChange={(e) => setWithdrawNote(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl bg-slate-50 outline-none"
              />
            </div>

            <div className="pt-2 flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1 rounded-xl py-2.5 text-xs"
                onClick={() => setWithdrawOpen(false)}
              >
                Cancel
              </Button>

              <Button
                type="submit"
                disabled={submittingWithdraw}
                className="flex-1 bg-navy hover:bg-navy/90 text-white font-extrabold rounded-xl py-2.5 text-xs border-none shadow-md"
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
