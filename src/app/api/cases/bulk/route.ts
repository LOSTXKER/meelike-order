import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { caseIds, action, assigneeId } = body;

    if (!caseIds || !Array.isArray(caseIds) || caseIds.length === 0) {
      return NextResponse.json(
        { error: "Invalid caseIds" },
        { status: 400 }
      );
    }

    switch (action) {
      case "assign":
        if (!assigneeId) {
          return NextResponse.json(
            { error: "Missing assigneeId" },
            { status: 400 }
          );
        }

        await prisma.case.updateMany({
          where: { id: { in: caseIds } },
          data: { ownerId: assigneeId },
        });

        // Create activities
        for (const caseId of caseIds) {
          await prisma.caseActivity.create({
            data: {
              caseId,
              userId: session.user.id,
              type: "ASSIGNED",
              title: "มอบหมายเคส (Bulk)",
              description: `มอบหมายให้ ${assigneeId}`,
            },
          });
        }
        break;

      case "resolve":
        await prisma.case.updateMany({
          where: { id: { in: caseIds } },
          data: {
            status: "RESOLVED",
            resolvedAt: new Date(),
          },
        });

        for (const caseId of caseIds) {
          await prisma.caseActivity.create({
            data: {
              caseId,
              userId: session.user.id,
              type: "RESOLVED",
              title: "แก้ไขเคส (Bulk)",
              description: "ทำเครื่องหมายว่าแก้ไขแล้ว",
            },
          });
        }
        break;

      case "close":
        await prisma.case.updateMany({
          where: { id: { in: caseIds } },
          data: {
            status: "CLOSED",
            closedAt: new Date(),
          },
        });

        for (const caseId of caseIds) {
          await prisma.caseActivity.create({
            data: {
              caseId,
              userId: session.user.id,
              type: "CLOSED",
              title: "ปิดเคส (Bulk)",
              description: "ปิดเคสเรียบร้อยแล้ว",
            },
          });
        }
        break;

      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      updated: caseIds.length,
    });
  } catch (error: any) {
    console.error("Bulk action error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

