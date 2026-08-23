import React, { useEffect, useMemo, useState } from "react";
import {
  X,
  MapPin,
  Loader2,
  CheckCircle2,
  Home,
  Briefcase,
  Bookmark,
  Trash2,
  Navigation,
  Search,
  ChevronRight,
  Sparkles,
  Building2,
  Map
} from "lucide-react";
import { Button } from "./ui/button";
import { Dialog, DialogContent } from "./ui/dialog";
import { Input } from "./ui/input";
import {
  getDeviceCoordinates,
  reverseGeocode,
  searchPlaces,
  lookupPincode,
  saveActiveLocation,
  extractPincode,
  LocationPayload,
  PlaceSuggestion
} from "@/utils/locationHelper";

interface LocationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm?: (payload: LocationPayload) => void;
}

type GeoState = {
  status: "idle" | "locating" | "geocoding" | "ready" | "error";
  lat?: number;
  lng?: number;
  address?: string;
  colony?: string;
  mandal?: string;
  district?: string;
  state?: string;
  pincode?: string;
  raw?: any;
  error?: string;
};

type SavedLocation = {
  id: string;
  label: "Home" | "Office" | "Other";
  customName?: string;
  state: string;
  district: string;
  mandal: string;
  colony: string;
  pincode: string;
  landmark?: string;
  address: string;
  lat?: number | null;
  lng?: number | null;
};

const API_BASE = import.meta.env.VITE_API_URL || "https://server.apexbee.in/api";

const LocationModal = ({ open, onOpenChange, onConfirm }: LocationModalProps) => {
  const [geo, setGeo] = useState<GeoState>({ status: "idle" });
  const [showManualForm, setShowManualForm] = useState(false);
  const [activeTab, setActiveTab] = useState<"detect" | "saved">("detect");

  // Place search states
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<PlaceSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Manual form states
  const [manualLocation, setManualLocation] = useState({
    state: "",
    district: "",
    mandal: "",
    colony: "",
    pincode: "",
    landmark: "",
  });
  const [isLookingUpPin, setIsLookingUpPin] = useState(false);
  const [colonySuggestions, setColonySuggestions] = useState<string[]>([]);

  // Saved location states
  const [saveAs, setSaveAs] = useState<"Home" | "Office" | "Other" | "none">("none");
  const [savedLocations, setSavedLocations] = useState<SavedLocation[]>([]);

  // Load saved locations
  useEffect(() => {
    if (!open) return;
    localStorage.removeItem("mock_saved_locations");

    const token = localStorage.getItem("token");
    const userRaw = localStorage.getItem("user");
    let user: any = null;
    try { user = userRaw ? JSON.parse(userRaw) : null; } catch { user = null; }
    const userId = user?.id || user?._id;

    if (token && userId) {
      fetch(`${API_BASE}/user/address/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data?.addresses && Array.isArray(data.addresses) && data.addresses.length > 0) {
            const mapped: SavedLocation[] = data.addresses.map((a: any) => ({
              id: a._id || a.id || `loc_${Date.now()}`,
              label: (a.type || a.label || "Home") as "Home" | "Office" | "Other",
              customName: a.label || a.type || undefined,
              state: a.state || "",
              district: a.district || "",
              mandal: a.mandal || "",
              colony: a.street || a.colony || "",
              pincode: a.pincode || "",
              landmark: a.landmark || "",
              address: a.address || `${a.street}, ${a.colony}, ${a.district}, ${a.state} - ${a.pincode}`,
            })).filter((a: SavedLocation) => !a.id.startsWith("loc_test_"));
            setSavedLocations(mapped);
            return;
          }
          loadLocalSavedLocations();
        })
        .catch(() => loadLocalSavedLocations());
    } else {
      loadLocalSavedLocations();
    }

    function loadLocalSavedLocations() {
      const stored = localStorage.getItem("saved_locations");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const clean = parsed.filter((m: any) => m && !m.id?.startsWith("loc_test_"));
            setSavedLocations(clean);
            return;
          }
        } catch { }
      }
      setSavedLocations([]);
    }
  }, [open]);

  // Reset modal state when opening
  useEffect(() => {
    if (open) {
      setGeo({ status: "idle" });
      setShowManualForm(false);
      setSearchQuery("");
      setSearchResults([]);
      setSaveAs("none");
      setColonySuggestions([]);
    }
  }, [open]);

  // Debounced Place Search
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchPlaces(searchQuery);
        setSearchResults(results);
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Live GPS Detect
  const handleDetectLiveLocation = async () => {
    setGeo({ status: "locating" });
    setSearchResults([]);
    setSearchQuery("");

    try {
      const coords = await getDeviceCoordinates();
      setGeo({ status: "geocoding", lat: coords.lat, lng: coords.lng });

      const result = await reverseGeocode(coords.lat, coords.lng);

      setGeo({
        status: "ready",
        lat: coords.lat,
        lng: coords.lng,
        address: result.address,
        colony: result.colony,
        mandal: result.mandal,
        district: result.district,
        state: result.state,
        pincode: result.pincode,
        raw: result.raw,
      });

      setManualLocation({
        state: result.state,
        district: result.district,
        mandal: result.mandal,
        colony: result.colony,
        pincode: result.pincode,
        landmark: "",
      });
    } catch (e: any) {
      setGeo({
        status: "error",
        error: e?.message || "Could not detect location. Search your area above.",
      });
    }
  };

  // Select from Search Suggestion
  const handleSelectSuggestion = (place: PlaceSuggestion) => {
    setGeo({
      status: "ready",
      lat: place.lat || null as any,
      lng: place.lng || null as any,
      address: place.displayName,
      colony: place.colony,
      mandal: place.mandal,
      district: place.district,
      state: place.state,
      pincode: place.pincode,
    });

    setManualLocation({
      state: place.state,
      district: place.district,
      mandal: place.mandal,
      colony: place.colony,
      pincode: place.pincode,
      landmark: "",
    });

    setSearchQuery(place.displayName);
    setSearchResults([]);
  };

  // Pincode auto-lookup for manual form
  const handlePincodeChange = async (val: string) => {
    const clean = val.replace(/\D/g, "").slice(0, 6);
    setManualLocation(prev => ({ ...prev, pincode: clean }));

    if (clean.length === 6) {
      setIsLookingUpPin(true);
      try {
        const details = await lookupPincode(clean);
        if (details) {
          setManualLocation(prev => ({
            ...prev,
            state: details.state || prev.state,
            district: details.district || prev.district,
            mandal: details.mandal || prev.mandal,
            colony: prev.colony || (details.places.length > 0 ? details.places[0] : prev.colony),
          }));
          if (details.places && details.places.length > 0) {
            setColonySuggestions(details.places);
          }
        }
      } finally {
        setIsLookingUpPin(false);
      }
    }
  };

  const isManualFormValid = useMemo(() => {
    return (
      manualLocation.state.trim() !== "" &&
      manualLocation.district.trim() !== "" &&
      manualLocation.mandal.trim() !== "" &&
      manualLocation.colony.trim() !== "" &&
      extractPincode(manualLocation.pincode).length === 6
    );
  }, [manualLocation]);

  // Apply & Save Confirmed Location
  const handleConfirmLocation = () => {
    let payload: LocationPayload | null = null;

    if (showManualForm) {
      const { state, district, mandal, colony, pincode, landmark } = manualLocation;
      const cleanPin = extractPincode(pincode);
      if (!state.trim() || !district.trim() || !mandal.trim() || !colony.trim() || !cleanPin) return;

      const addressParts = [colony.trim(), landmark.trim() ? `Near ${landmark.trim()}` : "", mandal.trim(), district.trim(), state.trim()].filter(Boolean);
      const address = `${addressParts.join(", ")} - ${cleanPin}`;

      payload = {
        lat: geo.lat || null,
        lng: geo.lng || null,
        state: state.trim(),
        district: district.trim(),
        mandal: mandal.trim(),
        colony: colony.trim(),
        pincode: cleanPin,
        landmark: landmark.trim() || undefined,
        address,
        locationType: "manual",
      };
    } else {
      if (geo.status !== "ready") return;

      payload = {
        lat: geo.lat || null,
        lng: geo.lng || null,
        state: geo.state || manualLocation.state || "",
        district: geo.district || manualLocation.district || "",
        mandal: geo.mandal || manualLocation.mandal || "",
        colony: geo.colony || manualLocation.colony || "Your Area",
        pincode: extractPincode(geo.pincode || manualLocation.pincode),
        landmark: "",
        address: geo.address || `${geo.colony}, ${geo.district}`,
        locationType: "gps",
      };
    }

    if (!payload) return;

    if (saveAs !== "none") {
      const isDuplicate = savedLocations.some(l => l.label === saveAs);
      const idPrefix = saveAs.toLowerCase();
      const nextLocations = isDuplicate
        ? savedLocations.map(l => l.label === saveAs ? { ...l, ...payload, id: `loc_${idPrefix}_${Date.now()}` } : l)
        : [...savedLocations, { id: `loc_${idPrefix}_${Date.now()}`, label: saveAs, ...payload } as SavedLocation];

      localStorage.setItem("saved_locations", JSON.stringify(nextLocations));
      setSavedLocations(nextLocations);
    }

    saveActiveLocation(payload);
    onConfirm?.(payload);
    onOpenChange(false);
  };

  const handleSelectSavedLocation = (loc: SavedLocation) => {
    const payload: LocationPayload = {
      lat: loc.lat || null,
      lng: loc.lng || null,
      state: loc.state,
      district: loc.district,
      mandal: loc.mandal,
      colony: loc.colony,
      pincode: loc.pincode,
      landmark: loc.landmark,
      address: loc.address,
      locationType: "saved",
    };

    saveActiveLocation(payload);
    onConfirm?.(payload);
    onOpenChange(false);
  };

  const deleteSavedLocation = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedLocations.filter(loc => loc.id !== id);
    localStorage.setItem("saved_locations", JSON.stringify(updated));
    setSavedLocations(updated);
  };

  const close = () => onOpenChange(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-lg max-h-[90vh] bg-white dark:bg-stone-900 border border-slate-100 dark:border-stone-800 rounded-3xl shadow-2xl p-0 overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-navy via-slate-900 to-navy text-white px-4 sm:px-6 py-4 sm:py-5 relative shrink-0">
          <button
            onClick={close}
            className="absolute right-3.5 top-3.5 rounded-full p-1.5 text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer border-none bg-transparent"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="p-2 sm:p-2.5 rounded-2xl bg-accent text-white shadow-lg shadow-orange-500/20">
              <MapPin className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black tracking-tight">Select Delivery Location</h3>
              <p className="text-[11px] sm:text-xs text-slate-300">Fast & precise 15–30 min hyperlocal delivery</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex mt-3 sm:mt-4 bg-white/10 p-1 rounded-xl text-xs font-bold gap-1">
            <button
              onClick={() => setActiveTab("detect")}
              className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer border-none ${activeTab === "detect" ? "bg-white text-navy shadow-xs" : "text-white/80 hover:text-white bg-transparent"
                }`}
            >
              📍 Search or Detect
            </button>
            <button
              onClick={() => setActiveTab("saved")}
              className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer border-none ${activeTab === "saved" ? "bg-white text-navy shadow-xs" : "text-white/80 hover:text-white bg-transparent"
                }`}
            >
              🏠 Saved ({savedLocations.length})
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto flex-1">
          {activeTab === "detect" ? (
            <div className="space-y-3.5 sm:space-y-4">
              {/* 1. Live GPS Detection Quick Banner */}
              <button
                type="button"
                onClick={handleDetectLiveLocation}
                disabled={geo.status === "locating" || geo.status === "geocoding"}
                className="w-full text-left p-3.5 rounded-2xl border-2 border-accent/30 bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent hover:border-accent hover:bg-amber-500/15 transition group flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-accent text-white flex items-center justify-center shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform">
                    {geo.status === "locating" || geo.status === "geocoding" ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Navigation className="h-5 w-5 text-white" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-black text-navy flex items-center gap-1.5">
                      Use Current GPS Location
                      <span className="text-[9px] bg-accent text-white font-extrabold px-1.5 py-0.2 rounded-full">LIVE</span>
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {geo.status === "locating"
                        ? "Fetching device GPS coordinates..."
                        : geo.status === "geocoding"
                          ? "Locating colony, district & pincode..."
                          : "Enable direct GPS for exact doorstep accuracy"}
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-accent group-hover:translate-x-0.5 transition-transform" />
              </button>

              {/* 2. Instant Search Input */}
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search city, locality, colony, or pincode (e.g. Adilabad)..."
                    className="h-10 pl-10 pr-9 text-xs rounded-xl border-slate-200 focus-visible:ring-accent bg-slate-50/50"
                  />
                  {isSearching && (
                    <Loader2 className="absolute right-3.5 top-3 h-4 w-4 animate-spin text-accent" />
                  )}
                </div>

                {/* Instant Search Suggestions Dropdown */}
                {searchResults.length > 0 && (
                  <div className="mt-1.5 bg-white border border-slate-100 rounded-2xl shadow-xl divide-y divide-slate-50 overflow-hidden z-20">
                    {searchResults.map((place, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleSelectSuggestion(place)}
                        className="p-3 hover:bg-slate-50 cursor-pointer text-left transition flex items-center gap-3"
                      >
                        <div className="p-2 rounded-lg bg-slate-100 text-slate-600 shrink-0">
                          <Building2 className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-black text-navy leading-tight">
                            {place.colony} {place.pincode ? ` - ${place.pincode}` : ""}
                          </p>
                          <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                            {place.displayName}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 3. Detected / Selected Location Card */}
              {geo.status === "ready" && (
                <div className="p-4 rounded-2xl border-2 border-emerald-500/30 bg-emerald-50/40 text-left space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-extrabold text-emerald-800">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 fill-emerald-100" />
                      Location Selected
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowManualForm(!showManualForm)}
                      className="text-[11px] font-extrabold text-accent hover:underline"
                    >
                      {showManualForm ? "Hide Form" : "✏️ Edit Details"}
                    </button>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-emerald-100 shadow-sm space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-black text-navy">
                        {geo.colony} {geo.pincode ? `(${geo.pincode})` : ""}
                      </p>
                      {geo.state && (
                        <span className="text-[10px] bg-slate-100 text-navy font-bold px-2 py-0.5 rounded-md">
                          {geo.district || geo.state}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
                      {geo.address}
                    </p>
                  </div>
                </div>
              )}

              {/* 4. Manual Details Form (Toggleable or when needed) */}
              {showManualForm && (
                <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/60 text-left space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-extrabold text-navy uppercase tracking-wider">Address Breakdown</p>
                    {isLookingUpPin && (
                      <span className="text-[10px] text-accent font-bold animate-pulse flex items-center gap-1">
                        <Loader2 className="h-3 w-3 animate-spin" /> Verifying PIN...
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-navy">Pincode *</label>
                      <Input
                        value={manualLocation.pincode}
                        onChange={(e) => handlePincodeChange(e.target.value)}
                        placeholder="e.g. 504001"
                        maxLength={6}
                        className="h-8 text-xs rounded-xl bg-white border-slate-200 font-bold"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-navy">Colony / Locality *</label>
                      <Input
                        value={manualLocation.colony}
                        onChange={(e) => setManualLocation(p => ({ ...p, colony: e.target.value }))}
                        placeholder="e.g. Teachers Colony"
                        className="h-8 text-xs rounded-xl bg-white border-slate-200"
                      />
                    </div>

                    {colonySuggestions.length > 0 && (
                      <div className="col-span-2 space-y-1">
                        <p className="text-[9px] text-muted-foreground font-bold">Suggested Areas:</p>
                        <div className="flex flex-wrap gap-1">
                          {colonySuggestions.slice(0, 5).map(place => (
                            <button
                              key={place}
                              type="button"
                              onClick={() => setManualLocation(p => ({ ...p, colony: place }))}
                              className="text-[10px] bg-white border border-slate-200 hover:border-accent hover:text-accent px-2 py-0.5 rounded-lg text-slate-700 transition"
                            >
                              + {place}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-navy">Mandal / Taluk *</label>
                      <Input
                        value={manualLocation.mandal}
                        onChange={(e) => setManualLocation(p => ({ ...p, mandal: e.target.value }))}
                        placeholder="e.g. Adilabad Urban"
                        className="h-8 text-xs rounded-xl bg-white border-slate-200"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-navy">District *</label>
                      <Input
                        value={manualLocation.district}
                        onChange={(e) => setManualLocation(p => ({ ...p, district: e.target.value }))}
                        placeholder="e.g. Adilabad"
                        className="h-8 text-xs rounded-xl bg-white border-slate-200"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-navy">State *</label>
                      <Input
                        value={manualLocation.state}
                        onChange={(e) => setManualLocation(p => ({ ...p, state: e.target.value }))}
                        placeholder="e.g. Telangana"
                        className="h-8 text-xs rounded-xl bg-white border-slate-200"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-navy">Landmark (Optional)</label>
                      <Input
                        value={manualLocation.landmark}
                        onChange={(e) => setManualLocation(p => ({ ...p, landmark: e.target.value }))}
                        placeholder="e.g. Near Bus Stand"
                        className="h-8 text-xs rounded-xl bg-white border-slate-200"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Error Notice */}
              {geo.status === "error" && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-700 text-xs text-center font-medium">
                  {geo.error}
                </div>
              )}

              {/* Save As Selector */}
              {(geo.status === "ready" || isManualFormValid) && (
                <div className="border border-slate-100 rounded-2xl p-3 bg-slate-50 flex items-center justify-between">
                  <span className="text-xs font-bold text-navy">Save as:</span>
                  <div className="flex gap-1.5">
                    {(["Home", "Office", "Other"] as const).map(type => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setSaveAs(saveAs === type ? "none" : type)}
                        className={`px-3 py-1 rounded-xl text-xs font-bold border transition ${saveAs === type
                          ? "bg-navy text-white border-navy"
                          : "bg-white border-slate-200 text-navy hover:bg-slate-50"
                          }`}
                      >
                        {type === "Home" ? "🏠 " : type === "Office" ? "🏢 " : "📍 "}
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Confirm / Apply Button */}
              <div className="space-y-2 pt-1">
                <Button
                  className="w-full bg-accent hover:bg-accent-dark text-white rounded-xl py-3 font-black shadow-lg shadow-orange-500/20 text-xs uppercase tracking-wider"
                  onClick={handleConfirmLocation}
                  disabled={showManualForm ? !isManualFormValid : geo.status !== "ready"}
                >
                  Confirm & Apply Location
                </Button>

                {!showManualForm && (
                  <button
                    type="button"
                    onClick={() => setShowManualForm(true)}
                    className="text-xs text-muted-foreground hover:text-navy font-bold block mx-auto py-1"
                  >
                    Enter Address Details Manually
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* SAVED ADDRESSES TAB */
            <div className="space-y-3">
              {savedLocations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground space-y-1">
                  <Bookmark className="h-8 w-8 mx-auto text-slate-300" />
                  <p className="text-xs font-bold text-navy">No saved addresses yet</p>
                  <p className="text-[11px]">Detect or search your location and choose "Save As".</p>
                </div>
              ) : (
                savedLocations.map(loc => (
                  <div
                    key={loc.id}
                    onClick={() => handleSelectSavedLocation(loc)}
                    className="p-3.5 border border-slate-100 rounded-2xl bg-slate-50 hover:bg-white hover:border-accent/40 transition hover:shadow-sm cursor-pointer flex items-center justify-between gap-3 text-left"
                  >
                    <div className="flex gap-3 items-start min-w-0">
                      <div className="p-2 rounded-xl bg-white border border-slate-100 text-navy shrink-0 mt-0.5">
                        {loc.label === "Home" ? (
                          <Home className="h-4 w-4 text-accent" />
                        ) : loc.label === "Office" ? (
                          <Briefcase className="h-4 w-4 text-indigo-500" />
                        ) : (
                          <Bookmark className="h-4 w-4 text-emerald-500" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="font-black text-navy text-xs">
                            {loc.customName || loc.label}
                          </p>
                          <span className="text-[9px] bg-amber-100 text-amber-900 font-extrabold px-1.5 py-0.5 rounded-md">
                            PIN: {loc.pincode}
                          </span>
                        </div>
                        <p className="text-[10px] font-bold text-accent mt-0.5">
                          {loc.colony}, {loc.district} ({loc.state})
                        </p>
                        <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">
                          {loc.address}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => deleteSavedLocation(loc.id, e)}
                      className="p-1 rounded-full text-muted-foreground hover:text-red-500 hover:bg-white transition"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LocationModal;
