import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { deliverWebhook, WebhookEvent } from "@/lib/webhook";

// POST /api/webhooks/[id]/test - Test webhook delivery
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "CEO") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const webhook = await prisma.webhook.findUnique({
      where: { id },
    });

    if (!webhook) {
      return NextResponse.json({ error: "Webhook not found" }, { status: 404 });
    }

    // Send test payload
    const result = await deliverWebhook(
      webhook.url,
      {
        event: WebhookEvent.CASE_CREATED,
        timestamp: new Date().toISOString(),
        data: {
          caseId: "test-case-id",
          caseNumber: "TEST-2025-0001",
          title: "Test webhook delivery",
          status: "NEW",
          severity: "NORMAL",
        },
      },
      webhook.secret
    );

    // Update webhook stats
    if (result.success) {
      await prisma.webhook.update({
        where: { id },
        data: {
          lastSuccess: new Date(),
          failureCount: 0,
        },
      });
    } else {
      await prisma.webhook.update({
        where: { id },
        data: {
          lastFailure: new Date(),
          failureCount: { increment: 1 },
        },
      });
    }

    return NextResponse.json({
      success: result.success,
      statusCode: result.statusCode,
      error: result.error,
    });
  } catch (error) {
    console.error("Error testing webhook:", error);
    return NextResponse.json(
      { error: "Failed to test webhook" },
      { status: 500 }
    );
  }
}



