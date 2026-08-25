// Auto-rewrite localhost:5500 to production server https://server.apexbee.in
if (typeof window !== 'undefined') {
  const originalFetch = window.fetch;
  window.fetch = function (input, init) {
    if (typeof input === 'string' && (input.includes('localhost:5500') || input.includes('127.0.0.1:5500'))) {
      input = input.replace(/http:\/\/(localhost|127\.0\.0\.1):5500/g, 'https://server.apexbee.in').replace(/(localhost|127\.0\.0\.1):5500/g, 'server.apexbee.in');
    }
    return originalFetch.call(this, input, init);
  };

  const originalOpen = window.XMLHttpRequest.prototype.open;
  (window.XMLHttpRequest.prototype as any).open = function (method: any, url: any, ...args: any[]) {
    if (typeof url === 'string' && (url.includes('localhost:5500') || url.includes('127.0.0.1:5500'))) {
      url = url.replace(/http:\/\/(localhost|127\.0\.0\.1):5500/g, 'https://server.apexbee.in').replace(/(localhost|127\.0\.0\.1):5500/g, 'server.apexbee.in');
    }
    return (originalOpen as any).apply(this, [method, url, ...args]);
  };
}

import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { GoogleOAuthProvider } from "@react-oauth/google";

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "185984914727-6aif53v76n329lp8a1dbu15nu0hcrf6k.apps.googleusercontent.com";

createRoot(document.getElementById("root")!).render(
  <GoogleOAuthProvider clientId={googleClientId}>
    <App />
  </GoogleOAuthProvider>
);

// Register PWA Service Worker for App & Web installation
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").then((reg) => {
      console.log("ApexBee PWA Service Worker active:", reg.scope);
    }).catch((err) => {
      console.log("Service Worker registration failed:", err);
    });
  });
}