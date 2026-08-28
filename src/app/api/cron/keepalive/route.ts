import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createAnonClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const startTime = Date.now();
  
  // Verify Cron Secret if set
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const adminClient = createAdminClient();

    // 1. Fetch credentials
    const { data: settingsData } = await adminClient
      .from("pengaturan")
      .select("key, value, kunci, nilai");

    let adminEmail = process.env.ADMIN_EMAIL || "admin@stitchandmoral.com";
    let adminPassword = process.env.ADMIN_PASSWORD || "admin123456";

    if (settingsData && settingsData.length > 0) {
      settingsData.forEach((row) => {
        const k = row.key || row.kunci;
        const v = row.value || row.nilai;
        if (k === "admin_email") adminEmail = v;
        if (k === "admin_password") adminPassword = v;
      });
    }

    // 2. Perform Supabase Auth login to trigger auth activity
    const anonClient = createAnonClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: authData, error: authError } = await anonClient.auth.signInWithPassword({
      email: adminEmail,
      password: adminPassword,
    });

    let authStatus = "OK";
    if (authError) {
      authStatus = `Warning: ${authError.message}`;
    } else {
      await anonClient.auth.signOut();
    }

    // 3. Update keepalive timestamp in database
    const nowIso = new Date().toISOString();
    await adminClient.from("pengaturan").upsert(
      {
        kunci: "last_supabase_keepalive",
        nilai: JSON.stringify({
          timestamp: nowIso,
          status: authStatus,
          durationMs: Date.now() - startTime,
          triggeredVia: "api_route",
        }),
        updated_at: nowIso,
      },
      { onConflict: "kunci" }
    );

    // 4. Quick count check
    const { count: txCount } = await adminClient.from("transaksi").select("*", { count: "exact", head: true });
    const { count: invCount } = await adminClient.from("inventori").select("*", { count: "exact", head: true });

    return NextResponse.json({
      success: true,
      message: "Supabase Keepalive & Auto-Login executed successfully.",
      timestamp: nowIso,
      durationMs: Date.now() - startTime,
      authStatus,
      userId: authData?.user?.id || null,
      stats: {
        totalTransaksi: txCount || 0,
        totalInventori: invCount || 0,
      },
    });
  } catch (err: any) {
    console.error("Keepalive API Error:", err);
    return NextResponse.json(
      {
        success: false,
        error: err.message || "Keepalive execution failed.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  return GET(request);
}
