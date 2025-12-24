"use client";

import { LoadingScreen } from "@/components/ui/loading-screen";

export default function UsersLoading() {
  return <LoadingScreen title="กำลังโหลดข้อมูลผู้ใช้" variant="dots" />;
}
