import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Droplets,
  Package,
  RefreshCw,
  Search,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Shield,
  Users,
  Calendar,
  Receipt,
  AlertCircle,
  CheckCircle2,
  Sliders,
  DollarSign,
  ArrowLeft,
  X,
  Clock,
  Filter,
  Check
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const API_BASE = import.meta.env.VITE_API_URL || "https://server.apexbee.in/api";

type ContainerAccount = {
  _id: string;
  vendorId: string;
  workspaceId: string;
  account: string;
  accountKey: string;
  outstanding: number;
  depositPaise: number;
  customerId?: string;
  createdAt: string;
  updatedAt: string;
};

type WaterMovement = {
  _id: string;
  kind: "dispatch" | "return" | "deposit_received" | "deposit_refunded";
  quantity: number;
  amountPaise: number;
  date: string;
  notes: string;
  paymentMethod?: string;
  paymentReference?: string;
  productName?: string;
  accountName?: string;
  requestId: string;
  createdAt: string;
};

type WaterProduct = {
  id: string;
  name: string;
  stock: number;
  price: number;
  waterDetails?: {
    volumeLitres: number;
    returnable: boolean;
    depositAmount: number;
    workspaceId: string;
  } | null;
};

type WorkspaceTotals = {
  customers: number;
  outstanding: number;
  depositPaise: number;
};

export default function WaterCanWorkspace() {
  const navigate = useNavigate();

  // Active user check
  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  }, []);

  const token = localStorage.getItem("token") || "";

  // State management
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>("");

  const [products, setProducts] = useState<WaterProduct[]>([]);
  const [accounts, setAccounts] = useState<ContainerAccount[]>([]);
  const [movements, setMovements] = useState<WaterMovement[]>([]);
  const [totals, setTotals] = useState<WorkspaceTotals>({ customers: 0, outstanding: 0, depositPaise: 0 });

  // Filters
  const [activeTab, setActiveTab] = useState<"accounts" | "movements" | "products">("accounts");
  const [accountSearch, setAccountSearch] = useState("");
  const [movementFilter, setMovementFilter] = useState<string>("ALL");

  // Modal action states
  const [activeModal, setActiveModal] = useState<"movement" | "product_config" | null>(null);
  const [modalKind, setModalKind] = useState<"dispatch" | "return" | "deposit_received" | "deposit_refunded">("return");
  const [selectedAccount, setSelectedAccount] = useState<ContainerAccount | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [movementQty, setMovementQty] = useState<number>(1);
  const [movementAmount, setMovementAmount] = useState<number>(0);
  const [movementNotes, setMovementNotes] = useState<string>("");
  const [movementPaymentMethod, setMovementPaymentMethod] = useState<"cash" | "upi" | "bank">("cash");
  const [movementPaymentRef, setMovementPaymentRef] = useState<string>("");
  const [customAccountName, setCustomAccountName] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Product edit states
  const [editingProduct, setEditingProduct] = useState<WaterProduct | null>(null);
  const [editVolume, setEditVolume] = useState<number>(20);
  const [editReturnable, setEditReturnable] = useState<boolean>(true);
  const [editDeposit, setEditDeposit] = useState<number>(150);

  // Fetch all approved workspaces for vendor
  const loadWorkspaces = useCallback(async () => {
    if (!token) {
      navigate("/login?redirect=/vendor/workspace/water");
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_BASE}/vendor/workspace`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load vendor workspaces");

      const list = data.workspaces || [];
      setWorkspaces(list);

      // Locate water workspace
      const waterWs = list.find((w: any) =>
        (w.slug && w.slug.toLowerCase().includes("water")) ||
        (w.name && w.name.toLowerCase().includes("water")) ||
        (w.categoryName && w.categoryName.toLowerCase().includes("daily needs") && w.name.toLowerCase().includes("water"))
      );

      if (waterWs) {
        setActiveWorkspaceId(waterWs.id);
      } else if (list.length > 0) {
        // Fallback to first available workspace
        setActiveWorkspaceId(list[0].id);
      } else {
        setError("No approved business workspaces found for your vendor account. Please register under Daily Needs > Water Cans in Earn With ApexBee.");
      }
    } catch (err: any) {
      setError(err.message || "Unable to connect to vendor workspaces.");
    } finally {
      setLoading(false);
    }
  }, [token, navigate]);

  // Load water workspace operations data
  const loadWaterData = useCallback(async () => {
    if (!activeWorkspaceId || !token) return;
    try {
      setLoading(true);
      setError(null);
      const queryParams = new URLSearchParams({
        workspaceId: activeWorkspaceId,
        ...(accountSearch.trim() ? { accountSearch: accountSearch.trim() } : {})
      });

      const res = await fetch(`${API_BASE}/vendor/workspace/water?${queryParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load water workspace data.");

      setProducts(data.products || []);
      setAccounts(data.accounts || []);
      setMovements(data.movements || []);
      setTotals(data.totals || { customers: 0, outstanding: 0, depositPaise: 0 });

      // Default select first product for actions
      if (data.products && data.products.length > 0 && !selectedProductId) {
        setSelectedProductId(data.products[0].id);
      }
    } catch (err: any) {
      setError(err.message || "Unable to fetch container accounts.");
    } finally {
      setLoading(false);
    }
  }, [activeWorkspaceId, token, accountSearch, selectedProductId]);

  useEffect(() => {
    void loadWorkspaces();
  }, [loadWorkspaces]);

  useEffect(() => {
    if (activeWorkspaceId) {
      void loadWaterData();
    }
  }, [activeWorkspaceId, loadWaterData]);

  // Action modal opening helper
  const openMovementModal = (
    kind: "dispatch" | "return" | "deposit_received" | "deposit_refunded",
    acc?: ContainerAccount
  ) => {
    setModalKind(kind);
    setSelectedAccount(acc || null);
    setCustomAccountName(acc ? acc.account : "");
    setMovementQty(1);
    setMovementAmount(acc && (acc.depositPaise > 0) ? acc.depositPaise / 100 : 150);
    setMovementNotes(
      kind === "return"
        ? "Received empty 20L returnable water container in good condition."
        : kind === "dispatch"
          ? "Issued 20L filled returnable water container."
          : kind === "deposit_received"
            ? "Security deposit received for returnable water containers."
            : "Security deposit refunded on return of containers."
    );
    setMovementPaymentMethod("cash");
    setMovementPaymentRef("");
    setActiveModal("movement");
  };

  // Submit water container movement
  const handleRecordMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWorkspaceId) return;

    const accountName = selectedAccount ? selectedAccount.account : customAccountName.trim();
    if (!accountName || accountName.length < 2) {
      alert("Please enter a valid customer or account name.");
      return;
    }

    if (!selectedProductId) {
      alert("Please select a returnable water product.");
      return;
    }

    const isMonetary = modalKind === "deposit_received" || modalKind === "deposit_refunded";
    if (isMonetary && (!movementAmount || movementAmount <= 0)) {
      alert("Please enter a valid deposit amount.");
      return;
    }

    if (isMonetary && !movementPaymentRef.trim()) {
      alert("Please provide a receipt number or transaction reference.");
      return;
    }

    if (!isMonetary && (!movementQty || movementQty < 1)) {
      alert("Please enter at least 1 container.");
      return;
    }

    if (!movementNotes.trim() || movementNotes.trim().length < 5) {
      alert("Please provide movement notes of at least 5 characters.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: any = {
        workspaceId: activeWorkspaceId,
        productId: selectedProductId,
        kind: modalKind,
        account: accountName,
        accountId: selectedAccount ? selectedAccount._id : undefined,
        quantity: isMonetary ? 0 : Number(movementQty),
        amount: isMonetary ? Number(movementAmount) : 0,
        notes: movementNotes.trim(),
        paymentMethod: isMonetary ? movementPaymentMethod : undefined,
        paymentReference: isMonetary ? movementPaymentRef.trim() : undefined,
        requestId: `water-mov-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
      };

      const res = await fetch(`${API_BASE}/vendor/workspace/water/movements`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Movement submission failed.");

      setSuccessMsg(data.message || "Water container movement recorded successfully.");
      setActiveModal(null);
      void loadWaterData();
    } catch (err: any) {
      alert(err.message || "Failed to record movement.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit product water details update
  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct || !activeWorkspaceId) return;

    setIsSubmitting(true);
    try {
      const payload = {
        workspaceId: activeWorkspaceId,
        volumeLitres: Number(editVolume),
        returnable: Boolean(editReturnable),
        depositAmount: editReturnable ? Number(editDeposit) : 0
      };

      const res = await fetch(`${API_BASE}/vendor/workspace/water/products/${editingProduct.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update product container settings.");

      setSuccessMsg("Product container details updated successfully.");
      setActiveModal(null);
      setEditingProduct(null);
      void loadWaterData();
    } catch (err: any) {
      alert(err.message || "Failed to update product.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered movements
  const filteredMovements = useMemo(() => {
    if (movementFilter === "ALL") return movements;
    return movements.filter(m => m.kind === movementFilter);
  }, [movements, movementFilter]);

  return (
    <div className="min-h-screen bg-[#F4F6FA] text-[#0E1630]">
      <Navbar />

      <main className="container max-w-7xl mx-auto px-4 py-8 pb-24">
        {/* Navigation & Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-gray-500 mb-1">
              <button onClick={() => navigate("/account")} className="hover:text-navy flex items-center gap-1 transition">
                <ArrowLeft size={14} /> Back to Account
              </button>
              <span>/</span>
              <span className="text-navy font-extrabold">Vendor Portal</span>
              <span>/</span>
              <span className="text-blue-600 font-extrabold">Water Cans & Containers</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-600/10 border border-blue-600/20 flex items-center justify-center text-blue-600">
                <Droplets size={22} />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-navy">Water Can & Container Ledger</h1>
                <p className="text-xs sm:text-sm text-gray-500">
                  Track customer empty cans, security deposits, returns, and dispatches in real-time.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => void loadWaterData()}
              disabled={loading}
              className="rounded-xl border-gray-200 bg-white hover:bg-slate-50 text-xs font-bold shadow-sm"
            >
              <RefreshCw size={14} className={`mr-1.5 ${loading ? "animate-spin" : ""}`} /> Refresh Ledger
            </Button>
            <Button
              onClick={() => openMovementModal("return")}
              className="bg-[#0A1128] hover:bg-navy/90 text-white rounded-xl text-xs font-bold shadow-sm"
            >
              <ArrowDownLeft size={14} className="mr-1.5 text-blue-400" /> Receive Empty Cans
            </Button>
            <Button
              onClick={() => openMovementModal("dispatch")}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm"
            >
              <ArrowUpRight size={14} className="mr-1.5 text-blue-200" /> Dispatch Cans
            </Button>
          </div>
        </div>

        {/* Success or Error alerts */}
        {successMsg && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 mb-6 flex items-center justify-between text-emerald-800 text-xs font-bold animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg(null)} className="text-emerald-600 hover:text-emerald-800">
              <X size={16} />
            </button>
          </div>
        )}

        {error && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 flex items-start gap-3 text-amber-800 text-xs">
            <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-bold mb-1">Attention Required</h4>
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white border border-gray-150 rounded-3xl p-5 shadow-sm text-left">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-gray-500">Active Container Customers</span>
              <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-navy">
                <Users size={16} />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-navy">{totals.customers}</div>
            <p className="text-[11px] text-gray-400 mt-1">Accounts with recorded container history</p>
          </div>

          <div className="bg-white border border-gray-150 rounded-3xl p-5 shadow-sm text-left">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-gray-500">Outstanding Empty Cans</span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                <Package size={16} />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-blue-600">{totals.outstanding}</div>
            <p className="text-[11px] text-blue-700 font-semibold mt-1">Unreturned cans currently with customers</p>
          </div>

          <div className="bg-white border border-gray-150 rounded-3xl p-5 shadow-sm text-left">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-gray-500">Security Deposit Held</span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                <Shield size={16} />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-amber-600">
              ₹{(totals.depositPaise / 100).toLocaleString("en-IN")}
            </div>
            <p className="text-[11px] text-gray-400 mt-1">Total refundable customer deposit in custody</p>
          </div>

          <div className="bg-white border border-gray-150 rounded-3xl p-5 shadow-sm text-left">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-gray-500">Configured Products</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                <Droplets size={16} />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-600">{products.length}</div>
            <p className="text-[11px] text-gray-400 mt-1">Available for subscription & retail delivery</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-gray-200 mb-6 pb-2">
          <button
            onClick={() => setActiveTab("accounts")}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition ${activeTab === "accounts"
                ? "bg-navy text-white shadow-sm"
                : "text-gray-600 hover:text-navy hover:bg-slate-100"
              }`}
          >
            Customer Container Accounts ({accounts.length})
          </button>
          <button
            onClick={() => setActiveTab("movements")}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition ${activeTab === "movements"
                ? "bg-navy text-white shadow-sm"
                : "text-gray-600 hover:text-navy hover:bg-slate-100"
              }`}
          >
            Audit Ledger ({movements.length})
          </button>
          <button
            onClick={() => setActiveTab("products")}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition ${activeTab === "products"
                ? "bg-navy text-white shadow-sm"
                : "text-gray-600 hover:text-navy hover:bg-slate-100"
              }`}
          >
            Container Product Settings ({products.length})
          </button>
        </div>

        {/* TAB 1: ACCOUNTS */}
        {activeTab === "accounts" && (
          <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <Input
                  placeholder="Search customer account by name or address..."
                  value={accountSearch}
                  onChange={(e) => setAccountSearch(e.target.value)}
                  className="pl-10 text-xs rounded-xl bg-slate-50 border-gray-200"
                />
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={() => openMovementModal("dispatch")}
                  variant="outline"
                  size="sm"
                  className="rounded-xl text-xs font-bold"
                >
                  <Plus size={14} className="mr-1" /> New Customer Can Issuance
                </Button>
              </div>
            </div>

            {loading ? (
              <div className="py-12 text-center text-xs text-gray-500">Loading container accounts...</div>
            ) : accounts.length === 0 ? (
              <div className="py-12 text-center text-gray-500 space-y-2">
                <Package size={36} className="mx-auto text-gray-300" />
                <h4 className="text-sm font-bold text-navy">No Container Accounts Found</h4>
                <p className="text-xs text-gray-400">
                  {accountSearch ? "No accounts match your search query." : "When returnable water cans are delivered, customer balances will automatically appear here."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                      <th className="pb-3 px-3">Customer / Account</th>
                      <th className="pb-3 px-3">Outstanding Cans</th>
                      <th className="pb-3 px-3">Deposit Held</th>
                      <th className="pb-3 px-3">Last Activity</th>
                      <th className="pb-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {accounts.map((acc) => (
                      <tr key={acc._id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3.5 px-3">
                          <div className="font-extrabold text-navy text-sm">{acc.account}</div>
                          <div className="text-[11px] text-gray-400 font-mono">{acc.accountKey}</div>
                        </td>
                        <td className="py-3.5 px-3">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full font-extrabold text-xs ${acc.outstanding > 0
                                ? "bg-blue-100 text-blue-800 border border-blue-200"
                                : "bg-emerald-100 text-emerald-800"
                              }`}
                          >
                            {acc.outstanding} {acc.outstanding === 1 ? "Can" : "Cans"} Held
                          </span>
                        </td>
                        <td className="py-3.5 px-3 font-extrabold text-amber-700">
                          ₹{(acc.depositPaise / 100).toLocaleString("en-IN")}
                        </td>
                        <td className="py-3.5 px-3 text-gray-400">
                          {new Date(acc.updatedAt || acc.createdAt).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric"
                          })}
                        </td>
                        <td className="py-3.5 px-3 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openMovementModal("return", acc)}
                              className="h-8 rounded-lg text-[11px] font-bold border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700"
                              title="Receive empty cans returned by this customer"
                            >
                              Receive Return
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openMovementModal("dispatch", acc)}
                              className="h-8 rounded-lg text-[11px] font-bold border-gray-200 hover:bg-slate-100"
                              title="Issue additional filled cans to this customer"
                            >
                              Issue Can
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openMovementModal("deposit_refunded", acc)}
                              disabled={acc.depositPaise <= 0}
                              className="h-8 rounded-lg text-[11px] font-bold border-amber-200 hover:bg-amber-50 text-amber-700"
                              title="Refund security deposit to customer"
                            >
                              Refund
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: AUDIT LEDGER */}
        {activeTab === "movements" && (
          <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-500">Filter Ledger:</span>
                {["ALL", "return", "dispatch", "deposit_received", "deposit_refunded"].map((kind) => (
                  <button
                    key={kind}
                    onClick={() => setMovementFilter(kind)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${movementFilter === kind
                        ? "bg-navy text-white"
                        : "bg-slate-100 text-gray-600 hover:bg-slate-200"
                      }`}
                  >
                    {kind === "ALL"
                      ? "All Movements"
                      : kind === "return"
                        ? "Empty Returns"
                        : kind === "dispatch"
                          ? "Can Dispatches"
                          : kind === "deposit_received"
                            ? "Deposits Collected"
                            : "Deposits Refunded"}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="py-12 text-center text-xs text-gray-500">Loading ledger movements...</div>
            ) : filteredMovements.length === 0 ? (
              <div className="py-12 text-center text-gray-500 space-y-2">
                <Receipt size={36} className="mx-auto text-gray-300" />
                <h4 className="text-sm font-bold text-navy">No Movements Recorded</h4>
                <p className="text-xs text-gray-400">Recorded dispatches, returns, and deposit entries will be audited here.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                      <th className="pb-3 px-3">Date</th>
                      <th className="pb-3 px-3">Type</th>
                      <th className="pb-3 px-3">Customer / Account</th>
                      <th className="pb-3 px-3">Product</th>
                      <th className="pb-3 px-3">Quantity / Value</th>
                      <th className="pb-3 px-3">Payment Info</th>
                      <th className="pb-3 px-3">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredMovements.map((mov) => (
                      <tr key={mov._id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 px-3 font-semibold text-gray-600">{mov.date}</td>
                        <td className="py-3 px-3">
                          {mov.kind === "return" && (
                            <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold text-[11px]">
                              <ArrowDownLeft size={12} /> Empty Return
                            </span>
                          )}
                          {mov.kind === "dispatch" && (
                            <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold text-[11px]">
                              <ArrowUpRight size={12} /> Can Dispatch
                            </span>
                          )}
                          {mov.kind === "deposit_received" && (
                            <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold text-[11px]">
                              <Shield size={12} /> Deposit Received
                            </span>
                          )}
                          {mov.kind === "deposit_refunded" && (
                            <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full font-bold text-[11px]">
                              <RefreshCw size={12} /> Deposit Refunded
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 font-bold text-navy">{mov.accountName || "Customer"}</td>
                        <td className="py-3 px-3 text-gray-600">{mov.productName || "20L Water Can"}</td>
                        <td className="py-3 px-3 font-black text-navy">
                          {mov.kind.startsWith("deposit_")
                            ? `₹${(mov.amountPaise / 100).toLocaleString("en-IN")}`
                            : `${mov.quantity} Cans`}
                        </td>
                        <td className="py-3 px-3 text-gray-500">
                          {mov.paymentMethod ? (
                            <div>
                              <span className="font-bold uppercase text-[10px] text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded">
                                {mov.paymentMethod}
                              </span>
                              {mov.paymentReference && (
                                <span className="block text-[10px] text-gray-400 mt-0.5">{mov.paymentReference}</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-gray-500 max-w-xs truncate" title={mov.notes}>
                          {mov.notes}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: PRODUCTS & CONTAINER CONFIG */}
        {activeTab === "products" && (
          <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-extrabold text-navy">Returnable Container Settings</h3>
                <p className="text-xs text-gray-500">
                  Configure volume, returnable container status, and refundable security deposits.
                </p>
              </div>
            </div>

            {products.length === 0 ? (
              <div className="py-12 text-center text-gray-500">No products found under this workspace.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {products.map((prod) => {
                  const details = prod.waterDetails;
                  return (
                    <div
                      key={prod.id}
                      className="border border-gray-150 rounded-2xl p-5 bg-slate-50/50 flex flex-col justify-between hover:border-blue-300 transition"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <h4 className="font-black text-navy text-sm leading-snug">{prod.name}</h4>
                          <span
                            className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${details?.returnable
                                ? "bg-blue-100 text-blue-800 border border-blue-200"
                                : "bg-gray-100 text-gray-600"
                              }`}
                          >
                            {details?.returnable ? "Returnable Asset" : "Non-Returnable"}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="bg-white p-2.5 rounded-xl border border-gray-100">
                            <span className="text-[10px] text-gray-400 block font-bold">Selling Price</span>
                            <span className="font-extrabold text-navy">₹{prod.price || 0}</span>
                          </div>
                          <div className="bg-white p-2.5 rounded-xl border border-gray-100">
                            <span className="text-[10px] text-gray-400 block font-bold">Volume</span>
                            <span className="font-extrabold text-navy">{details?.volumeLitres || 20} Litres</span>
                          </div>
                          <div className="bg-white p-2.5 rounded-xl border border-gray-100 col-span-2">
                            <span className="text-[10px] text-gray-400 block font-bold">Refundable Deposit</span>
                            <span className="font-extrabold text-amber-700">
                              ₹{details?.depositAmount != null ? details.depositAmount : 150} per can
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-gray-150 mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingProduct(prod);
                            setEditVolume(details?.volumeLitres || 20);
                            setEditReturnable(details?.returnable !== false);
                            setEditDeposit(details?.depositAmount != null ? details.depositAmount : 150);
                            setActiveModal("product_config");
                          }}
                          className="w-full text-xs font-bold rounded-xl border-gray-200 hover:bg-blue-50 hover:text-blue-700"
                        >
                          <Sliders size={13} className="mr-1.5" /> Configure Container
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* MODAL: MOVEMENT ACTION */}
        {activeModal === "movement" && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center ${modalKind === "return"
                        ? "bg-blue-100 text-blue-700"
                        : modalKind === "dispatch"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                  >
                    {modalKind === "return" ? <ArrowDownLeft size={18} /> : modalKind === "dispatch" ? <ArrowUpRight size={18} /> : <Shield size={18} />}
                  </div>
                  <div>
                    <h3 className="font-black text-navy text-base">
                      {modalKind === "return"
                        ? "Receive Empty Cans Return"
                        : modalKind === "dispatch"
                          ? "Dispatch Returnable Cans"
                          : modalKind === "deposit_received"
                            ? "Record Security Deposit Collection"
                            : "Process Security Deposit Refund"}
                    </h3>
                    <p className="text-[11px] text-gray-400">Updates customer outstanding balance safely.</p>
                  </div>
                </div>
                <button onClick={() => setActiveModal(null)} className="text-gray-400 hover:text-gray-600">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleRecordMovement} className="space-y-4 text-left text-xs">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Customer / Account Name *</label>
                  {selectedAccount ? (
                    <div className="bg-slate-50 border border-gray-200 p-2.5 rounded-xl font-bold text-navy flex items-center justify-between">
                      <span>{selectedAccount.account}</span>
                      <span className="text-[10px] text-blue-600 font-semibold">
                        ({selectedAccount.outstanding} Cans with customer)
                      </span>
                    </div>
                  ) : (
                    <Input
                      placeholder="e.g. Flat 301 - Sai Residency / Ramesh Kumar"
                      value={customAccountName}
                      onChange={(e) => setCustomAccountName(e.target.value)}
                      required
                      className="rounded-xl"
                    />
                  )}
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Returnable Water Product *</label>
                  <select
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    required
                    className="w-full border border-gray-200 rounded-xl p-2.5 bg-white text-xs font-semibold"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.waterDetails?.volumeLitres || 20}L - Deposit: ₹{p.waterDetails?.depositAmount || 0})
                      </option>
                    ))}
                  </select>
                </div>

                {modalKind === "dispatch" || modalKind === "return" ? (
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">
                      {modalKind === "return" ? "Empty Containers Received *" : "Filled Containers Issued *"}
                    </label>
                    <Input
                      type="number"
                      min={1}
                      max={1000}
                      value={movementQty}
                      onChange={(e) => setMovementQty(parseInt(e.target.value) || 1)}
                      required
                      className="rounded-xl font-bold text-sm"
                    />
                    {modalKind === "return" && selectedAccount && (
                      <p className="text-[11px] text-gray-400 mt-1">
                        Max return allowable for this account: <strong>{selectedAccount.outstanding} cans</strong>.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">Deposit Amount (₹) *</label>
                      <Input
                        type="number"
                        min={1}
                        value={movementAmount}
                        onChange={(e) => setMovementAmount(parseFloat(e.target.value) || 0)}
                        required
                        className="rounded-xl font-bold text-sm"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-gray-700 mb-1">Payment Method *</label>
                        <select
                          value={movementPaymentMethod}
                          onChange={(e: any) => setMovementPaymentMethod(e.target.value)}
                          className="w-full border border-gray-200 rounded-xl p-2.5 bg-white text-xs"
                        >
                          <option value="cash">Cash</option>
                          <option value="upi">UPI / QR Code</option>
                          <option value="bank">Bank Transfer</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-gray-700 mb-1">Receipt / Ref # *</label>
                        <Input
                          placeholder="e.g. REC-1049 / UPI-ref"
                          value={movementPaymentRef}
                          onChange={(e) => setMovementPaymentRef(e.target.value)}
                          required
                          className="rounded-xl"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Movement Notes *</label>
                  <textarea
                    rows={2}
                    value={movementNotes}
                    onChange={(e) => setMovementNotes(e.target.value)}
                    required
                    minLength={5}
                    maxLength={500}
                    className="w-full border border-gray-200 rounded-xl p-2.5 bg-white text-xs"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setActiveModal(null)}
                    disabled={isSubmitting}
                    className="rounded-xl text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-navy hover:bg-navy/90 text-white rounded-xl text-xs font-bold"
                  >
                    {isSubmitting ? "Recording..." : "Confirm & Save Ledger Entry"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: PRODUCT CONTAINER CONFIG */}
        {activeModal === "product_config" && editingProduct && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="font-black text-navy text-base">Configure Container Settings</h3>
                <button onClick={() => setActiveModal(null)} className="text-gray-400 hover:text-gray-600">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleUpdateProduct} className="space-y-4 text-left text-xs">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Product</label>
                  <div className="bg-slate-50 border border-gray-200 p-2.5 rounded-xl font-bold text-navy">
                    {editingProduct.name}
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Container Volume (Litres) *</label>
                  <Input
                    type="number"
                    step="0.5"
                    min={0.1}
                    max={1000}
                    value={editVolume}
                    onChange={(e) => setEditVolume(parseFloat(e.target.value) || 20)}
                    required
                    className="rounded-xl font-bold"
                  />
                </div>

                <div className="flex items-center gap-3 p-3 bg-slate-50 border border-gray-150 rounded-xl">
                  <input
                    type="checkbox"
                    id="returnable_check"
                    checked={editReturnable}
                    onChange={(e) => setEditReturnable(e.target.checked)}
                    className="w-4 h-4 accent-blue-600 rounded"
                  />
                  <label htmlFor="returnable_check" className="font-bold text-gray-700 cursor-pointer">
                    Returnable Empty Can Asset
                  </label>
                </div>

                {editReturnable && (
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Security Deposit Amount (₹) *</label>
                    <Input
                      type="number"
                      step="1"
                      min={0}
                      value={editDeposit}
                      onChange={(e) => setEditDeposit(parseFloat(e.target.value) || 0)}
                      required
                      className="rounded-xl font-bold"
                    />
                    <p className="text-[11px] text-gray-400 mt-1">
                      Charged to customer when acquiring initial returnable water container.
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setActiveModal(null)}
                    disabled={isSubmitting}
                    className="rounded-xl text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold"
                  >
                    {isSubmitting ? "Saving..." : "Save Container Settings"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

