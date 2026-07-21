// src/pages/Wallet.tsx — Module 8: Wallet, Rewards, Cashback & Referral
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Wallet as WalletIcon,
  Star,
  Users,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Gift,
  ShoppingBag,
  Award,
  Trophy,
  Copy,
  Share2,
  QrCode,
  ChevronRight,
  Loader2,
  Clock,
  CheckCircle,
  Coins,
  Crown,
  Shield,
  Target,
  Zap,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const API_BASE = "http://localhost:5500/api";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
type Transaction = {
  _id: string;
  type: string;
  description: string;
  amount: number;
  date: string;
  status: string;
};

type RewardEntry = {
  _id: string;
  action: string;
  description: string;
  points: number;
  type: string;
  date: string;
};

type LeaderboardEntry = {
  rank: number;
  name: string;
  avatar: string;
  referrals?: number;
  earnings?: number;
  orders?: number;
  spent?: number;
  team?: number;
};

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────
const TABS = [
  { key: "overview", label: "Overview", icon: "📊" },
  { key: "transactions", label: "Transactions", icon: "📋" },
  { key: "rewards", label: "Rewards", icon: "⭐" },
  { key: "referrals", label: "Referrals", icon: "👥" },
  { key: "achievements", label: "Achievements", icon: "🏆" },
  { key: "leaderboard", label: "Leaderboard", icon: "🏅" },
];

const EARN_POINTS = [
  { action: "Purchase Products", points: "1 point per ₹20", icon: <ShoppingBag className="w-5 h-5" />, color: "bg-blue-100 text-blue-600" },
  { action: "Book a Service", points: "1 point per ₹25", icon: <Zap className="w-5 h-5" />, color: "bg-purple-100 text-purple-600" },
  { action: "Complete a Course", points: "50 points", icon: <Award className="w-5 h-5" />, color: "bg-green-100 text-green-600" },
  { action: "Write a Review", points: "10 points", icon: <Star className="w-5 h-5" />, color: "bg-yellow-100 text-yellow-600" },
  { action: "Refer a Friend", points: "100 points", icon: <Users className="w-5 h-5" />, color: "bg-pink-100 text-pink-600" },
  { action: "Daily Login", points: "5 points/day", icon: <Target className="w-5 h-5" />, color: "bg-indigo-100 text-indigo-600" },
  { action: "Complete Profile", points: "50 points", icon: <Shield className="w-5 h-5" />, color: "bg-orange-100 text-orange-600" },
];

const REDEEM_OPTIONS = [
  { title: "Wallet Credit", desc: "Convert points to wallet balance", rate: "100 pts = ₹100", icon: <WalletIcon className="w-5 h-5" /> },
  { title: "Discount Coupons", desc: "Get exclusive discount codes", rate: "200 pts = ₹250 coupon", icon: <Gift className="w-5 h-5" /> },
  { title: "Free Delivery", desc: "Waive delivery charges", rate: "50 pts = Free delivery", icon: <ShoppingBag className="w-5 h-5" /> },
  { title: "Premium Benefits", desc: "Unlock premium features", rate: "500 pts = 1 month", icon: <Crown className="w-5 h-5" /> },
];

const ACHIEVEMENTS = [
  { tier: "Bronze", icon: "🥉", color: "from-orange-200 to-orange-300", min: 0, benefits: ["Basic cashback", "Standard delivery"] },
  { tier: "Silver", icon: "🥈", color: "from-gray-200 to-gray-400", min: 500, benefits: ["2% cashback", "Priority support", "Free delivery on ₹499+"] },
  { tier: "Gold", icon: "🥇", color: "from-yellow-200 to-yellow-400", min: 2000, benefits: ["5% cashback", "Express delivery", "Early access to deals"] },
  { tier: "Platinum", icon: "💎", color: "from-blue-200 to-blue-400", min: 5000, benefits: ["7% cashback", "Free delivery", "Exclusive offers", "Dedicated support"] },
  { tier: "Diamond", icon: "👑", color: "from-purple-300 to-purple-500", min: 15000, benefits: ["10% cashback", "Free delivery", "VIP deals", "Personal account manager"] },
];

const TXN_FILTER_TABS = [
  { key: "all", label: "All" },
  { key: "today", label: "Today" },
  { key: "week", label: "This Week" },
  { key: "month", label: "This Month" },
];

const TXN_TYPE_ICONS: Record<string, { icon: any; color: string }> = {
  cashback: { icon: <TrendingUp className="w-4 h-4" />, color: "text-green-600 bg-green-50" },
  referral: { icon: <Users className="w-4 h-4" />, color: "text-blue-600 bg-blue-50" },
  order_payment: { icon: <ShoppingBag className="w-4 h-4" />, color: "text-red-600 bg-red-50" },
  refund: { icon: <ArrowDownRight className="w-4 h-4" />, color: "text-purple-600 bg-purple-50" },
  reward_redeem: { icon: <Star className="w-4 h-4" />, color: "text-yellow-600 bg-yellow-50" },
  manual_credit: { icon: <Gift className="w-4 h-4" />, color: "text-pink-600 bg-pink-50" },
};

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
const formatCurrency = (v: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 0 }).format(v);
const formatDate = (d: string) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

const getAuth = () => {
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const token = localStorage.getItem("token");
  return { user, token };
};

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────
const WalletPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  // Balances
  const [walletBalance, setWalletBalance] = useState(0);
  const [rewardPoints, setRewardPoints] = useState(0);
  const [referralEarnings, setReferralEarnings] = useState(0);
  const [pendingEarnings, setPendingEarnings] = useState(0);
  const [lifetimeEarnings, setLifetimeEarnings] = useState(0);
  const [cashbackBalance, setCashbackBalance] = useState(0);

  const [challenges, setChallenges] = useState([
    { id: "chal-1", title: "🏪 Local Store Supporter", desc: "Order 3 times from local merchants", progress: 2, target: 3, reward: 150, claimed: false },
    { id: "chal-2", title: "👥 Network Builder", desc: "Invite 2 new users using your referral code", progress: 0, target: 2, reward: 300, claimed: false },
    { id: "chal-3", title: "🎟️ Smart Shopper", desc: "Apply dynamic coupon codes on checkout", progress: 1, target: 1, reward: 100, claimed: false }
  ]);

  const handleClaimChallenge = (id: string, reward: number) => {
    setChallenges(prev => prev.map(c => c.id === id ? { ...c, claimed: true } : c));
    setRewardPoints(pts => pts + reward);
    alert(`Congratulations! You earned ${reward} Loyalty Points!`);
  };

  // Transaction
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [txnFilter, setTxnFilter] = useState("all");

  // Rewards
  const [rewardHistory, setRewardHistory] = useState<RewardEntry[]>([]);

  // Referral
  const [refCode, setRefCode] = useState("APEXBEE123");
  const [copied, setCopied] = useState(false);
  const [refStats, setRefStats] = useState<any>(null);

  // Leaderboard
  const [leaderboard, setLeaderboard] = useState<any>(null);

  // QR Dialog
  const [showQR, setShowQR] = useState(false);

  // Add Money Dialog states
  const [showAddMoney, setShowAddMoney] = useState(false);
  const [addAmount, setAddAmount] = useState("");
  const [depositing, setDepositing] = useState(false);
  const [depositError, setDepositError] = useState("");

  const handleDeposit = async () => {
    setDepositing(true);
    setDepositError("");
    const { user, token } = getAuth();
    if (!user || !token) { navigate("/login"); return; }

    try {
      const res = await fetch(`${API_BASE}/wallet/add-funds`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ amount: Number(addAmount) })
      });

      const data = await res.json();
      if (!res.ok) {
        setDepositError(data?.message || "Failed to add funds. Please try again.");
        setDepositing(false);
        return;
      }

      // Success!
      setShowAddMoney(false);
      setAddAmount("");
      // Refresh balance and transaction list
      fetchAll();
    } catch (err: any) {
      setDepositError(err.message || "An error occurred. Please try again.");
    } finally {
      setDepositing(false);
    }
  };

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const { user, token } = getAuth();
    if (!user || !token) { navigate("/login"); return; }
    const uid = user._id || user.id;
    const headers = { Authorization: `Bearer ${token}` };

    try {
      const [walletRes, rewardsRes, refStatsRes, refCodeRes, txnRes, rewardHistRes, leaderRes] = await Promise.all([
        fetch(`${API_BASE}/user/wallet/${uid}`, { headers }),
        fetch(`${API_BASE}/user/rewards/${uid}`, { headers }),
        fetch(`${API_BASE}/referrals/stats`, { headers }),
        fetch(`${API_BASE}/referrals/code`, { headers }),
        fetch(`${API_BASE}/wallet/transactions`, { headers }),
        fetch(`${API_BASE}/rewards/history`, { headers }),
        fetch(`${API_BASE}/leaderboard`, { headers }),
      ]);

      const walletData = await walletRes.json();
      const rewardsData = await rewardsRes.json();
      const refStatsData = await refStatsRes.json();
      const refCodeData = await refCodeRes.json();
      const txnData = await txnRes.json();
      const rewardHistData = await rewardHistRes.json();
      const leaderData = await leaderRes.json();

      setWalletBalance(walletData?.walletBalance ?? 0);
      setRewardPoints(rewardsData?.rewardPoints ?? 0);
      setRefStats(refStatsData?.stats || refStatsData);
      setRefCode(refCodeData?.referralCode || refCodeData?.code || "APEXBEE123");
      const txnList = txnData?.transactions || [];
      setTransactions(txnList);
      setRewardHistory(rewardHistData?.history || []);
      setLeaderboard(leaderData?.leaderboard || null);

      const statsObj = refStatsData?.stats || {};
      setReferralEarnings(statsObj.totalEarned ?? 0);
      setPendingEarnings(statsObj.pendingBalance ?? 0);
      setLifetimeEarnings(statsObj.totalEarned ?? 0);
      setCashbackBalance(txnList.filter((t: any) => t.type === "cashback" && t.amount > 0).reduce((s: number, t: any) => s + t.amount, 0) || 0);
    } catch (e) {
      console.error("Wallet fetch error:", e);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const copyRefCode = () => {
    navigator.clipboard.writeText(`https://apexbee.in/register?ref=${refCode}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareRef = (platform: string) => {
    const link = `https://apexbee.in/register?ref=${refCode}`;
    const msg = `Join ApexBee and start earning! Use my code ${refCode}: ${link}`;
    const urls: Record<string, string> = {
      whatsapp: `https://wa.me/?text=${encodeURIComponent(msg)}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(msg)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`,
    };
    window.open(urls[platform], "_blank");
  };

  // Filter transactions
  const filteredTxns = transactions.filter((t) => {
    if (txnFilter === "all") return true;
    const d = new Date(t.date);
    const now = new Date();
    if (txnFilter === "today") return d.toDateString() === now.toDateString();
    if (txnFilter === "week") return now.getTime() - d.getTime() < 7 * 86400000;
    if (txnFilter === "month") return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    return true;
  });

  // Current achievement tier
  const currentTier = ACHIEVEMENTS.slice().reverse().find((a) => lifetimeEarnings >= a.min) || ACHIEVEMENTS[0];

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex justify-center items-center h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-navy" /></div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <h1 className="text-3xl font-bold text-navy mb-6">💰 Wallet & Rewards</h1>

        {/* ── Tab Navigation ── */}
        <div className="flex gap-1 overflow-x-auto pb-2 mb-6 border-b scrollbar-none">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-t-lg text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0 ${activeTab === tab.key ? "bg-navy text-white" : "text-muted-foreground hover:text-navy hover:bg-navy/5"
                }`}
            >
              <span>{tab.icon}</span> {tab.label}
            </button>
          ))}
        </div>

        {/* ════════════════════════════════════════════ */}
        {/* OVERVIEW TAB */}
        {/* ════════════════════════════════════════════ */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Balance Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { label: "Available Balance", value: formatCurrency(walletBalance), icon: <WalletIcon className="w-5 h-5" />, color: "from-navy to-blue-700", text: "text-white" },
                { label: "Cashback", value: formatCurrency(cashbackBalance), icon: <TrendingUp className="w-5 h-5" />, color: "from-green-500 to-emerald-600", text: "text-white" },
                { label: "Reward Points", value: `${rewardPoints} pts`, icon: <Star className="w-5 h-5" />, color: "from-yellow-400 to-orange-500", text: "text-white" },
                { label: "Referral Earnings", value: formatCurrency(referralEarnings), icon: <Users className="w-5 h-5" />, color: "from-purple-500 to-indigo-600", text: "text-white" },
                { label: "Pending", value: formatCurrency(pendingEarnings), icon: <Clock className="w-5 h-5" />, color: "from-orange-400 to-red-500", text: "text-white" },
                { label: "Lifetime", value: formatCurrency(lifetimeEarnings), icon: <Trophy className="w-5 h-5" />, color: "from-pink-500 to-rose-600", text: "text-white" },
              ].map((card, i) => (
                <div key={i} className={`bg-gradient-to-br ${card.color} rounded-xl p-4 ${card.text} shadow-sm flex flex-col justify-between`}>
                  <div>
                    <div className="flex items-center gap-2 opacity-80 mb-2">{card.icon}<span className="text-xs font-medium">{card.label}</span></div>
                    <p className="text-xl font-bold">{card.value}</p>
                  </div>
                  {i === 0 && (
                    <button
                      onClick={() => setShowAddMoney(true)}
                      className="mt-3 w-full bg-white/20 hover:bg-white/30 text-white font-semibold text-xs py-1.5 px-3 rounded-lg transition-colors flex items-center justify-center gap-1"
                    >
                      Add Money
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Current Tier */}
            <Card className="border-2 border-yellow-300">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="text-4xl">{currentTier.icon}</div>
                <div className="flex-1">
                  <p className="font-bold text-navy text-lg">{currentTier.tier} Member</p>
                  <p className="text-sm text-muted-foreground">Current tier based on lifetime activity</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {currentTier.benefits.map((b, i) => (
                      <Badge key={i} className="bg-yellow-100 text-yellow-700 border-yellow-200 text-xs">{b}</Badge>
                    ))}
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => setActiveTab("achievements")}>
                  View All <ChevronRight className="w-3 h-3 ml-1" />
                </Button>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="grid sm:grid-cols-3 gap-3">
              <Button className="bg-navy hover:bg-navy/90 text-white h-auto py-3" onClick={() => setActiveTab("referrals")}>
                <Gift className="w-4 h-4 mr-2" /> Refer & Earn ₹500
              </Button>
              <Button variant="outline" className="h-auto py-3" onClick={() => setActiveTab("rewards")}>
                <Star className="w-4 h-4 mr-2" /> Redeem Points
              </Button>
              <Button variant="outline" className="h-auto py-3" onClick={() => setActiveTab("transactions")}>
                <TrendingUp className="w-4 h-4 mr-2" /> Transaction History
              </Button>
            </div>

            {/* Recent Transactions */}
            <Card>
              <CardContent className="p-5">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-navy">Recent Transactions</h3>
                  <button onClick={() => setActiveTab("transactions")} className="text-sm text-navy font-medium hover:underline">View All →</button>
                </div>
                <div className="space-y-3">
                  {transactions.slice(0, 5).map((txn) => {
                    const typeInfo = TXN_TYPE_ICONS[txn.type] || TXN_TYPE_ICONS.manual_credit;
                    return (
                      <div key={txn._id} className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center ${typeInfo.color}`}>{typeInfo.icon}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{txn.description}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(txn.date)}</p>
                        </div>
                        <span className={`text-sm font-bold ${txn.amount >= 0 ? "text-green-600" : "text-red-500"}`}>
                          {txn.amount >= 0 ? "+" : ""}{formatCurrency(txn.amount)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Gift Card Redemption */}
            <Card className="border-2 border-dashed border-pink-200 bg-gradient-to-r from-pink-50 to-purple-50">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-500 rounded-full flex items-center justify-center text-white">
                    <Gift className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-navy text-lg">Gift Cards</h3>
                    <p className="text-xs text-muted-foreground">Redeem or purchase gift cards</p>
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="bg-white rounded-xl p-4 border shadow-sm">
                    <p className="text-xs font-bold text-navy mb-2">🎁 Redeem Gift Card</p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Enter gift card code"
                        className="flex-1 border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-pink-300 focus:border-pink-400 outline-none"
                      />
                      <Button size="sm" className="bg-pink-500 hover:bg-pink-600 text-white text-xs px-4">
                        Redeem
                      </Button>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl p-4 border shadow-sm">
                    <p className="text-xs font-bold text-navy mb-2">🛍 Buy Gift Card</p>
                    <div className="flex gap-2">
                      {[250, 500, 1000, 2000].map(amt => (
                        <button key={amt} className="flex-1 border rounded-lg py-2 text-xs font-bold text-navy hover:bg-pink-50 hover:border-pink-300 transition-colors">
                          ₹{amt}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cashback Ledger Summary */}
            <Card>
              <CardContent className="p-5">
                <h3 className="font-bold text-navy mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-600" /> Cashback Ledger
                </h3>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-green-50 rounded-xl p-4">
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(cashbackBalance)}</p>
                    <p className="text-xs text-muted-foreground mt-1">Available Cashback</p>
                  </div>
                  <div className="bg-blue-50 rounded-xl p-4">
                    <p className="text-2xl font-bold text-blue-600">{formatCurrency(pendingEarnings)}</p>
                    <p className="text-xs text-muted-foreground mt-1">Pending Credits</p>
                  </div>
                  <div className="bg-purple-50 rounded-xl p-4">
                    <p className="text-2xl font-bold text-purple-600">{formatCurrency(lifetimeEarnings)}</p>
                    <p className="text-xs text-muted-foreground mt-1">Total Earned</p>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p className="text-xs font-medium text-yellow-800">💡 <strong>Tip:</strong> Earn up to 10% cashback on every order when you reach Diamond tier!</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ════════════════════════════════════════════ */}
        {/* TRANSACTIONS TAB */}
        {/* ════════════════════════════════════════════ */}
        {activeTab === "transactions" && (
          <div className="space-y-4">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {TXN_FILTER_TABS.map((f) => (
                <button key={f.key} onClick={() => setTxnFilter(f.key)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors flex-shrink-0 ${txnFilter === f.key ? "bg-navy text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                >{f.label}</button>
              ))}
            </div>
            {filteredTxns.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <WalletIcon className="w-16 h-16 mx-auto opacity-30 mb-3" />
                <p>No transactions found for this period.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredTxns.map((txn) => {
                  const typeInfo = TXN_TYPE_ICONS[txn.type] || TXN_TYPE_ICONS.manual_credit;
                  return (
                    <Card key={txn._id}>
                      <CardContent className="p-4 flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${typeInfo.color}`}>{typeInfo.icon}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{txn.description}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(txn.date)} • <span className="capitalize">{txn.type.replace("_", " ")}</span></p>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold ${txn.amount >= 0 ? "text-green-600" : "text-red-500"}`}>
                            {txn.amount >= 0 ? "+" : ""}{formatCurrency(txn.amount)}
                          </p>
                          <Badge className={`text-xs ${txn.status === "credited" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{txn.status}</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════ */}
        {/* REWARDS TAB */}
        {/* ════════════════════════════════════════════ */}
        {activeTab === "rewards" && (
          <div className="space-y-6">
            {/* Points Balance */}
            <Card className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0">
              <CardContent className="p-6 text-center">
                <Star className="w-12 h-12 mx-auto mb-2 opacity-80" />
                <p className="text-4xl font-bold">{rewardPoints}</p>
                <p className="text-sm opacity-80 mt-1">Reward Points Available</p>
                <p className="text-xs opacity-60 mt-1">= {formatCurrency(rewardPoints)}</p>
              </CardContent>
            </Card>

            {/* Earn Points */}
            <div>
              <h3 className="font-semibold text-navy text-lg mb-3">🎯 Ways to Earn Points</h3>
              <div className="grid sm:grid-cols-2 gap-3">
                {EARN_POINTS.map((ep, i) => (
                  <Card key={i}>
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${ep.color}`}>{ep.icon}</div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{ep.action}</p>
                        <p className="text-xs text-muted-foreground">{ep.points}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Redeem Options */}
            <div>
              <h3 className="font-semibold text-navy text-lg mb-3">🎁 Redeem Points</h3>
              <div className="grid sm:grid-cols-2 gap-3">
                {REDEEM_OPTIONS.map((opt, i) => (
                  <Card key={i} className="hover:border-yellow-300 transition-colors cursor-pointer">
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-yellow-100 text-yellow-600 flex items-center justify-center">{opt.icon}</div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{opt.title}</p>
                        <p className="text-xs text-muted-foreground">{opt.desc}</p>
                        <p className="text-xs text-navy font-medium mt-0.5">{opt.rate}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Points History */}
            <div>
              <h3 className="font-semibold text-navy text-lg mb-3">📜 Points History</h3>
              <div className="space-y-2">
                {rewardHistory.map((rh) => (
                  <Card key={rh._id}>
                    <CardContent className="p-3 flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${rh.type === "earned" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}>
                        {rh.type === "earned" ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{rh.action}</p>
                        <p className="text-xs text-muted-foreground">{rh.description} • {formatDate(rh.date)}</p>
                      </div>
                      <span className={`font-bold text-sm ${rh.points >= 0 ? "text-green-600" : "text-red-500"}`}>
                        {rh.points >= 0 ? "+" : ""}{rh.points} pts
                      </span>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════ */}
        {/* REFERRALS TAB */}
        {/* ════════════════════════════════════════════ */}
        {activeTab === "referrals" && (
          <div className="space-y-6">
            {/* Referral Code Card */}
            <Card className="bg-gradient-to-r from-navy to-blue-700 text-white border-0">
              <CardContent className="p-6">
                <div className="text-center mb-4">
                  <Gift className="w-12 h-12 mx-auto mb-2 opacity-80" />
                  <h2 className="text-2xl font-bold">Refer & Earn Up to ₹500!</h2>
                  <p className="text-sm opacity-80 mt-1">Share your code and earn when friends join & shop</p>
                </div>
                <div className="bg-white/10 rounded-xl p-4 text-center">
                  <p className="text-xs opacity-60 uppercase tracking-wider mb-1">Your Referral Code</p>
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-3xl font-bold tracking-widest">{refCode}</span>
                    <button onClick={copyRefCode} className="bg-white/20 hover:bg-white/30 rounded-lg p-2 transition-colors">
                      {copied ? <CheckCircle className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                    </button>
                  </div>
                  <p className="text-xs opacity-60 mt-2">apexbee.in/register?ref={refCode}</p>
                </div>

                {/* Share Buttons */}
                <div className="flex justify-center gap-3 mt-4">
                  {[
                    { name: "WhatsApp", key: "whatsapp", emoji: "💬" },
                    { name: "Telegram", key: "telegram", emoji: "✈️" },
                    { name: "Facebook", key: "facebook", emoji: "📘" },
                  ].map((p) => (
                    <button key={p.key} onClick={() => shareRef(p.key)}
                      className="bg-white/10 hover:bg-white/20 rounded-lg px-4 py-2 text-sm flex items-center gap-1.5 transition-colors">
                      <span>{p.emoji}</span> {p.name}
                    </button>
                  ))}
                  <button onClick={() => setShowQR(true)}
                    className="bg-white/10 hover:bg-white/20 rounded-lg px-4 py-2 text-sm flex items-center gap-1.5 transition-colors">
                    <QrCode className="w-4 h-4" /> QR
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* Referral Stats */}
            <div className="grid sm:grid-cols-3 gap-3">
              {[
                { label: "Total Referrals", value: refStats?.totalReferrals ?? 0, color: "text-navy" },
                { label: "Successful", value: refStats?.completedReferrals ?? 0, color: "text-green-600" },
                { label: "Pending", value: refStats?.pendingReferrals ?? 0, color: "text-orange-500" },
              ].map((s, i) => (
                <Card key={i}>
                  <CardContent className="p-4 text-center">
                    <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Referral Levels */}
            <Card>
              <CardContent className="p-5">
                <h3 className="font-semibold text-navy mb-4">📊 Referral Network</h3>
                <div className="space-y-4">
                  {[
                    { level: "Level 1 – Direct Referrals", desc: "Friends you invited directly", total: refStats?.totalDirectReferrals ?? 0, completed: refStats?.completedDirectReferrals ?? 0, earnings: refStats?.level1?.totalEarned ?? 0 },
                    { level: "Level 2 – Friend's Referrals", desc: "Friends of your friends", total: refStats?.totalIndirectReferrals ?? 0, completed: refStats?.completedIndirectReferrals ?? 0, earnings: refStats?.level2?.totalEarned ?? 0 },
                    { level: "Level 3 – Extended Network", desc: "Deep network referrals", total: refStats?.totalLevel3Referrals ?? 0, completed: refStats?.completedLevel3Referrals ?? 0, earnings: refStats?.level3?.totalEarned ?? 0 },
                  ].map((lvl, i) => (
                    <div key={i} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-start mb-1">
                        <div>
                          <p className="font-medium text-sm">{lvl.level}</p>
                          <p className="text-xs text-muted-foreground">{lvl.desc}</p>
                        </div>
                        <span className="text-sm font-bold text-navy">{formatCurrency(lvl.earnings)}</span>
                      </div>
                      <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                        <span>Total: <strong className="text-navy">{lvl.total}</strong></span>
                        <span>Active: <strong className="text-green-600">{lvl.completed}</strong></span>
                        <span>Pending: <strong className="text-orange-500">{lvl.total - lvl.completed}</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Button className="w-full bg-navy hover:bg-navy/90 text-white" onClick={() => navigate("/referrals")}>
              <Users className="w-4 h-4 mr-2" /> View Full Referral Dashboard
            </Button>
          </div>
        )}

        {/* ════════════════════════════════════════════ */}
        {/* ACHIEVEMENTS TAB */}
        {/* ════════════════════════════════════════════ */}
        {activeTab === "achievements" && (
          <div className="space-y-6 text-left">
            {/* Loyalty Levels Progress Card */}
            <Card className="bg-gradient-to-r from-navy to-blue-900 text-white border-0 overflow-hidden relative shadow-premium">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-bold text-accent uppercase tracking-wider">ApexBee Loyalty Club</span>
                    <h3 className="text-xl font-extrabold mt-1">Level 4: {currentTier.tier} Member</h3>
                    <p className="text-xs text-white/80 mt-1">Earn points through shopping, services, and downline MLM referrals.</p>
                  </div>
                  <span className="text-3xl animate-bounce">🏆</span>
                </div>

                {/* Progress Bar */}
                <div className="mt-6 space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span>2,450 XP Points</span>
                    <span className="opacity-90">5,000 XP to Platinum</span>
                  </div>
                  <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full bg-accent rounded-full transition-all duration-500" style={{ width: "49%" }} />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-6 text-center border-t border-white/10 pt-4 text-xs">
                  <div>
                    <p className="opacity-75 text-[9px] uppercase">Cashback Rate</p>
                    <p className="font-extrabold text-sm mt-0.5">5% Direct</p>
                  </div>
                  <div>
                    <p className="opacity-75 text-[9px] uppercase">Active Referrals</p>
                    <p className="font-extrabold text-sm mt-0.5">14 Members</p>
                  </div>
                  <div>
                    <p className="opacity-75 text-[9px] uppercase">Tier Reward</p>
                    <p className="font-extrabold text-sm mt-0.5">Free Delivery</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Monthly Challenges Checklist */}
            <Card className="border border-slate-100 shadow-premium">
              <CardContent className="p-5 space-y-4">
                <div className="flex justify-between items-center border-b pb-3">
                  <div>
                    <h4 className="font-extrabold text-navy text-sm">🎯 Monthly Challenges</h4>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Complete goals to unlock bonus wallet points.</p>
                  </div>
                  <Badge className="bg-amber-100 text-amber-800 font-bold text-[10px] border-none">July Goals</Badge>
                </div>

                <div className="space-y-4">
                  {challenges.map((c) => {
                    const isCompleted = c.progress >= c.target;
                    const pct = Math.min(100, Math.round((c.progress / c.target) * 100));
                    return (
                      <div key={c.id} className="p-3 bg-slate-50 border rounded-xl flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h5 className="font-bold text-navy text-xs leading-none">{c.title}</h5>
                          <p className="text-[10px] text-muted-foreground mt-1 leading-normal">{c.desc}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                              <div className="h-full bg-navy rounded-full transition-all duration-300" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-[9px] font-black text-slate-500 shrink-0">{c.progress}/{c.target}</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0 flex flex-col items-end gap-1.5">
                          <span className="text-[10px] text-green-700 bg-green-50 border border-green-100 px-2 py-0.5 rounded-full font-bold">+{c.reward} pts</span>
                          {c.claimed ? (
                            <span className="text-[9px] font-bold text-slate-400">✓ Claimed</span>
                          ) : isCompleted ? (
                            <button
                              onClick={() => handleClaimChallenge(c.id, c.reward)}
                              className="text-[9px] font-black bg-accent hover:bg-accent/95 text-white px-3 py-1 rounded-lg border-none cursor-pointer shadow-sm animate-pulse transition active:scale-95"
                            >
                              Claim
                            </button>
                          ) : (
                            <span className="text-[9px] font-bold text-slate-400">In Progress</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Achievements details */}
            <div className="space-y-3.5">
              <h4 className="font-extrabold text-navy text-sm">Achievements Milestone Tiers</h4>
              {ACHIEVEMENTS.map((ach, i) => {
                const unlocked = lifetimeEarnings >= ach.min;
                const isCurrent = ach.tier === currentTier.tier;
                return (
                  <Card key={i} className={`${isCurrent ? "border-2 border-yellow-400 shadow-md" : unlocked ? "border-green-200" : "opacity-60"}`}>
                    <CardContent className="p-5 flex items-start gap-4">
                      <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${ach.color} flex items-center justify-center text-2xl flex-shrink-0`}>
                        {ach.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-navy text-xs">{ach.tier} Member</h4>
                          {isCurrent && <Badge className="bg-yellow-100 text-yellow-700 text-[10px] font-bold border-none">Current</Badge>}
                          {unlocked && !isCurrent && <Badge className="bg-green-100 text-green-700 text-[10px] font-bold border-none">Unlocked</Badge>}
                          {!unlocked && <Badge className="bg-gray-100 text-gray-500 text-[10px] font-bold border-none">Locked</Badge>}
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5">Requires ₹{ach.min.toLocaleString()} lifetime activity</p>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {ach.benefits.map((b, j) => (
                            <span key={j} className="text-[9px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{b}</span>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════ */}
        {/* LEADERBOARD TAB */}
        {/* ════════════════════════════════════════════ */}
        {activeTab === "leaderboard" && leaderboard && (
          <div className="space-y-6">
            {[
              { title: "🏆 Top Referrers", data: leaderboard.topReferrers, metricLabel: "referrals", earningsLabel: "earnings" },
              { title: "🛒 Top Customers", data: leaderboard.topCustomers, metricLabel: "orders", earningsLabel: "spent" },
              { title: "🤝 Top Business Partners", data: leaderboard.topPartners, metricLabel: "team", earningsLabel: "earnings" },
            ].map((section, si) => (
              <Card key={si}>
                <CardContent className="p-5">
                  <h3 className="font-semibold text-navy mb-4">{section.title}</h3>
                  <div className="space-y-3">
                    {(section.data || []).map((entry: any) => (
                      <div key={entry.rank} className={`flex items-center gap-3 p-3 rounded-lg ${entry.rank <= 3 ? "bg-yellow-50/50" : "bg-gray-50"}`}>
                        <span className="text-2xl w-8 text-center flex-shrink-0">{entry.avatar}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{entry.name}</p>
                          <p className="text-xs text-muted-foreground capitalize">{(entry as any)[section.metricLabel]} {section.metricLabel}</p>
                        </div>
                        <span className="font-bold text-sm text-navy">{formatCurrency((entry as any)[section.earningsLabel])}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* QR Dialog */}
      <Dialog open={showQR} onOpenChange={setShowQR}>
        <DialogContent className="sm:max-w-sm text-center">
          <DialogHeader><DialogTitle>Your Referral QR Code</DialogTitle></DialogHeader>
          <div className="p-6 bg-white rounded-xl border-2 border-dashed border-navy/20 mx-auto">
            <div className="w-48 h-48 mx-auto bg-gray-100 rounded-lg flex items-center justify-center">
              <QrCode className="w-24 h-24 text-navy/40" />
            </div>
            <p className="text-sm text-muted-foreground mt-3">Scan to join with code <strong className="text-navy">{refCode}</strong></p>
          </div>
          <p className="text-xs text-muted-foreground">QR code generation will be available when the app goes live</p>
        </DialogContent>
      </Dialog>

      {/* Add Money Dialog */}
      <Dialog open={showAddMoney} onOpenChange={setShowAddMoney}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-navy font-bold flex items-center gap-2">
              <span>💰</span> Add Money to Wallet
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Enter Amount (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-slate-400 font-bold text-lg">₹</span>
                <input
                  type="number"
                  placeholder="0.00"
                  value={addAmount}
                  onChange={(e) => setAddAmount(e.target.value)}
                  className="pl-8 pr-4 py-2 w-full border border-slate-200 rounded-lg text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-navy focus:border-transparent"
                />
              </div>
            </div>

            {/* Quick selectors */}
            <div className="grid grid-cols-4 gap-2">
              {[100, 500, 1000, 2000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setAddAmount(String(amt))}
                  className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-navy font-medium text-xs rounded-lg transition-colors border border-transparent hover:border-slate-300"
                >
                  +₹{amt}
                </button>
              ))}
            </div>

            {depositError && (
              <p className="text-xs text-red-500 font-medium">{depositError}</p>
            )}
          </div>

          <div className="flex gap-3 justify-end mt-4">
            <Button
              variant="outline"
              disabled={depositing}
              onClick={() => {
                setShowAddMoney(false);
                setAddAmount("");
                setDepositError("");
              }}
            >
              Cancel
            </Button>
            <Button
              className="bg-navy hover:bg-navy/90 text-white flex items-center gap-1.5"
              disabled={depositing || !addAmount || Number(addAmount) <= 0}
              onClick={handleDeposit}
            >
              {depositing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Add Money"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default WalletPage;

