
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