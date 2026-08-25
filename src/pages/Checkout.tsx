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
  ShieldCheck,
  CreditCard,
  Sparkles,
  Zap,
  Lock,
} from "lucide-react";
import { openRazorpayModal } from "@/utils/razorpay";
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
import { getDeviceCoordinates, reverseGeocode, lookupPincode } from "@/utils/locationHelper";
import upi from "../Web images/Web images/upi.jpeg";

const API_BASE = import.meta.env.VITE_API_URL || "https://server.apexbee.in/api";

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
  allowedPayments?: Array<"razorpay" | "upi" | "wallet" | "cod">;
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
const normPhone = (p: any): string => {
  const digits = onlyDigits(String(p || ""));
  if (digits.startsWith("91") && digits.length >= 12) {
    return digits.slice(2, 12);
  }
  if (digits.startsWith("0") && digits.length >= 11) {
    return digits.slice(1, 11);
  }
  if (digits.length > 10) {
    return digits.slice(-10);
  }
  return digits;
};

/**
 * ✅ unify "pickup/preorder" flags from product/cart
 */
const readItemFlags = (item: any) => {
  const fulfillment = item?.fulfillment || {};
  const preOrder = item?.preOrder || {};

  const explicitSelfPickup =
    item?.isSelfPickup !== undefined ? Boolean(item.isSelfPickup) :
      item?.product?.isSelfPickup !== undefined ? Boolean(item.product.isSelfPickup) :
        item?.productId?.isSelfPickup !== undefined ? Boolean(item.productId.isSelfPickup) : true;

  const pickupEnabled =
    Boolean(fulfillment?.pickupEnabled) ||
    Boolean(item?.allowPickup) ||
    Boolean(item?.pickupAvailable) ||
    explicitSelfPickup;

  const mode = fulfillment?.mode || "both";

  const allowPickup =
    pickupEnabled ||
    explicitSelfPickup ||
    mode === "both" ||
    mode === "pickup_only";

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
    item?.vendor?.pincode ||
    item?.storePincode ||
    null;

  const pincodeMatchOnly = fulfillment?.pickupRules?.pincodeMatchOnly ?? false;

  return { allowPickup, isPreOrder, availableOn, shopPincode, pincodeMatchOnly };
};

/** ✅ Extract robust shipping/delivery fee per item */
export const getItemShippingFee = (item: any): number => {
  if (!item) return 0;
  const val = Number(
    item.deliveryFee ??
    item.shippingCharge ??
    item.shipping ??
    item.shippingFee ??
    item.adminPricing?.shippingCharge ??
    item.adminPricing?.deliveryFee ??
    item.product?.adminPricing?.shippingCharge ??
    item.product?.shippingCharge ??
    item.product?.deliveryFee ??
    item.productId?.adminPricing?.shippingCharge ??
    item.productId?.adminPricing?.deliveryFee ??
    item.productId?.shippingCharge ??
    item.productId?.deliveryFee ??
    item.productId?.shipping ??
    0
  );
  return Number.isFinite(val) && val > 0 ? val : 0;
};

/** ✅ Extract robust package/packing fee per item */
export const getItemPackingFee = (item: any): number => {
  if (!item) return 0;
  const val = Number(
    item.packingCharge ??
    item.packageCharge ??
    item.packagingCharge ??
    item.packingFee ??
    item.packageFee ??
    item.packagingFee ??
    item.handlingCharge ??
    item.adminPricing?.packingCharge ??
    item.adminPricing?.packageCharge ??
    item.adminPricing?.packagingFee ??
    item.product?.adminPricing?.packingCharge ??
    item.product?.packingCharge ??
    item.product?.packageCharge ??
    item.productId?.adminPricing?.packingCharge ??
    item.productId?.adminPricing?.packageCharge ??
    item.productId?.packingCharge ??
    item.productId?.packageCharge ??
    item.productId?.packagingCharge ??
    item.productId?.packingFee ??
    0
  );
  return Number.isFinite(val) && val > 0 ? val : 0;
};

export const getItemPlatformFee = (item: any): number => {
  if (!item) return 0;

  let distFrom =
    item.distributedFrom ||
    item.adminPricing?.distributedFrom ||
    item.product?.adminPricing?.distributedFrom ||
    item.productId?.adminPricing?.distributedFrom ||
    item.attributes?.distributedFrom ||
    item.product?.attributes?.distributedFrom ||
    item.productId?.attributes?.distributedFrom ||
    item.commissionType ||
    item.adminPricing?.commissionType ||
    item.product?.adminPricing?.commissionType ||
    item.productId?.adminPricing?.commissionType;

  const vendorCommPct = Number(
    item.vendorCommissionPercent ??
    item.adminPricing?.vendorCommissionPercent ??
    item.product?.adminPricing?.vendorCommissionPercent ??
    item.productId?.adminPricing?.vendorCommissionPercent ??
    0
  );

  const platformFeePct = Number(
    item.platformFeePercent ??
    item.adminPricing?.platformFeePercent ??
    item.product?.adminPricing?.platformFeePercent ??
    item.productId?.adminPricing?.platformFeePercent ??
    0
  );

  const directFee = Number(
    item.platformFeeAmount ??
    item.platformFee ??
    item.adminPricing?.platformFeeAmount ??
    item.product?.adminPricing?.platformFeeAmount ??
    item.productId?.adminPricing?.platformFeeAmount ??
    0
  );

  // Smart fallback: if distFrom not set, check if vendorCommissionPercent is set without a platform fee
  if (!distFrom) {
    if (vendorCommPct > 0 && directFee === 0 && platformFeePct === 0) {
      distFrom = 'apexbee_commission';
    } else {
      distFrom = 'platform_fee';
    }
  }

  // If commission is apexbee_commission / vendor, taken from vendor -> customer pays ₹0 platform fee
  if (distFrom === 'apexbee_commission' || distFrom === 'vendor' || distFrom === 'vendor_commission') {
    return 0;
  }

  // If commission is platform_fee or both:
  if (Number.isFinite(directFee) && directFee > 0) return directFee;

  const price = getItemPrice(item);

  if (platformFeePct > 0 && price > 0) {
    return (price * platformFeePct) / 100;
  }

  const fixedFee = Number(
    item.commissionAmount ??
    item.adminPricing?.vendorCommissionAmount ??
    0
  );
  if ((distFrom === 'platform_fee' || distFrom === 'platform' || distFrom === 'both') && fixedFee > 0) {
    return fixedFee;
  }

  return 0;
};

/** ✅ robust price picker (base selling price before shipping & packing) */
const getItemPrice = (item: any) => {
  const p =
    item?.sellingPrice ??
    item?.adminPricing?.sellingPrice ??
    item?.product?.adminPricing?.sellingPrice ??
    item?.productId?.adminPricing?.sellingPrice ??
    item?.afterDiscount ??
    item?.price ??
    item?.finalPrice ??
    0;
  const n = Number(p);
  return Number.isFinite(n) ? n : 0;
};

/** ✅ Calculate total delivery fee from items */
const calculateDeliveryFee = (items: CartItem[]) => {
  if (!items || items.length === 0) return 0;
  return items.reduce((sum, item: any) => {
    const fee = getItemShippingFee(item);
    const quantity = Number(item.quantity || 1);
    return sum + (fee * quantity);
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

  // Fulfillment & Delivery Preferences
  const [fulfillmentType, setFulfillmentType] = useState<"delivery" | "pickup">(
    "delivery"
  );
  const [deliveryMode, setDeliveryMode] = useState<"standard" | "express" | "same_day" | "scheduled">("standard");
  const [deliveryInstruction, setDeliveryInstruction] = useState<string>("call_before");
  const [customInstruction, setCustomInstruction] = useState<string>("");
  const [deliverySlot, setDeliverySlot] = useState<"morning" | "afternoon" | "evening">("morning");
  const [deliveryScheduledDate, setDeliveryScheduledDate] = useState<string>(
    new Date(Date.now() + 86400000).toISOString().split("T")[0]
  );
  const [deliveryInstructions, setDeliveryInstructions] = useState("");
  const [giftWrap, setGiftWrap] = useState(false);
  const [giftMessage, setGiftMessage] = useState("");

  const [pickupLocations, setPickupLocations] = useState<PickupLocation[]>([]);
  const [pickupLocationId, setPickupLocationId] = useState<string>("");
  const [pickupSlot, setPickupSlot] = useState<PickupSlot | null>(null);

  // Scheduled Subscription State
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduleFrequency, setScheduleFrequency] = useState<"daily" | "weekly" | "monthly">("daily");
  const [scheduleDuration, setScheduleDuration] = useState<number>(1);
  const [scheduleStartDate, setScheduleStartDate] = useState<string>(new Date(Date.now() + 86400000).toISOString().split("T")[0]);

  // Payment & Wallet
  const [selectedPayment, setSelectedPayment] = useState<"razorpay" | "upi" | "wallet" | "cod">("razorpay");
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

  // Calculate initial delivery fee from items if cartData.deliveryFee is not set or 0
  const initialDeliveryFee = useMemo(() => {
    const calc = calculateDeliveryFee(initialItems);
    if (calc > 0) return calc;
    if (cartData.deliveryFee !== undefined && cartData.deliveryFee !== null && Number(cartData.deliveryFee) > 0) {
      return Number(cartData.deliveryFee);
    }
    return calc;
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

  // Sync location.state cartItems when navigating directly via Buy Now or Cart
  useEffect(() => {
    if (cartData.cartItems && Array.isArray(cartData.cartItems) && cartData.cartItems.length > 0) {
      const items = cartData.cartItems as CartItem[];
      const calcShipping = calculateDeliveryFee(items);
      setOrderDetails((prev) => ({
        ...prev,
        items,
        shipping: calcShipping > 0 ? calcShipping : (Number(cartData.deliveryFee) || prev.shipping),
      }));
    }
  }, [location.state, cartData.cartItems]);

  const totalMrp = useMemo(() => {
    return orderDetails.items.reduce((sum, item: any) => {
      const originalPrice = Number(
        item.originalPrice ||
        item.salesPrice ||
        item.mrp ||
        item.adminPricing?.mrp ||
        item.product?.adminPricing?.mrp ||
        item.productId?.adminPricing?.mrp ||
        getItemPrice(item)
      );
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

  /** ✅ Compute if any product is being delivered out-of-local dynamically based on vendor location, customer location, and delivery scope */
  const outOfLocalInfo = useMemo(() => {
    if (!orderDetails.items || orderDetails.items.length === 0) {
      return { hasOutOfLocal: false, outOfLocalItems: [], reasons: [] };
    }

    const outOfLocalItems: any[] = [];
    const customerPin = normPincode(userPincode || selectedAddress?.pincode || "");

    orderDetails.items.forEach((item: any) => {
      const p = item.product || item.productId || item;
      const vendorPin = normPincode(
        item.vendorPincode ||
        item.shopPincode ||
        item.storePincode ||
        item.sellerId?.pincode ||
        item.sellerId?.pinCode ||
        item.sellerId?.location?.pincode ||
        item.vendor?.pincode ||
        item.vendor?.pinCode ||
        item.vendorId?.pincode ||
        item.vendorId?.pinCode ||
        p.vendorPincode ||
        p.sellerId?.pincode ||
        p.sellerId?.pinCode ||
        p.sellerId?.location?.pincode ||
        p.storePincode ||
        p.pincode
      );

      const isPanScope = Boolean(
        p.deliveryScope === "pan_india" ||
        p.deliveryScope === "both" ||
        p.isPanIndia ||
        item.isPanIndia ||
        item.deliveryScope === "pan_india" ||
        item.deliveryScope === "both"
      );

      const dist = Number(item.calculatedDistanceKm ?? p.calculatedDistanceKm ?? 0);
      const isFar = dist > 25; // Beyond 25km local radius
      const isLocalStoreMatch = Boolean(customerPin && vendorPin && customerPin === vendorPin && dist <= 25);

      // Dynamic check:
      // - If vendor PIN and customer PIN exist and don't match => out of local
      // - If distance > 25km => out of local
      // - If product has PAN-India courier scope and is not at customer's local store => out of local
      const isOut = Boolean(
        (vendorPin && customerPin && vendorPin !== customerPin) ||
        isFar ||
        (isPanScope && !isLocalStoreMatch)
      );

      if (isOut) {
        outOfLocalItems.push({
          name: item.name || item.itemName || p.name || "Product",
          vendorPin: vendorPin || "National Courier Hub",
          customerPin,
          distance: dist
        });
      }
    });

    const hasOutOfLocal = outOfLocalItems.length > 0;
    return {
      hasOutOfLocal,
      outOfLocalItems,
      reasons: hasOutOfLocal ? outOfLocalItems.map(i => `"${i.name}" (Origin PIN: ${i.vendorPin})`) : []
    };
  }, [orderDetails.items, userPincode, selectedAddress]);

  /** ✅ Compute if any product is STRICTLY LOCAL ONLY and completely undeliverable to customer's address */
  const undeliverableInfo = useMemo(() => {
    if (!orderDetails.items || orderDetails.items.length === 0) {
      return { hasUndeliverable: false, undeliverableItems: [] };
    }

    const undeliverableItems: any[] = [];
    const customerPin = normPincode(userPincode || selectedAddress?.pincode || "");

    orderDetails.items.forEach((item: any) => {
      const p = item.product || item.productId || item;
      const vendorPin = normPincode(
        item.vendorPincode ||
        item.shopPincode ||
        item.storePincode ||
        item.sellerId?.pincode ||
        item.sellerId?.pinCode ||
        item.sellerId?.location?.pincode ||
        item.vendor?.pincode ||
        item.vendor?.pinCode ||
        item.vendorId?.pincode ||
        item.vendorId?.pinCode ||
        p.vendorPincode ||
        p.sellerId?.pincode ||
        p.sellerId?.pinCode ||
        p.sellerId?.location?.pincode ||
        p.storePincode ||
        p.pincode
      );

      const isPanScope = Boolean(
        p.deliveryScope === "pan_india" ||
        p.deliveryScope === "both" ||
        p.isPanIndia ||
        item.isPanIndia ||
        item.deliveryScope === "pan_india" ||
        item.deliveryScope === "both"
      );

      const dist = Number(item.calculatedDistanceKm ?? p.calculatedDistanceKm ?? 0);
      const isFar = dist > 25; // Beyond 25km local radius
      const isLocalStoreMatch = Boolean(customerPin && vendorPin && customerPin === vendorPin && dist <= 25);

      // If an item is NOT PAN-India (strictly local), and is not at customer's local store => UNDELIVERABLE!
      if (!isPanScope && (!isLocalStoreMatch || (customerPin && vendorPin && customerPin !== vendorPin) || isFar)) {
        undeliverableItems.push({
          id: item._id || item.productId || p._id || p.id,
          name: item.name || item.itemName || p.name || "Product",
          vendorPin: vendorPin || "Vendor Hub",
          vendorLocationName: p.vendorLocationName || p.sellerId?.city || p.sellerId?.district || "Local Store",
          customerPin,
          distance: dist,
          image: item.image || item.images?.[0] || p.thumbnail || p.images?.[0] || "/placeholder.png"
        });
      }
    });

    return {
      hasUndeliverable: undeliverableItems.length > 0,
      undeliverableItems
    };
  }, [orderDetails.items, userPincode, selectedAddress]);

  const handleRemoveCartItem = (itemId: string) => {
    const updatedItems = orderDetails.items.filter((it: any) => (it._id || it.productId || it.id) !== itemId);
    const newSubtotal = calcItemsSubtotal(updatedItems);
    const newDelivery = calculateDeliveryFee(updatedItems);
    setOrderDetails((prev: any) => ({
      ...prev,
      items: updatedItems,
      subtotal: newSubtotal,
      shipping: newDelivery,
      total: Math.max(0, newSubtotal + newDelivery)
    }));

    // Sync with localStorage
    try {
      const local = JSON.parse(localStorage.getItem("local_cart") || "[]");
      const filtered = local.filter((x: any) => (x.productId || x._id || x.id) !== itemId);
      localStorage.setItem("local_cart", JSON.stringify(filtered));
      window.dispatchEvent(new Event("storage"));
    } catch { }

    toast({
      title: "Item Removed",
      description: "Undeliverable item removed from order.",
    });
  };

  // Auto-switch away from COD if out-of-local items are detected
  useEffect(() => {
    if (outOfLocalInfo.hasOutOfLocal && selectedPayment === "cod") {
      setSelectedPayment("upi");
    }
  }, [outOfLocalInfo.hasOutOfLocal, selectedPayment]);

  /** ✅ compute if pickup is possible based on items + location (pickup is ONLY possible when customer is in the local store area) */
  const pickupPossible = useMemo(() => {
    if (!orderDetails.items?.length) return false;
    if (outOfLocalInfo.hasOutOfLocal || undeliverableInfo.hasUndeliverable) return false; // Block pickup for out-of-local deliveries!

    const flags = orderDetails.items.map((it: any) => readItemFlags(it));
    const allPickupEnabled = flags.every((f) => f.allowPickup);
    if (!allPickupEnabled) return false;

    const needsMatch = flags.some((f) => f.pincodeMatchOnly);
    if (!needsMatch && !outOfLocalInfo.hasOutOfLocal) return true;

    if (!userPincode) return true;

    const allHaveShopPin = flags.every(
      (f) => !f.pincodeMatchOnly || !!normPincode(f.shopPincode)
    );
    if (!allHaveShopPin) return true;

    const allMatch = flags.every((f) => {
      if (!f.pincodeMatchOnly) return true;
      return !f.shopPincode || normPincode(f.shopPincode) === userPincode;
    });

    return allMatch;
  }, [orderDetails.items, userPincode, outOfLocalInfo.hasOutOfLocal]);

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

  // Coupon
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<CouponRule | null>(null);
  const [couponDiscount, setCouponDiscount] = useState<number>(0);
  const [availableCoupons, setAvailableCoupons] = useState<CouponRule[]>([]);
  const [couponLoading, setCouponLoading] = useState(false);

  const totalPackageCharges = useMemo(() => {
    return orderDetails.items.reduce((sum: number, item: any) => sum + (getItemPackingFee(item) * (item.quantity || 1)), 0);
  }, [orderDetails.items]);

  const totalPlatformCharges = useMemo(() => {
    return orderDetails.items.reduce((sum: number, item: any) => sum + (getItemPlatformFee(item) * (item.quantity || 1)), 0);
  }, [orderDetails.items]);

  const totalGstAmount = useMemo(() => {
    const finalShipping = fulfillmentType === "pickup" || preOrderInfo?.hasPreOrder ? 0 : orderDetails.shipping;
    const discountedPrice = Math.max(0, orderDetails.subtotal - (couponDiscount || 0));
    const taxable = discountedPrice + totalPackageCharges + finalShipping + totalPlatformCharges + (giftWrap ? 29 : 0);
    return Math.round(taxable * 0.05);
  }, [orderDetails.subtotal, couponDiscount, totalPackageCharges, orderDetails.shipping, totalPlatformCharges, giftWrap, fulfillmentType, preOrderInfo?.hasPreOrder]);

  useEffect(() => {
    setCheckoutIdempotencyKey(`idem-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  }, [itemsSerialization, appliedCoupon, fulfillmentType, selectedPayment]);

  const upiConfig = useMemo(() => {
    const upiId = "9177176969-3@ybl";
    const merchantName = "ApexBee Marketplace";

    return {
      upiId,
      qrCodeUrl: upi,
      merchantName,
      amount: orderDetails.total,
    };
  }, [orderDetails.total]);

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
    payment: "razorpay" | "upi" | "wallet" | "cod"
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

  // Normalize a raw backend coupon object to the CouponRule shape the UI expects
  const normalizeCoupon = (raw: any): CouponRule => ({
    code: raw.code || '',
    title: raw.title || raw.code || '',
    description: raw.description || '',
    type: raw.type ?? (raw.discountType === 'flat' || raw.discountType === 'Fixed Amount' ? 'flat' : 'percent'),
    value: raw.value ?? raw.discountValue ?? 0,
    maxDiscount: raw.maxDiscount ?? raw.maxDiscountAmount,
    minOrder: raw.minOrder ?? raw.minSubtotal ?? raw.minOrderAmount ?? 0,
    firstOrderOnly: raw.firstOrderOnly ?? false,
    allowedPayments: raw.allowedPayments,
    expiresAt: raw.expiresAt ?? raw.expiryDate,
  });

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
      setAvailableCoupons(Array.isArray(list) ? list.map(normalizeCoupon) : []);
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

      const rawCoupon = data.coupon || data.data || availableCoupons.find((c) => c.code === code);
      if (!rawCoupon) {
        return toast({
          title: "Invalid coupon",
          description: "Coupon details not found from backend",
          variant: "destructive",
        });
      }

      const coupon = normalizeCoupon(rawCoupon);
      const discount = Number(data.discount ?? data.discountAmount ?? computeCouponDiscount(coupon, orderDetails.subtotal)) || 0;

      setAppliedCoupon(coupon);
      setCouponDiscount(discount);
      setCouponInput(code);

      toast({
        title: "Coupon applied 🎉",
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
      let locs: PickupLocation[] = [];
      if (res.ok) {
        const data = await res.json();
        locs = data.locations || data.pickupLocations || [];
      }

      if (!locs.length && orderDetails.items?.length > 0) {
        const firstItem = orderDetails.items[0];
        const storeName = firstItem.storeName || firstItem.vendorName || firstItem.product?.sellerId?.name || "ApexBee Store Hub";
        const storeAddress = firstItem.storeAddress || firstItem.vendorAddress || "Main Market Storefront, ApexBee Verified Hub";
        locs = [
          {
            _id: `store_pickup_${firstItem._id || firstItem.productId || 'default'}`,
            name: `🏪 ${storeName} (In-Store Pickup)`,
            address: storeAddress,
            pincode: pincode || '500001',
            slots: [
              { date: 'Today', time: '10:00 AM - 01:00 PM' },
              { date: 'Today', time: '02:00 PM - 06:00 PM' },
              { date: 'Today', time: '06:00 PM - 09:00 PM' },
              { date: 'Tomorrow', time: '10:00 AM - 01:00 PM' },
              { date: 'Tomorrow', time: '02:00 PM - 06:00 PM' },
            ],
          },
        ];
      }

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

      // Load any locally cached addresses first
      let localList: Address[] = [];
      try {
        const localSaved = localStorage.getItem("saved_checkout_addresses") || localStorage.getItem("saved_locations");
        if (localSaved) {
          const parsed = JSON.parse(localSaved);
          if (Array.isArray(parsed)) {
            localList = parsed.map((a: any) => ({
              _id: a._id || a.id || `addr_${Date.now()}`,
              name: a.name || a.recipientName || user?.name || "Customer",
              phone: a.phone || user?.phone || "",
              pincode: a.pincode || "",
              address: a.address || a.addressLine1 || "",
              city: a.city || a.district || "",
              state: a.state || "",
              isDefault: Boolean(a.isDefault),
              type: a.type || a.label || "Home",
            }));
          }
        }
      } catch { }

      if (localList.length > 0) {
        setAddresses(localList);
        const defaultAddr = localList.find((a: Address) => a.isDefault) || localList[0];
        setSelectedAddress((prev) => (prev ? localList.find((a: Address) => a._id === prev._id) || defaultAddr : defaultAddr));
      }

      if (!user || !token) return;
      const userId = user.id || user._id;
      if (!userId) return;

      const res = await fetch(`${API_BASE}/user/address/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;

      const data = await res.json();
      const rawList = data.addresses || (data.address ? [data.address] : []);
      if (Array.isArray(rawList) && rawList.length > 0) {
        const list = rawList.map((a: any) => ({
          _id: a._id || a.id || `addr_${Date.now()}`,
          name: a.name || a.recipientName || user.name || "Customer",
          phone: a.phone || user.phone || "",
          pincode: a.pincode || "",
          address: a.address || a.addressLine1 || "",
          city: a.city || "",
          state: a.state || "",
          isDefault: a.isDefault || false,
          type: a.type || a.label || "Home",
        }));
        setAddresses(list);
        localStorage.setItem("saved_checkout_addresses", JSON.stringify(list));

        const defaultAddr = list.find((a: Address) => a.isDefault) || list[0] || null;
        setSelectedAddress((prev) => (prev ? list.find((a: Address) => a._id === prev._id) || defaultAddr : defaultAddr));
      }
    } catch (err) {
      console.error("Load addresses error:", err);
    }
  };

  const loadWalletBalance = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "null");
      const token = localStorage.getItem("token");
      if (!user || !token) return;
      const userId = user.id || user._id;
      if (!userId) return;

      const res = await fetch(`${API_BASE}/user/wallet/${userId}`, {
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
      const userId = user.id || user._id;
      if (!userId) return;

      const res = await fetch(`${API_BASE}/user/rewards/${userId}`, {
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
      const userId = user.id || user._id;
      if (!userId) {
        setIsFirstOrder(false);
        return;
      }

      const res = await fetch(`${API_BASE}/orders/first-order/${userId}`, {
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
   * Live Location → reverse-geocode via multi-provider locationHelper
   * ---------------------------- */
  const fetchLiveLocation = async () => {
    setLocationFetching(true);
    setLocationError("");
    try {
      const coords = await getDeviceCoordinates();
      const loc = await reverseGeocode(coords.lat, coords.lng);

      const city = loc.mandal || loc.district || loc.colony || "";
      const state = loc.state || "";
      const pincode = loc.pincode || "";
      const address = loc.address || `${loc.colony}, ${loc.mandal}`;

      setAddressForm((prev) => ({
        ...prev,
        address,
        city,
        state,
        pincode,
      }));

      toast({
        title: "📍 Location detected",
        description: `${loc.colony || city}, ${state} – ${pincode}`,
      });
    } catch (err: any) {
      setLocationError(err?.message || "Could not fetch address. Please enter manually.");
    } finally {
      setLocationFetching(false);
    }
  };

  /** -----------------------------
   * Address add/edit handlers
   * ---------------------------- */
  const onOpenAddNewAddress = () => {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    const userName = user?.name || user?.username || "";
    const userPhone = user?.phone || user?.mobile || "";

    setEditingAddress(null);
    setAddressForm({
      name: userName,
      phone: userPhone,
      pincode: "",
      address: "",
      city: "",
      state: "",
      isDefault: addresses.length === 0,
      type: "Home",
    });
    setLocationError("");
    setShowAddressDialog(true);
  };

  const onOpenEditAddress = (addr: Address) => {
    setEditingAddress(addr);
    setAddressForm({
      name: addr.name || "",
      phone: addr.phone || "",
      pincode: addr.pincode || "",
      address: addr.address || "",
      city: addr.city || "",
      state: addr.state || "",
      isDefault: addr.isDefault || false,
      type: addr.type === "work" ? "Office" : addr.type === "other" ? "Other" : "Home",
    });
    setLocationError("");
    setShowAddressDialog(true);
  };

  const handleAddOrEditAddress = async () => {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    const nameVal = addressForm.name.trim() || user?.name || user?.username || "Customer";
    const phoneVal = normPhone(addressForm.phone || user?.phone || "");
    const pinVal = normPincode(addressForm.pincode);
    const addressVal = addressForm.address.trim();
    const cityVal = addressForm.city.trim() || "Local Area";
    const stateVal = addressForm.state.trim() || "Telangana";

    if (!pinVal || pinVal.length < 6) {
      toast({ title: "Pincode Required", description: "Please enter a valid 6-digit postal pincode (e.g. 500081).", variant: "destructive" });
      return;
    }
    if (!addressVal) {
      toast({ title: "Address Required", description: "Please enter your street address / landmark or click 'Use Current Location'.", variant: "destructive" });
      return;
    }
    if (phoneVal.length < 10) {
      toast({ title: "Phone Required", description: "Please enter a valid 10-digit mobile number.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const userId = user?.id || user?._id || `guest_${Date.now()}`;

      const mappedType =
        addressForm.type === "Office"
          ? "work"
          : addressForm.type === "Other"
            ? "other"
            : "home";

      const addressId = editingAddress?._id || `addr_${Date.now()}`;

      const newAddressObj: Address = {
        _id: addressId,
        name: nameVal,
        phone: phoneVal,
        pincode: pinVal,
        address: addressVal,
        city: cityVal,
        state: stateVal,
        isDefault: addressForm.isDefault || addresses.length === 0,
        type: addressForm.type,
      };

      // Try sending to backend if token exists
      if (token && user) {
        try {
          const endpoint = editingAddress?._id
            ? `${API_BASE}/user/address/${userId}/${editingAddress._id}`
            : `${API_BASE}/user/address/${userId}`;
          const method = editingAddress?._id ? "PUT" : "POST";

          const res = await fetch(endpoint, {
            method,
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              ...addressForm,
              userId,
              phone: newAddressObj.phone,
              pincode: newAddressObj.pincode,
              type: mappedType,
              id: editingAddress?._id,
            }),
          });

          if (res.ok) {
            const result = await res.json();
            if (result.address?._id) {
              newAddressObj._id = result.address._id;
            }
          } else {
            // Fallback to /user/address
            await fetch(`${API_BASE}/user/address`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                ...addressForm,
                userId,
                phone: newAddressObj.phone,
                pincode: newAddressObj.pincode,
                type: mappedType,
                id: editingAddress?._id,
              }),
            });
          }
        } catch (apiErr) {
          console.warn("Backend address sync warning, using local persistence:", apiErr);
        }
      }

      // Update state immediately & locally persist
      setAddresses((prev) => {
        let updated: Address[];
        if (editingAddress) {
          updated = prev.map((a) => (a._id === editingAddress._id ? newAddressObj : a));
        } else {
          updated = [newAddressObj, ...prev.filter((a) => a._id !== newAddressObj._id)];
        }
        if (newAddressObj.isDefault) {
          updated = updated.map((a) => ({
            ...a,
            isDefault: a._id === newAddressObj._id,
          }));
        }
        localStorage.setItem("saved_checkout_addresses", JSON.stringify(updated));
        return updated;
      });

      setSelectedAddress(newAddressObj);

      // Sync user_location for pincode & shipping updates
      const locPayload = {
        colony: newAddressObj.city,
        mandal: newAddressObj.city,
        district: newAddressObj.city,
        state: newAddressObj.state,
        pincode: newAddressObj.pincode,
        address: `${newAddressObj.address}, ${newAddressObj.city}, ${newAddressObj.state} - ${newAddressObj.pincode}`,
      };
      localStorage.setItem("user_location", JSON.stringify(locPayload));
      window.dispatchEvent(new Event("user_location_updated"));

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
        title: "Address Saved! 📍",
        description: editingAddress ? "Address updated successfully." : "New delivery address selected.",
      });
    } catch (err: any) {
      toast({
        title: "Error Saving Address",
        description: err?.message || "Failed to save address. Please try again.",
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

  const handlePaymentSelection = (method: "razorpay" | "upi" | "wallet" | "cod") => {
    if (method === "cod" && outOfLocalInfo.hasOutOfLocal) {
      toast({
        title: "Cash on Delivery (COD) Not Available",
        description: "COD is only available for 15-min local deliveries. One or more items in your cart are being shipped from outside your local area.",
        variant: "destructive",
      });
      return;
    }

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
      let addOn = 0;
      if (deliveryMode === "express") addOn = 49;
      else if (deliveryMode === "same_day") addOn = 19;
      currentShipping = calculatedDeliveryFee + addOn;
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

    // GST Tax applied on the discounted price + packing + shipping + platform fee + gift wrap (after coupon discount)
    const discountedPrice = Math.max(0, calculatedSubtotal - disc);
    const totalPacking = orderDetails.items.reduce((sum: number, item: any) => sum + (getItemPackingFee(item) * (item.quantity || 1)), 0);
    const totalPlatform = orderDetails.items.reduce((sum: number, item: any) => sum + (getItemPlatformFee(item) * (item.quantity || 1)), 0);
    const giftWrapFee = giftWrap ? 29 : 0;
    const taxableAmount = discountedPrice + totalPacking + currentShipping + totalPlatform + giftWrapFee;
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
    deliveryMode,
    giftWrap,
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
    paymentMethod: "razorpay" | "upi" | "wallet" | "cod" = selectedPayment
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

    // GST Tax applied on the discounted price + packing + shipping + platform fee (after coupon discount)
    const discountedPrice = Math.max(0, calculatedSubtotal - finalCouponDiscount);
    const totalPacking = orderDetails.items.reduce((sum: number, item: any) => sum + (getItemPackingFee(item) * (item.quantity || 1)), 0);
    const totalPlatform = orderDetails.items.reduce((sum: number, item: any) => sum + (getItemPlatformFee(item) * (item.quantity || 1)), 0);
    const taxableAmount = discountedPrice + totalPacking + finalShipping + totalPlatform;
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

    if (finalPaymentMethod === "cod" && outOfLocalInfo.hasOutOfLocal) {
      toast({
        title: "COD Blocked for Out-of-Local Shipping",
        description: "Cash on Delivery is only supported for local 15-min delivery items. Please complete your order using UPI or Wallet.",
        variant: "destructive",
      });
      return;
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
    let hasServerResponded = false;

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

      // Handle Razorpay Online Payment Flow
      let razorpayTransactionDetails: any = null;
      if (finalPaymentMethod === "razorpay" && finalTotal > 0) {
        const rzpInitRes = await fetch(`${API_BASE}/payment/create-order`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            amount: finalTotal,
            userId: user.id || user._id,
            receipt: `rcpt_${Date.now()}`
          })
        });

        const rzpInit = await rzpInitRes.json();
        if (!rzpInitRes.ok || !rzpInit.success) {
          throw new Error(rzpInit.message || "Failed to initialize Razorpay checkout");
        }

        try {
          const rzpResponse = await openRazorpayModal({
            order_id: rzpInit.orderId,
            amount: rzpInit.amount,
            currency: rzpInit.currency || "INR",
            name: "ApexBee Checkout",
            description: `Order Payment (₹${finalTotal.toFixed(2)})`,
            image: "/logo.png",
            theme: {
              color: "#F5B800",
            },
            prefill: {
              name: user.name || user.username || selectedAddress?.name || "Customer",
              email: user.email || "",
              contact: selectedAddress?.phone || user.phone || ""
            }
          });
          razorpayTransactionDetails = rzpResponse;
        } catch (rzpErr: any) {
          setIsLoading(false);
          toast({
            title: "Payment Cancelled",
            description: rzpErr.message || "Razorpay payment was cancelled.",
            variant: "destructive"
          });
          return;
        }
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
          deliveryFee: getItemShippingFee(item),
          shippingCharge: getItemShippingFee(item),
          packingCharge: getItemPackingFee(item),
          packageCharge: getItemPackingFee(item),
        };
      });

      const finalSubtotal = mappedItems.reduce(
        (acc: number, it: any) => acc + it.price * it.quantity,
        0
      );

      const calcMrpTotal = mappedItems.reduce(
        (acc: number, it: any) => acc + (Number(it.originalPrice || it.price) * Number(it.quantity || 1)),
        0
      );

      const mrpDiscount = Math.max(0, calcMrpTotal - finalSubtotal);

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
          : {
            type: "delivery",
            deliveryFee: finalShipping,
            deliveryMode,
            deliveryInstruction,
            customInstruction,
          };

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
          status: (finalPaymentMethod === "razorpay" || finalPaymentMethod === "wallet") ? "completed" : (finalPaymentMethod === "cod" ? "pending" : "pending_verification"),
          transactionId:
            finalPaymentMethod === "razorpay"
              ? razorpayTransactionDetails?.razorpay_payment_id || `RZP_${Date.now()}`
              : finalPaymentMethod === "wallet"
                ? `WALLET_${Date.now()}`
                : finalPaymentMethod === "cod"
                  ? `COD_${Date.now()}`
                  : upiTransactionId || `TXN_${Date.now()}`,
          razorpayOrderId: razorpayTransactionDetails?.razorpay_order_id,
          razorpayPaymentId: razorpayTransactionDetails?.razorpay_payment_id,
          razorpaySignature: razorpayTransactionDetails?.razorpay_signature,
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
          totalMrp: calcMrpTotal,
          mrpDiscount,
          subtotal: finalSubtotal,
          packageCharge: totalPacking,
          platformFee: totalPlatform,
          shipping: finalShipping,
          discount: mrpDiscount + finalCouponDiscount,
          couponDiscount: finalCouponDiscount,
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

        status: (finalPaymentMethod === "razorpay" || finalPaymentMethod === "wallet" || finalPaymentMethod === "cod") ? "confirmed" : "payment_pending",
      };

      let response: Response;

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
      phone: normPhone(addr.phone),
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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">
      <Navbar />

      {/* BRAND HEADER BANNER */}
      <div className="bg-[#0A1128] text-white py-8 px-4 sm:px-8 border-b border-amber-500/20 mb-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center space-x-2 bg-amber-500/20 text-amber-400 px-3 py-1 rounded-full text-xs font-extrabold border border-amber-500/30">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>APEXBEE SECURE CHECKOUT</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white font-heading">Complete Your Order</h1>
          </div>

          <div className="flex items-center space-x-3 text-xs text-amber-300 font-bold bg-white/10 px-4 py-2 rounded-2xl backdrop-blur">
            <span>1. Address</span>
            <span>→</span>
            <span>2. Delivery</span>
            <span>→</span>
            <span className="text-white underline font-extrabold">3. Payment</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 pb-12 space-y-8">

        {/* Pre-order banner */}
        {preOrderInfo.hasPreOrder && preOrderInfo.availableOnMax && (
          <div className="mb-4 rounded-lg border bg-amber-50 border-amber-200 p-3 text-sm">
            ⏳ Pre-order items included. Ready on / after:{" "}
            <strong>{new Date(preOrderInfo.availableOnMax).toDateString()}</strong>
            <span className="ml-2 text-green-700 font-medium">• Shipping Free ✅</span>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 items-start relative">
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
                  <Button variant="outline" size="sm" onClick={onOpenAddNewAddress} className="w-full sm:w-auto">
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
                        className={`border p-3 sm:p-4 rounded-lg cursor-pointer transition-colors ${selectedAddress?._id === addr._id
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
                              onOpenEditAddress(addr);
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

            {/* 🚨 UNDELIVERABLE LOCAL ITEMS ALERT BANNER */}
            {undeliverableInfo.hasUndeliverable && (
              <div className="bg-red-50 border-2 border-red-500 rounded-2xl p-4 sm:p-5 shadow-sm text-left space-y-3.5">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center font-black text-xl shrink-0 shadow-xs">
                    🚫
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm sm:text-base font-black text-red-950">
                      Undeliverable Items in Cart
                    </h3>
                    <p className="text-xs text-red-800 font-medium mt-0.5 leading-relaxed">
                      The following item(s) are strictly for local store delivery and cannot be delivered to your selected address in <strong className="text-red-950 uppercase">{selectedAddress?.colony || selectedAddress?.city || 'Adilabad'} ({userPincode || selectedAddress?.pincode})</strong>.
                    </p>
                  </div>
                </div>

                <div className="space-y-2 pt-1 border-t border-red-200">
                  {undeliverableInfo.undeliverableItems.map((uItem, idx) => (
                    <div key={idx} className="bg-white rounded-xl p-3 border border-red-200 flex items-center justify-between gap-3 shadow-xs">
                      <div className="flex items-center gap-3 min-w-0">
                        <img src={uItem.image} alt={uItem.name} className="w-11 h-11 rounded-lg object-contain bg-slate-50 p-1 border border-slate-200 shrink-0" />
                        <div className="min-w-0">
                          <p className="font-bold text-xs text-slate-900 truncate">{uItem.name}</p>
                          <p className="text-[10.5px] text-red-700 font-bold">
                            📍 Local to PIN: {uItem.vendorPin} {uItem.distance > 0 ? `(${uItem.distance} km away)` : ''}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveCartItem(uItem.id)}
                        className="bg-red-100 hover:bg-red-200 text-red-900 text-xs font-black px-3 py-1.5 rounded-lg border border-red-300 transition shrink-0 cursor-pointer"
                      >
                        Remove Item
                      </button>
                    </div>
                  ))}
                </div>

                <div className="pt-1 text-[11.5px] font-bold text-red-900 flex items-center gap-1">
                  <span>👉</span>
                  <span>Please remove these local items or switch to a local delivery address in the store's area to proceed.</span>
                </div>
              </div>
            )}

            {/* 📝 Delivery Preferences */}
            {fulfillmentType === "delivery" && (
              <div className="bg-white rounded-lg border p-4 sm:p-6 text-left space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-navy flex items-center gap-2">
                    <span>{outOfLocalInfo.hasOutOfLocal ? "📦" : "📝"}</span>
                    <span>{outOfLocalInfo.hasOutOfLocal ? "Shipping & Courier Details" : "Delivery Preferences"}</span>
                  </h2>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${outOfLocalInfo.hasOutOfLocal
                    ? "bg-blue-100 text-blue-900 border-blue-300"
                    : "bg-amber-100 text-amber-900 border-amber-300"
                    }`}>
                    {outOfLocalInfo.hasOutOfLocal
                      ? "🇮🇳 National Courier (3–5 Days)"
                      : deliveryMode === "express"
                        ? "🚀 Express 15-30 Min"
                        : deliveryMode === "same_day"
                          ? "🌆 Same Day"
                          : "🚚 Standard 15-Min Local"}
                  </span>
                </div>

                {outOfLocalInfo.hasOutOfLocal ? (
                  /* OUT-OF-LOCAL NATIONAL COURIER CARD */
                  <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200/90 space-y-2.5">
                    <div className="flex items-center gap-2 text-blue-950 font-bold text-sm">
                      <span>🚚 Standard National Courier Shipping (3–5 Business Days)</span>
                    </div>
                    <p className="text-xs text-blue-800 leading-relaxed">
                      Your items will be dispatched via insured standard courier service directly from the origin seller hub. Live tracking details will be sent via SMS & WhatsApp upon shipment.
                    </p>
                    <div className="pt-2 border-t border-blue-200/60 flex items-center gap-2 text-[11px] text-blue-700 font-semibold">
                      <span>💡</span>
                      <span>Local 15-minute express delivery slots & same-day slots are only available when ordering from stores located inside your local area.</span>
                    </div>
                  </div>
                ) : (
                  /* LOCAL DELIVERY SPEED / SLOT SELECTION */
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Select Delivery Speed / Slot
                    </Label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        {
                          id: "standard",
                          title: "Standard Delivery",
                          desc: "Free / Normal local delivery",
                          badge: "Standard",
                          icon: "🚚",
                        },
                        {
                          id: "express",
                          title: "Express 15-30 Mins",
                          desc: "+₹49 Superfast express delivery",
                          badge: "🚀 15-30 Min",
                          icon: "⚡",
                        },
                        {
                          id: "same_day",
                          title: "Same Day Slot",
                          desc: "+₹19 Delivered by 9:00 PM today",
                          badge: "🌆 Same Day",
                          icon: "🕒",
                        },
                      ].map((opt) => (
                        <div
                          key={opt.id}
                          onClick={() => setDeliveryMode(opt.id as any)}
                          className={`border rounded-xl p-3 cursor-pointer transition-all ${deliveryMode === opt.id
                            ? "border-amber-500 bg-amber-50/40 shadow-sm ring-2 ring-amber-400/30"
                            : "border-gray-200 hover:border-gray-300 bg-white"
                            }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm">{opt.icon}</span>
                            <span className="text-[9px] font-extrabold bg-navy/10 text-navy px-2 py-0.5 rounded">
                              {opt.badge}
                            </span>
                          </div>
                          <p className="font-bold text-xs text-navy">{opt.title}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{opt.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Delivery Instructions Selection */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Delivery Instructions for Driver
                  </Label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {[
                      { id: "call_before", label: "Call Before Delivery", icon: "📞" },
                      { id: "ring_bell", label: "Ring Doorbell", icon: "🔔" },
                      { id: "leave_gate", label: "Leave at Gate / Door", icon: "🚪" },
                      { id: "contactless", label: "Contactless Drop-off", icon: "🛡️" },
                    ].map((inst) => (
                      <button
                        type="button"
                        key={inst.id}
                        onClick={() => setDeliveryInstruction(inst.id)}
                        className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition cursor-pointer text-left ${deliveryInstruction === inst.id
                          ? "border-indigo-600 bg-indigo-50 text-indigo-900 shadow-xs ring-1 ring-indigo-400/30"
                          : "border-slate-200 bg-slate-50/50 text-slate-700 hover:bg-slate-100"
                          }`}
                      >
                        <span className="text-sm">{inst.icon}</span>
                        <span className="truncate">{inst.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Note input */}
                <div className="pt-2">
                  <input
                    type="text"
                    placeholder="Add special instructions for delivery partner (e.g. Ring flat 302 bell)..."
                    value={customInstruction}
                    onChange={(e) => setCustomInstruction(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:border-navy focus:outline-none bg-slate-50 text-navy"
                  />
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
                    {/* Razorpay Online Gateway Option */}
                    <div className={`p-4 rounded-2xl border-2 transition-all ${selectedPayment === "razorpay"
                      ? "bg-amber-50/70 border-amber-500 shadow-md ring-1 ring-amber-400/40"
                      : "bg-white border-slate-200/80 hover:border-slate-300"
                      }`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <RadioGroupItem value="razorpay" id="razorpay" className="mt-1 text-amber-600" />
                          <div>
                            <Label htmlFor="razorpay" className="cursor-pointer font-black flex items-center gap-2 text-sm sm:text-base text-navy">
                              <Sparkles className="h-4 w-4 text-amber-600" />
                              Razorpay Secure Online Payment
                            </Label>
                            <p className="text-xs text-slate-600 mt-1 font-medium leading-relaxed">
                              Instant payment via <strong>UPI</strong> (Google Pay, PhonePe, Paytm), <strong>Credit/Debit Cards</strong>, <strong>NetBanking</strong> & Wallets.
                            </p>
                            <div className="flex flex-wrap items-center gap-1.5 mt-2">
                              {["Google Pay", "PhonePe", "Paytm", "Cards", "NetBanking"].map((badge) => (
                                <span key={badge} className="text-[10px] bg-slate-100 border border-slate-200 font-bold px-2 py-0.5 rounded-md text-slate-700">
                                  {badge}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                        <span className="text-[10px] bg-amber-500 text-slate-950 font-black px-2.5 py-1 rounded-full uppercase tracking-wider shrink-0 shadow-xs">
                          ⚡ Instant & Auto
                        </span>
                      </div>
                    </div>

                    {/* COD Option with Out-of-Local Blocking */}
                    <div className={`p-3.5 rounded-2xl border transition-all ${outOfLocalInfo.hasOutOfLocal
                      ? "bg-red-50/40 border-red-200 opacity-90"
                      : selectedPayment === "cod"
                        ? "bg-amber-50/40 border-amber-300 shadow-xs"
                        : "bg-slate-50/50 border-slate-200/80"
                      }`}>
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <RadioGroupItem
                            value="cod"
                            id="cod"
                            disabled={outOfLocalInfo.hasOutOfLocal}
                          />
                          <Label
                            htmlFor="cod"
                            className={`font-bold text-sm sm:text-base ${outOfLocalInfo.hasOutOfLocal
                              ? "text-slate-400 cursor-not-allowed line-through"
                              : "cursor-pointer text-navy"
                              }`}
                          >
                            Cash on Delivery (COD)
                          </Label>
                        </div>
                        {outOfLocalInfo.hasOutOfLocal ? (
                          <span className="text-[10px] bg-red-100 text-red-800 font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 shrink-0">
                            <span>🚫</span> Blocked (Out-of-Local)
                          </span>
                        ) : (
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 shrink-0">
                            <span>⚡</span> Local 15-Min Only
                          </span>
                        )}
                      </div>

                      {/* Out of Local Explanation & Product List */}
                      {outOfLocalInfo.hasOutOfLocal && (
                        <div className="mt-2.5 pt-2.5 border-t border-red-100/80 text-xs">
                          <p className="font-extrabold text-red-900 flex items-center gap-1.5">
                            <span>⚠️</span> COD is not available for inter-city / out-of-station delivery
                          </p>
                          <p className="text-[11px] text-red-700 mt-1 leading-relaxed">
                            Cash on Delivery is only supported for local store deliveries. The following product(s) in your cart are being shipped from outside your local delivery zone:
                          </p>
                          <div className="mt-2 space-y-1 bg-white/80 p-2 rounded-xl border border-red-200/60">
                            {outOfLocalInfo.outOfLocalItems.map((item, idx) => (
                              <div key={idx} className="flex items-center justify-between text-[11px] text-slate-800 font-semibold gap-2">
                                <span className="truncate">📦 {item.name}</span>
                                <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-mono shrink-0">
                                  Origin PIN: {item.vendorPin}
                                </span>
                              </div>
                            ))}
                          </div>
                          <p className="mt-2 text-[11px] font-bold text-red-900 flex items-center gap-1">
                            <span>👉</span> Please pay online via <strong>Razorpay</strong>, <strong>UPI</strong> or <strong>Wallet</strong> to proceed.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Manual UPI QR Option */}
                    <div className={`p-3.5 rounded-2xl border transition-all ${selectedPayment === "upi"
                      ? "bg-amber-50/50 border-amber-400 shadow-xs"
                      : "bg-slate-50/50 border-slate-200/80"
                      }`}>
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <RadioGroupItem value="upi" id="upi" />
                          <Label htmlFor="upi" className="cursor-pointer font-bold flex items-center gap-2 text-sm sm:text-base text-navy">
                            <QrCode className="h-4 w-4 text-accent" />
                            Manual UPI QR (Upload Screenshot Proof)
                          </Label>
                        </div>
                        <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                          Manual Proof
                        </span>
                      </div>
                    </div>
                  </RadioGroup>
                </div>
              )}
            </div>

            {/* 🎁 Gift Wrap */}
            {fulfillmentType === "delivery" && (
              <div className="bg-white rounded-lg border p-4 sm:p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-navy flex items-center gap-1.5">🎁 Gift Wrap (+₹29)</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Add a premium gift wrap with a personal message card</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={giftWrap}
                      onChange={(e) => setGiftWrap(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-gray-200 rounded-full peer peer-focus:ring-0 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-accent"></div>
                  </label>
                </div>
                {giftWrap && (
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-navy">Gift Message (optional)</Label>
                    <Input
                      value={giftMessage}
                      onChange={(e) => setGiftMessage(e.target.value)}
                      placeholder="Happy Birthday! 🎉 With love..."
                      className="text-sm"
                    />
                  </div>
                )}
              </div>
            )}

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
                        className={`text-left rounded-lg border p-3 transition ${ok ? "hover:border-primary" : "opacity-60 cursor-not-allowed"
                          }`}
                        disabled={!ok || !!appliedCoupon || couponLoading}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold">{c.code}</p>
                            <p className="text-xs text-muted-foreground">{c.description}</p>
                          </div>
                          <span className="text-xs font-semibold px-2 py-1 rounded bg-muted">
                            {c.type === "flat" ? `₹${c.value ?? 0} OFF` : `${c.value ?? 0}% OFF`}
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

          {/* Right: Summary & Product Details - STICKY FIXED WHILE SCROLLING */}
          <div className="lg:col-span-1 lg:sticky lg:top-24 z-30 self-start">
            <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-xl border border-slate-200">
              <div className="mb-4 sm:mb-6">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <h3 className="font-extrabold text-lg text-navy font-heading flex items-center gap-2">
                    <span>🛍️</span>
                    <span>Product Details</span>
                  </h3>
                  <span className="text-[10px] font-black bg-amber-400 text-slate-950 px-2.5 py-0.5 rounded-full uppercase">
                    {orderDetails.items.length} {orderDetails.items.length === 1 ? "Item" : "Items"}
                  </span>
                </div>

                <div className="space-y-3 sm:space-y-4 max-h-72 sm:max-h-96 overflow-y-auto pr-1 scrollbar-thin">
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
                              {item.selectedColor && item.selectedColor.toLowerCase() !== "default" && item.selectedColor.toLowerCase() !== "none" && (
                                <span>• Color: {item.selectedColor}</span>
                              )}
                              {item.size && item.size.toLowerCase() !== "default" && item.size.toLowerCase() !== "none" && (
                                <span>• Size: {item.size}</span>
                              )}
                            </div>

                            <p className="font-semibold text-sm text-navy dark:text-amber-400">
                              ₹{itemTotal.toFixed(2)}
                            </p>
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

                {totalPackageCharges > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">Package Charges</span>
                    <span>₹{totalPackageCharges.toFixed(2)}</span>
                  </div>
                )}

                {totalPlatformCharges > 0 && (
                  <div className="flex justify-between text-amber-800 font-bold bg-amber-50 p-2 rounded-xl border border-amber-200">
                    <span className="text-sm">Platform Fee</span>
                    <span>+₹{totalPlatformCharges.toFixed(2)}</span>
                  </div>
                )}

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

                {giftWrap && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">🎁 Gift Wrap</span>
                    <span>₹29.00</span>
                  </div>
                )}

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
                className={`w-full mt-4 sm:mt-6 text-sm sm:text-base py-3 sm:py-3.5 font-black rounded-2xl shadow-lg transition cursor-pointer ${undeliverableInfo.hasUndeliverable
                  ? "bg-slate-300 text-slate-500 cursor-not-allowed shadow-none hover:bg-slate-300"
                  : "bg-amber-500 hover:bg-amber-400 text-[#0A1128] shadow-amber-500/20"
                  }`}
                onClick={() => {
                  if (undeliverableInfo.hasUndeliverable) {
                    toast({
                      title: "Cannot Proceed",
                      description: "Please remove undeliverable local items from your cart to place this order.",
                      variant: "destructive"
                    });
                    return;
                  }
                  if (selectedPayment === "upi") setShowUPIDialog(true);
                  else handlePlaceOrder();
                }}
                disabled={
                  isLoading ||
                  undeliverableInfo.hasUndeliverable ||
                  (fulfillmentType === "delivery" && !selectedAddress) ||
                  (fulfillmentType === "pickup" &&
                    (!pickupPossible || !pickupLocationId || !pickupSlot))
                }
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing Secure Payment...
                  </>
                ) : undeliverableInfo.hasUndeliverable ? (
                  "🚫 Remove Undeliverable Items to Order"
                ) : selectedPayment === "razorpay" ? (
                  `⚡ Pay ₹${orderDetails.total.toFixed(2)} with Razorpay`
                ) : selectedPayment === "upi" ? (
                  "Proceed to UPI Payment →"
                ) : (
                  "Place Order"
                )}
              </Button>

              {undeliverableInfo.hasUndeliverable && (
                <p className="text-xs font-bold text-red-600 text-center mt-2 flex items-center justify-center gap-1">
                  <span>⚠️</span>
                  <span>Your cart contains local-only items that cannot be delivered to Adilabad.</span>
                </p>
              )}

              {fulfillmentType === "delivery" && !selectedAddress && !undeliverableInfo.hasUndeliverable && (
                <p className="text-xs text-red-500 text-center mt-2">
                  Please select a delivery address
                </p>
              )}

              {fulfillmentType === "pickup" &&
                (!pickupPossible || !pickupLocationId || !pickupSlot) && !undeliverableInfo.hasUndeliverable && (
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

      {/* 📍 Address Dialog (Modern & 100% Mobile-Responsive) */}
      <Dialog open={showAddressDialog} onOpenChange={(open) => { setShowAddressDialog(open); if (!open) { setLocationError(""); } }}>
        <DialogContent className="w-[95vw] sm:max-w-lg max-h-[88vh] overflow-y-auto rounded-3xl p-4 sm:p-6 bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 shadow-2xl">
          <DialogHeader className="text-left pb-2 border-b border-slate-100 dark:border-stone-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-600 flex items-center justify-center font-bold text-sm">
                📍
              </div>
              <div>
                <DialogTitle className="text-base sm:text-lg font-black text-navy dark:text-white">
                  {editingAddress ? "Edit Delivery Address" : "Add Delivery Address"}
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Enter delivery destination details for quick doorstep dispatch
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* ── Auto GPS Fetch Banner ── */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-50/80 via-indigo-50/50 to-blue-50/80 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200/80 dark:border-blue-800/60 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                  </span>
                  <span className="text-[11px] font-black uppercase text-blue-900 dark:text-blue-200 tracking-wider">
                    GPS Auto-Locate
                  </span>
                </div>

                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={fetchLiveLocation}
                  disabled={locationFetching}
                  className="h-7 text-xs font-bold bg-white text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700 hover:bg-blue-50 px-3 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  {locationFetching ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin text-blue-600" />
                      <span>Detecting...</span>
                    </>
                  ) : (
                    <>
                      <Navigation className="h-3 w-3 text-blue-600" />
                      <span>Use Current Location</span>
                    </>
                  )}
                </Button>
              </div>

              {addressForm.address || addressForm.city || addressForm.pincode ? (
                <div className="bg-white/95 dark:bg-stone-900/90 p-2.5 rounded-xl border border-blue-100 dark:border-blue-900/50 text-xs text-slate-800 dark:text-slate-200">
                  <div className="flex items-start gap-1.5">
                    <span className="text-sm">📌</span>
                    <div>
                      <p className="font-bold text-navy dark:text-amber-400">
                        {[addressForm.address, addressForm.city, addressForm.state].filter(Boolean).join(", ")}
                      </p>
                      {addressForm.pincode && (
                        <p className="text-[10px] text-slate-500 font-mono font-bold mt-0.5">
                          Postal PIN: {addressForm.pincode}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            {locationError && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-1.5">
                <X className="h-4 w-4 shrink-0" />
                <span>{locationError}</span>
              </div>
            )}

            {/* Address Type Selector */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Address Tag
              </Label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { tag: "Home", icon: "🏠" },
                  { tag: "Office", icon: "🏢" },
                  { tag: "Other", icon: "📍" },
                ].map(({ tag, icon }) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setAddressForm((p) => ({ ...p, type: tag as any }))}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${addressForm.type === tag
                      ? "bg-navy text-white border-navy shadow-xs dark:bg-amber-400 dark:text-slate-950 dark:border-amber-400"
                      : "bg-slate-50 dark:bg-stone-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-stone-700 hover:bg-slate-100"
                      }`}
                  >
                    <span>{icon}</span>
                    <span>{tag}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Input Fields */}
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Recipient Full Name *</Label>
                  <Input
                    placeholder="e.g. Akhilesh Reddy"
                    value={addressForm.name}
                    onChange={(e) => setAddressForm((p) => ({ ...p, name: e.target.value }))}
                    className="rounded-xl h-10 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Mobile Number (10 digits) *</Label>
                  <Input
                    placeholder="e.g. 9876543210"
                    value={addressForm.phone}
                    maxLength={14}
                    inputMode="tel"
                    onChange={(e) =>
                      setAddressForm((p) => ({ ...p, phone: normPhone(e.target.value) }))
                    }
                    className="rounded-xl h-10 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Pincode (6 digits) *</Label>
                <Input
                  placeholder="e.g. 500081"
                  value={addressForm.pincode}
                  maxLength={6}
                  inputMode="numeric"
                  onChange={async (e) => {
                    const pin = normPincode(e.target.value);
                    setAddressForm((p) => ({ ...p, pincode: pin }));
                    if (pin.length === 6) {
                      try {
                        const data = await lookupPincode(pin);
                        if (data && (data.city || data.district || data.state)) {
                          setAddressForm((p) => ({
                            ...p,
                            city: p.city || data.district || data.city || data.mandal || "",
                            state: p.state || data.state || "",
                          }));
                        }
                      } catch { }
                    }
                  }}
                  className="rounded-xl h-10 text-xs font-mono font-bold tracking-wider"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Street Address & Landmark *</Label>
                <Textarea
                  placeholder="Flat/House No, Building, Colony, Street, Landmark..."
                  value={addressForm.address}
                  onChange={(e) => setAddressForm((p) => ({ ...p, address: e.target.value }))}
                  className="rounded-xl min-h-[72px] text-xs resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">City / District</Label>
                  <Input
                    placeholder="e.g. Hyderabad"
                    value={addressForm.city}
                    onChange={(e) => setAddressForm((p) => ({ ...p, city: e.target.value }))}
                    className="rounded-xl h-10 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">State</Label>
                  <Input
                    placeholder="e.g. Telangana"
                    value={addressForm.state}
                    onChange={(e) => setAddressForm((p) => ({ ...p, state: e.target.value }))}
                    className="rounded-xl h-10 text-xs"
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-3 border-t border-slate-100 dark:border-stone-800 flex flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowAddressDialog(false)}
              className="w-full sm:w-auto text-xs font-bold rounded-xl h-10 cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={isLoading}
              onClick={handleAddOrEditAddress}
              className="w-full sm:flex-1 bg-navy hover:bg-navy/90 text-white dark:bg-amber-400 dark:text-slate-950 dark:hover:bg-amber-300 text-xs font-black rounded-xl h-10 shadow-md transition cursor-pointer"
            >
              {isLoading ? (
                <><Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" /> Saving Address...</>
              ) : (
                "Save & Use This Address"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* UPI Payment Dialog */}
      {/* 📱 UPI Payment Dialog (Modern & Mobile-Responsive) */}
      <Dialog open={showUPIDialog} onOpenChange={setShowUPIDialog}>
        <DialogContent className="w-[95vw] sm:max-w-lg max-h-[88vh] overflow-y-auto rounded-3xl p-4 sm:p-6 bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 shadow-2xl">
          <DialogHeader className="text-left pb-2 border-b border-slate-100 dark:border-stone-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-600 flex items-center justify-center font-bold text-sm">
                <QrCode className="h-4 w-4" />
              </div>
              <div>
                <DialogTitle className="text-base sm:text-lg font-black text-navy dark:text-white">
                  UPI Instant Payment
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Scan QR code, pay via any UPI app, and confirm transaction
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* 1-Tap Mobile UPI Launcher */}
            <a
              href={`upi://pay?pa=${upiConfig.upiId}&pn=${encodeURIComponent(upiConfig.merchantName)}&am=${orderDetails.total.toFixed(2)}&cu=INR`}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs sm:text-sm font-black shadow-md shadow-purple-500/20 transition-all text-center no-underline"
            >
              <span>⚡</span>
              <span>Open UPI App (GPay / PhonePe / Paytm)</span>
            </a>

            {/* QR Code & UPI ID Card */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50 dark:bg-stone-800/60 rounded-2xl border border-slate-200 dark:border-stone-700">
              <div className="flex flex-col items-center justify-center text-center p-2 bg-white dark:bg-stone-900 rounded-xl border border-slate-100 dark:border-stone-800 shadow-2xs">
                <img
                  src={upiConfig.qrCodeUrl}
                  alt="UPI QR Code"
                  className="w-28 h-28 sm:w-32 sm:h-32 object-contain mx-auto"
                />
                <p className="text-[10px] text-slate-500 font-bold mt-1">
                  Scan with any UPI Scanner
                </p>
              </div>

              <div className="flex flex-col justify-between space-y-2 text-left">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400">Merchant UPI ID</span>
                  <p className="font-mono text-xs sm:text-sm font-black text-navy dark:text-amber-400 break-all">
                    {upiConfig.upiId}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-1.5 h-7 text-[11px] font-bold rounded-lg px-2.5 flex items-center gap-1 cursor-pointer"
                    onClick={copyUPIId}
                  >
                    {copiedUPI ? (
                      <Check className="h-3 w-3 text-emerald-600" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                    {copiedUPI ? "Copied!" : "Copy UPI ID"}
                  </Button>
                </div>

                <div className="pt-2 border-t border-slate-200/80 dark:border-stone-700 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 text-[11px]">Payable:</span>
                    <strong className="text-navy dark:text-white font-extrabold text-sm">
                      ₹{orderDetails.total.toFixed(2)}
                    </strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Transaction ID Input */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label htmlFor="transaction-id" className="text-xs font-bold text-navy dark:text-slate-200">
                  UPI Ref / UTR / Transaction ID *
                </Label>
                <button
                  type="button"
                  onClick={() => setUpiTransactionId(`TXN${Date.now().toString().slice(-8)}`)}
                  className="text-[10px] text-accent font-bold hover:underline bg-transparent border-none cursor-pointer"
                >
                  ⚡ Auto-Fill Sample ID
                </button>
              </div>
              <Input
                id="transaction-id"
                placeholder="e.g. 408219876543 or Ref number"
                value={upiTransactionId}
                onChange={(e) => setUpiTransactionId(e.target.value)}
                className="rounded-xl h-10 text-xs font-mono font-bold"
              />
            </div>

            {/* Payment Proof Upload */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-navy dark:text-slate-200">
                Payment Screenshot (Optional or Verification)
              </Label>

              {paymentProof ? (
                <div className="border border-emerald-200 bg-emerald-50/70 dark:bg-emerald-950/30 rounded-2xl p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
                      <Check className="h-4 w-4 text-emerald-600" />
                      <span>Screenshot Attached</span>
                    </div>
                    <button
                      type="button"
                      onClick={removePaymentProof}
                      className="p-1 rounded-full text-rose-500 hover:bg-rose-50 border-none bg-transparent cursor-pointer"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2.5">
                    {paymentProofPreview && (
                      <div className="w-12 h-12 rounded-lg border overflow-hidden shrink-0 bg-white">
                        <img
                          src={paymentProofPreview}
                          alt="Screenshot"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold truncate text-slate-800 dark:text-slate-200">
                        {paymentProof.name}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        {(paymentProof.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-slate-200 dark:border-stone-700 hover:border-accent rounded-2xl p-3.5 text-center transition cursor-pointer bg-slate-50/50">
                  <input
                    type="file"
                    id="payment-proof-upload"
                    className="hidden"
                    accept="image/*,.pdf"
                    onChange={handleFileUpload}
                  />
                  <label
                    htmlFor="payment-proof-upload"
                    className="cursor-pointer flex flex-col items-center gap-1"
                  >
                    <Upload className="h-5 w-5 text-slate-400" />
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Upload payment screenshot (PNG, JPG, PDF)
                    </p>
                    <span className="text-[10px] text-slate-400">
                      Tap to browse files
                    </span>
                  </label>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="pt-3 border-t border-slate-100 dark:border-stone-800 flex flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowUPIDialog(false)}
              className="w-full sm:w-auto text-xs font-bold rounded-xl h-10 cursor-pointer"
              disabled={isProcessingUPI || isUploading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleUPIPayment}
              disabled={!upiTransactionId.trim() || isProcessingUPI || isUploading}
              className="w-full sm:flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl h-10 shadow-md shadow-emerald-600/20 cursor-pointer"
            >
              {isProcessingUPI || isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Placing Order...
                </>
              ) : (
                "Confirm Payment & Place Order"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Checkout;
