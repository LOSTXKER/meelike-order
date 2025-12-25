import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { startOfMonth, endOfMonth, subMonths, format } from "date-fns";

export async function GET() {
  try {
    const now = new Date();
    const thisMonthStart = startOfMonth(now);
    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const lastMonthEnd = endOfMonth(subMonths(now, 1));

    // Get cases by status (excluding deleted)
    const casesByStatus = await prisma.case.groupBy({
      by: ["status"],
      where: { isDeleted: false },
      _count: { id: true },
    });

    // Get cases by severity
    const casesBySeverity = await prisma.case.groupBy({
      by: ["severity"],
      where: { isDeleted: false },
      _count: { id: true },
    });

    // Get cases by category
    const casesByCategory = await prisma.case.groupBy({
      by: ["caseTypeId"],
      where: { isDeleted: false },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 10,
    });

    const caseTypeIds = casesByCategory.map((c) => c.caseTypeId);
    const caseTypes = await prisma.caseType.findMany({
      where: { id: { in: caseTypeIds } },
      select: { id: true, name: true, category: true },
    });

    // Get monthly trend (last 6 months)
    const monthlyData = await Promise.all(
      Array.from({ length: 6 }, (_, i) => {
        const monthStart = startOfMonth(subMonths(now, 5 - i));
        const monthEnd = endOfMonth(subMonths(now, 5 - i));

        return prisma.case
          .findMany({
            where: {
              isDeleted: false,
              createdAt: { gte: monthStart, lte: monthEnd },
            },
            select: { status: true, createdAt: true },
          })
          .then((cases) => ({
            month: format(monthStart, "MMM yyyy"),
            total: cases.length,
            resolved: cases.filter((c) => c.status === "RESOLVED" || c.status === "CLOSED").length,
          }));
      })
    );

    // Get resolution time stats
    const resolvedCases = await prisma.case.findMany({
      where: {
        isDeleted: false,
        resolvedAt: { not: null },
        status: { in: ["RESOLVED", "CLOSED"] },
      },
      select: {
        createdAt: true,
        resolvedAt: true,
      },
    });

    const resolutionTimes = resolvedCases
      .map((c) => {
        if (!c.resolvedAt) return 0;
        return Math.floor((c.resolvedAt.getTime() - c.createdAt.getTime()) / (1000 * 60));
      })
      .filter((t) => t > 0);

    const avgResolutionTime = resolutionTimes.length > 0
      ? Math.round(resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length)
      : 0;

    // Get SLA compliance
    const casesWithSLA = await prisma.case.findMany({
      where: {
        isDeleted: false,
        slaDeadline: { not: null },
        status: { in: ["RESOLVED", "CLOSED"] },
      },
      select: {
        slaDeadline: true,
        resolvedAt: true,
        slaMissed: true,
      },
    });

    const slaCompliance = casesWithSLA.length > 0
      ? Math.round((casesWithSLA.filter((c) => !c.slaMissed).length / casesWithSLA.length) * 100)
      : 100;

    // Get top providers by cases
    const topProviders = await prisma.provider.findMany({
      orderBy: { totalCases: "desc" },
      take: 5,
      select: {
        name: true,
        totalCases: true,
        resolvedCases: true,
        refundRate: true,
      },
    });

    // Get team performance
    const teamPerformance = await prisma.user.findMany({
      where: {
        role: { in: ["TECHNICIAN", "SUPPORT", "MANAGER", "CEO"] },
      },
      select: {
        id: true,
        name: true,
        role: true,
        _count: {
          select: {
            ownedCases: {
              where: {
                createdAt: { gte: thisMonthStart },
              },
            },
          },
        },
      },
      orderBy: {
        ownedCases: { _count: "desc" },
      },
    });

    // Calculate growth
    const thisMonthCases = await prisma.case.count({
      where: { isDeleted: false, createdAt: { gte: thisMonthStart } },
    });

    const lastMonthCases = await prisma.case.count({
      where: {
        isDeleted: false,
        createdAt: { gte: lastMonthStart, lte: lastMonthEnd },
      },
    });

    const growth = lastMonthCases > 0
      ? Math.round(((thisMonthCases - lastMonthCases) / lastMonthCases) * 100)
      : 0;

    return NextResponse.json({
      casesByStatus: Object.fromEntries(
        casesByStatus.map((c) => [c.status, c._count.id])
      ),
      casesBySeverity: Object.fromEntries(
        casesBySeverity.map((c) => [c.severity, c._count.id])
      ),
      casesByCategory: casesByCategory.map((c) => {
        const type = caseTypes.find((t) => t.id === c.caseTypeId);
        return {
          name: type?.name || "Unknown",
          category: type?.category || "OTHER",
          count: c._count.id,
        };
      }),
      monthlyTrend: monthlyData,
      avgResolutionTime,
      slaCompliance,
      topProviders,
      teamPerformance: teamPerformance.map((u) => ({
        id: u.id,
        name: u.name,
        role: u.role,
        casesThisMonth: u._count.ownedCases,
      })),
      growth,
    });
  } catch (error) {
    console.error("Error fetching reports:", error);
    return NextResponse.json(
      { error: "Failed to fetch reports" },
      { status: 500 }
    );
  }
}



