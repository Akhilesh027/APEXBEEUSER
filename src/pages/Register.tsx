import React, { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Loader2, ShieldCheck, CheckCircle, ShoppingBag, Users, Briefcase, Sparkles } from "lucide-react";
import { GoogleLogin } from "@react-oauth/google";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

const API_BASE = import.meta.env.VITE_API_URL || "https://server.apexbee.in/api";

type AccountType = "guest" | "customer" | "business";

const Register = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    referralCode: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showOtpDialog, setShowOtpDialog] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState("");

  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlReferralCode = searchParams.get("ref");

  const [accountType, setAccountType] = useState<AccountType>(() => {
    if (urlReferralCode === "partner" || urlReferralCode === "business") return "business";
    return "customer";
  });

  useEffect(() => {
    if (urlReferralCode) {
      setFormData((prev) => ({ ...prev, referralCode: urlReferralCode }));
    }
  }, [urlReferralCode]);

  const getPasswordStrength = (pass: string) => {
    if (!pass) return null;
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 10) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 2) return { label: "Weak", color: "bg-red-500", text: "text-red-600", width: "w-1/3" };
    if (score <= 4) return { label: "Medium", color: "bg-amber-500", text: "text-amber-600", width: "w-2/3" };
    return { label: "Strong", color: "bg-emerald-500", text: "text-emerald-600", width: "w-full" };
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
    setError("");
  };

  // Guest flow
  const handleGuestContinue = () => {
    localStorage.setItem("guest", "true");
    toast({
      title: "Guest Mode",
      description: "You can browse and make purchases. Create an account later for full benefits.",
    });
    navigate("/");
  };

  // Google signup (supports customer & business partner)
  const handleGoogleSuccess = async (credential: string | undefined) => {
    if (!credential || !accountType || accountType === "guest") return;
    setGoogleLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          credential,
          referralCode: formData.referralCode || urlReferralCode || undefined,
          role: accountType === "business" ? "BUSINESS_PARTNER" : "CUSTOMER",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || "Google signup failed. Please try again.");
        return;
      }
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("token", data.token);
      toast({ title: "Welcome!", description: "Signed in with Google successfully." });
      // Post-registration redirect to home
      navigate("/");
    } catch (err) {
      console.error("Google auth error:", err);
      setError("Server error, try again later.");
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountType || accountType === "guest") return;
    setError("");
    setLoading(true);

    try {
      if (!formData.name || !formData.email || !formData.phone || !formData.password) {
        setError("Please fill in all required fields.");
        setLoading(false);
        return;
      }
      if (formData.password.length < 6) {
        setError("Password must be at least 6 characters long.");
        setLoading(false);
        return;
      }

      // 1. Send OTP first
      const otpRes = await fetch(`${API_BASE}/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: formData.phone, email: formData.email }),
      });

      if (!otpRes.ok) {
        const otpData = await otpRes.json();
        setError(otpData?.message || "Failed to send verification code. Please try again.");
        setLoading(false);
        return;
      }

      // 2. Open OTP dialog
      setOtpCode("");
      setOtpError("");
      setShowOtpDialog(true);
    } catch (err) {
      console.error("Register OTP send error:", err);
      setError("Server error sending OTP, try again later.");
      setLoading(false);
    }
  };

  const handleVerifyAndRegister = async () => {
    if (otpCode.length !== 4) {
      setOtpError("Please enter a valid 4-digit code.");
      return;
    }
    setOtpLoading(true);
    setOtpError("");

    try {
      // 1. Verify OTP
      const verifyRes = await fetch(`${API_BASE}/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: formData.phone, email: formData.email, otp: otpCode }),
      });

      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) {
        setOtpError(verifyData?.message || "Invalid OTP code. Please enter '1234'.");
        setOtpLoading(false);
        return;
      }

      // 2. OTP is verified! Call register endpoint
      const role = accountType === "business" ? "BUSINESS_PARTNER" : "CUSTOMER";
      const registerRes = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          roles: [role],
          referredByCode: formData.referralCode || undefined,
          otp: otpCode,
        }),
      });

      const registerData = await registerRes.json();
      if (!registerRes.ok) {
        setOtpError(registerData?.message || "Registration failed. Please try again.");
        setOtpLoading(false);
        return;
      }

      // 3. Registration Success!
      localStorage.setItem("user", JSON.stringify(registerData.user));
      localStorage.setItem("token", registerData.token);

      const userId = registerData.user?._id || registerData.user?.id;
      const token = registerData.token;

      // Sync local wishlist
      const localWish = localStorage.getItem("local_wishlist");
      if (localWish && userId) {
        try {
          const productIds = JSON.parse(localWish);
          if (Array.isArray(productIds) && productIds.length > 0) {
            await fetch(`${API_BASE}/wishlist/sync`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify({ userId, productIds }),
            });
            localStorage.removeItem("local_wishlist");
          }
        } catch (err) {
          console.error("Failed to sync local wishlist:", err);
        }
      }

      // Sync local cart
      const localCart = localStorage.getItem("local_cart");
      if (localCart && userId) {
        try {
          const items = JSON.parse(localCart);
          if (Array.isArray(items) && items.length > 0) {
            for (const item of items) {
              await fetch(`${API_BASE}/cart/add`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ ...item, userId }),
              });
            }
            localStorage.removeItem("local_cart");
          }
        } catch (err) {
          console.error("Failed to sync local cart:", err);
        }
      }

      window.dispatchEvent(new Event("storage"));
      toast({ title: "Account created!", description: "Your account has been created successfully." });
      setShowOtpDialog(false);

      // Post-registration redirect to home
      navigate("/");
    } catch (err) {
      console.error("Verification/Registration error:", err);
      setOtpError("Server error, try again later.");
    } finally {
      setOtpLoading(false);
      setLoading(false);
    }
  };

  // Registration form for Customer or Business Partner
  const isBusiness = accountType === "business";
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <section className="relative overflow-hidden bg-navy-dark">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-accent blur-3xl" />
          <div className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-white blur-3xl" />
        </div>
        <div className="relative container mx-auto px-4 py-10">
          <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-10 items-start">
            {/* Left side - info & details */}
            <div className="text-white">
              <div className="inline-flex items-center gap-2 bg-white/10 border border-white/15 px-3 py-1 rounded-full text-sm">
                <ShieldCheck className="w-4 h-4 text-accent" />
                {isBusiness ? "Business Partner Registration" : "Customer Registration"}
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mt-5 leading-tight">
                {isBusiness ? "Start Your Business Journey" : "Join as a Customer"}
              </h1>
              <p className="text-white/80 mt-3 max-w-md text-sm leading-relaxed">
                {isBusiness
                  ? "Business Partner is the entry point into the ApexBee earning ecosystem. After registration, you can apply for various opportunities based on your interests and qualifications."
                  : "Create a customer account to enjoy rewards, cashback, and a personalized shopping experience."}
              </p>

              {/* Customer Benefits List */}
              {!isBusiness && (
                <div className="mt-6 space-y-3">
                  <p className="font-medium text-sm text-white/90">Customer Account Benefits:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                    {[
                      "Product Purchases & Fast Checkout",
                      "Service Bookings",
                      "Wallet Access & Cashback",
                      "Exclusive Rewards",
                      "Wishlist & Order History",
                      "Personalized Recommendations"
                    ].map((benefit) => (
                      <div key={benefit} className="flex items-center gap-2 text-white/90 text-xs sm:text-sm">
                        <CheckCircle className="w-4 h-4 text-accent flex-shrink-0" />
                        <span>{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Business Opportunities & Benefits */}
              {isBusiness && (
                <>
                  <div className="mt-6 p-4 rounded-xl bg-white/10 border border-white/15">
                    <p className="font-medium text-sm">Available opportunities after registration:</p>
                    <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                      {["Vendor", "Manufacturer", "Wholesaler", "Entrepreneur", "Franchise Partner", "Service Provider", "Course Provider", "Delivery Partner"].map(opp => (
                        <div key={opp} className="flex items-center gap-1 text-xs sm:text-sm"><Sparkles className="w-3.5 h-3.5 text-amber-400" /> {opp}</div>
                      ))}
                    </div>
                  </div>
                  <div className="mt-4 space-y-2">
                    <p className="font-medium text-xs text-white/80">Business Partner Perks:</p>
                    <div className="grid grid-cols-2 gap-2 text-xs text-white/90">
                      <div className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-accent" /> Referral Income</div>
                      <div className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-accent" /> Partner Network Benefits</div>
                      <div className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-accent" /> Dashboard Access</div>
                      <div className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-accent" /> Growth Support</div>
                    </div>
                  </div>
                </>
              )}

              {urlReferralCode && (
                <div className="mt-6 p-4 rounded-xl bg-white/10 border border-white/15">
                  <p className="text-sm">Referral detected! Your code will be applied automatically.</p>
                  <p className="text-xs mt-1">Code: <span className="font-semibold">{urlReferralCode}</span></p>
                </div>
              )}
            </div>

            {/* Right side - registration form */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
              <div className="p-6 md:p-8">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-navy">{isBusiness ? "Business Partner Signup" : "Customer Signup"}</h2>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground">
                    {isBusiness ? "Business Partner" : "Customer"}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Continue with Google or fill the form below.
                </p>

                {/* Google Button */}
                <div className="mt-5">
                  <div className="w-full flex justify-center">
                    <div className={googleLoading ? "opacity-60 pointer-events-none" : ""}>
                      <GoogleLogin
                        onSuccess={(cred) => handleGoogleSuccess(cred.credential)}
                        onError={() => setError("Google sign-in cancelled or failed.")}
                        useOneTap={false}
                      />
                    </div>
                  </div>
                  {googleLoading && (
                    <div className="mt-3 flex items-center justify-center text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Signing in with Google...
                    </div>
                  )}
                  <div className="my-6 flex items-center gap-3">
                    <div className="h-px flex-1 bg-gray-200" />
                    <span className="text-xs text-muted-foreground">OR</span>
                    <div className="h-px flex-1 bg-gray-200" />
                  </div>
                </div>

                <form onSubmit={handleSubmit}>
                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
                      {error}
                    </div>
                  )}
                  <div className="space-y-3">
                    <Input type="text" name="name" placeholder="Full name" value={formData.name} onChange={handleInputChange} required />
                    <Input type="email" name="email" placeholder="Email address" value={formData.email} onChange={handleInputChange} required />
                    <Input type="tel" name="phone" placeholder="Phone number" value={formData.phone} onChange={(e) => {
                      const onlyNums = e.target.value.replace(/\D/g, "");
                      if (onlyNums.length <= 10) setFormData(p => ({ ...p, phone: onlyNums }));
                    }} inputMode="numeric" pattern="[0-9]{10}" maxLength={10} required />
                    <div className="space-y-1">
                      <div className="relative">
                        <Input type={showPassword ? "text" : "password"} name="password" placeholder="Password (min 6 characters)" value={formData.password} onChange={handleInputChange} required minLength={6} className="pr-10" />
                        <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 text-gray-500 hover:text-gray-700" onClick={() => setShowPassword(s => !s)}>
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>

                      {/* Password Strength Indicator (Visual Guide: Weak / Medium / Strong - Not mandatory) */}
                      {formData.password.length > 0 && (() => {
                        const strength = getPasswordStrength(formData.password);
                        if (!strength) return null;
                        return (
                          <div className="pt-0.5 space-y-1">
                            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                              <div className={`h-full ${strength.color} ${strength.width} transition-all duration-300 rounded-full`} />
                            </div>
                            <div className="flex justify-between items-center text-[11px] px-0.5">
                              <span className="text-gray-500">Strength: <strong className={`font-semibold ${strength.text}`}>{strength.label}</strong></span>
                              <span className="text-gray-400 text-[10px] italic">(Optional guide)</span>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                    <Input type="text" name="referralCode" placeholder="Referral code (optional)" value={formData.referralCode} onChange={handleInputChange} />

                    {/* Account Type Tabs (Guest, Customer, Business Partner) - Rendered directly after Referral Code input */}
                    <div className="pt-2">
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">Select Account Type</label>
                      <div className="grid grid-cols-3 gap-1.5 bg-gray-100 p-1.5 rounded-xl border border-gray-200">
                        <button
                          type="button"
                          onClick={handleGuestContinue}
                          className="flex items-center justify-center gap-1 py-2 px-2 rounded-lg font-semibold text-xs text-gray-700 hover:bg-white hover:shadow-xs transition-all cursor-pointer whitespace-nowrap"
                        >
                          <ShoppingBag className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                          <span>Guest</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setAccountType("customer")}
                          className={`flex items-center justify-center gap-1 py-2 px-2 rounded-lg font-bold text-xs transition-all cursor-pointer whitespace-nowrap ${accountType === "customer"
                            ? "bg-accent text-white shadow-md"
                            : "text-gray-700 hover:bg-white hover:shadow-xs"
                            }`}
                        >
                          <Users className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>Customer</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setAccountType("business")}
                          className={`flex items-center justify-center gap-1 py-2 px-2 rounded-lg font-bold text-xs transition-all cursor-pointer whitespace-nowrap ${accountType === "business"
                            ? "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md"
                            : "text-gray-700 hover:bg-white hover:shadow-xs"
                            }`}
                        >
                          <Briefcase className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>Business Partner</span>
                        </button>
                      </div>
                    </div>
                  </div>
                  <Button type="submit" className="w-full mt-5 bg-accent hover:bg-accent/90 text-white" disabled={loading}>
                    {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creating account...</> : (isBusiness ? "🚀 Start Free (Register Now)" : "Register as Customer")}
                  </Button>
                </form>
              </div>
              <div className="px-6 md:px-8 py-4 bg-secondary/30 border-t border-gray-200">
                <p className="text-xs text-muted-foreground text-center">
                  By creating an account, you agree to our <Link to="/terms-conditions" className="text-amber-600 hover:underline font-semibold">Terms</Link> & <Link to="/privacy-policy" className="text-amber-600 hover:underline font-semibold">Privacy Policy</Link>.
                </p>
              </div>
            </div>
          </div>

          {/* Why Join ApexBee section */}
          <div className="mt-16 bg-white rounded-2xl p-6 shadow-sm border border-gray-100 max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold text-navy text-center">Why Join ApexBee?</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
              {["Shop Products", "Book Services", "Learn New Skills", "Earn Rewards", "Build Business Networks", "Access Business Opportunities"].map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm"><CheckCircle className="w-4 h-4 text-accent" /> {item}</div>
              ))}
            </div>
          </div>
        </div>
        <svg className="block w-full" viewBox="0 0 1200 120" preserveAspectRatio="none" style={{ height: "80px" }}>
          <path d="M0,0 C150,80 350,80 600,50 C850,20 1050,20 1200,50 L1200,120 L0,120 Z" className="fill-white" />
        </svg>
      </section>
      <Footer />

      {/* OTP Verification Dialog */}
      <Dialog open={showOtpDialog} onOpenChange={setShowOtpDialog}>
        <DialogContent className="sm:max-w-md bg-white border border-gray-200">
          <DialogHeader>
            <DialogTitle className="text-center text-xl font-bold text-navy">Verify Phone Number</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center p-4 space-y-4">
            <p className="text-center text-sm text-muted-foreground">
              A 4-digit verification code has been sent to <span className="font-semibold text-foreground text-navy">{formData.phone}</span>.
              <br />
              Please enter the code to complete registration.
            </p>
            {otpError && (
              <div className="w-full bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-xs text-center">
                {otpError}
              </div>
            )}
            <Input
              type="text"
              placeholder="Enter 4-digit OTP"
              value={otpCode}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "");
                if (val.length <= 4) setOtpCode(val);
              }}
              className="text-center text-2xl font-bold tracking-widest h-12 w-48 text-navy border-gray-200"
              inputMode="numeric"
              maxLength={4}
            />
            <p className="text-xs text-muted-foreground">
              (For testing, use code: <span className="font-semibold">1234</span>)
            </p>
          </div>
          <DialogFooter className="sm:justify-center">
            <Button
              type="button"
              className="w-full bg-accent hover:bg-accent/90 text-white"
              disabled={otpLoading}
              onClick={handleVerifyAndRegister}
            >
              {otpLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify & Create Account"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Register;
