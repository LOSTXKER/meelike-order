import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/cases/[id] - Get case detail
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const caseDetail = await prisma.case.findUnique({
      where: { id },
      include: {
        caseType: true,
        owner: {
          select: { id: true, name: true, email: true },
        },
        provider: true,
        orders: {
          include: {
            provider: {
              select: { id: true, name: true },
            },
          },
        },
        activities: {
          include: {
            user: {
              select: { id: true, name: true },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!caseDetail) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    return NextResponse.json(caseDetail);
  } catch (error) {
    console.error("Error fetching case:", error);
    return NextResponse.json(
      { error: "Failed to fetch case" },
      { status: 500 }
    );
  }
}

// PATCH /api/cases/[id] - Update case
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const userId = body.userId; // TODO: Get from auth session

    // Get current case
    const currentCase = await prisma.case.findUnique({
      where: { id },
    });

    if (!currentCase) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    // Build update data and activity logs
    const updates: Record<string, unknown> = {};
    const activities: Array<{
      caseId: string;
      type: string;
      title: string;
      description?: string;
      oldValue?: string;
      newValue?: string;
      userId?: string;
    }> = [];

    // Status change
    if (body.status && body.status !== currentCase.status) {
      updates.status = body.status;

      // Update timestamps based on status
      if (body.status === "INVESTIGATING" && !currentCase.firstResponseAt) {
        updates.firstResponseAt = new Date();
      }
      if (body.status === "RESOLVED") {
        updates.resolvedAt = new Date();
      }
      if (body.status === "CLOSED") {
        updates.closedAt = new Date();
      }

      activities.push({
        caseId: id,
        type: "STATUS_CHANGED",
        title: `เปลี่ยนสถานะเป็น ${getStatusLabel(body.status)}`,
        oldValue: currentCase.status,
        newValue: body.status,
        userId,
      });
    }

    // Owner assignment
    if (body.ownerId && body.ownerId !== currentCase.ownerId) {
      updates.ownerId = body.ownerId;

      const newOwner = await prisma.user.findUnique({
        where: { id: body.ownerId },
        select: { name: true },
      });

      activities.push({
        caseId: id,
        type: "ASSIGNED",
        title: `มอบหมายให้ ${newOwner?.name || "Unknown"}`,
        userId,
      });
    }

    // Severity change
    if (body.severity && body.severity !== currentCase.severity) {
      updates.severity = body.severity;

      activities.push({
        caseId: id,
        type: "SEVERITY_CHANGED",
        title: `เปลี่ยนความรุนแรงเป็น ${getSeverityLabel(body.severity)}`,
        oldValue: currentCase.severity,
        newValue: body.severity,
        userId,
      });
    }

    // Root cause & Resolution (for closing)
    if (body.rootCause) updates.rootCause = body.rootCause;
    if (body.resolution) updates.resolution = body.resolution;

    // Update case
    const updatedCase = await prisma.case.update({
      where: { id },
      data: updates,
      include: {
        caseType: true,
        owner: true,
        provider: true,
      },
    });

    // Create activity logs
    if (activities.length > 0) {
      await prisma.caseActivity.createMany({
        data: activities.map((a) => ({
          ...a,
          type: a.type as "CREATED" | "STATUS_CHANGED" | "ASSIGNED" | "NOTE_ADDED" | "FILE_ATTACHED" | "SLA_UPDATED" | "SEVERITY_CHANGED" | "ESCALATED" | "RESOLVED" | "CLOSED" | "REOPENED",
        })),
      });
    }

    return NextResponse.json(updatedCase);
  } catch (error) {
    console.error("Error updating case:", error);
    return NextResponse.json(
      { error: "Failed to update case" },
      { status: 500 }
    );
  }
}

// Helper functions
function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    NEW: "ใหม่",
    INVESTIGATING: "กำลังตรวจสอบ",
    WAITING_CUSTOMER: "รอลูกค้า",
    WAITING_PROVIDER: "รอ Provider",
    FIXING: "กำลังแก้ไข",
    RESOLVED: "แก้ไขแล้ว",
    CLOSED: "ปิดเคส",
  };
  return labels[status] || status;
}

function getSeverityLabel(severity: string): string {
  const labels: Record<string, string> = {
    CRITICAL: "วิกฤต",
    HIGH: "สูง",
    NORMAL: "ปกติ",
    LOW: "ต่ำ",
  };
  return labels[severity] || severity;
}

