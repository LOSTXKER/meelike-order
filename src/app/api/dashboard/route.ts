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
    ] = await Promise.all([
      // Total cases
      prisma.case.count(),

      // New cases
      prisma.case.count({ where: { status: "NEW" } }),

      // In progress cases
      prisma.case.count({
        where: {
          status: { in: ["INVESTIGATING", "WAITING_CUSTOMER", "WAITING_PROVIDER", "FIXING"] },
        },
      }),

      // Resolved today
      prisma.case.count({
        where: {
          resolvedAt: { gte: todayStart },
        },
      }),

      // SLA missed
      prisma.case.count({
        where: {
          slaMissed: true,
          status: { notIn: ["RESOLVED", "CLOSED"] },
        },
      }),

      // Cases by status
      prisma.case.groupBy({
        by: ["status"],
        _count: { id: true },
      }),

      // Cases by severity
      prisma.case.groupBy({
        by: ["severity"],
        _count: { id: true },
      }),

      // Recent cases
      prisma.case.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
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

    return NextResponse.json({
      totalCases,
      newCases,
      inProgressCases,
      resolvedToday,
      slaMissed,
      casesByStatus: statusCounts,
      casesBySeverity: severityCounts,
      recentCases,
    });
  } catch (error) {
    console.error("Error fetching dashboard:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}

