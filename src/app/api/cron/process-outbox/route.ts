import { NextResponse } from "next/server";
import { processLineNotificationOutbox } from "@/lib/line-notification";

/**
 * Background job endpoint to process Line notification outbox
 * This should be called by a cron job (Supabase Edge Functions cron or external)
 */
export async function POST() {
  try {
    await processLineNotificationOutbox();
    return NextResponse.json({ success: true, message: "Outbox processed" });
  } catch (error: any) {
    console.error("Error processing outbox:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// For testing purposes - can be called manually
export async function GET() {
  try {
    await processLineNotificationOutbox();
    return NextResponse.json({ success: true, message: "Outbox processed" });
  } catch (error: any) {
    console.error("Error processing outbox:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}


