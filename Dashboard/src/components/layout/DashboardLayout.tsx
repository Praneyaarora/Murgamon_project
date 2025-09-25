import { SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar />
      <div className="flex-1">
        <header className="h-16 flex items-center border-b bg-card px-6 shadow-soft">
          <SidebarTrigger />
          <div className="flex-1 ml-4">
            <h1 className="text-xl font-semibold text-foreground">
              Agricultural Monitoring Dashboard
            </h1>
          </div>
        </header>
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}