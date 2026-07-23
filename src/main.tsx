// Auto-rewrite localhost:5500 to dynamic hostname to support offline testing
if (typeof window !== 'undefined') {
  const originalFetch = window.fetch;
  window.fetch = function (input, init) {
    if (typeof input === 'string' && input.includes('localhost:5500')) {
      const hostname = window.location.hostname || 'localhost';
      input = input.replace('localhost:5500', `${hostname}:5500`);
    }
    return originalFetch.call(this, input, init);
  };

  const originalOpen = window.XMLHttpRequest.prototype.open;
  window.XMLHttpRequest.prototype.open = function (method, url, ...args) {
    if (typeof url === 'string' && url.includes('localhost:5500')) {
      const hostname = window.location.hostname || 'localhost';
      url = url.replace('localhost:5500', `${hostname}:5500`);
    }
    return originalOpen.call(this, method, url, ...args as any);
  };
}

import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { GoogleOAuthProvider } from "@react-oauth/google";

const googleClientId = "185984914727-6aif53v76n329lp8a1dbu15nu0hcrf6k.apps.googleusercontent.com";

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