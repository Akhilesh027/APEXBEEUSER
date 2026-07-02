// src/pages/Travel.tsx — Module 12: Travel & Tourism Marketplace
import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Plane,
  Building,
  Map as MapIcon,
  Tent,
  Bus,
  Car,
  Calendar,
  MapPin,
  Users,
  Search,
  Star,
  Clock,
  Briefcase,
  ChevronRight,
  Sun,
  Camera,
  Coffee,
  CheckCircle,
  FileText
} from "lucide-react";

const TRAVEL_CATEGORIES = [
  { id: "flights", name: "Flights", icon: <Plane className="w-5 h-5" /> },
  { id: "hotels", name: "Hotels", icon: <Building className="w-5 h-5" /> },
  { id: "packages", name: "Holiday Packages", icon: <Tent className="w-5 h-5" /> },
  { id: "pilgrimage", name: "Pilgrimage Tours", icon: <MapIcon className="w-5 h-5" /> },
  { id: "bus", name: "Bus Booking", icon: <Bus className="w-5 h-5" /> },
  { id: "cabs", name: "Cabs", icon: <Car className="w-5 h-5" /> },
];

const POPULAR_PACKAGES = [
  { id: "pkg1", title: "Majestic Kerala (Munnar + Alleppey)", duration: "4 Nights / 5 Days", price: 15999, rating: 4.8, reviews: 124, image: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?q=80&w=800", tags: ["Houseboat", "Hills", "Nature"], inclusions: ["Hotels", "Meals", "Transfers", "Sightseeing"] },
  { id: "pkg2", title: "Spiritual Kashi Vishwanath Tour", duration: "2 Nights / 3 Days", price: 8500, rating: 4.9, reviews: 85, image: "https://images.unsplash.com/photo-1561361513-2d000a50f0dc?q=80&w=800", tags: ["Pilgrimage", "Temples"], inclusions: ["Hotels", "Breakfast", "Temple Visit VIP", "Transfers"] },
  { id: "pkg3", title: "Goa Weekend Getaway", duration: "3 Nights / 4 Days", price: 12499, rating: 4.6, reviews: 210, image: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?q=80&w=800", tags: ["Beaches", "Nightlife"], inclusions: ["Resort", "Breakfast", "Airport Pickup"] },
  { id: "pkg4", title: "Golden Triangle (Delhi-Agra-Jaipur)", duration: "5 Nights / 6 Days", price: 18999, rating: 4.7, reviews: 340, image: "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?q=80&w=800", tags: ["Heritage", "Monuments"], inclusions: ["Hotels", "All Meals", "AC Transport", "Guide"] },
];

const formatCurrency = (v: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 0 }).format(v);

const Travel = () => {
  const [activeTab, setActiveTab] = useState("flights");
  const [navTab, setNavTab] = useState("explore"); // explore, trips, wishlist

  const renderSearchBox = () => (
    <Card className="max-w-4xl mx-auto -mt-10 relative z-10 shadow-xl border-t-4 border-t-navy">
      <div className="flex border-b overflow-x-auto scrollbar-none">
        {TRAVEL_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveTab(cat.id)}
            className={`flex-1 min-w-[100px] flex flex-col items-center gap-2 py-4 px-2 transition-colors ${activeTab === cat.id ? "bg-blue-50 text-blue-700 border-b-2 border-blue-600 font-semibold" : "text-gray-500 hover:bg-gray-50"}`}
          >
            {cat.icon}
            <span className="text-xs uppercase tracking-wider">{cat.name}</span>
          </button>
        ))}
      </div>
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 border rounded-lg p-3 relative">
            <label className="text-[10px] uppercase font-bold text-gray-500 absolute top-2 left-3">From</label>
            <input type="text" placeholder="Delhi (DEL)" className="w-full mt-3 font-semibold text-navy text-lg focus:outline-none bg-transparent" />
          </div>
          <div className="flex-1 border rounded-lg p-3 relative">
            <label className="text-[10px] uppercase font-bold text-gray-500 absolute top-2 left-3">To</label>
            <input type="text" placeholder="Mumbai (BOM)" className="w-full mt-3 font-semibold text-navy text-lg focus:outline-none bg-transparent" />
          </div>
          <div className="flex-1 border rounded-lg p-3 relative">
            <label className="text-[10px] uppercase font-bold text-gray-500 absolute top-2 left-3">Date</label>
            <input type="date" className="w-full mt-3 font-semibold text-navy focus:outline-none bg-transparent" />
          </div>
          <Button className="h-auto px-8 bg-orange-500 hover:bg-orange-600 text-white font-bold text-lg"><Search className="w-5 h-5 mr-2" /> Search</Button>
        </div>
        <div className="mt-4 flex gap-4 text-xs text-muted-foreground">
          <label className="flex items-center gap-1 cursor-pointer"><input type="radio" name="trip" defaultChecked className="accent-navy" /> One Way</label>
          <label className="flex items-center gap-1 cursor-pointer"><input type="radio" name="trip" className="accent-navy" /> Round Trip</label>
          <div className="ml-auto flex items-center gap-1 text-green-600 font-medium">
            <CheckCircle className="w-3.5 h-3.5" /> Lowest Fare Guarantee on ApexBee
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderExplore = () => (
    <div className="space-y-12">
      {/* Hero */}
      <div className="bg-gradient-to-r from-navy to-cyan-800 text-white pt-12 pb-24 px-4 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">Discover Your Next Adventure</h1>
        <p className="text-lg opacity-90 max-w-2xl mx-auto">Book flights, hotels, and holiday packages with exclusive ApexBee rewards and cashback.</p>
      </div>

      {/* Search Box */}
      <div className="px-4">
        {renderSearchBox()}
      </div>

      <div className="container mx-auto px-4 max-w-6xl space-y-12 pb-12">
        {/* Banner */}
        <div className="rounded-xl overflow-hidden relative h-48 bg-gray-900 flex items-center">
          <img src="https://images.unsplash.com/photo-1506012787146-f92b2d7d6d96?q=80&w=1200" alt="Travel Banner" className="absolute inset-0 w-full h-full object-cover opacity-50" />
          <div className="relative z-10 p-8 text-white">
            <Badge className="bg-orange-500 text-white border-0 mb-2">Summer Sale</Badge>
            <h2 className="text-3xl font-bold mb-2">Up to 20% Off on Holiday Packages</h2>
            <p className="opacity-90 mb-4">Use code <strong>APXTRAVEL</strong> at checkout.</p>
          </div>
        </div>

        {/* Featured Packages */}
        <div>
          <h2 className="text-2xl font-bold text-navy mb-6">Trending Holiday Packages</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {POPULAR_PACKAGES.map((pkg) => (
              <Card key={pkg.id} className="overflow-hidden hover:shadow-xl transition-shadow border-0 shadow-md group cursor-pointer">
                <div className="h-48 relative overflow-hidden">
                  <img src={pkg.image} alt={pkg.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  <div className="absolute top-3 right-3 bg-white/90 text-navy font-bold px-2 py-1 rounded text-xs flex items-center gap-1 shadow-sm">
                    <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" /> {pkg.rating}
                  </div>
                  <div className="absolute bottom-3 left-3 flex gap-1">
                    {pkg.tags.map(t => <Badge key={t} className="bg-black/60 hover:bg-black/70 text-white border-0 text-[10px]">{t}</Badge>)}
                  </div>
                </div>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground font-medium mb-1 flex items-center gap-1"><Clock className="w-3 h-3" /> {pkg.duration}</p>
                  <h3 className="font-bold text-navy text-lg leading-tight mb-3 h-11">{pkg.title}</h3>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {pkg.inclusions.slice(0, 3).map((inc, i) => (
                      <span key={i} className="text-[10px] bg-blue-50 text-blue-700 px-2 py-1 rounded-md border border-blue-100 flex items-center gap-1">
                        {inc === "Hotels" ? <Building className="w-3 h-3" /> : inc === "Meals" ? <Coffee className="w-3 h-3" /> : <Camera className="w-3 h-3" />} {inc}
                      </span>
                    ))}
                  </div>
                  <div className="flex justify-between items-end pt-3 border-t">
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Starts From</p>
                      <p className="font-bold text-xl text-orange-600">{formatCurrency(pkg.price)}</p>
                    </div>
                    <Button size="sm" className="bg-navy hover:bg-navy/90 text-white rounded-full">Explore</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Categories Grid */}
        <div>
          <h2 className="text-2xl font-bold text-navy mb-6">Explore by Destination Type</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: "Beaches", img: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=400" },
              { name: "Mountains", img: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=400" },
              { name: "Heritage", img: "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?q=80&w=400" },
              { name: "Pilgrimage", img: "https://images.unsplash.com/photo-1561361513-2d000a50f0dc?q=80&w=400" },
            ].map((cat, i) => (
              <div key={i} className="relative h-40 rounded-xl overflow-hidden cursor-pointer group">
                <img src={cat.img} alt={cat.name} className="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <div className="absolute bottom-4 left-4 text-white font-bold text-lg">{cat.name}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderMyTrips = () => (
    <div className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
      <h2 className="text-2xl font-bold text-navy">My Trips</h2>
      <div className="text-center py-16 bg-gray-50 rounded-xl border border-dashed border-gray-200">
        <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-3" />
        <p className="text-muted-foreground mb-4">You have no upcoming trips.</p>
        <Button className="bg-navy hover:bg-navy/90 text-white" onClick={() => setNavTab("explore")}>Plan a Trip</Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Internal Nav */}
      <div className="border-b bg-white sticky top-[64px] z-20">
        <div className="container mx-auto px-4 flex gap-6">
          <button onClick={() => setNavTab("explore")} className={`py-4 text-sm font-semibold border-b-2 transition-colors ${navTab === "explore" ? "border-navy text-navy" : "border-transparent text-muted-foreground hover:text-navy"}`}>Explore</button>
          <button onClick={() => setNavTab("trips")} className={`py-4 text-sm font-semibold border-b-2 transition-colors ${navTab === "trips" ? "border-navy text-navy" : "border-transparent text-muted-foreground hover:text-navy"}`}>My Trips</button>
          <button onClick={() => setNavTab("wishlist")} className={`py-4 text-sm font-semibold border-b-2 transition-colors ${navTab === "wishlist" ? "border-navy text-navy" : "border-transparent text-muted-foreground hover:text-navy"}`}>Travel Wishlist</button>
        </div>
      </div>

      {navTab === "explore" && renderExplore()}
      {navTab === "trips" && renderMyTrips()}
      {navTab === "wishlist" && <div className="container mx-auto px-4 py-16 text-center text-muted-foreground">Wishlist is empty.</div>}

      <Footer />
    </div>
  );
};

export default Travel;
