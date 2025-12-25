/**
 * Type Exports
 * 
 * Centralized type definitions using Prisma-generated types.
 * This ensures consistency across the application.
 */

import { Prisma } from "@prisma/client";

// ============================================
// Case Types
// ============================================

export type Case = Prisma.CaseGetPayload<{
  include: {
    caseType: true;
    owner: {
      select: {
        id: true;
        name: true;
        email: true;
        role: true;
      };
    };
    provider: true;
    orders: true;
    activities: {
      include: {
        user: {
          select: {
            id: true;
            name: true;
          };
        };
      };
    };
    attachments: {
      include: {
        uploadedBy: {
          select: {
            id: true;
            name: true;
          };
        };
      };
    };
  };
}>;

export type CaseWithBasicRelations = Prisma.CaseGetPayload<{
  include: {
    caseType: {
      select: {
        id: true;
        name: true;
        category: true;
      };
    };
    owner: {
      select: {
        id: true;
        name: true;
        email: true;
      };
    };
    provider: {
      select: {
        id: true;
        name: true;
      };
    };
  };
}>;

export type CaseActivity = Prisma.CaseActivityGetPayload<{
  include: {
    user: {
      select: {
        id: true;
        name: true;
      };
    };
  };
}>;

// ============================================
// User Types
// ============================================

export type User = Prisma.UserGetPayload<{}>;

export type UserWithStats = Prisma.UserGetPayload<{
  select: {
    id: true;
    name: true;
    email: true;
    role: true;
    isActive: true;
    createdAt: true;
    _count: {
      select: {
        ownedCases: true;
      };
    };
  };
}>;

// ============================================
// Provider Types
// ============================================

export type Provider = Prisma.ProviderGetPayload<{}>;

export type ProviderWithStats = Prisma.ProviderGetPayload<{
  include: {
    _count: {
      select: {
        orders: true;
        cases: true;
      };
    };
  };
}>;

// ============================================
// Case Type Types
// ============================================

export type CaseType = Prisma.CaseTypeGetPayload<{}>;

export type CaseTypeWithCount = Prisma.CaseTypeGetPayload<{
  include: {
    _count: {
      select: {
        cases: true;
      };
    };
  };
}>;

// ============================================
// Order Types
// ============================================

export type Order = Prisma.OrderGetPayload<{
  include: {
    provider: {
      select: {
        id: true;
        name: true;
      };
    };
  };
}>;

// ============================================
// Attachment Types
// ============================================

export type Attachment = Prisma.AttachmentGetPayload<{
  include: {
    uploadedBy: {
      select: {
        id: true;
        name: true;
      };
    };
  };
}>;

// ============================================
// Notification Types
// ============================================

export type NotificationTemplate = Prisma.NotificationTemplateGetPayload<{}>;
export type LineChannel = Prisma.LineChannelGetPayload<{}>;

// ============================================
// Webhook Types
// ============================================

export type Webhook = Prisma.WebhookGetPayload<{}>;

// Note: WebhookLog model doesn't exist in schema, removed
// export type WebhookLog = Prisma.WebhookLogGetPayload<{}>;

// ============================================
// Enum Re-exports
// ============================================

export {
  UserRole,
  CaseStatus,
  Severity,
  OrderStatus,
  CaseCategory,
  CaseSource,
  ActivityType,
  ProviderType,
  RiskLevel,
} from "@prisma/client";

// ============================================
// Session Types (for NextAuth)
// ============================================

export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
}

export interface AuthSession {
  user: SessionUser;
  expires: string;
}

// ============================================
// API Response Types
// ============================================

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedApiResponse<T> extends ApiResponse<T> {
  pagination?: PaginationMeta;
}

// ============================================
// Dashboard Types
// ============================================

export interface DashboardStats {
  totalCases: number;
  newCases: number;
  inProgressCases: number;
  resolvedCases: number;
  criticalCases: number;
  highPriorityCases: number;
  slaMissed: number;
  slaWarning: number;
  recentCases: CaseWithBasicRelations[];
  casesByStatus: Array<{ status: string; count: number }>;
  casesBySeverity: Array<{ severity: string; count: number }>;
  casesByCategory: Array<{ category: string; count: number }>;
}

// ============================================
// Report Types
// ============================================

export interface ReportData {
  casesByStatus: Array<{ status: string; _count: { id: number } }>;
  casesBySeverity: Array<{ severity: string; _count: { id: number } }>;
  casesByCategory: Array<{ category: string; _count: { id: number } }>;
  monthlyData: Array<{ month: string; count: number }>;
  avgResolutionTime: number;
  slaComplianceRate: number;
  topCaseTypes: Array<{ name: string; count: number }>;
  topProviders: Array<{ name: string; count: number }>;
  growthRate: number;
}

// ============================================
// Team Types
// ============================================

export interface TeamMember {
  id: string;
  name: string | null;
  email: string;
  role: string;
  isActive: boolean;
  activeCases: number;
  resolvedCases: number;
  totalCases: number;
  avgResolutionTime: number | null;
  successRate: number;
}
