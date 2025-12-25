import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { checkRateLimit } from "@/lib/rate-limit-middleware";
import { RATE_LIMITS } from "@/lib/rate-limit";
import { deliverWebhook, WebhookEvent } from "@/lib/webhook";
import { notifyOnCaseEvent } from "@/lib/line-notification";

// GET /api/cases - List all cases with filters
export async function GET(request: NextRequest) {
  // Rate limit check
  const rateLimitResponse = await checkRateLimit(request, RATE_LIMITS.API);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const severity = searchParams.get("severity");
    const category = searchParams.get("category");
    const caseTypeId = searchParams.get("caseType");
    const search = searchParams.get("search");
    const sortParam = searchParams.get("sort") || "createdAt-desc";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const where: Prisma.CaseWhereInput = {};

    if (status && status !== "all") {
      // Support comma-separated status values (e.g., "INVESTIGATING,FIXING")
      if (status.includes(",")) {
        const statuses = status.split(",").map(s => s.trim());
        where.status = { in: statuses as ("NEW" | "INVESTIGATING" | "FIXING" | "WAITING_CUSTOMER" | "WAITING_PROVIDER" | "RESOLVED" | "CLOSED")[] };
      } else {
        where.status = status as Prisma.EnumCaseStatusFilter["equals"];
      }
    }

    if (severity && severity !== "all") {
      where.severity = severity as Prisma.EnumSeverityFilter["equals"];
    }

    if (category && category !== "all") {
      where.caseType = {
        category: category as Prisma.EnumCaseCategoryFilter["equals"],
      };
    }

    if (caseTypeId && caseTypeId !== "all") {
      where.caseTypeId = caseTypeId;
    }

    if (search) {
      where.OR = [
        { caseNumber: { contains: search, mode: "insensitive" } },
        { title: { contains: search, mode: "insensitive" } },
        { customerName: { contains: search, mode: "insensitive" } },
      ];
    }

    // Parse sort parameter
    const [sortField, sortOrder] = sortParam.split("-");
    const orderBy: Prisma.CaseOrderByWithRelationInput[] = [];
    
    if (sortField === "createdAt") {
      orderBy.push({ createdAt: sortOrder as "asc" | "desc" });
    } else if (sortField === "severity") {
      orderBy.push({ severity: "asc" }); // CRITICAL, HIGH, NORMAL, LOW
      orderBy.push({ createdAt: "desc" });
    } else if (sortField === "slaDeadline") {
      orderBy.push({ slaDeadline: "asc" }); // ใกล้หมดก่อน
      orderBy.push({ createdAt: "desc" });
    } else if (sortField === "status") {
      orderBy.push({ status: "asc" });
      orderBy.push({ createdAt: "desc" });
    } else {
      // Default
      orderBy.push({ severity: "asc" });
      orderBy.push({ createdAt: "desc" });
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
        orderBy,
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

    // Auto-assign to Support user with least active cases (if no ownerId provided)
    let autoAssignOwnerId: string | undefined;
    if (!body.ownerId) {
      const supportUsers = await prisma.user.findMany({
        where: {
          isActive: true,
          role: { in: ["SUPPORT", "MANAGER"] }, // Support or Manager roles
        },
        select: {
          id: true,
          name: true,
          _count: {
            select: {
              ownedCases: {
                where: {
                  status: { notIn: ["RESOLVED", "CLOSED"] },
                },
              },
            },
          },
        },
        orderBy: {
          ownedCases: { _count: "asc" }, // User with least cases first
        },
      });

      if (supportUsers.length > 0) {
        // Assign to user with least active cases
        autoAssignOwnerId = supportUsers[0].id;
      }
    }

    // Handle orders - connect existing or create new
    const ordersConnect: { id: string }[] = [];
    const ordersCreate: { orderId: string; amount: number; providerId?: string; status: "PENDING" }[] = [];
    
    if (body.orders && Array.isArray(body.orders)) {
      for (const orderData of body.orders) {
        if (orderData.orderId) {
          // Check if order already exists
          const existingOrder = await prisma.order.findUnique({
            where: { orderId: orderData.orderId },
          });
          
          if (existingOrder) {
            // Connect existing order
            ordersConnect.push({ id: existingOrder.id });
          } else {
            // Create new order with PENDING status
            ordersCreate.push({
              orderId: orderData.orderId,
              amount: orderData.amount || 0,
              providerId: orderData.providerId || body.providerId,
              status: "PENDING",
            });
          }
        }
      }
    }

    // Create case with orders
    const assignedOwnerId = body.ownerId || autoAssignOwnerId;
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
        ownerId: assignedOwnerId,
        slaDeadline,
        // Connect and create orders
        orders: {
          connect: ordersConnect,
          create: ordersCreate,
        },
      },
      include: {
        caseType: true,
        owner: true,
        provider: true,
        orders: true,
      },
    });

    // Build activity description
    const orderCount = ordersConnect.length + ordersCreate.length;
    let activityDescription = `เคสถูกสร้างจาก ${body.source || "Manual"}`;
    if (orderCount > 0) {
      const orderIds = newCase.orders?.map((o) => o.orderId).join(", ") || "";
      activityDescription += `\nOrders (${orderCount} รายการ): ${orderIds}`;
    }
    if (autoAssignOwnerId && newCase.owner) {
      activityDescription += `\nมอบหมายอัตโนมัติให้ ${newCase.owner.name}`;
    }

    // Create activity log
    await prisma.caseActivity.create({
      data: {
        caseId: newCase.id,
        type: "CREATED",
        title: "สร้างเคสใหม่",
        description: activityDescription,
      },
    });

    // If auto-assigned, also create an ASSIGNED activity
    if (autoAssignOwnerId && newCase.owner) {
      await prisma.caseActivity.create({
        data: {
          caseId: newCase.id,
          type: "ASSIGNED",
          title: `มอบหมายอัตโนมัติให้ ${newCase.owner.name}`,
          description: "ระบบมอบหมายให้ผู้ที่มีงานน้อยที่สุด",
        },
      });
    }

    // Trigger webhook (async, non-blocking)
    triggerWebhook(WebhookEvent.CASE_CREATED, {
      caseId: newCase.id,
      caseNumber: newCase.caseNumber,
      title: newCase.title,
      status: newCase.status,
      severity: newCase.severity,
    }).catch(console.error);

    // Send Line notification if enabled for this case type OR if auto-assigned
    if (caseType.lineNotification || autoAssignOwnerId) {
      notifyOnCaseEvent("case_created", {
        caseNumber: newCase.caseNumber,
        title: newCase.title,
        status: newCase.status,
        severity: newCase.severity,
        customerName: newCase.customerName || undefined,
        ownerName: newCase.owner?.name || undefined,
        providerName: newCase.provider?.name,
        slaDeadline: newCase.slaDeadline,
      }).catch(console.error);
    }

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
