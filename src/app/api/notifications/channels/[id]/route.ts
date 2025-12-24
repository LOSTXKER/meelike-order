import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

// GET /api/notifications/channels/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const channel = await prisma.lineChannel.findUnique({
      where: { id },
    });

    if (!channel) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 });
    }

    return NextResponse.json(channel);
  } catch (error) {
    console.error("Error fetching channel:", error);
    return NextResponse.json({ error: "Failed to fetch channel" }, { status: 500 });
  }
}

// PATCH /api/notifications/channels/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const updated = await prisma.lineChannel.update({
      where: { id },
      data: {
        name: body.name,
        accessToken: body.accessToken,
        defaultGroupId: body.defaultGroupId,
        enabledEvents: body.enabledEvents,
        isActive: body.isActive,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating channel:", error);
    return NextResponse.json({ error: "Failed to update channel" }, { status: 500 });
  }
}

// DELETE /api/notifications/channels/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    await prisma.lineChannel.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting channel:", error);
    return NextResponse.json({ error: "Failed to delete channel" }, { status: 500 });
  }
}

