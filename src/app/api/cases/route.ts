import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { checkRateLimit } from "@/lib/rate-limit-middleware";
import { RATE_LIMITS } from "@/lib/rate-limit";
import { deliverWebhook, WebhookEvent } from "@/lib/webhook";

// GET /api/cases - List all cases with filters
export async function GET(request: NextRequest) {
  // Rate limit check
  const rateLimitResponse = await checkRateLimit(request, RATE_LIMITS.API);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const severity = searchParams.get("severity");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const where: Prisma.CaseWhereInput = {};

    if (status && status !== "all") {
      where.status = status as Prisma.EnumCaseStatusFilter["equals"];
    }

    if (severity && severity !== "all") {
      where.severity = severity as Prisma.EnumSeverityFilter["equals"];
    }

    if (search) {
      where.OR = [
        { caseNumber: { contains: search, mode: "insensitive" } },
        { title: { contains: search, mode: "insensitive" } },
        { customerName: { contains: search, mode: "insensitive" } },
      ];
    }

    const [cases, total] = await Promise.all([
      prisma.case.findMany({
        where,
        include: {
          caseType: {
            select: { id: true, name: true, category: true },
          },
          owner: {
            select: { id: true, name: true },
          },
          provider: {
            select: { id: true, name: true },
          },
        },
        orderBy: [
          { severity: "asc" }, // Critical first
          { createdAt: "desc" },
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.case.count({ where }),
    ]);

    return NextResponse.json({
      cases,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching cases:", error);
    return NextResponse.json(
      { error: "Failed to fetch cases" },
      { status: 500 }
    );
  }
}

// POST /api/cases - Create a new case
export async function POST(request: NextRequest) {
  // Rate limit check
  const rateLimitResponse = await checkRateLimit(request, RATE_LIMITS.API);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const body = await request.json();

    // Get case type for default values
    const caseType = await prisma.caseType.findUnique({
      where: { id: body.caseTypeId },
    });

    if (!caseType) {
      return NextResponse.json(
        { error: "Case type not found" },
        { status: 400 }
      );
    }

    // Generate case number
    const today = new Date();
    const year = today.getFullYear();
    const count = await prisma.case.count({
      where: {
        createdAt: {
          gte: new Date(year, 0, 1),
        },
      },
    });
    const caseNumber = `CASE-${year}-${String(count + 1).padStart(4, "0")}`;

    // Calculate SLA deadline
    const slaDeadline = new Date(
      Date.now() + caseType.defaultSlaMinutes * 60 * 1000
    );

    // Create case
    const newCase = await prisma.case.create({
      data: {
        caseNumber,
        title: body.title,
        description: body.description,
        source: body.source || "MANUAL",
        caseTypeId: body.caseTypeId,
        severity: body.severity || caseType.defaultSeverity,
        customerName: body.customerName,
        customerId: body.customerId,
        customerContact: body.customerContact,
        providerId: body.providerId,
        slaDeadline,
      },
      include: {
        caseType: true,
        owner: true,
        provider: true,
      },
    });

    // Create activity log
    await prisma.caseActivity.create({
      data: {
        caseId: newCase.id,
        type: "CREATED",
        title: "สร้างเคสใหม่",
        description: `เคสถูกสร้างจาก ${body.source || "Manual"}`,
      },
    });

    // Trigger webhook (async, non-blocking)
    triggerWebhook(WebhookEvent.CASE_CREATED, {
      caseId: newCase.id,
      caseNumber: newCase.caseNumber,
      title: newCase.title,
      status: newCase.status,
      severity: newCase.severity,
    }).catch(console.error);

    return NextResponse.json(newCase, { status: 201 });
  } catch (error) {
    console.error("Error creating case:", error);
    return NextResponse.json(
      { error: "Failed to create case" },
      { status: 500 }
    );
  }
}

/**
 * Helper to trigger webhooks for active endpoints
 */
async function triggerWebhook(event: WebhookEvent, data: any) {
  try {
    const webhooks = await prisma.webhook.findMany({
      where: {
        isActive: true,
        events: {
          has: event,
        },
      },
    });

    for (const webhook of webhooks) {
      deliverWebhook(
        webhook.url,
        {
          event,
          timestamp: new Date().toISOString(),
          data,
        },
        webhook.secret
      ).catch(console.error);
    }
  } catch (error) {
    console.error("Error triggering webhooks:", error);
  }
}
