"use client";

import { Header } from "@/components/layout/header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Palette, Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export default function AppearancePage() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="min-h-screen">
      <Header title="ธีมและการแสดงผล" />

      <div className="p-6 max-w-3xl mx-auto space-y-6">
        {/* Theme Selection */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              <CardTitle>ธีม</CardTitle>
            </div>
            <CardDescription>
              เลือกธีมที่คุณต้องการใช้งาน
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              {/* Light Theme */}
              <button
                onClick={() => setTheme("light")}
                className={`relative rounded-lg border-2 p-4 cursor-pointer transition-all ${
                  theme === "light"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <div className="flex flex-col items-center gap-3">
                  <div className="rounded-full bg-yellow-500 p-3">
                    <Sun className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-center">
                    <div className="font-medium">Light</div>
                    <div className="text-xs text-muted-foreground">สว่าง</div>
                  </div>
                </div>
                {theme === "light" && (
                  <div className="absolute top-2 right-2">
                    <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                      <svg
                        className="h-3 w-3 text-primary-foreground"
                        fill="none"
                        strokeWidth="3"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                  </div>
                )}
              </button>

              {/* Dark Theme */}
              <button
                onClick={() => setTheme("dark")}
                className={`relative rounded-lg border-2 p-4 cursor-pointer transition-all ${
                  theme === "dark"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <div className="flex flex-col items-center gap-3">
                  <div className="rounded-full bg-slate-800 p-3">
                    <Moon className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-center">
                    <div className="font-medium">Dark</div>
                    <div className="text-xs text-muted-foreground">มืด</div>
                  </div>
                </div>
                {theme === "dark" && (
                  <div className="absolute top-2 right-2">
                    <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                      <svg
                        className="h-3 w-3 text-primary-foreground"
                        fill="none"
                        strokeWidth="3"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                  </div>
                )}
              </button>

              {/* System Theme */}
              <button
                onClick={() => setTheme("system")}
                className={`relative rounded-lg border-2 p-4 cursor-pointer transition-all ${
                  theme === "system"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <div className="flex flex-col items-center gap-3">
                  <div className="rounded-full bg-gradient-to-br from-yellow-500 to-slate-800 p-3">
                    <Monitor className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-center">
                    <div className="font-medium">System</div>
                    <div className="text-xs text-muted-foreground">ระบบ</div>
                  </div>
                </div>
                {theme === "system" && (
                  <div className="absolute top-2 right-2">
                    <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                      <svg
                        className="h-3 w-3 text-primary-foreground"
                        fill="none"
                        strokeWidth="3"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                  </div>
                )}
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Display Settings */}
        <Card>
          <CardHeader>
            <CardTitle>การแสดงผล</CardTitle>
            <CardDescription>
              ปรับแต่งการแสดงผลของระบบ
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>แสดง Animation</Label>
                <div className="text-sm text-muted-foreground">
                  เปิด/ปิดเอฟเฟกต์การเคลื่อนไหว
                </div>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Compact Mode</Label>
                <div className="text-sm text-muted-foreground">
                  ลดขนาดช่องว่างระหว่างองค์ประกอบ
                </div>
              </div>
              <Switch />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>แสดงไอคอน Sidebar</Label>
                <div className="text-sm text-muted-foreground">
                  แสดงไอคอนในแถบเมนูด้านข้าง
                </div>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* Preview */}
        <Card>
          <CardHeader>
            <CardTitle>ตัวอย่าง</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-4 rounded-lg border bg-card">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold">
                    A
                  </div>
                  <div>
                    <div className="font-medium">Admin User</div>
                    <div className="text-sm text-muted-foreground">
                      admin@meelike.com
                    </div>
                  </div>
                </div>
                <p className="text-sm">
                  นี่คือตัวอย่างการแสดงผลของธีมที่คุณเลือก
                </p>
                <div className="mt-3 flex gap-2">
                  <Button size="sm">Primary Button</Button>
                  <Button size="sm" variant="outline">
                    Secondary
                  </Button>
                  <Button size="sm" variant="ghost">
                    Ghost
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Future Features */}
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-base">ฟีเจอร์ที่กำลังจะมา</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-muted-foreground/50" />
                เลือก Font ที่ต้องการ
              </li>
              <li className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-muted-foreground/50" />
                ปรับแต่งสีของธีม (Color Picker)
              </li>
              <li className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-muted-foreground/50" />
                เลือก Layout แบบต่างๆ
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}



