import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Utensils,
  Search,
  Star,
  Clock,
  MapPin,
  Sparkles,
  Tag,
  Flame,
  ChevronRight,
  ShieldCheck,
  Store,
  ChevronLeft,
  ShoppingBag,
  Plus,
  Minus,
  CheckCircle,
  Calendar,
  Users,
  Award,
  BadgePercent,
  X,
  Eye,
  Play,
  Volume2,
  VolumeX,
  PhoneCall,
  Info,
  Check,
} from 'lucide-react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { DynamicHeroBanner } from '../components/DynamicHeroBanner';

const API_BASE = import.meta.env.VITE_API_URL || 'https://server.apexbee.in/api';

const formatRating = (val: any) => {
  if (!val) return '4.8';
  if (typeof val === 'number' || typeof val === 'string') return val.toString();
  if (typeof val === 'object' && val.average !== undefined) return val.average.toString();
  return '4.8';
};

// HIGH-DEF FOOD HERO SLIDER BANNERS
const HERO_BANNERS = [
  {
    id: 1,
    title: 'Authentic Hyderabadi Dum Biryani',
    subtitle: 'Slow-cooked in handis with pure ghee & royal spices',
    discount: 'FLAT 50% OFF',
    code: 'BIRYANIFEST',
    image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?q=80&w=1200&auto=format&fit=crop',
    gradient: 'from-amber-600 via-amber-700 to-orange-900',
    tag: '👑 BESTSELLER',
  },
  {
    id: 2,
    title: 'Gourmet Pizzas & Sizzling Starters',
    subtitle: 'Extra cheese crusts delivered piping hot in 25 minutes',
    discount: 'BUY 1 GET 1 FREE',
    code: 'CHEESY24',
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=1200&auto=format&fit=crop',
    gradient: 'from-orange-600 via-red-700 to-amber-900',
    tag: '🔥 FLASH SALE',
  },
  {
    id: 3,
    title: 'Crispy South Indian Breakfast Tiffins',
    subtitle: 'Golden ghee dosas, vada & steaming filter coffee',
    discount: 'FREE DELIVERY',
    code: 'FRESHMORNING',
    image: 'https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?q=80&w=1200&auto=format&fit=crop',
    gradient: 'from-emerald-700 via-teal-800 to-slate-900',
    tag: '🌱 PURE VEG SPECIAL',
  },
  {
    id: 4,
    title: 'Rich Desserts, Thick Shakes & Cakes',
    subtitle: 'Indulgent Belgian chocolate cakes & fresh fruit sundaes',
    discount: 'UP TO ₹150 OFF',
    code: 'SWEETTREAT',
    image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?q=80&w=1200&auto=format&fit=crop',
    gradient: 'from-pink-700 via-rose-800 to-purple-950',
    tag: '🍰 DESSERT FEST',
  },
];

// DINEOUT VENUES DATA WITH RICH IMAGES & VIDEO DETAILS
const DINEOUT_RESTAURANTS = [
  {
    id: 'do-tamsi-1',
    name: 'Tamsi Royal Family Dhaba & Dining',
    cuisine: 'Telangana Special, Hyderabadi & Tandoori',
    locality: 'Tamsi Mandal, Adilabad - 504312',
    pincode: '504312',
    mandal: 'Tamsi',
    district: 'Adilabad',
    rating: 4.9,
    offer: 'FLAT 25% OFF ON TOTAL DINING BILL',
    costForTwo: '₹800',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?w=800&auto=format&fit=crop',
    ],
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-chef-cooking-food-in-a-pan-43098-large.mp4',
    tag: 'Tamsi Top Pick',
    description: 'Top-rated family dhaba and dining garden in Tamsi Mandal, Adilabad. Serves authentic spicy Telangana curries, dum biryani, and tandoori specials.',
    features: ['👨‍👩‍👧‍👦 Outdoor Family Garden', '🅿️ Ample Parking Space', '🌱 Pure Veg & Non-Veg Sections'],
    timings: '11:00 AM – 10:30 PM (Daily)',
  },
  {
    id: 'do-1',
    name: 'Royal Pavilion Fine Dining',
    cuisine: 'North Indian, Mughlai & Bar',
    locality: 'Jubilee Hills, Road No 36',
    rating: 4.9,
    offer: 'FLAT 30% OFF ON TOTAL BILL',
    costForTwo: '₹1,500',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1537047902294-62a40c20a6ae?w=800&auto=format&fit=crop',
    ],
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-chef-cooking-food-in-a-pan-43098-large.mp4',
    tag: 'Exclusive Luxury',
    description: 'Experience regal dining with authentic Mughlai recipes passed down through generations. Features private dining cabanas, live instrumental music, and curated vintage wine list.',
    features: ['🍷 Full Bar & Cocktails', '🎻 Live Music Sessions', '🅿️ Free Valet Parking', '❄️ Air Conditioned Cabanas', '🌱 Veg & Non-Veg Options'],
    timings: '12:00 PM – 11:30 PM (Daily)',
  },
  {
    id: 'do-2',
    name: 'Skyline Rooftop Bistro & Lounge',
    cuisine: 'Continental, Asian & Cocktails',
    locality: 'Banjara Hills, Road No 12',
    rating: 4.8,
    offer: 'BUY 1 GET 1 DRINK + 20% OFF FOOD',
    costForTwo: '₹1,800',
    image: 'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?w=800&auto=format&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1537047902294-62a40c20a6ae?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&auto=format&fit=crop',
    ],
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-pouring-a-cocktail-in-a-glass-43101-large.mp4',
    tag: 'Romantic Rooftop',
    description: 'Breathtaking 360° panoramic city skyline views with signature wood-fired artisan pizzas, hand-crafted cocktails, and ambient lounge seating under starry skies.',
    features: ['🌌 Open Air Rooftop', '🍹 Mixology Bar', '🎵 DJ & Acoustic Evenings', '🅿️ Valet Parking', '🕯️ Candle Light Dining'],
    timings: '04:00 PM – 01:00 AM (Daily)',
  },
  {
    id: 'do-3',
    name: 'The Spice Route Courtyard',
    cuisine: 'Hyderabadi, South Indian & Tandoori',
    locality: 'Madhapur / Hitech City',
    rating: 4.7,
    offer: 'FLAT 25% OFF ON DINING BILL',
    costForTwo: '₹1,200',
    image: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&auto=format&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?w=800&auto=format&fit=crop',
    ],
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-preparing-a-dish-in-the-kitchen-43095-large.mp4',
    tag: 'Family Favorite',
    description: 'Heritage courtyard ambiance serving authentic Hyderabadi Dum Biryanis, sizzling kebabs, and authentic coastal South Indian delicacies.',
    features: ['🌿 Heritage Courtyard', '👨‍👩‍👧‍👦 Family Seating', '🍚 Unlimited Thalis', '🅿️ Ample Parking', '🌱 Pure Veg Section'],
    timings: '11:30 AM – 11:00 PM (Daily)',
  },
  {
    id: 'do-4',
    name: 'Italiano Trattoria & Cafe',
    cuisine: 'Italian, Woodfired Pizza & Wine',
    locality: 'Gachibowli, Financial District',
    rating: 4.8,
    offer: 'COMPLIMENTARY DESSERT + 20% OFF',
    costForTwo: '₹1,400',
    image: 'https://images.unsplash.com/photo-1537047902294-62a40c20a6ae?w=800&auto=format&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1537047902294-62a40c20a6ae?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?w=800&auto=format&fit=crop',
    ],
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-chef-making-a-pizza-43097-large.mp4',
    tag: 'Live Acoustic',
    description: 'Cozy rustic Italian bistro with authentic brick woodfired pizza ovens, fresh handmade pastas, imported cheeses, and artisanal espresso coffee.',
    features: ['🍕 Woodfired Pizza Oven', '☕ Artisanal Coffee Bar', '🍷 Wine Cellar', '🎶 Live Jazz Nights', '📶 High Speed WiFi'],
    timings: '08:30 AM – 11:00 PM (Daily)',
  },
];

export const FoodDining: React.FC = () => {
  const navigate = useNavigate();

  // 3 MAIN VIEWS: 'items' | 'restaurants' | 'dineout'
  const [activeMainTab, setActiveMainTab] = useState<'items' | 'restaurants' | 'dineout'>('items');

  // State
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [foodProducts, setFoodProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState<string>('ALL');
  const [selectedItemCat, setSelectedItemCat] = useState<string>('ALL');
  const [dietaryFilter, setDietaryFilter] = useState<'ALL' | 'VEG' | 'NON_VEG'>('ALL');
  const [searchParams, setSearchParams] = useSearchParams();

  const subParamRaw = searchParams.get('sub') || searchParams.get('cat') || searchParams.get('tab') || '';

  // Parse incoming category parameters from URL (e.g. /food?sub=Restaurants)
  useEffect(() => {
    const subParam = searchParams.get('sub') || searchParams.get('cat') || searchParams.get('tab');
    if (subParam) {
      const lower = subParam.toLowerCase();
      if (lower.includes('restaurant') || lower === 'restaurants') {
        setActiveMainTab('restaurants');
      } else if (lower.includes('dine') || lower.includes('booking') || lower === 'dineout') {
        setActiveMainTab('dineout');
      } else {
        setActiveMainTab('items');
        setSelectedItemCat(subParam);
        setSearchQuery(subParam);
      }
    } else {
      setSelectedItemCat('ALL');
    }
  }, [searchParams]);

  const handleMainTabChange = (tab: 'items' | 'restaurants' | 'dineout') => {
    setActiveMainTab(tab);
    if (tab === 'restaurants') {
      setSearchParams({ sub: 'Restaurants' });
    } else if (tab === 'dineout') {
      setSearchParams({ sub: 'Dineout' });
    } else {
      if (selectedItemCat && selectedItemCat !== 'ALL') {
        setSearchParams({ sub: selectedItemCat });
      } else {
        setSearchParams({});
      }
    }
  };

  const handleCategoryChipClick = (cat: string) => {
    setSelectedItemCat(cat);
    if (cat === 'ALL') {
      setSearchParams({});
      setSearchQuery('');
    } else {
      setSearchParams({ sub: cat });
      setSearchQuery(cat);
    }
  };

  const handleClearSubcategoryFilter = () => {
    setSearchParams({});
    setActiveMainTab('items');
    setSelectedItemCat('ALL');
    setSearchQuery('');
  };
  const [activeBanner, setActiveBanner] = useState(0);
  const [dineoutVenues, setDineoutVenues] = useState<any[]>([]);

  // ── QUICK VIEW MODAL STATE (FOR FOOD ITEMS) ──
  const [selectedQuickViewItem, setSelectedQuickViewItem] = useState<any | null>(null);
  const [quickViewQty, setQuickViewQty] = useState(1);

  // ── DINEOUT DETAILS & GALLERY/VIDEO MODAL STATE ──
  const [selectedDineoutDetails, setSelectedDineoutDetails] = useState<any | null>(null);
  const [activeGalleryImg, setActiveGalleryImg] = useState<string>('');
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  // Table Booking Modal State
  const [selectedDineoutVenue, setSelectedDineoutVenue] = useState<any>(null);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('19:30');
  const [bookingGuests, setBookingGuests] = useState('2');
  const [bookingSuccess, setBookingSuccess] = useState(false);

  const getActiveUserLocation = () => {
    const userLocRaw = localStorage.getItem("userLocation") || localStorage.getItem("user_location") || localStorage.getItem("apexbee_user_location");
    const userLocation = userLocRaw ? JSON.parse(userLocRaw) : null;
    const activePincode = (localStorage.getItem("userPincode") || userLocation?.pincode || localStorage.getItem("pincode") || "").toString().trim().toLowerCase();
    const activeMandal = (userLocation?.mandal || userLocation?.subdistrict || "").toString().trim().toLowerCase();
    const activeDistrict = (userLocation?.district || userLocation?.city || "").toString().trim().toLowerCase();
    const activeCity = (userLocation?.city || userLocation?.locality || "").toString().trim().toLowerCase();
    const fullAddress = (userLocation?.address || userLocation?.display_name || "").toString().trim().toLowerCase();

    return { activePincode, activeMandal, activeDistrict, activeCity, fullAddress };
  };

  const allCombinedDineout = useMemo(() => {
    const loc = getActiveUserLocation();
    const { activePincode, activeMandal, activeDistrict, fullAddress } = loc;

    const dbDineout = (restaurants || []).map((r: any) => ({
      id: r._id || r.id,
      restaurantId: r._id || r.id,
      name: r.restaurantName || r.name,
      cuisine: Array.isArray(r.cuisines) ? r.cuisines.join(', ') : r.cuisines || 'Multi-Cuisine & Dining',
      locality: r.locality || r.city || 'Hyderabad',
      pincode: r.pincode || r.zipcode || r.address?.pincode || '',
      mandal: r.mandal || '',
      district: r.district || '',
      rating: formatRating(r.rating),
      offer: r.diningInfo?.offer || 'FLAT 20% OFF ON DINING BILL',
      costForTwo: r.diningInfo?.costForTwo || '₹1,200',
      image: r.bannerImage || r.coverBanner || r.coverImage || r.logo || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop',
      gallery: r.diningInfo?.images || [r.bannerImage || r.logo || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop'],
      videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-chef-cooking-food-in-a-pan-43098-large.mp4',
      tag: 'Verified Partner',
      description: r.description || 'Experience premium dining with authentic chef specials, vibrant ambiance, and table service.',
      features: ['🍷 Dining Service', '🅿️ Parking Available', '❄️ AC Seating'],
      timings: '11:00 AM – 11:00 PM'
    }));

    const rawDineout = dineoutVenues.length > 0 ? dineoutVenues : DINEOUT_RESTAURANTS;
    const combined = [...dbDineout];
    rawDineout.forEach(v => {
      if (!combined.some(c => c.name === v.name || c.id === v.id)) {
        combined.push(v);
      }
    });

    if (activePincode || activeMandal || activeDistrict || fullAddress) {
      return combined.filter((v: any) => {
        const vPin = (v.pincode || v.pinCode || v.zipcode || v.address?.pincode || "").toString().toLowerCase();
        const vLoc = (v.locality || v.city || v.mandal || v.district || v.name || "").toString().toLowerCase();
        const vFull = `${vLoc} ${vPin}`.toLowerCase();

        const isTamsiAdilabadUser = activePincode === '504312' || activeMandal.includes('tamsi') || activeDistrict.includes('adilabad') || fullAddress.includes('tamsi') || fullAddress.includes('adilabad');

        if (isTamsiAdilabadUser) {
          const isDistantCity = vFull.includes('buchi') || vFull.includes('nellore') || vFull.includes('hyderabad central') || vFull.includes('secunderabad');
          const isExplicitTamsiAdilabad = vFull.includes('tamsi') || vFull.includes('adilabad') || vPin === '504312';

          if (isDistantCity && !isExplicitTamsiAdilabad) {
            return false;
          }
          if (!isExplicitTamsiAdilabad && vPin && vPin !== '504312' && vPin.length === 6) {
            return false;
          }
        }
        return true;
      });
    }

    return combined;
  }, [restaurants, dineoutVenues]);

  // Strict Pincode, Mandal (Tamsi) & District (Adilabad) Filtered Restaurants
  const filteredRestaurants = useMemo(() => {
    const loc = getActiveUserLocation();
    const { activePincode, activeMandal, activeDistrict, fullAddress } = loc;

    return (restaurants || []).filter((rest: any) => {
      // 1. Strict Location Hierarchy Matching
      if (activePincode || activeMandal || activeDistrict || fullAddress) {
        const restPin = (rest.pincode || rest.zipcode || rest.pinCode || rest.address?.pincode || rest.location?.pincode || "").toString().toLowerCase();
        const restMandal = (rest.mandal || rest.subdistrict || "").toString().toLowerCase();
        const restDistrict = (rest.district || rest.city || "").toString().toLowerCase();
        const restLocality = (rest.locality || rest.address || rest.city || rest.name || rest.restaurantName || "").toString().toLowerCase();
        const restFull = `${restLocality} ${restMandal} ${restDistrict} ${restPin}`.toLowerCase();

        const isTamsiAdilabadUser = activePincode === '504312' || activeMandal.includes('tamsi') || activeDistrict.includes('adilabad') || fullAddress.includes('tamsi') || fullAddress.includes('adilabad');

        if (isTamsiAdilabadUser) {
          const isDistantCity = restFull.includes('buchi') || restFull.includes('nellore') || restFull.includes('hyderabad central') || restFull.includes('secunderabad');
          const isExplicitTamsiAdilabad = restFull.includes('tamsi') || restFull.includes('adilabad') || restPin === '504312';

          if (isDistantCity && !isExplicitTamsiAdilabad) {
            return false;
          }

          if (!isExplicitTamsiAdilabad) {
            if (restPin && restPin !== '504312' && restPin.length === 6) {
              return false;
            }
          }
        } else {
          const matchPin = activePincode && restPin === activePincode;
          const matchMandal = activeMandal && (restMandal.includes(activeMandal) || restLocality.includes(activeMandal));
          const matchDistrict = activeDistrict && (restDistrict.includes(activeDistrict) || restLocality.includes(activeDistrict));

          if (!matchPin && !matchMandal && !matchDistrict) {
            return false;
          }
        }
      }

      // 2. Cuisine Filter
      if (selectedCuisine !== 'ALL') {
        const cuisinesStr = Array.isArray(rest.cuisines) ? rest.cuisines.join(' ') : rest.cuisines || '';
        if (!cuisinesStr.toLowerCase().includes(selectedCuisine.toLowerCase())) {
          return false;
        }
      }

      // 3. Search Query Filter
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const rName = (rest.restaurantName || rest.name || "").toLowerCase();
        const rCuisine = (Array.isArray(rest.cuisines) ? rest.cuisines.join(" ") : rest.cuisines || "").toLowerCase();
        const rLoc = (rest.locality || rest.city || "").toLowerCase();
        return rName.includes(q) || rCuisine.includes(q) || rLoc.includes(q);
      }

      return true;
    });
  }, [restaurants, selectedCuisine, searchQuery]);

  const cuisinesList = [
    { name: 'All Cuisines', value: 'ALL', icon: '🍽️' },
    { name: 'Hyderabadi', value: 'Hyderabadi', icon: '🍲' },
    { name: 'Biryani', value: 'Biryani', icon: '🍚' },
    { name: 'South Indian', value: 'South Indian', icon: '🫓' },
    { name: 'North Indian', value: 'North Indian', icon: '🥘' },
    { name: 'Chinese', value: 'Chinese', icon: '🥢' },
    { name: 'Fast Food', value: 'Fast Food', icon: '🍔' },
    { name: 'Italian', value: 'Italian', icon: '🍕' },
    { name: 'Desserts', value: 'Desserts', icon: '🍰' },
  ];

  const itemCategories = [
    { name: 'All Dishes', value: 'ALL', icon: '🍽️' },
    { name: 'Biryani & Rice', value: 'Biryani', icon: '🍚' },
    { name: 'Thali & Meals', value: 'Thali', icon: '🍱' },
    { name: 'Pizza', value: 'Pizza', icon: '🍕' },
    { name: 'Burgers', value: 'Burgers', icon: '🍔' },
    { name: 'South Tiffins', value: 'Tiffins', icon: '🫓' },
    { name: 'Desserts & Sweets', value: 'Desserts', icon: '🍰' },
    { name: 'Beverages', value: 'Beverages', icon: '🥤' },
  ];

  // Auto-advance hero banner carousel every 4.5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveBanner((prev) => (prev + 1) % HERO_BANNERS.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  // Helper to merge food restaurants with nearby vendor shops (same logic as Home.tsx)
  const combineRestaurantsAndVendors = (foodRestaurants: any[], vendorShops: any[]) => {
    const combined = [...(foodRestaurants || [])];

    (vendorShops || []).forEach((shop: any) => {
      const cat = (shop.category || (shop.categories && shop.categories[0]) || shop.industryType || "").toString().toLowerCase();
      const name = (shop.businessName || shop.shopName || shop.name || "").toString().toLowerCase();

      const isFood = cat.includes("food") || cat.includes("restaurant") || cat.includes("dining") ||
        cat.includes("bakes") || cat.includes("sweets") || cat.includes("cafe") ||
        name.includes("restaurant") || name.includes("biryani") || name.includes("bistro") ||
        name.includes("cafe") || name.includes("diner") || name.includes("dhaba") || name.includes("kitchen");

      if (isFood) {
        const id = shop.id || shop._id;
        const exists = combined.some(r => (r.id === id || r._id === id || (r.restaurantName || r.name)?.toLowerCase() === name));
        if (!exists) {
          combined.push({
            id: id,
            _id: id,
            restaurantName: shop.shopName || shop.businessName || shop.name,
            name: shop.shopName || shop.businessName || shop.name,
            bannerImage: shop.bannerImage || shop.storeDesign?.logo || shop.logoUrl || shop.coverImage || shop.logo || "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=800&auto=format&fit=crop",
            coverImage: shop.bannerImage || shop.storeDesign?.logo || shop.logoUrl || shop.coverImage || shop.logo || "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=800&auto=format&fit=crop",
            logo: shop.logo || shop.storeDesign?.logo || shop.logoUrl,
            cuisines: shop.categories || (shop.category ? [shop.category] : ['Multi-Cuisine & Fast Food']),
            locality: shop.locality || shop.mandal || shop.district || shop.city || 'Local Outlet',
            city: shop.city || shop.district || 'Hyderabad',
            state: shop.state || 'Telangana',
            pincode: shop.pincode || shop.zipcode || (shop.address && typeof shop.address === 'object' ? shop.address.pincode : ''),
            mandal: shop.mandal || '',
            district: shop.district || '',
            rating: shop.rating?.average || shop.rating || '4.8',
            averagePreparationMinutes: shop.prepTime || 20,
            minimumOrderValue: shop.minimumOrderValue || 99,
            isOpen: shop.isOpen !== false,
          });
        }
      }
    });

    return combined;
  };

  // Fetch Restaurants & Food Products
  const fetchData = async () => {
    setLoading(true);
    try {
      const { activePincode, activeMandal, activeDistrict, activeCity } = getActiveUserLocation();

      const params: any = {};
      if (selectedCuisine !== 'ALL') params.cuisine = selectedCuisine;
      if (dietaryFilter !== 'ALL') params.foodPreference = dietaryFilter;
      if (searchQuery) params.search = searchQuery;
      if (activePincode) params.pincode = activePincode;
      if (activeMandal) params.mandal = activeMandal;
      if (activeDistrict) params.district = activeDistrict;
      if (activeCity) params.city = activeCity;

      const [restRes, vendorRes, foodItemsRes, prodRes, diningRes, homePersonalizationRes] = await Promise.all([
        axios.get(`${API_BASE}/food/restaurants`, { params }).catch(() => null),
        axios.get(`${API_BASE}/vendors/nearby`, { params }).catch(() => axios.get(`${API_BASE}/vendor/nearby`, { params }).catch(() => null)),
        axios.get(`${API_BASE}/food/items`, { params }).catch(() => null),
        axios.get(`${API_BASE}/products`, { params }).catch(() => null),
        axios.get(`${API_BASE}/food/dining/venues`, { params }).catch(() => null),
        axios.get(`${API_BASE}/home/personalization`).catch(() => null),
      ]);

      const foodRestaurants = restRes?.data?.restaurants || [];
      const vendorShops = vendorRes?.data?.data || vendorRes?.data?.vendors || (Array.isArray(vendorRes?.data) ? vendorRes.data : []) || [];
      const homeRestaurants = homePersonalizationRes?.data?.restaurants || [];

      const combinedVendorShops = [...vendorShops, ...homeRestaurants];
      const mergedRestaurants = combineRestaurantsAndVendors(foodRestaurants, combinedVendorShops);

      setRestaurants(mergedRestaurants);

      if (diningRes?.data?.venues && diningRes.data.venues.length > 0) {
        setDineoutVenues(diningRes.data.venues);
      }

      if (foodItemsRes?.data?.items && foodItemsRes.data.items.length > 0) {
        setFoodProducts(foodItemsRes.data.items);
      } else if (prodRes?.data) {
        const rawProds = Array.isArray(prodRes.data)
          ? prodRes.data
          : prodRes.data.products || prodRes.data.items || [];
        const foodOnly = rawProds.filter((p: any) => {
          const cName = (p.categoryName || p.category || '').toString().toLowerCase();
          const pName = (p.itemName || p.name || '').toString().toLowerCase();
          return (
            cName.includes('food') ||
            cName.includes('dining') ||
            cName.includes('restaurant') ||
            cName.includes('biryani') ||
            cName.includes('pizza') ||
            cName.includes('burger') ||
            pName.includes('biryani') ||
            pName.includes('dosa') ||
            pName.includes('pizza') ||
            pName.includes('burger') ||
            pName.includes('thali')
          );
        });

        setFoodProducts(foodOnly);
      } else {
        setFoodProducts([]);
      }
    } catch (err) {
      console.error('Failed to fetch food listings:', err);
      setFoodProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedCuisine, dietaryFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData();
  };

  // Filtered Food Items for 'items' tab (Strict Location Pincode, Mandal, District Filter)
  const filteredFoodItems = useMemo(() => {
    const { activePincode, activeMandal, activeDistrict, activeCity, fullAddress } = getActiveUserLocation();

    let list = foodProducts;

    // 1. Location Matching for Food Items
    if (activePincode || activeMandal || activeDistrict || activeCity || fullAddress) {
      list = list.filter((item: any) => {
        const itemPin = (item.pincode || item.pinCode || item.zipcode || item.sellerId?.pincode || item.vendorId?.pincode || item.restaurantPincode || "").toString().toLowerCase();
        const itemLoc = (item.locality || item.city || item.mandal || item.district || item.restaurantName || "").toString().toLowerCase();

        const matchPin = activePincode && itemPin.includes(activePincode);
        const matchMandal = activeMandal && (itemLoc.includes(activeMandal) || fullAddress.includes(itemLoc));
        const matchDistrict = activeDistrict && (itemLoc.includes(activeDistrict) || fullAddress.includes(itemLoc));
        const matchRegional = (activePincode === '504312' || fullAddress.includes('tamsi') || fullAddress.includes('adilabad')) && (itemLoc.includes('tamsi') || itemLoc.includes('adilabad') || itemPin === '504312');

        if (itemPin && !matchPin && !matchMandal && !matchDistrict && !matchRegional) {
          return false;
        }
        return true;
      });
    }

    // 2. Search Query Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (item) =>
          (item.itemName || item.name || '').toLowerCase().includes(q) ||
          (item.restaurantName || item.brand || '').toLowerCase().includes(q) ||
          (item.category || '').toLowerCase().includes(q)
      );
    }

    // 3. Subcategory Filter
    if (selectedItemCat !== 'ALL') {
      const cat = selectedItemCat.toLowerCase();
      list = list.filter((item) => {
        const c = (item.category || item.categoryName || '').toLowerCase();
        const n = (item.itemName || item.name || '').toLowerCase();
        return c.includes(cat) || n.includes(cat);
      });
    }

    // 4. Dietary Filter
    if (dietaryFilter === 'VEG') {
      list = list.filter((item) => item.isVeg === true);
    } else if (dietaryFilter === 'NON_VEG') {
      list = list.filter((item) => item.isVeg === false);
    }

    return list;
  }, [foodProducts, searchQuery, selectedItemCat, dietaryFilter]);

  // Handle Add to Cart for Food Item
  const handleAddToCart = async (item: any, quantity: number = 1) => {
    try {
      const userStr = localStorage.getItem('user');
      const token = localStorage.getItem('token');
      if (!userStr || !token) {
        alert('Please login to add items to cart');
        navigate('/login');
        return;
      }
      const user = JSON.parse(userStr);
      const payload = {
        userId: user._id || user.id,
        productId: item._id || item.id,
        name: item.name || item.itemName,
        price: item.price || item.afterDiscount || item.userPrice,
        image: item.image || item.images?.[0],
        quantity: quantity,
        vendorId: item.vendorId || item.restaurantId || null,
      };

      await axios.post(`${API_BASE}/cart/add`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      alert(`✅ Added ${quantity}x "${item.name || item.itemName}" to your food cart!`);
      window.dispatchEvent(new Event('storage'));
      setSelectedQuickViewItem(null);
    } catch (e) {
      console.error(e);
      alert('Failed to add food item to cart.');
    }
  };

  const handleBookTableSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : {};
      const payload = {
        restaurantId: selectedDineoutVenue?.restaurantId || selectedDineoutVenue?.id,
        customerName: user.name || user.fullName || 'ApexBee Customer',
        customerPhone: user.phone || user.mobile || '9707010797',
        customerEmail: user.email || 'customer@apexbee.in',
        guestCount: Number(bookingGuests) || 2,
        bookingDate: bookingDate || new Date().toISOString().split('T')[0],
        bookingTime: bookingTime || '19:30',
        tableType: 'Standard Dining Table',
        occasion: 'Casual Dining',
      };

      await axios.post(`${API_BASE}/food/dining/book`, payload);
      setBookingSuccess(true);
      setTimeout(() => {
        setBookingSuccess(false);
        setSelectedDineoutVenue(null);
      }, 2500);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to submit table booking reservation');
    }
  };

  const currentBanner = HERO_BANNERS[activeBanner];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">
      <Navbar />

      {/* DYNAMIC ANIMATED HERO SLIDER BANNER */}
      <div className="relative bg-[#0A1128] text-white overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-500/15 rounded-full blur-[120px] pointer-events-none animate-pulse" />
        <div className="absolute -bottom-20 left-10 w-96 h-96 bg-orange-500/15 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-6 pb-8 relative z-10">
          {/* DYNAMIC FOOD & DINING HERO BANNER (Managed via Admin Panel) */}
          <DynamicHeroBanner placement="food_hero" heightClass="h-[320px] sm:h-[380px] md:h-[420px]" />

          {/* SEARCH BAR */}
          <form onSubmit={handleSearchSubmit} className="mt-5 flex flex-col sm:flex-row items-center gap-2 bg-white p-2 rounded-2xl shadow-2xl border border-slate-200">
            <div className="relative flex-1 w-full">
              <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Biryani, Pizza, Burger, Tiffins, or Restaurant name..."
                className="w-full pl-11 pr-4 py-2.5 bg-transparent text-sm text-slate-900 placeholder-slate-400 focus:outline-none font-medium"
              />
            </div>
            <button
              type="submit"
              className="w-full sm:w-auto px-7 py-3 bg-amber-500 hover:bg-amber-400 text-[#0A1128] font-black text-xs rounded-xl shadow-lg transition cursor-pointer flex items-center justify-center space-x-2"
            >
              <Search className="w-4 h-4" />
              <span>Search Food</span>
            </button>
          </form>
        </div>
      </div>

      {/* FLASH CASHBACK STRIP */}
      <div className="bg-amber-400 text-[#0A1128] font-extrabold text-xs py-2.5 text-center shadow-inner tracking-wide flex items-center justify-center space-x-2">
        <Sparkles className="w-4 h-4 animate-spin" />
        <span>Earn 10% Instant Wallet Cashback on Food Orders Above ₹299 • Code: APEXFOOD</span>
      </div>

      {/* MAIN CONTENT CONTAINER */}
      <div className="max-w-7xl mx-auto px-2 sm:px-8 py-4 sm:py-8 space-y-5 sm:space-y-8">

        {/* DEDICATED SUBCATEGORY HERO BANNER & BREADCRUMBS (Renders when ?sub=... URL parameter is present) */}
        {subParamRaw && (
          <div className="bg-gradient-to-r from-[#0A1128] via-slate-900 to-amber-950 text-white rounded-3xl p-5 sm:p-6 border border-amber-400/40 shadow-xl relative overflow-hidden text-left">
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
              <div className="space-y-1.5">
                {/* Breadcrumb Navigation */}
                <div className="flex items-center space-x-2 text-xs text-amber-300 font-bold flex-wrap">
                  <Link to="/" className="hover:underline">Home</Link>
                  <span>/</span>
                  <button type="button" onClick={handleClearSubcategoryFilter} className="hover:underline text-amber-300 bg-transparent border-none p-0 cursor-pointer">
                    Food &amp; Dining
                  </button>
                  <span>/</span>
                  <span className="text-white font-extrabold capitalize">{subParamRaw}</span>
                </div>

                <h2 className="text-xl sm:text-2xl font-black text-amber-400 font-heading flex items-center space-x-2">
                  <span>
                    {subParamRaw.toLowerCase().includes('restaurant') ? '🏪 Nearby Restaurants & Food Outlets' :
                      subParamRaw.toLowerCase().includes('dine') ? '🍽️ Dineout & Table Reservations' :
                        `🍱 ${subParamRaw} Special Menu`}
                  </span>
                </h2>

                <p className="text-xs text-slate-300 font-medium max-w-xl">
                  {subParamRaw.toLowerCase().includes('restaurant') ? 'Explore top-rated local restaurants, cloud kitchens & dining outlets near your location.' :
                    subParamRaw.toLowerCase().includes('dine') ? 'Book tables & enjoy exclusive dine-in discounts at top-rated restaurants.' :
                      `Showing top-rated ${subParamRaw} dishes, thalis & specials from local kitchens.`}
                </p>
              </div>

              <button
                type="button"
                onClick={handleClearSubcategoryFilter}
                className="self-start sm:self-center px-4 py-2 bg-white/10 hover:bg-white/20 text-amber-300 font-black text-xs rounded-2xl border border-amber-400/30 shadow-md backdrop-blur-md transition flex items-center space-x-1.5 cursor-pointer shrink-0"
              >
                <X className="w-4 h-4 text-amber-400" />
                <span>View All Food Hub</span>
              </button>
            </div>
          </div>
        )}

        {/* ACTIVE LOCATION PINCODE STATUS BADGE */}
        {(() => {
          const userLocRaw = localStorage.getItem("userLocation");
          const userLocation = userLocRaw ? JSON.parse(userLocRaw) : null;
          const activePin = (localStorage.getItem("userPincode") || userLocation?.pincode || localStorage.getItem("pincode") || "").toString().trim();
          const locationName = userLocation?.city || userLocation?.locality || userLocation?.state || "Hyderabad";

          return (
            <div className="bg-slate-900 text-white p-3 rounded-2xl border border-slate-800 flex items-center justify-between gap-3 text-xs shadow-md">
              <div className="flex items-center space-x-2.5 min-w-0">
                <div className="w-7 h-7 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold shrink-0">
                  <MapPin className="w-4 h-4 text-slate-950" />
                </div>
                <div className="truncate text-left">
                  <span className="font-extrabold text-amber-400 block leading-tight">
                    {activePin ? `Delivering to Pincode: ${activePin}` : 'Showing All Available Outlets'}
                  </span>
                  <span className="text-[10.5px] text-slate-400 font-medium truncate block">
                    {activePin ? `📍 Strictly filtered to restaurants, food items & dineout venues matching ${activePin} (${locationName})` : 'Set your location to see hyper-local 25-minute food delivery outlets'}
                  </span>
                </div>
              </div>

              <Link
                to="/"
                className="px-3 py-1.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-[11px] rounded-xl transition shrink-0 cursor-pointer shadow-xs"
              >
                {activePin ? 'Change Pincode' : 'Set Location'}
              </Link>
            </div>
          );
        })()}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* 3 PRIMARY VIEW NAVIGATION TABS (FULL OF ITEMS | RESTAURANTS | DINEOUTS) */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <div className="bg-white p-1 sm:p-2 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-md grid grid-cols-3 gap-1 sm:gap-2">
          <button
            type="button"
            onClick={() => handleMainTabChange('items')}
            className={`py-2 sm:py-3.5 px-1 sm:px-4 rounded-xl sm:rounded-2xl font-black text-[10px] sm:text-sm transition-all duration-300 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 border cursor-pointer ${activeMainTab === 'items'
              ? 'bg-[#0A1128] text-amber-400 border-[#0A1128] shadow-md'
              : 'bg-transparent text-slate-700 border-transparent hover:bg-slate-100'
              }`}
          >
            <span className="text-sm sm:text-lg">🍱</span>
            <span>Food Items</span>
          </button>

          <button
            type="button"
            onClick={() => handleMainTabChange('restaurants')}
            className={`py-2 sm:py-3.5 px-1 sm:px-4 rounded-xl sm:rounded-2xl font-black text-[10px] sm:text-sm transition-all duration-300 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 border cursor-pointer ${activeMainTab === 'restaurants'
              ? 'bg-[#0A1128] text-amber-400 border-[#0A1128] shadow-md'
              : 'bg-transparent text-slate-700 border-transparent hover:bg-slate-100'
              }`}
          >
            <span className="text-sm sm:text-lg">🏪</span>
            <span>Restaurants</span>
          </button>

          <button
            type="button"
            onClick={() => handleMainTabChange('dineout')}
            className={`py-2 sm:py-3.5 px-1 sm:px-4 rounded-xl sm:rounded-2xl font-black text-[10px] sm:text-sm transition-all duration-300 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 border cursor-pointer ${activeMainTab === 'dineout'
              ? 'bg-[#0A1128] text-amber-400 border-[#0A1128] shadow-md'
              : 'bg-transparent text-slate-700 border-transparent hover:bg-slate-100'
              }`}
          >
            <span className="text-sm sm:text-lg">🍽️</span>
            <span>Dineout</span>
          </button>
        </div>

        {/* DIETARY FILTER STRIP (VEG / NON-VEG) */}
        <div className="flex flex-row items-center justify-between gap-2 bg-white p-2 sm:p-3 rounded-2xl border border-slate-200 shadow-xs overflow-x-auto scrollbar-none">
          <div className="flex items-center space-x-1.5 text-[11px] sm:text-xs font-bold shrink-0">
            <button
              onClick={() => setDietaryFilter('ALL')}
              className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl transition cursor-pointer ${dietaryFilter === 'ALL' ? 'bg-[#0A1128] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
            >
              All Types
            </button>
            <button
              onClick={() => setDietaryFilter('VEG')}
              className={`px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-xl transition flex items-center space-x-1 cursor-pointer border ${dietaryFilter === 'VEG'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 font-extrabold'
                : 'text-slate-600 hover:bg-slate-100 border-transparent'
                }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Veg</span>
            </button>
            <button
              onClick={() => setDietaryFilter('NON_VEG')}
              className={`px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-xl transition flex items-center space-x-1 cursor-pointer border ${dietaryFilter === 'NON_VEG'
                ? 'bg-rose-50 text-rose-700 border-rose-300 font-extrabold'
                : 'text-slate-600 hover:bg-slate-100 border-transparent'
                }`}
            >
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span>Non-Veg</span>
            </button>
          </div>

          <div className="text-[10px] sm:text-xs text-slate-500 font-semibold px-1 shrink-0">
            <span className="text-[#0A1128] font-black">
              {activeMainTab === 'items' ? filteredFoodItems.length : activeMainTab === 'restaurants' ? filteredRestaurants.length : DINEOUT_RESTAURANTS.length}
            </span> {activeMainTab === 'items' ? 'Items' : 'Outlets'}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TAB 1: FULL OF FOOD ITEMS (Direct Food Item Menu & Order) */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeMainTab === 'items' && (
          <div className="space-y-4 sm:space-y-6">
            {/* ITEM CATEGORIES SCROLL BAR */}
            <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
              {itemCategories.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => handleCategoryChipClick(cat.value)}
                  className={`px-3 py-1.5 sm:px-4 sm:py-2.5 rounded-xl sm:rounded-2xl text-[11px] sm:text-xs font-bold transition duration-300 flex items-center space-x-1.5 cursor-pointer shrink-0 border ${selectedItemCat === cat.value
                    ? 'bg-[#0A1128] text-amber-400 border-[#0A1128] shadow-md'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                >
                  <span className="text-sm sm:text-base">{cat.icon}</span>
                  <span>{cat.name}</span>
                </button>
              ))}
            </div>

            {/* FOOD ITEMS GRID - 2 COLUMNS ON MOBILE */}
            {filteredFoodItems.length === 0 ? (
              (() => {
                const { activePincode, activeMandal, activeDistrict, fullAddress } = getActiveUserLocation();
                const userLocRaw = localStorage.getItem("userLocation");
                const userLocation = userLocRaw ? JSON.parse(userLocRaw) : null;
                const displayLoc = activePincode
                  ? `${activePincode}${userLocation?.mandal ? ` (${userLocation.mandal})` : userLocation?.city ? ` (${userLocation.city})` : ''}`
                  : fullAddress || 'your selected location';

                return (
                  <div className="bg-gradient-to-br from-slate-900 via-[#0A1128] to-slate-950 text-white rounded-3xl p-8 sm:p-12 border border-amber-400/30 shadow-2xl text-center space-y-5 relative overflow-hidden my-6">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="relative z-10 space-y-4 max-w-xl mx-auto">
                      <div className="w-16 h-16 rounded-2xl bg-amber-400/20 text-amber-400 border border-amber-400/40 flex items-center justify-center mx-auto shadow-lg">
                        <MapPin className="w-8 h-8 text-amber-400 animate-bounce" />
                      </div>

                      <div className="space-y-2">
                        <span className="bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[11px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                          Location Status
                        </span>
                        <h3 className="text-xl sm:text-2xl font-black text-white font-heading">
                          No Food Items Delivering to <span className="text-amber-400">{displayLoc}</span>
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
                          We couldn't find active food items or dishes matching your location filter in <strong className="text-amber-300">{displayLoc}</strong>.
                        </p>
                      </div>

                      <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                        <button
                          type="button"
                          onClick={handleClearSubcategoryFilter}
                          className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-black text-xs rounded-2xl shadow-xl transition cursor-pointer flex items-center justify-center space-x-2"
                        >
                          <span>Explore All Items Across Platform</span>
                        </button>

                        <Link
                          to="/"
                          className="w-full sm:w-auto px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-extrabold text-xs rounded-2xl border border-white/20 backdrop-blur-md transition flex items-center justify-center space-x-2"
                        >
                          <span>📍 Change Location / Pincode</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })()
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-5">
                {filteredFoodItems.map((item: any) => {
                  const title = item.name || item.itemName || 'Delicious Dish';
                  const price = Number(item.price || item.afterDiscount || item.userPrice || 199);
                  const mrp = Number(item.mrp || item.baseMrp || price * 1.3);
                  const dp = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;
                  const img = item.image || item.images?.[0] || 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&auto=format&fit=crop';
                  const isVeg = item.isVeg !== undefined ? item.isVeg : true;

                  return (
                    <div
                      key={item._id || item.id}
                      className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs hover:shadow-xl hover:border-amber-400 transition-all duration-300 flex flex-col justify-between group cursor-pointer"
                      onClick={() => {
                        setSelectedQuickViewItem(item);
                        setQuickViewQty(1);
                      }}
                    >
                      <div>
                        {/* ITEM IMAGE CONTAINER - COMPACT ON MOBILE */}
                        <div className="h-28 sm:h-44 bg-slate-100 relative overflow-hidden">
                          <img
                            src={img}
                            alt={title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute top-1.5 left-1.5 sm:top-3 sm:left-3 flex gap-1 z-10">
                            <span className={`px-1.5 py-0.2 sm:px-2 sm:py-0.5 rounded text-[8px] sm:text-[10px] font-black border ${isVeg ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-rose-50 text-rose-700 border-rose-300'
                              }`}>
                              {isVeg ? '🌱 VEG' : '🍖 NON-VEG'}
                            </span>
                            {dp > 0 && (
                              <span className="px-1.5 py-0.2 sm:px-2 sm:py-0.5 bg-amber-500 text-[#0A1128] rounded text-[8px] sm:text-[10px] font-black shadow-xs">
                                {dp}% OFF
                              </span>
                            )}
                          </div>
                        </div>

                        {/* ITEM DETAILS */}
                        <div className="p-2.5 sm:p-4 space-y-1 sm:space-y-1.5 text-left">
                          <div className="flex items-center justify-between text-[10px] sm:text-xs text-slate-500 font-semibold">
                            <span className="truncate max-w-[110px] sm:max-w-[140px] text-amber-600 font-bold">{item.restaurantName || 'Food Kitchen'}</span>
                            <div className="flex items-center gap-0.5 text-amber-500 font-black">
                              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                              <span>{formatRating(item.rating)}</span>
                            </div>
                          </div>

                          <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 line-clamp-1 group-hover:text-amber-600 transition">
                            {title}
                          </h3>

                          <p className="text-[10px] sm:text-xs text-slate-400 line-clamp-1 font-medium hidden sm:block">
                            {item.description || 'Piping hot fresh food delivered to your door.'}
                          </p>
                        </div>
                      </div>

                      {/* ITEM FOOTER & ADD BUTTON */}
                      <div className="p-2.5 sm:p-4 pt-0 sm:pt-0 flex items-center justify-between gap-1 border-t border-slate-100/60 mt-1">
                        <div className="flex items-baseline space-x-1">
                          <span className="text-xs sm:text-base font-black text-[#0A1128]">₹{price}</span>
                          {mrp > price && (
                            <span className="text-[9px] sm:text-xs text-slate-400 line-through font-medium">₹{Math.round(mrp)}</span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToCart(item, 1);
                          }}
                          className="bg-[#0A1128] hover:bg-amber-500 text-white hover:text-[#0A1128] font-black text-[10px] sm:text-xs px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-lg sm:rounded-xl flex items-center gap-1 transition duration-300 border-none cursor-pointer shrink-0"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add</span>
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
        {/* TAB 2: RESTAURANTS DIRECTORY */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeMainTab === 'restaurants' && (
          <div className="space-y-6">
            {/* CUISINE FILTER SLIDER */}
            <div className="flex items-center space-x-3 overflow-x-auto pb-2 scrollbar-none">
              {cuisinesList.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setSelectedCuisine(c.value)}
                  className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition duration-300 flex items-center space-x-2 cursor-pointer shrink-0 border ${selectedCuisine === c.value
                    ? 'bg-[#0A1128] text-amber-400 border-[#0A1128] shadow-md scale-105'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                >
                  <span className="text-base">{c.icon}</span>
                  <span>{c.name}</span>
                </button>
              ))}
            </div>

            {/* RESTAURANTS LISTING GRID */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-80 bg-white rounded-3xl border border-slate-200 shadow animate-pulse" />
                ))}
              </div>
            ) : filteredRestaurants.length === 0 ? (
              (() => {
                const { activePincode, activeMandal, activeDistrict, fullAddress } = getActiveUserLocation();
                const userLocRaw = localStorage.getItem("userLocation");
                const userLocation = userLocRaw ? JSON.parse(userLocRaw) : null;
                const displayLoc = activePincode
                  ? `${activePincode}${userLocation?.mandal ? ` (${userLocation.mandal})` : userLocation?.city ? ` (${userLocation.city})` : ''}`
                  : fullAddress || 'your selected location';

                return (
                  <div className="bg-gradient-to-br from-slate-900 via-[#0A1128] to-slate-950 text-white rounded-3xl p-8 sm:p-12 border border-amber-400/30 shadow-2xl text-center space-y-5 relative overflow-hidden my-6">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

                    <div className="relative z-10 space-y-4 max-w-xl mx-auto">
                      <div className="w-16 h-16 rounded-2xl bg-amber-400/20 text-amber-400 border border-amber-400/40 flex items-center justify-center mx-auto shadow-lg">
                        <MapPin className="w-8 h-8 text-amber-400 animate-bounce" />
                      </div>

                      <div className="space-y-2">
                        <span className="bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[11px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                          Location Status
                        </span>
                        <h3 className="text-xl sm:text-2xl font-black text-white font-heading">
                          No Restaurants Delivering to <span className="text-amber-400">{displayLoc}</span> Yet
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
                          We currently don't have registered restaurant partners in <strong className="text-amber-300">{displayLoc}</strong>. We are rapidly expanding our food network in your area!
                        </p>
                      </div>

                      <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                        <button
                          type="button"
                          onClick={handleClearSubcategoryFilter}
                          className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-black text-xs rounded-2xl shadow-xl transition cursor-pointer flex items-center justify-center space-x-2"
                        >
                          <span>Explore All Outlets Across Platform</span>
                        </button>

                        <Link
                          to="/"
                          className="w-full sm:w-auto px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-extrabold text-xs rounded-2xl border border-white/20 backdrop-blur-md transition flex items-center justify-center space-x-2"
                        >
                          <span>📍 Change Location / Pincode</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })()
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredRestaurants.map((rest) => {
                  const defaultImage = 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=800&auto=format&fit=crop';
                  const displayImage = rest.bannerImage || rest.coverImage || rest.logo || defaultImage;

                  return (
                    <Link
                      key={rest.id || rest._id}
                      to={`/food/restaurant/${rest.id || rest._id}`}
                      className="group bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-md hover:shadow-2xl hover:border-amber-400 transition-all duration-500 hover:-translate-y-1 flex flex-col justify-between"
                    >
                      <div>
                        {/* COVER IMAGE BANNER */}
                        <div className="h-48 bg-slate-100 relative overflow-hidden">
                          <img
                            src={displayImage}
                            alt={rest.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition duration-700"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20" />

                          {!rest.isOpen && (
                            <div className="absolute inset-0 bg-slate-900/60 z-[5] flex items-center justify-center">
                              <div className="bg-red-600/90 text-white px-4 py-2 rounded-2xl font-black text-sm shadow-xl border border-red-400/50 backdrop-blur-sm">
                                🚫 CURRENTLY CLOSED
                              </div>
                            </div>
                          )}

                          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase shadow-md ${rest.isOpen ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                                }`}
                            >
                              {rest.isOpen ? 'OPEN NOW' : 'CLOSED'}
                            </span>

                            {rest.activeOfferSummary && (
                              <span className="px-2.5 py-0.5 bg-amber-500 text-[#0A1128] rounded-full font-black text-[10px] shadow-md flex items-center space-x-1">
                                <Tag className="w-3 h-3" />
                                <span>{rest.activeOfferSummary}</span>
                              </span>
                            )}
                          </div>

                          <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-xl text-xs font-black text-amber-600 flex items-center space-x-1 shadow-md border border-amber-200 z-10">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            <span>{formatRating(rest.rating)}</span>
                          </div>
                        </div>

                        {/* RESTAURANT DETAILS BODY */}
                        <div className="p-5 space-y-3">
                          <div>
                            <div className="flex items-center justify-between">
                              <h3 className="font-black text-lg text-[#0A1128] group-hover:text-amber-600 transition font-heading">
                                {rest.name}
                              </h3>
                              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" title="FSSAI Verified" />
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5 line-clamp-1 font-medium">
                              {Array.isArray(rest.cuisines) ? rest.cuisines.join(', ') : rest.cuisines || 'Multi-Cuisine'}
                            </p>
                          </div>

                          <div className="flex items-center justify-between text-xs text-slate-600 pt-3 border-t border-slate-100 font-semibold">
                            <div className="flex items-center space-x-1">
                              <Clock className="w-3.5 h-3.5 text-amber-500" />
                              <span>{rest.averagePreparationMinutes || 20} mins</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <MapPin className="w-3.5 h-3.5 text-amber-500" />
                              <span>{rest.locality || rest.city || 'Hyderabad'}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* BOTTOM ORDER BUTTON */}
                      <div className="px-5 pb-5 pt-1">
                        {rest.isOpen ? (
                          <div className="w-full py-2.5 bg-slate-100 group-hover:bg-[#0A1128] text-slate-800 group-hover:text-amber-400 font-black text-xs rounded-2xl transition duration-300 text-center flex items-center justify-center space-x-1 shadow-sm">
                            <span>Order Online</span>
                            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                          </div>
                        ) : (
                          <div className="w-full py-2.5 bg-red-50 text-red-600 border border-red-200 font-black text-xs rounded-2xl text-center flex items-center justify-center space-x-1">
                            <span>🚫 Currently Closed — View Menu</span>
                          </div>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TAB 3: DINEOUT & TABLE BOOKING (Exclusive Dining Discounts) */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeMainTab === 'dineout' && (
          <div className="space-y-6">
            {/* DINEOUT BANNER HERO */}
            <div className="bg-gradient-to-r from-[#0A1128] via-[#1a2b5c] to-[#0A1128] text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2">
                  <span className="inline-flex items-center gap-1.5 bg-rose-500 text-white px-3 py-1 rounded-full text-xs font-black">
                    <Award className="w-3.5 h-3.5" /> ApexBee Dining Pass
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black text-white">Reserve a Table & Get Up To 40% OFF Bills</h2>
                  <p className="text-xs sm:text-sm text-slate-200 max-w-xl font-medium">
                    Enjoy luxury dining, rooftop lounges, and top-rated restaurants with guaranteed table reservations, gallery previews, video tours, and instant bill discounts.
                  </p>
                </div>
                <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl text-center shrink-0">
                  <p className="text-[10px] font-bold text-amber-300 uppercase tracking-wider">Instant Confirmation</p>
                  <p className="text-xl font-black text-white">Zero Booking Fees</p>
                </div>
              </div>
            </div>

            {/* DINEOUT VENUES GRID WITH VIDEO TOUR & IMAGES DETAILS BUTTON */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {allCombinedDineout.map((venue) => (
                <div
                  key={venue.id}
                  className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    <div className="h-52 relative overflow-hidden group">
                      <img src={venue.image} alt={venue.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />

                      <span className="absolute top-3 left-3 bg-amber-400 text-[#0A1128] font-black text-xs px-3 py-1 rounded-full shadow-md">
                        {venue.tag}
                      </span>

                      {/* VIDEO TOUR PREVIEW BUTTON */}
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedDineoutDetails(venue);
                          setActiveGalleryImg(venue.image);
                          setIsVideoPlaying(false);
                        }}
                        className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition border-none cursor-pointer"
                      >
                        <span className="px-4 py-2.5 bg-amber-500 text-[#0A1128] font-black text-xs rounded-2xl shadow-xl flex items-center gap-2 transform group-hover:scale-105 transition">
                          <Play className="w-4 h-4 fill-[#0A1128]" /> View Images & Video Tour
                        </span>
                      </button>

                      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white">
                        <div className="flex items-center gap-1 text-xs font-black bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-xl">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <span>{venue.rating} Rating</span>
                        </div>
                        <span className="text-xs font-bold bg-black/50 backdrop-blur-md px-2.5 py-1 rounded-xl">
                          Avg {venue.costForTwo} for 2
                        </span>
                      </div>
                    </div>

                    <div className="p-5 space-y-3">
                      <div>
                        <div className="flex items-center justify-between">
                          <h3 className="font-black text-xl text-[#0A1128]">{venue.name}</h3>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedDineoutDetails(venue);
                              setActiveGalleryImg(venue.image);
                              setIsVideoPlaying(false);
                            }}
                            className="text-xs font-bold text-amber-600 hover:underline flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 cursor-pointer"
                          >
                            <Info className="w-3.5 h-3.5" /> Details
                          </button>
                        </div>
                        <p className="text-xs text-slate-500 font-semibold mt-1">{venue.cuisine} • 📍 {venue.locality}</p>
                      </div>

                      {/* OFFER CARD */}
                      <div className="bg-gradient-to-r from-rose-50 to-orange-50 border border-rose-200 p-3 rounded-2xl flex items-center gap-2">
                        <BadgePercent className="w-5 h-5 text-rose-600 shrink-0" />
                        <div>
                          <p className="text-xs font-black text-rose-700">{venue.offer}</p>
                          <p className="text-[10px] text-slate-500 font-medium">Valid on all food & beverage orders via ApexBee Pay</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 pt-0 flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedDineoutDetails(venue);
                        setActiveGalleryImg(venue.image);
                        setIsVideoPlaying(false);
                      }}
                      className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-[#0A1128] font-black text-xs rounded-2xl transition flex items-center justify-center gap-1.5 border-none cursor-pointer"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Photos & Video</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedDineoutVenue(venue)}
                      className="flex-1 py-3 bg-[#0A1128] hover:bg-amber-500 text-white hover:text-[#0A1128] font-black text-xs rounded-2xl transition flex items-center justify-center gap-1.5 shadow-md border-none cursor-pointer"
                    >
                      <Calendar className="w-4 h-4" />
                      <span>Book Table</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* FOOD ITEM QUICK VIEW MODAL */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {selectedQuickViewItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-5 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedQuickViewItem(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-900 rounded-full hover:bg-slate-100 transition border-none cursor-pointer z-10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col sm:flex-row gap-5">
              <div className="w-full sm:w-1/2 h-56 sm:h-auto bg-slate-100 rounded-2xl overflow-hidden relative shrink-0">
                <img
                  src={selectedQuickViewItem.image || selectedQuickViewItem.images?.[0]}
                  alt={selectedQuickViewItem.name}
                  className="w-full h-full object-cover"
                />
                <span className={`absolute top-3 left-3 px-2.5 py-0.5 rounded-lg text-xs font-black border ${selectedQuickViewItem.isVeg ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-rose-50 text-rose-700 border-rose-300'
                  }`}>
                  {selectedQuickViewItem.isVeg ? '🌱 VEG' : '🍖 NON-VEG'}
                </span>
              </div>

              <div className="flex-1 space-y-3">
                <p className="text-xs font-bold text-amber-600">
                  🏪 {selectedQuickViewItem.restaurantName || selectedQuickViewItem.brand || 'Gourmet Outlet'}
                </p>

                <h3 className="text-xl font-black text-[#0A1128] leading-tight">
                  {selectedQuickViewItem.name || selectedQuickViewItem.itemName}
                </h3>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 bg-amber-400 text-[#0A1128] px-2 py-0.5 rounded-lg text-xs font-black">
                    <Star className="w-3.5 h-3.5 fill-[#0A1128]" />
                    <span>{selectedQuickViewItem.rating || '4.8'}</span>
                  </div>
                  <span className="text-xs text-slate-500 font-semibold">⚡ {selectedQuickViewItem.prepTime || '20 mins'}</span>
                  {selectedQuickViewItem.serves && (
                    <span className="text-xs text-slate-500 font-bold">👥 {selectedQuickViewItem.serves}</span>
                  )}
                </div>

                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  {selectedQuickViewItem.description || 'Delicious gourmet food prepared fresh using pure ingredients and traditional authentic cooking techniques.'}
                </p>

                {selectedQuickViewItem.ingredients && (
                  <div>
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-1">Ingredients</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedQuickViewItem.ingredients.map((ing: string) => (
                        <span key={ing} className="px-2 py-0.5 bg-slate-100 rounded-md text-[10px] font-bold text-slate-700">
                          {ing}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-xl font-black text-[#0A1128]">
                        ₹{(selectedQuickViewItem.price || selectedQuickViewItem.afterDiscount || 199) * quickViewQty}
                      </span>
                      {selectedQuickViewItem.mrp > selectedQuickViewItem.price && (
                        <span className="text-xs text-slate-400 line-through">
                          ₹{Math.round(selectedQuickViewItem.mrp * quickViewQty)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* QTY COUNTER */}
                  <div className="flex items-center bg-slate-100 rounded-xl p-1">
                    <button
                      onClick={() => setQuickViewQty((q) => Math.max(1, q - 1))}
                      className="w-7 h-7 rounded-lg bg-white flex items-center justify-center text-slate-700 font-bold border-none cursor-pointer shadow-xs"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-8 text-center font-black text-sm text-[#0A1128]">{quickViewQty}</span>
                    <button
                      onClick={() => setQuickViewQty((q) => q + 1)}
                      className="w-7 h-7 rounded-lg bg-white flex items-center justify-center text-slate-700 font-bold border-none cursor-pointer shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleAddToCart(selectedQuickViewItem, quickViewQty)}
                  className="w-full py-3 bg-[#0A1128] hover:bg-amber-500 text-white hover:text-[#0A1128] font-black text-xs rounded-2xl transition duration-300 flex items-center justify-center gap-2 shadow-md border-none cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Add {quickViewQty} to Order • ₹{(selectedQuickViewItem.price || 199) * quickViewQty}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* DINEOUT VENUE DETAILS, GALLERY & VIDEO PREVIEW MODAL */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {selectedDineoutDetails && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedDineoutDetails(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-900 rounded-full hover:bg-slate-100 transition border-none cursor-pointer z-20"
            >
              <X className="w-5 h-5" />
            </button>

            {/* HEADER */}
            <div>
              <span className="text-[10px] font-black bg-amber-400 text-[#0A1128] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                {selectedDineoutDetails.tag}
              </span>
              <h3 className="text-2xl font-black text-[#0A1128] mt-1">{selectedDineoutDetails.name}</h3>
              <p className="text-xs text-slate-500 font-semibold">{selectedDineoutDetails.cuisine} • 📍 {selectedDineoutDetails.locality}</p>
            </div>

            {/* MAIN IMAGE & VIDEO PLAYER CONTAINER */}
            <div className="h-64 sm:h-80 bg-slate-950 rounded-2xl overflow-hidden relative shadow-inner">
              {isVideoPlaying ? (
                <video
                  src={selectedDineoutDetails.videoUrl}
                  controls
                  autoPlay
                  className="w-full h-full object-cover"
                />
              ) : (
                <img
                  src={activeGalleryImg || selectedDineoutDetails.image}
                  alt={selectedDineoutDetails.name}
                  className="w-full h-full object-cover"
                />
              )}

              {/* VIDEO TOUR PLAY BUTTON */}
              {selectedDineoutDetails.videoUrl && (
                <button
                  type="button"
                  onClick={() => setIsVideoPlaying(!isVideoPlaying)}
                  className="absolute bottom-4 right-4 bg-amber-500 hover:bg-amber-400 text-[#0A1128] font-black text-xs px-3.5 py-2 rounded-xl shadow-xl flex items-center gap-1.5 border-none cursor-pointer z-10 transition"
                >
                  <Play className="w-4 h-4 fill-[#0A1128]" />
                  <span>{isVideoPlaying ? 'View Photos' : 'Play 360° Video Tour'}</span>
                </button>
              )}
            </div>

            {/* GALLERY THUMBNAILS STRIP */}
            {selectedDineoutDetails.gallery && selectedDineoutDetails.gallery.length > 0 && (
              <div>
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-2">Ambiance & Food Gallery</p>
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                  {selectedDineoutDetails.gallery.map((imgUrl: string, i: number) => (
                    <button
                      key={i}
                      onClick={() => {
                        setActiveGalleryImg(imgUrl);
                        setIsVideoPlaying(false);
                      }}
                      className={`w-20 h-14 rounded-xl overflow-hidden border-2 cursor-pointer transition shrink-0 ${activeGalleryImg === imgUrl && !isVideoPlaying ? 'border-amber-500 scale-105' : 'border-transparent opacity-75 hover:opacity-100'
                        }`}
                    >
                      <img src={imgUrl} alt="Gallery" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* VENUE DESCRIPTION & FEATURES */}
            <div className="space-y-3 text-xs">
              <p className="text-slate-600 leading-relaxed font-medium">
                {selectedDineoutDetails.description}
              </p>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase">Cost & Timings</span>
                  <p className="font-extrabold text-slate-800">Avg {selectedDineoutDetails.costForTwo} for two</p>
                  <p className="text-[11px] text-slate-500 font-semibold">🕒 {selectedDineoutDetails.timings}</p>
                </div>
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase">Offer Benefit</span>
                  <p className="font-extrabold text-rose-600">🎁 {selectedDineoutDetails.offer}</p>
                </div>
              </div>

              {selectedDineoutDetails.features && (
                <div className="pt-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Key Highlights & Amenities</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedDineoutDetails.features.map((feat: string) => (
                      <span key={feat} className="px-2.5 py-1 bg-slate-100 rounded-lg text-[11px] font-bold text-slate-700">
                        {feat}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ACTION CTA */}
            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setSelectedDineoutVenue(selectedDineoutDetails);
                  setSelectedDineoutDetails(null);
                }}
                className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-[#0A1128] font-black text-xs rounded-2xl transition duration-300 flex items-center justify-center gap-2 shadow-md border-none cursor-pointer"
              >
                <Calendar className="w-4 h-4" />
                <span>Reserve Table Now ({selectedDineoutDetails.offer})</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TABLE BOOKING MODAL */}
      {selectedDineoutVenue && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 relative">
            <button
              onClick={() => setSelectedDineoutVenue(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-900 rounded-full hover:bg-slate-100 transition border-none cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {bookingSuccess ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-black text-[#0A1128]">Table Reserved Successfully!</h3>
                <p className="text-xs text-slate-500 font-medium">
                  Your table at <strong className="text-slate-800">{selectedDineoutVenue.name}</strong> is confirmed for {bookingGuests} guests on {bookingDate || 'today'} at {bookingTime}.
                </p>
              </div>
            ) : (
              <>
                <div>
                  <span className="text-[10px] font-black text-amber-600 uppercase tracking-wider">ApexBee Table Reservation</span>
                  <h3 className="text-xl font-black text-[#0A1128]">{selectedDineoutVenue.name}</h3>
                  <p className="text-xs text-rose-600 font-bold mt-0.5">🎁 {selectedDineoutVenue.offer}</p>
                </div>

                <form onSubmit={handleBookTableSubmit} className="space-y-4 text-xs font-semibold">
                  <div>
                    <label className="block text-slate-700 mb-1">Select Date</label>
                    <input
                      type="date"
                      required
                      value={bookingDate}
                      onChange={(e) => setBookingDate(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-400 font-bold"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 mb-1">Time Slot</label>
                      <select
                        value={bookingTime}
                        onChange={(e) => setBookingTime(e.target.value)}
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-400 font-bold"
                      >
                        <option value="12:30">12:30 PM (Lunch)</option>
                        <option value="13:30">01:30 PM (Lunch)</option>
                        <option value="19:00">07:00 PM (Dinner)</option>
                        <option value="20:00">08:00 PM (Dinner)</option>
                        <option value="21:00">09:00 PM (Dinner)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-700 mb-1">Guests</label>
                      <select
                        value={bookingGuests}
                        onChange={(e) => setBookingGuests(e.target.value)}
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-400 font-bold"
                      >
                        <option value="1">1 Person</option>
                        <option value="2">2 Guests</option>
                        <option value="4">4 Guests</option>
                        <option value="6">6 Guests</option>
                        <option value="8+">8+ Guests (Party)</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-[#0A1128] font-black text-xs rounded-xl shadow-lg transition border-none cursor-pointer flex items-center justify-center gap-2 mt-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Confirm Table Reservation</span>
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default FoodDining;
