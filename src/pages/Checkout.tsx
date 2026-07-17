import { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Plus,
  Edit,
  QrCode,
  Copy,
  Check,
  Loader2,
  Upload,
  X,
  Eye,
  Ticket,
  MapPin,
  Store,
  CalendarDays,
  Navigation,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Navbar from "@/components/Navbar";
import { useToast } from "@/hooks/use-toast";
import upi from "../Web images/Web images/upi.jpeg";

const API_BASE = "https://server.apexbee.in/api";

type CartItem = any;

type Address = {
  _id: string;
  name: string;
  phone: string;
  pincode: string;
  address: string;
  city: string;
  state: string;
  isDefault?: boolean;
  type?: string;
};

type CouponRule = {
  code: string;
  title: string;
  description: string;
  type: "flat" | "percent";
  value: number;
  maxDiscount?: number;
  minOrder?: number;
  firstOrderOnly?: boolean;
  allowedPayments?: Array<"upi" | "wallet" | "cod">;
  expiresAt?: string;
};

type PickupSlot = { date: string; time: string };

type PickupLocation = {
  _id: string;
  name: string;
  address: string;
  phone?: string;
  pincode?: string;
  slots?: PickupSlot[];
};

/** -----------------------------
 * Helpers
 * ---------------------------- */
const onlyDigits = (s: string) => (s || "").replace(/\D/g, "");
const normPincode = (p: any) => onlyDigits(String(p || "")).slice(0, 6);

/**
 * ✅ unify "pickup/preorder" flags from product/cart
 */
const readItemFlags = (item: any) => {
  const fulfillment = item?.fulfillment || {};
  const preOrder = item?.preOrder || {};

  const pickupEnabled =
    Boolean(fulfillment?.pickupEnabled) ||
    Boolean(item?.allowPickup) ||
    Boolean(item?.pickupAvailable);

  const mode = fulfillment?.mode || "delivery_only";

  const allowPickup =
    pickupEnabled && (mode === "both" || mode === "pickup_only");

  const isPreOrder =
    Boolean(preOrder?.enabled) ||
    Boolean(item?.isPreOrder) ||
    Boolean(item?.preOrder);

  const availableOn =
    preOrder?.availableFrom || item?.availableOn || item?.preOrderDate || null;

  const shopPincode =
    fulfillment?.pickupShopPincode ||
    item?.pickupShopPincode ||
    item?.shopPincode ||
    null;

  const pincodeMatchOnly = fulfillment?.pickupRules?.pincodeMatchOnly ?? true;

  return { allowPickup, isPreOrder, availableOn, shopPincode, pincodeMatchOnly };
};

/** ✅ robust price picker */
const getItemPrice = (item: any) => {
  const p = item?.afterDiscount ?? item?.price ?? item?.finalPrice ?? 0;
  const n = Number(p);
  return Number.isFinite(n) ? n : 0;
};

/** ✅ Calculate total delivery fee from items */
const calculateDeliveryFee = (items: CartItem[]) => {
  if (!items || items.length === 0) return 0;
  return items.reduce((sum, item) => {
    const deliveryFee = item.deliveryFee ?? 0;
    const quantity = Number(item.quantity || 1);
    return sum + (deliveryFee * quantity);
  }, 0);
};

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  // Cart data from Cart page
  const cartData: any = location.state || {};
  const initialItems = (cartData.cartItems || []) as CartItem[];

  // User addresses
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [addressForm, setAddressForm] = useState({
    name: "",
    phone: "",
    pincode: "",
    address: "",
    city: "",
    state: "",
    isDefault: false,
    type: "Home" as "Home" | "Office" | "Other",
  });
  const [showAddressDialog, setShowAddressDialog] = useState(false);
  const [locationFetching, setLocationFetching] = useState(false);
  const [locationError, setLocationError] = useState<string>("");

  // Fulfillment
  const [fulfillmentType, setFulfillmentType] = useState<"delivery" | "pickup">(
    "delivery"
  );
  const [pickupLocations, setPickupLocations] = useState<PickupLocation[]>([]);
  const [pickupLocationId, setPickupLocationId] = useState<string>("");
  const [pickupSlot, setPickupSlot] = useState<PickupSlot | null>(null);

  // Scheduled Subscription State
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduleFrequency, setScheduleFrequency] = useState<"daily" | "weekly" | "monthly">("daily");
  const [scheduleDuration, setScheduleDuration] = useState<number>(1);
  const [scheduleStartDate, setScheduleStartDate] = useState<string>(new Date(Date.now() + 86400000).toISOString().split("T")[0]);

  // Payment & Wallet
  const [selectedPayment, setSelectedPayment] = useState<"upi" | "wallet" | "cod">("cod");
  const [walletBalance, setWalletBalance] = useState(0);
  const [useWallet, setUseWallet] = useState(false);
  const [useRewardPoints, setUseRewardPoints] = useState(false);
  const [rewardPointsBalance, setRewardPointsBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // UPI
  const [showUPIDialog, setShowUPIDialog] = useState(false);
  const [upiTransactionId, setUpiTransactionId] = useState("");
  const [isProcessingUPI, setIsProcessingUPI] = useState(false);
  const [copiedUPI, setCopiedUPI] = useState(false);

  // Proof
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [paymentProofPreview, setPaymentProofPreview] = useState<string | null>(
    null
  );
  const [isUploading, setIsUploading] = useState(false);

  // Pincode validation
  const [pinCheckLoading, setPinCheckLoading] = useState(false);
  const [pinValid, setPinValid] = useState<boolean | null>(null);
  const [pinError, setPinError] = useState<string>("");
  const [pinMeta, setPinMeta] = useState<{ charge: number; etaDays: number } | null>(
    null
  );

  // Calculate initial delivery fee
  const initialDeliveryFee = useMemo(() => {
    if (cartData.deliveryFee !== undefined && cartData.deliveryFee !== null) {
      return cartData.deliveryFee;
    }
    return calculateDeliveryFee(initialItems);
  }, [cartData.deliveryFee, initialItems]);

  // Order details
  const [orderDetails, setOrderDetails] = useState({
    items: initialItems,
    subtotal: cartData.subtotal || 0,
    discount: cartData.discount || 0,
    shipping: initialDeliveryFee,
    total: cartData.total || 0,
    walletDeduction: 0,
    rewardsDeduction: 0,
  });

  const totalMrp = useMemo(() => {
    return orderDetails.items.reduce((sum, item: any) => {
      const originalPrice = item.originalPrice || item.salesPrice || item.price || 0;
      return sum + (originalPrice * (item.quantity || 1));
    }, 0);
  }, [orderDetails.items]);

  const mrpDiscount = useMemo(() => {
    return Math.max(0, totalMrp - orderDetails.subtotal);
  }, [totalMrp, orderDetails.subtotal]);

  /** ✅ current user pincode (from selected address first, fallback to address form) */
  const userPincode = useMemo(() => {
    const p = selectedAddress?.pincode || addressForm.pincode || "";
    return normPincode(p);
  }, [selectedAddress?.pincode, addressForm.pincode]);

  /** ✅ compute if pickup is possible based on items + (optional) pincode match-only rule */
  const pickupPossible = useMemo(() => {
    if (!orderDetails.items?.length) return false;

    const flags = orderDetails.items.map((it: any) => readItemFlags(it));
    const allPickupEnabled = flags.every((f) => f.allowPickup);
    if (!allPickupEnabled) return false;

    const needsMatch = flags.some((f) => f.pincodeMatchOnly);
    if (!needsMatch) return true;

    if (!userPincode) return false;

    const allHaveShopPin = flags.every(
      (f) => !f.pincodeMatchOnly || !!normPincode(f.shopPincode)
    );
    if (!allHaveShopPin) return false;

    const allMatch = flags.every((f) => {
      if (!f.pincodeMatchOnly) return true;
      return normPincode(f.shopPincode) === userPincode;
    });

    return allMatch;
  }, [orderDetails.items, userPincode]);

  /** ✅ Pre-order compute max availableOn */
  const preOrderInfo = useMemo(() => {
    const preItems = orderDetails.items
      .map((it: any) => ({ ...it, ...readItemFlags(it) }))
      .filter((it: any) => it.isPreOrder && it.availableOn);

    if (preItems.length === 0)
      return { hasPreOrder: false, availableOnMax: null as string | null };

    const maxDate = preItems
      .map((it: any) => new Date(it.availableOn))
      .reduce((a: Date, b: Date) => (a > b ? a : b));

    return { hasPreOrder: true, availableOnMax: maxDate.toISOString() };
  }, [orderDetails.items]);

  // First order
  const [isFirstOrder, setIsFirstOrder] = useState<boolean>(false);
  const [checkingFirstOrder, setCheckingFirstOrder] = useState<boolean>(true);

  // Idempotency Key
  const [checkoutIdempotencyKey, setCheckoutIdempotencyKey] = useState("");
  const itemsSerialization = useMemo(() => {
    return (orderDetails.items || []).map((it: any) => `${it.productId || it._id || it.id}-${it.quantity}`).join(',');
  }, [orderDetails.items]);

  useEffect(() => {
    setCheckoutIdempotencyKey(`idem-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  }, [itemsSerialization, appliedCoupon, fulfillmentType, paymentMethod]);

  // Coupon
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<CouponRule | null>(null);
  const [couponDiscount, setCouponDiscount] = useState<number>(0);
  const [availableCoupons, setAvailableCoupons] = useState<CouponRule[]>([]);
  const [couponLoading, setCouponLoading] = useState(false);

  const upiConfig = useMemo(
    () => ({
      upiId: "9908587023@ybl",
      qrCodeUrl: upi,
      merchantName: "ApexBee Store",
      amount: orderDetails.total,
    }),
    [orderDetails.total]
  );

  const calcItemsSubtotal = (items: CartItem[]) =>
    items.reduce((acc: number, item: any) => {
      const price = item.sellingPrice ?? getItemPrice(item);
      const quantity = Number(item.quantity || 1);
      return acc + price * quantity;
    }, 0);

  const clamp = (n: number, min: number, max: number) =>
    Math.max(min, Math.min(max, n));

  const checkCouponValidity = (
    coupon: CouponRule,
    baseAmount: number,
    payment: "upi" | "wallet" | "cod"
  ) => {
    const now = new Date();
    if (coupon.expiresAt) {
      const exp = new Date(coupon.expiresAt);
      if (now > exp) return { ok: false, msg: "Coupon expired" };
    }
    if (coupon.minOrder && baseAmount < coupon.minOrder)
      return { ok: false, msg: `Min order ₹${coupon.minOrder} required` };
    if (coupon.firstOrderOnly && !isFirstOrder)
      return { ok: false, msg: "This coupon is only for first order" };
    if (coupon.allowedPayments?.length && !coupon.allowedPayments.includes(payment))
      return { ok: false, msg: `Not valid for ${payment.toUpperCase()} payment` };
    return { ok: true, msg: "" };
  };

  const computeCouponDiscount = (coupon: CouponRule, baseAmount: number) => {
    if (baseAmount <= 0) return 0;
    if (coupon.type === "flat") return clamp(coupon.value, 0, baseAmount);
    const raw = (baseAmount * coupon.value) / 100;
    const limited = coupon.maxDiscount ? Math.min(raw, coupon.maxDiscount) : raw;
    return clamp(limited, 0, baseAmount);
  };

  const loadAvailableCoupons = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch(`${API_BASE}/coupons`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!res.ok) {
        console.error("Load coupons failed:", res.status);
        return;
      }

      const data = await res.json();
      const list = data.coupons || data.data || [];
      setAvailableCoupons(Array.isArray(list) ? list : []);
    } catch (error) {
      console.error("Load coupons error:", error);
    }
  };

  const applyCoupon = async (codeRaw?: string) => {
    const code = (codeRaw ?? couponInput).trim().toUpperCase();
    if (!code) return toast({ title: "Enter coupon code", variant: "destructive" });

    try {
      setCouponLoading(true);
      const token = localStorage.getItem("token");

      const res = await fetch(`${API_BASE}/coupons/validate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          code,
          subtotal: orderDetails.subtotal,
          paymentMethod: selectedPayment,
          isFirstOrder,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        return toast({
          title: "Cannot apply coupon",
          description: data.message || data.error || "Invalid coupon",
          variant: "destructive",
        });
      }

      const coupon = data.coupon || data.data || availableCoupons.find((c) => c.code === code);
      if (!coupon) {
        return toast({
          title: "Invalid coupon",
          description: "Coupon details not found from backend",
          variant: "destructive",
        });
      }

      const discount = Number(data.discount ?? data.discountAmount ?? computeCouponDiscount(coupon, orderDetails.subtotal)) || 0;

      setAppliedCoupon(coupon);
      setCouponDiscount(discount);
      setCouponInput(code);

      toast({
        title: "Coupon applied",
        description: `${coupon.code} applied. You saved ₹${discount.toFixed(2)}`,
      });
    } catch (error) {
      console.error("Apply coupon error:", error);
      toast({
        title: "Coupon error",
        description: "Unable to apply coupon. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponDiscount(0);
    setCouponInput("");
    toast({ title: "Coupon removed" });
  };

  /** -----------------------------
   * Redirect if cart empty
   * ---------------------------- */
  useEffect(() => {
    if (!cartData.cartItems || cartData.cartItems.length === 0) {
      toast({
        title: "Cart is empty",
        description: "Redirecting to cart...",
        variant: "destructive",
      });
      navigate("/cart");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** -----------------------------
   * Initial loads
   * ---------------------------- */
  useEffect(() => {
    loadAddresses();
    loadWalletBalance();
    loadRewardPoints();
    checkFirstOrder();
    loadAvailableCoupons();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** ✅ pickup locations should depend on pincode + pickupPossible */
  useEffect(() => {
    if (fulfillmentType !== "pickup") return;
    if (!pickupPossible) return;
    loadPickupLocations(userPincode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fulfillmentType, pickupPossible, userPincode]);

  /** ✅ If pickup isn’t possible, force delivery */
  useEffect(() => {
    if (!pickupPossible && fulfillmentType === "pickup") setFulfillmentType("delivery");
  }, [pickupPossible, fulfillmentType]);

  /**
   * ✅ Shipping rule:
   * - pickup OR preorder => shipping = 0
   * - delivery => use delivery fee from cart or calculate from items
   */
  useEffect(() => {
    if (fulfillmentType === "pickup" || preOrderInfo.hasPreOrder) {
      setOrderDetails((prev) => ({ ...prev, shipping: 0 }));
      setPinValid(true);
      setPinError("");
      setPinMeta({ charge: 0, etaDays: 0 });
      return;
    }

    if (fulfillmentType === "delivery") {
      // Calculate delivery fee from items if not provided
      let deliveryFee = cartData.deliveryFee;
      if (!deliveryFee && deliveryFee !== 0) {
        deliveryFee = calculateDeliveryFee(orderDetails.items);
      }
      const finalDeliveryFee = deliveryFee || 0;
      
      setPinValid(true);
      setPinError("");
      setPinMeta({ charge: finalDeliveryFee, etaDays: 2 });
      setOrderDetails((prev) => ({ ...prev, shipping: finalDeliveryFee }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fulfillmentType, preOrderInfo.hasPreOrder]);

  const loadPickupLocations = async (pincode?: string) => {
    try {
      const qs = pincode ? `?pincode=${encodeURIComponent(pincode)}` : "";
      const res = await fetch(`${API_BASE}/pickup-locations${qs}`);
      if (!res.ok) return;

      const data = await res.json();
      const locs: PickupLocation[] = data.locations || data.pickupLocations || [];
      setPickupLocations(locs);

      if (locs.length) {
        const initialId = pickupLocationId || locs[0]._id;
        setPickupLocationId(initialId);

        const loc = locs.find((l) => l._id === initialId) || locs[0];
        setPickupSlot(loc?.slots?.[0] || null);
      } else {
        setPickupLocationId("");
        setPickupSlot(null);
      }
    } catch (e) {
      console.error("pickup-locations:", e);
    }
  };

  const loadAddresses = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "null");
      const token = localStorage.getItem("token");
      if (!user || !token) return;

      const res = await fetch(`${API_BASE}/user/address/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;

      const data = await res.json();
      const list = data.addresses || [];
      setAddresses(list);

      const defaultAddr =
        list.find((a: Address) => a.isDefault) || list[0] || null;

      setSelectedAddress(defaultAddr);
    } catch (err) {
      console.error("Load addresses error:", err);
    }
  };

  const loadWalletBalance = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "null");
      const token = localStorage.getItem("token");
      if (!user || !token) return;

      const res = await fetch(`${API_BASE}/user/wallet/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;

      const data = await res.json();
      setWalletBalance(data.walletBalance || 0);
    } catch (err) {
      console.error("Wallet fetch error:", err);
    }
  };

  const loadRewardPoints = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "null");
      const token = localStorage.getItem("token");
      if (!user || !token) return;

      const res = await fetch(`${API_BASE}/user/rewards/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;

      const data = await res.json();
      setRewardPointsBalance(data.rewardPoints || 0);
    } catch (err) {
      console.error("Rewards fetch error:", err);
    }
  };

  const checkFirstOrder = async () => {
    setCheckingFirstOrder(true);
    try {
      const user = JSON.parse(localStorage.getItem("user") || "null");
      const token = localStorage.getItem("token");
      if (!user || !token) {
        setIsFirstOrder(false);
        return;
      }

      const res = await fetch(`${API_BASE}/orders/first-order/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setIsFirstOrder(Boolean(data?.isFirstOrder));
        return;
      }

      const ls = localStorage.getItem("hasOrderedOnce");
      setIsFirstOrder(!ls);
    } catch {
      const ls = localStorage.getItem("hasOrderedOnce");
      setIsFirstOrder(!ls);
    } finally {
      setCheckingFirstOrder(false);
    }
  };

  /** -----------------------------
   * Live Location → reverse-geocode via Nominatim
   * ---------------------------- */
  const fetchLiveLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.");
      return;
    }
    setLocationFetching(true);
    setLocationError("");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`,
            { headers: { "Accept-Language": "en" } }
          );
          const data = await res.json();
          const a = data.address || {};

          // Build street line
          const street = [
            a.house_number,
            a.road || a.neighbourhood || a.suburb,
          ]
            .filter(Boolean)
            .join(", ");

          const locality = a.neighbourhood || a.suburb || a.village || "";
          const fullStreet = [street, locality].filter(Boolean).join(", ");

          const city =
            a.city ||
            a.town ||
            a.village ||
            a.county ||
            a.district ||
            "";
          const state = a.state || "";
          const pincode = normPincode(a.postcode || "");

          setAddressForm((prev) => ({
            ...prev,
            address: fullStreet || data.display_name?.split(",")[0] || "",
            city,
            state,
            pincode,
          }));
          toast({
            title: "📍 Location detected",
            description: `${city}, ${state} – ${pincode}`,
          });
        } catch {
          setLocationError("Could not fetch address. Try manually.");
        } finally {
          setLocationFetching(false);
        }
      },
      (err) => {
        setLocationFetching(false);
        if (err.code === 1)
          setLocationError("Location permission denied. Please allow access.");
        else if (err.code === 2)
          setLocationError("Location unavailable. Try moving to open area.");
        else setLocationError("Location request timed out.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  /** -----------------------------
   * Address add/edit
   * ---------------------------- */
  const isAddressFormValid = () =>
    addressForm.name.trim() &&
    onlyDigits(addressForm.phone).length === 10 &&
    normPincode(addressForm.pincode).length === 6 &&
    addressForm.address.trim() &&
    addressForm.city.trim() &&
    addressForm.state.trim();

  const handleAddOrEditAddress = async () => {
    if (!isAddressFormValid()) return;

    setIsLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem("user") || "null");
      const token = localStorage.getItem("token");
      if (!user || !token) {
        toast({
          title: "Login required",
          description: "Please login",
          variant: "destructive",
        });
        navigate("/login");
        return;
      }

      const mappedType =
        addressForm.type === "Office"
          ? "work"
          : addressForm.type === "Other"
          ? "other"
          : "home";

      const payload: any = {
        ...addressForm,
        phone: onlyDigits(addressForm.phone).slice(0, 10),
        pincode: normPincode(addressForm.pincode),
        type: mappedType,
        id: editingAddress?._id,
      };

      const res = await fetch(`${API_BASE}/user/address`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.message || result.error || "Failed to save address");

      await loadAddresses();

      if (!selectedAddress || addressForm.isDefault) setSelectedAddress(result.address);

      setShowAddressDialog(false);
      setAddressForm({
        name: "",
        phone: "",
        pincode: "",
        address: "",
        city: "",
        state: "",
        isDefault: false,
        type: "Home",
      });
      setEditingAddress(null);

      toast({
        title: "Success",
        description: editingAddress ? "Address updated" : "Address added",
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.message || "Failed to save address",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  /** -----------------------------
   * Proof upload
   * ---------------------------- */
  const validateFile = (file: File) => {
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/pdf",
    ];
    const maxSize = 5 * 1024 * 1024;
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Upload JPG/PNG/GIF/WEBP/PDF only",
        variant: "destructive",
      });
      return false;
    }
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Max file size is 5MB",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!validateFile(file)) {
      e.target.value = "";
      return;
    }

    setPaymentProof(file);
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => setPaymentProofPreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setPaymentProofPreview(null);
    }
  };

  const removePaymentProof = () => {
    setPaymentProof(null);
    setPaymentProofPreview(null);
    const fileInput = document.getElementById(
      "payment-proof-upload"
    ) as HTMLInputElement | null;
    if (fileInput) fileInput.value = "";
  };

  const copyUPIId = async () => {
    try {
      await navigator.clipboard.writeText(upiConfig.upiId);
      setCopiedUPI(true);
      toast({ title: "Copied!", description: "UPI ID copied" });
      setTimeout(() => setCopiedUPI(false), 2000);
    } catch {
      toast({
        title: "Copy failed",
        description: "Copy manually",
        variant: "destructive",
      });
    }
  };

  const handlePaymentSelection = (method: "upi" | "wallet") => {
    setSelectedPayment(method);

    if (appliedCoupon) {
      const validity = checkCouponValidity(appliedCoupon, orderDetails.subtotal, method);
      if (!validity.ok) {
        toast({
          title: "Coupon removed",
          description: validity.msg,
          variant: "destructive",
        });
        setAppliedCoupon(null);
        setCouponDiscount(0);
      }
    }

    if (method === "upi") setShowUPIDialog(true);
  };

  /** ✅ realtime totals */
  useEffect(() => {
    const calculatedSubtotal = calcItemsSubtotal(orderDetails.items);
    
    // Recalculate delivery fee from items if needed for delivery
    let currentShipping = orderDetails.shipping;
    if (fulfillmentType === "delivery" && !preOrderInfo.hasPreOrder) {
      const calculatedDeliveryFee = calculateDeliveryFee(orderDetails.items);
      currentShipping = calculatedDeliveryFee;
    } else {
      currentShipping = 0;
    }

    let disc = 0;
    if (appliedCoupon) {
      const validity = checkCouponValidity(appliedCoupon, calculatedSubtotal, selectedPayment);
      if (validity.ok) {
        disc = computeCouponDiscount(appliedCoupon, calculatedSubtotal);
        if (appliedCoupon.code === "VENDORA10") {
          const vendor1Amt = orderDetails.items.filter((it: any) => it.vendorId === "vendor_1")
            .reduce((sum: number, it: any) => sum + (getItemPrice(it) * (it.quantity || 1)), 0);
          disc = (vendor1Amt * 10) / 100;
        }
        if (appliedCoupon.code === "FREESHIP") {
          const groceryShipping = orderDetails.items.filter((it: any) => it.category === "cat_groc" || it.categoryName?.toLowerCase() === "grocery")
            .reduce((sum: number, it: any) => sum + ((it.deliveryFee || 0) * (it.quantity || 1)), 0);
          disc = groceryShipping;
        }
      } else {
        setAppliedCoupon(null);
        setCouponDiscount(0);
      }
    }

    setCouponDiscount(disc);

    // GST Tax applied on the discounted price + packing + shipping (after coupon discount)
    const discountedPrice = Math.max(0, calculatedSubtotal - disc);
    const totalPacking = orderDetails.items.reduce((sum: number, item: any) => sum + ((item.packingCharge || 0) * (item.quantity || 1)), 0);
    const taxableAmount = discountedPrice + totalPacking + currentShipping;
    const gstAmount = Math.round(taxableAmount * 0.05);
 
    // Base Total = Taxable Amount + GST
    const baseTotal = taxableAmount + gstAmount;

    // Deductions
    let pointsDeducted = 0;
    if (useRewardPoints) {
      pointsDeducted = Math.min(rewardPointsBalance, baseTotal);
    }

    let walletDeducted = 0;
    if (useWallet) {
      walletDeducted = Math.min(walletBalance, baseTotal - pointsDeducted);
    }

    const calculatedTotal = baseTotal - pointsDeducted - walletDeducted;

    setOrderDetails((prev) => ({
      ...prev,
      subtotal: calculatedSubtotal,
      shipping: currentShipping,
      walletDeduction: walletDeducted,
      rewardsDeduction: pointsDeducted,
      total: Math.max(0, calculatedTotal),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    orderDetails.items,
    orderDetails.discount,
    appliedCoupon,
    selectedPayment,
    isFirstOrder,
    fulfillmentType,
    preOrderInfo.hasPreOrder,
    useWallet,
    useRewardPoints,
    rewardPointsBalance,
    walletBalance,
  ]);

  /** ✅ Reset UPI dialog */
  useEffect(() => {
    if (!showUPIDialog) {
      setUpiTransactionId("");
      setPaymentProof(null);
      setPaymentProofPreview(null);
    }
  }, [showUPIDialog]);

  /** -----------------------------
   * Order
   * ---------------------------- */
  const handlePlaceOrder = async (
    paymentMethod: "upi" | "wallet" | "cod" = selectedPayment
  ) => {
    // Delivery requires address
    if (fulfillmentType === "delivery" && !selectedAddress) {
      toast({
        title: "Address required",
        description: "Please select a delivery address",
        variant: "destructive",
      });
      return;
    }

    // Pickup requirements
    if (fulfillmentType === "pickup") {
      if (!pickupPossible) {
        toast({
          title: "Pickup not allowed",
          description:
            "Pickup is available only when your pincode matches the shop pincode for these items.",
          variant: "destructive",
        });
        return;
      }
      if (!pickupLocationId) {
        toast({ title: "Pickup location required", variant: "destructive" });
        return;
      }
      if (!pickupSlot?.date || !pickupSlot?.time) {
        toast({ title: "Pickup slot required", variant: "destructive" });
        return;
      }
    }

    const finalShipping = fulfillmentType === "pickup" || preOrderInfo.hasPreOrder ? 0 : orderDetails.shipping;
    const calculatedSubtotal = calcItemsSubtotal(orderDetails.items);

    let finalCouponDiscount = 0;
    if (appliedCoupon) {
      finalCouponDiscount = couponDiscount;
    }

    // GST Tax applied on the discounted price + packing + shipping (after coupon discount)
    const discountedPrice = Math.max(0, calculatedSubtotal - finalCouponDiscount);
    const totalPacking = orderDetails.items.reduce((sum: number, item: any) => sum + ((item.packingCharge || 0) * (item.quantity || 1)), 0);
    const taxableAmount = discountedPrice + totalPacking + finalShipping;
    const gstAmount = Math.round(taxableAmount * 0.05);
 
    // Grand total = taxableAmount + GST
    const baseTotal = taxableAmount + gstAmount;

    let pointsDeducted = 0;
    if (useRewardPoints) {
      pointsDeducted = Math.min(rewardPointsBalance, baseTotal);
    }

    let walletDeducted = 0;
    if (useWallet) {
      walletDeducted = Math.min(walletBalance, baseTotal - pointsDeducted);
    }

    const finalTotal = Math.max(0, baseTotal - pointsDeducted - walletDeducted);

    let finalPaymentMethod = paymentMethod;
    if (finalTotal === 0) {
      finalPaymentMethod = "wallet";
    }

    if (finalPaymentMethod === "wallet" && walletBalance < finalTotal) {
      toast({
        title: "Insufficient Wallet",
        description: `Wallet balance ₹${walletBalance.toFixed(2)} is not enough`,
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const user = JSON.parse(localStorage.getItem("user") || "null");
      const token = localStorage.getItem("token");

      if (!user || !token) {
        toast({
          title: "Login required",
          description: "Please login again",
          variant: "destructive",
        });
        navigate("/login");
        return;
      }

      const mappedItems = orderDetails.items.map((item: any) => {
        const price = getItemPrice(item);
        const quantity = Number(item.quantity || 1);

        return {
          productId: item.productId || item._id || item.id,
          name: item.itemName || item.name || "Unnamed Product",
          price,
          originalPrice: Number(item.originalPrice || item.userPrice || price),
          image: item.images?.[0] || item.image || "/placeholder.png",
          quantity,
          color: item.selectedColor || item.color || "default",
          size: item.size || "One Size",
          vendorId: item.vendorId || null,
          itemTotal: price * quantity,
          fulfillment: item.fulfillment || null,
          preOrder: item.preOrder || null,
          deliveryFee: item.deliveryFee || 0,
        };
      });

      const finalSubtotal = mappedItems.reduce(
        (acc: number, it: any) => acc + it.price * it.quantity,
        0
      );

      let upiDetails: any = null;
      if (finalPaymentMethod === "upi") {
        upiDetails = {
          upiId: upiConfig.upiId,
          transactionId: upiTransactionId || `UPI_${Date.now()}`,
          paymentProof: null,
        };
      }

      const fulfillment =
        fulfillmentType === "pickup"
          ? { type: "pickup", pickupLocationId, pickupSlot, userPincode }
          : { type: "delivery", deliveryFee: finalShipping };

      const orderData: any = {
        userId: user.id || user._id,

        userDetails: {
          userId: user.id || user._id,
          name: user.name || user.username || "Customer",
          email: user.email || "",
          phone:
            fulfillmentType === "delivery"
              ? selectedAddress?.phone
              : user.phone || "",
        },

        shippingAddress: fulfillmentType === "delivery" ? selectedAddress : null,
        fulfillment,

        preOrder: {
          isPreOrder: preOrderInfo.hasPreOrder,
          availableOn: preOrderInfo.availableOnMax,
        },

        paymentDetails: {
          method: finalPaymentMethod,
          amount: finalTotal,
          status: (finalPaymentMethod === "upi" || finalPaymentMethod === "cod") ? "pending_verification" : "completed",
          transactionId:
            finalPaymentMethod === "wallet"
              ? `WALLET_${Date.now()}`
              : finalPaymentMethod === "cod"
              ? `COD_${Date.now()}`
              : upiTransactionId || `TXN_${Date.now()}`,
          upiDetails,
        },

        orderItems: mappedItems,

        coupon: appliedCoupon
          ? {
              code: appliedCoupon.code,
              type: appliedCoupon.type,
              value: appliedCoupon.value,
              discount: finalCouponDiscount,
            }
          : null,

        orderSummary: {
          itemsCount: mappedItems.reduce(
            (acc: number, it: any) => acc + it.quantity,
            0
          ),
          subtotal: finalSubtotal,
          shipping: finalShipping,
          discount: mrpDiscount + finalCouponDiscount,
          walletDeduction: walletDeducted,
          rewardsDeduction: pointsDeducted,
          tax: gstAmount,
          total: finalTotal,
          grandTotal: finalTotal,
        },

        rewardPointsUsed: pointsDeducted,
        isScheduledSubscription: isScheduled,
        scheduleDetails: isScheduled ? {
          frequency: scheduleFrequency,
          durationMonths: scheduleDuration,
          startDate: scheduleStartDate
        } : null,

        status: finalPaymentMethod === "upi" ? "payment_pending" : "confirmed",
      };

      let response: Response;
      let hasServerResponded = false;

      if (finalPaymentMethod === "upi" && paymentProof) {
        const formData = new FormData();
        formData.append("orderData", JSON.stringify(orderData));
        formData.append("paymentProof", paymentProof);
        formData.append("transactionId", upiTransactionId);

        response = await fetch(`${API_BASE}/orders/with-proof`, {
          method: "POST",
          headers: { 
            Authorization: `Bearer ${token}`,
            "idempotency-key": checkoutIdempotencyKey
          },
          body: formData,
        });
        hasServerResponded = true;
      } else {
        response = await fetch(`${API_BASE}/orders`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            "idempotency-key": checkoutIdempotencyKey
          },
          body: JSON.stringify(orderData),
        });
        hasServerResponded = true;
      }

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || result.error || "Order failed");

      // Clear cart from backend (DB)
      try {
        await fetch(`${API_BASE}/clear/cart`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ userId: user.id || user._id }),
        });
      } catch (clearErr) {
        console.error("Cart clear failed:", clearErr);
      }

      // Clear local cart
      localStorage.removeItem("cart");
      localStorage.setItem("hasOrderedOnce", "true");

      setUpiTransactionId("");
      setPaymentProof(null);
      setPaymentProofPreview(null);
      setShowUPIDialog(false);

      toast({
        title: "Success!",
        description:
          finalPaymentMethod === "upi"
            ? "Order placed! Proof uploaded. We'll verify shortly."
            : "Order placed successfully!",
      });

      navigate("/order-success", {
        state: {
          orderId: result.order?._id || result.order?.orderNumber,
          paymentMethod: finalPaymentMethod,
          requiresVerification: finalPaymentMethod === "upi",
          coupon: appliedCoupon ? appliedCoupon.code : null,
          fulfillmentType,
          order: result.order,
        },
      });
    } catch (err: any) {
      console.error("Order error:", err);
      // Regenerate key to allow manual fixes and retries ONLY if the server responded.
      // If it was a network error or timeout, retain the same key to prevent duplicate orders.
      if (hasServerResponded) {
        setCheckoutIdempotencyKey(`idem-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
      } else {
        console.warn("[Checkout] Network error or timeout. Retaining same idempotency key:", checkoutIdempotencyKey);
      }
      toast({
        title: "Order Failed",
        description: err?.message || "Failed",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsUploading(false);
    }
  };

  const handleUPIPayment = async () => {
    if (!upiTransactionId.trim()) {
      toast({
        title: "Transaction ID Required",
        description: "Enter UPI transaction ID",
        variant: "destructive",
      });
      return;
    }
    if (!paymentProof) {
      toast({
        title: "Payment Proof Required",
        description: "Upload screenshot",
        variant: "destructive",
      });
      return;
    }
    setIsProcessingUPI(true);
    setIsUploading(true);
    try {
      await handlePlaceOrder("upi");
    } finally {
      setIsProcessingUPI(false);
      setIsUploading(false);
    }
  };

  const handleEditAddress = (addr: Address) => {
    setEditingAddress(addr);
    const resolvedType =
      addr.type === "work" || addr.type === "Office"
        ? "Office"
        : addr.type === "other" || addr.type === "Other"
        ? "Other"
        : "Home";
    setAddressForm({
      name: String(addr.name || ""),
      phone: onlyDigits(String(addr.phone || "")).slice(0, 10),
      pincode: normPincode(addr.pincode),
      address: String(addr.address || ""),
      city: String(addr.city || ""),
      state: String(addr.state || ""),
      isDefault: Boolean(addr.isDefault),
      type: resolvedType,
    });
    setShowAddressDialog(true);
  };

  const handleAddNewAddress = () => {
    setEditingAddress(null);
    setAddressForm({
      name: "",
      phone: "",
      pincode: "",
      address: "",
      city: "",
      state: "",
      isDefault: addresses.length === 0,
      type: "Home",
    });
    setShowAddressDialog(true);
  };

  const formatAddress = (addr: Address | null) =>
    addr ? `${addr.address}, ${addr.city}, ${addr.state} - ${addr.pincode}` : "";

  const selectedPickupLocation = useMemo(
    () => pickupLocations.find((l) => l._id === pickupLocationId) || null,
    [pickupLocations, pickupLocationId]
  );

  /** ✅ show why pickup is disabled */
  const pickupDisabledReason = useMemo(() => {
    if (!orderDetails.items?.length) return "No items";
    const flags = orderDetails.items.map((it: any) => readItemFlags(it));

    if (!flags.every((f) => f.allowPickup)) return "Some items don't support pickup";
    if (!userPincode) return "Add/select address pincode to enable pickup";
    const allHaveShopPin = flags.every((f) => !f.pincodeMatchOnly || !!normPincode(f.shopPincode));
    if (!allHaveShopPin) return "Shop pincode missing in cart items (backend will validate)";
    const allMatch = flags.every((f) => !f.pincodeMatchOnly || normPincode(f.shopPincode) === userPincode);
    if (!allMatch) return "Your pincode doesn't match the shop pincode";
    return "";
  }, [orderDetails.items, userPincode]);
 
  const totalPackageCharges = useMemo(() => {
    return orderDetails.items.reduce((sum: number, item: any) => {
      const packing = item.packingCharge ?? 0;
      return sum + (packing * (item.quantity || 1));
    }, 0);
  }, [orderDetails.items]);
 
  const totalGstAmount = useMemo(() => {
    const discountedPrice = Math.max(0, orderDetails.subtotal - couponDiscount);
    const taxableAmount = discountedPrice + totalPackageCharges + orderDetails.shipping;
    return Math.round(taxableAmount * 0.05);
  }, [orderDetails.subtotal, couponDiscount, totalPackageCharges, orderDetails.shipping]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 lg:mb-8 px-2 sm:px-0">
          Checkout
        </h1>

        {/* Pre-order banner */}
        {preOrderInfo.hasPreOrder && preOrderInfo.availableOnMax && (
          <div className="mb-4 rounded-lg border bg-amber-50 border-amber-200 p-3 text-sm">
            ⏳ Pre-order items included. Ready on / after:{" "}
            <strong>{new Date(preOrderInfo.availableOnMax).toDateString()}</strong>
            <span className="ml-2 text-green-700 font-medium">• Shipping Free ✅</span>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* Left */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Fulfillment */}
            <div className="bg-white rounded-lg border p-4 sm:p-6">
              <h2 className="text-lg font-semibold mb-4">Fulfillment</h2>

              <RadioGroup
                value={fulfillmentType}
                onValueChange={(v: any) => setFulfillmentType(v)}
                className="space-y-3"
              >
                <div className="flex items-center gap-3">
                  <RadioGroupItem value="delivery" id="delivery" />
                  <Label htmlFor="delivery" className="cursor-pointer">
                    Home Delivery{" "}
                    {preOrderInfo.hasPreOrder ? (
                      <span className="text-xs text-green-700 font-medium">(Free for pre-order)</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">₹{orderDetails.shipping.toFixed(2)}</span>
                    )}
                  </Label>
                </div>

                <div className="flex items-center gap-3">
                  <RadioGroupItem value="pickup" id="pickup" disabled={!pickupPossible} />
                  <Label htmlFor="pickup" className={`cursor-pointer ${!pickupPossible ? "text-muted-foreground" : ""}`}>
                    Self Pickup (Free)
                    {!pickupPossible && <span className="text-xs ml-2">({pickupDisabledReason || "Not available"})</span>}
                  </Label>
                </div>
              </RadioGroup>

              {/* Pickup options */}
              {fulfillmentType === "pickup" && (
                <div className="mt-4 space-y-3">
                  <div className="rounded-lg border bg-blue-50 border-blue-200 p-3 text-sm flex gap-2">
                    <Store className="h-4 w-4 mt-0.5" />
                    Select pickup location + slot
                  </div>

                  {pickupLocations.length === 0 ? (
                    <div className="text-sm text-muted-foreground">
                      No pickup locations available for pincode: <strong>{userPincode || "—"}</strong>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <Label>Pickup Location</Label>
                        <select
                           value={pickupLocationId}
                           onChange={(e) => {
                             const id = e.target.value;
                             setPickupLocationId(id);
                             const loc = pickupLocations.find((l) => l._id === id);
                             setPickupSlot(loc?.slots?.[0] || null);
                           }}
                           className="w-full border rounded-md px-3 py-2 bg-white"
                        >
                          {pickupLocations.map((loc) => (
                            <option key={loc._id} value={loc._id}>
                              {loc.name}
                            </option>
                          ))}
                        </select>

                        {selectedPickupLocation && (
                          <p className="text-xs text-muted-foreground flex items-start gap-2 mt-1">
                            <MapPin className="h-3 w-3 mt-0.5" />
                            {selectedPickupLocation.address}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label>Pickup Slot</Label>

                        <select
                          value={pickupSlot ? `${pickupSlot.date}__${pickupSlot.time}` : ""}
                          onChange={(e) => {
                            const [date, time] = e.target.value.split("__");
                            setPickupSlot({ date, time });
                          }}
                          className="w-full border rounded-md px-3 py-2 bg-white"
                        >
                          {(selectedPickupLocation?.slots || []).map((s, idx) => (
                            <option key={idx} value={`${s.date}__${s.time}`}>
                              {s.date} • {s.time}
                            </option>
                          ))}
                        </select>

                        <p className="text-xs text-muted-foreground flex items-center gap-2">
                          <CalendarDays className="h-3 w-3" />
                          Pickup is free. Please arrive during your selected slot.
                        </p>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Scheduled Delivery Option */}
              {fulfillmentType === "delivery" && orderDetails.items.some((it: any) => it.category === "cat_groc" || it.categoryName?.toLowerCase() === "grocery" || it.category === "Grocery") && (
                <div className="mt-5 border border-yellow-200 rounded-lg p-4 bg-amber-50/20">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div>
                      <h3 className="text-sm font-bold text-navy">Schedule / Subscribe Delivery</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">Subscribe to get fresh items daily, weekly, or monthly.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isScheduled}
                        onChange={(e) => setIsScheduled(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-5 bg-gray-200 rounded-full peer peer-focus:ring-0 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-accent"></div>
                    </label>
                  </div>
                  
                  {isScheduled && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-yellow-100">
                      <div className="space-y-1">
                        <Label className="text-xs text-navy font-bold">Frequency</Label>
                        <select
                          value={scheduleFrequency}
                          onChange={(e: any) => setScheduleFrequency(e.target.value)}
                          className="w-full border rounded-md text-xs px-2.5 py-1.5 bg-white font-medium text-navy"
                        >
                          <option value="daily">Daily Delivery</option>
                          <option value="weekly">Weekly Delivery</option>
                          <option value="monthly">Monthly Delivery</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs text-navy font-bold">Duration</Label>
                        <select
                          value={scheduleDuration}
                          onChange={(e) => setScheduleDuration(Number(e.target.value))}
                          className="w-full border rounded-md text-xs px-2.5 py-1.5 bg-white font-medium text-navy"
                        >
                          <option value={1}>1 Month</option>
                          <option value={3}>3 Months</option>
                          <option value={6}>6 Months</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs text-navy font-bold">Start Date</Label>
                        <input
                          type="date"
                          value={scheduleStartDate}
                          min={new Date(Date.now() + 86400000).toISOString().split("T")[0]}
                          onChange={(e) => setScheduleStartDate(e.target.value)}
                          className="w-full border rounded-md text-xs px-2 py-1 bg-white font-medium text-navy"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Delivery Address */}
            {fulfillmentType === "delivery" && (
              <div className="bg-white rounded-lg border p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <h2 className="text-lg font-semibold">Delivery Address</h2>
                  <Button variant="outline" size="sm" onClick={handleAddNewAddress} className="w-full sm:w-auto">
                    <Plus className="h-4 w-4 mr-2" /> Add New
                  </Button>
                </div>

                <div className="space-y-3 sm:space-y-4">
                  {addresses.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">No addresses saved yet</p>
                  ) : (
                    addresses.map((addr) => (
                      <div
                        key={addr._id}
                        className={`border p-3 sm:p-4 rounded-lg cursor-pointer transition-colors ${
                          selectedAddress?._id === addr._id
                            ? "border-primary bg-primary/5"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                        onClick={() => setSelectedAddress(addr)}
                      >
                        <div className="flex justify-between items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm sm:text-base truncate flex items-center flex-wrap gap-2">
                              <span>{addr.name}</span>
                              {addr.type && (
                                <span className="text-[10px] bg-navy/10 text-navy font-bold uppercase tracking-wider px-2 py-0.5 rounded">
                                  {addr.type}
                                </span>
                              )}
                              {addr.isDefault && (
                                <span className="text-[10px] bg-accent text-white px-2 py-0.5 rounded">Default</span>
                              )}
                            </p>
                            <p className="text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-2">
                              {formatAddress(addr)}
                            </p>
                            <p className="text-xs sm:text-sm text-muted-foreground mt-1">{addr.phone}</p>
                          </div>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditAddress(addr);
                            }}
                            className="flex-shrink-0"
                          >
                            <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Discounts & Wallet Deductions */}
            <div className="bg-white rounded-lg border p-4 sm:p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                💰 Discounts & Wallet Deductions
              </h2>
              <div className="space-y-4">
                {/* Reward Points */}
                <div className="flex items-start gap-3 p-3 rounded-lg border border-yellow-100 bg-yellow-50/20">
                  <input
                    type="checkbox"
                    id="use-reward-points"
                    checked={useRewardPoints}
                    onChange={(e) => setUseRewardPoints(e.target.checked)}
                    disabled={rewardPointsBalance <= 0}
                    className="h-4 w-4 rounded border-gray-300 text-accent focus:ring-accent mt-1 cursor-pointer"
                  />
                  <Label htmlFor="use-reward-points" className="cursor-pointer">
                    <p className="font-semibold text-navy text-sm sm:text-base">Redeem Reward Points / Cashback</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Available: <strong>{rewardPointsBalance} Points</strong> (1 Point = ₹1 deduction)
                    </p>
                  </Label>
                </div>

                {/* Wallet Balance */}
                <div className="flex items-start gap-3 p-3 rounded-lg border border-blue-100 bg-blue-50/20">
                  <input
                    type="checkbox"
                    id="use-wallet"
                    checked={useWallet}
                    onChange={(e) => setUseWallet(e.target.checked)}
                    disabled={walletBalance <= 0}
                    className="h-4 w-4 rounded border-gray-300 text-accent focus:ring-accent mt-1 cursor-pointer"
                  />
                  <Label htmlFor="use-wallet" className="cursor-pointer">
                    <p className="font-semibold text-navy text-sm sm:text-base">Deduct from ApexBee Wallet</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Available Balance: <strong>₹{walletBalance.toFixed(2)}</strong>
                    </p>
                  </Label>
                </div>
              </div>
            </div>

            {/* Payment */}
            <div className="bg-white rounded-lg border p-4 sm:p-6">
              <h2 className="text-lg font-semibold mb-4">Payment Method</h2>
              {orderDetails.total === 0 ? (
                <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-sm text-green-800 font-medium">
                  🎉 Total amount is covered by deductions! Click "Place Order" to finalize.
                </div>
              ) : (
                <div className="space-y-4">
                  <RadioGroup
                    value={selectedPayment}
                    onValueChange={(v: any) => handlePaymentSelection(v)}
                    className="space-y-3"
                  >
                    <div className="flex items-center gap-3">
                      <RadioGroupItem value="cod" id="cod" />
                      <Label htmlFor="cod" className="cursor-pointer font-medium text-sm sm:text-base text-navy">
                        Cash on Delivery (COD)
                      </Label>
                    </div>

                    <div className="flex items-center gap-3">
                      <RadioGroupItem value="upi" id="upi" />
                      <Label htmlFor="upi" className="cursor-pointer font-medium flex items-center gap-2 text-sm sm:text-base text-navy">
                        <QrCode className="h-4 w-4 text-accent" />
                        UPI Payment (Manual Verification)
                      </Label>
                    </div>
                  </RadioGroup>

                  {/* Future payment gateways preview */}
                  <div className="border-t border-gray-100 pt-4 mt-4">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">More Payment Methods (Coming Soon)</p>
                    <div className="grid grid-cols-2 gap-2">
                      {["Razorpay Gateway", "UPI Instant Auto", "Credit/Debit Card", "Net Banking"].map((m) => (
                        <div key={m} className="border border-gray-100 rounded-lg p-2 bg-gray-50/50 opacity-60 flex justify-between items-center text-xs text-gray-500 font-medium">
                          <span>{m}</span>
                          <span className="text-[9px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded font-bold uppercase">Soon</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Coupon */}
            <div className="bg-white rounded-lg border p-4 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Ticket className="h-5 w-5" /> Apply Coupon
                </h2>
                {checkingFirstOrder ? (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" /> Checking offers…
                  </span>
                ) : isFirstOrder ? (
                  <span className="text-xs text-green-600 font-medium">First order eligible ✅</span>
                ) : (
                  <span className="text-xs text-muted-foreground">Not first order</span>
                )}
              </div>

              <div className="mt-3 flex flex-col sm:flex-row gap-2">
                <Input
                  placeholder="Enter coupon code (e.g., FIRST100)"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  disabled={!!appliedCoupon}
                />
                {!appliedCoupon ? (
                  <Button
                    type="button"
                    onClick={() => applyCoupon()}
                    className="sm:w-36"
                    disabled={couponLoading}
                  >
                    {couponLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Applying
                      </>
                    ) : (
                      "Apply"
                    )}
                  </Button>
                ) : (
                  <Button type="button" variant="outline" onClick={removeCoupon} className="sm:w-36">
                    Remove
                  </Button>
                )}
              </div>

              {appliedCoupon && (
                <div className="mt-3 rounded-lg border bg-green-50 border-green-200 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-green-800">{appliedCoupon.code}</p>
                      <p className="text-sm text-green-700">{appliedCoupon.title}</p>
                      <p className="text-xs text-green-700 mt-1">
                        Saved: <strong>₹{couponDiscount.toFixed(2)}</strong>
                      </p>
                    </div>
                    <button className="text-green-800 hover:text-green-900" onClick={removeCoupon} title="Remove">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              <div className="mt-4 grid gap-2">
                {availableCoupons.length === 0 ? (
                  <div className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
                    No active coupons available right now. You can still enter a valid coupon code above.
                  </div>
                ) : (
                  availableCoupons.map((c) => {
                    const ok = checkCouponValidity(c, orderDetails.subtotal, selectedPayment).ok;
                    return (
                      <button
                        key={c.code}
                        type="button"
                        onClick={() => !appliedCoupon && applyCoupon(c.code)}
                        className={`text-left rounded-lg border p-3 transition ${
                          ok ? "hover:border-primary" : "opacity-60 cursor-not-allowed"
                        }`}
                        disabled={!ok || !!appliedCoupon || couponLoading}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold">{c.code}</p>
                            <p className="text-xs text-muted-foreground">{c.description}</p>
                          </div>
                          <span className="text-xs font-semibold px-2 py-1 rounded bg-muted">
                            {c.type === "flat" ? `₹${c.value} OFF` : `${c.value}% OFF`}
                          </span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>

              <p className="text-xs text-muted-foreground mt-3">
                Discount applies on subtotal (excluding shipping). Only one coupon can be applied.
              </p>
            </div>
          </div>

          {/* Right: Summary */}
          <div className="lg:col-span-1">
            <div className="bg-muted/30 rounded-lg p-4 sm:p-6 sticky top-4">
              <div className="mb-4 sm:mb-6">
                <h3 className="font-semibold text-lg mb-3 sm:mb-4">Product Details</h3>

                <div className="space-y-3 sm:space-y-4 max-h-60 sm:max-h-80 overflow-y-auto">
                  {orderDetails.items.map((item: any, index: number) => {
                    const price = getItemPrice(item);
                    const quantity = Number(item.quantity || 1);
                    const itemTotal = price * quantity;

                    const flags = readItemFlags(item);

                    return (
                      <div key={item._id || item.productId || index} className="bg-white rounded-lg border p-3 sm:p-4">
                        <div className="flex gap-3 sm:gap-4">
                          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-muted rounded-md flex-shrink-0 overflow-hidden">
                            <img
                              src={item.images?.[0] || item.image || "/placeholder.png"}
                              alt={item.itemName || item.name}
                              className="w-full h-full object-cover"
                            />
                          </div>

                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm mb-1 line-clamp-2">{item.itemName || item.name}</h4>

                            {flags.isPreOrder && flags.availableOn && (
                              <p className="text-[11px] text-muted-foreground mb-1">
                                Available on: <strong>{new Date(flags.availableOn).toDateString()}</strong>
                              </p>
                            )}

                            <div className="flex flex-wrap gap-1 sm:gap-2 text-muted-foreground text-xs mb-1">
                              <span>Qty: {quantity}</span>
                              {item.selectedColor && <span>• Color: {item.selectedColor}</span>}
                              {item.size && <span>• Size: {item.size}</span>}
                            </div>

                            <p className="font-semibold text-sm">₹{itemTotal.toFixed(2)}</p>
                            <p className="text-xs text-muted-foreground">₹{price.toFixed(2)} each</p>
                            
                            {/* Show delivery fee per item if applicable */}
                            {(item.deliveryFee ?? 0) > 0 && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Delivery Fee: ₹{item.deliveryFee} per item
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Totals */}
              <div className="border-t border-gray-200 pt-3 sm:pt-4 space-y-2 text-sm sm:text-base">
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-sm">Total MRP</span>
                  <span>₹{totalMrp.toFixed(2)}</span>
                </div>
 
                {mrpDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span className="text-sm">Discount on MRP</span>
                    <span>-₹{mrpDiscount.toFixed(2)}</span>
                  </div>
                )}
 
                <div className="flex justify-between font-semibold text-navy">
                  <span className="text-sm">Price After Discount</span>
                  <span>₹{Math.max(0, orderDetails.subtotal).toFixed(2)}</span>
                </div>
 
                {appliedCoupon && couponDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Coupon ({appliedCoupon.code})</span>
                    <span>-₹{couponDiscount.toFixed(2)}</span>
                  </div>
                )}
 
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-sm">Package Charges</span>
                  <span>₹{totalPackageCharges.toFixed(2)}</span>
                </div>
 
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-sm">Shipping Charges</span>
                  <span>
                    {orderDetails.shipping > 0 ? `₹${orderDetails.shipping.toFixed(2)}` : "FREE"}
                  </span>
                </div>
 
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-sm">GST (5%)</span>
                  <span>₹{totalGstAmount.toFixed(2)}</span>
                </div>

                {orderDetails.rewardsDeduction > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Reward Points applied</span>
                    <span>-₹{orderDetails.rewardsDeduction.toFixed(2)}</span>
                  </div>
                )}

                {orderDetails.walletDeduction > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Wallet Deducted</span>
                    <span>-₹{orderDetails.walletDeduction.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between font-bold text-base sm:text-lg border-t pt-2 sm:pt-3">
                  <span>Grand Total</span>
                  <span className="text-navy font-extrabold">₹{orderDetails.total.toFixed(2)}</span>
                </div>
              </div>

              <Button
                className="w-full mt-4 sm:mt-6 text-sm sm:text-base py-2.5 sm:py-3"
                onClick={() => {
                  if (selectedPayment === "upi") setShowUPIDialog(true);
                  else handlePlaceOrder();
                }}
                disabled={
                  isLoading ||
                  (fulfillmentType === "delivery" && !selectedAddress) ||
                  (fulfillmentType === "pickup" &&
                    (!pickupPossible || !pickupLocationId || !pickupSlot))
                }
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Place Order"
                )}
              </Button>

              {fulfillmentType === "delivery" && !selectedAddress && (
                <p className="text-xs text-red-500 text-center mt-2">
                  Please select a delivery address
                </p>
              )}

              {fulfillmentType === "pickup" &&
                (!pickupPossible || !pickupLocationId || !pickupSlot) && (
                  <p className="text-xs text-red-500 text-center mt-2">
                    {!pickupPossible
                      ? pickupDisabledReason
                      : "Please select pickup location + slot"}
                  </p>
                )}
            </div>
          </div>
        </div>
      </div>

      {/* Address Dialog */}
      <Dialog open={showAddressDialog} onOpenChange={(open) => { setShowAddressDialog(open); if (!open) { setLocationError(""); } }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingAddress ? "Edit Address" : "Add New Address"}</DialogTitle>
            <DialogDescription>Enter your address details or use live location</DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 sm:gap-4 py-4">
            {/* ── Live Location Button ── */}
            <button
              type="button"
              onClick={fetchLiveLocation}
              disabled={locationFetching}
              className="group relative flex items-center justify-center gap-2.5 w-full rounded-xl border-2 border-dashed border-blue-400 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 dark:from-blue-950/40 dark:to-indigo-950/40 dark:border-blue-600 px-4 py-3 text-sm font-semibold text-blue-700 dark:text-blue-300 transition-all duration-200 hover:shadow-md hover:border-blue-500 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {locationFetching ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Detecting your location…</span>
                </>
              ) : (
                <>
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500" />
                  </span>
                  <Navigation className="h-4 w-4" />
                  <span>Use Live Location to Auto-fill</span>
                </>
              )}
            </button>

            {locationError && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <X className="h-3 w-3" /> {locationError}
              </p>
            )}

            <div className="flex items-center gap-2">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground">or fill manually</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-navy">Address Type</Label>
              <div className="flex gap-2">
                {["Home", "Office", "Other"].map((t) => (
                  <Button
                    key={t}
                    type="button"
                    variant={addressForm.type === t ? "default" : "outline"}
                    onClick={() => setAddressForm((p) => ({ ...p, type: t as any }))}
                    className={`h-8 text-xs flex-1 ${addressForm.type === t ? "bg-navy text-white hover:bg-navy/90" : "text-navy border-navy/20 hover:bg-navy/5"}`}
                  >
                    {t}
                  </Button>
                ))}
              </div>
            </div>
            <Input
              placeholder="Full Name"
              value={addressForm.name}
              onChange={(e) => setAddressForm((p) => ({ ...p, name: e.target.value }))}
            />
            <Input
              placeholder="Phone (10 digits)"
              value={addressForm.phone}
              onChange={(e) =>
                setAddressForm((p) => ({ ...p, phone: onlyDigits(e.target.value).slice(0, 10) }))
              }
            />
            <Input
              placeholder="Pincode (6 digits)"
              value={addressForm.pincode}
              onChange={(e) =>
                setAddressForm((p) => ({ ...p, pincode: normPincode(e.target.value) }))
              }
            />
            <Textarea
              placeholder="Address (street, area, landmark)"
              value={addressForm.address}
              onChange={(e) => setAddressForm((p) => ({ ...p, address: e.target.value }))}
              className="min-h-[80px]"
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder="City"
                value={addressForm.city}
                onChange={(e) => setAddressForm((p) => ({ ...p, city: e.target.value }))}
              />
              <Input
                placeholder="State"
                value={addressForm.state}
                onChange={(e) => setAddressForm((p) => ({ ...p, state: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              disabled={!isAddressFormValid() || isLoading}
              onClick={handleAddOrEditAddress}
              className="w-full sm:w-auto"
            >
              {isLoading ? "Saving..." : "Save Address"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* UPI Payment Dialog */}
      <Dialog open={showUPIDialog} onOpenChange={setShowUPIDialog}>
        <DialogContent className="sm:max-w-lg max-w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <QrCode className="h-5 w-5 sm:h-6 sm:w-6" />
              UPI Payment
            </DialogTitle>
            <DialogDescription className="text-sm sm:text-base">
              Complete payment and upload screenshot for verification
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 sm:space-y-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div className="text-center">
                <div className="bg-white p-3 sm:p-4 rounded-lg border inline-block max-w-full">
                  <img
                    src={upiConfig.qrCodeUrl}
                    alt="UPI QR Code"
                    className="w-36 h-36 sm:w-44 sm:h-44 mx-auto"
                  />
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground mt-2">
                  Scan QR code with any UPI app
                </p>
              </div>

              <div className="text-center">
                <Label className="text-sm sm:text-base font-medium mb-2 block">
                  Or use UPI ID
                </Label>
                <div className="bg-primary/10 p-3 sm:p-4 rounded-lg border border-primary/20">
                  <p className="font-mono text-base sm:text-lg font-bold break-all">
                    {upiConfig.upiId}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 text-xs sm:text-sm"
                    onClick={copyUPIId}
                  >
                    {copiedUPI ? (
                      <Check className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    ) : (
                      <Copy className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    )}
                    {copiedUPI ? "Copied!" : "Copy UPI ID"}
                  </Button>
                </div>
                <div className="mt-3 text-xs text-muted-foreground">
                  <p>
                    Merchant: <strong>{upiConfig.merchantName}</strong>
                  </p>
                  <p>
                    Amount: <strong>₹{orderDetails.total.toFixed(2)}</strong>
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="transaction-id" className="text-sm sm:text-base font-medium">
                Enter Transaction ID *
              </Label>
              <Input
                id="transaction-id"
                placeholder="Enter UPI transaction reference number"
                value={upiTransactionId}
                onChange={(e) => setUpiTransactionId(e.target.value)}
                className="w-full text-sm sm:text-base"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm sm:text-base font-medium">
                Upload Payment Screenshot *
              </Label>

              {paymentProof ? (
                <div className="border border-green-200 bg-green-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Check className="h-5 w-5 text-green-600" />
                      <span className="font-medium text-green-700">
                        File uploaded successfully
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={removePaymentProof}
                      className="h-8 w-8 p-0 hover:bg-red-50"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex items-center gap-3">
                    {paymentProofPreview ? (
                      <div className="w-16 h-16 rounded border overflow-hidden flex-shrink-0">
                        <img
                          src={paymentProofPreview}
                          alt="Payment proof preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded border flex items-center justify-center bg-gray-100 flex-shrink-0">
                        <span className="text-xs font-medium">PDF</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {paymentProof.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(paymentProof.size / 1024).toFixed(2)} KB • {paymentProof.type}
                      </p>
                      {paymentProofPreview && (
                        <Button
                          variant="link"
                          size="sm"
                          className="h-auto p-0 text-xs mt-1"
                          onClick={() => window.open(paymentProofPreview, "_blank")}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View full image
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer">
                  <input
                    type="file"
                    id="payment-proof-upload"
                    className="hidden"
                    accept="image/*,.pdf"
                    onChange={handleFileUpload}
                  />
                  <label
                    htmlFor="payment-proof-upload"
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    <Upload className="h-8 w-8 text-gray-400" />
                    <div>
                      <p className="font-medium">Upload payment screenshot</p>
                      <p className="text-xs text-gray-500 mt-1">
                        JPG, PNG, GIF, WEBP or PDF (Max 5MB)
                      </p>
                    </div>
                    <Button variant="outline" size="sm" className="mt-2">
                      Choose File
                    </Button>
                  </label>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <Button
                variant="outline"
                onClick={() => setShowUPIDialog(false)}
                className="w-full sm:w-auto"
                disabled={isProcessingUPI || isUploading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUPIPayment}
                disabled={!upiTransactionId.trim() || !paymentProof || isProcessingUPI || isUploading}
                className="w-full sm:w-auto"
              >
                {isProcessingUPI || isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Confirm Payment & Place Order"
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Checkout;
