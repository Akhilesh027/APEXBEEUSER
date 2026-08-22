import React, { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { 
  ShieldCheck, 
  FileText, 
  RotateCcw, 
  Ban, 
  Building2, 
  Store, 
  Users,
  Clock, 
  Mail, 
  Phone, 
  MapPin,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Download,
  Award,
  IndianRupee,
  ShieldAlert,
  Lock,
  Scale,
  Percent,
  Layers,
  AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";

type PolicyTab = "privacy" | "partner" | "terms" | "returns" | "cancellation" | "franchise" | "vendor";

export const Legal: React.FC = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<PolicyTab>("privacy");

  useEffect(() => {
    const path = location.pathname.toLowerCase();
    if (path.includes("partner") || path.includes("business-partner") || path.includes("referral-terms")) {
      setActiveTab("partner");
    } else if (path.includes("privacy")) {
      setActiveTab("privacy");
    } else if (path.includes("terms")) {
      setActiveTab("terms");
    } else if (path.includes("return") || path.includes("refund")) {
      setActiveTab("returns");
    } else if (path.includes("cancellation")) {
      setActiveTab("cancellation");
    } else if (path.includes("franchise")) {
      setActiveTab("franchise");
    } else if (path.includes("vendor")) {
      setActiveTab("vendor");
    }
  }, [location.pathname]);

  const tabs: { id: PolicyTab; label: string; icon: any; route: string }[] = [
    { id: "privacy", label: "Privacy Policy", icon: ShieldCheck, route: "/privacy-policy" },
    { id: "partner", label: "Business Partner Terms & Privacy", icon: Users, route: "/business-partner-policy" },
    { id: "terms", label: "Terms of Service", icon: FileText, route: "/terms-conditions" },
    { id: "returns", label: "Return & Refund Policy", icon: RotateCcw, route: "/return-policy" },
    { id: "cancellation", label: "Cancellation Policy", icon: Ban, route: "/cancellation-policy" },
    { id: "franchise", label: "Franchise Partner Policy", icon: Building2, route: "/franchise-policy" },
    { id: "vendor", label: "Vendor & Merchant Policy", icon: Store, route: "/vendor-policy" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-amber-500 selection:text-white">
      <Navbar />

      {/* Header Banner */}
      <section className="bg-gradient-to-b from-amber-500/10 via-background to-background py-14 border-b border-border/40">
        <div className="container mx-auto px-4 max-w-4xl text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5" /> Legal, Trust & Compliance Center
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
            ApexBee Policies & <span className="bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">Terms of Governance</span>
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm max-w-xl mx-auto">
            Last Updated: August 2026. Compliant with the Digital Personal Data Protection Act (DPDPA 2023), Consumer Protection (Direct Selling & E-Commerce) Rules, and Indian Tax Guidelines.
          </p>
        </div>
      </section>

      {/* Main Content Layout */}
      <section className="container mx-auto px-4 py-12 max-w-5xl flex-1">
        <div className="grid lg:grid-cols-12 gap-8">
          {/* Navigation Sidebar */}
          <div className="lg:col-span-4 space-y-3">
            <div className="bg-card border border-border/80 p-3 rounded-2xl shadow-sm space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <Link
                    key={tab.id}
                    to={tab.route}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs transition ${
                      isActive
                        ? "bg-amber-500 text-white shadow-md shadow-amber-500/20"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{tab.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* Grievance Officer Card */}
            <div className="p-5 rounded-2xl bg-muted/40 border border-border space-y-3 text-xs">
              <h4 className="font-bold text-sm flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-500" /> Grievance Redressal
              </h4>
              <p className="text-muted-foreground">
                For regulatory, compliance, and Business Partner inquiries or grievances under Rule 3(2) of Information Technology (Intermediary Guidelines) Rules:
              </p>
              <div className="space-y-1 font-medium text-foreground">
                <div><strong>Officer:</strong> S. Ramakrishna Murthy</div>
                <div><strong>Email:</strong> grievance@apexbee.in</div>
                <div><strong>Address:</strong> ApexBee Tech Tower, HITEC City, Hyderabad, 500081</div>
                <div><strong>Response SLA:</strong> Within 48 hours</div>
              </div>
            </div>

            {/* Compliance Guarantee Card */}
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2 text-xs">
              <div className="flex items-center gap-2 font-bold text-amber-600 dark:text-amber-400">
                <Lock className="w-4 h-4" /> 100% Legal & Sales Driven
              </div>
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                ApexBee strictly operates as a product sales platform. No fees for registration. Zero payouts for recruitment. Full compliance with Indian Direct Selling and Consumer Protection Laws.
              </p>
            </div>
          </div>

          {/* Policy Document Body */}
          <div className="lg:col-span-8 bg-card border border-border/80 p-6 sm:p-10 rounded-3xl shadow-sm space-y-8 animate-fadeIn">
            
            {/* 1. Privacy Policy */}
            {activeTab === "privacy" && (
              <div className="space-y-6 text-sm text-foreground/90 leading-relaxed">
                <div className="border-b border-border/60 pb-4">
                  <h2 className="text-2xl font-bold">Privacy Policy</h2>
                  <p className="text-xs text-muted-foreground mt-1">Effective Date: 1st January 2026 | Version 3.2</p>
                </div>

                <div className="space-y-3">
                  <h3 className="text-base font-bold text-foreground">1. Introduction & Scope</h3>
                  <p className="text-muted-foreground">
                    ApexBee Solutions Private Limited ("ApexBee", "we", "us", or "our") values your trust. This Privacy Policy describes how we collect, store, process, transfer, and protect your personal information when you use our web platform, mobile applications, and partner portals across India.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="text-base font-bold text-foreground">2. Information We Collect</h3>
                  <ul className="list-disc pl-5 space-y-1.5 text-muted-foreground">
                    <li><strong>Personal Identity Data:</strong> Name, verified mobile phone number, email address, and delivery coordinates.</li>
                    <li><strong>Location Data:</strong> Real-time precise GPS coordinates (when authorized) to enable 15-minute grocery routing and technician dispatch.</li>
                    <li><strong>Payment & Transaction Information:</strong> UPI handles, transaction reference IDs, and wallet ledger balances (we never store card CVVs or net banking passwords).</li>
                    <li><strong>Merchant & Partner Documents:</strong> GSTIN, PAN, FSSAI licenses, Aadhaar verification for background checks.</li>
                    <li><strong>Business Partner & Referral Data:</strong> Downline sales records, referral links, earnings logs, verified bank account details, and PAN for tax reporting.</li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <h3 className="text-base font-bold text-foreground">3. How We Use Your Data</h3>
                  <p className="text-muted-foreground">
                    We use your data solely to fulfill orders, process payments, verify service professionals, calculate genuine sales commissions for Business Partners, dispatch delivery partners, prevent fraudulent transactions, and comply with statutory Indian laws.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="text-base font-bold text-foreground">4. Data Security & Retention</h3>
                  <p className="text-muted-foreground">
                    All user sessions are secured using 256-bit TLS encryption. Data stored in our database clusters are encrypted at rest. We adhere strictly to the Digital Personal Data Protection Act (DPDPA 2023).
                  </p>
                </div>

                {/* Privacy for Business Partners Subsection */}
                <div className="space-y-3 p-5 bg-muted/40 rounded-2xl border border-border">
                  <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-amber-500" />
                    5. Privacy Policy for ApexBee Business Partners (Independent Referral Partners)
                  </h3>
                  <div className="text-xs text-muted-foreground space-y-2 leading-relaxed">
                    <p>
                      <strong>KYC & Identity Data Processing:</strong> When registering as an ApexBee Business Partner, we collect and securely process your government-issued identity documents (Aadhaar, PAN, Bank Details) solely to verify legitimacy, prevent fraud, process wallet withdrawals, and issue mandatory statutory tax certificates (TDS / Form 16A).
                    </p>
                    <p>
                      <strong>Confidentiality of Network & Earnings:</strong> We maintain strict confidentiality of your commission ledger and network metrics. We never sell or share Business Partner personal data with third-party advertisers.
                    </p>
                    <p>
                      <strong>Partner Obligations:</strong> Business Partners must respect customer and downline member privacy. Harvesting contact details, unsolicited mass communications, or sharing customer data without consent is strictly prohibited and results in immediate account forfeiture.
                    </p>
                  </div>
                  <div className="pt-2">
                    <Link
                      to="/business-partner-policy"
                      onClick={() => setActiveTab("partner")}
                      className="text-xs font-bold text-amber-500 hover:text-amber-600 inline-flex items-center gap-1"
                    >
                      View Complete ApexBee Business Partner Terms & Agreement →
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* 2. Business Partner Policy (Complete 18 Terms & Conditions) */}
            {activeTab === "partner" && (
              <div className="space-y-8 text-sm text-foreground/90 leading-relaxed">
                <div className="border-b border-border/60 pb-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-xs mb-2">
                    <Users className="w-3.5 h-3.5" /> Independent Referral Partner Agreement
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground">
                    ApexBee Business Partner Terms & Privacy Policy
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    ApexBee Business Partner (Independent Referral Partner) | Effective Date: August 2026
                  </p>
                </div>

                {/* Banner Callout */}
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
                  <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <div className="text-xs space-y-1">
                    <div className="font-bold text-foreground">Sales-Driven Ecosystem & Zero Pay-For-Recruitment</div>
                    <div className="text-muted-foreground">
                      ApexBee operates strictly on genuine product and service sales. No commissions are paid merely for recruitment. Joining the referral program is completely free with no mandatory product purchase.
                    </div>
                  </div>
                </div>

                {/* 1. Business Partner Nature */}
                <div className="space-y-3">
                  <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-500 text-xs font-bold flex items-center justify-center">1</span>
                    Business Partner Nature
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    An ApexBee Business Partner is an independent participant who may refer genuine customers/users/business opportunities to ApexBee and may become eligible for referral-based incentives according to the applicable ApexBee Business Partner Terms. The Business Partner:
                  </p>
                  <ul className="space-y-1.5 text-xs text-muted-foreground pl-2">
                    <li className="flex items-start gap-2">
                      <span className="text-amber-500 font-bold">●</span> Is not an employee of ApexBee.
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-500 font-bold">●</span> Is not a franchisee unless separately appointed under a franchise agreement.
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-500 font-bold">●</span> Is not authorized to make commitments on behalf of ApexBee.
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-500 font-bold">●</span> Is not entitled to a fixed salary.
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-500 font-bold">●</span> Does not receive guaranteed income.
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-500 font-bold">●</span> Earns incentives only when applicable qualification conditions are satisfied.
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-500 font-bold">●</span> Must comply with KYC, applicable laws, ApexBee policies and the Business Partner Agreement.
                    </li>
                  </ul>
                </div>

                {/* 2 & 3: Introduction & Eligibility */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-muted/40 border border-border space-y-2">
                    <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-500 text-xs font-bold flex items-center justify-center">2</span>
                      Introduction
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      By participating in the ApexBee.in "Refer & Earn" program, you agree to abide by these Terms & Conditions. ApexBee reserves the right to modify, suspend, or terminate this program at any time without prior notice.
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-muted/40 border border-border space-y-2">
                    <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-500 text-xs font-bold flex items-center justify-center">3</span>
                      Eligibility
                    </h3>
                    <ul className="text-xs text-muted-foreground space-y-1.5">
                      <li className="flex items-start gap-1.5">
                        <span className="text-amber-500 font-bold">●</span> Participation in the referral program is completely free of charge. No entry fee, registration fee, or mandatory product purchase is required to join or register as a referrer.
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="text-amber-500 font-bold">●</span> Users must have a registered and active account on ApexBee.in to generate referral links and earn incentives.
                      </li>
                    </ul>
                  </div>
                </div>

                {/* 4. No Pay-for-Recruitment Rule */}
                <div className="p-5 rounded-2xl bg-red-500/5 border border-red-500/20 space-y-3">
                  <h3 className="text-base font-bold text-red-600 dark:text-red-400 flex items-center gap-2">
                    <Ban className="w-4 h-4" />
                    4. No Pay-for-Recruitment Rule (Strict Anti-Chain/Pyramid Policy)
                  </h3>
                  <div className="space-y-2 text-xs text-muted-foreground leading-relaxed">
                    <p>
                      <strong>Strictly Product-Based Commissions:</strong> ApexBee operates strictly on genuine product and service sales. No commission, bonus, or financial incentive is paid merely for recruiting, sponsoring, or adding new members to the referral network.
                    </p>
                    <p>
                      <strong>Sales-Driven Incentives:</strong> All direct referral bonuses, level commissions, and leadership milestone rewards are exclusively tied to actual, verified product purchases and platform business generated by you or your network.
                    </p>
                    <p>
                      <strong>Prohibition of Chain/Pyramid Schemes:</strong> Participants are explicitly prohibited from treating or promoting the platform as a money-circulation scheme, get-rich-quick program, or chain recruitment system. Any representation of the platform that guarantees earnings solely based on joining numbers is a direct violation of terms.
                    </p>
                    <p>
                      <strong>Enforcement and Penalties:</strong> If any user is found promoting the platform by emphasizing recruitment over product utility or attempting to profit from sign-ups alone, their account will be immediately suspended and all pending incentives will be forfeited.
                    </p>
                  </div>
                </div>

                {/* 5. Referral Incentive Structure */}
                <div className="space-y-4">
                  <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-500 text-xs font-bold flex items-center justify-center">5</span>
                    Referral Incentive Structure (Approximate / Indicative Slabs)
                  </h3>
                  <div className="space-y-3 text-xs text-muted-foreground">
                    <p>
                      <strong>Direct Referrals:</strong> Earners may receive an indicative direct referral bonus (as dynamically updated and specified in their dashboard for qualifying campaigns) when their referred user successfully completes qualifying actions on the platform.
                    </p>
                    <p>
                      <strong>Level Commission (Downline Product Sales):</strong> Incentives are strictly generated from verified, actual product purchases made by your network up to 3 Levels deep. Commissions are variable and calculated as an approximate percentage of the company’s net profit margin derived from qualifying product sales:
                    </p>
                    
                    <div className="grid sm:grid-cols-3 gap-3 pt-1">
                      <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center space-y-1">
                        <div className="text-xs font-bold text-amber-600 dark:text-amber-400">Level 1 (Direct Referrals)</div>
                        <div className="text-xl font-extrabold text-foreground">Approx. ~10%</div>
                        <div className="text-[11px] text-muted-foreground">of net company profit margin*</div>
                      </div>
                      <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center space-y-1">
                        <div className="text-xs font-bold text-amber-600 dark:text-amber-400">Level 2 (Indirect)</div>
                        <div className="text-xl font-extrabold text-foreground">Approx. ~5%</div>
                        <div className="text-[11px] text-muted-foreground">of net company profit margin*</div>
                      </div>
                      <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center space-y-1">
                        <div className="text-xs font-bold text-amber-600 dark:text-amber-400">Level 3 (Tier 3)</div>
                        <div className="text-xl font-extrabold text-foreground">Approx. ~2.5%</div>
                        <div className="text-[11px] text-muted-foreground">of net company profit margin*</div>
                      </div>
                    </div>

                    {/* Important Note Box */}
                    <div className="p-3.5 rounded-xl bg-muted/60 border border-border/80 space-y-1.5 text-[11px]">
                      <div className="font-bold text-foreground flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                        Important Note on Commission Percentages (No Guaranteed Promise):
                      </div>
                      <p className="text-muted-foreground leading-relaxed">
                        The figures indicated above (approx. ~10%, ~5%, ~2.5%) are <strong>indicative benchmark estimates</strong> and do <strong>NOT</strong> constitute a fixed, guaranteed, or promised return. The actual commission percentage varies dynamically depending on the product category, vendor margins, wholesale discounts, operational overheads, and prevailing company profit slabs for each individual transaction.
                      </p>
                      <p className="text-muted-foreground">
                        ● <strong>No Commission on Recruitment:</strong> No commission or financial incentive is paid merely for adding or recruiting new members. Incentives are strictly tied to genuine product sales and platform revenue.
                      </p>
                    </div>
                  </div>
                </div>

                {/* 6. Leadership Milestone & Badge Rewards Program */}
                <div className="space-y-4">
                  <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                    <Award className="w-5 h-5 text-amber-500" />
                    6. Leadership Milestone & Badge Rewards Program
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-4 rounded-2xl bg-muted/40 border border-border space-y-1.5">
                      <div className="flex items-center justify-between font-bold text-foreground">
                        <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                          🥉 Bronze Badge
                        </span>
                        <span className="px-2 py-0.5 bg-amber-500/20 rounded font-bold text-amber-500">₹500 Reward</span>
                      </div>
                      <p className="text-muted-foreground text-[11px]">
                        Awarded when a referrer successfully introduces 10 direct members who complete their KYC and their qualifying first purchase.
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-muted/40 border border-border space-y-1.5">
                      <div className="flex items-center justify-between font-bold text-foreground">
                        <span className="flex items-center gap-1.5 text-slate-400">
                          🥈 Silver Badge
                        </span>
                        <span className="px-2 py-0.5 bg-slate-500/20 rounded font-bold text-slate-300">₹2,500 Reward</span>
                      </div>
                      <p className="text-muted-foreground text-[11px]">
                        Awarded when all 10 direct Level-1 members independently achieve the Bronze status.
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-muted/40 border border-border space-y-1.5">
                      <div className="flex items-center justify-between font-bold text-foreground">
                        <span className="flex items-center gap-1.5 text-amber-400 font-bold">
                          🥇 Gold Badge
                        </span>
                        <span className="px-2 py-0.5 bg-amber-500/20 rounded font-bold text-amber-400">₹20,000 Reward</span>
                      </div>
                      <p className="text-muted-foreground text-[11px]">
                        Awarded when all 10 direct Level-1 members subsequently achieve the Silver status.
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-muted/40 border border-border space-y-1.5">
                      <div className="flex items-center justify-between font-bold text-foreground">
                        <span className="flex items-center gap-1.5 text-cyan-400 font-bold">
                          💎 Diamond Badge
                        </span>
                        <span className="px-2 py-0.5 bg-cyan-500/20 rounded font-bold text-cyan-400">₹1,00,000 Reward</span>
                      </div>
                      <p className="text-muted-foreground text-[11px]">
                        Awarded when all 10 direct Level-1 members subsequently achieve the Gold status.
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    <strong>Conditions:</strong> All milestone rewards are subject to verification of genuine network activity, compliance with platform ethics, and applicable TDS/tax deductions at the time of payout. ApexBee reserves the right to audit network transactions before crediting milestone rewards.
                  </p>
                </div>

                {/* 7 & 8: Daily Commission Processing & Credit Return Period */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-muted/40 border border-border space-y-2">
                    <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-500 text-xs font-bold flex items-center justify-center">7</span>
                      Daily Commission Processing & Payouts
                    </h3>
                    <div className="text-xs text-muted-foreground space-y-1.5">
                      <p>● <strong>Automated Calculation:</strong> Level commissions, referral bonuses, and milestone rewards are systematically calculated and processed on a daily basis, subject to successful order fulfillment and completion of the mandatory return/refund period.</p>
                      <p>● <strong>Wallet Credit:</strong> All verified and cleared earnings will be credited automatically to the user's active ApexBee wallet, from which withdrawal requests can be initiated.</p>
                      <p>● <strong>Processing Timelines:</strong> While commission calculations occur daily, actual fund transfers or withdrawals are subject to standard bank processing times, payment gateway availability, and internal verification checks.</p>
                      <p>● <strong>Minimum Withdrawal Limit:</strong> Withdrawals are subject to a minimum threshold limit as specified in the user dashboard. Requests below the minimum limit will remain in the wallet until the threshold is met.</p>
                      <p>● <strong>Right to Hold or Delay:</strong> ApexBee reserves the right to temporarily hold, pause, or delay daily commission processing and payouts in the event of technical maintenance, system audits, suspected fraudulent activities, or pending KYC/tax verification.</p>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-muted/40 border border-border space-y-2">
                    <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-500 text-xs font-bold flex items-center justify-center">8</span>
                      Credit & Return Period Policy
                    </h3>
                    <div className="text-xs text-muted-foreground space-y-1.5">
                      <p>● All referral incentives and level commissions will remain in a <strong>"Hold"</strong> status initially.</p>
                      <p>● The earned commission will be officially credited to the user's available wallet balance only after the applicable product return/refund period for the purchased item has successfully expired.</p>
                      <p>● If an order is returned or canceled, the corresponding commission will be revoked.</p>
                    </div>
                  </div>
                </div>

                {/* 9. KYC & Identity Verification Requirements */}
                <div className="space-y-3">
                  <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-500" />
                    9. KYC & Identity Verification Requirements
                  </h3>
                  <div className="space-y-2 text-xs text-muted-foreground">
                    <p>● <strong>Mandatory Verification:</strong> To ensure platform security, prevent fraud, and comply with financial regulations, users may be required to complete a formal Know Your Customer (KYC) verification process.</p>
                    <p>● <strong>Required Documents:</strong> Users must submit valid government-issued identity and address proof documents (such as Aadhaar Card, PAN Card, Voter ID, or Driving Licence) along with active bank account details for payouts.</p>
                    <p>● <strong>Prerequisite for Payouts & Rewards:</strong> Completion of KYC is mandatory for processing withdrawals, claiming leadership milestone rewards (such as Bronze, Silver, Gold, and Diamond badges/cash bonuses), or unlocking higher-level network benefits.</p>
                    <p>● <strong>Accuracy of Information:</strong> Users are solely responsible for providing accurate and up-to-date personal and banking information. ApexBee reserves the right to withhold, pause, or cancel commission payouts and milestone rewards if discrepancies, fake details, or mismatched documents are identified during verification.</p>
                    <p>● <strong>Periodic Re-Verification:</strong> ApexBee reserves the right to request re-verification of KYC documents at any time to ensure ongoing compliance and secure platform operations.</p>
                  </div>
                </div>

                {/* 10 & 11. Deductions, Withdrawals & Taxation */}
                <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-3">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Percent className="w-4 h-4 text-amber-500" />
                    10 & 11. Deductions, Withdrawals & Taxation Compliance
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-3 text-xs text-muted-foreground">
                    <div className="space-y-1.5">
                      <div className="font-bold text-foreground">10. Deductions & Withdrawals (15%)</div>
                      <p>Users can request withdrawals of their available wallet balance through the designated platform options. All withdrawals are subject to applicable deductions, including TDS (Tax Deducted at Source) and Platform Fees (totaling 15%, or as per prevailing government and platform policies).</p>
                    </div>
                    <div className="space-y-1.5">
                      <div className="font-bold text-foreground">11. Taxation & Financial Compliance</div>
                      <p>All earnings, referral bonuses, and commissions are subject to tax deductions (such as TDS and applicable platform fees) as per the prevailing laws of the Income Tax Act of India. Participants are solely responsible for reporting and paying statutory dues. ApexBee issues standard Form 16A certificates where applicable.</p>
                    </div>
                  </div>
                </div>

                {/* 12. Promotion & Marketing Eligibility Guidelines */}
                <div className="space-y-3">
                  <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-500 text-xs font-bold flex items-center justify-center">12</span>
                    Promotion & Marketing Eligibility Guidelines
                  </h3>
                  <div className="space-y-2 text-xs text-muted-foreground">
                    <p>● <strong>Authorized Platforms:</strong> Participants are permitted to promote their referral links and ApexBee products through legitimate personal channels, blogs, social media, and direct messaging, provided they strictly follow ethical marketing standards.</p>
                    <p>● <strong>Prohibited Promotional Channels:</strong> Promotion through unauthorized, deceptive, or harmful methods is strictly prohibited. This includes, but is not limited to:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Running paid search ads (e.g., Google Ads, Bing Ads) bidding on brand-specific keywords such as "ApexBee", "ApexBee.in", or misspelled variations thereof.</li>
                      <li>Using misleading landing pages, fake discount offers, or impersonating official ApexBee communications to trick users into clicking referral links.</li>
                      <li>Sending unsolicited bulk emails, spamming public forums, or posting links on unrelated third-party platforms.</li>
                    </ul>
                    <p>● <strong>Compliance & Consequences:</strong> All promotional content must accurately reflect the platform. Failure to comply will result in immediate disqualification, permanent account suspension, and total forfeiture of accumulated commissions or milestone rewards.</p>
                  </div>
                </div>

                {/* 13. No Guaranteed Income & Earnings Disclaimer */}
                <div className="p-4 rounded-2xl bg-muted/50 border border-border space-y-3">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    13. No Guaranteed Income & Earnings Disclaimer
                  </h3>
                  <div className="space-y-2 text-xs text-muted-foreground">
                    <p>● <strong>No Promise of Earnings:</strong> Participation in the ApexBee.in Refer & Earn program does not constitute a job, employment, or any form of guaranteed financial return. ApexBee makes no promises, guarantees, or representations regarding any specific level of income or earnings.</p>
                    <p>● <strong>Performance-Based Rewards:</strong> All incentives, bonuses, and level commissions depend entirely on your individual marketing efforts, network activity, and the actual product purchases made by your network. If no sales occur, no commission will be generated.</p>
                    <p>● <strong>Variable and Fluctuating Income:</strong> Earnings are completely variable. Your income may fluctuate from time to time or may even be zero, depending on market conditions, customer demand, and network participation.</p>
                    <p>● <strong>Independent Activity:</strong> Participants act as independent referrers/affiliates and not as employees, agents, or legal representatives of ApexBee. You are solely responsible for your own time, effort, and promotional methods.</p>
                    <p>● <strong>Right to Modify or Discontinue:</strong> ApexBee reserves the right to alter, modify, reduce, or completely discontinue the referral incentive percentages, reward structures, or the program itself at any time without prior notice.</p>
                    <p>● <strong>No False Claims & Anti-Spam:</strong> Exaggerated promises of guaranteed earnings, unsolicited mass messaging on WhatsApp/SMS/Email, and brand misrepresentation are strictly prohibited.</p>
                  </div>
                </div>

                {/* 14 & 15. Prohibited Activities & Account Suspension */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-muted/40 border border-border space-y-2">
                    <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-500 text-xs font-bold flex items-center justify-center">14</span>
                      Fraudulent & Prohibited Activities
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      ApexBee strictly prohibits self-referrals, creation of multiple/fake accounts, spamming referral links, or any deceptive marketing practices. If detected, ApexBee reserves the right to forfeit earnings, freeze the wallet, and terminate the user account permanently.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-muted/40 border border-border space-y-2">
                    <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-500 text-xs font-bold flex items-center justify-center">15</span>
                      Account Suspension & Termination Policy
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Grounds for suspension include terms violations, fraudulent bot manipulation, spamming, exaggerated income claims, or suspicious transactions. Violations result in immediate account termination and permanent forfeiture of wallet balances. ApexBee maintains full right to audit.
                    </p>
                  </div>
                </div>

                {/* 16. Confidentiality & Data Protection */}
                <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-2">
                  <h3 className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    16. Confidentiality & Data Protection (Business Partner Privacy Policy)
                  </h3>
                  <div className="space-y-1.5 text-xs text-muted-foreground">
                    <p>● <strong>Protection of User Data:</strong> ApexBee is committed to protecting the privacy and personal data of all participants in accordance with applicable data privacy laws (DPDPA 2023).</p>
                    <p>● <strong>Non-Disclosure of Business Information:</strong> Participants agree to keep all proprietary network data, commission algorithms, and operational analytics strictly confidential.</p>
                    <p>● <strong>Data Usage Consent:</strong> By participating, users grant ApexBee permission to use account details and performance metrics solely for calculating commissions and managing rewards.</p>
                    <p>● <strong>No Unauthorized Sharing:</strong> Participants are strictly prohibited from sharing user databases, lead lists, or network member contact details with third parties.</p>
                  </div>
                </div>

                {/* 17 & 18. Dispute Resolution & Governing Law */}
                <div className="p-4 rounded-2xl bg-muted/40 border border-border space-y-2">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Scale className="w-4 h-4 text-amber-500" />
                    17 & 18. Dispute Resolution & Governing Law
                  </h3>
                  <div className="space-y-1.5 text-xs text-muted-foreground">
                    <p>● <strong>Amicable Resolution:</strong> Parties agree to first attempt resolving any dispute amicably through direct communication with ApexBee customer support.</p>
                    <p>● <strong>Arbitration / Jurisdiction:</strong> If unresolved, disputes are subject to the exclusive jurisdiction of the local courts located within the registered operational jurisdiction of ApexBee, India.</p>
                    <p>● <strong>Governing Law:</strong> These terms shall be governed by and construed in accordance with the laws of India.</p>
                  </div>
                </div>
              </div>
            )}

            {/* 3. Terms of Service */}
            {activeTab === "terms" && (
              <div className="space-y-6 text-sm text-foreground/90 leading-relaxed">
                <div className="border-b border-border/60 pb-4">
                  <h2 className="text-2xl font-bold">Terms of Service & User Agreement</h2>
                  <p className="text-xs text-muted-foreground mt-1">Effective Date: 1st January 2026 | Version 2.8</p>
                </div>

                <div className="space-y-3">
                  <h3 className="text-base font-bold text-foreground">1. Acceptance of Terms</h3>
                  <p className="text-muted-foreground">
                    By downloading, browsing, or placing an order on ApexBee, you agree to be bound by these Terms and Conditions. If you do not agree, please discontinue using the platform.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="text-base font-bold text-foreground">2. Marketplace Platform Intermediary</h3>
                  <p className="text-muted-foreground">
                    ApexBee operates as an electronic intermediary platform connecting independent buyers with third-party vendors, local grocery kirana merchants, restaurants, verified technicians, travel operators, and course creators.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="text-base font-bold text-foreground">3. User Account & Security</h3>
                  <p className="text-muted-foreground">
                    You are responsible for maintaining the confidentiality of your account OTPs, passwords, and wallet credentials. Any action initiated under your authenticated credentials is deemed authorized by you.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="text-base font-bold text-foreground">4. Prohibited Conduct</h3>
                  <p className="text-muted-foreground">
                    Users must not exploit referral loops, abuse cancellation privileges, submit fraudulent chargeback claims, or engage in abusive conduct toward delivery riders and service professionals.
                  </p>
                </div>
              </div>
            )}

            {/* 4. Return & Refund Policy */}
            {activeTab === "returns" && (
              <div className="space-y-6 text-sm text-foreground/90 leading-relaxed">
                <div className="border-b border-border/60 pb-4">
                  <h2 className="text-2xl font-bold">Return & Refund Policy</h2>
                  <p className="text-xs text-muted-foreground mt-1">Standard 7-Day Hassle-Free Policy</p>
                </div>

                <div className="space-y-3">
                  <h3 className="text-base font-bold text-foreground">1. 7-Day Return Window</h3>
                  <p className="text-muted-foreground">
                    Physical products across Fashion, Sarees, Jewelry, Electronics, and Home Decor can be returned within 7 calendar days of delivery if they are unworn, undamaged, and with original brand tags and packaging intact.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="text-base font-bold text-foreground">2. Non-Returnable Items</h3>
                  <ul className="list-disc pl-5 space-y-1.5 text-muted-foreground">
                    <li>Perishable groceries, dairy, and freshly prepared hot restaurant foods once delivered.</li>
                    <li>Intimate apparel, innerwear, and cosmetics once opened.</li>
                    <li>Digital courses and certifications once 25% or more content is completed.</li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <h3 className="text-base font-bold text-foreground">3. Refund Settlement Timelines</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left border border-border rounded-xl">
                      <thead className="bg-muted font-bold">
                        <tr>
                          <th className="p-2.5 border-b border-border">Refund Destination</th>
                          <th className="p-2.5 border-b border-border">Credit Timeline</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60 text-muted-foreground">
                        <tr>
                          <td className="p-2.5 font-semibold text-foreground">ApexBee Wallet</td>
                          <td className="p-2.5 text-emerald-500 font-bold">Instant (Within 5 mins of pickup)</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-semibold text-foreground">UPI / Google Pay / PhonePe</td>
                          <td className="p-2.5">24 to 48 Hours</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-semibold text-foreground">Credit / Debit Cards & Net Banking</td>
                          <td className="p-2.5">3 to 5 Business Days</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* 5. Cancellation Policy */}
            {activeTab === "cancellation" && (
              <div className="space-y-6 text-sm text-foreground/90 leading-relaxed">
                <div className="border-b border-border/60 pb-4">
                  <h2 className="text-2xl font-bold">Order & Booking Cancellation Policy</h2>
                  <p className="text-xs text-muted-foreground mt-1">Clear cancellation timelines across all verticals</p>
                </div>

                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-muted/40 border border-border space-y-1.5">
                    <h4 className="font-bold text-foreground">🛍 Marketplace E-Commerce Orders</h4>
                    <p className="text-xs text-muted-foreground">
                      Free cancellation before the merchant has packed and dispatched the parcel. 100% refund is initiated automatically.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-muted/40 border border-border space-y-1.5">
                    <h4 className="font-bold text-foreground">⚡ Express Food & Grocery Orders</h4>
                    <p className="text-xs text-muted-foreground">
                      Cancellations are allowed within 60 seconds of order placement. Once the restaurant begins kitchen preparation or grocery packaging starts, cancellations cannot be accepted.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-muted/40 border border-border space-y-1.5">
                    <h4 className="font-bold text-foreground">🔧 Home & Appliance Services</h4>
                    <p className="text-xs text-muted-foreground">
                      Free cancellation up to 2 hours before scheduled technician appointment. If cancelled after technician has arrived on-site, a minimal ₹99 visitation fee applies.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-muted/40 border border-border space-y-1.5">
                    <h4 className="font-bold text-foreground">✈ Holiday & Travel Tours</h4>
                    <p className="text-xs text-muted-foreground">
                      Cancellations made 7+ days before departure receive 90% refund. Cancellations made 3-7 days prior receive 50% refund. VIP Darshan passes are non-transferable and non-refundable per temple devasthanam rules.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 6. Franchise Policy */}
            {activeTab === "franchise" && (
              <div className="space-y-6 text-sm text-foreground/90 leading-relaxed">
                <div className="border-b border-border/60 pb-4">
                  <h2 className="text-2xl font-bold">Franchise Partner Agreement & Code of Ethics</h2>
                  <p className="text-xs text-muted-foreground mt-1">For State, District, and Mandal Franchise Operators</p>
                </div>

                <div className="space-y-3">
                  <h3 className="text-base font-bold text-foreground">1. Territorial Exclusivity</h3>
                  <p className="text-muted-foreground">
                    ApexBee grants geographic territorial exclusivity to approved Mandal and District franchise partners based on defined pin code boundaries.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="text-base font-bold text-foreground">2. Revenue Sharing & Settlement Schedule</h3>
                  <p className="text-muted-foreground">
                    Franchise commissions from local grocery merchant volume, restaurant deliveries, and technician bookings are calculated daily and settled via automated NEFT / IMPS every Monday.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="text-base font-bold text-foreground">3. Quality Audit & Compliance</h3>
                  <p className="text-muted-foreground">
                    Franchise partners must maintain an average customer satisfaction score of 4.2+ stars and conduct mandatory periodic hygiene checks on onboarded food kitchens.
                  </p>
                </div>
              </div>
            )}

            {/* 7. Vendor Policy */}
            {activeTab === "vendor" && (
              <div className="space-y-6 text-sm text-foreground/90 leading-relaxed">
                <div className="border-b border-border/60 pb-4">
                  <h2 className="text-2xl font-bold">Vendor & Merchant Operating Standards</h2>
                  <p className="text-xs text-muted-foreground mt-1">Rules for Sellers, Manufacturers, and Wholesalers</p>
                </div>

                <div className="space-y-3">
                  <h3 className="text-base font-bold text-foreground">1. 100% Genuine & Authentic Goods</h3>
                  <p className="text-muted-foreground">
                    Counterfeit, fake, or trademark-infringing goods will result in immediate permanent delisting, forfeiture of pending payout balances, and legal prosecution under Indian IP laws.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="text-base font-bold text-foreground">2. Dispatch & Packaging SLA</h3>
                  <p className="text-muted-foreground">
                    Marketplace sellers must package and mark orders ready for pickup within 24 hours of order receipt. Local grocery kiranas must hand over bags within 3-5 minutes of rider arrival.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="text-base font-bold text-foreground">3. Transparent Pricing & Zero Price Gouging</h3>
                  <p className="text-muted-foreground">
                    Prices listed on ApexBee must not exceed the physical Maximum Retail Price (MRP) stamped on product packaging.
                  </p>
                </div>
              </div>
            )}

          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Legal;
