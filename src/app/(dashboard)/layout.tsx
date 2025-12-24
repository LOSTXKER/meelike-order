import { Sidebar } from "@/components/layout/sidebar";
import { requireAuth } from "@/lib/auth";
import { PrefetchData } from "@/components/prefetch/prefetch-links";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Require authentication for all dashboard pages
  await requireAuth();

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
