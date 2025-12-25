"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { cn } from "@/lib/utils";
import { 
  FileText, 
  Bell, 
  Users, 
  Shield, 
  Palette, 
  Webhook,
  ChevronRight,
  Settings,
  Menu
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";

const settingsNav = [
  {
    title: "ประเภทเคส",
    href: "/settings/case-types",
    icon: FileText,
    description: "จัดการประเภทเคส และ SLA",
  },
  {
    title: "การแจ้งเตือน",
    href: "/settings/notifications",
    icon: Bell,
    description: "Line Notification",
  },
  {
    title: "Webhooks",
    href: "/settings/webhooks",
    icon: Webhook,
    description: "เชื่อมต่อระบบภายนอก",
  },
  {
    title: "ผู้ใช้งาน",
    href: "/settings/users",
    icon: Users,
    description: "จัดการผู้ใช้และสิทธิ์",
  },
  {
    title: "ความปลอดภัย",
    href: "/settings/security",
    icon: Shield,
    description: "รหัสผ่านและความปลอดภัย",
  },
  {
    title: "ธีม",
    href: "/settings/appearance",
    icon: Palette,
    description: "ปรับแต่งการแสดงผล",
  },
];

function SettingsSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  
  return (
    <nav className="space-y-1">
      {settingsNav.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group",
              isActive 
                ? "bg-primary text-primary-foreground" 
                : "hover:bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            <item.icon className={cn(
              "h-4 w-4 shrink-0",
              isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
            )} />
            <div className="flex-1 min-w-0">
              <p className={cn(
                "text-sm font-medium truncate",
                isActive ? "text-primary-foreground" : ""
              )}>
                {item.title}
              </p>
              <p className={cn(
                "text-xs truncate",
                isActive ? "text-primary-foreground/70" : "text-muted-foreground"
              )}>
                {item.description}
              </p>
            </div>
            <ChevronRight className={cn(
              "h-4 w-4 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity",
              isActive ? "opacity-100 text-primary-foreground" : ""
            )} />
          </Link>
        );
      })}
    </nav>
  );
}

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sheetOpen, setSheetOpen] = useState(false);
  
  // Find current page title
  const currentPage = settingsNav.find(item => item.href === pathname);
  const isMainSettings = pathname === "/settings";
  
  return (
    <div className="min-h-screen">
      <Header title="ตั้งค่า" />
      
      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-64 shrink-0 border-r bg-muted/30 min-h-[calc(100vh-57px)]">
          <div className="p-4 sticky top-[57px]">
            <div className="flex items-center gap-2 mb-4 px-3">
              <Settings className="h-5 w-5 text-muted-foreground" />
              <h2 className="font-semibold">ตั้งค่าระบบ</h2>
            </div>
            <SettingsSidebar />
          </div>
        </aside>
        
        {/* Main Content */}
        <main className="flex-1 min-w-0">
          {/* Mobile Header with Menu */}
          {!isMainSettings && (
            <div className="lg:hidden border-b bg-background sticky top-[57px] z-10">
              <div className="flex items-center gap-3 p-3">
                <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="icon" className="shrink-0">
                      <Menu className="h-4 w-4" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-72 p-0">
                    <div className="p-4 border-b">
                      <div className="flex items-center gap-2">
                        <Settings className="h-5 w-5 text-muted-foreground" />
                        <h2 className="font-semibold">ตั้งค่าระบบ</h2>
                      </div>
                    </div>
                    <div className="p-4">
                      <SettingsSidebar onNavigate={() => setSheetOpen(false)} />
                    </div>
                  </SheetContent>
                </Sheet>
                
                {currentPage && (
                  <div className="flex items-center gap-2 min-w-0">
                    <currentPage.icon className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="font-medium truncate">{currentPage.title}</span>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Page Content */}
          <div className="p-4 sm:p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

