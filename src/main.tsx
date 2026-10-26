
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { GoogleOAuthProvider } from "@react-oauth/google";

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "716798071591-jrthopm7ggscqnfhl9tvb5teg9sbvg2r.apps.googleusercontent.com";

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