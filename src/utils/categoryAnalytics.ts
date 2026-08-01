/**
 * ApexBee Category Click Analytics Tracker
 * Fire-and-forget — never blocks navigation.
 */

const API_BASE = import.meta.env.VITE_API_URL || 'https://server.apexbee.in/api';

let anonSessionId: string | null = null;

const getSessionId = (): string => {
  if (anonSessionId) return anonSessionId;
  let sid = sessionStorage.getItem('apexbee_anon_sid');
  if (!sid) {
    sid = 'anon-' + Math.random().toString(36).substring(2, 15);
    sessionStorage.setItem('apexbee_anon_sid', sid);
  }
  anonSessionId = sid;
  return sid;
};

export interface CategoryClickPayload {
  /** Human-readable category name, e.g. "Daily Needs" */
  categoryName: string;
  /** Full route being navigated to, e.g. "/category/🛒 Daily Needs" */
  targetPath: string;
  /** UI surface: 'shortcut_grid' | 'banner' | 'category_page' | 'navbar' | etc. */
  source?: string;
  /** The current page pathname where the click happened */
  fromPath?: string;
}

export const trackCategoryClick = (payload: CategoryClickPayload): void => {
  // Fire-and-forget, no await needed
  const token = localStorage.getItem('token');

  fetch(`${API_BASE}/analytics/category-click`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      eventName: 'category_clicked',
      anonymousSessionId: getSessionId(),
      metadata: {
        categoryName: payload.categoryName,
        targetPath: payload.targetPath,
        source: payload.source || 'unknown',
        fromPath: payload.fromPath || window.location.pathname,
      },
    }),
  }).catch(() => {
    // silently ignore — never block navigation
  });
};
