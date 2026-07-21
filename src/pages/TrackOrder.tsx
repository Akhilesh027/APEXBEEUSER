import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  MapPin,
  ChevronLeft,
  Phone,
  MessageSquare,
  Clock,
  ShieldCheck,
  CheckCircle,
  Truck,
  Building,
  Star
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";

const API_BASE = import.meta.env.VITE_API_URL || "https://server.apexbee.in/api";

const TrackOrder = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [etaMins, setEtaMins] = useState(14);
  const [etaSecs, setEtaSecs] = useState(0);
  const [activeStep, setActiveStep] = useState(2); // Out for delivery
  const [bikePosition, setBikePosition] = useState({ x: 20, y: 75 });
  const [tracking, setTracking] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Fetch telemetry from DB
  useEffect(() => {
    const fetchTracking = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/order-tracking/${orderId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`
          }
        });
        const data = await res.json();
        if (data.success && data.data) {
          const t = data.data;
          setTracking(t);
          setEtaMins(t.etaMinutes);

          // Map status index
          let step = 0;
          if (t.status === "preparing") step = 1;
          else if (t.status === "out_for_delivery") step = 2;
          else if (t.status === "delivered") step = 3;
          setActiveStep(step);

          // Calculate visual SVG bike coords
          const progress = t.progressPercentage || 0;
          const bikeX = 20 + (60 * (progress / 100));
          const bikeY = 75 - (40 * (progress / 100));
          setBikePosition({ x: bikeX, y: bikeY });
        }
      } catch (error) {
        console.error("Failed to load order tracking details:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTracking();
  }, [orderId]);

  // Ticking countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      if (etaSecs > 0) {
        setEtaSecs((s) => s - 1);
      } else if (etaMins > 0) {
        setEtaMins((m) => m - 1);
        setEtaSecs(59);
      } else {
        clearInterval(timer);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [etaMins, etaSecs]);

  const steps = [
    { label: "Order Confirmed", desc: "Merchant accepted your order", time: "03:15 PM" },
    { label: "Food / Grocery Prepared", desc: "Packed & sealed for hygiene", time: "03:22 PM" },
    { label: "Out for Delivery", desc: tracking?.deliveryPartnerName ? `Partner ${tracking.deliveryPartnerName} has left the store` : "Waiting for delivery partner assignment", time: "03:26 PM" },
    { label: "Delivered & Verified", desc: "OTP verification complete", time: "Pending" }
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Back Button */}
        <button
          onClick={() => navigate("/my-orders")}
          className="flex items-center text-xs font-bold text-navy hover:underline mb-6 bg-transparent border-none cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4 mr-1" /> Back to My Orders
        </button>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Left Column: Live tracking details */}
          <div className="md:col-span-2 space-y-6">
            {/* Status Summary */}
            <div className="bg-white border rounded-3xl p-6 shadow-premium text-left">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <span className="text-[10px] font-bold text-accent uppercase tracking-wider">Live Delivery Status</span>
                  <h1 className="text-xl font-black text-navy mt-1">Order Tracking: #{orderId || "AB-90412"}</h1>
                  <p className="text-xs text-muted-foreground mt-1">Fulfilling from: <strong className="text-slate-700">Nellore Supermarket</strong></p>
                </div>
                <div className="bg-gradient-to-r from-navy to-blue-700 text-white rounded-2xl p-4 text-center shrink-0 min-w-[120px] shadow-sm">
                  <p className="text-[9px] font-bold opacity-80 uppercase">Estimated Arrival</p>
                  <p className="text-2xl font-black mt-1">
                    {etaMins}:{String(etaSecs).padStart(2, "0")}
                  </p>
                  <p className="text-[9px] opacity-80 mt-0.5">minutes remaining</p>
                </div>
              </div>

              {/* Security OTP Alert */}
              <div className="mt-6 bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0" />
                  <div className="text-left">
                    <p className="text-xs font-extrabold text-navy">Secure Delivery Verification</p>
                    <p className="text-[10px] text-slate-500 leading-normal">Provide this secure OTP to {tracking?.deliveryPartnerName || "Ramesh"} only after checking the package seals.</p>
                  </div>
                </div>
                <div className="bg-white border border-blue-200 rounded-xl px-4 py-2 text-center shrink-0">
                  <span className="text-[9px] font-bold text-slate-400 block uppercase leading-none">OTP Code</span>
                  <span className="text-lg font-black text-blue-600 tracking-wider">{tracking?.otp || "5829"}</span>
                </div>
              </div>
            </div>

            {/* Live Map Visual Simulator */}
            <div className="bg-white border rounded-3xl p-6 shadow-premium text-left space-y-4">
              <h3 className="font-extrabold text-navy text-sm flex items-center gap-2">
                <span>📍</span> Real-time Route Simulation
              </h3>

              <div className="w-full h-64 bg-slate-100 rounded-2xl border relative overflow-hidden">
                {/* SVG Animated Path Map representation */}
                <svg className="w-full h-full absolute inset-0 pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                  {/* Grid Lines */}
                  <line x1="0" y1="20" x2="100" y2="20" stroke="#cbd5e1" strokeWidth="0.1" />
                  <line x1="0" y1="40" x2="100" y2="40" stroke="#cbd5e1" strokeWidth="0.1" />
                  <line x1="0" y1="60" x2="100" y2="60" stroke="#cbd5e1" strokeWidth="0.1" />
                  <line x1="0" y1="80" x2="100" y2="80" stroke="#cbd5e1" strokeWidth="0.1" />

                  {/* Roads / Routes */}
                  <path d="M 20 75 L 50 75 L 50 35 L 80 35" fill="none" stroke="#e2e8f0" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M 20 75 L 50 75 L 50 35 L 80 35" fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeDasharray="3,3" strokeLinecap="round" strokeLinejoin="round" />

                  {/* Locations Markers */}
                  <circle cx="20" cy="75" r="3.5" fill="#f59e0b" />
                  <circle cx="80" cy="35" r="3.5" fill="#10b981" />
                </svg>

                {/* Animated Pulsing Dot for user location */}
                <div className="absolute w-6 h-6 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/20 border border-emerald-500 flex items-center justify-center" style={{ left: "80%", top: "35%" }}>
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                </div>

                {/* Store location tag */}
                <div className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center gap-1 bg-white border px-2 py-1 rounded-lg shadow-sm text-[9px] font-bold text-navy" style={{ left: "20%", top: "67%" }}>
                  <Building className="w-3 h-3 text-amber-500" /> Nellore Store
                </div>

                {/* Home/User tag */}
                <div className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center gap-1 bg-white border px-2 py-1 rounded-lg shadow-sm text-[9px] font-bold text-navy animate-pulse" style={{ left: "80%", top: "27%" }}>
                  <MapPin className="w-3 h-3 text-green-500" /> Your House
                </div>

                {/* Delivery Boy Animated Pin */}
                <div
                  className="absolute w-8 h-8 -translate-x-1/2 -translate-y-1/2 bg-navy text-white rounded-full flex items-center justify-center shadow-lg transition-all duration-300"
                  style={{ left: `${bikePosition.x}%`, top: `${bikePosition.y}%` }}
                >
                  <Truck className="w-4 h-4 text-accent" />
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground text-center">
                Visualizing route from <strong>Nellore Supermarket</strong> to your delivery address.
              </p>
            </div>

            {/* Stepper Timeline */}
            <div className="bg-white border rounded-3xl p-6 shadow-premium text-left">
              <h3 className="font-extrabold text-navy text-sm mb-6">Delivery Timeline</h3>
              <div className="relative border-l-2 border-slate-100 ml-3 space-y-6">
                {steps.map((step, idx) => {
                  const isCompleted = idx <= activeStep;
                  const isCurrent = idx === activeStep;
                  return (
                    <div key={idx} className="relative pl-6">
                      <div className={`absolute -left-1.5 top-1.5 w-3.5 h-3.5 rounded-full border-2 bg-white flex items-center justify-center ${isCompleted ? "border-green-500 bg-green-500" : "border-slate-300"
                        } ${isCurrent ? "animate-map-pulse ring-4 ring-green-100" : ""}`}>
                        {isCompleted && <CheckCircle className="w-2.5 h-2.5 text-white" />}
                      </div>
                      <div>
                        <h4 className={`font-bold text-xs ${isCompleted ? "text-navy" : "text-slate-400"}`}>
                          {step.label}
                        </h4>
                        <p className="text-[10px] text-slate-500 mt-0.5">{step.desc}</p>
                        <span className="block text-[9px] text-slate-400 mt-1 font-bold">{step.time}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Delivery Agent Card */}
          <div className="space-y-6">
            {/* Agent Details Card */}
            <div className="bg-white border rounded-3xl p-5 shadow-premium text-center space-y-4">
              <span className="text-[9px] font-bold text-slate-400 uppercase block tracking-wider">Your Delivery Partner</span>

              <div className="w-24 h-24 rounded-full overflow-hidden mx-auto border-4 border-slate-50 shadow-inner">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200"
                  alt="Delivery Partner Profile"
                  className="w-full h-full object-cover"
                />
              </div>

              <div>
                <h3 className="font-extrabold text-navy text-sm">{tracking?.deliveryPartnerName || "Not assigned yet"}</h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">{tracking?.deliveryPartnerVehicle || "Vehicle info unavailable"}</p>
                <div className="flex items-center justify-center gap-1 mt-1.5">
                  <span className="text-yellow-400 text-xs">★</span>
                  <span className="text-[10px] font-bold text-navy">{tracking?.deliveryPartnerRating || "N/A"}</span>
                  <span className="text-[10px] text-muted-foreground">(2,450 deliveries)</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 border-t pt-4">
                <a
                  href={`tel:${tracking?.deliveryPartnerPhone || ""}`}
                  className="bg-slate-100 hover:bg-slate-200 text-navy font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-colors border-none"
                >
                  <Phone className="w-3.5 h-3.5" /> Call Partner
                </a>
                <button
                  onClick={() => alert("Opening support portal chat context...")}
                  className="bg-navy hover:bg-navy/95 text-white font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer border-none"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-accent" /> Live Chat
                </button>
              </div>
            </div>

            {/* Merchant Details Card */}
            <div className="bg-white border rounded-3xl p-5 shadow-premium text-left space-y-3">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Seller Details</span>
              <div>
                <h4 className="font-extrabold text-navy text-xs">Nellore Supermarket</h4>
                <p className="text-[10px] text-muted-foreground mt-0.5">JP Nagar 5th Phase, Bangalore</p>
                <p className="text-[10px] text-green-700 font-bold mt-1.5 flex items-center gap-1">
                  ✓ FSSAI Certified License #12849204902128
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};
export default TrackOrder;
