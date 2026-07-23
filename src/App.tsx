import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import ScrollToTop from "./components/ScrollToTop";

import Home from "./pages/Home";
import Fashion from "./pages/Category";
import CategoryPage from "./pages/Category";
import Grocery from "./pages/Grocery";
import ProductDetail from "./pages/ProductDetail";
import Login from "./pages/Login";
import Account from "./pages/Account";
import Cart from "./pages/Cart";
import MyOrders from "./pages/MyOrders";
import SuperVendor from "./pages/LocalStores";
import Referrals from "./pages/Referrals";
import NotFound from "./pages/NotFound";
import Checkout from "./pages/Checkout";
import OrderSuccess from "./components/OrderSuccess";
import Profile from "./pages/Profile";
import Wishlist from "./pages/Wishlist";
import Register from "./pages/Register";
import StorePage from "./pages/Vendors";
import ProductsPage from "./pages/Product";
import ForgotPasswordOtp from "./pages/ForgotPasswordOtp";
import Wallet from "./pages/Wallet";
import EarnWithApexBee from "./pages/EarnWithApexBee";
import Academy from "./pages/Academy";
import Services from "./pages/Services";
import Travel from "./pages/Travel";
import Community from "./pages/Community";
import TrackOrder from "./pages/TrackOrder";
import AdminReviews from "./pages/AdminReviews";
import AdminPersonalization from "./pages/AdminPersonalization";
import AbhiAssistant from "./components/AbhiAssistant";
import LocalStores from "./pages/LocalStores";
import BottomNav from "./components/BottomNav";
import InstallPwaBanner from "./components/InstallPwaBanner";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000, // 30 seconds
      gcTime: 300000,    // 5 minutes
      cacheTime: 300000, // fallback
      refetchOnWindowFocus: false, // do not re-request when user returns to window/tab
      retry: 1,
    },
  },
});

/**
 * Auth guard — checks localStorage for token + user.
 * If not logged in, redirects to /login with a return URL.
 */
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem("token");
  const user = localStorage.getItem("user");
  if (!token || !user) {
    const returnUrl = window.location.pathname + window.location.search;
    return <Navigate to={`/login?redirect=${encodeURIComponent(returnUrl)}`} replace />;
  }
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />

      <BrowserRouter>
        {/* Automatically scrolls to top on every route change */}
        <ScrollToTop />

        <Routes>
          {/* ===== Public Routes — accessible without login ===== */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPasswordOtp />} />
          <Route path="/fashion" element={<Fashion />} />
          <Route path="/sarees" element={<Navigate to="/category/Sarees" replace />} />
          <Route path="/jewelry" element={<Navigate to="/category/Jewelry" replace />} />
          <Route path="/grocery" element={<Grocery />} />
          <Route path="/electronics" element={<Navigate to="/category/Electronics" replace />} />
          <Route path="/furniture" element={<Navigate to="/category/Furniture" replace />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/business/:id" element={<StorePage />} />
          <Route path="/local-stores" element={<LocalStores />} />
          <Route path="/categories" element={<CategoryPage />} />
          <Route path="/category" element={<CategoryPage />} />
          <Route path="/category/:categoryName" element={<CategoryPage />} />
          <Route path="/earn-with-apexbee" element={<EarnWithApexBee />} />
          <Route path="/academy" element={<Academy />} />
          <Route path="/services" element={<Services />} />
          <Route path="/travel" element={<Travel />} />
          <Route path="/community" element={<Community />} />

          {/* ===== Protected Routes — require login ===== */}
          <Route path="/account" element={<ProtectedRoute><Account /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
          <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
          <Route path="/order-success" element={<ProtectedRoute><OrderSuccess /></ProtectedRoute>} />
          <Route path="/my-orders" element={<ProtectedRoute><MyOrders /></ProtectedRoute>} />
          <Route path="/track-order/:orderId" element={<ProtectedRoute><TrackOrder /></ProtectedRoute>} />
          <Route path="/wallet" element={<ProtectedRoute><Wallet /></ProtectedRoute>} />
          <Route path="/referrals" element={<ProtectedRoute><Referrals /></ProtectedRoute>} />
          <Route path="/wishlist" element={<ProtectedRoute><Wishlist /></ProtectedRoute>} />
          <Route path="/admin/reviews" element={<ProtectedRoute><AdminReviews /></ProtectedRoute>} />
          <Route path="/admin/personalization" element={<ProtectedRoute><AdminPersonalization /></ProtectedRoute>} />

          {/* ===== Catch-all ===== */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <AbhiAssistant />
        <InstallPwaBanner />
        <BottomNav />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;