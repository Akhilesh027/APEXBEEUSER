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
  Clock, 
  Mail, 
  Phone, 
  MapPin,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Download
} from "lucide-react";
import { Button } from "@/components/ui/button";

type PolicyTab = "privacy" | "terms" | "returns" | "cancellation" | "franchise" | "vendor";

export const Legal: React.FC = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<PolicyTab>("privacy");

  useEffect(() => {
    const path = location.pathname.toLowerCase();
    if (path.includes("privacy")) {
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
            Last Updated: August 2026. Compliant with the Digital Personal Data Protection Act (DPDPA 2023) and Consumer Protection (E-Commerce) Rules 2020.
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
                For regulatory and compliance grievances under Rule 3(2) of the Information Technology (Intermediary Guidelines) Rules:
              </p>
              <div className="space-y-1 font-medium text-foreground">
                <div><strong>Officer:</strong> S. Ramakrishna Murthy</div>
                <div><strong>Email:</strong> grievance@apexbee.in</div>
                <div><strong>Address:</strong> ApexBee Tech Tower, HITEC City, Hyderabad, 500081</div>
                <div><strong>Response SLA:</strong> Within 48 hours</div>
              </div>
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
                  </ul>
                </div>

                <div className="space-y-3">
                  <h3 className="text-base font-bold text-foreground">3. How We Use Your Data</h3>
                  <p className="text-muted-foreground">
                    We use your data solely to fulfill orders, process payments, verify service professionals, dispatch delivery partners, prevent fraudulent transactions, and comply with statutory Indian laws.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="text-base font-bold text-foreground">4. Data Security & Retention</h3>
                  <p className="text-muted-foreground">
                    All user sessions are secured using 256-bit TLS encryption. Data stored in our database clusters are encrypted at rest. We adhere strictly to the Digital Personal Data Protection Act (DPDPA 2023).
                  </p>
                </div>
              </div>
            )}

            {/* 2. Terms of Service */}
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

            {/* 3. Return & Refund Policy */}
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

            {/* 4. Cancellation Policy */}
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

            {/* 5. Franchise Policy */}
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

            {/* 6. Vendor Policy */}
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
