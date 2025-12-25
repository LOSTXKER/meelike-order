import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { format } from "date-fns";
import { th } from "date-fns/locale";

/**
 * Export Cases to CSV
 * 
 * Query parameters:
 * - status: Filter by status
 * - severity: Filter by severity
 * - category: Filter by category
 * - startDate: Start date (ISO)
 * - endDate: End date (ISO)
 * - format: 'csv' or 'json' (default: csv)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const severity = searchParams.get("severity");
    const category = searchParams.get("category");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const exportFormat = searchParams.get("format") || "csv";

    // Build where clause
    const where: any = {};

    if (status && status !== "all") {
      where.status = status;
    }

    if (severity && severity !== "all") {
      where.severity = severity;
    }

    if (category && category !== "all") {
      where.caseType = {
        category: category,
      };
    }

    if (startDate) {
      where.createdAt = {
        ...where.createdAt,
        gte: new Date(startDate),
      };
    }

    if (endDate) {
      where.createdAt = {
        ...where.createdAt,
        lte: new Date(endDate),
      };
    }

    // Fetch cases
    const cases = await prisma.case.findMany({
      where,
      include: {
        caseType: true,
        owner: true,
        provider: true,
        orders: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Export as JSON
    if (exportFormat === "json") {
      return NextResponse.json({
        total: cases.length,
        exportedAt: new Date().toISOString(),
        data: cases,
      });
    }

    // Export as CSV
    const csvHeaders = [
      "เลขเคส",
      "หัวข้อ",
      "หมวดหมู่",
      "สถานะ",
      "ความรุนแรง",
      "ชื่อลูกค้า",
      "ผู้รับผิดชอบ",
      "Provider",
      "จำนวน Order",
      "SLA (นาที)",
      "แหล่งที่มา",
      "สร้างเมื่อ",
      "แก้ไขล่าสุด",
      "แก้ไขเสร็จเมื่อ",
      "ปิดเมื่อ",
    ];

    const csvRows = cases.map((c) => [
      c.caseNumber,
      c.title,
      c.caseType.category,
      c.status,
      c.severity,
      c.customerName || "-",
      c.owner?.name || "ไม่ได้มอบหมาย",
      c.provider?.name || "-",
      c.orders.length,
      c.caseType.defaultSlaMinutes,
      c.source || "-",
      format(c.createdAt, "dd/MM/yyyy HH:mm", { locale: th }),
      format(c.updatedAt, "dd/MM/yyyy HH:mm", { locale: th }),
      c.resolvedAt ? format(c.resolvedAt, "dd/MM/yyyy HH:mm", { locale: th }) : "-",
      c.closedAt ? format(c.closedAt, "dd/MM/yyyy HH:mm", { locale: th }) : "-",
    ]);

    // Convert to CSV
    const csvContent = [
      csvHeaders.join(","),
      ...csvRows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");

    // Add BOM for Excel UTF-8 compatibility
    const bom = "\uFEFF";
    const csvWithBom = bom + csvContent;

    return new NextResponse(csvWithBom, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="cases-export-${format(new Date(), "yyyyMMdd-HHmmss")}.csv"`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json(
      { error: "Failed to export data" },
      { status: 500 }
    );
  }
}

