import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { checkRateLimit } from "@/lib/rate-limit-middleware";
import { RATE_LIMITS } from "@/lib/rate-limit";
import { randomBytes } from "crypto";

// GET /api/webhooks - List all webhooks
export async function GET(request: NextRequest) {
  // Rate limit check
  const rateLimitResponse = await checkRateLimit(request, RATE_LIMITS.API);
  if (rateLimitResponse) return rateLimitResponse;

  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "CEO") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const webhooks = await prisma.webhook.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(webhooks);
  } catch (error) {
    console.error("Error fetching webhooks:", error);
    return NextResponse.json(
      { error: "Failed to fetch webhooks" },
      { status: 500 }
    );
  }
}

// POST /api/webhooks - Create new webhook
export async function POST(request: NextRequest) {
  // Rate limit check
  const rateLimitResponse = await checkRateLimit(request, RATE_LIMITS.API);
  if (rateLimitResponse) return rateLimitResponse;

  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "CEO") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();

    // Generate secret if not provided
    const secret = body.secret || randomBytes(32).toString("hex");

    const webhook = await prisma.webhook.create({
      data: {
        name: body.name,
        url: body.url,
        secret,
        events: body.events || [],
        description: body.description,
        headers: body.headers,
        isActive: body.isActive ?? true,
        retryCount: body.retryCount ?? 3,
        timeout: body.timeout ?? 10000,
      },
    });

    return NextResponse.json(webhook, { status: 201 });
  } catch (error) {
    console.error("Error creating webhook:", error);
    return NextResponse.json(
      { error: "Failed to create webhook" },
      { status: 500 }
    );
  }
}

