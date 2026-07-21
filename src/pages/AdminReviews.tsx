import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Star, ArrowLeft, Search, Trash2, Edit2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const API_BASE = "https://server.apexbee.in/api";

const AdminReviews = () => {
  const navigate = useNavigate();
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [ratingFilter, setRatingFilter] = useState<string>("ALL");

  // Admin moderation states
  const [editingReview, setEditingReview] = useState<any>(null);
  const [editRating, setEditRating] = useState<number>(5);
  const [editComment, setEditComment] = useState<string>("");

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  }, []);

  // Redirect non-admins
  useEffect(() => {
    if (!user || user.role !== "admin") {
      navigate("/");
    }
  }, [user, navigate]);

  const fetchAllReviews = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/reviews`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load reviews");
      setReviews(data.reviews || []);
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Failed to load reviews");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllReviews();
  }, []);

  const handleAdminDelete = async (reviewId: string) => {
    if (!window.confirm("Are you sure you want to delete this review?")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/reviews/${reviewId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to delete review");
      alert("Review deleted successfully!");
      setReviews((prev) => prev.filter((r) => r._id !== reviewId));
    } catch (e: any) {
      alert(e.message || "Delete failed");
    }
  };

  const handleAdminEdit = (review: any) => {
    setEditingReview(review);
    setEditRating(review.rating || 5);
    setEditComment(review.comment || "");
  };

  const handleSaveAdminEdit = async () => {
    if (!editingReview) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/reviews/${editingReview._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          rating: editRating,
          comment: editComment
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update review");
      alert("Review updated successfully!");
      setReviews((prev) =>
        prev.map((r) =>
          r._id === editingReview._id
            ? { ...r, rating: editRating, comment: editComment }
            : r
        )
      );
      setEditingReview(null);
    } catch (e: any) {
      alert(e.message || "Update failed");
    }
  };

  // Filter logic
  const filteredReviews = useMemo(() => {
    return reviews.filter((r) => {
      const pName = r.productId?.name || "";
      const comment = r.comment || "";
      const customerName = r.userId?.name || r.userId?.email || "";
      const matchesSearch =
        pName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        comment.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customerName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesRating =
        ratingFilter === "ALL" || String(r.rating) === ratingFilter;

      return matchesSearch && matchesRating;
    });
  }, [reviews, searchQuery, ratingFilter]);

  return (
    <div className="min-h-screen bg-[#F4F6FA] text-[#0E1630]">
      <Navbar />

      <main className="container mx-auto px-4 py-8 pb-24">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/account")}
              className="p-2 bg-white hover:bg-slate-100 rounded-xl border border-gray-150 transition active:scale-95 shadow-sm"
            >
              <ArrowLeft className="h-4 w-4 text-navy" />
            </button>
            <h1 className="text-2xl sm:text-3xl font-black text-navy">Review Moderation</h1>
          </div>
          <div className="bg-navy text-white text-xs font-bold px-3 py-1.5 rounded-full">
            Admin Panel
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="bg-white border border-gray-150 rounded-2xl p-4 mb-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by product, customer, or comment..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-gray-200 rounded-xl py-2 pl-10 pr-4 text-sm focus:border-navy focus:outline-none text-navy font-semibold placeholder:text-gray-400"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Filter Rating:</span>
            <select
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
              className="bg-slate-50 border border-gray-200 rounded-xl py-2 px-3 text-sm focus:border-navy focus:outline-none text-navy font-bold"
            >
              <option value="ALL">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>
          </div>
        </div>

        {/* Reviews List Table */}
        <div className="bg-white border border-gray-150 rounded-3xl shadow-sm overflow-hidden text-left">
          {loading ? (
            <div className="p-12 text-center text-muted-foreground text-sm font-semibold">
              Loading reviews database...
            </div>
          ) : error ? (
            <div className="p-12 text-center text-red-600 text-sm font-semibold">
              {error}
            </div>
          ) : filteredReviews.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground text-sm font-semibold">
              No matching reviews found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-gray-150 text-xs font-bold uppercase tracking-wider text-gray-500">
                    <th className="p-4">Product</th>
                    <th className="p-4">Customer</th>
                    <th className="p-4">Rating</th>
                    <th className="p-4">Comment</th>
                    <th className="p-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium text-navy">
                  {filteredReviews.map((r) => (
                    <tr key={r._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {r.productId?.thumbnail && (
                            <img
                              src={r.productId.thumbnail}
                              alt={r.productId.name}
                              className="w-10 h-10 object-cover rounded-lg border shrink-0"
                            />
                          )}
                          <span className="font-extrabold max-w-[180px] truncate block">
                            {r.productId?.name || "Deleted Product"}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm font-bold">{r.userId?.name || "Customer"}</div>
                        <div className="text-xs text-gray-400 font-semibold">{r.userId?.email || ""}</div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1 text-amber-400">
                          {Array.from({ length: r.rating || 5 }).map((_, i) => (
                            <Star key={i} className="w-3.5 h-3.5 fill-current" />
                          ))}
                        </div>
                      </td>
                      <td className="p-4 max-w-sm">
                        {r.title && <div className="font-bold text-xs mb-0.5">{r.title}</div>}
                        <div className="text-xs text-gray-500 leading-normal line-clamp-2">{r.comment || "—"}</div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleAdminEdit(r)}
                            className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 active:scale-95 transition"
                            title="Edit Review"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleAdminDelete(r._id)}
                            className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 active:scale-95 transition"
                            title="Delete Review"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Admin Edit Modal overlay */}
      {editingReview && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-xl text-left border border-gray-150">
            <h3 className="text-lg font-black text-navy mb-4">Edit Customer Review</h3>

            <div className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setEditRating(num)}
                      className={`w-10 h-10 rounded-xl border text-sm font-black transition ${editRating === num
                        ? "bg-[#F3BA12] text-[#0A1128] border-[#F3BA12]"
                        : "bg-slate-50 text-gray-400 border-gray-200 hover:bg-slate-100"
                        }`}
                    >
                      {num}★
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">Review Comment</label>
                <textarea
                  value={editComment}
                  onChange={(e) => setEditComment(e.target.value)}
                  rows={4}
                  className="w-full rounded-xl border border-gray-200 p-3 text-sm focus:border-navy focus:outline-none bg-slate-50 text-navy font-medium"
                  placeholder="Write review details..."
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setEditingReview(null)}
                className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-700 bg-slate-50 hover:bg-slate-100 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAdminEdit}
                className="px-4 py-2 text-xs font-bold bg-[#0A1128] text-white hover:bg-navy rounded-xl transition"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default AdminReviews;
