"use client";

import { Header } from "@/components/layout/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Bell, Users, Building2, Shield, Palette, Webhook } from "lucide-react";
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
  },
  {
    title: "การแจ้งเตือน",
    description: "ตั้งค่า Line Notification และ Template",
    href: "/settings/notifications",
    icon: Bell,
    color: "text-green-500",
    bgColor: "bg-green-500/10",
  },
  {
    title: "Webhooks",
    description: "เชื่อมต่อกับระบบภายนอกผ่าน Webhooks",
    href: "/settings/webhooks",
    icon: Webhook,
    color: "text-cyan-500",
    bgColor: "bg-cyan-500/10",
  },
  {
    title: "ผู้ใช้งาน",
    description: "จัดการผู้ใช้และสิทธิ์การเข้าถึง",
    href: "/settings/users",
    icon: Users,
    color: "text-violet-500",
    bgColor: "bg-violet-500/10",
  },
  {
    title: "Providers",
    description: "จัดการ Provider และการเชื่อมต่อ",
    href: "/providers",
    icon: Building2,
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
  },
  {
    title: "ความปลอดภัย",
    description: "รหัสผ่าน, 2FA และ Session",
    href: "/settings/security",
    icon: Shield,
    color: "text-red-500",
    bgColor: "bg-red-500/10",
  },
  {
    title: "ธีมและการแสดงผล",
    description: "ปรับแต่งสี, Font และ Layout",
    href: "/settings/appearance",
    icon: Palette,
    color: "text-pink-500",
    bgColor: "bg-pink-500/10",
  },
];

export default function SettingsPage() {
  return (
    <div className="min-h-screen">
      <Header title="ตั้งค่า" />
      
      <div className="p-4 sm:p-6 max-w-4xl">
        <div className="mb-6">
          <p className="text-sm text-muted-foreground">
            จัดการการตั้งค่าระบบและการกำหนดค่าต่างๆ
          </p>
        </div>

        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {settingsItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <Card className="h-full cursor-pointer transition-all hover:border-primary/50 hover:shadow-md">
                <CardHeader className="pb-3">
                  <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center mb-2", item.bgColor)}>
                    <item.icon className={cn("h-5 w-5", item.color)} />
                  </div>
                  <CardTitle className="text-base">{item.title}</CardTitle>
                  <CardDescription className="text-sm">
                    {item.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

