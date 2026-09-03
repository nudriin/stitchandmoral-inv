"use client";

import { useState, useEffect } from "react";
import { Bell, BellRing, BellOff, Check, Loader2, Play } from "lucide-react";
import {
  saveSubscriptionAction,
  removeSubscriptionAction,
  sendTestNotificationAction,
  checkDueRentalsAndSendPushAction,
  PushSubscriptionPayload,
} from "@/app/actions/notification";
import { useDialog } from "@/components/ModalDialogProvider";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function NotificationManager() {
  const { showAlert } = useDialog();
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
      checkExistingSubscription();
    }
  }, []);

  // Background 12:00 PM auto-checker when PWA is running
  useEffect(() => {
    if (typeof window === "undefined") return;

    const checkDaily12Pm = async () => {
      const now = new Date();
      const todayStr = now.toISOString().split("T")[0];
      const lastCheckKey = "last_rental_check_date";
      const lastCheck = localStorage.getItem(lastCheckKey);

      // Trigger if it's 12:00 PM or later and hasn't checked today
      if (now.getHours() >= 12 && lastCheck !== todayStr) {
        try {
          await checkDueRentalsAndSendPushAction();
          localStorage.setItem(lastCheckKey, todayStr);
        } catch (e) {
          console.warn("Auto-check due returns error:", e);
        }
      }
    };

    checkDaily12Pm();
    const interval = setInterval(checkDaily12Pm, 60 * 1000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  async function checkExistingSubscription() {
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      setIsSubscribed(!!sub);
    } catch (e) {
      console.warn("Gagal mengecek subscription:", e);
    }
  }

  async function toggleSubscription() {
    setLoading(true);
    setMessage(null);

    try {
      const reg = await navigator.serviceWorker.ready;

      if (isSubscribed) {
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          await sub.unsubscribe();
          await removeSubscriptionAction(sub.endpoint);
        }
        setIsSubscribed(false);
        setMessage("Push notifikasi dinonaktifkan.");
      } else {
        const perm = await Notification.requestPermission();
        setPermission(perm);

        if (perm !== "granted") {
          showAlert({
            title: "Izin Notifikasi Ditolak",
            message: "Izin notifikasi ditolak. Harap izinkan notifikasi di pengaturan browser Anda.",
            type: "warning",
          });
          setLoading(false);
          return;
        }

        const vapidPublicKey =
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
          "BNdnfQMEcl50U0dScVA9O14VXfuK1mYvKVL57GSu3fGrM44U0tzR6RuNydqcsm0cbnRrmXgeGByiaARfIZWwfdY";

        const convertedKey = urlBase64ToUint8Array(vapidPublicKey);

        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedKey,
        });

        const subJson = sub.toJSON();
        const payload: PushSubscriptionPayload = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: subJson.keys?.p256dh || "",
            auth: subJson.keys?.auth || "",
          },
        };

        const res = await saveSubscriptionAction(payload);
        if (res.success) {
          setIsSubscribed(true);
          setMessage("Push notifikasi pengembalian jas (12:00 siang) berhasil diaktifkan!");
        } else {
          setMessage("Gagal menyimpan langganan notifikasi: " + res.error);
        }
      }
    } catch (err: any) {
      console.error("Error toggle subscription:", err);
      setMessage("Terjadi kesalahan: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  }

  async function handleTestPush() {
    setTesting(true);
    setMessage(null);

    try {
      // 1. Direct Service Worker local test (Works 100% instantly on device)
      if ("serviceWorker" in navigator) {
        const reg = await navigator.serviceWorker.ready;
        if (Notification.permission === "granted") {
          await reg.showNotification("🔔 Uji Push Notifikasi Berhasil!", {
            body: "Pengingat pengembalian jas (12:00 siang) Stitch & Moral siap beroperasi.",
            icon: "/icons/icon-192x192.png",
            badge: "/icons/icon-192x192.png",
            data: { url: "/transaksi" },
          } as any);
        }
      }

      // 2. Server-side Web Push broadcast
      const res = await sendTestNotificationAction();
      setMessage(res.message || "Uji notifikasi berhasil dikirim!");
    } catch (err: any) {
      console.error("Test notification error:", err);
      setMessage("Gagal menguji notifikasi: " + err.message);
    } finally {
      setTesting(false);
    }
  }

  if (!isSupported) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3.5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            {isSubscribed ? <BellRing className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-zinc-100 text-sm">
              Push Notifikasi Pengembalian Jas
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
              Otomatis mengingatkan jas yang wajib kembali setiap jam 12:00 siang
            </p>
          </div>
        </div>

        <button
          onClick={toggleSubscription}
          disabled={loading}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
            isSubscribed
              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
              : "bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-950 hover:bg-slate-800"
          }`}
        >
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : isSubscribed ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>Aktif</span>
            </>
          ) : (
            <span>Aktifkan</span>
          )}
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800 text-xs">
        <span className="text-slate-500 dark:text-zinc-400 text-[11px]">
          Status Izin: <b className="text-slate-700 dark:text-zinc-300">{permission.toUpperCase()}</b>
        </span>

        <button
          onClick={handleTestPush}
          disabled={testing}
          className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:hover:bg-indigo-900 dark:text-indigo-300 font-medium transition flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
        >
          {testing ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Play className="w-3.5 h-3.5 fill-current" />
          )}
          <span>Uji / Test Notifikasi Sekarang</span>
        </button>
      </div>

      {message && (
        <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 p-2.5 rounded-lg border border-emerald-200 dark:border-emerald-800/50">
          {message}
        </p>
      )}
    </div>
  );
}
