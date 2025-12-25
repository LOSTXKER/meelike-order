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
 * Send Line Notification immediately using stored templates
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
      return { success: false, reason: "no_channels" };
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
      return { success: false, reason: "no_template" };
    }

    // Replace variables in template
    let message = template.template;
    Object.keys(payload).forEach((key) => {
      const placeholder = `{{${key.replace(/([A-Z])/g, "_$1").toLowerCase()}}}`;
      message = message.replace(new RegExp(placeholder, "g"), String(payload[key] || ""));
    });

    // Send to all active channels IMMEDIATELY
    const results = await Promise.all(
      channels.map(async (channel) => {
        try {
          const response = await fetch(
            channel.defaultGroupId
              ? "https://api.line.me/v2/bot/message/push"
              : "https://api.line.me/v2/bot/message/broadcast",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${channel.accessToken}`,
              },
              body: JSON.stringify({
                ...(channel.defaultGroupId ? { to: channel.defaultGroupId } : {}),
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
            const errorText = await response.text();
            console.error(`Line API error for ${channel.name}:`, response.status, errorText);
            return { channel: channel.name, success: false, error: errorText };
          }

          console.log(`✅ Sent Line notification to: ${channel.name}`);
          return { channel: channel.name, success: true };
        } catch (error: any) {
          console.error(`Failed to send to ${channel.name}:`, error.message);
          return { channel: channel.name, success: false, error: error.message };
        }
      })
    );

    const successCount = results.filter((r) => r.success).length;
    console.log(`Line notification sent: ${successCount}/${channels.length} channels`);

    return { 
      success: successCount > 0, 
      sent: successCount, 
      total: channels.length,
      results 
    };
  } catch (error) {
    console.error("Error sending Line notification:", error);
    return { success: false, error };
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

  return await sendLineNotification({
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
