import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/case-types - List all case types
export async function GET() {
  try {
    const caseTypes = await prisma.caseType.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(caseTypes);
  } catch (error) {
    console.error("Error fetching case types:", error);
    return NextResponse.json(
      { error: "Failed to fetch case types" },
      { status: 500 }
    );
  }
}

// POST /api/case-types - Create a new case type
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const caseType = await prisma.caseType.create({
      data: {
        name: body.name,
        category: body.category,
        defaultSeverity: body.defaultSeverity || "NORMAL",
        defaultSlaMinutes: body.defaultSlaMinutes || 120,
        requireProvider: body.requireProvider || false,
        requireOrderId: body.requireOrderId || false,
        lineNotification: body.lineNotification || false,
        description: body.description,
      },
    });

    return NextResponse.json(caseType, { status: 201 });
  } catch (error) {
    console.error("Error creating case type:", error);
    return NextResponse.json(
      { error: "Failed to create case type" },
      { status: 500 }
    );
  }
}



