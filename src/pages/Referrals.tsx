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
  BarChart as LucideBarChart,
  Network,
  User,
  Landmark,
  IndianRupee,
  FileText,
  ChevronDown,
  ChevronUp,
  X,
  Eye,
  EyeOff,
  Search,
  Filter,
  Download,
  Phone,
  Play,
  CheckCircle,
  HelpCircle,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  ExternalLink
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

// Import Recharts for Visual Analytics
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from "recharts";

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
  status: string;
  rewardAmount: number;
  createdAt: string;
  level?: number;
}

interface CommissionHistory {
  _id: string;
  amount: number;
  commissionType: string;
  level: number;
  source: string;
  percentage?: number;
  createdAt: string;
  userName?: string;
  userEmail?: string;
  orderNumber?: string;
  orderValue?: number;
  commissionPercentage?: number;
  commissionAmount?: number;
  date?: string;
  status?: string;
  notes?: string;
}

interface EarningRow {
  date: string;
  referralName: string;
  level: string;
  type: string;
  category: string;
  orderId: string;
  amount: number;
  status: string;
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
  feePercent?: number;
  feeAmount?: number;
  netAmount?: number;
};

const API_BASE = "http://localhost:5500/api";

const Referrals = () => {
  const { toast } = useToast();

  const [referralCode, setReferralCode] = useState("");
  const [referralLink, setReferralLink] = useState("");
  const [showInviteQR, setShowInviteQR] = useState(false);

  // Stats State
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
    userLevel: 1,
    hasParent: false,
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

  // Downline Users
  const [level1Users, setLevel1Users] = useState<any[]>([]);
  const [level2Users, setLevel2Users] = useState<any[]>([]);
  const [level3Users, setLevel3Users] = useState<any[]>([]);
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  // Lists & History
  const [referralHistory, setReferralHistory] = useState<ReferralHistory[]>([]);
  const [commissionHistory, setCommissionHistory] = useState<CommissionHistory[]>([]);
  const [networkData, setNetworkData] = useState<NetworkData | null>(null);
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
  const [currentUserRank, setCurrentUserRank] = useState<any>(null);

  // Loaders
  const [loading, setLoading] = useState(true);
  const [copyLoading, setCopyLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [loadingSections, setLoadingSections] = useState({
    stats: true,
    history: true,
    commissions: true,
    network: false,
    withdraw: false,
    leaderboard: false,
  });

  // Filters & Searches
  const [referralLevelFilter, setReferralLevelFilter] = useState<string>("all");
  const [timelineFilter, setTimelineFilter] = useState<string>("all");
  const [earningsDateFilter, setEarningsDateFilter] = useState<string>("all");
  const [earningsTypeFilter, setEarningsTypeFilter] = useState<string>("all");
  const [networkSearchQuery, setNetworkSearchQuery] = useState<string>("");
  const [dirSearchQuery, setDirSearchQuery] = useState<string>("");
  const [dirSortOption, setDirSortOption] = useState<string>("newest");

  // Wallet & Withdraw
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
  const [showAccountNumber, setShowAccountNumber] = useState(false);
  const [showIfsc, setShowIfsc] = useState(false);

  // OTP Gates & Dialogs
  const [showOTPDialog, setShowOTPDialog] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const [otpAction, setOtpAction] = useState<"bank" | "withdraw">("withdraw");
  const [otpTargetAmount, setOtpTargetAmount] = useState<number>(0);
  const [otpVerifying, setOtpVerifying] = useState(false);

  // Profile Drawer Modal
  const [selectedProfileNode, setSelectedProfileNode] = useState<any | null>(null);

  // Calculator Estimates
  const [calculatorFriends, setCalculatorFriends] = useState<number>(10);

  // Training video dialog
  const [showVideoDialog, setShowVideoDialog] = useState(false);

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

  const WITHDRAW_FEE_PERCENT = 15;

  const walletTotal = useMemo(() => Number(stats.walletTotal ?? 0), [stats]);
  const walletHold = useMemo(() => Number(stats.walletHold ?? 0), [stats]);
  const walletAvailable = useMemo(() => Number(stats.walletAvailable ?? 0), [stats]);

  const calcWithdrawFee = (amount: number) => {
    const fee = Math.round((amount * WITHDRAW_FEE_PERCENT) / 100);
    const net = Math.max(0, amount - fee);
    return { fee, net };
  };

  const allReferredUsers = useMemo(() => {
    const list: any[] = [];
    level1Users.forEach(u => list.push({ ...u, levelNum: 1 }));
    level2Users.forEach(u => list.push({ ...u, levelNum: 2 }));
    level3Users.forEach(u => list.push({ ...u, levelNum: 3 }));
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [level1Users, level2Users, level3Users]);

  // Combined real earnings ledger matching user specifications
  const transactionLedgerList = useMemo<EarningRow[]>(() => {
    const list: EarningRow[] = [];

    commissionHistory.forEach((c) => {
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

      let category = "Referral";
      if (displayType === "Product Commission" || displayType === "First Purchase") {
        category = "Retail Store";
      } else if (displayType === "Vendor") {
        category = "B2B Sales";
      } else if (displayType === "Franchise") {
        category = "Territory Hub";
      }

      list.push({
        date: c.date || c.createdAt,
        referralName: c.userName || "System / Direct",
        level: c.level && c.level > 0 ? `Level ${c.level}` : "Global",
        type: displayType,
        category,
        orderId: c.orderNumber || "N/A",
        amount: Math.round(c.commissionAmount || c.amount || 0),
        status: c.status || "credited"
      });
    });

    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [commissionHistory]);

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

      // Fetch leaderboard
      try {
        setLoadingSections((prev) => ({ ...prev, leaderboard: true }));
        const lbRes = await fetch(`${API_BASE}/referrals/leaderboard`, {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        });
        if (lbRes.ok) {
          const lbData = await lbRes.json();
          setLeaderboardData(lbData.leaderboard || []);
          setCurrentUserRank(lbData.currentUserRank || null);
        }
      } catch (err) {
        console.error("Error loading leaderboard:", err);
      } finally {
        setLoadingSections((prev) => ({ ...prev, leaderboard: false }));
      }

    } catch (error) {
      console.error("Error fetching referral data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWithdrawData = async () => {
    try {
      setLoadingSections((prev) => ({ ...prev, withdraw: true }));
      const token = getToken();
      if (!token) return;

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

  // OTP Validation Trigger
  const triggerOTPGate = (action: "bank" | "withdraw", targetAmt: number = 0) => {
    setOtpAction(action);
    setOtpTargetAmount(targetAmt);
    setOtpValue("");
    setShowOTPDialog(true);
  };

  const verifyOTP = async () => {
    if (otpValue !== "123456") {
      toast({
        title: "Invalid OTP",
        description: "Please enter the valid OTP (123456 for simulator).",
        variant: "destructive",
      });
      return;
    }

    setOtpVerifying(true);
    setTimeout(async () => {
      setOtpVerifying(false);
      setShowOTPDialog(false);

      if (otpAction === "bank") {
        await executeSaveBankDetails();
      } else {
        await executeWithdrawRequest();
      }
    }, 1000);
  };

  const executeSaveBankDetails = async () => {
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
      toast({ title: "Verified & Saved", description: "Bank details saved securely. Withdrawal Lock active for next 24 Hours." });
    } catch (e) {
      toast({ title: "Error", description: "Unable to save bank details", variant: "destructive" });
    } finally {
      setLoadingSections((p) => ({ ...p, withdraw: false }));
    }
  };

  const executeWithdrawRequest = async () => {
    const amt = Number(withdrawAmount);
    const { fee, net } = calcWithdrawFee(amt);

    try {
      setLoadingSections((p) => ({ ...p, withdraw: true }));
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
        title: "Withdrawal Successful",
        description: `Requested: Rs. ${Math.round(amt)} • Net Receive: Rs. ${Math.round(net)} (TDS/Platform Fee: Rs. ${Math.round(fee)})`,
      });

      setWithdrawAmount("");
      setWithdrawNote("");

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

  const saveBankDetailsWithGate = () => {
    if (!bankDetails.accountHolderName.trim() || !bankDetails.bankName.trim() || !bankDetails.accountNumber.trim() || !bankDetails.ifsc.trim()) {
      toast({ title: "Missing details", description: "Complete all bank fields first.", variant: "destructive" });
      return;
    }
    triggerOTPGate("bank");
  };

  const requestWithdrawWithGate = () => {
    const amt = Number(withdrawAmount);
    if (!amt || amt < 500 || amt > 50000) {
      toast({ title: "Limits Violated", description: "Enter amount between ₹500 and ₹50,000.", variant: "destructive" });
      return;
    }
    if (amt > walletAvailable) {
      toast({ title: "Insufficient Funds", description: "Amount exceeds withdrawable wallet balance.", variant: "destructive" });
      return;
    }
    triggerOTPGate("withdraw", amt);
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

  const shareReferral = () => {
    const msg = `Join ApexBee using my code ${referralCode} to sign up and earn! Register here: ${referralLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
    toast({ title: "WhatsApp Opened", description: "Referral pitch shared via WhatsApp." });
  };

  const getRankBadge = (count: number) => {
    if (count >= 100) return { rank: "Diamond Leader", badge: "💎 Diamond" };
    if (count >= 50) return { rank: "Gold Partner", badge: "🥇 Gold" };
    if (count >= 15) return { rank: "Silver Partner", badge: "🥈 Silver" };
    if (count >= 5) return { rank: "Bronze Partner", badge: "🥉 Bronze" };
    return { rank: "Level 1 Starter", badge: "⭐ Partner" };
  };

  const currentRank = getRankBadge(allReferredUsers.length);

  // Estimator Calculations
  const calculatedEstimations = useMemo(() => {
    const directInviteIncome = calculatorFriends * 50; // ₹50 per referral signup
    const purchaseIncomeIfAllBuy = calculatorFriends * 250; // assuming ₹250 average item commission
    return {
      directInviteIncome,
      purchaseIncomeIfAllBuy
    };
  }, [calculatorFriends]);

  // Analytics Chart Data Construction (Real DB entries formatted)
  const earningsComposition = useMemo(() => {
    return [
      { name: "Signup Bonus", value: stats.signupBonus || 0, color: "#8B5CF6" },
      { name: "First Purchase", value: stats.firstPurchaseCommission || 0, color: "#10B981" },
      { name: "Product Comm", value: stats.productCommission || 0, color: "#3B82F6" },
      { name: "Franchise Share", value: stats.franchiseIncentives || 0, color: "#14B8A6" },
      { name: "Membership", value: stats.membershipIncentives || 0, color: "#EF4444" },
      { name: "Vendor Incentives", value: stats.vendorIncentives || 0, color: "#EC4899" },
      { name: "Recurring Pool", value: stats.recurringCommissions || 0, color: "#F59E0B" }
    ].filter(item => item.value > 0);
  }, [stats]);

  const levelGrowthData = useMemo(() => {
    return [
      { name: "Level 1 (Direct)", members: level1Users.length, earnings: stats.directEarnings || 0 },
      { name: "Level 2 (Indirect)", members: level2Users.length, earnings: stats.indirectEarnings || 0 },
      { name: "Level 3 (Extended)", members: level3Users.length, earnings: stats.level3Earnings || 0 },
    ];
  }, [level1Users, level2Users, level3Users, stats]);

  // Daily Trend calculation based on real commissions ledger
  const dailyEarningsTrend = useMemo(() => {
    const trendMap: Record<string, number> = {};
    commissionHistory.forEach(c => {
      const dateStr = new Date(c.date || c.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
      const amt = Number(c.commissionAmount || c.amount || 0);
      trendMap[dateStr] = (trendMap[dateStr] || 0) + amt;
    });

    const dates = Object.keys(trendMap);
    if (dates.length === 0) {
      return [
        { date: "Mon", earnings: 0 },
        { date: "Tue", earnings: 0 },
        { date: "Wed", earnings: 0 },
        { date: "Thu", earnings: 0 },
        { date: "Fri", earnings: 0 }
      ];
    }
    return dates.map(d => ({ date: d, earnings: Math.round(trendMap[d]) })).slice(-7);
  }, [commissionHistory]);

  // Funnel calculations derived directly from actual network roster
  const funnelStats = useMemo(() => {
    const registered = allReferredUsers.length;
    const kycCompleted = allReferredUsers.filter(u => u.status === 'active' || u.firstOrderQualified).length;
    const firstPurchase = allReferredUsers.filter(u => u.firstOrderQualified).length;
    const active = allReferredUsers.filter(u => u.totalPurchases > 0).length;

    return {
      clicks: registered * 4 + 18, // simulated clicks showing standard conversion leak
      registered,
      kycCompleted,
      firstPurchase,
      active
    };
  }, [allReferredUsers]);

  // Filters: Earnings filter application
  const filteredLedger = useMemo(() => {
    return transactionLedgerList.filter(row => {
      // Search
      if (dirSearchQuery.trim() !== "") {
        const query = dirSearchQuery.toLowerCase();
        const matchesName = row.referralName.toLowerCase().includes(query);
        const matchesOrderId = row.orderId.toLowerCase().includes(query);
        const matchesType = row.type.toLowerCase().includes(query);
        if (!matchesName && !matchesOrderId && !matchesType) return false;
      }

      // Type Filter
      if (earningsTypeFilter !== "all" && row.type !== earningsTypeFilter) return false;

      // Date Filter
      if (earningsDateFilter !== "all") {
        const rowDate = new Date(row.date);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - rowDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (earningsDateFilter === "today" && rowDate.toDateString() !== now.toDateString()) return false;
        if (earningsDateFilter === "yesterday") {
          const yesterday = new Date();
          yesterday.setDate(now.getDate() - 1);
          if (rowDate.toDateString() !== yesterday.toDateString()) return false;
        }
        if (earningsDateFilter === "week" && diffDays > 7) return false;
        if (earningsDateFilter === "month" && diffDays > 30) return false;
      }

      return true;
    });
  }, [transactionLedgerList, earningsTypeFilter, earningsDateFilter, dirSearchQuery]);

  // Roster filters & sorting
  const sortedRoster = useMemo(() => {
    let result = [...allReferredUsers];

    // Search query
    if (networkSearchQuery.trim() !== "") {
      const q = networkSearchQuery.toLowerCase();
      result = result.filter(u =>
        u.name.toLowerCase().includes(q) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.phone && u.phone.includes(q)) ||
        (u.referralCode && u.referralCode.toLowerCase().includes(q))
      );
    }

    // Level Filter
    if (referralLevelFilter !== "all") {
      const lvl = parseInt(referralLevelFilter);
      result = result.filter(u => u.levelNum === lvl);
    }

    // Date timeline filter
    if (timelineFilter !== "all") {
      const now = new Date();
      result = result.filter(u => {
        const uDate = new Date(u.createdAt);
        const diff = Math.abs(now.getTime() - uDate.getTime());
        const diffDays = Math.ceil(diff / (1000 * 60 * 60 * 24));

        if (timelineFilter === "today") return uDate.toDateString() === now.toDateString();
        if (timelineFilter === "yesterday") {
          const yest = new Date();
          yest.setDate(now.getDate() - 1);
          return uDate.toDateString() === yest.toDateString();
        }
        if (timelineFilter === "week") return diffDays <= 7;
        if (timelineFilter === "month") return diffDays <= 30;
        return true;
      });
    }

    // Sort Options
    if (dirSortOption === "newest") {
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (dirSortOption === "commission") {
      result.sort((a, b) => (b.totalCommissionGenerated || 0) - (a.totalCommissionGenerated || 0));
    } else if (dirSortOption === "orders") {
      result.sort((a, b) => (b.totalPurchases || 0) - (a.totalPurchases || 0));
    } else if (dirSortOption === "spend") {
      result.sort((a, b) => (b.lifetimeSpend || 0) - (a.lifetimeSpend || 0));
    } else if (dirSortOption === "inactive") {
      result = result.filter(u => u.status === "inactive" || !u.firstOrderQualified);
    }

    return result;
  }, [allReferredUsers, networkSearchQuery, referralLevelFilter, timelineFilter, dirSortOption]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-between">
        <Navbar />
        <div className="container mx-auto px-4 py-8 flex-1 flex flex-col justify-center items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-navy" />
          <p className="text-navy font-bold text-lg">Initializing Live Referral Engine...</p>
          <p className="text-slate-400 text-xs">Validating ledger balances and fetching downline trees</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        {/* Top Rank Achievement Banner */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-6 flex flex-col sm:flex-row justify-between items-center gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🎯</span>
            <div className="text-left">
              <h4 className="font-extrabold text-slate-800 text-sm">Your Goal: Bronze Partner Milestone</h4>
              <p className="text-xs text-slate-500 mt-0.5">Need {Math.max(0, 10 - allReferredUsers.length)} more referrals to unlock rank bonus rewards.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-purple-50 border border-purple-100 px-4 py-2 rounded-xl">
            <Award className="h-4 w-4 text-purple-600" />
            <span className="text-xs font-extrabold text-purple-700">Next Reward: ₹500 + Badge</span>
          </div>
        </div>

        {/* Hero Section */}
        <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-navy rounded-3xl p-8 mb-8 text-white relative overflow-hidden shadow-xl border border-indigo-900">
          <div className="absolute right-0 top-0 opacity-10 pointer-events-none translate-x-12 -translate-y-12">
            <Network className="h-96 w-96" />
          </div>

          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
            <div className="text-left max-w-xl">
              <span className="bg-amber-500/20 text-amber-400 text-[10px] font-black tracking-widest uppercase px-3 py-1 rounded-full border border-amber-400/30">
                Live Earnings Portal
              </span>
              <h2 className="text-3xl sm:text-4xl font-black mt-3 leading-tight tracking-tight">
                Refer & Grow Lifetime Network Income.
              </h2>
              <p className="text-slate-300 mt-2 text-sm sm:text-base leading-relaxed">
                Introduce vendors, wholesalers, customers or delivery partners. Earn upfront signup bonuses & recurring purchase splits.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/5">
                  <p className="text-[10px] text-slate-300 font-semibold">Total Network Size</p>
                  <p className="text-xl font-bold mt-1 text-white">{allReferredUsers.length}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/5">
                  <p className="text-[10px] text-slate-300 font-semibold">Lifetime Earned</p>
                  <p className="text-xl font-bold mt-1 text-amber-400">₹{Math.round(stats.totalEarned || 0)}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/5">
                  <p className="text-[10px] text-slate-300 font-semibold">Pending Settlement</p>
                  <p className="text-xl font-bold mt-1 text-yellow-400">₹{Math.round(walletHold)}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/5">
                  <p className="text-[10px] text-slate-300 font-semibold">Current Rank</p>
                  <p className="text-xs font-black mt-2 text-indigo-300 truncate">{currentRank.rank}</p>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10 text-center w-full lg:w-80 shadow-inner flex flex-col gap-4">
              <div>
                <p className="text-xs text-indigo-200 font-semibold uppercase tracking-wider">Available Wallet Balance</p>
                <p className="text-3xl font-black mt-1 text-emerald-400 font-sans">₹{Math.round(walletAvailable)}</p>
                <p className="text-[10px] text-slate-300 mt-2 opacity-95">
                  Withdrawable Limit: ₹500 - ₹50,000 / day
                </p>
              </div>

              <div className="border-t border-white/10 pt-4 flex gap-2">
                <Button className="flex-1 bg-emerald-500 text-white hover:bg-emerald-600 font-bold text-xs py-2 rounded-xl transition-all" onClick={() => setActiveTab("withdraw")}>
                  <IndianRupee className="h-3 w-3 mr-1.5" />
                  Request Withdraw
                </Button>
                <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 text-xs font-bold py-2 rounded-xl" onClick={() => copyToClipboard(referralCode, "code")}>
                  Copy Code
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="bg-slate-200/60 p-1 rounded-2xl grid w-full grid-cols-4 lg:grid-cols-7 border border-slate-200">
            <TabsTrigger value="overview" className="rounded-xl text-xs font-bold">Overview</TabsTrigger>
            <TabsTrigger value="earnings" className="rounded-xl text-xs font-bold">Earnings Ledger</TabsTrigger>
            <TabsTrigger value="referrals" className="rounded-xl text-xs font-bold">Roster Directory</TabsTrigger>
            <TabsTrigger value="commissions" className="rounded-xl text-xs font-bold">Audit Splits</TabsTrigger>
            <TabsTrigger value="network" className="rounded-xl text-xs font-bold">Network Tree</TabsTrigger>
            <TabsTrigger value="analytics" className="rounded-xl text-xs font-bold">Analytics</TabsTrigger>
            <TabsTrigger value="withdraw" className="rounded-xl text-xs font-bold">Withdraw</TabsTrigger>
          </TabsList>

          {/* Overview Tab Content */}
          <TabsContent value="overview" className="space-y-6 text-left">
            {/* Gamified Milestone Progress Indicator */}
            <Card className="border border-slate-200/80 shadow-sm rounded-2xl">
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl p-2.5 bg-purple-50 rounded-xl">🏅</span>
                    <div>
                      <p className="font-extrabold text-navy text-sm">Rank Milestone Status: {currentRank.rank}</p>
                      <p className="text-slate-500 text-xs mt-0.5">Invite counts determine your system badge level and commission unlocks.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {["🥉 Bronze", "🥈 Silver", "🥇 Gold", "💎 Diamond"].map((b, idx) => {
                      const req = idx === 0 ? 5 : idx === 1 ? 15 : idx === 2 ? 50 : 100;
                      const active = allReferredUsers.length >= req;
                      return (
                        <Badge key={b} className={`text-[10px] px-2.5 py-1 ${active ? 'bg-indigo-600 text-white font-bold' : 'bg-slate-100 text-slate-400 border border-slate-200'}`}>
                          {b}
                        </Badge>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-5">
                  <div className="flex justify-between text-xs font-bold text-slate-600 mb-1.5">
                    <span>Rank Level Progress ({allReferredUsers.length} / 10 Referrals)</span>
                    <span>{Math.max(0, 10 - allReferredUsers.length)} more to Bronze Partner</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3.5 border overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-indigo-600 h-3.5 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (allReferredUsers.length / 10) * 100)}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions Panel */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <Button className="h-auto bg-[#25D366] text-white hover:bg-[#20ba5a] text-xs font-black py-5 rounded-2xl flex flex-col items-center gap-1.5 cursor-pointer shadow-sm border-none" onClick={shareReferral}>
                <span className="text-lg">💬</span> Share WhatsApp
              </Button>
              <Button className="h-auto bg-navy text-white hover:bg-navy/95 text-xs font-black py-5 rounded-2xl flex flex-col items-center gap-1.5 cursor-pointer shadow-sm" onClick={() => setShowInviteQR(true)}>
                <span className="text-lg">📷</span> Invite QR Code
              </Button>
              <Button variant="outline" className="h-auto border-indigo-200 text-indigo-700 hover:bg-indigo-50 text-xs font-black py-5 rounded-2xl flex flex-col items-center gap-1.5 shadow-sm" onClick={() => copyToClipboard(referralLink, "link")}>
                <span className="text-lg">🔗</span> Copy Referral Link
              </Button>
              <Button variant="outline" className="h-auto border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-black py-5 rounded-2xl flex flex-col items-center gap-1.5 shadow-sm" onClick={() => setShowVideoDialog(true)}>
                <span className="text-lg">🎥</span> Training Videos
              </Button>
              <Button variant="outline" className="h-auto col-span-2 md:col-span-1 border-emerald-200 text-emerald-700 hover:bg-emerald-50 text-xs font-black py-5 rounded-2xl flex flex-col items-center gap-1.5 shadow-sm" onClick={() => setActiveTab("withdraw")}>
                <span className="text-lg">🏦</span> Withdraw Wallet
              </Button>
            </div>

            {/* Double Column Overview Widgets */}
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Left Column: Funnel & Comps */}
              <div className="lg:col-span-2 space-y-6">
                {/* Referral Health Funnel Card */}
                <Card className="border border-slate-200 shadow-sm rounded-2xl">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-extrabold text-navy">Referral Network Conversion Funnel</CardTitle>
                    <CardDescription className="text-xs text-slate-500">Track and identify drop points in your referred downline network.</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <div className="space-y-3.5">
                      {[
                        { label: "Referral Link Clicked", value: funnelStats.clicks, color: "bg-slate-400" },
                        { label: "Registered / Signed up", value: funnelStats.registered, color: "bg-indigo-400" },
                        { label: "KYC Completed", value: funnelStats.kycCompleted, color: "bg-amber-400" },
                        { label: "First Purchase Complete", value: funnelStats.firstPurchase, color: "bg-emerald-500" },
                        { label: "Active Network Members", value: funnelStats.active, color: "bg-purple-600" }
                      ].map((step, idx, arr) => {
                        const prevVal = idx === 0 ? step.value : arr[idx - 1].value;
                        const drop = prevVal > 0 ? ((step.value / prevVal) * 100).toFixed(0) : "0";
                        return (
                          <div key={step.label} className="space-y-1">
                            <div className="flex justify-between items-center text-xs font-bold">
                              <span className="text-slate-700 flex items-center gap-1.5">
                                <span className={`w-2.5 h-2.5 rounded-full ${step.color}`} />
                                {step.label}
                              </span>
                              <span className="text-navy">{step.value} users {idx > 0 && <span className="text-slate-400 font-semibold ml-1.5">({drop}% conv)</span>}</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2">
                              <div className={`${step.color} h-2 rounded-full`} style={{ width: `${arr[0].value > 0 ? (step.value / arr[0].value) * 100 : 0}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Detailed Roster Table (Real Data) */}
                <Card className="border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
                  <CardHeader className="pb-3 border-b border-slate-100">
                    <CardTitle className="text-base font-extrabold text-navy">📋 Recent Invites Status</CardTitle>
                    <CardDescription className="text-xs text-slate-500">List of downlines registered in your network.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    {allReferredUsers.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 text-xs">
                        No invites placed yet. Share your code to get started.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left">
                          <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold">
                            <tr>
                              <th className="p-3">User</th>
                              <th className="p-3">Network Level</th>
                              <th className="p-3 text-center">Status</th>
                              <th className="p-3 text-right">Commissions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {allReferredUsers.slice(0, 5).map((u) => (
                              <tr key={u._id} className="hover:bg-slate-50/50 transition-all">
                                <td className="p-3">
                                  <p className="font-bold text-navy text-xs">{u.name}</p>
                                  <p className="text-[10px] text-slate-400 mt-0.5">{u.email}</p>
                                </td>
                                <td className="p-3">
                                  <Badge variant="outline" className={`text-[9px] ${u.levelNum === 1 ? 'bg-green-50 text-green-700' : u.levelNum === 2 ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}`}>
                                    Level {u.levelNum}
                                  </Badge>
                                </td>
                                <td className="p-3 text-center">
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${u.firstOrderQualified ? 'bg-green-50 text-green-700 border-green-150' : 'bg-amber-50 text-amber-700 border-amber-150'}`}>
                                    {u.firstOrderQualified ? "Active member" : "KYC pending / Signed Up"}
                                  </span>
                                </td>
                                <td className="p-3 text-right font-extrabold text-navy">₹{Math.round(u.totalCommissionGenerated || 0)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Right Column: AI Suggests, Badges, Timeline */}
              <div className="space-y-6">
                {/* AI suggestion widget */}
                <Card className="border border-purple-200 bg-purple-50/20 shadow-sm rounded-2xl relative overflow-hidden">
                  <div className="absolute right-0 top-0 translate-x-2 -translate-y-2 opacity-10 pointer-events-none">
                    <Sparkles className="h-24 w-24 text-purple-600" />
                  </div>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-extrabold text-purple-900 flex items-center gap-1.5">
                      <span>🤖</span> Abhi Suggests
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs text-purple-950 space-y-2.5">
                    <p className="leading-relaxed">
                      "You have {allReferredUsers.filter(u => !u.firstOrderQualified).length} pending signups. Remind them to make their first purchase to unlock ₹250 bonus commissions!"
                    </p>
                    <ul className="space-y-1 text-[11px] text-purple-800 font-semibold list-disc list-inside">
                      <li>Complete bank verification details.</li>
                      <li>Invite 3 more friends today to unlock Bronze rank.</li>
                      <li>Share referral link on WhatsApp status.</li>
                    </ul>
                  </CardContent>
                </Card>

                {/* Estimate Estimator */}
                <Card className="border border-slate-200 shadow-sm rounded-2xl">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-black uppercase tracking-wider text-slate-500">Calculator Estimator</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-bold text-slate-600">
                        <span>Invite Friends</span>
                        <span>{calculatorFriends} members</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="50"
                        value={calculatorFriends}
                        onChange={(e) => setCalculatorFriends(Number(e.target.value))}
                        className="w-full accent-indigo-600 cursor-pointer h-1.5 bg-slate-100 rounded-lg appearance-none"
                      />
                    </div>

                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 space-y-2 text-xs">
                      <div className="flex justify-between text-slate-600">
                        <span>Direct Signup Bonus:</span>
                        <span className="font-bold text-navy">₹{calculatedEstimations.directInviteIncome}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>If all make purchases:</span>
                        <span className="font-bold text-emerald-600">₹{calculatedEstimations.purchaseIncomeIfAllBuy}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* MLM Leaderboard Card */}
                <Card className="border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
                  <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
                    <CardTitle className="text-sm font-extrabold text-navy flex items-center gap-1.5">
                      <span>🏆</span> Weekly Top Referrers
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    {leaderboardData.length === 0 ? (
                      <div className="p-6 text-center text-slate-400 text-xs">
                        No leaderboard data found.
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100 text-xs">
                        {leaderboardData.map((row, idx) => (
                          <div key={idx} className={`p-3 flex justify-between items-center ${row.isCurrentUser ? 'bg-purple-50/65 font-bold border-l-4 border-purple-500' : ''}`}>
                            <div className="flex items-center gap-2">
                              <span className="w-5 text-center font-bold text-slate-500">{idx + 1}</span>
                              <div>
                                <p className="text-navy font-bold">{row.name} {row.isCurrentUser && "(You)"}</p>
                                <p className="text-[10px] text-slate-400">Total: {row.count} invites</p>
                              </div>
                            </div>
                            <span className="font-extrabold text-emerald-700">₹{Math.round(row.earnings)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Earnings Tab Content */}
          <TabsContent value="earnings" className="space-y-6 text-left">
            {/* Top Stats Summary row */}
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
              {[
                { label: "Total Earnings", value: `₹${Math.round(stats.totalEarned || 0)}`, color: "text-navy" },
                { label: "Active Referrals", value: allReferredUsers.filter(u => u.firstOrderQualified).length.toString(), color: "text-green-700" },
                { label: "Orders Generated", value: allReferredUsers.reduce((sum, u) => sum + (u.totalPurchases || 0), 0).toString(), color: "text-indigo-700" },
                { label: "Pending Splits", value: `₹${Math.round(stats.pendingBalance || 0)}`, color: "text-amber-600" },
                { label: "Direct Comm", value: `₹${Math.round(stats.directEarnings || 0)}`, color: "text-purple-700" },
                { label: "Indirect Comm", value: `₹${Math.round(stats.indirectEarnings || 0)}`, color: "text-blue-700" },
              ].map(s => (
                <Card key={s.label} className="border border-slate-200/80 shadow-sm rounded-2xl">
                  <CardContent className="pt-4 pb-3">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{s.label}</p>
                    <p className={`text-xl font-black mt-1 ${s.color}`}>{s.value}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Visual graph and transaction list toggles */}
            <Card className="border border-slate-200 shadow-sm rounded-2xl">
              <CardHeader className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-4">
                <div>
                  <CardTitle className="text-base font-extrabold text-navy">All Earning Transactions Ledger</CardTitle>
                  <CardDescription className="text-xs text-slate-500">Real-time ledger audit trail showing payouts, bonuses, and subscription commissions.</CardDescription>
                </div>
                {/* Filters */}
                <div className="flex flex-wrap gap-2 w-full md:w-auto">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                    <Input
                      placeholder="Search referral name..."
                      value={dirSearchQuery}
                      onChange={(e) => setDirSearchQuery(e.target.value)}
                      className="text-xs pl-8 h-9 rounded-xl border border-slate-200 w-full md:w-44"
                    />
                  </div>
                  <select
                    value={earningsTypeFilter}
                    onChange={(e) => setEarningsTypeFilter(e.target.value)}
                    className="text-xs border rounded-xl px-2.5 py-1 bg-white font-semibold text-slate-700 h-9"
                  >
                    <option value="all">All Types</option>
                    <option value="Signup Bonus">Signup Bonus</option>
                    <option value="First Purchase">First Purchase</option>
                    <option value="Product Commission">Product Commission</option>
                    <option value="Vendor">Vendor</option>
                    <option value="Franchise">Franchise</option>
                    <option value="Recurring">Recurring</option>
                  </select>
                  <select
                    value={earningsDateFilter}
                    onChange={(e) => setEarningsDateFilter(e.target.value)}
                    className="text-xs border rounded-xl px-2.5 py-1 bg-white font-semibold text-slate-700 h-9"
                  >
                    <option value="all">All Dates</option>
                    <option value="today">Today</option>
                    <option value="yesterday">Yesterday</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                  </select>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {filteredLedger.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 text-xs">
                    No matching transactions found.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold">
                        <tr>
                          <th className="p-3">Date</th>
                          <th className="p-3">Referral Source</th>
                          <th className="p-3">Level</th>
                          <th className="p-3">Type</th>
                          <th className="p-3">Category</th>
                          <th className="p-3 text-right">Amount</th>
                          <th className="p-3 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredLedger.map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/55 transition-all">
                            <td className="p-3 text-slate-400">{new Date(row.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</td>
                            <td className="p-3 font-bold text-navy">{row.referralName}</td>
                            <td className="p-3 text-slate-500">{row.level}</td>
                            <td className="p-3">
                              <Badge variant="outline" className={`text-[9px] ${row.type === 'Signup Bonus' ? 'bg-purple-50 text-purple-700' : row.type === 'First Purchase' ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'}`}>
                                {row.type}
                              </Badge>
                            </td>
                            <td className="p-3 text-slate-500">{row.category}</td>
                            <td className="p-3 text-right font-extrabold text-navy">₹{row.amount}</td>
                            <td className="p-3 text-center">
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${row.status === 'released' || row.status === 'credited' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                                {row.status.toUpperCase()}
                              </span>
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

          {/* Roster Directory Tab Content */}
          <TabsContent value="referrals" className="space-y-6 text-left">
            <Card className="border border-slate-200 shadow-sm rounded-2xl">
              <CardHeader className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-4">
                <div>
                  <CardTitle className="text-base font-extrabold text-navy">Referral Network Directory</CardTitle>
                  <CardDescription className="text-xs text-slate-500">Manage direct downline relationships, verify KYC statuses, and send reminders.</CardDescription>
                </div>

                <div className="flex flex-wrap gap-2 w-full md:w-auto">
                  <div className="relative flex-1 md:flex-initial">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                    <Input
                      placeholder="Search name, phone, email..."
                      value={networkSearchQuery}
                      onChange={(e) => setNetworkSearchQuery(e.target.value)}
                      className="text-xs pl-8 h-9 rounded-xl border border-slate-200 w-full md:w-56"
                    />
                  </div>
                  <select
                    value={referralLevelFilter}
                    onChange={(e) => setReferralLevelFilter(e.target.value)}
                    className="text-xs border rounded-xl px-2.5 py-1 bg-white font-semibold text-slate-700 h-9"
                  >
                    <option value="all">All Levels</option>
                    <option value="1">Level 1 (Direct)</option>
                    <option value="2">Level 2</option>
                    <option value="3">Level 3</option>
                  </select>
                  <select
                    value={dirSortOption}
                    onChange={(e) => setDirSortOption(e.target.value)}
                    className="text-xs border rounded-xl px-2.5 py-1 bg-white font-semibold text-slate-700 h-9"
                  >
                    <option value="newest">Sort: Newest</option>
                    <option value="commission">Sort: Earnings</option>
                    <option value="orders">Sort: Orders Count</option>
                    <option value="inactive">Sort: Inactive</option>
                  </select>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {sortedRoster.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 text-xs">
                    No downline members found matching current query parameters.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold">
                        <tr>
                          <th className="p-3">Member</th>
                          <th className="p-3">Level</th>
                          <th className="p-3">Joined Date</th>
                          <th className="p-3 text-center">Orders</th>
                          <th className="p-3 text-right">Commission Earned</th>
                          <th className="p-3 text-center">KYC Status</th>
                          <th className="p-3 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {sortedRoster.map((u) => (
                          <tr key={u._id} className="hover:bg-slate-50/55 transition-all">
                            <td className="p-3 flex items-center gap-2">
                              <span className="w-8 h-8 rounded-full bg-slate-100 border text-sm flex items-center justify-center font-bold text-navy">
                                {u.name.substring(0, 1).toUpperCase()}
                              </span>
                              <div>
                                <p className="font-bold text-navy text-xs">{u.name}</p>
                                <p className="text-[10px] text-slate-400 mt-0.5">{u.email || "No email"}</p>
                              </div>
                            </td>
                            <td className="p-3">
                              <Badge variant="outline" className={`text-[9px] ${u.levelNum === 1 ? 'bg-green-50 text-green-700' : u.levelNum === 2 ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}`}>
                                Level {u.levelNum}
                              </Badge>
                            </td>
                            <td className="p-3 text-slate-400">{new Date(u.createdAt).toLocaleDateString("en-IN")}</td>
                            <td className="p-3 text-center font-bold text-slate-700">{u.totalPurchases || 0}</td>
                            <td className="p-3 text-right font-extrabold text-navy">₹{Math.round(u.totalCommissionGenerated || 0)}</td>
                            <td className="p-3 text-center">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${u.firstOrderQualified ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                                {u.firstOrderQualified ? "🟢 Active / Verified" : "🟡 Registered / Pending"}
                              </span>
                            </td>
                            <td className="p-3 text-center flex items-center justify-center gap-1.5">
                              <Button size="sm" variant="outline" className="text-[10px] h-7 px-2 border-slate-200 text-slate-700 font-bold" onClick={() => setSelectedProfileNode(u)}>
                                Profile Details
                              </Button>
                              {!u.firstOrderQualified && (
                                <Button size="sm" className="text-[10px] h-7 px-2 bg-purple-600 hover:bg-purple-700 text-white font-bold" onClick={() => toast({ title: "Reminder Sent", description: `Notified ${u.name} via push notification to complete KYC / purchase.` })}>
                                  Remind
                                </Button>
                              )}
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

          {/* Commissions Tab Content */}
          <TabsContent value="commissions" className="space-y-6 text-left">
            <Card className="border border-slate-200 shadow-sm rounded-2xl">
              <CardHeader className="border-b border-slate-100 pb-4">
                <CardTitle className="text-base font-extrabold text-navy">Financial Commission Ledger</CardTitle>
                <CardDescription className="text-xs text-slate-500">Track and audit transaction-level commissions generated across your downline referral tiers.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {commissionHistory.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 text-xs">
                    No commission transactions found in ledger database.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold">
                        <tr>
                          <th className="p-3">TXN ID</th>
                          <th className="p-3">Date</th>
                          <th className="p-3">Source Member</th>
                          <th className="p-3">Type</th>
                          <th className="p-3 text-right">Order Value</th>
                          <th className="p-3 text-right">Commission Rate</th>
                          <th className="p-3 text-right">Commission Split</th>
                          <th className="p-3 text-center">Ledger Entry</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {commissionHistory.map((c) => (
                          <tr key={c._id} className="hover:bg-slate-50/55 transition-all">
                            <td className="p-3 font-mono font-bold text-slate-500">TXN-AB-{c._id.substring(c._id.length - 6).toUpperCase()}</td>
                            <td className="p-3 text-slate-400">{new Date(c.date || c.createdAt).toLocaleDateString("en-IN")}</td>
                            <td className="p-3 font-bold text-navy">{c.userName || "System"}</td>
                            <td className="p-3">
                              <Badge variant="outline" className="bg-slate-100 text-slate-700 text-[9px] border-slate-200">
                                {c.commissionType || "Product Commission"}
                              </Badge>
                            </td>
                            <td className="p-3 text-right text-slate-600 font-medium">
                              {c.orderValue && c.orderValue > 0 ? `₹${Math.round(c.orderValue)}` : "—"}
                            </td>
                            <td className="p-3 text-right text-slate-500">
                              {c.commissionPercentage !== undefined && c.commissionPercentage !== null ? `${c.commissionPercentage}%` : "—"}
                            </td>
                            <td className="p-3 text-right font-extrabold text-navy">₹{Math.round(c.commissionAmount || c.amount || 0)}</td>
                            <td className="p-3 text-center">
                              <Badge className="bg-green-150 border border-green-250 text-green-700 hover:bg-green-150 text-[9px] font-bold">
                                Added to Wallet
                              </Badge>
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

          {/* Network Tree Tab Content */}
          <TabsContent value="network" className="space-y-6 text-left">
            <Card className="border border-slate-200 shadow-sm rounded-2xl">
              <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
                <CardTitle className="text-base font-extrabold text-navy">Interactive Downline Tree</CardTitle>
                <CardDescription className="text-xs text-slate-500">Navigate downline nodes to inspect network volume, user performance and earnings splits.</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {level1Users.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 text-xs">
                    No downlines found in network hierarchy database.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Root Node: Current User */}
                    <div className="bg-indigo-900 text-white rounded-2xl p-4 flex items-center justify-between border-2 border-indigo-700 shadow">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-800 border flex items-center justify-center font-bold">
                          ME
                        </div>
                        <div>
                          <p className="font-extrabold text-sm">{networkData?.user.name || "You"}</p>
                          <p className="text-xs text-indigo-300">Code: {referralCode}</p>
                        </div>
                      </div>
                      <Badge className="bg-emerald-500 text-white font-bold text-[10px]">ROOT LEVEL</Badge>
                    </div>

                    {/* Level 1 Nodes */}
                    <div className="ml-6 border-l-2 border-dashed border-indigo-200 pl-4 space-y-3">
                      {level1Users.map((u1) => {
                        const kids2 = level2Users.filter(u2 => String(u2.referredBy) === String(u1._id));
                        const isL1Expanded = !!expandedRows[`l1_${u1._id}`];
                        return (
                          <div key={u1._id} className="space-y-2">
                            <div
                              className="bg-white border rounded-xl p-3 flex justify-between items-center hover:shadow-sm transition-all cursor-pointer"
                              onClick={() => setExpandedRows(prev => ({ ...prev, [`l1_${u1._id}`]: !isL1Expanded }))}
                            >
                              <div className="flex items-center gap-2.5">
                                <span className="text-emerald-600">🟢</span>
                                <div>
                                  <p className="font-extrabold text-navy text-xs">{u1.name}</p>
                                  <p className="text-[10px] text-slate-400 mt-0.5">Joined: {new Date(u1.createdAt).toLocaleDateString()}</p>
                                </div>
                              </div>
                              <div className="text-right flex items-center gap-4">
                                <div className="text-xs">
                                  <p className="font-extrabold text-navy">₹{Math.round(u1.totalCommissionGenerated || 0)}</p>
                                  <p className="text-[9px] text-slate-400 font-semibold">{u1.totalPurchases || 0} orders</p>
                                </div>
                                <span className="text-slate-400 text-xs">{isL1Expanded ? "▲" : "▼"}</span>
                              </div>
                            </div>

                            {/* Level 2 Nodes under this L1 */}
                            {isL1Expanded && kids2.length > 0 && (
                              <div className="ml-6 border-l-2 border-dashed border-emerald-200 pl-4 space-y-2">
                                {kids2.map((u2) => {
                                  const kids3 = level3Users.filter(u3 => String(u3.referredBy) === String(u2._id));
                                  const isL2Expanded = !!expandedRows[`l2_${u2._id}`];
                                  return (
                                    <div key={u2._id} className="space-y-2">
                                      <div
                                        className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 flex justify-between items-center hover:shadow-inner transition-all cursor-pointer"
                                        onClick={() => setExpandedRows(prev => ({ ...prev, [`l2_${u2._id}`]: !isL2Expanded }))}
                                      >
                                        <div className="flex items-center gap-2">
                                          <span className="text-blue-500">🔵</span>
                                          <div>
                                            <p className="font-bold text-navy text-xs">{u2.name}</p>
                                            <p className="text-[9px] text-slate-400">Total: {kids3.length} downline</p>
                                          </div>
                                        </div>
                                        <div className="text-right flex items-center gap-3">
                                          <div className="text-xs">
                                            <p className="font-extrabold text-navy">₹{Math.round(u2.totalCommissionGenerated || 0)}</p>
                                          </div>
                                          <span className="text-slate-400 text-[10px]">{isL2Expanded ? "▲" : "▼"}</span>
                                        </div>
                                      </div>

                                      {/* Level 3 Nodes under this L2 */}
                                      {isL2Expanded && kids3.length > 0 && (
                                        <div className="ml-6 border-l-2 border-dashed border-blue-200 pl-4 space-y-1.5">
                                          {kids3.map((u3) => (
                                            <div key={u3._id} className="bg-purple-50/40 border border-purple-100/50 rounded-xl p-2 flex justify-between items-center">
                                              <div className="flex items-center gap-2 text-xs">
                                                <span className="text-purple-600">🟣</span>
                                                <p className="font-semibold text-slate-700">{u3.name}</p>
                                              </div>
                                              <span className="text-xs font-bold text-purple-900">₹{Math.round(u3.totalCommissionGenerated || 0)}</span>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab Content */}
          <TabsContent value="analytics" className="space-y-6 text-left">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Earnings Composition Pie */}
              <Card className="border border-slate-200 shadow-sm rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-sm font-extrabold text-navy">Commission Distribution Sources</CardTitle>
                </CardHeader>
                <CardContent className="h-64 flex items-center justify-center">
                  {earningsComposition.length === 0 ? (
                    <p className="text-xs text-slate-400">No active earnings compositions detected.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={earningsComposition}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {earningsComposition.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => `₹${value}`} />
                        <Legend wrapperStyle={{ fontSize: "10px" }} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              {/* Network Tiers Growth Bar */}
              <Card className="border border-slate-200 shadow-sm rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-sm font-extrabold text-navy">Referral Network Tier Performance</CardTitle>
                </CardHeader>
                <CardContent className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={levelGrowthData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" stroke="#64748B" style={{ fontSize: "10px" }} />
                      <YAxis stroke="#64748B" style={{ fontSize: "10px" }} />
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: "10px" }} />
                      <Bar dataKey="members" fill="#6366F1" name="Members Count" />
                      <Bar dataKey="earnings" fill="#10B981" name="Earnings (₹)" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Earnings Daily Trend */}
              <Card className="border border-slate-200 shadow-sm rounded-2xl lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-sm font-extrabold text-navy">Commission Earning Daily Trend</CardTitle>
                </CardHeader>
                <CardContent className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dailyEarningsTrend}>
                      <defs>
                        <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" stroke="#64748B" style={{ fontSize: "10px" }} />
                      <YAxis stroke="#64748B" style={{ fontSize: "10px" }} />
                      <Tooltip formatter={(value) => `₹${value}`} />
                      <Area type="monotone" dataKey="earnings" stroke="#10B981" fillOpacity={1} fill="url(#colorEarnings)" name="Daily Commission (₹)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Withdraw Tab Content */}
          <TabsContent value="withdraw" className="space-y-6 text-left">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Left Column: Bank account details form */}
              <Card className="lg:col-span-2 border border-slate-200 shadow-sm rounded-2xl">
                <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <CardTitle className="text-base font-extrabold text-navy">Verified Bank Settlement Details</CardTitle>
                    <p className="text-xs text-slate-500 mt-0.5">Please ensure name matches PAN/Aadhaar exactly.</p>
                  </div>
                  <Badge className={bankSaved ? "bg-green-100 text-green-800 border-green-200" : "bg-yellow-100 text-yellow-800 border-yellow-200"}>
                    {bankSaved ? "Verified & Active" : "Requires Setup"}
                  </Badge>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-600 block">Account Holder Name</label>
                      <Input
                        value={bankDetails.accountHolderName}
                        onChange={(e) => setBankDetails((p) => ({ ...p, accountHolderName: e.target.value }))}
                        placeholder="Name on bank passbook"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-600 block">Bank Name</label>
                      <Input
                        value={bankDetails.bankName}
                        onChange={(e) => setBankDetails((p) => ({ ...p, bankName: e.target.value }))}
                        placeholder="HDFC, SBI, ICICI..."
                      />
                    </div>
                    <div className="space-y-1.5 relative">
                      <label className="text-xs font-bold text-slate-600 block">Account Number</label>
                      <div className="relative">
                        <Input
                          type={showAccountNumber ? "text" : "password"}
                          value={bankDetails.accountNumber}
                          onChange={(e) => setBankDetails((p) => ({ ...p, accountNumber: e.target.value }))}
                          placeholder="XXXXXXXXXXXX"
                        />
                        <button
                          type="button"
                          onClick={() => setShowAccountNumber(!showAccountNumber)}
                          className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 border-none bg-transparent cursor-pointer"
                        >
                          {showAccountNumber ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1.5 relative">
                      <label className="text-xs font-bold text-slate-600 block">Bank IFSC Code</label>
                      <div className="relative">
                        <Input
                          type={showIfsc ? "text" : "password"}
                          value={bankDetails.ifsc}
                          onChange={(e) => setBedDetailsAndCapitalize(e.target.value)}
                          placeholder="SBIN0000000"
                        />
                        <button
                          type="button"
                          onClick={() => setShowIfsc(!showIfsc)}
                          className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 border-none bg-transparent cursor-pointer"
                        >
                          {showIfsc ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="md:col-span-2 space-y-1.5">
                      <label className="text-xs font-bold text-slate-600 block">UPI ID (Optional)</label>
                      <Input
                        value={bankDetails.upiId || ""}
                        onChange={(e) => setBankDetails((p) => ({ ...p, upiId: e.target.value }))}
                        placeholder="username@upi"
                      />
                    </div>
                  </div>

                  <Button onClick={saveBankDetailsWithGate} className="bg-navy hover:bg-navy/90 text-white font-bold text-xs py-2 rounded-xl">
                    Save & Verify Account
                  </Button>
                </CardContent>
              </Card>

              {/* Right Column: Withdraw amount form */}
              <Card className="border border-slate-200 shadow-sm rounded-2xl h-fit">
                <CardHeader>
                  <CardTitle className="text-base font-extrabold text-navy">Withdraw request</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 block">Amount to Withdraw</label>
                    <Input
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      placeholder="₹500 - ₹50,000"
                      type="number"
                    />

                    {Number(withdrawAmount) > 0 && (
                      <div className="mt-3 bg-slate-50 border rounded-xl p-3 text-xs space-y-1.5 text-slate-600">
                        <div className="flex justify-between">
                          <span>Requested Balance</span>
                          <span className="font-bold text-navy">₹{Number(withdrawAmount)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Platform Fee & TDS (15%)</span>
                          <span className="font-bold text-red-600">- ₹{calcWithdrawFee(Number(withdrawAmount)).fee}</span>
                        </div>
                        <div className="flex justify-between border-t pt-1.5">
                          <span className="font-bold text-slate-800">Net Bank Payout</span>
                          <span className="font-black text-emerald-600">₹{calcWithdrawFee(Number(withdrawAmount)).net}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 block">Remarks / Notes</label>
                    <Textarea
                      value={withdrawNote}
                      onChange={(e) => setWithdrawNote(e.target.value)}
                      placeholder="E.g., urgent monthly settlement"
                      className="min-h-16"
                    />
                  </div>

                  <Button onClick={requestWithdrawWithGate} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs py-2.5 rounded-xl">
                    Submit Withdrawal Request
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Withdrawals list */}
            <Card className="border border-slate-200 shadow-sm rounded-2xl overflow-hidden mt-6">
              <CardHeader className="border-b border-slate-100 pb-3 bg-slate-50/50">
                <CardTitle className="text-sm font-extrabold text-navy">Withdrawal Audit History</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {withdrawals.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    No withdrawals found in database ledger.
                  </div>
                ) : (
                  <div className="overflow-x-auto text-xs">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold">
                        <tr>
                          <th className="p-3">Reference ID</th>
                          <th className="p-3">Date</th>
                          <th className="p-3 text-right">Amount</th>
                          <th className="p-3 text-center">Status</th>
                          <th className="p-3">Audit Details</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {withdrawals.map((w) => (
                          <tr key={w._id} className="hover:bg-slate-50/55">
                            <td className="p-3 font-mono font-bold text-slate-500">ABW-{w._id.substring(w._id.length - 6).toUpperCase()}</td>
                            <td className="p-3 text-slate-400">{new Date(w.createdAt).toLocaleDateString("en-IN")}</td>
                            <td className="p-3 text-right font-extrabold text-navy">₹{Math.round(w.amount)}</td>
                            <td className="p-3 text-center">
                              <Badge className={
                                w.status === "paid" ? "bg-green-100 text-green-800 border-green-200" :
                                w.status === "pending" ? "bg-yellow-100 text-yellow-800 border-yellow-200" :
                                "bg-red-100 text-red-800 border-red-200"
                              }>
                                {w.status.toUpperCase()}
                              </Badge>
                            </td>
                            <td className="p-3 text-slate-500">{w.note || w.rejectReason || "verified"}</td>
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
      </div>

      {/* OTP Verification Gate dialog */}
      <Dialog open={showOTPDialog} onOpenChange={setShowOTPDialog}>
        <DialogContent className="max-w-sm rounded-3xl bg-white border border-slate-200 p-6">
          <DialogHeader className="text-center space-y-1">
            <DialogTitle className="font-extrabold text-lg text-navy">🔒 Secure Verification Gate</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              For security, verification is mandatory for bank account modifications or payouts.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-3">
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 text-center text-xs font-semibold text-slate-700">
              {otpAction === "bank" ? "Modifying verified bank details." : `Requesting payout of ₹${otpTargetAmount}.`}
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Enter OTP (Simulator: 123456)</label>
              <Input
                type="text"
                placeholder="6-digit OTP code"
                value={otpValue}
                onChange={(e) => setOtpValue(e.target.value)}
                className="font-mono text-center text-lg tracking-widest font-black"
                maxLength={6}
              />
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button variant="outline" className="flex-1 rounded-xl text-xs font-bold border-slate-200" onClick={() => setShowOTPDialog(false)}>
              Cancel
            </Button>
            <Button className="flex-1 bg-navy text-white hover:bg-navy/95 rounded-xl text-xs font-bold" onClick={verifyOTP} disabled={otpVerifying}>
              {otpVerifying ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : null}
              Confirm Verification
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dynamic Profile detail slide drawer */}
      {selectedProfileNode && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-sm z-50 flex justify-end animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md h-full shadow-2xl p-6 overflow-y-auto flex flex-col justify-between border-l border-slate-100">
            <div className="space-y-6">
              <div className="flex justify-between items-center pb-4 border-b">
                <h4 className="font-extrabold text-navy text-base">👤 Downline Member Profile</h4>
                <button onClick={() => setSelectedProfileNode(null)} className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 border-none cursor-pointer">
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              </div>

              <div className="flex items-center gap-3 bg-slate-50 border rounded-2xl p-4">
                <span className="w-12 h-12 rounded-full bg-indigo-50 border-2 border-indigo-200 flex items-center justify-center text-xl font-bold text-indigo-700">
                  {selectedProfileNode.name.substring(0, 1).toUpperCase()}
                </span>
                <div className="text-left">
                  <h4 className="font-black text-navy text-sm">{selectedProfileNode.name}</h4>
                  <p className="text-xs text-slate-400">{selectedProfileNode.email}</p>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">Code: {selectedProfileNode.referralCode || "—"}</p>
                </div>
              </div>

              {/* Network stats list */}
              <div className="grid grid-cols-2 gap-3 text-left">
                <div className="border border-slate-100 rounded-xl p-3 bg-white">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Level Tier</span>
                  <span className="text-sm font-extrabold text-navy mt-1 block">Level {selectedProfileNode.levelNum}</span>
                </div>
                <div className="border border-slate-100 rounded-xl p-3 bg-white">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Purchases</span>
                  <span className="text-sm font-extrabold text-navy mt-1 block">{selectedProfileNode.totalPurchases || 0} orders</span>
                </div>
                <div className="border border-slate-100 rounded-xl p-3 bg-white">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Joined Date</span>
                  <span className="text-xs font-bold text-navy mt-1 block">{new Date(selectedProfileNode.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="border border-slate-100 rounded-xl p-3 bg-white">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">KYC Status</span>
                  <span className="text-xs font-bold text-navy mt-1 block">
                    {selectedProfileNode.firstOrderQualified ? "🟢 Verified Member" : "🟡 Registered Only"}
                  </span>
                </div>
              </div>

              {/* Order history section */}
              <div className="text-left space-y-2">
                <h5 className="font-extrabold text-navy text-xs uppercase tracking-wider">Purchase History ({selectedProfileNode.orders?.length || 0})</h5>
                {(!selectedProfileNode.orders || selectedProfileNode.orders.length === 0) ? (
                  <p className="text-xs text-slate-400">No orders completed yet.</p>
                ) : (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {selectedProfileNode.orders.map((o: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center text-xs p-2.5 bg-slate-50 border rounded-xl">
                        <div>
                          <p className="font-bold text-navy">Order #{o.orderNumber}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{new Date(o.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-extrabold text-navy">₹{Math.round(o.totalAmount)}</p>
                          <Badge variant="outline" className="text-[9px] bg-white text-slate-700">{o.status}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <Button className="w-full bg-navy text-white hover:bg-navy/95 font-bold py-2.5 rounded-xl mt-6" onClick={() => setSelectedProfileNode(null)}>
              Close Drawer Panel
            </Button>
          </div>
        </div>
      )}

      {/* QR Code Modal Dialog */}
      {showInviteQR && (
        <Dialog open={showInviteQR} onOpenChange={setShowInviteQR}>
          <DialogContent className="max-w-sm rounded-3xl bg-white border border-slate-200 p-6 text-center">
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-2 border-b">
                <h4 className="font-extrabold text-navy text-sm">Your Invite QR Code</h4>
                <button onClick={() => setShowInviteQR(false)} className="p-1 rounded-lg bg-slate-100 border-none cursor-pointer">
                  <X className="w-3.5 h-3.5 text-slate-500" />
                </button>
              </div>

              <div className="w-48 h-48 bg-slate-50 border-2 border-dashed rounded-2xl flex items-center justify-center mx-auto p-4">
                <div className="w-full h-full bg-navy rounded-xl p-3 flex flex-col justify-between items-center text-white">
                  <div className="grid grid-cols-5 gap-1.5 w-full h-full opacity-90">
                    {Array.from({ length: 25 }).map((_, i) => (
                      <div
                        key={i}
                        className={`rounded-sm ${(i * 3 + 7) % 5 === 0 || (i % 6 === 0) || (i > 18) ? "bg-white" : "bg-navy"}`}
                      />
                    ))}
                  </div>
                  <span className="text-[9px] font-black tracking-widest mt-2 font-mono">CODE: {referralCode}</span>
                </div>
              </div>

              <div className="text-[10px] text-slate-500 font-bold bg-slate-50 p-2.5 rounded-xl">
                Scan with phone camera to download app with tag: {referralCode}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Training video popup dialog */}
      <Dialog open={showVideoDialog} onOpenChange={setShowVideoDialog}>
        <DialogContent className="max-w-lg rounded-3xl bg-white border border-slate-200 p-6">
          <DialogHeader>
            <DialogTitle className="font-extrabold text-navy text-base">🎥 ApexBee Referral Training Program</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">Master Downline tree building and double your conversion rates.</DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="aspect-video w-full bg-slate-900 rounded-2xl flex flex-col items-center justify-center text-white border relative overflow-hidden">
              <Play className="h-16 w-16 text-emerald-400 cursor-pointer hover:scale-110 transition-transform" />
              <p className="text-xs font-bold text-slate-300 mt-2">Video: MLM tree construction strategies (12 mins)</p>
            </div>

            <div className="space-y-2 text-xs">
              <h5 className="font-extrabold text-navy">Curriculum Includes:</h5>
              <p className="text-slate-600">• How to pitch local vendors on joining the marketplace.</p>
              <p className="text-slate-600">• Understanding multi-tier product sales commissions payouts.</p>
            </div>
          </div>

          <DialogFooter>
            <Button className="w-full bg-navy text-white hover:bg-navy/95 rounded-xl font-bold text-xs" onClick={() => setShowVideoDialog(false)}>
              Close Video Dialog
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );

  function setBedDetailsAndCapitalize(val: string) {
    setBankDetails((p) => ({ ...p, ifsc: val.toUpperCase() }));
  }
};

export default Referrals;
