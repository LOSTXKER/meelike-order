import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { hash } from "bcryptjs";
import { requireAdmin } from "@/lib/auth-helpers";

// GET /api/users/[id] - Get user details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            ownedCases: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}

// PATCH /api/users/[id] - Update user
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();

    // CEO can update anyone, or users can update themselves
    const isCEO = session.user.role === "CEO";
    const isSelf = session.user.id === id;
    if (!isCEO && !isSelf) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updateData: any = {};

    if (body.name !== undefined) updateData.name = body.name;
    if (body.email !== undefined) updateData.email = body.email;

    // Only CEO can change role and active status
    if (session.user.role === "CEO") {
      if (body.role !== undefined) updateData.role = body.role;
      if (body.isActive !== undefined) updateData.isActive = body.isActive;
    }

    // Handle password change
    if (body.password) {
      updateData.password = await hash(body.password, 10);
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}

// DELETE /api/users/[id] - Delete user permanently
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { authorized, session } = await requireAdmin();
  if (!authorized || !session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;

    // Prevent deleting yourself
    if (session.user.id === id) {
      return NextResponse.json(
        { error: "ไม่สามารถลบบัญชีตัวเองได้" },
        { status: 400 }
      );
    }

    // Check if user has cases
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        _count: {
          select: { ownedCases: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "ไม่พบผู้ใช้" }, { status: 404 });
    }

    // If user has cases, reassign or prevent deletion
    if (user._count.ownedCases > 0) {
      // Set ownerId to null for all cases owned by this user
      await prisma.case.updateMany({
        where: { ownerId: id },
        data: { ownerId: null },
      });
    }

    // Delete user permanently
    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "ลบผู้ใช้สำเร็จ" });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "ไม่สามารถลบผู้ใช้ได้" },
      { status: 500 }
    );
  }
}

