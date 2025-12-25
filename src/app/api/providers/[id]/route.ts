import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/providers/[id] - Get a specific provider
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const provider = await prisma.provider.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            cases: true,
          },
        },
      },
    });

    if (!provider) {
      return NextResponse.json(
        { error: "Provider not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(provider);
  } catch (error) {
    console.error("Error fetching provider:", error);
    return NextResponse.json(
      { error: "Failed to fetch provider" },
      { status: 500 }
    );
  }
}

// PATCH /api/providers/[id] - Update a provider
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const provider = await prisma.provider.update({
      where: { id },
      data: {
        name: body.name,
        type: body.type,
        defaultSlaMinutes: body.defaultSlaMinutes,
        contactChannel: body.contactChannel,
        notificationPreference: body.notificationPreference,
        riskLevel: body.riskLevel,
        isActive: body.isActive,
      },
    });

    return NextResponse.json(provider);
  } catch (error) {
    console.error("Error updating provider:", error);
    return NextResponse.json(
      { error: "Failed to update provider" },
      { status: 500 }
    );
  }
}

// DELETE /api/providers/[id] - Delete a provider
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if provider has any cases
    const casesCount = await prisma.case.count({
      where: { providerId: id },
    });

    if (casesCount > 0) {
      return NextResponse.json(
        { 
          error: "Cannot delete provider with existing cases",
          casesCount 
        },
        { status: 400 }
      );
    }

    await prisma.provider.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Provider deleted successfully" });
  } catch (error) {
    console.error("Error deleting provider:", error);
    return NextResponse.json(
      { error: "Failed to delete provider" },
      { status: 500 }
    );
  }
}



