import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Package, Lock, Gift, Home, Briefcase, CreditCard, User, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Account = () => {
  const navigate = useNavigate();
  const [walletBalance, setWalletBalance] = useState(0);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userId = user._id || user.id;

  useEffect(() => {
    if (!userId) return;
    const fetchWallet = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
        const res = await fetch(`http://localhost:5500/api/user/wallet/${userId}`, { headers });
        const data = await res.json();
        if (res.ok && data?.wallet) {
          setWalletBalance(data.wallet.balance || 0);
        }
      } catch (err) {
        console.error("Wallet fetch error:", err);
      }
    };
    fetchWallet();
  }, [userId]);

  return (
    <div className="min-h-screen bg-[#F4F6FA] text-[#0E1630]">
      <Navbar />

      <div className="container mx-auto px-4 py-8 pb-20">
        <h1 className="text-2xl sm:text-3xl font-black text-navy mb-6 text-left">Your Account</h1>

        {/* User Info */}
        <div className="bg-white border border-gray-150 rounded-3xl p-6 mb-8 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center border border-gray-100 shrink-0">
                <User className="h-8 w-8 text-navy" />
              </div>
              <div className="text-left">
                <h2 className="text-xl sm:text-2xl font-black text-navy">{user.name || "User"}</h2>
                <p className="text-xs sm:text-sm text-gray-500">{user.email || user.mobile || "Welcome to your account"}</p>
              </div>
            </div>
            <button
              onClick={() => navigate("/profile")}
              className="bg-[#F3BA12] hover:bg-[#e0ab10] text-[#0A1128] font-bold text-xs px-4 py-2 rounded-xl transition active:scale-95 shadow-sm"
            >
              Edit Profile
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-slate-50 rounded-2xl p-4 border border-gray-100 text-left">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-gray-600">My income</span>
                <span className="text-navy font-black text-sm">Rs. {walletBalance}</span>
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 border border-gray-100 cursor-pointer text-left hover:border-gray-300 transition" onClick={() => navigate("/referrals")}>
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-gray-600">Wallet Balance</span>
                <span className="text-[#F3BA12] font-black text-sm">Rs. {walletBalance}</span>
              </div>
            </div>

            <div className="bg-[#0A1128] text-white rounded-2xl p-4 cursor-pointer text-left hover:bg-[#121B46] transition" onClick={() => navigate("/referrals")}>
              <div className="flex flex-col">
                <span className="text-lg font-black mb-0.5">Rs. {walletBalance}</span>
                <span className="text-[10px] text-gray-400 font-semibold">Available Reward</span>
              </div>
            </div>
          </div>

          <div className="mt-6 bg-[#0A1128] text-white rounded-2xl p-5 border border-white/10 text-left relative overflow-hidden">
            <div className="flex items-center justify-between flex-wrap gap-4 relative z-10">
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Ecosystem Share</p>
                <p className="font-extrabold text-sm sm:text-base mt-0.5">25% Partner Franchise Income</p>
                <p className="text-[10px] text-gray-400 mt-1">On Vendor / Wholesaler Registration Enroll Fee</p>
              </div>
              <div className="bg-[#F3BA12] text-[#0A1128] px-4 py-2.5 rounded-xl text-center">
                <p className="font-black text-xs uppercase tracking-wider">Super Vendor</p>
                <p className="text-[10px] font-bold">10% On All Income</p>
              </div>
            </div>
          </div>
        </div>

        {/* Referral Banner */}
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 mb-8 text-center">
          <p className="text-blue-800 text-xs sm:text-sm font-bold">
            Refer Your Friends and Earn <span className="text-[#F3BA12] font-black">Rs. 50</span> On each Refer or Download App
          </p>
        </div>

        {/* Account Options Grid */}
        <div className="grid md:grid-cols-3 gap-5 mb-12">
          <div className="bg-white border border-gray-150 rounded-2xl p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 cursor-pointer text-left" onClick={() => navigate("/my-orders")}>
            <div className="flex items-center gap-4">
              <div className="bg-[#FFF9E6] p-3.5 rounded-xl shrink-0">
                <Package className="h-6 w-6 text-[#0A1128]" />
              </div>
              <div>
                <h3 className="font-extrabold text-navy text-base">Your Orders</h3>
                <p className="text-xs text-gray-500 mt-0.5 leading-normal">Track, return, or buy things again</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-150 rounded-2xl p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 cursor-pointer text-left" onClick={() => navigate("/profile")}>
            <div className="flex items-center gap-4">
              <div className="bg-[#FFF9E6] p-3.5 rounded-xl shrink-0">
                <Lock className="h-6 w-6 text-[#0A1128]" />
              </div>
              <div>
                <h3 className="font-extrabold text-navy text-base">Login & Security</h3>
                <p className="text-xs text-gray-500 mt-0.5 leading-normal">Edit login, name, and mobile number</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-150 rounded-2xl p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 cursor-pointer text-left" onClick={() => navigate("/referrals")}>
            <div className="flex items-center gap-4">
              <div className="bg-[#FFF9E6] p-3.5 rounded-xl shrink-0">
                <Gift className="h-6 w-6 text-[#0A1128]" />
              </div>
              <div>
                <h3 className="font-extrabold text-navy text-base">Referrals</h3>
                <p className="text-xs text-gray-500 mt-0.5 leading-normal">View benefits & payment settings</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-150 rounded-2xl p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 cursor-pointer text-left" onClick={() => navigate("/profile")}>
            <div className="flex items-center gap-4">
              <div className="bg-[#FFF9E6] p-3.5 rounded-xl shrink-0">
                <Home className="h-6 w-6 text-[#0A1128]" />
              </div>
              <div>
                <h3 className="font-extrabold text-navy text-base">Your Addresses</h3>
                <p className="text-xs text-gray-500 mt-0.5 leading-normal">Edit addresses for orders and gifts</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-150 rounded-2xl p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 cursor-pointer text-left" onClick={() => navigate("/earn-with-apexbee")}>
            <div className="flex items-center gap-4">
              <div className="bg-[#FFF9E6] p-3.5 rounded-xl shrink-0">
                <Briefcase className="h-6 w-6 text-[#0A1128]" />
              </div>
              <div>
                <h3 className="font-extrabold text-navy text-base">Business Account</h3>
                <p className="text-xs text-gray-500 mt-0.5 leading-normal">GST invoices, bulk discounts & App download</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-150 rounded-2xl p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 cursor-pointer text-left" onClick={() => navigate("/referrals")}>
            <div className="flex items-center gap-4">
              <div className="bg-[#FFF9E6] p-3.5 rounded-xl shrink-0">
                <CreditCard className="h-6 w-6 text-[#0A1128]" />
              </div>
              <div>
                <h3 className="font-extrabold text-navy text-base">Payment options</h3>
                <p className="text-xs text-gray-500 mt-0.5 leading-normal">Contact our customer service via phone or chat</p>
              </div>
            </div>
          </div>

          {user?.role === "admin" && (
            <div className="bg-white border border-gray-150 rounded-2xl p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 cursor-pointer text-left" onClick={() => navigate("/admin/reviews")}>
              <div className="flex items-center gap-4">
                <div className="bg-[#FFF9E6] p-3.5 rounded-xl shrink-0">
                  <Star className="h-6 w-6 text-[#0A1128]" />
                </div>
                <div>
                  <h3 className="font-extrabold text-navy text-base">Review Moderation</h3>
                  <p className="text-xs text-gray-500 mt-0.5 leading-normal">Edit or delete customer product reviews</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Account;
