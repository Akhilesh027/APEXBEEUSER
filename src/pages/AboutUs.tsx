import React, { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { 
  Building2, 
  Target, 
  Eye, 
  Sparkles, 
  ShieldCheck, 
  Users, 
  TrendingUp, 
  Cpu, 
  Award, 
  CheckCircle2, 
  ArrowRight,
  Globe2,
  HeartHandshake,
  Lightbulb,
  Zap,
  MapPin
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const AboutUs: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"story" | "mission" | "research" | "leadership">("story");

  const stats = [
    { label: "Partner Vendors & Merchants", value: "25,000+" },
    { label: "Active Consumers Served", value: "1.2M+" },
    { label: "Cities & Mandals Covered", value: "150+" },
    { label: "Verified Service Providers", value: "8,500+" },
  ];

  const coreValues = [
    {
      num: 1,
      emoji: "🤝",
      title: "Trust",
      desc: "Every relationship starts with trust. We treat everyone — customers, merchants, employees, partners — with transparency & honesty.",
    },
    {
      num: 2,
      emoji: "👑",
      title: "Customer First",
      desc: "Our success is our success when our customers succeed. Customer convenience, value, quality, and reliable service are our top priorities.",
    },
    {
      num: 3,
      emoji: "🚀",
      title: "Innovation",
      desc: "We constantly find better ways to solve real problems. We use technology not just for technology’s sake — we use it to solve real business problems.",
    },
    {
      num: 4,
      emoji: "🌱",
      title: "Empowerment",
      desc: "We create opportunities, not dependency. Small business owners, women entrepreneurs, youth and local entrepreneurs develop their tools & opportunities and create empowerment.",
    },
    {
      num: 5,
      emoji: "🏪",
      title: "Local First",
      desc: "Local businesses are the foundation of the economy. When local businesses are strong, the local economy is strong.",
    },
    {
      num: 6,
      emoji: "⭐",
      title: "Excellence",
      desc: "Good is not enough; we strive to be better every day. Continuous improvement in every area of product, technology, operations, customer service.",
    },
    {
      num: 7,
      emoji: "🔐",
      title: "Integrity",
      desc: "Do the right thing, even when no one is looking. Ethical business practices, transparency, and accountability.",
    },
    {
      num: 8,
      emoji: "🌍",
      title: "Inclusion",
      desc: "Opportunity should be accessible to all. From village to city, from small trader to growing entrepreneur, everyone has a place in the ecosystem.",
    },
    {
      num: 9,
      emoji: "🤝",
      title: "Collaboration",
      desc: "We grow together, not alone. Customers + Merchants + Entrepreneurs + Employees + Partners = ApexBee Ecosystem.",
    },
    {
      num: 10,
      emoji: "🇮🇳",
      title: "Nation Building",
      desc: "Strong local businesses build a strong India. Local employment, entrepreneurship and digital consumption should be encouraged.",
    },
  ];

  const milestones = [
    { year: "2024", title: "Inception & Hyperlocal Pilot", desc: "Launched pilot operations in Telangana & Andhra Pradesh with 500 local stores." },
    { year: "2025", title: "Multi-Vertical Expansion", desc: "Introduced Food & Dineout, On-Demand Home Services, and ApexBee Academy skill certifications." },
    { year: "2026", title: "Unified Nation-Scale Ecosystem", desc: "Scaling across South & Central India with over 25,000 registered businesses and 1M+ active users." },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-amber-500 selection:text-white">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-amber-500/10 via-background to-background py-16 md:py-24 border-b border-border/40">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(245,158,11,0.15),rgba(255,255,255,0))]"></div>
        <div className="container mx-auto px-4 max-w-5xl text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold uppercase tracking-wider mb-6">
            <Sparkles className="w-3.5 h-3.5" /> India's Unified Digital Business Ecosystem
          </div>
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight leading-tight mb-6">
            Empowering India's Local Commerce & <span className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 bg-clip-text text-transparent">Digital Future</span>
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed mb-8">
            ApexBee is bridging the gap between consumers, local vendors, skilled service technicians, franchise leaders, and course educators through one seamlessly integrated digital super-app.
          </p>

          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/earn-with-apexbee">
              <Button className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-lg shadow-amber-500/20">
                Partner With Us <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </Link>
            <Link to="/contact">
              <Button variant="outline" className="border-border hover:bg-muted font-bold px-6 py-2.5 rounded-xl">
                Contact Our Team
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Counter Bar */}
      <section className="container mx-auto px-4 -mt-8 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-card border border-border/80 rounded-2xl shadow-xl backdrop-blur-md">
          {stats.map((stat, i) => (
            <div key={i} className="text-center p-2">
              <div className="text-2xl sm:text-3xl font-black text-amber-500">{stat.value}</div>
              <div className="text-xs sm:text-sm text-muted-foreground font-medium mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Navigation Tabs */}
      <section className="container mx-auto px-4 py-12 max-w-5xl">
        <div className="flex justify-center border-b border-border/60 mb-10 overflow-x-auto scrollbar-none gap-2 sm:gap-4 pb-2">
          {[
            { id: "story", label: "Our Story", icon: Building2 },
            { id: "mission", label: "Mission & Vision", icon: Target },
            { id: "research", label: "Research & Innovation", icon: Lightbulb },
            { id: "leadership", label: "Core Values & Impact", icon: Award },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? "bg-amber-500 text-white shadow-md shadow-amber-500/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab 1: Story */}
        {activeTab === "story" && (
          <div className="space-y-12 animate-fadeIn">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">The Genesis of ApexBee</h2>
                <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">
                  ApexBee was conceived with a simple yet ambitious goal: why should small business owners, kirana stores, independent plumbers, home bakers, and educators be fragmented across dozens of complex, high-commission platforms?
                </p>
                <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">
                  We engineered a single unified hub that unifies <strong>hyperlocal food & grocery delivery</strong>, <strong>e-commerce shopping</strong>, <strong>on-demand home services</strong>, <strong>skill certification academy</strong>, and <strong>travel tourism</strong> under a community-driven franchise network.
                </p>
                <div className="pt-2 flex items-center gap-4 text-sm font-semibold text-amber-600 dark:text-amber-400">
                  <CheckCircle2 className="w-5 h-5" /> Built in India, for India's digital prosperity.
                </div>
              </div>
              <div className="bg-gradient-to-tr from-amber-500/20 via-orange-500/10 to-transparent p-8 rounded-3xl border border-amber-500/20 relative overflow-hidden">
                <div className="space-y-4">
                  <span className="text-xs font-black tracking-widest text-amber-500 uppercase">Ecosystem Architecture</span>
                  <h3 className="text-xl font-black">6 Verticals, 1 Seamless Wallet & Identity</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">✔ <strong>ApexBee Marketplace:</strong> Direct manufacturer-to-consumer goods.</li>
                    <li className="flex items-center gap-2">✔ <strong>ApexBee Food & Dineout:</strong> 30-min express meals & restaurant table booking.</li>
                    <li className="flex items-center gap-2">✔ <strong>ApexBee Services:</strong> Verified home repairs, electricians & AMC.</li>
                    <li className="flex items-center gap-2">✔ <strong>ApexBee Academy:</strong> Entrepreneurship & career development courses.</li>
                    <li className="flex items-center gap-2">✔ <strong>ApexBee Travel:</strong> Curated pilgrimage & vacation packages.</li>
                    <li className="flex items-center gap-2">✔ <strong>Franchise Governance:</strong> State, district & mandal level empowerment.</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Milestones timeline */}
            <div className="pt-8">
              <h3 className="text-xl font-bold mb-6 text-center">Our Journey & Milestones</h3>
              <div className="grid md:grid-cols-3 gap-6">
                {milestones.map((m, idx) => (
                  <div key={idx} className="bg-card border border-border/80 rounded-2xl p-6 relative hover:border-amber-500/50 transition">
                    <div className="text-3xl font-black text-amber-500/40 mb-2">{m.year}</div>
                    <h4 className="font-bold text-base mb-1">{m.title}</h4>
                    <p className="text-xs sm:text-sm text-muted-foreground">{m.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Mission & Vision */}
        {activeTab === "mission" && (
          <div className="space-y-10 animate-fadeIn text-left">
            <div className="grid md:grid-cols-2 gap-8 items-stretch">
              {/* Vision Card */}
              <div className="bg-card border border-amber-500/30 rounded-3xl p-8 space-y-4 shadow-sm flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 text-2xl font-bold">
                    🔭
                  </div>
                  <h3 className="text-2xl font-bold text-foreground">Vision</h3>
                  <p className="text-foreground font-semibold leading-relaxed text-sm sm:text-base italic bg-amber-500/5 p-4 rounded-2xl border border-amber-500/20">
                    “To build the most trusted local commerce ecosystem in India, empowering every local business and entrepreneur to grow through technology, opportunities and community.”
                  </p>
                </div>
                <div className="pt-3 border-t border-border/60">
                  <span className="text-xs font-bold text-amber-500 uppercase tracking-wider block mb-1">
                    Simple Meaning:
                  </span>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed font-medium">
                    To make digital technology, consumers, business tools and growth opportunities accessible to every local shop, service provider, wholesaler &amp; entrepreneur in India.
                  </p>
                </div>
              </div>

              {/* Mission Card */}
              <div className="bg-card border border-orange-500/30 rounded-3xl p-8 space-y-4 shadow-sm flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500 text-2xl font-bold">
                    🎯
                  </div>
                  <h3 className="text-2xl font-bold text-foreground">Mission</h3>
                  <p className="text-muted-foreground leading-relaxed text-xs sm:text-sm">
                    Connecting local businesses with consumers through a vibrant, affordable and inclusive digital ecosystem that facilitates trade, fosters entrepreneurship, creates opportunities, and drives sustainable local economic growth.
                  </p>
                </div>
                <div className="pt-3 border-t border-border/60">
                  <span className="text-xs font-bold text-orange-500 uppercase tracking-wider block mb-2">
                    Our Mission Has 5 Pillars:
                  </span>
                  <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-amber-500">1.</span>
                      <span><strong>Connectivity</strong> — Local Merchants &harr; Consumers</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-amber-500">2.</span>
                      <span><strong>Digitalization</strong> — Every local business uses technology</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-amber-500">3.</span>
                      <span><strong>Empowerment</strong> — Opportunities for entrepreneurs &amp; small businesses</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-amber-500">4.</span>
                      <span><strong>Simplification</strong> — Make shopping, sales, payments, inventory &amp; operations easier</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-amber-500">5.</span>
                      <span><strong>Grow Together</strong> — Merchant, consumer, entrepreneur and Apexbee grow together</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Quick Core Values Preview */}
            <div className="p-8 rounded-3xl bg-muted/40 border border-border space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <h4 className="text-base sm:text-lg font-bold flex items-center gap-2">
                    <span>🐝</span> ApexBee Core Values
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Rooted in trust, local prosperity, transparency, and nation building.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab("leadership")}
                  className="text-xs font-bold text-amber-600 hover:text-amber-700 underline self-start sm:self-auto cursor-pointer"
                >
                  View All 10 Core Values &rarr;
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Research & Innovation */}
        {activeTab === "research" && (
          <div className="space-y-8 animate-fadeIn">
            <div className="text-center max-w-2xl mx-auto space-y-2 mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold">ApexBee R&D Labs</h2>
              <p className="text-muted-foreground text-sm">
                Engineering next-generation algorithmic dispatch, localized NLP, and automated partner settlements.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="p-6 bg-card border border-border rounded-2xl space-y-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                  <Cpu className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-base">Hyperlocal Geo-Clustering</h4>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Proprietary routing algorithms that cluster orders between physical stores and delivery partners for sub-20 minute delivery with minimal carbon footprint.
                </p>
              </div>

              <div className="p-6 bg-card border border-border rounded-2xl space-y-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                  <Globe2 className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-base">Vernacular Voice Assistance</h4>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Multilingual AI assistance in Telugu, Hindi, Tamil, and Kannada to allow non-tech-savvy merchants and elderly consumers to shop and manage inventory by voice.
                </p>
              </div>

              <div className="p-6 bg-card border border-border rounded-2xl space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-base">Decentralized Franchise Ledger</h4>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Automated multi-tier revenue distribution engine executing real-time commission split to Mandal, District, and State franchise operators instantaneously.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Values & Leadership */}
        {activeTab === "leadership" && (
          <div className="space-y-10 animate-fadeIn">
            <div>
              <div className="text-center max-w-2xl mx-auto mb-8 space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold uppercase tracking-wider">
                  🐝 APEXBEE CORE VALUES
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-foreground">Our 10 Core Operating Values</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  The principles that drive every relationship, feature, and transaction across the ApexBee ecosystem.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {coreValues.map((val) => (
                  <div key={val.num} className="p-5 sm:p-6 bg-card border border-border rounded-2xl flex gap-4 items-start hover:border-amber-500/40 transition-all shadow-xs">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-2xl shrink-0">
                      {val.emoji}
                    </div>
                    <div className="space-y-1.5 text-left">
                      <h4 className="font-bold text-base text-foreground flex items-center gap-2">
                        <span className="text-amber-500 font-extrabold">{val.num}.</span> {val.title}
                      </h4>
                      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{val.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-r from-amber-500/10 via-background to-orange-500/10 border border-amber-500/30 p-8 rounded-3xl text-center space-y-4">
              <h3 className="text-xl font-bold">Want to shape the future of Bharat commerce?</h3>
              <p className="text-sm text-muted-foreground max-w-xl mx-auto">
                Explore leadership, engineering, business development, and partner onboarding opportunities across our nationwide regional offices.
              </p>
              <div className="flex justify-center gap-3 pt-2">
                <Link to="/careers">
                  <Button className="bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl px-5">
                    View Career Openings
                  </Button>
                </Link>
                <Link to="/earn-with-apexbee">
                  <Button variant="outline" className="font-bold rounded-xl px-5">
                    Franchise Program
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
};

export default AboutUs;
