import React, { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { 
  BookOpen, 
  Calendar, 
  Clock, 
  User, 
  ArrowRight, 
  Search, 
  Tag, 
  Share2, 
  Sparkles,
  CheckCircle2,
  X,
  Mail
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface BlogPost {
  id: string;
  title: string;
  category: string;
  author: string;
  date: string;
  readTime: string;
  excerpt: string;
  content: string[];
  imageUrl: string;
  featured?: boolean;
}

export const Blog: React.FC = () => {
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [readingArticle, setReadingArticle] = useState<BlogPost | null>(null);
  const [newsletterEmail, setNewsletterEmail] = useState("");

  const categories = ["All", "E-Commerce", "Hyperlocal & Delivery", "MSME & Vendors", "Academy & Skills", "Travel Guides"];

  const posts: BlogPost[] = [
    {
      id: "post-1",
      title: "How Hyperlocal 15-Minute Delivery is Revolutionizing Kirana Commerce in Tier-2 Towns",
      category: "Hyperlocal & Delivery",
      author: "ApexBee Logistics Team",
      date: "August 18, 2026",
      readTime: "5 min read",
      excerpt: "Exploring our proprietary geo-clustering routing engine that allows neighborhood grocery stores to fulfill instant orders faster than dark stores.",
      content: [
        "In the fast-evolving Indian retail ecosystem, neighborhood kirana stores have long been the backbone of daily consumer commerce. However, traditional dark-store models have often sidelined these independent merchants.",
        "At ApexBee, our mission is different: instead of replacing local store owners, we turn existing retail shops into high-velocity micro-fulfillment nodes.",
        "By utilizing AI-powered order dispatching, nearby riders are matched with merchant clusters within seconds of an order being placed. The merchant receives an audio prompt, bags the items in under 3 minutes, and hands it over to the rider who is already en route.",
        "The result? Faster delivery times, zero expensive dark store real estate overheads, and 100% of the retail margin retained by local shopkeepers."
      ],
      imageUrl: "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1000",
      featured: true,
    },
    {
      id: "post-2",
      title: "5 Strategies for Traditional Handloom & Jewelry Artisans to Sell Directly to Consumers",
      category: "MSME & Vendors",
      author: "Pooja Hegde, Head of Vendor Growth",
      date: "August 12, 2026",
      readTime: "4 min read",
      excerpt: "A practical guide for sari weavers, brass artisans, and jewelry makers on leveraging ApexBee's 0% onboarding fee and pan-India shipping.",
      content: [
        "India's regional artisans produce some of the finest handcrafted textiles, silks, and jewelry in the world. Yet, middleman margins often eat up to 60% of their retail sale value.",
        "Through the ApexBee Direct-to-Consumer program, artisans can list their authentic handloom sarees, silver filigree, and home decor items directly to over 1.2 million verified buyers.",
        "Key best practices include high-resolution natural daylight photography, clear fabric composition disclosures, and offering verified hallmark certifications for silver and brass ornaments."
      ],
      imageUrl: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=800",
    },
    {
      id: "post-3",
      title: "The Ultimate Guide to Planning a Spiritual Pilgrimage to South India's Sacred Temples",
      category: "Travel Guides",
      author: "ApexBee Travel Desk",
      date: "August 05, 2026",
      readTime: "6 min read",
      excerpt: "From VIP Darshan logistics at Tirupati and Srisailam to verified pure-vegetarian lodging, here is your seamless temple tour guide.",
      content: [
        "Spiritual tourism is more than just travel—it is a sacred tradition for millions of Indian families. However, booking darshan tokens, hygienic vegetarian accommodation, and dependable local drivers can often be stressful.",
        "ApexBee Travel curates all-inclusive pilgrimage itineraries featuring pre-booked special entry darshan tickets, comfortable AC transit, and round-the-clock coordinator assistance.",
        "Discover our 3-day spiritual circuit covering Tirupati, Kalahasti, and Kanipakam with local Telugu and Tamil speaking guides."
      ],
      imageUrl: "https://images.unsplash.com/photo-1609766857041-ed402ea8069a?q=80&w=800",
    },
    {
      id: "post-4",
      title: "Why Upskilling in Vernacular AI & Digital Marketing is Key for New Graduates",
      category: "Academy & Skills",
      author: "Dr. K. Srinivas, ApexBee Academy",
      date: "July 28, 2026",
      readTime: "4 min read",
      excerpt: "How our government-aligned skill certifications are helping tier-2 and tier-3 students land high-paying remote roles.",
      content: [
        "As generative AI and digital commerce tools penetrate every corner of business, proficiency in practical e-commerce operations, digital catalogue management, and localized customer engagement is in massive demand.",
        "ApexBee Academy courses are designed with 80% hands-on project work, giving learners real-world experience managing live merchant campaigns and inventory setups."
      ],
      imageUrl: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=800",
    },
  ];

  const filteredPosts = posts.filter((p) => {
    const matchesCat = selectedCategory === "All" || p.category === selectedCategory;
    const matchesSearch = 
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      p.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.author.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const featuredPost = posts.find((p) => p.featured) || posts[0];

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail) return;
    toast({
      title: "Subscribed to ApexBee Insights! 📬",
      description: "You will receive our bi-weekly digests on local commerce trends and business growth.",
    });
    setNewsletterEmail("");
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-amber-500 selection:text-white">
      <Navbar />

      {/* Hero */}
      <section className="bg-gradient-to-b from-amber-500/10 via-background to-background py-16 border-b border-border/40">
        <div className="container mx-auto px-4 max-w-4xl text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold uppercase tracking-wider">
            <BookOpen className="w-3.5 h-3.5" /> ApexBee Journal & Insights
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight">
            Stories, Guides & <span className="bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">Commerce Insights</span>
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base max-w-2xl mx-auto">
            Practical strategies, technology innovations, merchant success stories, and updates from the ApexBee ecosystem.
          </p>

          {/* Search Bar */}
          <div className="max-w-md mx-auto relative pt-2">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-5.5" />
            <Input
              placeholder="Search articles, guides, topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 rounded-2xl bg-card border-border/80 text-sm h-11 shadow-sm"
            />
          </div>
        </div>
      </section>

      {/* Categories Bar */}
      <section className="container mx-auto px-4 py-6 max-w-5xl">
        <div className="flex items-center justify-center flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                selectedCategory === cat
                  ? "bg-amber-500 text-white shadow-md shadow-amber-500/20"
                  : "bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* Main Content */}
      <section className="container mx-auto px-4 py-8 max-w-5xl space-y-12">
        {/* Featured Post (Only if category is All and no search) */}
        {selectedCategory === "All" && !searchQuery && featuredPost && (
          <div 
            onClick={() => setReadingArticle(featuredPost)}
            className="group cursor-pointer bg-card border border-border/80 hover:border-amber-500/50 rounded-3xl overflow-hidden shadow-md transition grid md:grid-cols-12 gap-0"
          >
            <div className="md:col-span-6 relative aspect-[16/10] md:aspect-auto overflow-hidden bg-stone-900">
              <img
                src={featuredPost.imageUrl}
                alt={featuredPost.title}
                className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
              />
              <span className="absolute top-4 left-4 px-3 py-1 rounded-full bg-amber-500 text-stone-950 text-xs font-black uppercase shadow">
                Featured Story
              </span>
            </div>
            <div className="md:col-span-6 p-6 sm:p-8 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="font-bold text-amber-500 uppercase">{featuredPost.category}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {featuredPost.readTime}</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold group-hover:text-amber-500 transition leading-snug">
                  {featuredPost.title}
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed line-clamp-3">
                  {featuredPost.excerpt}
                </p>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-border/50 text-xs">
                <span className="text-muted-foreground font-medium">By {featuredPost.author}</span>
                <span className="font-bold text-amber-500 flex items-center gap-1 group-hover:translate-x-1 transition">
                  Read Full Article <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Blog Posts Grid */}
        <div>
          <h3 className="text-xl font-bold mb-6">Latest Articles & Guides</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPosts.map((post) => (
              <div
                key={post.id}
                onClick={() => setReadingArticle(post)}
                className="group cursor-pointer bg-card border border-border/80 hover:border-amber-500/50 rounded-2xl overflow-hidden shadow-sm transition flex flex-col justify-between"
              >
                <div className="aspect-[16/10] overflow-hidden bg-stone-900">
                  <img
                    src={post.imageUrl}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  />
                </div>
                <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-amber-500 uppercase">{post.category}</span>
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {post.readTime}
                      </span>
                    </div>
                    <h4 className="font-bold text-base group-hover:text-amber-500 transition leading-snug line-clamp-2">
                      {post.title}
                    </h4>
                    <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                      {post.excerpt}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-border/50 flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground">{post.date}</span>
                    <span className="font-bold text-amber-500 flex items-center gap-1">
                      Read →
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Newsletter Subscription Card */}
        <div className="p-8 rounded-3xl bg-gradient-to-r from-amber-500/10 via-background to-orange-500/10 border border-amber-500/30 text-center space-y-4">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-500 uppercase tracking-wider">
            <Mail className="w-3.5 h-3.5" /> Newsletter
          </div>
          <h3 className="text-2xl font-bold">Stay Ahead in Indian Digital Commerce</h3>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
            Get curated merchant growth guides, franchise news, and exclusive platform offers delivered straight to your inbox.
          </p>

          <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto pt-2">
            <Input
              type="email"
              required
              placeholder="Enter your email address"
              value={newsletterEmail}
              onChange={(e) => setNewsletterEmail(e.target.value)}
              className="rounded-xl text-xs bg-background"
            />
            <Button type="submit" className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-5 rounded-xl text-xs shadow-md">
              Subscribe
            </Button>
          </form>
        </div>
      </section>

      {/* Article Reader Modal */}
      <Dialog open={!!readingArticle} onOpenChange={() => setReadingArticle(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto rounded-3xl p-6 sm:p-8">
          {readingArticle && (
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs">
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 font-bold uppercase">
                    {readingArticle.category}
                  </span>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-muted-foreground">{readingArticle.readTime}</span>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-muted-foreground">{readingArticle.date}</span>
                </div>
                <DialogTitle className="text-2xl sm:text-3xl font-black leading-tight">
                  {readingArticle.title}
                </DialogTitle>
                <div className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-amber-500" /> By {readingArticle.author}
                </div>
              </div>

              <div className="aspect-[16/9] w-full rounded-2xl overflow-hidden bg-stone-900">
                <img
                  src={readingArticle.imageUrl}
                  alt={readingArticle.title}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="space-y-4 text-sm sm:text-base text-foreground/90 leading-relaxed">
                {readingArticle.content.map((paragraph, idx) => (
                  <p key={idx}>{paragraph}</p>
                ))}
              </div>

              <div className="pt-6 border-t border-border flex items-center justify-between">
                <div className="text-xs text-muted-foreground">
                  Enjoyed this article? Share it with fellow entrepreneurs!
                </div>
                <Button
                  onClick={() => {
                    navigator.clipboard?.writeText(window.location.href);
                    toast({ title: "Link Copied! 📋", description: "Article link copied to clipboard." });
                  }}
                  variant="outline"
                  className="text-xs font-bold rounded-xl"
                >
                  <Share2 className="w-3.5 h-3.5 mr-1" /> Share
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default Blog;
