// src/utils/razorpay.ts - Utility helper for Razorpay Checkout Modal
export interface RazorpayPrefill {
  name?: string;
  email?: string;
  contact?: string;
}

export interface RazorpaySuccessResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface RazorpayOptions {
  key?: string;
  amount: number; // in paise
  currency?: string;
  name?: string;
  description?: string;
  image?: string;
  order_id: string;
  prefill?: RazorpayPrefill;
  notes?: Record<string, string>;
  theme?: {
    color?: string;
  };
  modal?: {
    ondismiss?: () => void;
    escape?: boolean;
    backdropclose?: boolean;
  };
}

/**
 * Ensures the Razorpay checkout script is loaded in the browser
 */
export const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(false);
      return;
    }

    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }

    const existingScript = document.getElementById("razorpay-checkout-script");
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(true));
      existingScript.addEventListener("error", () => resolve(false));
      return;
    }

    const script = document.createElement("script");
    script.id = "razorpay-checkout-script";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.error("Failed to load Razorpay SDK script");
      resolve(false);
    };

    document.body.appendChild(script);
  });
};

/**
 * Gets the configured Razorpay Key ID
 */
export const getRazorpayKey = (): string => {
  return (
    import.meta.env.VITE_RAZORPAY_KEY_ID ||
    "rzp_test_TTsnL7mJseMdFz"
  );
};

/**
 * Opens the Razorpay Checkout popup modal and returns a Promise with the payment result
 */
export const openRazorpayModal = async (
  options: Omit<RazorpayOptions, "key"> & { key?: string }
): Promise<RazorpaySuccessResponse> => {
  const loaded = await loadRazorpayScript();
  if (!loaded) {
    throw new Error("Razorpay SDK failed to load. Please check your internet connection.");
  }

  return new Promise((resolve, reject) => {
    const key = options.key || getRazorpayKey();

    const cleanContact = options.prefill?.contact
      ? String(options.prefill.contact).replace(/\D/g, "").slice(-10)
      : undefined;

    const rzpOptions: any = {
      key,
      amount: options.amount,
      currency: options.currency || "INR",
      name: options.name || "ApexBee",
      description: options.description || "Secure Payment",
      image: options.image || "/icon.jpeg",
      order_id: options.order_id,
      prefill: {
        ...(options.prefill || {}),
        contact: cleanContact || options.prefill?.contact || "",
      },
      notes: options.notes || {},
      theme: {
        color: options.theme?.color || "#0A1128",
      },
      handler: (response: RazorpaySuccessResponse) => {
        resolve(response);
      },
      modal: {
        ondismiss: () => {
          if (options.modal?.ondismiss) {
            options.modal.ondismiss();
          }
          reject(new Error("Payment cancelled by user"));
        },
        escape: options.modal?.escape ?? true,
        backdropclose: options.modal?.backdropclose ?? false,
      },
    };

    const rzp = new (window as any).Razorpay(rzpOptions);
    rzp.on("payment.failed", (response: any) => {
      console.error("Razorpay payment failed:", response.error);
      reject(new Error(response.error?.description || "Payment failed"));
    });

    rzp.open();
  });
};
