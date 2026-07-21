import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Settings,
  Plus,
  Trash2,
  Edit,
  Truck,
  MapPin,
  Clock,
  ShieldCheck,
  CheckCircle,
  Eye,
  AlertCircle
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5500/api";

const AdminPersonalization = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("banners");

  // Banners State
  const [banners, setBanners] = useState<any[]>([]);
  const [bannersLoading, setBannersLoading] = useState(true);
  const [bannerForm, setBannerForm] = useState({
    title: "",
    description: "",
    type: "promo",
    discount: "",
    link: "",
    imageUrl: "",
    countdownHours: 0,
    isActive: true
  });
  const [editingBannerId, setEditingBannerId] = useState<string | null>(null);

  // Tracking State
  const [trackings, setTrackings] = useState<any[]>([]);
  const [trackingsLoading, setTrackingsLoading] = useState(true);
  const [editingTrackingId, setEditingTrackingId] = useState<string | null>(null);
  const [trackingForm, setTrackingForm] = useState({
    etaMinutes: 15,
    status: "preparing",
    otp: "",
    deliveryPartnerName: "",
    deliveryPartnerPhone: "",
    deliveryPartnerVehicle: "",
    deliveryPartnerRating: 0,
    progressPercentage: 0
  });

  // Fetch Banners
  const fetchBanners = async () => {
    try {
      setBannersLoading(true);
      const res = await fetch(`${API_BASE}/banners/admin`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setBanners(data.data);
      }
    } catch (error) {
      console.error("Fetch banners failed:", error);
    } finally {
      setBannersLoading(false);
    }
  };

  // Fetch Order Trackings
  const fetchTrackings = async () => {
    try {
      setTrackingsLoading(true);
      const res = await fetch(`${API_BASE}/order-tracking/admin/all`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setTrackings(data.data);
      }
    } catch (error) {
      console.error("Fetch trackings failed:", error);
    } finally {
      setTrackingsLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
    fetchTrackings();
  }, []);

  // Save Banner (Create or Update)
  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingBannerId
        ? `${API_BASE}/banners/admin/${editingBannerId}`
        : `${API_BASE}/banners/admin`;

      const method = editingBannerId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify(bannerForm)
      });
      const data = await res.json();
      if (data.success) {
        toast({
          title: editingBannerId ? "Banner Updated" : "Banner Created",
          description: "All banner changes have been saved successfully."
        });
        setBannerForm({
          title: "",
          description: "",
          type: "promo",
          discount: "",
          link: "",
          imageUrl: "",
          countdownHours: 0,
          isActive: true
        });
        setEditingBannerId(null);
        fetchBanners();
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error Saving Banner",
        description: "Failed to connect to the backend server."
      });
    }
  };

  // Edit Banner Trigger
  const handleEditBanner = (banner: any) => {
    setEditingBannerId(banner._id);
    setBannerForm({
      title: banner.title,
      description: banner.description,
      type: banner.type,
      discount: banner.discount || "",
      link: banner.link || "",
      imageUrl: banner.imageUrl || "",
      countdownHours: banner.countdownHours || 0,
      isActive: banner.isActive
    });
  };

  // Delete Banner
  const handleDeleteBanner = async (id: string) => {
    if (!confirm("Are you sure you want to delete this banner?")) return;
    try {
      const res = await fetch(`${API_BASE}/banners/admin/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Banner Deleted", description: "Banner has been removed from catalog." });
        fetchBanners();
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Deletion Failed" });
    }
  };

  // Edit Tracking Trigger
  const handleEditTracking = (tracking: any) => {
    setEditingTrackingId(tracking.orderId);
    setTrackingForm({
      etaMinutes: tracking.etaMinutes,
      status: tracking.status,
      otp: tracking.otp,
      deliveryPartnerName: tracking.deliveryPartnerName,
      deliveryPartnerPhone: tracking.deliveryPartnerPhone,
      deliveryPartnerVehicle: tracking.deliveryPartnerVehicle,
      deliveryPartnerRating: tracking.deliveryPartnerRating,
      progressPercentage: tracking.progressPercentage
    });
  };

  // Save Tracking updates
  const handleSaveTracking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTrackingId) return;
    try {
      const res = await fetch(`${API_BASE}/order-tracking/admin/${editingTrackingId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify(trackingForm)
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Tracking Updated", description: "Live coordinates and ETA modified successfully." });
        setEditingTrackingId(null);
        fetchTrackings();
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Update Failed" });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 text-left">
          <div>
            <span className="text-xs font-bold text-accent uppercase tracking-wider">Admin Workspace</span>
            <h1 className="text-2xl font-black text-navy mt-1 flex items-center gap-2">
              <Settings className="w-6 h-6 text-accent" /> Page Personalization Dashboard
            </h1>
            <p className="text-xs text-slate-500 mt-1">Configure greetings, custom banners, and live tracking stats for user screens.</p>
          </div>
          <div className="flex bg-white rounded-2xl border p-1 shadow-sm shrink-0">
            <button
              onClick={() => setActiveTab("banners")}
              className={`px-4 py-2 text-xs font-extrabold rounded-xl border-none cursor-pointer transition ${activeTab === "banners" ? "bg-navy text-white" : "bg-transparent text-slate-600 hover:bg-slate-50"
                }`}
            >
              Manage Banners
            </button>
            <button
              onClick={() => setActiveTab("tracking")}
              className={`px-4 py-2 text-xs font-extrabold rounded-xl border-none cursor-pointer transition ${activeTab === "tracking" ? "bg-navy text-white" : "bg-transparent text-slate-600 hover:bg-slate-50"
                }`}
            >
              Order Tracking
            </button>
          </div>
        </div>

        {/* ==================== BANNERS MANAGEMENT ==================== */}
        {activeTab === "banners" && (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Form Column */}
            <div className="lg:col-span-1">
              <Card className="border border-slate-100 shadow-premium text-left">
                <CardHeader>
                  <CardTitle className="font-extrabold text-navy text-sm">
                    {editingBannerId ? "Edit Banner Details" : "Create New Banner"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSaveBanner} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Banner Title</label>
                      <Input
                        value={bannerForm.title}
                        onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })}
                        placeholder="e.g. Festival Raksha Bandhan Offers"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Description</label>
                      <textarea
                        value={bannerForm.description}
                        onChange={(e) => setBannerForm({ ...bannerForm, description: e.target.value })}
                        className="w-full text-xs border rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-navy min-h-[80px]"
                        placeholder="Banner promo description details..."
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Banner Type</label>
                        <select
                          value={bannerForm.type}
                          onChange={(e) => setBannerForm({ ...bannerForm, type: e.target.value })}
                          className="w-full text-xs border rounded-xl p-2.5 bg-white focus:outline-none focus:ring-1 focus:ring-navy"
                        >
                          <option value="promo">Promo Banner</option>
                          <option value="festival">Festival Highlight</option>
                          <option value="morning">Morning Greeting</option>
                          <option value="afternoon">Afternoon Greeting</option>
                          <option value="evening">Evening Greeting</option>
                          <option value="night">Night Greeting</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Discount Badge</label>
                        <Input
                          value={bannerForm.discount}
                          onChange={(e) => setBannerForm({ ...bannerForm, discount: e.target.value })}
                          placeholder="e.g. 20% OFF"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Countdown Hours</label>
                        <Input
                          type="number"
                          value={bannerForm.countdownHours}
                          onChange={(e) => setBannerForm({ ...bannerForm, countdownHours: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Redirect URL</label>
                        <Input
                          value={bannerForm.link}
                          onChange={(e) => setBannerForm({ ...bannerForm, link: e.target.value })}
                          placeholder="e.g. /grocery"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Image URL</label>
                      <Input
                        value={bannerForm.imageUrl}
                        onChange={(e) => setBannerForm({ ...bannerForm, imageUrl: e.target.value })}
                        placeholder="https://images.unsplash.com/..."
                      />
                    </div>
                    <div className="flex items-center gap-2 pt-2">
                      <input
                        type="checkbox"
                        id="isActive"
                        checked={bannerForm.isActive}
                        onChange={(e) => setBannerForm({ ...bannerForm, isActive: e.target.checked })}
                      />
                      <label htmlFor="isActive" className="text-xs font-bold text-navy select-none">Active on user dashboard</label>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button type="submit" className="flex-1 bg-navy hover:bg-navy/95 rounded-xl font-bold text-xs py-2.5">
                        {editingBannerId ? "Save Updates" : "Create Banner"}
                      </Button>
                      {editingBannerId && (
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => {
                            setEditingBannerId(null);
                            setBannerForm({
                              title: "",
                              description: "",
                              type: "promo",
                              discount: "",
                              link: "",
                              imageUrl: "",
                              countdownHours: 0,
                              isActive: true
                            });
                          }}
                          className="rounded-xl border hover:bg-slate-50 text-xs py-2.5 font-bold"
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* List Column */}
            <div className="lg:col-span-2 space-y-4 text-left">
              <h3 className="font-extrabold text-navy text-sm">Active & Inactive Banners ({banners.length})</h3>
              {bannersLoading ? (
                <div className="p-12 text-center text-xs text-muted-foreground">Loading active catalog...</div>
              ) : banners.length === 0 ? (
                <div className="border border-dashed rounded-3xl p-12 text-center text-xs text-muted-foreground">
                  No personalization banners loaded in MongoDB. Seed defaults or create one.
                </div>
              ) : (
                <div className="grid gap-4">
                  {banners.map((b) => (
                    <Card key={b._id} className={`border border-slate-100 shadow-sm ${!b.isActive && "opacity-60 bg-slate-50"}`}>
                      <CardContent className="p-4 flex gap-4 items-start">
                        {b.imageUrl && (
                          <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                            <img src={b.imageUrl} alt="" className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="font-extrabold text-navy text-xs truncate">{b.title}</h4>
                            <Badge className="bg-blue-50 text-blue-700 font-bold border-none text-[9px] capitalize">{b.type}</Badge>
                            {b.discount && <Badge className="bg-red-50 text-red-700 font-bold border-none text-[9px]">{b.discount}</Badge>}
                            {b.isActive ? (
                              <Badge className="bg-green-50 text-green-700 border-none text-[9px]">Live</Badge>
                            ) : (
                              <Badge className="bg-slate-100 text-slate-500 border-none text-[9px]">Hidden</Badge>
                            )}
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2 leading-relaxed">{b.description}</p>
                          <p className="text-[9px] text-slate-400 mt-2 font-mono">ID: {b._id} • Link: {b.link || "None"}</p>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <button
                            onClick={() => handleEditBanner(b)}
                            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg border-none cursor-pointer transition"
                            title="Edit"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteBanner(b._id)}
                            className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg border-none cursor-pointer transition"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================== ORDER TRACKING CONFIG ==================== */}
        {activeTab === "tracking" && (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Control Panel */}
            <div className="lg:col-span-1">
              <Card className="border border-slate-100 shadow-premium text-left">
                <CardHeader>
                  <CardTitle className="font-extrabold text-navy text-sm">
                    {editingTrackingId ? `Manage Active Order Map` : "Select an Order to Edit Coordinates"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {editingTrackingId ? (
                    <form onSubmit={handleSaveTracking} className="space-y-4">
                      <div className="p-3 bg-blue-50 border rounded-xl text-left">
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Selected Order ID</p>
                        <p className="font-mono font-black text-navy text-xs truncate mt-0.5">{editingTrackingId}</p>
                      </div>

                      {/* Map Coordinates progress percentage */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                          Delivery Map Progress: {trackingForm.progressPercentage}%
                        </label>
                        <div className="flex items-center gap-3">
                          <span className="text-[9px] font-bold text-slate-400">Store (0%)</span>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={trackingForm.progressPercentage}
                            onChange={(e) => setTrackingForm({ ...trackingForm, progressPercentage: parseInt(e.target.value) })}
                            className="flex-1 accent-navy h-1 bg-slate-200 rounded-lg cursor-pointer"
                          />
                          <span className="text-[9px] font-bold text-slate-400">Home (100%)</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">ETA (Minutes)</label>
                          <Input
                            type="number"
                            value={trackingForm.etaMinutes}
                            onChange={(e) => setTrackingForm({ ...trackingForm, etaMinutes: parseInt(e.target.value) || 0 })}
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Security OTP</label>
                          <Input
                            value={trackingForm.otp}
                            onChange={(e) => setTrackingForm({ ...trackingForm, otp: e.target.value })}
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Delivery Status</label>
                        <select
                          value={trackingForm.status}
                          onChange={(e) => setTrackingForm({ ...trackingForm, status: e.target.value })}
                          className="w-full text-xs border rounded-xl p-2.5 bg-white focus:outline-none focus:ring-1 focus:ring-navy"
                        >
                          <option value="placed">Placed (Confirmed)</option>
                          <option value="preparing">Preparing Goods</option>
                          <option value="out_for_delivery">Out for Delivery</option>
                          <option value="delivered">Delivered (Completed)</option>
                        </select>
                      </div>

                      <div className="border-t pt-3 space-y-3">
                        <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Courier Partner</p>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Agent Name</label>
                          <Input
                            value={trackingForm.deliveryPartnerName}
                            onChange={(e) => setTrackingForm({ ...trackingForm, deliveryPartnerName: e.target.value })}
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Vehicle Description</label>
                          <Input
                            value={trackingForm.deliveryPartnerVehicle}
                            onChange={(e) => setTrackingForm({ ...trackingForm, deliveryPartnerVehicle: e.target.value })}
                            required
                          />
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button type="submit" className="flex-1 bg-navy hover:bg-navy/95 rounded-xl font-bold text-xs py-2.5">
                          Update Tracking Map
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => setEditingTrackingId(null)}
                          className="rounded-xl border hover:bg-slate-50 text-xs py-2.5 font-bold"
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <div className="py-8 text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
                      <AlertCircle className="w-8 h-8 text-slate-300" />
                      <span>Select an order from the list to modify live telemetry map coordinates.</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* List Panel */}
            <div className="lg:col-span-2 space-y-4 text-left">
              <h3 className="font-extrabold text-navy text-sm">Active Orders Telemetry ({trackings.length})</h3>
              {trackingsLoading ? (
                <div className="p-12 text-center text-xs text-muted-foreground">Loading active coordinate updates...</div>
              ) : trackings.length === 0 ? (
                <div className="border border-dashed rounded-3xl p-12 text-center text-xs text-muted-foreground">
                  No active tracked orders found. Order tracking items will populate once users view tracking details.
                </div>
              ) : (
                <div className="grid gap-4">
                  {trackings.map((t) => (
                    <Card key={t.orderId} className={`border border-slate-100 shadow-sm ${t.orderId === editingTrackingId && "border-2 border-accent"}`}>
                      <CardContent className="p-4 flex justify-between items-center gap-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                            <Truck className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-black text-navy text-xs">Order: {t.orderNumber}</h4>
                              <Badge className="bg-navy text-white text-[9px] font-bold border-none uppercase capitalize">{t.status.replace("_", " ")}</Badge>
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-1">
                              Partner: <strong>{t.deliveryPartnerName}</strong> • ETA: <strong>{t.etaMinutes} mins</strong> • OTP: <strong>{t.otp}</strong>
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-accent rounded-full" style={{ width: `${t.progressPercentage}%` }} />
                              </div>
                              <span className="text-[9px] font-bold text-slate-400">{t.progressPercentage}% Complete</span>
                            </div>
                          </div>
                        </div>
                        <Button
                          onClick={() => handleEditTracking(t)}
                          className="bg-slate-100 hover:bg-slate-200 text-navy font-bold text-xs rounded-xl border-none cursor-pointer py-1.5 px-3"
                        >
                          <Edit className="w-3.5 h-3.5 mr-1" /> Edit Telemetry
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default AdminPersonalization;
