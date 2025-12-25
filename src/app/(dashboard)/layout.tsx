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
      {/* Responsive main content */}
      <main className="min-h-screen transition-all duration-200 lg:pl-64">
        <div className="p-4 pt-20 lg:p-6 lg:pt-6">
          {children}
        </div>
      </main>
      <PrefetchData />
    </div>
  );
}
