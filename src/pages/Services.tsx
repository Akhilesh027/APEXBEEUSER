// src/pages/Services.tsx — Service Marketplace (Live Backend + Premium UI Redesign)
import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Wrench, Zap, Snowflake, Monitor, Briefcase, Car, Star, MapPin, Clock,
  ShieldCheck, PhoneCall, Calendar, CheckCircle, FileText, AlertTriangle,
  ArrowRight, Loader2, Search, Wifi, Home, Truck, RefreshCcw, X, Filter,
  Sparkles, Bug, Flame, ChevronLeft, ChevronRight, Tag, Eye, Plus, Check,
  Award, CreditCard, ChevronDown, CheckCircle2
} from "lucide-react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "https://server.apexbee.in/api";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface ServiceItem {
  id?: string;
  name: string;
  category: string;
  type: string;
  price: number;
  duration: string;
  description?: string;
  imageUrl?: string;
  tags?: string[];
  active: boolean;
  discountPrice?: number;
  warranty?: string;
  included?: string[];
  excluded?: string[];
  cancellationPolicy?: string;
}

interface AvailabilityDay {
  day: string;
  active: boolean;
  start: string;
  end: string;
}

interface Provider {
  userId: string;
  _id: string;
  providerCode: string;
  businessName: string;
  ownerName: string;
  profilePhoto?: string;
  serviceCategory: string[];
  serviceSubCategory?: string[];
  experience?: string;
  description?: string;
  district?: string;
  mandal?: string;
  address: string;
  pincode: string;
  rating?: number;
  availability?: {
    weeklySchedule: AvailabilityDay[];
    emergencyActive: boolean;
    holidays: { date: string; name: string }[];
  };
  services: ServiceItem[];
  status: string;
}

// ─────────────────────────────────────────────
// HERO SLIDER BANNERS
// ─────────────────────────────────────────────
const HERO_BANNERS = [
  {
    id: 1,
    title: "Expert Home Services At Your Doorstep",
    subtitle: "Book verified plumbers, electricians, AC technicians & home cleaners in under 60 seconds",
    discount: "FLAT ₹150 OFF",
    code: "APEXEXPERT",
    image: "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?q=80&w=1200&auto=format&fit=crop",
    gradient: "from-blue-900 via-indigo-950 to-slate-950",
    tag: "⚡ 24/7 EMERGENCY ACTIVE",
  },
  {
    id: 2,
    title: "Split & Window AC Jet Servicing",
    subtitle: "High-pressure jet wash, anti-bacterial foam & free gas leak checkup by certified engineers",
    discount: "SPECIAL @ ₹399",
    code: "COOLSUMMER",
    image: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?q=80&w=1200&auto=format&fit=crop",
    gradient: "from-cyan-900 via-blue-950 to-slate-950",
    tag: "❄️ APPLIANCE FEST",
  },
  {
    id: 3,
    title: "Licensed Master Electrical Solutions",
    subtitle: "Short circuit troubleshooting, heavy MCB fittings & full room concealed wiring with 90-day warranty",
    discount: "UP TO 30% OFF",
    code: "VOLTSAFE",
    image: "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?q=80&w=1200&auto=format&fit=crop",
    gradient: "from-amber-800 via-orange-950 to-slate-950",
    tag: "🛡️ 90-DAY WARRANTY",
  },
];

// ─────────────────────────────────────────────
// Category Definitions
// ─────────────────────────────────────────────
const CATEGORIES = [
  { id: "", name: "All Services", icon: <Home className="w-5 h-5" />, color: "from-slate-600 to-slate-800", image: "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?q=80&w=300", count: "100+ Pros", desc: "Complete home repair" },
  { id: "Appliance Repair", name: "Appliance Repair", icon: <Snowflake className="w-5 h-5" />, color: "from-cyan-500 to-blue-600", image: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?q=80&w=300", count: "40+ Pros", desc: "AC, Fridge, Washing Machine" },
  { id: "Electrical Work", name: "Electrical Work", icon: <Zap className="w-5 h-5" />, color: "from-amber-500 to-orange-600", image: "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?q=80&w=300", count: "35+ Pros", desc: "Wiring, Fans, MCB, Lights" },
  { id: "Plumbing", name: "Plumbing", icon: <Wrench className="w-5 h-5" />, color: "from-blue-600 to-indigo-700", image: "https://images.unsplash.com/photo-1607472586893-edb57cbbea42?q=80&w=300", count: "30+ Pros", desc: "Taps, Pipe Fitting, Geyser" },
  { id: "Home Cleaning", name: "Home Cleaning", icon: <Sparkles className="w-5 h-5" />, color: "from-purple-500 to-pink-600", image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=300", count: "25+ Pros", desc: "Full House & Sofa Deep Clean" },
  { id: "Pest Control", name: "Pest Control", icon: <Bug className="w-5 h-5" />, color: "from-rose-500 to-red-700", image: "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?q=80&w=300", count: "20+ Pros", desc: "Termite & Cockroach Spray" },
];

const DEMO_PROVIDERS: Provider[] = [
  {
    _id: "prov-demo-1",
    userId: "user-demo-1",
    providerCode: "SP-HYD-101",
    businessName: "Apex Cool Care AC & Appliance Repair",
    ownerName: "Rajesh Kumar",
    profilePhoto: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?q=80&w=400",
    serviceCategory: ["Appliance Repair"],
    experience: "7+ Years",
    description: "Certified AC & refrigerator repair specialists. 90 days service warranty with original spare parts replacement.",
    district: "Hyderabad",
    mandal: "Jubilee Hills",
    address: "Road No 36, Jubilee Hills, Hyderabad",
    pincode: "500033",
    rating: 4.9,
    status: "active",
    availability: {
      weeklySchedule: [
        { day: "Monday", active: true, start: "09:00 AM", end: "08:00 PM" },
        { day: "Tuesday", active: true, start: "09:00 AM", end: "08:00 PM" },
        { day: "Wednesday", active: true, start: "09:00 AM", end: "08:00 PM" },
        { day: "Thursday", active: true, start: "09:00 AM", end: "08:00 PM" },
        { day: "Friday", active: true, start: "09:00 AM", end: "08:00 PM" },
        { day: "Saturday", active: true, start: "09:00 AM", end: "08:00 PM" },
        { day: "Sunday", active: true, start: "09:00 AM", end: "06:00 PM" },
      ],
      emergencyActive: true,
      holidays: [],
    },
    services: [
      { id: "s1", name: "Split AC Servicing & Jet Cleaning", category: "Appliance Repair", type: "On-site", price: 599, discountPrice: 399, duration: "45 mins", active: true, included: ["Jet High Pressure Washing", "Gas Check", "Filter Cleaning"] },
      { id: "s2", name: "AC Gas Refill (R32 / R410a)", category: "Appliance Repair", type: "On-site", price: 2499, discountPrice: 1999, duration: "60 mins", active: true, included: ["Full Gas Charging", "Leakage Testing"] },
      { id: "s3", name: "Refrigerator Cooling Repair", category: "Appliance Repair", type: "On-site", price: 499, discountPrice: 349, duration: "30 mins", active: true, included: ["Thermostat Check", "Compressor Inspection"] },
    ],
  },
  {
    _id: "prov-demo-2",
    userId: "user-demo-2",
    providerCode: "SP-HYD-102",
    businessName: "VoltMasters Electrical Solutions",
    ownerName: "Suresh Reddy",
    profilePhoto: "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?q=80&w=400",
    serviceCategory: ["Electrical Work"],
    experience: "10+ Years",
    description: "Licensed master electricians for home wiring, short circuit troubleshooting, MCB replacement, and heavy appliance installation.",
    district: "Hyderabad",
    mandal: "Banjara Hills",
    address: "Road No 12, Banjara Hills, Hyderabad",
    pincode: "500034",
    rating: 4.8,
    status: "active",
    availability: {
      weeklySchedule: [
        { day: "Monday", active: true, start: "08:00 AM", end: "09:00 PM" },
        { day: "Tuesday", active: true, start: "08:00 AM", end: "09:00 PM" },
        { day: "Wednesday", active: true, start: "08:00 AM", end: "09:00 PM" },
        { day: "Thursday", active: true, start: "08:00 AM", end: "09:00 PM" },
        { day: "Friday", active: true, start: "08:00 AM", end: "09:00 PM" },
        { day: "Saturday", active: true, start: "08:00 AM", end: "09:00 PM" },
        { day: "Sunday", active: true, start: "09:00 AM", end: "05:00 PM" },
      ],
      emergencyActive: true,
      holidays: [],
    },
    services: [
      { id: "s4", name: "Short Circuit & MCB Repair", category: "Electrical Work", type: "On-site", price: 399, discountPrice: 249, duration: "30 mins", active: true, included: ["Diagnostic Check", "Fuse Replacement"] },
      { id: "s5", name: "Ceiling Fan & Light Fitting", category: "Electrical Work", type: "On-site", price: 199, discountPrice: 149, duration: "20 mins", active: true, included: ["Unboxing & Assembly", "Secure Mounting"] },
      { id: "s6", name: "Complete Room Re-Wiring", category: "Electrical Work", type: "On-site", price: 1499, discountPrice: 1199, duration: "120 mins", active: true, included: ["Concealed Piping", "Heavy Duty Switches"] },
    ],
  },
  {
    _id: "prov-demo-3",
    userId: "user-demo-3",
    providerCode: "SP-HYD-103",
    businessName: "HydroFix Plumbing & Leak Detection",
    ownerName: "Venkat Naidu",
    profilePhoto: "https://images.unsplash.com/photo-1607472586893-edb57cbbea42?q=80&w=400",
    serviceCategory: ["Plumbing"],
    experience: "8+ Years",
    description: "Expert plumbers for tap leak repairs, pipe fitting, flush tank repair, and bathroom sanitary installations.",
    district: "Hyderabad",
    mandal: "Madhapur",
    address: "Hitech City Main Road, Madhapur, Hyderabad",
    pincode: "500081",
    rating: 4.7,
    status: "active",
    availability: {
      weeklySchedule: [
        { day: "Monday", active: true, start: "09:00 AM", end: "08:00 PM" },
        { day: "Tuesday", active: true, start: "09:00 AM", end: "08:00 PM" },
        { day: "Wednesday", active: true, start: "09:00 AM", end: "08:00 PM" },
        { day: "Thursday", active: true, start: "09:00 AM", end: "08:00 PM" },
        { day: "Friday", active: true, start: "09:00 AM", end: "08:00 PM" },
        { day: "Saturday", active: true, start: "09:00 AM", end: "08:00 PM" },
      ],
      emergencyActive: true,
      holidays: [],
    },
    services: [
      { id: "s7", name: "Tap Leakage & Valve Fitting", category: "Plumbing", type: "On-site", price: 299, discountPrice: 199, duration: "25 mins", active: true, included: ["Washer Replacement", "Sealing Tape Application"] },
      { id: "s8", name: "Drainage Unblocking & Jet Drain", category: "Plumbing", type: "On-site", price: 699, discountPrice: 499, duration: "45 mins", active: true, included: ["Pressure Jetting", "Blockage Removal"] },
      { id: "s9", name: "Water Heater Geyser Installation", category: "Plumbing", type: "On-site", price: 499, discountPrice: 349, duration: "40 mins", active: true, included: ["Inlet Outlet Connection", "Safety Valve Test"] },
    ],
  },
  {
    _id: "prov-demo-4",
    userId: "user-demo-4",
    providerCode: "SP-HYD-104",
    businessName: "CleanZone Deep Home Hygiene",
    ownerName: "Priya Sharma",
    profilePhoto: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=400",
    serviceCategory: ["Home Cleaning"],
    experience: "6+ Years",
    description: "Professional full home deep cleaning, sofa sanitization, kitchen degreasing, and eco-friendly chemical treatment.",
    district: "Hyderabad",
    mandal: "Gachibowli",
    address: "Financial District, Gachibowli, Hyderabad",
    pincode: "500032",
    rating: 4.9,
    status: "active",
    availability: {
      weeklySchedule: [
        { day: "Monday", active: true, start: "08:00 AM", end: "07:00 PM" },
        { day: "Tuesday", active: true, start: "08:00 AM", end: "07:00 PM" },
        { day: "Wednesday", active: true, start: "08:00 AM", end: "07:00 PM" },
        { day: "Thursday", active: true, start: "08:00 AM", end: "07:00 PM" },
        { day: "Friday", active: true, start: "08:00 AM", end: "07:00 PM" },
        { day: "Saturday", active: true, start: "08:00 AM", end: "07:00 PM" },
        { day: "Sunday", active: true, start: "08:00 AM", end: "05:00 PM" },
      ],
      emergencyActive: false,
      holidays: [],
    },
    services: [
      { id: "s10", name: "Full House Deep Cleaning (2 BHK)", category: "Home Cleaning", type: "On-site", price: 3499, discountPrice: 2499, duration: "240 mins", active: true, included: ["Floor Scrubbing", "Window Wiping", "Bathroom Disinfection"] },
      { id: "s11", name: "Sofa & Upholstery Shampooing", category: "Home Cleaning", type: "On-site", price: 999, discountPrice: 749, duration: "60 mins", active: true, included: ["Foam Extraction", "Stain Removal"] },
    ],
  },
];

const TIME_SLOTS = ["09:00 AM", "11:00 AM", "01:00 PM", "03:00 PM", "05:00 PM", "07:00 PM"];
const PLACEHOLDER_IMAGES = [
  "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?q=80&w=400",
  "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?q=80&w=400",
  "https://images.unsplash.com/photo-1607472586893-edb57cbbea42?q=80&w=400",
  "https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=400",
];

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 0 }).format(v);

const getTodayAvailability = (provider: Provider): string => {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const today = days[new Date().getDay()];
  const schedule = provider.availability?.weeklySchedule?.find((d) => d.day === today);
  if (!schedule || !schedule.active) return "Closed Today";
  return `Today ${schedule.start}–${schedule.end}`;
};

const getLowestPrice = (provider: Provider): number | null => {
  const active = provider.services?.filter((s) => s.active);
  if (!active || active.length === 0) return null;
  return Math.min(
    ...active.map((s) =>
      s.discountPrice && Number(s.discountPrice) > 0 && Number(s.discountPrice) < s.price
        ? Number(s.discountPrice)
        : s.price
    )
  );
};

// ─────────────────────────────────────────────
// Main Services Component
// ─────────────────────────────────────────────
const Services = () => {
  const navigate = useNavigate();
  const [activeMainTab, setActiveMainTab] = useState<"book" | "providers" | "bookings" | "amc">("book");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [emergencyOnly, setEmergencyOnly] = useState(false);
  const [activeBanner, setActiveBanner] = useState(0);

  // Provider list state
  const [providers, setProviders] = useState<Provider[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const LIMIT = 12;

  // Booking modal state
  const [bookingProvider, setBookingProvider] = useState<Provider | null>(null);
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);
  const [selectedDate, setSelectedDate] = useState("Today");
  const [selectedTime, setSelectedTime] = useState("");
  const [bookingAddress, setBookingAddress] = useState("");
  const [bookingStep, setBookingStep] = useState(1);
  const [isBooking, setIsBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Detail modal & Bookings state
  const [detailProvider, setDetailProvider] = useState<Provider | null>(null);
  const [myBookings, setMyBookings] = useState<any[]>([]);

  // Real DB Sub & Child Categories State
  const [dbCategories, setDbCategories] = useState<any[]>([]);
  const [selectedSubCat, setSelectedSubCat] = useState<string>("");

  // Service Categories List State
  const [serviceCategoriesList, setServiceCategoriesList] = useState<any[]>([
    { id: "Appliance Repair", name: "Appliance Repair", icon: "❄️", image: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=300", description: "AC, Fridge & Washing Repair" },
    { id: "Electrical Work", name: "Electrical Work", icon: "⚡", image: "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=300", description: "Wiring, Fans, MCB & Lights" },
    { id: "Plumbing", name: "Plumbing", icon: "🔧", image: "https://images.unsplash.com/photo-1607472586893-edb57cbbea42?w=300", description: "Taps, Pipes & Geyser Repair" },
    { id: "Home Cleaning", name: "Home Cleaning", icon: "✨", image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=300", description: "Full House & Sofa Deep Clean" },
    { id: "Laundry Service", name: "Laundry Service", icon: "🧺", image: "https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?w=300", description: "Wash & Fold, Ironing & Dry Clean" },
    { id: "Spa & Salon", name: "Spa & Salon", icon: "💇", image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=300", description: "Hair Styling, Skincare & Massage" },
    { id: "Pest Control", name: "Pest Control", icon: "🐛", image: "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=300", description: "Termite & Cockroach Control" },
    { id: "Car & Vehicle Care", name: "Car Care", icon: "🚗", image: "https://images.unsplash.com/photo-1486006920555-c77dcf18193c?w=300", description: "Wash, Detailing & Mechanic" },
  ]);

  // Fetch real DB Sub-Categories & Child-Categories (Strictly Service Related)
  useEffect(() => {
    const fetchDbCategoryTree = async () => {
      try {
        const res = await axios.get(`${API_BASE}/categories/tree`).catch(() => null);
        if (res?.data?.categories) {
          const tree = res.data.categories;
          const subAndChildList: any[] = [];

          tree.forEach((parent: any) => {
            const parentName = (parent.name || '').toLowerCase();
            const isServiceRelatedParent =
              parentName.includes("service") ||
              parentName.includes("repair") ||
              parentName.includes("appliance") ||
              parentName.includes("electric") ||
              parentName.includes("plumb") ||
              parentName.includes("clean") ||
              parentName.includes("pest") ||
              parentName.includes("home") ||
              parentName.includes("laundry") ||
              parentName.includes("spa") ||
              parentName.includes("salon") ||
              parentName.includes("technician");

            if (parent.children && parent.children.length > 0) {
              parent.children.forEach((sub: any) => {
                const subName = (sub.name || '').toLowerCase();
                const isServiceSub =
                  isServiceRelatedParent ||
                  subName.includes("service") ||
                  subName.includes("repair") ||
                  subName.includes("ac") ||
                  subName.includes("electric") ||
                  subName.includes("plumb") ||
                  subName.includes("clean") ||
                  subName.includes("laundry") ||
                  subName.includes("wash") ||
                  subName.includes("spa") ||
                  subName.includes("salon") ||
                  subName.includes("pest");

                if (isServiceSub) {
                  subAndChildList.push({
                    id: sub._id || sub.name,
                    name: sub.name,
                    level: "Sub-Category",
                    parentName: parent.name,
                    image: sub.image || parent.image || "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=300",
                    icon: "🛠️",
                  });

                  if (sub.children && sub.children.length > 0) {
                    sub.children.forEach((child: any) => {
                      subAndChildList.push({
                        id: child._id || child.name,
                        name: child.name,
                        level: "Child-Category",
                        parentName: `${parent.name} > ${sub.name}`,
                        image: child.image || sub.image || "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=300",
                        icon: "⚡",
                      });
                    });
                  }
                }
              });
            }
          });

          // Fallback: If no service category tree nodes exist in DB, show service-specific subcategories
          if (subAndChildList.length === 0) {
            const serviceSubs = [
              { id: "s-laundry", name: "Laundry Service", level: "Sub-Category", parentName: "Services", icon: "🧺", image: "https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?w=300" },
              { id: "s-washfold", name: "Wash & Fold", level: "Child-Category", parentName: "Services > Laundry Service", icon: "⚡", image: "https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=300" },
              { id: "s-spa", name: "Spa & Salon", level: "Sub-Category", parentName: "Services", icon: "💇", image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=300" },
              { id: "s-hair", name: "Haircut & Skincare", level: "Child-Category", parentName: "Services > Spa & Salon", icon: "⚡", image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=300" },
              { id: "s-ac", name: "AC Jet Repair", level: "Sub-Category", parentName: "Appliance Repair", icon: "❄️", image: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=300" },
              { id: "s-fridge", name: "Refrigerator Repair", level: "Sub-Category", parentName: "Appliance Repair", icon: "🧊", image: "https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=300" },
              { id: "s-mcb", name: "MCB Repair", level: "Sub-Category", parentName: "Electrical Work", icon: "⚡", image: "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=300" },
              { id: "s-tap", name: "Tap Leakage Repair", level: "Sub-Category", parentName: "Plumbing", icon: "🚰", image: "https://images.unsplash.com/photo-1607472586893-edb57cbbea42?w=300" },
              { id: "s-clean", name: "Full House Deep Clean", level: "Sub-Category", parentName: "Home Cleaning", icon: "✨", image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=300" },
              { id: "s-pest", name: "Anti-Termite Control", level: "Sub-Category", parentName: "Pest Control", icon: "🐛", image: "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=300" },
            ];
            setDbCategories(serviceSubs);
          } else {
            setDbCategories(subAndChildList);
          }
        }
      } catch (err) {
        console.error("Error fetching DB Category Tree:", err);
      }
    };
    fetchDbCategoryTree();
  }, []);

  // Auto advance hero banner carousel
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveBanner((prev) => (prev + 1) % HERO_BANNERS.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const fetchBookings = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/service/bookings`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMyBookings(data.bookings || []);
      }
    } catch (err) {
      console.error("Error fetching bookings:", err);
    }
  }, []);

  const fetchSlots = useCallback(async (provId: string, dtVal: string) => {
    setLoadingSlots(true);
    try {
      let formattedDate = dtVal;
      if (dtVal === "Today") {
        formattedDate = new Date().toISOString().split("T")[0];
      } else if (dtVal === "Tomorrow") {
        const tom = new Date();
        tom.setDate(tom.getDate() + 1);
        formattedDate = tom.toISOString().split("T")[0];
      } else if (dtVal === "This Week") {
        formattedDate = new Date().toISOString().split("T")[0];
      }
      const res = await fetch(`${API_BASE}/service/availability/slots?providerId=${provId}&date=${formattedDate}`);
      if (res.ok) {
        const data = await res.json();
        setAvailableSlots(data.slots || []);
      } else {
        setAvailableSlots(TIME_SLOTS);
      }
    } catch (err) {
      setAvailableSlots(TIME_SLOTS);
    } finally {
      setLoadingSlots(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  useEffect(() => {
    if (bookingProvider) {
      fetchSlots(bookingProvider.userId || bookingProvider._id, selectedDate);
    }
  }, [bookingProvider, selectedDate, fetchSlots]);

  const fetchProviders = useCallback(async (pg = 1, reset = true) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set("q", searchQuery);
      if (selectedCategory) params.set("category", selectedCategory);
      if (emergencyOnly) params.set("emergency", "true");
      params.set("page", String(pg));
      params.set("limit", String(LIMIT));

      const res = await fetch(`${API_BASE}/service-provider/public/list?${params}`).catch(() => null);
      if (res && res.ok) {
        const data = await res.json();
        if (data.providers && data.providers.length > 0) {
          setProviders(reset ? data.providers : (prev) => [...prev, ...data.providers]);
          setTotal(data.total || data.providers.length);
          setPage(pg);
          return;
        }
      }

      // Fallback to DEMO PROVIDERS if API returns empty
      let list = [...DEMO_PROVIDERS];
      if (selectedCategory) {
        list = list.filter((p) => p.serviceCategory.includes(selectedCategory));
      }
      if (emergencyOnly) {
        list = list.filter((p) => p.availability?.emergencyActive);
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        list = list.filter(
          (p) =>
            p.businessName.toLowerCase().includes(q) ||
            p.ownerName.toLowerCase().includes(q) ||
            p.services.some((s) => s.name.toLowerCase().includes(q))
        );
      }
      setProviders(list);
      setTotal(list.length);
      setPage(1);
    } catch (err: any) {
      setProviders(DEMO_PROVIDERS);
      setTotal(DEMO_PROVIDERS.length);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedCategory, emergencyOnly]);

  useEffect(() => {
    fetchProviders(1, true);
  }, [fetchProviders]);

  const openBookingModal = (p: Provider) => {
    setBookingProvider(p);
    const activeServices = p.services?.filter((s) => s.active);
    setSelectedService(activeServices?.[0] || null);
    setSelectedDate("Today");
    setSelectedTime(TIME_SLOTS[0]);
    setBookingAddress("");
    setBookingStep(1);
    setBookingSuccess(false);
  };

  const handleBook = async () => {
    if (!bookingProvider || !selectedTime || !bookingAddress.trim()) return;
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please log in to book a service");
      navigate("/login");
      return;
    }
    setIsBooking(true);
    try {
      let formattedDate = selectedDate;
      if (selectedDate === "Today") {
        formattedDate = new Date().toISOString().split("T")[0];
      } else if (selectedDate === "Tomorrow") {
        const tom = new Date();
        tom.setDate(tom.getDate() + 1);
        formattedDate = tom.toISOString().split("T")[0];
      } else if (selectedDate === "This Week") {
        formattedDate = new Date().toISOString().split("T")[0];
      }

      const res = await fetch(`${API_BASE}/service/bookings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          providerId: bookingProvider.userId || bookingProvider._id,
          serviceName: selectedService?.name || bookingProvider.serviceCategory[0],
          servicePrice: selectedService?.discountPrice && Number(selectedService.discountPrice) > 0 && Number(selectedService.discountPrice) < selectedService.price
            ? Number(selectedService.discountPrice)
            : (selectedService?.price || 0),
          bookingDate: formattedDate,
          bookingTime: selectedTime,
          bookingAddress,
          details: ""
        })
      });
      if (res.ok) {
        setIsBooking(false);
        setBookingSuccess(true);
        await fetchBookings();
        setTimeout(() => {
          setBookingProvider(null);
          setActiveMainTab("bookings");
        }, 1500);
      } else {
        const data = await res.json();
        alert(data.message || "Failed to place booking");
        setIsBooking(false);
      }
    } catch (err) {
      console.error("Booking error:", err);
      setIsBooking(false);
    }
  };

  const currentBanner = HERO_BANNERS[activeBanner];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">
      <Navbar />

      {/* DYNAMIC ANIMATED HERO SLIDER BANNER */}
      <div className="relative bg-[#0A1128] text-white overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/15 rounded-full blur-[120px] pointer-events-none animate-pulse" />
        <div className="absolute -bottom-20 left-10 w-96 h-96 bg-indigo-500/15 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-6 pb-8 relative z-10">
          {/* SLIDER CAROUSEL ITEM */}
          <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-white/10 group min-h-[340px] sm:min-h-[380px] flex items-center">
            <img
              key={currentBanner.id}
              src={currentBanner.image}
              alt={currentBanner.title}
              className="absolute inset-0 w-full h-full object-cover transition-all duration-700 ease-in-out scale-105 group-hover:scale-100"
            />
            <div className={`absolute inset-0 bg-gradient-to-r ${currentBanner.gradient} opacity-90 mix-blend-multiply`} />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

            {/* SLIDER CONTENT */}
            <div className="relative z-20 p-6 sm:p-10 max-w-2xl space-y-3 text-left">
              <div className="inline-flex items-center space-x-2 bg-amber-400 text-slate-950 px-3.5 py-1 rounded-full font-black text-xs shadow-lg animate-bounce">
                <Flame className="w-3.5 h-3.5 text-slate-950" />
                <span>{currentBanner.tag}</span>
              </div>

              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white font-heading leading-tight tracking-tight drop-shadow-md">
                {currentBanner.title}
              </h1>

              <p className="text-xs sm:text-sm text-slate-200 font-medium max-w-lg leading-relaxed">
                {currentBanner.subtitle}
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-3">
                <div className="px-4 py-2 bg-amber-500 text-slate-950 font-black rounded-2xl text-sm shadow-xl flex items-center space-x-2">
                  <Tag className="w-4 h-4" />
                  <span>{currentBanner.discount}</span>
                </div>
                <div className="px-3.5 py-2 bg-white/20 backdrop-blur-md text-white font-mono font-bold text-xs rounded-2xl border border-white/30">
                  CODE: <span className="text-amber-300 font-extrabold">{currentBanner.code}</span>
                </div>
              </div>
            </div>

            {/* SLIDER ARROWS */}
            <button
              onClick={() => setActiveBanner((prev) => (prev === 0 ? HERO_BANNERS.length - 1 : prev - 1))}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-slate-950/60 hover:bg-amber-500 text-white hover:text-slate-950 transition backdrop-blur-md border border-white/20 shadow-xl cursor-pointer z-30 opacity-80 group-hover:opacity-100"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setActiveBanner((prev) => (prev + 1) % HERO_BANNERS.length)}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-slate-950/60 hover:bg-amber-500 text-white hover:text-slate-950 transition backdrop-blur-md border border-white/20 shadow-xl cursor-pointer z-30 opacity-80 group-hover:opacity-100"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* SLIDER DOTS */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center space-x-2">
              {HERO_BANNERS.map((b, idx) => (
                <button
                  key={b.id}
                  onClick={() => setActiveBanner(idx)}
                  className={`h-2.5 rounded-full transition-all duration-300 cursor-pointer ${activeBanner === idx ? 'w-8 bg-amber-400' : 'w-2.5 bg-white/50 hover:bg-white'
                    }`}
                />
              ))}
            </div>
          </div>

          {/* INSTANT SERVICE SEARCH BAR */}
          <div className="mt-5 flex flex-col sm:flex-row items-center gap-2 bg-white p-2 rounded-2xl shadow-2xl border border-slate-200">
            <div className="relative flex-1 w-full">
              <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search AC repair, plumber, electrician, home cleaning..."
                className="w-full pl-11 pr-4 py-2.5 bg-transparent text-sm text-slate-900 placeholder-slate-400 focus:outline-none font-medium"
              />
            </div>
            <button
              onClick={() => fetchProviders(1, true)}
              className="w-full sm:w-auto px-7 py-3 bg-amber-500 hover:bg-amber-400 text-[#0A1128] font-black text-xs rounded-xl shadow-lg transition cursor-pointer flex items-center justify-center space-x-2"
            >
              <Search className="w-4 h-4" />
              <span>Search Services</span>
            </button>
          </div>
        </div>
      </div>

      {/* FLASH CASHBACK STRIP */}
      <div className="bg-amber-400 text-[#0A1128] font-extrabold text-xs py-2.5 text-center shadow-inner tracking-wide flex items-center justify-center space-x-2">
        <Sparkles className="w-4 h-4 animate-spin" />
        <span>Earn 10% Instant Wallet Cashback on Service Bookings • Code: APEXSERVICE</span>
      </div>

      {/* MAIN CONTAINER */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6 sm:py-10 space-y-6 sm:space-y-8">

        {/* PRIMARY VIEW NAVIGATION TABS */}
        <div className="bg-white p-1.5 sm:p-2 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-md grid grid-cols-3 gap-1.5 sm:gap-2">
          <button
            onClick={() => setActiveMainTab("book")}
            className={`py-2.5 sm:py-3.5 px-2 sm:px-4 rounded-xl sm:rounded-2xl font-black text-xs sm:text-sm transition-all duration-300 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 border cursor-pointer ${activeMainTab === "book"
                ? "bg-[#0A1128] text-amber-400 border-[#0A1128] shadow-md"
                : "bg-transparent text-slate-700 border-transparent hover:bg-slate-100"
              }`}
          >
            <Wrench className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Book Services</span>
          </button>

          <button
            onClick={() => setActiveMainTab("providers")}
            className={`py-2.5 sm:py-3.5 px-2 sm:px-4 rounded-xl sm:rounded-2xl font-black text-xs sm:text-sm transition-all duration-300 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 border cursor-pointer ${activeMainTab === "providers"
                ? "bg-[#0A1128] text-amber-400 border-[#0A1128] shadow-md"
                : "bg-transparent text-slate-700 border-transparent hover:bg-slate-100"
              }`}
          >
            <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Verified Experts</span>
          </button>

          <button
            onClick={() => setActiveMainTab("bookings")}
            className={`py-2.5 sm:py-3.5 px-2 sm:px-4 rounded-xl sm:rounded-2xl font-black text-xs sm:text-sm transition-all duration-300 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 border cursor-pointer ${activeMainTab === "bookings"
                ? "bg-[#0A1128] text-amber-400 border-[#0A1128] shadow-md"
                : "bg-transparent text-slate-700 border-transparent hover:bg-slate-100"
              }`}
          >
            <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>My Bookings ({myBookings.length})</span>
          </button>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* VIEW 1: BOOK SERVICES (Visual Subcategories + Provider List) */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {(activeMainTab === "book" || activeMainTab === "providers") && (
          <div className="space-y-6">

            {/* REAL DB SUB-CATEGORIES & CHILD-CATEGORIES SHOWCASE GRID */}
            {dbCategories.length > 0 && (
              <div className="bg-white p-4 sm:p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base sm:text-xl font-black text-[#0A1128] flex items-center gap-2">
                      <span>🛠️</span> Service Sub-Categories &amp; Child-Categories
                    </h2>
                    <p className="text-xs text-slate-500 font-medium">Select a sub-category to filter certified technicians near you</p>
                  </div>
                  {selectedSubCat && (
                    <button
                      onClick={() => {
                        setSelectedSubCat("");
                        setSearchQuery("");
                      }}
                      className="text-xs font-bold text-amber-600 hover:underline cursor-pointer border-none bg-transparent"
                    >
                      Clear Filter (Show All)
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-10 gap-2.5 sm:gap-3">
                  {dbCategories.map((item) => {
                    const isSelected = selectedSubCat === item.name;
                    const imgSrc = item.image || "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=300";

                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedSubCat("");
                            setSearchQuery("");
                          } else {
                            setSelectedSubCat(item.name);
                            setSearchQuery(item.name);
                          }
                        }}
                        className={`group relative flex flex-col items-center p-2.5 sm:p-3 rounded-2xl border transition-all duration-300 cursor-pointer text-center ${isSelected
                            ? "bg-[#0A1128] text-white border-[#0A1128] shadow-lg ring-2 ring-amber-400 scale-[1.02]"
                            : "bg-slate-50/80 hover:bg-white text-slate-800 border-slate-200 hover:border-amber-400 hover:shadow-md"
                          }`}
                      >
                        <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-2xl overflow-hidden mb-2 shadow-xs border border-white/20 bg-slate-900">
                          <img
                            src={imgSrc}
                            alt={item.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                          <span className="absolute bottom-0.5 right-0.5 bg-slate-950/80 text-white text-[9px] px-1 py-0.2 rounded">
                            {item.icon}
                          </span>
                        </div>
                        <span className="font-extrabold text-[11px] sm:text-xs leading-tight line-clamp-1">
                          {item.name}
                        </span>
                        <span className={`text-[8px] sm:text-[9px] font-bold mt-0.5 line-clamp-1 ${isSelected ? "text-amber-300" : "text-slate-400"}`}>
                          {item.level}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* EMERGENCY 24/7 RED BANNER */}
            <div className="bg-gradient-to-r from-red-600 via-rose-700 to-red-800 text-white rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 border border-red-500/30">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md text-white flex items-center justify-center flex-shrink-0 animate-pulse">
                  <PhoneCall className="w-6 h-6" />
                </div>
                <div>
                  <div className="inline-flex items-center space-x-1.5 bg-amber-400 text-slate-950 px-2.5 py-0.5 rounded-full font-black text-[10px] mb-1">
                    <span>⚡ 30 MIN ARRIVAL GUARANTEE</span>
                  </div>
                  <h3 className="font-black text-lg sm:text-xl">Need Immediate Emergency Repair?</h3>
                  <p className="text-xs text-red-100 font-medium">Instant Technician Dispatch for AC Breakdown, Electrical Short Circuits & Water Pipe Leaks.</p>
                </div>
              </div>
              <Button
                className={`bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs px-6 py-3 rounded-xl shadow-lg border-0 whitespace-nowrap cursor-pointer ${emergencyOnly ? 'ring-2 ring-white' : ''}`}
                onClick={() => setEmergencyOnly((v) => !v)}
              >
                {emergencyOnly ? "Show All Technicians" : "⚡ Filter Emergency 24/7 Pros"}
              </Button>
            </div>

            {/* PROVIDERS LISTING HEADER */}
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-amber-500" />
                <h3 className="font-black text-slate-900 text-sm sm:text-base">
                  {loading ? "Searching..." : `${total} Verified Service Provider${total !== 1 ? "s" : ""} Available`}
                </h3>
              </div>
              {(selectedCategory || searchQuery || emergencyOnly) && (
                <button
                  onClick={() => {
                    setSelectedCategory("");
                    setSearchQuery("");
                    setEmergencyOnly(false);
                  }}
                  className="text-xs text-red-600 font-bold hover:underline flex items-center gap-1 border-none bg-transparent cursor-pointer"
                >
                  <RefreshCcw className="w-3.5 h-3.5" /> Reset Filters
                </button>
              )}
            </div>

            {/* PROVIDERS GRID */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
                <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
                <p className="text-xs font-bold">Finding certified technicians near your location…</p>
              </div>
            ) : providers.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-300 p-8 space-y-3">
                <Search className="w-12 h-12 text-slate-300 mx-auto" />
                <h4 className="font-extrabold text-slate-800">No service providers found</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">Try clearing search keywords or selecting a different service category.</p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedCategory("");
                    setSearchQuery("");
                    setEmergencyOnly(false);
                  }}
                  className="mt-2 text-xs font-bold"
                >
                  Clear Filters
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {providers.map((p, idx) => {
                  const lowestPrice = getLowestPrice(p);
                  const availability = getTodayAvailability(p);
                  const isEmergency = p.availability?.emergencyActive ?? false;
                  const imgSrc = p.profilePhoto || PLACEHOLDER_IMAGES[idx % PLACEHOLDER_IMAGES.length];

                  return (
                    <div
                      key={p._id}
                      className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs hover:shadow-xl hover:border-amber-400 transition-all duration-300 flex flex-col justify-between group cursor-pointer"
                      onClick={() => setDetailProvider(p)}
                    >
                      <div>
                        {/* PROVIDER HEADER IMAGE */}
                        <div className="h-44 bg-slate-900 relative overflow-hidden">
                          <img
                            src={imgSrc}
                            alt={p.businessName}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGES[idx % PLACEHOLDER_IMAGES.length];
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

                          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-slate-950 shadow-md">
                              🛡️ VERIFIED PRO
                            </span>
                            {isEmergency && (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-red-600 text-white shadow-md animate-pulse">
                                ⚡ EMERGENCY 24/7
                              </span>
                            )}
                          </div>

                          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white z-10">
                            <div className="flex items-center gap-1 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-xl text-xs font-black text-amber-400">
                              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                              <span>{p.rating || '4.9'}</span>
                            </div>
                            <span className="text-[10px] font-bold text-slate-300 bg-slate-950/60 backdrop-blur-md px-2 py-0.5 rounded-lg">
                              🏆 {p.experience || '5+ Yrs Exp'}
                            </span>
                          </div>
                        </div>

                        {/* PROVIDER DETAILS */}
                        <div className="p-4 space-y-2">
                          <h3 className="font-extrabold text-sm text-[#0A1128] line-clamp-1 group-hover:text-amber-600 transition">
                            {p.businessName}
                          </h3>

                          <p className="text-xs text-slate-500 font-medium line-clamp-2">
                            {p.description || "Expert home service technician with certified experience and warranty."}
                          </p>

                          <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold pt-1">
                            <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            <span className="truncate">{p.address || `${p.mandal || 'Jubilee Hills'}, ${p.district || 'Hyderabad'}`}</span>
                          </div>

                          {/* SERVICES LIST HIGHLIGHT */}
                          <div className="pt-2 space-y-1.5 border-t border-slate-100">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Top Offered Services:</p>
                            {p.services?.filter(s => s.active).slice(0, 2).map((s, i) => (
                              <div key={i} className="flex items-center justify-between text-xs bg-slate-50 p-2 rounded-xl border border-slate-100">
                                <span className="font-bold text-slate-800 truncate pr-2">{s.name}</span>
                                <span className="font-black text-[#0A1128] shrink-0">
                                  {s.discountPrice ? formatCurrency(s.discountPrice) : formatCurrency(s.price)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* CARD CTA BUTTON */}
                      <div className="p-4 pt-0 flex items-center justify-between gap-2 border-t border-slate-100 mt-2">
                        <div>
                          <p className="text-[9px] text-slate-400 font-bold uppercase">Starts From</p>
                          <p className="text-base font-black text-[#0A1128]">
                            {lowestPrice ? formatCurrency(lowestPrice) : "₹199"}
                          </p>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openBookingModal(p);
                          }}
                          className="bg-[#0A1128] hover:bg-amber-500 text-white hover:text-[#0A1128] font-black text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition duration-300 border-none cursor-pointer"
                        >
                          <Wrench className="w-3.5 h-3.5" />
                          <span>Book Service</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* VIEW 2: MY BOOKINGS & LIVE TRACKING */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeMainTab === "bookings" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-[#0A1128]">My Service Bookings &amp; History</h2>
              <Button size="sm" variant="outline" onClick={fetchBookings} className="text-xs font-bold">
                <RefreshCcw className="w-3.5 h-3.5 mr-1" /> Refresh
              </Button>
            </div>

            {myBookings.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300 p-8 space-y-4">
                <Briefcase className="w-16 h-16 text-slate-300 mx-auto" />
                <h3 className="font-extrabold text-slate-800 text-lg">No service bookings found</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">You haven't booked any home repair or appliance servicing yet.</p>
                <Button className="bg-[#0A1128] text-white font-bold text-xs px-6" onClick={() => setActiveMainTab("book")}>
                  Book a Service Now
                </Button>
              </div>
            ) : (
              <div className="grid gap-4">
                {myBookings.map((bkg) => (
                  <Card key={bkg._id || bkg.id} className="border-l-4 border-l-[#0A1128] hover:shadow-lg transition-all rounded-3xl">
                    <CardContent className="p-5">
                      <div className="flex flex-col sm:flex-row justify-between gap-4">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge className="bg-amber-100 text-amber-900 border-0 font-bold">#{bkg._id || bkg.id}</Badge>
                            <span className="text-xs font-extrabold text-slate-600">Provider: {bkg.provider}</span>
                          </div>

                          <h3 className="font-black text-base text-[#0A1128]">{bkg.service}</h3>

                          <div className="flex flex-wrap gap-4 text-xs text-slate-500 font-semibold">
                            <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-amber-500" /> {bkg.date}</span>
                            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-amber-500" /> {bkg.time}</span>
                            {bkg.address && (
                              <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-amber-500" /> {bkg.address}</span>
                            )}
                          </div>

                          {bkg.otpCode && bkg.status !== "Completed" && (
                            <div className="mt-2 p-2.5 bg-amber-50 border border-amber-200 rounded-xl inline-flex items-center gap-2 text-xs font-bold text-amber-900">
                              <span>🔐 Service OTP Verification:</span>
                              <span className="font-black text-sm tracking-widest text-amber-600">{bkg.otpCode}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col justify-between items-start sm:items-end gap-2 border-t sm:border-t-0 pt-3 sm:pt-0">
                          <div className="flex gap-2 items-center">
                            <Badge className="bg-emerald-100 text-emerald-800 border-0 font-bold">{bkg.status || 'Scheduled'}</Badge>
                            <Badge className={bkg.paymentStatus === "Paid" ? "bg-green-100 text-green-800 border-0" : "bg-amber-100 text-amber-800 border-0"}>
                              {bkg.paymentStatus || "Unpaid"}
                            </Badge>
                          </div>

                          <div className="text-right">
                            <p className="text-[10px] text-slate-400 font-bold uppercase">Total Price</p>
                            <p className="font-black text-lg text-[#0A1128]">{formatCurrency(bkg.servicePrice || 399)}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* BOOKING MODAL DIALOG */}
      <Dialog open={!!bookingProvider} onOpenChange={() => setBookingProvider(null)}>
        <DialogContent className="sm:max-w-lg bg-white rounded-3xl p-6 border border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-[#0A1128]">
              Book Service with {bookingProvider?.businessName}
            </DialogTitle>
          </DialogHeader>

          {bookingSuccess ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto animate-bounce">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-[#0A1128]">Booking Confirmed!</h3>
              <p className="text-xs text-slate-500">Your technician will arrive at the scheduled time. Verification code has been generated.</p>
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              {/* SERVICE SELECTOR */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select Service Package</label>
                <select
                  value={selectedService?.id || ""}
                  onChange={(e) => {
                    const found = bookingProvider?.services?.find((s) => s.id === e.target.value);
                    if (found) setSelectedService(found);
                  }}
                  className="w-full p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-bold text-slate-800"
                >
                  {bookingProvider?.services?.filter((s) => s.active).map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} — {s.discountPrice ? formatCurrency(s.discountPrice) : formatCurrency(s.price)}
                    </option>
                  ))}
                </select>
              </div>

              {/* DATE SELECTOR */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select Service Date</label>
                <div className="grid grid-cols-3 gap-2">
                  {["Today", "Tomorrow", "This Week"].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setSelectedDate(d)}
                      className={`py-2 text-xs font-bold rounded-xl border transition cursor-pointer ${selectedDate === d ? "bg-[#0A1128] text-amber-400 border-[#0A1128]" : "bg-slate-50 text-slate-700 border-slate-200"
                        }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              {/* TIME SLOT SELECTOR */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select Time Slot</label>
                <div className="grid grid-cols-3 gap-2">
                  {(availableSlots.length > 0 ? availableSlots : TIME_SLOTS).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setSelectedTime(t)}
                      className={`py-2 text-xs font-bold rounded-xl border transition cursor-pointer ${selectedTime === t ? "bg-amber-500 text-slate-950 border-amber-500" : "bg-slate-50 text-slate-700 border-slate-200"
                        }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* ADDRESS INPUT */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Service Delivery Address</label>
                <textarea
                  value={bookingAddress}
                  onChange={(e) => setBookingAddress(e.target.value)}
                  placeholder="Enter house no, building name, street address & pincode..."
                  rows={3}
                  className="w-full p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium text-slate-800"
                  required
                />
              </div>

              {/* SUMMARY & CONFIRM CTA */}
              <div className="pt-2 border-t flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Total Payable</p>
                  <p className="text-lg font-black text-[#0A1128]">
                    {selectedService?.discountPrice ? formatCurrency(selectedService.discountPrice) : formatCurrency(selectedService?.price || 299)}
                  </p>
                </div>

                <Button
                  onClick={handleBook}
                  disabled={isBooking || !selectedTime || !bookingAddress.trim()}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs px-6 py-2.5 rounded-xl cursor-pointer"
                >
                  {isBooking ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm Booking"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* DETAIL MODAL DIALOG */}
      <Dialog open={!!detailProvider} onOpenChange={() => setDetailProvider(null)}>
        <DialogContent className="sm:max-w-xl bg-white rounded-3xl p-6 border border-slate-200">
          {detailProvider && (
            <div className="space-y-4">
              <div className="flex gap-4 items-center">
                <img
                  src={detailProvider.profilePhoto || PLACEHOLDER_IMAGES[0]}
                  alt={detailProvider.businessName}
                  className="w-16 h-16 rounded-2xl object-cover border"
                />
                <div>
                  <Badge className="bg-amber-400 text-slate-950 font-black text-[10px] border-0 mb-1">🛡️ VERIFIED EXPERT</Badge>
                  <h3 className="font-black text-lg text-[#0A1128]">{detailProvider.businessName}</h3>
                  <p className="text-xs text-slate-500">Managed by {detailProvider.ownerName} • {detailProvider.experience || '5+ Yrs Exp'}</p>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-2xl border border-slate-100">
                {detailProvider.description || "Certified service partner specialized in high quality home repairs, original spare parts replacement, and emergency technician dispatch."}
              </p>

              <div>
                <h4 className="font-extrabold text-xs text-slate-900 mb-2">Available Services &amp; Rates</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {detailProvider.services?.filter((s) => s.active).map((s) => (
                    <div key={s.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex justify-between items-center">
                      <div>
                        <p className="font-extrabold text-xs text-slate-800">{s.name}</p>
                        <p className="text-[10px] text-slate-500">Duration: {s.duration || '30 mins'}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-sm text-[#0A1128]">
                          {s.discountPrice ? formatCurrency(s.discountPrice) : formatCurrency(s.price)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setDetailProvider(null)} className="text-xs">Close</Button>
                <Button
                  size="sm"
                  className="bg-[#0A1128] text-amber-400 font-bold text-xs"
                  onClick={() => {
                    const p = detailProvider;
                    setDetailProvider(null);
                    openBookingModal(p);
                  }}
                >
                  Book Service Now
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default Services;
