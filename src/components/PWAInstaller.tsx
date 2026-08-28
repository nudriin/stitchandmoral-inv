"use client";

import { useEffect, useState } from "react";
import { Download, Share2, X, Smartphone, Sparkles, CheckCircle } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PWAInstaller() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [installedSuccess, setInstalledSuccess] = useState(false);

  useEffect(() => {
    // 1. Register Service Worker
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("[PWA] Service Worker registered:", reg.scope);
        })
        .catch((err) => {
          console.warn("[PWA] Service Worker registration failed:", err);
        });
    }

    // 2. Check if already running in standalone mode (installed)
    const isRunningStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    setIsStandalone(isRunningStandalone);
    if (isRunningStandalone) return;

    // 3. Detect iOS Safari
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // 4. Capture beforeinstallprompt for Android / Chromium
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
      // Check if user previously dismissed
      const dismissed = localStorage.getItem("pwa_dismissed");
      if (!dismissed) {
        setShowBanner(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // 5. Detect App Installed Event
    const handleAppInstalled = () => {
      setInstalledSuccess(true);
      setShowBanner(false);
      setInstallPrompt(null);
      setTimeout(() => setInstalledSuccess(false), 4000);
    };

    window.addEventListener("appinstalled", handleAppInstalled);

    // Show iOS banner if on iOS device and not standalone
    if (isIosDevice && !isRunningStandalone) {
      const dismissed = localStorage.getItem("pwa_dismissed");
      if (!dismissed) {
        setShowBanner(true);
      }
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  async function handleInstallClick() {
    if (installPrompt) {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setInstallPrompt(null);
        setShowBanner(false);
      }
    } else if (isIOS) {
      setShowIOSGuide(true);
    }
  }

  function handleDismiss() {
    setShowBanner(false);
    localStorage.setItem("pwa_dismissed", "true");
  }

  if (isStandalone) {
    return null;
  }

  return (
    <>
      {/* Toast Notification for Success */}
      {installedSuccess && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-semibold animate-bounce">
          <CheckCircle className="w-4 h-4" />
          <span>Aplikasi Stitch &amp; Moral berhasil di-install ke layar utama!</span>
        </div>
      )}

      {/* Floating Install Prompt Banner (Mobile & Desktop) */}
      {showBanner && (
        <div className="fixed bottom-20 md:bottom-6 left-3 right-3 sm:left-auto sm:right-6 sm:max-w-md z-40 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="bg-slate-900/95 dark:bg-zinc-900/95 backdrop-blur-md text-white border border-slate-700/80 dark:border-zinc-700/80 rounded-3xl p-4 shadow-2xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-slate-950 font-bold shadow-md shrink-0">
                <Smartphone className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-xs sm:text-sm text-white flex items-center gap-1.5">
                  Install Aplikasi Mobile
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                </h4>
                <p className="text-[11px] text-slate-300 dark:text-zinc-400 truncate">
                  Akses instan &amp; layar penuh tanpa browser
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={handleInstallClick}
                className="px-3.5 py-2 rounded-xl bg-white text-slate-950 font-bold text-xs hover:bg-slate-100 transition shadow-sm cursor-pointer flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Install</span>
              </button>
              <button
                onClick={handleDismiss}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white transition cursor-pointer"
                title="Tutup banner"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* iOS Installation Instruction Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl w-full max-w-sm p-6 shadow-2xl text-center space-y-4 animate-in slide-in-from-bottom duration-300">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-500 mx-auto flex items-center justify-center">
              <Smartphone className="w-7 h-7" />
            </div>

            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-zinc-100">
                Install di iPhone / iPad
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                Ikuti 2 langkah mudah berikut untuk menambahkan ke Layar Utama:
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-zinc-950/60 p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 text-left text-xs space-y-3">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                  1
                </span>
                <p className="text-slate-700 dark:text-zinc-300">
                  Ketuk tombol <b>Bagikan (Share)</b> <Share2 className="w-3.5 h-3.5 inline mx-1 text-indigo-500" /> di bilah bawah browser Safari.
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                  2
                </span>
                <p className="text-slate-700 dark:text-zinc-300">
                  Gulir ke bawah dan pilih <b>Tambah ke Layar Utama (Add to Home Screen)</b> ➕.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-950 font-bold text-xs transition cursor-pointer"
            >
              Mengerti &amp; Tutup
            </button>
          </div>
        </div>
      )}
    </>
  );
}
