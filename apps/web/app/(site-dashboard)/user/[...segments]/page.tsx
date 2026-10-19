import { notFound } from "next/navigation";

import { isCustomerDashboardSegments } from "@/features/customer-dashboard/config/customer-dashboard-routes";
import { UserRouteFrame } from "../UserRouteFrame";

export { metadata } from "../page";

export default async function UserCatchAllPage({ params }: { params: Promise<{ segments?: string[] }> }) {
  const { segments = [] } = await params;
  if (!isCustomerDashboardSegments(segments)) notFound();
  return <UserRouteFrame />;
}
