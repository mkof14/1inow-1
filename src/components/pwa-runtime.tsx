import { useEffect } from "react";

export function PwaRuntime() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    if (import.meta.env.DEV) return;

    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch((error) => {
      console.warn("[pwa] service worker registration failed", error);
    });
  }, []);

  return null;
}
