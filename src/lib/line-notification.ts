import prisma from "./prisma";

interface LineMessagePayload {
  channelId?: string;
  event: string;
  caseNumber?: string;
  title?: string;
  status?: string;
  severity?: string;
  customerName?: string;
  ownerName?: string;
  providerName?: string;
  slaDeadline?: string;
  [key: string]: unknown;
}

/**
 * Send Line Notification using stored templates
 */
export async function sendLineNotification(payload: LineMessagePayload) {
  try {
    // Find active channels that have this event enabled
    const channels = await prisma.lineChannel.findMany({
      where: {
        isActive: true,
        enabledEvents: {
          array_contains: payload.event,
        },
      },
    });

    if (channels.length === 0) {
      console.log(`No active channels found for event: ${payload.event}`);
      return;
    }

    // Find template for this event
    const template = await prisma.notificationTemplate.findFirst({
      where: {
        event: payload.event,
        isActive: true,
      },
    });

    if (!template) {
      console.log(`No template found for event: ${payload.event}`);
      return;
    }

    // Replace variables in template
    let message = template.template;
    Object.keys(payload).forEach((key) => {
      const placeholder = `{{${key.replace(/([A-Z])/g, "_$1").toLowerCase()}}}`;
      message = message.replace(new RegExp(placeholder, "g"), String(payload[key] || ""));
    });

    // Send to all active channels
    const promises = channels.map(async (channel) => {
      try {
        // Create outbox entry for reliable delivery
        await prisma.outbox.create({
          data: {
            eventType: "line_notification",
            payload: {
              channelId: channel.id,
              accessToken: channel.accessToken,
              groupId: channel.defaultGroupId,
              message,
            },
          },
        });

        console.log(`Queued Line notification for channel: ${channel.name}`);
      } catch (error) {
        console.error(`Failed to queue notification for ${channel.name}:`, error);
      }
    });

    await Promise.all(promises);
  } catch (error) {
    console.error("Error sending Line notification:", error);
    throw error;
  }
}

/**
 * Process outbox for Line notifications
 * This should be called by a background job/cron
 */
export async function processLineNotificationOutbox() {
  try {
    // Get pending outbox items
    const items = await prisma.outbox.findMany({
      where: {
        eventType: "line_notification",
        status: "PENDING",
        retryCount: { lt: prisma.outbox.fields.maxRetries },
      },
      take: 10, // Process in batches
      orderBy: { createdAt: "asc" },
    });

    for (const item of items) {
      try {
        // Mark as processing
        await prisma.outbox.update({
          where: { id: item.id },
          data: { status: "PROCESSING" },
        });

        const { accessToken, groupId, message } = item.payload as any;

        // Send to Line Messaging API
        const response = await fetch(
          groupId
            ? `https://api.line.me/v2/bot/message/push`
            : `https://api.line.me/v2/bot/message/broadcast`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
              ...(groupId ? { to: groupId } : {}),
              messages: [
                {
                  type: "text",
                  text: message,
                },
              ],
            }),
          }
        );

        if (!response.ok) {
          throw new Error(`Line API error: ${response.statusText}`);
        }

        // Mark as completed
        await prisma.outbox.update({
          where: { id: item.id },
          data: {
            status: "COMPLETED",
            processedAt: new Date(),
          },
        });

        console.log(`Successfully sent Line notification: ${item.id}`);
      } catch (error: any) {
        // Mark as failed and increment retry count
        await prisma.outbox.update({
          where: { id: item.id },
          data: {
            status: "FAILED",
            retryCount: { increment: 1 },
            lastError: error.message,
          },
        });

        console.error(`Failed to send Line notification ${item.id}:`, error);
      }
    }
  } catch (error) {
    console.error("Error processing Line notification outbox:", error);
  }
}

/**
 * Helper to trigger notifications on case events
 */
export async function notifyOnCaseEvent(
  event: string,
  caseData: {
    caseNumber: string;
    title: string;
    status?: string;
    severity?: string;
    customerName?: string;
    ownerName?: string;
    providerName?: string;
    slaDeadline?: Date | null;
  }
) {
  // Format SLA deadline
  const slaDeadlineStr = caseData.slaDeadline 
    ? new Date(caseData.slaDeadline).toLocaleString('th-TH', { 
        dateStyle: 'short', 
        timeStyle: 'short' 
      })
    : '-';

  await sendLineNotification({
    event,
    caseNumber: caseData.caseNumber,
    title: caseData.title,
    status: caseData.status,
    severity: caseData.severity,
    customerName: caseData.customerName,
    ownerName: caseData.ownerName,
    providerName: caseData.providerName,
    slaDeadline: slaDeadlineStr,
  });
}

