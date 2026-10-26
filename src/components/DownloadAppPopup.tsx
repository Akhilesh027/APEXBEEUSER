import React, { useEffect, useState } from "react";
import { X, Smartphone, Star, ShieldCheck, Sparkles, ExternalLink } from "lucide-react";
import { isNativePlatform } from "@/utils/googleAuth";

const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=in.apexbee.app";
const SNOOZE_KEY = "apexbee_download_app_dismissed_time";
const SNOOZE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours snooze after dismiss

export const DownloadAppPopup: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // 1. Never show inside native mobile app (Capacitor wrapper)
    if (isNativePlatform()) return;

    // 2. Do not show if running in PWA standalone mode
    if (
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true
    ) {
      return;
    }

    // 3. Check snooze timestamp in localStorage
    try {
      const dismissedTime = localStorage.getItem(SNOOZE_KEY);
      if (dismissedTime && Date.now() - Number(dismissedTime) < SNOOZE_DURATION_MS) {
        return;
      }
    } catch {
      // Ignore storage errors
    }

    // 4. Show popup after a smooth 2.5 second delay
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    try {
      localStorage.setItem(SNOOZE_KEY, Date.now().toString());
    } catch {
      // Ignore storage errors
    }
  };

  const handleDownloadClick = () => {
    window.open(PLAY_STORE_URL, "_blank", "noopener,noreferrer");
    handleDismiss();
  };

  if (!isVisible) return null;

  return (
    <div
      role="dialog"
      aria-labelledby="app-download-title"
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:bottom-6 z-50 max-w-sm animate-in fade-in slide-in-from-bottom-5 duration-300"
    >
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#070D1E] via-[#0F1B3B] to-[#080E22] text-white p-4 sm:p-5 shadow-[0_16px_50px_rgba(0,0,0,0.6)] border border-[#F3BA12]/40 backdrop-blur-xl">
        {/* Decorative Golden Honey Glows matching ApexBee Logo */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#F3BA12]/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-28 h-28 bg-amber-500/15 rounded-full blur-xl pointer-events-none" />

        {/* Close Button */}
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Close download prompt"
          className="absolute top-2.5 right-2.5 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header row with App Icon & Logo Branding */}
        <div className="flex items-center gap-3.5 pr-6">
          {/* Prominent App Icon */}
          <div className="relative w-14 h-14 rounded-2xl overflow-hidden shrink-0 shadow-lg border-2 border-[#F3BA12]/60 bg-white p-0.5 group">
            <img
              src="/icon.png"
              alt="ApexBee App Icon"
              className="w-full h-full object-contain rounded-[12px]"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/logo.png";
              }}
            />
            <span className="absolute -bottom-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-[#F3BA12] text-slate-950 ring-2 ring-[#0A1128] shadow-xs">
              <Sparkles className="w-2.5 h-2.5 fill-current" />
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 id="app-download-title" className="text-sm font-black text-white tracking-tight leading-snug">
                Download <span className="text-[#F3BA12]">ApexBee</span> App
              </h3>
            </div>
            <div className="flex items-center gap-2 mt-1 text-[11px]">
              <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-[#F3BA12]/20 border border-[#F3BA12]/50 text-[#F3BA12]">
                Google Play
              </span>
              <div className="flex items-center text-[#F3BA12] font-bold">
                <Star className="w-3 h-3 fill-[#F3BA12] mr-0.5" />
                <span>4.8★</span>
              </div>
              <span className="text-white/40">•</span>
              <span className="text-emerald-400 font-medium flex items-center gap-0.5 text-[10px]">
                <ShieldCheck className="w-3 h-3" /> Official
              </span>
            </div>
          </div>
        </div>

        {/* Feature pitch */}
        <p className="text-xs text-slate-300 mt-3 leading-relaxed">
          Enjoy faster checkouts, real-time hyperlocal delivery updates, and exclusive cashbacks on your phone.
        </p>

        {/* CTA Buttons in ApexBee Gold */}
        <div className="mt-3.5 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <a
            href={PLAY_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleDownloadClick}
            className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#F3BA12] via-[#F59E0B] to-[#D97706] hover:from-[#FBBF24] hover:to-[#F59E0B] text-slate-950 font-black text-xs shadow-lg shadow-[#F3BA12]/25 transition-all active:scale-[0.98] border border-[#F3BA12]/50"
          >
            <Smartphone className="w-4 h-4 shrink-0" />
            <span>Download App</span>
            <ExternalLink className="w-3 h-3 opacity-80" />
          </a>

          <button
            type="button"
            onClick={handleDismiss}
            className="py-2 px-3 text-xs text-slate-400 hover:text-white transition-colors text-center font-medium"
          >
            Not now
          </button>
        </div>

        {/* Platform availability footer with brand gold badges */}
        <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between text-[10px]">
          <span className="text-emerald-400 font-semibold flex items-center gap-1">
            ✓ Free on Google Play
          </span>
          <span className="text-[#F3BA12] font-semibold bg-[#F3BA12]/10 border border-[#F3BA12]/30 px-1.5 py-0.5 rounded">
            iOS: Coming Soon
          </span>
        </div>
      </div>
    </div>
  );
};

export default DownloadAppPopup;
