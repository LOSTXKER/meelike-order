"use client";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Bell, Users, Building2, Shield, Palette, Webhook, ArrowRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const settingsItems = [
  {
    title: "ประเภทเคส",
    description: "จัดการประเภทเคส, SLA และความรุนแรง",
    href: "/settings/case-types",
    icon: FileText,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    borderColor: "group-hover:border-blue-500/50",
  },
  {
    title: "การแจ้งเตือน",
    description: "ตั้งค่า Line Notification และ Template",
    href: "/settings/notifications",
    icon: Bell,
    color: "text-green-500",
    bgColor: "bg-green-500/10",
    borderColor: "group-hover:border-green-500/50",
  },
  {
    title: "Webhooks",
    description: "เชื่อมต่อกับระบบภายนอกผ่าน Webhooks",
    href: "/settings/webhooks",
    icon: Webhook,
    color: "text-cyan-500",
    bgColor: "bg-cyan-500/10",
    borderColor: "group-hover:border-cyan-500/50",
  },
  {
    title: "ผู้ใช้งาน",
    description: "จัดการผู้ใช้และสิทธิ์การเข้าถึง",
    href: "/settings/users",
    icon: Users,
    color: "text-violet-500",
    bgColor: "bg-violet-500/10",
    borderColor: "group-hover:border-violet-500/50",
  },
  {
    title: "Providers",
    description: "จัดการ Provider และการเชื่อมต่อ",
    href: "/providers",
    icon: Building2,
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
    borderColor: "group-hover:border-orange-500/50",
  },
  {
    title: "ความปลอดภัย",
    description: "รหัสผ่าน, 2FA และ Session",
    href: "/settings/security",
    icon: Shield,
    color: "text-red-500",
    bgColor: "bg-red-500/10",
    borderColor: "group-hover:border-red-500/50",
  },
  {
    title: "ธีมและการแสดงผล",
    description: "ปรับแต่งสี, Font และ Layout",
    href: "/settings/appearance",
    icon: Palette,
    color: "text-pink-500",
    bgColor: "bg-pink-500/10",
    borderColor: "group-hover:border-pink-500/50",
  },
];

export default function SettingsPage() {
  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">ตั้งค่าระบบ</h1>
        <p className="text-muted-foreground">
          จัดการการตั้งค่าและการกำหนดค่าต่างๆ ของระบบ
        </p>
      </div>

      {/* Settings Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {settingsItems.map((item) => (
          <Link key={item.href} href={item.href} className="group">
            <Card className={cn(
              "h-full transition-all duration-200 hover:shadow-lg",
              item.borderColor
            )}>
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className={cn(
                    "h-12 w-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110",
                    item.bgColor
                  )}>
                    <item.icon className={cn("h-6 w-6", item.color)} />
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-1" />
                </div>
                <CardTitle className="text-lg mt-4">{item.title}</CardTitle>
                <CardDescription className="text-sm leading-relaxed">
                  {item.description}
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
