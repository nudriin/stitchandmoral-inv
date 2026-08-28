"use server";

import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

function timingSafeMatch(a: string, b: string): boolean {
  if (!a || !b || a.length !== b.length) return false;
  try {
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

export async function login(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email dan password wajib diisi." };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message || "Email atau password salah." };
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function loginWithPin(pin: string) {
  // 1. Validasi input: harus murni 6 digit angka
  if (!pin || !/^\d{6}$/.test(pin)) {
    return { error: "PIN harus terdiri dari 6 digit angka." };
  }

  // 2. Ambil data kredensial dan PIN dari tabel database `pengaturan`
  const adminDb = createAdminClient();
  const { data: settingsData, error: fetchErr } = await adminDb
    .from("pengaturan")
    .select("key, value")
    .in("key", ["app_pin", "admin_email", "admin_password"]);

  if (fetchErr || !settingsData || settingsData.length === 0) {
    return { error: "Gagal memuat pengaturan keamanan dari database." };
  }

  const settingsMap: Record<string, string> = {};
  settingsData.forEach((row) => {
    settingsMap[row.key] = row.value;
  });

  const validPin = settingsMap["app_pin"];
  const adminEmail = settingsMap["admin_email"];
  const adminPassword = settingsMap["admin_password"];

  if (!validPin || !adminEmail || !adminPassword) {
    return { error: "Kredensial PIN di database belum dikonfigurasi." };
  }

  // 3. Constant-time comparison (mencegah timing attack)
  if (!timingSafeMatch(pin, validPin)) {
    return { error: "PIN 6 digit tidak sesuai. Silakan coba lagi." };
  }

  // 4. Inisialisasi sesi login resmi via Supabase Auth
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: adminEmail,
    password: adminPassword,
  });

  if (error) {
    return { error: "Autentikasi akun gagal: " + error.message };
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
