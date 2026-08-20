import React from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { 
  Newspaper, 
  Download, 
  Sparkles, 
  ExternalLink, 
  Mail, 
  Building2, 
  Award, 
  Calendar, 
  ArrowRight,
  FileText,
  Copy,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export const PressMedia: React.FC = () => {
  const { toast } = useToast();

  const pressReleases = [
    {
      date: "August 10, 2026",
      source: "TechPulse India",
      title: "ApexBee Surpasses 1.2 Million Active Consumers Across South India",
      desc: "ApexBee's unified super-app ecosystem records 300% year-on-year GMV surge across hyperlocal grocery, food delivery, and MSME e-commerce.",
      tag: "Business & Growth",
      link: "#",
    },
    {
      date: "July 24, 2026",
      source: "Economic Dispatch",
      title: "ApexBee Launches AI-Driven Mandal Franchise Empowerment Program",
      desc: "Decentralized revenue distribution and vernacular voice capabilities empower local entrepreneurs in tier-2 and tier-3 towns.",
      tag: "Franchise Innovation",
      link: "#",
    },
    {
      date: "June 15, 2026",
      source: "Retail Today",
      title: "How ApexBee is Eliminating Predatory Commissions for Independent Restaurants & Kiranas",
      desc: "An in-depth look at ApexBee's 0% take-rate pilot and transparent subscription model for verified neighborhood merchants.",
      tag: "Merchant Spotlight",
      link: "#",
    },
    {
      date: "May 02, 2026",
      source: "Digital Bharat Journal",
      title: "ApexBee Academy Partners with National Skill Framework for Entrepreneur Certifications",
      desc: "Over 20,000 students and aspiring home business creators to gain verified digital commerce and trade credentials.",
      tag: "Skill Development",
      link: "#",
    },
  ];

  const brandAssets = [
    {
      name: "ApexBee Master Logo (Dark Background)",
      format: "PNG / SVG (High Resolution)",
      size: "2.4 MB",
    },
    {
      name: "ApexBee Brand Icon & Bee Symbol",
      format: "Vector SVG / Transparent PNG",
      size: "1.1 MB",
    },
    {
      name: "Official Brand Guidelines & Color Tokens",
      format: "PDF Document (12 Pages)",
      size: "4.8 MB",
    },
    {
      name: "Executive Photos & Office Imagery",
      format: "ZIP Archive (300 DPI)",
      size: "18.2 MB",
    },
  ];

  const handleDownloadAsset = (name: string) => {
    toast({
      title: "Downloading Asset 📦",
      description: `Preparing high-res package for ${name}.`,
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-amber-500 selection:text-white">
      <Navbar />

      {/* Hero */}
      <section className="bg-gradient-to-b from-amber-500/10 via-background to-background py-16 border-b border-border/40">
        <div className="container mx-auto px-4 max-w-4xl text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold uppercase tracking-wider">
            <Newspaper className="w-3.5 h-3.5" /> ApexBee Press & Media Centre
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight">
            News, Stories & <span className="bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">Media Resources</span>
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base max-w-2xl mx-auto">
            Stay updated with official announcements, media coverage, executive commentary, and download verified brand assets.
          </p>
        </div>
      </section>

      {/* Press Releases List */}
      <section className="container mx-auto px-4 py-14 max-w-5xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <span className="text-xs font-bold text-amber-500 uppercase tracking-wider">Official Announcements</span>
            <h2 className="text-2xl font-bold mt-1">Recent Press Releases & News</h2>
          </div>
          <a href="mailto:press@apexbee.in" className="text-xs font-bold text-amber-500 hover:underline flex items-center gap-1">
            <Mail className="w-3.5 h-3.5" /> Media Enquiries: press@apexbee.in
          </a>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {pressReleases.map((pr, idx) => (
            <div
              key={idx}
              className="p-6 bg-card border border-border/80 rounded-2xl hover:border-amber-500/40 transition shadow-sm space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-amber-500 uppercase tracking-wider">{pr.tag}</span>
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> {pr.date}
                  </span>
                </div>
                <h3 className="text-lg font-bold leading-snug">{pr.title}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {pr.desc}
                </p>
              </div>

              <div className="pt-3 border-t border-border/50 flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-medium">Source: {pr.source}</span>
                <span className="font-bold text-amber-500 flex items-center gap-1 cursor-pointer hover:underline">
                  Read Full Release <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Brand Assets & Media Kit */}
      <section className="container mx-auto px-4 py-14 max-w-5xl border-t border-border/60">
        <div className="text-center space-y-2 mb-10">
          <span className="text-xs font-bold text-amber-500 uppercase tracking-wider">Brand Resources</span>
          <h2 className="text-2xl sm:text-3xl font-bold">Download Official Media Kit</h2>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-xl mx-auto">
            Use these official logos, badges, and brand guidelines for all press publications and media broadcasts.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {brandAssets.map((asset, i) => (
            <div key={i} className="p-5 bg-card border border-border rounded-2xl flex items-center justify-between gap-4">
              <div className="space-y-1">
                <h4 className="font-bold text-sm">{asset.name}</h4>
                <div className="text-xs text-muted-foreground">{asset.format} • {asset.size}</div>
              </div>
              <Button
                onClick={() => handleDownloadAsset(asset.name)}
                variant="outline"
                className="text-xs font-bold rounded-xl shrink-0 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 mr-1" /> Download
              </Button>
            </div>
          ))}
        </div>
      </section>

      {/* Media Contact Box */}
      <section className="container mx-auto px-4 py-10 max-w-5xl">
        <div className="p-8 rounded-3xl bg-gradient-to-r from-amber-500/10 via-background to-orange-500/10 border border-amber-500/30 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <h3 className="text-xl font-bold">Journalist or Media Representative?</h3>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-md">
              Need quotes from our founders, executive interview availability, or high-res photography? Contact our PR desk.
            </p>
          </div>
          <a href="mailto:press@apexbee.in">
            <Button className="bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl px-6 py-2.5 shadow-md">
              <Mail className="w-4 h-4 mr-2" /> Contact PR Team
            </Button>
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default PressMedia;
