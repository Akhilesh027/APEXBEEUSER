/**
 * Robust WhatsApp sharing and messaging utility.
 * Works seamlessly across Capacitor native Android/iOS apps, mobile browsers, and desktop web.
 */

export const isCapacitorApp = (): boolean => {
  if (typeof window === 'undefined') return false;
  const win = window as any;
  const cap = win.Capacitor;
  if (cap && typeof cap.isNativePlatform === 'function' && cap.isNativePlatform()) {
    return true;
  }
  if (cap && cap.isNative) {
    return true;
  }
  const origin = window.location.origin || '';
  if (
    origin.startsWith('capacitor:') ||
    origin.startsWith('ionic:') ||
    origin.startsWith('file:')
  ) {
    return true;
  }
  return false;
};

export const formatWhatsAppPhone = (phone?: string): string => {
  if (!phone) return '';
  const digits = phone.replace(/[^0-9]/g, '');
  if (!digits) return '';
  // If 10 digits (standard Indian mobile number without country code), prepend 91
  if (digits.length === 10) {
    return `91${digits}`;
  }
  return digits;
};

export interface OpenWhatsAppOptions {
  phone?: string;
  text?: string;
  url?: string;
  title?: string;
}

/**
 * Opens WhatsApp either to chat with a phone number or to share text/URL with any contact.
 * In native Capacitor apps, triggers the WhatsApp Android/iOS native intent scheme directly.
 * In web browsers, opens api.whatsapp.com with popup-blocker fallbacks.
 */
export const openWhatsApp = async (options: OpenWhatsAppOptions): Promise<boolean> => {
  const { phone, text = '', url = '', title = 'ApexBee Referral' } = options;

  const cleanUrl = (url || '').trim();
  const cleanText = (text || '').trim();
  const fullText = cleanUrl && !cleanText.includes(cleanUrl)
    ? (cleanText ? `${cleanText}\n${cleanUrl}` : cleanUrl)
    : (cleanText || cleanUrl);
  const encodedText = encodeURIComponent(fullText);
  const formattedPhone = formatWhatsAppPhone(phone);
  const isNative = isCapacitorApp();

  // 1. If targeting a specific phone number (Chat / Reminder)
  if (formattedPhone) {
    const schemeUrl = encodedText
      ? `whatsapp://send?phone=${formattedPhone}&text=${encodedText}`
      : `whatsapp://send?phone=${formattedPhone}`;

    const webUrl = encodedText
      ? `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodedText}`
      : `https://api.whatsapp.com/send?phone=${formattedPhone}`;

    if (isNative) {
      try {
        window.location.href = schemeUrl;
        return true;
      } catch (err) {
        console.warn('[openWhatsApp] Failed to launch whatsapp scheme, fallback to web:', err);
        window.location.href = webUrl;
        return true;
      }
    } else {
      const win = window.open(webUrl, '_blank', 'noopener,noreferrer');
      if (!win || win.closed || typeof win.closed === 'undefined') {
        window.location.href = webUrl;
      }
      return true;
    }
  }

  // 2. General sharing (e.g. Referral pitch, Product share to any WhatsApp contact)
  const schemeUrl = `whatsapp://send?text=${encodedText}`;
  const webUrl = `https://api.whatsapp.com/send?text=${encodedText}`;

  if (isNative) {
    try {
      // In native Android/iOS Capacitor app, navigating to whatsapp:// launches WhatsApp intent directly
      window.location.href = schemeUrl;
      return true;
    } catch (err) {
      console.warn('[openWhatsApp] Native scheme launch error:', err);
    }

    // Fallback to Web Share API if available
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title,
          text: fullText,
          url: url || undefined,
        });
        return true;
      } catch (shareErr: any) {
        if (shareErr?.name === 'AbortError') {
          return false;
        }
      }
    }

    // Final fallback to WhatsApp web URL
    window.location.href = webUrl;
    return true;
  }

  // On Web / Desktop Browser
  try {
    const win = window.open(webUrl, '_blank', 'noopener,noreferrer');
    if (!win || win.closed || typeof win.closed === 'undefined') {
      // Fallback if popup blocker intercepted
      window.location.href = webUrl;
    }
    return true;
  } catch {
    window.location.href = webUrl;
    return true;
  }
};
