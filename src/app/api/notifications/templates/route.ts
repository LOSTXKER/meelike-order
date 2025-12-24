import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET all notification templates
export async function GET() {
  try {
    const templates = await prisma.notificationTemplate.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json(templates);
  } catch (error) {
    console.error("Error fetching templates:", error);
    return NextResponse.json(
      { error: "Failed to fetch templates" },
      { status: 500 }
    );
  }
}

// POST create new template
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, event, template } = body;

    const newTemplate = await prisma.notificationTemplate.create({
      data: {
        name,
        event,
        template,
      },
    });

    return NextResponse.json(newTemplate);
  } catch (error) {
    console.error("Error creating template:", error);
    return NextResponse.json(
      { error: "Failed to create template" },
      { status: 500 }
    );
  }
}

// PATCH update template
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...data } = body;

    const updated = await prisma.notificationTemplate.update({
      where: { id },
      data,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating template:", error);
    return NextResponse.json(
      { error: "Failed to update template" },
      { status: 500 }
    );
  }
}


