import { Footer, Header } from "@/features/silver-platform/components";
import { SilverCustomerDashboardPage } from "@/features/customer-dashboard/pages/SilverCustomerDashboardPage";

export function UserRouteFrame() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <SilverCustomerDashboardPage />
      <Footer />
    </div>
  );
}
