import { Link } from "react-router-dom";
import logo from "../Web images/Web images/logo.png";

const Footer = () => {
  return (
    <footer className="bg-navy-dark text-white mt-16 pb-20 lg:pb-0">
      <div className="container mx-auto px-4 py-12">
        {/* First Row: 5 Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* SECTION 1: About ApexBee (with Logo) */}
          <div className="lg:col-span-1">
            <div className="border-2 border-white rounded-lg p-4 inline-block mb-4">
              <img src={logo} alt="ApexBee Logo" className="w-32 h-auto" />
            </div>
            <p className="text-sm text-gray-300 leading-relaxed mb-4">
              ApexBee is India's growing digital business ecosystem connecting customers, vendors,
              service providers, entrepreneurs, franchise partners, course creators, and local
              businesses through one unified platform.
            </p>
            <ul className="space-y-2 text-sm text-gray-300">
              <li><Link to="/community" className="hover:text-accent">About Us</Link></li>
              <li><Link to="/community" className="hover:text-accent">Our Mission</Link></li>
              <li><Link to="/earn-with-apexbee" className="hover:text-accent">Careers</Link></li>
              <li><Link to="/community" className="hover:text-accent">Press & Media</Link></li>
              <li><Link to="/community" className="hover:text-accent">Contact Us</Link></li>
              <li><Link to="/community" className="hover:text-accent">Blog</Link></li>
              <li><Link to="/community" className="hover:text-accent">Research & Innovation</Link></li>
            </ul>
          </div>

          {/* SECTION 2: Marketplace */}
          <div>
            <h4 className="font-semibold mb-4">Marketplace</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li><Link to="/products" className="hover:text-accent">Shop Products</Link></li>
              <li><Link to="/local-stores" className="hover:text-accent">Local Shops</Link></li>
              <li><Link to="/grocery" className="hover:text-accent">Daily Essentials</Link></li>
              <li><Link to="/products" className="hover:text-accent">Offers & Deals</Link></li>
              <li><Link to="/categories" className="hover:text-accent">Categories</Link></li>
              <li><Link to="/my-orders" className="hover:text-accent">Track Orders</Link></li>
              <li><Link to="/my-orders" className="hover:text-accent">Returns & Refunds</Link></li>
            </ul>

            {/* Popular Searches — these now navigate to category pages */}
            <h5 className="text-sm font-medium text-accent mt-5 mb-2">Popular Searches</h5>
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: "Dining Tables", to: "/category/Furniture" },
                { label: "Sofas", to: "/category/Furniture" },
                { label: "Sarees", to: "/category/Sarees" },
                { label: "Jewelry", to: "/category/Jewelry" },
                { label: "Electronics", to: "/category/Electronics" },
                { label: "Mobiles", to: "/category/Electronics" },
                { label: "Home Decor", to: "/category/Home Decor" },
                { label: "Kitchen", to: "/category/Kitchen" },
                { label: "Groceries", to: "/grocery" },
                { label: "Fashion", to: "/fashion" },
              ].map((item) => (
                <Link
                  key={item.label}
                  to={item.to}
                  className="text-[11px] px-2 py-1 rounded-full border border-gray-600 text-gray-300 hover:border-accent hover:text-accent transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          {/* SECTION 3: Services */}
          <div>
            <h4 className="font-semibold mb-4">Services</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li><Link to="/services" className="hover:text-accent">Home Services</Link></li>
              <li><Link to="/services" className="hover:text-accent">Professional Services</Link></li>
              <li><Link to="/services" className="hover:text-accent">Appliance Repair</Link></li>
              <li><Link to="/services" className="hover:text-accent">AMC Services</Link></li>
              <li><Link to="/services" className="hover:text-accent">Service Booking</Link></li>
              <li><Link to="/earn-with-apexbee" className="hover:text-accent">Become a Service Provider</Link></li>
            </ul>
          </div>

          {/* SECTION 4: Learning & Travel */}
          <div>
            <h4 className="font-semibold mb-4">Learning & Travel</h4>
            <div className="mb-3">
              <h5 className="text-sm font-medium text-accent mb-2">Learning</h5>
              <ul className="space-y-2 text-sm text-gray-300">
                <li><Link to="/academy" className="hover:text-accent">ApexBee Academy</Link></li>
                <li><Link to="/academy" className="hover:text-accent">Courses</Link></li>
                <li><Link to="/academy" className="hover:text-accent">Certifications</Link></li>
                <li><Link to="/academy" className="hover:text-accent">Webinars</Link></li>
                <li><Link to="/academy" className="hover:text-accent">My Learning</Link></li>
              </ul>
            </div>
            <div>
              <h5 className="text-sm font-medium text-accent mb-2">Travel</h5>
              <ul className="space-y-2 text-sm text-gray-300">
                <li><Link to="/travel" className="hover:text-accent">Holiday Packages</Link></li>
                <li><Link to="/travel" className="hover:text-accent">Pilgrimage Tours</Link></li>
                <li><Link to="/travel" className="hover:text-accent">Hotels</Link></li>
                <li><Link to="/travel" className="hover:text-accent">Travel Booking</Link></li>
              </ul>
            </div>
          </div>

          {/* SECTION 5: Earn With ApexBee + Highlighted Button */}
          <div>
            <h4 className="font-semibold mb-4">Earn With ApexBee</h4>
            <ul className="space-y-2 text-sm text-gray-300 mb-4">
              <li><Link to="/earn-with-apexbee" className="hover:text-accent">Become Vendor</Link></li>
              <li><Link to="/earn-with-apexbee" className="hover:text-accent">Become Manufacturer</Link></li>
              <li><Link to="/earn-with-apexbee" className="hover:text-accent">Become Wholesaler</Link></li>
              <li><Link to="/earn-with-apexbee" className="hover:text-accent">Become Entrepreneur</Link></li>
              <li><Link to="/earn-with-apexbee" className="hover:text-accent">Become Franchise Partner</Link></li>
              <li><Link to="/earn-with-apexbee" className="hover:text-accent">Become Delivery Partner</Link></li>
              <li><Link to="/earn-with-apexbee" className="hover:text-accent">Become Course Provider</Link></li>
            </ul>
            <Link
              to="/earn-with-apexbee"
              className="inline-block border-2 border-accent text-accent hover:bg-accent hover:text-navy-dark font-semibold px-4 py-2 rounded-lg transition duration-300"
            >
              Start Earning Today →
            </Link>
          </div>
        </div>

        {/* Second Row: Support, Social+App, Newsletter+Location+Language+Payment */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12 pt-8 border-t border-navy-light">
          {/* SECTION 6: Support */}
          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li><Link to="/community" className="hover:text-accent">Help Center</Link></li>
              <li><Link to="/community" className="hover:text-accent">FAQs</Link></li>
              <li><Link to="/community" className="hover:text-accent">Raise Ticket</Link></li>
              <li><Link to="/community" className="hover:text-accent">Contact Support</Link></li>
              <li><Link to="/community" className="hover:text-accent">Privacy Policy</Link></li>
              <li><Link to="/community" className="hover:text-accent">Terms & Conditions</Link></li>
              <li><Link to="/community" className="hover:text-accent">Return Policy</Link></li>
              <li><Link to="/community" className="hover:text-accent">Cancellation Policy</Link></li>
            </ul>
          </div>

          {/* SOCIAL & APP SECTION */}
          <div>
            <h4 className="font-semibold mb-4">Connect With Us</h4>
            <div className="flex flex-wrap gap-4 mb-6">
              <a href="#" className="hover:text-accent text-sm">Facebook</a>
              <a href="#" className="hover:text-accent text-sm">Instagram</a>
              <a href="#" className="hover:text-accent text-sm">LinkedIn</a>
              <a href="#" className="hover:text-accent text-sm">YouTube</a>
              <a href="#" className="hover:text-accent text-sm">WhatsApp Channel</a>
            </div>

            <h4 className="font-semibold mb-4">Get the App</h4>
            <div className="space-y-2">
              <button className="block w-full text-left border border-gray-600 rounded-lg px-4 py-2 text-sm hover:border-accent transition">
                📱 Download Android App
              </button>
              <button className="block w-full text-left border border-gray-600 rounded-lg px-4 py-2 text-sm hover:border-accent transition">
                🍏 Download iOS App
              </button>
              <div className="border border-gray-600 rounded-lg px-4 py-2 text-sm text-center">
                📲 Scan QR To Download
              </div>
            </div>
          </div>

          {/* NEWSLETTER, LOCATION, LANGUAGE, PAYMENT */}
          <div>
            <h4 className="font-semibold mb-4">Follow ApexBee Updates</h4>
            <div className="mb-6">
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="email"
                  placeholder="Your email address"
                  className="flex-1 bg-navy-light border border-gray-600 rounded-lg px-4 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-accent"
                />
                <button className="bg-accent text-navy-dark font-semibold px-4 py-2 rounded-lg text-sm hover:opacity-90 transition">
                  Subscribe
                </button>
              </div>
            </div>

            <div className="mb-6">
              <h4 className="font-semibold mb-2">📍 Current Location</h4>
              <div className="text-sm text-gray-300">India • Hyderabad (Default)</div>
            </div>

            <div className="mb-6">
              <h4 className="font-semibold mb-2">Language</h4>
              <div className="flex gap-2 text-sm">
                <button className="px-3 py-1 rounded border border-gray-600 hover:border-accent hover:text-accent transition">English</button>
                <button className="px-3 py-1 rounded border border-gray-600 hover:border-accent hover:text-accent transition">తెలుగు</button>
                <button className="px-3 py-1 rounded border border-gray-600 hover:border-accent hover:text-accent transition">हिंदी</button>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Secure Payments</h4>
              <div className="flex flex-wrap gap-3 text-sm">
                <span className="bg-white rounded px-2 py-1 text-navy">UPI</span>
                <span className="bg-white rounded px-2 py-1 text-navy">Razorpay</span>
                <span className="bg-white rounded px-2 py-1 text-navy">Visa</span>
                <span className="bg-white rounded px-2 py-1 text-navy">Mastercard</span>
                <span className="bg-white rounded px-2 py-1 text-navy">RuPay</span>
                <span className="bg-white rounded px-2 py-1 text-navy">Net Banking</span>
              </div>
              <p className="text-xs text-gray-400 mt-2">Razorpay coming soon</p>
            </div>
          </div>
        </div>

        {/* Bottom Footer: Copyright + Additional Links */}
        <div className="border-t border-navy-light mt-8 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-400">© 2026 ApexBee.in — All Rights Reserved</p>
          <div className="flex flex-wrap gap-4 justify-center text-sm">
            <Link to="/community" className="text-gray-400 hover:text-accent">Privacy Policy</Link>
            <Link to="/community" className="text-gray-400 hover:text-accent">Terms</Link>
            <Link to="/community" className="text-gray-400 hover:text-accent">Refund Policy</Link>
            <Link to="/community" className="text-gray-400 hover:text-accent">Franchise Policy</Link>
            <Link to="/community" className="text-gray-400 hover:text-accent">Vendor Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;