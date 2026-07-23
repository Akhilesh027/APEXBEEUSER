import { useLocation, useNavigate } from "react-router-dom";
import { Home, LayoutGrid, Package, User, MessageSquare, Bot, Coins } from "lucide-react";
import { useState, useEffect } from "react";

export const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [cartCount, setCartCount] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isBeeMenuOpen, setIsBeeMenuOpen] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    setIsLoggedIn(!!userStr);

    const updateCounts = () => {
      const localCart = localStorage.getItem("local_cart");
      if (localCart) {
        try {
          const items = JSON.parse(localCart);
          if (Array.isArray(items)) {
            const sum = items.reduce((a, b) => a + (b.quantity || 1), 0);
            setCartCount(sum);
          }
        } catch {}
      }
    };

    updateCounts();
    window.addEventListener("storage", updateCounts);
    return () => window.removeEventListener("storage", updateCounts);
  }, []);

  const navItems = [
    {
      label: "Home",
      path: "/",
      icon: Home,
      isBee: false,
    },
    {
      label: "Categories",
      path: "/categories",
      icon: LayoutGrid,
      isBee: false,
    },
    {
      label: "ApexBee",
      path: "",
      isBee: true,
    },
    {
      label: "Orders",
      path: "/my-orders",
      icon: Package,
      badge: cartCount > 0 ? cartCount : undefined,
      isBee: false,
    },
    {
      label: isLoggedIn ? "Account" : "Login",
      path: isLoggedIn ? "/profile" : "/login",
      icon: User,
      isBee: false,
    },
  ];

  const handleOpenWhatsApp = () => {
    setIsBeeMenuOpen(false);
    window.open("https://wa.me/919999999999?text=Hello%20ApexBee%20Support!", "_blank");
  };

  const handleOpenAbhiAssistant = () => {
    setIsBeeMenuOpen(false);
    window.dispatchEvent(new CustomEvent("open_abhi_assistant"));
  };

  const handleOpenEarn = () => {
    setIsBeeMenuOpen(false);
    navigate("/earn-with-apexbee");
  };

  return (
    <>
      {/* Backdrop overlay when speed dial is open */}
      {isBeeMenuOpen && (
        <div
          onClick={() => setIsBeeMenuOpen(false)}
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-xs transition-opacity duration-300"
        />
      )}

      {/* 📱 MOBILE BOTTOM NAVBAR */}
      <nav aria-label="Mobile Bottom Navigation" className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200/80 shadow-[0_-4px_25px_rgba(0,0,0,0.08)] px-2 py-2 font-sans">
        <div className="flex items-center justify-around max-w-md mx-auto relative">

          {/* 🚀 FAN-OUT SPEED DIAL (LEFT, CENTER, RIGHT) SPROUTING FROM APEXBEE */}
          <div className="absolute left-1/2 -translate-x-1/2 bottom-9 z-50 pointer-events-none">
            {/* 1. LEFT: WhatsApp Chat */}
            <button
              type="button"
              onClick={handleOpenWhatsApp}
              className={`absolute left-1/2 bottom-0 -translate-x-1/2 flex flex-col items-center justify-center gap-1 transition-all duration-300 cursor-pointer border-none bg-transparent ${
                isBeeMenuOpen
                  ? "opacity-100 -translate-x-28 -translate-y-20 scale-100 pointer-events-auto"
                  : "opacity-0 translate-x-0 translate-y-0 scale-50 pointer-events-none"
              }`}
              style={{ transitionDelay: isBeeMenuOpen ? "100ms" : "0ms" }}
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white flex items-center justify-center shadow-xl shadow-emerald-500/40 ring-2 ring-white group hover:scale-110 transition-transform">
                <MessageSquare className="w-6 h-6 fill-white text-white" />
              </div>
              <span className="text-[10px] font-black text-white bg-[#0A1128]/90 px-2 py-0.5 rounded-full shadow-md whitespace-nowrap">
                WhatsApp
              </span>
            </button>

            {/* 2. CENTER: Abhi AI Assistant (Enlarged Hero Action) */}
            <button
              type="button"
              onClick={handleOpenAbhiAssistant}
              className={`absolute left-1/2 bottom-0 -translate-x-1/2 flex flex-col items-center justify-center gap-1.5 transition-all duration-300 cursor-pointer border-none bg-transparent ${
                isBeeMenuOpen
                  ? "opacity-100 -translate-x-1/2 -translate-y-32 scale-100 pointer-events-auto"
                  : "opacity-0 -translate-x-1/2 translate-y-0 scale-50 pointer-events-none"
              }`}
              style={{ transitionDelay: isBeeMenuOpen ? "150ms" : "0ms" }}
            >
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-2xl shadow-blue-500/50 ring-4 ring-white group hover:scale-110 transition-transform relative">
                <Bot className="w-8 h-8 text-white animate-pulse" />
                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-cyan-500 border border-white text-[8px] font-black items-center justify-center text-white">✨</span>
                </span>
              </div>
              <span className="text-[11px] font-black text-white bg-[#0A1128] px-3 py-1 rounded-full shadow-lg border border-blue-400/40 whitespace-nowrap tracking-wide">
                Abhi AI 🤖
              </span>
            </button>

            {/* 3. RIGHT: Earn Money */}
            <button
              type="button"
              onClick={handleOpenEarn}
              className={`absolute left-1/2 bottom-0 -translate-x-1/2 flex flex-col items-center justify-center gap-1 transition-all duration-300 cursor-pointer border-none bg-transparent ${
                isBeeMenuOpen
                  ? "opacity-100 translate-x-12 -translate-y-20 scale-100 pointer-events-auto"
                  : "opacity-0 translate-x-0 translate-y-0 scale-50 pointer-events-none"
              }`}
              style={{ transitionDelay: isBeeMenuOpen ? "50ms" : "0ms" }}
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-[#0A1128] flex items-center justify-center shadow-xl shadow-amber-500/40 ring-2 ring-white group hover:scale-110 transition-transform">
                <Coins className="w-6 h-6 stroke-[2.5px] text-[#0A1128]" />
              </div>
              <span className="text-[10px] font-black text-white bg-[#0A1128]/90 px-2 py-0.5 rounded-full shadow-md whitespace-nowrap">
                Earn Money
              </span>
            </button>
          </div>

          {navItems.map((item) => {
            if (item.isBee) {
              return (
                <button
                  key="bee-center-btn"
                  onClick={() => setIsBeeMenuOpen((v) => !v)}
                  className="flex flex-col items-center justify-center -mt-5 cursor-pointer border-none bg-transparent group z-50 relative"
                >
                  <div
                    className={`w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-400 via-yellow-400 to-amber-500 text-[#0A1128] flex items-center justify-center text-2xl font-black shadow-lg shadow-amber-500/35 ring-4 ring-white transition-all duration-300 ${
                      isBeeMenuOpen ? "scale-110 rotate-45 ring-amber-400" : "group-hover:scale-105"
                    }`}
                  >
                    🐝
                  </div>
                  <span className="text-[10px] mt-1 tracking-tight leading-none font-black text-amber-600">
                    ApexBee
                  </span>
                </button>
              );
            }

            const Icon = item.icon!;
            const isActive =
              item.path === "/"
                ? location.pathname === "/"
                : location.pathname.startsWith(item.path);

            return (
              <button
                key={item.label}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all duration-200 cursor-pointer border-none bg-transparent relative ${
                  isActive
                    ? "text-[#0A1128] font-bold scale-105"
                    : "text-slate-400 hover:text-slate-600 font-medium"
                }`}
              >
                <div className="relative flex items-center justify-center">
                  <Icon
                    className={`w-5 h-5 transition-transform duration-200 ${
                      isActive ? "stroke-[2.5px] text-[#0A1128]" : "stroke-[1.8px] text-slate-400"
                    }`}
                  />
                  {item.badge ? (
                    <span className="absolute -top-1.5 -right-2.5 bg-[#F3BA12] text-[#0A1128] text-[9px] font-black rounded-full w-4 h-4 flex items-center justify-center shadow-sm">
                      {item.badge}
                    </span>
                  ) : null}
                </div>
                <span
                  className={`text-[10px] mt-1 tracking-tight leading-none ${
                    isActive ? "text-[#0A1128] font-black" : "text-slate-500 font-semibold"
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};

export default BottomNav;
