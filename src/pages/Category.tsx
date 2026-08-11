import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { Link, useParams, useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { useEffect, useMemo, useState, useRef } from "react";
import axios from "axios";
import { ShoppingCart, Search, Filter, Star, Sparkles, MapPin, Tag, Compass, Calendar, RefreshCw, ChevronRight, Award, Clock, Flame, ChevronLeft, LayoutGrid, List, CheckCircle2, ShieldCheck, Zap, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const API_BASE = import.meta.env.VITE_API_URL || "https://server.apexbee.in/api";

// ═══════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════
interface Product {
  _id: string;
  itemName?: string;
  name?: string;
  images?: string[];
  subcategory?: string;
  userPrice?: number;
  afterDiscount?: number;
  rating?: number;
  reviews?: number;
  tag?: string;
  categoryName?: string;
  [key: string]: any;
}

interface Subcategory {
  _id: string;
  name: string;
  slug?: string;
  image?: string;
  level?: number;
  parentId?: string | null;
  isActive?: boolean;
}

interface CategoryType {
  _id: string;
  name: string;
  slug?: string;
  image?: string;
  level?: number;
  parentId?: string | null;
  isActive?: boolean;
  children?: CategoryType[];
  productCount?: number;
}

function getDemoProducts(catName: string, mainCat: CategoryType | null, subs: any[], childs: any[]): Product[] {
  const clean = (catName || '').toLowerCase();

  const getSubId = (keyword: string, fallback: string) => {
    const found = subs.find(s => s.name.toLowerCase().includes(keyword));
    return found ? found._id : fallback;
  };

  if (clean.includes("pet") || clean.includes("dog") || clean.includes("cat") || clean.includes("animal")) {
    const pFood = getSubId("food", "sub-pet-food");
    const pGroom = getSubId("groom", "sub-pet-grooming");
    const pAcc = getSubId("access", "sub-pet-acc");
    const pVet = getSubId("vet", "sub-pet-vet");

    return [
      {
        _id: "pet-prod-1",
        itemName: "Pedigree Adult Dry Dog Food - Chicken & Vegetables 3kg",
        name: "Pedigree Adult Dry Dog Food - Chicken & Vegetables 3kg",
        userPrice: 850,
        afterDiscount: 699,
        baseMrp: 850,
        baseSellingPrice: 699,
        rating: 4.8,
        reviews: 142,
        brand: "Pedigree",
        tag: "Best Seller",
        subCategoryId: pFood,
        subcategory: pFood,
        subCategoryName: "Pet Food",
        childCategoryId: `child-${pFood}-1`,
        childCategoryName: "Dog Food & Kibble",
        images: ["https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=400&auto=format&fit=crop&q=80"]
      },
      {
        _id: "pet-prod-2",
        itemName: "Whiskas Wet Cat Food Gravy Pouches (Pack of 12 x 85g)",
        name: "Whiskas Wet Cat Food Gravy Pouches (Pack of 12 x 85g)",
        userPrice: 540,
        afterDiscount: 479,
        baseMrp: 540,
        baseSellingPrice: 479,
        rating: 4.9,
        reviews: 98,
        brand: "Whiskas",
        tag: "Top Rated",
        subCategoryId: pFood,
        subcategory: pFood,
        subCategoryName: "Pet Food",
        childCategoryId: `child-${pFood}-2`,
        childCategoryName: "Cat Food & Gravy",
        images: ["https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&auto=format&fit=crop&q=80"]
      },
      {
        _id: "pet-prod-3",
        itemName: "Bio-Groom Anti-Itch Herbal Pet Shampoo 350ml",
        name: "Bio-Groom Anti-Itch Herbal Pet Shampoo 350ml",
        userPrice: 450,
        afterDiscount: 349,
        baseMrp: 450,
        baseSellingPrice: 349,
        rating: 4.7,
        reviews: 56,
        brand: "Bio-Groom",
        tag: "Herbal",
        subCategoryId: pGroom,
        subcategory: pGroom,
        subCategoryName: "Pet Grooming",
        childCategoryId: `child-${pGroom}-1`,
        childCategoryName: "Pet Shampoos & Oils",
        images: ["https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=400&auto=format&fit=crop&q=80"]
      },
      {
        _id: "pet-prod-4",
        itemName: "Reflective Nylon Dog Leash & Padded Harness Set",
        name: "Reflective Nylon Dog Leash & Padded Harness Set",
        userPrice: 599,
        afterDiscount: 399,
        baseMrp: 599,
        baseSellingPrice: 399,
        rating: 4.8,
        reviews: 84,
        brand: "PetPlus",
        tag: "20% OFF",
        subCategoryId: pAcc,
        subcategory: pAcc,
        subCategoryName: "Pet Accessories",
        childCategoryId: `child-${pAcc}-1`,
        childCategoryName: "Collars, Belts & Leashes",
        images: ["https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400&auto=format&fit=crop&q=80"]
      },
      {
        _id: "pet-prod-5",
        itemName: "Royal Canin Maxi Puppy Dry Food 4kg",
        name: "Royal Canin Maxi Puppy Dry Food 4kg",
        userPrice: 2200,
        afterDiscount: 1899,
        baseMrp: 2200,
        baseSellingPrice: 1899,
        rating: 4.9,
        reviews: 110,
        brand: "Royal Canin",
        tag: "Superfood",
        subCategoryId: pFood,
        subcategory: pFood,
        subCategoryName: "Pet Food",
        childCategoryId: `child-${pFood}-1`,
        childCategoryName: "Dog Food & Kibble",
        images: ["https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=400&auto=format&fit=crop&q=80"]
      },
      {
        _id: "pet-prod-6",
        itemName: "Himalaya Erina EP Tick & Flea Powder 150g",
        name: "Himalaya Erina EP Tick & Flea Powder 150g",
        userPrice: 220,
        afterDiscount: 180,
        baseMrp: 220,
        baseSellingPrice: 180,
        rating: 4.7,
        reviews: 73,
        brand: "Himalaya Pets",
        tag: "Vet Approved",
        subCategoryId: pVet,
        subcategory: pVet,
        subCategoryName: "Veterinary Care",
        childCategoryId: `child-${pVet}-1`,
        childCategoryName: "Flea & Tick Powders",
        images: ["https://images.unsplash.com/photo-1576201836106-db1758fd1c97?w=400&auto=format&fit=crop&q=80"]
      },
      {
        _id: "pet-prod-7",
        itemName: "Cozy Plush Velvet Pet Bed (Washable Cover)",
        name: "Cozy Plush Velvet Pet Bed (Washable Cover)",
        userPrice: 1299,
        afterDiscount: 899,
        baseMrp: 1299,
        baseSellingPrice: 899,
        rating: 4.9,
        reviews: 62,
        brand: "ComfortPets",
        tag: "Ultra Soft",
        subCategoryId: pAcc,
        subcategory: pAcc,
        subCategoryName: "Pet Accessories",
        childCategoryId: `child-${pAcc}-2`,
        childCategoryName: "Pet Beds & Cages",
        images: ["https://images.unsplash.com/photo-1541599540903-216a46ca1dc0?w=400&auto=format&fit=crop&q=80"]
      },
      {
        _id: "pet-prod-8",
        itemName: "Interactive Feather Cat Wand & Teaser Toys Set",
        name: "Interactive Feather Cat Wand & Teaser Toys Set",
        userPrice: 350,
        afterDiscount: 249,
        baseMrp: 350,
        baseSellingPrice: 249,
        rating: 4.8,
        reviews: 45,
        brand: "PlayPaws",
        tag: "Fun Play",
        subCategoryId: pAcc,
        subcategory: pAcc,
        subCategoryName: "Pet Accessories",
        childCategoryId: `child-${pAcc}-3`,
        childCategoryName: "Chew & Interactive Toys",
        images: ["https://images.unsplash.com/photo-1545249390-6bdfa286032f?w=400&auto=format&fit=crop&q=80"]
      }
    ];
  }

  if (clean.includes("devotional") || clean.includes("puja") || clean.includes("pooja") || clean.includes("temple") || clean.includes("god")) {
    const pEss = getSubId("essential", "sub-devotional-essentials");
    const pFlow = getSubId("flower", "sub-devotional-flowers");
    const pKits = getSubId("kit", "sub-devotional-kits");
    const pIdols = getSubId("idol", "sub-devotional-idols");
    const pFest = getSubId("festival", "sub-devotional-festival");

    return [
      {
        _id: "dev-prod-1",
        itemName: "Mangaldeep Sandalwood Agarbatti (Pack of 4 x 100g)",
        name: "Mangaldeep Sandalwood Agarbatti (Pack of 4 x 100g)",
        userPrice: 220,
        afterDiscount: 180,
        baseMrp: 220,
        baseSellingPrice: 180,
        rating: 4.9,
        reviews: 210,
        brand: "Mangaldeep",
        tag: "Pure Fragrance",
        subCategoryId: pEss,
        subcategory: pEss,
        subCategoryName: "Pooja Essentials",
        childCategoryId: `child-${pEss}-1`,
        childCategoryName: "Agarbatti & Incense",
        images: ["https://images.unsplash.com/photo-1606293926075-69a00dbfde81?w=400&auto=format&fit=crop&q=80"]
      },
      {
        _id: "dev-prod-2",
        itemName: "Pure Bhimseni Camphor (Bhimseni Kapoor 250g Jar)",
        name: "Pure Bhimseni Camphor (Bhimseni Kapoor 250g Jar)",
        userPrice: 350,
        afterDiscount: 299,
        baseMrp: 350,
        baseSellingPrice: 299,
        rating: 4.8,
        reviews: 165,
        brand: "ApexDevotional",
        tag: "100% Organic",
        subCategoryId: pEss,
        subcategory: pEss,
        subCategoryName: "Pooja Essentials",
        childCategoryId: `child-${pEss}-2`,
        childCategoryName: "Camphor & Dhoop",
        images: ["https://images.unsplash.com/photo-1609137144813-7d9921338f24?w=400&auto=format&fit=crop&q=80"]
      },
      {
        _id: "dev-prod-3",
        itemName: "Fresh Orange Marigold Flowers Garland (3 Feet)",
        name: "Fresh Orange Marigold Flowers Garland (3 Feet)",
        userPrice: 150,
        afterDiscount: 120,
        baseMrp: 150,
        baseSellingPrice: 120,
        rating: 4.9,
        reviews: 94,
        brand: "Fresh Harvest",
        tag: "Daily Fresh",
        subCategoryId: pFlow,
        subcategory: pFlow,
        subCategoryName: "Flowers & Garlands",
        childCategoryId: `child-${pFlow}-1`,
        childCategoryName: "Fresh Marigold Garlands",
        images: ["https://images.unsplash.com/photo-1561181286-d3fee7d55364?w=400&auto=format&fit=crop&q=80"]
      },
      {
        _id: "dev-prod-4",
        itemName: "Fragrant Jasmine & Pink Rose Flower String (Set of 5)",
        name: "Fragrant Jasmine & Pink Rose Flower String (Set of 5)",
        userPrice: 250,
        afterDiscount: 199,
        baseMrp: 250,
        baseSellingPrice: 199,
        rating: 4.8,
        reviews: 78,
        brand: "Fresh Harvest",
        tag: "Handpicked",
        subCategoryId: pFlow,
        subcategory: pFlow,
        subCategoryName: "Flowers & Garlands",
        childCategoryId: `child-${pFlow}-2`,
        childCategoryName: "Jasmine & Rose Strings",
        images: ["https://images.unsplash.com/photo-1526047932273-341f2a7631f9?w=400&auto=format&fit=crop&q=80"]
      },
      {
        _id: "dev-prod-5",
        itemName: "Complete Satyanarayana Vratham Pooja Samagri Kit",
        name: "Complete Satyanarayana Vratham Pooja Samagri Kit",
        userPrice: 1250,
        afterDiscount: 999,
        baseMrp: 1250,
        baseSellingPrice: 999,
        rating: 5.0,
        reviews: 140,
        brand: "PavitraSamagri",
        tag: "All-in-One Kit",
        subCategoryId: pKits,
        subcategory: pKits,
        subCategoryName: "Pooja Kits & Ritual Kits",
        childCategoryId: `child-${pKits}-2`,
        childCategoryName: "Satyanarayana Vratham Kit",
        images: ["https://images.unsplash.com/photo-1621849400072-f554417f7051?w=400&auto=format&fit=crop&q=80"]
      },
      {
        _id: "dev-prod-6",
        itemName: "Premium Heavy Brass Kuber Diya Set of 2",
        name: "Premium Heavy Brass Kuber Diya Set of 2",
        userPrice: 699,
        afterDiscount: 499,
        baseMrp: 699,
        baseSellingPrice: 499,
        rating: 4.9,
        reviews: 112,
        brand: "HandicraftsIndia",
        tag: "Pure Brass",
        subCategoryId: pIdols,
        subcategory: pIdols,
        subCategoryName: "Idols & Brass Decor",
        childCategoryId: `child-${pIdols}-1`,
        childCategoryName: "Pure Brass Diyas & Lamps",
        images: ["https://images.unsplash.com/photo-1590076175571-c5e7e616d82d?w=400&auto=format&fit=crop&q=80"]
      },
      {
        _id: "dev-prod-7",
        itemName: "Handcrafted Panchaloha Lord Ganesha Idol (6 Inches)",
        name: "Handcrafted Panchaloha Lord Ganesha Idol (6 Inches)",
        userPrice: 1800,
        afterDiscount: 1499,
        baseMrp: 1800,
        baseSellingPrice: 1499,
        rating: 4.9,
        reviews: 88,
        brand: "DivineStatues",
        tag: "Blessings",
        subCategoryId: pIdols,
        subcategory: pIdols,
        subCategoryName: "Idols & Brass Decor",
        childCategoryId: `child-${pIdols}-2`,
        childCategoryName: "Marble & Brass Idols",
        images: ["https://images.unsplash.com/photo-1567591414441-9430c4516709?w=400&auto=format&fit=crop&q=80"]
      },
      {
        _id: "dev-prod-8",
        itemName: "Grand Festival Deepavali Pooja Thali & Sweet Combo",
        name: "Grand Festival Deepavali Pooja Thali & Sweet Combo",
        userPrice: 1500,
        afterDiscount: 1199,
        baseMrp: 1500,
        baseSellingPrice: 1199,
        rating: 4.8,
        reviews: 62,
        brand: "ApexCombos",
        tag: "Festive Special",
        subCategoryId: pFest,
        subcategory: pFest,
        subCategoryName: "Festival Combos",
        childCategoryId: `child-${pFest}-1`,
        childCategoryName: "Grand Festival Puja Thali Combo",
        images: ["https://images.unsplash.com/photo-1577083552431-6e5fd01aa342?w=400&auto=format&fit=crop&q=80"]
      }
    ];
  }
  return [];
}

// Mapping to detect "virtual" service/non-product categories
const SERVICE_CATEGORIES = new Set([
  "plumbing", "electrician", "home cleaning", "salon & spa", "ac repair", "pest control",
  "painting", "interiors", "cleaning", "beauty", "salon", "spa", "repair", "mechanic",
  "carpenter", "interior", "designer",
]);
const LEARNING_CATEGORIES = new Set([
  "business", "technology", "digital marketing", "finance", "design", "languages",
  "marketing", "coding", "course", "learn", "education",
]);
const TRAVEL_CATEGORIES = new Set([
  "flights", "hotels", "bus tickets", "train", "cab booking", "tour packages",
  "flight", "hotel", "bus", "cab", "tour", "travel",
]);
const FINANCE_CATEGORIES = new Set([
  "insurance", "loans", "investments", "apexbee wallet", "bill payments", "recharge",
  "wallet", "loan", "invest", "bill", "payment",
]);
const EARN_CATEGORIES = new Set([
  "refer & earn", "become a partner", "sell on apexbee", "build your team", "franchise",
  "delivery partner", "refer", "partner", "franchise", "sell", "earn", "team",
]);

// Colors by group for service/virtual detail pages
const GROUP_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  service: { bg: "linear-gradient(135deg,#0ea5e9 0%,#06b6d4 100%)", text: "#0ea5e9", border: "#bae6fd" },
  learning: { bg: "linear-gradient(135deg,#10b981 0%,#059669 100%)", text: "#10b981", border: "#a7f3d0" },
  travel: { bg: "linear-gradient(135deg,#f59e0b 0%,#f97316 100%)", text: "#f59e0b", border: "#fde68a" },
  finance: { bg: "linear-gradient(135deg,#8b5cf6 0%,#6c63ff 100%)", text: "#8b5cf6", border: "#ddd6fe" },
  earn: { bg: "linear-gradient(135deg,#f97316 0%,#f59e0b 100%)", text: "#f97316", border: "#fed7aa" },
};

function detectVirtualCategory(name: string): keyof typeof GROUP_COLORS | null {
  const n = name.trim().toLowerCase();
  if (n.includes("service")) return "service";
  if (n.includes("academy") || n.includes("learning") || n.includes("course")) return "learning";
  if (n.includes("travel") || n.includes("tour") || n.includes("flight")) return "travel";
  if (n.includes("finance") || n.includes("insurance") || n.includes("loan")) return "finance";
  if (n.includes("earn") || n.includes("referral")) return "earn";
  return null;
}

const VIRTUAL_LABELS: Record<string, { emoji: string; title: string; sub: string; cta: string }> = {
  service: { emoji: "🔧", title: "Service Booking", sub: "Book top-rated professionals near you", cta: "Browse All Services" },
  learning: { emoji: "🎓", title: "ApexBee Academy", sub: "Expert-led courses to grow your skills", cta: "Explore Courses" },
  travel: { emoji: "✈️", title: "ApexBee Travel", sub: "Best deals on flights, hotels & packages", cta: "Explore Travel" },
  finance: { emoji: "💰", title: "ApexBee Finance", sub: "Smart financial tools for every goal", cta: "Explore Finance" },
  earn: { emoji: "🐝", title: "Earn With ApexBee", sub: "Turn your network into unlimited income", cta: "Start Earning" },
};

function getSubIcon(name?: string): string {
  const iconMap: Record<string, string> = {
    devotional: "🙏",
    fashion: "👗", electronics: "📱", home: "🏠", "home & living": "🏠",
    beauty: "💄", sports: "⚽", books: "📚", toys: "🧸", food: "🍕",
    grocery: "🛒", jewelry: "💎", sarees: "🪡", furniture: "🪑", sale: "🔥",
    plumbing: "🔧", electrician: "⚡", "home cleaning": "🧹", "salon & spa": "💅",
    "ac repair": "❄️", "pest control": "🐛", painting: "🎨", interiors: "🛋️",
    business: "💼", technology: "💻", "digital marketing": "📣",
    design: "🎨", languages: "🌐",
    flights: "✈️", hotels: "🏨", "bus tickets": "🚌", train: "🚂",
    "cab booking": "🚕", "tour packages": "🗺️",
    insurance: "🛡️", loans: "🏦", investments: "📈",
    "apexbee wallet": "👝", "bill payments": "💡", recharge: "📲",
    "refer & earn": "🎁", "become a partner": "🤝", "sell on apexbee": "🏪",
    "build your team": "👥", franchise: "🏢", "delivery partner": "🛵",
    "daily needs": "🛒", "food & dining": "🍽️", "business hub": "💼", "shopping": "🛍️",
    "apexbee academy": "🎓", "services": "🔧", "finance": "💰", "events": "📅",
    "tours & travels": "✈️", "pets": "🐾", "health & wellness": "❤", "kids world": "👶",
    "women's empire": "👑", "delivery & logistics": "🚚"
  };
  return iconMap[(name || "").trim().toLowerCase()] || "🛍️";
}

// ═══════════════════════════════════════════════════════
// Recently Viewed (localStorage)
// ═══════════════════════════════════════════════════════
const RECENTLY_VIEWED_KEY = "apexbee_recently_viewed_cats";

function addRecentlyViewed(cat: { id: string; name: string; icon: string }) {
  try {
    const stored: any[] = JSON.parse(localStorage.getItem(RECENTLY_VIEWED_KEY) || "[]");
    const updated = [cat, ...stored.filter((c) => c.id !== cat.id)].slice(0, 6);
    localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(updated));
  } catch { }
}

function getRecentlyViewed(): { id: string; name: string; icon: string }[] {
  try { return JSON.parse(localStorage.getItem(RECENTLY_VIEWED_KEY) || "[]"); }
  catch { return []; }
}

// Dynamic rich details mapping for informative layouts
const getCategoryDetails = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes("devotional")) {
    return {
      subs: "5 Subcategories",
      prods: "200 Products",
      tags: ["Puja Kits", "Incense", "Idols", "Devotional Books"]
    };
  }
  if (n.includes("daily") || n.includes("grocery") || n.includes("need")) {
    return {
      subs: "24 Subcategories",
      prods: "18,000 Products",
      tags: ["Milk", "Water Can", "Tomatoes", "Sunflower Oil", "Aashirvaad Atta"]
    };
  }
  if (n.includes("food") || n.includes("dining") || n.includes("restaurant")) {
    return {
      subs: "45 Restaurants",
      prods: "600 Menu Items (1200+ Dishes)",
      tags: ["Biryani", "Dosa", "Nellore Breakfast", "Pizza", "Bakery Cake"]
    };
  }
  if (n.includes("service") || n.includes("cleaning") || n.includes("plumb")) {
    return {
      subs: "95 Professionals",
      prods: "35 Services (4.8 Avg Rating)",
      tags: ["AC Repair", "Plumbing", "Electrical", "Home Cleaning", "Salon & Spa"]
    };
  }
  if (n.includes("academy") || n.includes("learn")) {
    return {
      subs: "12 Curated Tracks",
      prods: "140 Courses (Certified)",
      tags: ["Direct Selling", "MLM Leadership", "Digital Marketing", "Finance"]
    };
  }
  // Default values
  return {
    subs: "8 Subcategories",
    prods: "1,200 Products",
    tags: ["Explore", "Nearby Stores", "Popular", "Offers"]
  };
};

const StarRating = ({ rating, size = 12 }: { rating: number; size?: number }) => (
  <span className="inline-flex gap-px">
    {[1, 2, 3, 4, 5].map((s) => (
      <span key={s} style={{ color: s <= Math.round(rating) ? "#f59e0b" : "#d1d5db", fontSize: size }}>★</span>
    ))}
  </span>
);

// Virtual / service category detail page
const VirtualCategoryPage = ({ name }: { name: string }) => {
  const type = detectVirtualCategory(name) || "service";
  const theme = GROUP_COLORS[type];
  const labels = VIRTUAL_LABELS[type];
  const navigate = useNavigate();

  useEffect(() => {
    if (type === "service") navigate("/services", { replace: true });
    else if (type === "learning") navigate("/academy", { replace: true });
    else if (type === "travel") navigate("/travel", { replace: true });
    else if (type === "earn") navigate("/earn-with-apexbee", { replace: true });
    else if (type === "finance") navigate("/community", { replace: true });
  }, [type, navigate]);

  const highlights = [
    { icon: "✅", label: "Verified Professionals" },
    { icon: "⚡", label: "Quick Booking" },
    { icon: "🔒", label: "Secure Payments" },
    { icon: "⭐", label: "Top Rated" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="w-full" style={{ background: theme.bg }}>
        <div className="container mx-auto px-4 py-14 text-center">
          <div className="text-7xl mb-4 drop-shadow-lg">{getSubIcon(name)}</div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-3 drop-shadow">
            {name}
          </h1>
          <p className="text-white/80 text-lg mb-6">{labels.sub}</p>
          <div className="flex justify-center gap-4 flex-wrap mb-8">
            {highlights.map((h) => (
              <div key={h.label} className="flex items-center gap-2 bg-white/20 backdrop-blur rounded-full px-4 py-2 text-white text-sm font-semibold">
                <span>{h.icon}</span> {h.label}
              </div>
            ))}
          </div>
          <Link
            to="/category"
            className="inline-flex items-center gap-2 bg-white text-navy font-bold px-8 py-3 rounded-2xl hover:bg-white/90 transition shadow-lg text-base"
          >
            ← {labels.cta}
          </Link>
        </div>
      </section>

      {/* Breadcrumb */}
      <div className="container mx-auto px-4 py-4">
        <p className="text-sm text-muted-foreground">
          <Link to="/" className="hover:underline">Home</Link>
          {" / "}
          <Link to="/category" className="hover:underline">Categories</Link>
          {" / "}
          <span className="font-medium text-navy">{name}</span>
        </p>
      </div>

      {/* Coming soon card */}
      <section className="container mx-auto px-4 pb-16">
        <div
          className="rounded-3xl border-2 p-10 text-center shadow-lg"
          style={{ borderColor: theme.border, background: `${theme.text}08` }}
        >
          <div className="text-6xl mb-5 animate-bounce inline-block">🚀</div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-navy mb-3">
            {name} — Launching Soon!
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto mb-8 text-base">
            We're onboarding the best {name.toLowerCase()} professionals in your city. Be the first to know when we go live!
          </p>

          {/* Notify form */}
          <div className="max-w-sm mx-auto flex gap-3">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2"
              style={{ "--tw-ring-color": theme.text } as any}
            />
            <button
              className="rounded-xl px-5 py-3 text-sm font-bold text-white transition hover:opacity-90"
              style={{ background: theme.bg }}
            >
              Notify Me
            </button>
          </div>

          <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: "🏙️", text: "City-wide coverage" },
              { icon: "🤝", text: "100+ partners joining" },
              { icon: "🎯", text: "Best-in-class service" },
              { icon: "💳", text: "Easy pay & cashback" },
            ].map((item) => (
              <div key={item.text} className="rounded-xl border bg-white p-4 text-center shadow-sm">
                <div className="text-3xl mb-2">{item.icon}</div>
                <p className="text-sm font-semibold text-navy">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

// Skeleton card
const SkeletonCard = () => (
  <div className="rounded-2xl overflow-hidden border bg-white animate-pulse">
    <div className="h-44 bg-gray-200" />
    <div className="p-4 space-y-2">
      <div className="h-4 bg-gray-200 rounded w-3/4" />
      <div className="h-3 bg-gray-100 rounded w-1/2" />
    </div>
  </div>
);

// Inline subcategory row
const SubRow = ({ subs, parentName }: { subs: CategoryType[]; parentName: string }) => {
  if (!subs.length) return null;
  return (
    <div className="mt-3 pt-3 border-t border-gray-100">
      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 text-left">Subcategories</p>
      <div className="flex flex-wrap gap-2">
        {subs.map((s) => (
          <Link
            key={s._id}
            to={`/category/${encodeURIComponent(s.name)}`}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1.5 text-xs font-semibold rounded-full border px-3 py-1 bg-gray-50 text-slate-700 hover:bg-accent hover:text-white hover:border-accent transition-all duration-200"
          >
            <span>{getSubIcon(s.name)}</span>
            <span>{s.name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
};

function getSubcategoryImage(name: string, slug?: string): string {
  const n = (name || "").toLowerCase();
  const s = (slug || "").toLowerCase();

  if (n.includes("milk") || n.includes("dairy")) {
    return "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=150&auto=format&fit=crop&q=60";
  }
  if (n.includes("water") || n.includes("can")) {
    return "https://images.unsplash.com/photo-1548839140-29a880455022?w=150&auto=format&fit=crop&q=60";
  }
  if (n.includes("vegetable") || n.includes("fruit") || n.includes("veg")) {
    return "https://images.unsplash.com/photo-1573244514399-52e676d0dd03?w=150&auto=format&fit=crop&q=60";
  }
  if (n.includes("flower") || n.includes("pooja") || n.includes("kit") || n.includes("devotional")) {
    return "https://images.unsplash.com/photo-1561181286-d3fee7d55364?w=150&auto=format&fit=crop&q=60";
  }
  if (n.includes("bakery") || n.includes("bread") || n.includes("dessert") || n.includes("cake")) {
    return "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=150&auto=format&fit=crop&q=60";
  }
  if (n.includes("grocery") || n.includes("groceries")) {
    return "https://images.unsplash.com/photo-1542838132-92c53300491e?w=150&auto=format&fit=crop&q=60";
  }
  if (n.includes("household") || n.includes("supply") || n.includes("supplies") || n.includes("clean")) {
    return "https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=150&auto=format&fit=crop&q=60";
  }
  if (n.includes("saree") || n.includes("ethnic") || n.includes("fashion") || n.includes("clothing") || n.includes("wear")) {
    return "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=150&auto=format&fit=crop&q=60";
  }
  if (n.includes("electronic") || n.includes("appliance") || n.includes("phone")) {
    return "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=150&auto=format&fit=crop&q=60";
  }
  if (n.includes("restaurant") || n.includes("food") || n.includes("dine") || n.includes("dining")) {
    return "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=150&auto=format&fit=crop&q=60";
  }
  if (n.includes("all")) {
    return "https://images.unsplash.com/photo-1533900298318-6b8da08a523e?w=150&auto=format&fit=crop&q=60";
  }
  const fallbacks = [
    "https://images.unsplash.com/photo-1542838132-92c53300491e?w=150&auto=format&fit=crop&q=60",
    "https://images.unsplash.com/photo-1533900298318-6b8da08a523e?w=150&auto=format&fit=crop&q=60",
    "https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=150&auto=format&fit=crop&q=60",
  ];
  const charCodeSum = n.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return fallbacks[charCodeSum % fallbacks.length];
}

const LOCATION_KEY = "apexbee_user_location";

const Category = () => {
  const { categoryName } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // ── User Location state ──
  const [userLocation, setUserLocation] = useState<{ lat?: number; lng?: number; pincode?: string; district?: string } | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCATION_KEY);
      if (saved) setUserLocation(JSON.parse(saved));
    } catch { }
  }, []);

  // Redirect Food & Dining categories to /food
  useEffect(() => {
    if (categoryName) {
      const lower = decodeURIComponent(categoryName).toLowerCase();
      if (lower.includes("food") || lower.includes("dining") || lower.includes("restaurant")) {
        navigate("/food", { replace: true });
      }
    }
  }, [categoryName, navigate]);

  // ── Discovery state ──
  const [allCats, setAllCats] = useState<CategoryType[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<{ id: string; name: string; icon: string }[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [discoveryLoading, setDiscoveryLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeCategoryTab, setActiveCategoryTab] = useState<string>("ALL");
  const [activeBanner, setActiveBanner] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveBanner((prev) => (prev + 1) % 4);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  // ── Detail state ──
  const [category, setCategory] = useState<CategoryType | null>(null);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [childCategories, setChildCategories] = useState<CategoryType[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string | null>(null);
  const [selectedChildCategoryId, setSelectedChildCategoryId] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState<string>("relevance");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(12);
  const rightScrollRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  // ── Left Filter State ──
  const [filters, setFilters] = useState({
    products: true,
    services: true,
    nearby: true,
    offers: true,
    scheduled: true,
    subscription: true
  });

  const handleFilterToggle = (key: keyof typeof filters) => {
    setFilters(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // ── Search autocomplete suggestions ──
  const suggestions = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    const matches: string[] = [];
    if ("flowers".includes(q) || "jasmine".includes(q) || "rose".includes(q) || "pooja".includes(q)) {
      matches.push("🌼 Flowers", "🌼 Jasmine", "🌼 Rose", "🌼 Marigold", "🌼 Pooja Flowers", "🌼 Flower Subscription");
    }
    if ("water".includes(q) || "can".includes(q)) {
      matches.push("💧 Drinking Water Can 20L", "💧 Water Subscription", "💧 Mineral Water");
    }
    if ("milk".includes(q) || "dairy".includes(q)) {
      matches.push("🥛 Cow Milk 1L", "🥛 Buffalo Milk 1L", "🥛 Organic Milk", "🥛 Nandini Milk");
    }
    if ("vegetables".includes(q) || "tomato".includes(q) || "onion".includes(q)) {
      matches.push("🥬 Fresh Tomatoes 1kg", "🥬 Fresh Onions 1kg", "🥬 Green Vegetables Basket");
    }
    if ("ac".includes(q) || "repair".includes(q) || "service".includes(q)) {
      matches.push("🔧 AC Repair & Gas Refill", "🔧 AC Deep Cleaning", "🔧 Split AC Servicing");
    }
    if ("biryani".includes(q) || "food".includes(q) || "restaurant".includes(q)) {
      matches.push("🍔 Biryani Special Dhabha", "🍔 Dosa Nellore Breakfast", "🍔 Chocolate Cake Bakery");
    }
    return matches;
  }, [searchQuery]);

  const virtualType = categoryName ? detectVirtualCategory(categoryName) : null;

  // ─────────────── Fetch ALL categories for discovery ───────────────
  useEffect(() => {
    if (categoryName) return;
    setRecentlyViewed(getRecentlyViewed());
    const go = async () => {
      setDiscoveryLoading(true);
      try {
        const res = await axios.get(`${API_BASE}/categories`);
        const flat: CategoryType[] = (res.data?.categories || []).filter((c: CategoryType) => c.isActive !== false);

        const getParentIdStr = (pId: any): string | null => {
          if (!pId) return null;
          if (typeof pId === 'object') return pId._id ? String(pId._id) : null;
          return String(pId);
        };

        // Build parent → children tree
        const parentMap = new Map<string, CategoryType>();
        const parents: CategoryType[] = [];
        flat.forEach((c) => {
          const pId = getParentIdStr(c.parentId);
          if (!pId) {
            c.children = [];
            parentMap.set(String(c._id), c);
            parents.push(c);
          }
        });
        flat.forEach((c) => {
          const pId = getParentIdStr(c.parentId);
          if (pId) {
            const p = parentMap.get(pId);
            if (p) p.children = [...(p.children || []), c];
          }
        });

        // SORT CATEGORIES IN THE EXACT REQUESTED ORDER
        parents.sort((a, b) => {
          const nameA = a.name.toLowerCase();
          const nameB = b.name.toLowerCase();

          const getIndex = (name: string) => {
            if (name.includes("devotional")) return 0;
            if (name.includes("daily") || name.includes("grocery") || name.includes("need")) return 1;
            if (name.includes("food") || name.includes("dining") || name.includes("restaurant")) return 2;
            if (name.includes("business") || name.includes("hub")) return 3;
            if (name.includes("shopping") || name.includes("fashion") || name.includes("electronics")) return 4;
            if (name.includes("academy") || name.includes("learn")) return 5;
            if (name.includes("service") || name.includes("cleaning") || name.includes("plumb")) return 6;
            if (name.includes("finance") || name.includes("wallet")) return 7;
            if (name.includes("event")) return 8;
            if (name.includes("travel") || name.includes("tour")) return 9;
            if (name.includes("pet")) return 10;
            if (name.includes("health") || name.includes("wellness") || name.includes("pharmacy")) return 11;
            if (name.includes("kid")) return 12;
            if (name.includes("women")) return 13;
            if (name.includes("delivery") || name.includes("logistic") || name.includes("pickup")) return 14;
            return 99;
          };

          return getIndex(nameA) - getIndex(nameB);
        });

        setAllCats(parents);
      } catch (e) {
        console.error(e);
      } finally {
        setDiscoveryLoading(false);
      }
    };
    go();
  }, [categoryName]);

  // ─────────────── Fetch category detail ───────────────
  useEffect(() => {
    if (!categoryName) return;
    if (detectVirtualCategory(categoryName)) {
      setLoading(false);
      return;
    }
    const go = async () => {
      setLoading(true);
      try {
        const catRes = await axios.get(`${API_BASE}/categories`);
        const flat: CategoryType[] = catRes?.data?.categories || [];
        const cleanName = (s: string) => s.replace(/[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDC00-\uDFFF]/g, '').trim().toLowerCase();
        const reqClean = cleanName(categoryName);
        const reqLower = categoryName.trim().toLowerCase();

        const found = flat.find((c) => {
          const n1 = c.name.trim().toLowerCase();
          const cn1 = cleanName(c.name);
          const slug = (c.slug || '').toLowerCase();
          return n1 === reqLower || cn1 === reqClean || slug === reqLower || slug === reqClean.replace(/[^a-z0-9]+/g, '-') || cn1.includes(reqClean) || reqClean.includes(cn1);
        });
        if (!found) {
          setCategory(null);
          setLoading(false);
          return;
        }

        // Read URL query params
        const subParam = searchParams.get("sub");
        const childParam = searchParams.get("child");

        let mainCategory = found;
        let selectedSubId: string | null = subParam || null;

        const getParentIdStr = (pId: any): string | null => {
          if (!pId) return null;
          if (typeof pId === 'object') return pId._id ? String(pId._id) : null;
          return String(pId);
        };

        const foundPId = getParentIdStr(found.parentId);
        if (foundPId && !subParam) {
          const parent = flat.find((c) => String(c._id) === foundPId);
          if (parent) {
            mainCategory = parent;
            selectedSubId = String(found._id);
          }
        }

        addRecentlyViewed({ id: mainCategory._id, name: mainCategory.name, icon: getSubIcon(mainCategory.name) });
        setCategory(mainCategory);

        // Get children as subcategories (Level 2) of the main category
        const subs = flat.filter((c) => {
          const pId = getParentIdStr(c.parentId);
          return pId === String(mainCategory._id);
        });
        const mappedSubs = subs.map((s) => ({ _id: String(s._id), name: s.name, image: s.image, slug: s.slug }));

        // Fetch active subcategories from the Subcategory collection via API
        let finalSubs = mappedSubs;
        try {
          const subRes = await axios.get(`${API_BASE}/categories/${mainCategory._id}/subcategories`);
          if (subRes.data?.success && Array.isArray(subRes.data.subcategories)) {
            const apiSubs = subRes.data.subcategories.map((s: any) => ({
              _id: String(s._id),
              name: s.name,
              image: s.image || s.banner,
              slug: s.slug
            }));
            const allSubsMap = new Map();
            mappedSubs.forEach(s => allSubsMap.set(String(s._id), s));
            apiSubs.forEach((s: any) => allSubsMap.set(String(s._id), s));
            finalSubs = Array.from(allSubsMap.values());
          }
        } catch (subErr) {
          console.error("Error fetching database subcategories:", subErr);
        }

        // Fallback subcategories if empty for Pets or Devotional
        if (finalSubs.length === 0 && cleanName(mainCategory.name).includes("pet")) {
          finalSubs = [
            { _id: "sub-pet-food", name: "Pet Food", image: "https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=200&auto=format&fit=crop&q=60" },
            { _id: "sub-pet-grooming", name: "Pet Grooming", image: "https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=200&auto=format&fit=crop&q=60" },
            { _id: "sub-pet-accessories", name: "Pet Accessories", image: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=200&auto=format&fit=crop&q=60" },
            { _id: "sub-pet-vet", name: "Veterinary Care", image: "https://images.unsplash.com/photo-1576201836106-db1758fd1c97?w=200&auto=format&fit=crop&q=60" },
            { _id: "sub-pet-boarding", name: "Pet Boarding", image: "https://images.unsplash.com/photo-1541599540903-216a46ca1dc0?w=200&auto=format&fit=crop&q=60" },
          ];
        } else if (finalSubs.length === 0 && (cleanName(mainCategory.name).includes("devotional") || cleanName(mainCategory.name).includes("puja") || cleanName(mainCategory.name).includes("pooja"))) {
          finalSubs = [
            { _id: "sub-devotional-essentials", name: "Pooja Essentials", image: "https://images.unsplash.com/photo-1606293926075-69a00dbfde81?w=200&auto=format&fit=crop&q=60" },
            { _id: "sub-devotional-flowers", name: "Flowers & Garlands", image: "https://images.unsplash.com/photo-1561181286-d3fee7d55364?w=200&auto=format&fit=crop&q=60" },
            { _id: "sub-devotional-kits", name: "Pooja Kits & Ritual Kits", image: "https://images.unsplash.com/photo-1621849400072-f554417f7051?w=200&auto=format&fit=crop&q=60" },
            { _id: "sub-devotional-idols", name: "Idols & Brass Decor", image: "https://images.unsplash.com/photo-1590076175571-c5e7e616d82d?w=200&auto=format&fit=crop&q=60" },
            { _id: "sub-devotional-festival", name: "Festival Combos", image: "https://images.unsplash.com/photo-1577083552431-6e5fd01aa342?w=200&auto=format&fit=crop&q=60" },
          ];
        }

        // Match selected subcategory from URL if provided
        if (subParam) {
          const matchedSub = finalSubs.find(s => String(s._id) === subParam || s.slug === subParam || s.name.toLowerCase() === subParam.toLowerCase() || s.name.toLowerCase().includes(subParam.toLowerCase()));
          if (matchedSub) selectedSubId = String(matchedSub._id);
        }

        setSelectedSubcategoryId(selectedSubId);
        if (childParam) setSelectedChildCategoryId(childParam);

        setSubcategories(finalSubs);

        // Get Level 3 Child Categories
        const subIds = new Set(finalSubs.map(s => String(s._id)));
        const level3FromTree = flat.filter((c) => {
          const pId = getParentIdStr(c.parentId);
          return pId && subIds.has(pId);
        });

        let builtChildCategories: CategoryType[] = level3FromTree;
        if (builtChildCategories.length === 0) {
          finalSubs.forEach(sub => {
            const sName = sub.name.toLowerCase();
            if (sName.includes("food")) {
              builtChildCategories.push(
                { _id: `child-${sub._id}-1`, name: "Dog Food & Kibble", parentId: sub._id },
                { _id: `child-${sub._id}-2`, name: "Cat Food & Gravy", parentId: sub._id },
                { _id: `child-${sub._id}-3`, name: "Bird & Fish Food", parentId: sub._id }
              );
            } else if (sName.includes("groom")) {
              builtChildCategories.push(
                { _id: `child-${sub._id}-1`, name: "Pet Shampoos & Oils", parentId: sub._id },
                { _id: `child-${sub._id}-2`, name: "Brushes & Combs", parentId: sub._id },
                { _id: `child-${sub._id}-3`, name: "Nail Clippers & Trimmers", parentId: sub._id }
              );
            } else if (sName.includes("access")) {
              builtChildCategories.push(
                { _id: `child-${sub._id}-1`, name: "Collars, Belts & Leashes", parentId: sub._id },
                { _id: `child-${sub._id}-2`, name: "Pet Beds & Cages", parentId: sub._id },
                { _id: `child-${sub._id}-3`, name: "Chew & Interactive Toys", parentId: sub._id }
              );
            } else if (sName.includes("vet") || sName.includes("care")) {
              builtChildCategories.push(
                { _id: `child-${sub._id}-1`, name: "Flea & Tick Powders", parentId: sub._id },
                { _id: `child-${sub._id}-2`, name: "Health Supplements", parentId: sub._id },
                { _id: `child-${sub._id}-3`, name: "Deworming & First Aid", parentId: sub._id }
              );
            } else if (sName.includes("essential")) {
              builtChildCategories.push(
                { _id: `child-${sub._id}-1`, name: "Agarbatti & Incense", parentId: sub._id },
                { _id: `child-${sub._id}-2`, name: "Camphor & Dhoop", parentId: sub._id },
                { _id: `child-${sub._id}-3`, name: "Deepam Oil & Wicks", parentId: sub._id },
                { _id: `child-${sub._id}-4`, name: "Kumkum & Turmeric", parentId: sub._id }
              );
            } else if (sName.includes("flower") || sName.includes("garland")) {
              builtChildCategories.push(
                { _id: `child-${sub._id}-1`, name: "Fresh Marigold Garlands", parentId: sub._id },
                { _id: `child-${sub._id}-2`, name: "Jasmine & Rose Strings", parentId: sub._id },
                { _id: `child-${sub._id}-3`, name: "Fresh Lotus & Hibiscus", parentId: sub._id }
              );
            } else if (sName.includes("kit") || sName.includes("ritual")) {
              builtChildCategories.push(
                { _id: `child-${sub._id}-1`, name: "Daily Pooja Kit", parentId: sub._id },
                { _id: `child-${sub._id}-2`, name: "Satyanarayana Vratham Kit", parentId: sub._id },
                { _id: `child-${sub._id}-3`, name: "Ayudha & Vehicle Pooja Kit", parentId: sub._id }
              );
            } else if (sName.includes("idol") || sName.includes("decor") || sName.includes("brass")) {
              builtChildCategories.push(
                { _id: `child-${sub._id}-1`, name: "Pure Brass Diyas & Lamps", parentId: sub._id },
                { _id: `child-${sub._id}-2`, name: "Marble & Brass Idols", parentId: sub._id }
              );
            } else if (sName.includes("festival") || sName.includes("combo")) {
              builtChildCategories.push(
                { _id: `child-${sub._id}-1`, name: "Grand Festival Puja Thali Combo", parentId: sub._id },
                { _id: `child-${sub._id}-2`, name: "Special Vrat Samagri Combo", parentId: sub._id }
              );
            }
          });
        }
        setChildCategories(builtChildCategories);

        // Fetch products by categoryId or categoryName — include user location for hyperlocal scoping
        let fetchedProds: Product[] = [];
        try {
          let prodUrl = `${API_BASE}/products?categoryId=${mainCategory._id}&category=${encodeURIComponent(mainCategory.name)}&limit=100`;
          const loc = (() => { try { return JSON.parse(localStorage.getItem(LOCATION_KEY) || 'null'); } catch { return null; } })();
          if (loc?.lat && loc?.lng) {
            prodUrl += `&lat=${loc.lat}&lng=${loc.lng}`;
          } else if (loc?.pincode) {
            prodUrl += `&pincode=${loc.pincode}`;
          }
          if (loc?.district) prodUrl += `&district=${encodeURIComponent(loc.district)}`;

          const prodRes = await axios.get(prodUrl);
          const rawProds: Product[] = prodRes?.data?.products || [];

          // Apply local vs Pan-India scoping on the client too
          fetchedProds = rawProds.filter((p: any) => {
            const scope = p.deliveryScope;
            const isPan = p.isPanIndia || scope === 'pan_india' || scope === 'both';
            if (isPan) return true;
            // If no location known, show all
            if (!loc?.pincode && !loc?.lat) return true;
            // For local products, only show if vendor is in same pincode area
            const vendorPin = p.vendorPincode || p.sellerId?.pincode;
            if (loc?.pincode && vendorPin) return String(loc.pincode).trim() === String(vendorPin).trim();
            // If distance is within 20 km show it
            if (p.calculatedDistanceKm !== null && p.calculatedDistanceKm !== undefined) return p.calculatedDistanceKm <= 20;
            return true; // default show if no geo data
          });

          // Fallback: if all products got filtered out, show pan-india/all (no strict local filter)
          if (fetchedProds.length === 0) fetchedProds = rawProds;
        } catch (pErr) {
          console.error("Error fetching products:", pErr);
        }

        if (fetchedProds.length === 0) {
          try {
            const fallbackDbRes = await axios.get(`${API_BASE}/products?limit=100`);
            const allDbProds: Product[] = fallbackDbRes?.data?.products || Array.isArray(fallbackDbRes?.data) ? fallbackDbRes.data : [];
            const reqCatName = (mainCategory.name || categoryName || '').toLowerCase();
            const matchedDb = allDbProds.filter((p: any) => {
              const cName = (p.categoryName || p.category || '').toString().toLowerCase();
              const pName = (p.itemName || p.name || '').toString().toLowerCase();
              return cName.includes(reqCatName) || reqCatName.includes(cName) || pName.includes(reqCatName);
            });
            if (matchedDb.length > 0) {
              fetchedProds = matchedDb;
            }
          } catch (dbErr) {
            console.error("DB product search fallback error:", dbErr);
          }
        }

        if (fetchedProds.length === 0) {
          fetchedProds = getDemoProducts(categoryName, mainCategory, finalSubs, builtChildCategories);
        }

        setAllProducts(fetchedProds);
      } catch (err) {
        console.error(err);
        setCategory(null);
      } finally {
        setLoading(false);
      }
    };
    go();
  }, [categoryName, searchParams]);

  const activeChildCategories = useMemo(() => {
    if (selectedSubcategoryId) {
      return childCategories.filter(c => {
        const pId = typeof c.parentId === 'object' ? (c.parentId as any)?._id : c.parentId;
        return String(pId) === String(selectedSubcategoryId);
      });
    }
    return childCategories;
  }, [childCategories, selectedSubcategoryId]);

  // ─────────────── Derived Filtered Products ───────────────
  const filteredProducts = useMemo(() => {
    let list = allProducts;

    if (selectedSubcategoryId) {
      const sub = subcategories.find((s) => String(s._id) === String(selectedSubcategoryId));
      const subName = sub?.name?.toLowerCase();

      list = list.filter((p) => {
        const pSubId = String(p.subCategoryId || p.subcategoryId || p.subcategory || '');
        const pSubName = String(p.subCategoryName || p.subcategory || '').toLowerCase();
        return pSubId === String(selectedSubcategoryId) || (subName && (pSubName === subName || pSubName.includes(subName) || subName.includes(pSubName)));
      });
    }

    if (selectedChildCategoryId) {
      const child = childCategories.find((c) => String(c._id) === String(selectedChildCategoryId));
      const childName = child?.name?.toLowerCase();

      list = list.filter((p) => {
        const pChildId = String(p.childCategoryId || p.childcategoryId || '');
        const pName = String(p.name || p.itemName || '').toLowerCase();
        const pTag = String(p.tag || '').toLowerCase();
        const pChildName = String(p.childCategoryName || '').toLowerCase();
        return pChildId === String(selectedChildCategoryId) || (childName && (pChildName.includes(childName) || pName.includes(childName) || pTag.includes(childName) || (childName.split(' ')[0].length > 2 && pName.includes(childName.split(' ')[0]))));
      });
    }

    // Apply sorting
    switch (sortOption) {
      case "price_low":
        list = [...list].sort((a, b) => (Number(a.baseSellingPrice ?? a.afterDiscount ?? 0)) - (Number(b.baseSellingPrice ?? b.afterDiscount ?? 0)));
        break;
      case "price_high":
        list = [...list].sort((a, b) => (Number(b.baseSellingPrice ?? b.afterDiscount ?? 0)) - (Number(a.baseSellingPrice ?? a.afterDiscount ?? 0)));
        break;
      case "popularity":
        list = [...list].sort((a, b) => (b.reviews ?? 0) - (a.reviews ?? 0));
        break;
      case "newest":
        list = [...list].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        break;
      default:
        break;
    }

    return list;
  }, [allProducts, selectedSubcategoryId, selectedChildCategoryId, subcategories, childCategories, sortOption]);

  // Pagination & Scroll resetting
  useEffect(() => {
    setCurrentPage(1);
    rightScrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [selectedSubcategoryId, selectedChildCategoryId, sortOption]);

  useEffect(() => {
    rightScrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentPage]);

  const totalPages = useMemo(() => Math.ceil(filteredProducts.length / itemsPerPage) || 1, [filteredProducts.length, itemsPerPage]);

  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(start, start + itemsPerPage);
  }, [filteredProducts, currentPage, itemsPerPage]);

  const selectedSubName = useMemo(
    () => subcategories.find((s) => String(s._id) === String(selectedSubcategoryId))?.name ?? null,
    [selectedSubcategoryId, subcategories]
  );

  // Filter discovery parents by search
  const filteredParents = useMemo(() => {
    if (!searchQuery.trim()) return allCats;
    const q = searchQuery.toLowerCase();
    return allCats.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.children || []).some((s) => s.name.toLowerCase().includes(q))
    );
  }, [allCats, searchQuery]);

  const filteredCategoriesByTab = useMemo(() => {
    let list = filteredParents;
    if (activeCategoryTab !== "ALL") {
      list = list.filter((cat) => {
        const name = cat.name.toLowerCase();
        if (activeCategoryTab === "GROCERY") return name.includes("daily") || name.includes("grocery") || name.includes("food") || name.includes("dining");
        if (activeCategoryTab === "FASHION") return name.includes("fashion") || name.includes("shopping") || name.includes("saree") || name.includes("boutique");
        if (activeCategoryTab === "SERVICES") return name.includes("service") || name.includes("repair") || name.includes("cleaning") || name.includes("plumb");
        if (activeCategoryTab === "HEALTH") return name.includes("health") || name.includes("pharmacy") || name.includes("wellness");
        if (activeCategoryTab === "DEVOTIONAL") return name.includes("devotional") || name.includes("puja") || name.includes("pooja");
        return true;
      });
    }
    return list;
  }, [filteredParents, activeCategoryTab]);

  // Accent gradients
  const GRADIENTS = [
    "linear-gradient(135deg,#1e3c72,#2a5298)",
    "linear-gradient(135deg,#0ea5e9,#06b6d4)",
    "linear-gradient(135deg,#f59e0b,#f97316)",
    "linear-gradient(135deg,#10b981,#059669)",
    "linear-gradient(135deg,#ec4899,#f43f5e)",
    "linear-gradient(135deg,#8b5cf6,#6d28d9)",
    "linear-gradient(135deg,#14b8a6,#0d9488)",
  ];

  // ═══════════════════════════════════════════════════════
  // VIRTUAL SERVICE PAGE (Plumbing, Salon, Courses, etc.)
  // ═══════════════════════════════════════════════════════
  if (categoryName && virtualType) {
    return <VirtualCategoryPage name={categoryName} />;
  }

  // ═══════════════════════════════════════════════════════
  // LOADING
  // ═══════════════════════════════════════════════════════
  if (categoryName && loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-32 text-center font-sans">
          <div className="inline-flex flex-col items-center gap-4">
            <div className="w-14 h-14 rounded-full border-4 border-navy border-t-transparent animate-spin" />
            <p className="text-muted-foreground font-medium">Loading category…</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════
  // SUBCATEGORIES GRID VIEW PAGE (e.g. /category/Devotional/subcategories)
  // ═══════════════════════════════════════════════════════
  const isSubRoute = location.pathname.includes("/subcategories");
  const subQuery = searchParams.get("sub");
  if (categoryName && category && (isSubRoute || (!selectedSubcategoryId && !subQuery))) {
    return (
      <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
        <Navbar />

        {/* Breadcrumb */}
        <div className="bg-white border-b border-slate-200 py-3 px-4 sm:px-8">
          <div className="max-w-[1400px] mx-auto flex items-center space-x-2 text-xs font-medium text-slate-500">
            <Link to="/" className="hover:text-amber-600 transition">Home</Link>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <Link to="/categories" className="hover:text-amber-600 transition">Categories</Link>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <span className="text-slate-900 font-bold capitalize">{category.name} Subcategories</span>
          </div>
        </div>

        {/* Hero Header */}
        <div className="bg-[#0A1128] text-white py-10 px-4 sm:px-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="max-w-[1400px] mx-auto text-center space-y-3 relative z-10">
            <div className="text-6xl mb-2 animate-bounce inline-block">{getSubIcon(category.name)}</div>
            <h1 className="text-2xl sm:text-4xl font-black text-white font-heading">
              {category.name} Subcategories
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-lg mx-auto leading-relaxed">
              Explore curated subcategories below. Select any subcategory to view child categories and products.
            </p>
          </div>
        </div>

        {/* Subcategories Grid */}
        <div className="max-w-[1400px] mx-auto px-4 sm:px-8 py-10">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-heading">
                All Subcategories ({subcategories.length})
              </h2>
              <p className="text-xs text-slate-500 font-semibold mt-0.5">Click any subcategory to browse child categories and products</p>
            </div>
            <Link
              to="/categories"
              className="text-xs font-extrabold text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 px-4 py-2 rounded-xl border border-amber-200 transition"
            >
              ← All Categories
            </Link>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 sm:gap-4 lg:gap-6 pt-2 sm:pt-4">
            {subcategories.map((sub) => {
              const subImg = sub.image || getSubcategoryImage(sub.name, sub.slug);

              return (
                <div
                  key={sub._id}
                  onClick={() => {
                    setSelectedSubcategoryId(sub._id);
                    setSelectedChildCategoryId(null);
                    navigate(`/category/${encodeURIComponent(category.name)}?sub=${encodeURIComponent(sub._id)}`);
                  }}
                  className="group flex flex-col items-center text-center cursor-pointer hover:-translate-y-1 transition duration-300"
                >
                  {/* BIG HD PURE IMAGE ONLY — 4 PER ROW ON MOBILE */}
                  <div className="w-full h-20 sm:h-36 md:h-48 lg:h-56 overflow-hidden flex items-center justify-center p-1 bg-white rounded-2xl border border-slate-100/80 shadow-2xs group-hover:border-amber-400 group-hover:shadow-md transition">
                    <img
                      src={subImg}
                      alt={sub.name}
                      className="w-full h-full object-contain group-hover:scale-105 transition duration-500 ease-out"
                      loading="lazy"
                    />
                  </div>

                  {/* PROMINENT SUBCATEGORY NAME BELOW */}
                  <h3 className="font-black text-[11px] sm:text-sm lg:text-base text-[#0A1128] group-hover:text-amber-600 transition leading-tight mt-1.5 line-clamp-2">
                    {sub.name}
                  </h3>
                </div>
              );
            })}
          </div>
        </div>

        <Footer />
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════
  // CATEGORY DETAIL VIEW — FLIPKART DESKTOP STYLE
  // ═══════════════════════════════════════════════════════
  if (categoryName && category) {
    const discountPct = (p: Product) => {
      const up = p.baseMrp ?? p.userPrice;
      const ad = p.baseSellingPrice ?? p.afterDiscount;
      return up && ad ? Math.round(((up - ad) / up) * 100) : 0;
    };

    return (
      <div className="min-h-screen bg-[#f1f3f6] font-sans text-slate-900">
        <Navbar />

        {/* ── Flipkart-style Breadcrumb Strip ── */}
        <div className="bg-white border-b border-slate-200 py-2.5 px-3 sm:px-6 lg:px-8">
          <div className="max-w-[1400px] mx-auto flex items-center space-x-2 text-xs font-medium text-slate-500">
            <Link to="/" className="hover:text-amber-600 transition">Home</Link>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <Link to="/categories" className="hover:text-amber-600 transition">Categories</Link>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <span className="text-slate-900 font-bold capitalize">{category.name}</span>
          </div>
        </div>

        {/* ═══════════════ MAIN CATEGORY CONTAINER ═══════════════ */}
        <div className="w-full max-w-[1400px] mx-auto px-1.5 sm:px-4 lg:px-8 flex flex-row items-start gap-1.5 sm:gap-3 lg:gap-5 py-2 sm:py-3 lg:py-4 h-[calc(100vh-125px)] overflow-hidden font-sans">

          {/* ── LEFT SIDEBAR (SHOWS ONLY CHILD CATEGORIES OF ACTIVE SUBCATEGORY) ── */}
          <div className="w-[100px] sm:w-[140px] lg:w-[260px] shrink-0 bg-white rounded-xl shadow-xs h-full overflow-y-auto border border-slate-200/80 font-sans flex flex-col divide-y divide-slate-100">

            {/* Sidebar Header */}
            <div className="flex flex-col items-start px-2.5 lg:px-5 py-3 lg:py-4 border-b border-slate-100 gap-1 bg-slate-50/60">
              <button
                type="button"
                onClick={() => navigate(`/category/${encodeURIComponent(category.name)}/subcategories`)}
                className="text-[10px] lg:text-xs font-black text-amber-600 hover:text-amber-700 flex items-center gap-1 border-none bg-transparent cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Subcategories</span>
              </button>
              <div className="flex flex-col lg:flex-row lg:items-center justify-between w-full mt-1 gap-1">
                <h3 className="text-xs lg:text-sm font-black text-slate-900 leading-tight">
                  {selectedSubName || category.name}
                </h3>
                <span className="text-[9px] lg:text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full w-fit">
                  {activeChildCategories.length} Child Categories
                </span>
              </div>
            </div>

            {/* Child Categories List Only */}
            <div className="p-1.5 lg:p-3 flex flex-col gap-1.5 flex-1">
              <span className="hidden lg:block text-[10px] font-black text-slate-400 uppercase tracking-wider px-2 py-1">
                Child Categories:
              </span>

              {/* "All [Subcategory]" Button */}
              <button
                type="button"
                onClick={() => setSelectedChildCategoryId(null)}
                className={`w-full flex items-center justify-between py-2.5 px-2 lg:px-4 rounded-xl text-left transition cursor-pointer border-none ${!selectedChildCategoryId
                  ? "bg-[#0A1128] text-amber-400 font-extrabold shadow-sm"
                  : "bg-slate-50 text-slate-700 hover:bg-slate-100 font-semibold"
                  }`}
              >
                <span className="text-[11px] lg:text-xs line-clamp-1">All {selectedSubName || "Items"}</span>
                {!selectedChildCategoryId && <span className="text-amber-400 text-xs">●</span>}
              </button>

              {/* Child Category Items */}
              {activeChildCategories.map((child) => {
                const isActive = selectedChildCategoryId === child._id;
                const childImg = child.image || getSubcategoryImage(child.name, child.slug);

                return (
                  <button
                    key={child._id}
                    type="button"
                    onClick={() => setSelectedChildCategoryId(isActive ? null : child._id)}
                    className={`w-full flex items-center gap-2.5 py-2.5 px-2 lg:px-4 rounded-xl text-left transition cursor-pointer border-none ${isActive
                      ? "bg-[#0A1128] text-amber-400 font-extrabold shadow-sm"
                      : "bg-white text-slate-800 hover:bg-slate-50 font-semibold border border-slate-100"
                      }`}
                  >
                    <div className={`w-6 h-6 lg:w-7 lg:h-7 rounded-lg overflow-hidden shrink-0 border ${isActive ? "border-amber-400" : "border-slate-200"}`}>
                      <img src={childImg} alt={child.name} className="w-full h-full object-cover" />
                    </div>
                    <span className="text-[11px] lg:text-xs line-clamp-2 leading-tight flex-1">{child.name}</span>
                    {isActive && <span className="text-amber-400 text-xs shrink-0">●</span>}
                  </button>
                );
              })}

              {activeChildCategories.length === 0 && (
                <div className="py-8 text-center text-slate-400 space-y-1">
                  <p className="text-xs font-bold">No child categories</p>
                  <p className="text-[10px]">Showing all subcategory items</p>
                </div>
              )}
            </div>
          </div>

          {/* ── RIGHT MAIN CONTENT AREA ── */}
          <div className="flex-1 min-w-0 w-full h-full flex flex-col overflow-hidden bg-white rounded-xl border border-slate-200 shadow-sm">

            {/* ── FLIPKART-STYLE SORT / FILTER TOOLBAR ── */}
            <div className="bg-white border-b border-slate-200 px-4 lg:px-6 py-3 flex items-center justify-between gap-3 shrink-0 z-10">
              <div className="flex items-center gap-3 overflow-x-auto scrollbar-none shrink min-w-0">
                {/* Section Title */}
                <div className="shrink-0">
                  <h2 className="text-sm lg:text-base font-black text-slate-900 leading-tight whitespace-nowrap">
                    {selectedSubName || "All Products"}
                  </h2>
                  <p className="text-[10px] lg:text-xs text-slate-500 font-semibold whitespace-nowrap">
                    (Showing {filteredProducts.length} products)
                  </p>
                </div>

                {/* Separator */}
                <div className="hidden lg:block w-px h-8 bg-slate-200 shrink-0" />

                {/* Sort Chips — Desktop */}
                <div className="hidden lg:flex items-center gap-2 shrink-0">
                  <span className="text-xs font-bold text-slate-500">Sort By</span>
                  {[
                    { label: "Relevance", value: "relevance" },
                    { label: "Popularity", value: "popularity" },
                    { label: "Price – Low to High", value: "price_low" },
                    { label: "Price – High to Low", value: "price_high" },
                    { label: "Newest First", value: "newest" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer border-none whitespace-nowrap ${sortOption === opt.value
                        ? "bg-[#0A1128] text-[#F3BA12] shadow-sm"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        }`}
                      onClick={() => setSortOption(opt.value)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* View Mode Switcher & Clear Filter */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setViewMode("list")}
                    title="List View (Detailed)"
                    className={`p-1.5 rounded-md transition cursor-pointer border-none flex items-center gap-1 ${viewMode === "list"
                      ? "bg-[#0A1128] text-[#F3BA12] shadow-xs"
                      : "text-slate-500 hover:text-slate-800"
                      }`}
                  >
                    <List className="w-4 h-4" />
                    <span className="text-[10px] font-bold hidden sm:inline">List</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("grid")}
                    title="Grid View (Compact)"
                    className={`p-1.5 rounded-md transition cursor-pointer border-none flex items-center gap-1 ${viewMode === "grid"
                      ? "bg-[#0A1128] text-[#F3BA12] shadow-xs"
                      : "text-slate-500 hover:text-slate-800"
                      }`}
                  >
                    <LayoutGrid className="w-4 h-4" />
                    <span className="text-[10px] font-bold hidden sm:inline">Grid</span>
                  </button>
                </div>

                {selectedSubcategoryId && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSubcategoryId(null);
                      setSelectedChildCategoryId(null);
                    }}
                    className="text-[11px] font-bold text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-lg transition border-none cursor-pointer whitespace-nowrap"
                  >
                    ✕ Clear Filter
                  </button>
                )}
              </div>
            </div>

            {/* ── SCROLLABLE PRODUCT LISTING CONTAINER ── */}
            <div ref={rightScrollRef} className="flex-1 overflow-y-auto bg-white p-0 rounded-b-xl min-h-0 touch-pan-y">
              {filteredProducts.length === 0 ? (
                <div className="py-20 text-center p-8 space-y-3">
                  <div className="text-5xl">🔍</div>
                  <h3 className="text-lg font-black text-slate-800">No items available</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto font-medium">Try choosing a different subcategory from the left menu.</p>
                </div>
              ) : viewMode === "grid" ? (
                /* ════════════════════════════════════════════
                   TYPE 1: VERTICAL GRID CARDS (2-COL ON MOBILE)
                   ════════════════════════════════════════════ */
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-3 sm:p-4 lg:p-6 justify-items-center w-full">
                  {paginatedProducts.map((product) => (
                    <ProductCard key={product._id || product.id} product={product} className="w-full max-w-full shrink" />
                  ))}
                </div>
              ) : (
                /* ════════════════════════════════════════════
                   TYPE 2: HORIZONTAL LIST CARDS (COMPACT ROW ON MOBILE)
                   ════════════════════════════════════════════ */
                <div className="divide-y divide-slate-100 lg:divide-y lg:divide-slate-200/60">
                  {paginatedProducts.map((product) => {
                    const title = product.name || product.itemName || "Product";
                    const img = product.images?.[0] || product.thumbnail || "/placeholder-product.png";
                    const afterDiscount = product.baseSellingPrice ?? product.afterDiscount;
                    const userPrice = product.baseMrp ?? product.userPrice;
                    const priceNum = typeof afterDiscount === "number" ? afterDiscount : 0;
                    const mrpNum = typeof userPrice === "number" ? userPrice : 0;
                    const priceStr = priceNum > 0 ? `₹${priceNum.toLocaleString("en-IN")}` : "Price N/A";
                    const dp = discountPct(product);
                    const rating = product.rating ?? 4.8;
                    const reviews = product.reviews ?? 45;
                    const shippingFee = product.shippingCharge || product.adminPricing?.shippingCharge || 0;

                    return (
                      <div
                        key={product._id}
                        onClick={() => navigate(`/product/${product._id}`)}
                        className="group flex flex-row items-center p-2.5 sm:p-4 lg:p-5 gap-2.5 sm:gap-4 cursor-pointer hover:bg-slate-50/60 transition-colors duration-200"
                      >
                        {/* PRODUCT IMAGE - COMPACT 24x24 BOX ON MOBILE */}
                        <div className="relative w-20 h-20 sm:w-40 sm:h-40 lg:w-[220px] lg:h-[180px] shrink-0 flex items-center justify-center bg-white rounded-lg sm:rounded-xl p-1 sm:p-3 border border-slate-100">
                          <img
                            src={img}
                            alt={title}
                            className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-500"
                            loading="lazy"
                          />
                          {dp > 0 && (
                            <span className="absolute top-1 left-1 sm:top-2 sm:left-2 bg-rose-500 text-white text-[8px] sm:text-[10px] font-black px-1 sm:px-2 py-0.2 rounded shadow-xs">
                              {dp}% off
                            </span>
                          )}
                        </div>

                        {/* PRODUCT INFO */}
                        <div className="flex-1 min-w-0 space-y-1">
                          <h4 className="text-xs sm:text-base font-semibold text-slate-800 line-clamp-2 leading-snug group-hover:text-amber-600 transition font-heading">
                            {title}
                          </h4>

                          {/* Rating + Brand Row */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <div className="inline-flex items-center gap-0.5 bg-amber-500 text-[#0A1128] px-1.5 py-[1px] rounded text-[10px] font-bold">
                              <span>{rating}</span>
                              <Star className="w-2.5 h-2.5 fill-[#0A1128] text-[#0A1128]" />
                            </div>
                            <span className="text-[10px] text-slate-400 font-semibold truncate">
                              ({reviews} Reviews)
                            </span>
                            {product.brand && (
                              <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded truncate">
                                {product.brand}
                              </span>
                            )}
                          </div>

                          {/* Middle feature badges (hidden on mobile, visible on tablet+) */}
                          <div className="hidden sm:flex flex-wrap items-center gap-1.5 my-1.5">
                            <span className="inline-flex items-center gap-1 bg-slate-100 border border-slate-200/80 px-2 py-0.5 rounded text-[11px] font-semibold text-slate-700">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                              100% Quality Assured
                            </span>
                            <span className="inline-flex items-center gap-1 bg-slate-100 border border-slate-200/80 px-2 py-0.5 rounded text-[11px] font-semibold text-slate-700">
                              <ShieldCheck className="w-3 h-3 text-blue-600 shrink-0" />
                              Hygienically Sealed
                            </span>
                          </div>

                          {/* Price + Delivery + CTA Row */}
                          <div className="flex items-center justify-between gap-2 pt-0.5">
                            <div>
                              <div className="flex items-baseline gap-1">
                                <span className="text-xs sm:text-lg font-black text-slate-900">{priceStr}</span>
                                {mrpNum > priceNum && (
                                  <span className="text-[9px] sm:text-xs text-slate-400 line-through font-medium">
                                    ₹{mrpNum.toLocaleString("en-IN")}
                                  </span>
                                )}
                                {dp > 0 && (
                                  <span className="text-[10px] sm:text-xs font-bold text-rose-600">
                                    {dp}% off
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-1.5 text-[9px] sm:text-[11px] font-semibold">
                                <span className="text-emerald-600 font-bold">
                                  {shippingFee > 0 ? `Delivery ₹${shippingFee}` : "FREE Delivery"}
                                </span>
                                <span className="text-slate-400">·</span>
                                <span className="text-slate-500">
                                  ⚡ 15–30 Mins
                                </span>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/product/${product._id}`);
                              }}
                              className="bg-[#0A1128] hover:bg-[#F3BA12] text-white hover:text-[#0A1128] font-bold text-xs px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl flex items-center gap-1 transition shadow-xs border-none cursor-pointer shrink-0"
                            >
                              <ShoppingCart className="w-3 h-3" />
                              <span className="text-[10px] sm:text-xs">Add</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── BOTTOM PAGINATION BAR ── */}
            {filteredProducts.length > 0 && (
              <div className="bg-white border-t border-slate-200 px-4 lg:px-6 py-2.5 shrink-0 flex flex-wrap items-center justify-between gap-3 text-xs font-semibold text-slate-600">
                {/* Count Summary */}
                <div className="flex items-center gap-1.5 text-slate-500 text-[11px] sm:text-xs">
                  <span>Showing</span>
                  <span className="font-black text-slate-900">
                    {Math.min((currentPage - 1) * itemsPerPage + 1, filteredProducts.length)} - {Math.min(currentPage * itemsPerPage, filteredProducts.length)}
                  </span>
                  <span>of</span>
                  <span className="font-black text-slate-900">{filteredProducts.length}</span>
                  <span>items</span>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-3">
                  {/* Items per page selector */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold text-slate-400">Per page:</span>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => {
                        setItemsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold px-2 py-1 focus:outline-none cursor-pointer"
                    >
                      <option value={8}>8</option>
                      <option value={12}>12</option>
                      <option value={24}>24</option>
                      <option value={36}>36</option>
                    </select>
                  </div>

                  {/* Page numbers */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                      className="px-2 py-1 rounded-lg border border-slate-200 text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition cursor-pointer"
                    >
                      ← Prev
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                      .map((p, idx, arr) => {
                        const prev = arr[idx - 1];
                        return (
                          <span key={p} className="flex items-center">
                            {prev && p - prev > 1 && <span className="px-1 text-slate-400">…</span>}
                            <button
                              type="button"
                              onClick={() => setCurrentPage(p)}
                              className={`w-7 h-7 rounded-lg text-xs font-black transition cursor-pointer border-none ${currentPage === p
                                ? "bg-[#0A1128] text-[#F3BA12] shadow-xs"
                                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                                }`}
                            >
                              {p}
                            </button>
                          </span>
                        );
                      })}

                    <button
                      type="button"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                      className="px-2 py-1 rounded-lg border border-slate-200 text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition cursor-pointer"
                    >
                      Next →
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <Footer />
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════
  // DISCOVERY LANDING PAGE (Clean Category Directory)
  // ═══════════════════════════════════════════════════════
  const CATEGORY_TABS = [
    { id: "ALL", label: "All Categories", icon: "✨" },
    { id: "GROCERY", label: "Groceries & Food", icon: "🛒" },
    { id: "FASHION", label: "Fashion & Lifestyle", icon: "👗" },
    { id: "SERVICES", label: "Home & Services", icon: "🛠️" },
    { id: "HEALTH", label: "Health & Wellness", icon: "💊" },
    { id: "DEVOTIONAL", label: "Devotional & Puja", icon: "🏛️" },
  ];

  const CATEGORY_HERO_BANNERS = [
    {
      id: 1,
      title: 'Daily Needs & Instant Grocery Delivery',
      subtitle: 'Milk, fresh vegetables, 20L water cans & household essentials delivered fast',
      discount: 'FLAT 25% OFF',
      code: 'DAILYNEEDS25',
      image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1200&auto=format&fit=crop',
      gradient: 'from-amber-600 via-amber-700 to-orange-900',
      tag: '🛒 FAST 15-MIN DELIVERY',
    },
    {
      id: 2,
      title: 'Puja Flowers & Devotional Samagri',
      subtitle: 'Fresh marigold garlands, Bhimseni kapoor, brass diyas & complete puja kits',
      discount: 'SPECIAL DISCOUNTS',
      code: 'PUJAFLOWERS',
      image: 'https://images.unsplash.com/photo-1606293926075-69a00dbfde81?q=80&w=1200&auto=format&fit=crop',
      gradient: 'from-orange-600 via-rose-700 to-amber-900',
      tag: '🌸 FRESH HARVEST',
    },
    {
      id: 3,
      title: 'Certified Doorstep Home & AC Services',
      subtitle: 'AC repair, gas refilling, home deep cleaning & certified electrician service',
      discount: 'UP TO ₹300 OFF',
      code: 'HOMESERVICE',
      image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=1200&auto=format&fit=crop',
      gradient: 'from-indigo-700 via-blue-800 to-slate-950',
      tag: '🛠️ DOORSTEP CERTIFIED',
    },
    {
      id: 4,
      title: 'Trendy Fashion & Boutique Apparel',
      subtitle: 'Designer silk sarees, kids party outfits & premium ethnic wear',
      discount: 'MIN 30% OFF',
      code: 'FASHIONFEST',
      image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=1200&auto=format&fit=crop',
      gradient: 'from-pink-700 via-purple-800 to-slate-950',
      tag: '👗 TRENDY COLLECTION',
    },
  ];

  const currentHeroBanner = CATEGORY_HERO_BANNERS[activeBanner];

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <Navbar />

      {/* ── DYNAMIC ANIMATED HERO SLIDER BANNER (LIKE /food) ── */}
      <div className="relative bg-[#0A1128] text-white overflow-hidden text-left">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-500/15 rounded-full blur-[120px] pointer-events-none animate-pulse" />
        <div className="absolute -bottom-20 left-10 w-96 h-96 bg-orange-500/15 rounded-full blur-[100px] pointer-events-none" />

        <div className="container mx-auto px-4 sm:px-8 pt-6 pb-10 relative z-10">
          <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-white/10 group min-h-[320px] sm:min-h-[380px] flex items-center">
            <img
              key={currentHeroBanner.id}
              src={currentHeroBanner.image}
              alt={currentHeroBanner.title}
              className="absolute inset-0 w-full h-full object-cover transition-all duration-700 ease-in-out scale-105 group-hover:scale-100"
            />
            <div className={`absolute inset-0 bg-gradient-to-r ${currentHeroBanner.gradient} opacity-85 mix-blend-multiply`} />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

            {/* SLIDER CONTENT */}
            <div className="relative z-20 p-6 sm:p-10 max-w-2xl space-y-3.5 text-left">
              <div className="inline-flex items-center space-x-2 bg-amber-400 text-slate-950 px-3 py-1 rounded-full font-black text-xs shadow-lg animate-bounce">
                <Flame className="w-3.5 h-3.5 text-slate-950" />
                <span>{currentHeroBanner.tag}</span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-black text-white font-heading leading-tight tracking-tight drop-shadow-md">
                {currentHeroBanner.title}
              </h1>

              <p className="text-xs sm:text-sm text-slate-200 font-medium max-w-lg leading-relaxed">
                {currentHeroBanner.subtitle}
              </p>

              <div className="pt-1 flex flex-wrap items-center gap-3">
                <div className="px-4 py-2 bg-amber-500 text-slate-950 font-black rounded-2xl text-xs sm:text-sm shadow-xl flex items-center space-x-2">
                  <Tag className="w-4 h-4" />
                  <span>{currentHeroBanner.discount}</span>
                </div>
                <div className="px-3.5 py-2 bg-white/20 backdrop-blur-md text-white font-mono font-bold text-xs rounded-2xl border border-white/30">
                  CODE: <span className="text-amber-300 font-extrabold">{currentHeroBanner.code}</span>
                </div>
              </div>
            </div>

            {/* CAROUSEL DOTS & CONTROLS */}
            <div className="absolute bottom-4 right-6 z-30 flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setActiveBanner((prev) => (prev === 0 ? CATEGORY_HERO_BANNERS.length - 1 : prev - 1))}
                className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md hover:bg-white/40 text-white flex items-center justify-center transition border-none cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex space-x-1.5 px-2">
                {CATEGORY_HERO_BANNERS.map((b, idx) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setActiveBanner(idx)}
                    className={`h-2 rounded-full transition-all border-none cursor-pointer ${activeBanner === idx ? "w-6 bg-amber-400" : "w-2 bg-white/40"
                      }`}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={() => setActiveBanner((prev) => (prev + 1) % CATEGORY_HERO_BANNERS.length)}
                className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md hover:bg-white/40 text-white flex items-center justify-center transition border-none cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Clean Light Page Header ── */}
      <section className="bg-white border-b border-slate-200 py-6 text-left">
        <div className="container mx-auto px-4 space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight font-heading">
                All Marketplace Categories
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
                Explore local products, fresh groceries, daily needs, fashion, and certified doorstep services near you.
              </p>
            </div>

            {/* Search Input Bar */}
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search category (e.g. Daily Needs, Flowers)..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 pl-10 pr-9 py-2.5 text-xs font-semibold placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white transition"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-sm font-black bg-transparent border-none cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Category Filter Tabs */}
          <div className="pt-2 flex items-center gap-2 overflow-x-auto scrollbar-none font-sans">
            {CATEGORY_TABS.map((tab) => {
              const active = activeCategoryTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveCategoryTab(tab.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 transition flex items-center space-x-1.5 cursor-pointer border-none ${active
                    ? "bg-[#0A1128] text-amber-400 shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                    }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Category Cards Grid Container — 2-COLUMN ON MOBILE ── */}
      <section className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 text-left">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h2 className="text-base sm:text-lg font-black text-slate-900 font-heading">
            {activeCategoryTab === "ALL" ? "Main Categories" : CATEGORY_TABS.find(t => t.id === activeCategoryTab)?.label}
          </h2>
          <span className="text-xs font-extrabold bg-slate-200 text-slate-800 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full">
            {filteredCategoriesByTab.length} Categories
          </span>
        </div>

        {discoveryLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : filteredCategoriesByTab.length === 0 ? (
          <div className="py-20 text-center border border-dashed border-slate-300 rounded-3xl bg-white p-8 space-y-3">
            <Search className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-lg font-black text-slate-800">No categories found matching "{searchQuery}"</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">Try clearing your search query or choosing another tab.</p>
            <Button
              onClick={() => {
                setSearchQuery("");
                setActiveCategoryTab("ALL");
              }}
              className="bg-[#0A1128] hover:bg-slate-800 text-white text-xs font-extrabold rounded-xl px-5 py-2.5 cursor-pointer border-none"
            >
              Clear Search Filter
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-4 lg:gap-6 pt-2 sm:pt-4">
            {filteredCategoriesByTab.map((cat) => {
              const isComingSoon = cat.experienceType === 'coming_soon_lead_capture';
              const isFoodCat = cat.name.toLowerCase().includes("food") || cat.name.toLowerCase().includes("dining") || cat.name.toLowerCase().includes("restaurant");
              const targetRoute = isFoodCat ? "/food" : (isComingSoon && cat.experienceRoute ? cat.experienceRoute : `/category/${encodeURIComponent(cat.name)}`);
              const defaultImage = "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=800&auto=format&fit=crop";
              const image = cat.image || defaultImage;

              return (
                <div
                  key={cat._id}
                  onClick={() => {
                    addRecentlyViewed({ id: cat._id, name: cat.name, icon: getSubIcon(cat.name) });
                    if (isFoodCat) {
                      navigate("/food");
                    } else {
                      navigate(`/category/${encodeURIComponent(cat.name)}/subcategories`);
                    }
                  }}
                  className="group flex flex-col items-center text-center cursor-pointer hover:-translate-y-1 transition duration-300"
                >
                  {/* BIG HD PURE IMAGE ONLY — 3 PER ROW ON MOBILE */}
                  <div className="w-full h-24 sm:h-44 md:h-60 lg:h-72 overflow-hidden flex items-center justify-center p-1 bg-white rounded-2xl border border-slate-100/80 shadow-2xs group-hover:border-amber-400 group-hover:shadow-md transition">
                    <img
                      src={image}
                      alt={cat.name}
                      className="w-full h-full object-contain group-hover:scale-105 transition duration-500 ease-out"
                      loading="lazy"
                    />
                  </div>

                  {/* PROMINENT CATEGORY NAME BELOW */}
                  <h3 className="font-black text-xs sm:text-base lg:text-xl text-[#0A1128] group-hover:text-amber-600 transition leading-tight mt-1.5 line-clamp-2">
                    {cat.name}
                  </h3>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
};

export default Category;
