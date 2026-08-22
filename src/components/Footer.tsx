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
          
          {/* SECTION 1: About ApexBee (with Logo) */}
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

        {/* Second Row: Support, Connect & App, Newsletter & Location */}
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

          {/* Social & Mobile App Download */}
          <div className="space-y-4">
            <div>
              <h4 className="font-bold text-sm text-white tracking-wide uppercase mb-3">Connect With Us</h4>
              <div className="flex flex-wrap gap-2 text-xs text-stone-300">
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="px-2.5 py-1 rounded-lg bg-stone-900 border border-stone-800 hover:border-amber-400 hover:text-amber-400 transition">
                  Facebook
                </a>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="px-2.5 py-1 rounded-lg bg-stone-900 border border-stone-800 hover:border-amber-400 hover:text-amber-400 transition">
                  Instagram
                </a>
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="px-2.5 py-1 rounded-lg bg-stone-900 border border-stone-800 hover:border-amber-400 hover:text-amber-400 transition">
                  LinkedIn
                </a>
                <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="px-2.5 py-1 rounded-lg bg-stone-900 border border-stone-800 hover:border-amber-400 hover:text-amber-400 transition">
                  YouTube
                </a>
                <a href="https://wa.me/918008812345" target="_blank" rel="noopener noreferrer" className="px-2.5 py-1 rounded-lg bg-emerald-950/60 border border-emerald-800/60 text-emerald-400 hover:border-emerald-400 transition">
                  WhatsApp Channel
                </a>
              </div>
            </div>

            <div className="pt-2">
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
                <MapPin className="w-3.5 h-3.5 text-amber-400" /> Current Service Hub
              </h4>
              <div className="text-xs text-stone-400">India • Hyderabad, Telangana & Andhra Pradesh</div>
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
          <p className="text-stone-400">© 2026 ApexBee.in — All Rights Reserved. Empowering Bharat MSMEs.</p>
          <div className="flex flex-wrap gap-4 justify-center text-xs">
            <Link to="/privacy-policy" className="text-stone-400 hover:text-amber-400 transition">Privacy Policy</Link>
            <Link to="/business-partner-policy" className="text-stone-400 hover:text-amber-400 transition">Business Partner Terms</Link>
            <Link to="/terms-conditions" className="text-stone-400 hover:text-amber-400 transition">Terms of Service</Link>
            <Link to="/return-policy" className="text-stone-400 hover:text-amber-400 transition">Refund Policy</Link>
            <Link to="/franchise-policy" className="text-stone-400 hover:text-amber-400 transition">Franchise Agreement</Link>
            <Link to="/vendor-policy" className="text-stone-400 hover:text-amber-400 transition">Vendor Policy</Link>
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