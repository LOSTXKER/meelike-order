import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

/**
 * Role Hierarchy (highest to lowest):
 * CEO > MANAGER > SUPPORT > TECHNICIAN
 * 
 * CEO: ผู้ดูแลระบบสูงสุด - full access
 * MANAGER: ดูภาพรวม/ดูแลทีม - ดูทุกเคส, มอบหมายงาน
 * SUPPORT: รับเรื่อง/แจ้งลูกค้า - สร้างเคส, ดูทุกเคส, ปิดเคส
 * TECHNICIAN: คนแก้ปัญหา - ดูเฉพาะเคสตัวเอง
 */

/**
 * Check if user is CEO (highest level)
 */
export async function requireCEO() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return { authorized: false, session: null };
  }

  const isCEO = session.user.role === "CEO";
  
  return {
    authorized: isCEO,
    session,
  };
}

/**
 * Check if user has admin privileges (CEO only)
 * For managing users and system settings
 */
export async function requireAdmin() {
  return requireCEO();
}

/**
 * Check if user has manager privileges (CEO or MANAGER)
 * For viewing all cases, assigning work, checking SLA
 */
export async function requireManager() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return { authorized: false, session: null };
  }

  const isManager = ["CEO", "MANAGER"].includes(session.user.role);
  
  return {
    authorized: isManager,
    session,
  };
}

/**
 * Check if user is authenticated
 */
export async function requireAuth() {
  const session = await getServerSession(authOptions);
  
  return {
    authorized: !!session?.user,
    session,
  };
}

/**
 * Check if user can view a case
 * - CEO, MANAGER, SUPPORT: can view all cases
 * - TECHNICIAN: can only view own assigned cases
 */
export function canViewCase(session: any, caseOwnerId?: string | null): boolean {
  if (!session?.user) return false;
  
  // CEO, Manager, Support can view all cases
  if (["CEO", "MANAGER", "SUPPORT"].includes(session.user.role)) {
    return true;
  }
  
  // Technician can only view own cases
  return session.user.id === caseOwnerId;
}

/**
 * Check if user can modify a case
 * - CEO, MANAGER: can modify any case
 * - SUPPORT: can modify any case (for closing after notifying customer)
 * - TECHNICIAN: can only modify own assigned cases
 */
export function canModifyCase(session: any, caseOwnerId?: string | null): boolean {
  if (!session?.user) return false;
  
  // CEO, Manager, Support can modify all cases
  if (["CEO", "MANAGER", "SUPPORT"].includes(session.user.role)) {
    return true;
  }
  
  // Technician can only modify own cases
  return session.user.id === caseOwnerId;
}

/**
 * Check if user can create cases
 * - CEO: yes
 * - MANAGER: yes
 * - SUPPORT: yes (main job is to receive issues and create cases)
 * - TECHNICIAN: no
 */
export function canCreateCase(session: any): boolean {
  if (!session?.user) return false;
  
  return ["CEO", "MANAGER", "SUPPORT"].includes(session.user.role);
}

/**
 * Check if user can close cases (change to CLOSED status)
 * - CEO: yes
 * - MANAGER: yes
 * - SUPPORT: yes (after notifying customer)
 * - TECHNICIAN: no (can only mark as RESOLVED)
 */
export function canCloseCase(session: any): boolean {
  if (!session?.user) return false;
  
  return ["CEO", "MANAGER", "SUPPORT"].includes(session.user.role);
}

/**
 * Check if user can assign cases to others
 * - CEO: yes
 * - MANAGER: yes
 * - SUPPORT: no
 * - TECHNICIAN: no
 */
export function canAssignCase(session: any): boolean {
  if (!session?.user) return false;
  
  return ["CEO", "MANAGER"].includes(session.user.role);
}

/**
 * Check if user can manage users (CRUD operations)
 * - CEO: yes
 * - Others: no
 */
export function canManageUsers(session: any): boolean {
  if (!session?.user) return false;
  
  return session.user.role === "CEO";
}

/**
 * Check if user can access system settings
 * - CEO: all settings
 * - MANAGER: some settings (case types, notifications)
 * - SUPPORT: no
 * - TECHNICIAN: no
 */
export function canAccessSettings(session: any, settingType?: string): boolean {
  if (!session?.user) return false;
  
  if (session.user.role === "CEO") {
    return true;
  }
  
  if (session.user.role === "MANAGER") {
    // Manager can access some settings
    const allowedSettings = ["case-types", "notifications"];
    return !settingType || allowedSettings.includes(settingType);
  }
  
  return false;
}
