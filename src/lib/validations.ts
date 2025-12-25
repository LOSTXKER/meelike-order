/**
 * Validation Schemas
 * 
 * Zod schemas for input validation across the application.
 * Ensures type safety and prevents bad data from entering the system.
 */

import { z } from "zod";

// ============================================
// Case Schemas
// ============================================

export const CreateCaseSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(200),
  description: z.string().optional(),
  caseTypeId: z.string().cuid("Invalid case type ID"),
  severity: z.enum(["CRITICAL", "HIGH", "NORMAL", "LOW"]).optional(),
  source: z.enum(["LINE", "TICKET", "API", "MANUAL"]),
  customerName: z.string().min(1).max(100).optional(),
  customerId: z.string().max(100).optional(),
  customerContact: z.string().max(200).optional(),
  providerId: z.string().cuid().optional(),
  ownerId: z.string().cuid().optional(),
});

export const UpdateCaseSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  description: z.string().optional(),
  status: z.enum([
    "NEW",
    "INVESTIGATING",
    "WAITING_CUSTOMER",
    "WAITING_PROVIDER",
    "FIXING",
    "RESOLVED",
    "CLOSED",
  ]).optional(),
  severity: z.enum(["CRITICAL", "HIGH", "NORMAL", "LOW"]).optional(),
  ownerId: z.string().cuid().optional(),
  providerId: z.string().cuid().optional(),
  rootCause: z.string().optional(),
  resolution: z.string().optional(),
});

export const CaseFiltersSchema = z.object({
  status: z.string().optional(),
  severity: z.string().optional(),
  category: z.string().optional(),
  caseType: z.string().optional(),
  search: z.string().optional(),
  sort: z.string().optional(),
  page: z.coerce.number().min(1).optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
});

// ============================================
// User Schemas
// ============================================

export const CreateUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["CEO", "MANAGER", "SUPPORT", "TECHNICIAN"]),
  isActive: z.boolean().optional().default(true),
});

export const UpdateUserSchema = z.object({
  email: z.string().email().optional(),
  name: z.string().min(2).max(100).optional(),
  password: z.string().min(6).optional(),
  role: z.enum(["CEO", "MANAGER", "SUPPORT", "TECHNICIAN"]).optional(),
  isActive: z.boolean().optional(),
});

export const ChangePasswordSchema = z.object({
  oldPassword: z.string().min(1, "Old password is required"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
});

// ============================================
// Provider Schemas
// ============================================

export const CreateProviderSchema = z.object({
  name: z.string().min(2).max(100),
  type: z.enum(["API", "MANUAL"]),
  defaultSlaMinutes: z.number().min(5).max(10080).optional(), // 5 min to 1 week
  contactChannel: z.string().max(200).optional(),
  notificationPreference: z.string().max(100).optional(),
  riskLevel: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  isActive: z.boolean().optional(),
});

export const UpdateProviderSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  type: z.enum(["API", "MANUAL"]).optional(),
  defaultSlaMinutes: z.number().min(5).max(10080).optional(),
  contactChannel: z.string().max(200).optional(),
  notificationPreference: z.string().max(100).optional(),
  riskLevel: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  isActive: z.boolean().optional(),
});

// ============================================
// Case Type Schemas
// ============================================

export const CreateCaseTypeSchema = z.object({
  name: z.string().min(2).max(100),
  category: z.enum(["PAYMENT", "ORDER", "SYSTEM", "PROVIDER", "OTHER"]),
  defaultSeverity: z.enum(["CRITICAL", "HIGH", "NORMAL", "LOW"]).optional(),
  defaultSlaMinutes: z.number().min(5).max(10080),
  requireProvider: z.boolean().optional(),
  requireOrderId: z.boolean().optional(),
  lineNotification: z.boolean().optional(),
  description: z.string().max(500).optional(),
  isActive: z.boolean().optional(),
});

export const UpdateCaseTypeSchema = CreateCaseTypeSchema.partial();

// ============================================
// Order Schemas
// ============================================

export const UpdateOrderSchema = z.object({
  status: z.enum([
    "PENDING",
    "PROCESSING",
    "COMPLETED",
    "FAILED",
    "REFUNDED",
    "CANCELLED",
  ]),
  providerId: z.string().cuid().optional(),
});

// ============================================
// Activity Schemas
// ============================================

export const CreateActivitySchema = z.object({
  type: z.enum([
    "CREATED",
    "STATUS_CHANGED",
    "ASSIGNED",
    "NOTE_ADDED",
    "FILE_ATTACHED",
    "SLA_UPDATED",
    "SEVERITY_CHANGED",
    "ESCALATED",
    "RESOLVED",
    "CLOSED",
    "REOPENED",
  ]),
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  oldValue: z.string().optional(),
  newValue: z.string().optional(),
});

// ============================================
// Notification Schemas
// ============================================

export const CreateNotificationTemplateSchema = z.object({
  name: z.string().min(2).max(100),
  event: z.string().min(2).max(100),
  template: z.string().min(10),
  isActive: z.boolean().optional(),
});

export const UpdateNotificationTemplateSchema = CreateNotificationTemplateSchema.partial();

export const CreateLineChannelSchema = z.object({
  name: z.string().min(2).max(100),
  accessToken: z.string().min(10),
  defaultGroupId: z.string().optional(),
  enabledEvents: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

export const UpdateLineChannelSchema = CreateLineChannelSchema.partial();

// ============================================
// Webhook Schemas
// ============================================

export const CreateWebhookSchema = z.object({
  name: z.string().min(2).max(100),
  url: z.string().url("Invalid URL"),
  secret: z.string().min(8),
  events: z.array(z.string()).min(1, "At least one event required"),
  retryCount: z.number().min(0).max(10).optional(),
  timeout: z.number().min(1000).max(60000).optional(), // 1s to 60s
  description: z.string().max(500).optional(),
  headers: z.record(z.string(), z.string()).optional(),
  isActive: z.boolean().optional(),
});

export const UpdateWebhookSchema = CreateWebhookSchema.partial();

// ============================================
// Type exports
// ============================================

export type CreateCaseInput = z.infer<typeof CreateCaseSchema>;
export type UpdateCaseInput = z.infer<typeof UpdateCaseSchema>;
export type CaseFiltersInput = z.infer<typeof CaseFiltersSchema>;

export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;

export type CreateProviderInput = z.infer<typeof CreateProviderSchema>;
export type UpdateProviderInput = z.infer<typeof UpdateProviderSchema>;

export type CreateCaseTypeInput = z.infer<typeof CreateCaseTypeSchema>;
export type UpdateCaseTypeInput = z.infer<typeof UpdateCaseTypeSchema>;

export type UpdateOrderInput = z.infer<typeof UpdateOrderSchema>;
export type CreateActivityInput = z.infer<typeof CreateActivitySchema>;

export type CreateNotificationTemplateInput = z.infer<typeof CreateNotificationTemplateSchema>;
export type UpdateNotificationTemplateInput = z.infer<typeof UpdateNotificationTemplateSchema>;

export type CreateLineChannelInput = z.infer<typeof CreateLineChannelSchema>;
export type UpdateLineChannelInput = z.infer<typeof UpdateLineChannelSchema>;

export type CreateWebhookInput = z.infer<typeof CreateWebhookSchema>;
export type UpdateWebhookInput = z.infer<typeof UpdateWebhookSchema>;

