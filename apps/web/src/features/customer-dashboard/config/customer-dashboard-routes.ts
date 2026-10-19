import { customerDashboardNavigation } from "@/features/customer-dashboard/config/customer-dashboard-navigation";

const dashboardRoot = "/user";
const exactDashboardPaths = new Set(customerDashboardNavigation.flatMap((group) => group.items.map((item) => item.href)));
const legacyDashboardPaths = new Set(["/user/sell-silver"]);

const detailRoutePatterns = [
  /^silver-wallet$/,
  /^toman-wallet$/,
  /^delivery\/tracking$/,
  /^certificates$/,
  /^account\/(?:profile|security|password|sessions|two-factor|addresses)$/,
  /^support\/live-chat(?:\/[^/]+)?$/,
  /^support\/tickets(?:\/open|\/[^/]+)?$/,
  /^notifications(?:\/[^/]+)?$/,
  /^payments\/[^/]+$/,
];

export function isCustomerDashboardSegments(segments: string[] = []) {
  if (!segments.length) return true;
  const normalized = segments.filter(Boolean).join("/");
  if (!normalized) return true;
  if (exactDashboardPaths.has(`${dashboardRoot}/${normalized}`) || legacyDashboardPaths.has(`${dashboardRoot}/${normalized}`)) return true;
  return detailRoutePatterns.some((pattern) => pattern.test(normalized));
}
