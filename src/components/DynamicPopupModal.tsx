import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Sparkles, Tag, ArrowRight } from 'lucide-react';
import { BannerData } from './DynamicHeroBanner';

const API_BASE = import.meta.env.VITE_API_URL || 'https://server.apexbee.in/api';

export const DynamicPopupModal: React.FC = () => {
  const navigate = useNavigate();
  const [popupBanner, setPopupBanner] = useState<BannerData | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check if dismissed in this session
    const isDismissed = sessionStorage.getItem('apex_popup_dismissed');
    if (isDismissed) return;

    let isMounted = true;
    const fetchPopup = async () => {
      try {
        const res = await fetch(`${API_BASE}/banners?placement=popup_modal`);
        const data = await res.json();
        if (isMounted && data.success && Array.isArray(data.data) && data.data.length > 0) {
          setPopupBanner(data.data[0]);
          // Open after 1.5s delay for subtle elegant appearance
          setTimeout(() => {
            if (isMounted) setIsOpen(true);
          }, 1500);
        }
      } catch (err) {
        console.error('Error fetching popup modal banner:', err);
      }
    };
    fetchPopup();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleDismiss = () => {
    setIsOpen(false);
    sessionStorage.setItem('apex_popup_dismissed', 'true');
  };

  const handleAction = () => {
    if (!popupBanner) return;
    if (popupBanner._id) {
      fetch(`${API_BASE}/banners/${popupBanner._id}/click`, { method: 'POST' }).catch(() => { });
    }
    handleDismiss();
    if (popupBanner.link) {
      if (popupBanner.link.startsWith('http://') || popupBanner.link.startsWith('https://')) {
        window.open(popupBanner.link, '_blank');
      } else {
        navigate(popupBanner.link);
      }
    }
  };

  if (!isOpen || !popupBanner) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="relative bg-card rounded-3xl border border-amber-500/30 shadow-2xl overflow-hidden max-w-sm sm:max-w-md w-full animate-scaleIn">
        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 z-20 p-2 rounded-full bg-black/60 hover:bg-black text-white backdrop-blur transition cursor-pointer"
          aria-label="Close Announcement"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Image Banner Header */}
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-stone-900">
          <img
            src={popupBanner.imageUrl}
            alt={popupBanner.title}
            className="w-full h-full object-cover"
            onError={(e: any) => {
              e.target.src = 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=800';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/30 to-transparent" />

          {/* Badges on image */}
          <div className="absolute top-3.5 left-3.5 flex items-center gap-2">
            {popupBanner.tag && (
              <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-stone-950 text-[10px] font-black uppercase shadow">
                {popupBanner.tag}
              </span>
            )}
            {popupBanner.discount && (
              <span className="px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur text-emerald-300 text-[10px] font-black border border-emerald-400/30 shadow">
                {popupBanner.discount}
              </span>
            )}
          </div>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-4">
          <div className="space-y-1.5 text-center">
            <h3 className="text-lg sm:text-xl font-black text-foreground tracking-tight">
              {popupBanner.title}
            </h3>
            {popupBanner.subtitle && (
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {popupBanner.subtitle}
              </p>
            )}
          </div>

          {popupBanner.couponCode && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-center">
              <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider block">
                Use Coupon Code at Checkout
              </span>
              <span className="text-base font-black font-mono text-amber-400 tracking-wider">
                {popupBanner.couponCode}
              </span>
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              onClick={handleDismiss}
              className="flex-1 py-2.5 rounded-xl bg-muted text-muted-foreground hover:text-foreground text-xs font-bold transition cursor-pointer"
            >
              Maybe Later
            </button>
            <button
              onClick={handleAction}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-xs font-black shadow-lg shadow-amber-500/20 transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>{popupBanner.buttonText || 'Claim Offer'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
