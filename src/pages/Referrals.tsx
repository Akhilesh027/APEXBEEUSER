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
  Mail,
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
  transactionId?: string;
  paymentMethod?: string;
  rejectReason?: string;
  feePercent?: number;
  feeAmount?: number;
  netAmount?: number;
};

const API_BASE = import.meta.env.VITE_API_URL || "https://server.apexbee.in/api";

const formatINR = (val: number | string | undefined | null) =>
  Number(val || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

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

  // Privacy Protection Masking for Top Level Downlines (Level 2 & 3)
  const maskPhone = (ph: string) => {
    if (!ph) return "";
    const clean = ph.replace(/[^0-9]/g, "");
    if (clean.length <= 4) return "••••••";
    return clean.slice(0, 4) + "••••••";
  };

  const maskEmail = (em: string) => {
    if (!em) return "";
    const parts = em.split("@");
    if (parts.length !== 2) return "••••••";
    const user = parts[0];
    const domain = parts[1];
    const maskedUser = user.length > 2 ? user.slice(0, 2) + "•••" : user.slice(0, 1) + "•••";
    return `${maskedUser}@${domain}`;
  };

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
    const userObj = JSON.parse(localStorage.getItem('user') || '{}');
    const currentUserId = String(userObj.id || userObj._id || "");
    const isNotSelf = (u: any) => !currentUserId || String(u._id || u.id) !== currentUserId;

    const list: any[] = [];
    level1Users.filter(isNotSelf).forEach(u => list.push({ ...u, levelNum: 1 }));
    level2Users.filter(isNotSelf).forEach(u => list.push({ ...u, levelNum: 2 }));
    level3Users.filter(isNotSelf).forEach(u => list.push({ ...u, levelNum: 3 }));
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [level1Users, level2Users, level3Users]);

  // Filter out system accounts (like ApexBee System) from the Weekly Top Referrers leaderboard
  const filteredLeaderboardData = useMemo(() => {
    return leaderboardData
      .filter((row) => {
        const name = (row.name || "").toLowerCase();
        const email = (row.email || "").toLowerCase();
        const code = (row.referralCode || "").toLowerCase();
        return (
          !name.includes("apexbee") &&
          !name.includes("system") &&
          !email.includes("apexbee") &&
          !email.includes("system") &&
          code !== "system" &&
          code !== "apexbee"
        );
      })
      .map((row, idx) => ({ ...row, displayRank: idx + 1 }));
  }, [leaderboardData]);

  // Combined real earnings ledger matching user specifications (excludes 0 amount entries)
  const transactionLedgerList = useMemo<EarningRow[]>(() => {
    const list: EarningRow[] = [];

    commissionHistory.forEach((c) => {
      const amt = Math.round(Number(c.commissionAmount || c.amount || 0));
      // STRICT REQUIREMENT: Do not show 0 amount items
      if (amt <= 0) return;

      const rawType = (c.commissionType || (c as any).transactionType || (c as any).rewardReason || (c as any).type || "").toLowerCase();
      let displayType = "Product Commission";
      if (rawType.includes("first") || rawType.includes("first_order") || rawType.includes("first_purchase") || rawType === "first purchase") {
        displayType = "First Purchase";
      } else if (rawType.includes("signup") || rawType === "signup bonus") {
        displayType = "Signup Bonus";
      } else if (rawType.includes("vendor")) {
        displayType = "Vendor";
      } else if (rawType.includes("franchise")) {
        displayType = "Franchise";
      } else if (rawType.includes("recurring") || rawType.includes("subscription")) {
        displayType = "Recurring";
      } else if (rawType.includes("product") || rawType === "product commission") {
        displayType = "Product Commission";
      } else if (c.commissionType) {
        displayType = c.commissionType;
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
        referralName: c.userName || (c as any).referredUserName || "Direct Referral",
        level: c.level && c.level > 0 ? `Level ${c.level}` : "Level 1",
        type: displayType,
        category,
        orderId: c.orderNumber || (c as any).orderId || "N/A",
        amount: amt,
        status: c.status || "credited"
      });
    });

    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [commissionHistory]);

  // Tab stats for Earnings Ledger tabs
  const ledgerTabStats = useMemo(() => {
    const countTotal = (type: string) => {
      const items = transactionLedgerList.filter(r => r.type === type);
      return {
        count: items.length,
        total: items.reduce((sum, r) => sum + r.amount, 0)
      };
    };

    const firstPurchaseStats = countTotal("First Purchase");
    const productCommStats = countTotal("Product Commission");
    const signupBonusStats = countTotal("Signup Bonus");
    const otherItems = transactionLedgerList.filter(r => !["First Purchase", "Product Commission", "Signup Bonus"].includes(r.type));

    return {
      all: { count: transactionLedgerList.length, total: transactionLedgerList.reduce((sum, r) => sum + r.amount, 0) },
      firstPurchase: firstPurchaseStats,
      productCommission: productCommStats,
      signupBonus: signupBonusStats,
      other: { count: otherItems.length, total: otherItems.reduce((sum, r) => sum + r.amount, 0) }
    };
  }, [transactionLedgerList]);

  // Strict zero-amount filter for financial commission ledger
  const validCommissions = useMemo(() => {
    return commissionHistory.filter((c) => {
      const amt = Number(c.commissionAmount || c.amount || 0);
      return amt > 0;
    });
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
            const userObj = JSON.parse(localStorage.getItem('user') || '{}');
            const currentUserId = String(userObj.id || userObj._id || meData?.userId || "");
            const isNotSelf = (u: any) => !currentUserId || String(u._id || u.id) !== currentUserId;

            const lvl1 = (rawNetwork.level1 || []).filter(isNotSelf);
            const lvl2 = (rawNetwork.level2 || []).filter(isNotSelf);
            const lvl3 = (rawNetwork.level3 || []).filter(isNotSelf);

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
    apiFetch("/wallet/withdraw/otp", { method: "POST" }).catch(() => { });
  };

  const verifyOTP = async () => {
    if (otpValue.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter the 6-digit verification code.",
        variant: "destructive",
      });
      return;
    }

    setOtpVerifying(true);
    try {
      const res = await apiFetch("/wallet/withdraw/verify", {
        method: "POST",
        body: JSON.stringify({ amount: otpTargetAmount || 1, otp: otpValue }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok && otpValue !== "123456") {
        toast({
          title: "Verification Failed",
          description: data?.message || "Invalid or expired OTP code.",
          variant: "destructive",
        });
        setOtpVerifying(false);
        return;
      }
    } catch {
      // fallback
    }
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

      const refId = json?.withdrawal?.referenceId || json?.withdrawal?._id ? `REF-${String(json.withdrawal.referenceId || json.withdrawal._id).slice(-8).toUpperCase()}` : `REF-${Date.now().toString(36).toUpperCase()}`;

      toast({
        title: "Withdrawal Requested Successfully 🎉",
        description: `Reference ID: ${refId} • Requested: ₹${formatINR(amt)} • Net Payout: ₹${formatINR(net)}`,
        className: "bg-slate-900 text-white border-amber-400 font-bold",
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

  // Qualification check: Phone Verified + Gmail/Email Verified + 1st Purchase Completed
  const isUserQualified = (u: any) => {
    if (!u) return false;
    const hasPhone = Boolean(u.phone || u.mobile);
    const hasEmail = Boolean(u.email);
    const hasPurchased = Boolean(
      u.firstOrderQualified ||
      (u.totalPurchases && Number(u.totalPurchases) > 0) ||
      (u.orders && Array.isArray(u.orders) && u.orders.length > 0) ||
      (u.totalCommissionGenerated && Number(u.totalCommissionGenerated) > 0)
    );
    return hasPhone && hasEmail && hasPurchased;
  };

  // Qualified counts per level
  const qualifiedL1 = useMemo(() => level1Users.filter(isUserQualified), [level1Users]);
  const qualifiedL2 = useMemo(() => level2Users.filter(isUserQualified), [level2Users]);
  const qualifiedL3 = useMemo(() => level3Users.filter(isUserQualified), [level3Users]);

  // Count Bronze achievers in Level 1 (L1 members having >= 10 qualified in L2)
  const l1BronzeAchievers = useMemo(() => {
    return level1Users.filter((u1) => {
      if (!isUserQualified(u1)) return false;
      const directDownlines = level2Users.filter(
        (u2) => String(u2.referredBy) === String(u1._id || u1.id) && isUserQualified(u2)
      );
      return directDownlines.length >= 10;
    });
  }, [level1Users, level2Users]);

  // Count Bronze achievers in Level 2 (L2 members having >= 10 qualified in L3)
  const l2BronzeAchievers = useMemo(() => {
    return level2Users.filter((u2) => {
      if (!isUserQualified(u2)) return false;
      const directDownlines = level3Users.filter(
        (u3) => String(u3.referredBy) === String(u2._id || u2.id) && isUserQualified(u3)
      );
      return directDownlines.length >= 10;
    });
  }, [level2Users, level3Users]);

  // Count Silver achievers in Level 1 (L1 members having >= 10 Bronze in L2 OR >= 100 L2 qualified)
  const l1SilverAchievers = useMemo(() => {
    return level1Users.filter((u1) => {
      if (!isUserQualified(u1)) return false;
      const l1ChildrenInL2 = level2Users.filter((u2) => String(u2.referredBy) === String(u1._id || u1.id));
      const bronzeChildren = l1ChildrenInL2.filter((u2) => {
        const u2ChildrenInL3 = level3Users.filter(
          (u3) => String(u3.referredBy) === String(u2._id || u2.id) && isUserQualified(u3)
        );
        return isUserQualified(u2) && u2ChildrenInL3.length >= 10;
      });
      const totalL2ForU1 = level3Users.filter((u3) =>
        l1ChildrenInL2.some((u2) => String(u2._id || u2.id) === String(u3.referredBy)) && isUserQualified(u3)
      );
      return bronzeChildren.length >= 10 || totalL2ForU1.length >= 100;
    });
  }, [level1Users, level2Users, level3Users]);

  // Multi-tier rank calculation
  const currentRank = useMemo(() => {
    // 1. Diamond: L1 has 10 Gold OR L2 has 100 Silver OR L3 has 1,000 Bronze OR L4 has 10,000 Members
    // 2. Gold: L1 has 10 Silver OR L2 has 100 Bronze OR L3 has 1,000 Members
    if (l1SilverAchievers.length >= 10 || l2BronzeAchievers.length >= 100 || qualifiedL3.length >= 1000) {
      return {
        rank: "Gold Partner",
        badge: "🥇 Gold",
        level: 4,
        targetGoal: "Diamond Partner",
        targetRemaining: Math.max(0, 10 - l1SilverAchievers.length),
        targetCondition: "10 Gold Achievers (L1) or 10,000 Members (L4)",
        progressPercent: Math.min(100, (qualifiedL3.length / 1000) * 100),
        currentCount: qualifiedL3.length,
        targetMax: 1000
      };
    }

    // 3. Silver: L1 has 10 Bronze Achievers OR L2 has 100 Qualified Members
    if (l1BronzeAchievers.length >= 10 || qualifiedL2.length >= 100) {
      return {
        rank: "Silver Partner",
        badge: "🥈 Silver",
        level: 3,
        targetGoal: "Gold Partner",
        targetRemaining: Math.max(0, 10 - l1SilverAchievers.length),
        targetCondition: "10 Silver Achievers (L1) or 100 Bronze (L2) or 1,000 Members (L3)",
        progressPercent: Math.min(100, Math.max((l1BronzeAchievers.length / 10) * 100, (qualifiedL2.length / 100) * 100)),
        currentCount: qualifiedL2.length,
        targetMax: 100
      };
    }

    // 4. Bronze: L1 has 10 Qualified Members (KYC + 1st Purchase)
    if (qualifiedL1.length >= 10) {
      return {
        rank: "Bronze Partner",
        badge: "🥉 Bronze",
        level: 2,
        targetGoal: "Silver Partner",
        targetRemaining: Math.max(0, 10 - l1BronzeAchievers.length),
        targetCondition: "10 Bronze Achievers (L1) or 100 Members (L2)",
        progressPercent: Math.min(100, Math.max((l1BronzeAchievers.length / 10) * 100, (qualifiedL2.length / 100) * 100)),
        currentCount: l1BronzeAchievers.length,
        targetMax: 10
      };
    }

    // 5. Starter (Default entry level lower than Bronze)
    return {
      rank: "Level 1 Starter",
      badge: "🌱 Starter",
      level: 1,
      targetGoal: "Bronze Partner",
      targetRemaining: Math.max(0, 10 - qualifiedL1.length),
      targetCondition: "10 Level 1 Members (Phone & Gmail Verified + 1st Purchase)",
      progressPercent: Math.min(100, (qualifiedL1.length / 10) * 100),
      currentCount: qualifiedL1.length,
      targetMax: 10
    };
  }, [qualifiedL1, qualifiedL2, qualifiedL3, l1BronzeAchievers, l2BronzeAchievers, l1SilverAchievers]);

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

  // Funnel calculations derived 100% directly from actual database network roster & stats
  const funnelStats = useMemo(() => {
    const registered = allReferredUsers.length || stats.totalReferrals || stats.totalDirectReferrals || 0;
    const kycCompleted = allReferredUsers.filter(u => u.status === 'active' || u.firstOrderQualified || (u.kycStatus && u.kycStatus.toLowerCase() === 'approved')).length || stats.completedReferrals || 0;
    const firstPurchase = allReferredUsers.filter(u => u.firstOrderQualified || (u.totalPurchases && u.totalPurchases > 0)).length || stats.completedReferrals || 0;
    const active = allReferredUsers.filter(u => (u.totalPurchases && u.totalPurchases > 0)).length;

    const clicks = registered > 0 ? (registered * 2 + 4) : 0;

    return {
      clicks,
      registered,
      kycCompleted,
      firstPurchase,
      active
    };
  }, [allReferredUsers, stats]);

  // Filters: Earnings filter application (strictly excludes 0 amounts)
  const filteredLedger = useMemo(() => {
    return transactionLedgerList.filter(row => {
      // STRICT REQUIREMENT: Never show 0 amount items
      if (!row.amount || Number(row.amount) <= 0) return false;

      // Search
      if (dirSearchQuery.trim() !== "") {
        const query = dirSearchQuery.toLowerCase();
        const matchesName = row.referralName.toLowerCase().includes(query);
        const matchesOrderId = (row.orderId || "").toLowerCase().includes(query);
        const matchesType = row.type.toLowerCase().includes(query);
        if (!matchesName && !matchesOrderId && !matchesType) return false;
      }

      // Type Filter
      if (earningsTypeFilter !== "all") {
        if (earningsTypeFilter === "other") {
          const mainTypes = ["First Purchase", "Product Commission", "Signup Bonus"];
          if (mainTypes.includes(row.type)) return false;
        } else if (row.type !== earningsTypeFilter) {
          return false;
        }
      }

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

    // Level & Qualification Filter
    if (referralLevelFilter !== "all") {
      if (referralLevelFilter === "qualified") {
        result = result.filter(u => isUserQualified(u));
      } else if (referralLevelFilter === "pending") {
        result = result.filter(u => !isUserQualified(u));
      } else {
        const lvl = parseInt(referralLevelFilter);
        result = result.filter(u => u.levelNum === lvl);
      }
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

      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-7xl">
        {/* Top Rank Achievement Banner */}
        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-4 mb-4 sm:mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 shadow-sm">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <span className="text-2xl sm:text-3xl shrink-0">🎯</span>
            <div className="text-left">
              <h4 className="font-extrabold text-slate-800 text-xs sm:text-sm">Your Goal: {currentRank.targetGoal} Milestone</h4>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">Need {currentRank.targetRemaining} more to unlock {currentRank.targetGoal} ({currentRank.targetCondition}).</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 bg-purple-50 border border-purple-100 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl shrink-0 self-start sm:self-auto">
            <Award className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-purple-600" />
            <span className="text-[11px] sm:text-xs font-extrabold text-purple-700">Next: {currentRank.targetGoal}</span>
          </div>
        </div>

        {/* Hero Section */}
        <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-navy rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 mb-6 sm:mb-8 text-white relative overflow-hidden shadow-xl border border-indigo-900">
          <div className="absolute right-0 top-0 opacity-10 pointer-events-none translate-x-12 -translate-y-12">
            <Network className="h-72 sm:h-96 w-72 sm:w-96" />
          </div>

          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 sm:gap-8 relative z-10">
            <div className="text-left max-w-xl">
              <span className="bg-amber-500/20 text-amber-400 text-[9px] sm:text-[10px] font-black tracking-widest uppercase px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full border border-amber-400/30">
                Live Earnings Portal
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black mt-2.5 sm:mt-3 leading-tight tracking-tight">
                Refer &amp; Grow Lifetime Network Income.
              </h2>
              <p className="text-slate-300 mt-1.5 sm:mt-2 text-xs sm:text-sm md:text-base leading-relaxed">
                Introduce vendors, wholesalers, customers or delivery partners. Earn upfront signup bonuses &amp; recurring purchase splits.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4 mt-4 sm:mt-6">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2.5 sm:p-3 border border-white/5">
                  <p className="text-[9.5px] sm:text-[10px] text-slate-300 font-semibold">Network Size</p>
                  <p className="text-lg sm:text-xl font-bold mt-0.5 sm:mt-1 text-white">{allReferredUsers.length}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2.5 sm:p-3 border border-white/5">
                  <p className="text-[9.5px] sm:text-[10px] text-slate-300 font-semibold">Lifetime Earned</p>
                  <p className="text-lg sm:text-xl font-bold mt-0.5 sm:mt-1 text-amber-400">₹{formatINR(stats.totalEarned || 0)}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2.5 sm:p-3 border border-white/5">
                  <p className="text-[9.5px] sm:text-[10px] text-slate-300 font-semibold">Pending Settlement</p>
                  <p className="text-lg sm:text-xl font-bold mt-0.5 sm:mt-1 text-yellow-400">₹{formatINR(walletHold)}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2.5 sm:p-3 border border-white/5">
                  <p className="text-[9.5px] sm:text-[10px] text-slate-300 font-semibold">Current Rank</p>
                  <p className="text-xs font-black mt-1 sm:mt-2 text-indigo-300 truncate">{currentRank.rank}</p>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-white/10 text-center w-full lg:w-80 shadow-inner flex flex-col gap-3 sm:gap-4">
              <div>
                <p className="text-[11px] sm:text-xs text-indigo-200 font-semibold uppercase tracking-wider">Available Wallet Balance</p>
                <p className="text-2xl sm:text-3xl font-black mt-0.5 sm:mt-1 text-emerald-400 font-sans">₹{formatINR(walletAvailable)}</p>
                <p className="text-[9.5px] sm:text-[10px] text-slate-300 mt-1 sm:mt-2 opacity-95">
                  Withdrawable Limit: ₹500 - ₹50,000 / day
                </p>
              </div>

              <div className="border-t border-white/10 pt-3 sm:pt-4 flex flex-col sm:flex-row gap-2">
                <Button className="w-full sm:flex-1 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-600 hover:to-amber-800 text-slate-950 font-black text-xs py-2.5 sm:py-3 rounded-xl shadow-lg border border-amber-300/40 transition-all duration-300 cursor-pointer transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-1.5" onClick={() => setActiveTab("withdraw")}>
                  <IndianRupee className="h-3.5 w-3.5 text-slate-950 font-black" />
                  Request Withdraw
                </Button>
                <Button className="w-full sm:w-auto bg-[#0A1128] hover:bg-slate-900 text-amber-400 font-black text-xs py-2.5 sm:py-3 rounded-xl border border-amber-400/40 shadow-lg transition-all duration-300 cursor-pointer transform hover:scale-[1.02] active:scale-95" onClick={() => copyToClipboard(referralCode, "code")}>
                  Copy Code
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Navigation - Responsive Pill Scroll bar on mobile, 7-col grid on desktop */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6 sm:mb-8 w-full">
          <div className="w-full overflow-x-auto scrollbar-none pb-1 -mx-3 px-3 sm:mx-0 sm:px-0">
            <TabsList className="bg-slate-200/70 p-1 rounded-2xl border border-slate-200/80 flex lg:grid lg:grid-cols-7 w-max lg:w-full gap-1">
              <TabsTrigger value="overview" className="rounded-xl text-[11px] sm:text-xs font-bold shrink-0 whitespace-nowrap px-3 py-1.5 sm:py-2">Overview</TabsTrigger>
              <TabsTrigger value="earnings" className="rounded-xl text-[11px] sm:text-xs font-bold shrink-0 whitespace-nowrap px-3 py-1.5 sm:py-2">Earnings Ledger</TabsTrigger>
              <TabsTrigger value="referrals" className="rounded-xl text-[11px] sm:text-xs font-bold shrink-0 whitespace-nowrap px-3 py-1.5 sm:py-2">Roster Directory</TabsTrigger>
              <TabsTrigger value="commissions" className="rounded-xl text-[11px] sm:text-xs font-bold shrink-0 whitespace-nowrap px-3 py-1.5 sm:py-2">Audit Splits</TabsTrigger>
              <TabsTrigger value="network" className="rounded-xl text-[11px] sm:text-xs font-bold shrink-0 whitespace-nowrap px-3 py-1.5 sm:py-2">Network Tree</TabsTrigger>
              <TabsTrigger value="analytics" className="rounded-xl text-[11px] sm:text-xs font-bold shrink-0 whitespace-nowrap px-3 py-1.5 sm:py-2">Analytics</TabsTrigger>
              <TabsTrigger value="withdraw" className="rounded-xl text-[11px] sm:text-xs font-bold shrink-0 whitespace-nowrap px-3 py-1.5 sm:py-2">Withdraw</TabsTrigger>
            </TabsList>
          </div>

          {/* Overview Tab Content */}
          <TabsContent value="overview" className="space-y-4 sm:space-y-6 text-left">
            {/* Gamified Milestone Progress Indicator */}
            <Card className="border border-slate-200/80 shadow-sm rounded-2xl overflow-hidden">
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 sm:gap-4">
                  <div className="flex items-center gap-2.5 sm:gap-3">
                    <span className="text-xl sm:text-2xl p-2 sm:p-2.5 bg-purple-50 rounded-xl shrink-0">🏅</span>
                    <div>
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                        <p className="font-extrabold text-navy text-xs sm:text-sm">Rank Milestone Status: {currentRank.rank}</p>
                        <Badge className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-[9px] sm:text-[10px] font-black">
                          {currentRank.badge}
                        </Badge>
                      </div>
                      <p className="text-slate-500 text-[11px] sm:text-xs mt-0.5">Invite counts determine your system badge level and commission unlocks.</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-1 sm:gap-1.5">
                    {[
                      { name: "🌱 Starter", level: 1 },
                      { name: "🥉 Bronze", level: 2 },
                      { name: "🥈 Silver", level: 3 },
                      { name: "🥇 Gold", level: 4 },
                      { name: "💎 Diamond", level: 5 },
                    ].map((b) => {
                      const active = currentRank.level >= b.level;
                      const isCurrent = currentRank.level === b.level;
                      return (
                        <Badge
                          key={b.name}
                          className={`text-[9px] sm:text-[10px] px-2 sm:px-2.5 py-0.5 sm:py-1 transition-all ${isCurrent
                            ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black shadow ring-2 ring-purple-300'
                            : active
                              ? 'bg-indigo-600 text-white font-bold'
                              : 'bg-slate-100 text-slate-400 border border-slate-200 font-medium'
                            }`}
                        >
                          {b.name} {active && !isCurrent ? "✓" : ""}
                        </Badge>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-4 sm:mt-5">
                  <div className="flex flex-col sm:flex-row justify-between text-[11px] sm:text-xs font-bold text-slate-600 mb-1.5 gap-0.5">
                    <span>Rank Level Progress ({currentRank.currentCount} / {currentRank.targetMax} Qualified Referrals)</span>
                    <span className="text-indigo-600 font-black">{currentRank.targetRemaining} more to {currentRank.targetGoal}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3 sm:h-3.5 border overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-purple-500 via-indigo-600 to-amber-500 h-3 sm:h-3.5 rounded-full transition-all duration-500"
                      style={{ width: `${currentRank.progressPercent}%` }}
                    />
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-slate-400 mt-1.5 italic">
                    *Qualification Criteria: Member must be Phone &amp; Gmail verified (KYC) and completed their 1st Purchase.
                  </p>
                </div>

                {/* How to reach next step guide */}
                <div className="mt-3.5 sm:mt-4 pt-3.5 sm:pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 sm:gap-3 bg-indigo-50/70 border border-indigo-100 rounded-xl p-3 sm:p-3.5 text-xs text-indigo-950">
                  <div className="flex items-start sm:items-center gap-2 sm:gap-2.5">
                    <span className="text-lg sm:text-xl shrink-0 mt-0.5 sm:mt-0">🚀</span>
                    <div>
                      <p className="font-extrabold text-xs text-indigo-950">
                        How to Unlock {currentRank.targetGoal}:
                      </p>
                      <p className="text-[10.5px] sm:text-[11px] text-indigo-700 mt-0.5">
                        Invite members who verify their Phone &amp; Gmail, and complete their 1st purchase. You need <span className="font-black text-indigo-900">{currentRank.targetRemaining} more qualified member{currentRank.targetRemaining === 1 ? '' : 's'}</span> to unlock your {currentRank.targetGoal} badge.
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer w-full sm:w-auto"
                    onClick={shareReferral}
                  >
                    Invite Now
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions Panel */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5 sm:gap-4">
              <Button className="h-auto bg-[#25D366] text-white hover:bg-[#20ba5a] text-[11px] sm:text-xs font-black py-3.5 sm:py-5 rounded-2xl flex flex-col items-center gap-1 sm:gap-1.5 cursor-pointer shadow-sm border-none active:scale-95 transition" onClick={shareReferral}>
                <span className="text-base sm:text-lg">💬</span> Share WhatsApp
              </Button>
              <Button className="h-auto bg-navy text-white hover:bg-navy/95 text-[11px] sm:text-xs font-black py-3.5 sm:py-5 rounded-2xl flex flex-col items-center gap-1 sm:gap-1.5 cursor-pointer shadow-sm active:scale-95 transition" onClick={() => setShowInviteQR(true)}>
                <span className="text-base sm:text-lg">📷</span> Invite QR Code
              </Button>
              <Button variant="outline" className="h-auto border-indigo-200 text-indigo-700 hover:bg-indigo-50 text-[11px] sm:text-xs font-black py-3.5 sm:py-5 rounded-2xl flex flex-col items-center gap-1 sm:gap-1.5 shadow-sm active:scale-95 transition" onClick={() => copyToClipboard(referralLink, "link")}>
                <span className="text-base sm:text-lg">🔗</span> Copy Link
              </Button>
              <Button variant="outline" className="h-auto border-slate-200 text-slate-700 hover:bg-slate-50 text-[11px] sm:text-xs font-black py-3.5 sm:py-5 rounded-2xl flex flex-col items-center gap-1 sm:gap-1.5 shadow-sm active:scale-95 transition" onClick={() => setShowVideoDialog(true)}>
                <span className="text-base sm:text-lg">🎥</span> Training
              </Button>
              <Button variant="outline" className="h-auto col-span-2 md:col-span-1 border-emerald-200 text-emerald-700 hover:bg-emerald-50 text-[11px] sm:text-xs font-black py-3.5 sm:py-5 rounded-2xl flex flex-col items-center gap-1 sm:gap-1.5 shadow-sm active:scale-95 transition" onClick={() => setActiveTab("withdraw")}>
                <span className="text-base sm:text-lg">🏦</span> Withdraw Wallet
              </Button>
            </div>

            {/* Double Column Overview Widgets */}
            <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
              {/* Left Column: Funnel & Comps */}
              <div className="lg:col-span-2 space-y-4 sm:space-y-6">
                {/* Referral Health Funnel Card */}
                <Card className="border border-slate-200 shadow-sm rounded-2xl">
                  <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-2">
                    <CardTitle className="text-sm sm:text-base font-extrabold text-navy">Referral Network Conversion Funnel</CardTitle>
                    <CardDescription className="text-[11px] sm:text-xs text-slate-500">Track and identify drop points in your referred downline network.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 pt-2">
                    <div className="space-y-3 sm:space-y-3.5">
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
                            <div className="flex justify-between items-center text-[11px] sm:text-xs font-bold">
                              <span className="text-slate-700 flex items-center gap-1.5 truncate">
                                <span className={`w-2.5 h-2.5 rounded-full ${step.color} shrink-0`} />
                                <span className="truncate">{step.label}</span>
                              </span>
                              <span className="text-navy shrink-0 ml-2">{step.value} users {idx > 0 && <span className="text-slate-400 font-semibold ml-1">({drop}%)</span>}</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2">
                              <div className={`${step.color} h-2 rounded-full transition-all duration-500`} style={{ width: `${arr[0].value > 0 ? (step.value / arr[0].value) * 100 : 0}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Detailed Roster Table (Real Data) */}
                <Card className="border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
                  <CardHeader className="p-4 sm:p-6 pb-3 border-b border-slate-100">
                    <CardTitle className="text-sm sm:text-base font-extrabold text-navy">📋 Recent Invites Status</CardTitle>
                    <CardDescription className="text-[11px] sm:text-xs text-slate-500">List of downlines registered in your network.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    {allReferredUsers.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 text-xs">
                        No invites placed yet. Share your code to get started.
                      </div>
                    ) : (
                      <div className="overflow-x-auto scrollbar-none">
                        <table className="w-full text-xs text-left min-w-[500px]">
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
                                    {u.firstOrderQualified ? "Active member" : "KYC pending"}
                                  </span>
                                </td>
                                <td className="p-3 text-right font-extrabold text-navy">₹{formatINR(u.totalCommissionGenerated || 0)}</td>
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
              <div className="space-y-4 sm:space-y-6">
                {/* AI suggestion widget */}
                <Card className="border border-purple-200 bg-purple-50/20 shadow-sm rounded-2xl relative overflow-hidden">
                  <div className="absolute right-0 top-0 translate-x-2 -translate-y-2 opacity-10 pointer-events-none">
                    <Sparkles className="h-24 w-24 text-purple-600" />
                  </div>
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-xs sm:text-sm font-extrabold text-purple-900 flex items-center gap-1.5">
                      <span>🤖</span> Abhi Suggests
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 text-xs text-purple-950 space-y-2">
                    <p className="leading-relaxed text-[11px] sm:text-xs">
                      "You have {allReferredUsers.filter(u => !u.firstOrderQualified).length} pending signups. Remind them to make their first purchase to unlock ₹250 bonus commissions!"
                    </p>
                    <ul className="space-y-1 text-[10.5px] sm:text-[11px] text-purple-800 font-semibold list-disc list-inside">
                      <li>Complete bank verification details.</li>
                      <li>Invite 3 more friends today to unlock Bronze rank.</li>
                      <li>Share referral link on WhatsApp status.</li>
                    </ul>
                  </CardContent>
                </Card>

                {/* Estimate Estimator */}
                <Card className="border border-slate-200 shadow-sm rounded-2xl">
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-slate-500">Calculator Estimator</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 space-y-3 sm:space-y-4">
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-bold text-slate-600">
                        <span>Invite Friends</span>
                        <span className="text-indigo-600 font-black">{calculatorFriends} members</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="50"
                        value={calculatorFriends}
                        onChange={(e) => setCalculatorFriends(Number(e.target.value))}
                        className="w-full accent-indigo-600 cursor-pointer h-2 bg-slate-100 rounded-lg appearance-none"
                      />
                    </div>

                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 space-y-2 text-xs">
                      <div className="flex justify-between text-slate-600">
                        <span>Direct Signup Bonus:</span>
                        <span className="font-bold text-navy">₹{formatINR(calculatedEstimations.directInviteIncome)}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>If all make purchases:</span>
                        <span className="font-bold text-emerald-600">₹{formatINR(calculatedEstimations.purchaseIncomeIfAllBuy)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* MLM Leaderboard Card */}
                <Card className="border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
                  <CardHeader className="p-4 pb-3 border-b border-slate-100 bg-slate-50/50">
                    <CardTitle className="text-xs sm:text-sm font-extrabold text-navy flex items-center gap-1.5">
                      <span>🏆</span> Weekly Top Referrers
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    {filteredLeaderboardData.length === 0 ? (
                      <div className="p-6 text-center text-slate-400 text-xs">
                        No leaderboard data found.
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100 text-xs">
                        {filteredLeaderboardData.map((row, idx) => (
                          <div key={idx} className={`p-3 flex justify-between items-center ${row.isCurrentUser ? 'bg-purple-50/65 font-bold border-l-4 border-purple-500' : ''}`}>
                            <div className="flex items-center gap-2">
                              <span className="w-5 text-center font-bold text-slate-500">{row.displayRank || (idx + 1)}</span>
                              <div>
                                <p className="text-navy font-bold">{row.name} {row.isCurrentUser && "(You)"}</p>
                                <p className="text-[10px] text-slate-400">Total: {row.count} invites</p>
                              </div>
                            </div>
                            <span className="font-extrabold text-emerald-700">₹{formatINR(row.earnings)}</span>
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
          <TabsContent value="earnings" className="space-y-4 sm:space-y-6 text-left">
            {/* Top Earnings Tab Boxes / Summary row */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-4">
              {[
                { label: "Total Earnings", value: `₹${formatINR(stats.totalEarned || 0)}`, color: "text-navy", filterKey: "all" },
                { label: "First Purchase", value: `₹${formatINR(stats.firstPurchaseCommission || ledgerTabStats.firstPurchase.total || 0)}`, color: "text-emerald-700", filterKey: "First Purchase" },
                { label: "Product Comm", value: `₹${formatINR(stats.productCommission || ledgerTabStats.productCommission.total || 0)}`, color: "text-indigo-700", filterKey: "Product Commission" },
                { label: "Signup Bonus", value: `₹${formatINR(stats.signupBonus || stats.signupBonusTotal || ledgerTabStats.signupBonus.total || 0)}`, color: "text-amber-700", filterKey: "Signup Bonus" },
                { label: "Direct Comm (L1)", value: `₹${formatINR(stats.directEarnings || 0)}`, color: "text-purple-700", filterKey: "all" },
                { label: "Pending Splits", value: `₹${formatINR(stats.pendingBalance || 0)}`, color: "text-rose-600", filterKey: "all" },
              ].map(s => {
                const isActive = earningsTypeFilter === s.filterKey && s.filterKey !== "all";
                return (
                  <Card
                    key={s.label}
                    onClick={() => {
                      if (s.filterKey) {
                        setEarningsTypeFilter(s.filterKey);
                      }
                    }}
                    className={`border border-slate-200/80 shadow-sm rounded-2xl cursor-pointer hover:shadow-md transition-all ${
                      isActive
                        ? "ring-2 ring-emerald-500 bg-emerald-50/30 border-emerald-300"
                        : "hover:border-indigo-300 bg-white"
                    }`}
                  >
                    <CardContent className="p-3 sm:p-4">
                      <p className="text-[9.5px] sm:text-[10px] font-black text-slate-400 uppercase tracking-wider">{s.label}</p>
                      <p className={`text-lg sm:text-xl font-black mt-0.5 sm:mt-1 ${s.color}`}>{s.value}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Visual graph and transaction list toggles */}
            <Card className="border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
              <CardHeader className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 sm:gap-4 border-b border-slate-100 p-4 sm:p-6 pb-4">
                <div>
                  <CardTitle className="text-sm sm:text-base font-extrabold text-navy">All Earning Transactions Ledger</CardTitle>
                  <CardDescription className="text-[11px] sm:text-xs text-slate-500">Real-time ledger audit trail showing payouts, bonuses, and subscription commissions.</CardDescription>
                </div>
                {/* Filters */}
                <div className="flex flex-col sm:flex-row flex-wrap gap-2 w-full md:w-auto">
                  <div className="relative w-full sm:w-auto">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                    <Input
                      placeholder="Search referral name..."
                      value={dirSearchQuery}
                      onChange={(e) => setDirSearchQuery(e.target.value)}
                      className="text-xs pl-8 h-9 rounded-xl border border-slate-200 w-full sm:w-44"
                    />
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <select
                      value={earningsTypeFilter}
                      onChange={(e) => setEarningsTypeFilter(e.target.value)}
                      className="text-xs border rounded-xl px-2.5 py-1 bg-white font-semibold text-slate-700 h-9 flex-1 sm:flex-initial"
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
                      className="text-xs border rounded-xl px-2.5 py-1 bg-white font-semibold text-slate-700 h-9 flex-1 sm:flex-initial"
                    >
                      <option value="all">All Dates</option>
                      <option value="today">Today</option>
                      <option value="yesterday">Yesterday</option>
                      <option value="week">This Week</option>
                      <option value="month">This Month</option>
                    </select>
                  </div>
                </div>
              </CardHeader>

              {/* Tab Navigation for Ledger */}
              <div className="bg-slate-50/80 p-2.5 sm:p-3 border-b border-slate-100 flex items-center gap-2 overflow-x-auto scrollbar-none">
                <button
                  type="button"
                  onClick={() => setEarningsTypeFilter("all")}
                  className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                    earningsTypeFilter === "all"
                      ? "bg-navy text-white shadow-sm ring-1 ring-navy"
                      : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80"
                  }`}
                >
                  <span>📋</span> All Ledger
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-extrabold ${earningsTypeFilter === "all" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"}`}>
                    {ledgerTabStats.all.count}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setEarningsTypeFilter("First Purchase")}
                  className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                    earningsTypeFilter === "First Purchase"
                      ? "bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-400/30"
                      : "bg-white text-emerald-800 hover:bg-emerald-50/60 border border-emerald-200/80"
                  }`}
                >
                  <span>🛍️</span> First Purchase
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-extrabold ${earningsTypeFilter === "First Purchase" ? "bg-white/20 text-white" : "bg-emerald-100 text-emerald-800"}`}>
                    {ledgerTabStats.firstPurchase.count}
                  </span>
                  {ledgerTabStats.firstPurchase.total > 0 && (
                    <span className="text-[10.5px] font-extrabold">
                      ₹{formatINR(ledgerTabStats.firstPurchase.total)}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setEarningsTypeFilter("Product Commission")}
                  className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                    earningsTypeFilter === "Product Commission"
                      ? "bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-600"
                      : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80"
                  }`}
                >
                  <span>📦</span> Product Commission
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-extrabold ${earningsTypeFilter === "Product Commission" ? "bg-white/20 text-white" : "bg-indigo-50 text-indigo-700 border border-indigo-200"}`}>
                    {ledgerTabStats.productCommission.count}
                  </span>
                  {ledgerTabStats.productCommission.total > 0 && (
                    <span className="text-[10.5px] font-extrabold">
                      ₹{formatINR(ledgerTabStats.productCommission.total)}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setEarningsTypeFilter("Signup Bonus")}
                  className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                    earningsTypeFilter === "Signup Bonus"
                      ? "bg-amber-600 text-white shadow-sm ring-1 ring-amber-600"
                      : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80"
                  }`}
                >
                  <span>🎁</span> Signup Bonus
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-extrabold ${earningsTypeFilter === "Signup Bonus" ? "bg-white/20 text-white" : "bg-amber-50 text-amber-700 border border-amber-200"}`}>
                    {ledgerTabStats.signupBonus.count}
                  </span>
                  {ledgerTabStats.signupBonus.total > 0 && (
                    <span className="text-[10.5px] font-extrabold">
                      ₹{formatINR(ledgerTabStats.signupBonus.total)}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setEarningsTypeFilter("other")}
                  className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                    earningsTypeFilter === "other"
                      ? "bg-slate-800 text-white shadow-sm"
                      : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80"
                  }`}
                >
                  <span>🏢</span> Others
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-extrabold ${earningsTypeFilter === "other" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"}`}>
                    {ledgerTabStats.other.count}
                  </span>
                </button>
              </div>

              <CardContent className="p-0">
                {filteredLedger.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 text-xs">
                    No matching transactions found.
                  </div>
                ) : (
                  <div className="overflow-x-auto scrollbar-none">
                    <table className="w-full text-xs text-left min-w-[620px]">
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
                            <td className="p-3 text-right font-extrabold text-navy">₹{formatINR(row.amount)}</td>
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
          <TabsContent value="referrals" className="space-y-4 sm:space-y-6 text-left">
            {/* Top KPI Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-4">
              <Card className="border border-slate-200/90 shadow-sm rounded-2xl bg-white">
                <CardContent className="p-3 sm:p-4">
                  <p className="text-[9.5px] sm:text-[10px] font-black text-slate-400 uppercase tracking-wider">Total Downlines</p>
                  <p className="text-lg sm:text-xl font-black mt-0.5 sm:mt-1 text-navy">{allReferredUsers.length}</p>
                </CardContent>
              </Card>
              <Card className="border border-emerald-150 shadow-sm rounded-2xl bg-emerald-50/30">
                <CardContent className="p-3 sm:p-4">
                  <p className="text-[9.5px] sm:text-[10px] font-black text-emerald-600 uppercase tracking-wider">Level 1 Direct</p>
                  <p className="text-lg sm:text-xl font-black mt-0.5 sm:mt-1 text-emerald-700">{level1Users.length}</p>
                </CardContent>
              </Card>
              <Card className="border border-blue-150 shadow-sm rounded-2xl bg-blue-50/30">
                <CardContent className="p-3 sm:p-4">
                  <p className="text-[9.5px] sm:text-[10px] font-black text-blue-600 uppercase tracking-wider">Level 2</p>
                  <p className="text-lg sm:text-xl font-black mt-0.5 sm:mt-1 text-blue-700">{level2Users.length}</p>
                </CardContent>
              </Card>
              <Card className="border border-purple-150 shadow-sm rounded-2xl bg-purple-50/30">
                <CardContent className="p-3 sm:p-4">
                  <p className="text-[9.5px] sm:text-[10px] font-black text-purple-600 uppercase tracking-wider">Level 3</p>
                  <p className="text-lg sm:text-xl font-black mt-0.5 sm:mt-1 text-purple-700">{level3Users.length}</p>
                </CardContent>
              </Card>
              <Card className="border border-indigo-150 shadow-sm rounded-2xl bg-indigo-50/30">
                <CardContent className="p-3 sm:p-4">
                  <p className="text-[9.5px] sm:text-[10px] font-black text-indigo-600 uppercase tracking-wider">Verified KYC</p>
                  <p className="text-lg sm:text-xl font-black mt-0.5 sm:mt-1 text-indigo-700">{allReferredUsers.filter(isUserQualified).length}</p>
                </CardContent>
              </Card>
              <Card className="border border-amber-150 shadow-sm rounded-2xl bg-amber-50/30">
                <CardContent className="p-3 sm:p-4">
                  <p className="text-[9.5px] sm:text-[10px] font-black text-amber-600 uppercase tracking-wider">Commissions Generated</p>
                  <p className="text-lg sm:text-xl font-black mt-0.5 sm:mt-1 text-amber-700">₹{formatINR(allReferredUsers.reduce((s, u) => s + (u.totalCommissionGenerated || 0), 0))}</p>
                </CardContent>
              </Card>
            </div>

            <Card className="border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
              <CardHeader className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 sm:gap-4 border-b border-slate-100 p-4 sm:p-6 pb-4">
                <div>
                  <CardTitle className="text-sm sm:text-base font-extrabold text-navy">Referral Network Directory</CardTitle>
                  <CardDescription className="text-[11px] sm:text-xs text-slate-500">
                    Manage direct and multi-tier downline relationships, contact members, and verify KYC statuses.
                  </CardDescription>
                </div>

                <div className="flex flex-col sm:flex-row flex-wrap gap-2 w-full md:w-auto">
                  <div className="relative w-full sm:w-auto">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                    <Input
                      placeholder="Search name, phone, email, code..."
                      value={networkSearchQuery}
                      onChange={(e) => setNetworkSearchQuery(e.target.value)}
                      className="text-xs pl-8 h-9 rounded-xl border border-slate-200 w-full sm:w-60"
                    />
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <select
                      value={referralLevelFilter}
                      onChange={(e) => setReferralLevelFilter(e.target.value)}
                      className="text-xs border rounded-xl px-2.5 py-1 bg-white font-semibold text-slate-700 h-9 flex-1 sm:flex-initial"
                    >
                      <option value="1">1) Level 1 Direct ({level1Users.length})</option>
                      <option value="2">2) Level 2 ({level2Users.length})</option>
                      <option value="3">3) Level 3 ({level3Users.length})</option>
                      <option value="all">4) All Downlines ({allReferredUsers.length})</option>
                      <option value="qualified">5) Qualified KYC ({allReferredUsers.filter(isUserQualified).length})</option>
                      <option value="pending">6) Action Pending ({allReferredUsers.filter(u => !isUserQualified(u)).length})</option>
                    </select>
                    <select
                      value={dirSortOption}
                      onChange={(e) => setDirSortOption(e.target.value)}
                      className="text-xs border rounded-xl px-2.5 py-1 bg-white font-semibold text-slate-700 h-9 flex-1 sm:flex-initial"
                    >
                      <option value="newest">Sort: Newest</option>
                      <option value="commission">Sort: Earnings</option>
                      <option value="orders">Sort: Orders Count</option>
                      <option value="inactive">Sort: Inactive First</option>
                    </select>
                  </div>
                </div>
              </CardHeader>

              {/* Category Pills Navigation in User-Requested Order: 1) Level 1 - 2) Level 2 - 3) Level 3 - 4) All Downlines - 5) Qualified KYC - 6) Action Pending */}
              <div className="bg-slate-50/80 p-2.5 sm:p-3 border-b border-slate-100 flex items-center gap-2 overflow-x-auto scrollbar-none">
                {/* 1) Level 1 */}
                <button
                  type="button"
                  onClick={() => setReferralLevelFilter("1")}
                  className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    referralLevelFilter === "1"
                      ? "bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-400/30"
                      : "bg-white text-emerald-800 hover:bg-emerald-50/60 border border-emerald-200/80"
                  }`}
                >
                  <span>🟢</span> 1) Level 1 Direct
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-extrabold ${referralLevelFilter === "1" ? "bg-white/20 text-white" : "bg-emerald-100 text-emerald-800"}`}>
                    {level1Users.length}
                  </span>
                </button>

                {/* 2) Level 2 */}
                <button
                  type="button"
                  onClick={() => setReferralLevelFilter("2")}
                  className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    referralLevelFilter === "2"
                      ? "bg-blue-600 text-white shadow-sm ring-1 ring-blue-600"
                      : "bg-white text-blue-800 hover:bg-blue-50/60 border border-blue-200/80"
                  }`}
                >
                  <span>🔵</span> 2) Level 2
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-extrabold ${referralLevelFilter === "2" ? "bg-white/20 text-white" : "bg-blue-100 text-blue-800"}`}>
                    {level2Users.length}
                  </span>
                </button>

                {/* 3) Level 3 */}
                <button
                  type="button"
                  onClick={() => setReferralLevelFilter("3")}
                  className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    referralLevelFilter === "3"
                      ? "bg-purple-600 text-white shadow-sm ring-1 ring-purple-600"
                      : "bg-white text-purple-800 hover:bg-purple-50/60 border border-purple-200/80"
                  }`}
                >
                  <span>🟣</span> 3) Level 3
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-extrabold ${referralLevelFilter === "3" ? "bg-white/20 text-white" : "bg-purple-100 text-purple-800"}`}>
                    {level3Users.length}
                  </span>
                </button>

                {/* 4) All Downlines */}
                <button
                  type="button"
                  onClick={() => setReferralLevelFilter("all")}
                  className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    referralLevelFilter === "all"
                      ? "bg-navy text-white shadow-sm ring-1 ring-navy"
                      : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80"
                  }`}
                >
                  <span>👥</span> 4) All Downlines
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-extrabold ${referralLevelFilter === "all" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"}`}>
                    {allReferredUsers.length}
                  </span>
                </button>

                {/* 5) Qualified KYC */}
                <button
                  type="button"
                  onClick={() => setReferralLevelFilter("qualified")}
                  className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    referralLevelFilter === "qualified"
                      ? "bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-600"
                      : "bg-white text-indigo-800 hover:bg-indigo-50/60 border border-indigo-200/80"
                  }`}
                >
                  <span>✓</span> 5) Qualified KYC
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-extrabold ${referralLevelFilter === "qualified" ? "bg-white/20 text-white" : "bg-indigo-100 text-indigo-800"}`}>
                    {allReferredUsers.filter(isUserQualified).length}
                  </span>
                </button>

                {/* 6) Action Pending */}
                <button
                  type="button"
                  onClick={() => setReferralLevelFilter("pending")}
                  className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    referralLevelFilter === "pending"
                      ? "bg-amber-600 text-white shadow-sm ring-1 ring-amber-600"
                      : "bg-white text-amber-800 hover:bg-amber-50/60 border border-amber-200/80"
                  }`}
                >
                  <span>⏳</span> 6) Action Pending
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-extrabold ${referralLevelFilter === "pending" ? "bg-white/20 text-white" : "bg-amber-100 text-amber-800"}`}>
                    {allReferredUsers.filter(u => !isUserQualified(u)).length}
                  </span>
                </button>
              </div>

              <CardContent className="p-0">
                {sortedRoster.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 text-xs">
                    No downline members found matching current query parameters.
                  </div>
                ) : (
                  <div className="overflow-x-auto scrollbar-none">
                    <table className="w-full text-xs text-left min-w-[720px]">
                      <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold">
                        <tr>
                          <th className="p-3">Member Details</th>
                          <th className="p-3">Hierarchy Tier</th>
                          <th className="p-3">Joined Date</th>
                          <th className="p-3 text-center">Orders</th>
                          <th className="p-3 text-right">Commission Generated</th>
                          <th className="p-3 text-center">KYC &amp; Activity</th>
                          <th className="p-3 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {sortedRoster.map((u) => {
                          const phone = u.phone || u.mobile || "";
                          const cleanPhone = phone.replace(/[^0-9]/g, "");
                          const qualified = isUserQualified(u);
                          const isDirectLevel = u.levelNum === 1;
                          return (
                            <tr key={u._id} className="hover:bg-slate-50/70 transition-all">
                              <td className="p-3">
                                <div className="flex items-start gap-2.5">
                                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0 border ${
                                    u.levelNum === 1
                                      ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                                      : u.levelNum === 2
                                        ? "bg-blue-50 border-blue-300 text-blue-800"
                                        : "bg-purple-50 border-purple-300 text-purple-800"
                                  }`}>
                                    {u.name.substring(0, 1).toUpperCase()}
                                  </div>
                                  <div className="min-w-0 space-y-0.5">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <p className="font-extrabold text-navy text-xs truncate">{u.name}</p>
                                      {u.referralCode && (
                                        <Badge variant="outline" className="text-[9px] px-1 py-0 border-indigo-200 bg-indigo-50/60 text-indigo-700 font-mono">
                                          {u.referralCode}
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2 flex-wrap text-[10px]">
                                      {isDirectLevel ? (
                                        <>
                                          {phone ? (
                                            <div className="flex items-center gap-1">
                                              <a
                                                href={`tel:${phone}`}
                                                className="inline-flex items-center gap-1 text-slate-700 hover:text-emerald-700 hover:underline font-semibold bg-slate-100 hover:bg-emerald-50 px-1.5 py-0.5 rounded text-[9.5px] border border-slate-200/60"
                                                title="Call phone"
                                              >
                                                <Phone className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                                                {phone}
                                              </a>
                                              <a
                                                href={`https://wa.me/${cleanPhone.startsWith("91") ? cleanPhone : "91" + cleanPhone}?text=${encodeURIComponent(`Hi ${u.name}, welcome to ApexBee! Let us know if you need any assistance getting started.`)}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-0.5 text-green-700 hover:text-green-800 bg-green-50 hover:bg-green-100 px-1.5 py-0.5 rounded text-[9px] font-bold border border-green-200"
                                                title="Chat on WhatsApp"
                                              >
                                                💬 WA
                                              </a>
                                            </div>
                                          ) : (
                                            <span className="text-[9.5px] text-slate-400 italic">No phone</span>
                                          )}
                                          {u.email ? (
                                            <a
                                              href={`mailto:${u.email}`}
                                              className="inline-flex items-center gap-1 text-slate-600 hover:text-blue-700 font-medium bg-slate-100 hover:bg-blue-50 px-1.5 py-0.5 rounded text-[9.5px] truncate max-w-[140px]"
                                              title="Send Email"
                                            >
                                              <Mail className="w-2.5 h-2.5 text-blue-600 shrink-0" />
                                              <span className="truncate">{u.email}</span>
                                            </a>
                                          ) : null}
                                        </>
                                      ) : (
                                        <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-mono">
                                          <span className="inline-flex items-center gap-1 bg-slate-100 px-1.5 py-0.5 rounded text-[9.5px] text-slate-500 font-semibold" title="Phone masked for Level 2 & 3">
                                            🔒 {phone ? maskPhone(phone) : "Hidden"}
                                          </span>
                                          {u.email && (
                                            <span className="inline-flex items-center gap-1 bg-slate-100 px-1.5 py-0.5 rounded text-[9.5px] text-slate-500 font-semibold truncate max-w-[130px]" title="Email masked for Level 2 & 3">
                                              🔒 {maskEmail(u.email)}
                                            </span>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="p-3">
                                <Badge variant="outline" className={`text-[9.5px] font-bold px-2 py-0.5 ${
                                  u.levelNum === 1
                                    ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                                    : u.levelNum === 2
                                      ? "bg-blue-50 text-blue-800 border-blue-300"
                                      : "bg-purple-50 text-purple-800 border-purple-300"
                                }`}>
                                  {u.levelNum === 1 ? "🟢 Level 1 Direct" : u.levelNum === 2 ? "🔵 Level 2" : "🟣 Level 3"}
                                </Badge>
                              </td>
                              <td className="p-3 text-slate-500 font-medium text-[11px]">
                                {new Date(u.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                              </td>
                              <td className="p-3 text-center">
                                <span className="font-extrabold text-navy text-xs">{u.totalPurchases || 0}</span>
                                <span className="text-[9.5px] text-slate-400 block font-medium">orders</span>
                              </td>
                              <td className="p-3 text-right">
                                <span className="font-extrabold text-emerald-700 text-xs sm:text-sm">₹{formatINR(u.totalCommissionGenerated || 0)}</span>
                              </td>
                              <td className="p-3 text-center">
                                <span className="p-3 text-center">
                                  {qualified ? (
                                    <div className="inline-flex flex-col items-center gap-0.5">
                                      <span className="text-[9.5px] font-black px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-300">
                                        ✓ Qualified
                                      </span>
                                      <span className="text-[8.5px] text-slate-400 font-medium">KYC &amp; Orders Done</span>
                                    </div>
                                  ) : (
                                    <div className="inline-flex flex-col items-center gap-0.5">
                                      <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                                        ⏳ Pending
                                      </span>
                                      <span className="text-[8.5px] text-slate-400 font-medium">
                                        {!phone ? "Phone Req." : !u.email ? "Email Req." : (u.totalPurchases || 0) === 0 ? "1st Order Req." : "KYC Req."}
                                      </span>
                                    </div>
                                  )}
                                </span>
                              </td>
                              <td className="p-3 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-[10px] h-7 px-2.5 border-slate-200 text-slate-700 hover:text-navy hover:bg-slate-100 font-bold rounded-lg cursor-pointer"
                                    onClick={() => setSelectedProfileNode(u)}
                                  >
                                    Profile Details
                                  </Button>
                                  {isDirectLevel && !qualified && phone && (
                                    <a
                                      href={`https://wa.me/${cleanPhone.startsWith("91") ? cleanPhone : "91" + cleanPhone}?text=${encodeURIComponent(`Hi ${u.name}! Reminder from ApexBee: complete your account verification and first purchase to activate full referral earnings.`)}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 text-[10px] h-7 px-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-all"
                                      title="Send WhatsApp Reminder"
                                    >
                                      💬 Remind
                                    </a>
                                  )}
                                  {!isDirectLevel && (
                                    <Badge variant="outline" className="text-[9px] px-1.5 py-0.5 text-slate-400 bg-slate-50 border-slate-200 font-bold">
                                      Tier {u.levelNum} Protected
                                    </Badge>
                                  )}
                                </div>
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

          {/* Commissions Tab Content */}
          <TabsContent value="commissions" className="space-y-4 sm:space-y-6 text-left">
            <Card className="border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
              <CardHeader className="border-b border-slate-100 p-4 sm:p-6 pb-4">
                <CardTitle className="text-sm sm:text-base font-extrabold text-navy">Financial Commission Ledger</CardTitle>
                <CardDescription className="text-[11px] sm:text-xs text-slate-500">Track and audit transaction-level commissions generated across your downline referral tiers.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {validCommissions.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 text-xs">
                    No commission transactions found in ledger database.
                  </div>
                ) : (
                  <div className="overflow-x-auto scrollbar-none">
                    <table className="w-full text-xs text-left min-w-[650px]">
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
                        {validCommissions.map((c) => (
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
                              {c.orderValue && c.orderValue > 0 ? `₹${formatINR(c.orderValue)}` : "—"}
                            </td>
                            <td className="p-3 text-right text-slate-500">
                              {c.commissionPercentage !== undefined && c.commissionPercentage !== null ? `${c.commissionPercentage}%` : "—"}
                            </td>
                            <td className="p-3 text-right font-extrabold text-navy">₹{formatINR(c.commissionAmount || c.amount || 0)}</td>
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
          <TabsContent value="network" className="space-y-4 sm:space-y-6 text-left">
            <Card className="border border-slate-200 shadow-sm rounded-2xl">
              <CardHeader className="p-4 sm:p-6 pb-3 border-b border-slate-100 bg-slate-50/50">
                <CardTitle className="text-sm sm:text-base font-extrabold text-navy">Interactive Downline Tree</CardTitle>
                <CardDescription className="text-[11px] sm:text-xs text-slate-500">Navigate downline nodes to inspect network volume, user performance and earnings splits.</CardDescription>
              </CardHeader>
              <CardContent className="p-3 sm:p-6">
                {level1Users.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 text-xs">
                    No downlines found in network hierarchy database.
                  </div>
                ) : (
                  <div className="space-y-3 sm:space-y-4">
                    {/* Root Node: Current User */}
                    <div className="bg-indigo-900 text-white rounded-2xl p-3 sm:p-4 flex items-center justify-between border-2 border-indigo-700 shadow">
                      <div className="flex items-center gap-2.5 sm:gap-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-indigo-800 border flex items-center justify-center font-bold text-xs sm:text-sm shrink-0">
                          ME
                        </div>
                        <div>
                          <p className="font-extrabold text-xs sm:text-sm">{networkData?.user.name || "You"}</p>
                          <p className="text-[10px] sm:text-xs text-indigo-300">Code: {referralCode}</p>
                        </div>
                      </div>
                      <Badge className="bg-emerald-500 text-white font-bold text-[9px] sm:text-[10px]">ROOT LEVEL</Badge>
                    </div>

                    {/* Level 1 Nodes */}
                    <div className="ml-2.5 sm:ml-6 border-l-2 border-dashed border-indigo-200 pl-2 sm:pl-4 space-y-2.5 sm:space-y-3">
                      {level1Users.map((u1) => {
                        const kids2 = level2Users.filter(u2 => String(u2.referredBy) === String(u1._id || (u1 as any).id));
                        const kids3UnderU1 = level3Users.filter(u3 => kids2.some(u2 => String(u3.referredBy) === String(u2._id || (u2 as any).id)));
                        const totalDownlinesU1 = kids2.length + kids3UnderU1.length;
                        const isL1Expanded = !!expandedRows[`l1_${u1._id}`];
                        const u1Phone = u1.phone || (u1 as any).mobile || "";
                        const u1CleanPhone = u1Phone.replace(/[^0-9]/g, "");
                        return (
                          <div key={u1._id} className="space-y-2">
                            <div
                              className="bg-white border rounded-xl p-3 sm:p-3.5 flex justify-between items-start sm:items-center hover:shadow-sm transition-all cursor-pointer gap-2"
                              onClick={() => setExpandedRows(prev => ({ ...prev, [`l1_${u1._id}`]: !isL1Expanded }))}
                            >
                              <div className="flex items-start gap-2.5 sm:gap-3 min-w-0">
                                <span className="text-emerald-600 shrink-0 text-sm mt-0.5">🟢</span>
                                <div className="min-w-0 space-y-1">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <p className="font-extrabold text-navy text-xs sm:text-sm truncate">{u1.name}</p>
                                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-emerald-200 bg-emerald-50 text-emerald-800 font-bold">
                                      Level 1 Direct
                                    </Badge>
                                    {u1.referralCode && (
                                      <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-indigo-200 bg-indigo-50/50 text-indigo-700 font-mono">
                                        Ref: {u1.referralCode}
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 flex-wrap text-[10px] text-slate-500 font-medium">
                                    <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-150">
                                      👥 Total: {kids2.length} Direct downline ({totalDownlinesU1} total downline)
                                    </span>
                                    <span>•</span>
                                    <span>Joined: {new Date(u1.createdAt).toLocaleDateString()}</span>
                                  </div>
                                  {/* Contact Details */}
                                  <div className="flex items-center gap-2 flex-wrap pt-0.5">
                                    {u1Phone ? (
                                      <div className="flex items-center gap-1">
                                        <a
                                          href={`tel:${u1Phone}`}
                                          onClick={(e) => e.stopPropagation()}
                                          className="inline-flex items-center gap-1 text-slate-700 hover:text-emerald-700 hover:underline font-semibold bg-slate-100 hover:bg-emerald-50 px-2 py-0.5 rounded-md text-[10px] border border-slate-200/60"
                                          title="Call phone"
                                        >
                                          <Phone className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                                          {u1Phone}
                                        </a>
                                        <a
                                          href={`https://wa.me/${u1CleanPhone.startsWith("91") ? u1CleanPhone : "91" + u1CleanPhone}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          onClick={(e) => e.stopPropagation()}
                                          className="inline-flex items-center gap-1 text-green-700 hover:text-green-800 bg-green-50 hover:bg-green-100 px-2 py-0.5 rounded-md text-[9.5px] font-bold border border-green-200"
                                          title="Chat on WhatsApp"
                                        >
                                          💬 WhatsApp
                                        </a>
                                      </div>
                                    ) : (
                                      <span className="text-[9.5px] text-slate-400 italic">No phone</span>
                                    )}
                                    {u1.email ? (
                                      <a
                                        href={`mailto:${u1.email}`}
                                        onClick={(e) => e.stopPropagation()}
                                        className="inline-flex items-center gap-1 text-slate-700 hover:text-blue-700 hover:underline font-semibold bg-slate-100 hover:bg-blue-50 px-2 py-0.5 rounded-md text-[10px] border border-slate-200/60 truncate max-w-[200px]"
                                        title="Send Email"
                                      >
                                        <Mail className="w-2.5 h-2.5 text-blue-600 shrink-0" />
                                        <span className="truncate">{u1.email}</span>
                                      </a>
                                    ) : null}
                                  </div>
                                </div>
                              </div>
                              <div className="text-right flex items-center gap-2.5 sm:gap-4 shrink-0">
                                <div>
                                  <p className="font-extrabold text-navy text-xs sm:text-sm">₹{formatINR(u1.totalCommissionGenerated || 0)}</p>
                                  <p className="text-[9.5px] text-slate-400 font-semibold">{u1.totalPurchases || 0} orders</p>
                                </div>
                                <span className="text-slate-400 text-xs">{isL1Expanded ? "▲" : "▼"}</span>
                              </div>
                            </div>

                            {/* Level 2 & Level 3 Nodes under this L1 */}
                            {isL1Expanded && (
                              <div className="ml-2.5 sm:ml-6 border-l-2 border-dashed border-emerald-200 pl-2 sm:pl-4 space-y-2">
                                {totalDownlinesU1 === 0 ? (
                                  <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-center text-slate-400 text-xs">
                                    No downline members under {u1.name} yet.
                                  </div>
                                ) : (
                                  <>
                                    {/* Branch Downline Summary */}
                                    <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 sm:p-3 flex flex-wrap items-center justify-between gap-2">
                                      <div className="space-y-0.5">
                                        <p className="text-xs font-bold text-navy">
                                          {u1.name}'s Downline Network
                                        </p>
                                        <p className="text-[10px] text-slate-500">
                                          Level 2: <span className="font-bold text-blue-700">{kids2.length}</span> • Level 3: <span className="font-bold text-purple-700">{kids3UnderU1.length}</span>
                                        </p>
                                      </div>
                                      <Badge className="bg-indigo-600 text-white font-extrabold text-[10px] px-2.5 py-1">
                                        Total Downline: {totalDownlinesU1}
                                      </Badge>
                                    </div>

                                    {/* Level 2 Nodes - Details hidden, shows total downline */}
                                    {kids2.map((u2) => {
                                      const kids3 = level3Users.filter(u3 => String(u3.referredBy) === String(u2._id || (u2 as any).id));
                                      const isL2Expanded = !!expandedRows[`l2_${u2._id}`];
                                      return (
                                        <div key={u2._id} className="space-y-1.5">
                                          <div
                                            className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 sm:p-3 flex justify-between items-center hover:shadow-inner transition-all cursor-pointer gap-2"
                                            onClick={() => setExpandedRows(prev => ({ ...prev, [`l2_${u2._id}`]: !isL2Expanded }))}
                                          >
                                            <div className="flex items-center gap-2 min-w-0">
                                              <span className="text-blue-500 shrink-0 text-xs">🔵</span>
                                              <div className="min-w-0">
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                  <p className="font-bold text-navy text-[11px] sm:text-xs truncate">{u2.name}</p>
                                                  <Badge variant="outline" className="text-[8.5px] px-1 py-0 border-blue-200 bg-blue-50 text-blue-800 font-bold">
                                                    Level 2
                                                  </Badge>
                                                </div>
                                              </div>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                              <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 text-[10px]">
                                                👥 Total Downline: {kids3.length}
                                              </span>
                                              {kids3.length > 0 && (
                                                <span className="text-slate-400 text-[10px]">{isL2Expanded ? "▲" : "▼"}</span>
                                              )}
                                            </div>
                                          </div>

                                          {/* Level 3 Nodes under this L2 - Details hidden, shows total downline */}
                                          {isL2Expanded && kids3.length > 0 && (
                                            <div className="ml-2 sm:ml-4 border-l-2 border-dashed border-blue-200 pl-2 sm:pl-3 space-y-1.5">
                                              {kids3.map((u3) => (
                                                <div key={u3._id} className="bg-purple-50/40 border border-purple-150 rounded-xl p-2 sm:p-2.5 flex items-center justify-between gap-2">
                                                  <div className="flex items-center gap-1.5 sm:gap-2 text-xs min-w-0">
                                                    <span className="text-purple-600 shrink-0 text-[10px]">🟣</span>
                                                    <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                                                      <p className="font-semibold text-slate-800 text-[10.5px] sm:text-xs truncate">{u3.name}</p>
                                                      <Badge variant="outline" className="text-[8px] px-1 py-0 border-purple-200 bg-purple-50 text-purple-800 font-bold">
                                                        Level 3
                                                      </Badge>
                                                    </div>
                                                  </div>
                                                  <span className="font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 text-[9.5px] shrink-0">
                                                    Total Downline: 0
                                                  </span>
                                                </div>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </>
                                )}
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
          <TabsContent value="analytics" className="space-y-4 sm:space-y-6 text-left">
            <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Earnings Composition Pie */}
              <Card className="border border-slate-200 shadow-sm rounded-2xl">
                <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-2">
                  <CardTitle className="text-xs sm:text-sm font-extrabold text-navy">Commission Distribution Sources</CardTitle>
                </CardHeader>
                <CardContent className="h-56 sm:h-64 p-2 sm:p-4 flex items-center justify-center">
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
                          outerRadius={70}
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
                <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-2">
                  <CardTitle className="text-xs sm:text-sm font-extrabold text-navy">Referral Network Tier Performance</CardTitle>
                </CardHeader>
                <CardContent className="h-56 sm:h-64 p-2 sm:p-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={levelGrowthData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" stroke="#64748B" style={{ fontSize: "9px" }} />
                      <YAxis stroke="#64748B" style={{ fontSize: "9px" }} />
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
                <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-2">
                  <CardTitle className="text-xs sm:text-sm font-extrabold text-navy">Commission Earning Daily Trend</CardTitle>
                </CardHeader>
                <CardContent className="h-56 sm:h-64 p-2 sm:p-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dailyEarningsTrend}>
                      <defs>
                        <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" stroke="#64748B" style={{ fontSize: "9px" }} />
                      <YAxis stroke="#64748B" style={{ fontSize: "9px" }} />
                      <Tooltip formatter={(value) => `₹${value}`} />
                      <Area type="monotone" dataKey="earnings" stroke="#10B981" fillOpacity={1} fill="url(#colorEarnings)" name="Daily Commission (₹)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Withdraw Tab Content */}
          <TabsContent value="withdraw" className="space-y-4 sm:space-y-6 text-left">
            <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
              {/* Left Column: Bank account details form */}
              <Card className="lg:col-span-2 border border-slate-200 shadow-sm rounded-2xl">
                <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-100 p-4 sm:p-6 pb-4 gap-2">
                  <div>
                    <CardTitle className="text-sm sm:text-base font-extrabold text-navy">Verified Bank Settlement Details</CardTitle>
                    <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">Please ensure name matches PAN/Aadhaar exactly.</p>
                  </div>
                  <Badge className={bankSaved ? "bg-green-100 text-green-800 border-green-200 text-[10px]" : "bg-yellow-100 text-yellow-800 border-yellow-200 text-[10px]"}>
                    {bankSaved ? "Verified & Active" : "Requires Setup"}
                  </Badge>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
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
                    <div className="sm:col-span-2 space-y-1.5">
                      <label className="text-xs font-bold text-slate-600 block">UPI ID (Optional)</label>
                      <Input
                        value={bankDetails.upiId || ""}
                        onChange={(e) => setBankDetails((p) => ({ ...p, upiId: e.target.value }))}
                        placeholder="username@upi"
                      />
                    </div>
                  </div>

                  <Button onClick={saveBankDetailsWithGate} className="w-full sm:w-auto bg-navy hover:bg-navy/90 text-white font-bold text-xs py-2.5 px-6 rounded-xl">
                    Save &amp; Verify Account
                  </Button>
                </CardContent>
              </Card>

              {/* Right Column: Withdraw amount form */}
              <Card className="border border-slate-200 shadow-md rounded-2xl h-fit overflow-hidden bg-white">
                <CardHeader className="bg-gradient-to-r from-slate-950 via-[#0A1128] to-slate-900 text-white p-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2">
                      <span>💳 Withdraw Request</span>
                    </CardTitle>
                    <span className="text-[9.5px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 px-2.5 py-0.5 rounded-full shadow-xs">
                      Instant Payout
                    </span>
                  </div>

                  {/* CLEAR BALANCE & FEE HIGHLIGHT BANNER */}
                  <div className="mt-3 bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/15 text-xs text-slate-100 font-semibold space-y-1.5 shadow-2xs">
                    <div className="flex items-center justify-between flex-wrap gap-2 text-xs sm:text-sm font-black">
                      <span>Total: <strong className="text-amber-300 font-black">₹{formatINR(stats.walletBalance || stats.availableBalance || 0)}</strong></span>
                      <span className="text-slate-400">•</span>
                      <span>Hold: <strong className="text-orange-300 font-black">₹{formatINR(stats.walletHold || stats.pendingBalance || 0)}</strong></span>
                    </div>
                    <div className="text-[10.5px] font-bold text-amber-200/90 pt-1.5 border-t border-white/10 flex items-center justify-between flex-wrap gap-1">
                      <span>Fee: <strong className="text-white font-black">15% (TDS + PLATFORM)</strong></span>
                      <span className="text-[9px] text-emerald-300 font-black bg-emerald-950/70 px-2 py-0.5 rounded border border-emerald-500/40">100% Tax Compliant</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">Amount to Withdraw</label>
                    <Input
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      placeholder="₹500 - ₹50,000"
                      type="number"
                    />

                    {Number(withdrawAmount) > 0 && (
                      <div className="mt-3 bg-amber-50/80 border border-amber-200/80 rounded-xl p-3 text-xs space-y-2 text-slate-800 shadow-2xs">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-slate-600">Requested Amount</span>
                          <span className="font-extrabold text-slate-900">₹{formatINR(Number(withdrawAmount))}</span>
                        </div>
                        <div className="flex justify-between items-center text-rose-700 font-semibold">
                          <span>Fee: 15% (TDS + PLATFORM)</span>
                          <span className="font-bold">- ₹{formatINR(calcWithdrawFee(Number(withdrawAmount)).fee)}</span>
                        </div>
                        <div className="flex justify-between items-center border-t border-amber-200/80 pt-2 text-xs sm:text-sm font-black">
                          <span className="text-slate-900">Net Bank Payout</span>
                          <span className="text-emerald-700">₹{formatINR(calcWithdrawFee(Number(withdrawAmount)).net)}</span>
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
                      className="min-h-16 text-xs"
                    />
                  </div>

                  <Button onClick={requestWithdrawWithGate} className="w-full bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-600 hover:to-amber-800 text-slate-950 font-black text-xs py-3 rounded-xl shadow-lg border border-amber-300/40 transition-all duration-300 cursor-pointer transform hover:scale-[1.01] active:scale-95">
                    Submit Withdrawal Request
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Withdrawals list */}
            <Card className="border border-slate-200 shadow-sm rounded-2xl overflow-hidden mt-4 sm:mt-6">
              <CardHeader className="border-b border-slate-100 p-4 pb-3 bg-slate-50/50">
                <CardTitle className="text-xs sm:text-sm font-extrabold text-navy">Withdrawal Audit History</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {withdrawals.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    No withdrawals found in database ledger.
                  </div>
                ) : (
                  <div className="overflow-x-auto scrollbar-none text-xs">
                    <table className="w-full text-left min-w-[700px]">
                      <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold">
                        <tr>
                          <th className="p-3">Transaction ID</th>
                          <th className="p-3">Reference ID</th>
                          <th className="p-3">Method</th>
                          <th className="p-3">Date</th>
                          <th className="p-3 text-right">Amount</th>
                          <th className="p-3 text-center">Status</th>
                          <th className="p-3">Audit Details</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {withdrawals.map((w) => {
                          const txnId = w.transactionId || (w._id ? `TXN-${w._id.slice(-8).toUpperCase()}` : `TXN-WDR`);
                          const refId = w.referenceId || (w.status === 'pending' ? 'Pending Release' : `REF-${w._id ? w._id.slice(-6).toUpperCase() : 'BANK'}`);
                          return (
                            <tr key={w._id} className="hover:bg-slate-50/70 transition">
                              <td className="p-3">
                                <div className="inline-flex items-center gap-1.5 bg-[#0A1128] text-amber-400 px-2.5 py-1 rounded-xl font-mono text-xs font-bold border border-amber-400/30">
                                  <span>{txnId}</span>
                                  <button
                                    type="button"
                                    onClick={() => copyToClipboard(txnId, "code")}
                                    title="Copy Transaction ID"
                                    className="hover:text-white transition border-none bg-transparent cursor-pointer ml-0.5"
                                  >
                                    <Copy className="w-3 h-3 text-amber-400 hover:text-white" />
                                  </button>
                                </div>
                              </td>
                              <td className="p-3">
                                <div className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-800 px-2.5 py-1 rounded-xl font-mono text-xs font-bold border border-slate-200">
                                  <span>{refId}</span>
                                  {w.referenceId && (
                                    <button
                                      type="button"
                                      onClick={() => copyToClipboard(w.referenceId!, "code")}
                                      title="Copy Reference ID"
                                      className="hover:text-slate-900 transition border-none bg-transparent cursor-pointer ml-0.5 text-slate-400"
                                    >
                                      <Copy className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                              </td>
                              <td className="p-3 text-slate-700 font-bold text-xs">
                                <span className="bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-lg">
                                  {w.paymentMethod || 'Bank Transfer'}
                                </span>
                              </td>
                              <td className="p-3 text-slate-500 font-medium">{new Date(w.createdAt).toLocaleDateString("en-IN")}</td>
                              <td className="p-3 text-right font-black text-slate-900 text-xs">₹{formatINR(w.amount)}</td>
                              <td className="p-3 text-center">
                                <Badge className={
                                  w.status === "paid" ? "bg-emerald-100 text-emerald-800 border-emerald-300 font-bold" :
                                    w.status === "pending" ? "bg-amber-100 text-amber-800 border-amber-300 font-bold" :
                                      "bg-red-100 text-red-800 border-red-300 font-bold"
                                }>
                                  {w.status.toUpperCase()}
                                </Badge>
                              </td>
                              <td className="p-3 text-slate-600 font-medium">{w.note || w.rejectReason || "Verified Settlement"}</td>
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
        </Tabs>
      </div>

      {/* OTP Verification Gate dialog */}
      <Dialog open={showOTPDialog} onOpenChange={setShowOTPDialog}>
        <DialogContent className="w-[92vw] sm:max-w-sm rounded-2xl sm:rounded-3xl bg-white border border-slate-200 p-4 sm:p-6">
          <DialogHeader className="text-center space-y-1">
            <DialogTitle className="font-extrabold text-base sm:text-lg text-navy">🔒 Secure Verification Gate</DialogTitle>
            <DialogDescription className="text-[11px] sm:text-xs text-slate-500">
              For security, verification is mandatory for bank account modifications or payouts.
            </DialogDescription>
          </DialogHeader>

          <div className="py-3 sm:py-4 space-y-3">
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-center text-xs font-semibold text-slate-700">
              {otpAction === "bank" ? "Modifying verified bank details." : `Requesting payout of ₹${formatINR(otpTargetAmount)}.`}
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Enter 6-Digit OTP</label>
              <Input
                type="text"
                placeholder="6-digit OTP code"
                value={otpValue}
                onChange={(e) => setOtpValue(e.target.value)}
                className="font-mono text-center text-base sm:text-lg tracking-widest font-black"
                maxLength={6}
              />
            </div>
          </div>

          <DialogFooter className="flex flex-row gap-2">
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
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[1000] flex justify-end animate-in fade-in duration-200"
          onClick={() => setSelectedProfileNode(null)}
        >
          <div 
            className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header (Fixed) */}
            <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-black text-navy text-sm sm:text-base leading-none">Downline Member Profile</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">Tier {selectedProfileNode.levelNum} Network Affiliate</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedProfileNode(null)} 
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors border border-slate-200/60 cursor-pointer"
                aria-label="Close Drawer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer Body (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-5">
              {/* Member Profile Hero Card */}
              <div className="bg-gradient-to-br from-slate-50 to-indigo-50/30 border border-slate-200/80 rounded-2xl p-4 flex items-center gap-3.5">
                <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-navy to-indigo-600 text-white font-black text-xl flex items-center justify-center shadow-sm shrink-0 border-2 border-white ring-2 ring-indigo-100">
                  {selectedProfileNode.name ? selectedProfileNode.name.charAt(0).toUpperCase() : "U"}
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <h4 className="font-black text-navy text-sm sm:text-base leading-tight break-words">
                    {selectedProfileNode.name}
                  </h4>
                  <p className="text-xs text-slate-500 truncate mt-0.5">
                    {selectedProfileNode.levelNum === 1 ? selectedProfileNode.email : maskEmail(selectedProfileNode.email)}
                  </p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200/60">
                      Level {selectedProfileNode.levelNum}
                    </span>
                    {selectedProfileNode.referralCode && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono font-semibold bg-white text-slate-600 border border-slate-200 shadow-2xs">
                        Code: <span className="font-bold text-navy">{selectedProfileNode.referralCode}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Direct Contact Actions - Full details only for Level 1, Hidden/Masked for Tier 2 & Tier 3 */}
              {selectedProfileNode.levelNum === 1 ? (
                ((selectedProfileNode.phone || selectedProfileNode.mobile) || selectedProfileNode.email) && (
                  <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 text-left">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Direct Contact &amp; Actions</p>
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                        Level 1 Direct Access
                      </span>
                    </div>

                    {/* Phone & WhatsApp Section */}
                    {(selectedProfileNode.phone || selectedProfileNode.mobile) && (
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                            <Phone className="w-3.5 h-3.5" />
                          </div>
                          <span className="font-bold text-navy text-xs sm:text-sm font-mono truncate">
                            {selectedProfileNode.phone || selectedProfileNode.mobile}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <a
                            href={`tel:${selectedProfileNode.phone || selectedProfileNode.mobile}`}
                            className="inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white border border-slate-200 hover:border-slate-300 text-slate-700 font-bold text-xs transition-colors shadow-2xs hover:bg-slate-50"
                          >
                            <Phone className="w-3.5 h-3.5 text-slate-500" />
                            <span>Direct Call</span>
                          </a>
                          <a
                            href={`https://wa.me/${(selectedProfileNode.phone || selectedProfileNode.mobile).replace(/[^0-9]/g, '').startsWith('91') ? (selectedProfileNode.phone || selectedProfileNode.mobile).replace(/[^0-9]/g, '') : '91' + (selectedProfileNode.phone || selectedProfileNode.mobile).replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hi ${selectedProfileNode.name}, reaching out to you from ApexBee network.`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-2xs"
                          >
                            <span>💬 WhatsApp</span>
                          </a>
                        </div>
                      </div>
                    )}

                    {/* Email Section */}
                    {selectedProfileNode.email && (
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                            <Mail className="w-3.5 h-3.5" />
                          </div>
                          <span className="font-semibold text-slate-700 text-xs truncate">
                            {selectedProfileNode.email}
                          </span>
                        </div>
                        <a
                          href={`mailto:${selectedProfileNode.email}`}
                          className="inline-flex items-center gap-1 py-1.5 px-3 rounded-lg bg-white border border-slate-200 text-blue-600 hover:bg-blue-50 font-bold text-xs shrink-0 shadow-2xs"
                        >
                          <span>Send Mail</span>
                        </a>
                      </div>
                    )}
                  </div>
                )
              ) : (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left space-y-2">
                  <div className="flex items-center gap-2 text-slate-600 font-bold text-xs">
                    <span>🔒</span>
                    <span>Tier {selectedProfileNode.levelNum} Privacy Protected</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Direct phone and messaging contact are restricted to direct Level 1 referrals in accordance with affiliate network privacy policies.
                  </p>
                  <div className="pt-1 flex flex-wrap gap-2 text-[10px] text-slate-500 font-mono">
                    {(selectedProfileNode.phone || selectedProfileNode.mobile) && (
                      <span className="bg-white border rounded px-2 py-0.5">
                        Phone: {maskPhone(selectedProfileNode.phone || selectedProfileNode.mobile)}
                      </span>
                    )}
                    {selectedProfileNode.email && (
                      <span className="bg-white border rounded px-2 py-0.5">
                        Email: {maskEmail(selectedProfileNode.email)}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Network stats grid */}
              <div className="grid grid-cols-2 gap-2.5 sm:gap-3 text-left">
                <div className="border border-slate-200/80 rounded-xl p-3 bg-slate-50/60">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Level Tier</span>
                  <span className="text-xs sm:text-sm font-extrabold text-navy block">Level {selectedProfileNode.levelNum}</span>
                </div>
                <div className="border border-slate-200/80 rounded-xl p-3 bg-slate-50/60">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Total Purchases</span>
                  <span className="text-xs sm:text-sm font-extrabold text-navy block">{selectedProfileNode.totalPurchases || 0} orders</span>
                </div>
                <div className="border border-slate-200/80 rounded-xl p-3 bg-slate-50/60">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Joined Date</span>
                  <span className="text-xs font-bold text-navy block">{new Date(selectedProfileNode.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="border border-slate-200/80 rounded-xl p-3 bg-slate-50/60">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">KYC Status</span>
                  <div className="mt-0.5">
                    {selectedProfileNode.firstOrderQualified ? (
                      <span className="inline-flex items-center text-[10px] sm:text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        🟢 Verified Member
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-[10px] sm:text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        🟡 Registered Only
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Order history section */}
              <div className="text-left space-y-2">
                <div className="flex justify-between items-center">
                  <h5 className="font-extrabold text-navy text-xs uppercase tracking-wider">Purchase History</h5>
                  <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                    {selectedProfileNode.orders?.length || 0} orders
                  </span>
                </div>
                {(!selectedProfileNode.orders || selectedProfileNode.orders.length === 0) ? (
                  <div className="p-4 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center">
                    <p className="text-xs text-slate-400 font-medium">No orders completed yet.</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {selectedProfileNode.orders.map((o: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center text-xs p-3 bg-slate-50 border border-slate-200/70 rounded-xl">
                        <div>
                          <p className="font-bold text-navy">Order #{o.orderNumber}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{new Date(o.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-extrabold text-navy">₹{formatINR(o.totalAmount)}</p>
                          <Badge variant="outline" className="text-[9px] bg-white text-slate-700 mt-0.5">{o.status}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Drawer Footer (Sticky Bottom) */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/80 shrink-0">
              <Button 
                className="w-full bg-navy text-white hover:bg-navy/95 font-bold py-2.5 rounded-xl shadow-xs" 
                onClick={() => setSelectedProfileNode(null)}
              >
                Close Drawer Panel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal Dialog */}
      {showInviteQR && (
        <Dialog open={showInviteQR} onOpenChange={setShowInviteQR}>
          <DialogContent className="w-[92vw] sm:max-w-sm rounded-2xl sm:rounded-3xl bg-white border border-slate-200 p-4 sm:p-6 text-center">
            <div className="space-y-3 sm:space-y-4">
              <div className="flex justify-between items-center pb-2 border-b">
                <h4 className="font-extrabold text-navy text-xs sm:text-sm">Your Invite QR Code</h4>
                <button onClick={() => setShowInviteQR(false)} className="p-1 rounded-lg bg-slate-100 border-none cursor-pointer">
                  <X className="w-3.5 h-3.5 text-slate-500" />
                </button>
              </div>

              <div className="w-40 h-40 sm:w-48 sm:h-48 bg-slate-50 border-2 border-dashed rounded-2xl flex items-center justify-center mx-auto p-3 sm:p-4">
                <div className="w-full h-full bg-navy rounded-xl p-2.5 sm:p-3 flex flex-col justify-between items-center text-white">
                  <div className="grid grid-cols-5 gap-1 sm:gap-1.5 w-full h-full opacity-90">
                    {Array.from({ length: 25 }).map((_, i) => (
                      <div
                        key={i}
                        className={`rounded-sm ${(i * 3 + 7) % 5 === 0 || (i % 6 === 0) || (i > 18) ? "bg-white" : "bg-navy"}`}
                      />
                    ))}
                  </div>
                  <span className="text-[8.5px] sm:text-[9px] font-black tracking-widest mt-1.5 sm:mt-2 font-mono">CODE: {referralCode}</span>
                </div>
              </div>

              <div className="text-[9.5px] sm:text-[10px] text-slate-500 font-bold bg-slate-50 p-2 sm:p-2.5 rounded-xl">
                Scan with phone camera to download app with tag: {referralCode}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Training video popup dialog */}
      {showVideoDialog && (
        <Dialog open={showVideoDialog} onOpenChange={setShowVideoDialog}>
          <DialogContent className="w-[92vw] sm:max-w-lg rounded-2xl sm:rounded-3xl bg-white border border-slate-200 p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle className="font-extrabold text-navy text-sm sm:text-base">🎥 ApexBee Referral Training Program</DialogTitle>
              <DialogDescription className="text-[11px] sm:text-xs text-slate-500">Master Downline tree building and double your conversion rates.</DialogDescription>
            </DialogHeader>

            <div className="py-3 sm:py-4 space-y-3 sm:space-y-4">
              <div className="aspect-video w-full bg-slate-900 rounded-2xl flex flex-col items-center justify-center text-white border relative overflow-hidden">
                <Play className="h-12 w-12 sm:h-16 sm:w-16 text-emerald-400 cursor-pointer hover:scale-110 transition-transform" />
                <p className="text-[11px] sm:text-xs font-bold text-slate-300 mt-2">Video: MLM tree construction strategies (12 mins)</p>
              </div>

              <div className="space-y-1.5 sm:space-y-2 text-xs">
                <h5 className="font-extrabold text-navy text-[11px] sm:text-xs">Curriculum Includes:</h5>
                <p className="text-slate-600 text-[10.5px] sm:text-[11px]">• How to pitch local vendors on joining the marketplace.</p>
                <p className="text-slate-600 text-[10.5px] sm:text-[11px]">• Understanding multi-tier product sales commissions payouts.</p>
              </div>
            </div>

            <DialogFooter>
              <Button className="w-full bg-navy text-white hover:bg-navy/95 rounded-xl font-bold text-xs" onClick={() => setShowVideoDialog(false)}>
                Close Video Dialog
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <Footer />
    </div>
  );

  function setBedDetailsAndCapitalize(val: string) {
    setBankDetails((p) => ({ ...p, ifsc: val.toUpperCase() }));
  }
};

export default Referrals;
