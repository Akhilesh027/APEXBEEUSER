import { useState, useEffect } from "react";
import { Download, X, Smartphone } from "lucide-react";
import logo from "../Web images/Web images/logo.png";

export const InstallPwaBanner = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    // Check if app is already installed/standalone
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone;

    if (isStandalone) return;

    // Detect iOS
    const ua = window.navigator.userAgent;
    const iosDevice = /iPhone|iPad|iPod/.test(ua) && !(window as any).MSStream;
    if (iosDevice) {
      setIsIos(true);
      const dismissed = localStorage.getItem("pwa_prompt_dismissed");
      if (!dismissed) {
        setShowBanner(true);
      }
    }

    // Chrome/Android PWA event listener
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      const dismissed = localStorage.getItem("pwa_prompt_dismissed");
      if (!dismissed) {
        setShowBanner(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === "accepted") {
        setShowBanner(false);
      }
      setDeferredPrompt(null);
    } else if (isIos) {
      alert("To install ApexBee on iPhone: tap Share ⎋ button below and select 'Add to Home Screen' ➕");
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem("pwa_prompt_dismissed", Date.now().toString());
  };

  if (!showBanner) return null;

  return (
    <div className="fixed top-3 left-3 right-3 z-50 max-w-md mx-auto bg-navy-dark text-white p-3.5 rounded-2xl shadow-2xl border border-white/10 flex items-center justify-between gap-3 animate-in slide-in-from-top-4 duration-300">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-xl bg-white p-1 overflow-hidden shrink-0 flex items-center justify-center">
          <img src={logo} alt="ApexBee" className="w-full h-full object-contain" />
        </div>
        <div className="min-w-0">
          <p className="font-extrabold text-xs text-white truncate">Install ApexBee Web App</p>
          <p className="text-[10px] text-slate-300 truncate">Fast 1-tap ordering & mobile notifications</p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={handleInstall}
          className="bg-accent hover:bg-accent/90 text-white font-extrabold text-[11px] px-3 py-1.5 rounded-xl shadow transition flex items-center gap-1 border-none cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          Install
        </button>
        <button
          onClick={handleDismiss}
          className="text-slate-400 hover:text-white p-1.5 rounded-lg border-none bg-transparent cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default InstallPwaBanner;
