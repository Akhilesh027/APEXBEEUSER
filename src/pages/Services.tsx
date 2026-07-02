// src/pages/Services.tsx — Service Marketplace (Live Backend)
import { useState, useEffect, useCallback, useRef } from "react";
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
  Sparkles, Bug
} from "lucide-react";

const API_BASE = "https://server.apexbee.in/api";

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
  availability?: {
    weeklySchedule: AvailabilityDay[];
    emergencyActive: boolean;
    holidays: { date: string; name: string }[];
  };
  services: ServiceItem[];
  status: string;
}

// ─────────────────────────────────────────────
// Category Definitions
// ─────────────────────────────────────────────
const CATEGORIES = [
  { id: "", name: "All Services", icon: <Home className="w-5 h-5" />, color: "from-slate-500 to-slate-700" },
  { id: "Appliance Repair", name: "Appliance Repair", icon: <Snowflake className="w-5 h-5" />, color: "from-cyan-400 to-blue-600" },
  { id: "Electrical Work", name: "Electrical Work", icon: <Zap className="w-5 h-5" />, color: "from-yellow-500 to-orange-600" },
  { id: "Plumbing", name: "Plumbing", icon: <Wrench className="w-5 h-5" />, color: "from-blue-500 to-cyan-600" },
  { id: "Home Cleaning", name: "Home Cleaning", icon: <Sparkles className="w-5 h-5" />, color: "from-purple-500 to-indigo-600" },
  { id: "Pest Control", name: "Pest Control", icon: <Bug className="w-5 h-5" />, color: "from-rose-500 to-pink-600" },
];

const TIME_SLOTS = ["09:00 AM", "11:00 AM", "01:00 PM", "03:00 PM", "05:00 PM", "07:00 PM"];

const PLACEHOLDER_IMAGES = [
  "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?q=80&w=400",
  "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?q=80&w=400",
  "https://images.unsplash.com/photo-1607472586893-edb57cbbea42?q=80&w=400",
  "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?q=80&w=400",
  "https://images.unsplash.com/photo-1486006920555-c77dcf18193c?q=80&w=400",
];

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 0 }).format(v);

// ─────────────────────────────────────────────
// Availability helper
// ─────────────────────────────────────────────
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
// Provider Card
// ─────────────────────────────────────────────
const ProviderCard = ({
  provider,
  onBook,
  onView,
  index,
}: {
  provider: Provider;
  onBook: (p: Provider) => void;
  onView: (p: Provider) => void;
  index: number;
}) => {
  const lowestPrice = getLowestPrice(provider);
  const availability = getTodayAvailability(provider);
  const isEmergency = provider.availability?.emergencyActive ?? false;
  const imgSrc = provider.profilePhoto || PLACEHOLDER_IMAGES[index % PLACEHOLDER_IMAGES.length];
  const displayServices = provider.services?.filter((s) => s.active).slice(0, 3) || [];
  const extraServicesCount = (provider.services?.filter((s) => s.active).length || 0) - 3;

  return (
    <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col h-full border-gray-200 hover:border-blue-200 group cursor-pointer" onClick={() => onView(provider)}>
      <div className="flex p-4 gap-4">
        <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 relative bg-gray-100">
          <img
            src={imgSrc}
            alt={provider.businessName}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGES[index % PLACEHOLDER_IMAGES.length];
            }}
          />
          {provider.status === "verified" && (
            <div className="absolute bottom-1 right-1 bg-white rounded-full p-0.5 shadow">
              <ShieldCheck className="w-3.5 h-3.5 text-green-500" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-navy text-base truncate leading-tight">{provider.businessName}</h3>
          <p className="text-xs text-muted-foreground truncate">{provider.ownerName}</p>
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {(provider.serviceCategory.length > 0
              ? provider.serviceCategory
              : Array.from(new Set(provider.services?.filter(s => s.active).map(s => s.category) || []))
            ).slice(0, 2).map((cat) => (
              <span key={cat} className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                {cat}
              </span>
            ))}
          </div>
          {provider.experience && (
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <Clock className="w-3 h-3" /> {provider.experience} experience
            </p>
          )}
        </div>
      </div>

      <div className="px-4 pb-4 flex-1 flex flex-col">
        {displayServices.length > 0 ? (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {displayServices.map((s, i) => (
              <span key={i} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-md">
                {s.name}
              </span>
            ))}
            {extraServicesCount > 0 && (
              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-md">
                +{extraServicesCount} more
              </span>
            )}
          </div>
        ) : (provider.serviceCategory.length > 0 || (provider.services && provider.services.length > 0)) ? (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {(provider.serviceCategory.length > 0
              ? provider.serviceCategory
              : Array.from(new Set(provider.services?.filter(s => s.active).map(s => s.category) || []))
            ).slice(0, 4).map((cat) => (
              <span key={cat} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-md">
                {cat}
              </span>
            ))}
          </div>
        ) : null}

        {(provider.district || provider.mandal) && (
          <p className="text-xs text-muted-foreground flex items-center gap-1 mb-3">
            <MapPin className="w-3 h-3 flex-shrink-0" />
            {[provider.mandal, provider.district].filter(Boolean).join(", ")}
          </p>
        )}

        <div className="mt-auto pt-3 border-t flex items-center justify-between gap-2">
          <div>
            <p className="text-[10px] text-muted-foreground">
              {availability.startsWith("Closed") ? (
                <span className="text-rose-500 font-medium">{availability}</span>
              ) : (
                <span className="text-emerald-600 font-medium">{availability}</span>
              )}
            </p>
            {lowestPrice !== null ? (
              <p className="font-bold text-navy text-lg">{formatCurrency(lowestPrice)}</p>
            ) : (
              <p className="text-sm text-muted-foreground italic">Quote on request</p>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="text-sm h-9 px-3 border-navy text-navy hover:bg-navy hover:text-white"
              onClick={(e) => { e.stopPropagation(); onView(provider); }}
            >
              Details
            </Button>
            <Button
              className="bg-navy hover:bg-navy/90 text-white text-sm h-9 px-4"
              onClick={(e) => { e.stopPropagation(); onBook(provider); }}
            >
              Book
            </Button>
          </div>
        </div>
      </div>

      {isEmergency && (
        <div className="bg-red-50 text-red-700 text-xs py-1.5 px-4 font-medium flex items-center justify-center gap-1 border-t border-red-100">
          <AlertTriangle className="w-3.5 h-3.5" /> Emergency Service Available
        </div>
      )}
    </Card>
  );
};

// ─────────────────────────────────────────────
// Provider Detail Modal
// ─────────────────────────────────────────────
const ProviderDetailModal = ({
  provider,
  onClose,
  onBook,
  index,
}: {
  provider: Provider | null;
  onClose: () => void;
  onBook: (p: Provider) => void;
  index: number;
}) => {
  if (!provider) return null;
  const lowestPrice = getLowestPrice(provider);
  const isEmergency = provider.availability?.emergencyActive ?? false;
  const imgSrc = provider.profilePhoto || PLACEHOLDER_IMAGES[index % PLACEHOLDER_IMAGES.length];
  const activeServices = provider.services?.filter((s) => s.active) || [];
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const todayName = days[new Date().getDay()];

  return (
    <Dialog open={!!provider} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        {/* Hero banner */}
        <div className="relative h-48 bg-gradient-to-br from-navy to-blue-600 overflow-hidden flex-shrink-0">
          <img
            src={imgSrc}
            alt={provider.businessName}
            className="w-full h-full object-cover opacity-30"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          <div className="absolute inset-0 flex items-end p-6">
            <div className="flex items-end gap-4">
              <div className="w-20 h-20 rounded-2xl overflow-hidden border-4 border-white shadow-xl bg-white flex-shrink-0">
                <img
                  src={imgSrc}
                  alt={provider.businessName}
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              </div>
              <div className="text-white pb-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-extrabold">{provider.businessName}</h2>
                  {provider.status === 'verified' && (
                    <span className="flex items-center gap-1 text-[10px] bg-green-400/20 border border-green-400/40 text-green-300 px-2 py-0.5 rounded-full font-bold">
                      <ShieldCheck className="w-3 h-3" /> Verified
                    </span>
                  )}
                </div>
                <p className="text-sm text-blue-100">{provider.ownerName}</p>
                {(provider.district || provider.mandal) && (
                  <p className="text-xs text-blue-200 flex items-center gap-1 mt-1">
                    <MapPin className="w-3 h-3" /> {[provider.mandal, provider.district].filter(Boolean).join(", ")}
                  </p>
                )}
              </div>
            </div>
          </div>
          {isEmergency && (
            <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-red-500 text-white text-xs px-3 py-1.5 rounded-full font-bold shadow">
              <AlertTriangle className="w-3.5 h-3.5" /> Emergency Available
            </div>
          )}
        </div>

        <div className="p-6 space-y-6">
          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 bg-blue-50 rounded-xl">
              <p className="text-xs text-muted-foreground mb-1">Experience</p>
              <p className="font-bold text-navy text-sm">{provider.experience || "N/A"}</p>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-xl">
              <p className="text-xs text-muted-foreground mb-1">Services</p>
              <p className="font-bold text-navy text-sm">{activeServices.length}</p>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-xl">
              <p className="text-xs text-muted-foreground mb-1">Starting from</p>
              <p className="font-bold text-navy text-sm">
                {lowestPrice !== null ? formatCurrency(lowestPrice) : "On quote"}
              </p>
            </div>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-sm font-bold text-navy mb-2">Service Categories</h3>
            <div className="flex flex-wrap gap-2">
              {provider.serviceCategory.map((cat) => (
                <Badge key={cat} className="bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200 font-semibold">{cat}</Badge>
              ))}
              {provider.serviceSubCategory?.map((sub) => (
                <Badge key={sub} variant="outline" className="text-gray-600 font-medium">{sub}</Badge>
              ))}
            </div>
          </div>

          {/* Description */}
          {provider.description && (
            <div>
              <h3 className="text-sm font-bold text-navy mb-2">About</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{provider.description}</p>
            </div>
          )}

          {/* Service Catalog */}
          {activeServices.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-navy mb-3">Service Catalog ({activeServices.length})</h3>
              <div className="space-y-2">
                {activeServices.map((svc, i) => (
                  <div key={svc.id || i} className="flex gap-3 p-4 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 transition-colors flex-col sm:flex-row">
                    {svc.imageUrl && (
                      <div className="w-full sm:w-20 h-28 sm:h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                        <img src={svc.imageUrl} alt={svc.name} className="w-full h-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-semibold text-sm text-navy">{svc.name}</p>
                        <div className="flex items-center gap-1.5">
                          {svc.warranty && (
                            <span className="flex items-center gap-0.5 text-[9px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-bold border border-emerald-100">
                              <ShieldCheck className="w-2.5 h-2.5" /> Warranty: {svc.warranty}
                            </span>
                          )}
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex-shrink-0 ${svc.type === 'Fixed Price' ? 'bg-emerald-100 text-emerald-700' :
                              svc.type === 'Quote Based' ? 'bg-indigo-100 text-indigo-700' :
                                'bg-amber-100 text-amber-700'
                            }`}>{svc.type}</span>
                        </div>
                      </div>
                      {svc.description && <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{svc.description}</p>}

                      {svc.included && svc.included.length > 0 && (
                        <div className="mt-2 space-y-1">
                          <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">What's Included:</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-0.5">
                            {svc.included.map((inc: string, idx: number) => (
                              <div key={idx} className="flex items-center gap-1 text-[11px] text-gray-600">
                                <CheckCircle className="w-3 h-3 text-emerald-500 shrink-0" />
                                <span>{inc}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {svc.excluded && svc.excluded.length > 0 && (
                        <div className="mt-2 space-y-1">
                          <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">What's Excluded:</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-0.5">
                            {svc.excluded.map((exc: string, idx: number) => (
                              <div key={idx} className="flex items-center gap-1 text-[11px] text-gray-600">
                                <X className="w-3 h-3 text-red-500 shrink-0" />
                                <span>{exc}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {svc.cancellationPolicy && (
                        <p className="text-[10px] text-amber-700 mt-2 bg-amber-50 px-2 py-0.5 rounded border border-amber-100/60 flex items-center gap-1 w-fit">
                          <AlertTriangle className="w-3 h-3 text-amber-600" /> Policy: {svc.cancellationPolicy}
                        </p>
                      )}

                      {svc.tags && svc.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {svc.tags.map((tag, ti) => (
                            <span key={ti} className="text-[9px] px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded-full">#{tag}</span>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center gap-3 mt-3 pt-2 border-t border-gray-100/50">
                        <div className="flex items-baseline gap-1.5">
                          {svc.discountPrice && Number(svc.discountPrice) > 0 ? (
                            <>
                              <span className="text-sm font-bold text-emerald-600">{formatCurrency(svc.discountPrice)}</span>
                              <span className="text-xs line-through text-gray-400 font-medium">{formatCurrency(svc.price)}</span>
                            </>
                          ) : (
                            <span className="text-sm font-bold text-navy">{svc.price > 0 ? formatCurrency(svc.price) : 'On Quote'}</span>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {svc.duration}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Weekly Availability */}
          {provider.availability?.weeklySchedule && (
            <div>
              <h3 className="text-sm font-bold text-navy mb-3">Weekly Schedule</h3>
              <div className="grid grid-cols-7 gap-1">
                {provider.availability.weeklySchedule.map((day) => {
                  const isToday = day.day.startsWith(todayName.slice(0, 3));
                  return (
                    <div key={day.day} className={`text-center p-2 rounded-xl text-[10px] font-semibold transition-colors ${!day.active ? 'bg-gray-50 text-gray-400 border border-dashed border-gray-200' :
                        isToday ? 'bg-navy text-white shadow-md' :
                          'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}>
                      <p>{day.day.slice(0, 3)}</p>
                      {day.active ? (
                        <p className="mt-1 text-[8px] leading-tight">{day.start.split(' ')[0]}<br />–<br />{day.end.split(' ')[0]}</p>
                      ) : (
                        <p className="mt-1 text-[8px]">Closed</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Location */}
          <div className="p-4 bg-gray-50 rounded-xl flex items-center gap-3">
            <MapPin className="w-5 h-5 text-navy flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-navy">
                {[provider.mandal, provider.district].filter(Boolean).join(", ") || provider.address}
              </p>
              <p className="text-xs text-muted-foreground">{provider.address} · {provider.pincode}</p>
            </div>
          </div>

          {/* CTA */}
          <Button
            className="w-full bg-navy hover:bg-navy/90 text-white py-6 text-base font-bold"
            onClick={() => { onClose(); onBook(provider); }}
          >
            Book This Provider <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// ─────────────────────────────────────────────
// Main Services Component
// ─────────────────────────────────────────────
const Services = () => {
  const [activeTab, setActiveTab] = useState("home");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [emergencyOnly, setEmergencyOnly] = useState(false);

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

  // Detail modal state
  const [detailProvider, setDetailProvider] = useState<Provider | null>(null);
  const [detailIndex, setDetailIndex] = useState(0);

  const openDetailModal = (p: Provider) => {
    const idx = providers.findIndex((pr) => pr._id === p._id);
    setDetailIndex(idx >= 0 ? idx : 0);
    setDetailProvider(p);
  };

  const [myBookings, setMyBookings] = useState<any[]>([]);

  // Checkout states for service bookings
  const [payingBooking, setPayingBooking] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<"wallet" | "upi">("wallet");
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const fetchBookings = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await fetch("https://server.apexbee.in/api/service/bookings", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setMyBookings(data.bookings || []);
      }
    } catch (err) {
      console.error("Error fetching bookings:", err);
    }
  }, []);

  const handlePayBooking = async () => {
    if (!payingBooking) return;
    try {
      setProcessingPayment(true);
      const user = JSON.parse(localStorage.getItem("user") || "null");
      const userId = user?.id || user?._id;
      const token = localStorage.getItem("token");

      const res = await fetch(`https://server.apexbee.in/api/service/bookings/${payingBooking._id || payingBooking.id}/pay`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          userId,
          paymentMethod
        })
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "Failed to make payment");
      } else {
        setPaymentSuccess(true);
        fetchBookings();
        setTimeout(() => {
          setPayingBooking(null);
          setPaymentSuccess(false);
        }, 1500);
      }
    } catch (err: any) {
      alert("Error processing payment: " + err.message);
    } finally {
      setProcessingPayment(false);
    }
  };

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
      const res = await fetch(`https://server.apexbee.in/api/service/availability/slots?providerId=${provId}&date=${formattedDate}`);
      if (res.ok) {
        const data = await res.json();
        setAvailableSlots(data.slots || []);
      }
    } catch (err) {
      console.error("Error fetching slots:", err);
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

  const handleRateBooking = async (bookingId: string, stars: number) => {
    const comment = prompt("Enter a comment for your review (optional):") || "";
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await fetch(`https://server.apexbee.in/api/service/bookings/${bookingId}/review`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ rating: stars, comment })
      });
      if (res.ok) {
        alert("Thank you for your feedback!");
        fetchBookings();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Fetch providers ──────────────────────────────────────────────
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

      const res = await fetch(`${API_BASE}/service-provider/public/list?${params}`);
      if (!res.ok) throw new Error("Failed to fetch service providers");
      const data = await res.json();

      setProviders(reset ? data.providers : (prev) => [...prev, ...data.providers]);
      setTotal(data.total);
      setPage(pg);
    } catch (err: any) {
      setError(err.message || "Could not load service providers");
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedCategory, emergencyOnly]);

  // Initial load + when filters change
  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      fetchProviders(1, true);
    }, 350);
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, [fetchProviders]);

  // ── Booking handlers ─────────────────────────────────────────────
  const openBookingModal = (p: Provider) => {
    setBookingProvider(p);
    const activeServices = p.services?.filter((s) => s.active);
    setSelectedService(activeServices?.[0] || null);
    setSelectedDate("Today");
    setSelectedTime("");
    setBookingAddress("");
    setBookingStep(1);
    setBookingSuccess(false);

    // Track recently viewed
    try {
      const list = JSON.parse(localStorage.getItem("mock_recently_viewed") || "[]");
      const filtered = list.filter((item: any) => !(item.id === p._id && item.type === "service"));
      filtered.unshift({
        id: p._id,
        type: "service",
        title: p.businessName,
        image: p.profilePhoto || PLACEHOLDER_IMAGES[0],
        price: getLowestPrice(p) || 0,
        url: "/services",
        categoryName: p.serviceCategory[0] || "Service",
        timestamp: new Date().toISOString(),
      });
      localStorage.setItem("mock_recently_viewed", JSON.stringify(filtered.slice(0, 15)));
    } catch (e) {
      console.error("Error tracking service:", e);
    }
  };

  const handleBook = async () => {
    if (!bookingProvider || !selectedTime || !bookingAddress.trim()) return;
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please log in to book a service");
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

      const res = await fetch("https://server.apexbee.in/api/service/bookings", {
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
          setActiveTab("my-services");
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

  // ── Status badge color ───────────────────────────────────────────
  const statusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-700 border-green-200";
      case "Accepted":
      case "Technician Assigned":
      case "Provider On The Way":
      case "Arrived":
      case "Work Started":
      case "Work Completed":
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "Rejected":
      case "Cancelled":
        return "bg-rose-100 text-rose-700 border-rose-200";
      case "Rescheduled":
      case "Refund Initiated":
        return "bg-purple-100 text-purple-700 border-purple-200";
      default:
        return "bg-amber-100 text-amber-700 border-amber-200";
    }
  };

  // ── Render: Providers grid ───────────────────────────────────────
  const renderHome = () => (
    <div className="space-y-10">
      {/* Hero */}
      <div className="rounded-2xl bg-gradient-to-r from-cyan-600 via-blue-700 to-indigo-800 text-white p-8 md:p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?q=80&w=1200')] bg-cover bg-center opacity-10" />
        <div className="relative z-10 max-w-2xl">
          <Badge className="bg-white/20 text-white hover:bg-white/30 border-0 mb-4 text-xs font-semibold uppercase tracking-widest">
            ApexBee Services
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
            Expert Home Services,<br />Right at Your Doorstep
          </h1>
          <p className="text-lg opacity-90 mb-8 leading-relaxed">
            Book trusted, verified professionals for plumbing, electrical, appliance repair, and more. Transparent pricing, guaranteed quality.
          </p>

          {/* Search bar */}
          <div className="bg-white rounded-xl p-2 flex items-center max-w-lg shadow-xl gap-2">
            <Search className="w-5 h-5 text-gray-400 ml-2 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search AC repair, plumber, electrician..."
              className="flex-1 bg-transparent border-0 px-2 py-2 text-gray-800 focus:outline-none placeholder:text-gray-400 text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
        <Wrench className="absolute -bottom-10 -right-10 w-64 h-64 text-white opacity-10 transform rotate-12" />
      </div>

      {/* Categories */}
      <div>
        <h2 className="text-xl font-bold text-navy mb-4">Browse by Category</h2>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex-shrink-0 flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all duration-200 min-w-[80px] ${selectedCategory === cat.id
                  ? "border-blue-500 bg-blue-50 shadow-md"
                  : "border-gray-200 bg-white hover:border-blue-200 hover:shadow-sm"
                }`}
            >
              <div
                className={`w-10 h-10 rounded-xl bg-gradient-to-br ${cat.color} text-white flex items-center justify-center shadow-sm`}
              >
                {cat.icon}
              </div>
              <span className={`text-[10px] font-semibold text-center leading-tight ${selectedCategory === cat.id ? "text-blue-700" : "text-gray-700"}`}>
                {cat.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Filters Row */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-navy">
            {loading ? "Loading..." : `${total} provider${total !== 1 ? "s" : ""} found`}
            {selectedCategory && ` · ${selectedCategory}`}
            {searchQuery && ` · "${searchQuery}"`}
          </span>
        </div>
        <div className="flex gap-3 items-center">
          <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700">
            <div
              className={`relative w-10 h-5 rounded-full transition-colors ${emergencyOnly ? "bg-red-500" : "bg-gray-300"}`}
              onClick={() => setEmergencyOnly((v) => !v)}
            >
              <div
                className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${emergencyOnly ? "translate-x-5" : ""}`}
              />
            </div>
            Emergency only
          </label>
          {(selectedCategory || searchQuery || emergencyOnly) && (
            <button
              onClick={() => {
                setSelectedCategory("");
                setSearchQuery("");
                setEmergencyOnly(false);
              }}
              className="text-xs text-blue-600 font-medium hover:underline flex items-center gap-1"
            >
              <RefreshCcw className="w-3 h-3" /> Reset filters
            </button>
          )}
        </div>
      </div>

      {/* Emergency Banner */}
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0">
            <PhoneCall className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-red-700">Need Emergency Help?</h3>
            <p className="text-sm text-red-600">Electrician, Plumber, or Towing within 30 minutes.</p>
          </div>
        </div>
        <Button
          className="bg-red-600 hover:bg-red-700 text-white whitespace-nowrap text-sm"
          onClick={() => setEmergencyOnly(true)}
        >
          Find Emergency Providers
        </Button>
      </div>

      {/* Providers Grid */}
      {loading && providers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-muted-foreground">
          <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
          <p className="text-sm font-medium">Finding service providers near you…</p>
        </div>
      ) : error ? (
        <div className="text-center py-16 bg-red-50 rounded-xl border border-red-100">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <p className="text-red-700 font-medium mb-2">{error}</p>
          <Button variant="outline" onClick={() => fetchProviders(1)} className="mt-2">
            <RefreshCcw className="w-4 h-4 mr-2" /> Retry
          </Button>
        </div>
      ) : providers.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-xl border border-dashed border-gray-300">
          <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="font-semibold text-gray-700 mb-1">No providers found</p>
          <p className="text-sm text-muted-foreground mb-4">
            Try different keywords or broaden your filters.
          </p>
          <Button
            variant="outline"
            onClick={() => {
              setSelectedCategory("");
              setSearchQuery("");
              setEmergencyOnly(false);
            }}
          >
            Clear Filters
          </Button>
        </div>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {providers.map((p, i) => (
              <ProviderCard key={p._id} provider={p} onBook={openBookingModal} onView={openDetailModal} index={i} />
            ))}
          </div>

          {/* Load more */}
          {providers.length < total && (
            <div className="text-center pt-4">
              <Button
                variant="outline"
                onClick={() => fetchProviders(page + 1, false)}
                disabled={loading}
                className="px-8"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Load More ({total - providers.length} remaining)
              </Button>
            </div>
          )}
        </>
      )}

      {/* AMC Section */}
      <div className="rounded-2xl bg-gradient-to-br from-gray-900 to-navy text-white p-8 md:p-12 text-center shadow-xl">
        <Badge className="bg-blue-500 text-white mb-4 border-0">Annual Maintenance Contracts (AMC)</Badge>
        <h2 className="text-3xl font-bold mb-3">Keep Your Appliances Running Smoothly</h2>
        <p className="text-gray-300 max-w-2xl mx-auto mb-8">
          Subscribe to monthly, quarterly, or yearly AMC plans for ACs, ROs, and Computers. Get priority service and save up to 40% on repairs.
        </p>
        <Button className="bg-white text-navy hover:bg-gray-100 px-8" onClick={() => setActiveTab("amc")}>
          Explore AMC Plans
        </Button>
      </div>
    </div>
  );

  // ── Render: My Bookings ──────────────────────────────────────────
  const renderMyServices = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-navy">My Services &amp; Bookings</h2>
      {myBookings.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-xl border border-dashed border-gray-200 animate-fadeIn">
          <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-3" />
          <p className="text-muted-foreground mb-4">You have no upcoming service bookings.</p>
          <Button className="bg-navy hover:bg-navy/90 text-white" onClick={() => setActiveTab("home")}>
            Book a Service
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {myBookings.map((bkg) => {
            const steps = ["Placed", "Accepted", "Staff Dispatched", "Work Started", "Completed"];
            const getStepStatus = (stepIdx: number): boolean => {
              if (bkg.status === "Completed") return true;
              if (bkg.status === "Cancelled" || bkg.status === "Rejected") return false;
              if (stepIdx === 0) return true; // Placed
              if (stepIdx === 1) return bkg.status !== "Pending"; // Accepted
              if (stepIdx === 2) {
                return ["Technician Assigned", "Provider On The Way", "Arrived", "Work Started", "Work Completed"].includes(bkg.status);
              }
              if (stepIdx === 3) {
                return ["Work Started", "Work Completed"].includes(bkg.status);
              }
              return false;
            };

            return (
              <Card key={bkg._id || bkg.id} className="border-l-4 border-l-navy hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex flex-col sm:flex-row justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-3 mb-2">
                        <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-0">{bkg.id}</Badge>
                        <span className="text-sm font-semibold text-navy">{bkg.provider}</span>
                      </div>
                      <h3 className="font-bold text-lg mb-2 text-slate-800">{bkg.service}</h3>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-slate-400" /> {bkg.date}</span>
                        <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-slate-400" /> {bkg.time}</span>
                        {bkg.address && (
                          <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-slate-400" /> {bkg.address.slice(0, 50)}{bkg.address.length > 50 ? "…" : ""}</span>
                        )}
                      </div>

                      {bkg.status !== "Completed" && bkg.status !== "Cancelled" && bkg.status !== "Rejected" && bkg.otpCode && (
                        <div className="mt-3.5 p-2 px-3 bg-blue-50/60 border border-blue-100 rounded-lg inline-flex items-center gap-2 text-xs font-semibold text-blue-800 animate-pulse">
                          <span>🔐 Booking Verification OTP:</span>
                          <span className="font-extrabold text-sm tracking-widest text-blue-900">{bkg.otpCode}</span>
                        </div>
                      )}

                      {bkg.assignedStaff && (
                        <p className="text-xs text-brand-500 font-bold mt-2">
                          🔧 Assigned Technician: {bkg.assignedStaff}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col justify-between items-start sm:items-end border-t sm:border-t-0 pt-4 sm:pt-0 gap-2">
                      <div className="flex gap-2">
                        <Badge className={statusColor(bkg.status)}>{bkg.status}</Badge>
                        {bkg.paymentStatus === "Paid" ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700">
                            Paid
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
                            Unpaid
                          </span>
                        )}
                      </div>
                      <div className="text-right mt-3 sm:mt-0">
                        <p className="text-xs text-muted-foreground">Service Price</p>
                        <p className="font-black text-navy text-lg">{formatCurrency(bkg.servicePrice || 0)}</p>
                      </div>
                      {bkg.paymentStatus !== "Paid" && bkg.status !== "Cancelled" && bkg.status !== "Rejected" && (
                        <Button
                          className="bg-accent hover:bg-accent/90 text-white font-extrabold text-xs px-4.5 py-2 rounded-xl mt-2 flex items-center gap-1 shadow-sm"
                          onClick={() => setPayingBooking(bkg)}
                        >
                          💳 Pay Now
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Progress timeline */}
                  <div className="mt-6 pt-6 border-t">
                    <div className="flex justify-between relative">
                      <div className="absolute top-3 left-0 right-0 h-0.5 bg-gray-200 -z-10" />
                      {steps.map((step, i) => {
                        const done = getStepStatus(i);
                        return (
                          <div key={i} className="flex flex-col items-center bg-white px-1 relative z-5">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs mb-2 font-bold transition-all ${done ? "bg-green-500 text-white scale-110 shadow" : "bg-gray-200 text-gray-500"}`}>
                              {done ? "✓" : i + 1}
                            </div>
                            <span className={`text-[9px] font-bold uppercase tracking-wider ${done ? "text-green-700" : "text-gray-400"}`}>{step}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Rating / Review feedback */}
                  {bkg.status === "Completed" && (
                    <div className="mt-5 pt-4 border-t">
                      {!bkg.review?.rating ? (
                        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                          <div>
                            <p className="text-xs font-bold text-navy">Rate your service experience</p>
                            <p className="text-[10px] text-slate-500">Provide feedback to help partners improve.</p>
                          </div>
                          <div className="flex gap-1.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                onClick={() => handleRateBooking(bkg._id || bkg.id, star)}
                                className="text-2xl text-amber-300 hover:scale-120 transition-transform active:scale-95"
                              >
                                ★
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="p-3.5 bg-blue-50/20 border border-blue-100/50 rounded-2xl text-xs">
                          <div className="flex items-center gap-1 text-navy font-semibold">
                            <span>Your Rating:</span>
                            <span className="font-extrabold text-amber-500 flex items-center">{bkg.review.rating}★</span>
                          </div>
                          {bkg.review.comment && (
                            <p className="text-slate-650 mt-1 italic">"{bkg.review.comment}"</p>
                          )}
                          {bkg.review.reply && (
                            <div className="mt-3 p-3 bg-white border border-blue-50 rounded-xl text-[10px] space-y-0.5">
                              <p className="font-bold text-blue-700">Reply from Business Partner:</p>
                              <p className="text-slate-600">"{bkg.review.reply}"</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );

  // ── MAIN RENDER ──────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Tabs */}
      <div className="border-b bg-white sticky top-[64px] z-10 shadow-sm">
        <div className="container mx-auto px-4 flex gap-1 overflow-x-auto scrollbar-none">
          {[
            { key: "home", label: "Book Service" },
            { key: "my-services", label: `My Bookings${myBookings.length ? ` (${myBookings.length})` : ""}` },
            { key: "quotes", label: "Request a Quote" },
            { key: "amc", label: "AMC Plans" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-4 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${activeTab === tab.key
                  ? "border-navy text-navy"
                  : "border-transparent text-muted-foreground hover:text-navy hover:border-gray-300"
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {activeTab === "home" && renderHome()}
        {activeTab === "my-services" && renderMyServices()}
        {activeTab === "quotes" && (
          <div className="max-w-2xl mx-auto py-12 text-center">
            <FileText className="w-16 h-16 text-navy/20 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-navy mb-3">Request a Custom Quote</h2>
            <p className="text-muted-foreground mb-6">
              Need painting, construction, or interior design? Describe your requirements and get competitive quotes from verified professionals.
            </p>
            <Button className="bg-navy hover:bg-navy/90 text-white px-8 py-6 text-lg">
              Start Quote Request
            </Button>
          </div>
        )}
        {activeTab === "amc" && (
          <div className="max-w-4xl mx-auto py-12">
            <div className="text-center mb-10">
              <ShieldCheck className="w-14 h-14 text-navy/30 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-navy mb-3">Annual Maintenance Contracts</h2>
              <p className="text-muted-foreground">Protect your appliances with unlimited repair visits and free regular servicing.</p>
            </div>
            <div className="grid sm:grid-cols-3 gap-6">
              {[
                { title: "AC AMC", icon: <Snowflake className="w-6 h-6" />, price: "₹1,499/yr", color: "from-cyan-400 to-blue-600", features: ["2 Free AC services", "Unlimited repairs", "Free gas charging", "Priority scheduling"] },
                { title: "RO AMC", icon: <Wrench className="w-6 h-6" />, price: "₹999/yr", color: "from-emerald-400 to-teal-600", features: ["3 Filter changes", "Unlimited repairs", "Free spare parts", "Water quality check"] },
                { title: "Computer AMC", icon: <Monitor className="w-6 h-6" />, price: "₹2,499/yr", color: "from-purple-400 to-indigo-600", features: ["Monthly checkup", "Antivirus install", "Hardware support", "Data backup guidance"] },
              ].map((plan, i) => (
                <Card key={i} className="border-2 hover:border-blue-400 transition-all hover:shadow-lg overflow-hidden">
                  <div className={`bg-gradient-to-r ${plan.color} p-5 text-white flex items-center gap-3`}>
                    {plan.icon}
                    <div>
                      <h3 className="font-bold text-lg">{plan.title}</h3>
                      <p className="text-2xl font-extrabold">{plan.price}</p>
                    </div>
                  </div>
                  <CardContent className="p-5">
                    <ul className="space-y-2.5 mb-6">
                      {plan.features.map((f, j) => (
                        <li key={j} className="flex items-center gap-2.5 text-sm text-gray-700">
                          <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" /> {f}
                        </li>
                      ))}
                    </ul>
                    <Button className="w-full bg-navy hover:bg-navy/90 text-white">Subscribe Now</Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Booking Modal */}
      <Dialog open={!!bookingProvider} onOpenChange={(o) => !o && setBookingProvider(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {bookingSuccess ? "Booking Confirmed! 🎉" : `Book Service — Step ${bookingStep}/2`}
            </DialogTitle>
          </DialogHeader>

          {bookingProvider && !bookingSuccess && (
            <div className="space-y-5 pt-2">
              {/* Provider Summary */}
              <div className="flex gap-3 p-3 bg-gray-50 rounded-xl border">
                <img
                  src={bookingProvider.profilePhoto || PLACEHOLDER_IMAGES[0]}
                  alt={bookingProvider.businessName}
                  className="w-12 h-12 rounded-lg object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGES[0]; }}
                />
                <div>
                  <h4 className="font-bold text-sm text-navy">{bookingProvider.businessName}</h4>
                  <p className="text-xs text-muted-foreground">{bookingProvider.ownerName} · {bookingProvider.district || bookingProvider.mandal}</p>
                  {bookingProvider.availability?.emergencyActive && (
                    <span className="text-[10px] text-red-600 font-medium flex items-center gap-1 mt-0.5">
                      <AlertTriangle className="w-3 h-3" /> Emergency available
                    </span>
                  )}
                </div>
              </div>

              {/* Step 1: Service & Time */}
              {bookingStep === 1 && (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Select Service</label>
                    {bookingProvider.services?.filter((s) => s.active).length > 0 ? (
                      <div className="grid gap-2 max-h-48 overflow-y-auto pr-1">
                        {bookingProvider.services.filter((s) => s.active).map((s) => (
                          <button
                            key={s.id || s.name}
                            onClick={() => setSelectedService(s)}
                            className={`w-full text-left px-3 py-2.5 rounded-lg border text-sm transition-colors ${selectedService?.name === s.name
                                ? "border-blue-500 bg-blue-50 text-blue-700"
                                : "border-gray-200 hover:border-gray-300"
                              }`}
                          >
                            <div className="flex justify-between items-center">
                              <span className="font-medium">{s.name}</span>
                              <span className="text-xs font-bold text-navy">
                                {s.discountPrice && Number(s.discountPrice) > 0 && Number(s.discountPrice) < s.price ? (
                                  <>
                                    <span className="text-emerald-600 mr-1.5">{formatCurrency(s.discountPrice)}</span>
                                    <span className="line-through text-[10px] text-gray-400 font-medium">{formatCurrency(s.price)}</span>
                                  </>
                                ) : (
                                  formatCurrency(s.price)
                                )}
                              </span>
                            </div>
                            {s.duration && <p className="text-[10px] text-muted-foreground mt-0.5"><Clock className="w-3 h-3 inline mr-1" />{s.duration}</p>}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="grid gap-2">
                        {bookingProvider.serviceCategory.map((cat) => (
                          <button
                            key={cat}
                            onClick={() => setSelectedService({ name: cat, category: cat, type: "general", price: 0, duration: "", active: true })}
                            className={`w-full text-left px-3 py-2.5 rounded-lg border text-sm transition-colors ${selectedService?.name === cat
                                ? "border-blue-500 bg-blue-50 text-blue-700"
                                : "border-gray-200 hover:border-gray-300"
                              }`}
                          >
                            <span className="font-medium">{cat}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Preferred Date</label>
                    <div className="grid grid-cols-3 gap-2">
                      {["Today", "Tomorrow", "This Week"].map((d) => (
                        <button
                          key={d}
                          onClick={() => setSelectedDate(d)}
                          className={`py-2 px-3 text-sm rounded-lg border transition-colors ${selectedDate === d ? "bg-navy text-white border-navy" : "bg-white text-gray-700 hover:border-gray-400"
                            }`}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Time Slot</label>
                    {loadingSlots ? (
                      <div className="text-xs text-muted-foreground py-2">Loading slots...</div>
                    ) : availableSlots.length === 0 ? (
                      <div className="text-xs text-red-500 py-2">No slots available on this date.</div>
                    ) : (
                      <div className="grid grid-cols-3 gap-2 animate-fadeIn">
                        {availableSlots.map((t) => (
                          <button
                            key={t}
                            onClick={() => setSelectedTime(t)}
                            className={`py-2 px-1 text-xs font-medium rounded-lg border transition-colors ${selectedTime === t
                                ? "bg-blue-50 border-blue-400 text-blue-700 font-bold"
                                : "bg-white text-gray-600 hover:border-gray-400"
                              }`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <Button
                    className="w-full bg-navy hover:bg-navy/90 text-white"
                    disabled={!selectedTime || !selectedService}
                    onClick={() => setBookingStep(2)}
                  >
                    Next: Add Address <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              )}

              {/* Step 2: Address & Confirm */}
              {bookingStep === 2 && (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Service Address</label>
                    <textarea
                      placeholder="Enter full address with landmark..."
                      className="w-full border rounded-lg p-3 text-sm focus:ring-2 focus:ring-navy/30 focus:outline-none min-h-[90px] resize-none"
                      value={bookingAddress}
                      onChange={(e) => setBookingAddress(e.target.value)}
                    />
                  </div>

                  <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg flex gap-3 text-sm text-blue-800">
                    <ShieldCheck className="w-5 h-5 flex-shrink-0 text-blue-600 mt-0.5" />
                    <p>ApexBee Guarantee: Secure payments, verified professionals, and 30-day service warranty.</p>
                  </div>

                  {/* Booking summary */}
                  <div className="space-y-2 text-sm border rounded-lg p-3 bg-gray-50">
                    <div className="flex justify-between"><span className="text-muted-foreground">Service</span><span className="font-medium">{selectedService?.name}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Date & Time</span><span className="font-medium">{selectedDate}, {selectedTime}</span></div>
                    {selectedService?.price ? (
                      <div className="flex justify-between border-t pt-2 mt-2">
                        <span className="font-semibold">Estimated</span>
                        <span className="font-bold text-navy">
                          {selectedService.discountPrice && Number(selectedService.discountPrice) > 0 && Number(selectedService.discountPrice) < selectedService.price
                            ? formatCurrency(selectedService.discountPrice)
                            : formatCurrency(selectedService.price)}
                        </span>
                      </div>
                    ) : null}
                  </div>

                  <div className="flex gap-3">
                    <Button variant="outline" className="flex-1" onClick={() => setBookingStep(1)}>Back</Button>
                    <Button
                      className="flex-[2] bg-navy hover:bg-navy/90 text-white"
                      disabled={!bookingAddress.trim() || isBooking}
                      onClick={handleBook}
                    >
                      {isBooking ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                      Confirm Booking
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Success State */}
          {bookingSuccess && (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-9 h-9 text-green-500" />
              </div>
              <div>
                <p className="font-bold text-lg text-navy">Booking Confirmed!</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {bookingProvider?.businessName} will contact you shortly.
                </p>
              </div>
              <p className="text-xs text-muted-foreground">Redirecting to your bookings…</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Checkout Pay Booking Dialog */}
      <Dialog open={!!payingBooking} onOpenChange={(open) => { if (!open) setPayingBooking(null); }}>
        <DialogContent className="max-w-md rounded-2xl bg-white p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-navy">💳 Secure Checkout</DialogTitle>
          </DialogHeader>

          {payingBooking && (
            <div className="space-y-5 mt-4">
              {/* Summary */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Booking ID</span>
                  <span className="font-bold text-navy">{payingBooking.id}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Provider</span>
                  <span className="font-semibold text-slate-700">{payingBooking.provider}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Service Requested</span>
                  <span className="font-semibold text-slate-700">{payingBooking.service}</span>
                </div>
                <div className="flex justify-between text-sm font-bold border-t pt-2 mt-2 text-slate-800">
                  <span>Total Payable</span>
                  <span className="text-navy">{formatCurrency(payingBooking.servicePrice || 0)}</span>
                </div>
              </div>

              {/* Payment Methods */}
              {!paymentSuccess ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-2">Select Payment Method</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("wallet")}
                        className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${paymentMethod === "wallet" ? "border-navy bg-navy/5 text-navy font-bold shadow-sm" : "border-slate-200 bg-white text-slate-600 hover:border-slate-350"}`}
                      >
                        <span className="text-xl mb-1">💼</span>
                        <span className="text-xs">Apex Wallet</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentMethod("upi")}
                        className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${paymentMethod === "upi" ? "border-navy bg-navy/5 text-navy font-bold shadow-sm" : "border-slate-200 bg-white text-slate-600 hover:border-slate-350"}`}
                      >
                        <span className="text-xl mb-1">📱</span>
                        <span className="text-xs">Mock UPI Pay</span>
                      </button>
                    </div>
                  </div>

                  <Button
                    onClick={handlePayBooking}
                    disabled={processingPayment}
                    className="w-full bg-navy hover:bg-navy/90 text-white font-extrabold py-3.5 rounded-xl shadow-md flex items-center justify-center gap-2"
                  >
                    {processingPayment ? <Loader2 className="w-4 h-4 animate-spin" /> : "Complete Payment"}
                  </Button>
                </div>
              ) : (
                <div className="text-center py-6 space-y-3">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle className="w-7 h-7 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-navy text-base">Payment Successful!</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Your service booking payment is confirmed.</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default Services;
