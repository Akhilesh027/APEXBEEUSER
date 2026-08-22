import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sun, Utensils, Coffee, Moon, Sparkles, Clock, ArrowRight } from 'lucide-react';
import { BannerData } from './DynamicHeroBanner';

const API_BASE = import.meta.env.VITE_API_URL || 'https://server.apexbee.in/api';

export const DynamicTimeOfDayBanners: React.FC<{ className?: string }> = ({ className = '' }) => {
  const navigate = useNavigate();
  const [banners, setBanners] = useState<BannerData[]>([]);
  const [loading, setLoading] = useState(true);

  // Compute current time slot
  const currentSlot = (() => {
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 22) return 'evening';
    return 'night';
  })();

  const slotInfo: Record<string, { label: string; icon: any; color: string }> = {
    morning: { label: 'Good Morning Breakfast Deals', icon: Sun, color: 'text-amber-400' },
    afternoon: { label: 'Afternoon Lunch Specials', icon: Utensils, color: 'text-orange-400' },
    evening: { label: 'Evening Snacks & Dinner Specials', icon: Coffee, color: 'text-rose-400' },
    night: { label: 'Late Night Cravings & Specials', icon: Moon, color: 'text-indigo-400' }
  };

  useEffect(() => {
    let isMounted = true;
    const fetchTimeBanners = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/banners?placement=time_of_day`);
        const data = await res.json();
        if (isMounted && data.success && Array.isArray(data.data)) {
          setBanners(data.data);
        }
      } catch (e) {
        console.error('Error fetching time of day banners:', e);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchTimeBanners();
    return () => {
      isMounted = false;
    };
  }, []);

  if (!loading && banners.length === 0) return null;

  const currentIcon = slotInfo[currentSlot]?.icon || Sparkles;
  const CurrentSlotIcon = currentIcon;

  return (
    <div className={`space-y-3.5 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <CurrentSlotIcon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-foreground tracking-tight">
              {slotInfo[currentSlot]?.label || 'Curated Time-of-Day Specials'}
            </h3>
            <p className="text-xs text-muted-foreground">
              Handpicked neighborhood offers freshly updated for this hour
            </p>
          </div>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {banners.map((item) => {
          const isCurrentSlot = (item as any).timeOfDaySlot === currentSlot || (item as any).type === currentSlot;

          return (
            <div
              key={item._id || item.title}
              onClick={() => {
                if (item._id) {
                  fetch(`${API_BASE}/banners/${item._id}/click`, { method: 'POST' }).catch(() => { });
                }
                navigate(item.link || '/');
              }}
              className={`group relative rounded-2xl overflow-hidden border transition-all duration-300 cursor-pointer bg-card flex flex-col justify-between shadow-sm hover:shadow-md ${isCurrentSlot
                ? 'border-amber-500/60 ring-1 ring-amber-500/30'
                : 'border-border hover:border-amber-500/40'
                }`}
            >
              {/* Image Section */}
              <div className="relative aspect-[16/10] w-full overflow-hidden bg-stone-900">
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  onError={(e: any) => {
                    e.target.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=600';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/40 to-transparent" />

                {/* Badges */}
                <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between">
                  {item.tag && (
                    <span className="px-2 py-0.5 rounded-md bg-amber-400 text-stone-950 text-[10px] font-black uppercase shadow">
                      {item.tag}
                    </span>
                  )}
                  {item.discount && (
                    <span className="px-2 py-0.5 rounded-md bg-stone-950/70 backdrop-blur text-emerald-300 text-[10px] font-extrabold border border-emerald-400/30 shadow">
                      {item.discount}
                    </span>
                  )}
                </div>

                {/* Bottom title on image */}
                <div className="absolute bottom-2.5 left-2.5 right-2.5 text-white">
                  <h4 className="text-sm font-bold leading-tight group-hover:text-amber-300 transition line-clamp-1">
                    {item.title}
                  </h4>
                </div>
              </div>

              {/* Card Footer Details */}
              <div className="p-3 bg-card flex items-center justify-between gap-2 border-t border-border/50">
                <p className="text-xs text-muted-foreground line-clamp-1 flex-1">
                  {item.subtitle || item.description || 'Explore local deals'}
                </p>

                <button className="p-1.5 rounded-lg bg-muted text-muted-foreground group-hover:bg-amber-500 group-hover:text-stone-950 transition shrink-0">
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
