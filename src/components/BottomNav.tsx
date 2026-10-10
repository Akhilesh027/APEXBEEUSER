import { useLocation, useNavigate } from "react-router-dom";
import { MessageSquare, Bot, Coins } from "lucide-react";
import { useState, useEffect } from "react";

export const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Hide BottomNav on focused purchase/detail pages to eliminate dual bottom bars and screen clutter
  const isHidden =
    location.pathname.startsWith("/checkout") ||
    location.pathname.startsWith("/cart") ||
    location.pathname.startsWith("/product/") ||
    location.pathname.startsWith("/pay/");

  const [cartCount, setCartCount] = useState(0);
  const [ordersCount, setOrdersCount] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isBeeMenuOpen, setIsBeeMenuOpen] = useState(false);

  useEffect(() => {
    const syncAuthStateAndCounts = () => {
      try {
        const userStr = localStorage.getItem("user");
        const token = localStorage.getItem("token");

        const hasToken = Boolean(token && token !== "undefined" && token !== "null" && token.trim() !== "");
        let hasValidUser = false;

        if (userStr && userStr !== "undefined" && userStr !== "null" && userStr.trim() !== "") {
          try {
            const parsed = JSON.parse(userStr);
            if (parsed && typeof parsed === "object") {
              hasValidUser = Boolean(parsed._id || parsed.id || parsed.email || parsed.phone || parsed.name);
            }
          } catch {
            hasValidUser = false;
          }
        }

        setIsLoggedIn(hasToken || hasValidUser);
      } catch {
        setIsLoggedIn(false);
      }

      try {
        const localCart = localStorage.getItem("local_cart");
        if (localCart) {
          const items = JSON.parse(localCart);
          if (Array.isArray(items)) {
            const sum = items.reduce((a: number, b: any) => a + (Number(b.quantity) || 1), 0);
            setCartCount(sum);
          } else {
            setCartCount(0);
          }
        } else {
          setCartCount(0);
        }
      } catch {
        setCartCount(0);
      }

      try {
        const storedOrders = localStorage.getItem("orders_count");
        if (storedOrders) {
          setOrdersCount(Number(storedOrders) || 0);
        }
      } catch {
        setOrdersCount(0);
      }
    };

    syncAuthStateAndCounts();

    const handleSync = () => {
      syncAuthStateAndCounts();
    };

    window.addEventListener("storage", handleSync);
    window.addEventListener("auth_state_changed", handleSync);
    window.addEventListener("user_logged_in", handleSync);
    window.addEventListener("user_logged_out", handleSync);
    window.addEventListener("cart_updated", handleSync);
    window.addEventListener("orders_updated", handleSync);

    return () => {
      window.removeEventListener("storage", handleSync);
      window.removeEventListener("auth_state_changed", handleSync);
      window.removeEventListener("user_logged_in", handleSync);
      window.removeEventListener("user_logged_out", handleSync);
      window.removeEventListener("cart_updated", handleSync);
      window.removeEventListener("orders_updated", handleSync);
    };
  }, [location.pathname]);

  // Auto-close BeeHub menu when page is scrolled
  useEffect(() => {
    if (!isBeeMenuOpen) return;

    const handleScroll = () => {
      setIsBeeMenuOpen(false);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isBeeMenuOpen]);

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

  if (isHidden) {
    return null;
  }

  // Active route helpers
  const isHomeActive = location.pathname === "/";
  const isCategoriesActive =
    location.pathname.startsWith("/category") ||
    location.pathname.startsWith("/categories") ||
    location.pathname.startsWith("/subcategories");
  const isOrdersActive =
    location.pathname.startsWith("/my-orders") ||
    location.pathname.startsWith("/track-order");
  const isAccountActive =
    location.pathname.startsWith("/profile") ||
    location.pathname.startsWith("/account") ||
    location.pathname.startsWith("/login");

  return (
    <>
      {/* 🔮 Deep Backdrop Blur Overlay when BeeHub menu is open */}
      {isBeeMenuOpen && (
        <div
          onClick={() => setIsBeeMenuOpen(false)}
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-md transition-all duration-300 animate-in fade-in cursor-pointer"
        />
      )}

      {/* 📱 MOBILE FLOATING BOTTOM NAVBAR */}
      <nav
        aria-label="Mobile Bottom Navigation"
        className="lg:hidden fixed bottom-3 left-0 right-0 z-50 px-3 pointer-events-none select-none font-sans"
        style={{ paddingBottom: "max(0.2rem, env(safe-area-inset-bottom))" }}
      >
        <div className="relative max-w-md mx-auto pointer-events-auto">

          {/* 🚀 FAN-OUT SPEED DIAL (LEFT, CENTER, RIGHT) SPROUTING FROM BEE BUTTON */}
          <div className="absolute left-1/2 -translate-x-1/2 bottom-12 z-50 pointer-events-none">
            {/* 1. LEFT: WhatsApp Chat */}
            <button
              type="button"
              onClick={handleOpenWhatsApp}
              className={`absolute left-1/2 bottom-0 -translate-x-1/2 flex flex-col items-center justify-center gap-1 transition-all duration-300 cursor-pointer border-none bg-transparent ${
                isBeeMenuOpen
                  ? "opacity-100 -translate-x-28 -translate-y-16 scale-100 pointer-events-auto"
                  : "opacity-0 translate-x-0 translate-y-0 scale-50 pointer-events-none"
              }`}
              style={{ transitionDelay: isBeeMenuOpen ? "100ms" : "0ms" }}
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white flex items-center justify-center shadow-xl shadow-emerald-500/40 ring-2 ring-white group hover:scale-110 active:scale-95 transition-transform">
                <MessageSquare className="w-5 h-5 fill-white text-white" />
              </div>
              <span className="text-[10px] font-black text-white bg-[#0A1629]/95 px-2 py-0.5 rounded-full shadow-md whitespace-nowrap">
                WhatsApp
              </span>
            </button>

            {/* 2. CENTER: Abhi AI Assistant */}
            <button
              type="button"
              onClick={handleOpenAbhiAssistant}
              className={`absolute left-1/2 bottom-0 -translate-x-1/2 flex flex-col items-center justify-center gap-1.5 transition-all duration-300 cursor-pointer border-none bg-transparent ${
                isBeeMenuOpen
                  ? "opacity-100 -translate-x-1/2 -translate-y-28 scale-100 pointer-events-auto"
                  : "opacity-0 -translate-x-1/2 translate-y-0 scale-50 pointer-events-none"
              }`}
              style={{ transitionDelay: isBeeMenuOpen ? "150ms" : "0ms" }}
            >
              <div className="w-14 h-14 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-2xl shadow-blue-500/50 ring-4 ring-white group hover:scale-110 active:scale-95 transition-transform relative">
                <Bot className="w-7 h-7 text-white animate-pulse" />
                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-cyan-500 border border-white text-[8px] font-black items-center justify-center text-white">✨</span>
                </span>
              </div>
              <span className="text-[11px] font-black text-white bg-[#0A1629] px-3 py-1 rounded-full shadow-lg border border-blue-400/40 whitespace-nowrap tracking-wide">
                Abhi AI 🤖
              </span>
            </button>

            {/* 3. RIGHT: Earn Money */}
            <button
              type="button"
              onClick={handleOpenEarn}
              className={`absolute left-1/2 bottom-0 -translate-x-1/2 flex flex-col items-center justify-center gap-1 transition-all duration-300 cursor-pointer border-none bg-transparent ${
                isBeeMenuOpen
                  ? "opacity-100 translate-x-14 -translate-y-16 scale-100 pointer-events-auto"
                  : "opacity-0 translate-x-0 translate-y-0 scale-50 pointer-events-none"
              }`}
              style={{ transitionDelay: isBeeMenuOpen ? "50ms" : "0ms" }}
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-[#0A1629] flex items-center justify-center shadow-xl shadow-amber-500/40 ring-2 ring-white group hover:scale-110 active:scale-95 transition-transform">
                <Coins className="w-5 h-5 stroke-[2.5px] text-[#0A1629]" />
              </div>
              <span className="text-[10px] font-black text-white bg-[#0A1629]/95 px-2 py-0.5 rounded-full shadow-md whitespace-nowrap">
                Earn Money
              </span>
            </button>
          </div>

          {/* 🌟 THE PILL BOTTOM NAVIGATION BAR */}
          <div className="relative h-[60px] bg-[#0A1629] rounded-full shadow-[0_8px_32px_rgba(2,8,20,0.5)] border border-slate-700/40 flex items-center justify-between px-2 sm:px-4">

            {/* 1. HOME */}
            <button
              type="button"
              onClick={() => navigate("/")}
              className={`flex-1 flex flex-col items-center justify-center py-1 transition-all duration-200 cursor-pointer border-none bg-transparent active:scale-95 ${
                isHomeActive ? "text-[#FAB915]" : "text-[#D2D9E5] hover:text-white"
              }`}
              aria-label="Home"
            >
              <div className="relative">
                <svg
                  className="w-[21px] h-[21px]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={isHomeActive ? "2.2" : "1.8"}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 10.5 12 3l9 7.5v9.5a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 20Z" />
                  <path d="M9 21v-7a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v7" />
                </svg>
              </div>
              <span
                className={`text-[10px] mt-0.5 tracking-tight leading-none ${
                  isHomeActive ? "font-bold text-[#FAB915]" : "font-medium text-[#D2D9E5]"
                }`}
              >
                Home
              </span>
            </button>

            {/* 2. CATEGORIES */}
            <button
              type="button"
              onClick={() => navigate("/categories")}
              className={`flex-1 flex flex-col items-center justify-center py-1 transition-all duration-200 cursor-pointer border-none bg-transparent active:scale-95 ${
                isCategoriesActive ? "text-[#FAB915]" : "text-[#D2D9E5] hover:text-white"
              }`}
              aria-label="Categories"
            >
              <div className="relative">
                <svg
                  className="w-[21px] h-[21px]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={isCategoriesActive ? "2.2" : "1.8"}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="3" width="7" height="7" rx="2" />
                  <rect x="14" y="3" width="7" height="7" rx="2" />
                  <rect x="3" y="14" width="7" height="7" rx="2" />
                  <rect x="14" y="14" width="7" height="7" rx="2" />
                </svg>
              </div>
              <span
                className={`text-[10px] mt-0.5 tracking-tight leading-none ${
                  isCategoriesActive ? "font-bold text-[#FAB915]" : "font-medium text-[#D2D9E5]"
                }`}
              >
                Categories
              </span>
            </button>

            {/* 3. CENTER HEXAGON BEE BUTTON (PROTRUDING) */}
            <div className="relative flex-none flex items-center justify-center px-1">
              {/* Downward notch / contour in the navy bar hugging the bottom vertex */}
              <div className="absolute -bottom-1.5 w-7 h-3 bg-[#0A1629] rotate-45 rounded-sm -z-10" />

              <button
                type="button"
                onClick={() => setIsBeeMenuOpen((v) => !v)}
                className="relative -mt-6.5 cursor-pointer border-none bg-transparent flex flex-col items-center justify-center group focus:outline-none active:scale-95 transition-transform"
                aria-label="ApexBee Hub"
              >
                <div
                  className={`relative w-[60px] h-[66px] flex items-center justify-center filter drop-shadow-[0_5px_12px_rgba(0,0,0,0.4)] transition-all duration-300 ${
                    isBeeMenuOpen ? "scale-105 rotate-12" : "group-hover:scale-105"
                  }`}
                >
                  <svg
                    viewBox="0 0 62 68"
                    className="w-full h-full overflow-visible"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    {/* Outer Navy Collar / Crest */}
                    <polygon
                      points="31,1.5 59.5,17 59.5,51 31,66.5 2.5,51 2.5,17"
                      fill="#0A1629"
                      stroke="#0A1629"
                      strokeWidth="3"
                      strokeLinejoin="round"
                    />

                    {/* Golden Honeycomb Hexagon Interior */}
                    <polygon
                      points="31,4.5 56.5,18.5 56.5,49.5 31,63.5 5.5,49.5 5.5,18.5"
                      fill="#FAB915"
                      stroke="#FAB915"
                      strokeWidth="1.5"
                      strokeLinejoin="round"
                    />

                    {/* 🐝 Vector Bee Mascot */}
                    {/* Left Antenna */}
                    <path
                      d="M28 22 C26.5 17 24 16 22 13.5"
                      stroke="#0A1629"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      fill="none"
                    />
                    <circle cx="21.5" cy="13" r="1.6" fill="#0A1629" />

                    {/* Right Antenna */}
                    <path
                      d="M34 22 C35.5 17 38 16 40 13.5"
                      stroke="#0A1629"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      fill="none"
                    />
                    <circle cx="40.5" cy="13" r="1.6" fill="#0A1629" />

                    {/* Left Wing */}
                    <ellipse
                      cx="18"
                      cy="33.5"
                      rx="8.5"
                      ry="5.5"
                      fill="#FAB915"
                      stroke="#0A1629"
                      strokeWidth="2.2"
                      transform="rotate(-18 18 33.5)"
                    />

                    {/* Right Wing */}
                    <ellipse
                      cx="44"
                      cy="33.5"
                      rx="8.5"
                      ry="5.5"
                      fill="#FAB915"
                      stroke="#0A1629"
                      strokeWidth="2.2"
                      transform="rotate(18 44 33.5)"
                    />

                    {/* Bee Head */}
                    <ellipse cx="31" cy="24.5" rx="7" ry="6" fill="#0A1629" />
                    {/* Head Eyes */}
                    <ellipse cx="28.8" cy="23.8" rx="1" ry="1.3" fill="#FAB915" />
                    <ellipse cx="33.2" cy="23.8" rx="1" ry="1.3" fill="#FAB915" />
                    {/* Smile */}
                    <path
                      d="M29.5 26.8 Q31 28.2 32.5 26.8"
                      stroke="#FAB915"
                      strokeWidth="1"
                      strokeLinecap="round"
                      fill="none"
                    />

                    {/* Bee Body (Navy Base) */}
                    <path
                      d="M24.5 29.5 C24 36.5 26 43.5 31 47 C36 43.5 38 36.5 37.5 29.5 Z"
                      fill="#0A1629"
                    />

                    {/* Body Yellow Stripe 1 */}
                    <path
                      d="M24.8 34 C27 35.8 35 35.8 37.2 34 L37 37 C34.5 38.8 27.5 38.8 25 37 Z"
                      fill="#FAB915"
                    />

                    {/* Body Yellow Stripe 2 */}
                    <path
                      d="M26.2 40 C28 41.5 34 41.5 35.8 40 L35 42.6 C33.2 44 28.8 44 27 42.6 Z"
                      fill="#FAB915"
                    />

                    {/* Stinger */}
                    <polygon points="29.8,46 32.2,46 31,49" fill="#0A1629" />
                  </svg>
                </div>
              </button>
            </div>

            {/* 4. ORDERS */}
            <button
              type="button"
              onClick={() => navigate("/my-orders")}
              className={`flex-1 flex flex-col items-center justify-center py-1 transition-all duration-200 cursor-pointer border-none bg-transparent active:scale-95 ${
                isOrdersActive ? "text-[#FAB915]" : "text-[#D2D9E5] hover:text-white"
              }`}
              aria-label="Orders"
            >
              <div className="relative">
                <svg
                  className="w-[21px] h-[21px]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={isOrdersActive ? "2.2" : "1.8"}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="4" y="4" width="16" height="17" rx="3" />
                  <path d="M9 2h6a1 1 0 0 1 1 1v2H8V3a1 1 0 0 1 1-1Z" />
                  <line x1="8" y1="10" x2="16" y2="10" />
                  <line x1="8" y1="14" x2="14" y2="14" />
                </svg>
                {ordersCount > 0 && (
                  <span className="absolute -top-1 -right-2 bg-[#FAB915] text-[#0A1629] text-[9px] font-black rounded-full min-w-3.5 h-3.5 px-0.5 flex items-center justify-center shadow-sm">
                    {ordersCount}
                  </span>
                )}
              </div>
              <span
                className={`text-[10px] mt-0.5 tracking-tight leading-none ${
                  isOrdersActive ? "font-bold text-[#FAB915]" : "font-medium text-[#D2D9E5]"
                }`}
              >
                Orders
              </span>
            </button>

            {/* 5. ACCOUNT */}
            <button
              type="button"
              onClick={() => navigate(isLoggedIn ? "/profile" : "/login")}
              className={`flex-1 flex flex-col items-center justify-center py-1 transition-all duration-200 cursor-pointer border-none bg-transparent active:scale-95 ${
                isAccountActive ? "text-[#FAB915]" : "text-[#D2D9E5] hover:text-white"
              }`}
              aria-label="Account"
            >
              <div className="relative">
                <svg
                  className="w-[21px] h-[21px]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={isAccountActive ? "2.2" : "1.8"}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="7" r="4" />
                  <path d="M5.5 21a6.5 6.5 0 0 1 13 0" />
                </svg>
              </div>
              <span
                className={`text-[10px] mt-0.5 tracking-tight leading-none ${
                  isAccountActive ? "font-bold text-[#FAB915]" : "font-medium text-[#D2D9E5]"
                }`}
              >
                Account
              </span>
            </button>

          </div>
        </div>
      </nav>
    </>
  );
};

export default BottomNav;
