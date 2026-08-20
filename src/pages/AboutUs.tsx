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
      icon: Users,
      title: "Community First",
      desc: "Empowering local artisans, small shop owners, service specialists, and entrepreneurs to thrive in the digital economy.",
    },
    {
      icon: ShieldCheck,
      title: "Trust & Transparency",
      desc: "Zero hidden costs, verified vendor badges, transparent commissions, and secure biometric-grade transactions.",
    },
    {
      icon: Cpu,
      title: "Deep Tech Innovation",
      desc: "Harnessing AI-powered hyper-local dispatch, dynamic route optimization, and intelligent inventory predictive matching.",
    },
    {
      icon: HeartHandshake,
      title: "Inclusive Growth",
      desc: "Bridging the urban-rural divide by bringing state-of-the-art commerce infrastructure to Tier 2, Tier 3, and rural regions.",
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
          <div className="space-y-10 animate-fadeIn">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-card border border-amber-500/30 rounded-3xl p-8 space-y-4 shadow-sm">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                  <Target className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold">Our Mission</h3>
                <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">
                  To democratize technology and market access for every micro, small, and medium enterprise (MSME) in India. We aim to enable 500,000 local merchants and service professionals to generate sustainable digital income with 0% predatory take-rates and high-velocity local fulfillment.
                </p>
              </div>

              <div className="bg-card border border-orange-500/30 rounded-3xl p-8 space-y-4 shadow-sm">
                <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                  <Eye className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold">Our Vision</h3>
                <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">
                  To build the world's most comprehensive grassroots commerce network where commerce, education, livelihoods, and logistics work in harmony—fostering community wealth generation, youth skill development, and hyper-reliable consumer experiences across Bharat.
                </p>
              </div>
            </div>

            <div className="p-8 rounded-3xl bg-muted/40 border border-border">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500" /> The ApexBee Core Promise
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                Whether a customer is ordering groceries in 15 minutes, booking an electrician for a home rewiring, pursuing an AI certification, or reserving a pilgrimage tour to Tirupati, ApexBee ensures guaranteed service level agreements, zero payment friction, and direct economic support to the local provider.
              </p>
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
              <h3 className="text-xl font-bold mb-6 text-center">Our Core Operating Values</h3>
              <div className="grid sm:grid-cols-2 gap-6">
                {coreValues.map((val, idx) => {
                  const Icon = val.icon;
                  return (
                    <div key={idx} className="p-6 bg-card border border-border rounded-2xl flex gap-4 items-start">
                      <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-bold text-base">{val.title}</h4>
                        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{val.desc}</p>
                      </div>
                    </div>
                  );
                })}
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
