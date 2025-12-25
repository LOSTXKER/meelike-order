import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
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
          select: { id: true, name: true, email: true, role: true },
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
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const userId = session.user.id;

    // Get current case with orders
    const currentCase = await prisma.case.findUnique({
      where: { id },
      include: {
        orders: {
          select: { id: true, orderId: true, status: true },
        },
      },
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

      // Check if closing from RESOLVED with customer notification
      if (body.status === "CLOSED" && currentCase.status === "RESOLVED" && body.customerNotified) {
        activities.push({
          caseId: id,
          type: "CLOSED",
          title: "ปิดเคส - แจ้งลูกค้าแล้ว",
          description: "Admin ได้แจ้งผลการแก้ไขให้ลูกค้าทราบแล้ว",
          oldValue: currentCase.status,
          newValue: body.status,
          userId,
        });
      } else {
        activities.push({
          caseId: id,
          type: "STATUS_CHANGED",
          title: `เปลี่ยนสถานะเป็น ${getStatusLabel(body.status)}`,
          oldValue: currentCase.status,
          newValue: body.status,
          userId,
        });
      }
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
        orders: true,
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

    // ============================================
    // AUTO-UPDATE RELATED ORDERS (NEW FEATURE)
    // ============================================
    if (body.status && body.status !== currentCase.status && currentCase.orders.length > 0) {
      const newOrderStatus = determineOrderStatus(body.status, body.resolution);
      
      if (newOrderStatus) {
        // Update all orders that are not already in terminal state
        const ordersToUpdate = currentCase.orders.filter(
          order => !["COMPLETED", "REFUNDED", "CANCELLED"].includes(order.status)
        );

        if (ordersToUpdate.length > 0) {
          // Batch update orders (cast to proper OrderStatus type)
          await prisma.order.updateMany({
            where: {
              id: { in: ordersToUpdate.map(o => o.id) },
            },
            data: {
              status: newOrderStatus as "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "REFUNDED" | "CANCELLED",
            },
          });

          // Log order updates in case activity
          activities.push({
            caseId: id,
            type: "NOTE_ADDED",
            title: "🤖 อัพเดท Order อัตโนมัติ",
            description: `เปลี่ยนสถานะ Order ${ordersToUpdate.map(o => o.orderId).join(", ")} เป็น "${getOrderStatusLabel(newOrderStatus)}" (เนื่องจาก Case เปลี่ยนเป็น ${getStatusLabel(body.status)})`,
            userId,
          });

          // Create activity log for the automation
          await prisma.caseActivity.create({
            data: {
              caseId: id,
              type: "NOTE_ADDED",
              title: "🤖 อัพเดท Order อัตโนมัติ",
              description: `เปลี่ยนสถานะ Order ${ordersToUpdate.map(o => o.orderId).join(", ")} เป็น "${getOrderStatusLabel(newOrderStatus)}" (เนื่องจาก Case เปลี่ยนเป็น ${getStatusLabel(body.status)})`,
              userId,
            },
          });
        }
      }
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

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Determine Order status based on Case status and resolution
 */
function determineOrderStatus(caseStatus: string, resolution?: string): string | null {
  // When case is RESOLVED, check resolution text
  if (caseStatus === "RESOLVED") {
    if (!resolution) return "COMPLETED"; // Default to completed

    const resolutionLower = resolution.toLowerCase();
    
    // Check for refund keywords
    if (
      resolutionLower.includes("คืนเงิน") || 
      resolutionLower.includes("refund") ||
      resolutionLower.includes("ขอคืน")
    ) {
      return "REFUNDED";
    }
    
    // Check for cancellation keywords
    if (
      resolutionLower.includes("ยกเลิก") ||
      resolutionLower.includes("cancel")
    ) {
      return "CANCELLED";
    }

    // Check for failure keywords
    if (
      resolutionLower.includes("ไม่สำเร็จ") ||
      resolutionLower.includes("failed") ||
      resolutionLower.includes("ล้มเหลว")
    ) {
      return "FAILED";
    }

    // Default: mark as completed
    return "COMPLETED";
  }

  // When case is CLOSED without proper resolution
  if (caseStatus === "CLOSED") {
    if (!resolution) return "CANCELLED"; // No resolution = cancelled
    return determineOrderStatus("RESOLVED", resolution); // Use same logic as RESOLVED
  }

  // For other statuses, return null (no auto-update)
  return null;
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    NEW: "ใหม่",
    // INVESTIGATING and FIXING merged as "กำลังดำเนินการ"
    INVESTIGATING: "กำลังดำเนินการ",
    FIXING: "กำลังดำเนินการ",
    WAITING_CUSTOMER: "รอลูกค้า",
    WAITING_PROVIDER: "รอ Provider",
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

function getOrderStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    PENDING: "รอดำเนินการ",
    PROCESSING: "กำลังดำเนินการ",
    COMPLETED: "สำเร็จ",
    FAILED: "ไม่สำเร็จ",
    REFUNDED: "คืนเงินแล้ว",
    CANCELLED: "ยกเลิก",
  };
  return labels[status] || status;
}
