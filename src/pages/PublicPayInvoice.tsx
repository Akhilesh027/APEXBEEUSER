import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  CreditCard,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Building2,
  Store,
  AlertCircle,
  RefreshCw,
  QrCode,
  Lock,
  ArrowRight,
  Download
} from "lucide-react";

interface InvoiceData {
  _id: string;
  invoiceNumber: string;
  recipientName: string;
  recipientRole: string;
  recipientBusinessName?: string;
  recipientEmail?: string;
  recipientPhone?: string;
  serviceKey: string;
  title: string;
  description?: string;
  baseAmount: number;
  taxAmount: number;
  totalAmount: number;
  status: "pending" | "paid" | "cancelled" | "expired";
  paidAt?: string;
  createdAt: string;
  notes?: string;
}

export const PublicPayInvoice: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [paymentSuccess, setPaymentSuccess] = useState<boolean>(false);
  const [selectedMethod, setSelectedMethod] = useState<string>("UPI");

  const API_BASE = "https://server.apexbee.in/api";

  const fetchInvoice = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_BASE}/fee-pricing/public/invoice/${token}`);
      const data = await res.json();
      if (data.success && data.data) {
        setInvoice(data.data);
        if (data.data.status === "paid") {
          setPaymentSuccess(true);
        }
      } else {
        setError(data.message || "Invalid or expired payment link.");
      }
    } catch (err) {
      setError("Unable to connect to payment server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchInvoice();
    }
  }, [token]);

  const handlePayNow = async () => {
    if (!invoice) return;

    try {
      setIsProcessing(true);
      const res = await fetch(`${API_BASE}/fee-pricing/public/pay`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          paymentMethod: selectedMethod,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setPaymentSuccess(true);
        setInvoice((prev) => (prev ? { ...prev, status: "paid", paidAt: new Date().toISOString() } : null));
      } else {
        alert(data.message || "Payment processing failed. Please retry.");
      }
    } catch (err) {
      alert("Network error while completing payment.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-white">
        <RefreshCw className="w-10 h-10 text-amber-400 animate-spin mb-4" />
        <p className="text-sm text-slate-400 font-medium">Securing payment connection...</p>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-white">
        <div className="max-w-md w-full p-8 rounded-3xl bg-slate-900 border border-white/10 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold">Payment Link Unavailable</h2>
          <p className="text-xs text-slate-400">{error || "This invoice does not exist or has expired."}</p>
          <button
            onClick={() => navigate("/")}
            className="w-full py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-xl transition"
          >
            Return to Apexbee Homepage
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-6 lg:p-12 font-sans">
      <div className="max-w-4xl w-full mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center font-black text-black text-xl shadow-lg shadow-amber-500/30">
              A
            </div>
            <div>
              <span className="text-lg font-extrabold tracking-tight text-white">Apexbee Secure Checkout</span>
              <p className="text-[10px] text-slate-400">Official Merchant & Franchise Partner Network</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
            <Lock className="w-3.5 h-3.5" /> 256-bit Encrypted
          </div>
        </div>

        {/* Success State Screen */}
        {paymentSuccess ? (
          <div className="p-8 sm:p-12 rounded-3xl bg-slate-900/80 border border-emerald-500/30 backdrop-blur-xl text-center space-y-6 animate-scaleIn shadow-2xl shadow-emerald-500/10">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                Payment Successful & Settled
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                ₹{invoice.totalAmount.toLocaleString("en-IN")} Paid Successfully
              </h2>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Thank you, <strong>{invoice.recipientName}</strong>. Your license/services for "{invoice.title}" are now active.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-black/40 border border-white/10 max-w-sm mx-auto text-left text-xs space-y-2">
              <div className="flex justify-between"><span className="text-slate-400">Invoice Number:</span><span className="font-mono text-amber-400 font-bold">{invoice.invoiceNumber}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Paid On:</span><span className="text-white">{new Date().toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Method:</span><span className="text-white">{selectedMethod}</span></div>
            </div>

            <div className="flex items-center justify-center gap-3 pt-4">
              <button
                onClick={() => window.print()}
                className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-xl transition flex items-center gap-2"
              >
                <Download className="w-4 h-4" /> Download / Print Receipt
              </button>
            </div>
          </div>
        ) : (
          /* Payment Processing Layout */
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Left: Invoice Summary */}
            <div className="lg:col-span-3 rounded-3xl bg-slate-900/60 border border-white/10 p-6 sm:p-8 space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs text-amber-400 font-bold">{invoice.invoiceNumber}</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/30">
                    Payment Pending
                  </span>
                </div>
                <h2 className="text-2xl font-extrabold text-white">{invoice.title}</h2>
                {invoice.description && <p className="text-xs text-slate-400 mt-1">{invoice.description}</p>}
              </div>

              {/* Recipient Details */}
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2 text-xs">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Bill To</div>
                <div className="font-bold text-white text-sm">{invoice.recipientName}</div>
                {invoice.recipientBusinessName && <div className="text-slate-300">{invoice.recipientBusinessName}</div>}
                <div className="text-slate-400">{invoice.recipientPhone || invoice.recipientEmail}</div>
              </div>

              {/* Price Breakdown */}
              <div className="space-y-3 border-t border-white/10 pt-4 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Base Service Fee:</span>
                  <span className="text-white font-medium">₹{invoice.baseAmount.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Applicable GST / Taxes:</span>
                  <span className="text-white font-medium">₹{invoice.taxAmount.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-sm font-extrabold text-white border-t border-white/10 pt-3">
                  <span>Total Amount Payable:</span>
                  <span className="text-amber-400 text-lg">₹{invoice.totalAmount.toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>

            {/* Right: Payment Method Selector */}
            <div className="lg:col-span-2 rounded-3xl bg-slate-900/90 border border-amber-500/30 p-6 sm:p-8 flex flex-col justify-between space-y-6 shadow-2xl shadow-amber-500/5">
              <div className="space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-amber-400" />
                  Select Payment Method
                </h3>

                <div className="space-y-2.5">
                  {[
                    { id: "UPI", label: "Instant UPI / QR Code", desc: "GooglePay, PhonePe, Paytm" },
                    { id: "Card", label: "Debit / Credit Card", desc: "Visa, MasterCard, RuPay" },
                    { id: "NetBanking", label: "NetBanking", desc: "All major Indian banks" },
                  ].map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setSelectedMethod(m.id)}
                      className={`w-full p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between ${selectedMethod === m.id
                        ? "bg-amber-500/10 border-amber-500 text-white shadow-inner"
                        : "bg-white/[0.02] border-white/10 text-slate-400 hover:border-white/20"
                        }`}
                    >
                      <div>
                        <div className="text-xs font-bold text-white">{m.label}</div>
                        <div className="text-[10px] text-slate-400">{m.desc}</div>
                      </div>
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectedMethod === m.id ? "border-amber-500 bg-amber-500" : "border-slate-600"
                          }`}
                      >
                        {selectedMethod === m.id && <div className="w-1.5 h-1.5 rounded-full bg-black" />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handlePayNow}
                  disabled={isProcessing}
                  className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-extrabold text-sm rounded-2xl shadow-xl shadow-amber-500/25 transition-all flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Pay ₹{invoice.totalAmount.toLocaleString("en-IN")} <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <p className="text-[10px] text-center text-slate-500">
                  By clicking Pay, you agree to Apexbee platform terms of license and partner settlement.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicPayInvoice;
