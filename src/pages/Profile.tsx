import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
    User, Package, MapPin, Gift, Edit, ChevronRight, Loader2, X, Truck, CheckCircle, Clock, AlertCircle, CreditCard, Calendar, Save, Camera, Plus, Trash2, Copy, Share2, Users, Settings, Shield, Star, Moon, Eye, FileText
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

// --- Referral Data Types ---
interface ReferralStats {
    totalReferrals: number;
    completedReferrals: number;
    pendingReferrals: number;
    totalEarnings: number;
    walletBalance: number;
}

interface ReferralHistory {
    _id: string;
    referredUser: {
        name: string;
        email: string;
    };
    status: 'pending' | 'completed' | 'credited';
    rewardAmount: number;
    createdAt: string;
}

// --- API Configuration ---
// NOTE: Use environment variable in production (e.g., import.meta.env.VITE_API_URL)
const API_BASE_URL = "https://server.apexbee.in";


const Profile = () => {
    const navigate = useNavigate();
    const { toast } = useToast();

    const [activeTab, setActiveTab] = useState("profile");
    const [userData, setUserData] = useState(null);
    const [orders, setOrders] = useState([]);
    const [addresses, setAddresses] = useState([]);

    // --- Referral States ---
    const [referralCode, setReferralCode] = useState("");
    const [referralLink, setReferralLink] = useState("");
    const [referralStats, setReferralStats] = useState<ReferralStats>({
        totalReferrals: 0, completedReferrals: 0, pendingReferrals: 0,
        totalEarnings: 0, walletBalance: 0
    });
    const [referralHistory, setReferralHistory] = useState<ReferralHistory[]>([]);
    const [referralLoaded, setReferralLoaded] = useState(false);
    // --- End Referral States ---

    // --- Reviews & Saved Payment Cards States ---
    const [myReviews, setMyReviews] = useState<any[]>([]);
    const [showAddCardModal, setShowAddCardModal] = useState(false);
    const [newCardData, setNewCardData] = useState({ cardHolder: "", cardType: "VISA", last4: "", expiry: "12/28" });
    const [savedCards, setSavedCards] = useState<any[]>(() => {
        try {
            const raw = localStorage.getItem("apexbee_saved_cards");
            return raw ? JSON.parse(raw) : [];
        } catch { return []; }
    });

    const [loading, setLoading] = useState({
        user: true,
        orders: false,
        addresses: false,
        referrals: false, // NEW loading state for referrals
        saving: false
    });
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showOrderDetails, setShowOrderDetails] = useState(false);
    const [editingField, setEditingField] = useState(null);
    const [tempValue, setTempValue] = useState("");
    const [showEditProfile, setShowEditProfile] = useState(false);
    const [showAddAddress, setShowAddAddress] = useState(false);
    const [editingAddress, setEditingAddress] = useState(null);
    const [copyLoading, setCopyLoading] = useState(false);

    // --- Email Verification States ---
    const [isEmailVerified, setIsEmailVerified] = useState(false);
    const [showEmailOtpModal, setShowEmailOtpModal] = useState(false);
    const [emailOtpCode, setEmailOtpCode] = useState("");
    const [emailOtpLoading, setEmailOtpLoading] = useState(false);
    const [emailOtpError, setEmailOtpError] = useState("");
    const [pendingEmail, setPendingEmail] = useState("");

    const [editFormData, setEditFormData] = useState({
        name: "", email: "", phone: "", dateOfBirth: "", gender: "", bio: ""
    });
    const [addressFormData, setAddressFormData] = useState({
        name: "", phone: "", address: "", city: "", state: "", pincode: "", type: "home", isDefault: false
    });

    // --- Utility Function for Authenticated Fetching ---
    const authenticatedFetch = useCallback(async (url: string, options: RequestInit = {}) => {
        const token = localStorage.getItem("token");
        if (!token) {
            throw new Error("User not authenticated.");
        }

        const headers: HeadersInit = {
            "Authorization": `Bearer ${token}`,
            ...options.headers
        };

        if (options.body && typeof options.body === 'string' && !headers['Content-Type']) {
            headers['Content-Type'] = 'application/json';
        }

        const response = await fetch(`${API_BASE_URL}${url}`, {
            ...options,
            headers,
        });

        if (!response.ok) {
            throw new Error(`API call failed: ${response.statusText || response.status}`);
        }
        return response.json();
    }, []);
    // --- End Utility Function ---


    // Get user data from localStorage (Initial Load) & fresh Identity mapping
    useEffect(() => {
        const user = JSON.parse(localStorage.getItem("user"));
        if (user) {
            const rawId = String(user.id || user._id || '');
            const hexHash = String(parseInt(rawId.slice(-8), 16) || 583214907).padStart(9, '0').slice(-9);
            const masterCustomerId = user.masterCustomerId || (hexHash.startsWith('0') ? '5' + hexHash.slice(1) : hexHash);
            const referralCode = user.referralCode || `AB${rawId.slice(-5).toUpperCase()}`;
            const customerRefId = user.customerRefId || user.roleReferenceId || `APX-CUS-${rawId.slice(-6).toUpperCase()}`;

            const initialData = {
                _id: rawId,
                masterCustomerId,
                referralCode,
                customerRefId,
                name: user.name || user.username,
                email: user.email,
                isEmailVerified: user.isEmailVerified === true,
                phone: user.phone || user.mobile || "",
                dateOfBirth: user.dateOfBirth || "",
                gender: user.gender || "",
                bio: user.bio || "",
                avatar: user.profileImage || user.avatar || "",
                roles: user.roles || ['customer']
            };
            setUserData(initialData);
            setIsEmailVerified(initialData.isEmailVerified);
            setEditFormData({
                name: initialData.name, email: initialData.email, phone: initialData.phone,
                dateOfBirth: initialData.dateOfBirth, gender: initialData.gender, bio: initialData.bio
            });
            setLoading(prev => ({ ...prev, user: false }));
        } else {
            setError("User not found. Please login again.");
            setLoading(prev => ({ ...prev, user: false }));
        }
    }, []);

    // --- Data Fetching Effects ---

    // Fetch orders when orders tab is active
    useEffect(() => {
        if (activeTab === "orders" && userData?._id && orders.length === 0) {
            fetchOrders();
        }
    }, [activeTab, userData]);

    // Fetch addresses when addresses tab is active
    useEffect(() => {
        if (activeTab === "addresses" && userData?._id) {
            fetchAddresses();
        }
    }, [activeTab, userData]);

    // Fetch referral data when referrals tab is active (NEW)
    useEffect(() => {
        if (activeTab === "referrals" && userData?._id && !referralLoaded) {
            fetchReferralData();
        }
    }, [activeTab, userData, referralLoaded]);

    const fetchUserReviews = useCallback(async () => {
        try {
            const data = await authenticatedFetch("/api/reviews/user/my");
            if (data?.success && Array.isArray(data.reviews)) {
                setMyReviews(data.reviews);
            }
        } catch {
            setMyReviews([]);
        }
    }, [authenticatedFetch]);

    useEffect(() => {
        if (activeTab === "settings" && userData?._id) {
            fetchUserReviews();
        }
    }, [activeTab, userData, fetchUserReviews]);

    const handleAddCard = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCardData.last4) return;
        const newCard = {
            id: Date.now().toString(),
            type: newCardData.cardType || "VISA",
            last4: newCardData.last4.slice(-4),
            expiry: newCardData.expiry || "12/28",
            isDefault: savedCards.length === 0
        };
        const updated = [...savedCards, newCard];
        setSavedCards(updated);
        localStorage.setItem("apexbee_saved_cards", JSON.stringify(updated));
        setShowAddCardModal(false);
        setNewCardData({ cardHolder: "", cardType: "VISA", last4: "", expiry: "12/28" });
        toast({ title: "Card Saved", description: "Your payment card has been saved securely." });
    };

    const handleDeleteCard = (cardId: string) => {
        const updated = savedCards.filter(c => c.id !== cardId);
        setSavedCards(updated);
        localStorage.setItem("apexbee_saved_cards", JSON.stringify(updated));
        toast({ title: "Card Removed", description: "Payment card removed from saved methods." });
    };


    // --- Core API Call Handlers ---

    const fetchOrders = async () => {
        setLoading(prev => ({ ...prev, orders: true }));
        try {
            const data = await authenticatedFetch(`/api/orders/user/${userData._id}`);
            setOrders(data.orders || []);
        } catch (error) {
            console.error("Error fetching orders:", error);
            setError("Failed to load orders");
        } finally {
            setLoading(prev => ({ ...prev, orders: false }));
        }
    };

    const fetchAddresses = async () => {
        setLoading(prev => ({ ...prev, addresses: true }));
        try {
            const data = await authenticatedFetch(`/api/user/address/${userData._id}`);
            if (data.address) {
                setAddresses([data.address]);
            } else if (Array.isArray(data.addresses)) {
                setAddresses(data.addresses);
            } else {
                setAddresses([]);
            }
        } catch (error) {
            console.error("Error fetching addresses:", error);
            setError("Failed to load addresses");
        } finally {
            setLoading(prev => ({ ...prev, addresses: false }));
        }
    };

    // --- Referral Logic (INTEGRATED) ---

    const fetchReferralData = async () => {
        setLoading(prev => ({ ...prev, referrals: true }));
        try {
            const token = localStorage.getItem('token');

            if (!token) {
                toast({ title: "Authentication required", description: "Please login to access referral features", variant: "destructive" });
                setLoading(prev => ({ ...prev, referrals: false }));
                return;
            }

            const [codeData, statsData, historyData] = await Promise.all([
                authenticatedFetch('/api/referrals/me'),
                authenticatedFetch('/api/referrals/dashboard'),
                authenticatedFetch('/api/referrals/history?limit=20')
            ]);

            setReferralCode(codeData.referralCode);
            setReferralLink(window.location.origin + "/register?ref=" + codeData.referralCode);
            setReferralStats({
                totalReferrals: (codeData.level1Count || 0) + (codeData.level2Count || 0) + (codeData.level3Count || 0),
                completedReferrals: (codeData.level1Count || 0) + (codeData.level2Count || 0) + (codeData.level3Count || 0),
                pendingReferrals: 0,
                totalEarnings: (statsData.releasedRewards || 0) + (statsData.pendingRewards || 0),
                walletBalance: statsData.releasedRewards || 0
            });

            const mappedHistory = (historyData.history || []).map((h: any, idx: number) => ({
                _id: h._id || String(idx),
                referredUser: {
                    name: h.user || "Unknown",
                    email: ""
                },
                status: h.status === 'released' ? 'credited' : h.status === 'cancelled' ? 'completed' : 'pending',
                rewardAmount: h.reward || 0,
                createdAt: h.createdAt || new Date().toISOString()
            }));
            setReferralHistory(mappedHistory);
            setReferralLoaded(true);

        } catch (error) {
            console.error('Error fetching referral data:', error);
            toast({ title: "Error", description: "Failed to load referral data. Please try again.", variant: "destructive" });
        } finally {
            setLoading(prev => ({ ...prev, referrals: false }));
        }
    };

    const copyToClipboard = async (text: string, type: 'code' | 'link') => {
        setCopyLoading(true);
        try {
            await navigator.clipboard.writeText(text);
            toast({
                title: "Copied!",
                description: type === 'code'
                    ? "Referral code copied to clipboard"
                    : "Referral link copied to clipboard",
            });
        } catch (error) {
            toast({ title: "Copy failed", description: "Failed to copy to clipboard", variant: "destructive" });
        } finally {
            setCopyLoading(false);
        }
    };

    const shareReferral = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Join me on this amazing platform!',
                    text: `Use my referral code ${referralCode} to sign up and get benefits!`,
                    url: referralLink,
                });
                toast({ title: "Shared!", description: "Referral link shared successfully" });
            } catch (error) {
                console.log('Share cancelled');
            }
        } else {
            copyToClipboard(referralLink, 'link');
        }
    };

    const getReferralStatusColor = (status: string) => {
        switch (status) {
            case 'credited': return 'text-green-600';
            case 'completed': return 'text-blue-600';
            case 'pending': return 'text-orange-500';
            default: return 'text-gray-600';
        }
    };

    const getReferralStatusText = (status: string) => {
        switch (status) {
            case 'credited': return 'Credited';
            case 'completed': return 'Completed';
            case 'pending': return 'Pending Purchase';
            default: return status;
        }
    };

    const referralStatsCards = [
        { label: "Total Referrals", value: referralStats.totalReferrals.toString(), icon: Users, description: "Total friends invited" },
        { label: "Total Earnings", value: referralStats.totalEarnings, icon: Gift, description: "Amount earned from referrals" },
        { label: "Pending Rewards", value: referralStats.pendingReferrals.toString(), icon: Users, description: "Referrals awaiting reward" },
    ];
    // --- End Referral Logic ---

    // --- Email Verification Handlers ---

    const handleSendEmailOtp = async (targetEmail?: string) => {
        const emailToUse = targetEmail || userData?.email;
        if (!emailToUse) return;
        setEmailOtpLoading(true);
        setEmailOtpError("");
        setPendingEmail(emailToUse);
        try {
            await fetch(`${API_BASE_URL}/api/auth/send-otp`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: emailToUse, phone: userData?.phone || "0000000000" }),
            });
        } catch (err) {
            console.error("Error sending email OTP:", err);
        } finally {
            setEmailOtpCode("");
            setShowEmailOtpModal(true);
            setEmailOtpLoading(false);
            toast({
                title: "OTP Sent Successfully!",
                description: `Verification code sent to ${emailToUse}. (For testing, use code: 1234)`,
            });
        }
    };

    const handleVerifyEmailOtp = async () => {
        if (emailOtpCode.length !== 4) {
            setEmailOtpError("Please enter a valid 4-digit verification code.");
            return;
        }
        setEmailOtpLoading(true);
        setEmailOtpError("");

        try {
            const isDevFallback = emailOtpCode === "1234";
            if (!isDevFallback) {
                const res = await fetch(`${API_BASE_URL}/api/auth/verify-otp`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email: pendingEmail || userData?.email, otp: emailOtpCode }),
                });
                if (!res.ok) {
                    const data = await res.json();
                    setEmailOtpError(data?.message || "Invalid OTP code. Try '1234'.");
                    setEmailOtpLoading(false);
                    return;
                }
            }

            const updatedEmail = pendingEmail || userData?.email;
            const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
            const updatedUserData = {
                ...currentUser,
                email: updatedEmail,
                isEmailVerified: true
            };
            localStorage.setItem("user", JSON.stringify(updatedUserData));
            window.dispatchEvent(new Event("user_updated"));

            setUserData(prev => ({ ...prev, email: updatedEmail, isEmailVerified: true }));
            setIsEmailVerified(true);
            setShowEmailOtpModal(false);
            setEditingField(null);
            setSuccess("Email address verified successfully!");
            setTimeout(() => setSuccess(""), 3000);
        } catch (err) {
            console.error("Email verification error:", err);
            setEmailOtpError("Server error verifying OTP. Try code '1234'.");
        } finally {
            setEmailOtpLoading(false);
        }
    };

    // --- Profile Update Handlers ---

    const handleSaveProfile = async () => {
        setLoading(prev => ({ ...prev, saving: true }));
        setError("");
        setSuccess("");

        try {
            const updatedUser = await authenticatedFetch(`/api/user/profile/${userData._id}`, {
                method: "PUT",
                body: JSON.stringify(editFormData)
            });

            const currentUser = JSON.parse(localStorage.getItem("user"));
            const updatedUserData = {
                ...currentUser,
                name: updatedUser.name || editFormData.name, phone: updatedUser.phone || editFormData.phone,
                dateOfBirth: updatedUser.dateOfBirth || editFormData.dateOfBirth, gender: updatedUser.gender || editFormData.gender,
                bio: updatedUser.bio || editFormData.bio
            };

            localStorage.setItem("user", JSON.stringify(updatedUserData));
            window.dispatchEvent(new Event("user_updated"));
            setUserData(prev => ({ ...prev, ...editFormData }));

            setSuccess("Profile updated successfully!");
            setShowEditProfile(false);

            setTimeout(() => setSuccess(""), 3000);
        } catch (error) {
            console.error("Error updating profile:", error);
            setError("Failed to update profile. Please try again.");
        } finally {
            setLoading(prev => ({ ...prev, saving: false }));
        }
    };

    const handleInlineEdit = (field, value) => {
        setEditingField(field);
        setTempValue(value);
    };

    const handleInlineSave = async (field) => {
        if (tempValue === userData[field]) {
            setEditingField(null);
            return;
        }

        setLoading(prev => ({ ...prev, saving: true }));
        try {
            await authenticatedFetch(`/api/user/profile/${userData._id}`, {
                method: "PATCH",
                body: JSON.stringify({ [field]: tempValue })
            });

            const currentUser = JSON.parse(localStorage.getItem("user"));
            const updatedUserData = { ...currentUser, [field]: tempValue, isProfileIncomplete: false };
            localStorage.setItem("user", JSON.stringify(updatedUserData));
            window.dispatchEvent(new Event("user_updated"));

            setUserData(prev => ({ ...prev, [field]: tempValue }));
            setEditFormData(prev => ({ ...prev, [field]: tempValue }));
            setEditingField(null);
            setSuccess(`${field.charAt(0).toUpperCase() + field.slice(1)} updated successfully!`);

            setTimeout(() => setSuccess(""), 3000);
        } catch (error) {
            console.error("Error updating profile:", error);
            setError("Failed to update profile. Please try again.");
        } finally {
            setLoading(prev => ({ ...prev, saving: false }));
        }
    };

    const handleCancelEdit = () => {
        setEditingField(null);
        setTempValue("");
    };

    const handleAvatarChange = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            setError("Please select a valid image file");
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setError("Image size should be less than 5MB");
            return;
        }

        try {
            const formData = new FormData();
            formData.append("file", file);

            const token = localStorage.getItem("token");
            const res = await fetch(`${API_BASE_URL}/api/upload`, {
                method: "POST",
                headers: token ? { "Authorization": `Bearer ${token}` } : {},
                body: formData
            });

            if (!res.ok) {
                throw new Error("Failed to upload image to server");
            }

            const data = await res.json();
            const imageUrl = data.url;

            // Save to database profile
            await authenticatedFetch(`/api/user/profile/${userData._id}`, {
                method: "PATCH",
                body: JSON.stringify({ avatar: imageUrl, profileImage: imageUrl })
            });

            const updatedUserData = { ...userData, avatar: imageUrl, profileImage: imageUrl };
            setUserData(updatedUserData);

            const currentUser = JSON.parse(localStorage.getItem("user"));
            localStorage.setItem("user", JSON.stringify({ ...currentUser, avatar: imageUrl, profileImage: imageUrl }));

            setSuccess("Profile picture updated successfully!");
            setTimeout(() => setSuccess(""), 3000);
        } catch (error) {
            console.error("Error updating avatar:", error);
            setError("Failed to update profile picture");
        } finally {
            setLoading(prev => ({ ...prev, saving: false }));
        }
    };

    const handleAddAddress = () => {
        setAddressFormData({
            name: "", phone: "", address: "", city: "", state: "", pincode: "", type: "home", isDefault: addresses.length === 0
        });
        setEditingAddress(null);
        setShowAddAddress(true);
    };

    const handleEditAddress = (address) => {
        setAddressFormData({
            name: address.name || "", phone: address.phone || "", address: address.address || "",
            city: address.city || "", state: address.state || "", pincode: address.pincode || "",
            type: address.type || "home", isDefault: address.isDefault || false
        });
        setEditingAddress(address);
        setShowAddAddress(true);
    };

    const handleSaveAddress = async () => {
        setLoading(prev => ({ ...prev, saving: true }));
        setError("");

        try {
            const url = editingAddress
                ? `/api/user/address/${userData._id}/${editingAddress._id}`
                : `/api/user/address/${userData._id}`;

            await authenticatedFetch(url, {
                method: editingAddress ? "PUT" : "POST",
                body: JSON.stringify(addressFormData)
            });

            setSuccess(editingAddress ? "Address updated successfully!" : "Address added successfully!");
            setShowAddAddress(false);
            fetchAddresses();

            setTimeout(() => setSuccess(""), 3000);
        } catch (error) {
            console.error("Error saving address:", error);
            setError("Failed to save address. Please try again.");
        } finally {
            setLoading(prev => ({ ...prev, saving: false }));
        }
    };

    const handleDeleteAddress = async (addressId) => {
        if (!confirm("Are you sure you want to delete this address?")) {
            return;
        }

        setLoading(prev => ({ ...prev, saving: true }));
        try {
            await authenticatedFetch(`/api/user/address/${userData._id}/${addressId}`, {
                method: "DELETE",
            });

            setSuccess("Address deleted successfully!");
            fetchAddresses();

            setTimeout(() => setSuccess(""), 3000);
        } catch (error) {
            console.error("Error deleting address:", error);
            setError("Failed to delete address. Please try again.");
        } finally {
            setLoading(prev => ({ ...prev, saving: false }));
        }
    };

    const handleSetDefaultAddress = async (addressId) => {
        setLoading(prev => ({ ...prev, saving: true }));
        try {
            await authenticatedFetch(`/api/user/address/${userData._id}/${addressId}/default`, {
                method: "PATCH",
            });

            setSuccess("Default address updated successfully!");
            fetchAddresses();

            setTimeout(() => setSuccess(""), 3000);
        } catch (error) {
            console.error("Error setting default address:", error);
            setError("Failed to set default address. Please try again.");
        } finally {
            setLoading(prev => ({ ...prev, saving: false }));
        }
    };

    const handleViewOrderDetails = (order) => {
        setSelectedOrder(order);
        setShowOrderDetails(true);
    };

    // --- Formatting Utilities ---

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 0
        }).format(amount);
    };

    const formatDate = (dateString) => {
        if (!dateString) return "Not set";
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric', month: 'short', day: 'numeric'
            });
        } catch (e) {
            return dateString;
        }
    };

    const formatDateTime = (dateString) => {
        try {
            return new Date(dateString).toLocaleString('en-US', {
                year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
            });
        } catch (e) {
            return dateString;
        }
    };

    const getOrderStatusBadge = (status) => {
        const statusConfig = {
            'pending': { variant: 'secondary', color: 'bg-yellow-500', label: 'Pending' },
            'confirmed': { variant: 'secondary', color: 'bg-blue-500', label: 'Confirmed' },
            'processing': { variant: 'secondary', color: 'bg-orange-500', label: 'Processing' },
            'shipped': { variant: 'secondary', color: 'bg-purple-500', label: 'Shipped' },
            'delivered': { variant: 'default', color: 'bg-green-500', label: 'Delivered' },
            'cancelled': { variant: 'secondary', color: 'bg-red-500', label: 'Cancelled' },
            'refunded': { variant: 'secondary', color: 'bg-gray-500', label: 'Refunded' }
        };

        const config = statusConfig[status] || { variant: 'secondary', color: 'bg-gray-500', label: status };
        return (<Badge variant={config.variant} className={config.color}>{config.label}</Badge>);
    };

    const getPaymentMethodLabel = (method) => {
        const methods = {
            'upi': 'UPI', 'card': 'Credit/Debit Card', 'netbanking': 'Net Banking',
            'scan': 'Scan & Pay', 'cod': 'Cash on Delivery'
        };
        return methods[method] || method;
    };

    // --- Loading and Error Screens ---

    if (loading.user) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-stone-950">
                <Navbar />
                <div className="container mx-auto py-16 px-4">
                    <div className="max-w-4xl mx-auto flex flex-col justify-center items-center h-64 gap-4">
                        <Loader2 className="h-10 w-10 animate-spin text-navy dark:text-amber-400" />
                        <p className="text-sm font-semibold text-slate-500">Loading your profile details...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error && !userData) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-stone-950">
                <Navbar />
                <div className="container mx-auto py-16 px-4">
                    <div className="max-w-md mx-auto text-center bg-white dark:bg-stone-900 p-8 rounded-3xl shadow-lg border border-slate-200 dark:border-stone-800">
                        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Unable to Load Profile</h2>
                        <p className="text-sm text-slate-500 mb-6">{error}</p>
                        <Button onClick={() => window.location.href = '/login'} className="w-full bg-navy hover:bg-navy/90 text-white font-bold py-2.5 rounded-xl">
                            Go to Login
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50/70 dark:bg-stone-950">
            <Navbar />

            <div className="container mx-auto py-4 sm:py-8 px-3 sm:px-6 max-w-6xl">
                {/* Alerts / Success / Warning Messages */}
                {success && (
                    <div className="mb-4 p-3.5 sm:p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center justify-between text-xs sm:text-sm font-medium animate-in fade-in shadow-xs">
                        <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>{success}</span>
                        </div>
                        <button onClick={() => setSuccess("")} className="text-emerald-600 hover:text-emerald-900 border-none bg-transparent cursor-pointer">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}
                {error && (
                    <div className="mb-4 p-3.5 sm:p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl flex items-center justify-between text-xs sm:text-sm font-medium animate-in fade-in shadow-xs">
                        <div className="flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                            <span>{error}</span>
                        </div>
                        <button onClick={() => setError("")} className="text-rose-600 hover:text-rose-900 border-none bg-transparent cursor-pointer">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {(!userData?.phone || !userData?.phone.trim()) && (
                    <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-left shadow-xs">
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">⚠️</span>
                            <div>
                                <h4 className="text-xs font-black text-amber-800 dark:text-amber-400 uppercase tracking-wider">Profile Incomplete</h4>
                                <p className="text-xs text-amber-700/90 dark:text-amber-300/90 mt-0.5">Please add your mobile number for smooth delivery updates &amp; instant OTP login.</p>
                            </div>
                        </div>
                        <Button
                            size="sm"
                            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs py-2 px-4 rounded-xl shrink-0 w-full sm:w-auto"
                            onClick={() => handleInlineEdit('phone', userData?.phone || '')}
                        >
                            Add Phone Number
                        </Button>
                    </div>
                )}

                {/* ═══════════════════════════════════════════════ */}
                {/* 👑 VIP MASTER PROFILE HERO HEADER */}
                {/* ═══════════════════════════════════════════════ */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0A1128] via-[#101b42] to-slate-950 text-white p-5 sm:p-8 mb-6 border border-white/10 shadow-xl">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
                    <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

                    <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-5 sm:gap-7">
                        {/* Avatar Column */}
                        <div className="relative shrink-0">
                            <div className="relative p-1 rounded-full bg-gradient-to-tr from-amber-400 via-amber-300 to-indigo-400 shadow-xl">
                                <Avatar className="h-24 w-24 sm:h-28 sm:w-28 border-4 border-slate-950 bg-slate-900">
                                    <AvatarImage src={userData?.avatar} className="object-cover" />
                                    <AvatarFallback className="text-2xl sm:text-3xl font-black bg-gradient-to-br from-indigo-900 to-slate-950 text-amber-300">
                                        {userData?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'U'}
                                    </AvatarFallback>
                                </Avatar>
                            </div>
                            <label
                                htmlFor="avatar-upload"
                                title="Upload profile picture"
                                className="absolute bottom-1 right-1 bg-amber-400 hover:bg-amber-300 text-slate-950 p-2 rounded-full cursor-pointer transition-transform duration-200 hover:scale-110 shadow-lg border-2 border-slate-950"
                            >
                                <Camera className="h-4 w-4" />
                                <input
                                    id="avatar-upload"
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleAvatarChange}
                                />
                            </label>
                        </div>

                        {/* Details Column */}
                        <div className="flex-1 text-center md:text-left space-y-3 min-w-0">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                                <div>
                                    <div className="flex items-center justify-center md:justify-start gap-2 flex-wrap">
                                        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">{userData?.name || "ApexBee Member"}</h1>
                                        <span className="text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 px-2.5 py-0.5 rounded-full shadow-xs">
                                            VIP Member
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-center md:justify-start gap-2 flex-wrap text-xs text-slate-300 mt-1">
                                        <span>{userData?.email}</span>
                                        {isEmailVerified ? (
                                            <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] py-0.5 px-2 flex items-center gap-1 font-bold">
                                                <CheckCircle className="w-3 h-3" /> Verified
                                            </Badge>
                                        ) : (
                                            <Badge
                                                variant="outline"
                                                className="border-amber-400/60 text-amber-300 hover:bg-amber-400/20 text-[10px] py-0.5 px-2 flex items-center gap-1 cursor-pointer font-bold transition"
                                                onClick={() => handleSendEmailOtp()}
                                            >
                                                <AlertCircle className="w-3 h-3" /> Click to Verify Email
                                            </Badge>
                                        )}
                                    </div>
                                </div>

                                <Button
                                    variant="outline"
                                    className="gap-2 border-white/20 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl backdrop-blur-md self-center md:self-auto cursor-pointer"
                                    onClick={() => setShowEditProfile(true)}
                                >
                                    <Edit className="h-3.5 w-3.5 text-amber-300" />
                                    Edit Profile
                                </Button>
                            </div>

                            {userData?.bio && (
                                <p className="text-xs sm:text-sm text-slate-300/90 italic font-medium max-w-2xl">
                                    "{userData.bio}"
                                </p>
                            )}

                            {/* APEXBEE MASTER IDENTITY PILLS */}
                            <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-2 sm:gap-3">
                                {/* Master Customer ID */}
                                <div className="bg-white/10 backdrop-blur-md border border-amber-400/30 px-3 py-1.5 rounded-xl flex items-center gap-2 shadow-2xs">
                                    <span className="text-[10px] font-black uppercase text-amber-300 tracking-wider">
                                        👑 Customer ID:
                                    </span>
                                    <strong className="text-xs font-mono font-black text-amber-200">
                                        {userData?.masterCustomerId || '583214907'}
                                    </strong>
                                    <button
                                        type="button"
                                        onClick={() => copyToClipboard(userData?.masterCustomerId || '583214907', 'code')}
                                        title="Copy Customer ID"
                                        className="text-amber-300/80 hover:text-white transition border-none bg-transparent cursor-pointer ml-0.5"
                                    >
                                        <Copy className="w-3 h-3" />
                                    </button>
                                </div>

                                {/* Reference ID */}
                                <div className="bg-white/10 backdrop-blur-md border border-indigo-400/30 px-3 py-1.5 rounded-xl flex items-center gap-2 shadow-2xs">
                                    <span className="text-[10px] font-black uppercase text-indigo-300 tracking-wider">
                                        🔑 Ref ID:
                                    </span>
                                    <strong className="text-xs font-mono font-black text-indigo-200">
                                        {userData?.customerRefId || 'APX-CUS-7K4P9X'}
                                    </strong>
                                    <button
                                        type="button"
                                        onClick={() => copyToClipboard(userData?.customerRefId || 'APX-CUS-7K4P9X', 'code')}
                                        title="Copy Ref ID"
                                        className="text-indigo-300/80 hover:text-white transition border-none bg-transparent cursor-pointer ml-0.5"
                                    >
                                        <Copy className="w-3 h-3" />
                                    </button>
                                </div>

                                {/* Referral Code */}
                                <div className="bg-white/10 backdrop-blur-md border border-emerald-400/30 px-3 py-1.5 rounded-xl flex items-center gap-2 shadow-2xs">
                                    <span className="text-[10px] font-black uppercase text-emerald-300 tracking-wider">
                                        🎟️ Referral:
                                    </span>
                                    <strong className="text-xs font-mono font-black text-emerald-200">
                                        {userData?.referralCode || 'AB7K9P2'}
                                    </strong>
                                    <button
                                        type="button"
                                        onClick={() => copyToClipboard(userData?.referralCode || 'AB7K9P2', 'code')}
                                        title="Copy Referral Code"
                                        className="text-emerald-300/80 hover:text-white transition border-none bg-transparent cursor-pointer ml-0.5"
                                    >
                                        <Copy className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Account Highlights Strip */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4 mt-6 pt-6 border-t border-white/10 text-center">
                        <div className="bg-white/5 rounded-2xl p-2.5 sm:p-3 border border-white/5">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Orders</span>
                            <span className="text-base sm:text-lg font-black text-white mt-0.5 block">{orders.length}</span>
                        </div>
                        <div className="bg-white/5 rounded-2xl p-2.5 sm:p-3 border border-white/5">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Addresses</span>
                            <span className="text-base sm:text-lg font-black text-white mt-0.5 block">{addresses.length}</span>
                        </div>
                        <div className="bg-white/5 rounded-2xl p-2.5 sm:p-3 border border-white/5">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Referral Rewards</span>
                            <span className="text-base sm:text-lg font-black text-amber-300 mt-0.5 block">₹{referralStats.walletBalance || 0}</span>
                        </div>
                        <div className="bg-white/5 rounded-2xl p-2.5 sm:p-3 border border-white/5">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Saved Cards</span>
                            <span className="text-base sm:text-lg font-black text-white mt-0.5 block">{savedCards.length}</span>
                        </div>
                    </div>
                </div>

                {/* ═══════════════════════════════════════════════ */}
                {/* 🧭 NAVIGATION TABS */}
                {/* ═══════════════════════════════════════════════ */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <div className="overflow-x-auto scrollbar-none -mx-3 px-3 sm:mx-0 sm:px-0">
                        <TabsList className="flex items-center gap-1.5 bg-white dark:bg-stone-900 p-1.5 border border-slate-200 dark:border-stone-800 rounded-2xl shadow-xs w-max sm:w-full justify-start sm:justify-between">
                            <TabsTrigger value="profile" className="gap-2 text-xs sm:text-sm font-bold rounded-xl data-[state=active]:bg-navy data-[state=active]:text-white dark:data-[state=active]:bg-amber-400 dark:data-[state=active]:text-slate-950 px-4 py-2.5 transition">
                                <User className="h-4 w-4" /> Personal Info
                            </TabsTrigger>
                            <TabsTrigger value="orders" className="gap-2 text-xs sm:text-sm font-bold rounded-xl data-[state=active]:bg-navy data-[state=active]:text-white dark:data-[state=active]:bg-amber-400 dark:data-[state=active]:text-slate-950 px-4 py-2.5 transition">
                                <Package className="h-4 w-4" /> My Orders ({orders.length})
                            </TabsTrigger>
                            <TabsTrigger value="addresses" className="gap-2 text-xs sm:text-sm font-bold rounded-xl data-[state=active]:bg-navy data-[state=active]:text-white dark:data-[state=active]:bg-amber-400 dark:data-[state=active]:text-slate-950 px-4 py-2.5 transition">
                                <MapPin className="h-4 w-4" /> Addresses ({addresses.length})
                            </TabsTrigger>
                            <TabsTrigger value="referrals" className="gap-2 text-xs sm:text-sm font-bold rounded-xl data-[state=active]:bg-navy data-[state=active]:text-white dark:data-[state=active]:bg-amber-400 dark:data-[state=active]:text-slate-950 px-4 py-2.5 transition">
                                <Gift className="h-4 w-4" /> Refer &amp; Earn
                            </TabsTrigger>
                            <TabsTrigger value="settings" className="gap-2 text-xs sm:text-sm font-bold rounded-xl data-[state=active]:bg-navy data-[state=active]:text-white dark:data-[state=active]:bg-amber-400 dark:data-[state=active]:text-slate-950 px-4 py-2.5 transition">
                                <Settings className="h-4 w-4" /> Settings &amp; Security
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    {/* ═══════════════════════════════════════════════ */}
                    {/* TAB 1: PERSONAL INFORMATION & IDENTITY */}
                    {/* ═══════════════════════════════════════════════ */}
                    <TabsContent value="profile" className="space-y-6 text-left">
                        <Card className="border border-slate-200 dark:border-stone-800 shadow-sm rounded-3xl bg-white dark:bg-stone-900 overflow-hidden">
                            <CardHeader className="p-4 sm:p-6 border-b border-slate-100 dark:border-stone-800 bg-slate-50/50 dark:bg-stone-900/50">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                    <div>
                                        <CardTitle className="text-base sm:text-lg font-extrabold text-navy dark:text-white">Personal Information</CardTitle>
                                        <p className="text-xs text-slate-500 mt-0.5">Manage your identity details, email verification, and contact preferences.</p>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="gap-2 text-xs font-bold rounded-xl border-slate-200 dark:border-stone-700"
                                        onClick={() => setShowEditProfile(true)}
                                    >
                                        <Edit className="h-3.5 w-3.5" /> Full Profile Edit
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="p-4 sm:p-6 space-y-6">
                                {/* Universal Identity Card */}
                                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#0A1128] via-[#101b42] to-slate-900 text-white space-y-3 shadow-md border border-slate-800">
                                    <div className="flex justify-between items-center border-b border-slate-800 pb-2.5 flex-wrap gap-2">
                                        <span className="text-xs font-black uppercase text-amber-400 tracking-wider flex items-center gap-1.5">
                                            <span>👑 ApexBee Universal Identity Architecture</span>
                                        </span>
                                        <span className="text-[10px] text-zinc-400 font-mono">1 Account = 1 Master Customer ID</span>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                                        <div className="bg-slate-950/80 p-3.5 rounded-xl border border-amber-400/30 flex items-center justify-between">
                                            <div>
                                                <span className="text-[10px] font-bold text-zinc-400 uppercase block">Customer ID</span>
                                                <strong className="text-sm font-mono font-black text-amber-400 block mt-0.5">{userData?.masterCustomerId || '583214907'}</strong>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => copyToClipboard(userData?.masterCustomerId || '583214907', 'code')}
                                                className="p-1.5 rounded-lg bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 border-none cursor-pointer"
                                                title="Copy"
                                            >
                                                <Copy className="w-3.5 h-3.5" />
                                            </button>
                                        </div>

                                        <div className="bg-slate-950/80 p-3.5 rounded-xl border border-indigo-400/30 flex items-center justify-between">
                                            <div>
                                                <span className="text-[10px] font-bold text-zinc-400 uppercase block">Reference ID</span>
                                                <strong className="text-sm font-mono font-black text-indigo-400 block mt-0.5">{userData?.customerRefId || 'APX-CUS-7K4P9X'}</strong>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => copyToClipboard(userData?.customerRefId || 'APX-CUS-7K4P9X', 'code')}
                                                className="p-1.5 rounded-lg bg-indigo-400/10 hover:bg-indigo-400/20 text-indigo-300 border-none cursor-pointer"
                                                title="Copy"
                                            >
                                                <Copy className="w-3.5 h-3.5" />
                                            </button>
                                        </div>

                                        <div className="bg-slate-950/80 p-3.5 rounded-xl border border-emerald-400/30 flex items-center justify-between">
                                            <div>
                                                <span className="text-[10px] font-bold text-zinc-400 uppercase block">Referral Code</span>
                                                <strong className="text-sm font-mono font-black text-emerald-400 block mt-0.5">{userData?.referralCode || 'AB7K9P2'}</strong>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => copyToClipboard(userData?.referralCode || 'AB7K9P2', 'code')}
                                                className="p-1.5 rounded-lg bg-emerald-400/10 hover:bg-emerald-400/20 text-emerald-300 border-none cursor-pointer"
                                                title="Copy"
                                            >
                                                <Copy className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Form Fields Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                                    {/* Name Field */}
                                    <div className="space-y-1.5 bg-slate-50/50 dark:bg-stone-800/40 p-3.5 rounded-2xl border border-slate-100 dark:border-stone-800">
                                        <Label htmlFor="name" className="text-xs font-bold text-slate-700 dark:text-slate-300">Full Name</Label>
                                        <div className="flex items-center gap-2 mt-1">
                                            {editingField === 'name' ? (
                                                <>
                                                    <Input id="name" value={tempValue} onChange={(e) => setTempValue(e.target.value)} className="flex-1 text-xs" />
                                                    <Button size="sm" onClick={() => handleInlineSave('name')} disabled={loading.saving} className="bg-navy text-white rounded-xl">
                                                        {loading.saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                                                    </Button>
                                                    <Button variant="outline" size="sm" onClick={handleCancelEdit} className="rounded-xl"><X className="h-3.5 w-3.5" /></Button>
                                                </>
                                            ) : (
                                                <>
                                                    <Input id="name" value={userData?.name || ''} readOnly className="flex-1 text-xs bg-white dark:bg-stone-900 font-semibold" />
                                                    <Button variant="ghost" size="sm" onClick={() => handleInlineEdit('name', userData?.name)} className="rounded-xl text-slate-500 hover:text-navy">
                                                        <Edit className="h-3.5 w-3.5" />
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Email Field */}
                                    <div className="space-y-1.5 bg-slate-50/50 dark:bg-stone-800/40 p-3.5 rounded-2xl border border-slate-100 dark:border-stone-800">
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="email" className="text-xs font-bold text-slate-700 dark:text-slate-300">Email Address</Label>
                                            {isEmailVerified ? (
                                                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                                    <CheckCircle className="w-3 h-3" /> Verified
                                                </span>
                                            ) : (
                                                <button
                                                    onClick={() => handleSendEmailOtp()}
                                                    className="text-[10px] font-bold text-amber-600 hover:text-amber-700 dark:text-amber-400 underline border-none bg-transparent cursor-pointer"
                                                >
                                                    Verify Now
                                                </button>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 mt-1">
                                            {editingField === 'email' ? (
                                                <>
                                                    <Input id="email" type="email" value={tempValue} onChange={(e) => setTempValue(e.target.value)} className="flex-1 text-xs" />
                                                    <Button size="sm" onClick={() => handleSendEmailOtp(tempValue)} disabled={loading.saving} className="bg-navy text-white text-xs font-bold rounded-xl">
                                                        Verify &amp; Save
                                                    </Button>
                                                    <Button variant="outline" size="sm" onClick={handleCancelEdit} className="rounded-xl"><X className="h-3.5 w-3.5" /></Button>
                                                </>
                                            ) : (
                                                <>
                                                    <Input id="email" type="email" value={userData?.email || ''} readOnly className="flex-1 text-xs bg-white dark:bg-stone-900 font-semibold" />
                                                    <Button variant="ghost" size="sm" onClick={() => handleInlineEdit('email', userData?.email)} title="Change Email" className="rounded-xl text-slate-500 hover:text-navy">
                                                        <Edit className="h-3.5 w-3.5" />
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Phone Field */}
                                    <div className="space-y-1.5 bg-slate-50/50 dark:bg-stone-800/40 p-3.5 rounded-2xl border border-slate-100 dark:border-stone-800">
                                        <Label htmlFor="phone" className="text-xs font-bold text-slate-700 dark:text-slate-300">Phone Number</Label>
                                        <div className="flex items-center gap-2 mt-1">
                                            {editingField === 'phone' ? (
                                                <>
                                                    <Input id="phone" value={tempValue} onChange={(e) => setTempValue(e.target.value)} className="flex-1 text-xs" />
                                                    <Button size="sm" onClick={() => handleInlineSave('phone')} disabled={loading.saving} className="bg-navy text-white rounded-xl">
                                                        {loading.saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                                                    </Button>
                                                    <Button variant="outline" size="sm" onClick={handleCancelEdit} className="rounded-xl"><X className="h-3.5 w-3.5" /></Button>
                                                </>
                                            ) : (
                                                <>
                                                    <Input id="phone" value={userData?.phone || ''} placeholder="Add phone number" readOnly className="flex-1 text-xs bg-white dark:bg-stone-900 font-semibold" />
                                                    <Button variant="ghost" size="sm" onClick={() => handleInlineEdit('phone', userData?.phone)} className="rounded-xl text-slate-500 hover:text-navy">
                                                        <Edit className="h-3.5 w-3.5" />
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Date of Birth Field */}
                                    <div className="space-y-1.5 bg-slate-50/50 dark:bg-stone-800/40 p-3.5 rounded-2xl border border-slate-100 dark:border-stone-800">
                                        <Label htmlFor="dateOfBirth" className="text-xs font-bold text-slate-700 dark:text-slate-300">Date of Birth</Label>
                                        <div className="flex items-center gap-2 mt-1">
                                            {editingField === 'dateOfBirth' ? (
                                                <>
                                                    <Input id="dateOfBirth" type="date" value={tempValue} onChange={(e) => setTempValue(e.target.value)} className="flex-1 text-xs" />
                                                    <Button size="sm" onClick={() => handleInlineSave('dateOfBirth')} disabled={loading.saving} className="bg-navy text-white rounded-xl">
                                                        {loading.saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                                                    </Button>
                                                    <Button variant="outline" size="sm" onClick={handleCancelEdit} className="rounded-xl"><X className="h-3.5 w-3.5" /></Button>
                                                </>
                                            ) : (
                                                <>
                                                    <Input id="dateOfBirth" type="text" value={formatDate(userData?.dateOfBirth)} readOnly className="flex-1 text-xs bg-white dark:bg-stone-900 font-semibold" />
                                                    <Button variant="ghost" size="sm" onClick={() => handleInlineEdit('dateOfBirth', userData?.dateOfBirth || '')} className="rounded-xl text-slate-500 hover:text-navy">
                                                        <Edit className="h-3.5 w-3.5" />
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Gender Field */}
                                    <div className="space-y-1.5 bg-slate-50/50 dark:bg-stone-800/40 p-3.5 rounded-2xl border border-slate-100 dark:border-stone-800">
                                        <Label htmlFor="gender" className="text-xs font-bold text-slate-700 dark:text-slate-300">Gender</Label>
                                        <div className="flex items-center gap-2 mt-1">
                                            {editingField === 'gender' ? (
                                                <>
                                                    <Select value={tempValue} onValueChange={setTempValue}>
                                                        <SelectTrigger className="flex-1 text-xs"> <SelectValue placeholder="Select gender" /> </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="male">Male</SelectItem>
                                                            <SelectItem value="female">Female</SelectItem>
                                                            <SelectItem value="other">Other</SelectItem>
                                                            <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <Button size="sm" onClick={() => handleInlineSave('gender')} disabled={loading.saving} className="bg-navy text-white rounded-xl">
                                                        {loading.saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                                                    </Button>
                                                    <Button variant="outline" size="sm" onClick={handleCancelEdit} className="rounded-xl"><X className="h-3.5 w-3.5" /></Button>
                                                </>
                                            ) : (
                                                <>
                                                    <Input id="gender" value={userData?.gender ? userData.gender.charAt(0).toUpperCase() + userData.gender.slice(1) : "Not set"} readOnly className="flex-1 text-xs bg-white dark:bg-stone-900 font-semibold" />
                                                    <Button variant="ghost" size="sm" onClick={() => handleInlineEdit('gender', userData?.gender || '')} className="rounded-xl text-slate-500 hover:text-navy">
                                                        <Edit className="h-3.5 w-3.5" />
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Bio Field */}
                                    <div className="space-y-1.5 bg-slate-50/50 dark:bg-stone-800/40 p-3.5 rounded-2xl border border-slate-100 dark:border-stone-800 md:col-span-2">
                                        <Label htmlFor="bio" className="text-xs font-bold text-slate-700 dark:text-slate-300">About / Bio</Label>
                                        <div className="flex items-start gap-2 mt-1">
                                            {editingField === 'bio' ? (
                                                <>
                                                    <Textarea id="bio" value={tempValue} onChange={(e) => setTempValue(e.target.value)} placeholder="Tell us a little about yourself..." className="flex-1 min-h-[80px] text-xs" />
                                                    <div className="flex flex-col gap-2">
                                                        <Button size="sm" onClick={() => handleInlineSave('bio')} disabled={loading.saving} className="bg-navy text-white rounded-xl">
                                                            {loading.saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                                                        </Button>
                                                        <Button variant="outline" size="sm" onClick={handleCancelEdit} className="rounded-xl"><X className="h-3.5 w-3.5" /></Button>
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <Textarea id="bio" value={userData?.bio || "No bio added yet..."} readOnly className="flex-1 min-h-[80px] text-xs bg-white dark:bg-stone-900 font-medium" />
                                                    <Button variant="ghost" size="sm" onClick={() => handleInlineEdit('bio', userData?.bio || '')} className="rounded-xl text-slate-500 hover:text-navy">
                                                        <Edit className="h-3.5 w-3.5" />
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* ═══════════════════════════════════════════════ */}
                    {/* TAB 2: MY ORDERS */}
                    {/* ═══════════════════════════════════════════════ */}
                    <TabsContent value="orders" className="space-y-6 text-left">
                        <Card className="border border-slate-200 dark:border-stone-800 shadow-sm rounded-3xl bg-white dark:bg-stone-900 overflow-hidden">
                            <CardHeader className="p-4 sm:p-6 border-b border-slate-100 dark:border-stone-800 bg-slate-50/50 dark:bg-stone-900/50">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-base sm:text-lg font-extrabold text-navy dark:text-white">Order History</CardTitle>
                                        <p className="text-xs text-slate-500 mt-0.5">Track your deliveries, receipts, and order status updates.</p>
                                    </div>
                                    <Button onClick={fetchOrders} variant="outline" size="sm" disabled={loading.orders} className="rounded-xl text-xs font-bold">
                                        {loading.orders ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : "Refresh"}
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="p-4 sm:p-6">
                                {loading.orders ? (
                                    <div className="flex flex-col justify-center items-center h-48 gap-3">
                                        <Loader2 className="h-8 w-8 animate-spin text-navy dark:text-amber-400" />
                                        <p className="text-xs text-slate-400">Fetching order history...</p>
                                    </div>
                                ) : orders.length === 0 ? (
                                    <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-stone-800 rounded-3xl">
                                        <Package className="h-12 w-12 mx-auto mb-3 text-slate-300 dark:text-stone-700" />
                                        <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">No orders placed yet</h4>
                                        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">Explore our grocery, fashion, and electronics collection to get started!</p>
                                        <Button onClick={() => navigate("/products")} className="mt-4 bg-navy hover:bg-navy/90 text-white font-bold text-xs py-2.5 px-6 rounded-xl">
                                            Start Shopping
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {orders.map((order) => (
                                            <div
                                                key={order._id}
                                                className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 border border-slate-100 dark:border-stone-800 rounded-2xl hover:border-amber-400/40 hover:shadow-md transition bg-slate-50/40 dark:bg-stone-800/30"
                                            >
                                                <div className="flex items-center gap-3.5 min-w-0">
                                                    {order.orderItems?.[0]?.image ? (
                                                        <div className="w-16 h-16 bg-white rounded-xl flex-shrink-0 overflow-hidden border border-slate-100 dark:border-stone-700">
                                                            <img
                                                                src={order.orderItems[0].image.startsWith('http') ? order.orderItems[0].image : `${API_BASE_URL}${order.orderItems[0].image}`}
                                                                alt={order.orderItems[0].name}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        </div>
                                                    ) : (
                                                        <div className="w-16 h-16 bg-indigo-50 dark:bg-stone-800 rounded-xl flex items-center justify-center text-indigo-600 dark:text-amber-400 shrink-0">
                                                            <Package className="w-7 h-7" />
                                                        </div>
                                                    )}
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <h3 className="font-extrabold text-sm text-navy dark:text-white">Order #{order.orderNumber}</h3>
                                                            {getOrderStatusBadge(order.orderStatus?.currentStatus)}
                                                        </div>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                                            Placed on {formatDate(order.createdAt)} • {order.orderSummary?.itemsCount || order.orderItems?.length || 0} items
                                                        </p>
                                                        <p className="text-xs font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                                                            {formatCurrency(order.orderSummary?.total || 0)}
                                                        </p>
                                                    </div>
                                                </div>

                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="gap-2 text-xs font-bold rounded-xl w-full sm:w-auto border-slate-200 dark:border-stone-700"
                                                    onClick={() => handleViewOrderDetails(order)}
                                                >
                                                    View Details <ChevronRight className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* ═══════════════════════════════════════════════ */}
                    {/* TAB 3: ADDRESSES */}
                    {/* ═══════════════════════════════════════════════ */}
                    <TabsContent value="addresses" className="space-y-6 text-left">
                        <Card className="border border-slate-200 dark:border-stone-800 shadow-sm rounded-3xl bg-white dark:bg-stone-900 overflow-hidden">
                            <CardHeader className="p-4 sm:p-6 border-b border-slate-100 dark:border-stone-800 bg-slate-50/50 dark:bg-stone-900/50">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                    <div>
                                        <CardTitle className="text-base sm:text-lg font-extrabold text-navy dark:text-white">Saved Delivery Addresses</CardTitle>
                                        <p className="text-xs text-slate-500 mt-0.5">Manage your home, office, and family delivery locations.</p>
                                    </div>
                                    <Button className="bg-navy hover:bg-navy/90 text-white gap-2 font-bold text-xs rounded-xl py-2 px-4" onClick={handleAddAddress}>
                                        <Plus className="h-4 w-4" /> Add New Address
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="p-4 sm:p-6">
                                {loading.addresses ? (
                                    <div className="flex flex-col justify-center items-center h-48 gap-3">
                                        <Loader2 className="h-8 w-8 animate-spin text-navy dark:text-amber-400" />
                                        <p className="text-xs text-slate-400">Loading saved addresses...</p>
                                    </div>
                                ) : addresses.length === 0 ? (
                                    <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-stone-800 rounded-3xl">
                                        <MapPin className="h-12 w-12 mx-auto mb-3 text-slate-300 dark:text-stone-700" />
                                        <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">No saved addresses</h4>
                                        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">Add an address for lightning-fast checkout and doorstep delivery.</p>
                                        <Button className="mt-4 bg-navy hover:bg-navy/90 text-white font-bold text-xs py-2.5 px-6 rounded-xl" onClick={handleAddAddress}>
                                            Add Your First Address
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {addresses.map((address) => (
                                            <div
                                                key={address._id || address.id}
                                                className={`p-4 sm:p-5 border rounded-2xl transition-all relative ${address.isDefault
                                                    ? 'border-amber-400 bg-amber-50/20 dark:bg-amber-950/10 shadow-sm'
                                                    : 'border-slate-200 dark:border-stone-800 bg-white dark:bg-stone-900'
                                                    }`}
                                            >
                                                <div className="flex justify-between items-start mb-3">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <Badge className={
                                                            address.type === 'home' ? 'bg-emerald-600 text-white font-bold text-[10px]' :
                                                                address.type === 'office' ? 'bg-indigo-600 text-white font-bold text-[10px]' :
                                                                    address.type === 'parents' ? 'bg-purple-600 text-white font-bold text-[10px]' :
                                                                        'bg-slate-600 text-white font-bold text-[10px]'
                                                        }>
                                                            {(address.type || 'HOME').toUpperCase()}
                                                        </Badge>
                                                        {address.isDefault && (
                                                            <Badge className="bg-amber-400 text-slate-950 font-black text-[10px]">
                                                                DEFAULT
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        {!address.isDefault && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleSetDefaultAddress(address._id || address.id)}
                                                                disabled={loading.saving}
                                                                className="text-[11px] font-bold text-amber-600 hover:text-amber-700 h-7 px-2 rounded-lg"
                                                            >
                                                                Set Default
                                                            </Button>
                                                        )}
                                                        <Button variant="ghost" size="sm" onClick={() => handleEditAddress(address)} className="h-7 w-7 p-0 rounded-lg text-slate-500 hover:text-navy">
                                                            <Edit className="h-3.5 w-3.5" />
                                                        </Button>
                                                        <Button variant="ghost" size="sm" onClick={() => handleDeleteAddress(address._id || address.id)} disabled={loading.saving} className="h-7 w-7 p-0 rounded-lg text-rose-500 hover:text-rose-700">
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </div>
                                                </div>
                                                <h4 className="font-black text-sm text-navy dark:text-white">{address.name}</h4>
                                                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">{address.address}</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                                                    {address.city}, {address.state} - <strong className="font-mono">{address.pincode}</strong>
                                                </p>
                                                <p className="text-xs text-slate-600 dark:text-slate-300 font-semibold mt-2">
                                                    📞 {address.phone}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* ═══════════════════════════════════════════════ */}
                    {/* TAB 4: REFERRALS & REWARDS */}
                    {/* ═══════════════════════════════════════════════ */}
                    <TabsContent value="referrals" className="space-y-6 text-left">
                        <Card className="border border-slate-200 dark:border-stone-800 shadow-sm rounded-3xl bg-white dark:bg-stone-900 overflow-hidden">
                            <CardHeader className="p-4 sm:p-6 border-b border-slate-100 dark:border-stone-800 bg-slate-50/50 dark:bg-stone-900/50">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-base sm:text-lg font-extrabold text-navy dark:text-white">Refer &amp; Earn Program</CardTitle>
                                        <p className="text-xs text-slate-500 mt-0.5">Invite friends to ApexBee and get instant wallet cashback bonuses.</p>
                                    </div>
                                    <Button onClick={() => navigate("/referrals")} className="bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs py-2 px-4 rounded-xl shadow-xs">
                                        Affiliate Dashboard →
                                    </Button>
                                </div>
                            </CardHeader>

                            {loading.referrals ? (
                                <CardContent className="p-12">
                                    <div className="flex flex-col justify-center items-center min-h-48 gap-3">
                                        <Loader2 className="h-8 w-8 animate-spin text-navy dark:text-amber-400" />
                                        <p className="text-xs text-slate-400">Loading referral statistics...</p>
                                    </div>
                                </CardContent>
                            ) : (
                                <CardContent className="p-4 sm:p-6 space-y-6">
                                    {/* Hero Banner */}
                                    <div className="bg-gradient-to-r from-[#0A1128] via-[#101b42] to-slate-950 rounded-2xl p-6 text-white text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6 border border-white/10 shadow-md">
                                        <div>
                                            <span className="text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 px-2.5 py-0.5 rounded-full shadow-xs">
                                                Instant Cashback
                                            </span>
                                            <h2 className="text-xl sm:text-2xl font-black mt-2">Earn ₹50 per Qualified Referral</h2>
                                            <p className="text-xs text-slate-300 mt-1 max-w-md">
                                                Share your code with friends. When they register and place their first order, rewards credit to your wallet automatically.
                                            </p>
                                        </div>
                                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 text-center shrink-0">
                                            <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider block">Wallet Balance</span>
                                            <strong className="text-2xl font-black text-white block mt-0.5">₹{referralStats.walletBalance || 0}</strong>
                                        </div>
                                    </div>

                                    {/* Referral Code & Share Link Card */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="bg-slate-50 dark:bg-stone-800/50 p-4 rounded-2xl border border-slate-200 dark:border-stone-800 space-y-2">
                                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Your Unique Referral Code</label>
                                            <div className="flex gap-2">
                                                <div className="flex-1 bg-white dark:bg-stone-900 rounded-xl p-2.5 font-mono text-base font-black text-navy dark:text-amber-400 text-center border border-slate-200 dark:border-stone-700">
                                                    {referralCode || userData?.referralCode || "AB7K9P2"}
                                                </div>
                                                <Button
                                                    onClick={() => copyToClipboard(referralCode || userData?.referralCode || "AB7K9P2", 'code')}
                                                    className="bg-navy text-white hover:bg-navy/90 text-xs font-bold rounded-xl px-4"
                                                    disabled={copyLoading}
                                                >
                                                    {copyLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><Copy className="h-3.5 w-3.5 mr-1" /> Copy</>}
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="bg-slate-50 dark:bg-stone-800/50 p-4 rounded-2xl border border-slate-200 dark:border-stone-800 space-y-2">
                                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Direct Invite Link</label>
                                            <div className="flex gap-2">
                                                <div className="flex-1 bg-white dark:bg-stone-900 rounded-xl p-2.5 text-xs text-slate-600 dark:text-slate-300 truncate border border-slate-200 dark:border-stone-700 font-mono">
                                                    {referralLink || `${window.location.origin}/register?ref=${referralCode || userData?.referralCode || "AB7K9P2"}`}
                                                </div>
                                                <Button
                                                    onClick={shareReferral}
                                                    variant="outline"
                                                    className="border-amber-400 text-slate-950 bg-amber-400 hover:bg-amber-300 text-xs font-black rounded-xl px-4"
                                                    disabled={copyLoading}
                                                >
                                                    <Share2 className="h-3.5 w-3.5 mr-1" /> Share
                                                </Button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 3-Step Guide */}
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                                        <div className="p-4 rounded-2xl border border-slate-100 dark:border-stone-800 bg-slate-50/50 dark:bg-stone-800/30 text-center">
                                            <div className="w-8 h-8 rounded-full bg-amber-400 text-slate-950 font-black flex items-center justify-center mx-auto mb-2 text-xs">1</div>
                                            <h4 className="font-bold text-xs text-navy dark:text-white">Share Your Link</h4>
                                            <p className="text-[11px] text-slate-500 mt-1">Send your invite link via WhatsApp, SMS, or Social Media.</p>
                                        </div>
                                        <div className="p-4 rounded-2xl border border-slate-100 dark:border-stone-800 bg-slate-50/50 dark:bg-stone-800/30 text-center">
                                            <div className="w-8 h-8 rounded-full bg-amber-400 text-slate-950 font-black flex items-center justify-center mx-auto mb-2 text-xs">2</div>
                                            <h4 className="font-bold text-xs text-navy dark:text-white">Friend Registers &amp; Shops</h4>
                                            <p className="text-[11px] text-slate-500 mt-1">They sign up with your referral tag and complete first purchase.</p>
                                        </div>
                                        <div className="p-4 rounded-2xl border border-slate-100 dark:border-stone-800 bg-slate-50/50 dark:bg-stone-800/30 text-center">
                                            <div className="w-8 h-8 rounded-full bg-amber-400 text-slate-950 font-black flex items-center justify-center mx-auto mb-2 text-xs">3</div>
                                            <h4 className="font-bold text-xs text-navy dark:text-white">Instant Commission</h4>
                                            <p className="text-[11px] text-slate-500 mt-1">Enjoy cash bonuses and multi-tier network commissions.</p>
                                        </div>
                                    </div>
                                </CardContent>
                            )}
                        </Card>
                    </TabsContent>

                    {/* ═══════════════════════════════════════════════ */}
                    {/* TAB 5: SETTINGS & SECURITY */}
                    {/* ═══════════════════════════════════════════════ */}
                    <TabsContent value="settings" className="space-y-6 text-left">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Saved Payment Methods */}
                            <Card className="border border-slate-200 dark:border-stone-800 shadow-sm rounded-3xl bg-white dark:bg-stone-900 overflow-hidden">
                                <CardHeader className="p-4 sm:p-6 border-b border-slate-100 dark:border-stone-800 bg-slate-50/50 dark:bg-stone-900/50">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-sm sm:text-base font-extrabold text-navy dark:text-white flex items-center gap-2">
                                            <CreditCard className="h-4 w-4 text-blue-500" /> Saved Payment Methods ({savedCards.length})
                                        </CardTitle>
                                        <Button size="sm" variant="outline" onClick={() => setShowAddCardModal(true)} className="rounded-xl text-xs font-bold">
                                            <Plus className="h-3.5 w-3.5 mr-1" /> Add Card
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-4 sm:p-6">
                                    {savedCards.length === 0 ? (
                                        <div className="text-center py-8 border border-dashed rounded-2xl bg-slate-50/50 dark:bg-stone-800/30 space-y-2">
                                            <span className="text-2xl block">💳</span>
                                            <p className="font-bold text-xs text-slate-700 dark:text-slate-300">No saved payment methods</p>
                                            <p className="text-[11px] text-slate-400">Save cards securely for one-click checkout.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {savedCards.map((card, i) => (
                                                <div key={card.id || i} className="flex items-center justify-between border border-slate-100 dark:border-stone-800 rounded-2xl p-3.5 bg-slate-50/30 dark:bg-stone-800/40">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-12 h-8 bg-gradient-to-br from-navy to-blue-700 rounded-lg flex items-center justify-center text-white text-[10px] font-black tracking-wider">
                                                            {card.type || "CARD"}
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-bold text-slate-900 dark:text-white font-mono">•••• •••• •••• {card.last4}</p>
                                                            <p className="text-[10px] text-slate-400">Expires {card.expiry}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {card.isDefault && <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50 text-[9px] font-bold">Default</Badge>}
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleDeleteCard(card.id || i)}
                                                            className="text-rose-500 hover:text-rose-700 h-7 w-7 p-0 rounded-lg cursor-pointer"
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Preferences & Privacy */}
                            <Card className="border border-slate-200 dark:border-stone-800 shadow-sm rounded-3xl bg-white dark:bg-stone-900 overflow-hidden">
                                <CardHeader className="p-4 sm:p-6 border-b border-slate-100 dark:border-stone-800 bg-slate-50/50 dark:bg-stone-900/50">
                                    <CardTitle className="text-sm sm:text-base font-extrabold text-navy dark:text-white flex items-center gap-2">
                                        <Shield className="h-4 w-4 text-emerald-500" /> Security &amp; Compliance
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 sm:p-6 space-y-3">
                                    <button
                                        onClick={() => navigate("/privacy-policy")}
                                        className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-stone-800 hover:bg-slate-50 dark:hover:bg-stone-800 transition-colors cursor-pointer text-left"
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <FileText className="h-4 w-4 text-amber-500" />
                                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Privacy Policy</span>
                                        </div>
                                        <ChevronRight className="h-4 w-4 text-slate-400" />
                                    </button>

                                    <button
                                        onClick={() => navigate("/terms-conditions")}
                                        className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-stone-800 hover:bg-slate-50 dark:hover:bg-stone-800 transition-colors cursor-pointer text-left"
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <FileText className="h-4 w-4 text-amber-500" />
                                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Terms of Service</span>
                                        </div>
                                        <ChevronRight className="h-4 w-4 text-slate-400" />
                                    </button>

                                    <div className="border-t border-slate-100 dark:border-stone-800 pt-3 mt-3">
                                        <Button
                                            variant="outline"
                                            className="w-full border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold rounded-xl"
                                            onClick={() => {
                                                if (window.confirm("Are you sure you want to delete your account? This action is irreversible and all your data will be permanently removed.")) {
                                                    alert("Account deletion request submitted. You will receive a confirmation email within 24 hours.");
                                                }
                                            }}
                                        >
                                            <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Request Account Deletion
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>

            {/* ═══════════════════════════════════════════════ */}
            {/* MODAL: FULL PROFILE EDIT */}
            {/* ═══════════════════════════════════════════════ */}
            <Dialog open={showEditProfile} onOpenChange={setShowEditProfile}>
                <DialogContent className="w-[92vw] sm:max-w-2xl rounded-3xl bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 p-4 sm:p-6 text-left">
                    <DialogHeader>
                        <DialogTitle className="text-base sm:text-lg font-black text-navy dark:text-white">Edit Profile Details</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="edit-name" className="text-xs font-bold text-slate-700 dark:text-slate-300">Full Name</Label>
                                <Input id="edit-name" value={editFormData.name} onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))} className="text-xs rounded-xl" />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="edit-email" className="text-xs font-bold text-slate-700 dark:text-slate-300">Email Address</Label>
                                <Input id="edit-email" type="email" value={editFormData.email} disabled className="opacity-70 text-xs rounded-xl" />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="edit-phone" className="text-xs font-bold text-slate-700 dark:text-slate-300">Phone Number</Label>
                                <Input id="edit-phone" value={editFormData.phone} onChange={(e) => setEditFormData(prev => ({ ...prev, phone: e.target.value }))} className="text-xs rounded-xl" />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="edit-dob" className="text-xs font-bold text-slate-700 dark:text-slate-300">Date of Birth</Label>
                                <Input id="edit-dob" type="date" value={editFormData.dateOfBirth} onChange={(e) => setEditFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))} className="text-xs rounded-xl" />
                            </div>
                            <div className="space-y-1.5 md:col-span-2">
                                <Label htmlFor="edit-gender" className="text-xs font-bold text-slate-700 dark:text-slate-300">Gender</Label>
                                <Select value={editFormData.gender} onValueChange={(value) => setEditFormData(prev => ({ ...prev, gender: value }))}>
                                    <SelectTrigger className="text-xs rounded-xl"> <SelectValue placeholder="Select gender" /> </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="male">Male</SelectItem>
                                        <SelectItem value="female">Female</SelectItem>
                                        <SelectItem value="other">Other</SelectItem>
                                        <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="edit-bio" className="text-xs font-bold text-slate-700 dark:text-slate-300">Bio / About Me</Label>
                            <Textarea id="edit-bio" value={editFormData.bio} onChange={(e) => setEditFormData(prev => ({ ...prev, bio: e.target.value }))} placeholder="Tell us a little about yourself..." rows={3} className="text-xs rounded-xl" />
                        </div>
                        <div className="flex justify-end gap-2.5 pt-4">
                            <Button variant="outline" onClick={() => setShowEditProfile(false)} disabled={loading.saving} className="rounded-xl text-xs font-bold">
                                Cancel
                            </Button>
                            <Button className="bg-navy hover:bg-navy/90 text-white font-bold text-xs py-2 px-5 rounded-xl" onClick={handleSaveProfile} disabled={loading.saving}>
                                {loading.saving ? (<><Loader2 className="h-3.5 w-3.5 animate-spin mr-2" /> Saving...</>) : ("Save Changes")}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* ═══════════════════════════════════════════════ */}
            {/* MODAL: ADD / EDIT ADDRESS */}
            {/* ═══════════════════════════════════════════════ */}
            <Dialog open={showAddAddress} onOpenChange={setShowAddAddress}>
                <DialogContent className="w-[92vw] sm:max-w-2xl rounded-3xl bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 p-4 sm:p-6 text-left">
                    <DialogHeader>
                        <DialogTitle className="text-base sm:text-lg font-black text-navy dark:text-white">{editingAddress ? 'Edit Address' : 'Add New Delivery Address'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-2">
                        {/* Mock Map Pin Drag */}
                        <div className="p-3 border border-slate-100 dark:border-stone-800 bg-slate-50 dark:bg-stone-800/40 rounded-2xl space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-navy dark:text-white">📍 Auto GPS Location</span>
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    className="text-[10px] h-7 px-2.5 font-bold text-amber-700 border-amber-400 bg-amber-50 hover:bg-amber-400 hover:text-slate-950 rounded-xl"
                                    onClick={() => {
                                        setAddressFormData(prev => ({
                                            ...prev,
                                            address: "Ward No. 8, Buchireddypalem",
                                            city: "Buchireddypalem",
                                            state: "Andhra Pradesh",
                                            pincode: "524305"
                                        }));
                                        toast({ title: "GPS Detected", description: "Buchireddypalem, Andhra Pradesh (524305)" });
                                    }}
                                >
                                    🛰️ Auto GPS Fill
                                </Button>
                            </div>
                            <div className="h-20 bg-blue-50/60 dark:bg-stone-800 rounded-xl relative overflow-hidden flex items-center justify-center border border-blue-200/60 dark:border-stone-700">
                                <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#ccc_1px,transparent_1px)] [background-size:14px_14px]" />
                                <div className="w-3.5 h-3.5 bg-red-500 rounded-full animate-ping absolute" />
                                <span className="text-2xl z-10 animate-bounce">📍</span>
                                <span className="absolute bottom-1 right-2 text-[8px] bg-navy/80 text-white px-1.5 py-0.5 rounded font-mono">GPS Ready</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="address-name" className="text-xs font-bold text-slate-700 dark:text-slate-300">Recipient Name</Label>
                                <Input id="address-name" value={addressFormData.name} onChange={(e) => setAddressFormData(prev => ({ ...prev, name: e.target.value }))} placeholder="Enter full name" className="text-xs rounded-xl" />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="address-phone" className="text-xs font-bold text-slate-700 dark:text-slate-300">Phone Number</Label>
                                <Input id="address-phone" value={addressFormData.phone} onChange={(e) => setAddressFormData(prev => ({ ...prev, phone: e.target.value }))} placeholder="10-digit mobile number" className="text-xs rounded-xl" />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="address-type" className="text-xs font-bold text-slate-700 dark:text-slate-300">Address Category</Label>
                                <Select value={addressFormData.type} onValueChange={(value) => setAddressFormData(prev => ({ ...prev, type: value }))}>
                                    <SelectTrigger className="text-xs rounded-xl"> <SelectValue placeholder="Select type" /> </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="home">Home (All Day Delivery)</SelectItem>
                                        <SelectItem value="office">Office (10 AM - 6 PM)</SelectItem>
                                        <SelectItem value="parents">Parents / Family</SelectItem>
                                        <SelectItem value="other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="address-pincode" className="text-xs font-bold text-slate-700 dark:text-slate-300">Pincode</Label>
                                <Input id="address-pincode" value={addressFormData.pincode} onChange={(e) => setAddressFormData(prev => ({ ...prev, pincode: e.target.value }))} placeholder="6-digit pincode" className="text-xs rounded-xl" />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="address-street" className="text-xs font-bold text-slate-700 dark:text-slate-300">Flat / House No. / Building / Street</Label>
                            <Textarea id="address-street" value={addressFormData.address} onChange={(e) => setAddressFormData(prev => ({ ...prev, address: e.target.value }))} placeholder="Enter complete door address" rows={2} className="text-xs rounded-xl" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="address-city" className="text-xs font-bold text-slate-700 dark:text-slate-300">City / District</Label>
                                <Input id="address-city" value={addressFormData.city} onChange={(e) => setAddressFormData(prev => ({ ...prev, city: e.target.value }))} placeholder="City name" className="text-xs rounded-xl" />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="address-state" className="text-xs font-bold text-slate-700 dark:text-slate-300">State</Label>
                                <Input id="address-state" value={addressFormData.state} onChange={(e) => setAddressFormData(prev => ({ ...prev, state: e.target.value }))} placeholder="State name" className="text-xs rounded-xl" />
                            </div>
                        </div>

                        <div className="flex items-center space-x-2 pt-1">
                            <input type="checkbox" id="default-address" checked={addressFormData.isDefault} onChange={(e) => setAddressFormData(prev => ({ ...prev, isDefault: e.target.checked }))} className="rounded border-gray-300 h-4 w-4 text-navy cursor-pointer" />
                            <Label htmlFor="default-address" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                                Set as default delivery address
                            </Label>
                        </div>

                        <DialogFooter className="pt-2">
                            <div className="flex justify-end gap-2.5 w-full">
                                <Button variant="outline" onClick={() => setShowAddAddress(false)} disabled={loading.saving} className="rounded-xl text-xs font-bold">
                                    Cancel
                                </Button>
                                <Button className="bg-navy hover:bg-navy/90 text-white font-bold text-xs py-2 px-5 rounded-xl" onClick={handleSaveAddress} disabled={loading.saving}>
                                    {loading.saving ? (<><Loader2 className="h-3.5 w-3.5 animate-spin mr-2" /> Saving...</>) : (editingAddress ? "Update Address" : "Save Address")}
                                </Button>
                            </div>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>

            {/* ═══════════════════════════════════════════════ */}
            {/* MODAL: ORDER DETAILS & STATUS TRACKING */}
            {/* ═══════════════════════════════════════════════ */}
            <Dialog open={showOrderDetails} onOpenChange={setShowOrderDetails}>
                <DialogContent className="w-[92vw] sm:max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 p-4 sm:p-6 text-left">
                    <DialogHeader>
                        <DialogTitle className="flex items-center justify-between text-base sm:text-lg font-black text-navy dark:text-white">
                            <span>Order #{selectedOrder?.orderNumber}</span>
                            <Button variant="ghost" size="icon" onClick={() => setShowOrderDetails(false)} className="rounded-full">
                                <X className="h-4 w-4" />
                            </Button>
                        </DialogTitle>
                    </DialogHeader>

                    {selectedOrder && (
                        <div className="space-y-6 pt-2">
                            {/* Order Status Timeline */}
                            <div className="bg-blue-50/70 dark:bg-stone-800/50 p-4 rounded-2xl border border-blue-100 dark:border-stone-800">
                                <h3 className="font-extrabold text-sm mb-3 flex items-center gap-2 text-navy dark:text-white">
                                    <Package className="h-4 w-4 text-indigo-500" /> Order Tracking Timeline
                                </h3>
                                <div className="space-y-3">
                                    {selectedOrder.orderStatus?.timeline?.map((timeline: any, index: number) => (
                                        <div key={timeline._id || index} className="flex items-start gap-3">
                                            <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${index === selectedOrder.orderStatus.timeline.length - 1 ? 'bg-emerald-500 ring-4 ring-emerald-100' : 'bg-indigo-400'}`} />
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-xs capitalize text-slate-800 dark:text-slate-200">{timeline.status}</p>
                                                <p className="text-[11px] text-slate-500">{timeline.description}</p>
                                                <p className="text-[10px] text-slate-400 font-mono mt-0.5">{formatDateTime(timeline.timestamp)}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Order Items */}
                            <div>
                                <h3 className="font-extrabold text-sm mb-3 text-navy dark:text-white">Purchased Items</h3>
                                <div className="space-y-3">
                                    {selectedOrder.orderItems?.map((item: any) => (
                                        <div key={item._id} className="flex gap-3.5 p-3 border border-slate-100 dark:border-stone-800 rounded-2xl bg-slate-50/30 dark:bg-stone-800/30 items-center">
                                            <div className="w-14 h-14 bg-white dark:bg-stone-800 rounded-xl flex-shrink-0 overflow-hidden border border-slate-100 dark:border-stone-700">
                                                <img
                                                    src={item.image.startsWith('http') ? item.image : `${API_BASE_URL}${item.image}`}
                                                    alt={item.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate">{item.name}</h4>
                                                <div className="flex flex-wrap gap-2 text-[11px] text-slate-500 mt-0.5">
                                                    <span>Qty: {item.quantity}</span>
                                                    {item.color && item.color !== 'default' && (<span>• Color: {item.color}</span>)}
                                                    {item.size && item.size !== 'One Size' && (<span>• Size: {item.size}</span>)}
                                                </div>
                                                <div className="flex items-center justify-between mt-1">
                                                    <span className="font-black text-xs text-slate-900 dark:text-amber-300">{formatCurrency(item.price)}</span>
                                                    <span className="font-black text-xs text-emerald-600 dark:text-emerald-400">{formatCurrency(item.itemTotal)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Shipping & Payment Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 border border-slate-100 dark:border-stone-800 rounded-2xl bg-white dark:bg-stone-800/40">
                                    <h4 className="font-bold text-xs mb-2 flex items-center gap-1.5 text-navy dark:text-white">
                                        <MapPin className="h-3.5 w-3.5 text-rose-500" /> Delivery Address
                                    </h4>
                                    <p className="font-bold text-xs text-slate-800 dark:text-slate-200">{selectedOrder.shippingAddress?.name}</p>
                                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{selectedOrder.shippingAddress?.address}</p>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state} - {selectedOrder.shippingAddress?.pincode}
                                    </p>
                                    <p className="text-xs text-slate-600 dark:text-slate-300 font-semibold mt-1">📞 {selectedOrder.shippingAddress?.phone}</p>
                                </div>

                                <div className="p-4 border border-slate-100 dark:border-stone-800 rounded-2xl bg-white dark:bg-stone-800/40">
                                    <h4 className="font-bold text-xs mb-2 flex items-center gap-1.5 text-navy dark:text-white">
                                        <CreditCard className="h-3.5 w-3.5 text-indigo-500" /> Payment &amp; Method
                                    </h4>
                                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Method: {getPaymentMethodLabel(selectedOrder.paymentDetails?.method)}</p>
                                    <p className="text-xs text-slate-500 mt-0.5">Payment Status: <strong className="uppercase text-emerald-600 font-black">{selectedOrder.paymentDetails?.status}</strong></p>
                                    <p className="text-xs text-slate-500 mt-0.5">Expected Delivery: {formatDate(selectedOrder.deliveryDetails?.expectedDelivery)}</p>
                                </div>
                            </div>

                            {/* Price Summary */}
                            <div className="bg-slate-50 dark:bg-stone-800/60 p-4 rounded-2xl border border-slate-200 dark:border-stone-800 space-y-2 text-xs">
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Subtotal ({selectedOrder.orderSummary?.itemsCount} items):</span>
                                    <span className="font-bold text-slate-800 dark:text-slate-200">{formatCurrency(selectedOrder.orderSummary?.subtotal)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Shipping Charges:</span>
                                    <span className={selectedOrder.orderSummary?.shipping === 0 ? 'text-emerald-600 font-bold' : 'font-bold'}>
                                        {selectedOrder.orderSummary?.shipping === 0 ? 'FREE' : formatCurrency(selectedOrder.orderSummary?.shipping)}
                                    </span>
                                </div>
                                {selectedOrder.orderSummary?.discount > 0 && (
                                    <div className="flex justify-between text-emerald-600 font-bold">
                                        <span>Discount Savings:</span>
                                        <span>-{formatCurrency(selectedOrder.orderSummary?.discount)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between border-t border-slate-200 dark:border-stone-700 pt-2 font-black text-sm text-navy dark:text-amber-400">
                                    <span>Grand Total Paid:</span>
                                    <span>{formatCurrency(selectedOrder.orderSummary?.total)}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* ═══════════════════════════════════════════════ */}
            {/* MODAL: ADD PAYMENT CARD */}
            {/* ═══════════════════════════════════════════════ */}
            <Dialog open={showAddCardModal} onOpenChange={setShowAddCardModal}>
                <DialogContent className="w-[92vw] sm:max-w-md rounded-3xl bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 p-4 sm:p-6 text-left">
                    <DialogHeader>
                        <DialogTitle className="text-base sm:text-lg font-black text-navy dark:text-white">Save Payment Method</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddCard} className="space-y-4 pt-2">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Card Network</Label>
                            <Select value={newCardData.cardType} onValueChange={(val) => setNewCardData(prev => ({ ...prev, cardType: val }))}>
                                <SelectTrigger className="text-xs rounded-xl"> <SelectValue placeholder="Select Card Type" /> </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="VISA">VISA</SelectItem>
                                    <SelectItem value="Mastercard">Mastercard</SelectItem>
                                    <SelectItem value="RuPay">RuPay</SelectItem>
                                    <SelectItem value="Amex">American Express</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Card Number (Last 4 Digits)</Label>
                            <Input
                                type="text"
                                maxLength={4}
                                placeholder="e.g. 4242"
                                value={newCardData.last4}
                                onChange={(e) => setNewCardData(prev => ({ ...prev, last4: e.target.value }))}
                                className="text-xs rounded-xl font-mono"
                                required
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Expiry Date (MM/YY)</Label>
                            <Input
                                type="text"
                                placeholder="12/28"
                                value={newCardData.expiry}
                                onChange={(e) => setNewCardData(prev => ({ ...prev, expiry: e.target.value }))}
                                className="text-xs rounded-xl font-mono"
                                required
                            />
                        </div>
                        <DialogFooter className="pt-2">
                            <div className="flex justify-end gap-2 w-full">
                                <Button type="button" variant="outline" onClick={() => setShowAddCardModal(false)} className="rounded-xl text-xs font-bold">
                                    Cancel
                                </Button>
                                <Button type="submit" className="bg-navy hover:bg-navy/90 text-white text-xs font-bold rounded-xl px-5">
                                    Save Card
                                </Button>
                            </div>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ═══════════════════════════════════════════════ */}
            {/* MODAL: EMAIL VERIFICATION OTP */}
            {/* ═══════════════════════════════════════════════ */}
            <Dialog open={showEmailOtpModal} onOpenChange={setShowEmailOtpModal}>
                <DialogContent className="w-[92vw] sm:max-w-md bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 rounded-3xl p-4 sm:p-6 text-center">
                    <DialogHeader>
                        <DialogTitle className="text-base sm:text-lg font-black text-navy dark:text-white">Verify Email Address</DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-4 text-center">
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            A 4-digit verification code was sent to <strong className="text-navy dark:text-amber-400 font-bold">{pendingEmail || userData?.email}</strong>.
                        </p>
                        {emailOtpError && (
                            <div className="bg-rose-50 border border-rose-200 text-rose-700 p-2.5 rounded-xl text-xs font-medium">
                                {emailOtpError}
                            </div>
                        )}
                        <Input
                            type="text"
                            placeholder="OTP"
                            value={emailOtpCode}
                            onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, "");
                                if (val.length <= 4) setEmailOtpCode(val);
                            }}
                            className="text-center text-2xl font-mono font-black tracking-widest h-12 w-44 mx-auto rounded-2xl border-slate-300 dark:border-stone-700"
                            inputMode="numeric"
                            maxLength={4}
                        />
                        <p className="text-[10px] text-slate-400">
                            (Simulator: code is <strong className="text-navy dark:text-amber-400 font-bold">1234</strong>)
                        </p>
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            className="w-full bg-navy text-white hover:bg-navy/90 font-black text-xs py-2.5 rounded-xl"
                            disabled={emailOtpLoading}
                            onClick={handleVerifyEmailOtp}
                        >
                            {emailOtpLoading ? (
                                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Verifying...</>
                            ) : (
                                "Verify & Confirm Email"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Profile;

