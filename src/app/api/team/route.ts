import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { startOfMonth } from "date-fns";

export async function GET() {
  try {
    const thisMonthStart = startOfMonth(new Date());

    const users = await prisma.user.findMany({
      where: {
        role: { in: ["ADMIN", "SUPPORT", "MANAGER"] },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: {
            ownedCases: true,
          },
        },
      },
      orderBy: {
        ownedCases: { _count: "desc" },
      },
    });

    // Get detailed stats for each user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const [
          totalCases,
          resolvedCases,
          casesThisMonth,
          avgResolutionTime,
        ] = await Promise.all([
          // Total cases
          prisma.case.count({
            where: { ownerId: user.id },
          }),
          // Resolved cases
          prisma.case.count({
            where: {
              ownerId: user.id,
              status: { in: ["RESOLVED", "CLOSED"] },
            },
          }),
          // Cases this month
          prisma.case.count({
            where: {
              ownerId: user.id,
              createdAt: { gte: thisMonthStart },
            },
          }),
          // Average resolution time
          prisma.case.findMany({
            where: {
              ownerId: user.id,
              resolvedAt: { not: null },
            },
            select: {
              createdAt: true,
              resolvedAt: true,
            },
          }).then((cases) => {
            if (cases.length === 0) return 0;
            const times = cases.map((c) => {
              if (!c.resolvedAt) return 0;
              return Math.floor(
                (c.resolvedAt.getTime() - c.createdAt.getTime()) / (1000 * 60)
              );
            });
            return Math.round(times.reduce((a, b) => a + b, 0) / times.length);
          }),
        ]);

        return {
          ...user,
          totalCases,
          resolvedCases,
          casesThisMonth,
          avgResolutionTime,
          resolutionRate:
            totalCases > 0 ? Math.round((resolvedCases / totalCases) * 100) : 0,
        };
      })
    );

    return NextResponse.json(usersWithStats);
  } catch (error) {
    console.error("Error fetching team:", error);
    return NextResponse.json(
      { error: "Failed to fetch team" },
      { status: 500 }
    );
  }
}


