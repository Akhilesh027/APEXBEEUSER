import { useState, useEffect, useMemo } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import {
  Copy,
  Share2,
  Gift,
  Users,
  Loader2,
  Wallet,
  TrendingUp,
  Award,
  Coins,
  UserPlus,
  BarChart,
  Network,
  User,
  Landmark,
  IndianRupee,
  FileText,
  ChevronDown,
  ChevronUp,
} from "lucide-react";


import { Eye, EyeOff } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface ReferralStats {
  totalReferrals: number;
  completedReferrals: number;
  pendingReferrals: number;
  totalEarnings: number;
  walletBalance: number;

  totalDirectReferrals: number;
  totalIndirectReferrals: number;
  totalLevel3Referrals: number;
  completedDirectReferrals: number;
  completedIndirectReferrals: number;
  completedLevel3Referrals: number;
  pendingDirectReferrals: number;
  pendingIndirectReferrals: number;
  pendingLevel3Referrals: number;

  directEarnings: number;
  indirectEarnings: number;
  level3Earnings: number;

  signupBonusTotal: number;
  purchaseCommissionTotal: number;

  userLevel: number;
  hasParent: boolean;

  membershipIncentives?: number;
  vendorIncentives?: number;
  franchiserIncentives?: number;
  firstPurchaseIncentives?: number;
  level1FirstPurchaseCommission?: number;

  level0Count?: number;
  level1Count?: number;
  level2Count?: number;
  level3Count?: number;

  parentInfo?: {
    name: string;
    referralCode: string;
    _id?: string;
  };

  recentCommissionsCount?: number;
  pendingCommissionsCount?: number;

  recentDirectReferrals?: Array<{
    name: string;
    email: string;
    joined: string;
  }>;

  networkStats?: {
    totalMembers: number;
    totalEarnings: number;
    levels: {
      level0?: number;
      level1?: number;
      level2?: number;
      level3?: number;
    };
  };

  /** ✅ NEW: Wallet split (for PDF rules: instant reduce + hold) */
  walletTotal?: number;
  walletHold?: number;
  walletAvailable?: number;

  signupBonus?: number;
  firstPurchaseCommission?: number;
  productCommission?: number;
  franchiseIncentives?: number;
  recurringCommissions?: number;
  totalEarned?: number;
  availableBalance?: number;
  pendingBalance?: number;
  withdrawnBalance?: number;
  level1?: {
    signupBonus: number;
    firstPurchaseCommission: number;
    productCommission: number;
    totalEarned: number;
  };
  level2?: {
    signupBonus: number;
    firstPurchaseCommission: number;
    productCommission: number;
    totalEarned: number;
  };
  level3?: {
    signupBonus: number;
    firstPurchaseCommission: number;
    productCommission: number;
    totalEarned: number;
  };
}

interface ReferralHistory {
  _id: string;
  referredUser: {
    name: string;
    email: string;
    phone?: string;
  };
  status: "pending" | "completed" | "credited";
  rewardAmount: number;
  createdAt: string;
  level?: number;
  levelName?: string;
  type?: string;
  commissionType?: string;
  orderDetails?: {
    orderNumber: string;
    total: number;
    paymentMethod?: string;
  };
  commissionDetails?: {
    amount: number;
    creditedAt?: string;
  };
  completedAt?: string;
}

interface CommissionHistory {
  _id: string;
  amount: number;
  commissionType: "signup" | "purchase" | "recurring";
  level: number;
  source: string;
  percentage?: number;
  createdAt: string;
  orderId?: {
    orderNumber: string;
    totalAmount: number;
    createdAt?: string;
  };
  status?: string;
  notes?: string;
}

interface EarningsSummary {
  summary: {
    timeframe: string;
    totals: {
      direct: number;
      indirect: number;
      level3?: number;
      signup: number;
      purchase: number;
      total: number;
    };
    breakdown: {
      byLevel: { level1: number; level2: number; level3?: number };
      byType: { signup: number; purchase: number };
    };
  };
  topReferrals: Array<{
    user: { name: string; email: string } | null;
    totalEarned: number;
    referralCount: number;
  }>;
}

interface NetworkData {
  user: {
    id: string;
    name: string;
    email: string;
    referralCode: string;
    referredBy: any;
    referralLevel: number;
  };
  network: any;
  stats: {
    totalMembers: number;
    totalEarnings: number;
    levels: Record<string, number>;
    level1Count: number;
    level2Count: number;
    level3Count: number;
  };
}

/** ✅ Bank details + withdrawals */
type BankDetails = {
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  ifsc: string;
  upiId?: string;
};

type WithdrawalStatus = "pending" | "approved" | "rejected" | "paid";

type WithdrawalRequest = {
  _id: string;
  amount: number;
  status: WithdrawalStatus;
  note?: string;
  createdAt: string;
  processedAt?: string;
  referenceId?: string;
  rejectReason?: string;
  // optional fee info if backend returns
  feePercent?: number;
  feeAmount?: number;
  netAmount?: number;
};

const API_BASE = "https://server.apexbee.in/api";

const Referrals = () => {
  const { toast } = useToast();

  const [referralCode, setReferralCode] = useState("");
  const [referralLink, setReferralLink] = useState("");

  const [stats, setStats] = useState<ReferralStats>({
    totalReferrals: 0,
    completedReferrals: 0,
    pendingReferrals: 0,
    totalEarnings: 0,
    walletBalance: 0,

    totalDirectReferrals: 0,
    totalIndirectReferrals: 0,
    totalLevel3Referrals: 0,

    completedDirectReferrals: 0,
    completedIndirectReferrals: 0,
    completedLevel3Referrals: 0,

    pendingDirectReferrals: 0,
    pendingIndirectReferrals: 0,
    pendingLevel3Referrals: 0,

    directEarnings: 0,
    indirectEarnings: 0,
    level3Earnings: 0,

    signupBonusTotal: 0,
    purchaseCommissionTotal: 0,

    userLevel: 0,
    hasParent: false,

    membershipIncentives: 0,
    vendorIncentives: 0,
    franchiserIncentives: 0,
    firstPurchaseIncentives: 0,

    level0Count: 0,
    level1Count: 0,
    level2Count: 0,
    level3Count: 0,

    // ✅ wallet split defaults
    walletTotal: 0,
    walletHold: 0,
    walletAvailable: 0,

    signupBonus: 0,
    firstPurchaseCommission: 0,
    productCommission: 0,
    membershipIncentives: 0,
    vendorIncentives: 0,
    franchiseIncentives: 0,
    recurringCommissions: 0,
    totalEarned: 0,
    availableBalance: 0,
    pendingBalance: 0,
    withdrawnBalance: 0,
    level1: { signupBonus: 0, firstPurchaseCommission: 0, productCommission: 0, totalEarned: 0 },
    level2: { signupBonus: 0, firstPurchaseCommission: 0, productCommission: 0, totalEarned: 0 },
    level3: { signupBonus: 0, firstPurchaseCommission: 0, productCommission: 0, totalEarned: 0 },
  });

  const [level1Users, setLevel1Users] = useState<any[]>([]);
  const [level2Users, setLevel2Users] = useState<any[]>([]);
  const [level3Users, setLevel3Users] = useState<any[]>([]);
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [referralLevelFilter, setReferralLevelFilter] = useState<string>("all");

  const [referralHistory, setReferralHistory] = useState<ReferralHistory[]>([]);
  const [commissionHistory, setCommissionHistory] = useState<CommissionHistory[]>([]);
  const [earningsSummary, setEarningsSummary] = useState<EarningsSummary | null>(null);
  const [networkData, setNetworkData] = useState<NetworkData | null>(null);

  const [loading, setLoading] = useState(true);
  const [copyLoading, setCopyLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [loadingSections, setLoadingSections] = useState({
    stats: true,
    history: true,
    commissions: true,
    earnings: false,
    network: false,
    withdraw: false,
  });

  /** ✅ withdraw states */
  const [bankDetails, setBankDetails] = useState<BankDetails>({
    accountHolderName: "",
    bankName: "",
    accountNumber: "",
    ifsc: "",
    upiId: "",
  });
  const [bankSaved, setBankSaved] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState<string>("");
  const [withdrawNote, setWithdrawNote] = useState<string>("");
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
// Add these state declarations at the top of your component
const [showAccountNumber, setShowAccountNumber] = useState(false);
const [showIfsc, setShowIfsc] = useState(false);
  const getToken = () => localStorage.getItem("token");

  const apiFetch = async (path: string, options: RequestInit = {}) => {
    const token = getToken();
    if (!token) throw new Error("No token");

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as any),
      Authorization: `Bearer ${token}`,
    };

    const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
    return res;
  };

  // Helper function to calculate APEX values
  const calculateApexValues = (s: ReferralStats) => {
    const apexWallet = (s.firstPurchaseCommission || 0) + (s.productCommission || 0);
    const apexBonus = (s.signupBonus || 0) + (s.level1?.firstPurchaseCommission || 0); // Signup Bonus + Level 1 First Purchase Commission only
    const totalEarnings = s.totalEarned || 0;
    return { apexWallet, apexBonus, totalEarnings };
  };

  const apexValues = calculateApexValues(stats);

  const calculateTotalIndirectReferrals = () => {
    return (stats.totalIndirectReferrals || 0) + (stats.totalLevel3Referrals || 0);
  };

  const calculateCompletedIndirectReferrals = () => {
    return (stats.completedIndirectReferrals || 0) + (stats.completedLevel3Referrals || 0);
  };

  const calculatePersonalNetworkSize = () => {
    return (
      (stats.totalDirectReferrals || 0) +
      (stats.totalIndirectReferrals || 0) +
      (stats.totalLevel3Referrals || 0)
    );
  };

  const calculatePurchaseCommissionsByLevel = (commissions: CommissionHistory[]) => {
    let l1 = 0;
    let l2 = 0;
    let l3 = 0;

    for (const c of commissions) {
      if (c.commissionType !== "purchase") continue;
      const amt = Number(c.amount || 0);
      if (!amt) continue;

      if (c.level === 1) l1 += amt;
      else if (c.level === 2) l2 += amt;
      else if (c.level === 3) l3 += amt;
    }

    return {
      level1: l1,
      level2: l2,
      level3: l3,
      total: l1 + l2 + l3,
    };
  };

  const calculateWishLinkIncentive = (commissions: CommissionHistory[]) => {
    const looksLikeWishLink = (c: CommissionHistory) => {
      const s = (c.source || "").toLowerCase();
      const n = (c.notes || "").toLowerCase();
      return (
        s.includes("wish") ||
        s.includes("wishlink") ||
        s.includes("wish-link") ||
        s.includes("wish_link") ||
        n.includes("wish") ||
        n.includes("wish link") ||
        n.includes("wish-link") ||
        n.includes("wish_link")
      );
    };

    return commissions
      .filter((c) => c.commissionType === "purchase" && looksLikeWishLink(c))
      .reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
  };

  const purchaseByLevel = useMemo(
    () => calculatePurchaseCommissionsByLevel(commissionHistory),
    [commissionHistory]
  );

  const wishLinkIncentive = useMemo(
    () => calculateWishLinkIncentive(commissionHistory),
    [commissionHistory]
  );

  const allReferredUsers = useMemo(() => {
    const list: any[] = [];
    level1Users.forEach(u => list.push({ ...u, levelNum: 1 }));
    level2Users.forEach(u => list.push({ ...u, levelNum: 2 }));
    level3Users.forEach(u => list.push({ ...u, levelNum: 3 }));
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [level1Users, level2Users, level3Users]);

  const filteredReferredUsers = useMemo(() => {
    if (referralLevelFilter === "all") return allReferredUsers;
    const lvl = parseInt(referralLevelFilter);
    return allReferredUsers.filter(u => u.levelNum === lvl);
  }, [allReferredUsers, referralLevelFilter]);

  /** ✅ PDF rule: 15% fee (TDS + PLATFORM FEE) */
  const WITHDRAW_FEE_PERCENT = 15;

  /** ✅ Wallet split (supports multiple backend shapes safely) */
  const walletTotal = useMemo(() => {
    return Number(stats.walletTotal ?? 0);
  }, [stats]);

  const walletHold = useMemo(() => {
    return Number(stats.walletHold ?? 0);
  }, [stats]);

  const walletAvailable = useMemo(() => {
    return Number(stats.walletAvailable ?? 0);
  }, [stats]);

  const calcWithdrawFee = (amount: number) => {
    const fee = Math.round((amount * WITHDRAW_FEE_PERCENT) / 100);
    const net = Math.max(0, amount - fee);
    return { fee, net };
  };

  useEffect(() => {
    fetchReferralData();
    fetchWithdrawData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchReferralData = async () => {
    try {
      setLoading(true);

      const token = getToken();
      if (!token) {
        toast({
          title: "Authentication required",
          description: "Please login to access referral features",
          variant: "destructive",
          className: "bg-red-500 text-white font-bold"
        });
        return;
      }

      // Fetch /referrals/me
      const codeRes = await fetch(`${API_BASE}/referrals/me`, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      if (!codeRes.ok) throw new Error("Failed to fetch referral code");
      const meData = await codeRes.json();
      setReferralCode(meData.referralCode);
      setReferralLink(window.location.origin + "/register?ref=" + meData.referralCode);

      // Fetch referral stats
      setLoadingSections((prev) => ({ ...prev, stats: true }));
      const statsRes = await fetch(`${API_BASE}/referrals/stats`, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      if (!statsRes.ok) throw new Error("Failed to fetch referral stats");
      const statsData = await statsRes.json();

      const total = Number(statsData.stats.availableBalance || 0);
      const hold = Number(statsData.stats.pendingBalance || 0);
      const withdrawn = Number(statsData.stats.withdrawnBalance || 0);
      const available = total;

      const statsObj = {
        ...statsData.stats,
        totalEarnings: statsData.stats.totalEarned,
        walletBalance: total,
        walletTotal: total + hold + withdrawn,
        walletHold: hold,
        walletAvailable: available,
        purchaseCommissionTotal: statsData.stats.firstPurchaseCommission + statsData.stats.productCommission,
        signupBonusTotal: statsData.stats.signupBonus,
        directEarnings: statsData.stats.level1.totalEarned,
        indirectEarnings: statsData.stats.level2.totalEarned,
        level3Earnings: statsData.stats.level3.totalEarned,
        franchiserIncentives: statsData.stats.franchiseIncentives,
      };
      setStats(statsObj);
      setLoadingSections((prev) => ({ ...prev, stats: false }));

      // Fetch referral history
      setLoadingSections((prev) => ({ ...prev, history: true }));
      const historyRes = await fetch(`${API_BASE}/referrals/history?limit=50`, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      if (historyRes.ok) {
        const historyData = await historyRes.json();
        const mapped = (historyData.history || []).map((h: any, idx: number) => ({
          _id: h._id || String(idx),
          referredUser: {
            name: h.user || "Unknown",
            email: ""
          },
          status: h.status === 'released' ? 'credited' : h.status === 'cancelled' ? 'completed' : h.status === 'placed' ? 'placed' : 'pending',
          rewardAmount: h.reward || 0,
          createdAt: h.createdAt || new Date().toISOString(),
          level: h.level
        }));
        setReferralHistory(mapped);
      }
      setLoadingSections((prev) => ({ ...prev, history: false }));

      // Fetch commission history
      setLoadingSections((prev) => ({ ...prev, commissions: true }));
      const commissionRes = await fetch(`${API_BASE}/user/commissions?limit=100`, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      if (commissionRes.ok) {
        const commissionData = await commissionRes.json();
        setCommissionHistory(commissionData.commissions || []);
      }
      setLoadingSections((prev) => ({ ...prev, commissions: false }));

      // Fetch earnings summary (optional)
      try {
        setLoadingSections((prev) => ({ ...prev, earnings: true }));
        const earningsRes = await fetch(`${API_BASE}/referrals/earnings-summary`, {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        });
        if (earningsRes.ok) {
          const earningsData = await earningsRes.json();
          setEarningsSummary(earningsData);
        }
      } catch {
        // ignore
      } finally {
        setLoadingSections((prev) => ({ ...prev, earnings: false }));
      }

      // Fetch network data
      try {
        setLoadingSections((prev) => ({ ...prev, network: true }));
        const networkRes = await fetch(`${API_BASE}/referrals/network?depth=3`, {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        });
        if (networkRes.ok) {
          const rawNetwork = await networkRes.json();
          if (rawNetwork.success) {
            const lvl1 = rawNetwork.level1 || [];
            const lvl2 = rawNetwork.level2 || [];
            const lvl3 = rawNetwork.level3 || [];

            setLevel1Users(lvl1);
            setLevel2Users(lvl2);
            setLevel3Users(lvl3);

            // Map level 2 into level 1 using referredBy (direct parent link)
            const lvl1Mapped = lvl1.map((u1: any) => {
              const children = lvl2.filter((u2: any) => String(u2.referredBy) === String(u1._id))
                .map((u2: any) => {
                  const grandchildren = lvl3.filter((u3: any) => String(u3.referredBy) === String(u2._id))
                    .map((u3: any) => ({
                      _id: u3._id,
                      name: u3.name,
                      email: u3.email,
                      referrals: []
                    }));
                  return {
                    _id: u2._id,
                    name: u2.name,
                    email: u2.email,
                    referrals: grandchildren
                  };
                });
              return {
                _id: u1._id,
                name: u1.name,
                email: u1.email,
                referrals: children
              };
            });

            const userObj = JSON.parse(localStorage.getItem('user') || '{}');
            const structuredNetwork = {
              user: {
                id: meData.userId || userObj.id || userObj._id || "",
                name: userObj.name || "You",
                email: userObj.email || "",
                referralCode: meData.referralCode,
                referredBy: meData.referredBy !== "APEXBEE" ? { name: meData.referredBy } : null,
                referralLevel: 1
              },
              network: {
                name: "You",
                email: userObj.email || "",
                referrals: lvl1Mapped
              },
              stats: {
                totalMembers: lvl1.length + lvl2.length + lvl3.length,
                totalEarnings: statsData.stats.totalEarned,
                levels: {
                  level1: lvl1.length,
                  level2: lvl2.length,
                  level3: lvl3.length
                },
                level1Count: lvl1.length,
                level2Count: lvl2.length,
                level3Count: lvl3.length
              }
            };
            setNetworkData(structuredNetwork as any);
          }
        }
      } catch (err) {
        console.error("Error building network tree:", err);
      } finally {
        setLoadingSections((prev) => ({ ...prev, network: false }));
      }
    } catch (error) {
      console.error("Error fetching referral data:", error);
      toast({
        title: "Error",
        description: "Failed to load referral data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  /** ✅ load bank details + withdrawals */
  const fetchWithdrawData = async () => {
    try {
      setLoadingSections((prev) => ({ ...prev, withdraw: true }));
      const token = getToken();
      if (!token) return;

      // bank details
      const bRes = await fetch(`${API_BASE}/user/bank-details`, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      if (bRes.ok) {
        const b = await bRes.json();
        if (b?.bankDetails) {
          setBankDetails({
            accountHolderName: b.bankDetails.accountHolderName || "",
            bankName: b.bankDetails.bankName || "",
            accountNumber: b.bankDetails.accountNumber || "",
            ifsc: b.bankDetails.ifsc || "",
            upiId: b.bankDetails.upiId || "",
          });
          setBankSaved(true);
        }
      }

      // withdrawals history
      // ✅ Do not pass userId from frontend. Backend should identify user from JWT middleware.
      const wRes = await apiFetch("/wallet/withdrawals");
      if (wRes.ok) {
        const w = await wRes.json();
        setWithdrawals(w?.withdrawals || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingSections((prev) => ({ ...prev, withdraw: false }));
    }
  };

  const copyToClipboard = async (text: string, type: "code" | "link") => {
    setCopyLoading(true);
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: type === "code" ? "Referral code copied to clipboard" : "Referral link copied to clipboard",
      });
    } catch {
      toast({
        title: "Copy failed",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    } finally {
      setCopyLoading(false);
    }
  };

  const shareReferral = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join me on this amazing platform!",
          text: `Use my referral code ${referralCode} to sign up and get benefits!`,
          url: referralLink,
        });
        toast({ title: "Shared!", description: "Referral link shared successfully" });
      } catch {
        // cancelled
      }
    } else {
      copyToClipboard(referralLink, "link");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "credited":
        return "bg-green-100 text-green-800 border-green-200";
      case "completed":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "placed":
        return "bg-orange-100 text-orange-800 border-orange-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "credited":
        return "Credited";
      case "completed":
        return "Order Completed";
      case "pending":
        return "Delivered (Holding)";
      case "placed":
        return "Order Placed";
      default:
        return status;
    }
  };

  const getTypeBadge = (type?: string, level?: number) => {
    if (!type && !level) return null;

    const finalType = type || (level === 1 ? "direct" : level === 2 ? "indirect" : "level3");

    const config: Record<string, { label: string; className: string }> = {
      "signup-bonus": { label: "Signup Bonus", className: "bg-purple-100 text-purple-800 border-purple-200" },
      "purchase-commission": { label: "Purchase Commission", className: "bg-blue-100 text-blue-800 border-blue-200" },
      signup: { label: "Signup", className: "bg-purple-100 text-purple-800 border-purple-200" },
      purchase: { label: "Purchase", className: "bg-blue-100 text-blue-800 border-blue-200" },
      direct: { label: "Direct", className: "bg-green-100 text-green-800 border-green-200" },
      indirect: { label: "Indirect", className: "bg-orange-100 text-orange-800 border-orange-200" },
      level3: { label: "Level 3", className: "bg-purple-100 text-purple-800 border-purple-200" },
    };

    const configItem = config[finalType] || {
      label: finalType,
      className: "bg-gray-100 text-gray-800 border-gray-200",
    };

    return <Badge className={`px-2 py-1 ${configItem.className}`}>{configItem.label}</Badge>;
  };

  const getCommissionTypeIcon = (type: string) => {
    switch (type) {
      case "signup":
        return <Award className="h-4 w-4" />;
      case "purchase":
        return <TrendingUp className="h-4 w-4" />;
      default:
        return <Coins className="h-4 w-4" />;
    }
  };

  const calculatePersonalDirectReferrals = () => stats.totalDirectReferrals || 0;
  const calculatePersonalIndirectReferrals = () => stats.totalIndirectReferrals || 0;
  const calculatePersonalLevel3Referrals = () => stats.totalLevel3Referrals || 0;

  const renderPersonalNetworkTree = (node: any, depth: number = 0) => {
    if (!node || depth > 3) return null;

    return (
      <div className={`${depth > 0 ? "ml-4 border-l-2 border-gray-200 pl-4" : ""}`}>
        <div
          className={`flex items-center gap-2 mb-2 p-2 rounded-lg border ${
            depth === 0 ? "bg-blue-50 border-blue-200" : "bg-white border-gray-200"
          }`}
        >
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center ${
              depth === 0 ? "bg-blue-100" : "bg-gray-100"
            }`}
          >
            {depth === 0 ? (
              <User className="h-4 w-4 text-blue-600" />
            ) : (
              <UserPlus className="h-4 w-4 text-blue-600" />
            )}
          </div>
          <div>
            <p className="font-medium text-sm">{node.name || "Unknown User"}</p>
            <p className="text-xs text-gray-500">{node.email || "No email"}</p>
          </div>
          <Badge className={`ml-auto ${depth === 0 ? "bg-blue-100 text-blue-800 hover:bg-blue-100" : ""}`}>
            {depth === 0 ? "You" : `Level ${depth}`}
          </Badge>
        </div>
        {node.referrals?.map((referral: any, index: number) => (
          <div key={index}>{renderPersonalNetworkTree(referral, depth + 1)}</div>
        ))}
      </div>
    );
  };

  const calculateCommissionTotals = () => {
    const totals = { signup: 0, purchase: 0, total: 0 };
    commissionHistory.forEach((commission) => {
      if (commission.commissionType === "signup") totals.signup += Number(commission.amount || 0);
      else if (commission.commissionType === "purchase") totals.purchase += Number(commission.amount || 0);
      totals.total += Number(commission.amount || 0);
    });
    return totals;
  };

  const commissionTotals = calculateCommissionTotals();

  const mainStatsCards = [
    {
      label: "ApexBee Bonus",
      value: `Rs. ${Math.round((stats.signupBonus || 0) + (stats.level1?.firstPurchaseCommission || 0))}`,
      icon: Award,
      description: "Signup + Level 1 First Purchase",
      color: "text-purple-600",
    },
    {
      label: "Total Earnings",
      value: `Rs. ${Math.round(stats.totalEarned || 0)}`,
      icon: Wallet,
      description: "All categories of earnings",
      color: "text-navy",
    },
    {
      label: "Wallet Available",
      value: `Rs. ${Math.round(walletAvailable)}`,
      icon: IndianRupee,
      description: "Available to withdraw",
      color: "text-green-700",
    },
    {
      label: "Wallet Hold",
      value: `Rs. ${Math.round(walletHold)}`,
      icon: IndianRupee,
      description: "Awaiting settlement",
      color: "text-amber-600",
    },
    {
      label: "Wallet Withdrawn",
      value: `Rs. ${Math.round(stats.withdrawnBalance || 0)}`,
      icon: Landmark,
      description: "Successfully withdrawn",
      color: "text-emerald-700",
    },
    {
      label: "Network Size",
      value: calculatePersonalNetworkSize().toString(),
      icon: Network,
      description: "Level 1 + Level 2 + Level 3",
      color: "text-blue-600",
    },
  ];

  const renderLevelEarningsTable = (title: string, users: any[]) => {
    const totalSignup = users.reduce((sum, u) => sum + (u.signupBonus || 0), 0);
    const totalFirstPurchase = users.reduce((sum, u) => sum + (u.firstPurchaseCommission || 0), 0);
    const totalProduct = users.reduce((sum, u) => sum + (u.productCommission || 0), 0);
    const grandTotal = users.reduce((sum, u) => sum + (u.totalEarned || 0), 0);

    return (
      <Card className="mb-6 shadow-sm border border-slate-200">
        <CardHeader className="bg-slate-50/50 border-b pb-4">
          <CardTitle className="text-lg font-bold text-navy">{title}</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {users.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">No downline members at this level.</div>
          ) : (
            <div className="overflow-x-auto border rounded-xl shadow-inner bg-white">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b">
                  <tr className="text-left text-slate-600 font-semibold">
                    <th className="p-4">Name</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Referral Code</th>
                    <th className="p-4 text-right">Signup Bonus</th>
                    <th className="p-4 text-right">First Purchase Commission</th>
                    <th className="p-4 text-right">Product Commission</th>
                    <th className="p-4 text-right">Total Earned</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u._id} className="border-b hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 font-semibold text-navy">{u.name}</td>
                      <td className="p-4 text-slate-500">{u.email}</td>
                      <td className="p-4 font-mono font-medium text-slate-600">{u.referralCode || "-"}</td>
                      <td className="p-4 text-right text-slate-700">₹{Math.round(u.signupBonus || 0)}</td>
                      <td className="p-4 text-right text-slate-700">₹{Math.round(u.firstPurchaseCommission || 0)}</td>
                      <td className="p-4 text-right text-slate-700">₹{Math.round(u.productCommission || 0)}</td>
                      <td className="p-4 text-right font-bold text-navy">₹{Math.round(u.totalEarned || 0)}</td>
                    </tr>
                  ))}
                  <tr className="bg-slate-50 font-bold border-t-2 border-slate-200">
                    <td className="p-4 text-slate-800" colSpan={3}>Total</td>
                    <td className="p-4 text-right text-purple-700">₹{Math.round(totalSignup)}</td>
                    <td className="p-4 text-right text-green-700">₹{Math.round(totalFirstPurchase)}</td>
                    <td className="p-4 text-right text-blue-700">₹{Math.round(totalProduct)}</td>
                    <td className="p-4 text-right text-navy text-base">₹{Math.round(grandTotal)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderSkeletonCards = (count: number) => {
    return Array(count)
      .fill(0)
      .map((_, i) => <Skeleton key={i} className="h-32 w-full" />);
  };

  /** ✅ withdraw helpers */
  const getWithdrawStatusBadge = (status: WithdrawalStatus) => {
    const map: Record<WithdrawalStatus, string> = {
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      approved: "bg-blue-100 text-blue-800 border-blue-200",
      rejected: "bg-red-100 text-red-800 border-red-200",
      paid: "bg-green-100 text-green-800 border-green-200",
    };
    return <Badge className={map[status]}>{status.toUpperCase()}</Badge>;
  };

  const validateBank = (b: BankDetails) => {
    if (!b.accountHolderName.trim()) return "Account holder name is required";
    if (!b.bankName.trim()) return "Bank name is required";
    if (!b.accountNumber.trim()) return "Account number is required";
    if (!b.ifsc.trim()) return "IFSC is required";
    return null;
  };

  const saveBankDetails = async () => {
    const msg = validateBank(bankDetails);
    if (msg) {
      toast({ title: "Missing details", description: msg, variant: "destructive" });
      return;
    }

    try {
      setLoadingSections((p) => ({ ...p, withdraw: true }));
      const res = await apiFetch("/user/bank-details", {
        method: "PUT",
        body: JSON.stringify({ bankDetails }),
      });
      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        toast({
          title: "Failed",
          description: json?.message || "Unable to save bank details",
          variant: "destructive",
        });
        return;
      }

      setBankSaved(true);
      toast({ title: "Saved", description: "Bank details saved successfully" });
    } catch (e) {
      toast({ title: "Error", description: "Unable to save bank details", variant: "destructive" });
    } finally {
      setLoadingSections((p) => ({ ...p, withdraw: false }));
    }
  };
  /** ✅ UPDATED: withdraw uses AVAILABLE + instant reduce (move to hold) + 15% fee */
  const requestWithdraw = async () => {
    const amt = Number(withdrawAmount);

    if (!amt || amt <= 0) {
      toast({ title: "Invalid amount", description: "Enter a valid withdraw amount", variant: "destructive" });
      return;
    }

    const msg = validateBank(bankDetails);
    if (!bankSaved || msg) {
      toast({
        title: "Bank details required",
        description: "Please save your bank details before requesting withdrawal.",
        variant: "destructive",
      });
      return;
    }

    if (amt > walletAvailable) {
      toast({
        title: "Not enough available balance",
        description: `You can withdraw up to Rs. ${Math.round(walletAvailable)}`,
        variant: "destructive",
      });
      return;
    }

    const { fee, net } = calcWithdrawFee(amt);

    try {
      setLoadingSections((p) => ({ ...p, withdraw: true }));

      // ✅ Do not send userId from frontend. Backend should take userId from req.user after JWT auth.
      const res = await apiFetch("/wallet/withdrawals", {
        method: "POST",
        body: JSON.stringify({
          amount: amt,
          note: withdrawNote,
          feePercent: WITHDRAW_FEE_PERCENT,
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast({
          title: "Withdraw request failed",
          description: json?.message || "Unable to create withdraw request",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Withdrawal requested",
        description: `Request submitted successfully. Fee: Rs. ${Math.round(fee)} • Net amount: Rs. ${Math.round(net)}`,
      });

      setWithdrawAmount("");
      setWithdrawNote("");

      // ✅ Instant UI update: requested amount moves from available to hold
      setStats((prev) => {
        const currentTotal = Number(prev.walletTotal ?? prev.walletBalance ?? walletTotal) || 0;
        const currentHold = Number(prev.walletHold ?? walletHold) || 0;
        const updatedHold = currentHold + amt;
        const updatedAvailable = Math.max(0, currentTotal - updatedHold);

        return {
          ...prev,
          walletTotal: currentTotal,
          walletBalance: currentTotal,
          walletHold: updatedHold,
          walletAvailable: updatedAvailable,
        };
      });

      await fetchWithdrawData();
      await fetchReferralData();
    } catch (e) {
      toast({ title: "Error", description: "Unable to create withdraw request", variant: "destructive" });
    } finally {
      setLoadingSections((p) => ({ ...p, withdraw: false }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <Skeleton className="h-8 w-64 mb-2" />
              <Skeleton className="h-4 w-48" />
            </div>
            <Skeleton className="h-9 w-24" />
          </div>

          <Skeleton className="h-48 w-full mb-8 rounded-3xl" />

          <div className="space-y-6">
            <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-6">{renderSkeletonCards(6)}</div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-navy">Refer & Earn Dashboard</h1>
            <p className="text-muted-foreground mt-2">
              Level {stats.userLevel} • {stats.hasParent ? `Referred by ${stats.parentInfo?.name || "someone"}` : "No referrer"}
            </p>
            {stats.parentInfo && (
              <p className="text-sm text-gray-600 mt-1">
                Parent Referral Code: <span className="font-medium">{stats.parentInfo.referralCode}</span>
              </p>
            )}
          </div>
          <Button
            onClick={() => {
              fetchReferralData();
              fetchWithdrawData();
            }}
            variant="outline"
            size="sm"
            disabled={loading}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Refresh
          </Button>
        </div>

        {/* Hero Section */}
        <div className="bg-gradient-to-r from-navy to-accent rounded-3xl p-8 mb-8 text-white">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-center md:text-left mb-6 md:mb-0">
              <h2 className="text-3xl font-bold mb-2">Refer. Earn. Be APEX Always.</h2>
              <p className="text-lg mb-2">Earn ₹50 for Direct Referrals</p>
              <p className="text-lg mb-2">Introduce Your Friends & Earn Unlimited Income</p>
              <p className="text-lg font-semibold mb-4">"No Boss – No Limits – Just Earnings"</p>

              <div className="flex flex-wrap gap-4">
                <div className="bg-white/20 rounded-lg p-3">
                  <p className="text-sm">Direct Referral Bonus</p>
                  <p className="text-xl font-semibold">Rs. 50</p>
                </div>

                <div className="bg-white/20 rounded-lg p-3">
                  <p className="text-sm">Network Members</p>
                  <p className="text-xl font-semibold">{calculatePersonalNetworkSize()}</p>
                </div>
              </div>
            </div>

            <div className="text-center">
              <Gift className="h-16 w-16 mx-auto mb-4" />

              {/* ✅ Wallet summary */}
              <div className="bg-white/20 rounded-lg p-4 space-y-1">
                <p className="text-sm">Wallet Available</p>
                <p className="text-2xl font-bold">Rs. {Math.round(walletAvailable)}</p>
                <p className="text-xs opacity-90">
                  Total: Rs. {Math.round(walletTotal)} • Hold: Rs. {Math.round(walletHold)}
                </p>
                <p className="text-[11px] opacity-90">Fee: {WITHDRAW_FEE_PERCENT}% (TDS + PLATFORM FEE)</p>
              </div>

              <Button className="mt-4 bg-white text-navy hover:bg-white/90" onClick={() => setActiveTab("withdraw")}>
                <IndianRupee className="h-4 w-4 mr-2" />
                Withdraw
              </Button>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="earnings">Earnings</TabsTrigger>
            <TabsTrigger value="referrals">Referrals</TabsTrigger>
            <TabsTrigger value="commissions">Commissions</TabsTrigger>
            <TabsTrigger value="network">Network</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="withdraw">Withdraw</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-8">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
              {loadingSections.stats
                ? renderSkeletonCards(6)
                : mainStatsCards.map((stat) => {
                    const Icon = stat.icon;
                    return (
                      <Card key={stat.label}>
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-muted-foreground mb-1">{stat.label}</p>
                              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                              <p className="text-xs text-muted-foreground mt-2">{stat.description}</p>
                            </div>
                            <Icon className="h-8 w-8 text-accent" />
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
            </div>

            {/* 7 Earnings Categories Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Earnings Categories Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {/* Category 1: Signup Bonus */}
                  <div className="p-4 rounded-2xl border border-purple-100 bg-purple-50/50 hover:shadow-md transition-all">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-semibold text-purple-700 bg-purple-100/80 px-2.5 py-0.5 rounded-full">A. Signup Bonus</span>
                      <Award className="h-5 w-5 text-purple-600" />
                    </div>
                    <p className="text-2xl font-extrabold text-purple-950 mt-3">₹{Math.round(stats.signupBonus || 0)}</p>
                    <p className="text-xs text-purple-700/80 mt-1">From direct KYC referrers status</p>
                  </div>

                  {/* Category 2: First Purchase Commission */}
                  <div className="p-4 rounded-2xl border border-green-100 bg-green-50/50 hover:shadow-md transition-all md:col-span-2 lg:col-span-1">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-semibold text-green-700 bg-green-100/80 px-2.5 py-0.5 rounded-full">B. First Purchase</span>
                      <Gift className="h-5 w-5 text-green-600" />
                    </div>
                    <p className="text-2xl font-extrabold text-green-950 mt-3">₹{Math.round(stats.firstPurchaseCommission || 0)}</p>
                    <div className="mt-2 space-y-1 text-xs text-green-800">
                      <div className="flex justify-between">
                        <span>Level 1:</span>
                        <span className="font-semibold">₹{Math.round(stats.level1?.firstPurchaseCommission || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Level 2:</span>
                        <span className="font-semibold">₹{Math.round(stats.level2?.firstPurchaseCommission || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Level 3:</span>
                        <span className="font-semibold">₹{Math.round(stats.level3?.firstPurchaseCommission || 0)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Category 3: Product Commission */}
                  <div className="p-4 rounded-2xl border border-blue-100 bg-blue-50/50 hover:shadow-md transition-all md:col-span-2 lg:col-span-1">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-semibold text-blue-700 bg-blue-100/80 px-2.5 py-0.5 rounded-full">C. Product Commission</span>
                      <TrendingUp className="h-5 w-5 text-blue-600" />
                    </div>
                    <p className="text-2xl font-extrabold text-blue-950 mt-3">₹{Math.round(stats.productCommission || 0)}</p>
                    <div className="mt-2 space-y-1 text-xs text-blue-800">
                      <div className="flex justify-between">
                        <span>Level 1:</span>
                        <span className="font-semibold">₹{Math.round(stats.level1?.productCommission || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Level 2:</span>
                        <span className="font-semibold">₹{Math.round(stats.level2?.productCommission || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Level 3:</span>
                        <span className="font-semibold">₹{Math.round(stats.level3?.productCommission || 0)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Category 4: Membership Incentives */}
                  <div className="p-4 rounded-2xl border border-red-100 bg-red-50/50 hover:shadow-md transition-all">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-semibold text-red-700 bg-red-100/80 px-2.5 py-0.5 rounded-full">D. Membership</span>
                      <Award className="h-5 w-5 text-red-600" />
                    </div>
                    <p className="text-2xl font-extrabold text-red-950 mt-3">₹{Math.round(stats.membershipIncentives || 0)}</p>
                    <p className="text-xs text-red-700/80 mt-1">Entrepreneur membership incentives</p>
                  </div>

                  {/* Category 5: Vendor Incentives */}
                  <div className="p-4 rounded-2xl border border-pink-100 bg-pink-50/50 hover:shadow-md transition-all">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-semibold text-pink-700 bg-pink-100/80 px-2.5 py-0.5 rounded-full">E. Vendor</span>
                      <Coins className="h-5 w-5 text-pink-600" />
                    </div>
                    <p className="text-2xl font-extrabold text-pink-950 mt-3">₹{Math.round(stats.vendorIncentives || 0)}</p>
                    <p className="text-xs text-pink-700/80 mt-1">Vendor sales & onboarding splits</p>
                  </div>

                  {/* Category 6: Franchise Incentives */}
                  <div className="p-4 rounded-2xl border border-teal-100 bg-teal-50/50 hover:shadow-md transition-all">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-semibold text-teal-700 bg-teal-100/80 px-2.5 py-0.5 rounded-full">F. Franchise</span>
                      <Landmark className="h-5 w-5 text-teal-600" />
                    </div>
                    <p className="text-2xl font-extrabold text-teal-950 mt-3">₹{Math.round(stats.franchiseIncentives || 0)}</p>
                    <p className="text-xs text-teal-700/80 mt-1">Franchise territory revenue shares</p>
                  </div>

                  {/* Category 7: Recurring Commissions */}
                  <div className="p-4 rounded-2xl border border-orange-100 bg-orange-50/50 hover:shadow-md transition-all">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-semibold text-orange-700 bg-orange-100/80 px-2.5 py-0.5 rounded-full">G. Recurring</span>
                      <Coins className="h-5 w-5 text-orange-600" />
                    </div>
                    <p className="text-2xl font-extrabold text-orange-950 mt-3">₹{Math.round(stats.recurringCommissions || 0)}</p>
                    <p className="text-xs text-orange-700/80 mt-1">Wishlink & referral pool payouts</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Referral Code Section */}
            <Card>
              <CardHeader>
                <CardTitle>Your Referral Tools</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-navy mb-2">Referral Code</label>
                  <div className="flex gap-3">
                    <div className="flex-1 bg-blue-50 rounded-lg p-4 font-mono text-xl font-bold text-navy text-center border border-blue-200">
                      {referralCode || "Loading..."}
                    </div>
                    <Button
                      onClick={() => copyToClipboard(referralCode, "code")}
                      className="bg-navy hover:bg-navy/90 min-w-[100px]"
                      disabled={!referralCode || copyLoading}
                    >
                      {copyLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Copy className="h-4 w-4 mr-2" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-navy mb-2">Referral Link</label>
                  <div className="flex gap-3">
                    <div className="flex-1 bg-blue-50 rounded-lg p-3 text-sm text-navy break-all border border-blue-200 font-medium">
                      {referralLink || "Loading..."}
                    </div>
                    <Button
                      onClick={shareReferral}
                      variant="outline"
                      className="border-accent text-accent hover:bg-accent hover:text-white min-w-[100px]"
                      disabled={!referralLink || copyLoading}
                    >
                      {copyLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Share2 className="h-4 w-4 mr-2" />
                          Share
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* ✅ Wallet fee note */}
                <div className="rounded-lg border bg-slate-50 p-4 text-sm text-slate-700">
                  Withdrawals have a <span className="font-semibold">{WITHDRAW_FEE_PERCENT}%</span> deduction (
                  <span className="font-semibold">TDS + PLATFORM FEE</span>).
                  <div className="text-xs text-muted-foreground mt-1">
                    Available decreases immediately after you submit a withdrawal request (moves to Hold).
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Direct Referrals */}
            {stats.recentDirectReferrals && stats.recentDirectReferrals.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Recent Direct Referrals</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {stats.recentDirectReferrals.map((referral, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                      >
                        <div>
                          <p className="font-medium text-navy">{referral.name}</p>
                          <p className="text-sm text-muted-foreground">{referral.email}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">
                            Joined {new Date(referral.joined).toLocaleDateString()}
                          </p>
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Direct</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Earnings Tab */}
          <TabsContent value="earnings" className="space-y-6">
            {loadingSections.network ? (
              <div className="space-y-4">
                {renderSkeletonCards(3)}
              </div>
            ) : (
              <div className="space-y-6">
                {renderLevelEarningsTable("Level 1 Direct Earnings", level1Users)}
                {renderLevelEarningsTable("Level 2 Earnings", level2Users)}
                {renderLevelEarningsTable("Level 3 Earnings", level3Users)}
              </div>
            )}
          </TabsContent>

          {/* Referrals Tab */}
          <TabsContent value="referrals" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <CardTitle>Referral Network Directory</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {calculatePersonalDirectReferrals()} direct • {calculatePersonalIndirectReferrals()} indirect • {calculatePersonalLevel3Referrals()} level 3
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant={referralLevelFilter === "all" ? "default" : "outline"}
                    onClick={() => setReferralLevelFilter("all")}
                  >
                    All Levels
                  </Button>
                  <Button
                    size="sm"
                    variant={referralLevelFilter === "1" ? "default" : "outline"}
                    onClick={() => setReferralLevelFilter("1")}
                  >
                    Level 1 (Directs)
                  </Button>
                  <Button
                    size="sm"
                    variant={referralLevelFilter === "2" ? "default" : "outline"}
                    onClick={() => setReferralLevelFilter("2")}
                  >
                    Level 2
                  </Button>
                  <Button
                    size="sm"
                    variant={referralLevelFilter === "3" ? "default" : "outline"}
                    onClick={() => setReferralLevelFilter("3")}
                  >
                    Level 3
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loadingSections.network ? (
                  <div className="space-y-4">
                    {Array(5)
                      .fill(0)
                      .map((_, i) => (
                        <Skeleton key={i} className="h-20 w-full" />
                      ))}
                  </div>
                ) : filteredReferredUsers.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <h4 className="text-lg font-semibold text-navy mb-2">No downline members found</h4>
                    <p className="text-muted-foreground mb-4">Start sharing your referral code to build your network!</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto border rounded-xl bg-white shadow-sm">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 border-b">
                        <tr className="text-left text-slate-600 font-semibold">
                          <th className="p-4">Name</th>
                          <th className="p-4">Email</th>
                          <th className="p-4">Phone</th>
                          <th className="p-4">Joined Date</th>
                          <th className="p-4">Level</th>
                          <th className="p-4">Status</th>
                          <th className="p-4 text-center">First Order Qualified</th>
                          <th className="p-4 text-center">Total Purchases</th>
                          <th className="p-4 text-right">Commission Generated</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredReferredUsers.map((u) => {
                          const isExpanded = !!expandedRows[u._id];
                          return (
                            <>
                              <tr
                                key={u._id}
                                className="border-b hover:bg-slate-50/50 cursor-pointer transition-colors"
                                onClick={() => {
                                  setExpandedRows(prev => ({ ...prev, [u._id]: !prev[u._id] }));
                                }}
                              >
                                <td className="p-4">
                                  <div className="flex items-center gap-2">
                                    {isExpanded ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
                                    <span className="font-semibold text-navy">{u.name}</span>
                                  </div>
                                </td>
                                <td className="p-4 text-slate-500">{u.email}</td>
                                <td className="p-4 text-slate-500">{u.phone || u.mobile || "-"}</td>
                                <td className="p-4 text-slate-400">{new Date(u.createdAt).toLocaleDateString()}</td>
                                <td className="p-4">
                                  <Badge className={u.levelNum === 1 ? "bg-green-50 text-green-700 hover:bg-green-50 border-green-200" : u.levelNum === 2 ? "bg-blue-50 text-blue-700 hover:bg-blue-50 border-blue-200" : "bg-purple-50 text-purple-700 hover:bg-purple-50 border-purple-200"}>
                                    Level {u.levelNum}
                                  </Badge>
                                </td>
                                <td className="p-4">
                                  <Badge className={u.status === "active" ? "bg-green-100 text-green-800 hover:bg-green-100" : "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"}>
                                    {u.status}
                                  </Badge>
                                </td>
                                <td className="p-4 text-center">
                                  {u.firstOrderQualified ? (
                                    <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">Yes</Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-slate-400">No</Badge>
                                  )}
                                </td>
                                <td className="p-4 text-center font-medium text-slate-700">{u.totalPurchases || 0}</td>
                                <td className="p-4 text-right font-bold text-navy">₹{Math.round(u.totalCommissionGenerated || 0)}</td>
                              </tr>
                              {isExpanded && (
                                <tr className="bg-slate-50 border-b">
                                  <td colSpan={9} className="p-4">
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                      {/* Orders */}
                                      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                        <h5 className="font-semibold text-navy mb-3 pb-2 border-b flex items-center gap-2">
                                          <TrendingUp className="h-4 w-4 text-blue-600" />
                                          Orders ({u.orders?.length || 0})
                                        </h5>
                                        {(!u.orders || u.orders.length === 0) ? (
                                          <p className="text-xs text-slate-400 py-2">No orders placed yet.</p>
                                        ) : (
                                          <div className="space-y-2 max-h-60 overflow-y-auto">
                                            {u.orders.map((o: any, idx: number) => (
                                              <div key={idx} className="flex justify-between items-center text-xs p-2 bg-slate-50/50 rounded border border-slate-100">
                                                <div>
                                                  <p className="font-semibold text-navy">#{o.orderNumber}</p>
                                                  <p className="text-slate-400">{new Date(o.createdAt).toLocaleDateString()}</p>
                                                </div>
                                                <div className="text-right">
                                                  <p className="font-bold text-navy">₹{Math.round(o.totalAmount)}</p>
                                                  <Badge variant="outline" className="text-[10px] scale-90 origin-right">
                                                    {o.status}
                                                  </Badge>
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>

                                      {/* Commissions Generated */}
                                      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                        <h5 className="font-semibold text-navy mb-3 pb-2 border-b flex items-center gap-2">
                                          <Coins className="h-4 w-4 text-purple-600" />
                                          Commissions Generated ({u.commissions?.length || 0})
                                        </h5>
                                        {(!u.commissions || u.commissions.length === 0) ? (
                                          <p className="text-xs text-slate-400 py-2">No commissions generated yet.</p>
                                        ) : (
                                          <div className="space-y-2 max-h-60 overflow-y-auto">
                                            {u.commissions.map((c: any, idx: number) => (
                                              <div key={idx} className="flex justify-between items-center text-xs p-2 bg-slate-50/50 rounded border border-slate-100">
                                                <div>
                                                  <p className="font-semibold text-navy">{c.commissionType}</p>
                                                  <p className="text-slate-400">{new Date(c.date || c.createdAt).toLocaleDateString()}</p>
                                                </div>
                                                <div className="text-right">
                                                  <p className="font-bold text-green-600">+₹{Math.round(c.amount)}</p>
                                                  <p className="text-[10px] text-slate-400">Level {c.level}</p>
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>

                                      {/* Wallet Contributions */}
                                      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                        <h5 className="font-semibold text-navy mb-3 pb-2 border-b flex items-center gap-2">
                                          <Wallet className="h-4 w-4 text-green-600" />
                                          Wallet Contributions ({u.walletContributions?.length || 0})
                                        </h5>
                                        {(!u.walletContributions || u.walletContributions.length === 0) ? (
                                          <p className="text-xs text-slate-400 py-2">No ledger entries generated yet.</p>
                                        ) : (
                                          <div className="space-y-2 max-h-60 overflow-y-auto">
                                            {u.walletContributions.map((wc: any, idx: number) => (
                                              <div key={idx} className="flex justify-between items-center text-xs p-2 bg-slate-50/50 rounded border border-slate-100">
                                                <div className="truncate pr-2">
                                                  <p className="font-mono text-[10px] text-navy truncate" title={wc.transactionId}>
                                                    TX: {wc.transactionId.substring(0, 10)}...
                                                  </p>
                                                  <p className="text-[10px] text-slate-400 truncate" title={wc.referenceId}>
                                                    Ref: {wc.referenceId ? `${wc.referenceId.substring(0, 10)}...` : "N/A"}
                                                  </p>
                                                </div>
                                                <div className="text-right flex-shrink-0">
                                                  <p className="font-bold text-green-600">+₹{Math.round(wc.amount)}</p>
                                                  <p className="text-[10px] text-slate-400">
                                                    {wc.date ? new Date(wc.date).toLocaleDateString() : ""}
                                                  </p>
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Commissions Tab */}
          <TabsContent value="commissions" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                  <div>
                    <CardTitle>Financial Audit Ledger</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">Total referral network earnings: Rs. {Math.round(stats.totalEarned || 0)}</p>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="bg-purple-50 text-purple-700">
                      ApexBee Bonus: Rs. {Math.round((stats.signupBonus || 0) + (stats.level1?.firstPurchaseCommission || 0))}
                    </Badge>
                    <Badge variant="outline" className="bg-green-50 text-green-700">
                      Wallet Total: Rs. {Math.round(walletTotal)}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loadingSections.commissions ? (
                  <div className="space-y-4">
                    {Array(5)
                      .fill(0)
                      .map((_, i) => (
                        <Skeleton key={i} className="h-20 w-full" />
                      ))}
                  </div>
                ) : commissionHistory.length === 0 ? (
                  <div className="text-center py-12">
                    <Coins className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <h4 className="text-lg font-semibold text-navy mb-2">No commission history yet</h4>
                    <p className="text-muted-foreground">Commissions will appear here when your downline makes a purchase or KYC is approved.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto border rounded-xl bg-white shadow-sm">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 border-b">
                        <tr className="text-left text-slate-600 font-semibold">
                          <th className="p-4">Date</th>
                          <th className="p-4">User Name</th>
                          <th className="p-4">User Email</th>
                          <th className="p-4">Order Number</th>
                          <th className="p-4 text-right">Order Value</th>
                          <th className="p-4">Commission Type</th>
                          <th className="p-4 text-right">Commission %</th>
                          <th className="p-4 text-right">Commission Amount</th>
                          <th className="p-4 text-center">Level</th>
                          <th className="p-4">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {commissionHistory.map((c) => {
                          const allowedTypes = [
                            "Signup Bonus",
                            "First Purchase",
                            "Product Commission",
                            "Membership",
                            "Vendor",
                            "Franchise",
                            "Recurring"
                          ];

                          let displayType = c.commissionType;
                          if (!allowedTypes.includes(displayType)) {
                            displayType = "Product Commission";
                          }

                          const typeColors: Record<string, string> = {
                            "Signup Bonus": "bg-purple-100 text-purple-800 hover:bg-purple-100 border-purple-200",
                            "First Purchase": "bg-green-100 text-green-800 hover:bg-green-100 border-green-200",
                            "Product Commission": "bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200",
                            "Membership": "bg-red-100 text-red-800 hover:bg-red-100 border-red-200",
                            "Vendor": "bg-pink-100 text-pink-800 hover:bg-pink-100 border-pink-200",
                            "Franchise": "bg-teal-100 text-teal-800 hover:bg-teal-100 border-teal-200",
                            "Recurring": "bg-orange-100 text-orange-800 hover:bg-orange-100 border-orange-200"
                          };

                          const statusColors: Record<string, string> = {
                            "credited": "bg-green-100 text-green-800 hover:bg-green-100",
                            "released": "bg-green-100 text-green-800 hover:bg-green-100",
                            "pending": "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
                            "placed": "bg-orange-100 text-orange-800 hover:bg-orange-100",
                            "cancelled": "bg-red-100 text-red-800 hover:bg-red-100"
                          };

                          return (
                            <tr key={c._id} className="border-b hover:bg-slate-50/50 transition-colors">
                              <td className="p-4 text-slate-500">{formatDate(c.date || c.createdAt)}</td>
                              <td className="p-4 font-semibold text-navy">{c.userName || "System"}</td>
                              <td className="p-4 text-slate-500">{c.userEmail || "N/A"}</td>
                              <td className="p-4 font-mono font-medium text-slate-600">{c.orderNumber || "N/A"}</td>
                              <td className="p-4 text-right font-medium text-slate-700">
                                {c.orderValue && c.orderValue > 0 ? `₹${Math.round(c.orderValue)}` : "N/A"}
                              </td>
                              <td className="p-4">
                                <Badge className={typeColors[displayType] || "bg-gray-100 text-gray-800 border-gray-200"}>
                                  {displayType}
                                </Badge>
                              </td>
                              <td className="p-4 text-right font-medium text-slate-600">
                                {c.commissionPercentage !== null && c.commissionPercentage !== undefined
                                  ? `${c.commissionPercentage}%`
                                  : "N/A"}
                              </td>
                              <td className="p-4 text-right font-bold text-navy">₹{Math.round(c.commissionAmount || c.amount)}</td>
                              <td className="p-4 text-center font-semibold text-slate-600">
                                {c.level && c.level > 0 ? `L${c.level}` : "-"}
                              </td>
                              <td className="p-4">
                                <Badge className={statusColors[c.status || ""] || "bg-gray-100 text-gray-800 hover:bg-gray-100"}>
                                  {c.status || "N/A"}
                                </Badge>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Network Tab */}
          <TabsContent value="network" className="space-y-6">
            {/* Summary Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {([
                { label: "You (Root)", count: 1, color: "from-indigo-500 to-indigo-700", icon: "👑" },
                { label: "Direct (L1)", count: calculatePersonalDirectReferrals(), color: "from-emerald-500 to-emerald-700", icon: "👥" },
                { label: "Indirect (L2)", count: calculatePersonalIndirectReferrals(), color: "from-blue-500 to-blue-700", icon: "🔗" },
                { label: "Extended (L3)", count: calculatePersonalLevel3Referrals(), color: "from-purple-500 to-purple-700", icon: "🌐" },
              ] as const).map(s => (
                <div key={s.label} className={`bg-gradient-to-br ${s.color} rounded-2xl p-4 shadow-md`}>
                  <div className="text-2xl mb-1">{s.icon}</div>
                  <div className="text-3xl font-black text-white">{s.count}</div>
                  <div className="text-xs font-semibold text-white/90 mt-1">{s.label}</div>
                </div>
              ))}
            </div>

            <Card className="shadow-sm border border-slate-200 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white pb-4">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                  <div>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Network className="h-5 w-5 text-indigo-300" />
                      Your APEX Referral Tree
                    </CardTitle>
                    <p className="text-slate-400 text-sm mt-1">
                      {calculatePersonalNetworkSize()} total members across 3 levels
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">L1 Direct</span>
                    <span className="px-2 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold border border-blue-500/30">L2 Indirect</span>
                    <span className="px-2 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-bold border border-purple-500/30">L3 Extended</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {loadingSections.network ? (
                  <div className="p-6 space-y-4">
                    {Array(4).fill(0).map((_, i) => (
                      <div key={i} className="space-y-2">
                        <Skeleton className="h-14 w-full rounded-xl" />
                        <div className="ml-8 space-y-2">
                          <Skeleton className="h-12 w-full rounded-xl" />
                          <Skeleton className="h-12 w-4/5 rounded-xl" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : level1Users.length === 0 ? (
                  <div className="text-center py-16 px-4">
                    <Network className="h-16 w-16 mx-auto mb-4 text-slate-200" />
                    <h4 className="text-lg font-semibold text-slate-700 mb-2">No referrals yet</h4>
                    <p className="text-slate-400 text-sm">Share your referral code to start building your network tree.</p>
                  </div>
                ) : (
                  <div className="p-4">
                    {/* Root Node */}
                    <div className="flex items-center gap-3 p-4 mb-2 bg-gradient-to-r from-indigo-50 to-indigo-100 rounded-2xl border-2 border-indigo-300 shadow-sm">
                      <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center shrink-0 shadow-lg">
                        <User className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-indigo-900 text-sm">{networkData?.user.name || "You"}</p>
                        <p className="text-xs text-indigo-600 truncate">{networkData?.user.email}</p>
                        <p className="text-[10px] text-indigo-500 font-mono mt-0.5">Code: {networkData?.user.referralCode || referralCode}</p>
                      </div>
                      <span className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-black rounded-full shrink-0 shadow">ROOT</span>
                    </div>

                    {/* L1 → L2 → L3 */}
                    <div className="ml-4 border-l-4 border-indigo-200 pl-2 space-y-1">
                      {level1Users.map((u1: any) => {
                        const l2kids = level2Users.filter((u2: any) => String(u2.referredBy) === String(u1._id));
                        const expL1 = expandedRows[`l1_${u1._id}`] !== false;
                        return (
                          <div key={u1._id} className="pt-1">
                            <div className="flex items-start">
                              <div className="w-6 h-px bg-indigo-200 mt-6 shrink-0" />
                              <div className="flex-1 min-w-0">
                                <button onClick={() => setExpandedRows(p => ({ ...p, [`l1_${u1._id}`]: !expL1 }))} className="w-full text-left">
                                  <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl hover:border-emerald-400 hover:shadow-sm transition-all">
                                    <div className="w-9 h-9 bg-emerald-500 rounded-full flex items-center justify-center shrink-0">
                                      <span className="text-white text-[10px] font-black">L1</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2">
                                        <p className="font-semibold text-emerald-900 text-sm">{u1.name}</p>
                                        {u1.status === 'active' && <span className="w-2 h-2 bg-green-400 rounded-full" />}
                                      </div>
                                      <p className="text-[10px] text-emerald-600 truncate">{u1.email}</p>
                                      <div className="flex gap-2 mt-0.5 flex-wrap">
                                        <span className="text-[9px] text-slate-500 font-mono">Joined {new Date(u1.createdAt).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'2-digit'})}</span>
                                        {u1.firstOrderQualified && <span className="text-[9px] text-amber-600 font-semibold">✓ 1st Order</span>}
                                        {u1.referralCode && <span className="text-[9px] text-slate-400 font-mono">#{u1.referralCode}</span>}
                                      </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                      <div className="text-xs font-bold text-emerald-800">₹{Math.round(u1.totalCommissionGenerated || 0)}</div>
                                      <div className="text-[9px] text-slate-500">{u1.totalPurchases || 0} orders</div>
                                      {l2kids.length > 0 && <div className="text-[9px] text-blue-500 font-semibold mt-0.5">{expL1 ? '▲' : '▼'} {l2kids.length} sub</div>}
                                    </div>
                                  </div>
                                </button>
                                {l2kids.length > 0 && expL1 && (
                                  <div className="ml-4 border-l-4 border-emerald-200 pl-2 mt-1 space-y-1">
                                    {l2kids.map((u2: any) => {
                                      const l3kids = level3Users.filter((u3: any) => String(u3.referredBy) === String(u2._id));
                                      const expL2 = expandedRows[`l2_${u2._id}`] !== false;
                                      return (
                                        <div key={u2._id} className="pt-1">
                                          <div className="flex items-start">
                                            <div className="w-5 h-px bg-emerald-200 mt-5 shrink-0" />
                                            <div className="flex-1 min-w-0">
                                              <button onClick={() => setExpandedRows(p => ({ ...p, [`l2_${u2._id}`]: !expL2 }))} className="w-full text-left">
                                                <div className="flex items-center gap-3 p-2.5 bg-blue-50 border border-blue-200 rounded-xl hover:border-blue-400 hover:shadow-sm transition-all">
                                                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center shrink-0">
                                                    <span className="text-white text-[9px] font-black">L2</span>
                                                  </div>
                                                  <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-1.5">
                                                      <p className="font-semibold text-blue-900 text-xs">{u2.name}</p>
                                                      {u2.status === 'active' && <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />}
                                                    </div>
                                                    <p className="text-[9px] text-blue-500 truncate">{u2.email}</p>
                                                    <div className="flex gap-2 mt-0.5">
                                                      <span className="text-[9px] text-slate-400 font-mono">Joined {new Date(u2.createdAt).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'2-digit'})}</span>
                                                      {u2.firstOrderQualified && <span className="text-[9px] text-amber-500 font-semibold">✓ 1st Order</span>}
                                                    </div>
                                                  </div>
                                                  <div className="text-right shrink-0">
                                                    <div className="text-xs font-bold text-blue-800">₹{Math.round(u2.totalCommissionGenerated || 0)}</div>
                                                    <div className="text-[9px] text-slate-400">{u2.totalPurchases || 0} orders</div>
                                                    {l3kids.length > 0 && <div className="text-[9px] text-purple-500 font-semibold mt-0.5">{expL2 ? '▲' : '▼'} {l3kids.length} sub</div>}
                                                  </div>
                                                </div>
                                              </button>
                                              {l3kids.length > 0 && expL2 && (
                                                <div className="ml-4 border-l-4 border-blue-200 pl-2 mt-1 space-y-1">
                                                  {l3kids.map((u3: any) => (
                                                    <div key={u3._id} className="pt-1">
                                                      <div className="flex items-start">
                                                        <div className="w-4 h-px bg-blue-200 mt-5 shrink-0" />
                                                        <div className="flex-1 min-w-0">
                                                          <div className="flex items-center gap-2.5 p-2 bg-purple-50 border border-purple-200 rounded-xl hover:shadow-sm transition-all">
                                                            <div className="w-7 h-7 bg-purple-500 rounded-full flex items-center justify-center shrink-0">
                                                              <span className="text-white text-[8px] font-black">L3</span>
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                              <div className="flex items-center gap-1">
                                                                <p className="font-semibold text-purple-900 text-[11px]">{u3.name}</p>
                                                                {u3.status === 'active' && <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />}
                                                              </div>
                                                              <p className="text-[9px] text-purple-400 truncate">{u3.email}</p>
                                                              <span className="text-[8px] text-slate-400 font-mono">Joined {new Date(u3.createdAt).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'2-digit'})}</span>
                                                            </div>
                                                            <div className="text-right shrink-0">
                                                              <div className="text-xs font-bold text-purple-800">₹{Math.round(u3.totalCommissionGenerated || 0)}</div>
                                                              <div className="text-[9px] text-slate-400">{u3.totalPurchases || 0} orders</div>
                                                            </div>
                                                          </div>
                                                        </div>
                                                      </div>
                                                    </div>
                                                  ))}
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Flat Full Network Roster */}
            {allReferredUsers.length > 0 && (
              <Card className="shadow-sm border border-slate-200">
                <CardHeader className="bg-slate-50/50 border-b pb-4">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                    <div>
                      <CardTitle className="text-navy">Full Network Roster</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">{allReferredUsers.length} members across all levels</p>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {(["all","1","2","3"] as const).map(f => (
                        <button key={f} onClick={() => setReferralLevelFilter(f)}
                          className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${referralLevelFilter === f ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-300 hover:border-slate-500'}`}>
                          {f === "all" ? "All" : `Level ${f}`}
                        </button>
                      ))}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 border-b">
                        <tr className="text-left text-slate-600 font-semibold text-xs">
                          <th className="p-3">Lv</th><th className="p-3">Name</th><th className="p-3">Email</th><th className="p-3">Ref Code</th><th className="p-3">Joined</th><th className="p-3 text-center">1st Order</th><th className="p-3 text-center">Orders</th><th className="p-3 text-right">Commission</th><th className="p-3 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredReferredUsers.map((u: any) => (
                          <tr key={u._id} className="border-b hover:bg-slate-50/60 transition-colors">
                            <td className="p-3"><span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${u.levelNum===1?'bg-emerald-50 text-emerald-700 border-emerald-200':u.levelNum===2?'bg-blue-50 text-blue-700 border-blue-200':'bg-purple-50 text-purple-700 border-purple-200'}`}>L{u.levelNum}</span></td>
                            <td className="p-3 font-semibold text-navy text-xs">{u.name}</td>
                            <td className="p-3 text-slate-500 text-xs truncate max-w-[160px]">{u.email}</td>
                            <td className="p-3 font-mono text-slate-600 text-xs">{u.referralCode||'–'}</td>
                            <td className="p-3 text-slate-400 text-xs">{new Date(u.createdAt).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'2-digit'})}</td>
                            <td className="p-3 text-center">{u.firstOrderQualified?<span className="text-emerald-600 font-bold text-xs">✓</span>:<span className="text-slate-300">–</span>}</td>
                            <td className="p-3 text-center text-xs font-medium text-slate-700">{u.totalPurchases||0}</td>
                            <td className="p-3 text-right font-bold text-navy text-xs">₹{Math.round(u.totalCommissionGenerated||0)}</td>
                            <td className="p-3 text-center"><span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${u.status==='active'?'bg-green-50 text-green-700 border-green-200':'bg-slate-50 text-slate-500 border-slate-200'}`}>{u.status||'inactive'}</span></td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-slate-100 border-t-2 border-slate-300">
                        <tr><td colSpan={7} className="p-3 text-xs font-bold text-slate-700">Total</td><td className="p-3 text-right font-black text-navy text-sm">₹{Math.round(filteredReferredUsers.reduce((s:number,u:any)=>s+(u.totalCommissionGenerated||0),0))}</td><td /></tr>
                      </tfoot>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Distribution + Earnings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="shadow-sm border border-slate-200">
                <CardHeader className="pb-3"><CardTitle className="text-sm font-bold text-navy">Level Distribution</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {[
                    {label:"Direct (L1)",count:calculatePersonalDirectReferrals(),color:"bg-emerald-500"},
                    {label:"Indirect (L2)",count:calculatePersonalIndirectReferrals(),color:"bg-blue-500"},
                    {label:"Extended (L3)",count:calculatePersonalLevel3Referrals(),color:"bg-purple-500"},
                  ].map(row=>(
                    <div key={row.label} className="space-y-1">
                      <div className="flex justify-between text-xs"><span className="text-slate-600">{row.label}</span><span className="font-semibold">{row.count}</span></div>
                      <div className="w-full bg-slate-100 rounded-full h-2"><div className={`${row.color} h-2 rounded-full`} style={{width:`${calculatePersonalNetworkSize()>0?(row.count/calculatePersonalNetworkSize())*100:0}%`}} /></div>
                    </div>
                  ))}
                </CardContent>
              </Card>
              <Card className="shadow-sm border border-slate-200">
                <CardHeader className="pb-3"><CardTitle className="text-sm font-bold text-navy">Earnings by Level</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {[
                    {label:"Direct Earnings (L1)",value:stats.directEarnings||0,color:"text-emerald-700"},
                    {label:"Indirect Earnings (L2)",value:stats.indirectEarnings||0,color:"text-blue-700"},
                    {label:"Extended Earnings (L3)",value:stats.level3Earnings||0,color:"text-purple-700"},
                  ].map(row=>(
                    <div key={row.label} className="flex justify-between items-center py-1 border-b border-slate-100 last:border-0">
                      <span className="text-xs text-slate-600">{row.label}</span>
                      <span className={`font-bold text-sm ${row.color}`}>₹{Math.round(row.value)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center pt-2 border-t-2 border-slate-200">
                    <span className="text-xs font-bold text-slate-700">Total Network Earnings</span>
                    <span className="font-black text-navy">₹{Math.round(apexValues.totalEarnings)}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>APEX Performance Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-semibold text-navy mb-2">Conversion Rate by Level</h4>
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm text-gray-600">Direct Referrals (Level 1)</span>
                            <span className="text-sm font-medium">
                              {stats.totalDirectReferrals > 0
                                ? `${((stats.completedDirectReferrals / stats.totalDirectReferrals) * 100).toFixed(1)}%`
                                : "0%"}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-500 h-2 rounded-full"
                              style={{
                                width: `${stats.totalDirectReferrals > 0 ? (stats.completedDirectReferrals / stats.totalDirectReferrals) * 100 : 0}%`,
                              }}
                            />
                          </div>
                          <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>{stats.completedDirectReferrals || 0} completed</span>
                            <span>{stats.totalDirectReferrals || 0} total</span>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm text-gray-600">Indirect Referrals (Level 2)</span>
                            <span className="text-sm font-medium">
                              {stats.totalIndirectReferrals > 0
                                ? `${((stats.completedIndirectReferrals / stats.totalIndirectReferrals) * 100).toFixed(1)}%`
                                : "0%"}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full"
                              style={{
                                width: `${stats.totalIndirectReferrals > 0 ? (stats.completedIndirectReferrals / stats.totalIndirectReferrals) * 100 : 0}%`,
                              }}
                            />
                          </div>
                          <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>{stats.completedIndirectReferrals || 0} completed</span>
                            <span>{stats.totalIndirectReferrals || 0} total</span>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm text-gray-600">Extended Network (Level 3)</span>
                            <span className="text-sm font-medium">
                              {stats.totalLevel3Referrals > 0
                                ? `${((stats.completedLevel3Referrals / stats.totalLevel3Referrals) * 100).toFixed(1)}%`
                                : "0%"}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-purple-500 h-2 rounded-full"
                              style={{
                                width: `${stats.totalLevel3Referrals > 0 ? (stats.completedLevel3Referrals / stats.totalLevel3Referrals) * 100 : 0}%`,
                              }}
                            />
                          </div>
                          <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>{stats.completedLevel3Referrals || 0} completed</span>
                            <span>{stats.totalLevel3Referrals || 0} total</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-navy mb-2">Average Earnings per Level</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Per Direct Referral (Level 1)</span>
                          <span className="font-semibold">
                            Rs. {stats.totalDirectReferrals > 0 ? Math.round(stats.directEarnings / stats.totalDirectReferrals) : 0}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Per Indirect Referral (Level 2)</span>
                          <span className="font-semibold">
                            Rs. {stats.totalIndirectReferrals > 0 ? Math.round(stats.indirectEarnings / stats.totalIndirectReferrals) : 0}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Per Level 3 Referral</span>
                          <span className="font-semibold">
                            Rs. {stats.totalLevel3Referrals > 0 ? Math.round(stats.level3Earnings / stats.totalLevel3Referrals) : 0}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-navy mb-2">APEX Earnings Composition</h4>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Direct Earnings (Level 1)</span>
                          <span className="font-semibold">
                            {apexValues.totalEarnings > 0 ? `${((stats.directEarnings / apexValues.totalEarnings) * 100).toFixed(1)}%` : "0%"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Indirect Earnings (Level 2)</span>
                          <span className="font-semibold">
                            {apexValues.totalEarnings > 0 ? `${((stats.indirectEarnings / apexValues.totalEarnings) * 100).toFixed(1)}%` : "0%"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Level 3 Earnings</span>
                          <span className="font-semibold">
                            {apexValues.totalEarnings > 0 ? `${((stats.level3Earnings / apexValues.totalEarnings) * 100).toFixed(1)}%` : "0%"}
                          </span>
                        </div>
                        <div className="flex justify-between pt-2 border-t">
                          <span className="text-sm text-gray-600">Wallet Available</span>
                          <span className="font-semibold">
                            {apexValues.totalEarnings > 0 ? `${((walletAvailable / apexValues.totalEarnings) * 100).toFixed(1)}%` : "0%"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Fee</span>
                          <span className="font-semibold">{WITHDRAW_FEE_PERCENT}% (TDS + PLATFORM FEE)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>APEX Growth Insights</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-semibold text-navy mb-2">Monthly APEX Projection</h4>
                      <div className="space-y-3">
                        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <p className="text-sm text-blue-700">Based on current APEX performance:</p>
                          <p className="text-lg font-bold text-blue-800 mt-1">Rs. {Math.round(apexValues.totalEarnings)}</p>
                          <p className="text-xs text-blue-600">Current total APEX earnings</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-navy mb-2">APEX Referral Velocity</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Direct referrals per month</span>
                          <span className="font-semibold">
                            {referralHistory.length > 0 ? Math.round(referralHistory.filter((r) => r.level === 1).length / 30) : 0}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Indirect referrals per month</span>
                          <span className="font-semibold">
                            {referralHistory.length > 0 ? Math.round(referralHistory.filter((r) => r.level === 2).length / 30) : 0}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Level 3 referrals per month</span>
                          <span className="font-semibold">
                            {referralHistory.length > 0 ? Math.round(referralHistory.filter((r) => r.level === 3).length / 30) : 0}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                      <h4 className="font-semibold text-yellow-800 mb-2">💡 APEX Optimization Tips</h4>
                      <ul className="space-y-2 text-sm text-yellow-700">
                        {stats.totalDirectReferrals < 5 && <li>• Focus on getting your first 5 direct referrals for APEX bonus</li>}
                        {stats.totalLevel3Referrals === 0 && stats.totalIndirectReferrals > 0 && (
                          <li>• Ask your Level 2 referrals to refer others to build Level 3 network</li>
                        )}
                        {walletAvailable < stats.signupBonusTotal && (
                          <li>• Encourage purchases for wallet growth (wallet available is low vs bonus)</li>
                        )}
                        {stats.completedDirectReferrals < stats.totalDirectReferrals && (
                          <li>• Follow up with pending direct referrals to complete their first purchase</li>
                        )}
                        {stats.membershipIncentives === 0 && <li>• Explore membership upgrade incentives in APEX system</li>}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ✅ Withdraw Tab */}
          <TabsContent value="withdraw" className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Left: Bank Details */}
              <Card className="lg:col-span-2">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Landmark className="h-5 w-5" />
                      Bank Details
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">Save your bank details for withdrawals.</p>
                  </div>
                  {bankSaved ? (
                    <Badge className="bg-green-100 text-green-800 border-green-200">Saved</Badge>
                  ) : (
                    <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Not Saved</Badge>
                  )}
                </CardHeader>

                <CardContent>
                  {loadingSections.withdraw ? (
                    <div className="space-y-3">
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium">Account Holder Name</label>
                          <Input
                            value={bankDetails.accountHolderName}
                            onChange={(e) => setBankDetails((p) => ({ ...p, accountHolderName: e.target.value }))}
                            placeholder="Full name"
                          />
                        </div>

                        <div>
                          <label className="text-sm font-medium">Bank Name</label>
                          <Input
                            value={bankDetails.bankName}
                            onChange={(e) => setBankDetails((p) => ({ ...p, bankName: e.target.value }))}
                            placeholder="HDFC, SBI, ICICI..."
                          />
                        </div>

                        <div className="relative">
  <label className="text-sm font-medium">Account Number</label>
  <div className="relative">
    <Input
      type={showAccountNumber ? "text" : "password"}
      value={bankDetails.accountNumber}
      onChange={(e) => setBankDetails((p) => ({ ...p, accountNumber: e.target.value }))}
      placeholder="XXXXXXXXXXXX"
      className="pr-10"
    />
    <button
      type="button"
      onClick={() => setShowAccountNumber(!showAccountNumber)}
      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
    >
      {showAccountNumber ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </button>
  </div>
</div>

<div className="relative">
  <label className="text-sm font-medium">IFSC</label>
  <div className="relative">
    <Input
      type={showIfsc ? "text" : "password"}
      value={bankDetails.ifsc}
      onChange={(e) => setBankDetails((p) => ({ ...p, ifsc: e.target.value.toUpperCase() }))}
      placeholder="SBIN0000000"
      className="pr-10"
    />
    <button
      type="button"
      onClick={() => setShowIfsc(!showIfsc)}
      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
    >
      {showIfsc ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </button>
  </div>
</div>

                        <div className="md:col-span-2">
                          <label className="text-sm font-medium">UPI ID (Optional)</label>
                          <Input
                            value={bankDetails.upiId || ""}
                            onChange={(e) => setBankDetails((p) => ({ ...p, upiId: e.target.value }))}
                            placeholder="name@upi"
                          />
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button onClick={saveBankDetails} disabled={loadingSections.withdraw} className="bg-navy hover:bg-navy/90">
                          {loadingSections.withdraw ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                          Save Bank Details
                        </Button>

                        <Button variant="outline" onClick={fetchWithdrawData} disabled={loadingSections.withdraw}>
                          Refresh
                        </Button>
                      </div>

                      <div className="rounded-lg border bg-slate-50 p-4 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-slate-700">Fee</span>
                          <span className="font-semibold text-slate-900">{WITHDRAW_FEE_PERCENT}% (TDS + PLATFORM FEE)</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Available reduces immediately after you submit (amount moves to Hold).
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Right: Withdraw Request */}
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <IndianRupee className="h-5 w-5" />
                    Withdraw
                  </CardTitle>

                  <div className="text-sm text-muted-foreground mt-1 space-y-1">
                    <div>
                      Available:{" "}
                      <span className="font-semibold text-navy">Rs. {Math.round(walletAvailable)}</span>
                    </div>
                    <div className="text-xs">
                      Total: Rs. {Math.round(walletTotal)} • Hold: Rs. {Math.round(walletHold)}
                    </div>
                    <div className="text-xs">Fee: {WITHDRAW_FEE_PERCENT}% (TDS + PLATFORM FEE)</div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Amount</label>
                    <Input
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      placeholder="Enter amount"
                      inputMode="numeric"
                    />

                    {/* ✅ live fee preview */}
                    {Number(withdrawAmount) > 0 ? (
                      <div className="mt-2 rounded-lg border bg-slate-50 p-3 text-xs text-slate-700">
                        {(() => {
                          const a = Number(withdrawAmount);
                          const { fee, net } = calcWithdrawFee(a);
                          return (
                            <div className="space-y-1">
                              <div className="flex justify-between">
                                <span>Requested</span>
                                <span className="font-semibold">Rs. {Math.round(a)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Fee ({WITHDRAW_FEE_PERCENT}% TDS + PLATFORM FEE)</span>
                                <span className="font-semibold">Rs. {Math.round(fee)}</span>
                              </div>
                              <div className="flex justify-between border-t pt-1">
                                <span>You will receive</span>
                                <span className="font-semibold">Rs. {Math.round(net)}</span>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    ) : null}

                    <p className="text-xs text-muted-foreground mt-2">Withdrawals are processed after verification.</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Note (Optional)</label>
                    <Textarea
                      value={withdrawNote}
                      onChange={(e) => setWithdrawNote(e.target.value)}
                      placeholder="Any note for admin..."
                      className="min-h-[90px]"
                    />
                  </div>

                  <Button
                    onClick={requestWithdraw}
                    disabled={loadingSections.withdraw}
                    className="w-full bg-accent text-white hover:bg-accent/90"
                  >
                    {loadingSections.withdraw ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                    Submit Withdraw Request
                  </Button>

                  {!bankSaved ? (
                    <div className="p-3 rounded-lg border bg-yellow-50 text-yellow-800 text-xs">
                      Please save your bank details first.
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            </div>

            {/* Withdrawals History */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Withdrawal History
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">Track your withdrawal request status.</p>
                </div>
                <Button variant="outline" size="sm" onClick={fetchWithdrawData} disabled={loadingSections.withdraw}>
                  {loadingSections.withdraw ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Refresh
                </Button>
              </CardHeader>

              <CardContent>
                {loadingSections.withdraw ? (
                  <div className="space-y-3">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : withdrawals.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">No withdrawals yet.</div>
                ) : (
                  <div className="overflow-x-auto border rounded-lg">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b">
                        <tr className="text-left">
                          <th className="p-3 font-semibold text-gray-700">Date</th>
                          <th className="p-3 font-semibold text-gray-700">Amount</th>
                          <th className="p-3 font-semibold text-gray-700">Status</th>
                          <th className="p-3 font-semibold text-gray-700">Reference</th>
                          <th className="p-3 font-semibold text-gray-700">Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {withdrawals.map((w) => (
                          <tr key={w._id} className="border-b hover:bg-gray-50">
                            <td className="p-3 text-muted-foreground">{formatDate(w.createdAt)}</td>
                            <td className="p-3 font-bold text-navy">Rs. {Math.round(w.amount)}</td>
                            <td className="p-3">{getWithdrawStatusBadge(w.status)}</td>
                            <td className="p-3 text-muted-foreground">{w.referenceId || "-"}</td>
                            <td className="p-3 text-muted-foreground">
                              {w.status === "rejected" ? w.rejectReason || "Rejected" : w.note || "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Button className="w-full" onClick={() => copyToClipboard(referralCode, "code")}>
            <Copy className="h-4 w-4 mr-2" />
            Copy Code
          </Button>
          <Button className="w-full" variant="outline" onClick={shareReferral}>
            <Share2 className="h-4 w-4 mr-2" />
            Share Link
          </Button>
          <Button className="w-full" variant="secondary" onClick={() => setActiveTab("withdraw")}>
            <IndianRupee className="h-4 w-4 mr-2" />
            Withdraw
          </Button>
          <Button className="w-full" variant="secondary" onClick={() => setActiveTab("analytics")}>
            <BarChart className="h-4 w-4 mr-2" />
            View Analytics
          </Button>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Referrals;

