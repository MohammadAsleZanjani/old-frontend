import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AdminAccessPage } from "@/features/admin/pages/AdminAccessPage";
import { AdminAcquisitionCampaignPage } from "@/features/admin/pages/AdminAcquisitionCampaignPage";
import { AdminAuditLogsPage } from "@/features/admin/pages/AdminAuditLogsPage";
import { AdminBlogEditorPage } from "@/features/admin/pages/AdminBlogEditorPage";
import { AdminCmsPageEditorPage } from "@/features/admin/pages/AdminCmsPageEditorPage";
import { AdminDashboardPage } from "@/features/admin/pages/AdminDashboardPage";
import { AdminGatewayTransactionsPage } from "@/features/admin/pages/AdminGatewayTransactionsPage";
import { AdminInvoiceCreatePage } from "@/features/admin/pages/AdminInvoiceCreatePage";
import { AdminInvoiceDetailPage } from "@/features/admin/pages/AdminInvoiceDetailPage";
import { AdminLocalizationPage } from "@/features/admin/pages/AdminLocalizationPage";
import { AdminLiveChatDetailPage } from "@/features/admin/pages/AdminLiveChatDetailPage";
import { AdminModerationPage } from "@/features/admin/pages/AdminModerationPage";
import { AdminNotificationCreatePage } from "@/features/admin/pages/AdminNotificationCreatePage";
import { AdminNotificationBroadcastsPage } from "@/features/admin/pages/AdminNotificationBroadcastsPage";
import { AdminNotificationDetailPage } from "@/features/admin/pages/AdminNotificationDetailPage";
import { AdminNotificationsPage } from "@/features/admin/pages/AdminNotificationsPage";
import { AdminOrderDetailPage } from "@/features/admin/pages/AdminOrderDetailPage";
import { AdminPaymentDetailPage } from "@/features/admin/pages/AdminPaymentDetailPage";
import { AdminProfilePage } from "@/features/admin/pages/AdminProfilePage";
import { AdminPromotionsPage } from "@/features/admin/pages/AdminPromotionsPage";
import { AdminReportsPage } from "@/features/admin/pages/AdminReportsPage";
import { AdminReferralsPage, type AdminReferralsPageMode } from "@/features/admin/pages/AdminReferralsPage";
import { AdminRefundDetailPage } from "@/features/admin/pages/AdminRefundDetailPage";
import { AdminSectionPage } from "@/features/admin/pages/AdminSectionPage";
import { AdminSeoPage } from "@/features/admin/pages/AdminSeoPage";
import { AdminSettingsPage } from "@/features/admin/pages/AdminSettingsPage";
import { AdminSilverControlPage } from "@/features/admin/pages/AdminSilverControlPage";
import { AdminSilverHoldingsPage } from "@/features/admin/pages/AdminSilverHoldingsPage";
import { AdminSilverOrderDetailPage } from "@/features/admin/pages/AdminSilverOrderDetailPage";
import { AdminStaffCreatePage } from "@/features/admin/pages/AdminStaffCreatePage";
import { AdminTicketCreatePage } from "@/features/admin/pages/AdminTicketCreatePage";
import { AdminTicketDetailPage } from "@/features/admin/pages/AdminTicketDetailPage";
import { AdminTomanWithdrawalsPage } from "@/features/admin/pages/AdminTomanWithdrawalsPage";
import { AdminUserCreatePage } from "@/features/admin/pages/AdminUserCreatePage";
import { AdminUserDetailPage } from "@/features/admin/pages/AdminUserDetailPage";
import { AdminWalletAdjustmentsPage } from "@/features/admin/pages/AdminWalletAdjustmentsPage";
import { AdminWalletTransactionDetailPage } from "@/features/admin/pages/AdminWalletTransactionDetailPage";
import { AdminWalletTransactionsPage } from "@/features/admin/pages/AdminWalletTransactionsPage";
import { AdminWheelPage } from "@/features/admin/pages/AdminWheelPage";
import { ProductEditorPage } from "@/features/admin/pages/ProductEditorPage";
import { ProductInventoryPage } from "@/features/admin/pages/ProductInventoryPage";
import { ProductTaxonomyPage, type TaxonomyKind } from "@/features/admin/pages/ProductTaxonomyPage";

export const metadata: Metadata = {
  robots: "noindex,nofollow",
  title: "مدیریت نقره",
};

export default function AdminPage({ params, searchParams }: { params: Promise<{ segments?: string[] }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <AdminRoute params={params} searchParams={searchParams} />;
}

async function AdminRoute({ params, searchParams }: { params: Promise<{ segments?: string[] }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [resolved, query] = await Promise.all([params, searchParams]);
  if (!resolved.segments?.length) {
    return <AdminDashboardPage />;
  }
  if (resolved.segments[0] === "users" && resolved.segments[1] === "create") {
    return <AdminUserCreatePage />;
  }
  if (resolved.segments[0] === "users" && resolved.segments[1] && resolved.segments[2] === "edit") {
    return <AdminUserDetailPage userId={resolved.segments[1]} />;
  }
  if (resolved.segments[0] === "users" && resolved.segments.length === 1) {
    return <AdminAccessPage initialSearch={typeof query.search === "string" ? query.search : undefined} mode="users" userScope="all" />;
  }
  if (resolved.segments[0] === "reports") {
    return <AdminReportsPage />;
  }
  if (resolved.segments[0] === "silver" && resolved.segments[1] === "live-price") {
    return <AdminSilverControlPage mode="price" />;
  }
  if (resolved.segments[0] === "silver" && resolved.segments[1] === "settings") {
    return <AdminSilverControlPage mode="settings" />;
  }
  if (resolved.segments[0] === "silver" && resolved.segments[1] === "holdings") {
    return <AdminSilverHoldingsPage />;
  }
  if (resolved.segments[0] === "finance" && resolved.segments[1] === "fees") {
    return <AdminSilverControlPage mode="settings" />;
  }
  if (resolved.segments[0] === "finance" && resolved.segments[1] === "wallet-adjustments") {
    return <AdminWalletAdjustmentsPage initialUserId={typeof query.userId === "string" ? query.userId : undefined} />;
  }
  if (resolved.segments[0] === "finance" && resolved.segments[1] === "wallet-transactions" && resolved.segments[2]) {
    return <AdminWalletTransactionDetailPage transactionId={resolved.segments[2]} />;
  }
  if (resolved.segments[0] === "finance" && resolved.segments[1] === "wallet-transactions") {
    return <AdminWalletTransactionsPage initialUserId={typeof query.userId === "string" ? query.userId : undefined} />;
  }
  if (resolved.segments[0] === "finance" && resolved.segments[1] === "withdrawals") {
    return <AdminTomanWithdrawalsPage initialSearch={typeof query.search === "string" ? query.search : undefined} initialUserId={typeof query.userId === "string" ? query.userId : undefined} />;
  }
  if (resolved.segments[0] === "finance" && resolved.segments[1] === "gateway-transactions") {
    return <AdminGatewayTransactionsPage initialUserId={typeof query.userId === "string" ? query.userId : undefined} />;
  }
  if (resolved.segments[0] === "marketing" && resolved.segments[1] === "acquisition") {
    return <AdminAcquisitionCampaignPage />;
  }
  if (resolved.segments[0] === "marketing" && resolved.segments[1] === "promotions") {
    if (resolved.segments[2] === "calendar") return <AdminPromotionsPage mode="calendar" />;
    if (resolved.segments[2] === "analytics") return <AdminPromotionsPage mode="analytics" />;
    return <AdminPromotionsPage mode="codes" />;
  }
  if (resolved.segments[0] === "marketing" && resolved.segments[1] === "wheel") {
    if (resolved.segments[2] === "history") return <AdminWheelPage mode="history" />;
    if (resolved.segments[2] === "claims") return <AdminWheelPage mode="claims" />;
    if (resolved.segments[2] === "analytics") return <AdminWheelPage mode="analytics" />;
    return <AdminWheelPage mode="campaigns" />;
  }
  if (resolved.segments[0] === "silver" && resolved.segments[1] === "orders" && resolved.segments[2]) {
    return <AdminSilverOrderDetailPage orderId={resolved.segments[2]} />;
  }
  if (resolved.segments[0] === "products" && resolved.segments[1] === "create") {
    return <ProductEditorPage mode="create" />;
  }
  if (resolved.segments[0] === "products" && resolved.segments.length >= 2) {
    return <ProductEditorPage mode={resolved.segments.at(-1) === "edit" ? "edit" : "view"} productId={resolved.segments[1]} />;
  }
  if (resolved.segments[0] === "shop" && resolved.segments[1] === "products" && resolved.segments[2] === "reviews") {
    return <AdminModerationPage kind="product-reviews" />;
  }
  if (resolved.segments[0] === "shop" && resolved.segments[1] === "products" && resolved.segments[2] === "questions") {
    return <AdminModerationPage kind="product-questions" />;
  }
  if (resolved.segments[0] === "shop" && resolved.segments[1] === "products" && productTaxonomyKinds[resolved.segments[2] ?? ""]) {
    return <ProductTaxonomyPage kind={productTaxonomyKinds[resolved.segments[2] ?? ""]} />;
  }
  if (resolved.segments[0] === "shop" && resolved.segments[1] === "inventory" && !resolved.segments[2]) {
    return <ProductInventoryPage />;
  }
  if (resolved.segments[0] === "content" && resolved.segments[1] === "blog" && resolved.segments[2] === "comments") {
    return <AdminModerationPage kind="blog-comments" />;
  }
  if (resolved.segments[0] === "content" && resolved.segments[1] === "blog" && resolved.segments[2] === "create") {
    return <AdminBlogEditorPage mode="create" />;
  }
  if (resolved.segments[0] === "content" && resolved.segments[1] === "blog" && resolved.segments[2] && !blogSubpageSegments.has(resolved.segments[2])) {
    return <AdminBlogEditorPage mode={resolved.segments.at(-1) === "edit" ? "edit" : "view"} postId={resolved.segments[2]} />;
  }
  if (resolved.segments[0] === "content" && resolved.segments[1] === "pages" && resolved.segments[2] && !cmsPageSubpageSegments.has(resolved.segments[2])) {
    return <AdminCmsPageEditorPage slug={resolved.segments[2]} />;
  }
  if (resolved.segments[0] === "content" && resolved.segments[1] === "seo") {
    return <AdminSeoPage />;
  }
  if (resolved.segments[0] === "system" && resolved.segments[1] === "settings") {
    return <AdminSettingsPage />;
  }
  if (resolved.segments[0] === "system" && (resolved.segments[1] === "logs" || resolved.segments[1] === "audit-logs")) {
    return <AdminAuditLogsPage />;
  }
  if (resolved.segments[0] === "system" && resolved.segments[1] === "operations") {
    if (resolved.segments[2] === "create") return <AdminNotificationCreatePage />;
    if (resolved.segments[2] === "broadcasts") return <AdminNotificationBroadcastsPage />;
    if (resolved.segments[2] === "templates") return <AdminNotificationsPage mode="templates" />;
    if (resolved.segments[2] === "logs") return <AdminNotificationsPage mode="logs" />;
    if (resolved.segments[2]) return <AdminNotificationDetailPage notificationId={resolved.segments[2]} />;
    return <AdminNotificationsPage mode="notifications" />;
  }
  if (resolved.segments[0] === "access") {
    if (resolved.segments[1] === "users" && resolved.segments[2] === "create") return <AdminStaffCreatePage />;
    if (resolved.segments[1] === "users" && resolved.segments[2] && resolved.segments[3] === "edit") return <AdminUserDetailPage returnHref="/admin/access/users" userId={resolved.segments[2]} />;
    if (resolved.segments[1] === "roles") return <AdminAccessPage mode="roles" />;
    if (resolved.segments[1] === "permissions") return <AdminAccessPage mode="permissions" />;
    return <AdminAccessPage initialSearch={typeof query.search === "string" ? query.search : undefined} mode="users" />;
  }
  if (resolved.segments[0] === "customers" && resolved.segments[1] === "create") {
    redirect(buildUsersRedirect(resolved.segments, query));
  }
  if (resolved.segments[0] === "customers" && resolved.segments[1] === "referrals") {
    const mode = ({
      clicks: "clicks",
      commissions: "commissions",
      conversions: "conversions",
      fraud: "fraud",
      "kyc-rewards": "kyc-rewards",
      payouts: "payouts",
      reports: "reports",
      rules: "rules",
    } as Record<string, AdminReferralsPageMode>)[resolved.segments[2] ?? ""] ?? "affiliates";
    return <AdminReferralsPage mode={mode} />;
  }
  if (resolved.segments[0] === "customers" && resolved.segments[1] && resolved.segments[2] === "edit") {
    redirect(buildUsersRedirect(resolved.segments, query));
  }
  if (resolved.segments[0] === "customers" && resolved.segments.length === 1) {
    redirect(buildUsersRedirect(resolved.segments, query));
  }
  if (resolved.segments[0] === "localization") {
    if (resolved.segments[1] === "translations") return <AdminLocalizationPage mode="translations" />;
    if (resolved.segments[1] === "ai-logs") return <AdminLocalizationPage mode="ai-logs" />;
    return <AdminLocalizationPage mode="languages" />;
  }
  if (resolved.segments[0] === "profile") {
    return <AdminProfilePage mode={resolved.segments[1] === "security" ? "security" : "profile"} />;
  }
  if (resolved.segments[0] === "finance" && resolved.segments[1] === "invoices" && resolved.segments[2] === "create") {
    return <AdminInvoiceCreatePage />;
  }
  if (resolved.segments[0] === "finance" && resolved.segments[1] === "invoices" && resolved.segments[2]) {
    return <AdminInvoiceDetailPage invoiceId={resolved.segments[2]} />;
  }
  if (resolved.segments[0] === "shop" && resolved.segments[1] === "orders" && resolved.segments[2] && !orderStatusSegments.has(resolved.segments[2])) {
    return <AdminOrderDetailPage orderId={resolved.segments[2]} />;
  }
  if (resolved.segments[0] === "finance" && resolved.segments[1] === "payments" && resolved.segments[2] === "refunds" && resolved.segments[3]) {
    return <AdminRefundDetailPage refundId={resolved.segments[3]} />;
  }
  if (resolved.segments[0] === "finance" && resolved.segments[1] === "payments" && resolved.segments[2] && !paymentSubpageSegments.has(resolved.segments[2])) {
    return <AdminPaymentDetailPage paymentId={resolved.segments[2]} />;
  }
  if (resolved.segments[0] === "support" && resolved.segments[1] === "tickets" && resolved.segments[2] === "create") {
    return <AdminTicketCreatePage />;
  }
  if (resolved.segments[0] === "support" && resolved.segments[1] === "tickets" && resolved.segments[2]) {
    return <AdminTicketDetailPage ticketId={resolved.segments[2]} />;
  }
  if (resolved.segments[0] === "support" && resolved.segments[1] === "live-chat" && resolved.segments[2]) {
    return <AdminLiveChatDetailPage conversationId={resolved.segments[2]} />;
  }
  return <AdminSectionPage initialSearch={typeof query.search === "string" ? query.search : undefined} initialUserId={typeof query.userId === "string" ? query.userId : undefined} />;
}

const blogSubpageSegments = new Set(["categories", "comments", "tags"]);
const cmsPageSubpageSegments = new Set(["media", "menus", "sections"]);
const orderStatusSegments = new Set(["pending", "processing", "completed", "refunded"]);
const paymentSubpageSegments = new Set(["transactions", "gateways", "payouts", "refunds"]);
const productTaxonomyKinds: Record<string, TaxonomyKind> = {
  categories: "categories",
  manufacturers: "manufacturers",
  purities: "purities",
  sizes: "sizes",
  stacks: "tech-stacks",
  tags: "tags",
  types: "silver-types",
};

function buildUsersRedirect(segments: string[], query: Record<string, string | string[] | undefined>) {
  const targetPath = ["/admin/users", ...segments.slice(1).map(encodeURIComponent)].join("/");
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (Array.isArray(value)) value.forEach((item) => search.append(key, item));
    else if (value !== undefined) search.set(key, value);
  }
  return search.size ? `${targetPath}?${search.toString()}` : targetPath;
}
