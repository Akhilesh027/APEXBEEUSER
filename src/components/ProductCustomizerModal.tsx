import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Sparkles, Plus, Minus, Check, ShoppingBag, Utensils,
  Layers, Info, Clock, AlertCircle, RefreshCw, Flame, ChevronRight
} from "lucide-react";

interface ProductCustomizerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: any;
  vendorCategory?: string;
  onAddToCart: (configuredItem: any) => void;
  onSubscribe?: (configuredItem: any) => void;
}

export default function ProductCustomizerModal({
  open,
  onOpenChange,
  product,
  vendorCategory = "",
  onAddToCart,
  onSubscribe,
}: ProductCustomizerModalProps) {
  if (!product) return null;

  // Identify Vendor Category Mode
  const categoryLower = (vendorCategory || product?.category?.name || product?.categoryName || "").toLowerCase();
  const isFood = categoryLower.includes("food") || categoryLower.includes("restaurant") || categoryLower.includes("dining") || categoryLower.includes("biryani");
  const isBakery = categoryLower.includes("bakery") || categoryLower.includes("cake") || categoryLower.includes("sweet");
  const isGrocery = categoryLower.includes("grocery") || categoryLower.includes("supermarket") || categoryLower.includes("dairy") || categoryLower.includes("milk");
  const isFashion = categoryLower.includes("fashion") || categoryLower.includes("clothing") || categoryLower.includes("wear");
  const isElectronics = categoryLower.includes("electronic") || categoryLower.includes("mobile") || categoryLower.includes("tech");

  // Extract Variants / Pack Sizes
  const variants = useMemo(() => {
    if (Array.isArray(product?.variants) && product.variants.length > 0) {
      return product.variants;
    }
    // Fallback generated variants from attributes if provided
    if (product?.attributes?.packSizes && Array.isArray(product.attributes.packSizes)) {
      return product.attributes.packSizes.map((ps: string, idx: number) => ({
        _id: `var_${idx}`,
        name: ps,
        packSize: ps,
        price: (product.baseSellingPrice || 100) * (idx === 0 ? 1 : idx * 1.8),
      }));
    }
    return [];
  }, [product]);

  // Initial States
  const [selectedVariant, setSelectedVariant] = useState<any>(variants[0] || null);
  const [selectedAddons, setSelectedAddons] = useState<any[]>([]);
  const [spiceLevel, setSpiceLevel] = useState<string>("Medium");
  const [eggType, setEggType] = useState<string>("Eggless");
  const [customText, setCustomText] = useState<string>("");
  const [cookingNotes, setCookingNotes] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [isSubscription, setIsSubscription] = useState<boolean>(false);

  // Reset state when product opens
  useEffect(() => {
    if (open) {
      setSelectedVariant(variants[0] || null);
      setSelectedAddons([]);
      setSpiceLevel("Medium");
      setEggType("Eggless");
      setCustomText("");
      setCookingNotes("");
      setQuantity(1);
      setIsSubscription(false);
    }
  }, [open, product, variants]);

  // Standard Add-on Options for Food/Restaurant
  const foodAddonOptions = [
    { id: "add_cheese", name: "Extra Cheese", price: 40 },
    { id: "add_gravy", name: "Extra Special Gravy", price: 30 },
    { id: "add_roti", name: "Butter Roti (2 Pcs)", price: 35 },
    { id: "add_raita", name: "Special Mint Raita", price: 25 },
  ];

  const toggleAddon = (addon: any) => {
    if (selectedAddons.some((a) => a.id === addon.id)) {
      setSelectedAddons(selectedAddons.filter((a) => a.id !== addon.id));
    } else {
      setSelectedAddons([...selectedAddons, addon]);
    }
  };

  // Base Price Calculation
  const basePrice = useMemo(() => {
    if (selectedVariant?.price) return Number(selectedVariant.price);
    if (selectedVariant?.baseSellingPrice) return Number(selectedVariant.baseSellingPrice);
    return Number(product?.baseSellingPrice || product?.userPrice || product?.price || 0);
  }, [selectedVariant, product]);

  // Addon Total Calculation
  const addonsTotal = useMemo(() => {
    return selectedAddons.reduce((sum, item) => sum + Number(item.price || 0), 0);
  }, [selectedAddons]);

  // Total Unit Price & Grand Total
  const unitPrice = basePrice + addonsTotal;
  const grandTotal = unitPrice * quantity;

  const handleConfirmAddToCart = () => {
    const configuredItem = {
      ...product,
      productId: product._id || product.id,
      selectedVariant,
      variantName: selectedVariant?.name || selectedVariant?.packSize || null,
      selectedAddons,
      spiceLevel: isFood ? spiceLevel : undefined,
      eggType: isBakery ? eggType : undefined,
      customText: isBakery && customText.trim() ? customText.trim() : undefined,
      cookingNotes: cookingNotes.trim() ? cookingNotes.trim() : undefined,
      unitPrice,
      price: unitPrice,
      quantity,
      isSubscription,
    };

    if (isSubscription && onSubscribe) {
      onSubscribe(configuredItem);
    } else {
      onAddToCart(configuredItem);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-full p-0 overflow-hidden rounded-3xl border-0 shadow-2xl bg-white">
        {/* Header Banner */}
        <div className="relative bg-gradient-to-r from-slate-900 via-navy to-slate-900 p-6 text-white">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge className="bg-amber-400 text-slate-950 font-extrabold text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full">
                  {isFood ? "🍽️ Restaurant Customizer" : isBakery ? "🎂 Bakery Special" : isGrocery ? "🛒 Grocery Pack" : "✨ Item Customizer"}
                </Badge>
              </div>
              <h2 className="text-xl font-black leading-tight line-clamp-1">
                {product?.itemName || product?.name || "Product Option"}
              </h2>
              <p className="text-xs text-slate-300 mt-1 line-clamp-1">
                {product?.brand || product?.subcategory || "Select options & variations"}
              </p>
            </div>
          </div>
        </div>

        {/* Modal Body Scroll Area */}
        <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
          {/* 1. Variant / Pack Size Selector */}
          {variants.length > 0 && (
            <div className="space-y-3">
              <Label className="text-xs font-black uppercase text-slate-600 tracking-wider flex items-center justify-between">
                <span>Select Option / Size</span>
                <span className="text-[10px] text-emerald-600 font-bold">Required</span>
              </Label>
              <div className="grid grid-cols-2 gap-2.5">
                {variants.map((v: any, idx: number) => {
                  const isSelected = selectedVariant?.name === v.name || selectedVariant?._id === v._id;
                  const vPrice = v.price || v.baseSellingPrice || basePrice;
                  return (
                    <button
                      key={v._id || idx}
                      type="button"
                      onClick={() => setSelectedVariant(v)}
                      className={`p-3 rounded-2xl border-2 text-left transition-all flex flex-col justify-between ${
                        isSelected
                          ? "border-navy bg-navy/5 shadow-sm"
                          : "border-slate-100 bg-slate-50/50 hover:border-slate-300"
                      }`}
                    >
                      <span className="text-xs font-bold text-slate-800 line-clamp-1">
                        {v.name || v.packSize || v.size || `Option ${idx + 1}`}
                      </span>
                      <span className="text-sm font-black text-navy mt-1">
                        ₹{Number(vPrice).toLocaleString("en-IN")}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. Restaurant / Food Customizations */}
          {isFood && (
            <>
              {/* Spice Level */}
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase text-slate-600 tracking-wider flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-amber-500" /> Spice Level
                </Label>
                <div className="flex gap-2">
                  {["Mild 🌿", "Medium 🌶️", "Extra Hot 🌶️🔥"].map((lvl) => {
                    const isSel = spiceLevel === lvl;
                    return (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setSpiceLevel(lvl)}
                        className={`flex-1 py-2 px-2 text-xs font-extrabold rounded-xl border transition-all ${
                          isSel ? "border-amber-500 bg-amber-500/10 text-amber-900 shadow-sm" : "border-slate-200 text-slate-600 hover:border-slate-350"
                        }`}
                      >
                        {lvl}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Add-ons */}
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase text-slate-600 tracking-wider">
                  Extra Add-ons
                </Label>
                <div className="space-y-1.5">
                  {foodAddonOptions.map((addon) => {
                    const isChecked = selectedAddons.some((a) => a.id === addon.id);
                    return (
                      <button
                        key={addon.id}
                        type="button"
                        onClick={() => toggleAddon(addon)}
                        className={`w-full p-2.5 rounded-xl border flex items-center justify-between text-xs transition-all ${
                          isChecked ? "border-emerald-500 bg-emerald-500/10 text-emerald-900 font-bold" : "border-slate-100 hover:border-slate-250 text-slate-700"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span className={`w-4 h-4 rounded border flex items-center justify-center ${isChecked ? "bg-emerald-600 border-emerald-600 text-white" : "border-slate-300"}`}>
                            {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                          </span>
                          {addon.name}
                        </span>
                        <span className="font-extrabold">+₹{addon.price}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Special Cooking Instructions */}
              <div className="space-y-1.5">
                <Label className="text-xs font-black uppercase text-slate-600 tracking-wider">
                  Kitchen Instructions
                </Label>
                <Input
                  placeholder="e.g. Less oil, no onions, extra cutlery..."
                  value={cookingNotes}
                  onChange={(e) => setCookingNotes(e.target.value)}
                  className="text-xs rounded-xl border-slate-200"
                />
              </div>
            </>
          )}

          {/* 3. Bakery Customizations */}
          {isBakery && (
            <>
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase text-slate-600 tracking-wider">
                  Egg Option
                </Label>
                <div className="flex gap-2">
                  {[
                    { label: "🟢 Pure Veg (Eggless)", val: "Eggless" },
                    { label: "🔴 Contains Egg", val: "Egg" },
                  ].map((item) => (
                    <button
                      key={item.val}
                      type="button"
                      onClick={() => setEggType(item.val)}
                      className={`flex-1 py-2 text-xs font-extrabold rounded-xl border transition-all ${
                        eggType === item.val ? "border-emerald-500 bg-emerald-50 text-emerald-900 shadow-sm" : "border-slate-200 text-slate-600"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-black uppercase text-slate-600 tracking-wider">
                  Cake Inscription Message
                </Label>
                <Input
                  placeholder="e.g. Happy 25th Birthday Rahul!"
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  className="text-xs rounded-xl border-slate-200"
                />
              </div>
            </>
          )}

          {/* 4. Grocery Subscription Option */}
          {(isGrocery || product?.isSubscriptionAvailable) && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-1.5 font-extrabold text-xs text-amber-950">
                  <RefreshCw className="w-3.5 h-3.5 text-amber-600" /> Daily Delivery Subscription
                </div>
                <p className="text-[11px] text-amber-900/80 mt-0.5">
                  Schedule daily or alternate day automatic doorstep delivery.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsSubscription(!isSubscription)}
                className={`px-3 py-1.5 text-xs font-black rounded-xl border transition-all ${
                  isSubscription ? "bg-amber-500 text-white border-amber-600" : "bg-white text-slate-700 border-slate-300"
                }`}
              >
                {isSubscription ? "Selected" : "Subscribe"}
              </button>
            </div>
          )}

          {/* Quantity Selector */}
          <div className="flex items-center justify-between border-t pt-4">
            <span className="text-xs font-black uppercase text-slate-600 tracking-wider">
              Quantity
            </span>
            <div className="flex items-center gap-3 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-7 w-7 rounded-xl bg-white shadow-sm hover:bg-slate-200"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              >
                <Minus className="w-3 h-3 text-slate-700" />
              </Button>
              <span className="text-sm font-black text-slate-900 px-2">{quantity}</span>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-7 w-7 rounded-xl bg-white shadow-sm hover:bg-slate-200"
                onClick={() => setQuantity((q) => q + 1)}
              >
                <Plus className="w-3 h-3 text-slate-700" />
              </Button>
            </div>
          </div>
        </div>

        {/* Modal Footer / Total Price & Add Action */}
        <div className="p-4 bg-slate-50 border-t flex items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase block">Total Amount</span>
            <span className="text-xl font-black text-navy">
              ₹{grandTotal.toLocaleString("en-IN")}
            </span>
          </div>

          <Button
            type="button"
            onClick={handleConfirmAddToCart}
            className="flex-1 bg-navy hover:bg-navy/90 text-white font-extrabold py-3.5 rounded-2xl shadow-lg flex items-center justify-center gap-2"
          >
            <ShoppingBag className="w-4 h-4" />
            {isSubscription ? "Proceed to Subscribe" : "Add to Cart"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
