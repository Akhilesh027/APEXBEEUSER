import React, { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { 
  HelpCircle, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  ShoppingBag, 
  CreditCard, 
  RotateCcw, 
  Truck, 
  Wrench, 
  GraduationCap, 
  Plane, 
  Store, 
  MessageSquare, 
  Phone, 
  Ticket, 
  ArrowRight,
  Sparkles,
  ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

export const HelpCenter: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  const categories = [
    { id: "all", label: "All Questions", icon: HelpCircle },
    { id: "orders", label: "Orders & Delivery", icon: Truck },
    { id: "payments", label: "Payments & Wallet", icon: CreditCard },
    { id: "returns", label: "Returns & Refunds", icon: RotateCcw },
    { id: "services", label: "Home Services", icon: Wrench },
    { id: "academy", label: "Academy & Courses", icon: GraduationCap },
    { id: "travel", label: "Travel & Tours", icon: Plane },
    { id: "partner", label: "Vendors & Franchise", icon: Store },
  ];

  const faqs: FAQItem[] = [
    {
      category: "orders",
      question: "How do I track my order live in real time?",
      answer: "You can track your order live from the 'My Orders' section in your account dashboard. For instant grocery and food orders, you will see a real-time GPS map with rider location, assigned store, and estimated arrival countdown.",
    },
    {
      category: "orders",
      question: "What are the delivery charges on ApexBee?",
      answer: "Orders above ₹499 on marketplace products and ₹199 on local grocery stores qualify for FREE delivery. For sub-total orders below this threshold, a nominal fee of ₹20-₹40 is charged based on distance.",
    },
    {
      category: "orders",
      question: "Can I change my delivery address after placing an order?",
      answer: "If your order has not yet been dispatched by the merchant or rider, you can update the address or phone number directly from the Order Details screen or by contacting our 24x7 support desk.",
    },
    {
      category: "payments",
      question: "How do I use my ApexBee Wallet Balance at checkout?",
      answer: "At checkout, simply toggle the 'Use ApexBee Wallet Balance' checkbox. Your available wallet credits and referral cashback will be instantly deducted from the total cart payable amount.",
    },
    {
      category: "payments",
      question: "What payment methods are supported?",
      answer: "We support all major payment modes including UPI (Google Pay, PhonePe, Paytm, BHIM), Credit/Debit Cards (Visa, Mastercard, RuPay), Net Banking across 50+ Indian banks, and Cash on Delivery (COD).",
    },
    {
      category: "returns",
      question: "What is the return window for products?",
      answer: "Most physical goods (fashion, electronics, home decor) carry a hassle-free 7-day return policy from the date of delivery. Grocery, fresh food, and intimate apparel are non-returnable once unsealed unless received damaged or spoiled.",
    },
    {
      category: "returns",
      question: "How long does it take to get a refund after return approval?",
      answer: "Refunds to your ApexBee Wallet are credited INSTANTLY within 5 minutes of pickup confirmation. Refunds to original payment source (UPI / Bank Account) are processed within 2-4 business days.",
    },
    {
      category: "services",
      question: "Are ApexBee service technicians background-verified?",
      answer: "Yes! 100% of our home service professionals (electricians, plumbers, appliance technicians, beauticians) undergo mandatory Aadhaar verification, police background verification, and hands-on skill evaluations.",
    },
    {
      category: "services",
      question: "What if the technician cannot fix my appliance?",
      answer: "We provide an ApexBee Service Guarantee: If an issue cannot be resolved due to technical constraints or parts unavailability, you only pay a minimal standard inspection fee of ₹99, or receive a complete service credit.",
    },
    {
      category: "academy",
      question: "Are ApexBee Academy course certifications recognized?",
      answer: "Yes. Our skill courses and entrepreneurship modules follow NSQF-aligned syllabi and come with verified digital credential badges that can be added to LinkedIn and resumes.",
    },
    {
      category: "travel",
      question: "Are Tirupati and Srisailam Darshan passes guaranteed in packages?",
      answer: "All pilgrimage packages marked with 'VIP Darshan Included' have pre-reserved TTD / Devasthanam special entry darshan slots arranged through registered official channels.",
    },
    {
      category: "partner",
      question: "How do I become an ApexBee Mandal or District Franchise Partner?",
      answer: "Visit our 'Earn With ApexBee' portal or submit an enquiry on our Contact page. Our franchise onboarding team will verify your territorial availability, space requirement, and guide you through the turnkey setup within 7 working days.",
    },
  ];

  const filteredFaqs = faqs.filter((faq) => {
    const matchesCat = activeCategory === "all" || faq.category === activeCategory;
    const matchesSearch = 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-amber-500 selection:text-white">
      <Navbar />

      {/* Hero */}
      <section className="bg-gradient-to-b from-amber-500/10 via-background to-background py-16 border-b border-border/40">
        <div className="container mx-auto px-4 max-w-4xl text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold uppercase tracking-wider">
            <HelpCircle className="w-3.5 h-3.5" /> ApexBee Help Center & FAQ Hub
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight">
            How Can We <span className="bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">Help You Today?</span>
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base max-w-2xl mx-auto">
            Find answers to frequently asked questions about tracking orders, payments, refunds, technician bookings, and franchise partner programs.
          </p>

          {/* Search */}
          <div className="max-w-xl mx-auto relative pt-2">
            <Search className="w-4 h-4 text-muted-foreground absolute left-4 top-6" />
            <Input
              placeholder="Search help topics (e.g., 'refund timeline', 'track order', 'wallet')..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 rounded-2xl bg-card border-border/80 text-sm h-12 shadow-md"
            />
          </div>
        </div>
      </section>

      {/* Quick Action Support Grid */}
      <section className="container mx-auto px-4 -mt-6 relative z-10 max-w-5xl">
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
          <Link to="/my-orders" className="p-4 bg-card border border-border rounded-2xl shadow-sm hover:border-amber-500/50 transition flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <h4 className="font-bold text-xs">Track Active Orders</h4>
              <p className="text-[11px] text-muted-foreground">View real-time status</p>
            </div>
          </Link>

          <Link to="/contact" className="p-4 bg-card border border-border rounded-2xl shadow-sm hover:border-amber-500/50 transition flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center shrink-0">
              <Ticket className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <h4 className="font-bold text-xs">Raise Support Ticket</h4>
              <p className="text-[11px] text-muted-foreground">2-hour resolution SLA</p>
            </div>
          </Link>

          <a href="tel:18001234567" className="p-4 bg-card border border-border rounded-2xl shadow-sm hover:border-amber-500/50 transition flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
              <Phone className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <h4 className="font-bold text-xs">Call Support Desk</h4>
              <p className="text-[11px] text-muted-foreground">1800-123-4567 Toll Free</p>
            </div>
          </a>

          <a href="https://wa.me/918008812345" target="_blank" rel="noopener noreferrer" className="p-4 bg-card border border-border rounded-2xl shadow-sm hover:border-amber-500/50 transition flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <h4 className="font-bold text-xs">WhatsApp Assistant</h4>
              <p className="text-[11px] text-muted-foreground">Instant chat updates</p>
            </div>
          </a>
        </div>
      </section>

      {/* Main FAQ Section */}
      <section className="container mx-auto px-4 py-14 max-w-5xl">
        <div className="grid lg:grid-cols-12 gap-8">
          {/* Categories Sidebar */}
          <div className="lg:col-span-4 space-y-2">
            <h3 className="text-xs font-bold text-amber-500 uppercase tracking-wider mb-3 px-1">
              Browse by Category
            </h3>
            <div className="flex lg:flex-col gap-1.5 overflow-x-auto scrollbar-none pb-2">
              {categories.map((cat) => {
                const Icon = cat.icon;
                const isActive = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setActiveCategory(cat.id);
                      setExpandedIndex(0);
                    }}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs transition text-left whitespace-nowrap cursor-pointer ${
                      isActive
                        ? "bg-amber-500 text-white shadow-md shadow-amber-500/20"
                        : "bg-card border border-border/80 text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Safety badge box */}
            <div className="hidden lg:block pt-6">
              <div className="p-4 rounded-2xl bg-muted/40 border border-border space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-500">
                  <ShieldCheck className="w-4 h-4" /> 100% Buyer & Partner Safety
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  All transactions on ApexBee are encrypted with 256-bit SSL and backed by our dispute resolution team.
                </p>
              </div>
            </div>
          </div>

          {/* Accordion Questions List */}
          <div className="lg:col-span-8 space-y-3">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Frequently Asked Questions ({filteredFaqs.length})</h2>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="text-xs text-amber-500 font-bold hover:underline"
                >
                  Clear Search
                </button>
              )}
            </div>

            {filteredFaqs.length === 0 ? (
              <div className="p-8 text-center bg-card border border-border rounded-2xl space-y-3">
                <HelpCircle className="w-10 h-10 text-muted-foreground mx-auto opacity-40" />
                <h3 className="font-bold text-sm">No matching questions found</h3>
                <p className="text-xs text-muted-foreground">
                  Need personalized assistance? Raise a direct ticket or message our WhatsApp helpline.
                </p>
                <div className="pt-2">
                  <Link to="/contact">
                    <Button className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl">
                      Contact Support Desk
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              filteredFaqs.map((faq, idx) => {
                const isOpen = expandedIndex === idx;
                return (
                  <div
                    key={idx}
                    className={`bg-card border rounded-2xl transition overflow-hidden ${
                      isOpen ? "border-amber-500/50 shadow-sm" : "border-border/80"
                    }`}
                  >
                    <button
                      onClick={() => setExpandedIndex(isOpen ? null : idx)}
                      className="w-full p-4 sm:p-5 flex items-center justify-between gap-4 text-left cursor-pointer"
                    >
                      <span className="font-bold text-sm text-foreground">{faq.question}</span>
                      <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center shrink-0">
                        {isOpen ? <ChevronUp className="w-4 h-4 text-amber-500" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                      </div>
                    </button>
                    {isOpen && (
                      <div className="px-4 sm:px-5 pb-5 pt-1 border-t border-border/40 text-xs sm:text-sm text-muted-foreground leading-relaxed animate-fadeIn">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>

      {/* Still need help CTA */}
      <section className="container mx-auto px-4 py-10 max-w-5xl">
        <div className="p-8 rounded-3xl bg-gradient-to-r from-amber-500/10 via-background to-orange-500/10 border border-amber-500/30 text-center space-y-3">
          <h3 className="text-xl font-bold">Still have questions?</h3>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
            Our specialized support team is available 7 days a week to assist with order adjustments, vendor settlements, and franchise inquiries.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <Link to="/contact">
              <Button className="bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl px-5 text-xs">
                Submit Support Ticket <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default HelpCenter;
