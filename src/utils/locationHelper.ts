/**
 * Advanced Live Location, Place Search & Reverse Geocoding Engine for Apexbee
 * Modeled after modern delivery apps (Zomato / Swiggy / Zepto)
 * Features:
 * - Direct high-accuracy GPS with real-time accuracy checks
 * - Multi-provider reverse geocoding with Smart Address Sanitizer
 * - Instant Place & Locality search with auto-complete
 * - Indian Postal Pincode lookup & validation
 */

export interface LocationPayload {
  lat: number | null;
  lng: number | null;
  state: string;
  district: string;
  mandal: string;
  colony: string;
  pincode: string;
  landmark?: string;
  address: string;
  locationType?: "gps" | "manual" | "saved" | "search";
  raw?: any;
}

export interface PlaceSuggestion {
  displayName: string;
  colony: string;
  mandal: string;
  district: string;
  state: string;
  pincode: string;
  lat: number;
  lng: number;
}

/**
 * Normalizes and extracts a valid 6-digit Indian PIN code.
 */
export function extractPincode(text?: string | null): string {
  if (!text) return "";
  const match = String(text).match(/\b([1-9][0-9]{5})\b/);
  return match ? match[1] : "";
}

/**
 * Cleans ugly OSM/Highway strings (e.g. "NH44;NH65;NH163, Ward 78...") into clean locality names.
 */
export function sanitizePlaceName(text: string): string {
  if (!text) return "";
  return text
    .replace(/\bNH\d+(\s*;\s*NH\d+)*\b/gi, "")
    .replace(/Ward\s*\d+[A-Za-z0-9\s-]*/gi, "")
    .replace(/Greater\s+[A-Za-z\s]+Municipal\s+Corporation\s*(Central|North|South|East|West)?\s*(Zone)?/gi, "")
    .replace(/\bMunicipal\s+Corporation\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .replace(/^[,;\s-]+|[,;\s-]+$/g, "")
    .trim();
}

/**
 * Acquire live high-precision GPS coordinates directly from device hardware.
 */
export async function getDeviceCoordinates(): Promise<{ lat: number; lng: number; accuracy?: number }> {
  if (typeof window === "undefined" || !("geolocation" in navigator)) {
    throw new Error("Geolocation is not supported on this device/browser. Please search your area manually.");
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
      },
      (err1) => {
        if (err1.code === 1) {
          reject(new Error("Location access denied. Please allow location permissions in your browser or search your area."));
          return;
        }

        // Secondary fallback without forced hardware lock
        navigator.geolocation.getCurrentPosition(
          (pos2) => {
            resolve({
              lat: pos2.coords.latitude,
              lng: pos2.coords.longitude,
              accuracy: pos2.coords.accuracy,
            });
          },
          (err2) => {
            const msg =
              err2.code === 1
                ? "Location permission was denied. Please allow browser location."
                : "Unable to detect GPS coordinates. Please search your area in the search box.";
            reject(new Error(msg));
          },
          { enableHighAccuracy: false, timeout: 12000, maximumAge: 0 }
        );
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  });
}

/**
 * Reverse geocode latitude and longitude into clean, structured address fields.
 */
export async function reverseGeocode(lat: number, lng: number): Promise<LocationPayload> {
  let state = "";
  let district = "";
  let mandal = "";
  let colony = "";
  let pincode = "";
  let address = "";
  let rawData: any = null;

  // Provider 1: BigDataCloud Reverse Geocoding Client (Fast & structured)
  try {
    const bdcRes = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
    );
    if (bdcRes.ok) {
      const bdcData = await bdcRes.json();
      rawData = bdcData;

      state = bdcData.principalSubdivision || "";
      colony = bdcData.locality || bdcData.sublocality || "";
      mandal = bdcData.city || "";
      district =
        bdcData.localityInfo?.administrative?.[2]?.name ||
        bdcData.localityInfo?.administrative?.[1]?.name ||
        bdcData.city ||
        "";
      pincode = extractPincode(bdcData.postcode);

      if (Array.isArray(bdcData.localityInfo?.administrative)) {
        for (const adm of bdcData.localityInfo.administrative) {
          if (adm.adminLevel === 4 && !state) state = adm.name;
          if ((adm.adminLevel === 5 || adm.adminLevel === 6) && !district) district = adm.name;
          if ((adm.adminLevel === 7 || adm.adminLevel === 8) && !mandal) mandal = adm.name;
        }
      }
    }
  } catch (e) {
    console.warn("BigDataCloud error:", e);
  }

  // Provider 2: OpenStreetMap Nominatim for Indian address details
  try {
    const osmUrl = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&lat=${lat}&lon=${lng}`;
    const res = await fetch(osmUrl, {
      headers: { Accept: "application/json" },
    });
    if (res.ok) {
      const osmData = await res.json();
      if (!rawData) rawData = osmData;
      const a = osmData.address || {};

      if (!state) state = a.state || "";
      if (!district) district = a.state_district || a.district || a.county || "";
      if (!mandal) mandal = a.subdistrict || a.tehsil || a.taluk || a.mandal || a.municipality || a.city || a.town || "";
      if (!colony) {
        colony =
          a.neighbourhood ||
          a.suburb ||
          a.residential ||
          a.quarter ||
          a.village ||
          a.hamlet ||
          a.town ||
          a.city_district ||
          a.road ||
          "";
      }
      if (!pincode) {
        pincode = extractPincode(a.postcode) || extractPincode(osmData.display_name);
      }
      if (!address) {
        address = osmData.display_name;
      }
    }
  } catch (e) {
    console.warn("Nominatim error:", e);
  }

  // Provider 3: Postal DB for District/Mandal clarification if PIN found
  if (pincode && (!district || !state || !mandal)) {
    try {
      const pinDetails = await lookupPincode(pincode);
      if (pinDetails) {
        if (!state && pinDetails.state) state = pinDetails.state;
        if (!district && pinDetails.district) district = pinDetails.district;
        if (!mandal && pinDetails.mandal) mandal = pinDetails.mandal;
      }
    } catch {
      // Ignore
    }
  }

  // Clean and sanitize names
  colony = sanitizePlaceName(colony || mandal || district || "Current Area");
  mandal = sanitizePlaceName(mandal || colony || "");
  district = sanitizePlaceName(district || mandal || "");
  state = sanitizePlaceName(state || "");

  const parts = [colony, mandal !== colony ? mandal : "", district !== mandal ? district : "", state].filter(Boolean);
  const cleanAddr = parts.length > 0 ? `${parts.join(", ")}${pincode ? ` - ${pincode}` : ""}` : `${lat.toFixed(5)}, ${lng.toFixed(5)}`;

  return {
    lat,
    lng,
    state,
    district,
    mandal,
    colony,
    pincode,
    address: cleanAddr,
    locationType: "gps",
    raw: rawData,
  };
}

/**
 * Instant Search for Places, Towns, Localities, and Areas in India
 */
export async function searchPlaces(query: string): Promise<PlaceSuggestion[]> {
  const q = query.trim();
  if (!q || q.length < 2) return [];

  const results: PlaceSuggestion[] = [];

  // Check if it's a 6-digit Pincode
  if (/^\d{6}$/.test(q)) {
    try {
      const pinData = await lookupPincode(q);
      if (pinData) {
        for (const place of pinData.places.slice(0, 4)) {
          results.push({
            displayName: `${place}, ${pinData.mandal}, ${pinData.district}, ${pinData.state} - ${q}`,
            colony: place,
            mandal: pinData.mandal,
            district: pinData.district,
            state: pinData.state,
            pincode: q,
            lat: 0,
            lng: 0,
          });
        }
      }
    } catch { }
  }

  // Search OpenStreetMap / Nominatim with India filter
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&countrycodes=in&addressdetails=1&limit=6&q=${encodeURIComponent(q)}`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (res.ok) {
      const list = await res.json();
      if (Array.isArray(list)) {
        for (const item of list) {
          const a = item.address || {};
          const colony = sanitizePlaceName(a.neighbourhood || a.suburb || a.residential || a.village || a.town || item.name || "");
          const mandal = sanitizePlaceName(a.subdistrict || a.city || a.town || a.municipality || "");
          const district = sanitizePlaceName(a.state_district || a.district || a.county || mandal || "");
          const state = sanitizePlaceName(a.state || "");
          const pincode = extractPincode(a.postcode) || extractPincode(item.display_name);

          const parts = [colony, mandal !== colony ? mandal : "", district !== mandal ? district : "", state].filter(Boolean);
          const displayName = parts.length > 0 ? `${parts.join(", ")}${pincode ? ` - ${pincode}` : ""}` : item.display_name;

          results.push({
            displayName,
            colony: colony || "Area",
            mandal: mandal || district,
            district: district || mandal,
            state,
            pincode,
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon),
          });
        }
      }
    }
  } catch (e) {
    console.warn("Place search error:", e);
  }

  return results;
}

/**
 * Indian Postal Database lookup by 6-digit Pincode
 */
export async function lookupPincode(pincode: string): Promise<{
  state: string;
  district: string;
  mandal: string;
  places: string[];
} | null> {
  const cleanPin = extractPincode(pincode);
  if (cleanPin.length !== 6) return null;

  try {
    const res = await fetch(`https://api.postalpincode.in/pincode/${cleanPin}`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data[0]?.Status === "Success" && Array.isArray(data[0]?.PostOffice)) {
        const offices = data[0].PostOffice;
        const first = offices[0] || {};
        const places = offices.map((o: any) => o.Name).filter(Boolean);

        return {
          state: first.State || "",
          district: first.District || "",
          mandal: first.Taluk || first.Block || first.Division || "",
          places,
        };
      }
    }
  } catch (err) {
    console.warn("Postal pincode lookup error:", err);
  }

  return null;
}

/**
 * Saves active user location and triggers cross-component updates.
 */
export function saveActiveLocation(payload: LocationPayload) {
  const storagePayload = {
    lat: payload.lat,
    lng: payload.lng,
    state: payload.state || "",
    district: payload.district || "",
    mandal: payload.mandal || "",
    colony: payload.colony || "",
    pincode: payload.pincode || "",
    landmark: payload.landmark || "",
    address: payload.address || "",
    locationType: payload.locationType || "gps",
  };

  localStorage.setItem("user_location", JSON.stringify(storagePayload));
  localStorage.setItem("userLocation", JSON.stringify(storagePayload));
  localStorage.setItem("apexbee_user_location", JSON.stringify(storagePayload));

  if (payload.pincode) {
    localStorage.setItem("userPincode", payload.pincode);
    localStorage.setItem("pincode", payload.pincode);
  }

  window.dispatchEvent(new Event("storage"));
  window.dispatchEvent(new Event("user_location_updated"));
}
