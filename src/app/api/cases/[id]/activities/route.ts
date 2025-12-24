import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

// POST /api/cases/[id]/activities - Add activity/note to case
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Verify case exists
    const caseExists = await prisma.case.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!caseExists) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    // Create activity
    const activity = await prisma.caseActivity.create({
      data: {
        caseId: id,
        type: body.type || "NOTE_ADDED",
        title: body.title || "เพิ่มบันทึก",
        description: body.description,
        attachmentUrl: body.attachmentUrl,
        userId: session.user.id,
      },
      include: {
        user: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json(activity, { status: 201 });
  } catch (error) {
    console.error("Error creating activity:", error);
    return NextResponse.json(
      { error: "Failed to create activity" },
      { status: 500 }
    );
  }
}

// GET /api/cases/[id]/activities - Get case activities
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const activities = await prisma.caseActivity.findMany({
      where: { caseId: id },
      include: {
        user: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(activities);
  } catch (error) {
    console.error("Error fetching activities:", error);
    return NextResponse.json(
      { error: "Failed to fetch activities" },
      { status: 500 }
    );
  }
}

