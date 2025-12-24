// Case Status definitions with display info
export const CASE_STATUS = {
  NEW: {
    value: "NEW",
    label: "ใหม่",
    labelEn: "New",
    color: "status-new",
    bgColor: "bg-blue-500/10",
    textColor: "text-blue-600 dark:text-blue-400",
  },
  INVESTIGATING: {
    value: "INVESTIGATING",
    label: "กำลังตรวจสอบ",
    labelEn: "Investigating",
    color: "status-investigating",
    bgColor: "bg-violet-500/10",
    textColor: "text-violet-600 dark:text-violet-400",
  },
  WAITING_CUSTOMER: {
    value: "WAITING_CUSTOMER",
    label: "รอลูกค้า",
    labelEn: "Waiting Customer",
    color: "status-waiting-customer",
    bgColor: "bg-amber-500/10",
    textColor: "text-amber-600 dark:text-amber-400",
  },
  WAITING_PROVIDER: {
    value: "WAITING_PROVIDER",
    label: "รอ Provider",
    labelEn: "Waiting Provider",
    color: "status-waiting-provider",
    bgColor: "bg-orange-500/10",
    textColor: "text-orange-600 dark:text-orange-400",
  },
  FIXING: {
    value: "FIXING",
    label: "กำลังแก้ไข",
    labelEn: "Fixing",
    color: "status-fixing",
    bgColor: "bg-cyan-500/10",
    textColor: "text-cyan-600 dark:text-cyan-400",
  },
  RESOLVED: {
    value: "RESOLVED",
    label: "แก้ไขแล้ว",
    labelEn: "Resolved",
    color: "status-resolved",
    bgColor: "bg-green-500/10",
    textColor: "text-green-600 dark:text-green-400",
  },
  CLOSED: {
    value: "CLOSED",
    label: "ปิดเคส",
    labelEn: "Closed",
    color: "status-closed",
    bgColor: "bg-gray-500/10",
    textColor: "text-gray-600 dark:text-gray-400",
  },
} as const;

// Severity definitions
export const SEVERITY = {
  CRITICAL: {
    value: "CRITICAL",
    label: "วิกฤต",
    labelEn: "Critical",
    color: "severity-critical",
    bgColor: "bg-red-500/10",
    textColor: "text-red-600 dark:text-red-400",
    priority: 1,
  },
  HIGH: {
    value: "HIGH",
    label: "สูง",
    labelEn: "High",
    color: "severity-high",
    bgColor: "bg-orange-500/10",
    textColor: "text-orange-600 dark:text-orange-400",
    priority: 2,
  },
  NORMAL: {
    value: "NORMAL",
    label: "ปกติ",
    labelEn: "Normal",
    color: "severity-normal",
    bgColor: "bg-blue-500/10",
    textColor: "text-blue-600 dark:text-blue-400",
    priority: 3,
  },
  LOW: {
    value: "LOW",
    label: "ต่ำ",
    labelEn: "Low",
    color: "severity-low",
    bgColor: "bg-gray-500/10",
    textColor: "text-gray-600 dark:text-gray-400",
    priority: 4,
  },
} as const;

// Case categories
export const CASE_CATEGORY = {
  PAYMENT: { value: "PAYMENT", label: "การชำระเงิน", labelEn: "Payment" },
  ORDER: { value: "ORDER", label: "ออเดอร์", labelEn: "Order" },
  SYSTEM: { value: "SYSTEM", label: "ระบบ", labelEn: "System" },
  PROVIDER: { value: "PROVIDER", label: "Provider", labelEn: "Provider" },
  OTHER: { value: "OTHER", label: "อื่นๆ", labelEn: "Other" },
} as const;

// Case sources
export const CASE_SOURCE = {
  LINE: { value: "LINE", label: "Line", icon: "MessageCircle" },
  TICKET: { value: "TICKET", label: "Ticket", icon: "Ticket" },
  API: { value: "API", label: "API", icon: "Code" },
  MANUAL: { value: "MANUAL", label: "สร้างเอง", icon: "PenLine" },
} as const;

// User roles
export const USER_ROLE = {
  ADMIN: { value: "ADMIN", label: "Admin", permissions: ["all"] },
  SUPPORT: { value: "SUPPORT", label: "Support", permissions: ["cases", "timeline"] },
  MANAGER: { value: "MANAGER", label: "Manager", permissions: ["cases", "timeline", "reports"] },
  CEO: { value: "CEO", label: "CEO", permissions: ["dashboard", "reports", "performance"] },
} as const;

// State machine transitions
export const STATUS_TRANSITIONS: Record<string, string[]> = {
  NEW: ["INVESTIGATING", "CLOSED"],
  INVESTIGATING: ["WAITING_CUSTOMER", "WAITING_PROVIDER", "FIXING", "RESOLVED", "CLOSED"],
  WAITING_CUSTOMER: ["INVESTIGATING", "FIXING", "RESOLVED", "CLOSED"],
  WAITING_PROVIDER: ["INVESTIGATING", "FIXING", "RESOLVED", "CLOSED"],
  FIXING: ["RESOLVED", "WAITING_CUSTOMER", "WAITING_PROVIDER", "CLOSED"],
  RESOLVED: ["CLOSED", "INVESTIGATING"], // Can reopen
  CLOSED: ["INVESTIGATING"], // Can reopen
};

// Root cause options
export const ROOT_CAUSES = [
  { value: "PROVIDER_ISSUE", label: "ปัญหาจาก Provider", labelEn: "Provider Issue" },
  { value: "PAYMENT_GATEWAY", label: "ปัญหา Payment Gateway", labelEn: "Payment Gateway" },
  { value: "SYSTEM_BUG", label: "Bug ของระบบ", labelEn: "System Bug" },
  { value: "USER_ERROR", label: "ความผิดพลาดของผู้ใช้", labelEn: "User Error" },
  { value: "PROCESS_ERROR", label: "ความผิดพลาดของกระบวนการ", labelEn: "Process Error" },
  { value: "NETWORK_ISSUE", label: "ปัญหาเครือข่าย", labelEn: "Network Issue" },
  { value: "OTHER", label: "อื่นๆ", labelEn: "Other" },
] as const;


