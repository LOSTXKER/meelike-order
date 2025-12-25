import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { notifyOnCaseEvent } from "@/lib/line-notification";
import { differenceInMinutes } from "date-fns";

/**
 * SLA Alert Cron Job
 * 
 * This endpoint should be called periodically (e.g., every 15 minutes) by a cron service
 * to check for cases approaching their SLA deadline.
 * 
 * Checks:
 * - Cases that are not CLOSED or RESOLVED
 * - SLA deadline within the next 30 minutes
 * - Haven't been alerted yet (using a flag or checking activity log)
 * 
 * Example cron setup:
 * - Vercel Cron: Configure in vercel.json
 * - External: Use cron-job.org or similar to call this endpoint
 * 
 * Security: Should verify cron secret or use Authorization header
 */
export async function GET(request: NextRequest) {
  try {
    // Security: Verify cron secret
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET || "dev-secret";
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const now = new Date();
    const thirtyMinutesFromNow = new Date(now.getTime() + 30 * 60 * 1000);

    // Find cases with SLA deadline in the next 30 minutes
    const urgentCases = await prisma.case.findMany({
      where: {
        status: {
          notIn: ["CLOSED", "RESOLVED"],
        },
        slaDeadline: {
          lte: thirtyMinutesFromNow,
          gte: now, // Not already passed
        },
      },
      include: {
        caseType: true,
        owner: true,
        provider: true,
        activities: {
          where: {
            type: "SLA_UPDATED",
            title: "⏰ แจ้งเตือน SLA ใกล้หมด",
          },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    const results = {
      total: urgentCases.length,
      alerted: 0,
      skipped: 0,
      errors: [] as string[],
    };

    for (const caseItem of urgentCases) {
      const lastAlert = caseItem.activities[0];
      
      // Skip if already alerted in the last 2 hours
      if (lastAlert && differenceInMinutes(now, lastAlert.createdAt) < 120) {
        results.skipped++;
        continue;
      }

      const minutesRemaining = differenceInMinutes(caseItem.slaDeadline!, now);

      try {
        // Create activity log
        await prisma.caseActivity.create({
          data: {
            caseId: caseItem.id,
            type: "SLA_UPDATED",
            title: "⏰ แจ้งเตือน SLA ใกล้หมด",
            description: `SLA จะหมดใน ${minutesRemaining} นาที`,
            oldValue: null,
            newValue: String(minutesRemaining),
            userId: "system",
          },
        });

        // Send Line notification
        await notifyOnCaseEvent("sla_alert", {
          caseNumber: caseItem.caseNumber,
          title: caseItem.title,
          status: caseItem.status,
          severity: caseItem.severity,
          customerName: caseItem.customerName || undefined,
          ownerName: caseItem.owner?.name || undefined,
          providerName: caseItem.provider?.name || undefined,
          slaDeadline: caseItem.slaDeadline,
        });

        results.alerted++;
      } catch (error) {
        console.error(`Failed to alert case ${caseItem.caseNumber}:`, error);
        results.errors.push(caseItem.caseNumber);
      }
    }

    // Find missed SLA cases
    const missedCases = await prisma.case.findMany({
      where: {
        status: {
          notIn: ["CLOSED", "RESOLVED"],
        },
        slaDeadline: {
          lt: now,
        },
      },
      include: {
        caseType: true,
        owner: true,
        activities: {
          where: {
            type: "SLA_UPDATED",
            title: "🚨 SLA เกินกำหนด",
          },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    const missedResults = {
      total: missedCases.length,
      alerted: 0,
      skipped: 0,
    };

    for (const caseItem of missedCases) {
      const lastAlert = caseItem.activities[0];
      
      // Alert once when SLA is first missed, then every 6 hours
      if (lastAlert && differenceInMinutes(now, lastAlert.createdAt) < 360) {
        missedResults.skipped++;
        continue;
      }

      const minutesPassed = Math.abs(differenceInMinutes(caseItem.slaDeadline!, now));

      try {
        await prisma.caseActivity.create({
          data: {
            caseId: caseItem.id,
            type: "SLA_UPDATED",
            title: "🚨 SLA เกินกำหนด",
            description: `SLA เกินกำหนดมาแล้ว ${minutesPassed} นาที`,
            oldValue: null,
            newValue: String(minutesPassed),
            userId: "system",
          },
        });

        await notifyOnCaseEvent("sla_missed", {
          caseNumber: caseItem.caseNumber,
          title: caseItem.title,
          status: caseItem.status,
          severity: caseItem.severity,
          customerName: caseItem.customerName || undefined,
          ownerName: caseItem.owner?.name || undefined,
          slaDeadline: caseItem.slaDeadline,
        });

        missedResults.alerted++;
      } catch (error) {
        console.error(`Failed to alert missed SLA for ${caseItem.caseNumber}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      urgent: results,
      missed: missedResults,
    });
  } catch (error) {
    console.error("SLA check cron error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

