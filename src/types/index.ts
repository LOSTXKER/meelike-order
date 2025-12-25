// Type definitions for the MIMS system

export type CaseStatus = 
  | "NEW"
  | "INVESTIGATING"
  | "WAITING_CUSTOMER"
  | "WAITING_PROVIDER"
  | "FIXING"
  | "RESOLVED"
  | "CLOSED";

export type Severity = "CRITICAL" | "HIGH" | "NORMAL" | "LOW";

export type CaseCategory = "PAYMENT" | "ORDER" | "SYSTEM" | "PROVIDER" | "OTHER";

export type CaseSource = "LINE" | "TICKET" | "API" | "MANUAL";

export type UserRole = "ADMIN" | "SUPPORT" | "MANAGER" | "CEO";

export type ActivityType =
  | "CREATED"
  | "STATUS_CHANGED"
  | "ASSIGNED"
  | "NOTE_ADDED"
  | "FILE_ATTACHED"
  | "SLA_UPDATED"
  | "SEVERITY_CHANGED"
  | "ESCALATED"
  | "RESOLVED"
  | "CLOSED"
  | "REOPENED";

// Dashboard stats
export interface DashboardStats {
  totalCases: number;
  newCases: number;
  inProgressCases: number;
  resolvedToday: number;
  slaMissed: number;
  avgResolutionTime: number;
  casesByStatus: Record<CaseStatus, number>;
  casesBySeverity: Record<Severity, number>;
  recentCases: CaseListItem[];
}

// Case list item (for tables)
export interface CaseListItem {
  id: string;
  caseNumber: string;
  title: string;
  status: CaseStatus;
  severity: Severity;
  caseType: {
    id: string;
    name: string;
    category: CaseCategory;
  };
  owner?: {
    id: string;
    name: string | null;
  };
  provider?: {
    id: string;
    name: string;
  };
  customerName?: string;
  slaDeadline?: Date;
  slaMissed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Case detail
export interface CaseDetail extends CaseListItem {
  description?: string;
  customerId?: string;
  customerContact?: string;
  source: CaseSource;
  rootCause?: string;
  resolution?: string;
  firstResponseAt?: Date;
  resolvedAt?: Date;
  closedAt?: Date;
  orders: OrderInfo[];
  activities: ActivityItem[];
}

// Order info
export interface OrderInfo {
  id: string;
  orderId: string;
  amount: number;
  status: string;
  provider?: {
    id: string;
    name: string;
  };
  createdAt: Date;
}

// Activity item
export interface ActivityItem {
  id: string;
  type: ActivityType;
  title: string;
  description?: string;
  oldValue?: string;
  newValue?: string;
  user?: {
    id: string;
    name: string | null;
  };
  attachmentUrl?: string;
  createdAt: Date;
}

// Form types
export interface CreateCaseInput {
  title: string;
  description?: string;
  caseTypeId: string;
  severity?: Severity;
  source?: CaseSource;
  customerName?: string;
  customerId?: string;
  customerContact?: string;
  providerId?: string;
  orderIds?: string[];
}

export interface UpdateCaseInput {
  title?: string;
  description?: string;
  status?: CaseStatus;
  severity?: Severity;
  ownerId?: string;
  providerId?: string;
  rootCause?: string;
  resolution?: string;
}

// Provider stats
export interface ProviderStats {
  id: string;
  name: string;
  totalCases: number;
  resolvedCases: number;
  avgResolutionMinutes: number | null;
  refundRate: number | null;
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

// Staff performance
export interface StaffPerformance {
  id: string;
  name: string;
  totalCases: number;
  resolvedCases: number;
  slaCompliance: number;
  avgResponseTime: number;
  avgResolutionTime: number;
  criticalCases: number;
  performanceScore: number;
}



