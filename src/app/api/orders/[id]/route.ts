import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

const orderStatusLabels: Record<string, string> = {
  PENDING: "รอดำเนินการ",
  PROCESSING: "กำลังดำเนินการ",
  COMPLETED: "สำเร็จ",
  FAILED: "ไม่สำเร็จ",
  REFUNDED: "คืนเงินแล้ว",
  CANCELLED: "ยกเลิก",
};

// PATCH /api/orders/[id] - Update order status
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

    // Get current order with its cases
    const currentOrder = await prisma.order.findUnique({
      where: { id },
      include: {
        cases: {
          select: { id: true },
        },
      },
    });

    if (!currentOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Only allow status updates
    if (!body.status) {
      return NextResponse.json({ error: "Status is required" }, { status: 400 });
    }

    // Validate status value
    const validStatuses = ["PENDING", "PROCESSING", "COMPLETED", "FAILED", "REFUNDED", "CANCELLED"];
    if (!validStatuses.includes(body.status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // Check if status actually changed
    if (body.status === currentOrder.status) {
      return NextResponse.json({ message: "Status unchanged" });
    }

    // Update order status
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        status: body.status,
      },
      include: {
        provider: {
          select: { id: true, name: true },
        },
      },
    });

    // Create activity log for each related case
    if (currentOrder.cases.length > 0) {
      const activities = currentOrder.cases.map((c) => ({
        caseId: c.id,
        type: "NOTE_ADDED" as const,
        title: `อัพเดท Order ${currentOrder.orderId}`,
        description: `เปลี่ยนสถานะ Order จาก "${orderStatusLabels[currentOrder.status]}" เป็น "${orderStatusLabels[body.status]}"`,
        oldValue: currentOrder.status,
        newValue: body.status,
        userId,
      }));

      await prisma.caseActivity.createMany({
        data: activities,
      });
    }

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error("Error updating order:", error);
    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 }
    );
  }
}

// GET /api/orders/[id] - Get order detail
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        provider: {
          select: { id: true, name: true },
        },
        cases: {
          select: { id: true, caseNumber: true, title: true, status: true },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error("Error fetching order:", error);
    return NextResponse.json(
      { error: "Failed to fetch order" },
      { status: 500 }
    );
  }
}


