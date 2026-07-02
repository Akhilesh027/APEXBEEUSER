import { useEffect, useMemo, useState } from "react";
import { X, MapPin, Loader2, CheckCircle2, Home, Briefcase, Bookmark, Plus, Trash2 } from "lucide-react";
import { Button } from "./ui/button";
import { Dialog, DialogContent } from "./ui/dialog";
import { Input } from "./ui/input";

interface LocationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  // ✅ parent will receive confirmed location
  onConfirm?: (payload: {
    lat: number | null;
    lng: number | null;
    state: string;
    district: string;
    mandal: string;
    colony: string;
    pincode: string;
    landmark?: string;
    address: string;
    locationType: "gps" | "manual" | "saved";
    raw?: any;
  }) => void;
}

type GeoState = {
  status: "idle" | "locating" | "geocoding" | "ready" | "error";
  lat?: number;
  lng?: number;
  address?: string;
  colony?: string;
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
};

const LocationModal = ({ open, onOpenChange, onConfirm }: LocationModalProps) => {
  const [geo, setGeo] = useState<GeoState>({ status: "idle" });
  const [showManualForm, setShowManualForm] = useState(false);
  const [activeTab, setActiveTab] = useState<"detect" | "saved">("detect");

  const [manualLocation, setManualLocation] = useState({
    state: "",
    district: "",
    mandal: "",
    colony: "",
    pincode: "",
    landmark: "",
  });

  const [saveAs, setSaveAs] = useState<"Home" | "Office" | "Other" | "none">("none");
  const [savedLocations, setSavedLocations] = useState<SavedLocation[]>([]);

  // Load saved locations from localStorage or seed defaults
  useEffect(() => {
    const stored = localStorage.getItem("mock_saved_locations");
    if (stored) {
      try {
        setSavedLocations(JSON.parse(stored));
      } catch {
        // use fallback
      }
    } else {
      const defaultLocations: SavedLocation[] = [
        {
          id: "loc_home",
          label: "Home",
          state: "Karnataka",
          district: "Bangalore",
          mandal: "Bangalore South",
          colony: "Brigade Road",
          pincode: "560001",
          address: "No. 102, 3rd Floor, Brigade Residency, Brigade Road, Bangalore, Karnataka - 560001",
        },
        {
          id: "loc_office",
          label: "Office",
          state: "Karnataka",
          district: "Bangalore",
          mandal: "Bangalore East",
          colony: "MG Road",
          pincode: "560001",
          address: "No. 42, 2nd Floor, Apex Towers, MG Road, Bangalore, Karnataka - 560001",
        },
      ];
      localStorage.setItem("mock_saved_locations", JSON.stringify(defaultLocations));
      setSavedLocations(defaultLocations);
    }
  }, [open]);

  const canUseGeo = useMemo(
    () => typeof window !== "undefined" && "geolocation" in navigator,
    []
  );

  const isManualFormValid = useMemo(() => {
    return (
      manualLocation.state.trim() !== "" &&
      manualLocation.district.trim() !== "" &&
      manualLocation.mandal.trim() !== "" &&
      manualLocation.colony.trim() !== "" &&
      manualLocation.pincode.trim() !== ""
    );
  }, [manualLocation]);

  // Reset modal state each time it opens
  useEffect(() => {
    if (open) {
      setGeo({ status: "idle" });
      setShowManualForm(false);
      setSaveAs("none");
      setManualLocation({
        state: "",
        district: "",
        mandal: "",
        colony: "",
        pincode: "",
        landmark: "",
      });
    }
  }, [open]);

  const reverseGeocode = async (lat: number, lng: number) => {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&lat=${lat}&lon=${lng}`;
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error("Failed to fetch address");
    const data = await res.json();
    const addr = data?.address || {};

    const colony =
      addr.neighbourhood ||
      addr.suburb ||
      addr.residential ||
      addr.quarter ||
      addr.hamlet ||
      addr.village ||
      addr.town ||
      addr.city_district ||
      addr.city ||
      addr.county ||
      "Unknown area";

    const pincode = addr.postcode || "";
    const address = data?.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;

    return { address, colony, pincode, raw: data };
  };

  const enableLocation = async () => {
    if (!canUseGeo) {
      setGeo({
        status: "error",
        error: "Geolocation is not supported in this browser.",
      });
      setShowManualForm(true);
      return;
    }

    setGeo({ status: "locating" });

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        try {
          setGeo({ status: "geocoding", lat, lng });
          const { address, colony, pincode, raw } = await reverseGeocode(lat, lng);

          setGeo({
            status: "ready",
            lat,
            lng,
            address,
            colony,
            pincode,
            raw,
          });

          const rawAddr = raw?.address || {};
          const stateVal = rawAddr.state || "";
          const districtVal = rawAddr.state_district || rawAddr.county || rawAddr.district || "";
          const mandalVal = rawAddr.subdistrict || rawAddr.municipality || rawAddr.city || rawAddr.town || "";
          const colonyVal = colony && colony !== "Unknown area" ? colony : "";
          const pincodeVal = pincode || "";

          setManualLocation({
            state: stateVal,
            district: districtVal,
            mandal: mandalVal,
            colony: colonyVal,
            pincode: pincodeVal,
            landmark: "",
          });

          if (!pincodeVal || !colonyVal) {
            setShowManualForm(true);
          }
        } catch (e: any) {
          setGeo({
            status: "error",
            lat,
            lng,
            error: e?.message || "Could not get address from coordinates.",
          });
          setShowManualForm(true);
        }
      },
      (err) => {
        const msg =
          err.code === 1
            ? "Permission denied. Please allow location access."
            : err.code === 2
            ? "Position unavailable. Try again."
            : "Location request timed out. Try again.";

        setGeo({ status: "error", error: msg });
        setShowManualForm(true);
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0,
      }
    );
  };

  // Confirm and save location (if requested)
  const confirmLocation = () => {
    let payload: any = null;

    if (showManualForm) {
      const { state, district, mandal, colony, pincode, landmark } = manualLocation;
      if (!state.trim() || !district.trim() || !mandal.trim() || !colony.trim() || !pincode.trim()) {
        return;
      }

      const addressParts = [
        colony.trim(),
        landmark.trim() ? `Near ${landmark.trim()}` : "",
        mandal.trim(),
        district.trim(),
        state.trim(),
      ].filter(Boolean);
      const address = `${addressParts.join(", ")} - ${pincode.trim()}`;

      payload = {
        lat: geo.lat || null,
        lng: geo.lng || null,
        state: state.trim(),
        district: district.trim(),
        mandal: mandal.trim(),
        colony: colony.trim(),
        pincode: pincode.trim(),
        landmark: landmark.trim() || undefined,
        address,
        locationType: "manual" as const,
        raw: geo.raw || null,
      };
    } else {
      if (geo.status !== "ready" || geo.lat == null || geo.lng == null) return;

      const rawAddr = geo.raw?.address || {};
      const stateVal = rawAddr.state || "";
      const districtVal = rawAddr.state_district || rawAddr.county || rawAddr.district || "";
      const mandalVal = rawAddr.subdistrict || rawAddr.municipality || rawAddr.city || rawAddr.town || "";
      const colonyVal = geo.colony || "";
      const pincodeVal = geo.pincode || "";

      payload = {
        lat: geo.lat,
        lng: geo.lng,
        state: stateVal,
        district: districtVal,
        mandal: mandalVal,
        colony: colonyVal,
        pincode: pincodeVal,
        landmark: "",
        address: geo.address || `${geo.lat}, ${geo.lng}`,
        locationType: "gps" as const,
        raw: geo.raw,
      };
    }

    if (!payload) return;

    // Handle "Save location" checkbox
    if (saveAs !== "none") {
      const isDuplicate = savedLocations.some(l => l.label === saveAs);
      const idPrefix = saveAs.toLowerCase();
      const nextLocations = isDuplicate 
        ? savedLocations.map(l => l.label === saveAs ? { ...l, ...payload, id: `loc_${idPrefix}_${Date.now()}` } : l)
        : [...savedLocations, { id: `loc_${idPrefix}_${Date.now()}`, label: saveAs, ...payload }];

      localStorage.setItem("mock_saved_locations", JSON.stringify(nextLocations));
      setSavedLocations(nextLocations);
    }

    // Save as current active location
    const storagePayload = {
      lat: payload.lat,
      lng: payload.lng,
      state: payload.state,
      district: payload.district,
      mandal: payload.mandal,
      colony: payload.colony,
      pincode: payload.pincode,
      landmark: payload.landmark,
      address: payload.address,
      locationType: payload.locationType,
    };
    localStorage.setItem("user_location", JSON.stringify(storagePayload));
    window.dispatchEvent(new Event("storage"));

    onConfirm?.(payload);
    onOpenChange(false);
  };

  const selectSavedLocation = (loc: SavedLocation) => {
    const payload = {
      lat: null,
      lng: null,
      state: loc.state,
      district: loc.district,
      mandal: loc.mandal,
      colony: loc.colony,
      pincode: loc.pincode,
      landmark: loc.landmark,
      address: loc.address,
      locationType: "saved" as const,
    };

    localStorage.setItem("user_location", JSON.stringify(payload));
    window.dispatchEvent(new Event("storage"));

    onConfirm?.(payload);
    onOpenChange(false);
  };

  const deleteSavedLocation = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedLocations.filter(loc => loc.id !== id);
    localStorage.setItem("mock_saved_locations", JSON.stringify(updated));
    setSavedLocations(updated);
  };

  const close = () => onOpenChange(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white border border-slate-100 rounded-3xl shadow-2xl p-6">
        <button
          onClick={close}
          className="absolute right-4 top-4 rounded-full p-1.5 text-slate-400 hover:text-navy hover:bg-slate-100 transition-colors"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex flex-col items-center py-4 space-y-5">
          {/* Header Pin Icon */}
          <div className="relative">
            <div className="absolute inset-0 animate-ping">
              <MapPin className="h-12 w-12 text-accent opacity-20" />
            </div>
            <MapPin className="h-12 w-12 text-accent relative" />
          </div>

          <div className="text-center space-y-1">
            <h3 className="text-lg font-black text-navy">Select Delivery Area</h3>
            <p className="text-xs text-muted-foreground">
              Choose how you want to select your delivery address.
            </p>
          </div>

          {/* Location Dialog Tabs */}
          <div className="w-full flex border-b border-slate-100">
            <button
              onClick={() => setActiveTab("detect")}
              className={`flex-1 pb-2 text-xs font-bold transition ${
                activeTab === "detect" ? "border-b-2 border-accent text-accent" : "text-muted-foreground hover:text-navy"
              }`}
            >
              📍 Find/Enter Area
            </button>
            <button
              onClick={() => setActiveTab("saved")}
              className={`flex-1 pb-2 text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                activeTab === "saved" ? "border-b-2 border-accent text-accent" : "text-muted-foreground hover:text-navy"
              }`}
            >
              🏠 Saved Address ({savedLocations.length})
            </button>
          </div>

          {/* Tab contents */}
          {activeTab === "detect" ? (
            <div className="w-full space-y-4">
              {showManualForm ? (
                <div className="w-full space-y-3 rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
                  <p className="font-extrabold text-navy text-xs uppercase tracking-wider text-left mb-1">Enter Area Details</p>
                  <div className="grid grid-cols-2 gap-3 text-left">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-navy">State *</label>
                      <Input
                        value={manualLocation.state}
                        onChange={(e) => setManualLocation(p => ({ ...p, state: e.target.value }))}
                        placeholder="e.g. Karnataka"
                        className="h-9 text-xs rounded-xl border-slate-200"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-navy">District *</label>
                      <Input
                        value={manualLocation.district}
                        onChange={(e) => setManualLocation(p => ({ ...p, district: e.target.value }))}
                        placeholder="e.g. Bangalore"
                        className="h-9 text-xs rounded-xl border-slate-200"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-navy">Mandal / Taluk *</label>
                      <Input
                        value={manualLocation.mandal}
                        onChange={(e) => setManualLocation(p => ({ ...p, mandal: e.target.value }))}
                        placeholder="e.g. South"
                        className="h-9 text-xs rounded-xl border-slate-200"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-navy">Colony / Locality *</label>
                      <Input
                        value={manualLocation.colony}
                        onChange={(e) => setManualLocation(p => ({ ...p, colony: e.target.value }))}
                        placeholder="e.g. Indiranagar"
                        className="h-9 text-xs rounded-xl border-slate-200"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-navy">Pincode *</label>
                      <Input
                        value={manualLocation.pincode}
                        onChange={(e) => setManualLocation(p => ({ ...p, pincode: e.target.value }))}
                        placeholder="e.g. 560038"
                        className="h-9 text-xs rounded-xl border-slate-200"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-navy">Landmark (Optional)</label>
                      <Input
                        value={manualLocation.landmark}
                        onChange={(e) => setManualLocation(p => ({ ...p, landmark: e.target.value }))}
                        placeholder="e.g. Metro"
                        className="h-9 text-xs rounded-xl border-slate-200"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="w-full rounded-2xl border border-slate-100 bg-slate-50/50 p-4 text-xs">
                  {geo.status === "idle" && (
                    <p className="text-muted-foreground text-center py-2">
                      Click <strong>Enable Location</strong> to auto-detect your area or enter details manually.
                    </p>
                  )}

                  {(geo.status === "locating" || geo.status === "geocoding") && (
                    <div className="flex flex-col items-center justify-center py-4 gap-2 text-muted-foreground">
                      <Loader2 className="h-5 w-5 animate-spin text-accent" />
                      <span>
                        {geo.status === "locating"
                          ? "Locating device coordinates..."
                          : "Retrieving pincode and colony..."}
                      </span>
                    </div>
                  )}

                  {geo.status === "ready" && (
                    <div className="space-y-2 text-left">
                      <div className="flex items-center gap-1.5 text-navy font-bold">
                        <CheckCircle2 className="h-4 w-4 text-green-500 fill-green-50" />
                        Coordinates Identified
                      </div>

                      <p className="text-sm font-black text-navy leading-tight">
                        {geo.colony} {geo.pincode ? ` - ${geo.pincode}` : ""}
                      </p>

                      <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                        {geo.address}
                      </p>

                      <button
                        type="button"
                        onClick={() => setShowManualForm(true)}
                        className="text-xs text-accent hover:underline font-bold block mt-2"
                      >
                        ✏️ Adjust Address Details Manually
                      </button>
                    </div>
                  )}

                  {geo.status === "error" && (
                    <p className="text-red-500 font-semibold text-center">{geo.error || "Unable to determine location."}</p>
                  )}
                </div>
              )}

              {/* Saved checkbox selector (if ready or manual form active) */}
              {((geo.status === "ready" && !showManualForm) || (showManualForm && isManualFormValid)) && (
                <div className="w-full border border-slate-100 rounded-2xl p-3 bg-slate-50 flex items-center justify-between">
                  <span className="text-xs font-bold text-navy">Save as:</span>
                  <div className="flex gap-1.5">
                    {(["Home", "Office", "Other"] as const).map(type => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setSaveAs(saveAs === type ? "none" : type)}
                        className={`px-3 py-1 rounded-xl text-xs font-bold border transition ${
                          saveAs === type 
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

              {/* Confirm / Find location buttons */}
              <div className="space-y-2.5 w-full">
                <Button
                  className="w-full bg-accent hover:bg-accent-dark text-white rounded-xl py-2.5 font-bold shadow-md shadow-orange-500/10 text-xs"
                  onClick={confirmLocation}
                  disabled={showManualForm ? !isManualFormValid : geo.status !== "ready"}
                >
                  Confirm and Apply Location
                </Button>

                {showManualForm ? (
                  <Button
                    variant="outline"
                    className="w-full rounded-xl text-xs border-slate-200"
                    onClick={() => {
                      setShowManualForm(false);
                      if (geo.status === "error") setGeo({ status: "idle" });
                    }}
                  >
                    Back to GPS Detection
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full rounded-xl text-xs border-slate-200"
                    onClick={enableLocation}
                    disabled={!canUseGeo || geo.status === "locating" || geo.status === "geocoding"}
                  >
                    {geo.status === "locating" || geo.status === "geocoding" ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin text-accent" />
                        Detecting...
                      </>
                    ) : (
                      <>
                        <MapPin className="h-4 w-4 mr-2 text-accent" />
                        Auto Detect My Location
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          ) : (
            /* SAVED LOCATIONS VIEW */
            <div className="w-full space-y-3 max-h-64 overflow-y-auto">
              {savedLocations.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <Bookmark className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                  <p className="text-xs">No saved locations yet.</p>
                  <p className="text-[10px] mt-0.5">Detect or input a location and choose "Save As".</p>
                </div>
              ) : (
                savedLocations.map(loc => (
                  <div
                    key={loc.id}
                    onClick={() => selectSavedLocation(loc)}
                    className="w-full text-left p-3.5 border border-slate-100 rounded-2xl bg-slate-50/50 hover:bg-slate-50 transition hover:shadow-sm cursor-pointer flex items-center justify-between gap-3"
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
                      <div className="min-w-0">
                        <p className="font-extrabold text-navy text-xs leading-none">
                          {loc.label}
                        </p>
                        <p className="text-[10px] font-bold text-accent mt-1 leading-none uppercase tracking-wide">
                          {loc.colony} - {loc.pincode}
                        </p>
                        <p className="text-[10px] text-muted-foreground line-clamp-1 mt-1 leading-normal">
                          {loc.address}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => deleteSavedLocation(loc.id, e)}
                      className="p-1 rounded-full text-muted-foreground hover:text-red-500 hover:bg-white border border-transparent hover:border-slate-100 transition"
                      title="Delete Location"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          <Button variant="ghost" className="w-full text-muted-foreground text-xs rounded-xl" onClick={close}>
            Cancel / Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LocationModal;
