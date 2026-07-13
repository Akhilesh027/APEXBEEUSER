// src/pages/Academy.tsx — Module 10: ApexBee Academy & Digital Learning
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  GraduationCap,
  PlayCircle,
  BookOpen,
  Award,
  Star,
  Users,
  Clock,
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  Download,
  Video,
  MessageSquare,
  ShieldCheck,
  Briefcase,
  Laptop,
  TrendingUp,
  FileText,
  Loader2,
  CalendarDays,
  Target
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const API_BASE = "https://server.apexbee.in/api";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
type Course = {
  id: string;
  title: string;
  instructor: string;
  category: string;
  duration: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  price: number;
  rating: number;
  students: number;
  image: string;
  tags: string[];
  description: string;
  skills: string[];
  curriculum: { module: string; duration: string }[];
  isPremium: boolean;
};

type EnrolledCourse = {
  courseId: string;
  title: string;
  progress: number;
  lastAccessed: string;
  completed: boolean;
  certificateUrl?: string;
  image: string;
};

// ─────────────────────────────────────────────
// Seed courses shown as fallback when API has no data yet
// ─────────────────────────────────────────────
const SEED_COURSES: Course[] = [
  {
    id: "c1", title: "Vendor Success Mastery 2024", instructor: "Amit Desai", category: "Vendor Training", duration: "4h 30m", level: "Beginner", price: 0, rating: 4.8, students: 12500, image: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?q=80&w=800", tags: ["Sales", "Inventory"], description: "Learn how to list products, manage orders, and grow your sales on ApexBee.", skills: ["Product Listing", "Order Fulfillment", "Customer Support"], curriculum: [{ module: "Platform Basics", duration: "45m" }, { module: "Inventory Management", duration: "1h 15m" }, { module: "Marketing Strategies", duration: "2h 30m" }], isPremium: false
  },
  {
    id: "c2", title: "Digital Marketing for Local Business", instructor: "Priya Sharma", category: "Digital", duration: "8h 15m", level: "Intermediate", price: 1499, rating: 4.9, students: 8400, image: "https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?q=80&w=800", tags: ["SEO", "Social Media"], description: "Master social media, Google local SEO, and WhatsApp marketing to grow locally.", skills: ["Facebook Ads", "Local SEO", "WhatsApp Marketing"], curriculum: [{ module: "Social Media Setup", duration: "2h" }, { module: "Running Ads", duration: "3h 15m" }, { module: "Analytics & Scaling", duration: "3h" }], isPremium: true
  },
  {
    id: "c3", title: "Advanced AC Repair Certification", instructor: "Rajesh Technical Inst.", category: "Service Skills", duration: "12h 00m", level: "Advanced", price: 2999, rating: 4.7, students: 3200, image: "https://images.unsplash.com/photo-1581092160562-40aa08e78837?q=80&w=800", tags: ["HVAC", "Repair"], description: "Comprehensive guide to repairing split and window ACs with practical demonstrations.", skills: ["Compressor Diagnostics", "Gas Refilling", "PCB Repair"], curriculum: [{ module: "Basic Components", duration: "3h" }, { module: "Gas Refilling Techniques", duration: "4h" }, { module: "Advanced PCB Diagnostics", duration: "5h" }], isPremium: true
  },
  {
    id: "c4", title: "Franchise Leadership Program", instructor: "ApexBee Corporate", category: "Franchise Training", duration: "6h 45m", level: "Intermediate", price: 0, rating: 4.9, students: 1100, image: "https://images.unsplash.com/photo-1515169067868-5387ec356754?q=80&w=800", tags: ["Leadership", "Management"], description: "Official training for ApexBee Franchise partners on managing teams and territories.", skills: ["Team Building", "Territory Mapping", "Revenue Optimization"], curriculum: [{ module: "Franchise Structure", duration: "2h" }, { module: "Recruiting Entrepreneurs", duration: "2h 45m" }, { module: "Financial Modeling", duration: "2h" }], isPremium: false
  },
  {
    id: "c5", title: "Basics of Stock Market Trading", instructor: "Vikram Finance", category: "Business", duration: "5h 20m", level: "Beginner", price: 999, rating: 4.6, students: 18000, image: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=800", tags: ["Finance", "Trading"], description: "Understand the stock market, NIFTY, Sensex, and how to start investing safely.", skills: ["Chart Reading", "Risk Management", "Portfolio Building"], curriculum: [{ module: "Market Basics", duration: "1h 30m" }, { module: "Technical Analysis", duration: "2h" }, { module: "Trading Psychology", duration: "1h 50m" }], isPremium: true
  },
];

const CATEGORIES = [
  { name: "Business", icon: <Briefcase className="w-5 h-5" />, color: "bg-blue-100 text-blue-700" },
  { name: "Digital", icon: <Laptop className="w-5 h-5" />, color: "bg-purple-100 text-purple-700" },
  { name: "Technical", icon: <TrendingUp className="w-5 h-5" />, color: "bg-green-100 text-green-700" },
  { name: "Service Skills", icon: <ShieldCheck className="w-5 h-5" />, color: "bg-orange-100 text-orange-700" },
  { name: "Vendor Training", icon: <Target className="w-5 h-5" />, color: "bg-pink-100 text-pink-700" },
  { name: "Franchise Training", icon: <Users className="w-5 h-5" />, color: "bg-indigo-100 text-indigo-700" },
];

const TABS = [
  { key: "home", label: "Academy Home" },
  { key: "my-learning", label: "My Learning" },
  { key: "webinars", label: "Live Webinars" },
  { key: "marketplace", label: "Training Marketplace" },
];

const WEBINARS = [
  { id: "w1", title: "Mastering Q4 Sales on ApexBee", date: "Tomorrow, 4:00 PM", speaker: "Neha, VP Sales", status: "upcoming" },
  { id: "w2", title: "Introduction to AI Tools for Small Business", date: "Friday, 11:00 AM", speaker: "Rahul Dev", status: "upcoming" },
];

// ─────────────────────────────────────────────
// Components
// ─────────────────────────────────────────────
const formatCurrency = (v: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 0 }).format(v);

const Academy = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("home");
  const [courses, setCourses] = useState<Course[]>(SEED_COURSES);
  const [enrolled, setEnrolled] = useState<EnrolledCourse[]>([]);

  // Fetch courses from API; fall back to seed data if API returns empty
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await fetch(`${API_BASE}/courses`);
        if (res.ok) {
          const data = await res.json();
          const list: any[] = Array.isArray(data?.courses) ? data.courses
            : Array.isArray(data) ? data : [];
          if (list.length > 0) {
            setCourses(list.map((c: any) => ({
              id: c._id || c.id,
              title: c.title || c.name || 'Untitled Course',
              instructor: c.instructor || c.createdBy?.name || 'ApexBee',
              category: c.category || 'General',
              duration: c.duration || '—',
              level: c.level || 'Beginner',
              price: c.price ?? 0,
              rating: c.rating ?? 0,
              students: c.students ?? c.enrolledCount ?? 0,
              image: c.thumbnail || c.image || SEED_COURSES[0].image,
              tags: c.tags || [],
              description: c.description || '',
              skills: c.skills || [],
              curriculum: c.curriculum || [],
              isPremium: c.isPremium ?? (c.price > 0),
            })));
          }
          // else: keep SEED_COURSES
        }
      } catch {
        // Network error — keep seed data
      }
    };
    fetchCourses();
  }, []);

  // Fetch enrolled courses for logged-in user
  useEffect(() => {
    const fetchEnrolled = async () => {
      const rawUser = localStorage.getItem('user');
      const token = localStorage.getItem('token');
      if (!rawUser || !token) return;
      try {
        const user = JSON.parse(rawUser);
        const userId = user?._id || user?.id;
        if (!userId) return;
        const res = await fetch(`${API_BASE}/courses/enrolled/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          const list: any[] = Array.isArray(data?.enrolled) ? data.enrolled : [];
          if (list.length > 0) {
            setEnrolled(list.map((e: any) => ({
              courseId: e.courseId || e._id,
              title: e.title || e.course?.title || '',
              progress: e.progress ?? 0,
              lastAccessed: e.lastAccessed || 'Recently',
              completed: e.completed ?? false,
              certificateUrl: e.certificateUrl,
              image: e.image || e.course?.thumbnail || SEED_COURSES[0].image,
            })));
          }
        }
      } catch {
        // keep empty enrolled
      }
    };
    fetchEnrolled();
  }, []);

  // Modals
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [enrolling, setEnrolling] = useState(false);

  const handleCourseClick = (course: Course) => {
    setSelectedCourse(course);

    // Track recently viewed course
    try {
      const list = JSON.parse(localStorage.getItem("mock_recently_viewed") || "[]");
      const filtered = list.filter((item: any) => !(item.id === course.id && item.type === "course"));
      filtered.unshift({
        id: course.id,
        type: "course",
        title: course.title,
        image: course.image,
        price: course.price,
        url: "/academy",
        categoryName: course.category,
        rating: course.rating,
        timestamp: new Date().toISOString()
      });
      localStorage.setItem("mock_recently_viewed", JSON.stringify(filtered.slice(0, 15)));
    } catch (e) {
      console.error("Error tracking course:", e);
    }
  };

  // Filter states
  const [activeCategory, setActiveCategory] = useState("All");

  const handleEnroll = async (course: Course) => {
    setEnrolling(true);
    setTimeout(() => {
      setEnrolled((prev) => [
        { courseId: course.id, title: course.title, progress: 0, lastAccessed: "Just now", completed: false, image: course.image },
        ...prev,
      ]);
      setEnrolling(false);
      setSelectedCourse(null);
      alert(`✅ Successfully enrolled in ${course.title}! Check "My Learning" to start.`);
    }, 800);
  };

  const isEnrolled = (cid: string) => enrolled.some((e) => e.courseId === cid);

  // ─── VIEWS ────────────────────────────────────────────────────────
  const renderCourseCard = (course: Course) => (
    <Card key={course.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer flex flex-col" onClick={() => handleCourseClick(course)}>
      <div className="h-40 bg-gray-200 relative overflow-hidden">
        <img src={course.image} alt={course.title} className="w-full h-full object-cover transition-transform hover:scale-105" />
        <div className="absolute top-2 left-2 flex gap-1">
          {course.isPremium ? (
            <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white border-0"><Star className="w-3 h-3 mr-1" /> Premium</Badge>
          ) : (
            <Badge className="bg-green-500 hover:bg-green-600 text-white border-0">Free</Badge>
          )}
        </div>
        <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-md flex items-center gap-1">
          <Clock className="w-3 h-3" /> {course.duration}
        </div>
      </div>
      <CardContent className="p-4 flex-1 flex flex-col">
        <div className="text-xs text-navy font-medium mb-1 uppercase tracking-wider">{course.category}</div>
        <h3 className="font-bold text-navy line-clamp-2 leading-snug mb-2">{course.title}</h3>
        <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1"><Users className="w-3 h-3" /> {course.instructor}</p>
        
        <div className="flex items-center gap-3 text-xs font-medium text-muted-foreground mb-4">
          <span className="flex items-center gap-1 text-yellow-500"><Star className="w-3 h-3 fill-current" /> {course.rating}</span>
          <span>•</span>
          <span>{course.students.toLocaleString()} students</span>
          <span>•</span>
          <span>{course.level}</span>
        </div>

        <div className="mt-auto flex items-center justify-between pt-3 border-t">
          <span className="font-bold text-navy text-lg">{course.price === 0 ? "Free" : formatCurrency(course.price)}</span>
          <Button size="sm" className="bg-navy hover:bg-navy/90 text-white">View Details</Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderHome = () => {
    const filteredCourses = activeCategory === "All" ? courses : courses.filter((c) => c.category === activeCategory);
    
    return (
      <div className="space-y-10">
        {/* Hero Section */}
        <div className="rounded-2xl bg-gradient-to-r from-navy via-blue-800 to-blue-900 text-white p-8 md:p-12 relative overflow-hidden">
          <div className="relative z-10 max-w-2xl">
            <Badge className="bg-blue-500/20 text-blue-100 hover:bg-blue-500/30 border-blue-400 mb-4">ApexBee Academy</Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">Learn, Grow & Succeed with ApexBee</h1>
            <p className="text-lg opacity-90 mb-8 leading-relaxed">Upgrade your skills, grow your business, and get certified. Join 50,000+ learners in our digital ecosystem.</p>
            <div className="flex flex-wrap gap-3">
              <Button size="lg" className="bg-white text-navy hover:bg-gray-100" onClick={() => setActiveTab("my-learning")}>
                <PlayCircle className="w-5 h-5 mr-2" /> Resume Learning
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10" onClick={() => { document.getElementById("courses")?.scrollIntoView({ behavior: "smooth" }); }}>
                Explore Courses
              </Button>
            </div>
          </div>
          <GraduationCap className="absolute -bottom-10 -right-10 w-64 h-64 text-white opacity-5 transform rotate-12" />
        </div>

        {/* Categories */}
        <div>
          <div className="flex justify-between items-end mb-4">
            <h2 className="text-2xl font-bold text-navy">Explore Categories</h2>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-none">
            <button
              onClick={() => setActiveCategory("All")}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl border whitespace-nowrap transition-all ${activeCategory === "All" ? "bg-navy text-white border-navy" : "bg-white text-navy hover:border-navy"}`}
            >
              <BookOpen className="w-5 h-5" /> All Courses
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.name}
                onClick={() => setActiveCategory(cat.name)}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl border whitespace-nowrap transition-all ${activeCategory === cat.name ? "bg-navy text-white border-navy" : "bg-white text-navy hover:border-navy"}`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${cat.color} ${activeCategory === cat.name ? "bg-white/20 text-white" : ""}`}>{cat.icon}</div>
                <span className="font-medium">{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Course Grid */}
        <div id="courses">
          <h2 className="text-2xl font-bold text-navy mb-6">{activeCategory === "All" ? "Featured Courses" : `${activeCategory} Courses`}</h2>
          {filteredCourses.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl">
              <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-muted-foreground">No courses found in this category yet.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filteredCourses.map(renderCourseCard)}
            </div>
          )}
        </div>

        {/* Gamification Banner */}
        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-md">
          <div>
            <h3 className="text-2xl font-bold mb-2 flex items-center gap-2"><Award className="w-6 h-6" /> Earn While You Learn</h3>
            <p className="opacity-90 max-w-xl">Complete courses, pass quizzes, and earn Reward Points that can be redeemed in your ApexBee Wallet!</p>
          </div>
          <Button className="bg-white text-orange-600 hover:bg-orange-50 whitespace-nowrap" onClick={() => navigate("/wallet")}>View Rewards</Button>
        </div>
      </div>
    );
  };

  const renderMyLearning = () => (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-navy">My Learning Dashboard</h2>

      {/* Progress Overview */}
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { label: "Enrolled Courses", value: enrolled.length, icon: <BookOpen className="w-5 h-5" />, color: "text-blue-600" },
          { label: "Completed", value: enrolled.filter((e) => e.completed).length, icon: <CheckCircle className="w-5 h-5" />, color: "text-green-600" },
          { label: "Certificates Earned", value: enrolled.filter((e) => e.certificateUrl).length, icon: <Award className="w-5 h-5" />, color: "text-yellow-600" },
        ].map((s, i) => (
          <Card key={i}>
            <CardContent className="p-5 flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center ${s.color}`}>{s.icon}</div>
              <div>
                <p className="text-2xl font-bold text-navy">{s.value}</p>
                <p className="text-sm text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Course List */}
      <div>
        <h3 className="text-xl font-bold text-navy mb-4">Continue Learning</h3>
        {enrolled.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 rounded-xl border border-dashed border-gray-200">
            <GraduationCap className="w-16 h-16 text-gray-300 mx-auto mb-3" />
            <p className="text-muted-foreground mb-4">You haven't enrolled in any courses yet.</p>
            <Button className="bg-navy hover:bg-navy/90 text-white" onClick={() => setActiveTab("home")}>Browse Courses</Button>
          </div>
        ) : (
          <div className="space-y-4">
            {enrolled.map((course) => (
              <Card key={course.courseId} className="overflow-hidden flex flex-col sm:flex-row">
                <div className="w-full sm:w-48 h-32 flex-shrink-0">
                  <img src={course.image} alt={course.title} className="w-full h-full object-cover" />
                </div>
                <CardContent className="p-5 flex-1 flex flex-col justify-center">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-navy text-lg">{course.title}</h4>
                    {course.completed && <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-0"><CheckCircle className="w-3 h-3 mr-1" /> Completed</Badge>}
                  </div>
                  
                  <div className="mb-4 mt-2">
                    <div className="flex justify-between text-xs mb-1 font-medium">
                      <span className="text-navy">{course.progress}% Complete</span>
                      <span className="text-muted-foreground">Last active: {course.lastAccessed}</span>
                    </div>
                    <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                      <div className={`h-full ${course.completed ? "bg-green-500" : "bg-blue-600"} transition-all`} style={{ width: `${course.progress}%` }} />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button size="sm" className="bg-navy hover:bg-navy/90 text-white">
                      {course.completed ? "Review Material" : <><PlayCircle className="w-4 h-4 mr-2" /> Continue Course</>}
                    </Button>
                    {course.certificateUrl && (
                      <Button size="sm" variant="outline" className="text-green-700 border-green-200 hover:bg-green-50">
                        <Download className="w-4 h-4 mr-2" /> Certificate
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderWebinars = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-navy">Live Webinars & Classes</h2>
          <p className="text-muted-foreground mt-1">Join expert-led sessions and interact in real-time.</p>
        </div>
        <Button variant="outline"><CalendarDays className="w-4 h-4 mr-2" /> View Calendar</Button>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {WEBINARS.map((w) => (
          <Card key={w.id} className="border-l-4 border-l-blue-500">
            <CardContent className="p-5">
              <div className="flex justify-between items-start mb-3">
                <Badge className="bg-blue-100 text-blue-700 border-blue-200 uppercase tracking-wider text-[10px]">Upcoming</Badge>
                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" /> {w.date}</span>
              </div>
              <h3 className="font-bold text-navy text-lg mb-1">{w.title}</h3>
              <p className="text-sm text-muted-foreground mb-4">Speaker: <strong className="text-navy">{w.speaker}</strong></p>
              <div className="flex gap-2">
                <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"><Video className="w-4 h-4 mr-2" /> Register Now</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 pt-8 border-t">
        <h3 className="font-bold text-navy text-lg mb-4">Completed Webinars</h3>
        <p className="text-sm text-muted-foreground bg-gray-50 p-4 rounded-lg">No recently completed webinars. Past recordings will appear here.</p>
      </div>
    </div>
  );

  // ─── MAIN COMPONENT ───────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Tabs */}
      <div className="border-b bg-white sticky top-[64px] z-10 shadow-sm">
        <div className="container mx-auto px-4 flex gap-1 overflow-x-auto scrollbar-none">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-4 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.key ? "border-navy text-navy" : "border-transparent text-muted-foreground hover:text-navy hover:border-gray-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {activeTab === "home" && renderHome()}
        {activeTab === "my-learning" && renderMyLearning()}
        {activeTab === "webinars" && renderWebinars()}
        {activeTab === "marketplace" && (
          <div className="text-center py-20">
            <Briefcase className="w-16 h-16 text-navy/20 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-navy mb-2">Training Marketplace</h2>
            <p className="text-muted-foreground max-w-md mx-auto">This section is for specialized B2B training (Vendors, Franchisees, Entrepreneurs). Filtered content will be populated based on your active business roles.</p>
          </div>
        )}
      </div>

      {/* Course Detail Modal */}
      <Dialog open={!!selectedCourse} onOpenChange={(o) => !o && setSelectedCourse(null)}>
        {selectedCourse && (
          <DialogContent className="sm:max-w-3xl p-0 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="h-48 sm:h-64 relative flex-shrink-0">
              <img src={selectedCourse.image} alt={selectedCourse.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <Badge className="bg-white/20 hover:bg-white/30 text-white border-0 mb-2">{selectedCourse.category}</Badge>
                <h2 className="text-2xl sm:text-3xl font-bold leading-tight">{selectedCourse.title}</h2>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <div className="flex flex-wrap gap-4 text-sm font-medium text-gray-600 mb-6 border-b pb-4">
                <span className="flex items-center gap-1"><Users className="w-4 h-4 text-navy" /> {selectedCourse.instructor}</span>
                <span className="flex items-center gap-1"><Clock className="w-4 h-4 text-navy" /> {selectedCourse.duration}</span>
                <span className="flex items-center gap-1"><Star className="w-4 h-4 text-yellow-500" /> {selectedCourse.rating} ({selectedCourse.students.toLocaleString()})</span>
                <span className="flex items-center gap-1"><Award className="w-4 h-4 text-navy" /> {selectedCourse.level}</span>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                  <div>
                    <h3 className="font-bold text-navy text-lg mb-2">About this course</h3>
                    <p className="text-muted-foreground leading-relaxed text-sm">{selectedCourse.description}</p>
                  </div>

                  <div>
                    <h3 className="font-bold text-navy text-lg mb-3">Skills you will learn</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedCourse.skills.map((s, i) => (
                        <span key={i} className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-medium border border-blue-100 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-bold text-navy text-lg mb-3">Curriculum</h3>
                    <div className="space-y-2">
                      {selectedCourse.curriculum.map((c, i) => (
                        <div key={i} className="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-6 h-6 rounded-full bg-navy/10 text-navy flex items-center justify-center text-xs font-bold">{i + 1}</div>
                            <span className="font-medium text-sm">{c.module}</span>
                          </div>
                          <span className="text-xs text-muted-foreground font-medium">{c.duration}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-5 border border-gray-100 h-fit sticky top-0">
                  <div className="mb-4 pb-4 border-b">
                    <p className="text-sm text-muted-foreground mb-1">Course Price</p>
                    <p className="text-3xl font-bold text-navy">{selectedCourse.price === 0 ? "Free" : formatCurrency(selectedCourse.price)}</p>
                  </div>
                  <ul className="space-y-3 mb-6 text-sm text-gray-600">
                    <li className="flex items-center gap-2"><Video className="w-4 h-4 text-navy" /> {selectedCourse.duration} of video</li>
                    <li className="flex items-center gap-2"><FileText className="w-4 h-4 text-navy" /> Downloadable resources</li>
                    <li className="flex items-center gap-2"><Award className="w-4 h-4 text-navy" /> Certificate of completion</li>
                    <li className="flex items-center gap-2"><MessageSquare className="w-4 h-4 text-navy" /> Community access</li>
                  </ul>
                  {isEnrolled(selectedCourse.id) ? (
                    <Button className="w-full bg-green-600 hover:bg-green-700 text-white" onClick={() => { setSelectedCourse(null); setActiveTab("my-learning"); }}>
                      Go to Course
                    </Button>
                  ) : (
                    <Button className="w-full bg-navy hover:bg-navy/90 text-white py-6 text-lg shadow-md" onClick={() => handleEnroll(selectedCourse)} disabled={enrolling}>
                      {enrolling ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : "Enroll Now"}
                    </Button>
                  )}
                  {selectedCourse.isPremium && (
                    <p className="text-xs text-center text-muted-foreground mt-3">You can use your ApexBee Wallet balance to pay.</p>
                  )}
                </div>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>

      <Footer />
    </div>
  );
};

export default Academy;

