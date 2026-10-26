import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Download, X, Smartphone, Sparkles } from "lucide-react";
const logo = "/logo.png";

export const InstallPwaBanner = () => {
  const location = useLocation();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if running in standalone mode (already installed as PWA app)
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // Detect iOS devices
    const ua = window.navigator.userAgent;
    const iosDevice = /iphone|ipad|ipod/i.test(ua);
    setIsIOS(iosDevice);

    // Listen for PWA install prompt event
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!sessionStorage.getItem("pwa_banner_dismissed")) {
        setShowPrompt(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    // Show prompt on iOS after 3 seconds if not dismissed
    if (iosDevice && !sessionStorage.getItem("pwa_banner_dismissed")) {
      const timer = setTimeout(() => setShowPrompt(true), 3000);
      return () => clearTimeout(timer);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      if (isIOS) {
        alert(
          "To install ApexBee App on iPhone / iPad:\n1. Tap the Share button in Safari (up arrow)\n2. Tap 'Add to Home Screen'\n3. Confirm by tapping 'Add'"
        );
      } else {
        alert("To install ApexBee App:\nOpen your browser menu (⋮) and tap 'Install App' or 'Add to Home Screen'.");
      }
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowPrompt(false);
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    sessionStorage.setItem("pwa_banner_dismissed", "true");
  };

  if (
    !showPrompt ||
    isInstalled ||
    location.pathname.startsWith("/checkout") ||
    location.pathname.startsWith("/pay")
  ) {
    return null;
  }

  return (
    <div className="fixed bottom-16 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-50 animate-bounce-subtle">
      <div className="bg-gradient-to-br from-[#070D1E] via-[#0F1B3B] to-[#080E22] backdrop-blur-md border border-[#F3BA12]/40 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.6)] p-4 text-white space-y-3">
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-3">
            <div className="relative h-12 w-12 rounded-xl overflow-hidden shrink-0 shadow-md border-2 border-[#F3BA12]/60 bg-white p-0.5">
              <img
                src="/icon.png"
                alt="ApexBee App Icon"
                className="w-full h-full object-contain rounded-[8px]"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/logo.png";
                }}
              />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <h4 className="text-sm font-bold text-white">
                  Download <span className="text-[#F3BA12]">ApexBee</span> App
                </h4>
                <span className="px-1.5 py-0.5 text-[9px] bg-[#F3BA12]/20 border border-[#F3BA12]/40 text-[#F3BA12] font-bold rounded">App</span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">Faster shopping, instant order updates & exclusive rewards</p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex gap-2 pt-1">
          <button
            onClick={handleDismiss}
            className="flex-1 py-2 bg-slate-900/80 hover:bg-slate-800 text-slate-300 font-semibold rounded-xl text-xs border border-white/10 transition-colors cursor-pointer"
          >
            Not Now
          </button>
          <a
            href="https://play.google.com/store/apps/details?id=in.apexbee.app"
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleDismiss}
            className="flex-1 py-2 bg-gradient-to-r from-[#F3BA12] via-[#F59E0B] to-[#D97706] hover:from-[#FBBF24] hover:to-[#F59E0B] text-slate-950 font-black rounded-xl text-xs shadow-lg shadow-[#F3BA12]/25 transition-all flex items-center justify-center space-x-1.5 cursor-pointer border border-[#F3BA12]/50"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Download App</span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default InstallPwaBanner;
