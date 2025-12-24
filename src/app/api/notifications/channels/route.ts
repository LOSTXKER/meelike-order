import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET all Line channels
export async function GET() {
  try {
    const channels = await prisma.lineChannel.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json(channels);
  } catch (error) {
    console.error("Error fetching channels:", error);
    return NextResponse.json(
      { error: "Failed to fetch channels" },
      { status: 500 }
    );
  }
}

// POST create new channel
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, accessToken, defaultGroupId, enabledEvents } = body;

    const newChannel = await prisma.lineChannel.create({
      data: {
        name,
        accessToken,
        defaultGroupId,
        enabledEvents: enabledEvents || [],
      },
    });

    return NextResponse.json(newChannel);
  } catch (error) {
    console.error("Error creating channel:", error);
    return NextResponse.json(
      { error: "Failed to create channel" },
      { status: 500 }
    );
  }
}

// PATCH update channel
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...data } = body;

    const updated = await prisma.lineChannel.update({
      where: { id },
      data,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating channel:", error);
    return NextResponse.json(
      { error: "Failed to update channel" },
      { status: 500 }
    );
  }
}


