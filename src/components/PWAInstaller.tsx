"use client";

import { useEffect } from "react";

/**
 * PWA Service Worker Silent Registrar
 * Registers the service worker in the background without displaying intrusive banners.
 */
export function PWAInstaller() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          // Check for updates
          reg.update().catch(() => {});
        })
        .catch((err) => {
          console.warn("[PWA] Service Worker registration failed:", err);
        });
    }
  }, []);

  return null;
}
