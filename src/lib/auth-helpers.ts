import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

/**
 * Check if user has admin privileges (ADMIN or CEO)
 */
export async function requireAdmin() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return { authorized: false, session: null };
  }

  const isAdmin = session.user.role === "ADMIN" || session.user.role === "CEO";
  
  return {
    authorized: isAdmin,
    session,
  };
}

/**
 * Check if user has manager privileges (ADMIN, CEO, or MANAGER)
 */
export async function requireManager() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return { authorized: false, session: null };
  }

  const isManager = ["ADMIN", "CEO", "MANAGER"].includes(session.user.role);
  
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
 * Check if user can modify resource (owner or admin/CEO)
 */
export function canModify(session: any, resourceOwnerId?: string | null): boolean {
  if (!session?.user) return false;
  
  // Admin and CEO can modify anything
  if (session.user.role === "ADMIN" || session.user.role === "CEO") {
    return true;
  }
  
  // Otherwise, must be the owner
  return session.user.id === resourceOwnerId;
}

