import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/providers - List all providers
export async function GET() {
  try {
    const providers = await prisma.provider.findMany({
      orderBy: { name: "asc" },
    });

    return NextResponse.json(providers);
  } catch (error) {
    console.error("Error fetching providers:", error);
    return NextResponse.json(
      { error: "Failed to fetch providers" },
      { status: 500 }
    );
  }
}

// POST /api/providers - Create a new provider
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const provider = await prisma.provider.create({
      data: {
        name: body.name,
        type: body.type || "API",
        defaultSlaMinutes: body.defaultSlaMinutes || 60,
        contactChannel: body.contactChannel,
        notificationPreference: body.notificationPreference,
      },
    });

    return NextResponse.json(provider, { status: 201 });
  } catch (error) {
    console.error("Error creating provider:", error);
    return NextResponse.json(
      { error: "Failed to create provider" },
      { status: 500 }
    );
  }
}



