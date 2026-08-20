import React, { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { 
  Briefcase, 
  MapPin, 
  Clock, 
  Sparkles, 
  Heart, 
  Zap, 
  TrendingUp, 
  GraduationCap, 
  Coffee, 
  Laptop, 
  ArrowRight,
  CheckCircle2,
  Send,
  X,
  Search,
  Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface JobPosting {
  id: string;
  title: string;
  department: string;
  location: string;
  type: string;
  experience: string;
  description: string;
  tags: string[];
}

export const Careers: React.FC = () => {
  const { toast } = useToast();
  const [selectedDept, setSelectedDept] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [applyingJob, setApplyingJob] = useState<JobPosting | null>(null);
  const [applicant, setApplicant] = useState({
    name: "",
    email: "",
    phone: "",
    linkedin: "",
    portfolio: "",
    coverNote: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const jobs: JobPosting[] = [
    {
      id: "eng-01",
      title: "Senior Fullstack Engineer (React / Node.js)",
      department: "Engineering",
      location: "Hyderabad / Hybrid",
      type: "Full-Time",
      experience: "3-6 Years",
      description: "Scale high-concurrency microservices powering order dispatch, real-time geolocation tracking, and partner settlement ledgers.",
      tags: ["React", "TypeScript", "Node.js", "MongoDB", "Redis"],
    },
    {
      id: "eng-02",
      title: "Mobile App Developer (React Native / Flutter)",
      department: "Engineering",
      location: "Hyderabad / Bengaluru",
      type: "Full-Time",
      experience: "2-5 Years",
      description: "Build ultra-smooth cross-platform consumer and vendor partner mobile apps with offline sync and vernacular voice support.",
      tags: ["React Native", "Android", "iOS", "WebSockets"],
    },
    {
      id: "prod-01",
      title: "Product Manager - Hyperlocal Logistics",
      department: "Product",
      location: "Hyderabad (HQ)",
      type: "Full-Time",
      experience: "4-7 Years",
      description: "Own the end-to-end rider dispatch algorithms, 15-minute grocery batching logic, and food delivery delivery experience.",
      tags: ["Logistics Tech", "Supply Chain", "Data Analytics"],
    },
    {
      id: "ops-01",
      title: "Regional Franchise Operations Manager",
      department: "Operations",
      location: "Vijayawada / Visakhapatnam",
      type: "Full-Time",
      experience: "3-5 Years",
      description: "Lead district and mandal franchise onboarding, quality assurance, merchant audits, and field supervisor training.",
      tags: ["Operations", "Vendor Relations", "Field Audits"],
    },
    {
      id: "mkt-01",
      title: "Growth & Performance Marketing Lead",
      department: "Marketing",
      location: "Hyderabad / Remote",
      type: "Full-Time",
      experience: "3-6 Years",
      description: "Drive customer acquisition, referral gamification campaigns, regional digital ad strategy, and community engagement.",
      tags: ["SEO", "Meta Ads", "Google Ads", "Retention"],
    },
    {
      id: "biz-01",
      title: "Category Manager (Fashion & Handlooms)",
      department: "Business & Vendor Growth",
      location: "Hyderabad / Hybrid",
      type: "Full-Time",
      experience: "2-5 Years",
      description: "Onboard weavers, jewellery manufacturers, and wholesale apparel merchants onto the ApexBee direct-to-consumer marketplace.",
      tags: ["E-Commerce Category", "Procurement", "Merchant Relations"],
    },
  ];

  const perks = [
    { icon: TrendingUp, title: "High-Growth Equity (ESOPs)", desc: "Be an owner from day one and create long-term generational wealth." },
    { icon: Heart, title: "Comprehensive Health Cover", desc: "Premium medical coverage for you, your spouse, children, and parents." },
    { icon: GraduationCap, title: "Annual Learning Stipend", desc: "₹50,000 yearly allowance for conferences, certifications, and books." },
    { icon: Laptop, title: "Latest M-Series Apple MacBooks", desc: "Top-of-the-line hardware, 4K monitors, and ergonomic setup allowances." },
    { icon: Coffee, title: "Flexible Work & Catered Food", desc: "Nutritious breakfasts, snacks, gourmet coffee, and hybrid work flexibility." },
    { icon: Zap, title: "Fast-Track Meritocracy", desc: "Bi-annual appraisals with transparent promotion metrics and leadership tracks." },
  ];

  const filteredJobs = jobs.filter((j) => {
    const matchesDept = selectedDept === "all" || j.department.toLowerCase().includes(selectedDept.toLowerCase());
    const matchesSearch = 
      j.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      j.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
      j.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDept && matchesSearch;
  });

  const handleApplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setApplyingJob(null);
      toast({
        title: "Application Received! 🎉",
        description: `Thank you ${applicant.name}. Our talent acquisition team will review your profile for ${applyingJob?.title}.`,
      });
      setApplicant({
        name: "",
        email: "",
        phone: "",
        linkedin: "",
        portfolio: "",
        coverNote: "",
      });
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-amber-500 selection:text-white">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-amber-500/10 via-background to-background py-16 md:py-24 border-b border-border/40">
        <div className="container mx-auto px-4 max-w-4xl text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" /> Join the ApexBee Mission
          </div>
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight leading-tight">
            Build the Operating System for <span className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 bg-clip-text text-transparent">Bharat Commerce</span>
          </h1>
          <p className="text-muted-foreground text-sm sm:text-lg max-w-2xl mx-auto leading-relaxed">
            We are looking for passionate builders, designers, domain experts, and problem solvers to transform how millions of Indians shop, earn, learn, and grow.
          </p>
          <div className="pt-2">
            <a href="#open-roles">
              <Button className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-lg shadow-amber-500/20">
                Explore Open Positions <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Perks Grid */}
      <section className="container mx-auto px-4 py-16 max-w-5xl">
        <div className="text-center space-y-2 mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold">Why You'll Love Building Here</h2>
          <p className="text-muted-foreground text-sm">We provide an environment where ambitious talent does the best work of their lives.</p>
        </div>

        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
          {perks.map((perk, i) => {
            const Icon = perk.icon;
            return (
              <div key={i} className="p-6 bg-card border border-border rounded-2xl space-y-3 hover:border-amber-500/40 transition">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base">{perk.title}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{perk.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Open Roles Section */}
      <section id="open-roles" className="container mx-auto px-4 py-14 max-w-5xl border-t border-border/60">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <span className="text-xs font-bold text-amber-500 uppercase tracking-wider">Current Opportunities</span>
            <h2 className="text-2xl sm:text-3xl font-bold mt-1">Open Positions ({filteredJobs.length})</h2>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[220px]">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
              <Input
                placeholder="Search by role, skill, city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 rounded-xl text-xs"
              />
            </div>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="bg-card border border-input rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="all">All Departments</option>
              <option value="engineering">Engineering</option>
              <option value="product">Product</option>
              <option value="operations">Operations</option>
              <option value="marketing">Marketing</option>
              <option value="business">Business & Vendor Growth</option>
            </select>
          </div>
        </div>

        {/* Job Cards */}
        <div className="space-y-4">
          {filteredJobs.length === 0 ? (
            <div className="text-center py-12 bg-card border border-border rounded-3xl p-8 space-y-3">
              <Briefcase className="w-10 h-10 text-muted-foreground mx-auto opacity-40" />
              <h3 className="font-bold text-base">No open roles matching your criteria</h3>
              <p className="text-xs text-muted-foreground">Try clearing filters or send a general application below.</p>
            </div>
          ) : (
            filteredJobs.map((job) => (
              <div
                key={job.id}
                className="p-6 bg-card border border-border/80 hover:border-amber-500/50 rounded-2xl transition shadow-sm space-y-4 flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                <div className="space-y-2 max-w-2xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold">
                      {job.department}
                    </span>
                    <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground font-semibold flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {job.location}
                    </span>
                    <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground font-semibold flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {job.experience}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-foreground">{job.title}</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {job.description}
                  </p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {job.tags.map((tag, idx) => (
                      <span key={idx} className="text-[10px] px-2 py-0.5 bg-muted/60 text-muted-foreground rounded-md border border-border/40">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="shrink-0">
                  <Button
                    onClick={() => setApplyingJob(job)}
                    className="w-full md:w-auto bg-amber-500 hover:bg-amber-600 text-white font-bold px-5 py-2 rounded-xl text-xs cursor-pointer shadow-md"
                  >
                    Apply Now <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Partner with us prompt */}
      <section className="container mx-auto px-4 py-12 max-w-5xl">
        <div className="bg-gradient-to-r from-amber-500/15 via-background to-orange-500/15 border border-amber-500/30 p-8 rounded-3xl text-center space-y-4">
          <h3 className="text-xl font-bold">Looking to Earn as a Vendor, Franchise or Service Specialist?</h3>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-xl mx-auto">
            If you want to start a local franchise, sell your manufactured products, offer plumbing or electrical services, or list your academy courses, visit our partner portal.
          </p>
          <div className="pt-2">
            <Link to="/earn-with-apexbee">
              <Button className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold px-6 py-2 rounded-xl shadow-md">
                Explore Partner Opportunities →
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Application Modal */}
      <Dialog open={!!applyingJob} onOpenChange={() => setApplyingJob(null)}>
        <DialogContent className="max-w-lg rounded-3xl p-6 sm:p-8">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              Apply for {applyingJob?.title}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {applyingJob?.department} • {applyingJob?.location} • {applyingJob?.type}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleApplySubmit} className="space-y-3.5 mt-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground">Full Name *</label>
              <Input
                required
                placeholder="e.g. Ananya Rao"
                value={applicant.name}
                onChange={(e) => setApplicant({ ...applicant, name: e.target.value })}
                className="rounded-xl text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground">Email *</label>
                <Input
                  required
                  type="email"
                  placeholder="ananya@example.com"
                  value={applicant.email}
                  onChange={(e) => setApplicant({ ...applicant, email: e.target.value })}
                  className="rounded-xl text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground">Phone *</label>
                <Input
                  required
                  placeholder="+91 9876543210"
                  value={applicant.phone}
                  onChange={(e) => setApplicant({ ...applicant, phone: e.target.value })}
                  className="rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground">LinkedIn / GitHub Profile URL *</label>
              <Input
                required
                placeholder="https://linkedin.com/in/username"
                value={applicant.linkedin}
                onChange={(e) => setApplicant({ ...applicant, linkedin: e.target.value })}
                className="rounded-xl text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground">Resume / Portfolio Link (Google Drive / Notion / PDF link)</label>
              <Input
                placeholder="https://drive.google.com/your-resume"
                value={applicant.portfolio}
                onChange={(e) => setApplicant({ ...applicant, portfolio: e.target.value })}
                className="rounded-xl text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground">Why do you want to join ApexBee?</label>
              <textarea
                rows={3}
                placeholder="Briefly tell us about your experience and what excites you..."
                value={applicant.coverNote}
                onChange={(e) => setApplicant({ ...applicant, coverNote: e.target.value })}
                className="w-full bg-background border border-input rounded-xl p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold py-2.5 rounded-xl shadow-md cursor-pointer"
            >
              {isSubmitting ? "Submitting Application..." : "Submit Application 🚀"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default Careers;
