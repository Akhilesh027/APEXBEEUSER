import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import { BannerData } from './DynamicHeroBanner';

const API_BASE = import.meta.env.VITE_API_URL || 'https://server.apexbee.in/api';

interface DynamicBannerStripProps {
  placement?: string;
  defaultBanner?: Partial<BannerData>;
  className?: string;
}

export const DynamicBannerStrip: React.FC<DynamicBannerStripProps> = ({
  placement = 'home_strip',
  defaultBanner = {
    title: 'ApexBee 0% Platform Fee Model • 100% Direct Store Connect',
    subtitle: 'Zero commission means lower prices for you and honest earnings for local merchants.',
    tag: 'APEX GUARANTEE',
    discount: 'BEST PRICE PROMISE',
    buttonText: 'Learn How It Works',
    link: '/earn-with-apexbee'
  },
  className = ''
}) => {
  const navigate = useNavigate();
  const [banner, setBanner] = useState<BannerData | null>(defaultBanner as any);

  useEffect(() => {
    let isMounted = true;
    const fetchStrip = async () => {
      try {
        const res = await fetch(`${API_BASE}/banners?placement=${encodeURIComponent(placement)}`);
        const data = await res.json();
        if (isMounted && data.success && Array.isArray(data.data) && data.data.length > 0) {
          setBanner(data.data[0]);
        }
      } catch (err) {
        console.error('Error fetching banner strip:', err);
      }
    };
    fetchStrip();
    return () => {
      isMounted = false;
    };
  }, [placement]);

  if (!banner) return null;

  const handleClick = () => {
    if (banner._id) {
      fetch(`${API_BASE}/banners/${banner._id}/click`, { method: 'POST' }).catch(() => { });
    }
    if (banner.link) {
      if (banner.link.startsWith('http://') || banner.link.startsWith('https://')) {
        window.open(banner.link, '_blank');
      } else {
        navigate(banner.link);
      }
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-600 via-orange-600 to-rose-700 text-white p-4 sm:p-5 md:p-6 shadow-lg border border-amber-400/20 cursor-pointer group transition-all duration-300 hover:shadow-amber-500/20 hover:scale-[1.008] ${className}`}
    >
      {/* Background Decorative Pattern */}
      <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition duration-700" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5 max-w-2xl">
          <div className="flex items-center gap-2 flex-wrap">
            {banner.tag && (
              <span className="px-2.5 py-0.5 rounded-full bg-stone-950/40 backdrop-blur text-[10px] md:text-xs font-black uppercase text-amber-200 border border-amber-300/30 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-amber-400" />
                {banner.tag}
              </span>
            )}
            {banner.discount && (
              <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] md:text-xs font-extrabold text-white">
                {banner.discount}
              </span>
            )}
          </div>

          <h3 className="text-base sm:text-lg md:text-xl font-black tracking-tight text-white leading-snug">
            {banner.title}
          </h3>

          {banner.subtitle && (
            <p className="text-xs sm:text-sm text-stone-100/90 leading-relaxed">
              {banner.subtitle}
            </p>
          )}
        </div>

        <div className="shrink-0">
          <button className="px-5 py-2.5 rounded-xl bg-white text-stone-950 text-xs sm:text-sm font-black transition group-hover:bg-amber-100 flex items-center gap-2 shadow-md">
            <span>{banner.buttonText || 'Explore Now'}</span>
            <ArrowRight className="w-4 h-4 text-stone-950 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};
