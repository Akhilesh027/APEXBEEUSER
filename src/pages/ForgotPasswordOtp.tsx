import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, Phone, ShieldCheck, KeyRound, Eye, EyeOff } from "lucide-react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_URL || "https://server.apexbee.in/api";

type Step = "identifier" | "otp" | "newpass";

export default function ForgotPasswordOtp() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [step, setStep] = useState<Step>("identifier");
  const [identifier, setIdentifier] = useState(() => searchParams.get("email") || "");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const urlEmail = searchParams.get("email");
    if (urlEmail && !identifier) {
      setIdentifier(urlEmail);
    }
  }, [searchParams]);

  // Helper to construct normalized payload from identifier input
  const getIdentifierPayload = (raw: string) => {
    const trimmed = raw.trim();
    const isEmail = trimmed.includes("@");
    if (isEmail) {
      return {
        email: trimmed.toLowerCase(),
        phone: undefined,
        identifier: trimmed.toLowerCase(),
      };
    } else {
      const cleanPhone = trimmed.replace(/[^\d+]/g, "");
      return {
        email: trimmed,
        phone: cleanPhone,
        identifier: cleanPhone,
      };
    }
  };

  const sendOtp = async () => {
    const trimmed = identifier.trim();
    if (!trimmed) {
      toast({
        title: "Input required",
        description: "Please enter your registered email address or mobile number.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const idPayload = getIdentifierPayload(trimmed);
      const payload = {
        ...idPayload,
        purpose: "forgot_password",
      };

      const endpoints = [
        `${API_BASE}/auth/send-otp`,
        `/api/auth/send-otp`,
        `${API_BASE}/auth/forgot-password`,
        `${API_BASE}/auth/forgot-password-otp/check`,
      ];

      let lastRes: Response | null = null;
      let lastData: any = null;
      let success = false;

      for (const url of endpoints) {
        try {
          const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          lastRes = res;
          if (res.status === 404) continue; // Try fallback endpoint

          const text = await res.text();
          try {
            lastData = JSON.parse(text);
          } catch {
            lastData = { message: text };
          }

          if (res.ok && (!lastData || lastData.success !== false)) {
            success = true;
            break;
          } else {
            // Stop on 400 validation error (e.g. user not found)
            break;
          }
        } catch {
          // Network error on this endpoint, continue loop
        }
      }

      if (success) {
        toast({
          title: "OTP Sent",
          description:
            lastData?.message ||
            (idPayload.email && idPayload.email.includes("@")
              ? "Check your email for the 6-digit OTP code."
              : "Check your phone for the 6-digit OTP SMS code."),
        });
        setStep("otp");
      } else {
        const errorMsg =
          lastData?.message ||
          lastData?.error ||
          (lastRes?.status === 404
            ? "No registered account found with this email or mobile number."
            : "Could not send OTP. Please check your details and try again.");
        toast({ title: "Failed", description: errorMsg, variant: "destructive" });
      }
    } catch (e: any) {
      console.error("Forgot password sendOtp error:", e);
      toast({
        title: "Server error",
        description: e?.message || "Unable to reach server. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    const trimmed = identifier.trim();
    const cleanOtp = otp.trim();
    if (!cleanOtp || cleanOtp.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter the complete 6-digit verification code.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const idPayload = getIdentifierPayload(trimmed);
      const payload = {
        ...idPayload,
        otp: cleanOtp,
      };

      const endpoints = [
        `${API_BASE}/auth/verify-otp`,
        `/api/auth/verify-otp`,
        `${API_BASE}/auth/verify-reset-otp/check`,
        `/api/auth/verify-reset-otp/check`,
      ];

      let lastRes: Response | null = null;
      let lastData: any = null;
      let success = false;

      for (const url of endpoints) {
        try {
          const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          lastRes = res;
          if (res.status === 404) continue;

          const text = await res.text();
          try {
            lastData = JSON.parse(text);
          } catch {
            lastData = { message: text };
          }

          if (res.ok && (!lastData || lastData.success !== false)) {
            success = true;
            break;
          } else {
            break;
          }
        } catch {
          // Network error on this endpoint
        }
      }

      if (success) {
        toast({ title: "Verified", description: "OTP verified successfully. Now choose your new password." });
        setStep("newpass");
      } else {
        const errorMsg =
          lastData?.message ||
          lastData?.error ||
          "OTP verification failed. Please check the code or click Resend.";
        toast({ title: "Invalid OTP", description: errorMsg, variant: "destructive" });
      }
    } catch (e: any) {
      console.error("Forgot password verifyOtp error:", e);
      toast({
        title: "Server error",
        description: e?.message || "Verification failed. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updatePassword = async () => {
    const trimmed = identifier.trim();
    const cleanOtp = otp.trim();

    if (!newPassword || newPassword.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    if (confirmPassword && newPassword !== confirmPassword) {
      toast({
        title: "Passwords do not match",
        description: "Please make sure both password fields match.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const idPayload = getIdentifierPayload(trimmed);
      const payload = {
        ...idPayload,
        otp: cleanOtp,
        newPassword,
        password: newPassword,
        confirmPassword: newPassword,
      };

      const endpoints = [
        `${API_BASE}/auth/reset-password`,
        `/api/auth/reset-password`,
        `${API_BASE}/auth/reset-password-otp/check`,
        `/api/auth/reset-password-otp/check`,
        `${API_BASE}/auth/change-password`,
      ];

      let lastRes: Response | null = null;
      let lastData: any = null;
      let success = false;

      for (const url of endpoints) {
        try {
          const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          lastRes = res;
          if (res.status === 404) continue;

          const text = await res.text();
          try {
            lastData = JSON.parse(text);
          } catch {
            lastData = { message: text };
          }

          if (res.ok && (!lastData || lastData.success !== false)) {
            success = true;
            break;
          } else {
            // Stop if received 400 error with message
            break;
          }
        } catch {
          // Network error on this endpoint
        }
      }

      if (success) {
        toast({
          title: "Password Updated",
          description: lastData?.message || "Password updated successfully. You can now login.",
        });
        navigate("/login");
      } else {
        const errorMsg =
          lastData?.message ||
          lastData?.error ||
          lastData?.msg ||
          `Could not update password (${lastRes?.status || "Error"}). Please try again.`;
        toast({ title: "Failed", description: errorMsg, variant: "destructive" });
      }
    } catch (e: any) {
      console.error("Forgot password updatePassword error:", e);
      toast({
        title: "Server error",
        description: e?.message || "Password update failed. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="relative overflow-hidden bg-navy-dark">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-accent blur-3xl" />
          <div className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-white blur-3xl" />
        </div>

        <div className="relative container mx-auto px-4 py-14">
          <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            <div className="p-6 md:p-8">
              <div className="inline-flex items-center gap-2 bg-gray-100 border border-gray-200 px-3 py-1 rounded-full text-sm">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Password Recovery
              </div>

              <h1 className="text-2xl font-semibold text-navy mt-4">
                {step === "identifier" && "Reset Your Password"}
                {step === "otp" && "Verify OTP"}
                {step === "newpass" && "Set New Password"}
              </h1>

              <p className="text-sm text-muted-foreground mt-2">
                {step === "identifier" && "Enter your registered email address or mobile number to receive a secure OTP code."}
                {step === "otp" && `Enter the 6-digit OTP code sent to ${identifier}.`}
                {step === "newpass" && "Create a strong new password for your ApexBee account."}
              </p>

              <div className="mt-6 space-y-4">
                {(step === "identifier" || step === "otp" || step === "newpass") && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-navy">Email or Mobile Number</label>
                    <div className="relative">
                      <Input
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        placeholder="your@email.com or 10-digit mobile"
                        type="text"
                        disabled={step !== "identifier"}
                        className="pl-10"
                      />
                      {identifier.includes("@") ? (
                        <Mail className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      ) : (
                        <Phone className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      )}
                    </div>
                  </div>
                )}

                {step === "otp" && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-navy">6-Digit Verification Code</label>
                    <Input
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="Enter 6-digit OTP"
                      inputMode="numeric"
                      maxLength={6}
                      className="text-center tracking-widest text-lg font-semibold"
                    />
                    <div className="flex justify-between items-center pt-1">
                      <button
                        type="button"
                        onClick={() => setStep("identifier")}
                        className="text-xs text-muted-foreground hover:underline"
                      >
                        Change email/phone
                      </button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-accent hover:text-accent/80 font-medium px-2"
                        disabled={loading}
                        onClick={sendOtp}
                      >
                        Resend OTP
                      </Button>
                    </div>
                  </div>
                )}

                {step === "newpass" && (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-navy">New Password</label>
                      <div className="relative">
                        <Input
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Enter new password (min. 6 characters)"
                          type={showPassword ? "text" : "password"}
                          className="pl-10 pr-10"
                        />
                        <KeyRound className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="text-gray-400 hover:text-gray-600 absolute right-3 top-1/2 -translate-y-1/2"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-navy">Confirm New Password</label>
                      <div className="relative">
                        <Input
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Confirm new password"
                          type={showPassword ? "text" : "password"}
                          className="pl-10"
                        />
                        <KeyRound className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      </div>
                    </div>
                  </>
                )}

                {step === "identifier" && (
                  <Button
                    className="w-full bg-accent hover:bg-accent/90 text-white font-medium"
                    onClick={sendOtp}
                    disabled={loading || !identifier.trim()}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Sending OTP...
                      </>
                    ) : (
                      "Send OTP Code"
                    )}
                  </Button>
                )}

                {step === "otp" && (
                  <Button
                    className="w-full bg-accent hover:bg-accent/90 text-white font-medium"
                    onClick={verifyOtp}
                    disabled={loading || otp.trim().length !== 6}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      "Verify Code & Continue"
                    )}
                  </Button>
                )}

                {step === "newpass" && (
                  <Button
                    className="w-full bg-accent hover:bg-accent/90 text-white font-medium"
                    onClick={updatePassword}
                    disabled={loading || newPassword.length < 6}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Updating Password...
                      </>
                    ) : (
                      "Update Password"
                    )}
                  </Button>
                )}

                <div className="text-center pt-2">
                  <Link to="/login" className="text-sm text-accent hover:underline font-medium">
                    Back to Login
                  </Link>
                </div>
              </div>
            </div>

            <div className="px-6 md:px-8 py-4 bg-secondary/30 border-t border-gray-200">
              <p className="text-xs text-muted-foreground text-center">
                By continuing, you agree to our <Link to="/terms-conditions" className="text-amber-600 hover:underline font-semibold">Terms</Link> & <Link to="/privacy-policy" className="text-amber-600 hover:underline font-semibold">Privacy Policy</Link>.
              </p>
            </div>
          </div>
        </div>

        <svg className="block w-full" viewBox="0 0 1200 120" preserveAspectRatio="none" style={{ height: "80px" }}>
          <path
            d="M0,0 C150,80 350,80 600,50 C850,20 1050,20 1200,50 L1200,120 L0,120 Z"
            className="fill-white"
          />
        </svg>
      </section>

      <Footer />
    </div>
  );
}
