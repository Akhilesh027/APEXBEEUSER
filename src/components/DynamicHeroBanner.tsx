import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Sparkles, Tag, ArrowRight, Clock, Copy, Check } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'https://server.apexbee.in/api';

export interface BannerData {
  _id: string;
  title: string;
  subtitle?: string;
  description?: string;
  imageUrl: string;
  mobileImageUrl?: string;
  placement: string;
  size: string;
  tag?: string;
  discount?: string;
  couponCode?: string;
  buttonText?: string;
  link: string;
  bgGradient?: string;
  order?: number;
}

interface DynamicHeroBannerProps {
  placement: 'home_hero' | 'food_hero' | 'services_hero' | 'stores_hero' | 'category_hero' | string;
  category?: string;
  defaultBanners?: BannerData[];
  className?: string;
  heightClass?: string;
}

export const DynamicHeroBanner: React.FC<DynamicHeroBannerProps> = ({
  placement,
  category,
  defaultBanners = [],
  className = '',
  heightClass = 'h-[250px] xs:h-[290px] sm:h-[360px] md:h-[420px] lg:h-[480px]'
}) => {
  const navigate = useNavigate();
  const [banners, setBanners] = useState<BannerData[]>(defaultBanners);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchHeroBanners = async () => {
      try {
        setLoading(true);
        let url = `${API_BASE}/banners?placement=${encodeURIComponent(placement)}`;
        if (category && category !== 'all') {
          url += `&category=${encodeURIComponent(category)}`;
        }

        const res = await fetch(url);
        const data = await res.json();

        if (isMounted && data.success && Array.isArray(data.data) && data.data.length > 0) {
          setBanners(data.data);
          setCurrentIndex(0);
        } else if (isMounted && defaultBanners.length > 0) {
          setBanners(defaultBanners);
        }
      } catch (err) {
        console.error(`Error fetching banners for ${placement}:`, err);
        if (isMounted && defaultBanners.length > 0) {
          setBanners(defaultBanners);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchHeroBanners();

    return () => {
      isMounted = false;
    };
  }, [placement, category]);

  // Auto advance carousel
  useEffect(() => {
    if (banners.length <= 1 || isPaused) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [banners.length, isPaused]);

  const handleBannerClick = (banner: BannerData) => {
    // Track click analytics in background
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

  const handleCopyCode = (e: React.MouseEvent, code: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  if (!loading && banners.length === 0) {
    return null;
  }

  const current = banners[currentIndex] || defaultBanners[0];
  if (!current) return null;

  return (
    <div
      className={`relative w-full overflow-hidden rounded-2xl md:rounded-3xl shadow-xl select-none group border border-border/40 ${heightClass} ${className}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background Image with smooth transition */}
      <img
        key={current._id || current.title}
        src={current.imageUrl}
        alt={current.title}
        className="absolute inset-0 w-full h-full object-cover transform scale-100 group-hover:scale-105 transition-transform duration-1000 ease-out"
        onError={(e: any) => {
          e.target.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1200';
        }}
      />

      {/* Dynamic Overlay Gradient - darker at the bottom for high text readability */}
      <div
        className={`absolute inset-0 bg-gradient-to-t from-stone-950/95 via-stone-950/60 to-black/20 opacity-95 transition-colors duration-700`}
      />

      {/* Aesthetic ambient lighting glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-stone-950/40 via-transparent to-transparent pointer-events-none" />

      {/* Content Container: Badges at top, Content & Buttons at bottom */}
      <div className="absolute inset-0 p-4 sm:p-6 md:p-8 flex flex-col justify-between z-10 text-white">
        {/* Top Badges (Up Side) */}
        <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
          {current.tag && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-amber-400 text-stone-950 text-[10px] sm:text-[11px] md:text-xs font-black uppercase tracking-wider shadow-lg animate-pulse">
              <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>{current.tag}</span>
            </div>
          )}

          {current.discount && (
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-white/20 backdrop-blur-md text-amber-300 border border-white/20 text-[10px] sm:text-[11px] md:text-xs font-extrabold shadow">
              <Tag className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>{current.discount}</span>
            </div>
          )}
        </div>

        {/* Down Side: Headline, Subtitle, CTA Buttons & Dots */}
        <div className="space-y-2 sm:space-y-2.5">
          <div className="max-w-xl md:max-w-2xl space-y-1 sm:space-y-1.5">
            <h2 className="text-base sm:text-2xl md:text-3.5xl font-black leading-tight tracking-tight text-white drop-shadow-md line-clamp-2">
              {current.title}
            </h2>

            {current.subtitle && (
              <p className="text-[11px] sm:text-xs md:text-sm text-stone-200 line-clamp-2 drop-shadow leading-relaxed">
                {current.subtitle}
              </p>
            )}

            {/* CTA Button & Coupon Row */}
            <div className="flex items-center gap-2 sm:gap-3 pt-0.5 sm:pt-1 flex-wrap">
              <button
                onClick={() => handleBannerClick(current)}
                className="px-4 py-2 sm:px-6 sm:py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 text-xs sm:text-sm font-black transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-xl shadow-amber-500/20 flex items-center gap-1.5 sm:gap-2 cursor-pointer"
              >
                <span>{current.buttonText || 'Explore Now'}</span>
                <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>

              {current.couponCode && (
                <button
                  onClick={(e) => handleCopyCode(e, current.couponCode!)}
                  className="px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-stone-900/80 hover:bg-stone-900 backdrop-blur border border-amber-400/40 text-amber-300 text-[10px] sm:text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <span>CODE: {current.couponCode}</span>
                  {copiedCode === current.couponCode ? (
                    <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-300" />
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Carousel Navigation Dots & Controls */}
          {banners.length > 1 && (
            <div className="flex items-center justify-between pt-1.5 sm:pt-2">
              {/* Dots */}
              <div className="flex items-center gap-1.5">
                {banners.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-1.5 sm:h-2 rounded-full transition-all duration-300 cursor-pointer ${
                      currentIndex === idx ? 'w-6 sm:w-8 bg-amber-400' : 'w-1.5 sm:w-2 bg-white/40 hover:bg-white/70'
                    }`}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>

              {/* Left / Right Arrow Buttons */}
              <div className="hidden sm:flex items-center gap-2">
                <button
                  onClick={() =>
                    setCurrentIndex((prev) => (prev === 0 ? banners.length - 1 : prev - 1))
                  }
                  className="p-1.5 sm:p-2 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur text-white border border-white/20 transition cursor-pointer"
                  aria-label="Previous Slide"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentIndex((prev) => (prev + 1) % banners.length)}
                  className="p-1.5 sm:p-2 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur text-white border border-white/20 transition cursor-pointer"
                  aria-label="Next Slide"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
