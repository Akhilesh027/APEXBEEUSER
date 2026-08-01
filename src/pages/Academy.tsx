import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  GraduationCap,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Phone,
  CheckCircle,
  MapPin,
  Clock,
  Compass,
  Laptop,
  Briefcase,
  BookOpen,
  Mail,
  UserCheck,
  ShieldAlert,
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'https://server.apexbee.in/api';

export default function Academy() {
  const navigate = useNavigate();
  const location = useLocation();

  // Determine initial step and interest type from path
  const isEntrepreneurPath = location.pathname.includes('/become-an-entrepreneur');
  const isSkillPath = location.pathname.includes('/skill-development');

  const [interestType, setInterestType] = useState<'become_entrepreneur' | 'skill_development' | null>(
    isEntrepreneurPath ? 'become_entrepreneur' : isSkillPath ? 'skill_development' : null
  );

  // Form Steps: 
  // 1: Selection, 2: Personal Info, 3: Program Details, 4: OTP, 5: Success
  const [step, setStep] = useState(interestType ? 2 : 1);
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [verificationToken, setVerificationToken] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState('');
  const [cooldown, setCooldown] = useState(0);

  // Location lists
  const [states, setStates] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [mandals, setMandals] = useState<any[]>([]);

  // Selection interest options
  const [entrepreneurOptions, setEntrepreneurOptions] = useState<any[]>([]);
  const [skillOptions, setSkillOptions] = useState<any[]>([]);

  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    mobile: '',
    email: '',
    selectedInterests: [] as string[],
    stateId: '',
    districtId: '',
    mandalId: '',
    city: '',
    pincode: '',
    preferredLanguage: 'English',
    preferredContactMethod: 'call' as 'call' | 'whatsapp' | 'email',
    occupation: '',
    qualification: '',
    employmentStatus: '',
    investmentRange: '',
    ownBusinessLocation: false,
    preferredBusinessLocation: '',
    expectedStartTimeline: '',
    learningMode: '',
    experienceLevel: '',
    preferredSchedule: '',
    certificationRequired: false,
    jobAssistanceRequired: false,
    consentAccepted: false,
  });

  const [leadResult, setLeadResult] = useState<any>(null);
  const [formStarted, setFormStarted] = useState(false);
  const [anonSessionId] = useState(() => {
    let sid = sessionStorage.getItem('academy_anon_sid');
    if (!sid) {
      sid = 'anon-' + Math.random().toString(36).substring(2, 15);
      sessionStorage.setItem('academy_anon_sid', sid);
    }
    return sid;
  });

  // Track analytics event to API
  const trackEvent = async (eventName: string, metadata: Record<string, any> = {}) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_BASE}/academy/analytics/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          eventName,
          anonymousSessionId: anonSessionId,
          metadata: {
            path: location.pathname,
            interestType,
            ...metadata,
          },
        }),
      });
    } catch (err) {
      console.warn('Analytics logging failed:', err);
    }
  };

  // 1. Initial Page View tracking
  useEffect(() => {
    if (isEntrepreneurPath || isSkillPath) {
      trackEvent('academy_subcategory_viewed', { subcategory: location.pathname });
    } else {
      trackEvent('academy_viewed');
    }
  }, [location.pathname]);

  // Load States on mount
  useEffect(() => {
    const fetchStates = async () => {
      try {
        const res = await fetch(`${API_BASE}/territories/states`);
        const data = await res.json();
        if (data.success) setStates(data.states || []);
      } catch (err) {
        console.error('Failed to load states:', err);
      }
    };
    fetchStates();
  }, []);

  // Load interests list
  useEffect(() => {
    const fetchInterests = async () => {
      try {
        const res = await fetch(`${API_BASE}/academy/interests`);
        const data = await res.json();
        if (data.success) {
          setEntrepreneurOptions(data.entrepreneur || []);
          setSkillOptions(data.skill || []);
        }
      } catch (err) {
        console.error('Failed to load interests options:', err);
      }
    };
    fetchInterests();
  }, []);

  // Load Districts when state changes
  useEffect(() => {
    if (!formData.stateId || !formData.stateId.match(/^[0-9a-fA-F]{24}$/)) {
      setDistricts([]);
      return;
    }
    const fetchDistricts = async () => {
      try {
        const res = await fetch(`${API_BASE}/territories/districts/${formData.stateId}`);
        const data = await res.json();
        if (data.success) setDistricts(data.districts || []);
      } catch (err) {
        console.error('Failed to load districts:', err);
      }
    };
    fetchDistricts();
  }, [formData.stateId]);

  // Load Mandals when district changes
  useEffect(() => {
    if (!formData.districtId || !formData.districtId.match(/^[0-9a-fA-F]{24}$/)) {
      setMandals([]);
      return;
    }
    const fetchMandals = async () => {
      try {
        const res = await fetch(`${API_BASE}/territories/mandals/${formData.districtId}`);
        const data = await res.json();
        if (data.success) setMandals(data.mandals || []);
      } catch (err) {
        console.error('Failed to load mandals:', err);
      }
    };
    fetchMandals();
  }, [formData.districtId]);

  // Try pre-filling for logged-in user
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const u = JSON.parse(savedUser);
        setFormData((prev) => ({
          ...prev,
          fullName: prev.fullName || u.name || '',
          email: prev.email || u.email || '',
          mobile: prev.mobile || u.phone || u.mobile || '',
        }));
      } catch {
        // ignore
      }
    }
  }, []);

  // Countdown timer for OTP
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleFieldChange = (field: string, value: any) => {
    if (!formStarted) {
      setFormStarted(true);
      trackEvent('academy_form_started');
    }
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleInterestSelect = (interest: 'become_entrepreneur' | 'skill_development') => {
    setInterestType(interest);
    trackEvent('academy_interest_selected', { selected: interest });
    setFormData((prev) => ({ ...prev, selectedInterests: [] })); // reset
    setStep(2);
  };

  const handleCheckboxToggle = (value: string) => {
    setFormData((prev) => {
      const current = [...prev.selectedInterests];
      const index = current.indexOf(value);
      if (index > -1) {
        current.splice(index, 1);
      } else {
        current.push(value);
      }
      return { ...prev, selectedInterests: current };
    });
  };

  const handleSendOtp = async () => {
    if (!formData.mobile || formData.mobile.replace(/\D/g, '').length < 10) {
      setOtpError('Please enter a valid 10-digit mobile number.');
      return;
    }
    setLoading(true);
    setOtpError('');
    try {
      const res = await fetch(`${API_BASE}/academy/otp/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile: formData.mobile }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setVerificationToken(data.verificationToken);
        setOtpSent(true);
        setCooldown(60);
        trackEvent('academy_otp_requested');
      } else {
        setOtpError(data.message || 'Failed to send OTP.');
      }
    } catch {
      setOtpError('Network error. Failed to request OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode || otpCode.length < 4) {
      setOtpError('Please enter a 4-digit code.');
      return;
    }
    setLoading(true);
    setOtpError('');
    try {
      const res = await fetch(`${API_BASE}/academy/otp/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mobile: formData.mobile,
          verificationToken,
          otp: otpCode,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setOtpVerified(true);
        setOtpError('');
        trackEvent('academy_otp_verified');
        // Automatically go to next step or submit if ready
        setStep(5);
      } else {
        setOtpError(data.message || 'Incorrect OTP code.');
      }
    } catch {
      setOtpError('Failed to verify OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitLead = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const payload = {
        ...formData,
        interestType,
        source: 'academy_landing',
        campaignSource: new URLSearchParams(window.location.search).get('utm_source') || undefined,
        campaignMedium: new URLSearchParams(window.location.search).get('utm_medium') || undefined,
        campaignName: new URLSearchParams(window.location.search).get('utm_campaign') || undefined,
      };

      const res = await fetch(`${API_BASE}/academy/leads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setLeadResult(data);
        trackEvent('academy_form_submitted', { leadId: data.data.leadId });
        setStep(6);
      } else {
        trackEvent('academy_submission_failed', { error: data.message });
        alert(data.message || 'Submission failed.');
      }
    } catch (err: any) {
      trackEvent('academy_submission_failed', { error: err.message });
      alert('Failed to connect to the server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-[#0A1128] via-[#101b3a] to-[#0A1128] font-sans antialiased text-white">
      <Navbar />

      {/* Main Banner Header */}
      <header className="container mx-auto px-4 py-16 text-center space-y-4">
        <Badge className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-extrabold text-xs px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 w-fit mx-auto border-none">
          <Sparkles className="w-3.5 h-3.5" /> Launching Soon
        </Badge>
        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight">
          ApexBee <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">Academy</span>
        </h1>
        <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-300 font-medium leading-relaxed">
          Acquire vocational skills and build entrepreneurship capability with structured training, mentorship, and business support programs. Register your interest for priority early access.
        </p>
      </header>

      {/* Main Section */}
      <main className="container mx-auto px-4 pb-20 flex-1 max-w-4xl">
        {step === 1 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            <Card
              className="bg-slate-900/80 border border-slate-800 rounded-3xl hover:border-amber-400 transition-all duration-300 shadow-xl overflow-hidden group cursor-pointer"
              onClick={() => handleInterestSelect('become_entrepreneur')}
            >
              <CardContent className="p-8 flex flex-col justify-between h-full space-y-6">
                <div className="space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:bg-amber-500 group-hover:text-slate-950 transition-all duration-300 shadow-inner">
                    <Briefcase className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-bold text-white group-hover:text-amber-400 transition-colors">Become an Entrepreneur</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    Start your own local business with our complete catalog network setup. Get business coaching, vendor integrations, franchise allocations, and access to seed capital.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-amber-400 font-bold text-sm pt-4 group-hover:translate-x-2 transition-transform">
                  Apply for Incubation <ArrowRight className="w-4 h-4" />
                </div>
              </CardContent>
            </Card>

            <Card
              className="bg-slate-900/80 border border-slate-800 rounded-3xl hover:border-amber-400 transition-all duration-300 shadow-xl overflow-hidden group cursor-pointer"
              onClick={() => handleInterestSelect('skill_development')}
            >
              <CardContent className="p-8 flex flex-col justify-between h-full space-y-6">
                <div className="space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:bg-amber-500 group-hover:text-slate-950 transition-all duration-300 shadow-inner">
                    <GraduationCap className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-bold text-white group-hover:text-amber-400 transition-colors">Skill Development</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    Learn highly demanded local and digital skills. Courses in repair, digital marketing, beauty, tailoring, and retail service operations.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-amber-400 font-bold text-sm pt-4 group-hover:translate-x-2 transition-transform">
                  Browse Courses & Apply <ArrowRight className="w-4 h-4" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {step > 1 && (
          <Card className="bg-slate-900/90 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-10 space-y-8 text-slate-100">
            {/* Step Progress indicator */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <span className="text-xs font-black uppercase text-amber-400 tracking-wider">
                {interestType === 'become_entrepreneur' ? 'Entrepreneur Incubation' : 'Skill Development Program'}
              </span>
              <span className="text-xs font-bold text-slate-400">Step {step - 1} of 4</span>
            </div>

            {/* STEP 2: Choose specific interests */}
            {step === 2 && (
              <div className="space-y-6 animate-fade-in">
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-white">What program paths interest you?</h3>
                  <p className="text-xs text-slate-400">Select all that apply to you</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-2">
                  {interestType === 'become_entrepreneur'
                    ? entrepreneurOptions.map((opt) => (
                      <div
                        key={opt.value}
                        onClick={() => handleCheckboxToggle(opt.value)}
                        className={`p-4 rounded-xl border-2 transition-all cursor-pointer select-none flex items-center gap-3 ${formData.selectedInterests.includes(opt.value)
                            ? 'border-amber-400 bg-amber-500/10 text-white'
                            : 'border-slate-800 hover:border-slate-700 bg-slate-950/40 text-slate-400'
                          }`}
                      >
                        <input
                          type="checkbox"
                          className="accent-amber-400 pointer-events-none"
                          checked={formData.selectedInterests.includes(opt.value)}
                          readOnly
                        />
                        <span className="text-xs font-bold">{opt.label}</span>
                      </div>
                    ))
                    : skillOptions.map((opt) => (
                      <div
                        key={opt.value}
                        onClick={() => handleCheckboxToggle(opt.value)}
                        className={`p-4 rounded-xl border-2 transition-all cursor-pointer select-none flex items-center gap-3 ${formData.selectedInterests.includes(opt.value)
                            ? 'border-amber-400 bg-amber-500/10 text-white'
                            : 'border-slate-800 hover:border-slate-700 bg-slate-950/40 text-slate-400'
                          }`}
                      >
                        <input
                          type="checkbox"
                          className="accent-amber-400 pointer-events-none"
                          checked={formData.selectedInterests.includes(opt.value)}
                          readOnly
                        />
                        <span className="text-xs font-bold">{opt.label}</span>
                      </div>
                    ))}
                </div>

                <div className="flex justify-between pt-6 border-t border-slate-800">
                  <Button variant="outline" size="sm" onClick={() => setStep(1)} className="rounded-xl border-slate-800 text-white hover:bg-slate-800">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setStep(3)}
                    disabled={formData.selectedInterests.length === 0}
                    className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl border-none px-6"
                  >
                    Continue <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 3: Personal & Location Details */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-white">Personal & Location Profile</h3>
                  <p className="text-xs text-slate-400">Tell us where you are based</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-slate-300">Full Name</label>
                    <input
                      type="text"
                      className="bg-slate-950/40 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-amber-400 focus:outline-none"
                      value={formData.fullName}
                      onChange={(e) => handleFieldChange('fullName', e.target.value)}
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-slate-300">Email Address (Optional)</label>
                    <input
                      type="email"
                      className="bg-slate-950/40 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-amber-400 focus:outline-none"
                      value={formData.email}
                      onChange={(e) => handleFieldChange('email', e.target.value)}
                      placeholder="Enter email address"
                    />
                  </div>

                  {/* State Selection */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-slate-300">State</label>
                    {states.length > 0 && formData.stateId !== '__manual__' ? (
                      <select
                        className="bg-slate-950/40 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-amber-400 focus:outline-none"
                        value={formData.stateId}
                        onChange={(e) => {
                          handleFieldChange('stateId', e.target.value);
                          handleFieldChange('districtId', '');
                          handleFieldChange('mandalId', '');
                        }}
                      >
                        <option value="">Select State</option>
                        {states.map((s) => (
                          <option key={s._id} value={s._id}>
                            {s.name}
                          </option>
                        ))}
                        <option value="__manual__">Type custom state...</option>
                      </select>
                    ) : (
                      <div className="relative">
                        <input
                          type="text"
                          className="bg-slate-950/40 border border-slate-800 rounded-xl pl-4 pr-16 py-3 text-sm text-white focus:border-amber-400 focus:outline-none w-full"
                          value={formData.stateId === '__manual__' ? '' : formData.stateId}
                          onChange={(e) => handleFieldChange('stateId', e.target.value)}
                          placeholder="Enter state name"
                        />
                        {states.length > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              handleFieldChange('stateId', '');
                              handleFieldChange('districtId', '');
                              handleFieldChange('mandalId', '');
                            }}
                            className="absolute right-3 top-3.5 text-[10px] text-amber-400 hover:underline font-bold"
                          >
                            Use list
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* District Selection */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-slate-300">District</label>
                    {districts.length > 0 && formData.districtId !== '__manual__' ? (
                      <select
                        className="bg-slate-950/40 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-amber-400 focus:outline-none"
                        value={formData.districtId}
                        onChange={(e) => {
                          handleFieldChange('districtId', e.target.value);
                          handleFieldChange('mandalId', '');
                        }}
                      >
                        <option value="">Select District</option>
                        {districts.map((d) => (
                          <option key={d._id} value={d._id}>
                            {d.name}
                          </option>
                        ))}
                        <option value="__manual__">Type custom district...</option>
                      </select>
                    ) : (
                      <div className="relative">
                        <input
                          type="text"
                          className="bg-slate-950/40 border border-slate-800 rounded-xl pl-4 pr-16 py-3 text-sm text-white focus:border-amber-400 focus:outline-none w-full"
                          value={formData.districtId === '__manual__' ? '' : formData.districtId}
                          onChange={(e) => handleFieldChange('districtId', e.target.value)}
                          placeholder="Enter district name"
                        />
                        {districts.length > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              handleFieldChange('districtId', '');
                              handleFieldChange('mandalId', '');
                            }}
                            className="absolute right-3 top-3.5 text-[10px] text-amber-400 hover:underline font-bold"
                          >
                            Use list
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Mandal / City / Town Selection */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-slate-300">Mandal / City / Town</label>
                    {mandals.length > 0 && formData.mandalId !== '__manual__' ? (
                      <select
                        className="bg-slate-950/40 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-amber-400 focus:outline-none"
                        value={formData.mandalId}
                        onChange={(e) => handleFieldChange('mandalId', e.target.value)}
                      >
                        <option value="">Select Mandal</option>
                        {mandals.map((m) => (
                          <option key={m._id} value={m._id}>
                            {m.name}
                          </option>
                        ))}
                        <option value="__manual__">Type custom mandal...</option>
                      </select>
                    ) : (
                      <div className="relative">
                        <input
                          type="text"
                          className="bg-slate-950/40 border border-slate-800 rounded-xl pl-4 pr-16 py-3 text-sm text-white focus:border-amber-400 focus:outline-none w-full"
                          value={formData.mandalId === '__manual__' ? '' : formData.mandalId}
                          onChange={(e) => {
                            handleFieldChange('mandalId', e.target.value);
                            handleFieldChange('city', e.target.value);
                          }}
                          placeholder="Enter mandal/city"
                        />
                        {mandals.length > 0 && (
                          <button
                            type="button"
                            onClick={() => handleFieldChange('mandalId', '')}
                            className="absolute right-3 top-3.5 text-[10px] text-amber-400 hover:underline font-bold"
                          >
                            Use list
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Pincode */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-slate-300">Pincode</label>
                    <input
                      type="text"
                      maxLength={6}
                      className="bg-slate-950/40 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-amber-400 focus:outline-none"
                      value={formData.pincode}
                      onChange={(e) => handleFieldChange('pincode', e.target.value.replace(/\D/g, ''))}
                      placeholder="6-digit pincode"
                    />
                  </div>
                </div>

                <div className="flex justify-between pt-6 border-t border-slate-800">
                  <Button variant="outline" size="sm" onClick={() => setStep(2)} className="rounded-xl border-slate-800 text-white hover:bg-slate-800">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setStep(4)}
                    disabled={!formData.fullName || !formData.stateId || !formData.districtId}
                    className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl border-none px-6"
                  >
                    Continue <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 4: Program Specific questions */}
            {step === 4 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-white">Program Preferences</h3>
                  <p className="text-xs text-slate-400">Help us tailor your training experience</p>
                </div>

                {interestType === 'become_entrepreneur' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold text-slate-300">Investment Range</label>
                      <select
                        className="bg-slate-950/40 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-amber-400 focus:outline-none"
                        value={formData.investmentRange}
                        onChange={(e) => handleFieldChange('investmentRange', e.target.value)}
                      >
                        <option value="">Select Range</option>
                        <option value="Under ₹50k">Under ₹50,000</option>
                        <option value="₹50k - ₹2L">₹50,000 - ₹2,00,000</option>
                        <option value="₹2L - ₹5L">₹2,00,000 - ₹5,00,000</option>
                        <option value="Over ₹5L">Over ₹5,00,000</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold text-slate-300">Expected Start Timeline</label>
                      <select
                        className="bg-slate-950/40 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-amber-400 focus:outline-none"
                        value={formData.expectedStartTimeline}
                        onChange={(e) => handleFieldChange('expectedStartTimeline', e.target.value)}
                      >
                        <option value="">Select Timeline</option>
                        <option value="Immediately">Immediately (Within 1 Month)</option>
                        <option value="1 to 3 Months">1 to 3 Months</option>
                        <option value="3 to 6 months">3 to 6 Months</option>
                        <option value="Planning phase">Planning Phase Only</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-3 p-4 bg-slate-950/40 border border-slate-800 rounded-xl col-span-full">
                      <input
                        type="checkbox"
                        id="ownLoc"
                        className="accent-amber-400 w-4 h-4 cursor-pointer"
                        checked={formData.ownBusinessLocation}
                        onChange={(e) => handleFieldChange('ownBusinessLocation', e.target.checked)}
                      />
                      <label htmlFor="ownLoc" className="text-xs font-bold text-slate-300 cursor-pointer">
                        I own / lease a physical commercial location (Shop / Office space)
                      </label>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold text-slate-300">Learning Mode</label>
                      <select
                        className="bg-slate-950/40 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-amber-400 focus:outline-none"
                        value={formData.learningMode}
                        onChange={(e) => handleFieldChange('learningMode', e.target.value)}
                      >
                        <option value="">Select Mode</option>
                        <option value="Online">Online Self-Paced</option>
                        <option value="Offline">Offline Classroom / Hands-on</option>
                        <option value="Hybrid">Hybrid (Theory Online + Lab Offline)</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold text-slate-300">Current Experience Level</label>
                      <select
                        className="bg-slate-950/40 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-amber-400 focus:outline-none"
                        value={formData.experienceLevel}
                        onChange={(e) => handleFieldChange('experienceLevel', e.target.value)}
                      >
                        <option value="">Select Level</option>
                        <option value="Beginner">Beginner (No past experience)</option>
                        <option value="Intermediate">Intermediate (Some basic info)</option>
                        <option value="Advanced">Advanced (Experienced practitioner)</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-3 p-4 bg-slate-950/40 border border-slate-800 rounded-xl col-span-full">
                      <input
                        type="checkbox"
                        id="jobAssist"
                        className="accent-amber-400 w-4 h-4 cursor-pointer"
                        checked={formData.jobAssistanceRequired}
                        onChange={(e) => handleFieldChange('jobAssistanceRequired', e.target.checked)}
                      />
                      <label htmlFor="jobAssist" className="text-xs font-bold text-slate-300 cursor-pointer">
                        I require placement / job connection assistance upon completion
                      </label>
                    </div>
                  </div>
                )}

                <div className="flex justify-between pt-6 border-t border-slate-800">
                  <Button variant="outline" size="sm" onClick={() => setStep(3)} className="rounded-xl border-slate-800 text-white hover:bg-slate-800">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setStep(5)}
                    className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl border-none px-6"
                  >
                    Continue <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 5: Mobile Verification & Consent */}
            {step === 5 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-white">Mobile Verification</h3>
                  <p className="text-xs text-slate-400 font-medium">Verify your mobile contact number to complete interest registration.</p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-950/50 border border-slate-800 space-y-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-slate-300">Mobile Number</label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-4 top-3.5 text-sm text-slate-500 font-bold">+91</span>
                        <input
                          type="text"
                          maxLength={10}
                          className="bg-slate-900 border border-slate-800 rounded-xl pl-14 pr-4 py-3 text-sm text-white focus:border-amber-400 focus:outline-none w-full"
                          value={formData.mobile}
                          disabled={otpVerified}
                          onChange={(e) => handleFieldChange('mobile', e.target.value.replace(/\D/g, ''))}
                          placeholder="Enter 10-digit mobile"
                        />
                      </div>
                      <Button
                        onClick={handleSendOtp}
                        disabled={loading || cooldown > 0 || otpVerified || !formData.mobile}
                        className="bg-slate-800 hover:bg-slate-700 text-white rounded-xl border-none px-4 text-xs font-bold py-3.5"
                      >
                        {cooldown > 0 ? `Resend (${cooldown}s)` : otpSent ? 'Resend OTP' : 'Send OTP'}
                      </Button>
                    </div>
                  </div>

                  {otpSent && !otpVerified && (
                    <div className="flex flex-col gap-2 animate-fade-in pt-3 border-t border-slate-900">
                      <label className="text-xs font-bold text-slate-300">Enter Verification Code</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          maxLength={4}
                          className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-amber-400 focus:outline-none text-center tracking-widest flex-1 max-w-[120px] font-bold"
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                          placeholder="XXXX"
                        />
                        <Button
                          onClick={handleVerifyOtp}
                          disabled={loading || !otpCode}
                          className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl border-none px-6"
                        >
                          Verify OTP
                        </Button>
                      </div>
                    </div>
                  )}

                  {otpVerified && (
                    <div className="flex items-center gap-2 text-green-400 text-xs font-bold bg-green-500/10 border border-green-500/20 p-3.5 rounded-xl">
                      <CheckCircle className="w-5 h-5" /> Mobile number verified successfully!
                    </div>
                  )}

                  {otpError && (
                    <div className="flex items-center gap-2 text-red-400 text-xs font-bold bg-red-500/10 border border-red-500/20 p-3.5 rounded-xl">
                      <ShieldAlert className="w-5 h-5" /> {otpError}
                    </div>
                  )}
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-800">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="consent"
                      className="accent-amber-400 w-4 h-4 cursor-pointer mt-0.5"
                      checked={formData.consentAccepted}
                      onChange={(e) => handleFieldChange('consentAccepted', e.target.checked)}
                    />
                    <label htmlFor="consent" className="text-xs text-slate-300 leading-relaxed cursor-pointer select-none">
                      I agree to receive transactional updates and counselling calls from ApexBee Academy coordinators regarding my selection and course interest. Privacy Policy applies.
                    </label>
                  </div>
                </div>

                <div className="flex justify-between pt-6 border-t border-slate-800">
                  <Button variant="outline" size="sm" onClick={() => setStep(4)} className="rounded-xl border-slate-800 text-white hover:bg-slate-800">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSubmitLead}
                    disabled={loading || !otpVerified || !formData.consentAccepted}
                    className="bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-slate-950 font-black rounded-xl border-none px-8 py-3.5"
                  >
                    Submit Registration
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 6: Success Confirmation */}
            {step === 6 && (
              <div className="text-center space-y-6 py-8 animate-fade-in">
                <div className="w-20 h-20 bg-green-500/10 border-2 border-green-500/30 rounded-full flex items-center justify-center text-green-400 mx-auto shadow-inner">
                  <CheckCircle className="w-10 h-10" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-2xl sm:text-3xl font-black text-white">Interest Registered!</h3>
                  <p className="text-sm text-slate-400 max-w-md mx-auto">
                    {leadResult?.duplicate
                      ? 'You have already registered an interest for this program path recently. We have logged your request.'
                      : 'Thank you for your interest! A counselor will reach out to you shortly with course dates and requirements.'}
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 max-w-sm mx-auto space-y-2">
                  <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">Lead Reference ID</span>
                  <div className="text-2xl font-black text-amber-400 font-mono tracking-widest">
                    {leadResult?.data?.leadId}
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium">Status: {leadResult?.data?.status}</div>
                </div>

                <div className="pt-6">
                  <Button
                    size="sm"
                    onClick={() => {
                      setStep(1);
                      setInterestType(null);
                      setOtpSent(false);
                      setOtpVerified(false);
                      setFormData({
                        fullName: '',
                        mobile: '',
                        email: '',
                        selectedInterests: [],
                        stateId: '',
                        districtId: '',
                        mandalId: '',
                        city: '',
                        pincode: '',
                        preferredLanguage: 'English',
                        preferredContactMethod: 'call',
                        occupation: '',
                        qualification: '',
                        employmentStatus: '',
                        investmentRange: '',
                        ownBusinessLocation: false,
                        preferredBusinessLocation: '',
                        expectedStartTimeline: '',
                        learningMode: '',
                        experienceLevel: '',
                        preferredSchedule: '',
                        certificationRequired: false,
                        jobAssistanceRequired: false,
                        consentAccepted: false,
                      });
                    }}
                    className="bg-slate-800 hover:bg-slate-700 text-white rounded-xl border-none px-6"
                  >
                    Done
                  </Button>
                </div>
              </div>
            )}
          </Card>
        )}
      </main>

      <Footer />
    </div>
  );
}
