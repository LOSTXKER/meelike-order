import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/dashboard - Get dashboard statistics
export async function GET() {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Get counts
    const [
      totalCases,
      newCases,
      inProgressCases,
      resolvedToday,
      slaMissed,
      casesByStatus,
      casesBySeverity,
      recentCases,
      criticalCases,
      providersWithIssues,
      // Order stats
      totalOrders,
      ordersByStatus,
      // Cases awaiting customer notification (Admin needs to notify)
      casesAwaitingNotification,
      awaitingNotificationCases,
    ] = await Promise.all([
      // Total cases (excluding deleted)
      prisma.case.count({ where: { isDeleted: false } }),

      // New cases
      prisma.case.count({ where: { isDeleted: false, status: "NEW" } }),

      // In progress cases
      prisma.case.count({
        where: {
          isDeleted: false,
          status: { in: ["INVESTIGATING", "WAITING_CUSTOMER", "WAITING_PROVIDER", "FIXING"] },
        },
      }),

      // Resolved today
      prisma.case.count({
        where: {
          isDeleted: false,
          resolvedAt: { gte: todayStart },
        },
      }),

      // SLA missed
      prisma.case.count({
        where: {
          isDeleted: false,
          slaMissed: true,
          status: { notIn: ["RESOLVED", "CLOSED"] },
        },
      }),

      // Cases by status
      prisma.case.groupBy({
        by: ["status"],
        where: { isDeleted: false },
        _count: { id: true },
      }),

      // Cases by severity
      prisma.case.groupBy({
        by: ["severity"],
        where: { isDeleted: false },
        _count: { id: true },
      }),

      // Recent cases
      prisma.case.findMany({
        where: { isDeleted: false },
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          caseType: { select: { name: true } },
          owner: { select: { name: true } },
        },
      }),

      // Critical cases
      prisma.case.findMany({
        where: {
          isDeleted: false,
          severity: "CRITICAL",
          status: { notIn: ["RESOLVED", "CLOSED"] },
        },
        take: 3,
        orderBy: { createdAt: "desc" },
      }),

      // Providers with issues
      prisma.provider.findMany({
        where: {
          cases: {
            some: {
              isDeleted: false,
              status: { notIn: ["RESOLVED", "CLOSED"] },
            },
          },
        },
        select: {
          id: true,
          name: true,
          riskLevel: true,
          _count: {
            select: {
              cases: {
                where: {
                  isDeleted: false,
                  status: { notIn: ["RESOLVED", "CLOSED"] },
                },
              },
            },
          },
        },
        orderBy: {
          cases: { _count: "desc" },
        },
        take: 5,
      }),

      // Total orders
      prisma.order.count(),

      // Orders by status
      prisma.order.groupBy({
        by: ["status"],
        _count: { id: true },
      }),

      // Count of cases awaiting customer notification (RESOLVED but not CLOSED)
      prisma.case.count({
        where: {
          isDeleted: false,
          status: "RESOLVED",
        },
      }),

      // List of cases awaiting customer notification
      prisma.case.findMany({
        where: {
          isDeleted: false,
          status: "RESOLVED",
        },
        take: 10,
        orderBy: { resolvedAt: "desc" },
        include: {
          caseType: { select: { name: true } },
          owner: { select: { name: true } },
        },
      }),
    ]);

    // Transform data
    const statusCounts: Record<string, number> = {};
    casesByStatus.forEach((item) => {
      statusCounts[item.status] = item._count.id;
    });

    const severityCounts: Record<string, number> = {};
    casesBySeverity.forEach((item) => {
      severityCounts[item.severity] = item._count.id;
    });

    // Transform order stats
    const orderStatusCounts: Record<string, number> = {};
    ordersByStatus.forEach((item) => {
      orderStatusCounts[item.status] = item._count.id;
    });

    return NextResponse.json({
      totalCases,
      newCases,
      inProgressCases,
      resolvedToday,
      slaMissed,
      casesByStatus: statusCounts,
      casesBySeverity: severityCounts,
      recentCases,
      criticalCases,
      providersWithIssues,
      // Order stats
      totalOrders,
      ordersByStatus: orderStatusCounts,
      pendingOrders: orderStatusCounts["PENDING"] || 0,
      processingOrders: orderStatusCounts["PROCESSING"] || 0,
      completedOrders: orderStatusCounts["COMPLETED"] || 0,
      refundedOrders: orderStatusCounts["REFUNDED"] || 0,
      failedOrders: orderStatusCounts["FAILED"] || 0,
      // Cases awaiting customer notification (for Admin)
      casesAwaitingNotification,
      awaitingNotificationCases,
    });
  } catch (error) {
    console.error("Error fetching dashboard:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}

