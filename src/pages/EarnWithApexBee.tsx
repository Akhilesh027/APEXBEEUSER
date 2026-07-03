// src/pages/EarnWithApexBee.tsx — Module 9: Business Opportunity Marketplace
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Briefcase,
  Users,
  TrendingUp,
  ChevronRight,
  ChevronLeft,
  Star,
  CheckCircle,
  MapPin,
  Phone,
  Mail,
  FileText,
  Loader2,
  X,
  Award,
  Clock,
  AlertCircle,
  ShoppingBag,
  BookOpen,
  Truck as TruckIcon,
  GraduationCap,
  Building2,
  Factory,
  Warehouse,
  Wrench,
  Play,
  UploadCloud,
  Check,
  ExternalLink,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const API_BASE = "https://server.apexbee.in/api";

const PORTAL_LINKS: Record<string, string> = {
  admin: "http://localhost:5173",
  vendor: "http://localhost:5177",
  franchise: "http://localhost:5175",
  state_franchise: "http://localhost:5175",
  district_franchise: "http://localhost:5175",
  mandal_franchise: "http://localhost:5175",
  service_provider: "http://localhost:5176",
  course_provider: "http://localhost:5174",
};

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
type Opportunity = {
  id: string;
  role: string;
  emoji: string;
  tagline: string;
  incomePotential: string;
  color: string;
  gradient: string;
  requirements: string[];
  benefits: string[];
  overview: string;
  responsibilities: string[];
  incomeModel: string[];
  trainingProcess: string[];
  faqs: { q: string; a: string }[];
};

type Application = {
  _id: string;
  role: string;
  status: string;
  createdAt: string;
  name?: string;
  documents?: {
    aadhaar?: string;
    pan?: string;
    gst?: string;
    license?: string;
  };
};

type SuccessStory = {
  name: string;
  role: string;
  location: string;
  earnings: string;
  quote: string;
  avatar: string;
};

// ─────────────────────────────────────────────
// Data
// ─────────────────────────────────────────────
const OPPORTUNITIES: Opportunity[] = [
  {
    id: "vendor",
    role: "Become a Vendor",
    emoji: "🏪",
    tagline: "Sell products online & get local customers",
    incomePotential: "₹30,000 – ₹2,00,000/month",
    color: "#0EA5E9",
    gradient: "from-blue-500 to-cyan-600",
    requirements: ["GSTIN or Udyam Registration", "Product inventory", "Bank account for settlements", "Smartphone with internet"],
    benefits: ["Zero listing fees for 3 months", "ApexBee delivery network", "Inventory management tools", "Customer insights dashboard", "Marketing support"],
    overview: "Open your digital storefront on ApexBee and reach thousands of local customers. List your products, manage orders, and grow your business with our end-to-end tools.",
    responsibilities: ["List and manage products", "Process & fulfill orders", "Maintain quality standards", "Handle customer queries", "Keep inventory updated"],
    incomeModel: ["Earn from product sales", "0% commission for first 3 months", "5-10% platform fee after", "Weekly settlements to bank", "Bonus for high ratings"],
    trainingProcess: ["Online vendor onboarding (2 hours)", "Product listing masterclass", "Order management walkthrough", "Growth & marketing tips"],
    faqs: [
      { q: "How long does vendor approval take?", a: "Typically 24-48 hours after document verification." },
      { q: "What are the fees?", a: "Zero for the first 3 months, then 5-10% per order depending on category." },
      { q: "Can I sell multiple categories?", a: "Yes, you can list products across multiple categories." },
    ],
  },
  {
    id: "manufacturer",
    role: "Become a Manufacturer",
    emoji: "🏭",
    tagline: "Supply products directly to vendors & customers",
    incomePotential: "₹50,000 – ₹5,00,000/month",
    color: "#8B5CF6",
    gradient: "from-purple-500 to-indigo-600",
    requirements: ["Manufacturing license", "Quality certifications", "Bulk production capability", "Logistics readiness"],
    benefits: ["Direct B2B marketplace", "Bulk order management", "Quality badge program", "Vendor network access", "Priority logistics support"],
    overview: "Connect directly with ApexBee vendors and customers. Supply your manufactured goods at scale and expand your distribution network across regions.",
    responsibilities: ["Maintain production quality", "Fulfill bulk orders on time", "Provide product certifications", "Manage inventory levels", "Support vendor partnerships"],
    incomeModel: ["B2B bulk order revenue", "Direct-to-customer premium sales", "Volume-based incentives", "Repeat order bonuses"],
    trainingProcess: ["Manufacturer portal walkthrough", "Quality standards briefing", "B2B pricing strategy", "Logistics integration training"],
    faqs: [
      { q: "Minimum order quantity?", a: "You set your own MOQ. We suggest starting with manageable quantities." },
      { q: "How are payments processed?", a: "Bi-weekly settlements with detailed invoicing." },
    ],
  },
  {
    id: "wholesaler",
    role: "Become a Wholesaler",
    emoji: "📦",
    tagline: "Supply products in bulk to local vendors",
    incomePotential: "₹40,000 – ₹3,00,000/month",
    color: "#F59E0B",
    gradient: "from-yellow-500 to-orange-500",
    requirements: ["Trade license", "Warehouse or storage", "Bulk inventory", "Transportation capability"],
    benefits: ["B2B marketplace listing", "Vendor matching algorithm", "Automated reorder alerts", "Credit line for top wholesalers", "Dedicated account manager"],
    overview: "Become a wholesale supplier for the ApexBee vendor ecosystem. Distribute products at scale and build lasting B2B relationships.",
    responsibilities: ["Maintain adequate stock levels", "Offer competitive bulk pricing", "Ensure timely delivery", "Provide trade documentation", "Support vendor re-orders"],
    incomeModel: ["Wholesale margin on bulk orders", "Volume incentives", "Early payment discounts you offer", "Regional distribution bonuses"],
    trainingProcess: ["Wholesale portal setup", "Pricing strategy workshop", "Vendor relationship management", "Supply chain best practices"],
    faqs: [
      { q: "What categories can I wholesale?", a: "All product categories available on ApexBee." },
      { q: "Is there a minimum commitment?", a: "No long-term contracts required. List and fulfill at your pace." },
    ],
  },
  {
    id: "entrepreneur",
    role: "Become an Entrepreneur",
    emoji: "🚀",
    tagline: "Find vendors, onboard businesses & earn incentives",
    incomePotential: "₹20,000 – ₹1,50,000/month",
    color: "#10B981",
    gradient: "from-emerald-500 to-green-600",
    requirements: ["Strong local network", "Communication skills", "Smartphone", "Willingness to travel locally"],
    benefits: ["Per-vendor onboarding bonus", "Recurring commission on vendor sales", "Training & certification", "Growth path to Franchise", "Marketing materials provided"],
    overview: "Help grow the ApexBee ecosystem by finding and onboarding local businesses. Earn incentives for every vendor you bring on board and ongoing commissions from their sales.",
    responsibilities: ["Identify potential vendors", "Explain ApexBee benefits", "Help with onboarding process", "Support new vendors initially", "Build your local business network"],
    incomeModel: ["₹500-₹2000 per vendor onboarded", "2-5% recurring commission on vendor sales", "Team-building bonuses", "Quarterly performance incentives"],
    trainingProcess: ["Entrepreneur certification course", "Sales & pitching workshop", "Vendor onboarding tools training", "Monthly strategy calls"],
    faqs: [
      { q: "Do I need any investment?", a: "No investment required. Just your time and network." },
      { q: "How do I get paid?", a: "Weekly payouts to your ApexBee Wallet, transferable to bank." },
    ],
  },
  {
    id: "franchise",
    role: "Become a Franchise Partner",
    emoji: "🏢",
    tagline: "Own a district, mandal, or state franchise",
    incomePotential: "₹1,00,000 – ₹10,00,000/month",
    color: "#EF4444",
    gradient: "from-red-500 to-rose-600",
    requirements: ["Investment capacity (varies by tier)", "Business experience", "Team management skills", "Local market knowledge"],
    benefits: ["Exclusive territory rights", "Complete business infrastructure", "Team of entrepreneurs under you", "Revenue from all territory activity", "Corporate support & training"],
    overview: "Lead the ApexBee ecosystem in your region. As a franchise partner, you manage vendors, entrepreneurs, and service providers within your territory.",
    responsibilities: ["Manage territory operations", "Recruit & mentor entrepreneurs", "Ensure service quality in region", "Drive local marketing", "Report to corporate team"],
    incomeModel: [
      "District Franchise: ₹1L-₹3L/month",
      "Mandal Franchise: ₹3L-₹5L/month",
      "State Franchise: ₹5L-₹10L/month",
      "Override commissions from team",
      "Territory growth bonuses",
    ],
    trainingProcess: ["2-day corporate training", "Territory planning workshop", "Team management certification", "Monthly strategy reviews"],
    faqs: [
      { q: "What investment is required?", a: "Varies by tier: District ₹2L, Mandal ₹5L, State ₹15L+." },
      { q: "Is the territory exclusive?", a: "Yes, you get exclusive rights for your region." },
    ],
  },
  {
    id: "service_provider",
    role: "Become a Service Provider",
    emoji: "🔧",
    tagline: "Get local jobs, manage services & grow your base",
    incomePotential: "₹15,000 – ₹80,000/month",
    color: "#06B6D4",
    gradient: "from-cyan-500 to-teal-600",
    requirements: ["Relevant skill or certification", "Tools & equipment", "Smartphone", "Willingness to serve in locality"],
    benefits: ["Steady flow of local jobs", "Customer rating system", "Flexible schedule", "Training & upskilling", "Insurance coverage (coming soon)"],
    overview: "List your services on ApexBee and receive job requests from customers in your area. From plumbing to beauty services, grow your customer base effortlessly.",
    responsibilities: ["Accept and complete service requests", "Maintain service quality", "Arrive on time", "Keep professional conduct", "Manage your availability"],
    incomeModel: ["Earn per completed service", "Tips from happy customers", "Bonus for 5-star ratings", "Referral bonus for new providers", "Weekend & holiday surge pricing"],
    trainingProcess: ["Service standards orientation", "App usage training", "Customer handling workshop", "Safety & compliance briefing"],
    faqs: [
      { q: "What services can I offer?", a: "Cleaning, plumbing, electrical, salon, AC repair, painting, and more." },
      { q: "How do I receive payments?", a: "Payments are processed digitally after service completion." },
    ],
  },
  {
    id: "delivery_partner",
    role: "Become a Delivery Partner",
    emoji: "🛵",
    tagline: "Flexible working, daily earnings & incentives",
    incomePotential: "₹12,000 – ₹40,000/month",
    color: "#F97316",
    gradient: "from-orange-500 to-amber-600",
    requirements: ["Two-wheeler or bicycle", "Valid driving license", "Smartphone with GPS", "Delivery bag (provided)"],
    benefits: ["Daily pay-outs", "Flexible working hours", "Area-based deliveries", "Performance incentives", "Accident insurance"],
    overview: "Join the ApexBee delivery fleet and earn by delivering products to customers in your area. Work on your own schedule with daily payouts.",
    responsibilities: ["Pick up orders from vendors", "Deliver to customers on time", "Handle packages with care", "Update delivery status in app", "Maintain delivery quality"],
    incomeModel: ["₹30-₹60 per delivery", "Daily incentives for 10+ deliveries", "Peak hour bonuses", "Weekend surge earnings", "Monthly performance rewards"],
    trainingProcess: ["1-hour onboarding session", "App & navigation training", "Delivery best practices", "Safety guidelines briefing"],
    faqs: [
      { q: "Can I choose my working hours?", a: "Yes, complete flexibility. Choose shifts that suit you." },
      { q: "How often do I get paid?", a: "Daily payouts to your ApexBee Wallet." },
    ],
  },
  {
    id: "course_provider",
    role: "Become a Course Provider",
    emoji: "🎓",
    tagline: "Upload courses, teach online & earn revenue",
    incomePotential: "₹20,000 – ₹2,00,000/month",
    color: "#6366F1",
    gradient: "from-indigo-500 to-violet-600",
    requirements: ["Expertise in your subject", "Quality recording equipment", "Course content prepared", "Teaching experience preferred"],
    benefits: ["Reach thousands of learners", "Automated enrollment & payments", "Issue branded certificates", "Student analytics dashboard", "Marketing support from ApexBee"],
    overview: "Create and sell courses on the ApexBee Academy. Share your knowledge, build a student base, and earn recurring revenue from course enrollments.",
    responsibilities: ["Create high-quality course content", "Respond to student queries", "Update courses periodically", "Maintain completion rates", "Participate in webinars"],
    incomeModel: ["70% revenue share on course sales", "Bonus for high ratings", "Affiliate commission for referred courses", "Subscription model for premium content"],
    trainingProcess: ["Course creation workshop", "Recording & editing tips", "Platform upload walkthrough", "Marketing your course"],
    faqs: [
      { q: "What subjects can I teach?", a: "Business, technology, finance, design, marketing, languages, and more." },
      { q: "Do I need professional recording?", a: "Good quality phone recording is sufficient to start." },
    ],
  },
  {
    id: "trainer",
    role: "Become a Trainer",
    emoji: "🎤",
    tagline: "Train entrepreneurs, vendors & partners",
    incomePotential: "₹25,000 – ₹1,00,000/month",
    color: "#EC4899",
    gradient: "from-pink-500 to-rose-500",
    requirements: ["Training/coaching experience", "Domain expertise", "Presentation skills", "Availability for sessions"],
    benefits: ["Paid training sessions", "Corporate-backed programs", "Growing audience", "Recognition & awards", "Career growth into leadership"],
    overview: "Become an official ApexBee trainer and conduct training sessions for vendors, entrepreneurs, and business partners across the ecosystem.",
    responsibilities: ["Conduct training sessions", "Prepare training materials", "Evaluate participant progress", "Provide actionable feedback", "Stay updated with platform changes"],
    incomeModel: ["₹2000-₹5000 per session", "Monthly retainer for top trainers", "Bonus for trainer ratings", "Travel allowance for offline sessions"],
    trainingProcess: ["Train-the-trainer certification", "Content creation workshop", "Public speaking bootcamp", "ApexBee ecosystem deep dive"],
    faqs: [
      { q: "Are sessions online or offline?", a: "Both! We offer hybrid training programs." },
      { q: "How are trainers evaluated?", a: "Based on participant feedback, completion rates, and content quality." },
    ],
  },
];

const SUCCESS_STORIES: SuccessStory[] = [
  { name: "Rajesh Kumar", role: "Top Vendor", location: "Bangalore", earnings: "₹1,80,000/month", quote: "ApexBee gave me a platform to reach 10x more customers than my physical store!", avatar: "🏆" },
  { name: "Priya Sharma", role: "Top Entrepreneur", location: "Hyderabad", earnings: "₹95,000/month", quote: "I onboarded 45 vendors in 6 months. The commissions are life-changing.", avatar: "🚀" },
  { name: "Amit Patel", role: "Top Franchise Partner", location: "Ahmedabad", earnings: "₹4,50,000/month", quote: "Managing the district franchise is the best business decision I ever made.", avatar: "🏢" },
  { name: "Sunita Devi", role: "Top Service Provider", location: "Delhi", earnings: "₹65,000/month", quote: "From 2-3 jobs a week to 5+ daily! ApexBee transformed my service business.", avatar: "🔧" },
];

const APPLICATION_STATUS: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending Review", color: "bg-orange-100 text-orange-700 border-orange-200" },
  under_review: { label: "Under Review", color: "bg-blue-100 text-blue-700 border-blue-200" },
  approved: { label: "Approved! 🎉", color: "bg-green-100 text-green-700 border-green-200" },
  rejected: { label: "Not Approved", color: "bg-red-100 text-red-700 border-red-200" },
};

// ─────────────────────────────────────────────
// Helper Utilities & Components
// ─────────────────────────────────────────────
const getAuth = () => {
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const token = localStorage.getItem("token");
  return { user, token };
};

const getRequiredDocs = (roleId: string) => {
  const r = roleId.toLowerCase().trim();
  if (r === "vendor" || r === "wholesaler" || r === "manufacturer") {
    return [
      { key: "aadhaar", label: "Aadhaar Card (Front & Back)" },
      { key: "pan", label: "PAN Card" },
      { key: "gst", label: "GST Certificate / Business Registration" }
    ];
  } else if (r === "delivery_partner") {
    return [
      { key: "aadhaar", label: "Aadhaar Card" },
      { key: "license", label: "Driving License" }
    ];
  } else {
    return [
      { key: "aadhaar", label: "Aadhaar Card" },
      { key: "pan", label: "PAN Card" }
    ];
  }
};

const KycUploadSection = ({ application, onSuccess }: { application: Application; onSuccess: () => void }) => {
  const docsList = getRequiredDocs(application.role);
  const [selectedFiles, setSelectedFiles] = useState<Record<string, File>>({});
  const [submitting, setSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [isError, setIsError] = useState(false);
  const [editFields, setEditFields] = useState<Record<string, boolean>>({});
  const handleFileChange = (key: string, file: File | null) => {
    if (!file) {
      const updated = { ...selectedFiles };
      delete updated[key];
      setSelectedFiles(updated);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("File size must be less than 5MB");
      return;
    }
    setSelectedFiles({ ...selectedFiles, [key]: file });
  };

  const uploadFile = async (file: File): Promise<string> => {
    const { token } = getAuth();
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`${API_BASE}/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: formData
    });

    if (!res.ok) {
      throw new Error(`Upload failed for ${file.name}`);
    }

    const data = await res.json();
    if (!data.success || !data.url) {
      throw new Error(`Invalid response for ${file.name}`);
    }

    return data.url;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { token } = getAuth();
    if (!token) return;

    const missingDocs = docsList.filter(d => !application.documents?.[d.key] && !selectedFiles[d.key]);
    if (missingDocs.length > 0) {
      setIsError(true);
      setStatusMsg(`Please select files for: ${missingDocs.map(d => d.label).join(", ")}`);
      return;
    }

    setSubmitting(true);
    setStatusMsg("Uploading files...");
    setIsError(false);

    try {
      const uploadedUrls: Record<string, string> = {};

      for (const [key, file] of Object.entries(selectedFiles)) {
        setStatusMsg(`Uploading ${key.toUpperCase()}...`);
        const url = await uploadFile(file);
        uploadedUrls[key] = url;
      }

      setStatusMsg("Saving document details...");
      const res = await fetch(`${API_BASE}/business-applications/${application._id}/kyc`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ documents: uploadedUrls })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to update KYC documents");
      }

      setStatusMsg("✅ KYC documents updated successfully!");
      setSelectedFiles({});
      setEditFields({});
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (err: any) {
      setIsError(true);
      setStatusMsg(err.message || "Something went wrong during file upload");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 p-4 border rounded-xl bg-gray-50/50 space-y-4 w-full">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-sm text-navy">KYC Document Upload</h4>
        <span className="text-xs text-muted-foreground font-medium">Supported formats: PDF, JPG, PNG (Max 5MB)</span>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {docsList.map((doc) => {
          const existingUrl = application.documents?.[doc.key];
          const hasSelected = !!selectedFiles[doc.key];

          return (
            <div key={doc.key} className="p-3 bg-white border rounded-lg space-y-2">
              <label className="text-xs font-semibold text-gray-700 block">{doc.label}</label>

              {existingUrl && !editFields[doc.key] ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs bg-green-50 border border-green-200 text-green-700 p-2 rounded">
                    <span className="flex items-center gap-1">
                      <Check className="w-3.5 h-3.5 text-green-600" /> Uploaded Successfully
                    </span>
                    <a
                      href={existingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 font-semibold flex items-center gap-0.5 hover:underline"
                    >
                      View <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditFields({ ...editFields, [doc.key]: true })}
                    className="text-xs text-navy font-medium hover:underline block"
                  >
                    Re-upload Document
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="relative border border-dashed border-gray-300 rounded-lg p-3 hover:bg-gray-50 transition-colors text-center cursor-pointer">
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={(e) => handleFileChange(doc.key, e.target.files?.[0] || null)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <UploadCloud className="w-6 h-6 text-muted-foreground mx-auto mb-1" />
                    <span className="text-xs text-gray-600 font-medium block">
                      {hasSelected ? selectedFiles[doc.key].name : "Choose File"}
                    </span>
                  </div>
                  {existingUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        const updatedEdit = { ...editFields };
                        delete updatedEdit[doc.key];
                        setEditFields(updatedEdit);
                        handleFileChange(doc.key, null);
                      }}
                      className="text-xs text-red-600 font-medium hover:underline block"
                    >
                      Cancel Re-upload
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {statusMsg && (
        <p className={`text-xs font-semibold ${isError ? "text-red-600" : "text-green-700"}`}>
          {statusMsg}
        </p>
      )}

      {(Object.keys(selectedFiles).length > 0 || docsList.some(d => !application.documents?.[d.key])) && (
        <Button
          type="submit"
          className="w-full bg-navy hover:bg-navy/90 text-white font-semibold text-xs py-2"
          disabled={submitting}
        >
          {submitting ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" /> Uploading Documents...
            </>
          ) : (
            <>
              <CheckCircle className="w-3.5 h-3.5 mr-2" /> Submit KYC Documents
            </>
          )}
        </Button>
      )}
    </form>
  );
};

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────
const EarnWithApexBee = () => {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState<"home" | "detail" | "apply" | "applications">("home");
  const [selectedOpp, setSelectedOpp] = useState<Opportunity | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [appLoading, setAppLoading] = useState(false);
  const [selectedState, setSelectedState] = useState("Telangana");
  const [selectedDistrict, setSelectedDistrict] = useState("Hyderabad");
  const [selectedMandal, setSelectedMandal] = useState("Ameerpet");
  const [locationData, setLocationData] = useState<Record<string, Record<string, string[]>>>({});
  // Form state
  const [formName, setFormName] = useState("");
  const [formMobile, setFormMobile] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formLocation, setFormLocation] = useState("");
  const [formExperience, setFormExperience] = useState("");
  const [formRemarks, setFormRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Role-specific form states
  const [businessName, setBusinessName] = useState("");
  const [gstNumber, setGstNumber] = useState("");
  const [panNumber, setPanNumber] = useState("");
  const [aadhaarNumber, setAadhaarNumber] = useState("");
  const [franchiseLevel, setFranchiseLevel] = useState("mandal");
  const [investmentCapacity, setInvestmentCapacity] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [sampleVideoLink, setSampleVideoLink] = useState("");
  const [vehicleType, setVehicleType] = useState("Two-Wheeler");
  const [licenseNumber, setLicenseNumber] = useState("");

  useEffect(() => {
    const fetchTerritories = async () => {
      try {
        const res = await fetch(`${API_BASE}/business-applications/territories`);
        const data = await res.json();

        if (data?.success && Array.isArray(data.territories)) {
          const formatted: Record<string, Record<string, Set<string>>> = {};

          data.territories.forEach((t: any) => {
            const stateName = t.state?.trim();
            const districtName = t.district?.trim();
            const mandalName = t.mandal?.trim();

            if (stateName) {
              if (!formatted[stateName]) {
                formatted[stateName] = {};
              }
              if (districtName) {
                if (!formatted[stateName][districtName]) {
                  formatted[stateName][districtName] = new Set<string>();
                }
                if (mandalName) {
                  formatted[stateName][districtName].add(mandalName);
                }
              }
            }
          });

          // Convert Sets to arrays
          const finalData: Record<string, Record<string, string[]>> = {};
          Object.keys(formatted).forEach(s => {
            finalData[s] = {};
            Object.keys(formatted[s]).forEach(d => {
              finalData[s][d] = Array.from(formatted[s][d]);
            });
          });

          if (Object.keys(finalData).length > 0) {
            setLocationData(finalData);
          }
        }
      } catch (err) {
        console.error("Error fetching territories:", err);
      }
    };

    fetchTerritories();
  }, []);

  useEffect(() => {
    if (!locationData) return;
    const states = Object.keys(locationData);
    if (states.length > 0) {
      if (!states.includes(selectedState)) {
        const newState = states.includes("Telangana") ? "Telangana" : states[0];
        setSelectedState(newState);

        const districts = Object.keys(locationData[newState] || {});
        const newDist = districts[0] || "";
        setSelectedDistrict(newDist);

        const mandals = locationData[newState]?.[newDist] || [];
        setSelectedMandal(mandals[0] || "");
      }
    }
  }, [locationData]);

  useEffect(() => {
    if (!locationData || !selectedState) return;
    const districts = Object.keys(locationData[selectedState] || {});
    const firstDistrict = districts[0] || "";
    const firstMandal = locationData[selectedState]?.[firstDistrict]?.[0] || "";

    if (!districts.includes(selectedDistrict)) {
      setSelectedDistrict(firstDistrict);
      setSelectedMandal(firstMandal);
    }
  }, [selectedState, locationData]);

  useEffect(() => {
    if (!locationData || !selectedState || !selectedDistrict) return;
    const mandals = locationData[selectedState]?.[selectedDistrict] || [];

    if (!mandals.includes(selectedMandal)) {
      setSelectedMandal(mandals[0] || "");
    }
  }, [selectedDistrict, selectedState, locationData]);
  const handleGoToPortal = (oppId: string) => {
    const { user } = getAuth();
    const userRoles = Array.isArray(user?.roles) ? user.roles : [];
    const rolesList = userRoles.map((r: string) => r.toLowerCase());

    let matchingRole = oppId;
    if (oppId === "franchise") {
      matchingRole = rolesList.find(r => r.includes("franchise")) || "franchise";
    }

    const url = PORTAL_LINKS[matchingRole] || "http://localhost:5173";
    localStorage.setItem("activeRole", matchingRole);
    window.location.href = url;
  };

  const fetchApplications = useCallback(async () => {
    const { user, token } = getAuth();
    if (!user || !token) return;
    const uid = user._id || user.id;
    try {
      const res = await fetch(`${API_BASE}/business-applications/user/${uid}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data?.applications) setApplications(data.applications);
    } catch { /* silent */ }
  }, []);

  useEffect(() => { fetchApplications(); }, [fetchApplications]);

  const openDetail = (opp: Opportunity) => { setSelectedOpp(opp); setActiveView("detail"); };

  const openApply = (opp: Opportunity) => {
    const { user } = getAuth();
    setSelectedOpp(opp);
    setFormName(user?.name || "");
    setFormEmail(user?.email || "");
    setFormMobile(user?.phone || "");
    setFormLocation("");
    setFormExperience("");
    setFormRemarks("");
    // Reset role-specific states
    setBusinessName("");
    setGstNumber("");
    setPanNumber("");
    setAadhaarNumber("");
    setFranchiseLevel("mandal");
    setInvestmentCapacity("");
    setServiceType("");
    setSampleVideoLink("");
    setVehicleType("Two-Wheeler");
    setLicenseNumber("");
    setActiveView("apply");
    setSelectedState("Telangana");
    setSelectedDistrict("Hyderabad");
    setSelectedMandal("Ameerpet");
  };

  const handleSubmitApplication = async () => {
    if (!formName.trim() || !formMobile.trim() || !formEmail.trim() || !formLocation.trim()) {
      alert("Please fill in all basic required fields (Name, Mobile, Email, Location).");
      return;
    }

    const type = selectedOpp?.id || "";

    // Role-specific frontend validation
    if (type === "vendor" || type === "wholesaler" || type === "manufacturer") {
      if (!businessName.trim() || !gstNumber.trim() || !panNumber.trim()) {
        alert("Please fill in Business Name, GST Number, and PAN Number.");
        return;
      }
    } else if (type === "franchise") {
      if (!businessName.trim() || !franchiseLevel.trim() || !investmentCapacity.trim() || !panNumber.trim()) {
        alert("Please fill in Business Name, Franchise Level, Investment Capacity, and PAN Number.");
        return;
      }
    } else if (type === "entrepreneur") {
      if (!panNumber.trim()) {
        alert("Please fill in your PAN Number.");
        return;
      }
    } else if (type === "service_provider") {
      if (!businessName.trim() || !serviceType.trim() || !panNumber.trim()) {
        alert("Please fill in Business Name, Service Type, and PAN Number.");
        return;
      }
    } else if (type === "course_provider") {
      if (!businessName.trim() || !serviceType.trim() || !sampleVideoLink.trim()) {
        alert("Please fill in Academy/Instructor Name, Domain/Subject, and Sample Video Link.");
        return;
      }
    } else if (type === "delivery_partner") {
      if (!vehicleType.trim() || !licenseNumber.trim() || !aadhaarNumber.trim()) {
        alert("Please fill in Vehicle Type, Driving License Number, and Aadhaar Number.");
        return;
      }
    }

    setSubmitting(true);
    try {
      const { user, token } = getAuth();
      if (!user || !token) { navigate("/login"); return; }
      const payload = {
        userId: user._id || user.id,
        role: selectedOpp?.role || "",
        roleId: selectedOpp?.id || "",
        applicationType: selectedOpp?.id || "",
        name: formName,
        mobile: formMobile,
        email: formEmail,
        location: formLocation,
        experience: formExperience,
        remarks: formRemarks,
        businessName: businessName || formName || "Business Opportunity",
        ownerName: formName,
        address: formLocation,
        pincode: "504312",
        state: selectedState,
        district: selectedDistrict,
        mandal: selectedMandal,
        gstNumber,
        panNumber,
        aadhaarNumber,
        franchiseLevel,
        investmentCapacity,
        serviceType: serviceType || selectedOpp?.role,
        sampleVideoLink,
        vehicleType,
        licenseNumber,
      };
      const res = await fetch(`${API_BASE}/business-applications`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        alert(errData.message || "Failed to submit application.");
        return;
      }

      await fetchApplications();
      alert("✅ Application submitted successfully! We'll review it within 48 hours.");
      setActiveView("applications");
    } catch {
      alert("Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ─── HOME VIEW ────────────────────────────────────────────────────
  const renderHome = () => (
    <div className="space-y-8">
      {/* Hero */}
      <div className="rounded-2xl bg-gradient-to-r from-navy to-blue-800 text-white p-8 text-center">
        <span className="text-5xl block mb-3">🐝</span>
        <h1 className="text-3xl md:text-4xl font-bold mb-2">Earn With ApexBee</h1>
        <p className="text-lg opacity-80 max-w-2xl mx-auto">Discover business opportunities. Turn your skills, network, and passion into income.</p>
        <div className="flex justify-center gap-3 mt-5">
          <Button className="bg-white text-navy hover:bg-white/90 font-semibold" onClick={() => setActiveView("applications")}>
            <FileText className="w-4 h-4 mr-2" /> My Applications
          </Button>
        </div>
      </div>

      {/* Opportunity Cards Grid */}
      <div>
        <h2 className="text-xl font-bold text-navy mb-4">🚀 Business Opportunities</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {OPPORTUNITIES.map((opp) => {
            const { user } = getAuth();
            const userRoles = Array.isArray(user?.roles) ? user.roles : [];
            const rolesList = userRoles.map((r: string) => r.toLowerCase());

            const isApproved = opp.id === "franchise"
              ? rolesList.some((r: string) => r.includes("franchise"))
              : rolesList.includes(opp.id);

            const matchingApp = applications.find(
              (app) => app.role === opp.id
            );

            const isPending = matchingApp && (matchingApp.status === "pending" || matchingApp.status === "under_review");

            return (
              <Card key={opp.id} className="hover:shadow-lg transition-shadow overflow-hidden group cursor-pointer" onClick={() => openDetail(opp)}>
                <div className={`h-2 bg-gradient-to-r ${opp.gradient}`} />
                <CardContent className="p-5">
                  <div className="flex items-start gap-3 mb-3">
                    <span className="text-3xl">{opp.emoji}</span>
                    <div>
                      <h3 className="font-bold text-navy group-hover:text-blue-700 transition-colors">{opp.role}</h3>
                      <p className="text-xs text-muted-foreground">{opp.tagline}</p>
                    </div>
                  </div>

                  <div className="bg-green-50 rounded-lg p-2.5 mb-3">
                    <p className="text-xs text-muted-foreground">Monthly Income Potential</p>
                    <p className="font-bold text-green-700 text-sm">{opp.incomePotential}</p>
                  </div>

                  <div className="mb-3">
                    <p className="text-xs font-medium text-navy mb-1.5">Key Benefits:</p>
                    <div className="flex flex-wrap gap-1">
                      {opp.benefits.slice(0, 3).map((b, i) => (
                        <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{b}</span>
                      ))}
                      {opp.benefits.length > 3 && <span className="text-xs text-muted-foreground">+{opp.benefits.length - 3} more</span>}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={(e) => { e.stopPropagation(); openDetail(opp); }}>
                      Learn More <ChevronRight className="w-3 h-3 ml-1" />
                    </Button>
                    {isApproved ? (
                      <Button
                        size="sm"
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleGoToPortal(opp.id);
                        }}
                      >
                        Go To Portal <ExternalLink className="w-3 h-3 ml-1" />
                      </Button>
                    ) : isPending ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-xs border-orange-200 bg-orange-50 text-orange-700 font-semibold"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveView("applications");
                        }}
                      >
                        Under Review
                      </Button>
                    ) : (
                      <Button size="sm" className="flex-1 bg-navy hover:bg-navy/90 text-white text-xs" onClick={(e) => { e.stopPropagation(); openApply(opp); }}>
                        Apply Now
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Success Stories */}
      <div>
        <h2 className="text-xl font-bold text-navy mb-4">🌟 Success Stories</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {SUCCESS_STORIES.map((story, i) => (
            <Card key={i} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5 text-center">
                <span className="text-4xl block mb-2">{story.avatar}</span>
                <p className="font-bold text-navy">{story.name}</p>
                <Badge className="bg-navy/10 text-navy text-xs mb-2">{story.role}</Badge>
                <p className="text-xs text-muted-foreground flex items-center justify-center gap-1 mb-2">
                  <MapPin className="w-3 h-3" /> {story.location}
                </p>
                <p className="text-green-700 font-bold text-sm mb-2">{story.earnings}</p>
                <p className="text-xs text-muted-foreground italic">"{story.quote}"</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Training Resources */}
      <Card className="border-2 border-dashed border-navy/20">
        <CardContent className="p-6">
          <h2 className="text-xl font-bold text-navy mb-3 flex items-center gap-2">
            <GraduationCap className="w-5 h-5" /> Training & Resources
          </h2>
          <p className="text-sm text-muted-foreground mb-4">Before applying, explore our training materials to understand each opportunity better.</p>
          <div className="grid sm:grid-cols-3 gap-3">
            {[
              { title: "Video Guides", desc: "Watch step-by-step tutorials", icon: <Play className="w-5 h-5" />, count: "12 videos" },
              { title: "Documentation", desc: "Read detailed opportunity guides", icon: <BookOpen className="w-5 h-5" />, count: "9 guides" },
              { title: "FAQs", desc: "Get answers to common questions", icon: <FileText className="w-5 h-5" />, count: "50+ FAQs" },
            ].map((res, i) => (
              <div key={i} className="p-4 border rounded-lg flex items-start gap-3 hover:bg-navy/5 transition-colors cursor-pointer">
                <div className="w-10 h-10 rounded-lg bg-navy/10 text-navy flex items-center justify-center flex-shrink-0">{res.icon}</div>
                <div>
                  <p className="font-medium text-sm text-navy">{res.title}</p>
                  <p className="text-xs text-muted-foreground">{res.desc}</p>
                  <p className="text-xs font-medium text-navy mt-1">{res.count}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // ─── DETAIL VIEW ──────────────────────────────────────────────────
  const renderDetail = () => {
    if (!selectedOpp) return null;
    const opp = selectedOpp;
    return (
      <div className="space-y-6">
        <button onClick={() => setActiveView("home")} className="flex items-center gap-1 text-sm text-navy font-medium hover:underline">
          <ChevronLeft className="w-4 h-4" /> Back to Opportunities
        </button>

        {/* Hero */}
        <div className={`rounded-2xl bg-gradient-to-r ${opp.gradient} text-white p-8`}>
          <div className="flex items-center gap-4 mb-4">
            <span className="text-5xl">{opp.emoji}</span>
            <div>
              <h1 className="text-3xl font-bold">{opp.role}</h1>
              <p className="opacity-80">{opp.tagline}</p>
            </div>
          </div>
          <div className="bg-white/10 rounded-xl p-4 inline-block">
            <p className="text-sm opacity-80">Income Potential</p>
            <p className="text-2xl font-bold">{opp.incomePotential}</p>
          </div>
        </div>

        {/* Overview */}
        <Card>
          <CardContent className="p-5">
            <h3 className="font-bold text-navy text-lg mb-2">📋 Overview</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{opp.overview}</p>
          </CardContent>
        </Card>

        {/* Responsibilities + Benefits */}
        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-5">
              <h3 className="font-bold text-navy mb-3">📌 Responsibilities</h3>
              <ul className="space-y-2">
                {opp.responsibilities.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm"><CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" /> {r}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <h3 className="font-bold text-navy mb-3">🎁 Benefits</h3>
              <ul className="space-y-2">
                {opp.benefits.map((b, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm"><Star className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" /> {b}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Income Model */}
        <Card>
          <CardContent className="p-5">
            <h3 className="font-bold text-navy text-lg mb-3">💰 Income Model</h3>
            <div className="grid sm:grid-cols-2 gap-2">
              {opp.incomeModel.map((item, i) => (
                <div key={i} className="p-3 bg-green-50 rounded-lg text-sm flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-600 flex-shrink-0" /> {item}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Requirements */}
        <Card>
          <CardContent className="p-5">
            <h3 className="font-bold text-navy text-lg mb-3">📝 Requirements</h3>
            <div className="grid sm:grid-cols-2 gap-2">
              {opp.requirements.map((req, i) => (
                <div key={i} className="p-3 border rounded-lg text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-navy flex-shrink-0" /> {req}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Training */}
        <Card>
          <CardContent className="p-5">
            <h3 className="font-bold text-navy text-lg mb-3">🎓 Training Process</h3>
            <div className="space-y-3">
              {opp.trainingProcess.map((step, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-navy text-white flex items-center justify-center text-sm font-bold flex-shrink-0">{i + 1}</div>
                  <p className="text-sm">{step}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* FAQs */}
        <Card>
          <CardContent className="p-5">
            <h3 className="font-bold text-navy text-lg mb-3">❓ Frequently Asked Questions</h3>
            <div className="space-y-3">
              {opp.faqs.map((faq, i) => (
                <div key={i} className="p-3 border rounded-lg">
                  <p className="font-medium text-sm text-navy">{faq.q}</p>
                  <p className="text-sm text-muted-foreground mt-1">{faq.a}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        {(() => {
          const { user } = getAuth();
          const userRoles = Array.isArray(user?.roles) ? user.roles : [];
          const rolesList = userRoles.map((r: string) => r.toLowerCase());

          const isApproved = opp.id === "franchise"
            ? rolesList.some((r: string) => r.includes("franchise"))
            : rolesList.includes(opp.id);

          const matchingApp = applications.find(
            (app) => app.role === opp.id
          );

          const isPending = matchingApp && (matchingApp.status === "pending" || matchingApp.status === "under_review");

          return (
            <div className="flex justify-center gap-4 pt-2">
              {isApproved ? (
                <Button
                  size="lg"
                  className="bg-green-600 hover:bg-green-700 text-white px-8"
                  onClick={() => handleGoToPortal(opp.id)}
                >
                  Go To Portal <ExternalLink className="w-4 h-4 ml-2" />
                </Button>
              ) : isPending ? (
                <Button
                  size="lg"
                  variant="outline"
                  className="border-orange-200 bg-orange-50 text-orange-700 px-8 font-semibold animate-pulse"
                  onClick={() => setActiveView("applications")}
                >
                  Under Review / View Application
                </Button>
              ) : (
                <Button size="lg" className="bg-navy hover:bg-navy/90 text-white px-8" onClick={() => openApply(opp)}>
                  Apply Now <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              )}
              <Button size="lg" variant="outline" onClick={() => setActiveView("home")}>Back</Button>
            </div>
          );
        })()}
      </div>
    );
  };

  // ─── APPLICATION FORM ─────────────────────────────────────────────
  const renderApplyForm = () => {
    if (!selectedOpp) return null;
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <button onClick={() => setActiveView("home")} className="flex items-center gap-1 text-sm text-navy font-medium hover:underline">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>

        <div className={`rounded-xl bg-gradient-to-r ${selectedOpp.gradient} text-white p-5 flex items-center gap-3`}>
          <span className="text-3xl">{selectedOpp.emoji}</span>
          <div>
            <h2 className="text-xl font-bold">Apply: {selectedOpp.role}</h2>
            <p className="text-sm opacity-80">{selectedOpp.incomePotential}</p>
          </div>
        </div>

        <Card>
          <CardContent className="p-6 space-y-4">
            <h3 className="font-bold text-navy text-lg">Application Form</h3>

            {[
              { label: "Full Name *", value: formName, set: setFormName, placeholder: "Enter your full name", type: "text" },
              { label: "Mobile Number *", value: formMobile, set: setFormMobile, placeholder: "+91 XXXXX XXXXX", type: "tel" },
              { label: "Email Address *", value: formEmail, set: setFormEmail, placeholder: "you@email.com", type: "email" },
              { label: "Location / City *", value: formLocation, set: setFormLocation, placeholder: "Your city or district", type: "text" },
              { label: "Relevant Experience", value: formExperience, set: setFormExperience, placeholder: "Brief summary of your experience", type: "text" },
            ].map((field, i) => (
              <div key={i}>
                <label className="text-sm font-medium block mb-1">{field.label}</label>
                <input
                  type={field.type}
                  value={field.value}
                  onChange={(e) => field.set(e.target.value)}
                  placeholder={field.placeholder}
                  className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30"
                />
              </div>
            ))}

            {/* Role-Specific Inputs Section */}
            {selectedOpp.id === "vendor" || selectedOpp.id === "wholesaler" || selectedOpp.id === "manufacturer" ? (
              <div className="space-y-4 pt-2 border-t border-gray-100">
                <h4 className="text-sm font-semibold text-navy">Business Information</h4>
                <div>
                  <label className="text-sm font-medium block mb-1">Business Name *</label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="Enter legal business name"
                    className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium block mb-1">GST Number *</label>
                    <input
                      type="text"
                      value={gstNumber}
                      onChange={(e) => setGstNumber(e.target.value)}
                      placeholder="e.g. 22AAAAA0000A1Z5"
                      className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-1">PAN Number *</label>
                    <input
                      type="text"
                      value={panNumber}
                      onChange={(e) => setPanNumber(e.target.value)}
                      placeholder="e.g. ABCDE1234F"
                      className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30"
                    />
                  </div>
                </div>
              </div>
            ) : null}

            {selectedOpp.id === "franchise" ? (
              <div className="space-y-4 pt-2 border-t border-gray-100">
                <h4 className="text-sm font-semibold text-navy">Franchise Details</h4>
                <div>
                  <label className="text-sm font-medium block mb-1">Proposed Franchise Hub Name *</label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="E.g. Pune City Central Hub"
                    className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium block mb-1">Franchise Tier Level *</label>
                    <select
                      value={franchiseLevel}
                      onChange={(e) => setFranchiseLevel(e.target.value)}
                      className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30 bg-white"
                    >
                      <option value="mandal">Mandal Franchise</option>
                      <option value="district">District Franchise</option>
                      <option value="state">State Franchise</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-1">Investment Capacity (INR Lakhs) *</label>
                    <input
                      type="text"
                      value={investmentCapacity}
                      onChange={(e) => setInvestmentCapacity(e.target.value)}
                      placeholder="E.g. 5 Lakhs"
                      className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">PAN Number *</label>
                  <input
                    type="text"
                    value={panNumber}
                    onChange={(e) => setPanNumber(e.target.value)}
                    placeholder="e.g. ABCDE1234F"
                    className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30"
                  />
                </div>
              </div>
            ) : null}

            {selectedOpp.id === "entrepreneur" ? (
              <div className="space-y-4 pt-2 border-t border-gray-100">
                <h4 className="text-sm font-semibold text-navy">Entrepreneur KYC</h4>
                <div>
                  <label className="text-sm font-medium block mb-1">PAN Number *</label>
                  <input
                    type="text"
                    value={panNumber}
                    onChange={(e) => setPanNumber(e.target.value)}
                    placeholder="e.g. ABCDE1234F"
                    className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30"
                  />
                </div>
              </div>
            ) : null}

            {selectedOpp.id === "service_provider" ? (
              <div className="space-y-4 pt-2 border-t border-gray-100">
                <h4 className="text-sm font-semibold text-navy">Service Provider Information</h4>
                <div>
                  <label className="text-sm font-medium block mb-1">Business or Service Name *</label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="E.g. Apex Cleaning Experts"
                    className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium block mb-1">Service Specialty Type *</label>
                    <input
                      type="text"
                      value={serviceType}
                      onChange={(e) => setServiceType(e.target.value)}
                      placeholder="E.g. Electrician, Plumbing, Salon"
                      className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-1">PAN Number *</label>
                    <input
                      type="text"
                      value={panNumber}
                      onChange={(e) => setPanNumber(e.target.value)}
                      placeholder="e.g. ABCDE1234F"
                      className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30"
                    />
                  </div>
                </div>
              </div>
            ) : null}

            {selectedOpp.id === "course_provider" ? (
              <div className="space-y-4 pt-2 border-t border-gray-100">
                <h4 className="text-sm font-semibold text-navy">Course Provider Academy Info</h4>
                <div>
                  <label className="text-sm font-medium block mb-1">Academy or Instructor Name *</label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="E.g. Apex Coding Academy"
                    className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">Teaching Domain Specialty *</label>
                  <input
                    type="text"
                    value={serviceType}
                    onChange={(e) => setServiceType(e.target.value)}
                    placeholder="E.g. Web Development, Digital Marketing"
                    className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">Sample Lecture Video Link *</label>
                  <input
                    type="url"
                    value={sampleVideoLink}
                    onChange={(e) => setSampleVideoLink(e.target.value)}
                    placeholder="E.g. https://www.youtube.com/watch?v=..."
                    className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30"
                  />
                </div>
              </div>
            ) : null}

            {selectedOpp.id === "delivery_partner" ? (
              <div className="space-y-4 pt-2 border-t border-gray-100">
                <h4 className="text-sm font-semibold text-navy">Logistics & Identity details</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium block mb-1">Vehicle Type *</label>
                    <select
                      value={vehicleType}
                      onChange={(e) => setVehicleType(e.target.value)}
                      className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30 bg-white"
                    >
                      <option value="Bicycle">Bicycle</option>
                      <option value="Two-Wheeler">Two-Wheeler (Motorcycle/Scooter)</option>
                      <option value="Three-Wheeler">Three-Wheeler (Auto/Electric Cart)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-1">Driving License Number *</label>
                    <input
                      type="text"
                      value={licenseNumber}
                      onChange={(e) => setLicenseNumber(e.target.value)}
                      placeholder="e.g. MH1220201234567"
                      className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">Aadhaar Card Number *</label>
                  <input
                    type="text"
                    value={aadhaarNumber}
                    onChange={(e) => setAadhaarNumber(e.target.value)}
                    placeholder="e.g. 1234 5678 9012"
                    className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30"
                  />
                </div>
              </div>
            ) : null}
            <div className="space-y-4 pt-2 border-t border-gray-100">
              <h4 className="text-sm font-semibold text-navy">Territory Details</h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium block mb-1">State Territory *</label>
                  <select
                    value={selectedState}
                    onChange={(e) => setSelectedState(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30 bg-white"
                  >
                    {Object.keys(locationData).map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium block mb-1">District Territory *</label>
                  <select
                    value={selectedDistrict}
                    onChange={(e) => setSelectedDistrict(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30 bg-white"
                  >
                    {Object.keys(locationData[selectedState] || {}).map((district) => (
                      <option key={district} value={district}>
                        {district}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium block mb-1">Mandal Territory *</label>
                  <select
                    value={selectedMandal}
                    onChange={(e) => setSelectedMandal(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30 bg-white"
                  >
                    {(locationData[selectedState]?.[selectedDistrict] || []).map((mandal) => (
                      <option key={mandal} value={mandal}>
                        {mandal}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Additional Remarks</label>
              <textarea
                value={formRemarks}
                onChange={(e) => setFormRemarks(e.target.value)}
                placeholder="Any additional information..."
                className="w-full border rounded-lg px-3 py-2.5 text-sm min-h-[80px] resize-none focus:outline-none focus:ring-2 focus:ring-navy/30"
              />
            </div>

            <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center text-sm text-muted-foreground">
              📎 Document upload will be available after initial review
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setActiveView("home")}>Cancel</Button>
              <Button className="flex-1 bg-navy hover:bg-navy/90 text-white" onClick={handleSubmitApplication} disabled={submitting}>
                {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                Submit Application
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // ─── MY APPLICATIONS ──────────────────────────────────────────────
  const renderApplications = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <button onClick={() => setActiveView("home")} className="flex items-center gap-1 text-sm text-navy font-medium hover:underline">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <h2 className="text-xl font-bold text-navy">My Applications</h2>
        <div />
      </div>

      {applications.length === 0 ? (
        <div className="text-center py-16">
          <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-3 opacity-30" />
          <p className="text-muted-foreground mb-4">You haven't applied to any opportunities yet.</p>
          <Button className="bg-navy hover:bg-navy/90 text-white" onClick={() => setActiveView("home")}>
            Explore Opportunities
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {applications.map((app) => {
            const status = APPLICATION_STATUS[app.status] || APPLICATION_STATUS.pending;
            const niceRoleName = OPPORTUNITIES.find(o => o.id === app.role)?.role || app.role;
            return (
              <Card key={app._id} className="overflow-hidden">
                <CardContent className="p-4 flex flex-col gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-navy/10 text-navy flex items-center justify-center flex-shrink-0">
                      <Briefcase className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-navy">{niceRoleName}</p>
                      <p className="text-xs text-muted-foreground">Applied: {new Date(app.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                    </div>
                    <Badge className={`text-xs ${status.color}`}>{status.label}</Badge>
                  </div>
                  {app.status === "approved" && (
                    <KycUploadSection application={app} onSuccess={fetchApplications} />
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );

  // ─── MAIN RENDER ──────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {activeView === "home" && renderHome()}
        {activeView === "detail" && renderDetail()}
        {activeView === "apply" && renderApplyForm()}
        {activeView === "applications" && renderApplications()}
      </div>
      <Footer />
    </div>
  );
};

export default EarnWithApexBee;