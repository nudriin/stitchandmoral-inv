"use server";

import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatDateIndo } from "@/lib/utils";

const VAPID_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
  "BNdnfQMEcl50U0dScVA9O14VXfuK1mYvKVL57GSu3fGrM44U0tzR6RuNydqcsm0cbnRrmXgeGByiaARfIZWwfdY";
const VAPID_PRIVATE_KEY =
  process.env.VAPID_PRIVATE_KEY || "xDjNTQQOo_WtUZm1l6JuocITfS-J0e1L3RQoXyiUDDA";

webpush.setVapidDetails(
  "mailto:admin@stitchandmoral.com",
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

export type PushSubscriptionPayload = {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
};

/**
 * Retrieves all stored Push Subscriptions from Supabase `pengaturan`
 */
async function getStoredSubscriptions(): Promise<PushSubscriptionPayload[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("pengaturan")
    .select("nilai")
    .eq("kunci", "push_subscriptions")
    .single();

  if (!data?.nilai) return [];
  try {
    const list = JSON.parse(data.nilai);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

/**
 * Saves a new device Push Subscription
 */
export async function saveSubscriptionAction(sub: PushSubscriptionPayload) {
  if (!sub || !sub.endpoint) return { success: false, error: "Subscription tidak valid." };

  const supabase = createAdminClient();
  const currentSubs = await getStoredSubscriptions();

  // Deduplicate by endpoint
  const filtered = currentSubs.filter((s) => s.endpoint !== sub.endpoint);
  filtered.push(sub);

  const { error } = await supabase.from("pengaturan").upsert(
    {
      kunci: "push_subscriptions",
      nilai: JSON.stringify(filtered),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "kunci" }
  );

  if (error) {
    console.error("Gagal menyimpan push subscription:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Removes a device Push Subscription
 */
export async function removeSubscriptionAction(endpoint: string) {
  if (!endpoint) return { success: false };

  const supabase = createAdminClient();
  const currentSubs = await getStoredSubscriptions();
  const filtered = currentSubs.filter((s) => s.endpoint !== endpoint);

  await supabase.from("pengaturan").upsert(
    {
      kunci: "push_subscriptions",
      nilai: JSON.stringify(filtered),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "kunci" }
  );

  return { success: true };
}

/**
 * Sends a Push Notification payload to all registered subscriptions
 */
async function broadcastPushNotification(payload: {
  title: string;
  body: string;
  icon?: string;
  url?: string;
}) {
  const subs = await getStoredSubscriptions();
  if (!subs.length) {
    return { sent: 0, failed: 0, total: 0 };
  }

  const results = await Promise.allSettled(
    subs.map((sub) =>
      webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: sub.keys,
        },
        JSON.stringify(payload)
      )
    )
  );

  let sent = 0;
  let failed = 0;
  const invalidEndpoints: string[] = [];

  results.forEach((res, index) => {
    if (res.status === "fulfilled") {
      sent++;
    } else {
      failed++;
      const statusCode = (res.reason as any)?.statusCode;
      if (statusCode === 404 || statusCode === 410) {
        // Expired or unsubscribed
        invalidEndpoints.push(subs[index].endpoint);
      }
    }
  });

  // Cleanup expired subscriptions
  if (invalidEndpoints.length > 0) {
    const supabase = createAdminClient();
    const remaining = subs.filter((s) => !invalidEndpoints.includes(s.endpoint));
    await supabase.from("pengaturan").upsert(
      {
        kunci: "push_subscriptions",
        nilai: JSON.stringify(remaining),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "kunci" }
    );
  }

  return { sent, failed, total: subs.length };
}

/**
 * Action to test push notifications
 */
export async function sendTestNotificationAction() {
  const result = await broadcastPushNotification({
    title: "🔔 Uji Push Notifikasi Berhasil!",
    body: "Sistem pengingat pengembalian jas Stitch & Moral siap beroperasi pada jam 12:00 siang.",
    icon: "/icons/icon-192x192.png",
    url: "/transaksi",
  });

  return {
    success: true,
    message: `Notifikasi terkirim ke ${result.sent} dari ${result.total} perangkat terdaftar.`,
    details: result,
  };
}

/**
 * Checks for rental items due today and sends push reminder
 */
export async function checkDueRentalsAndSendPushAction() {
  const supabase = createAdminClient();
  
  // Format today's date YYYY-MM-DD
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];

  // Query rentals where status is 'Sedang Disewa' and tanggal_kembali is today or overdue
  const { data: rentals, error } = await supabase
    .from("transaksi")
    .select("id, kode_transaksi, nama_customer, tanggal_kembali, status")
    .eq("status", "Sedang Disewa")
    .lte("tanggal_kembali", todayStr);

  if (error) {
    console.error("Gagal memeriksa transaksi pengembalian:", error);
    return { success: false, error: error.message };
  }

  if (!rentals || rentals.length === 0) {
    return {
      success: true,
      count: 0,
      message: "Tidak ada jas yang wajib dikembalikan hari ini.",
    };
  }

  const count = rentals.length;
  const sampleNames = rentals
    .slice(0, 3)
    .map((r) => r.nama_customer)
    .join(", ");
  const extra = count > 3 ? ` dan ${count - 3} lainnya` : "";

  const title = `⚠️ Pengingat Pengembalian Jas (${count} Unit)`;
  const body = `Hari ini (${formatDateIndo(todayStr)}) ada ${count} transaksi wajib kembali: ${sampleNames}${extra}.`;

  const pushResult = await broadcastPushNotification({
    title,
    body,
    icon: "/icons/icon-192x192.png",
    url: "/transaksi",
  });

  return {
    success: true,
    count,
    message: `Pengingat terkirim untuk ${count} transaksi ke ${pushResult.sent} perangkat.`,
    rentals,
    details: pushResult,
  };
}
