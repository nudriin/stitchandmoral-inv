import { NextResponse } from "next/server";
import { checkDueRentalsAndSendPushAction } from "@/app/actions/notification";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const result = await checkDueRentalsAndSendPushAction();
    return NextResponse.json({ success: true, timestamp: new Date().toISOString(), result });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST() {
  return GET();
}
