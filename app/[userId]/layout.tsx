import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Sidebar } from "@/components/layout/Sidebar";
import Header from "@/components/layout/general/Header";
import SidebarComponent from "@/components/layout/general/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="w-full flex h-screen overflow-hidden">
        <SidebarComponent />
        <main className="w-full overflow-y-auto relative">
          <Header />
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
