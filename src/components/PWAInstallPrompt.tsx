import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Sparkles, CheckCircle2 } from 'lucide-react';

export const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if running in standalone mode (already installed as PWA)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // Detect iOS
    const ua = window.navigator.userAgent;
    const iosDevice = /iphone|ipad|ipod/i.test(ua);
    setIsIOS(iosDevice);

    // Listen for PWA install prompt event
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Show prompt if user hasn't dismissed it in this session
      if (!sessionStorage.getItem('pwa_prompt_dismissed')) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // If iOS and not dismissed, show iOS banner after 3 seconds
    if (iosDevice && !sessionStorage.getItem('pwa_prompt_dismissed')) {
      const timer = setTimeout(() => setShowPrompt(true), 3000);
      return () => clearTimeout(timer);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      if (isIOS) {
        alert("To install ApexBee on iOS:\n1. Tap the Share button (up arrow)\n2. Select 'Add to Home Screen'");
      }
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowPrompt(false);
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    sessionStorage.setItem('pwa_prompt_dismissed', 'true');
  };

  if (!showPrompt || isInstalled) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-sm z-50 animate-bounce-subtle">
      <div className="bg-slate-900/95 backdrop-blur-md border border-amber-500/40 rounded-2xl shadow-2xl p-4 text-white space-y-3">
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
              <Smartphone className="h-5 w-5 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <h4 className="text-sm font-bold text-white">Install ApexBee App</h4>
                <span className="px-1.5 py-0.5 text-[9px] bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold rounded">PWA</span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Faster loading, full-screen view & instant order updates</p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex gap-2 pt-1">
          <button
            onClick={handleDismiss}
            className="flex-1 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold rounded-xl text-xs transition-colors"
          >
            Not Now
          </button>
          <button
            onClick={handleInstallClick}
            className="flex-1 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Install App</span>
          </button>
        </div>
      </div>
    </div>
  );
};
