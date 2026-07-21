// src/pages/EarnWithApexBee.tsx — Module 9: Business Opportunity Marketplace
import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  HelpCircle,
  UserCheck,
  DollarSign
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

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
  investment?: string;
  difficulty?: string;
  timeCommitment?: string;
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
  videoLink?: string;
};

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
    investment: "Low",
    difficulty: "Medium",
    timeCommitment: "Full-Time"
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
    investment: "High",
    difficulty: "High",
    timeCommitment: "Full-Time"
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
    investment: "Medium",
    difficulty: "Medium",
    timeCommitment: "Full-Time"
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
    investment: "Zero",
    difficulty: "Easy",
    timeCommitment: "Flexible"
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
    investment: "High",
    difficulty: "High",
    timeCommitment: "Full-Time"
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
    investment: "Low",
    difficulty: "Medium",
    timeCommitment: "Flexible"
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
    investment: "Zero",
    difficulty: "Easy",
    timeCommitment: "Flexible"
  }
];

const SUCCESS_STORIES: SuccessStory[] = [
  { name: "Rajesh Kumar", role: "Top Vendor", location: "Nellore", earnings: "₹1,80,000/month", quote: "ApexBee gave me a platform to reach B2B retailers and local households securely. Absolute game changer!", avatar: "👨‍💼", videoLink: "https://www.w3schools.com/html/mov_bbb.mp4" },
  { name: "Priya Sharma", role: "Top Entrepreneur", location: "Vijayawada", earnings: "₹95,000/month", quote: "Onboarded 40+ vendors in Nellore and Vijayawada. Lifetime earnings split are amazing.", avatar: "👩‍💼" },
  { name: "Amit Patel", role: "Top Franchise Partner", location: "Tirupati", earnings: "₹4,50,000/month", quote: "Territory exclusivity in Tirupati gives high return. Support from corporate team is solid.", avatar: "👨‍💻" },
  { name: "Sunita Devi", role: "Top Service Provider", location: "Hyderabad", earnings: "₹65,000/month", quote: "Jobs keep coming daily on my schedule. Weekly payouts verified.", avatar: "🔧" },
];

const APPLICATION_STATUS: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending Review", color: "bg-orange-100 text-orange-700 border-orange-200" },
  under_review: { label: "Under Review", color: "bg-blue-100 text-blue-700 border-blue-200" },
  approved: { label: "Approved! 🎉", color: "bg-green-100 text-green-700 border-green-200" },
  rejected: { label: "Not Approved", color: "bg-red-100 text-red-700 border-red-200" },
};

const getAuth = () => {
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const token = localStorage.getItem("token");
  return { user, token };
};

const getRequiredDocs = (roleId: string) => {
  const r = roleId.toLowerCase().trim();
  if (r === "vendor" || r === "wholesaler" || r === "manufacturer" || r === "franchise") {
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
    <form onSubmit={handleSubmit} className="mt-4 p-4 border rounded-xl bg-gray-50/50 space-y-4 w-full text-left">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-sm text-navy font-sans">KYC Document Upload</h4>
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
                    className="text-xs text-navy font-medium hover:underline block bg-transparent border-none cursor-pointer"
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
                      className="text-xs text-red-600 font-medium hover:underline block bg-transparent border-none cursor-pointer"
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

const EarnWithApexBee = () => {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState<"home" | "detail" | "apply" | "applications">("home");
  const [selectedOpp, setSelectedOpp] = useState<Opportunity | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedState, setSelectedState] = useState("Telangana");
  const [selectedDistrict, setSelectedDistrict] = useState("Hyderabad");
  const [selectedMandal, setSelectedMandal] = useState("Ameerpet");
  const [locationData, setLocationData] = useState<Record<string, Record<string, string[]>>>({});

  // Quiz Finder State
  const [quizStep, setQuizStep] = useState<number>(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [quizRecommendation, setQuizRecommendation] = useState<Opportunity | null>(null);

  // Profit Calculator State
  const [calcRole, setCalcRole] = useState<string>("vendor");
  const [calcOrders, setCalcOrders] = useState<number>(150);
  const [calcAvgValue, setCalcAvgValue] = useState<number>(1000);

  // Video Success Modal
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");

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

  // Quiz Handling
  const quizQuestions = [
    {
      key: "investment",
      question: "What is your initial investment capacity?",
      options: [
        { label: "Zero Investment (Only time & effort)", value: "zero" },
        { label: "Low (Under ₹10,000 for tools/equipments)", value: "low" },
        { label: "Medium (₹10,000 - ₹50,000 for stocks)", value: "medium" },
        { label: "High (Over ₹1,00,000 for inventory/setup)", value: "high" }
      ]
    },
    {
      key: "skills",
      question: "Which skill set describes you best?",
      options: [
        { label: "Sales, marketing, and business relationship building", value: "sales" },
        { label: "Providing professional physical services (AC repair, salons, plumbing)", value: "service" },
        { label: "Logistics, delivery, and driving capabilities", value: "logistics" },
        { label: "Sourcing inventory or manufacturing items", value: "retail" }
      ]
    },
    {
      key: "time",
      question: "What is your time availability?",
      options: [
        { label: "Flexible part-time hours", value: "flexible" },
        { label: "Full-time business dedication", value: "full" }
      ]
    }
  ];

  const handleQuizAnswer = (key: string, value: string) => {
    const updated = { ...quizAnswers, [key]: value };
    setQuizAnswers(updated);

    if (quizStep < quizQuestions.length - 1) {
      setQuizStep(quizStep + 1);
    } else {
      // Recommend Opportunity based on parameters
      let recommendedId = "entrepreneur";
      if (updated.investment === "high") {
        recommendedId = updated.skills === "retail" ? "manufacturer" : "franchise";
      } else if (updated.investment === "medium") {
        recommendedId = "wholesaler";
      } else if (updated.investment === "low") {
        recommendedId = updated.skills === "service" ? "service_provider" : "vendor";
      } else {
        recommendedId = updated.skills === "logistics" ? "delivery_partner" : "entrepreneur";
      }

      const opp = OPPORTUNITIES.find(o => o.id === recommendedId) || OPPORTUNITIES[3];
      setQuizRecommendation(opp);
      setQuizStep(quizQuestions.length);
    }
  };

  const resetQuiz = () => {
    setQuizStep(0);
    setQuizAnswers({});
    setQuizRecommendation(null);
  };

  // Calculator Outputs
  const calculatorOutputs = useMemo(() => {
    let margin = 0.15; // default 15% margin
    if (calcRole === "vendor") margin = 0.20;
    else if (calcRole === "manufacturer") margin = 0.30;
    else if (calcRole === "wholesaler") margin = 0.10;
    else if (calcRole === "franchise") margin = 0.05;
    else if (calcRole === "entrepreneur") margin = 0.03;
    else if (calcRole === "service_provider") margin = 0.70;
    else if (calcRole === "delivery_partner") margin = 0.85;

    const totalRevenue = calcOrders * calcAvgValue;
    const netProfit = totalRevenue * margin;
    return {
      totalRevenue,
      netProfit,
      yearlyProfit: netProfit * 12
    };
  }, [calcRole, calcOrders, calcAvgValue]);

  const activeLocationsList = ["Tirupati", "Nellore", "Vijayawada", "Hyderabad"];

  // ─── HOME VIEW ────────────────────────────────────────────────────
  const renderHome = () => (
    <div className="space-y-10 text-left">
      {/* Hero */}
      <div className="rounded-3xl bg-gradient-to-r from-navy via-slate-900 to-indigo-950 text-white p-8 md:p-12 relative overflow-hidden shadow-xl border border-indigo-900">
        <div className="absolute right-0 top-0 opacity-10 pointer-events-none translate-x-12 -translate-y-12">
          <Briefcase className="h-96 w-96 text-white" />
        </div>

        <div className="max-w-2xl text-left relative z-10 space-y-4">
          <Badge className="bg-emerald-500/20 text-emerald-400 font-bold px-3 py-1 border border-emerald-400/30 text-[10px] tracking-wider uppercase">
            Business Partnerships
          </Badge>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-none text-white">
            Build Your Local Business with Zero or Low Investment.
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            ApexBee provides the logistics, tech stack, and customer leads. Apply as a Vendor, Manufacturer, Wholesaler, Delivery Partner, or Franchise.
          </p>

          <div className="flex flex-wrap gap-3 pt-3">
            <Button className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-md border-none" onClick={() => setActiveView("applications")}>
              <FileText className="w-4 h-4 mr-2" /> View My Applications
            </Button>
            <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 text-xs font-bold px-6 py-2.5 rounded-xl" onClick={() => {
              const el = document.getElementById("quiz-finder-section");
              el?.scrollIntoView({ behavior: "smooth" });
            }}>
              Find Best Fit Role
            </Button>
          </div>
        </div>
      </div>

      {/* Interactive Quiz Finder Widget */}
      <Card id="quiz-finder-section" className="border border-purple-200 bg-purple-50/10 shadow-sm rounded-2xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-purple-100 to-indigo-50 border-b border-purple-200 pb-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⚡</span>
            <div>
              <CardTitle className="text-navy text-base font-extrabold font-sans">Business Fit Opportunity Quiz</CardTitle>
              <CardDescription className="text-xs text-slate-500">Unsure which partnership fits you? Answer 3 questions to locate your perfect role.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {quizStep < quizQuestions.length ? (
            <div className="space-y-4">
              <p className="text-xs font-extrabold text-purple-700">Question {quizStep + 1} of {quizQuestions.length}</p>
              <h4 className="font-extrabold text-navy text-sm">{quizQuestions[quizStep].question}</h4>
              <div className="grid md:grid-cols-2 gap-3 pt-2">
                {quizQuestions[quizStep].options.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => handleQuizAnswer(quizQuestions[quizStep].key, opt.value)}
                    className="border border-slate-200 rounded-xl p-3 text-left hover:border-purple-500 hover:bg-purple-50/50 transition-all font-semibold text-xs text-slate-700 bg-white shadow-sm cursor-pointer"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center space-y-4 max-w-md mx-auto py-4">
              <span className="text-4xl block">🎉</span>
              <h4 className="font-extrabold text-navy text-base">Perfect Partnership: {quizRecommendation?.role}</h4>
              <p className="text-xs text-slate-500">Based on your capital, skills and time preference, we recommend onboarding as a {quizRecommendation?.role.toLowerCase()}.</p>
              <div className="flex gap-2 justify-center pt-2">
                <Button className="bg-navy hover:bg-navy/95 text-white font-bold text-xs py-2 rounded-xl" onClick={() => quizRecommendation && openDetail(quizRecommendation)}>
                  Learn About Role
                </Button>
                <Button variant="outline" className="text-xs border-slate-200 font-bold rounded-xl" onClick={resetQuiz}>
                  Retake Quiz
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Opportunity Cards Grid */}
      <div>
        <h2 className="text-lg font-black text-navy mb-4 flex items-center gap-2">
          <span>🚀</span> Available Business Opportunities
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
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
              <Card key={opp.id} className="hover:shadow-md transition-all overflow-hidden border border-slate-200 bg-white rounded-2xl flex flex-col justify-between group">
                <div>
                  <div className={`h-2 bg-gradient-to-r ${opp.gradient}`} />
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-start gap-3">
                        <span className="text-3xl p-1 bg-slate-50 rounded-xl">{opp.emoji}</span>
                        <div>
                          <h3 className="font-extrabold text-navy group-hover:text-indigo-600 transition-colors text-sm">{opp.role}</h3>
                          <p className="text-[10px] text-slate-400 mt-0.5">{opp.tagline}</p>
                        </div>
                      </div>
                      {opp.id === "vendor" && <Badge className="bg-red-50 text-red-700 border border-red-200 text-[9px] font-black uppercase">🔥 Hot</Badge>}
                    </div>

                    <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3 mb-4">
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Income Potential</p>
                      <p className="font-extrabold text-emerald-700 text-sm mt-0.5">{opp.incomePotential}</p>
                    </div>

                    <div className="mb-4">
                      <p className="text-[10px] font-extrabold text-navy uppercase tracking-wider mb-1.5">Benefits Highlights</p>
                      <div className="flex flex-wrap gap-1.5">
                        {opp.benefits.slice(0, 3).map((b, i) => (
                          <span key={i} className="text-[10px] bg-slate-100 border text-slate-600 px-2 py-0.5 rounded-lg">{b}</span>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </div>

                <div className="p-5 pt-0 border-t border-slate-50 flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1 text-[10px] font-bold h-9 rounded-xl border-slate-200 text-slate-700" onClick={() => openDetail(opp)}>
                    Details
                  </Button>
                  {isApproved ? (
                    <Button
                      size="sm"
                      className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-bold h-9 rounded-xl border-none"
                      onClick={() => handleGoToPortal(opp.id)}
                    >
                      Enter Portal
                    </Button>
                  ) : isPending ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 text-[10px] border-orange-200 bg-orange-50 text-orange-700 font-bold h-9 rounded-xl"
                      onClick={() => setActiveView("applications")}
                    >
                      Under Review
                    </Button>
                  ) : (
                    <Button size="sm" className="flex-1 bg-navy hover:bg-navy/95 text-white text-[10px] font-bold h-9 rounded-xl" onClick={() => openApply(opp)}>
                      Apply Now
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Success Stories video section */}
      <div>
        <h2 className="text-lg font-black text-navy mb-4 flex items-center gap-2">
          <span>🎥</span> Success Stories & Video Testimonials
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {SUCCESS_STORIES.map((story, i) => (
            <Card key={i} className="hover:shadow-md transition-all border border-slate-200 bg-white rounded-2xl overflow-hidden flex flex-col justify-between">
              <CardContent className="p-5 text-center relative flex-1 flex flex-col justify-between">
                <div>
                  <span className="text-4xl block mb-2">{story.avatar}</span>
                  <p className="font-bold text-navy text-sm">{story.name}</p>
                  <Badge variant="outline" className="bg-slate-100 text-slate-600 text-[10px] mt-1 border-slate-200">{story.role}</Badge>
                  <p className="text-[10px] text-slate-400 mt-2 flex items-center justify-center gap-0.5">
                    <MapPin className="w-3 h-3 text-slate-400" /> {story.location}
                  </p>
                  <p className="text-emerald-700 font-extrabold text-sm mt-1">{story.earnings}</p>
                  <p className="text-xs text-slate-500 italic mt-3 leading-relaxed">"{story.quote}"</p>
                </div>

                {story.videoLink && (
                  <Button
                    size="sm"
                    className="mt-4 w-full bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-bold rounded-xl border border-indigo-200"
                    onClick={() => {
                      setVideoUrl(story.videoLink || "");
                      setShowVideoModal(true);
                    }}
                  >
                    <Play className="w-3.5 h-3.5 mr-1 text-indigo-600" /> Play Video
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Earnings calculator slider card */}
      <Card className="border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
          <CardTitle className="text-navy text-base font-extrabold flex items-center gap-1.5">
            <span>🧮</span> Income & Profit Estimator
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">Calculate dynamic earnings based on expected orders volume and average transaction size.</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="space-y-4 text-left">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600">Select Partnership Role</label>
                <select
                  value={calcRole}
                  onChange={(e) => setCalcRole(e.target.value)}
                  className="w-full border rounded-xl px-3 py-2 text-xs bg-white font-semibold text-slate-700 h-9"
                >
                  <option value="vendor">Become a Vendor</option>
                  <option value="manufacturer">Become a Manufacturer</option>
                  <option value="wholesaler">Become a Wholesaler</option>
                  <option value="entrepreneur">Become an Entrepreneur</option>
                  <option value="franchise">Become a Franchise Partner</option>
                  <option value="service_provider">Become a Service Provider</option>
                  <option value="delivery_partner">Become a Delivery Partner</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-slate-600">
                  <span>Expected monthly volume</span>
                  <span>{calcOrders} orders</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="1000"
                  value={calcOrders}
                  onChange={(e) => setCalcOrders(Number(e.target.value))}
                  className="w-full accent-navy cursor-pointer h-1.5 bg-slate-100 rounded-lg appearance-none"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-slate-600">
                  <span>Average order size</span>
                  <span>₹{calcAvgValue}</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="5000"
                  value={calcAvgValue}
                  onChange={(e) => setCalcAvgValue(Number(e.target.value))}
                  className="w-full accent-navy cursor-pointer h-1.5 bg-slate-100 rounded-lg appearance-none"
                />
              </div>
            </div>

            <div className="md:col-span-2 bg-slate-50 border rounded-2xl p-6 flex flex-col justify-center space-y-4">
              <div className="grid sm:grid-cols-3 gap-4 text-center">
                <div className="p-3 bg-white border border-slate-100 rounded-xl shadow-inner">
                  <span className="text-[10px] text-slate-400 font-bold block">Gross Revenue</span>
                  <span className="text-base font-extrabold text-navy mt-1 block">₹{calculatorOutputs.totalRevenue.toLocaleString()}</span>
                </div>
                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl shadow-inner">
                  <span className="text-[10px] text-slate-400 font-bold block">Net Profit Share</span>
                  <span className="text-base font-extrabold text-emerald-700 mt-1 block">₹{Math.round(calculatorOutputs.netProfit).toLocaleString()}</span>
                </div>
                <div className="p-3 bg-indigo-50 border border-indigo-150 rounded-xl shadow-inner">
                  <span className="text-[10px] text-indigo-400 font-bold block">Yearly Projection</span>
                  <span className="text-base font-extrabold text-indigo-800 mt-1 block">₹{Math.round(calculatorOutputs.yearlyProfit).toLocaleString()}</span>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 leading-normal text-center">
                *Calculation is based on category average commission margins. Actual profits vary with product categories.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Compare table */}
      <Card className="border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
        <CardHeader className="border-b border-slate-100 pb-3">
          <CardTitle className="text-navy text-base font-extrabold">Compare Opportunities Tiers</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                <tr>
                  <th className="p-3">Opportunity</th>
                  <th className="p-3">Investment Level</th>
                  <th className="p-3">Time Commitment</th>
                  <th className="p-3">Potential Income</th>
                  <th className="p-3">Difficulty Level</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {OPPORTUNITIES.map((opp) => (
                  <tr key={opp.id} className="hover:bg-slate-50/50">
                    <td className="p-3 font-bold text-navy flex items-center gap-1.5">
                      <span>{opp.emoji}</span> {opp.role}
                    </td>
                    <td className="p-3 text-slate-600 font-semibold">{opp.investment}</td>
                    <td className="p-3 text-slate-600">{opp.timeCommitment}</td>
                    <td className="p-3 text-emerald-700 font-bold">{opp.incomePotential}</td>
                    <td className="p-3"><Badge variant="outline" className="bg-slate-100 border-slate-200 text-[10px] font-bold text-slate-600">{opp.difficulty}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Local Expansion Map and Timeline checklist */}
      <div className="grid md:grid-cols-2 gap-6 text-left">
        {/* Available Areas Map Roadmap */}
        <Card className="border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="border-b border-slate-100 pb-3 bg-slate-50/50">
            <CardTitle className="text-base font-extrabold text-navy">📍 Territory Roadmap & Pincodes</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <p className="text-xs text-slate-500">Territories actively onboarding vendors and franchise operations:</p>
            <div className="grid grid-cols-2 gap-3">
              {activeLocationsList.map((loc) => (
                <div key={loc} className="bg-white border rounded-xl p-3 shadow-inner flex items-center gap-2">
                  <span className="text-indigo-600 text-lg">📍</span>
                  <div>
                    <h5 className="font-extrabold text-navy text-xs leading-none">{loc}</h5>
                    <span className="text-[9px] text-emerald-600 font-bold">Active Onboarding</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="rounded-xl border bg-yellow-50/30 border-yellow-100 p-3 text-xs text-yellow-800 font-semibold">
              ⚠️ Slots are locked mandal-wise. Apply early to ensure territory exclusivity.
            </div>
          </CardContent>
        </Card>

        {/* Training Timeline Steps */}
        <Card className="border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="border-b border-slate-100 pb-3 bg-slate-50/50">
            <CardTitle className="text-base font-extrabold text-navy">📋 Onboarding Checklist</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4 text-xs font-semibold text-slate-700">
              {[
                { step: "1. Basic Application", desc: "Submit KYC docs (PAN, GST / License)." },
                { step: "2. Documents Audit", desc: "Our team verifies credentials within 48 hours." },
                { step: "3. Onboarding & Training", desc: "Watch training guides & configure catalog / slot." },
                { step: "4. Business Launch!", desc: "Start receiving leads and splits to wallet." }
              ].map((timeline, idx) => (
                <div key={idx} className="flex gap-3">
                  <span className="w-5 h-5 rounded-full bg-navy text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                    {idx + 1}
                  </span>
                  <div>
                    <h5 className="font-bold text-navy text-xs leading-none">{timeline.step}</h5>
                    <p className="text-[10px] text-slate-400 mt-1 font-medium">{timeline.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Video Success modal container */}
      <Dialog open={showVideoModal} onOpenChange={setShowVideoModal}>
        <DialogContent className="max-w-xl rounded-3xl bg-white border border-slate-200 p-6 text-center">
          <DialogHeader>
            <DialogTitle className="font-extrabold text-navy text-base">📹 Rajesh Kumar Success Story Video</DialogTitle>
          </DialogHeader>
          <div className="aspect-video w-full rounded-2xl overflow-hidden bg-slate-900 border mt-4">
            {videoUrl ? (
              <video src={videoUrl} controls autoPlay className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white">Loading Testimonial Video...</div>
            )}
          </div>
          <DialogFooter className="mt-4">
            <Button className="w-full bg-navy text-white hover:bg-navy/95 rounded-xl font-bold text-xs" onClick={() => setShowVideoModal(false)}>
              Close Video Player
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );

  // ─── DETAIL VIEW ──────────────────────────────────────────────────
  const renderDetail = () => {
    if (!selectedOpp) return null;
    const opp = selectedOpp;
    return (
      <div className="space-y-6">
        <button onClick={() => setActiveView("home")} className="flex items-center gap-1 text-sm text-navy font-medium hover:underline bg-transparent border-none cursor-pointer">
          <ChevronLeft className="w-4 h-4" /> Back to Opportunities
        </button>

        {/* Hero */}
        <div className={`rounded-3xl bg-gradient-to-r ${opp.gradient} text-white p-8 border border-white/5`}>
          <div className="flex items-center gap-4 mb-4">
            <span className="text-5xl">{opp.emoji}</span>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">{opp.role}</h1>
              <p className="opacity-80 text-sm mt-1">{opp.tagline}</p>
            </div>
          </div>
          <div className="bg-white/10 rounded-xl p-4 inline-block border border-white/10 text-left">
            <p className="text-xs opacity-80">Income Potential</p>
            <p className="text-2xl font-black mt-0.5">{opp.incomePotential}</p>
          </div>
        </div>

        {/* Overview */}
        <Card className="border border-slate-200 rounded-2xl">
          <CardContent className="p-5">
            <h3 className="font-bold text-navy text-sm uppercase tracking-wider mb-2">📋 Overview</h3>
            <p className="text-xs text-slate-600 leading-relaxed">{opp.overview}</p>
          </CardContent>
        </Card>

        {/* Responsibilities + Benefits */}
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="border border-slate-200 rounded-2xl">
            <CardContent className="p-5">
              <h3 className="font-bold text-navy text-sm uppercase tracking-wider mb-3">📌 Responsibilities</h3>
              <ul className="space-y-2">
                {opp.responsibilities.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-slate-600"><CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" /> {r}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
          <Card className="border border-slate-200 rounded-2xl">
            <CardContent className="p-5">
              <h3 className="font-bold text-navy text-sm uppercase tracking-wider mb-3">🎁 Benefits</h3>
              <ul className="space-y-2">
                {opp.benefits.map((b, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-slate-600"><Star className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" /> {b}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Income Model */}
        <Card className="border border-slate-200 rounded-2xl">
          <CardContent className="p-5">
            <h3 className="font-bold text-navy text-sm uppercase tracking-wider mb-3">💰 Income Model</h3>
            <div className="grid sm:grid-cols-2 gap-2">
              {opp.incomeModel.map((item, i) => (
                <div key={i} className="p-3 bg-green-50/50 border border-green-100 rounded-xl text-xs flex items-center gap-2 text-slate-700">
                  <TrendingUp className="w-4 h-4 text-green-600 flex-shrink-0" /> {item}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Requirements */}
        <Card className="border border-slate-200 rounded-2xl">
          <CardContent className="p-5">
            <h3 className="font-bold text-navy text-sm uppercase tracking-wider mb-3">📝 Requirements</h3>
            <div className="grid sm:grid-cols-2 gap-2">
              {opp.requirements.map((req, i) => (
                <div key={i} className="p-3 border rounded-xl text-xs flex items-center gap-2 text-slate-600">
                  <AlertCircle className="w-4 h-4 text-navy flex-shrink-0" /> {req}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Training */}
        <Card className="border border-slate-200 rounded-2xl">
          <CardContent className="p-5">
            <h3 className="font-bold text-navy text-sm uppercase tracking-wider mb-3">🎓 Training Process</h3>
            <div className="space-y-3">
              {opp.trainingProcess.map((step, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-navy text-white flex items-center justify-center text-xs font-bold flex-shrink-0">{i + 1}</div>
                  <p className="text-xs text-slate-600 font-semibold">{step}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* FAQs */}
        <Card className="border border-slate-200 rounded-2xl">
          <CardContent className="p-5">
            <h3 className="font-bold text-navy text-sm uppercase tracking-wider mb-3">❓ Frequently Asked Questions</h3>
            <div className="space-y-3">
              {opp.faqs.map((faq, i) => (
                <div key={i} className="p-3 border rounded-xl text-xs">
                  <p className="font-bold text-navy">{faq.q}</p>
                  <p className="text-slate-500 mt-1">{faq.a}</p>
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
                  className="bg-green-600 hover:bg-green-700 text-white px-8 rounded-xl font-bold text-xs h-10 shadow-sm"
                  onClick={() => handleGoToPortal(opp.id)}
                >
                  Go To Portal <ExternalLink className="w-4 h-4 ml-2" />
                </Button>
              ) : isPending ? (
                <Button
                  size="lg"
                  variant="outline"
                  className="border-orange-200 bg-orange-50 text-orange-700 px-8 font-bold text-xs h-10 rounded-xl animate-pulse"
                  onClick={() => setActiveView("applications")}
                >
                  Under Review / View Application
                </Button>
              ) : (
                <Button size="lg" className="bg-navy hover:bg-navy/90 text-white px-8 rounded-xl font-bold text-xs h-10" onClick={() => openApply(opp)}>
                  Apply Now <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              )}
              <Button size="lg" variant="outline" className="rounded-xl font-bold text-xs h-10" onClick={() => setActiveView("home")}>Back</Button>
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
        <button onClick={() => setActiveView("home")} className="flex items-center gap-1 text-sm text-navy font-medium hover:underline bg-transparent border-none cursor-pointer">
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
            <h3 className="font-bold text-navy text-lg text-left">Application Form</h3>

            {[
              { label: "Full Name *", value: formName, set: setFormName, placeholder: "Enter your full name", type: "text" },
              { label: "Mobile Number *", value: formMobile, set: setFormMobile, placeholder: "+91 XXXXX XXXXX", type: "tel" },
              { label: "Email Address *", value: formEmail, set: setFormEmail, placeholder: "you@email.com", type: "email" },
              { label: "Location / City *", value: formLocation, set: setFormLocation, placeholder: "Your city or district", type: "text" },
              { label: "Relevant Experience", value: formExperience, set: setFormExperience, placeholder: "Brief summary of your experience", type: "text" },
            ].map((field, i) => (
              <div key={i} className="text-left">
                <label className="text-xs font-bold text-slate-600 block mb-1">{field.label}</label>
                <input
                  type={field.type}
                  value={field.value}
                  onChange={(e) => field.set(e.target.value)}
                  placeholder={field.placeholder}
                  className="w-full border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-navy/30 h-9 bg-white text-slate-700"
                />
              </div>
            ))}

            {/* Role-Specific Inputs Section */}
            {selectedOpp.id === "vendor" || selectedOpp.id === "wholesaler" || selectedOpp.id === "manufacturer" ? (
              <div className="space-y-4 pt-2 border-t border-gray-100 text-left">
                <h4 className="text-sm font-semibold text-navy">Business Information</h4>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Business Name *</label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="Enter legal business name"
                    className="w-full border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-navy/30 h-9 bg-white text-slate-700"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">GST Number *</label>
                    <input
                      type="text"
                      value={gstNumber}
                      onChange={(e) => setGstNumber(e.target.value)}
                      placeholder="e.g. 22AAAAA0000A1Z5"
                      className="w-full border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-navy/30 h-9 bg-white text-slate-700"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">PAN Number *</label>
                    <input
                      type="text"
                      value={panNumber}
                      onChange={(e) => setPanNumber(e.target.value)}
                      placeholder="e.g. ABCDE1234F"
                      className="w-full border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-navy/30 h-9 bg-white text-slate-700"
                    />
                  </div>
                </div>
              </div>
            ) : null}

            {selectedOpp.id === "franchise" ? (
              <div className="space-y-4 pt-2 border-t border-gray-100 text-left">
                <h4 className="text-sm font-semibold text-navy">Franchise Details</h4>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Proposed Franchise Hub Name *</label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="E.g. Pune City Central Hub"
                    className="w-full border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-navy/30 h-9 bg-white text-slate-700"
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">Franchise Tier *</label>
                    <select
                      value={franchiseLevel}
                      onChange={(e) => setFranchiseLevel(e.target.value)}
                      className="w-full border rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-navy/30 bg-white font-semibold text-slate-700 h-9"
                    >
                      <option value="mandal">Mandal Hub</option>
                      <option value="district">District Hub</option>
                      <option value="state">State HQ Hub</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">Capital Investment *</label>
                    <input
                      type="text"
                      value={investmentCapacity}
                      onChange={(e) => setInvestmentCapacity(e.target.value)}
                      placeholder="E.g. ₹2-₹5 Lakhs"
                      className="w-full border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-navy/30 h-9 bg-white text-slate-700"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">PAN *</label>
                    <input
                      type="text"
                      value={panNumber}
                      onChange={(e) => setPanNumber(e.target.value)}
                      placeholder="PAN code"
                      className="w-full border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-navy/30 h-9 bg-white text-slate-700"
                    />
                  </div>
                </div>
              </div>
            ) : null}

            {/* General form remarks and location lists */}
            <div className="grid grid-cols-3 gap-3 pt-4 border-t text-left">
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">State *</label>
                <select
                  value={selectedState}
                  onChange={(e) => setSelectedState(e.target.value)}
                  className="w-full border rounded-lg px-2.5 py-1.5 text-xs bg-white font-semibold text-slate-700 h-9"
                >
                  {Object.keys(locationData).length > 0 ? (
                    Object.keys(locationData).map(s => <option key={s} value={s}>{s}</option>)
                  ) : (
                    <option value="Telangana">Telangana</option>
                  )}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">District *</label>
                <select
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                  className="w-full border rounded-lg px-2.5 py-1.5 text-xs bg-white font-semibold text-slate-700 h-9"
                >
                  {locationData[selectedState] ? (
                    Object.keys(locationData[selectedState]).map(d => <option key={d} value={d}>{d}</option>)
                  ) : (
                    <option value="Hyderabad">Hyderabad</option>
                  )}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Mandal *</label>
                <select
                  value={selectedMandal}
                  onChange={(e) => setSelectedMandal(e.target.value)}
                  className="w-full border rounded-lg px-2.5 py-1.5 text-xs bg-white font-semibold text-slate-700 h-9"
                >
                  {locationData[selectedState]?.[selectedDistrict] ? (
                    locationData[selectedState][selectedDistrict].map(m => <option key={m} value={m}>{m}</option>)
                  ) : (
                    <option value="Ameerpet">Ameerpet</option>
                  )}
                </select>
              </div>
            </div>

            <div className="text-left">
              <label className="text-xs font-bold text-slate-600 block mb-1">Additional Remarks</label>
              <textarea
                value={formRemarks}
                onChange={(e) => setFormRemarks(e.target.value)}
                placeholder="Any special remarks or details..."
                className="w-full border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-navy/30 h-16 bg-white text-slate-700"
              />
            </div>

            <Button
              className="w-full bg-navy hover:bg-navy/95 text-white font-bold py-2.5 rounded-xl text-xs"
              onClick={handleSubmitApplication}
              disabled={submitting}
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Submit Business Application
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  };

  // ─── APPLICATIONS LIST VIEW ─────────────────────────────────────────
  const renderApplications = () => (
    <div className="space-y-6 text-left">
      <button onClick={() => setActiveView("home")} className="flex items-center gap-1 text-sm text-navy font-medium hover:underline bg-transparent border-none cursor-pointer">
        <ChevronLeft className="w-4 h-4" /> Back to Opportunities
      </button>

      <div className="flex justify-between items-center pb-2 border-b">
        <h2 className="text-2xl font-black text-navy">My Applications</h2>
        <Button variant="outline" size="sm" onClick={fetchApplications} className="rounded-xl border-slate-200 font-bold text-xs h-9">
          Refresh List
        </Button>
      </div>

      {applications.length === 0 ? (
        <div className="text-center py-12 border border-dashed rounded-2xl bg-white max-w-md mx-auto space-y-4">
          <span className="text-4xl block">📋</span>
          <h4 className="font-extrabold text-navy text-sm">No applications found</h4>
          <p className="text-xs text-slate-400">You haven't applied for any partnership roles yet.</p>
          <Button className="bg-navy text-white text-xs font-bold py-2 rounded-xl" onClick={() => setActiveView("home")}>
            Browse Opportunities
          </Button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {applications.map((app) => {
            const statusInfo = APPLICATION_STATUS[app.status] || { label: app.status, color: "bg-gray-100 text-gray-700" };
            return (
              <Card key={app._id} className="border border-slate-200 bg-white rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-extrabold text-navy text-sm">{app.role}</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">Applied: {new Date(app.createdAt).toLocaleDateString()}</p>
                  </div>
                  <Badge className={`${statusInfo.color} font-bold text-[10px] px-2.5 py-0.5 border`}>
                    {statusInfo.label}
                  </Badge>
                </div>

                <div className="border-t border-slate-100 pt-3 flex flex-col gap-2">
                  {app.status === "approved" ? (
                    <div className="space-y-3">
                      <div className="p-3 bg-green-50 border border-green-200 text-green-800 text-xs rounded-xl font-bold">
                        🎉 Approved! Go to matching provider portal to start business.
                      </div>
                      <Button
                        onClick={() => handleGoToPortal(app.role.replace("Become a ", "").replace("Partner", "").replace("Provider", "").replace(" ", "_").toLowerCase())}
                        className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs py-2 rounded-xl"
                      >
                        Enter Business Dashboard
                      </Button>
                    </div>
                  ) : app.status === "pending" || app.status === "under_review" ? (
                    <div className="space-y-3">
                      <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl font-bold">
                        ⏳ Please complete KYC documentation below to process verification details.
                      </div>
                      <KycUploadSection application={app} onSuccess={fetchApplications} />
                    </div>
                  ) : (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl font-medium">
                      Status: Rejected. Please contact support@apexbee.com to check reasons.
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-8">
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