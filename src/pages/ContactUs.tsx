import React, { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { 
  Mail, 
  Phone, 
  MapPin, 
  Clock, 
  Send, 
  MessageSquare, 
  HelpCircle, 
  Headphones, 
  Building, 
  CheckCircle2, 
  Sparkles,
  Ticket,
  ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

export const ContactUs: React.FC = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "General Enquiry",
    category: "customer_support",
    orderId: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedTicketId, setSubmittedTicketId] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      toast({
        title: "Incomplete Details",
        description: "Please fill out your Name, Email, and Message.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    // Simulate sending ticket
    setTimeout(() => {
      setIsSubmitting(false);
      const generatedTicket = `TKT-${Math.floor(100000 + Math.random() * 900000)}`;
      setSubmittedTicketId(generatedTicket);
      toast({
        title: "Ticket Raised Successfully! 🚀",
        description: `Reference: ${generatedTicket}. Our team will respond within 2-4 business hours.`,
      });
      setFormData({
        name: "",
        email: "",
        phone: "",
        subject: "General Enquiry",
        category: "customer_support",
        orderId: "",
        message: "",
      });
    }, 1000);
  };

  const offices = [
    {
      city: "Hyderabad (HQ)",
      type: "Global Headquarters & Tech Hub",
      address: "ApexBee Tower, HITEC City, Madhapur, Hyderabad, Telangana - 500081",
      email: "hyderabad@apexbee.in",
      phone: "+91 80088 12345",
    },
    {
      city: "Vijayawada",
      type: "Regional Franchise Operations Hub",
      address: "MG Road, Benz Circle, Vijayawada, Andhra Pradesh - 520010",
      email: "ap.ops@apexbee.in",
      phone: "+91 80088 12346",
    },
    {
      city: "Bengaluru",
      type: "R&D & Logistics Innovation Lab",
      address: "Indiranagar 100 Feet Road, Bengaluru, Karnataka - 560038",
      email: "blr@apexbee.in",
      phone: "+91 80088 12347",
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-amber-500 selection:text-white">
      <Navbar />

      {/* Header */}
      <section className="bg-gradient-to-b from-amber-500/10 via-background to-background py-14 border-b border-border/40">
        <div className="container mx-auto px-4 max-w-4xl text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold uppercase tracking-wider">
            <Headphones className="w-3.5 h-3.5" /> 24x7 Customer & Partner Support
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight">
            We're Here to <span className="bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">Help You</span>
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base max-w-2xl mx-auto">
            Have a question about your order, vendor onboarding, franchise partnership, or service booking? Reach out to our dedicated support teams.
          </p>
        </div>
      </section>

      {/* Quick Channels Cards */}
      <section className="container mx-auto px-4 -mt-6 relative z-10 max-w-5xl">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 bg-card border border-border rounded-2xl shadow-md space-y-2 hover:border-amber-500/40 transition">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Phone className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm">Customer Helpline</h3>
            <p className="text-xs text-muted-foreground">Mon-Sun, 7:00 AM - 11:00 PM</p>
            <a href="tel:18001234567" className="text-xs font-bold text-amber-500 hover:underline block pt-1">
              1800-123-4567 (Toll Free)
            </a>
          </div>

          <div className="p-5 bg-card border border-border rounded-2xl shadow-md space-y-2 hover:border-amber-500/40 transition">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center">
              <Building className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm">Vendor & Franchise Desk</h3>
            <p className="text-xs text-muted-foreground">Partner onboarding & settlements</p>
            <a href="tel:+918008812345" className="text-xs font-bold text-orange-500 hover:underline block pt-1">
              +91 80088 12345
            </a>
          </div>

          <div className="p-5 bg-card border border-border rounded-2xl shadow-md space-y-2 hover:border-amber-500/40 transition">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <Mail className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm">Support Email</h3>
            <p className="text-xs text-muted-foreground">Ticket tracking & grievance</p>
            <a href="mailto:support@apexbee.in" className="text-xs font-bold text-emerald-500 hover:underline block pt-1">
              support@apexbee.in
            </a>
          </div>

          <div className="p-5 bg-card border border-border rounded-2xl shadow-md space-y-2 hover:border-amber-500/40 transition">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm">WhatsApp Support</h3>
            <p className="text-xs text-muted-foreground">Instant order updates</p>
            <a href="https://wa.me/918008812345" target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-blue-500 hover:underline block pt-1">
              Chat on WhatsApp →
            </a>
          </div>
        </div>
      </section>

      {/* Main Section: Ticket Form & Office Info */}
      <section className="container mx-auto px-4 py-14 max-w-5xl">
        <div className="grid lg:grid-cols-12 gap-8">
          {/* Form / Raise Ticket */}
          <div className="lg:col-span-7 bg-card border border-border/80 p-6 sm:p-8 rounded-3xl shadow-sm space-y-6">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-500 uppercase tracking-wider mb-1">
                <Ticket className="w-3.5 h-3.5" /> Support Ticket Portal
              </div>
              <h2 className="text-2xl font-bold">Raise a Ticket or Send an Inquiry</h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Our support executives usually respond in under 2 hours during active business hours.
              </p>
            </div>

            {submittedTicketId && (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <div className="font-bold text-emerald-600 dark:text-emerald-400">
                    Your request has been logged! ID: {submittedTicketId}
                  </div>
                  <div className="text-muted-foreground">
                    A confirmation email has been dispatched. You can track this in your account support dashboard.
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground">Your Full Name *</label>
                  <Input
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground">Email Address *</label>
                  <Input
                    required
                    type="email"
                    placeholder="name@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="rounded-xl"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground">Phone Number</label>
                  <Input
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground">Query Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-background border border-input rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="customer_support">Order / Delivery Support</option>
                    <option value="refund_return">Return & Refund Status</option>
                    <option value="vendor_onboarding">Merchant / Vendor Onboarding</option>
                    <option value="franchise_inquiry">Franchise Partnership Opportunity</option>
                    <option value="service_provider">Service Technician Registration</option>
                    <option value="academy_course">Academy & Course Certification</option>
                    <option value="billing_wallet">Wallet & Payment Transaction</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground">Order ID / Reference (Optional)</label>
                <Input
                  placeholder="e.g. APX-982314 or Partner ID"
                  value={formData.orderId}
                  onChange={(e) => setFormData({ ...formData, orderId: e.target.value })}
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground">Detailed Message / Description *</label>
                <Textarea
                  required
                  rows={4}
                  placeholder="Please describe your issue, feedback, or business proposal..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="rounded-xl"
                />
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold py-3 rounded-xl shadow-md transition cursor-pointer"
              >
                {isSubmitting ? "Submitting Ticket..." : (
                  <span className="flex items-center justify-center gap-2">
                    <Send className="w-4 h-4" /> Submit Support Request
                  </span>
                )}
              </Button>
            </form>
          </div>

          {/* Right Side: Office Locations & Quick Links */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-card border border-border/80 p-6 rounded-3xl space-y-4">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <MapPin className="w-5 h-5 text-amber-500" /> Regional Offices
              </h3>
              <div className="space-y-4 text-xs">
                {offices.map((office, idx) => (
                  <div key={idx} className="p-3.5 rounded-2xl bg-muted/40 border border-border/50 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-foreground">{office.city}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 font-bold">
                        {office.type}
                      </span>
                    </div>
                    <p className="text-muted-foreground">{office.address}</p>
                    <div className="pt-1 flex flex-wrap gap-3 text-muted-foreground font-medium">
                      <span>📞 {office.phone}</span>
                      <span>✉ {office.email}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Link Card */}
            <div className="bg-gradient-to-tr from-amber-500/15 via-background to-orange-500/10 border border-amber-500/30 p-6 rounded-3xl space-y-3">
              <h4 className="font-bold text-base flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-amber-500" /> Have Instant Questions?
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Check our interactive Help Center for instant answers on tracking, refund policies, wallet redemptions, and franchise criteria.
              </p>
              <div className="pt-2 flex flex-col gap-2">
                <Link to="/help">
                  <Button variant="outline" className="w-full text-xs font-bold rounded-xl justify-between">
                    Browse Help Center & FAQs <ExternalLink className="w-3.5 h-3.5" />
                  </Button>
                </Link>
                <Link to="/earn-with-apexbee">
                  <Button variant="outline" className="w-full text-xs font-bold rounded-xl justify-between">
                    Franchise & Partner Desk <ExternalLink className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ContactUs;
