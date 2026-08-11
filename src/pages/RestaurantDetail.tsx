import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Utensils,
  Star,
  Clock,
  MapPin,
  Sparkles,
  Tag,
  Plus,
  Minus,
  CheckCircle2,
  ShieldCheck,
  ShoppingBag,
  ArrowLeft,
  Search,
  AlertTriangle,
  Filter,
  ChevronDown,
  Calendar,
  Users,
  CheckCircle,
  X,
} from 'lucide-react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const formatRating = (val: any) => {
  if (!val) return '4.8';
  if (typeof val === 'number' || typeof val === 'string') return val.toString();
  if (typeof val === 'object' && val.average !== undefined) return val.average.toString();
  return '4.8';
};

export const RestaurantDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [restaurant, setRestaurant] = useState<any | null>(null);
  const [menu, setMenu] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('ALL');

  // Local cart state for item quantities
  const [cartQuantities, setCartQuantities] = useState<{ [key: string]: number }>({});
  const [addedMsg, setAddedMsg] = useState('');

  // Dineout Table Reservation State
  const [showTableModal, setShowTableModal] = useState(false);
  const [bookingDate, setBookingDate] = useState(new Date().toISOString().split('T')[0]);
  const [bookingTime, setBookingTime] = useState('19:30');
  const [bookingGuests, setBookingGuests] = useState('2');
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccessMsg, setBookingSuccessMsg] = useState('');

  const handleBookTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName.trim() || !custPhone.trim()) {
      alert('Please fill in your Name and Phone Number');
      return;
    }
    setBookingLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem('user') || 'null');
      const res = await axios.post('https://server.apexbee.in/api/food/dining/book', {
        restaurantId: restaurant?._id || id,
        customerName: custName,
        customerPhone: custPhone,
        customerEmail: user?.email || '',
        guestCount: Number(bookingGuests),
        bookingDate,
        bookingTime,
        specialRequests: `Booked via ${restaurant?.restaurantName || 'Restaurant'} Detail Page`
      });

      if (res.data && res.data.success) {
        setBookingSuccessMsg(`🎉 Table Reserved! Confirmation #${res.data.booking?._id?.slice(-5) || 'OK'}`);
        setTimeout(() => {
          setShowTableModal(false);
          setBookingSuccessMsg('');
        }, 2000);
      } else {
        alert(res.data?.message || 'Failed to book table');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error booking table. Please try again.');
    } finally {
      setBookingLoading(false);
    }
  };

  const fetchRestaurantDetail = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`https://server.apexbee.in/api/food/restaurants/${id}`);
      if (res.data) {
        setRestaurant(res.data.profile || res.data.restaurant || res.data);
        setMenu(res.data.menu || []);
      }
    } catch (err) {
      console.error('Failed to fetch restaurant detail:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchRestaurantDetail();
    }
  }, [id]);

  // Determine if the restaurant is currently closed
  const isRestaurantClosed = useMemo(() => {
    if (!restaurant) return false;
    if (restaurant.isOpen === false) return true;
    if (restaurant.acceptingOrders === false) return true;
    if (restaurant.busyMode === true) return true;
    const opStatus = restaurant.operationalStatus;
    if (opStatus === 'CLOSED' || opStatus === 'TEMPORARILY_CLOSED') return true;
    return false;
  }, [restaurant]);

  const closedReason = useMemo(() => {
    if (!restaurant) return '';
    if (restaurant.openReason) return restaurant.openReason;
    if (restaurant.busyMode) return 'Restaurant is in Busy Mode — not accepting orders';
    if (restaurant.acceptingOrders === false) return 'Restaurant is not accepting orders right now';
    if (restaurant.operationalStatus === 'TEMPORARILY_CLOSED') return 'Temporarily closed';
    return 'Restaurant is currently closed';
  }, [restaurant]);

  const handleAddToCart = async (item: any) => {
    if (isRestaurantClosed) return; // Block add when closed

    const currentQty = cartQuantities[item._id] || 0;
    const nextQty = currentQty + 1;

    setCartQuantities((prev) => ({ ...prev, [item._id]: nextQty }));

    const user = JSON.parse(localStorage.getItem('user') || 'null');
    const userId = user?.id || user?._id;
    const token = localStorage.getItem('token');

    const priceVal = Number(item.offerPrice || item.basePrice || 0);
    const originalPriceVal = Number(item.basePrice || priceVal);

    const fullItemObj = {
      _id: item._id,
      productId: item._id,
      name: item.name,
      itemName: item.name,
      title: item.name,
      price: priceVal,
      salesPrice: priceVal,
      originalPrice: originalPriceVal,
      afterDiscount: priceVal,
      image: item.imageUrl || item.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=400&auto=format&fit=crop',
      imageUrl: item.imageUrl || item.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=400&auto=format&fit=crop',
      quantity: 1,
      stock: 99,
      restaurantId: restaurant?._id || id,
      restaurantName: restaurant?.restaurantName || restaurant?.name || 'Restaurant',
      vendorName: restaurant?.restaurantName || restaurant?.name || 'Restaurant',
      vendorId: restaurant?.vendorId || restaurant?._id || id,
    };

    if (userId) {
      try {
        await axios.post('https://server.apexbee.in/api/cart/add', { ...fullItemObj, userId }, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
      } catch (e) {
        console.warn('Backend cart add warning:', e);
      }
    }

    // Sync with local_cart
    const local = JSON.parse(localStorage.getItem('local_cart') || '[]');
    const existingIdx = local.findIndex((i: any) => i._id === item._id || i.productId === item._id);

    if (existingIdx > -1) {
      local[existingIdx].quantity = nextQty;
    } else {
      local.push({ ...fullItemObj, quantity: 1 });
    }

    localStorage.setItem('local_cart', JSON.stringify(local));
    window.dispatchEvent(new Event('storage'));

    setAddedMsg(`✅ ${item.name} added to cart!`);
    setTimeout(() => setAddedMsg(''), 2500);
  };

  const handleUpdateQty = (item: any, delta: number) => {
    const currentQty = cartQuantities[item._id] || 0;
    const nextQty = Math.max(0, currentQty + delta);

    setCartQuantities((prev) => ({ ...prev, [item._id]: nextQty }));

    const local = JSON.parse(localStorage.getItem('local_cart') || '[]');
    if (nextQty === 0) {
      const filtered = local.filter((i: any) => i._id !== item._id && i.productId !== item._id);
      localStorage.setItem('local_cart', JSON.stringify(filtered));
    } else {
      const idx = local.findIndex((i: any) => i._id === item._id || i.productId === item._id);
      if (idx > -1) {
        local[idx].quantity = nextQty;
        localStorage.setItem('local_cart', JSON.stringify(local));
      }
    }
    window.dispatchEvent(new Event('storage'));
  };

  const allItems = menu.flatMap((cat: any) => cat.items || []);
  const filteredMenu = activeCategory === 'ALL'
    ? menu
    : menu.filter((cat: any) => cat._id === activeCategory || cat.name === activeCategory);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">
      <Navbar />

      {loading ? (
        <div className="pt-32 text-center py-20 text-slate-500">Loading restaurant menu...</div>
      ) : !restaurant ? (
        <div className="pt-32 text-center py-20 text-slate-500">Restaurant not found.</div>
      ) : (
        <div className="pb-16">
          {/* BANNER HEADER */}
          <div className="relative h-64 sm:h-80 bg-slate-900 overflow-hidden">
            {restaurant.bannerImage || restaurant.coverBanner || restaurant.coverImage || restaurant.logo ? (
              <img
                src={restaurant.bannerImage || restaurant.coverBanner || restaurant.coverImage || restaurant.logo}
                alt={restaurant.restaurantName || restaurant.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-[#0A1128] flex items-center justify-center">
                <Utensils className="w-20 h-20 text-amber-500/30" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A1128] via-transparent to-black/40" />

            <div className="absolute top-4 left-4 sm:left-8 z-10">
              <Link
                to="/food"
                className="px-4 py-2 bg-white/90 hover:bg-white text-[#0A1128] rounded-2xl shadow-lg text-xs font-black flex items-center space-x-1.5 transition"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Restaurants</span>
              </Link>
            </div>
          </div>

          {/* RESTAURANT INFO CARD */}
          <div className="max-w-7xl mx-auto px-4 sm:px-8 -mt-20 relative z-20 space-y-6">
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-start space-x-4">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-slate-50 border border-slate-200 overflow-hidden shrink-0 shadow-md">
                  {restaurant.logo ? (
                    <img src={restaurant.logo} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-heading font-black text-2xl text-amber-500 bg-amber-50">
                      {(restaurant.restaurantName || restaurant.name || 'R')[0]}
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <h1 className="text-xl sm:text-3xl font-black text-[#0A1128] font-heading">
                      {restaurant.restaurantName || restaurant.name}
                    </h1>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-300 flex items-center space-x-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>FSSAI VERIFIED</span>
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 font-medium">{restaurant.tagline || restaurant.description || 'Authentic Flavors & Culinary Excellence'}</p>

                  <div className="flex items-center space-x-3 text-xs text-slate-600 font-bold pt-1">
                    <span className="text-amber-600">
                      {Array.isArray(restaurant.cuisines) ? restaurant.cuisines.join(', ') : restaurant.cuisines || 'Multi-Cuisine'}
                    </span>
                    <span>•</span>
                    <span>{restaurant.locality || restaurant.city || 'Hyderabad'}</span>
                  </div>
                </div>
              </div>

              {/* RATING & STATS */}
              <div className="flex items-center space-x-4 pt-4 md:pt-0 border-t md:border-t-0 border-slate-100">
                <div className="text-center px-4 py-2.5 bg-amber-50 rounded-2xl border border-amber-200">
                  <div className="flex items-center justify-center space-x-1 text-amber-600 font-black font-mono text-lg">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span>{formatRating(restaurant.rating)}</span>
                  </div>
                  <div className="text-[10px] text-slate-600 font-extrabold">100+ Diners</div>
                </div>

                <div className="text-center px-4 py-2.5 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="text-[#0A1128] font-black font-mono text-lg flex items-center justify-center space-x-1">
                    <Clock className="w-4 h-4 text-amber-500" />
                    <span>{restaurant.averagePreparationMinutes || 20}m</span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-extrabold">Prep Time</div>
                </div>
              </div>
            </div>

            {/* DINEOUT TABLE RESERVATION BANNER */}
            {(restaurant?.diningEnabled !== false || restaurant?.tableReservationEnabled !== false) && (
              <div className="bg-gradient-to-r from-[#0A1128] via-indigo-950 to-[#0A1128] text-white p-5 sm:p-6 rounded-3xl border border-indigo-800 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 font-sans text-left">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-2xl shrink-0 shadow-md">
                    🍷
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-black uppercase bg-amber-400 text-slate-950 px-2 py-0.5 rounded">ApexBee Dineout</span>
                      <span className="text-xs text-amber-300 font-extrabold">FLAT 25% OFF BILL</span>
                    </div>
                    <h3 className="font-black text-base sm:text-lg text-white mt-0.5">Dine-in & Table Booking Available</h3>
                    <p className="text-[11px] text-slate-300">Reserve your table instantly with zero booking fees and priority seating.</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowTableModal(true)}
                  className="w-full sm:w-auto px-6 py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-2xl shadow-lg transition transform hover:scale-105 shrink-0 border-none cursor-pointer text-center"
                >
                  📅 Reserve Table Now
                </button>
              </div>
            )}

            {/* CLOSED RESTAURANT BANNER */}
            {isRestaurantClosed && (
              <div className="p-5 bg-red-50 border-2 border-red-300 text-red-800 rounded-3xl flex items-center gap-4 shadow-lg animate-pulse">
                <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="font-black text-base text-red-800 font-heading">🚫 Restaurant Currently Closed</h3>
                  <p className="text-xs font-medium text-red-600 mt-0.5">{closedReason}</p>
                  <p className="text-[10px] text-red-500 mt-1">You can browse the menu, but ordering is not available right now.</p>
                </div>
              </div>
            )}

            {addedMsg && !isRestaurantClosed && (
              <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-black rounded-2xl flex items-center justify-between shadow-sm">
                <span>{addedMsg}</span>
                <Link to="/cart" className="underline font-black text-[#0A1128]">View Cart & Checkout →</Link>
              </div>
            )}

            {/* CATEGORIES SELECTION & DROPDOWN TOOLBAR */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center font-bold shrink-0">
                  <Filter className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-[#0A1128] uppercase tracking-wider">Select Menu Category</h4>
                  <p className="text-[10px] text-slate-500 font-semibold">Showing {filteredMenu.flatMap((c: any) => c.items || []).length} items in total</p>
                </div>
              </div>

              {/* Functional Category Dropdown Menu */}
              <div className="relative w-full sm:w-72">
                <select
                  value={activeCategory}
                  onChange={(e) => setActiveCategory(e.target.value)}
                  className="w-full appearance-none bg-slate-50 border-2 border-slate-200 hover:border-amber-400 focus:border-[#0A1128] focus:ring-2 focus:ring-amber-400/20 text-[#0A1128] text-xs font-black rounded-xl px-4 py-3 pr-10 cursor-pointer shadow-xs transition-all font-sans"
                >
                  <option value="ALL">🍽️ All Categories ({allItems.length} dishes)</option>
                  {menu.map((cat: any) => (
                    <option key={cat._id} value={cat._id}>
                      📂 {cat.name} ({cat.items?.length || 0} items)
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-amber-600 absolute right-3 top.1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* QUICK CATEGORY CHIPS */}
            <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
              <button
                onClick={() => setActiveCategory('ALL')}
                className={`px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer shrink-0 border ${activeCategory === 'ALL'
                  ? 'bg-[#0A1128] text-amber-400 border-[#0A1128] shadow-md'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
              >
                All ({allItems.length})
              </button>
              {menu.map((cat: any) => (
                <button
                  key={cat._id}
                  onClick={() => setActiveCategory(cat._id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer shrink-0 border ${activeCategory === cat._id
                    ? 'bg-[#0A1128] text-amber-400 border-[#0A1128] shadow-md'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                >
                  {cat.name} ({cat.items?.length || 0})
                </button>
              ))}
            </div>

            {/* FOOD DISHES GRID */}
            <div className="space-y-8">
              {filteredMenu.map((cat: any) => (
                <div key={cat._id} className="space-y-4">
                  <h2 className="text-xl font-black text-[#0A1128] font-heading border-b border-slate-200 pb-2">
                    {cat.name}
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(cat.items || []).map((item: any) => (
                      <div key={item._id} className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-md flex items-start justify-between gap-4 hover:shadow-lg transition">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center space-x-2">
                            <span
                              className={`w-4 h-4 rounded-md border-2 flex items-center justify-center p-0.5 ${item.foodType === 'VEG' || item.foodType === 'VEGAN' ? 'border-emerald-600' : 'border-rose-600'
                                }`}
                            >
                              <span className={`w-2 h-2 rounded-full ${item.foodType === 'VEG' || item.foodType === 'VEGAN' ? 'bg-emerald-600' : 'bg-rose-600'}`} />
                            </span>
                            <h3 className="font-black text-base text-[#0A1128] font-heading">{item.name}</h3>
                          </div>

                          <div className="text-lg font-black text-amber-600 font-mono">
                            ₹{item.offerPrice || item.basePrice}
                            {item.offerPrice > 0 && item.offerPrice < item.basePrice && (
                              <span className="text-xs text-slate-400 line-through ml-2 font-normal">₹{item.basePrice}</span>
                            )}
                          </div>

                          <p className="text-xs text-slate-500 line-clamp-2 font-medium">{item.description || 'Prepared fresh with premium ingredients.'}</p>
                        </div>

                        {/* DISH IMAGE & ADD BUTTON */}
                        <div className="w-28 h-28 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden relative shrink-0">
                          {item.imageUrl || item.image ? (
                            <img src={item.imageUrl || item.image} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-amber-500/40 bg-amber-50">
                              <Utensils className="w-8 h-8" />
                            </div>
                          )}

                          <div className="absolute bottom-2 left-2 right-2">
                            {isRestaurantClosed ? (
                              <div className="w-full py-1.5 bg-slate-400 text-white font-black text-[10px] rounded-xl shadow-md flex items-center justify-center space-x-1 cursor-not-allowed opacity-70">
                                <AlertTriangle className="w-3 h-3" />
                                <span>CLOSED</span>
                              </div>
                            ) : cartQuantities[item._id] ? (
                              <div className="flex items-center justify-between bg-[#0A1128] text-amber-400 rounded-xl px-2 py-1 font-black text-xs shadow-lg">
                                <button onClick={() => handleUpdateQty(item, -1)} className="hover:opacity-80 cursor-pointer">
                                  <Minus className="w-3.5 h-3.5" />
                                </button>
                                <span>{cartQuantities[item._id]}</span>
                                <button onClick={() => handleUpdateQty(item, 1)} className="hover:opacity-80 cursor-pointer">
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleAddToCart(item)}
                                className="w-full py-1.5 bg-amber-500 hover:bg-amber-400 text-[#0A1128] font-black text-xs rounded-xl shadow-md transition flex items-center justify-center space-x-1 cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>ADD</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TABLE RESERVATION MODAL */}
      {showTableModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 font-sans text-left">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="bg-[#0A1128] text-white p-5 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center text-xl font-bold">
                  🍷
                </div>
                <div>
                  <h3 className="font-black text-base text-white">Reserve a Table</h3>
                  <p className="text-[10px] text-amber-300 font-semibold">{restaurant?.restaurantName || restaurant?.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTableModal(false)}
                className="text-slate-400 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition border-none cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {bookingSuccessMsg ? (
              <div className="p-8 text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-3xl font-black">
                  ✓
                </div>
                <h4 className="text-xl font-black text-slate-900">{bookingSuccessMsg}</h4>
                <p className="text-xs text-slate-500 font-medium">We sent confirmation details to your contact number. Enjoy your dining experience!</p>
              </div>
            ) : (
              <form onSubmit={handleBookTable} className="p-6 space-y-4">
                {/* Date & Time Row */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Date</label>
                    <div className="relative">
                      <input
                        type="date"
                        value={bookingDate}
                        onChange={(e) => setBookingDate(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Time Slot</label>
                    <select
                      value={bookingTime}
                      onChange={(e) => setBookingTime(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 cursor-pointer"
                    >
                      <option value="12:30">Lunch 12:30 PM</option>
                      <option value="13:30">Lunch 01:30 PM</option>
                      <option value="19:00">Dinner 07:00 PM</option>
                      <option value="19:30">Dinner 07:30 PM</option>
                      <option value="20:30">Dinner 08:30 PM</option>
                      <option value="21:30">Dinner 09:30 PM</option>
                    </select>
                  </div>
                </div>

                {/* Guests count */}
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Guests Count</label>
                  <div className="grid grid-cols-5 gap-2">
                    {['1', '2', '3', '4', '6+'].map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setBookingGuests(g === '6+' ? '6' : g)}
                        className={`py-2 rounded-xl text-xs font-black transition cursor-pointer border ${(bookingGuests === g || (g === '6+' && Number(bookingGuests) >= 6))
                          ? 'bg-[#0A1128] text-amber-400 border-[#0A1128]'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                      >
                        {g} {g === '1' ? 'Guest' : 'Guests'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Name & Phone */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Your Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Rahul Sharma"
                      value={custName}
                      onChange={(e) => setCustName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Phone Number</label>
                    <input
                      type="tel"
                      placeholder="e.g. 9876543210"
                      value={custPhone}
                      onChange={(e) => setCustPhone(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                      required
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-2 flex items-center justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowTableModal(false)}
                    className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 border-none bg-transparent cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={bookingLoading}
                    className="px-6 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-md transition disabled:opacity-50 border-none cursor-pointer"
                  >
                    {bookingLoading ? 'Reserving...' : 'Confirm Table Booking →'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};
