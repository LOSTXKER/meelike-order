import { Sidebar } from "@/components/layout/sidebar";
import { PrefetchData } from "@/components/prefetch/prefetch-links";

// Auth is now handled by middleware - no server-side await needed!
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="pl-64 transition-all duration-200">
        {children}
      </main>
      <PrefetchData />
    </div>
  );
}
