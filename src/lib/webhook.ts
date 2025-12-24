import { createHmac } from "crypto";

/**
 * Webhook signature verification
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  try {
    const hmac = createHmac("sha256", secret);
    hmac.update(payload);
    const expectedSignature = hmac.digest("hex");
    
    return signature === expectedSignature;
  } catch (error) {
    console.error("Webhook signature verification error:", error);
    return false;
  }
}

/**
 * Generate webhook signature for outgoing webhooks
 */
export function generateWebhookSignature(
  payload: string,
  secret: string
): string {
  const hmac = createHmac("sha256", secret);
  hmac.update(payload);
  return hmac.digest("hex");
}

/**
 * Webhook event types
 */
export enum WebhookEvent {
  CASE_CREATED = "case.created",
  CASE_UPDATED = "case.updated",
  CASE_STATUS_CHANGED = "case.status_changed",
  CASE_ASSIGNED = "case.assigned",
  CASE_RESOLVED = "case.resolved",
  CASE_CLOSED = "case.closed",
  CASE_NOTE_ADDED = "case.note_added",
}

/**
 * Webhook payload structure
 */
export interface WebhookPayload {
  event: WebhookEvent;
  timestamp: string;
  data: {
    caseId: string;
    caseNumber: string;
    [key: string]: any;
  };
}

/**
 * Deliver webhook to endpoint
 */
export async function deliverWebhook(
  url: string,
  payload: WebhookPayload,
  secret: string
): Promise<{ success: boolean; statusCode?: number; error?: string }> {
  try {
    const body = JSON.stringify(payload);
    const signature = generateWebhookSignature(body, secret);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Signature": signature,
        "X-Webhook-Event": payload.event,
        "User-Agent": "MIMS-Webhook/1.0",
      },
      body,
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!response.ok) {
      return {
        success: false,
        statusCode: response.status,
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    return {
      success: true,
      statusCode: response.status,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

