import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { uploadFile } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const caseId = formData.get("caseId") as string;

    if (!file || !caseId) {
      return NextResponse.json(
        { error: "Missing file or caseId" },
        { status: 400 }
      );
    }

    // Validate case exists
    const caseExists = await prisma.case.findUnique({
      where: { id: caseId },
    });

    if (!caseExists) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    // Upload to Supabase Storage
    const timestamp = Date.now();
    const fileName = `${timestamp}-${file.name}`;
    const storagePath = `cases/${caseId}/${fileName}`;

    const { url, error } = await uploadFile("attachments", storagePath, file);

    if (error || !url) {
      return NextResponse.json(
        { error: error || "Upload failed" },
        { status: 500 }
      );
    }

    // Save to database
    const attachment = await prisma.attachment.create({
      data: {
        caseId,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        storagePath,
        publicUrl: url,
        uploadedById: session.user.id,
      },
      include: {
        uploadedBy: {
          select: {
            name: true,
          },
        },
      },
    });

    // Create activity log
    await prisma.caseActivity.create({
      data: {
        caseId,
        userId: session.user.id,
        type: "FILE_ATTACHED",
        title: "แนบไฟล์",
        description: file.name,
        attachmentUrl: url,
      },
    });

    return NextResponse.json(attachment);
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const caseId = searchParams.get("caseId");

    if (!caseId) {
      return NextResponse.json(
        { error: "Missing caseId" },
        { status: 400 }
      );
    }

    const attachments = await prisma.attachment.findMany({
      where: { caseId },
      include: {
        uploadedBy: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(attachments);
  } catch (error: any) {
    console.error("Get attachments error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

