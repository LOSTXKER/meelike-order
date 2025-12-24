import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";

// GET /api/case-types/[id] - Get single case type
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const caseType = await prisma.caseType.findUnique({
      where: { id },
    });

    if (!caseType) {
      return NextResponse.json({ error: "Case type not found" }, { status: 404 });
    }

    return NextResponse.json(caseType);
  } catch (error) {
    console.error("Error fetching case type:", error);
    return NextResponse.json(
      { error: "Failed to fetch case type" },
      { status: 500 }
    );
  }
}

// PATCH /api/case-types/[id] - Update case type
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { authorized } = await requireAdmin();
    if (!authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const updated = await prisma.caseType.update({
      where: { id },
      data: {
        name: body.name,
        category: body.category,
        defaultSeverity: body.defaultSeverity,
        defaultSlaMinutes: body.defaultSlaMinutes,
        requireProvider: body.requireProvider,
        requireOrderId: body.requireOrderId,
        lineNotification: body.lineNotification,
        description: body.description,
        isActive: body.isActive,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating case type:", error);
    return NextResponse.json(
      { error: "Failed to update case type" },
      { status: 500 }
    );
  }
}

// DELETE /api/case-types/[id] - Delete case type
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { authorized } = await requireAdmin();
    if (!authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Check if case type is in use
    const casesCount = await prisma.case.count({
      where: { caseTypeId: id },
    });

    if (casesCount > 0) {
      // Soft delete by setting isActive to false
      await prisma.caseType.update({
        where: { id },
        data: { isActive: false },
      });
      return NextResponse.json({ success: true, softDeleted: true });
    }

    // Hard delete if not in use
    await prisma.caseType.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting case type:", error);
    return NextResponse.json(
      { error: "Failed to delete case type" },
      { status: 500 }
    );
  }
}


