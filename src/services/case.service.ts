/**
 * Case Service
 * 
 * Business logic layer for Case operations.
 * Separates database operations from API routes.
 */

import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { notifyOnCaseEvent } from "@/lib/line-notification";

export interface CaseFilters {
  status?: string;
  severity?: string;
  category?: string;
  caseTypeId?: string;
  search?: string;
  ownerId?: string;
  isDeleted?: boolean;
}

export interface CreateCaseData {
  title: string;
  description?: string;
  caseTypeId: string;
  severity?: string;
  source: string;
  customerName?: string;
  customerId?: string;
  customerContact?: string;
  providerId?: string;
  ownerId?: string;
}

export interface UpdateCaseData {
  title?: string;
  description?: string;
  status?: string;
  severity?: string;
  ownerId?: string;
  providerId?: string;
  rootCause?: string;
  resolution?: string;
}

export class CaseService {
  /**
   * Get all cases with filters and pagination
   */
  static async getCases(
    filters: CaseFilters,
    page: number = 1,
    limit: number = 20,
    sort: string = "createdAt-desc"
  ) {
    const where: Prisma.CaseWhereInput = {
      isDeleted: filters.isDeleted ?? false,
    };

    // Apply filters
    if (filters.ownerId) {
      where.ownerId = filters.ownerId;
    }

    if (filters.status && filters.status !== "all") {
      if (filters.status.includes(",")) {
        const statuses = filters.status.split(",").map(s => s.trim());
        where.status = { in: statuses as any[] };
      } else {
        where.status = filters.status as any;
      }
    }

    if (filters.severity && filters.severity !== "all") {
      where.severity = filters.severity as any;
    }

    if (filters.category && filters.category !== "all") {
      where.caseType = {
        category: filters.category as any,
      };
    }

    if (filters.caseTypeId && filters.caseTypeId !== "all") {
      where.caseTypeId = filters.caseTypeId;
    }

    if (filters.search) {
      where.OR = [
        { caseNumber: { contains: filters.search, mode: "insensitive" } },
        { title: { contains: filters.search, mode: "insensitive" } },
        { customerName: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    // Parse sort
    const [sortField, sortOrder] = sort.split("-");
    const orderBy: Prisma.CaseOrderByWithRelationInput[] = [];

    if (sortField === "createdAt") {
      orderBy.push({ createdAt: sortOrder as "asc" | "desc" });
    } else if (sortField === "severity") {
      orderBy.push({ severity: "asc" });
      orderBy.push({ createdAt: "desc" });
    } else if (sortField === "slaDeadline") {
      orderBy.push({ slaDeadline: "asc" });
      orderBy.push({ createdAt: "desc" });
    } else {
      orderBy.push({ severity: "asc" });
      orderBy.push({ createdAt: "desc" });
    }

    // Fetch with pagination
    const [cases, total] = await Promise.all([
      prisma.case.findMany({
        where,
        include: {
          caseType: {
            select: { id: true, name: true, category: true },
          },
          owner: {
            select: { id: true, name: true, email: true },
          },
          provider: {
            select: { id: true, name: true },
          },
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.case.count({ where }),
    ]);

    return {
      cases,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get single case by ID
   */
  static async getCaseById(id: string) {
    const caseDetail = await prisma.case.findUnique({
      where: { id, isDeleted: false },
      include: {
        caseType: true,
        owner: {
          select: { id: true, name: true, email: true, role: true },
        },
        provider: true,
        orders: {
          include: {
            provider: {
              select: { id: true, name: true },
            },
          },
        },
        activities: {
          include: {
            user: {
              select: { id: true, name: true },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        attachments: {
          include: {
            uploadedBy: {
              select: { id: true, name: true },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!caseDetail) {
      throw new Error("Case not found");
    }

    return caseDetail;
  }

  /**
   * Create a new case
   */
  static async createCase(data: CreateCaseData, createdByUserId: string) {
    // Get case type for defaults
    const caseType = await prisma.caseType.findUnique({
      where: { id: data.caseTypeId },
    });

    if (!caseType) {
      throw new Error("Case type not found");
    }

    // Generate case number
    const today = new Date();
    const year = today.getFullYear();
    const count = await prisma.case.count({
      where: {
        createdAt: {
          gte: new Date(year, 0, 1),
        },
      },
    });
    const caseNumber = `CASE-${year}-${String(count + 1).padStart(4, "0")}`;

    // Calculate SLA deadline
    const slaDeadline = new Date(
      Date.now() + caseType.defaultSlaMinutes * 60 * 1000
    );

    // Auto-assign if no owner provided
    let autoAssignOwnerId: string | undefined;
    if (!data.ownerId) {
      const technicians = await prisma.user.findMany({
        where: {
          isActive: true,
          role: { in: ["TECHNICIAN", "SUPPORT"] },
        },
        select: {
          id: true,
          _count: {
            select: {
              ownedCases: {
                where: {
                  status: { notIn: ["CLOSED", "RESOLVED"] },
                },
              },
            },
          },
        },
        orderBy: {
          ownedCases: {
            _count: "asc",
          },
        },
        take: 1,
      });

      if (technicians.length > 0) {
        autoAssignOwnerId = technicians[0].id;
      }
    }

    // Create case
    const newCase = await prisma.case.create({
      data: {
        caseNumber,
        title: data.title,
        description: data.description,
        caseTypeId: data.caseTypeId,
        severity: (data.severity || caseType.defaultSeverity) as any,
        source: data.source as any,
        customerName: data.customerName,
        customerId: data.customerId,
        customerContact: data.customerContact,
        providerId: data.providerId,
        ownerId: data.ownerId || autoAssignOwnerId,
        slaDeadline,
      },
      include: {
        caseType: true,
        owner: true,
        provider: true,
      },
    });

    // Create activity log
    await prisma.caseActivity.create({
      data: {
        caseId: newCase.id,
        type: "CREATED",
        title: "📝 สร้างเคส",
        description: `เคส ${newCase.caseNumber} ถูกสร้างโดยระบบ`,
        userId: createdByUserId,
      },
    });

    // Send notifications
    if (caseType.lineNotification || autoAssignOwnerId) {
      await notifyOnCaseEvent("case_created", {
        caseNumber: newCase.caseNumber,
        title: newCase.title,
        status: newCase.status,
        severity: newCase.severity,
        customerName: newCase.customerName || undefined,
        ownerName: newCase.owner?.name || undefined,
        providerName: newCase.provider?.name || undefined,
        slaDeadline: newCase.slaDeadline,
      });
    }

    return newCase;
  }

  /**
   * Update a case
   */
  static async updateCase(
    id: string,
    data: UpdateCaseData,
    updatedByUserId: string
  ) {
    const currentCase = await prisma.case.findUnique({
      where: { id },
      include: { orders: true },
    });

    if (!currentCase) {
      throw new Error("Case not found");
    }

    // Track changes for activity log
    const changes: string[] = [];

    if (data.status && data.status !== currentCase.status) {
      changes.push(`สถานะ: ${currentCase.status} → ${data.status}`);
    }

    if (data.severity && data.severity !== currentCase.severity) {
      changes.push(`ความรุนแรง: ${currentCase.severity} → ${data.severity}`);
    }

    // Update case
    const updatedData: Prisma.CaseUpdateInput = {};

    if (data.title) updatedData.title = data.title;
    if (data.description !== undefined) updatedData.description = data.description;
    if (data.severity) updatedData.severity = data.severity as any;
    if (data.ownerId) updatedData.owner = { connect: { id: data.ownerId } };
    if (data.providerId) updatedData.provider = { connect: { id: data.providerId } };
    if (data.rootCause !== undefined) updatedData.rootCause = data.rootCause;
    if (data.resolution !== undefined) updatedData.resolution = data.resolution;

    if (data.status) {
      updatedData.status = data.status as any;

      // Update timestamps based on status
      if (data.status === "RESOLVED") {
        updatedData.resolvedAt = new Date();
      }
      if (data.status === "CLOSED") {
        updatedData.closedAt = new Date();
      }

      // Auto-update order statuses when case is resolved/closed
      if (data.status === "RESOLVED" || data.status === "CLOSED") {
        const pendingOrders = currentCase.orders.filter(
          (o) => o.status === "PENDING"
        );
        if (pendingOrders.length > 0) {
          await prisma.order.updateMany({
            where: {
              id: { in: pendingOrders.map((o) => o.id) },
            },
            data: {
              status: data.status === "RESOLVED" ? "COMPLETED" : "CANCELLED",
            },
          });
        }
      }
    }

    const updatedCase = await prisma.case.update({
      where: { id },
      data: updatedData,
      include: {
        caseType: true,
        owner: true,
        provider: true,
      },
    });

    // Create activity log
    if (changes.length > 0) {
      await prisma.caseActivity.create({
        data: {
          caseId: id,
          type: "STATUS_CHANGED",
          title: "🔄 อัพเดทเคส",
          description: changes.join(", "),
          oldValue: currentCase.status,
          newValue: data.status,
          userId: updatedByUserId,
        },
      });
    }

    return updatedCase;
  }

  /**
   * Soft delete a case
   */
  static async deleteCase(id: string, deletedByUserId: string) {
    const deletedCase = await prisma.case.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });

    // Log the deletion
    await prisma.caseActivity.create({
      data: {
        caseId: id,
        type: "STATUS_CHANGED",
        title: "🗑️ เคสถูกลบ",
        description: "เคสถูกลบแบบ Soft Delete",
        userId: deletedByUserId,
      },
    });

    return deletedCase;
  }

  /**
   * Get case counts by category
   */
  static async getCaseCounts() {
    const [
      totalCount,
      paymentCount,
      orderCount,
      systemCount,
      providerCount,
      otherCount,
    ] = await Promise.all([
      prisma.case.count({
        where: { isDeleted: false },
      }),
      prisma.case.count({
        where: { isDeleted: false, caseType: { category: "PAYMENT" } },
      }),
      prisma.case.count({
        where: { isDeleted: false, caseType: { category: "ORDER" } },
      }),
      prisma.case.count({
        where: { isDeleted: false, caseType: { category: "SYSTEM" } },
      }),
      prisma.case.count({
        where: { isDeleted: false, caseType: { category: "PROVIDER" } },
      }),
      prisma.case.count({
        where: { isDeleted: false, caseType: { category: "OTHER" } },
      }),
    ]);

    return {
      all: totalCount,
      PAYMENT: paymentCount,
      ORDER: orderCount,
      SYSTEM: systemCount,
      PROVIDER: providerCount,
      OTHER: otherCount,
    };
  }
}

