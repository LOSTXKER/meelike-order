"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Inbox,
  Building2,
  Settings,
  Users,
  BarChart3,
  Bell,
  FileText,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useState, useEffect } from "react";

const navigation = [
  {
    name: "Dashboard",
    nameTh: "แดชบอร์ด",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Cases",
    nameTh: "เคส",
    href: "/cases",
    icon: Inbox,
  },
  {
    name: "Providers",
    nameTh: "Providers",
    href: "/providers",
    icon: Building2,
  },
  {
    name: "Reports",
    nameTh: "รายงาน",
    href: "/reports",
    icon: BarChart3,
  },
  {
    name: "Team",
    nameTh: "ทีม",
    href: "/team",
    icon: Users,
  },
];

const settingsNav = [
  {
    name: "Case Types",
    nameTh: "ประเภทเคส",
    href: "/settings/case-types",
    icon: FileText,
  },
  {
    name: "Notifications",
    nameTh: "การแจ้งเตือน",
    href: "/settings/notifications",
    icon: Bell,
  },
  {
    name: "Settings",
    nameTh: "ตั้งค่า",
    href: "/settings",
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [collapsed, setCollapsed] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check for saved theme preference or system preference
    const savedTheme = localStorage.getItem("theme");
    const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const shouldBeDark = savedTheme === "dark" || (!savedTheme && systemDark);
    setIsDark(shouldBeDark);
    document.documentElement.classList.toggle("dark", shouldBeDark);
  }, []);

  const toggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    localStorage.setItem("theme", newIsDark ? "dark" : "light");
    document.documentElement.classList.toggle("dark", newIsDark);
  };

  const handleSignOut = () => {
    signOut({ callbackUrl: "/login" });
  };

  // Get user initials for avatar
  const getInitials = (name: string | null | undefined) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Get role badge color
  const getRoleColor = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-red-500/10 text-red-500";
      case "MANAGER":
        return "bg-purple-500/10 text-purple-500";
      case "CEO":
        return "bg-amber-500/10 text-amber-500";
      default:
        return "bg-blue-500/10 text-blue-500";
    }
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen border-r border-sidebar-border bg-sidebar transition-all duration-200",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
          {!collapsed && (
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <span className="text-sm font-bold text-primary-foreground">M</span>
              </div>
              <span className="font-semibold text-sidebar-foreground">MIMS</span>
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-2">
          <div className="space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  {!collapsed && <span>{item.nameTh}</span>}
                </Link>
              );
            })}
          </div>

          <div className="my-4 border-t border-sidebar-border" />

          <div className="space-y-1">
            {settingsNav.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  {!collapsed && <span>{item.nameTh}</span>}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* User & Theme */}
        <div className="border-t border-sidebar-border p-2 space-y-2">
          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size={collapsed ? "icon" : "default"}
            className={cn("w-full", collapsed ? "justify-center" : "justify-start gap-3")}
            onClick={toggleTheme}
          >
            {isDark ? (
              <Sun className="h-5 w-5 shrink-0" />
            ) : (
              <Moon className="h-5 w-5 shrink-0" />
            )}
            {!collapsed && <span>{isDark ? "Light Mode" : "Dark Mode"}</span>}
          </Button>

          {/* User Info */}
          {session?.user && (
            <div className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5",
              collapsed && "justify-center px-0"
            )}>
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs">
                  {getInitials(session.user.name)}
                </AvatarFallback>
              </Avatar>
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-sidebar-foreground truncate">
                    {session.user.name}
                  </p>
                  <span className={cn(
                    "inline-block text-[10px] font-medium px-1.5 py-0.5 rounded",
                    getRoleColor(session.user.role)
                  )}>
                    {session.user.role}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Logout */}
          <Button
            variant="ghost"
            size={collapsed ? "icon" : "default"}
            className={cn(
              "w-full text-destructive hover:text-destructive hover:bg-destructive/10",
              collapsed ? "justify-center" : "justify-start gap-3"
            )}
            onClick={handleSignOut}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {!collapsed && <span>ออกจากระบบ</span>}
          </Button>
        </div>
      </div>
    </aside>
  );
}
