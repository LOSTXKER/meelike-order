import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/cases/counts - Get case counts by category
export async function GET() {
  try {
    // Get counts by category using raw query for category join
    const [
      totalCount,
      paymentCount,
      orderCount,
      systemCount,
      providerCount,
      otherCount,
    ] = await Promise.all([
      // Total cases
      prisma.case.count(),

      // Payment category
      prisma.case.count({
        where: { caseType: { category: "PAYMENT" } },
      }),

      // Order category
      prisma.case.count({
        where: { caseType: { category: "ORDER" } },
      }),

      // System category
      prisma.case.count({
        where: { caseType: { category: "SYSTEM" } },
      }),

      // Provider category
      prisma.case.count({
        where: { caseType: { category: "PROVIDER" } },
      }),

      // Other category
      prisma.case.count({
        where: { caseType: { category: "OTHER" } },
      }),
    ]);

    return NextResponse.json({
      all: totalCount,
      PAYMENT: paymentCount,
      ORDER: orderCount,
      SYSTEM: systemCount,
      PROVIDER: providerCount,
      OTHER: otherCount,
    });
  } catch (error) {
    console.error("Error fetching case counts:", error);
    return NextResponse.json(
      { error: "Failed to fetch case counts" },
      { status: 500 }
    );
  }
}

