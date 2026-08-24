import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowRight, 
  Mail, 
  MapPin, 
  Globe, 
  ShieldCheck, 
  CheckCircle2,
  Smartphone,
  Apple,
  QrCode
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

const logo = "/logo.png";

export const Footer: React.FC = () => {
  const { toast } = useToast();
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [showQrModal, setShowQrModal] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("English");

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail) return;
    toast({
      title: "Subscribed to ApexBee! 📬",
      description: "Thank you for subscribing. You'll receive weekly updates and exclusive deals.",
    });
    setNewsletterEmail("");
  };

  const handleAppDownload = (platform: string) => {
    toast({
      title: `${platform} App Download`,
      description: "Redirecting to official app store download page.",
    });
  };

  return (
    <footer className="bg-stone-950 text-white mt-16 pb-20 lg:pb-0 border-t border-stone-800">
      <div className="container mx-auto px-4 py-12">
        {/* First Row: 5 Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          
          {/* SECTION 1: About ApexBee (with Logo & Registered Office) */}
          <div className="lg:col-span-1 space-y-4">
            <Link to="/" className="inline-block">
              <div className="border border-amber-500/30 rounded-xl p-3 bg-stone-900 inline-block hover:border-amber-500/60 transition">
                <img src={logo} alt="ApexBee Logo" className="w-28 h-auto object-contain" />
              </div>
            </Link>
            <p className="text-xs text-stone-300 leading-relaxed">
              ApexBee is India's growing digital business ecosystem connecting customers, vendors,
              service providers, entrepreneurs, franchise partners, course creators, and local
              businesses through one unified platform.
            </p>

            {/* Registered Entity Box */}
            <div className="p-3 rounded-xl bg-stone-900/90 border border-stone-800 space-y-1.5 text-[11px] text-stone-400">
              <div className="font-bold text-white text-xs text-amber-400">APEXBEE TECHNOLOGIES PRIVATE LIMITED</div>
              <p className="leading-snug">
                4-1-28, SR MASTHAN STREET, REVENUE WARD 2, Buchireddypalem, Buchireddipalem Mandalam, Nellore- 524305, Andhra Pradesh.
              </p>
              <div className="pt-1 text-stone-300 flex items-center gap-1.5 font-medium">
                <Mail className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <a href="mailto:info@apexbee.in" className="hover:text-amber-400 text-amber-300 transition underline underline-offset-2">info@apexbee.in</a>
              </div>
            </div>

            <ul className="space-y-2 text-xs text-stone-400">
              <li><Link to="/about" className="hover:text-amber-400 transition">About Us</Link></li>
              <li><Link to="/about" className="hover:text-amber-400 transition">Our Mission & Vision</Link></li>
              <li><Link to="/careers" className="hover:text-amber-400 transition">Careers <span className="text-[10px] px-1.5 py-0.2 bg-amber-500/20 text-amber-400 rounded-md font-bold ml-1">We're Hiring</span></Link></li>
              <li><Link to="/press" className="hover:text-amber-400 transition">Press & Media</Link></li>
              <li><Link to="/contact" className="hover:text-amber-400 transition">Contact Us</Link></li>
              <li><Link to="/blog" className="hover:text-amber-400 transition">ApexBee Blog & Insights</Link></li>
              <li><Link to="/about" className="hover:text-amber-400 transition">Research & Innovation</Link></li>
              <li><Link to="/community" className="hover:text-amber-400 transition">Community & Forum</Link></li>
            </ul>
          </div>

          {/* SECTION 2: Marketplace */}
          <div className="space-y-4">
            <h4 className="font-bold text-sm text-white tracking-wide uppercase">Marketplace</h4>
            <ul className="space-y-2 text-xs text-stone-400">
              <li><Link to="/products" className="hover:text-amber-400 transition">Shop Products</Link></li>
              <li><Link to="/local-stores" className="hover:text-amber-400 transition">Local Shops & Kiranas</Link></li>
              <li><Link to="/grocery" className="hover:text-amber-400 transition">Daily Essentials (15-Min)</Link></li>
              <li><Link to="/food" className="hover:text-amber-400 transition">Food & Dining</Link></li>
              <li><Link to="/products" className="hover:text-amber-400 transition">Offers & Hot Deals</Link></li>
              <li><Link to="/categories" className="hover:text-amber-400 transition">All Categories</Link></li>
              <li><Link to="/my-orders" className="hover:text-amber-400 transition">Track Active Orders</Link></li>
              <li><Link to="/return-policy" className="hover:text-amber-400 transition">Returns & Refunds</Link></li>
            </ul>

            {/* Popular Searches */}
            <div className="pt-2">
              <h5 className="text-[11px] font-bold text-amber-400 uppercase tracking-wider mb-2">Popular Searches</h5>
              <div className="flex flex-wrap gap-1">
                {[
                  { label: "Dining Tables", to: "/category/Furniture" },
                  { label: "Sofas", to: "/category/Furniture" },
                  { label: "Sarees", to: "/category/Sarees" },
                  { label: "Jewelry", to: "/category/Jewelry" },
                  { label: "Electronics", to: "/category/Electronics" },
                  { label: "Mobiles", to: "/category/Electronics" },
                  { label: "Home Decor", to: "/category/Home%20Decor" },
                  { label: "Kitchen", to: "/category/Kitchen" },
                  { label: "Groceries", to: "/grocery" },
                  { label: "Fashion", to: "/fashion" },
                ].map((item) => (
                  <Link
                    key={item.label}
                    to={item.to}
                    className="text-[10px] px-2 py-0.5 rounded-full border border-stone-800 bg-stone-900/60 text-stone-300 hover:border-amber-400 hover:text-amber-400 transition"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* SECTION 3: Services & Food */}
          <div className="space-y-4">
            <h4 className="font-bold text-sm text-white tracking-wide uppercase">Services & Dining</h4>
            <ul className="space-y-2 text-xs text-stone-400">
              <li><Link to="/services" className="hover:text-amber-400 transition">Home Services</Link></li>
              <li><Link to="/services" className="hover:text-amber-400 transition">Electricians & Plumbers</Link></li>
              <li><Link to="/services" className="hover:text-amber-400 transition">Appliance Repair (AC, TV, RO)</Link></li>
              <li><Link to="/services" className="hover:text-amber-400 transition">Annual Maintenance (AMC)</Link></li>
              <li><Link to="/services" className="hover:text-amber-400 transition">Service Booking & Schedules</Link></li>
              <li><Link to="/food" className="hover:text-amber-400 transition">Express Food Delivery</Link></li>
              <li><Link to="/food" className="hover:text-amber-400 transition">Dineout Table Reservation</Link></li>
              <li><Link to="/earn-with-apexbee" className="hover:text-amber-400 transition">Become a Service Specialist</Link></li>
            </ul>
          </div>

          {/* SECTION 4: Learning & Travel */}
          <div className="space-y-4">
            <h4 className="font-bold text-sm text-white tracking-wide uppercase">Learning & Travel</h4>
            <div className="space-y-2">
              <h5 className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">ApexBee Academy</h5>
              <ul className="space-y-1.5 text-xs text-stone-400">
                <li><Link to="/academy" className="hover:text-amber-400 transition">Academy Hub</Link></li>
                <li><Link to="/academy" className="hover:text-amber-400 transition">Skill Development Courses</Link></li>
                <li><Link to="/academy" className="hover:text-amber-400 transition">Verified Certifications</Link></li>
                <li><Link to="/academy" className="hover:text-amber-400 transition">Entrepreneurship Modules</Link></li>
              </ul>
            </div>
            <div className="space-y-2 pt-2">
              <h5 className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">ApexBee Travel</h5>
              <ul className="space-y-1.5 text-xs text-stone-400">
                <li><Link to="/travel" className="hover:text-amber-400 transition">Pilgrimage VIP Tours</Link></li>
                <li><Link to="/travel" className="hover:text-amber-400 transition">Holiday & Weekend Getaways</Link></li>
                <li><Link to="/travel" className="hover:text-amber-400 transition">Hotel Booking & Vouchers</Link></li>
                <li><Link to="/travel" className="hover:text-amber-400 transition">Customized Itineraries</Link></li>
              </ul>
            </div>
          </div>

          {/* SECTION 5: Earn With ApexBee */}
          <div className="space-y-4">
            <h4 className="font-bold text-sm text-white tracking-wide uppercase">Earn With ApexBee</h4>
            <ul className="space-y-2 text-xs text-stone-400">
              <li><Link to="/earn-with-apexbee" className="hover:text-amber-400 transition">Become a Vendor / Seller</Link></li>
              <li><Link to="/earn-with-apexbee" className="hover:text-amber-400 transition">Become a Manufacturer</Link></li>
              <li><Link to="/earn-with-apexbee" className="hover:text-amber-400 transition">Become a Wholesaler</Link></li>
              <li><Link to="/earn-with-apexbee" className="hover:text-amber-400 transition">Mandal / District Franchise</Link></li>
              <li><Link to="/earn-with-apexbee" className="hover:text-amber-400 transition">Become a Delivery Partner</Link></li>
              <li><Link to="/earn-with-apexbee" className="hover:text-amber-400 transition">Become a Course Creator</Link></li>
              <li><Link to="/referrals" className="hover:text-amber-400 transition">Refer & Earn Program</Link></li>
            </ul>
            <Link
              to="/earn-with-apexbee"
              className="inline-flex items-center gap-1.5 border border-amber-500 bg-amber-500/10 text-amber-400 hover:bg-amber-500 hover:text-stone-950 font-bold px-3.5 py-2 rounded-xl text-xs transition duration-300 shadow-md"
            >
              <span>Start Earning Today</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Second Row: Support & Governance, Connect & Grievance & App, Newsletter & Location */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12 pt-8 border-t border-stone-800">
          
          {/* Support Section */}
          <div className="space-y-3">
            <h4 className="font-bold text-sm text-white tracking-wide uppercase">Support & Governance</h4>
            <ul className="space-y-2 text-xs text-stone-400">
              <li><Link to="/help" className="hover:text-amber-400 transition">Help Center</Link></li>
              <li><Link to="/faqs" className="hover:text-amber-400 transition">Frequently Asked Questions (FAQs)</Link></li>
              <li><Link to="/contact" className="hover:text-amber-400 transition">Raise a Support Ticket</Link></li>
              <li><Link to="/contact" className="hover:text-amber-400 transition">Contact Customer Care</Link></li>
              <li><Link to="/privacy-policy" className="hover:text-amber-400 transition">Privacy Policy (DPDPA 2023)</Link></li>
              <li><Link to="/business-partner-policy" className="hover:text-amber-400 transition">Business Partner Terms & Privacy</Link></li>
              <li><Link to="/terms-conditions" className="hover:text-amber-400 transition">Terms & Conditions</Link></li>
              <li><Link to="/return-policy" className="hover:text-amber-400 transition">Return & Refund Policy</Link></li>
              <li><Link to="/cancellation-policy" className="hover:text-amber-400 transition">Cancellation Policy</Link></li>
              <li><Link to="/franchise-policy" className="hover:text-amber-400 transition">Franchise Partner Policy</Link></li>
              <li><Link to="/vendor-policy" className="hover:text-amber-400 transition">Vendor Code of Conduct</Link></li>
            </ul>
          </div>

          {/* Middle Container: Social Media Platform Icons, Grievance Redressal Officer & Mobile App Download */}
          <div className="space-y-5">
            <div>
              <h4 className="font-bold text-sm text-white tracking-wide uppercase mb-3 flex items-center gap-2">
                <span>Connect With Us</span>
              </h4>
              
              {/* Modern Social Media Platform Icons */}
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-3">
                {/* Facebook */}
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Follow ApexBee on Facebook"
                  className="group flex items-center gap-2 px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 hover:border-blue-500 hover:bg-blue-500/10 transition-all duration-200"
                >
                  <div className="w-7 h-7 rounded-lg bg-[#1877F2]/15 text-[#1877F2] flex items-center justify-center group-hover:scale-110 group-hover:bg-[#1877F2] group-hover:text-white transition">
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </div>
                  <span className="text-xs font-medium text-stone-300 group-hover:text-white">Facebook</span>
                </a>

                {/* Instagram */}
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Follow ApexBee on Instagram"
                  className="group flex items-center gap-2 px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 hover:border-pink-500 hover:bg-pink-500/10 transition-all duration-200"
                >
                  <div className="w-7 h-7 rounded-lg bg-[#E4405F]/15 text-[#E4405F] flex items-center justify-center group-hover:scale-110 group-hover:bg-[#E4405F] group-hover:text-white transition">
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                  </div>
                  <span className="text-xs font-medium text-stone-300 group-hover:text-white">Instagram</span>
                </a>

                {/* LinkedIn */}
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Connect on LinkedIn"
                  className="group flex items-center gap-2 px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 hover:border-sky-500 hover:bg-sky-500/10 transition-all duration-200"
                >
                  <div className="w-7 h-7 rounded-lg bg-[#0A66C2]/15 text-[#0A66C2] flex items-center justify-center group-hover:scale-110 group-hover:bg-[#0A66C2] group-hover:text-white transition">
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                    </svg>
                  </div>
                  <span className="text-xs font-medium text-stone-300 group-hover:text-white">LinkedIn</span>
                </a>

                {/* YouTube */}
                <a
                  href="https://youtube.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Subscribe to ApexBee on YouTube"
                  className="group flex items-center gap-2 px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 hover:border-red-500 hover:bg-red-500/10 transition-all duration-200"
                >
                  <div className="w-7 h-7 rounded-lg bg-[#FF0000]/15 text-[#FF0000] flex items-center justify-center group-hover:scale-110 group-hover:bg-[#FF0000] group-hover:text-white transition">
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                  </div>
                  <span className="text-xs font-medium text-stone-300 group-hover:text-white">YouTube</span>
                </a>

                {/* WhatsApp */}
                <a
                  href="https://wa.me/918008812345"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Connect on WhatsApp Channel"
                  className="group flex items-center gap-2 px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 hover:border-emerald-500 hover:bg-emerald-500/10 transition-all duration-200"
                >
                  <div className="w-7 h-7 rounded-lg bg-[#25D366]/15 text-[#25D366] flex items-center justify-center group-hover:scale-110 group-hover:bg-[#25D366] group-hover:text-white transition">
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                    </svg>
                  </div>
                  <span className="text-xs font-medium text-stone-300 group-hover:text-white">WhatsApp</span>
                </a>

                {/* X (formerly Twitter) */}
                <a
                  href="https://x.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Follow ApexBee on X"
                  className="group flex items-center gap-2 px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 hover:border-stone-400 hover:bg-stone-800 transition-all duration-200"
                >
                  <div className="w-7 h-7 rounded-lg bg-stone-800 text-stone-200 flex items-center justify-center group-hover:scale-110 group-hover:bg-white group-hover:text-black transition">
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                  </div>
                  <span className="text-xs font-medium text-stone-300 group-hover:text-white">X (Twitter)</span>
                </a>
              </div>
            </div>

            {/* Grievance Redressal Officer in Middle Container */}
            <div className="p-3.5 rounded-2xl bg-stone-900/90 border border-amber-500/20 space-y-1.5 text-xs text-stone-300 shadow-sm">
              <div className="flex items-center gap-1.5 font-bold text-amber-400 text-xs uppercase tracking-wide">
                <ShieldCheck className="w-3.5 h-3.5" /> Grievance Redressal Officer
              </div>
              <div className="text-[11px] space-y-1 text-stone-400">
                <p><strong className="text-stone-200">Officer:</strong> Guru Swamy k</p>
                <p>
                  <strong className="text-stone-200">Email:</strong>{" "}
                  <a href="mailto:gvguru27@gmail.com" className="text-amber-400 hover:underline">
                    gvguru27@gmail.com
                  </a>
                </p>
                <p className="leading-tight">
                  <strong className="text-stone-200">Address:</strong> 4-1-28, SR MASTHAN STREET, REVENUE WARD 2, Buchireddypalem, Buchireddipalem Mandalam, Nellore- 524305, Andhra Pradesh
                </p>
                <p className="text-emerald-400 font-semibold pt-0.5">Response SLA: Within 48 hours</p>
              </div>
            </div>

            <div className="pt-1">
              <h4 className="font-bold text-sm text-white tracking-wide uppercase mb-2">Get the ApexBee App</h4>
              <div className="space-y-2">
                <button
                  onClick={() => handleAppDownload("Android")}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-stone-900 border border-stone-800 hover:border-amber-400 transition text-xs font-semibold text-stone-200 cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-emerald-400" /> Download Android APK / Play Store
                  </span>
                  <span className="text-[10px] text-stone-400">Free</span>
                </button>
                <button
                  onClick={() => handleAppDownload("iOS")}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-stone-900 border border-stone-800 hover:border-amber-400 transition text-xs font-semibold text-stone-200 cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Apple className="w-4 h-4 text-stone-300" /> Download iOS App Store
                  </span>
                  <span className="text-[10px] text-stone-400">iOS 14+</span>
                </button>
                <button
                  onClick={() => setShowQrModal(true)}
                  className="w-full flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 transition text-xs font-bold text-amber-400 cursor-pointer"
                >
                  <QrCode className="w-4 h-4" /> Scan QR To Download Directly
                </button>
              </div>
            </div>
          </div>

          {/* Newsletter, Location, Language & Payment */}
          <div className="space-y-4">
            <div>
              <h4 className="font-bold text-sm text-white tracking-wide uppercase mb-2">Follow ApexBee Updates</h4>
              <form onSubmit={handleSubscribe} className="flex gap-2">
                <input
                  type="email"
                  required
                  placeholder="Your email address"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  className="flex-1 bg-stone-900 border border-stone-800 rounded-xl px-3 py-2 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-amber-400"
                />
                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold px-4 py-2 rounded-xl text-xs transition cursor-pointer shadow"
                >
                  Subscribe
                </button>
              </form>
            </div>

            <div>
              <h4 className="font-bold text-xs text-stone-300 mb-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-amber-400" /> Registered Corporate Hub
              </h4>
              <div className="text-xs text-stone-400">
                APEXBEE TECHNOLOGIES PVT LTD • Buchireddypalem, Nellore, Andhra Pradesh - 524305
              </div>
            </div>

            <div>
              <h4 className="font-bold text-xs text-stone-300 mb-1 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-amber-400" /> Language / భాష
              </h4>
              <div className="flex gap-1.5 text-xs">
                {["English", "తెలుగు", "हिंदी"].map((lang) => (
                  <button
                    key={lang}
                    onClick={() => {
                      setSelectedLanguage(lang);
                      toast({ title: `Language Changed`, description: `Display language set to ${lang}.` });
                    }}
                    className={`px-2.5 py-1 rounded-lg border text-xs transition cursor-pointer ${
                      selectedLanguage === lang
                        ? "bg-amber-500 text-stone-950 border-amber-500 font-bold"
                        : "border-stone-800 bg-stone-900 text-stone-400 hover:border-amber-400 hover:text-white"
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-1">
              <h4 className="font-bold text-xs text-stone-300 mb-2 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> 100% Secure Payments
              </h4>
              <div className="flex flex-wrap gap-1.5 text-[10px]">
                <span className="bg-stone-900 border border-stone-800 rounded px-2 py-0.5 text-stone-300 font-bold">UPI</span>
                <span className="bg-stone-900 border border-stone-800 rounded px-2 py-0.5 text-stone-300 font-bold">Google Pay</span>
                <span className="bg-stone-900 border border-stone-800 rounded px-2 py-0.5 text-stone-300 font-bold">PhonePe</span>
                <span className="bg-stone-900 border border-stone-800 rounded px-2 py-0.5 text-stone-300 font-bold">Paytm</span>
                <span className="bg-stone-900 border border-stone-800 rounded px-2 py-0.5 text-stone-300 font-bold">Visa</span>
                <span className="bg-stone-900 border border-stone-800 rounded px-2 py-0.5 text-stone-300 font-bold">Mastercard</span>
                <span className="bg-stone-900 border border-stone-800 rounded px-2 py-0.5 text-stone-300 font-bold">RuPay</span>
                <span className="bg-stone-900 border border-stone-800 rounded px-2 py-0.5 text-stone-300 font-bold">Net Banking</span>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="border-t border-stone-800 mt-8 pt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
          <p className="text-stone-400">© 2026 APEXBEE TECHNOLOGIES PRIVATE LIMITED — All Rights Reserved. Empowering Bharat MSMEs.</p>
          <div className="flex flex-wrap gap-4 justify-center text-xs">
            <Link to="/privacy-policy" className="text-stone-400 hover:text-amber-400 transition">Privacy Policy</Link>
            <Link to="/business-partner-policy" className="text-stone-400 hover:text-amber-400 transition">Business Partner Terms</Link>
            <Link to="/terms-conditions" className="text-stone-400 hover:text-amber-400 transition">Terms of Service</Link>
          </div>
        </div>
      </div>

      {/* QR Code Dialog Modal */}
      <Dialog open={showQrModal} onOpenChange={setShowQrModal}>
        <DialogContent className="max-w-xs rounded-3xl p-6 text-center space-y-4">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-center">
              Scan to Download ApexBee
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground text-center">
              Point your smartphone camera to download Android APK / iOS App instantly.
            </DialogDescription>
          </DialogHeader>

          <div className="p-4 bg-white rounded-2xl mx-auto border shadow-inner inline-block">
            {/* Clean SVG QR code representation */}
            <svg viewBox="0 0 100 100" className="w-40 h-40">
              <rect width="100" height="100" fill="white" />
              {/* Corner 1 */}
              <rect x="10" y="10" width="25" height="25" fill="#000" />
              <rect x="15" y="15" width="15" height="15" fill="#fff" />
              <rect x="18" y="18" width="9" height="9" fill="#000" />
              {/* Corner 2 */}
              <rect x="65" y="10" width="25" height="25" fill="#000" />
              <rect x="70" y="15" width="15" height="15" fill="#fff" />
              <rect x="73" y="18" width="9" height="9" fill="#000" />
              {/* Corner 3 */}
              <rect x="10" y="65" width="25" height="25" fill="#000" />
              <rect x="15" y="70" width="15" height="15" fill="#fff" />
              <rect x="18" y="73" width="9" height="9" fill="#000" />
              {/* Grid dots */}
              <rect x="42" y="12" width="6" height="6" fill="#f59e0b" />
              <rect x="52" y="12" width="6" height="6" fill="#000" />
              <rect x="42" y="24" width="6" height="6" fill="#000" />
              <rect x="52" y="24" width="6" height="6" fill="#f59e0b" />
              <rect x="12" y="42" width="6" height="6" fill="#000" />
              <rect x="24" y="42" width="6" height="6" fill="#f59e0b" />
              <rect x="42" y="42" width="16" height="16" fill="#f59e0b" />
              <rect x="65" y="42" width="6" height="6" fill="#000" />
              <rect x="75" y="42" width="6" height="6" fill="#000" />
              <rect x="85" y="52" width="6" height="6" fill="#f59e0b" />
              <rect x="42" y="65" width="6" height="6" fill="#000" />
              <rect x="52" y="75" width="6" height="6" fill="#000" />
              <rect x="65" y="65" width="25" height="6" fill="#000" />
              <rect x="65" y="75" width="12" height="12" fill="#f59e0b" />
              <rect x="80" y="80" width="10" height="10" fill="#000" />
            </svg>
          </div>

          <p className="text-[11px] text-muted-foreground">
            Compatible with Android 8.0+ & iOS 14.0+
          </p>
        </DialogContent>
      </Dialog>
    </footer>
  );
};

export default Footer;