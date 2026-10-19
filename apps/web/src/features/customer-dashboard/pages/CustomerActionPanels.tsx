"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Archive, Bell, Clock, Copy, Download, Eye, FileQuestion, FileText, Filter, Heart, HelpCircle, KeyRound, LifeBuoy, Loader2, Mail, MessageCircle, PackageCheck, Paperclip, Plus, Printer, ReceiptText, RefreshCw, Search, Send, ShieldCheck, Smartphone, Star, Trash2, User, Wallet, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { toast } from "@/shared/ui/sonner";

import { archiveNotification, getNotificationPreferences, getNotifications, markAllNotificationsRead, markNotificationRead, updateNotificationPreferences, type NotificationPreferenceInput } from "@/domains/notifications/notifications-api";
import { createReferralCode, getReferredUsers, getReferralCommissions, getReferralDashboard, getReferralMaterials } from "@/domains/referrals/referrals-api";
import {
  closeMyLiveChat,
  createLiveChatSocket,
  getLiveChatAttachmentSignedUrl,
  getMyLiveChat,
  getMyLiveChats,
  joinLiveChatConversation,
  markLiveChatRead,
  markLiveChatSocketRead,
  mergeLiveChatMessage,
  sendLiveChatMessage,
  sendLiveChatTyping,
  startLiveChat,
  type AdminLiveChatDetail,
  type LiveChatConversationEvent,
  type LiveChatMessageEvent,
  type LiveChatPresenceEvent,
  type LiveChatReadEvent,
  type LiveChatStatus,
  type LiveChatTypingEvent,
} from "@/domains/live-chat/live-chat-api";
import { uploadFile, type UploadApiResult } from "@/shared/uploads/upload-api";
import { TicketAttachmentField } from "@/domains/support/TicketAttachmentField";
import { createTicket, getMyTicket, getMyTicketAttachmentSignedUrl, getMyTickets, replyToTicket, toTicketAttachmentInput, updateMyTicketStatus, type AdminTicketDetail, type TicketPriority, type TicketStatus } from "@/domains/support/support-api";
import { SERVICES } from "@/domains/services/data";
import {
  downloadCustomerInvoicePdf,
  downloadCustomerProductFile,
  createCustomerAddress,
  createCustomerApiToken,
  createCustomerPaymentMethod,
  createCustomerQuestion,
  createCustomerReview,
  deleteCustomerAddress,
  deleteCustomerPaymentMethod,
  getCustomerAddresses,
  getCustomerApiTokens,
  getCustomerBalances,
  getCustomerCompany,
  getCustomerDownloads,
  getCustomerInvoices,
  getCustomerLicenses,
  getCustomerOrders,
  getCustomerPayments,
  getCustomerPaymentMethods,
  getCustomerPurchases,
  getCustomerQuestions,
  getCustomerRefunds,
  getCustomerHelp,
  getCustomerHelpItem,
  getCustomerRecentlyViewed,
  getCustomerPreferences,
  getCustomerReviews,
  getCustomerSavedProducts,
  getCustomerSecuritySettings,
  removeCustomerSavedProduct,
  requestCustomerPayment,
  requestCustomerRefund,
  revokeCustomerApiToken,
  saveCustomerProduct,
  updateCustomerAddress,
  updateCustomerCompany,
  updateCustomerPaymentMethod,
  updateCustomerPreferences,
  updateCustomerSecuritySettings,
  type CustomerAddressItem,
  type CustomerApiTokenItem,
  type CustomerBalanceItem,
  type CustomerCompanyProfile,
  type CustomerDownloadItem,
  type CustomerHelpItem,
  type CustomerInvoiceListItem,
  type CustomerLicenseItem,
  type CustomerOrderListItem,
  type CustomerPaymentListItem,
  type CustomerPaymentMethodItem,
  type CustomerProductCard,
  type CustomerPurchaseItem,
  type CustomerQuestionItem,
  type CustomerRecentlyViewedItem,
  type CustomerRefundListItem,
  type CustomerReviewItem,
  type CustomerSavedProductItem,
} from "@/features/customer-dashboard/api/customer-dashboard-api";
import { useAuth } from "@/shared/auth/AuthProvider";
import { platformAuth, type PlatformSession } from "@/shared/auth/platform-auth-client";
import { languageLabel, useI18n } from "@/shared/i18n";
import { translateUiText } from "@/shared/i18n/ui-copy";
import { cn } from "@/shared/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { Avatar, AvatarFallback } from "@/shared/ui/avatar";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Separator } from "@/shared/ui/separator";
import { ShadowSkeleton } from "@/shared/ui/skeleton-state";
import { Switch } from "@/shared/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";
import { Textarea } from "@/shared/ui/textarea";
import { formatMobileDisplay, formatPlatformDate } from "@/shared/lib/date-format";
import { formatTomanMoney, isTomanCurrency } from "@/shared/lib/toman-money";

function T({ children }: { children: string }) {
  const { lang } = useI18n();
  return <>{translateUiText(children, lang)}</>;
}

function useDashboardT() {
  const { lang } = useI18n();
  return useCallback((text: string) => translateUiText(text, lang), [lang]);
}

interface NotificationPage {
  items: Array<{ actionUrl?: string | null; body: string; createdAt: string; event: string; id: string; priority: string; status: string; title: string }>;
  meta?: { total?: number; totalPages?: number };
  total?: number;
  totalPages?: number;
}

interface ReferralDashboard {
  affiliate: {
    balance: string | number;
    code: string;
    codes: Array<{ code: string; clicks: number; conversions: number; id: string; label?: string | null; targetPath: string }>;
    currency: string;
    paidBalance: string | number;
    pendingBalance: string | number;
    status: string;
  };
  clicks: number;
  conversions: number;
  conversionRevenue: string;
  feeCreditBalance: string | number;
  feeCreditWithdrawable: false;
  feeOnly: true;
  kycQualifiedUsers: number;
  kycRewardAmount: number;
  kycRewardTotal: string;
  registrationRewardAmount: number;
  registrationRewardTotal: string;
  registrationRewardedUsers: number;
  currentRule?: {
    commissionType: string;
    cookieWindowDays: number;
    holdDays: number;
    maxCommission?: string | null;
    minOrderAmount: string;
    minPayoutAmount: string;
    name: string;
    referredRewardType?: string | null;
    referredRewardValue: string;
    value: string;
  } | null;
  lifetimeCommission: string;
  performance: Array<{ clicks: number; commission: string; conversions: number; month: string }>;
  registeredUsers: number;
  payouts: Array<{ amount: string | number; createdAt: string; currency: string; id: string; method: string; payoutNumber: string; status: string }>;
}

interface ReferralPage<T> {
  data: T[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
}

interface ReferredUserItem {
  commissionAmount: string;
  conversionCount: number;
  customerRewardAmount: string;
  displayName: string;
  email?: string | null;
  id: string;
  joinedAt: string;
  kycStatus: "NOT_STARTED" | "PENDING" | "APPROVED" | "REJECTED";
  mobile?: string | null;
  orderCount: number;
  purchaseAmount: string;
  status: "KYC_APPROVED" | "REGISTERED" | "REWARDED";
}

interface ReferralCommissionItem {
  amount: string;
  commissionType: string;
  createdAt: string;
  currency: string;
  id: string;
  payableAt?: string | null;
  rate?: string | null;
  status: string;
  conversion?: { customer?: { profile?: { firstName?: string | null; lastName?: string | null } | null } | null } | null;
}

interface ReferralMaterial {
  content?: unknown;
  id: string;
  title?: unknown;
  type?: string;
}

interface TicketPage {
  items: Array<{ createdAt: string; id: string; priority: TicketPriority; status: TicketStatus; subject: string; ticketNumber: string; updatedAt: string }>;
  total?: number;
  totalPages?: number;
}

interface LiveChatPage {
  items: LiveChatListItem[];
  page?: number;
  pageSize?: number;
  total?: number;
  totalPages?: number;
}

interface LiveChatListItem {
  _count?: { attachments?: number; messages?: number; participants?: number };
  assignedAgent?: AdminLiveChatDetail["assignedAgent"];
  conversationNo: string;
  createdAt: string;
  id: string;
  lastMessageAt?: string | null;
  status: LiveChatStatus;
  subject?: string | null;
  updatedAt: string;
}

interface ProductOption {
  id: string;
  meta: string;
  slug: string;
  title: string;
}

const apiTokenScopes = [
  { description: "Read order numbers, statuses, and totals.", label: "Orders read", value: "orders:read" },
  { description: "Read invoice numbers, balances, and payment state.", label: "Invoices read", value: "invoices:read" },
  { description: "Read owned download records and product file metadata.", label: "Downloads read", value: "downloads:read" },
  { description: "Create support ticket replies for integrations.", label: "Tickets write", value: "tickets:write" },
  { description: "Read basic account profile metadata.", label: "Profile read", value: "profile:read" },
];

const notificationScopes: Record<string, string | undefined> = {
  orders: "order",
  payments: "payment",
  referrals: "referral",
  support: "ticket",
  system: "system",
};

export function CustomerNotificationsPanel({ pathname }: { pathname: string }) {
  const { dir } = useI18n();
  const t = useDashboardT();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<"ALL" | "UNREAD" | "READ" | "ARCHIVED">("ALL");
  const queryClient = useQueryClient();
  const scope = pathname.split("/").filter(Boolean).at(-1);
  const notifications = useQuery({
    queryFn: () => getNotifications({
      entityType: scope ? notificationScopes[scope] : undefined,
      page,
      pageSize: 10,
      sortOrder: "desc",
      status: status === "ALL" ? undefined : status,
    }) as Promise<NotificationPage>,
    queryKey: ["customer-notifications", page, scope, status],
    retry: 1,
  });
  const action = useMutation({
    mutationFn: ({ id, type }: { id?: string; type: "archive" | "read" | "read-all" }) => {
      if (type === "read-all") return markAllNotificationsRead();
      if (!id) throw new Error("Notification id is required");
      return type === "archive" ? archiveNotification(id) : markNotificationRead(id);
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t("Notification action failed")),
    onSuccess: () => {
      toast.success(t("Notifications updated."));
      void queryClient.invalidateQueries({ queryKey: ["customer-notifications"] });
      void queryClient.invalidateQueries({ queryKey: ["customer-dashboard-overview"] });
    },
  });
  const items = notifications.data?.items ?? [];

  return (
    <Card className="rounded-2xl border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]">
      <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <CardTitle className="flex items-center gap-2"><Bell className="size-5 text-primary" />{t("Notification Center")}</CardTitle>
        <div className="flex flex-wrap gap-2">
          <Select dir={dir} onValueChange={(value) => { setPage(1); setStatus(value as typeof status); }} value={status}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="ALL">{t("All statuses")}</SelectItem><SelectItem value="UNREAD">{t("Unread")}</SelectItem><SelectItem value="READ">{t("Read")}</SelectItem><SelectItem value="ARCHIVED">{t("Archived")}</SelectItem></SelectContent>
          </Select>
          <Button disabled={action.isPending} onClick={() => action.mutate({ type: "read-all" })} variant="outline">{t("Mark all read")}</Button>
        </div>
      </CardHeader>
      <CardContent>
        {notifications.isLoading ? <PanelSkeleton /> : null}
        {notifications.isError ? <ErrorBox message={notifications.error.message} title="Notifications unavailable" /> : null}
        {!notifications.isLoading && !notifications.isError && items.length ? (
          <Table>
            <TableHeader><TableRow><TableHead>{t("Notification")}</TableHead><TableHead>{t("Event")}</TableHead><TableHead>{t("Status")}</TableHead><TableHead>{t("Date")}</TableHead><TableHead className="text-start">{t("Actions")}</TableHead></TableRow></TableHeader>
            <TableBody>{items.map((item) => <TableRow key={item.id}><TableCell><p className="font-semibold">{item.title}</p><p className="line-clamp-2 text-xs text-muted-foreground">{item.body}</p></TableCell><TableCell>{t(item.event)}</TableCell><TableCell><Badge variant="outline">{t(item.status)}</Badge></TableCell><TableCell className="text-muted-foreground">{formatDate(item.createdAt)}</TableCell><TableCell className="text-start"><div className="flex justify-end gap-2"><Button disabled={item.status === "READ" || action.isPending} onClick={() => action.mutate({ id: item.id, type: "read" })} size="sm" variant="outline">{t("Read")}</Button><Button disabled={item.status === "ARCHIVED" || action.isPending} onClick={() => action.mutate({ id: item.id, type: "archive" })} size="sm" variant="outline"><Archive className="size-4" />{t("Archive")}</Button></div></TableCell></TableRow>)}</TableBody>
          </Table>
        ) : null}
        {!notifications.isLoading && !notifications.isError && !items.length ? <EmptyBox label="No notifications match this view." /> : null}
        <Pagination page={page} setPage={setPage} totalPages={notifications.data?.meta?.totalPages ?? notifications.data?.totalPages ?? 1} />
      </CardContent>
    </Card>
  );
}

export function CustomerReferralPanel({ pathname = "/user/referrals" }: { pathname?: string }) {
  const t = useDashboardT();
  const [codeLabel, setCodeLabel] = useState("");
  const [targetPath, setTargetPath] = useState("/");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();
  const mode = referralModeFromPath(pathname);
  const dashboard = useQuery({ queryFn: () => getReferralDashboard() as Promise<ReferralDashboard>, queryKey: ["customer-referral-dashboard"], retry: 1 });
  const materials = useQuery({ queryFn: () => getReferralMaterials() as Promise<ReferralMaterial[]>, queryKey: ["customer-referral-materials"], retry: 1 });
  const referredUsers = useQuery({
    enabled: mode === "dashboard" || mode === "referred-users",
    queryFn: () => getReferredUsers({ page, pageSize: mode === "dashboard" ? 5 : 12, search, sortOrder: "desc" }) as Promise<ReferralPage<ReferredUserItem>>,
    queryKey: ["customer-referred-users", mode, page, search],
    retry: 1,
  });
  const commissions = useQuery({
    enabled: mode === "commissions" || mode === "conversions",
    queryFn: () => getReferralCommissions({ page, pageSize: mode === "dashboard" ? 5 : 12, sortOrder: "desc" }) as Promise<ReferralPage<ReferralCommissionItem>>,
    queryKey: ["customer-referral-commissions", mode, page],
    retry: 1,
  });
  const createCode = useMutation({
    mutationFn: () => createReferralCode({ label: codeLabel.trim(), targetPath }),
    onError: (error) => toast.error(error instanceof Error ? error.message : t("Referral code creation failed")),
    onSuccess: () => {
      toast.success(t("Referral code created."));
      setCodeLabel("");
      void queryClient.invalidateQueries({ queryKey: ["customer-referral-dashboard"] });
      void queryClient.invalidateQueries({ queryKey: ["customer-referral-payouts"] });
      void queryClient.invalidateQueries({ queryKey: ["customer-dashboard-overview"] });
    },
  });
  if (dashboard.isLoading) return <PanelSkeleton />;
  if (dashboard.isError) return <ErrorBox message={dashboard.error.message} title="Referral dashboard unavailable" />;
  const data = dashboard.data;
  if (!data) return null;
  const showCodes = ["codes", "links"].includes(mode);
  const showPayout = ["payouts", "withdrawals"].includes(mode);
  const showMaterials = ["dashboard", "materials"].includes(mode);
  const rule = data.currentRule;

  return (
    <section className="space-y-4">
      <Card className="overflow-hidden rounded-2xl border-primary/30 bg-gradient-to-br from-primary/15 via-card to-card shadow-[0_26px_80px_-48px_var(--glow)]">
        <CardContent className="p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2"><Badge variant="outline">{t(data.affiliate.status)}</Badge>{rule ? <Badge variant="secondary">{rule.name}</Badge> : null}</div>
              <h3 className="mt-3 text-2xl font-black">{t(referralModeTitle(mode))}</h3>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-muted-foreground">دوستان خود را دعوت کنید؛ پس از ثبت‌نام موفق، برای شما و دوستتان هر کدام ۵۰٬۰۰۰ تومان اعتبار کارمزد ثبت می‌شود. پاداش معرفی‌های متعدد روی هم جمع می‌شود و فقط هزینه‌ها و کارمزدهای مجاز را کاهش می‌دهد.</p>
            </div>
            <div className="flex min-w-72 items-center justify-between gap-3 rounded-2xl border border-primary/25 bg-background/55 p-4">
              <div><p className="text-xs text-muted-foreground">{t("کد اصلی شما")}</p><p className="mt-1 font-mono text-xl font-black tracking-wider">{data.affiliate.code}</p></div>
              <Button onClick={() => copyReferral(data.affiliate.code, "/", t("Referral link copied."))} size="sm"><Copy className="size-4" />{t("کپی لینک")}</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <ReferralMetric label="کاربران معرفی‌شده" meta="عضویت موفق با کد شما" value={String(data.registeredUsers)} />
        <ReferralMetric label="ثبت‌نام پاداش‌گرفته" meta="دو اعتبار کارمزد برای هر معرفی" value={String(data.registrationRewardedUsers)} />
        <ReferralMetric label="پاداش هر طرف" meta="بلافاصله پس از ثبت‌نام" value={formatReferralMoney(data.registrationRewardAmount, "TOMAN")} />
        <ReferralMetric label="اعتبار کارمزد فعلی" meta="غیرقابل برداشت و انتقال" value={formatReferralMoney(data.feeCreditBalance, "TOMAN")} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          {mode === "dashboard" ? <>
            <Card className="rounded-2xl border-border bg-card/70"><CardHeader className="flex flex-row items-center justify-between"><CardTitle>{t("عملکرد شش‌ماهه")}</CardTitle><Badge variant="outline">{formatReferralMoney(data.registrationRewardTotal, "TOMAN")} پاداش ثبت‌نام</Badge></CardHeader><CardContent><ReferralPerformance performance={data.performance} /></CardContent></Card>
            <ReferralUsersTable loading={referredUsers.isLoading} items={referredUsers.data?.data ?? []} t={t} />
          </> : null}

          {mode === "referred-users" ? <Card className="rounded-2xl border-border bg-card/70"><CardHeader className="space-y-3"><CardTitle>{t("همه کاربران معرفی‌شده")}</CardTitle><div className="relative"><Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input className="ps-9" onChange={(event) => { setPage(1); setSearch(event.target.value); }} placeholder={t("جستجو در کاربران معرفی‌شده")} value={search} /></div></CardHeader><CardContent><ReferralUsersTable bare loading={referredUsers.isLoading} items={referredUsers.data?.data ?? []} t={t} /><Pagination page={page} setPage={setPage} totalPages={referredUsers.data?.meta.totalPages ?? 1} /></CardContent></Card> : null}

          {showCodes ? <Card className="rounded-2xl border-border bg-card/70"><CardHeader><CardTitle>{t("لینک‌ها و کمپین‌های معرفی")}</CardTitle></CardHeader><CardContent><Table><TableHeader><TableRow><TableHead>{t("عنوان")}</TableHead><TableHead>{t("کد")}</TableHead><TableHead>{t("مسیر")}</TableHead><TableHead>{t("کلیک")}</TableHead><TableHead>{t("تبدیل")}</TableHead><TableHead>{t("عملیات")}</TableHead></TableRow></TableHeader><TableBody>{data.affiliate.codes.map((code) => <TableRow key={code.id}><TableCell>{code.label || t("لینک معرفی")}</TableCell><TableCell className="font-mono font-bold">{code.code}</TableCell><TableCell dir="ltr">{code.targetPath}</TableCell><TableCell>{code.clicks}</TableCell><TableCell>{code.conversions}</TableCell><TableCell><Button onClick={() => copyReferral(code.code, code.targetPath, t("Referral link copied."))} size="sm" variant="outline"><Copy className="size-4" />{t("کپی")}</Button></TableCell></TableRow>)}</TableBody></Table></CardContent></Card> : null}

          {mode === "clicks" ? <><ReferralInsightGrid items={[["Tracked clicks", String(data.clicks)], ["Active codes", String(data.affiliate.codes.length)], ["Average clicks/code", data.affiliate.codes.length ? (data.clicks / data.affiliate.codes.length).toFixed(1) : "0"], ["Conversion rate", data.clicks ? `${((data.conversions / data.clicks) * 100).toFixed(1)}%` : "0%"]]} /><Card className="rounded-2xl border-border bg-card/70"><CardHeader><CardTitle>{t("عملکرد کمپین‌ها")}</CardTitle></CardHeader><CardContent><ReferralPerformance performance={data.performance} /></CardContent></Card></> : null}

          {mode === "commissions" || mode === "conversions" ? <Card className="rounded-2xl border-border bg-card/70"><CardHeader><CardTitle>{t("ریز کامل پاداش‌ها")}</CardTitle></CardHeader><CardContent><ReferralCommissionsTable bare loading={commissions.isLoading} items={commissions.data?.data ?? []} t={t} /><Pagination page={page} setPage={setPage} totalPages={commissions.data?.meta.totalPages ?? 1} /></CardContent></Card> : null}

          {showPayout ? <Card className="rounded-2xl border-primary/25 bg-card/70"><CardHeader><CardTitle>نحوه استفاده از پاداش معرفی</CardTitle></CardHeader><CardContent className="space-y-3 text-sm leading-7 text-muted-foreground"><p>همه پاداش‌های معرفی شما به‌صورت تجمعی در اعتبار کارمزد نگهداری می‌شود.</p><p>این اعتبار هنگام خرید نقره یا محصول، فقط از بخش کارمزد و هزینه تحویل مجاز کسر می‌شود؛ برای اصل نقره یا کالا، برداشت بانکی، انتقال و شارژ کیف پول قابل استفاده نیست.</p></CardContent></Card> : null}
        </div>

        <div className="space-y-4">
          {showCodes ? <Card className="rounded-2xl border-border bg-card/70"><CardHeader><CardTitle>{t("ساخت لینک کمپین")}</CardTitle></CardHeader><CardContent className="space-y-3"><Input onChange={(event) => setCodeLabel(event.target.value)} placeholder={t("مثلاً کمپین اینستاگرام")} value={codeLabel} /><Input dir="ltr" onChange={(event) => setTargetPath(event.target.value)} placeholder="/products" value={targetPath} /><Button className="w-full" disabled={createCode.isPending || !codeLabel.trim()} onClick={() => createCode.mutate()}>{createCode.isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}{t("ساخت لینک")}</Button></CardContent></Card> : null}
          {showPayout ? <Card className="rounded-2xl border-primary/25 bg-card/70"><CardHeader><CardTitle>اعتبار کارمزد معرفی</CardTitle></CardHeader><CardContent className="space-y-3"><Stat label="موجودی قابل استفاده برای کارمزد" value={formatReferralMoney(data.feeCreditBalance, "TOMAN")} /><Badge variant="secondary">غیرقابل برداشت و انتقال</Badge></CardContent></Card> : null}
          <Card className="rounded-2xl border-border bg-card/70"><CardHeader><CardTitle>قانون پاداش ثبت‌نام</CardTitle></CardHeader><CardContent className="space-y-3 text-sm"><RowLine label="پاداش شما" value={formatReferralMoney(data.registrationRewardAmount, "TOMAN")} /><RowLine label="هدیه دوست شما" value={formatReferralMoney(data.registrationRewardAmount, "TOMAN")} /><RowLine label="شرط دریافت" value="ثبت‌نام موفق دوست" /><RowLine label="زمان ثبت" value="بلافاصله پس از ثبت‌نام" /><RowLine label="محل ثبت" value="اعتبار کارمزد معرفی" /><RowLine label="قابلیت برداشت" value="ندارد" /></CardContent></Card>
          {showMaterials ? <Card className="rounded-2xl border-border bg-card/70"><CardHeader><CardTitle>{t("محتوای آماده اشتراک")}</CardTitle></CardHeader><CardContent className="space-y-2 text-sm">{materials.isLoading ? <PanelSkeleton /> : materials.data?.length ? materials.data.map((item) => <div className="rounded-xl border border-border bg-background/35 p-3" key={item.id}>{jsonLabel(item.title) || item.type || t("Material")}</div>) : <p className="text-muted-foreground">{t("No marketing materials are published yet.")}</p>}</CardContent></Card> : null}
        </div>
      </div>
    </section>
  );
}

export function CustomerSupportTicketsPanel({ isOpenRoute, selectedTicketId }: { isOpenRoute: boolean; selectedTicketId?: string | null }) {
  const { dir } = useI18n();
  const t = useDashboardT();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [newTicketAttachments, setNewTicketAttachments] = useState<UploadApiResult[]>([]);
  const [replyAttachments, setReplyAttachments] = useState<UploadApiResult[]>([]);
  const [uploadingNewTicketAttachments, setUploadingNewTicketAttachments] = useState(false);
  const [uploadingReplyAttachments, setUploadingReplyAttachments] = useState(false);
  const [priority, setPriority] = useState<TicketPriority>("NORMAL");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [status, setStatus] = useState<TicketStatus | "ALL">("ALL");
  const [priorityFilter, setPriorityFilter] = useState<TicketPriority | "ALL">("ALL");
  const queryClient = useQueryClient();
  const relatedOrderId = searchParams.get("order") ?? undefined;
  const relatedInvoiceId = searchParams.get("invoice") ?? undefined;
  const tickets = useQuery({
    queryFn: () => getMyTickets({
      page,
      pageSize: 20,
      priority: priorityFilter === "ALL" ? undefined : priorityFilter,
      search,
      sortOrder,
      status: status === "ALL" ? undefined : status,
    }) as Promise<TicketPage>,
    queryKey: ["customer-support-tickets", page, search, status, priorityFilter, sortOrder],
    retry: 1,
  });
  const selectedTicket = useQuery({
    enabled: Boolean(selectedTicketId),
    queryFn: () => getMyTicket(selectedTicketId ?? "") as Promise<AdminTicketDetail>,
    queryKey: ["customer-support-ticket", selectedTicketId],
    retry: 1,
  });
  const create = useMutation({
    mutationFn: () => createTicket({ attachments: newTicketAttachments.map(toTicketAttachmentInput), body, priority, relatedInvoiceId, relatedOrderId, subject }),
    onError: (error) => toast.error(error instanceof Error ? error.message : t("Ticket creation failed")),
    onSuccess: (ticket) => {
      toast.success(t("Ticket opened."));
      setSubject("");
      setBody("");
      setNewTicketAttachments([]);
      setPage(1);
      void queryClient.invalidateQueries({ queryKey: ["customer-support-tickets"] });
      void queryClient.invalidateQueries({ queryKey: ["customer-dashboard-overview"] });
      const createdId = typeof ticket === "object" && ticket && "id" in ticket ? String(ticket.id) : undefined;
      if (createdId) router.push(`/user/support/tickets/${createdId}` as never);
    },
  });
  const reply = useMutation({
    mutationFn: ({ id, text }: { id: string; text: string }) => replyToTicket(id, { attachments: replyAttachments.map(toTicketAttachmentInput), body: text }),
    onError: (error) => toast.error(error instanceof Error ? error.message : t("Ticket reply failed")),
    onSuccess: () => {
      toast.success(t("Reply sent."));
      setReplyAttachments([]);
      void queryClient.invalidateQueries({ queryKey: ["customer-support-tickets"] });
      void queryClient.invalidateQueries({ queryKey: ["customer-support-ticket", selectedTicketId] });
    },
  });
  const updateStatus = useMutation({
    mutationFn: ({ id, nextStatus }: { id: string; nextStatus: "CLOSED" | "OPEN" | "RESOLVED" }) => updateMyTicketStatus(id, nextStatus),
    onError: (error) => toast.error(error instanceof Error ? error.message : t("Ticket status update failed")),
    onSuccess: (ticket) => {
      toast.success(`${t("Ticket")} ${t(ticket.status.toLowerCase().replaceAll("_", " "))}.`);
      void queryClient.invalidateQueries({ queryKey: ["customer-support-tickets"] });
      void queryClient.invalidateQueries({ queryKey: ["customer-support-ticket", selectedTicketId] });
      void queryClient.invalidateQueries({ queryKey: ["customer-dashboard-overview"] });
    },
  });
  const items = tickets.data?.items ?? [];
  const recentTickets = items.slice(0, 5);
  const totalTickets = tickets.data?.total ?? items.length;
  const totalPages = tickets.data?.totalPages ?? 1;

  if (isOpenRoute) {
    return (
      <section className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <Card className="rounded-2xl border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><LifeBuoy className="size-5 text-primary" />{t("Open Support Ticket")}</CardTitle>
            <p className="text-sm leading-7 text-muted-foreground">{t("Create a new support conversation. After saving, the ticket opens as a chat room with your messages and staff replies.")}</p>
          </CardHeader>
          <CardContent className="grid gap-4">
            {relatedOrderId || relatedInvoiceId ? (
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground">
                {t(relatedOrderId
                  ? "This ticket will be linked to the selected order."
                  : "This ticket will be linked to the selected invoice.")}
              </div>
            ) : null}
            <div className="grid gap-4 md:grid-cols-[1fr_220px]">
              <Input onChange={(event) => setSubject(event.target.value)} placeholder={t("Subject")} value={subject} />
              <Select dir={dir} onValueChange={(value) => setPriority(value as TicketPriority)} value={priority}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="LOW">{t("Low")}</SelectItem><SelectItem value="NORMAL">{t("Normal")}</SelectItem><SelectItem value="HIGH">{t("High")}</SelectItem><SelectItem value="URGENT">{t("Urgent")}</SelectItem></SelectContent>
              </Select>
            </div>
            <Textarea className="min-h-56" onChange={(event) => setBody(event.target.value)} placeholder={t("Describe the issue, expected result, order number, invoice number, screenshots, or error message.")} value={body} />
            <TicketAttachmentField onChange={setNewTicketAttachments} onUploadingChange={setUploadingNewTicketAttachments} value={newTicketAttachments} />
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted-foreground">{t("Support can see this message and reply in the ticket conversation.")}</p>
              <div className="flex gap-2">
                <Button asChild variant="outline"><Link href={"/user/support/tickets" as never}>{t("Back to tickets")}</Link></Button>
                <Button disabled={create.isPending || uploadingNewTicketAttachments || !subject.trim() || !body.trim()} onClick={() => create.mutate()}>{create.isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}{t("Open ticket")}</Button>
              </div>
            </div>
          </CardContent>
        </Card>
        <RecentTicketsCard loading={tickets.isLoading} tickets={recentTickets} />
      </section>
    );
  }

  if (selectedTicketId) {
    return (
      <section className="grid gap-4 xl:grid-cols-[1fr_320px]">
        <Card className="rounded-2xl border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]">
          <CardContent className="p-0">
            {selectedTicket.isLoading ? <div className="p-5"><PanelSkeleton /></div> : null}
            {selectedTicket.isError ? <div className="p-5"><ErrorBox message={selectedTicket.error.message} title="Ticket unavailable" /></div> : null}
            {selectedTicket.data ? (
              <TicketDetailView
                attachments={replyAttachments}
                onAttachmentsChange={setReplyAttachments}
                onReply={(id, text) => reply.mutate({ id, text })}
                onStatus={(id, nextStatus) => updateStatus.mutate({ id, nextStatus })}
                pending={reply.isPending}
                statusPending={updateStatus.isPending}
                ticket={selectedTicket.data}
                uploadingAttachments={uploadingReplyAttachments}
                onUploadingAttachmentsChange={setUploadingReplyAttachments}
              />
            ) : null}
          </CardContent>
        </Card>
        <aside className="space-y-4">
          {selectedTicket.data ? <TicketSummaryCard ticket={selectedTicket.data} /> : null}
          <RecentTicketsCard loading={tickets.isLoading} tickets={recentTickets} />
        </aside>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <Card className="rounded-2xl border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]">
            <CardHeader className="space-y-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle>{t("My Tickets")}</CardTitle>
                  <p className="mt-1 text-xs text-muted-foreground">{totalTickets} {t("tickets match this view.")}</p>
                </div>
                <Button asChild variant="outline"><Link href={"/user/support/tickets/open" as never}><Plus className="size-4" />{t("Open ticket")}</Link></Button>
              </div>
              <div className="grid gap-3 xl:grid-cols-[1fr_180px_180px_160px]">
                <div className="relative">
                  <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input className="ps-9" onChange={(event) => { setPage(1); setSearch(event.target.value); }} placeholder={t("Search ticket number or subject")} value={search} />
                </div>
                <Select dir={dir} onValueChange={(value) => { setPage(1); setStatus(value as TicketStatus | "ALL"); }} value={status}><SelectTrigger><Filter className="size-4" /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ALL">{t("All status")}</SelectItem><SelectItem value="OPEN">{t("Open")}</SelectItem><SelectItem value="PENDING">{t("Pending")}</SelectItem><SelectItem value="WAITING_ON_CUSTOMER">{t("Waiting on me")}</SelectItem><SelectItem value="WAITING_ON_STAFF">{t("Waiting on staff")}</SelectItem><SelectItem value="RESOLVED">{t("Resolved")}</SelectItem><SelectItem value="CLOSED">{t("Closed")}</SelectItem></SelectContent></Select>
                <Select dir={dir} onValueChange={(value) => { setPage(1); setPriorityFilter(value as TicketPriority | "ALL"); }} value={priorityFilter}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ALL">{t("All priority")}</SelectItem><SelectItem value="LOW">{t("Low")}</SelectItem><SelectItem value="NORMAL">{t("Normal")}</SelectItem><SelectItem value="HIGH">{t("High")}</SelectItem><SelectItem value="URGENT">{t("Urgent")}</SelectItem></SelectContent></Select>
                <Select dir={dir} onValueChange={(value) => { setPage(1); setSortOrder(value as "asc" | "desc"); }} value={sortOrder}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="desc">{t("Newest first")}</SelectItem><SelectItem value="asc">{t("Oldest first")}</SelectItem></SelectContent></Select>
              </div>
            </CardHeader>
            <CardContent>
              {tickets.isLoading ? <PanelSkeleton /> : null}
              {tickets.isError ? <ErrorBox message={tickets.error.message} title="Tickets unavailable" /> : null}
              {!tickets.isLoading && !tickets.isError && items.length ? <TicketListTable tickets={items} /> : null}
              {!tickets.isLoading && !tickets.isError && !items.length ? <EmptyBox label="No tickets match this filter." /> : null}
              <Pagination page={page} setPage={setPage} totalPages={totalPages} />
            </CardContent>
      </Card>
    </section>
  );
}

export function CustomerCommercePanel({ initialStatus = "ALL", invoiceView = "all", mode, paymentView = "transactions", title }: { initialStatus?: string; invoiceView?: "all" | "custom" | "drafts" | "payment"; mode: "invoices" | "orders" | "payments"; paymentView?: "methods" | "refunds" | "transactions" | "wallet"; title?: string }) {
  const { dir } = useI18n();
  const t = useDashboardT();
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(initialStatus);
  const queryClient = useQueryClient();
  const query = { page, pageSize: 10, search, sortOrder: "desc", status: status === "ALL" ? undefined : status };
  const invoiceQuery = { ...query, type: invoiceView === "custom" ? "custom" : invoiceView === "payment" ? "payment" : undefined };
  useEffect(() => {
    setPage(1);
    setStatus(initialStatus);
  }, [initialStatus]);
  const orders = useQuery({
    enabled: mode === "orders",
    queryFn: () => getCustomerOrders(query),
    queryKey: ["customer-orders", page, search, status],
    retry: 1,
  });
  const invoices = useQuery({
    enabled: mode === "invoices",
    queryFn: () => getCustomerInvoices(invoiceQuery),
    queryKey: ["customer-invoices", page, search, status, invoiceView],
    retry: 1,
  });
  const payments = useQuery({
    enabled: mode === "payments",
    queryFn: () => getCustomerPayments(query),
    queryKey: ["customer-payments", page, search, status],
    retry: 1,
  });
  const walletBalances = useQuery({
    enabled: mode === "payments" && paymentView === "wallet",
    queryFn: () => getCustomerBalances(),
    queryKey: ["customer-wallet-balances"],
    retry: 1,
  });
  const walletRefunds = useQuery({
    enabled: mode === "payments" && paymentView === "wallet",
    queryFn: () => getCustomerRefunds({ pageSize: 5, sortOrder: "desc" }),
    queryKey: ["customer-wallet-refunds"],
    retry: 1,
  });
  const paidPayments = useQuery({
    enabled: mode === "payments" && paymentView === "refunds",
    queryFn: () => getCustomerPayments({ pageSize: 50, sortOrder: "desc", status: "PAID" }),
    queryKey: ["customer-payments", "paid-for-refunds"],
    retry: 1,
  });
  const refunds = useQuery({
    enabled: mode === "payments" && paymentView === "refunds",
    queryFn: () => getCustomerRefunds({ page, pageSize: 10, search, sortOrder: "desc", status: status === "ALL" ? undefined : status }),
    queryKey: ["customer-refunds", page, search, status],
    retry: 1,
  });
  const requestPay = useMutation({
    mutationFn: (invoiceId: string) => requestCustomerPayment(invoiceId),
    onError: (error) => toast.error(error instanceof Error ? error.message : t("Payment request failed")),
    onSuccess: (payment) => {
      toast.success(t("Payment request created."));
      void queryClient.invalidateQueries({ queryKey: ["customer-payments"] });
      void queryClient.invalidateQueries({ queryKey: ["customer-invoices"] });
      if (payment.paymentUrl) {
        if (payment.paymentUrl.startsWith("http")) window.location.assign(payment.paymentUrl);
        else router.push(payment.paymentUrl as never);
      }
    },
  });
  const refund = useMutation({
    mutationFn: ({ paymentId, reason }: { paymentId: string; reason?: string }) => requestCustomerRefund(paymentId, reason || "Customer dashboard refund request"),
    onError: (error) => toast.error(error instanceof Error ? error.message : t("Refund request failed")),
    onSuccess: () => {
      toast.success(t("Refund request submitted."));
      void queryClient.invalidateQueries({ queryKey: ["customer-payments"] });
      void queryClient.invalidateQueries({ queryKey: ["customer-refunds"] });
    },
  });
  const downloadPdf = useMutation({
    mutationFn: (invoiceId: string) => downloadCustomerInvoicePdf(invoiceId),
    onError: (error) => toast.error(error instanceof Error ? error.message : t("Invoice PDF download failed")),
    onSuccess: ({ blob, filename }) => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success(t("Invoice PDF is ready."));
    },
  });
  const printPdf = useMutation({
    mutationFn: ({ invoiceId }: { invoiceId: string; popup: Window }) => downloadCustomerInvoicePdf(invoiceId),
    onError: (error) => toast.error(error instanceof Error ? error.message : t("Invoice print failed")),
    onSuccess: ({ blob }, { popup }) => {
      printInvoiceBlob(blob, popup);
      toast.success(t("Invoice print view is ready."));
    },
  });
  const openPrintInvoice = (invoiceId: string) => {
    const popup = window.open("about:blank", "_blank");
    if (!popup) {
      toast.error(t("Pop-up blocked. Please allow pop-ups to print the invoice."));
      return;
    }
    popup.document.write(`<p>${t("Preparing invoice...")}</p>`);
    printPdf.mutate({ invoiceId, popup });
  };
  const active = mode === "orders" ? orders : mode === "invoices" ? invoices : payments;
  const rows = active.data?.items ?? [];

  if (mode === "invoices" && invoiceView !== "all") {
    return (
      <CustomerInvoiceRoutePanel
        downloadPdf={(id) => downloadPdf.mutate(id)}
        error={invoices.error}
        isLoading={invoices.isLoading}
        page={page}
        paying={requestPay.isPending}
        printPdf={openPrintInvoice}
        printing={printPdf.isPending}
        requestPay={(id) => requestPay.mutate(id)}
        rows={rows as CustomerInvoiceListItem[]}
        search={search}
        setPage={setPage}
        setSearch={setSearch}
        setStatus={setStatus}
        status={status}
        title={title ?? "Invoices"}
        totalPages={invoices.data?.totalPages ?? 1}
        view={invoiceView}
      />
    );
  }

  if (mode === "payments" && paymentView === "methods") {
    return <CustomerPaymentMethodsPanel payments={payments.data?.items ?? []} />;
  }

  if (mode === "payments" && paymentView === "wallet") {
    return <CustomerWalletPanel balances={walletBalances.data ?? []} error={walletBalances.error ?? payments.error ?? walletRefunds.error} isLoading={walletBalances.isLoading || payments.isLoading || walletRefunds.isLoading} payments={payments.data?.items ?? []} refunds={walletRefunds.data?.items ?? []} />;
  }

  if (mode === "payments" && paymentView === "refunds") {
    return <CustomerRefundsPanel error={refunds.error ?? paidPayments.error} isLoading={refunds.isLoading || paidPayments.isLoading} page={page} paidPayments={paidPayments.data?.items ?? []} refund={(paymentId, reason) => refund.mutate({ paymentId, reason })} refunding={refund.isPending} refunds={refunds.data?.items ?? []} search={search} setPage={setPage} setSearch={setSearch} setStatus={setStatus} status={status} totalPages={refunds.data?.totalPages ?? 1} />;
  }

  return (
    <section className="space-y-4">
      <Card className="rounded-2xl border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]">
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <CardTitle className="flex items-center gap-2">
              {mode === "orders" ? <ReceiptText className="size-5 text-primary" /> : mode === "invoices" ? <ReceiptText className="size-5 text-primary" /> : <Wallet className="size-5 text-primary" />}
              {t(title ?? (mode === "orders" ? "Orders" : mode === "invoices" ? "Invoices" : "Payments"))}
            </CardTitle>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative">
                <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input className="ps-9" onChange={(event) => { setPage(1); setSearch(event.target.value); }} placeholder={t(`Search ${modeLabel(mode).toLowerCase()}`)} value={search} />
              </div>
              <Select dir={dir} onValueChange={(value) => { setPage(1); setStatus(value); }} value={status}>
                <SelectTrigger className="sm:w-48"><Filter className="size-4" /><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">{t("All statuses")}</SelectItem>
                  {statusOptions(mode).map((item) => <SelectItem key={item} value={item}>{t(item)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <CommerceMetrics mode={mode} rows={rows} />
        </CardHeader>
        <CardContent>
          {active.isLoading ? <PanelSkeleton /> : null}
          {active.isError ? <ErrorBox message={active.error.message} title={`${modeLabel(mode)} unavailable`} /> : null}
          {!active.isLoading && !active.isError && rows.length ? (
            <div className="space-y-3">
              {mode === "orders" ? (rows as CustomerOrderListItem[]).map((row) => <OrderListCard item={row} key={row.id} />) : null}
              {mode === "invoices" ? (rows as CustomerInvoiceListItem[]).map((row) => <InvoiceListCard downloadPdf={(id) => downloadPdf.mutate(id)} item={row} key={row.id} paying={requestPay.isPending} printPdf={openPrintInvoice} printing={printPdf.isPending} requestPay={(id) => requestPay.mutate(id)} />) : null}
              {mode === "payments" ? (rows as CustomerPaymentListItem[]).map((row) => <PaymentListCard item={row} key={row.id} refunding={refund.isPending} requestRefund={(id) => refund.mutate({ paymentId: id })} />) : null}
            </div>
          ) : null}
          {!active.isLoading && !active.isError && !rows.length ? <EmptyBox label={`No ${routeScopedLabel(title, mode).toLowerCase()} match this view.`} /> : null}
          <Pagination page={page} setPage={setPage} totalPages={active.data?.totalPages ?? 1} />
        </CardContent>
      </Card>
    </section>
  );
}

function CustomerPaymentMethodsPanel({ payments }: { payments: CustomerPaymentListItem[] }) {
  const { dir } = useI18n();
  const t = useDashboardT();
  const queryClient = useQueryClient();
  const methods = useQuery({ queryFn: () => getCustomerPaymentMethods(), queryKey: ["customer-payment-methods"], retry: 1 });
  const [label, setLabel] = useState("");
  const [type, setType] = useState<CustomerPaymentMethodItem["type"]>("GATEWAY");
  const [billingEmail, setBillingEmail] = useState("");
  const [notes, setNotes] = useState("");
  const gateways = Array.from(new Set(payments.map((payment) => payment.gateway).filter((gateway): gateway is string => Boolean(gateway))));
  const successful = payments.filter((payment) => payment.status === "PAID").length;
  const failed = payments.filter((payment) => payment.status === "FAILED").length;
  const activeMethods = methods.data?.filter((method) => method.status === "ACTIVE").length ?? 0;
  const create = useMutation({
    mutationFn: () => createCustomerPaymentMethod({ billingEmail, gateway: type === "WALLET" ? "wallet" : "zarinpal", label, notes, type }),
    onError: (error) => toast.error(error instanceof Error ? error.message : t("Payment method could not be saved")),
    onSuccess: () => {
      toast.success(t("Payment method saved."));
      setLabel("");
      setBillingEmail("");
      setNotes("");
      void queryClient.invalidateQueries({ queryKey: ["customer-payment-methods"] });
    },
  });
  const action = useMutation<CustomerPaymentMethodItem | { deleted: boolean }, Error, { id: string; kind: "default" | "delete" | "disable" | "enable" }>({
    mutationFn: ({ id, kind }: { id: string; kind: "default" | "delete" | "disable" | "enable" }) => {
      if (kind === "delete") return deleteCustomerPaymentMethod(id);
      if (kind === "default") return updateCustomerPaymentMethod(id, { isDefault: true, status: "ACTIVE" });
      return updateCustomerPaymentMethod(id, { status: kind === "enable" ? "ACTIVE" : "DISABLED" });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t("Payment method action failed")),
    onSuccess: () => {
      toast.success(t("Payment method updated."));
      void queryClient.invalidateQueries({ queryKey: ["customer-payment-methods"] });
    },
  });

  return (
    <section className="grid gap-4 xl:grid-cols-[1fr_380px]">
      <Card className="rounded-2xl border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]">
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2"><Wallet className="size-5 text-primary" />{t("Payment Methods")}</CardTitle>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">{t("Choose Zarinpal online payment or your Toman wallet for invoice payments.")}</p>
          </div>
          <Badge variant="outline">{activeMethods} {t("active")}</Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <Stat label="Gateways used" value={gateways.length ? gateways.join(", ") : "No payments yet"} />
            <Stat label="Successful payments" value={String(successful)} />
            <Stat label="Failed attempts" value={String(failed)} />
          </div>
          {methods.isLoading ? <PanelSkeleton /> : null}
          {methods.isError ? <ErrorBox message={methods.error.message} title="Payment methods unavailable" /> : null}
          {!methods.isLoading && !methods.isError && methods.data?.length ? (
            <div className="grid gap-3 md:grid-cols-2">
              {methods.data.map((method) => (
                <div className="rounded-xl border border-border bg-background/35 p-4" key={method.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold">{method.label}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{t(method.type.replace("_", " "))} · {method.gateway}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {method.isDefault ? <Badge>{t("Default")}</Badge> : null}
                      <Badge variant={method.status === "ACTIVE" ? "outline" : "secondary"}>{t(method.status)}</Badge>
                    </div>
                  </div>
                  <div className="mt-3 grid gap-2 md:grid-cols-2">
                    <Stat label="Billing email" value={method.billingEmail ?? "Account email"} />
                    <Stat label="Updated" value={formatDate(method.updatedAt)} />
                  </div>
                  {method.notes ? <p className="mt-3 line-clamp-2 text-sm leading-6 text-muted-foreground">{method.notes}</p> : null}
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button disabled={action.isPending || method.isDefault} onClick={() => action.mutate({ id: method.id, kind: "default" })} size="sm" variant="outline">{t("Set default")}</Button>
                    <Button disabled={action.isPending} onClick={() => action.mutate({ id: method.id, kind: method.status === "ACTIVE" ? "disable" : "enable" })} size="sm" variant="outline">{t(method.status === "ACTIVE" ? "Disable" : "Enable")}</Button>
                    <Button disabled={action.isPending} onClick={() => action.mutate({ id: method.id, kind: "delete" })} size="sm" variant="outline"><Trash2 className="size-4" />{t("Delete")}</Button>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
          {!methods.isLoading && !methods.isError && !methods.data?.length ? <EmptyBox label="No saved payment methods yet." /> : null}
          <Separator />
          <div>
            <p className="mb-3 font-semibold">{t("Recent gateway activity")}</p>
          <div className="space-y-3">
            {payments.slice(0, 6).map((payment) => (
              <div className="flex flex-col gap-3 rounded-xl border border-border bg-background/35 p-4 md:flex-row md:items-center md:justify-between" key={payment.id}>
                <div>
                  <p className="font-semibold">{payment.gateway ?? "Unknown payment method"}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{payment.paymentNumber} · {formatDate(payment.createdAt)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={payment.status === "FAILED" ? "destructive" : "outline"}>{t(payment.status)}</Badge>
                  <Button asChild size="sm" variant="outline"><Link href={`/user/payments/${payment.id}`}><Eye className="size-4" />{t("View")}</Link></Button>
                </div>
              </div>
            ))}
            {!payments.length ? <EmptyBox label="No payment attempts are available yet." /> : null}
          </div>
          </div>
        </CardContent>
      </Card>
      <div className="space-y-4">
      <Card className="rounded-2xl border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]">
        <CardHeader><CardTitle>{t("Add Method")}</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Input onChange={(event) => setLabel(event.target.value)} placeholder={t("Method label")} value={label} />
          <Select dir={dir} onValueChange={(value) => setType(value as CustomerPaymentMethodItem["type"])} value={type}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="GATEWAY">{t("Gateway")}</SelectItem>
              <SelectItem value="WALLET">{t("Wallet")}</SelectItem>
            </SelectContent>
          </Select>
          <div className="rounded-lg border border-border bg-background/35 px-3 py-2 text-sm text-muted-foreground">{type === "WALLET" ? t("Toman wallet") : t("Zarinpal")}</div>
          <Input onChange={(event) => setBillingEmail(event.target.value)} placeholder={t("Billing email")} type="email" value={billingEmail} />
          <Textarea className="min-h-24" onChange={(event) => setNotes(event.target.value)} placeholder={t("Internal note")} value={notes} />
          <Button className="w-full" disabled={create.isPending || !label.trim()} onClick={() => create.mutate()}>{create.isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}{t("Save method")}</Button>
        </CardContent>
      </Card>
      <Card className="rounded-2xl border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]">
        <CardHeader><CardTitle>{t("Payment Actions")}</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Button asChild className="w-full" variant="outline"><Link href="/user/invoices"><ReceiptText className="size-4" />{t("Pay open invoices")}</Link></Button>
          <Button asChild className="w-full" variant="outline"><Link href="/user/payments/refunds"><RefreshCw className="size-4" />{t("Request refund")}</Link></Button>
          <Button asChild className="w-full" variant="outline"><Link href="/user/support/tickets/open"><MessageCircle className="size-4" />{t("Billing support")}</Link></Button>
        </CardContent>
      </Card>
      </div>
    </section>
  );
}

function CustomerWalletPanel({ balances, error, isLoading, payments, refunds }: { balances: CustomerBalanceItem[]; error: Error | null; isLoading: boolean; payments: CustomerPaymentListItem[]; refunds: CustomerRefundListItem[] }) {
  const t = useDashboardT();
  const primary = balances[0];
  const currency = primary?.currency ?? payments[0]?.currency ?? refunds[0]?.currency ?? "USD";
  const paidTotal = balances.reduce((sum, item) => sum + Number(item.totalPaid), 0);
  const refundedTotal = balances.reduce((sum, item) => sum + Number(item.totalRefunded), 0);
  const balanceTotal = balances.reduce((sum, item) => sum + Number(item.balance), 0);
  const lifetimeTotal = balances.reduce((sum, item) => sum + Number(item.lifetimeSpent), 0);
  return (
    <section className="grid gap-4 xl:grid-cols-[1fr_380px]">
      <Card className="rounded-2xl border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]">
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2"><Wallet className="size-5 text-primary" />{t("Wallet / Balance")}</CardTitle>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">{t("Balances are calculated from real paid payments and refunds. Withdrawals are handled through the referral payout workflow when affiliate balance is available.")}</p>
            </div>
            <Badge variant="outline">{balances.length ? `${balances.length} currency ledger${balances.length === 1 ? "" : "s"}` : "No ledger yet"}</Badge>
          </div>
          <div className="grid gap-3 md:grid-cols-4">
            <Stat label="Available balance" value={`${balanceTotal.toFixed(2)} ${t(currency)}`} />
            <Stat label="Total paid" value={`${paidTotal.toFixed(2)} ${t(currency)}`} />
            <Stat label="Total refunded" value={`${refundedTotal.toFixed(2)} ${t(currency)}`} />
            <Stat label="Lifetime spend" value={`${lifetimeTotal.toFixed(2)} ${t(currency)}`} />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? <PanelSkeleton /> : null}
          {error ? <ErrorBox message={error.message} title="Wallet unavailable" /> : null}
          {!isLoading && !error && balances.length ? (
            <div className="grid gap-3 md:grid-cols-2">
              {balances.map((balance) => (
                <div className="rounded-2xl border border-border bg-background/35 p-4" key={balance.id}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-lg font-black">{t(balance.currency)}</p>
                    <Badge variant="outline">Updated {formatDate(balance.updatedAt)}</Badge>
                  </div>
                  <div className="mt-4 grid gap-2">
                    <Stat label="Balance" value={`${balance.balance} ${t(balance.currency)}`} />
                    <Stat label="Paid" value={`${balance.totalPaid} ${t(balance.currency)}`} />
                    <Stat label="Refunded" value={`${balance.totalRefunded} ${t(balance.currency)}`} />
                    <Stat label="Lifetime spent" value={`${balance.lifetimeSpent} ${t(balance.currency)}`} />
                  </div>
                </div>
              ))}
            </div>
          ) : null}
          {!isLoading && !error && !balances.length ? <EmptyBox label="No wallet balance records are available yet. Completed payments will create balance history automatically." /> : null}
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Card className="rounded-2xl border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]">
          <CardHeader><CardTitle>{t("Wallet Actions")}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Button asChild className="w-full" variant="outline"><Link href="/user/invoices"><ReceiptText className="size-4" />{t("Pay invoices")}</Link></Button>
            <Button asChild className="w-full" variant="outline"><Link href="/user/payments/refunds"><RefreshCw className="size-4" />{t("Refund requests")}</Link></Button>
            <Button asChild className="w-full" variant="outline"><Link href="/user/referrals"><Wallet className="size-4" />اعتبار کارمزد معرفی</Link></Button>
            <Button asChild className="w-full" variant="outline"><Link href="/user/support/tickets/open"><MessageCircle className="size-4" />{t("Billing support")}</Link></Button>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]">
          <CardHeader><CardTitle>{t("Recent Payments")}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {payments.slice(0, 4).map((payment) => (
              <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background/35 p-3" key={payment.id}>
                <div className="min-w-0">
                  <Link className="font-semibold hover:text-primary" href={`/user/payments/${payment.id}`}>{payment.paymentNumber}</Link>
                  <p className="mt-1 text-xs text-muted-foreground">{formatDate(payment.createdAt)} · {payment.gateway ?? "Manual gateway"}</p>
                </div>
                <div className="text-end">
                  <p className="font-semibold">{payment.amount} {t(payment.currency)}</p>
                  <Badge variant={payment.status === "FAILED" ? "destructive" : "outline"}>{t(payment.status)}</Badge>
                </div>
              </div>
            ))}
            {!payments.length ? <EmptyBox label="No payment history yet." /> : null}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]">
          <CardHeader><CardTitle>{t("Recent Refunds")}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {refunds.slice(0, 4).map((refund) => (
              <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background/35 p-3" key={refund.id}>
                <div>
                  <p className="font-semibold">{refund.refundNumber}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{formatDate(refund.createdAt)}</p>
                </div>
                <div className="text-end">
                  <p className="font-semibold">{refund.amount} {t(refund.currency)}</p>
                  <Badge variant="outline">{t(refund.status)}</Badge>
                </div>
              </div>
            ))}
            {!refunds.length ? <EmptyBox label="No refund history yet." /> : null}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function CustomerInvoiceRoutePanel({
  downloadPdf,
  error,
  isLoading,
  page,
  paying,
  printPdf,
  printing,
  requestPay,
  rows,
  search,
  setPage,
  setSearch,
  setStatus,
  status,
  title,
  totalPages,
  view,
}: {
  downloadPdf: (id: string) => void;
  error: Error | null;
  isLoading: boolean;
  page: number;
  paying: boolean;
  printPdf: (id: string) => void;
  printing: boolean;
  requestPay: (id: string) => void;
  rows: CustomerInvoiceListItem[];
  search: string;
  setPage: Dispatch<SetStateAction<number>>;
  setSearch: Dispatch<SetStateAction<string>>;
  setStatus: Dispatch<SetStateAction<string>>;
  status: string;
  title: string;
  totalPages: number;
  view: "custom" | "drafts" | "payment";
}) {
  const { dir } = useI18n();
  const t = useDashboardT();
  const copy = {
    custom: {
      description: "سوابق مالی صادرشده توسط واحد مالی برای عملیات کیف پول و تسویه.",
      empty: "رکورد مالی مطابق این نما پیدا نشد.",
      helper: "رکوردهای مالی توسط تیم مالی صادر و از همین بخش قابل پیگیری هستند.",
      title,
    },
    drafts: {
      description: "Draft invoice records are not payable until staff issues them.",
      empty: "No draft invoices match this view.",
      helper: "Draft invoices are visible for review and audit, but payment starts after issue.",
      title,
    },
    payment: {
      description: "Order-connected invoices generated from checkout and marketplace purchases.",
      empty: "No payment invoices match this view.",
      helper: "Payment invoices are tied to orders and can create gateway payment requests.",
      title,
    },
  }[view];
  const payable = rows.filter((row) => Number(row.balanceDue) > 0 && !["PAID", "VOID", "CANCELLED", "DRAFT"].includes(row.status)).length;
  const total = rows.reduce((sum, row) => sum + Number(row.total), 0);
  const currency = rows[0]?.currency ?? "USD";
  return (
    <section className="grid gap-4 xl:grid-cols-[1fr_380px]">
      <Card className="rounded-2xl border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]">
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2"><ReceiptText className="size-5 text-primary" />{t(copy.title)}</CardTitle>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">{t(copy.description)}</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative">
                <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input className="ps-9" onChange={(event) => { setPage(1); setSearch(event.target.value); }} placeholder={t("Search invoices")} value={search} />
              </div>
              <Select dir={dir} onValueChange={(value) => { setPage(1); setStatus(value); }} value={status}>
                <SelectTrigger className="sm:w-48"><Filter className="size-4" /><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">{t("All statuses")}</SelectItem>
                  {statusOptions("invoices").map((item) => <SelectItem key={item} value={item}>{t(item)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-4">
            <Stat label="Visible invoices" value={String(rows.length)} />
            <Stat label="Payable" value={String(payable)} />
            <Stat label="Paid" value={String(rows.filter((row) => row.status === "PAID").length)} />
            <Stat label="Page total" value={`${total.toFixed(2)} ${t(currency)}`} />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? <PanelSkeleton /> : null}
          {error ? <ErrorBox message={error.message} title="Invoices unavailable" /> : null}
          {!isLoading && !error && rows.length ? (
            <div className="space-y-3">
              {rows.map((row) => <InvoiceListCard downloadPdf={downloadPdf} item={row} key={row.id} paying={paying} printPdf={printPdf} printing={printing} requestPay={requestPay} />)}
            </div>
          ) : null}
          {!isLoading && !error && !rows.length ? <EmptyBox label={copy.empty} /> : null}
          <Pagination page={page} setPage={setPage} totalPages={totalPages} />
        </CardContent>
      </Card>
      <Card className="rounded-2xl border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]">
        <CardHeader><CardTitle>{t("Invoice Workflow")}</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm leading-7 text-muted-foreground">{t(copy.helper)}</p>
          <Stat label="Invoice type" value={view === "payment" ? "payment" : view === "custom" ? "custom" : "draft"} />
          <Stat label="Payment readiness" value={view === "drafts" ? "Issue required" : payable ? "Action available" : "No balance due"} />
          <Button asChild className="w-full" variant="outline"><Link href="/user/payments"><Wallet className="size-4" />{t("Transactions")}</Link></Button>
          <Button asChild className="w-full" variant="outline"><Link href="/user/support/tickets/open"><MessageCircle className="size-4" />{t("Billing support")}</Link></Button>
        </CardContent>
      </Card>
    </section>
  );
}

function CustomerRefundsPanel({
  error,
  isLoading,
  page,
  paidPayments,
  refund,
  refunding,
  refunds,
  search,
  setPage,
  setSearch,
  setStatus,
  status,
  totalPages,
}: {
  error: Error | null;
  isLoading: boolean;
  page: number;
  paidPayments: CustomerPaymentListItem[];
  refund: (paymentId: string, reason?: string) => void;
  refunding: boolean;
  refunds: CustomerRefundListItem[];
  search: string;
  setPage: Dispatch<SetStateAction<number>>;
  setSearch: Dispatch<SetStateAction<string>>;
  setStatus: Dispatch<SetStateAction<string>>;
  status: string;
  totalPages: number;
}) {
  const { dir } = useI18n();
  const t = useDashboardT();
  const [paymentId, setPaymentId] = useState("");
  const [reason, setReason] = useState("");
  const selectedPayment = paidPayments.find((payment) => payment.id === paymentId);
  return (
    <section className="grid gap-4 xl:grid-cols-[1fr_380px]">
      <Card className="rounded-2xl border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]">
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <CardTitle className="flex items-center gap-2"><RefreshCw className="size-5 text-primary" />{t("Refund Requests")}</CardTitle>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative">
                <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input className="ps-9" onChange={(event) => { setPage(1); setSearch(event.target.value); }} placeholder={t("Search refunds")} value={search} />
              </div>
              <Select dir={dir} onValueChange={(value) => { setPage(1); setStatus(value); }} value={status}>
                <SelectTrigger className="sm:w-48"><Filter className="size-4" /><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">{t("All statuses")}</SelectItem>
                  {["REQUESTED", "APPROVED", "REJECTED", "PROCESSING", "COMPLETED", "FAILED", "CANCELLED"].map((item) => <SelectItem key={item} value={item}>{t(item)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-4">
            <Stat label="Visible refunds" value={String(refunds.length)} />
            <Stat label="Requested" value={String(refunds.filter((item) => item.status === "REQUESTED").length)} />
            <Stat label="Completed" value={String(refunds.filter((item) => item.status === "COMPLETED").length)} />
            <Stat label="Page" value={String(page)} />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? <PanelSkeleton /> : null}
          {error ? <ErrorBox message={error.message} title="Refunds unavailable" /> : null}
          {!isLoading && !error && refunds.length ? (
            <div className="space-y-3">
              {refunds.map((item) => <RefundListCard item={item} key={item.id} />)}
            </div>
          ) : null}
          {!isLoading && !error && !refunds.length ? <EmptyBox label="No refund requests match this view." /> : null}
          <Pagination page={page} setPage={setPage} totalPages={totalPages} />
        </CardContent>
      </Card>
      <Card className="rounded-2xl border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]">
        <CardHeader><CardTitle>{t("Request Refund")}</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Select dir={dir} onValueChange={setPaymentId} value={paymentId}>
            <SelectTrigger><SelectValue placeholder={t("Select paid payment")} /></SelectTrigger>
            <SelectContent>
              {paidPayments.map((payment) => <SelectItem key={payment.id} value={payment.id}>{payment.paymentNumber} · {payment.amount} {t(payment.currency)}</SelectItem>)}
            </SelectContent>
          </Select>
          {selectedPayment ? <Stat label="Refundable amount" value={`${selectedPayment.amount} ${t(selectedPayment.currency)}`} /> : null}
          <Textarea className="min-h-28" onChange={(event) => setReason(event.target.value)} placeholder={t("Refund reason")} value={reason} />
          <Button className="w-full" disabled={refunding || !paymentId} onClick={() => refund(paymentId, reason)}>
            {refunding ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
            {t("Submit refund request")}
          </Button>
          {!paidPayments.length ? <p className="text-sm leading-7 text-muted-foreground">{t("Only paid payments can be submitted for refund.")}</p> : null}
        </CardContent>
      </Card>
    </section>
  );
}

function CommerceMetrics({ mode, rows }: { mode: "invoices" | "orders" | "payments"; rows: Array<CustomerOrderListItem | CustomerInvoiceListItem | CustomerPaymentListItem> }) {
  const t = useDashboardT();
  const total = rows.reduce((sum, row) => sum + Number("total" in row ? row.total : row.amount), 0);
  const open = rows.filter((row) => ["PENDING", "DRAFT", "OVERDUE", "FAILED"].includes(row.status)).length;
  const complete = rows.filter((row) => ["COMPLETED", "PAID"].includes(row.status)).length;
  const currency = rows[0]?.currency ?? "USD";
  const labels = mode === "orders"
    ? ["Visible orders", "Needs action", "Completed", "Page total"]
    : mode === "invoices"
      ? ["Visible invoices", "Unpaid or overdue", "Paid", "Page total"]
      : ["Visible payments", "Needs review", "Paid", "Page total"];
  return (
    <div className="grid gap-3 md:grid-cols-4">
      <Stat label={labels[0]} value={String(rows.length)} />
      <Stat label={labels[1]} value={String(open)} />
      <Stat label={labels[2]} value={String(complete)} />
      <Stat label={labels[3]} value={`${total.toFixed(2)} ${t(currency)}`} />
    </div>
  );
}

function OrderListCard({ item }: { item: CustomerOrderListItem }) {
  const t = useDashboardT();
  const itemCount = item._count?.items ?? 0;
  return (
    <div className="grid gap-4 rounded-2xl border border-border bg-background/35 p-4 lg:grid-cols-[1fr_220px_auto] lg:items-center">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Link className="text-base font-bold hover:text-primary" href={`/user/orders/${item.id}` as never}>{item.orderNumber}</Link>
          <Badge variant="outline">{t(item.status)}</Badge>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">{itemCount} purchased item{itemCount === 1 ? "" : "s"} · {item._count?.payments ?? 0} payment records</p>
        <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
          <span>Created {formatDate(item.createdAt)}</span>
          <span>Total {item.total} {t(item.currency)}</span>
          <span>{orderNextStep(item.status)}</span>
        </div>
      </div>
      <div className="rounded-xl border border-border bg-card/70 p-3">
        <p className="text-xs text-muted-foreground">{t("Fulfillment state")}</p>
        <p className="mt-1 font-semibold">{t(item.status === "COMPLETED" ? "Delivered" : item.status === "PROCESSING" ? "Preparing delivery" : "Waiting for checkout")}</p>
      </div>
      <div className="flex flex-wrap gap-2 lg:justify-end">
        <Button asChild variant="outline"><Link href={`/user/orders/${item.id}` as never}><Eye className="size-4" />{t("View order")}</Link></Button>
        <Button asChild variant="outline"><Link href={"/user/support/tickets/open" as never}><MessageCircle className="size-4" />{t("Support")}</Link></Button>
      </div>
    </div>
  );
}

function InvoiceListCard({ downloadPdf, item, paying, printPdf, printing, requestPay }: { downloadPdf: (id: string) => void; item: CustomerInvoiceListItem; paying: boolean; printPdf: (id: string) => void; printing: boolean; requestPay: (id: string) => void }) {
  const t = useDashboardT();
  const balance = Number(item.balanceDue);
  const payable = balance > 0 && !["PAID", "VOID", "CANCELLED"].includes(item.status);
  return (
    <div className="grid gap-4 rounded-2xl border border-border bg-background/35 p-4 lg:grid-cols-[1fr_220px_auto] lg:items-center">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Link className="text-base font-bold hover:text-primary" href={`/user/invoices/${item.id}` as never}>{item.invoiceNumber}</Link>
          <Badge variant={item.status === "OVERDUE" ? "destructive" : "outline"}>{t(item.status)}</Badge>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">{t("Issued")} {formatDate(item.createdAt)} · {t("Balance")} {item.balanceDue} {t(item.currency)}</p>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(0, Math.min(100, 100 - (balance / Math.max(Number(item.total), 1)) * 100))}%` }} />
        </div>
      </div>
      <div className="rounded-xl border border-border bg-card/70 p-3">
        <p className="text-xs text-muted-foreground">{t("Total")}</p>
        <p className="mt-1 text-lg font-black">{item.total} {t(item.currency)}</p>
      </div>
      <div className="flex flex-wrap gap-2 lg:justify-end">
        <Button disabled={paying || !payable} onClick={() => requestPay(item.id)}><CreditCardIcon />{t("Pay")}</Button>
        <Button onClick={() => downloadPdf(item.id)} variant="outline"><Download className="size-4" /><T>PDF</T></Button>
        <Button disabled={printing} onClick={() => printPdf(item.id)} variant="outline">{printing ? <Loader2 className="size-4 animate-spin" /> : <Printer className="size-4" />}{t("Print")}</Button>
        <Button asChild variant="outline"><Link href={`/user/invoices/${item.id}` as never}><Eye className="size-4" />{t("View")}</Link></Button>
      </div>
    </div>
  );
}

function printInvoiceBlob(blob: Blob, popup: Window) {
  if (typeof window === "undefined") return;
  const url = window.URL.createObjectURL(blob);
  popup.location.href = url;
  const revoke = () => window.setTimeout(() => window.URL.revokeObjectURL(url), 30_000);
  popup.addEventListener?.("load", () => {
    popup.focus();
    popup.print();
    revoke();
  });
  window.setTimeout(() => {
    try {
      popup.focus();
      popup.print();
    } finally {
      revoke();
    }
  }, 1_000);
}

function PaymentListCard({ item, refunding, requestRefund }: { item: CustomerPaymentListItem; refunding: boolean; requestRefund: (id: string) => void }) {
  const t = useDashboardT();
  const refundable = item.status === "PAID";
  return (
    <div className="grid gap-4 rounded-2xl border border-border bg-background/35 p-4 lg:grid-cols-[1fr_220px_auto] lg:items-center">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Link className="text-base font-bold hover:text-primary" href={`/user/payments/${item.id}` as never}>{item.paymentNumber}</Link>
          <Badge variant={item.status === "FAILED" ? "destructive" : "outline"}>{t(item.status)}</Badge>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">{item.gateway ?? "Gateway pending"} · Created {formatDate(item.createdAt)}</p>
      </div>
      <div className="rounded-xl border border-border bg-card/70 p-3">
        <p className="text-xs text-muted-foreground">{t("Amount")}</p>
        <p className="mt-1 text-lg font-black">{item.amount} {t(item.currency)}</p>
      </div>
      <div className="flex flex-wrap gap-2 lg:justify-end">
        <Button asChild variant="outline"><Link href={`/user/payments/${item.id}` as never}><Eye className="size-4" />{t("View")}</Link></Button>
        <Button disabled={refunding || !refundable} onClick={() => requestRefund(item.id)} variant="outline"><RefreshCw className="size-4" />{t("Refund")}</Button>
      </div>
    </div>
  );
}

function RefundListCard({ item }: { item: CustomerRefundListItem }) {
  const t = useDashboardT();
  return (
    <div className="grid gap-4 rounded-2xl border border-border bg-background/35 p-4 lg:grid-cols-[1fr_220px_auto] lg:items-center">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-base font-bold">{item.refundNumber}</p>
          <Badge variant={item.status === "REJECTED" || item.status === "FAILED" ? "destructive" : "outline"}>{t(item.status)}</Badge>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">{item.payment?.paymentNumber ?? "Payment record"} · Requested {formatDate(item.createdAt)}</p>
        {item.reason ? <p className="mt-2 text-sm leading-7 text-muted-foreground">{item.reason}</p> : null}
      </div>
      <div className="rounded-xl border border-border bg-card/70 p-3">
        <p className="text-xs text-muted-foreground">{t("Amount")}</p>
        <p className="mt-1 text-lg font-black">{item.amount} {t(item.currency)}</p>
      </div>
      <div className="flex flex-wrap gap-2 lg:justify-end">
        {item.payment?.id ? <Button asChild variant="outline"><Link href={`/user/payments/${item.payment.id}`}><Eye className="size-4" />{t("Payment")}</Link></Button> : null}
        <Button asChild variant="outline"><Link href="/user/support/tickets/open"><MessageCircle className="size-4" />{t("Support")}</Link></Button>
      </div>
    </div>
  );
}

function CreditCardIcon() {
  return <Wallet className="size-4" />;
}

function orderNextStep(status: string) {
  if (status === "PENDING") return "Next: complete payment";
  if (status === "PROCESSING") return "Next: delivery preparation";
  if (status === "COMPLETED") return "Ready: downloads and licenses";
  if (status === "REFUNDED") return "Closed: refunded";
  return "Review order status";
}

export function CustomerAssetsPanel({ mode, title, variant = "default" }: { mode: "downloads" | "licenses" | "purchases"; title?: string; variant?: "default" | "updates" }) {
  const { dir } = useI18n();
  const t = useDashboardT();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const queryClient = useQueryClient();
  const query = { page, pageSize: 10, search, sortOrder: "desc", status: status === "ALL" ? undefined : status };
  const purchases = useQuery({
    enabled: mode === "purchases",
    queryFn: () => getCustomerPurchases(query),
    queryKey: ["customer-purchases", page, search],
    retry: 1,
  });
  const downloads = useQuery({
    enabled: mode === "downloads",
    queryFn: () => getCustomerDownloads(query),
    queryKey: ["customer-downloads", page, search],
    retry: 1,
  });
  const licenses = useQuery({
    enabled: mode === "licenses",
    queryFn: () => getCustomerLicenses(query),
    queryKey: ["customer-licenses", page, search, status],
    retry: 1,
  });
  const active = mode === "purchases" ? purchases : mode === "downloads" ? downloads : licenses;
  const rows = active.data?.items ?? [];
  const downloadFile = useMutation({
    mutationFn: ({ fileId, fileName }: { fileId: string; fileName: string }) => downloadCustomerProductFile(fileId, fileName),
    onError: (error) => toast.error(error instanceof Error ? error.message : t("File download failed")),
    onSuccess: ({ blob, filename }) => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success(t("Download started."));
      void queryClient.invalidateQueries({ queryKey: ["customer-downloads"] });
    },
  });

  return (
    <section className="space-y-4">
      <Card className="rounded-2xl border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]">
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <CardTitle className="flex items-center gap-2">
              {mode === "licenses" ? <KeyRound className="size-5 text-primary" /> : mode === "downloads" ? <Download className="size-5 text-primary" /> : <PackageCheck className="size-5 text-primary" />}
              {t(title ?? (mode === "licenses" ? "Licenses" : mode === "downloads" ? "Downloads" : "Purchases"))}
            </CardTitle>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative">
                <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input className="ps-9" onChange={(event) => { setPage(1); setSearch(event.target.value); }} placeholder={t("Search products")} value={search} />
              </div>
              {mode === "licenses" ? (
                <Select dir={dir} onValueChange={(value) => { setPage(1); setStatus(value); }} value={status}>
                  <SelectTrigger className="sm:w-44"><Filter className="size-4" /><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="ALL">{t("All statuses")}</SelectItem><SelectItem value="ACTIVE">{t("Active")}</SelectItem><SelectItem value="EXPIRED">{t("Expired")}</SelectItem><SelectItem value="REVOKED">{t("Revoked")}</SelectItem></SelectContent>
                </Select>
              ) : null}
            </div>
          </div>
          <AssetMetrics mode={mode} rows={rows} />
        </CardHeader>
        <CardContent>
          {active.isLoading ? <PanelSkeleton /> : null}
          {active.isError ? <ErrorBox message={active.error.message} title={`${assetModeLabel(mode)} unavailable`} /> : null}
          {!active.isLoading && !active.isError && rows.length ? (
            <div className="space-y-3">
              {mode === "purchases" && variant === "default" ? (rows as CustomerPurchaseItem[]).map((item) => <PurchaseRow item={item} key={item.id} />) : null}
              {mode === "purchases" && variant === "updates" ? (rows as CustomerPurchaseItem[]).map((item) => <PurchaseUpdateRow item={item} key={item.id} />) : null}
              {mode === "downloads" ? (rows as CustomerDownloadItem[]).map((item) => <DownloadRow item={item} key={item.id} onDownload={(fileId, fileName) => downloadFile.mutate({ fileId, fileName })} pendingFileId={downloadFile.variables?.fileId} />) : null}
              {mode === "licenses" ? (rows as CustomerLicenseItem[]).map((item) => <LicenseRow item={item} key={item.id} />) : null}
            </div>
          ) : null}
          {!active.isLoading && !active.isError && !rows.length ? <EmptyBox label={`No ${(title ?? assetModeLabel(mode)).toLowerCase()} match this view.`} /> : null}
          <Pagination page={page} setPage={setPage} totalPages={active.data?.totalPages ?? 1} />
        </CardContent>
      </Card>
    </section>
  );
}

export function CustomerActivityPanel({ mode }: { mode: "questions" | "reviews" }) {
  const { dir } = useI18n();
  const t = useDashboardT();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [productId, setProductId] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [rating, setRating] = useState("5");
  const queryClient = useQueryClient();
  const query = { page, pageSize: 10, search, sortOrder: "desc", status: status === "ALL" ? undefined : status };
  const purchases = useQuery({
    queryFn: () => getCustomerPurchases({ page: 1, pageSize: 30, sortOrder: "desc" }),
    queryKey: ["customer-activity-product-options"],
    retry: 1,
  });
  const reviews = useQuery({
    enabled: mode === "reviews",
    queryFn: () => getCustomerReviews(query),
    queryKey: ["customer-reviews", page, search, status],
    retry: 1,
  });
  const questions = useQuery({
    enabled: mode === "questions",
    queryFn: () => getCustomerQuestions(query),
    queryKey: ["customer-questions", page, search, status],
    retry: 1,
  });
  const createReview = useMutation({
    mutationFn: () => createCustomerReview({ body, productId, rating: Number(rating), title }),
    onError: (error) => toast.error(error instanceof Error ? error.message : t("Review submission failed")),
    onSuccess: () => {
      toast.success(t("Review submitted for moderation."));
      setTitle("");
      setBody("");
      setProductId("");
      void queryClient.invalidateQueries({ queryKey: ["customer-reviews"] });
    },
  });
  const createQuestion = useMutation({
    mutationFn: () => createCustomerQuestion({ productId, question: body }),
    onError: (error) => toast.error(error instanceof Error ? error.message : t("Question submission failed")),
    onSuccess: () => {
      toast.success(t("Question submitted."));
      setBody("");
      setProductId("");
      void queryClient.invalidateQueries({ queryKey: ["customer-questions"] });
    },
  });
  const active = mode === "reviews" ? reviews : questions;
  const rows = active.data?.items ?? [];
  const productOptions = productOptionsFromPurchases(purchases.data?.items ?? []);
  const selectedProduct = productOptions.find((product) => product.id === productId);

  return (
    <section className="grid gap-4 xl:grid-cols-[1fr_380px]">
      <Card className="rounded-2xl border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]">
        <CardHeader className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <CardTitle className="flex items-center gap-2">{mode === "reviews" ? <Star className="size-5 text-primary" /> : <FileQuestion className="size-5 text-primary" />}{mode === "reviews" ? t("My Reviews") : t("My Questions")}</CardTitle>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input onChange={(event) => { setPage(1); setSearch(event.target.value); }} placeholder={t("Search activity")} value={search} />
            <Select dir={dir} onValueChange={(value) => { setPage(1); setStatus(value); }} value={status}>
              <SelectTrigger className="sm:w-44"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="ALL"><T>All statuses</T></SelectItem>{activityStatuses(mode).map((item) => <SelectItem key={item} value={item}>{t(item)}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {active.isLoading ? <PanelSkeleton /> : null}
          {active.isError ? <ErrorBox message={active.error.message} title="Activity unavailable" /> : null}
          {!active.isLoading && !active.isError && rows.length ? (
            <div className="space-y-3">
              {mode === "reviews" ? (rows as CustomerReviewItem[]).map((item) => <ReviewRow item={item} key={item.id} />) : (rows as CustomerQuestionItem[]).map((item) => <QuestionRow item={item} key={item.id} />)}
            </div>
          ) : null}
          {!active.isLoading && !active.isError && !rows.length ? <EmptyBox label={`No ${mode} match this view.`} /> : null}
          <Pagination page={page} setPage={setPage} totalPages={active.data?.totalPages ?? 1} />
        </CardContent>
      </Card>
      <Card className="rounded-2xl border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]">
        <CardHeader><CardTitle>{mode === "reviews" ? t("Submit Review") : t("Ask Question")}</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <ProductSelect
            emptyLabel="No purchased products are available yet."
            isLoading={purchases.isLoading}
            onChange={setProductId}
            options={productOptions}
            placeholder="Select purchased product"
            value={productId}
          />
          {selectedProduct ? <SelectedProductSummary product={selectedProduct} /> : null}
          {!purchases.isLoading && !productOptions.length ? (
            <Button asChild className="w-full" variant="outline">
              <Link href="/products">
                <Search className="size-4" />
                {t("Browse products")}
              </Link>
            </Button>
          ) : null}
          {mode === "reviews" ? <Input onChange={(event) => setTitle(event.target.value)} placeholder={t("Review title")} value={title} /> : null}
          {mode === "reviews" ? <Input max="5" min="1" onChange={(event) => setRating(event.target.value)} placeholder={t("Rating")} type="number" value={rating} /> : null}
          <Textarea className="min-h-36" onChange={(event) => setBody(event.target.value)} placeholder={mode === "reviews" ? t("Share your implementation experience") : t("Write your product question")} value={body} />
          <Button className="w-full" disabled={!productId.trim() || !body.trim() || createReview.isPending || createQuestion.isPending} onClick={() => mode === "reviews" ? createReview.mutate() : createQuestion.mutate()}>
            {(createReview.isPending || createQuestion.isPending) ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            {t("Submit")}
          </Button>
        </CardContent>
      </Card>
    </section>
  );
}

export function CustomerFavoritesPanel({ kind = "saved", mode, title }: { kind?: "saved" | "services" | "wishlist"; mode: "recent" | "saved"; title?: string }) {
  const t = useDashboardT();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [productId, setProductId] = useState("");
  const [note, setNote] = useState("");
  const queryClient = useQueryClient();
  const query = { page, pageSize: 12, search, sortOrder: "desc" };
  const saved = useQuery({
    enabled: mode === "saved",
    queryFn: () => getCustomerSavedProducts(query),
    queryKey: ["customer-saved-products", page, search],
    retry: 1,
  });
  const recent = useQuery({
    enabled: mode === "recent",
    queryFn: () => getCustomerRecentlyViewed(query),
    queryKey: ["customer-recent-products", page, search],
    retry: 1,
  });
  const saveCandidates = useQuery({
    queryFn: async () => {
      const [purchases, recentProducts] = await Promise.all([
        getCustomerPurchases({ page: 1, pageSize: 30, sortOrder: "desc" }),
        getCustomerRecentlyViewed({ page: 1, pageSize: 30, sortOrder: "desc" }),
      ]);
      return uniqueProductOptions([
        ...productOptionsFromPurchases(purchases.items),
        ...productOptionsFromProductCards(recentProducts.items.map((item) => item.product), "Recently viewed"),
      ]);
    },
    queryKey: ["customer-save-product-options"],
    retry: 1,
  });
  const save = useMutation({
    mutationFn: () => saveCustomerProduct({ note, productId }),
    onError: (error) => toast.error(error instanceof Error ? error.message : t("Product save failed")),
    onSuccess: () => {
      toast.success(t("Product saved."));
      setProductId("");
      setNote("");
      void queryClient.invalidateQueries({ queryKey: ["customer-saved-products"] });
    },
  });
  const remove = useMutation({
    mutationFn: (id: string) => removeCustomerSavedProduct(id),
    onError: (error) => toast.error(error instanceof Error ? error.message : t("Saved product removal failed")),
    onSuccess: () => {
      toast.success(t("Saved product removed."));
      void queryClient.invalidateQueries({ queryKey: ["customer-saved-products"] });
    },
  });
  const active = mode === "saved" ? saved : recent;
  const rows = active.data?.items ?? [];
  const selectedProduct = saveCandidates.data?.find((product) => product.id === productId);
  const isServiceFavorites = kind === "services";

  return (
    <section className="grid gap-4 xl:grid-cols-[1fr_360px]">
      <Card className="rounded-2xl border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]">
        <CardHeader className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <CardTitle className="flex items-center gap-2">{mode === "saved" ? <Heart className="size-5 text-primary" /> : <Clock className="size-5 text-primary" />}{t(title ?? (mode === "saved" ? "Saved Products" : "Recently Viewed"))}</CardTitle>
          {!isServiceFavorites ? <Input className="xl:max-w-xs" onChange={(event) => { setPage(1); setSearch(event.target.value); }} placeholder={t("Search products")} value={search} /> : null}
        </CardHeader>
        <CardContent>
          {isServiceFavorites ? <SavedServicesPanel /> : null}
          {!isServiceFavorites && active.isLoading ? <PanelSkeleton /> : null}
          {!isServiceFavorites && active.isError ? <ErrorBox message={active.error.message} title="Products unavailable" /> : null}
          {!isServiceFavorites && !active.isLoading && !active.isError && rows.length ? (
            <div className="grid gap-3 md:grid-cols-2">
              {mode === "saved"
                ? (rows as CustomerSavedProductItem[]).map((item) => <ProductCardActions key={item.id} meta={item.note ?? `${t("Saved")} ${formatDate(item.createdAt)}`} onRemove={() => remove.mutate(item.product.id)} pending={remove.isPending} product={item.product} removable />)
                : (rows as CustomerRecentlyViewedItem[]).map((item) => <ProductCardActions key={item.id} meta={`${t("Viewed")} ${formatDate(item.viewedAt)}`} product={item.product} />)}
            </div>
          ) : null}
          {!isServiceFavorites && !active.isLoading && !active.isError && !rows.length ? <EmptyBox label={mode === "saved" ? `No ${(title ?? "saved products").toLowerCase()} yet.` : "No recently viewed products yet."} /> : null}
          {!isServiceFavorites ? <Pagination page={page} setPage={setPage} totalPages={active.data?.totalPages ?? 1} /> : null}
        </CardContent>
      </Card>
      {!isServiceFavorites ? <Card className="rounded-2xl border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]">
        <CardHeader><CardTitle><T>Save Product</T></CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <ProductSelect
            emptyLabel="No purchased or recently viewed products are available."
            isLoading={saveCandidates.isLoading}
            onChange={setProductId}
            options={saveCandidates.data ?? []}
            placeholder="Select product"
            value={productId}
          />
          {selectedProduct ? <SelectedProductSummary product={selectedProduct} /> : null}
          {!saveCandidates.isLoading && !saveCandidates.data?.length ? (
            <Button asChild className="w-full" variant="outline">
              <Link href="/products">
                <Search className="size-4" />
                {t("Browse products")}
              </Link>
            </Button>
          ) : null}
          <Textarea className="min-h-28" onChange={(event) => setNote(event.target.value)} placeholder={t("Private note")} value={note} />
          <Button className="w-full" disabled={save.isPending || !productId.trim()} onClick={() => save.mutate()}>{save.isPending ? <Loader2 className="size-4 animate-spin" /> : <Heart className="size-4" />}{t("Save product")}</Button>
        </CardContent>
      </Card> : null}
    </section>
  );
}

export function CustomerHelpPanel({ pathname = "/user/support/help" }: { pathname?: string }) {
  const { lang } = useI18n();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const selectedArticleId = helpArticleIdFromPath(pathname);
  const help = useQuery({
    queryFn: () => getCustomerHelp({ page, pageSize: selectedArticleId ? 5 : 12, search }),
    queryKey: ["customer-help", page, search, selectedArticleId ? "recent" : "list"],
    retry: 1,
  });
  const selectedArticle = useQuery({
    enabled: Boolean(selectedArticleId),
    queryFn: () => getCustomerHelpItem(selectedArticleId ?? ""),
    queryKey: ["customer-help-item", selectedArticleId],
    retry: 1,
  });
  const items = help.data?.items ?? [];

  if (selectedArticleId) {
    const item = selectedArticle.data;
    const question = item ? localizedText(item.question, lang) : "";
    const answer = item ? localizedText(item.answer, lang) : "";
    return (
      <section className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <Card className="rounded-2xl border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]">
          <CardHeader className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Button asChild size="sm" variant="outline">
                <Link href="/user/support/help">
                  <HelpCircle className="size-4" />
                  Knowledge base
                </Link>
              </Button>
              {item?.updatedAt ? <Badge variant="outline">Updated {formatDate(item.updatedAt)}</Badge> : null}
            </div>
            <CardTitle className="text-xl font-black leading-8 md:text-2xl">{selectedArticle.isLoading ? "Loading article" : question}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedArticle.isLoading ? <PanelSkeleton /> : null}
            {selectedArticle.isError ? <ErrorBox message={selectedArticle.error.message} title="Article unavailable" /> : null}
            {!selectedArticle.isLoading && !selectedArticle.isError && item ? (
              <>
                <div className="rounded-xl border border-border bg-background/35 p-5 text-sm leading-8 text-muted-foreground">
                  {answer}
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  <Stat label="Article ID" value={item.id} />
                  <Stat label="Sort order" value={String(item.sortOrder)} />
                  <Stat label="Support path" value="Ticket or live chat" />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button asChild>
                    <Link href="/user/support/tickets/open">
                      <MessageCircle className="size-4" />
                      Open ticket
                    </Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="/user/support/live-chat">
                      <Send className="size-4" />
                      Start live chat
                    </Link>
                  </Button>
                </div>
              </>
            ) : null}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="rounded-2xl border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]">
            <CardHeader><CardTitle><T>Recent Articles</T></CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {help.isLoading ? <PanelSkeleton /> : null}
              {help.isError ? <ErrorBox message={help.error.message} title="Knowledge base unavailable" /> : null}
              {!help.isLoading && !help.isError && items.length ? items.map((recent) => <HelpRow item={recent} key={recent.id} lang={lang} selected={recent.id === selectedArticleId} />) : null}
              {!help.isLoading && !help.isError && !items.length ? <EmptyBox label="No recent articles are available." /> : null}
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]">
            <CardHeader><CardTitle><T>Need More Help?</T></CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="leading-7 text-muted-foreground"><T>Attach this article ID to a ticket so support can review the exact help context with your account history.</T></p>
              <Button asChild className="w-full" variant="outline"><Link href="/user/support/tickets"><T>View tickets</T></Link></Button>
            </CardContent>
          </Card>
        </div>
      </section>
    );
  }

  return (
    <Card className="rounded-2xl border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]">
      <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <CardTitle className="flex items-center gap-2"><HelpCircle className="size-5 text-primary" /><T>Knowledge Base</T></CardTitle>
        <Input className="md:max-w-sm" onChange={(event) => { setPage(1); setSearch(event.target.value); }} placeholder={translateUiText("Search help articles", lang)} value={search} />
      </CardHeader>
      <CardContent>
        {help.isLoading ? <PanelSkeleton /> : null}
        {help.isError ? <ErrorBox message={help.error.message} title="Knowledge base unavailable" /> : null}
        {!help.isLoading && !help.isError && items.length ? (
          <div className="space-y-3">
            {items.map((item) => <HelpRow item={item} key={item.id} lang={lang} />)}
          </div>
        ) : null}
        {!help.isLoading && !help.isError && !items.length ? <EmptyBox label="No help entries match this search." /> : null}
        <Pagination page={page} setPage={setPage} totalPages={help.data?.totalPages ?? 1} />
      </CardContent>
    </Card>
  );
}

export function CustomerProfilePanel({ pathname = "/user/account" }: { pathname?: string }) {
  if (pathname.includes("/account/sessions") || pathname.includes("/account/security")) return <CustomerSessionsPanel />;
  if (pathname.includes("/account/two-factor")) return <CustomerTwoFactorPanel />;
  if (pathname.includes("/account/api-tokens")) return <CustomerApiTokensPanel />;
  if (pathname.includes("/account/company")) return <CustomerCompanyPanel />;
  if (pathname.includes("/account/addresses")) return <CustomerAddressesPanel />;
  if (pathname.includes("/account/password")) return <CustomerPasswordPanel />;
  if (pathname === "/user/settings" || pathname.includes("/settings/language") || pathname.includes("/settings/currency") || pathname.includes("/settings/email") || pathname.includes("/settings/privacy") || pathname.includes("/settings/preferences")) return <CustomerPreferencesPanel pathname={pathname} />;
  if (pathname.includes("/settings/notifications")) return <CustomerNotificationPreferencesPanel />;
  return <CustomerProfileForm />;
}

function CustomerProfileForm() {
  const t = useDashboardT();
  const { refreshUser, user } = useAuth();
  const [firstName, setFirstName] = useState(user?.profile?.firstName ?? "");
  const [lastName, setLastName] = useState(user?.profile?.lastName ?? "");
  const [locale, setLocale] = useState(user?.profile?.locale ?? "fa");
  const [timezone, setTimezone] = useState(user?.profile?.timezone ?? "Asia/Tehran");
  const profileName = [firstName, lastName].filter(Boolean).join(" ");
  const initials = (profileName || user?.email || "S").slice(0, 2).toUpperCase();
  const update = useMutation({
    mutationFn: () => platformAuth.updateProfile({ firstName, lastName, locale, timezone }),
    onError: (error) => toast.error(error instanceof Error ? error.message : t("Profile update failed")),
    onSuccess: async (result) => {
      if (result.error) {
        toast.error(result.error.message);
        return;
      }
      await refreshUser();
      toast.success(t("Profile updated."));
    },
  });

  return (
    <section className="space-y-4 text-start">
      <Card className="overflow-hidden rounded-2xl border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]">
        <CardContent className="p-0">
          <div className="border-b border-border bg-background/35 p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="size-16 border border-border shadow-[0_18px_45px_-30px_var(--glow)]">
                  <AvatarFallback className="bg-gradient-gold text-lg font-black text-primary-foreground">{initials}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-2xl font-black">{profileName || t("کاربر نقره")}</p>
                  <p className="mt-1 truncate text-sm text-muted-foreground" dir="ltr">{user?.email}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{t(user?.status ?? "ACTIVE")}</Badge>
                <Badge variant={user?.emailVerifiedAt ? "default" : "outline"}>{user?.emailVerifiedAt ? t("Email verified") : t("Email pending")}</Badge>
              </div>
            </div>
          </div>
          <div className="grid gap-4 p-5 xl:grid-cols-[1fr_420px]">
            <div className="space-y-4">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg"><User className="size-5 text-primary" /><T>Profile Details</T></CardTitle>
                <p className="mt-1 text-sm text-muted-foreground"><T>Manage the account identity used across invoices, support, live chat, and product ownership.</T></p>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <Input onChange={(event) => setFirstName(event.target.value)} placeholder={t("First name")} value={firstName} />
                <Input onChange={(event) => setLastName(event.target.value)} placeholder={t("Last name")} value={lastName} />
                <Input dir="ltr" placeholder={t("Email")} readOnly value={user?.email ?? ""} />
                <Input dir="ltr" placeholder={t("Mobile")} readOnly value={formatMobileDisplay(user?.mobile)} />
                <Input dir="ltr" placeholder={t("ID number")} readOnly value={user?.profile?.idCardNo ?? ""} />
                <Input onChange={(event) => setLocale(event.target.value)} placeholder={t("Locale")} value={locale} />
                <Input onChange={(event) => setTimezone(event.target.value)} placeholder={t("Timezone")} value={timezone} />
              </div>
              <Button disabled={update.isPending || !firstName.trim()} onClick={() => update.mutate()}>
                {update.isPending ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
                {t("Save profile details")}
              </Button>
            </div>
            <AccountAccessPanel />
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

function AccountAccessPanel() {
  const { refreshUser, user } = useAuth();
  const [mobile, setMobile] = useState(formatMobileDisplay(user?.mobile));
  const [mobileCode, setMobileCode] = useState("");
  const [mobileCodeSent, setMobileCodeSent] = useState(false);
  const [email, setEmail] = useState(user?.email ?? "");
  const [emailCode, setEmailCode] = useState("");
  const [emailCodeSent, setEmailCodeSent] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    setMobile(formatMobileDisplay(user?.mobile));
    setEmail(user?.email ?? "");
  }, [user?.email, user?.mobile]);

  const mobileRequest = useMutation({
    mutationFn: async () => unwrapAuthResult(await platformAuth.requestContactMobile(mobile)),
    onError: showAccountError,
    onSuccess: () => { setMobileCodeSent(true); toast.success("کد تأیید به شماره موبایل ارسال شد."); },
  });
  const mobileVerify = useMutation({
    mutationFn: async () => unwrapAuthResult(await platformAuth.verifyContactMobile({ code: mobileCode, mobile })),
    onError: showAccountError,
    onSuccess: async () => { await refreshUser(); setMobileCodeSent(false); setMobileCode(""); toast.success("شماره موبایل تأیید و به حساب متصل شد."); },
  });
  const emailRequest = useMutation({
    mutationFn: async () => unwrapAuthResult(await platformAuth.requestContactEmail(email)),
    onError: showAccountError,
    onSuccess: () => { setEmailCodeSent(true); toast.success("کد تأیید به ایمیل ارسال شد."); },
  });
  const emailVerify = useMutation({
    mutationFn: async () => unwrapAuthResult(await platformAuth.verifyContactEmail({ code: emailCode, email })),
    onError: showAccountError,
    onSuccess: async () => { await refreshUser(); setEmailCodeSent(false); setEmailCode(""); toast.success("ایمیل تأیید و به حساب متصل شد."); },
  });
  const setAccountPassword = useMutation({
    mutationFn: async () => unwrapAuthResult(await platformAuth.setPassword({ confirmPassword, password })),
    onError: showAccountError,
    onSuccess: async () => { await refreshUser(); setPassword(""); setConfirmPassword(""); toast.success("رمز عبور برای حساب فعال شد."); },
  });

  const hasPassword = Boolean(user?.authMethods?.password);
  const providers = user?.authMethods?.providers ?? [];
  const mobileVerified = Boolean(user?.mobileVerifiedAt);
  const emailVerified = Boolean(user?.emailVerifiedAt);
  const kycApproved = user?.kycStatus === "APPROVED";

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-background/30 p-4">
      <div>
        <CardTitle className="flex items-center gap-2 text-lg"><ShieldCheck className="size-5 text-primary" />روش‌های ورود و احراز حساب</CardTitle>
        <p className="mt-1 text-sm leading-7 text-muted-foreground">هر روش ورود پس از تأیید به همین حساب متصل می‌شود. برای احراز هویت، موبایل تأییدشده الزامی است.</p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <AccountStep done={mobileVerified} label="موبایل" value={mobileVerified ? formatMobileDisplay(user?.mobile) : "نیازمند تأیید پیامکی"} />
        <AccountStep done={emailVerified} label="ایمیل" value={emailVerified ? user?.email ?? "تأییدشده" : "اختیاری، نیازمند تأیید"} />
        <AccountStep done={hasPassword} label="ورود با رمز" value={hasPassword ? "فعال" : "قابل افزودن"} />
        <AccountStep done={kycApproved} label="احراز هویت" value={kycApproved ? "تأییدشده" : mobileVerified ? "آماده بررسی" : "پس از تأیید موبایل"} />
      </div>

      {providers.length ? <div className="flex flex-wrap gap-2"><span className="text-xs text-muted-foreground">ورود اجتماعی متصل:</span>{providers.map((provider) => <Badge key={provider} variant="outline">{provider === "google" ? "Google" : provider === "apple" ? "Apple" : provider}</Badge>)}</div> : null}

      {!mobileVerified ? (
        <div className="space-y-2 rounded-xl border border-border p-3">
          <p className="text-sm font-semibold">افزودن و تأیید شماره موبایل</p>
          <Input dir="ltr" inputMode="tel" onChange={(event) => setMobile(event.target.value)} placeholder="09121234567" value={mobile} />
          {mobileCodeSent ? <Input dir="ltr" inputMode="numeric" maxLength={6} onChange={(event) => setMobileCode(event.target.value.replace(/\D/g, ""))} placeholder="کد ۶ رقمی" value={mobileCode} /> : null}
          <Button className="w-full" disabled={mobileRequest.isPending || mobileVerify.isPending || (mobileCodeSent ? mobileCode.length !== 6 : !mobile.trim())} onClick={() => mobileCodeSent ? mobileVerify.mutate() : mobileRequest.mutate()} type="button">
            {(mobileRequest.isPending || mobileVerify.isPending) ? <Loader2 className="size-4 animate-spin" /> : <Smartphone className="size-4" />}
            {mobileCodeSent ? "تأیید و اتصال موبایل" : "ارسال کد تأیید"}
          </Button>
        </div>
      ) : null}

      {!emailVerified ? (
        <div className="space-y-2 rounded-xl border border-border p-3">
          <p className="text-sm font-semibold">افزودن و تأیید ایمیل</p>
          <Input dir="ltr" onChange={(event) => setEmail(event.target.value)} placeholder="name@example.com" type="email" value={email} />
          {emailCodeSent ? <Input dir="ltr" inputMode="numeric" maxLength={6} onChange={(event) => setEmailCode(event.target.value.replace(/\D/g, ""))} placeholder="کد ۶ رقمی" value={emailCode} /> : null}
          <Button className="w-full" disabled={emailRequest.isPending || emailVerify.isPending || (emailCodeSent ? emailCode.length !== 6 : !email.trim())} onClick={() => emailCodeSent ? emailVerify.mutate() : emailRequest.mutate()} type="button" variant="outline">
            {(emailRequest.isPending || emailVerify.isPending) ? <Loader2 className="size-4 animate-spin" /> : <Mail className="size-4" />}
            {emailCodeSent ? "تأیید و اتصال ایمیل" : "ارسال کد ایمیل"}
          </Button>
        </div>
      ) : null}

      {!hasPassword ? (
        <div className="space-y-2 rounded-xl border border-border p-3">
          <p className="text-sm font-semibold">فعال‌سازی ورود با موبایل/ایمیل و رمز</p>
          <Input onChange={(event) => setPassword(event.target.value)} placeholder="رمز عبور جدید (حداقل ۸ کاراکتر)" type="password" value={password} />
          <Input onChange={(event) => setConfirmPassword(event.target.value)} placeholder="تکرار رمز عبور" type="password" value={confirmPassword} />
          <Button className="w-full" disabled={setAccountPassword.isPending || password.length < 8 || password !== confirmPassword} onClick={() => setAccountPassword.mutate()} type="button" variant="outline">
            {setAccountPassword.isPending ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />}افزودن رمز عبور
          </Button>
        </div>
      ) : <Button asChild className="w-full" variant="outline"><Link href="/user/account/password"><KeyRound className="size-4" />تغییر رمز عبور</Link></Button>}

      <Button asChild className="w-full" disabled={!mobileVerified || kycApproved}><Link href="/user/profile"><ShieldCheck className="size-4" />{kycApproved ? "احراز هویت تأیید شده" : "ادامه احراز خودکار"}</Link></Button>
      <Button asChild className="w-full" variant="ghost"><Link href="/user/account/sessions">مدیریت نشست‌های ورود</Link></Button>
    </div>
  );
}

function AccountStep({ done, label, value }: { done: boolean; label: string; value: string }) {
  return <div className="rounded-xl border border-border bg-background/40 p-3"><div className="flex items-center justify-between gap-2"><span className="text-sm font-semibold">{label}</span><Badge variant={done ? "default" : "outline"}>{done ? "تکمیل" : "ناقص"}</Badge></div><p className="mt-1 truncate text-xs text-muted-foreground" dir="auto">{value}</p></div>;
}

function unwrapAuthResult<T>(result: { data?: T; error: Error | null }) {
  if (result.error) throw result.error;
  return result.data;
}

function showAccountError(error: unknown) {
  toast.error(error instanceof Error ? error.message : "عملیات حساب انجام نشد.");
}

function CustomerCompanyPanel() {
  const t = useDashboardT();
  const queryClient = useQueryClient();
  const company = useQuery({ queryFn: () => getCustomerCompany(), queryKey: ["customer-company"], retry: 1 });
  const [draft, setDraft] = useState<Partial<CustomerCompanyProfile>>({});
  const data = { ...(company.data ?? {}), ...draft };
  const save = useMutation({
    mutationFn: () => updateCustomerCompany(data),
    onError: (error) => toast.error(error instanceof Error ? error.message : t("Company update failed")),
    onSuccess: () => {
      toast.success(t("Company profile saved."));
      setDraft({});
      void queryClient.invalidateQueries({ queryKey: ["customer-company"] });
    },
  });
  return (
    <Card className="rounded-2xl border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]">
      <CardHeader><CardTitle><T>Company Information</T></CardTitle></CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2">
        {company.isLoading ? <PanelSkeleton /> : null}
        {company.isError ? <ErrorBox message={company.error.message} title="Company profile unavailable" /> : null}
        {!company.isLoading && !company.isError ? <>
          <Input onChange={(event) => setDraft((current) => ({ ...current, companyName: event.target.value }))} placeholder={t("Company name")} value={data.companyName ?? ""} />
          <Input onChange={(event) => setDraft((current) => ({ ...current, billingEmail: event.target.value }))} placeholder={t("Billing email")} value={data.billingEmail ?? ""} />
          <Input onChange={(event) => setDraft((current) => ({ ...current, registrationNo: event.target.value }))} placeholder={t("Registration number")} value={data.registrationNo ?? ""} />
          <Input onChange={(event) => setDraft((current) => ({ ...current, taxId: event.target.value }))} placeholder={t("Tax ID")} value={data.taxId ?? ""} />
          <Input onChange={(event) => setDraft((current) => ({ ...current, website: event.target.value }))} placeholder={t("Website")} value={data.website ?? ""} />
          <Input onChange={(event) => setDraft((current) => ({ ...current, industry: event.target.value }))} placeholder={t("Industry")} value={data.industry ?? ""} />
          <Textarea className="min-h-28 md:col-span-2" onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))} placeholder={t("Billing notes")} value={data.notes ?? ""} />
          <Button className="md:col-span-2" disabled={save.isPending} onClick={() => save.mutate()}>{save.isPending ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}{t("Save company")}</Button>
        </> : null}
      </CardContent>
    </Card>
  );
}

function CustomerAddressesPanel() {
  const t = useDashboardT();
  const queryClient = useQueryClient();
  const addresses = useQuery({ queryFn: () => getCustomerAddresses(), queryKey: ["customer-addresses"], retry: 1 });
  const [draft, setDraft] = useState<Partial<CustomerAddressItem>>({ country: "Iran", label: "Billing" });
  const save = useMutation({
    mutationFn: () => createCustomerAddress(draft),
    onError: (error) => toast.error(error instanceof Error ? error.message : t("Address save failed")),
    onSuccess: () => {
      toast.success(t("Address saved."));
      setDraft({ country: "Iran", label: "Billing" });
      void queryClient.invalidateQueries({ queryKey: ["customer-addresses"] });
    },
  });
  const action = useMutation({
    mutationFn: ({ id, type }: { id: string; type: "default" | "delete" }) => type === "delete" ? deleteCustomerAddress(id) : updateCustomerAddress(id, { isDefault: true }),
    onError: (error) => toast.error(error instanceof Error ? error.message : t("Address action failed")),
    onSuccess: () => {
      toast.success(t("Address updated."));
      void queryClient.invalidateQueries({ queryKey: ["customer-addresses"] });
    },
  });
  return (
    <section className="grid gap-4 xl:grid-cols-[1fr_360px]">
      <Card className="rounded-2xl border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]">
        <CardHeader><CardTitle><T>Addresses</T></CardTitle></CardHeader>
        <CardContent>
          {addresses.isLoading ? <PanelSkeleton /> : null}
          {addresses.isError ? <ErrorBox message={addresses.error.message} title="Addresses unavailable" /> : null}
          {!addresses.isLoading && !addresses.isError && addresses.data?.length ? <div className="space-y-3">{addresses.data.map((item) => <div className="rounded-xl border border-border bg-background/35 p-3" key={item.id}><div className="flex items-start justify-between gap-3"><div><p className="font-semibold">{item.label} {item.isDefault ? `· ${t("Default")}` : ""}</p><p className="mt-1 text-sm text-muted-foreground">{item.line1}, {item.city}, {item.country}</p></div><Badge variant="outline">{item.postalCode ?? t("No postal")}</Badge></div><div className="mt-3 flex gap-2"><Button disabled={action.isPending || item.isDefault} onClick={() => action.mutate({ id: item.id, type: "default" })} size="sm" variant="outline">{t("Set default")}</Button><Button disabled={action.isPending} onClick={() => action.mutate({ id: item.id, type: "delete" })} size="sm" variant="outline"><Trash2 className="size-4" /><T>Delete</T></Button></div></div>)}</div> : null}
          {!addresses.isLoading && !addresses.isError && !addresses.data?.length ? <EmptyBox label="No addresses yet." /> : null}
        </CardContent>
      </Card>
      <Card className="rounded-2xl border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]">
        <CardHeader><CardTitle><T>New Address</T></CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Input onChange={(event) => setDraft((current) => ({ ...current, label: event.target.value }))} placeholder={t("Label")} value={draft.label ?? ""} />
          <Input onChange={(event) => setDraft((current) => ({ ...current, recipient: event.target.value }))} placeholder={t("Recipient")} value={draft.recipient ?? ""} />
          <Input onChange={(event) => setDraft((current) => ({ ...current, country: event.target.value }))} placeholder={t("Country")} value={draft.country ?? ""} />
          <Input onChange={(event) => setDraft((current) => ({ ...current, city: event.target.value }))} placeholder={t("City")} value={draft.city ?? ""} />
          <Input onChange={(event) => setDraft((current) => ({ ...current, line1: event.target.value }))} placeholder={t("Address line")} value={draft.line1 ?? ""} />
          <Input onChange={(event) => setDraft((current) => ({ ...current, postalCode: event.target.value }))} placeholder={t("Postal code")} value={draft.postalCode ?? ""} />
          <Button className="w-full" disabled={save.isPending || !draft.label || !draft.country || !draft.city || !draft.line1} onClick={() => save.mutate()}>{save.isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}{t("Save address")}</Button>
        </CardContent>
      </Card>
    </section>
  );
}

function CustomerPasswordPanel() {
  const t = useDashboardT();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const change = useMutation({
    mutationFn: async () => {
      const result = await platformAuth.changePassword({ currentPassword, newPassword });
      if (result.error) throw result.error;
      return result.data;
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t("Password change failed")),
    onSuccess: () => {
      toast.success(t("Password changed. Other sessions were revoked."));
      setCurrentPassword("");
      setNewPassword("");
    },
  });
  return <Card className="rounded-2xl border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]"><CardHeader><CardTitle><T>Password</T></CardTitle></CardHeader><CardContent className="max-w-xl space-y-3"><Input onChange={(event) => setCurrentPassword(event.target.value)} placeholder={t("Current password")} type="password" value={currentPassword} /><Input onChange={(event) => setNewPassword(event.target.value)} placeholder={t("New password")} type="password" value={newPassword} /><Button disabled={change.isPending || currentPassword.length < 1 || newPassword.length < 8} onClick={() => change.mutate()}>{change.isPending ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />}{t("Change password")}</Button></CardContent></Card>;
}

function CustomerTwoFactorPanel() {
  const t = useDashboardT();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const security = useQuery({ queryFn: () => getCustomerSecuritySettings(), queryKey: ["customer-security-settings"], retry: 1 });
  const [draft, setDraft] = useState<{ loginAlerts?: boolean; twoFactorChannel?: "EMAIL" | "SMS"; twoFactorEnabled?: boolean }>({});
  const data = { ...(security.data ?? { loginAlerts: true, twoFactorChannel: "EMAIL" as const, twoFactorEnabled: false }), ...draft };
  const canUseSms = Boolean(user?.mobile);
  const save = useMutation({
    mutationFn: () => updateCustomerSecuritySettings({
      loginAlerts: data.loginAlerts,
      twoFactorChannel: data.twoFactorChannel === "SMS" && canUseSms ? "SMS" : "EMAIL",
      twoFactorEnabled: data.twoFactorEnabled,
    }),
    onError: (error) => toast.error(error instanceof Error ? error.message : t("Security settings could not be saved")),
    onSuccess: () => {
      toast.success(t("Security settings saved."));
      setDraft({});
      void queryClient.invalidateQueries({ queryKey: ["customer-security-settings"] });
    },
  });
  return (
    <section className="grid gap-4 xl:grid-cols-[1fr_360px]">
      <Card className="rounded-2xl border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]">
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2"><ShieldCheck className="size-5 text-primary" /><T>Two-Factor Authentication</T></CardTitle>
            <p className="mt-2 text-sm leading-7 text-muted-foreground"><T>Require an OTP challenge after password login. Codes are delivered by the existing secure OTP service.</T></p>
          </div>
          <Badge variant={data.twoFactorEnabled ? "default" : "outline"}>{data.twoFactorEnabled ? t("Protected") : t("Password only")}</Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          {security.isLoading ? <PanelSkeleton /> : null}
          {security.isError ? <ErrorBox message={security.error.message} title="Security settings unavailable" /> : null}
          {!security.isLoading && !security.isError ? (
            <>
              <div className="grid gap-3 md:grid-cols-2">
                <PreferenceToggle checked={Boolean(data.twoFactorEnabled)} label="Require OTP after password login" onCheckedChange={(checked) => setDraft((current) => ({ ...current, twoFactorEnabled: checked }))} />
                <PreferenceToggle checked={Boolean(data.loginAlerts)} label="Send login security alerts" onCheckedChange={(checked) => setDraft((current) => ({ ...current, loginAlerts: checked }))} />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <button
                  className={cn("rounded-xl border p-4 text-start transition hover:border-primary/40", data.twoFactorChannel === "EMAIL" ? "border-primary bg-primary/10" : "border-border bg-background/35")}
                  onClick={() => setDraft((current) => ({ ...current, twoFactorChannel: "EMAIL" }))}
                  type="button"
                >
                  <span className="block font-semibold">{t("Email OTP")}</span>
                  <span className="mt-1 block text-xs text-muted-foreground">{user?.email ?? t("Account email")}</span>
                </button>
                <button
                  className={cn("rounded-xl border p-4 text-start transition hover:border-primary/40 disabled:cursor-not-allowed disabled:opacity-55", data.twoFactorChannel === "SMS" ? "border-primary bg-primary/10" : "border-border bg-background/35")}
                  disabled={!canUseSms}
                  onClick={() => setDraft((current) => ({ ...current, twoFactorChannel: "SMS" }))}
                  type="button"
                >
                  <span className="block font-semibold">{t("SMS OTP")}</span>
                  <span className="mt-1 block text-xs text-muted-foreground">{formatMobileDisplay(user?.mobile) || t("Add mobile number before using SMS")}</span>
                </button>
              </div>
              <Button disabled={save.isPending} onClick={() => save.mutate()}>
                {save.isPending ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
                {t("Save two-factor settings")}
              </Button>
            </>
          ) : null}
          <div className="grid gap-3 md:grid-cols-3">
            <Stat label="Email" value={user?.emailVerifiedAt ? "Verified" : "Pending"} />
            <Stat label="Mobile" value={user?.mobileVerifiedAt ? "Verified" : "Not connected"} />
            <Stat label="Login challenge" value={data.twoFactorEnabled ? data.twoFactorChannel : "Disabled"} />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline"><Link href="/user/account/password"><KeyRound className="size-4" /><T>Change password</T></Link></Button>
            <Button asChild variant="outline"><Link href="/user/account/sessions"><ShieldCheck className="size-4" /><T>Review sessions</T></Link></Button>
            <Button asChild variant="outline"><Link href="/user/support/tickets/open"><MessageCircle className="size-4" /><T>Security support</T></Link></Button>
          </div>
        </CardContent>
      </Card>
      <Card className="rounded-2xl border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]">
        <CardHeader><CardTitle><T>Recommended Controls</T></CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <SecurityChecklistItem label="Use a unique password with at least 8 characters." />
          <SecurityChecklistItem label="Revoke any browser session you do not recognize." />
          <SecurityChecklistItem label="Keep billing email and support identity up to date." />
        </CardContent>
      </Card>
    </section>
  );
}

function CustomerApiTokensPanel() {
  const t = useDashboardT();
  const queryClient = useQueryClient();
  const tokens = useQuery({ queryFn: () => getCustomerApiTokens(), queryKey: ["customer-api-tokens"], retry: 1 });
  const [name, setName] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [scopes, setScopes] = useState<string[]>(["orders:read", "invoices:read"]);
  const [revealedToken, setRevealedToken] = useState("");
  const create = useMutation({
    mutationFn: () => createCustomerApiToken({ expiresAt: expiresAt || undefined, name, scopes }),
    onError: (error) => toast.error(error instanceof Error ? error.message : t("API token could not be created")),
    onSuccess: (result) => {
      toast.success(t("API token created. Copy it now."));
      setName("");
      setExpiresAt("");
      setScopes(["orders:read", "invoices:read"]);
      setRevealedToken(result.token);
      void queryClient.invalidateQueries({ queryKey: ["customer-api-tokens"] });
    },
  });
  const revoke = useMutation({
    mutationFn: (id: string) => revokeCustomerApiToken(id),
    onError: (error) => toast.error(error instanceof Error ? error.message : t("API token could not be revoked")),
    onSuccess: () => {
      toast.success(t("API token revoked."));
      void queryClient.invalidateQueries({ queryKey: ["customer-api-tokens"] });
    },
  });
  const activeTokens = tokens.data?.filter((token) => token.status === "ACTIVE").length ?? 0;
  const toggleScope = (scope: string, checked: boolean) => setScopes((current) => checked ? Array.from(new Set([...current, scope])) : current.filter((item) => item !== scope));

  return (
    <section className="grid gap-4 xl:grid-cols-[1fr_360px]">
      <Card className="rounded-2xl border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]">
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2"><KeyRound className="size-5 text-primary" /><T>API Tokens</T></CardTitle>
            <p className="mt-2 text-sm leading-7 text-muted-foreground"><T>Create hashed customer integration tokens for read-only account automation and support workflows.</T></p>
          </div>
          <Badge variant="outline">{activeTokens} {t("active")}</Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          {revealedToken ? (
            <Alert>
              <KeyRound className="size-4" />
              <AlertTitle><T>Copy this token now</T></AlertTitle>
              <AlertDescription>
                <span className="mt-2 block rounded-lg border border-border bg-background/60 p-3 font-mono text-xs" dir="ltr">{revealedToken}</span>
                <span className="mt-2 block">{t("For security, the full token is shown only once. The backend stores only a SHA-256 hash.")}</span>
              </AlertDescription>
            </Alert>
          ) : null}
          {tokens.isLoading ? <PanelSkeleton /> : null}
          {tokens.isError ? <ErrorBox message={tokens.error.message} title="API tokens unavailable" /> : null}
          {!tokens.isLoading && !tokens.isError && tokens.data?.length ? (
            <div className="space-y-3">
              {tokens.data.map((token) => <ApiTokenRow item={token} key={token.id} onRevoke={() => revoke.mutate(token.id)} pending={revoke.isPending && revoke.variables === token.id} />)}
            </div>
          ) : null}
          {!tokens.isLoading && !tokens.isError && !tokens.data?.length ? <EmptyBox label="No API tokens have been created yet." /> : null}
        </CardContent>
      </Card>
      <div className="space-y-4">
        <Card className="rounded-2xl border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]">
          <CardHeader><CardTitle><T>Create Token</T></CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Input onChange={(event) => setName(event.target.value)} placeholder={t("Token name")} value={name} />
            <Input onChange={(event) => setExpiresAt(event.target.value)} placeholder={t("Expires at, e.g. 2026-12-31")} type="date" value={expiresAt} />
            <div className="space-y-2">
              {apiTokenScopes.map((scope) => (
                <label className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background/35 p-3 text-sm" key={scope.value}>
                  <span>
                    <span className="block font-semibold">{t(scope.label)}</span>
                    <span className="block text-xs text-muted-foreground">{t(scope.description)}</span>
                  </span>
                  <Switch checked={scopes.includes(scope.value)} onCheckedChange={(checked) => toggleScope(scope.value, checked)} />
                </label>
              ))}
            </div>
            <Button className="w-full" disabled={create.isPending || !name.trim() || !scopes.length} onClick={() => create.mutate()}>
              {create.isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
              {t("Create API token")}
            </Button>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]">
          <CardHeader><CardTitle><T>Token Policy</T></CardTitle></CardHeader>
          <CardContent className="space-y-3">
          <div className="grid gap-3 md:grid-cols-3">
            <Stat label="Session auth" value="Active" />
            <Stat label="Active tokens" value={String(activeTokens)} />
            <Stat label="Storage" value="Hashed" />
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            <Button asChild variant="outline"><Link href="/user/support/tickets/open"><MessageCircle className="size-4" /><T>Request API access</T></Link></Button>
            <Button asChild variant="outline"><Link href="/user/account/sessions"><ShieldCheck className="size-4" /><T>Manage sessions</T></Link></Button>
          </div>
          <Separator />
          <div className="space-y-2 text-sm">
            <SecurityChecklistItem label="Tokens are stored as hashes and the secret is shown only once." />
            <SecurityChecklistItem label="Revoke unused tokens immediately from this page." />
            <SecurityChecklistItem label="Use the smallest scope set needed for each integration." />
          </div>
        </CardContent>
        </Card>
      </div>
    </section>
  );
}

function SecurityChecklistItem({ label }: { label: string }) {
  const t = useDashboardT();
  return <div className="rounded-xl border border-border bg-background/35 p-3 text-muted-foreground">{t(label)}</div>;
}

function PreferenceToggle({ checked, label, onCheckedChange }: { checked: boolean; label: string; onCheckedChange: (checked: boolean) => void }) {
  const t = useDashboardT();
  return <label className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background/35 p-3 text-sm">{t(label)}<Switch checked={checked} onCheckedChange={onCheckedChange} /></label>;
}

function settingsModeFromPath(pathname: string) {
  if (pathname.includes("/settings/language")) return "language";
  if (pathname.includes("/settings/currency")) return "currency";
  if (pathname.includes("/settings/email")) return "email";
  if (pathname.includes("/settings/privacy")) return "privacy";
  return "general";
}

function settingsModeTitle(mode: string) {
  const titles: Record<string, string> = {
    currency: "Currency Preference",
    email: "Email Preferences",
    general: "General Preferences",
    language: "Language Preferences",
    privacy: "Privacy Preferences",
  };
  return titles[mode] ?? "General Preferences";
}

function CustomerPreferencesPanel({ pathname }: { pathname: string }) {
  const { dir, lang, languages } = useI18n();
  const t = (text: string) => translateUiText(text, lang);
  const queryClient = useQueryClient();
  const preferences = useQuery({ queryFn: () => getCustomerPreferences(), queryKey: ["customer-preferences"], retry: 1 });
  const asRecord = Object.fromEntries((preferences.data ?? []).map((item) => [item.key, item.value]));
  const [draft, setDraft] = useState<Record<string, string | boolean | number | null>>({});
  const data = {
    emailDigest: true,
    language: "fa",
    marketingEmail: false,
    orderEmail: true,
    privacyAnalytics: false,
    privacyPersonalization: true,
    supportEmail: true,
    timezone: "Asia/Tehran",
    ...asRecord,
    ...draft,
    currency: "TOMAN",
  };
  const mode = settingsModeFromPath(pathname);
  const save = useMutation({
    mutationFn: () => updateCustomerPreferences(data),
    onError: (error) => toast.error(error instanceof Error ? error.message : t("Preferences update failed")),
    onSuccess: () => {
      toast.success(t("Preferences saved."));
      setDraft({});
      void queryClient.invalidateQueries({ queryKey: ["customer-preferences"] });
    },
  });
  return (
    <section className="grid gap-4 xl:grid-cols-[1fr_360px]">
      <Card className="rounded-2xl border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]">
        <CardHeader><CardTitle><T>{settingsModeTitle(mode)}</T></CardTitle></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {preferences.isLoading ? <PanelSkeleton /> : null}
          {preferences.isError ? <ErrorBox message={preferences.error.message} title="Preferences unavailable" /> : null}
          {!preferences.isLoading && !preferences.isError ? (
            <>
              {mode === "language" || mode === "general" ? (
                <>
                  <Select dir={dir} onValueChange={(value) => setDraft((current) => ({ ...current, language: value }))} value={String(data.language ?? "fa")}>
                    <SelectTrigger><SelectValue placeholder={<T>Language</T>} /></SelectTrigger>
                    <SelectContent>
                      {languages.map((option) => (
                        <SelectItem key={option.code} value={option.code}>{languageLabel(option)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input onChange={(event) => setDraft((current) => ({ ...current, timezone: event.target.value }))} placeholder={t("Timezone")} value={String(data.timezone ?? "")} />
                </>
              ) : null}
              {mode === "currency" || mode === "general" ? (
                <Select dir={dir} onValueChange={(value) => setDraft((current) => ({ ...current, currency: value }))} value="TOMAN">
                  <SelectTrigger><SelectValue placeholder={<T>Currency</T>} /></SelectTrigger>
                  <SelectContent><SelectItem value="TOMAN">تومان</SelectItem></SelectContent>
                </Select>
              ) : null}
              {mode === "email" || mode === "general" ? (
                <>
                  <PreferenceToggle checked={Boolean(data.orderEmail)} label="Order and invoice emails" onCheckedChange={(checked) => setDraft((current) => ({ ...current, orderEmail: checked }))} />
                  <PreferenceToggle checked={Boolean(data.supportEmail)} label="Support and live chat emails" onCheckedChange={(checked) => setDraft((current) => ({ ...current, supportEmail: checked }))} />
                  <PreferenceToggle checked={Boolean(data.emailDigest)} label="Weekly account digest" onCheckedChange={(checked) => setDraft((current) => ({ ...current, emailDigest: checked }))} />
                  <PreferenceToggle checked={Boolean(data.marketingEmail)} label="Marketing and launch emails" onCheckedChange={(checked) => setDraft((current) => ({ ...current, marketingEmail: checked }))} />
                </>
              ) : null}
              {mode === "privacy" || mode === "general" ? (
                <>
                  <PreferenceToggle checked={Boolean(data.privacyAnalytics)} label="Allow analytics personalization" onCheckedChange={(checked) => setDraft((current) => ({ ...current, privacyAnalytics: checked }))} />
                  <PreferenceToggle checked={Boolean(data.privacyPersonalization)} label="Personalize product recommendations" onCheckedChange={(checked) => setDraft((current) => ({ ...current, privacyPersonalization: checked }))} />
                </>
              ) : null}
              <Button className="md:col-span-2" disabled={save.isPending} onClick={() => save.mutate()}>{save.isPending ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}{t("Save")} {t(settingsModeTitle(mode))}</Button>
            </>
          ) : null}
        </CardContent>
      </Card>
      <Card className="rounded-2xl border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]">
        <CardHeader><CardTitle><T>Current Values</T></CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Stat label="Language" value={String(data.language ?? "fa")} />
          <Stat label="Currency" value={String(data.currency ?? "USD")} />
          <Stat label="Email digest" value={data.emailDigest ? "Enabled" : "Disabled"} />
          <Stat label="Privacy analytics" value={data.privacyAnalytics ? "Enabled" : "Disabled"} />
        </CardContent>
      </Card>
    </section>
  );
}

function CustomerSessionsPanel() {
  const t = useDashboardT();
  const queryClient = useQueryClient();
  const sessions = useQuery({
    queryFn: async () => {
      const result = await platformAuth.sessions();
      if (result.error) throw result.error;
      return result.data ?? [];
    },
    queryKey: ["customer-auth-sessions"],
    retry: 1,
  });
  const revoke = useMutation({
    mutationFn: async (sessionId: string) => {
      const result = await platformAuth.revokeSession(sessionId);
      if (result.error) throw result.error;
      return result.data;
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t("Session revoke failed")),
    onSuccess: () => {
      toast.success(t("Session revoked."));
      void queryClient.invalidateQueries({ queryKey: ["customer-auth-sessions"] });
    },
  });

  return (
    <Card className="rounded-2xl border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]">
      <CardHeader><CardTitle><T>Login Sessions</T></CardTitle></CardHeader>
      <CardContent>
        {sessions.isLoading ? <PanelSkeleton /> : null}
        {sessions.isError ? <ErrorBox message={sessions.error.message} title="Sessions unavailable" /> : null}
        {!sessions.isLoading && !sessions.isError && sessions.data?.length ? (
          <div className="space-y-3">
            {sessions.data.map((session) => (
              <SessionRow key={session.id} onRevoke={() => revoke.mutate(session.id)} pending={revoke.isPending} session={session} />
            ))}
          </div>
        ) : null}
        {!sessions.isLoading && !sessions.isError && !sessions.data?.length ? <EmptyBox label="No active session records were found." /> : null}
      </CardContent>
    </Card>
  );
}

function CustomerNotificationPreferencesPanel() {
  const t = useDashboardT();
  const queryClient = useQueryClient();
  const preferences = useQuery({
    queryFn: () => getNotificationPreferences() as Promise<Array<NotificationPreferenceInput & { id?: string }>>,
    queryKey: ["customer-notification-preferences"],
    retry: 1,
  });
  const [draft, setDraft] = useState<Record<string, NotificationPreferenceInput>>({});
  const channels: NotificationPreferenceInput["channel"][] = ["IN_APP", "EMAIL", "SMS", "TELEGRAM", "PUSH"];
  const events = ["order", "payment", "ticket", "live_chat", "referral", "system"];
  const merged = events.flatMap((event) => channels.map((channel) => {
    const key = prefKey(event, channel);
    const existing = preferences.data?.find((item) => item.event === event && item.channel === channel);
    return draft[key] ?? existing ?? { channel, enabled: channel === "IN_APP", event };
  }));
  const enabledCount = merged.filter((item) => item.enabled).length;
  const quietCount = merged.filter((item) => item.quietFrom || item.quietTo).length;
  const save = useMutation({
    mutationFn: () => updateNotificationPreferences(merged),
    onError: (error) => toast.error(error instanceof Error ? error.message : t("Preferences update failed")),
    onSuccess: () => {
      toast.success(t("Notification preferences saved."));
      setDraft({});
      void queryClient.invalidateQueries({ queryKey: ["customer-notification-preferences"] });
    },
  });

  return (
    <section className="grid gap-4 xl:grid-cols-[1fr_360px]">
      <Card className="rounded-2xl border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]">
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2"><Bell className="size-5 text-primary" /><T>Notification Preferences</T></CardTitle>
            <p className="mt-2 text-sm leading-7 text-muted-foreground"><T>Choose which account updates you receive and set hours when non-urgent messages should remain silent.</T></p>
          </div>
          <Button disabled={save.isPending || preferences.isLoading} onClick={() => save.mutate()}>{save.isPending ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}{t("Save preferences")}</Button>
        </CardHeader>
        <CardContent>
          {preferences.isLoading ? <PanelSkeleton /> : null}
          {preferences.isError ? <ErrorBox message={preferences.error.message} title="Preferences unavailable" /> : null}
          {!preferences.isLoading && !preferences.isError ? (
            <div className="space-y-4">
              {events.map((event) => {
                const eventPreferences = merged.filter((item) => item.event === event);
                const eventEnabled = eventPreferences.filter((item) => item.enabled).length;
                const eventMeta = notificationEventMeta(event);
                return (
                  <div className="rounded-xl border border-border bg-background/35 p-4" key={event}>
                    <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <p className="font-semibold">{t(eventMeta.label)}</p>
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">{t(eventMeta.description)}</p>
                      </div>
                      <Badge variant="outline">{eventEnabled}/{channels.length} {t("active")}</Badge>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                      {channels.map((channel) => {
                        const preference = eventPreferences.find((item) => item.channel === channel) ?? { channel, enabled: false, event };
                        const channelMeta = notificationChannelMeta(channel);
                        return (
                          <div className="rounded-lg border border-border bg-background/45 p-3" key={channel}>
                            <label className="flex min-h-12 items-center justify-between gap-3 text-sm">
                              <span>
                                <span className="block font-semibold">{t(channelMeta.label)}</span>
                                <span className="block text-xs text-muted-foreground">{t(channelMeta.description)}</span>
                              </span>
                              <Switch checked={preference.enabled} onCheckedChange={(enabled) => setDraft((current) => ({ ...current, [prefKey(event, channel)]: { ...preference, enabled } }))} />
                            </label>
                            <div className="mt-3 grid gap-2">
                              <Input
                                aria-label={`${t(eventMeta.label)} ${t(channelMeta.label)} ${t("quiet from")}`}
                                className="h-8 text-xs"
                                onChange={(eventInput) => setDraft((current) => ({ ...current, [prefKey(event, channel)]: { ...preference, quietFrom: eventInput.target.value || undefined } }))}
                                placeholder={t("Quiet from")}
                                value={preference.quietFrom ?? ""}
                              />
                              <Input
                                aria-label={`${t(eventMeta.label)} ${t(channelMeta.label)} ${t("quiet to")}`}
                                className="h-8 text-xs"
                                onChange={(eventInput) => setDraft((current) => ({ ...current, [prefKey(event, channel)]: { ...preference, quietTo: eventInput.target.value || undefined } }))}
                                placeholder={t("Quiet to")}
                                value={preference.quietTo ?? ""}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}
        </CardContent>
      </Card>
      <div className="space-y-4">
        <Card className="rounded-2xl border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]">
          <CardHeader><CardTitle><T>Delivery Summary</T></CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Stat label="Active routes" value={`${enabledCount}/${merged.length}`} />
            <Stat label="Quiet-hour rules" value={String(quietCount)} />
            <Stat label="Supported channels" value={String(channels.length)} />
            <Stat label="Events covered" value={String(events.length)} />
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]">
          <CardHeader><CardTitle><T>Quick Actions</T></CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Button asChild className="w-full" variant="outline"><Link href="/user/notifications"><Bell className="size-4" /><T>View notifications</T></Link></Button>
            <Button asChild className="w-full" variant="outline"><Link href="/user/support/tickets/open"><MessageCircle className="size-4" /><T>Ask support</T></Link></Button>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

export function CustomerLiveChatPanel({ selectedConversationId }: { selectedConversationId?: string | null }) {
  const { dir } = useI18n();
  const { user } = useAuth();
  const t = useDashboardT();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [replyText, setReplyText] = useState("");
  const [replyAttachments, setReplyAttachments] = useState<UploadApiResult[]>([]);
  const [readConversationId, setReadConversationId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<LiveChatStatus | "ALL">("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [connected, setConnected] = useState(false);
  const [typing, setTyping] = useState<LiveChatTypingEvent | null>(null);
  const socketRef = useRef<ReturnType<typeof createLiveChatSocket> | null>(null);
  const joinedRef = useRef(false);
  const queryClient = useQueryClient();
  const router = useRouter();
  const listQueryKey = useMemo(() => ["customer-live-chats", user?.id] as const, [user?.id]);
  const detailQueryKey = useMemo(() => ["customer-live-chat", user?.id, selectedConversationId] as const, [selectedConversationId, user?.id]);
  const chats = useQuery({
    enabled: Boolean(user?.id),
    queryFn: () => getMyLiveChats({ dateFrom: dateFrom || undefined, dateTo: dateTo || undefined, page, pageSize: 10, search, sortOrder: "desc", status: status === "ALL" ? undefined : status }) as Promise<LiveChatPage>,
    queryKey: [...listQueryKey, "history", page, search, status, dateFrom, dateTo],
    retry: 1,
  });
  const recentChats = useQuery({
    enabled: Boolean(user?.id),
    queryFn: () => getMyLiveChats({ page: 1, pageSize: 5, sortOrder: "desc" }) as Promise<LiveChatPage>,
    queryKey: [...listQueryKey, "recent"],
    retry: 1,
  });
  const selectedChat = useQuery({
    enabled: Boolean(user?.id && selectedConversationId),
    queryFn: () => getMyLiveChat(selectedConversationId as string) as Promise<AdminLiveChatDetail>,
    queryKey: detailQueryKey,
    refetchInterval: 4_000,
    retry: 1,
  });
  const read = useMutation({
    mutationFn: async (id: string) => {
      if (socketRef.current?.connected && joinedRef.current) {
        markLiveChatSocketRead(socketRef.current, { conversationId: id, role: "CUSTOMER" });
        return { read: 0 };
      }
      return markLiveChatRead(id);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: listQueryKey });
      if (selectedConversationId) void queryClient.invalidateQueries({ queryKey: detailQueryKey });
    },
  });
  const start = useMutation({
    mutationFn: () => startLiveChat({ message, subject }) as Promise<AdminLiveChatDetail>,
    onError: (error) => toast.error(error instanceof Error ? error.message : t("Live chat could not start")),
    onSuccess: (conversation) => {
      toast.success(t("Live chat started."));
      setSubject("");
      setMessage("");
      void queryClient.invalidateQueries({ queryKey: listQueryKey });
      if (conversation?.id) router.push(`/user/support/live-chat/${conversation.id}` as never);
    },
  });
  const reply = useMutation({
    mutationFn: async ({ id, text }: { id: string; text: string }) => {
      const payload = {
        attachments: replyAttachments.map((attachment) => ({
          fileName: attachment.originalName || attachment.fileName,
          mimeType: attachment.mimeType,
          sizeBytes: Number(attachment.sizeBytes),
          uploadId: attachment.id,
        })),
        body: text,
      };
      return sendLiveChatMessage(id, payload);
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t("Message failed")),
    onSuccess: () => {
      toast.success(t("Message sent."));
      setReplyText("");
      setReplyAttachments([]);
      void queryClient.invalidateQueries({ queryKey: listQueryKey });
      if (selectedConversationId) void queryClient.invalidateQueries({ queryKey: detailQueryKey });
    },
  });
  const close = useMutation({
    mutationFn: async (id: string) => {
      return closeMyLiveChat(id, "Closed by customer");
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t("Conversation could not close")),
    onSuccess: () => {
      toast.success(t("Conversation closed."));
      void queryClient.invalidateQueries({ queryKey: listQueryKey });
      if (selectedConversationId) void queryClient.invalidateQueries({ queryKey: detailQueryKey });
    },
  });
  const items = chats.data?.items ?? [];
  const recentItems = recentChats.data?.items ?? [];
  const total = chats.data?.total ?? items.length;
  const totalPages = Math.max(1, chats.data?.totalPages ?? 1);
  const selected = selectedChat.data;

  useEffect(() => {
    if (selected?.id && selected.id === selectedConversationId && selected.id !== readConversationId && !read.isPending) {
      setReadConversationId(selected.id);
      read.mutate(selected.id);
    }
  }, [read, readConversationId, selected?.id, selectedConversationId]);

  useEffect(() => {
    if (!selectedConversationId) return;
    const socket = createLiveChatSocket();
    socketRef.current = socket;
    joinedRef.current = false;

    const patchConversation = (updater: (current: AdminLiveChatDetail) => AdminLiveChatDetail) => {
      queryClient.setQueryData<AdminLiveChatDetail>(detailQueryKey, (current) => (current ? updater(current) : current));
    };

    socket.on("connect", () => {
      joinedRef.current = false;
      setConnected(false);
      joinLiveChatConversation(socket, { conversationId: selectedConversationId, role: "CUSTOMER" });
      joinedRef.current = true;
      setConnected(true);
      markLiveChatSocketRead(socket, { conversationId: selectedConversationId, role: "CUSTOMER" });
    });
    socket.on("disconnect", () => {
      joinedRef.current = false;
      setConnected(false);
    });
    socket.on("connect_error", () => {
      joinedRef.current = false;
      setConnected(false);
    });
    socket.on("message:new", (event: LiveChatMessageEvent) => {
      if (event.conversationId !== selectedConversationId) return;
      patchConversation((current) => mergeLiveChatMessage(current, event.message));
      void queryClient.invalidateQueries({ queryKey: listQueryKey });
      if (event.message.role !== "CUSTOMER") markLiveChatSocketRead(socket, { conversationId: selectedConversationId, role: "CUSTOMER" });
    });
    socket.on("presence", (event: LiveChatPresenceEvent) => {
      if (event.conversationId !== selectedConversationId) return;
      const now = new Date().toISOString();
      patchConversation((current) => ({
        ...current,
        participants: current.participants.map((participant) =>
          participant.userId === event.userId && participant.role === event.role ? { ...participant, isOnline: event.online, lastSeenAt: now, leftAt: event.online ? null : now } : participant,
        ),
      }));
    });
    socket.on("typing", (event: LiveChatTypingEvent) => {
      if (event.conversationId !== selectedConversationId || event.role === "CUSTOMER") return;
      setTyping(event.isTyping ? event : null);
    });
    socket.on("messages:read", (event: LiveChatReadEvent) => {
      if (event.conversationId === selectedConversationId) void queryClient.invalidateQueries({ queryKey: detailQueryKey });
    });
    socket.on("conversation:closed", (event: LiveChatConversationEvent) => {
      if (event.conversationId !== selectedConversationId) return;
      patchConversation((current) => ({ ...current, ...event.conversation, status: "CLOSED" }));
      void queryClient.invalidateQueries({ queryKey: listQueryKey });
    });
    socket.on("conversation:assigned", (event: LiveChatConversationEvent) => {
      if (event.conversationId === selectedConversationId) void queryClient.invalidateQueries({ queryKey: detailQueryKey });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      joinedRef.current = false;
      setConnected(false);
      setTyping(null);
    };
  }, [detailQueryKey, listQueryKey, queryClient, selectedConversationId, t]);

  useEffect(() => {
    if (!socketRef.current?.connected || !joinedRef.current || !selectedConversationId || selected?.status === "CLOSED") return;
    sendLiveChatTyping(socketRef.current, { conversationId: selectedConversationId, isTyping: Boolean(replyText.trim()), role: "CUSTOMER" });
    const timeout = window.setTimeout(() => {
      if (socketRef.current?.connected && joinedRef.current) sendLiveChatTyping(socketRef.current, { conversationId: selectedConversationId, isTyping: false, role: "CUSTOMER" });
    }, 1200);
    return () => window.clearTimeout(timeout);
  }, [replyText, selected?.status, selectedConversationId]);

  return (
    <section className="grid min-w-0 gap-4 xl:grid-cols-[minmax(280px,320px)_minmax(0,1fr)]">
      <aside className={cn("min-w-0 space-y-4", selectedConversationId ? "order-2 xl:order-1" : "order-1")}>
        <Card className="rounded-2xl border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]">
          <CardHeader><CardTitle className="flex items-center gap-2"><Plus className="size-5 text-primary" /><T>Start Conversation</T></CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Input onChange={(event) => setSubject(event.target.value)} placeholder={t("Subject")} value={subject} />
            <Textarea className="min-h-36 resize-none" onChange={(event) => setMessage(event.target.value)} placeholder={t("How can support help?")} value={message} />
            <Button className="w-full" disabled={start.isPending || !message.trim()} onClick={() => start.mutate()}>
              {start.isPending ? <Loader2 className="size-4 animate-spin" /> : <MessageCircle className="size-4" />}
              {t("Start chat")}
            </Button>
          </CardContent>
        </Card>

        {selected ? (
          <Card className="rounded-2xl border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]">
            <CardHeader><CardTitle><T>Conversation Details</T></CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Stat label="Status" value={selected.status} />
              <Stat label="Subject" value={selected.subject ?? t("Support conversation")} />
              <Stat label="Agent" value={displayLiveChatUser(selected.assignedAgent, t("Not assigned"))} />
              <Stat label="Messages" value={String(selected.messages.length)} />
              <Stat label="Created" value={formatDate(selected.createdAt)} />
              <Stat label="Last message" value={selected.lastMessageAt ? formatDate(selected.lastMessageAt) : "No activity"} />
            </CardContent>
          </Card>
        ) : null}

        <Card className="rounded-2xl border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]">
          <CardHeader><CardTitle><T>Recent Conversations</T></CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {recentChats.isLoading ? <PanelSkeleton /> : null}
            {!recentChats.isLoading && recentItems.length ? recentItems.map((chat) => <LiveChatRecentRow chat={chat} key={chat.id} selected={chat.id === selectedConversationId} />) : null}
            {!recentChats.isLoading && !recentItems.length ? <EmptyBox label="No recent live chats." /> : null}
          </CardContent>
        </Card>
      </aside>

      <Card className={cn("min-w-0 rounded-2xl border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]", selectedConversationId ? "order-1 xl:order-2" : "order-2")}>
        <CardHeader>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <CardTitle className="flex items-center gap-2"><MessageCircle className="size-5 text-primary" /><T>Live Chat</T></CardTitle>
            {!selectedConversationId ? (
              <div className="grid min-w-0 gap-2 sm:grid-cols-2">
                <div className="relative sm:col-span-2">
                  <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input className="ps-9" onChange={(event) => { setPage(1); setSearch(event.target.value); }} placeholder={t("Search by subject or chat number")} value={search} />
                </div>
                <Select dir={dir} onValueChange={(value) => { setPage(1); setStatus(value as LiveChatStatus | "ALL"); }} value={status}>
                  <SelectTrigger><Filter className="size-4" /><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL"><T>All status</T></SelectItem>
                    <SelectItem value="REQUESTED"><T>Requested</T></SelectItem>
                    <SelectItem value="ACTIVE"><T>Active</T></SelectItem>
                    <SelectItem value="WAITING"><T>Waiting</T></SelectItem>
                    <SelectItem value="CLOSED"><T>Closed</T></SelectItem>
                    <SelectItem value="MISSED"><T>Missed</T></SelectItem>
                  </SelectContent>
                </Select>
                <label className="space-y-1 text-xs text-muted-foreground"><span>{t("Date from")}</span><Input aria-label={t("Date from")} onChange={(event) => { setPage(1); setDateFrom(event.target.value); }} type="date" value={dateFrom} /></label>
                <label className="space-y-1 text-xs text-muted-foreground"><span>{t("Date to")}</span><Input aria-label={t("Date to")} onChange={(event) => { setPage(1); setDateTo(event.target.value); }} type="date" value={dateTo} /></label>
              </div>
            ) : (
              <Button asChild variant="outline">
                <Link href="/user/support/live-chat">
                  <Archive className="size-4" />
                  {t("All conversations")}
                </Link>
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {selectedConversationId ? (
            <>
              {selectedChat.isLoading ? <PanelSkeleton /> : null}
              {selectedChat.isError ? <ErrorBox message={selectedChat.error.message} title="Conversation unavailable" /> : null}
              {!selectedChat.isLoading && !selectedChat.isError && selected ? (
                <LiveChatConversationView
                  closePending={close.isPending}
                  connected={connected}
                  conversation={selected}
                  attachments={replyAttachments}
                  onClose={(id) => close.mutate(id)}
                  onRemoveAttachment={(id) => setReplyAttachments((current) => current.filter((item) => item.id !== id))}
                  onReply={(id, text) => reply.mutate({ id, text })}
                  onUploaded={(upload) => setReplyAttachments((current) => [upload, ...current])}
                  pending={reply.isPending}
                  reply={replyText}
                  setReply={setReplyText}
                  typing={typing}
                />
              ) : null}
            </>
          ) : (
            <>
              {chats.isLoading ? <PanelSkeleton /> : null}
              {chats.isError ? <ErrorBox message={chats.error.message} title="Live chat unavailable" /> : null}
              {!chats.isLoading && !chats.isError && items.length ? <div className="space-y-3">{items.map((chat) => <LiveChatListRow chat={chat} key={chat.id} />)}</div> : null}
              {!chats.isLoading && !chats.isError && !items.length ? <EmptyBox label="No live chat conversations yet." /> : null}
              {!chats.isLoading && !chats.isError ? (
                <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-muted-foreground">{t("Showing")} {items.length} {t("of")} {total} {t("records")} · {t("Page")} {page} {t("of")} {totalPages}</p>
                  <div className="flex gap-2">
                    <Button disabled={page <= 1 || chats.isFetching} onClick={() => setPage((current) => Math.max(1, current - 1))} size="sm" variant="outline">{t("Previous")}</Button>
                    <Button disabled={page >= totalPages || chats.isFetching} onClick={() => setPage((current) => current + 1)} size="sm" variant="outline">{t("Next")}</Button>
                  </div>
                </div>
              ) : null}
            </>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

function LiveChatListRow({ chat }: { chat: LiveChatListItem }) {
  const t = useDashboardT();
  return (
    <div className="grid gap-3 rounded-2xl border border-border bg-background/35 p-4 md:grid-cols-[1fr_auto] md:items-center">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Link className="font-semibold hover:text-primary" href={`/user/support/live-chat/${chat.id}` as never}>{chat.conversationNo}</Link>
          <Badge variant="outline">{t(chat.status)}</Badge>
          <Badge variant="secondary">{chat._count?.messages ?? 0} {t("messages")}</Badge>
        </div>
        <p className="mt-2 line-clamp-2 text-sm font-medium">{chat.subject ?? t("Support conversation")}</p>
        <p className="mt-1 text-xs text-muted-foreground">{t("Created")} {formatDate(chat.createdAt)} · {t("Updated")} {formatDate(chat.updatedAt)} · {t("Agent")} {displayLiveChatUser(chat.assignedAgent, t("Not assigned"))} · {chat._count?.attachments ?? 0} {t("files")}</p>
      </div>
      <Button asChild variant="outline">
        <Link href={`/user/support/live-chat/${chat.id}` as never}>
          <Eye className="size-4" />
          {t("Open chat")}
        </Link>
      </Button>
    </div>
  );
}

function LiveChatRecentRow({ chat, selected }: { chat: LiveChatListItem; selected: boolean }) {
  const t = useDashboardT();
  return (
    <Link className={cn("block rounded-xl border p-3 transition hover:border-primary/60 hover:bg-primary/5", selected ? "border-primary bg-primary/10" : "border-border bg-background/35")} href={`/user/support/live-chat/${chat.id}` as never}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{chat.conversationNo}</p>
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{chat.subject ?? t("Support conversation")}</p>
        </div>
        <Badge variant="outline">{t(chat.status)}</Badge>
      </div>
    </Link>
  );
}

function LiveChatConversationView({
  attachments,
  closePending,
  connected,
  conversation,
  onClose,
  onRemoveAttachment,
  onReply,
  onUploaded,
  pending,
  reply,
  setReply,
  typing,
}: {
  attachments: UploadApiResult[];
  closePending: boolean;
  connected: boolean;
  conversation: AdminLiveChatDetail;
  onClose: (id: string) => void;
  onRemoveAttachment: (id: string) => void;
  onReply: (id: string, text: string) => void;
  onUploaded: (upload: UploadApiResult) => void;
  pending: boolean;
  reply: string;
  setReply: (value: string) => void;
  typing: LiveChatTypingEvent | null;
}) {
  const { user } = useAuth();
  const t = useDashboardT();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const closed = conversation.status === "CLOSED";
  const uploadAttachments = async (files: FileList | null) => {
    const selected = Array.from(files ?? []);
    if (!selected.length) return;
    setUploadingAttachment(true);
    try {
      const uploads = await Promise.all(
        selected.slice(0, 4).map((file) => uploadFile({ entityId: conversation.id, entityType: "live-chat", file, visibility: "PRIVATE" })),
      );
      uploads.forEach(onUploaded);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("Attachment upload failed"));
    } finally {
      setUploadingAttachment(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };
  return (
    <div className="flex min-h-[560px] min-w-0 flex-col overflow-hidden rounded-2xl border border-border sm:min-h-[680px]">
      <div className="border-b border-border bg-background/40 p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="break-all text-xl font-black">{conversation.conversationNo}</p>
              <Badge variant="outline">{t(conversation.status)}</Badge>
              <Badge variant="outline">{connected ? t("Live") : t("Offline")}</Badge>
            </div>
            <p className="mt-2 text-sm font-medium">{conversation.subject ?? t("Support conversation")}</p>
            <p className="mt-1 text-xs text-muted-foreground">{t("Started")} {formatDate(conversation.startedAt)} · {t("Agent")} {displayLiveChatUser(conversation.assignedAgent, t("Not assigned"))}</p>
          </div>
          <Button disabled={closePending || closed} onClick={() => onClose(conversation.id)} variant="outline">
            {closePending ? <Loader2 className="size-4 animate-spin" /> : <Archive className="size-4" />}
            <T>Close chat</T>
          </Button>
        </div>
      </div>

      <div className="min-w-0 flex-1 space-y-4 bg-background/20 p-4 sm:p-5">
        {conversation.messages.length ? conversation.messages.map((message) => {
          const mine = message.role === "CUSTOMER" || message.sender?.id === user?.id;
          return (
            <div className={mine ? "flex justify-end" : "flex justify-start"} key={message.id}>
              <div className={cn("min-w-0 max-w-[92%] rounded-2xl border p-4 shadow-[0_18px_50px_-42px_var(--glow)] sm:max-w-[84%]", mine ? "border-primary/30 bg-primary text-primary-foreground" : "border-border bg-card/80")}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-semibold">{mine ? t("You") : displayLiveChatUser(message.sender, message.role)}</p>
                  <span className={cn("text-xs", mine ? "text-primary-foreground/75" : "text-muted-foreground")}>{formatDate(message.createdAt)}</span>
                </div>
                {message.body ? <p className={cn("mt-2 whitespace-pre-wrap break-words text-sm leading-7 [overflow-wrap:anywhere]", mine ? "text-primary-foreground/90" : "text-muted-foreground")}>{message.body}</p> : null}
                {message.attachments.length ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {message.attachments.map((attachment) => (
                      <Button className="max-w-full" key={attachment.id} onClick={() => openLiveChatAttachment(conversation.id, attachment.id, false)} size="sm" type="button" variant={mine ? "secondary" : "outline"}>
                        <Download className="size-4" />
                        <span className="truncate">{attachment.fileName}</span>
                      </Button>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          );
        }) : <EmptyBox label="No messages have been posted yet." />}
        {typing?.isTyping ? <p className="text-xs text-muted-foreground">{t("Support is typing...")}</p> : null}
      </div>

      <div className="border-t border-border bg-card/60 p-4">
        {closed ? (
          <div className="mb-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-200">
            <T>This conversation has been closed by support. You can review the history, but replies are disabled.</T>
          </div>
        ) : null}
        <Textarea className="min-h-24 resize-none" disabled={closed} onChange={(event) => setReply(event.target.value)} placeholder={closed ? t("This conversation is closed") : t("Write your reply")} value={reply} />
        {attachments.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {attachments.map((attachment) => (
              <Badge className="gap-2" key={attachment.id} variant="secondary">
                <Paperclip className="size-3" />
                {attachment.originalName || attachment.fileName}
                <button aria-label={`Remove ${attachment.originalName || attachment.fileName}`} onClick={() => onRemoveAttachment(attachment.id)} type="button">
                  <X className="size-3" />
                </button>
              </Badge>
            ))}
          </div>
        ) : null}
        <div className="mt-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <p className="text-xs text-muted-foreground">{closed ? t("Closed conversations remain available in history.") : t("Messages are delivered to assigned support agents and saved in this conversation.")}</p>
          <div className="flex items-center gap-2">
            <input className="hidden" multiple onChange={(event) => uploadAttachments(event.target.files)} ref={fileInputRef} type="file" />
            <Button disabled={closed || pending || uploadingAttachment} onClick={() => fileInputRef.current?.click()} size="icon" type="button" variant="outline" aria-label={t("Attach file")}>
              {uploadingAttachment ? <Loader2 className="size-4 animate-spin" /> : <Paperclip className="size-4" />}
            </Button>
            <Button disabled={closed || pending || uploadingAttachment || (!reply.trim() && !attachments.length)} onClick={() => onReply(conversation.id, reply)}>
              {pending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              <T>Send reply</T>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Pagination({ page, setPage, totalPages }: { page: number; setPage: (value: number | ((current: number) => number)) => void; totalPages: number }) {
  return <div className="mt-4 flex justify-end gap-2 border-t border-border pt-4"><Button disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))} size="sm" variant="outline"><T>Previous</T></Button><Button disabled={page >= totalPages} onClick={() => setPage((current) => current + 1)} size="sm" variant="outline"><T>Next</T></Button></div>;
}

function ReferralInsightGrid({ items }: { items: Array<[string, string]> }) {
  return <div className="grid gap-3 md:grid-cols-2">{items.map(([label, value]) => <Stat key={label} label={label} value={value} />)}</div>;
}

function ReferralMetric({ label, meta, value }: { label: string; meta: string; value: string }) {
  const t = useDashboardT();
  return <Card className="rounded-2xl border-border bg-card/70"><CardContent className="p-5"><p className="text-xs text-muted-foreground">{t(label)}</p><strong className="mt-2 block text-xl font-black">{value}</strong><p className="mt-2 text-xs text-muted-foreground">{t(meta)}</p></CardContent></Card>;
}

function ReferralPerformance({ performance }: { performance: ReferralDashboard["performance"] }) {
  const t = useDashboardT();
  const maximum = Math.max(1, ...performance.map((item) => item.clicks));
  if (!performance.length) return <EmptyBox label="No referral performance recorded yet." />;
  return <div className="grid min-h-52 grid-cols-6 items-end gap-2">{performance.map((item) => <div className="flex h-full flex-col justify-end gap-2" key={item.month}><div className="text-center text-[10px] text-muted-foreground"><span className="block font-semibold text-foreground">{item.conversions}</span>پاداش / تبدیل</div><div className="mx-auto w-full max-w-14 rounded-t-xl bg-gradient-to-t from-primary to-primary/35" style={{ height: `${Math.max(10, (item.clicks / maximum) * 120)}px` }} title={`${item.clicks} clicks`} /><div className="text-center"><p className="text-xs font-semibold">{item.month.slice(5)}</p><p className="text-[10px] text-muted-foreground">{item.clicks} {t("کلیک")}</p></div></div>)}</div>;
}

function ReferralUsersTable({ bare = false, items, loading, t }: { bare?: boolean; items: ReferredUserItem[]; loading: boolean; t: (text: string) => string }) {
  const content = loading ? <PanelSkeleton /> : items.length ? <Table><TableHeader><TableRow><TableHead>{t("کاربر")}</TableHead><TableHead>{t("تاریخ عضویت")}</TableHead><TableHead>وضعیت احراز</TableHead><TableHead>{t("وضعیت پاداش")}</TableHead><TableHead>{t("پاداش شما")}</TableHead><TableHead>{t("هدیه کاربر")}</TableHead></TableRow></TableHeader><TableBody>{items.map((item) => <TableRow key={item.id}><TableCell><p className="font-semibold">{item.displayName}</p><p className="mt-1 text-xs text-muted-foreground" dir="ltr">{item.mobile ?? item.email ?? "—"}</p></TableCell><TableCell>{formatDate(item.joinedAt)}</TableCell><TableCell><Badge variant={item.kycStatus === "APPROVED" ? "default" : "outline"}>{t(item.kycStatus)}</Badge></TableCell><TableCell><Badge variant={item.status === "REWARDED" ? "default" : "outline"}>{item.status === "REWARDED" ? "واریز شد" : "در انتظار واریز"}</Badge></TableCell><TableCell>{formatReferralMoney(item.commissionAmount, "TOMAN")}</TableCell><TableCell>{formatReferralMoney(item.customerRewardAmount, "TOMAN")}</TableCell></TableRow>)}</TableBody></Table> : <EmptyBox label="هنوز کاربری با کد شما ثبت‌نام نکرده است." />;
  if (bare) return content;
  return <Card className="rounded-2xl border-border bg-card/70"><CardHeader className="flex flex-row items-center justify-between"><CardTitle>{t("آخرین کاربران معرفی‌شده")}</CardTitle><Button asChild size="sm" variant="outline"><Link href="/user/referrals/referred-users">{t("مشاهده همه")}</Link></Button></CardHeader><CardContent>{content}</CardContent></Card>;
}

function ReferralCommissionsTable({ bare = false, items, loading, t }: { bare?: boolean; items: ReferralCommissionItem[]; loading: boolean; t: (text: string) => string }) {
  const content = loading ? <PanelSkeleton /> : items.length ? <Table><TableHeader><TableRow><TableHead>{t("مبلغ")}</TableHead><TableHead>{t("نوع محاسبه")}</TableHead><TableHead>{t("کاربر معرفی‌شده")}</TableHead><TableHead>{t("وضعیت")}</TableHead><TableHead>{t("زمان ثبت")}</TableHead><TableHead>{t("زمان آزادسازی")}</TableHead></TableRow></TableHeader><TableBody>{items.map((item) => { const profile = item.conversion?.customer?.profile; const customer = [profile?.firstName, profile?.lastName].filter(Boolean).join(" ") || t("کاربر نقره"); return <TableRow key={item.id}><TableCell className="font-bold">{formatReferralMoney(item.amount, item.currency)}</TableCell><TableCell>{item.commissionType === "PERCENTAGE" ? `${item.rate ?? "—"}٪` : t("مبلغ ثابت")}</TableCell><TableCell>{customer}</TableCell><TableCell><Badge variant="outline">{t(item.status)}</Badge></TableCell><TableCell>{formatDate(item.createdAt)}</TableCell><TableCell>{item.payableAt ? formatDate(item.payableAt) : "—"}</TableCell></TableRow>; })}</TableBody></Table> : <EmptyBox label="هنوز پاداشی ثبت نشده است." />;
  if (bare) return content;
  return <Card className="rounded-2xl border-border bg-card/70"><CardHeader className="flex flex-row items-center justify-between"><CardTitle>{t("آخرین پاداش‌ها")}</CardTitle><Button asChild size="sm" variant="outline"><Link href="/user/referrals/commissions">{t("گزارش کامل")}</Link></Button></CardHeader><CardContent>{content}</CardContent></Card>;
}

function RowLine({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between gap-4 border-b border-border/60 pb-2 last:border-0 last:pb-0"><span className="text-muted-foreground">{label}</span><strong>{value}</strong></div>;
}

function formatReferralMoney(value: string | number, currency: string) {
  if (isTomanCurrency(currency)) return formatTomanMoney(value, currency);
  const amount = Number(value ?? 0);
  const formatted = new Intl.NumberFormat("fa-IR", { maximumFractionDigits: 2 }).format(Number.isFinite(amount) ? amount : 0);
  const label = currency === "USD" ? "دلار" : currency === "SILVER_GRAM" ? "گرم نقره" : currency;
  return `${formatted} ${label}`;
}

function TicketListRow({ ticket }: { ticket: TicketPage["items"][number] }) {
  const t = useDashboardT();
  return (
    <div className="grid gap-3 rounded-2xl border border-border bg-background/35 p-4 md:grid-cols-[1fr_auto] md:items-center">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Link className="font-semibold hover:text-primary" href={`/user/support/tickets/${ticket.id}` as never}>{ticket.ticketNumber}</Link>
          <Badge variant="outline">{t(ticket.status)}</Badge>
          <Badge variant="secondary">{t(ticket.priority)}</Badge>
        </div>
        <p className="mt-2 line-clamp-2 text-sm font-medium">{ticket.subject}</p>
        <p className="mt-1 text-xs text-muted-foreground">{t("Updated")} {formatDate(ticket.updatedAt)} · {t("Created")} {formatDate(ticket.createdAt)}</p>
      </div>
      <Button asChild variant="outline">
        <Link href={`/user/support/tickets/${ticket.id}` as never}>
          <Eye className="size-4" />
          {t("View conversation")}
        </Link>
      </Button>
    </div>
  );
}

function TicketListTable({ tickets }: { tickets: TicketPage["items"] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead><T>Ticket</T></TableHead>
          <TableHead><T>Status</T></TableHead>
          <TableHead><T>Priority</T></TableHead>
          <TableHead><T>Updated</T></TableHead>
          <TableHead className="text-start"><T>Actions</T></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tickets.map((ticket) => (
          <TableRow key={ticket.id}>
            <TableCell>
              <Link className="font-semibold hover:text-primary" href={`/user/support/tickets/${ticket.id}` as never}>{ticket.ticketNumber}</Link>
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{ticket.subject}</p>
            </TableCell>
            <TableCell>{ticketStatusBadge(ticket.status)}</TableCell>
            <TableCell>{ticketPriorityBadge(ticket.priority)}</TableCell>
            <TableCell className="text-xs text-muted-foreground">
              <p>{formatDate(ticket.updatedAt)}</p>
              <p>Created {formatDate(ticket.createdAt)}</p>
            </TableCell>
            <TableCell className="text-start">
              <Button asChild size="sm" variant="outline">
                <Link href={`/user/support/tickets/${ticket.id}` as never}>
                  <Eye className="size-4" />
                  View
                </Link>
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function RecentTicketsCard({ loading, tickets }: { loading: boolean; tickets: TicketPage["items"] }) {
  return (
    <Card className="rounded-2xl border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]">
      <CardHeader><CardTitle><T>Recent Tickets</T></CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {loading ? <PanelSkeleton /> : null}
        {!loading && tickets.length ? tickets.map((ticket) => (
          <Link
            className="block rounded-xl border border-border bg-background/35 p-3 transition hover:border-primary/50 hover:bg-primary/5"
            href={`/user/support/tickets/${ticket.id}` as never}
            key={ticket.id}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-sm font-semibold">{ticket.ticketNumber}</span>
              {ticketStatusBadge(ticket.status)}
            </div>
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{ticket.subject}</p>
          </Link>
        )) : null}
        {!loading && !tickets.length ? <EmptyBox label="No recent tickets." /> : null}
      </CardContent>
    </Card>
  );
}

function TicketSummaryCard({ ticket }: { ticket: AdminTicketDetail }) {
  return (
    <Card className="rounded-2xl border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]">
      <CardHeader><CardTitle><T>Ticket Details</T></CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">{ticketStatusBadge(ticket.status)}{ticketPriorityBadge(ticket.priority)}</div>
        <Stat label="Department" value={ticket.department?.name ?? "Support"} />
        <Stat label="Messages" value={String(ticket.messages.length)} />
        <Stat label="Related order" value={ticket.relatedOrder?.orderNumber ?? "None"} />
        <Stat label="Related invoice" value={ticket.relatedInvoice?.invoiceNumber ?? "None"} />
      </CardContent>
    </Card>
  );
}

function TicketDetailView({
  attachments,
  onAttachmentsChange,
  onReply,
  onStatus,
  onUploadingAttachmentsChange,
  pending,
  statusPending,
  ticket,
  uploadingAttachments,
}: {
  attachments: UploadApiResult[];
  onAttachmentsChange: (attachments: UploadApiResult[]) => void;
  onReply: (id: string, text: string) => void;
  onStatus: (id: string, nextStatus: "CLOSED" | "OPEN" | "RESOLVED") => void;
  onUploadingAttachmentsChange: (uploading: boolean) => void;
  pending: boolean;
  statusPending: boolean;
  ticket: AdminTicketDetail;
  uploadingAttachments: boolean;
}) {
  const { user } = useAuth();
  const t = useDashboardT();
  const [body, setBody] = useState("");
  const closed = ticket.status === "CLOSED";
  const resolved = ticket.status === "RESOLVED";
  const canReply = !closed;
  const downloadAttachment = async (attachmentId: string) => {
    try {
      const signed = await getMyTicketAttachmentSignedUrl(ticket.id, attachmentId);
      window.open(resolveApiUrl(signed.url), "_blank", "noopener,noreferrer");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("Attachment download failed"));
    }
  };
  return (
    <div className="flex min-h-[640px] flex-col">
      <div className="border-b border-border p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xl font-black">{ticket.ticketNumber} · {ticket.subject}</p>
            <p className="mt-1 text-xs text-muted-foreground">{t(ticket.priority)} · {t("created")} {formatDate(ticket.createdAt)} · {t("updated")} {formatDate(ticket.updatedAt)}</p>
          </div>
          {ticketStatusBadge(ticket.status)}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button disabled={statusPending || resolved || closed} onClick={() => onStatus(ticket.id, "RESOLVED")} size="sm" variant="outline">
            {statusPending ? <Loader2 className="size-4 animate-spin" /> : <PackageCheck className="size-4" />}
            {t("Mark resolved")}
          </Button>
          <Button disabled={statusPending || closed} onClick={() => onStatus(ticket.id, "CLOSED")} size="sm" variant="outline">
            {statusPending ? <Loader2 className="size-4 animate-spin" /> : <Archive className="size-4" />}
            {t("Close ticket")}
          </Button>
          <Button disabled={statusPending || (!closed && !resolved)} onClick={() => onStatus(ticket.id, "OPEN")} size="sm" variant="outline">
            {statusPending ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
            {t("Reopen")}
          </Button>
          {ticket.relatedOrder ? <Button asChild size="sm" variant="outline"><Link href={`/user/orders/${ticket.relatedOrder.id}` as never}><ReceiptText className="size-4" /><T>Order</T></Link></Button> : null}
          {ticket.relatedInvoice ? <Button asChild size="sm" variant="outline"><Link href={`/user/invoices/${ticket.relatedInvoice.id}` as never}><FileText className="size-4" /><T>Invoice</T></Link></Button> : null}
        </div>
      </div>
      <div className="flex-1 space-y-4 bg-background/20 p-5">
        {ticket.messages.length ? ticket.messages.map((message) => {
          const mine = message.author?.id === user?.id;
          return (
            <div className={mine ? "flex justify-end" : "flex justify-start"} key={message.id}>
              <div className={cn(
                "max-w-[82%] rounded-2xl border p-4 shadow-[0_18px_50px_-42px_var(--glow)]",
                mine ? "border-primary/30 bg-primary text-primary-foreground" : "border-border bg-card/80",
              )}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-semibold">{mine ? t("You") : displaySupportAuthor(message.author)}</p>
                  <span className={cn("text-xs", mine ? "text-primary-foreground/75" : "text-muted-foreground")}>{formatDate(message.createdAt)}</span>
                </div>
                <p className={cn("mt-2 whitespace-pre-wrap text-sm leading-7", mine ? "text-primary-foreground/90" : "text-muted-foreground")}>{message.body}</p>
                {message.attachments.length ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {message.attachments.map((attachment) => (
                      <Button key={attachment.id} onClick={() => downloadAttachment(attachment.id)} size="sm" type="button" variant={mine ? "secondary" : "outline"}>
                        <Download className="size-4" />
                        {attachment.fileName}
                      </Button>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          );
        }) : <EmptyBox label="No public ticket messages yet." />}
      </div>
      <div className="border-t border-border bg-card/60 p-4">
        <Textarea className="min-h-28 resize-none" disabled={!canReply} onChange={(event) => setBody(event.target.value)} placeholder={closed ? t("This ticket is closed. Reopen it to reply.") : t("Write a detailed reply")} value={body} />
        <div className="mt-3"><TicketAttachmentField disabled={!canReply || pending} entityId={ticket.id} onChange={onAttachmentsChange} onUploadingChange={onUploadingAttachmentsChange} value={attachments} /></div>
        <div className="mt-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <p className="text-xs text-muted-foreground">{closed ? t("Closed tickets remain available in your history.") : t("Replies are saved to the ticket timeline and visible to support staff.")}</p>
          <Button disabled={!canReply || pending || uploadingAttachments || (!body.trim() && !attachments.length)} onClick={() => { onReply(ticket.id, body); setBody(""); }}>
            {pending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            {t("Send reply")}
          </Button>
        </div>
      </div>
    </div>
  );
}

function ticketStatusBadge(status: TicketStatus) {
  return (
    <Badge
      className={cn(
        "border-transparent",
        status === "OPEN" && "bg-emerald-500/15 text-emerald-500",
        status === "PENDING" && "bg-amber-500/15 text-amber-500",
        status === "WAITING_ON_CUSTOMER" && "bg-sky-500/15 text-sky-500",
        status === "WAITING_ON_STAFF" && "bg-violet-500/15 text-violet-500",
        status === "RESOLVED" && "bg-teal-500/15 text-teal-500",
        status === "CLOSED" && "bg-muted text-muted-foreground",
      )}
    >
      <T>{status.replaceAll("_", " ")}</T>
    </Badge>
  );
}

function ticketPriorityBadge(priority: TicketPriority) {
  return (
    <Badge
      className={cn(
        "border-transparent",
        priority === "LOW" && "bg-muted text-muted-foreground",
        priority === "NORMAL" && "bg-secondary text-secondary-foreground",
        priority === "HIGH" && "bg-orange-500/15 text-orange-500",
        priority === "URGENT" && "bg-destructive/15 text-destructive",
      )}
    >
      <T>{priority}</T>
    </Badge>
  );
}

function SessionRow({ onRevoke, pending, session }: { onRevoke: () => void; pending: boolean; session: PlatformSession }) {
  const t = useDashboardT();
  const revoked = Boolean(session.revokedAt);
  const expired = new Date(session.expiresAt).getTime() <= Date.now();
  const status = revoked ? "REVOKED" : expired ? "EXPIRED" : "ACTIVE";
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-background/35 p-3 md:flex-row md:items-center md:justify-between">
      <div className="min-w-0">
        <p className="truncate font-semibold">{session.deviceName ?? friendlyUserAgent(session.userAgent)}</p>
        <p className="mt-1 text-xs text-muted-foreground" dir="ltr">
          {session.ipAddress ?? t("Unknown IP")} · {t("created")} {formatDate(session.createdAt)} · {session.lastUsedAt ? `${t("last used")} ${formatDate(session.lastUsedAt)}` : t("not used again")}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="outline">{t(status)}</Badge>
        <Button disabled={pending || revoked || expired} onClick={onRevoke} size="sm" variant="outline"><T>Revoke</T></Button>
      </div>
    </div>
  );
}

function ApiTokenRow({ item, onRevoke, pending }: { item: CustomerApiTokenItem; onRevoke: () => void; pending: boolean }) {
  const t = useDashboardT();
  const inactive = item.status !== "ACTIVE";
  return (
    <div className="rounded-xl border border-border bg-background/35 p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold">{item.name}</p>
            <Badge variant={item.status === "ACTIVE" ? "default" : "outline"}>{t(item.status)}</Badge>
          </div>
          <p className="mt-1 text-xs text-muted-foreground" dir="ltr">
            {t("last4")}:{item.last4} · {t("created")} {formatDate(item.createdAt)} · {item.lastUsedAt ? `${t("last used")} ${formatDate(item.lastUsedAt)}` : t("never used")}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {item.scopes.map((scope) => <Badge key={scope} variant="outline">{scope}</Badge>)}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => copyText(`sty_live_••••${item.last4}`, t("Token fingerprint copied."))} size="sm" variant="outline"><Copy className="size-4" /><T>Copy ID</T></Button>
          <Button disabled={pending || inactive} onClick={onRevoke} size="sm" variant="outline">{pending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}{t("Revoke")}</Button>
        </div>
      </div>
      <Separator className="my-3" />
      <div className="grid gap-3 md:grid-cols-3">
        <Stat label="Expires" value={item.expiresAt ? formatDate(item.expiresAt) : "Never"} />
        <Stat label="Revoked" value={item.revokedAt ? formatDate(item.revokedAt) : "No"} />
        <Stat label="Scope count" value={String(item.scopes.length)} />
      </div>
    </div>
  );
}

function AssetMetrics({ mode, rows }: { mode: "downloads" | "licenses" | "purchases"; rows: Array<CustomerPurchaseItem | CustomerDownloadItem | CustomerLicenseItem> }) {
  const totalFiles = rows.reduce((sum, row) => sum + ("product" in row && "files" in row.product ? row.product.files.length : 0), 0);
  const activeLicenses = rows.filter((row) => "status" in row && row.status === "ACTIVE").length;
  const deliveredOrders = rows.filter((row) => "order" in row && row.order.status === "COMPLETED").length;
  const labels = mode === "downloads"
    ? ["Products", "Files ready", "Secure access", "Delivery"]
    : mode === "licenses"
      ? ["Licenses", "Active", "Products", "Coverage"]
      : ["Purchases", "Completed", "Products", "Ownership"];
  const values = mode === "downloads"
    ? [String(rows.length), String(totalFiles), "Verified", "On demand"]
    : mode === "licenses"
      ? [String(rows.length), String(activeLicenses), String(new Set((rows as CustomerLicenseItem[]).map((row) => row.product.id)).size), "Protected"]
      : [String(rows.length), String(deliveredOrders), String(new Set((rows as CustomerPurchaseItem[]).map((row) => row.product.id)).size), "Account-bound"];
  return (
    <div className="grid gap-3 md:grid-cols-4">
      {labels.map((label, index) => <Stat key={label} label={label} value={values[index]} />)}
    </div>
  );
}

function PurchaseRow({ item }: { item: CustomerPurchaseItem }) {
  const t = useDashboardT();
  return (
    <div className="rounded-2xl border border-border bg-background/35 p-4">
      <div className="grid gap-4 lg:grid-cols-[1fr_220px_auto] lg:items-center">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Link className="text-base font-bold hover:text-primary" href={`/products/${item.product.slug}` as never}>{item.product.title}</Link>
            <Badge variant="outline">{t(item.order.status)}</Badge>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">{item.order.orderNumber} · {item.quantity} {item.quantity === 1 ? t("license") : t("licenses")} · {item.product.currentVersion ?? t("Version pending")}</p>
          <p className="mt-1 text-xs text-muted-foreground">{t(`Purchased ${formatDate(item.createdAt)} for ${item.total} ${item.currency}`)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card/70 p-3">
          <p className="text-xs text-muted-foreground">{t("License type")}</p>
          <p className="mt-1 font-semibold">{item.product.licenseType}</p>
        </div>
        <div className="flex flex-wrap gap-2 lg:justify-end">
          <Button asChild variant="outline"><Link href={`/user/orders/${item.order.id}` as never}><ReceiptText className="size-4" /><T>Order</T></Link></Button>
          <Button asChild variant="outline"><Link href={`/user/downloads` as never}><Download className="size-4" /><T>Files</T></Link></Button>
          <Button asChild variant="outline"><Link href={`/user/activity/reviews?product=${item.product.id}` as never}><Star className="size-4" /><T>Review</T></Link></Button>
          {item.product.documentationUrl ? <Button asChild variant="outline"><a href={item.product.documentationUrl}>{t("Docs")}</a></Button> : null}
        </div>
      </div>
    </div>
  );
}

function PurchaseUpdateRow({ item }: { item: CustomerPurchaseItem }) {
  const t = useDashboardT();
  return (
    <div className="rounded-2xl border border-border bg-background/35 p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Link className="text-base font-bold hover:text-primary" href={`/products/${item.product.slug}` as never}>{item.product.title}</Link>
            <Badge variant="outline">{item.product.currentVersion ?? t("Version pending")}</Badge>
          </div>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {t("Updates are tied to your completed purchase")} {item.order.orderNumber}. {t("Use downloads for private release files and docs for implementation notes.")}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{t("Purchased")} {formatDate(item.createdAt)} · {item.product.licenseType}</p>
        </div>
        <div className="flex flex-wrap gap-2 lg:justify-end">
          <Button asChild variant="outline"><Link href={"/user/downloads" as never}><Download className="size-4" /><T>Release files</T></Link></Button>
          {item.product.documentationUrl ? <Button asChild variant="outline"><a href={item.product.documentationUrl}>{t("Documentation")}</a></Button> : null}
          <Button asChild variant="outline"><Link href={"/user/support/tickets/open" as never}><MessageCircle className="size-4" /><T>Update support</T></Link></Button>
        </div>
      </div>
    </div>
  );
}

function DownloadRow({ item, onDownload, pendingFileId }: { item: CustomerDownloadItem; onDownload: (fileId: string, fileName: string) => void; pendingFileId?: string }) {
  const t = useDashboardT();
  return (
    <div className="rounded-2xl border border-border bg-background/35 p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <Link className="text-base font-bold hover:text-primary" href={`/products/${item.product.slug}` as never}>{item.product.title}</Link>
          <p className="mt-1 text-sm text-muted-foreground">{t("Access granted")} {formatDate(item.createdAt)} · {item.product.currentVersion ?? t("Version pending")}</p>
        </div>
        <Badge variant="outline">{item.product.files.length} {t("files")}</Badge>
      </div>
      <div className="mt-3 grid gap-2 md:grid-cols-2">
        {item.product.files.map((file) => (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background/45 px-3 py-2 text-sm" key={file.id}>
            <div className="min-w-0">
              <p className="truncate font-semibold">{file.fileName}</p>
              <p className="text-xs text-muted-foreground">{file.mimeType} · {formatBytes(file.sizeBytes)}</p>
            </div>
            <Button disabled={pendingFileId === file.id} onClick={() => onDownload(file.id, file.fileName)} size="sm">
              {pendingFileId === file.id ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
              {t("Download")}
            </Button>
          </div>
        ))}
      </div>
      {!item.product.files.length ? <p className="mt-3 text-sm text-muted-foreground"><T>No downloadable files are attached to this product yet.</T></p> : null}
    </div>
  );
}

function LicenseRow({ item }: { item: CustomerLicenseItem }) {
  const t = useDashboardT();
  return (
    <div className="rounded-2xl border border-border bg-background/35 p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <Link className="text-base font-bold hover:text-primary" href={`/products/${item.product.slug}` as never}>{item.product.title}</Link>
          <p className="mt-1 font-mono text-xs text-muted-foreground" dir="ltr">{item.licenseKey}</p>
        </div>
        <Badge variant="outline">{t(item.status)}</Badge>
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-3">
        <Stat label="License" value={item.product.licenseType} />
        <Stat label="Version" value={item.product.currentVersion ?? "Pending"} />
        <Stat label="Expires" value={item.expiresAt ? formatDate(item.expiresAt) : "Never"} />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button onClick={() => copyText(item.licenseKey, t("License key copied."))} variant="outline"><Copy className="size-4" /><T>Copy key</T></Button>
        {item.product.documentationUrl ? <Button asChild variant="outline"><a href={item.product.documentationUrl}>{t("Documentation")}</a></Button> : null}
        <Button asChild variant="outline"><Link href={"/user/support/tickets/open" as never}><MessageCircle className="size-4" /><T>License support</T></Link></Button>
      </div>
    </div>
  );
}

function ReviewRow({ item }: { item: CustomerReviewItem }) {
  const t = useDashboardT();
  return (
    <div className="rounded-xl border border-border bg-background/35 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link className="font-semibold hover:text-primary" href={`/products/${item.product.slug}` as never}>{item.product.title}</Link>
          <p className="mt-1 text-xs text-muted-foreground">{item.rating}/5 · {formatDate(item.createdAt)}</p>
        </div>
        <Badge variant="outline">{t(item.status)}</Badge>
      </div>
      <p className="mt-3 font-semibold">{item.title ?? t("Review")}</p>
      <p className="mt-1 line-clamp-3 text-sm leading-7 text-muted-foreground">{item.body}</p>
      {item.reply ? <p className="mt-3 rounded-lg bg-background/45 p-3 text-sm text-muted-foreground">{t("Reply")}: {item.reply}</p> : null}
    </div>
  );
}

function QuestionRow({ item }: { item: CustomerQuestionItem }) {
  const t = useDashboardT();
  return (
    <div className="rounded-xl border border-border bg-background/35 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link className="font-semibold hover:text-primary" href={`/products/${item.product.slug}` as never}>{item.product.title}</Link>
          <p className="mt-1 text-xs text-muted-foreground">{formatDate(item.createdAt)}</p>
        </div>
        <Badge variant="outline">{t(item.status)}</Badge>
      </div>
      <p className="mt-3 text-sm leading-7 text-muted-foreground">{item.question}</p>
      {item.answer ? <p className="mt-3 rounded-lg bg-background/45 p-3 text-sm text-muted-foreground">{t("Answer")}: {item.answer}</p> : null}
    </div>
  );
}

function ProductSelect({
  emptyLabel,
  isLoading,
  onChange,
  options,
  placeholder,
  value,
}: {
  emptyLabel: string;
  isLoading: boolean;
  onChange: (value: string) => void;
  options: ProductOption[];
  placeholder: string;
  value: string;
}) {
  const { dir } = useI18n();
  const t = useDashboardT();
  if (isLoading) return <ShadowSkeleton className="h-11 rounded-xl" />;
  if (!options.length) return <EmptyBox label={emptyLabel} />;
  return (
    <Select dir={dir} onValueChange={onChange} value={value}>
      <SelectTrigger>
        <SelectValue placeholder={t(placeholder)} />
      </SelectTrigger>
      <SelectContent>
        {options.map((product) => (
          <SelectItem key={product.id} value={product.id}>
            {product.title}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function SelectedProductSummary({ product }: { product: ProductOption }) {
  return (
    <div className="rounded-xl border border-primary/25 bg-primary/5 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link className="font-semibold hover:text-primary" href={`/products/${product.slug}` as never}>{product.title}</Link>
          <p className="mt-1 text-xs text-muted-foreground">{product.meta}</p>
        </div>
        <Badge variant="outline"><T>Selected</T></Badge>
      </div>
    </div>
  );
}

function ProductCardActions({ meta, onRemove, pending, product, removable }: { meta: string; onRemove?: () => void; pending?: boolean; product: CustomerProductCard; removable?: boolean }) {
  const t = useDashboardT();
  return (
    <div className="rounded-xl border border-border bg-background/35 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link className="font-semibold hover:text-primary" href={`/products/${product.slug}` as never}>{product.title}</Link>
          <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{product.shortDescription}</p>
        </div>
        <Badge variant="outline">{product.licenseType}</Badge>
      </div>
      <div className="mt-3 grid gap-2 md:grid-cols-3">
        <Stat label="Price" value={`${product.salePrice ?? product.price} ${t(product.currency)}`} />
        <Stat label="Rating" value={`${product.ratingAverage}/5`} />
        <Stat label="Version" value={product.currentVersion ?? "Pending"} />
      </div>
      <p className="mt-3 text-xs text-muted-foreground">{meta}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button asChild size="sm" variant="outline"><Link href={`/products/${product.slug}` as never}>{t("View")}</Link></Button>
        {product.demoUrl ? <Button asChild size="sm" variant="outline"><a href={product.demoUrl}>{t("Demo")}</a></Button> : null}
        {removable ? <Button disabled={pending} onClick={onRemove} size="sm" variant="outline"><Trash2 className="size-4" /><T>Remove</T></Button> : null}
      </div>
    </div>
  );
}

function SavedServicesPanel() {
  const { dir, lang } = useI18n();
  const t = (text: string) => translateUiText(text, lang);
  const builtInLang = (lang === "en" || lang === "ar" || lang === "fa") ? lang : "fa";
  const queryClient = useQueryClient();
  const [serviceSlug, setServiceSlug] = useState(SERVICES[0]?.slug ?? "");
  const [timeline, setTimeline] = useState("");
  const [budget, setBudget] = useState("");
  const [notes, setNotes] = useState("");
  const preferences = useQuery({ queryFn: () => getCustomerPreferences(), queryKey: ["customer-preferences"], retry: 1 });
  const savedServices = readSavedServices(preferences.data?.find((item) => item.key === "savedServices")?.value);
  const selectedService = SERVICES.find((service) => service.slug === serviceSlug) ?? SERVICES[0];
  const serviceTickets = useQuery({
    queryFn: () => getMyTickets({ page: 1, pageSize: 5, search: "Service inquiry", sortOrder: "desc" }) as Promise<TicketPage>,
    queryKey: ["customer-service-inquiry-tickets"],
    retry: 1,
  });
  const saveServices = useMutation({
    mutationFn: (items: SavedServiceIntent[]) => updateCustomerPreferences({ savedServices: items }),
    onError: (error) => toast.error(error instanceof Error ? error.message : t("Service shortlist could not be saved")),
    onSuccess: () => {
      toast.success(t("Service shortlist updated."));
      void queryClient.invalidateQueries({ queryKey: ["customer-preferences"] });
    },
  });
  const openTicket = useMutation({
    mutationFn: (item: SavedServiceIntent) => createTicket({
      body: [
        `Service: ${item.title}`,
        `Slug: ${item.slug}`,
        item.timeline ? `Timeline: ${item.timeline}` : null,
        item.budget ? `Budget: ${item.budget}` : null,
        item.notes ? `Notes: ${item.notes}` : null,
      ].filter(Boolean).join("\n"),
      priority: "NORMAL",
      subject: `Service inquiry: ${item.title}`,
    }),
    onError: (error) => toast.error(error instanceof Error ? error.message : t("Service ticket could not be created")),
    onSuccess: () => {
      toast.success(t("Service inquiry ticket opened."));
      void queryClient.invalidateQueries({ queryKey: ["customer-service-inquiry-tickets"] });
      void queryClient.invalidateQueries({ queryKey: ["customer-tickets"] });
    },
  });
  const addService = () => {
    if (!selectedService) return;
    const nextItem: SavedServiceIntent = {
      budget: budget.trim() || undefined,
      createdAt: new Date().toISOString(),
      notes: notes.trim() || undefined,
      slug: selectedService.slug,
      timeline: timeline.trim() || undefined,
      title: selectedService.title[builtInLang] ?? selectedService.title.fa,
    };
    const next = [nextItem, ...savedServices.filter((item) => item.slug !== selectedService.slug)].slice(0, 12);
    saveServices.mutate(next);
    setTimeline("");
    setBudget("");
    setNotes("");
  };
  const removeService = (slug: string) => saveServices.mutate(savedServices.filter((item) => item.slug !== slug));

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
      <div className="space-y-3">
        {preferences.isLoading ? <PanelSkeleton /> : null}
        {preferences.isError ? <ErrorBox message={preferences.error.message} title="Saved services unavailable" /> : null}
        {!preferences.isLoading && !preferences.isError && savedServices.length ? (
          <div className="grid gap-3 md:grid-cols-2">
            {savedServices.map((item) => (
              <div className="rounded-xl border border-border bg-background/35 p-4" key={item.slug}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link className="font-semibold hover:text-primary" href={`/services/${item.slug}` as never}>{item.title}</Link>
                    <p className="mt-1 text-xs text-muted-foreground">{t("Saved")} {formatDate(item.createdAt)}</p>
                  </div>
                  <Badge variant="outline">{item.timeline ?? t("Discovery")}</Badge>
                </div>
                <div className="mt-3 grid gap-2 md:grid-cols-2">
                  <Stat label="Budget" value={item.budget ?? "Not set"} />
                  <Stat label="Record" value="Preference" />
                </div>
                {item.notes ? <p className="mt-3 line-clamp-3 text-sm leading-7 text-muted-foreground">{item.notes}</p> : null}
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button disabled={openTicket.isPending} onClick={() => openTicket.mutate(item)} size="sm" variant="outline">
                    {openTicket.isPending ? <Loader2 className="size-4 animate-spin" /> : <MessageCircle className="size-4" />}
                    {t("Open ticket")}
                  </Button>
                  <Button disabled={saveServices.isPending} onClick={() => removeService(item.slug)} size="sm" variant="outline"><Trash2 className="size-4" /><T>Remove</T></Button>
                </div>
              </div>
            ))}
          </div>
        ) : null}
        {!preferences.isLoading && !preferences.isError && !savedServices.length ? <EmptyBox label="No saved service intents yet." /> : null}
        <div className="rounded-xl border border-border bg-background/35 p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-semibold">{t("Recent service inquiry tickets")}</p>
              <p className="mt-1 text-sm text-muted-foreground"><T>Tickets opened from saved services stay traceable in support history.</T></p>
            </div>
            <Button asChild variant="outline"><Link href="/user/support/tickets"><MessageCircle className="size-4" /><T>View tickets</T></Link></Button>
          </div>
          <div className="mt-4 space-y-2">
            {serviceTickets.isLoading ? <ShadowSkeleton className="h-14 rounded-xl" /> : null}
            {serviceTickets.isError ? <ErrorBox message={serviceTickets.error.message} title="Service tickets unavailable" /> : null}
            {!serviceTickets.isLoading && !serviceTickets.isError && serviceTickets.data?.items.length ? serviceTickets.data.items.map((ticket) => (
              <Link className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background/45 p-3 text-sm hover:border-primary/40" href={`/user/support/tickets/${ticket.id}` as never} key={ticket.id}>
                <span className="font-semibold">{ticket.ticketNumber}</span>
                <span className="truncate text-muted-foreground">{ticket.subject}</span>
                <Badge variant="outline">{t(ticket.status)}</Badge>
              </Link>
            )) : null}
            {!serviceTickets.isLoading && !serviceTickets.isError && !serviceTickets.data?.items.length ? <EmptyBox label="No service inquiry tickets yet." /> : null}
          </div>
        </div>
      </div>
      <div className="space-y-4">
        <Card className="rounded-2xl border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]">
          <CardHeader><CardTitle><T>Save Service</T></CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Select dir={dir} onValueChange={setServiceSlug} value={serviceSlug}>
              <SelectTrigger><SelectValue placeholder={t("Select service")} /></SelectTrigger>
              <SelectContent>
                {SERVICES.map((service) => <SelectItem key={service.slug} value={service.slug}>{service.title[builtInLang] ?? service.title.fa}</SelectItem>)}
              </SelectContent>
            </Select>
            {selectedService ? (
              <div className="rounded-xl border border-primary/25 bg-primary/5 p-3">
                <p className="font-semibold">{selectedService.title[builtInLang] ?? selectedService.title.fa}</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">{selectedService.short[builtInLang] ?? selectedService.short.fa}</p>
              </div>
            ) : null}
            <Input onChange={(event) => setTimeline(event.target.value)} placeholder={t("Timeline, e.g. 6 weeks")} value={timeline} />
            <Input onChange={(event) => setBudget(event.target.value)} placeholder={t("Budget range")} value={budget} />
            <Textarea className="min-h-28" onChange={(event) => setNotes(event.target.value)} placeholder={t("Project notes")} value={notes} />
            <Button className="w-full" disabled={saveServices.isPending || !selectedService} onClick={addService}>{saveServices.isPending ? <Loader2 className="size-4 animate-spin" /> : <Heart className="size-4" />}{t("Save service intent")}</Button>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]">
          <CardHeader><CardTitle><T>Workflow</T></CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Stat label="Saved intents" value={String(savedServices.length)} />
            <Stat label="Ticket handoff" value="Available" />
            <Button asChild className="w-full" variant="outline"><Link href="/services"><FileText className="size-4" /><T>Browse services</T></Link></Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface SavedServiceIntent {
  budget?: string;
  createdAt: string;
  notes?: string;
  slug: string;
  timeline?: string;
  title: string;
}

function readSavedServices(value: unknown): SavedServiceIntent[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is SavedServiceIntent => {
    if (!item || typeof item !== "object") return false;
    const record = item as Record<string, unknown>;
    return typeof record.createdAt === "string" && typeof record.slug === "string" && typeof record.title === "string";
  });
}

function productOptionsFromPurchases(items: CustomerPurchaseItem[]) {
  return uniqueProductOptions(items.map((item) => ({
    id: item.product.id,
    meta: `${item.order.orderNumber} · Purchased ${formatDate(item.createdAt)}`,
    slug: item.product.slug,
    title: item.product.title,
  })));
}

function productOptionsFromProductCards(items: CustomerProductCard[], source: string) {
  return uniqueProductOptions(items.map((product) => ({
    id: product.id,
    meta: `${source} · ${product.salePrice ?? product.price} ${product.currency}`,
    slug: product.slug,
    title: product.title,
  })));
}

function uniqueProductOptions(items: ProductOption[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

function helpArticleIdFromPath(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length !== 4 || segments[0] !== "dashboard" || segments[1] !== "support" || segments[2] !== "help") return null;
  return decodeURIComponent(segments[3]);
}

function HelpRow({ item, lang, selected = false }: { item: CustomerHelpItem; lang: string; selected?: boolean }) {
  const question = localizedText(item.question, lang);
  const answer = localizedText(item.answer, lang);
  return (
    <div className={cn("rounded-xl border border-border bg-background/35 p-4", selected ? "border-primary/60 bg-primary/10" : "")}>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <p className="font-semibold">{question}</p>
        <Button asChild size="sm" variant={selected ? "default" : "outline"}>
          <Link href={`/user/support/help/${encodeURIComponent(item.id)}`}>
            <Eye className="size-4" />
            View
          </Link>
        </Button>
      </div>
      <p className="mt-2 text-sm leading-7 text-muted-foreground">{answer}</p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  const t = useDashboardT();
  return <div className="rounded-xl border border-border bg-background/35 p-3"><p className="text-xs text-muted-foreground">{t(label)}</p><p className="mt-1 truncate font-semibold">{t(value)}</p></div>;
}

function EmptyBox({ label }: { label: string }) {
  const t = useDashboardT();
  return <div className="grid min-h-44 place-items-center rounded-xl border border-dashed border-border bg-background/30 p-6 text-sm text-muted-foreground">{t(label)}</div>;
}

function ErrorBox({ message, title }: { message: string; title: string }) {
  const t = useDashboardT();
  return <Alert variant="destructive"><AlertTitle>{t(title)}</AlertTitle><AlertDescription>{message}</AlertDescription></Alert>;
}

function PanelSkeleton() {
  return <div className="space-y-3">{Array.from({ length: 6 }).map((_, index) => <ShadowSkeleton className="h-14 rounded-xl" key={index} />)}</div>;
}

function formatDate(value: string) {
  return formatPlatformDate(value, { dateStyle: "medium" });
}

function jsonLabel(value: unknown) {
  if (typeof value === "string") return value;
  if (value && typeof value === "object") return Object.values(value as Record<string, unknown>).find((item): item is string => typeof item === "string");
  return undefined;
}

function copyReferral(code: string, targetPath: string, message: string) {
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  const url = `${origin}${targetPath}?ref=${encodeURIComponent(code)}`;
  void navigator.clipboard?.writeText(url);
  toast.success(message);
}

function copyText(value: string, message: string) {
  void navigator.clipboard?.writeText(value);
  toast.success(message);
}

function referralModeFromPath(pathname: string) {
  if (pathname.endsWith("/referred-users")) return "referred-users";
  if (pathname.endsWith("/links")) return "links";
  if (pathname.endsWith("/codes")) return "codes";
  if (pathname.endsWith("/clicks")) return "clicks";
  if (pathname.endsWith("/conversions")) return "conversions";
  if (pathname.endsWith("/commissions")) return "commissions";
  if (pathname.endsWith("/payouts")) return "payouts";
  if (pathname.endsWith("/withdrawals")) return "withdrawals";
  if (pathname.endsWith("/materials")) return "materials";
  return "dashboard";
}

function referralModeTitle(mode: string) {
  const titles: Record<string, string> = {
    clicks: "Referral Click Statistics",
    codes: "Referral Codes",
    commissions: "Referral Commissions",
    conversions: "Referral Conversions",
    dashboard: "Referral Dashboard",
    links: "Referral Links",
    materials: "Marketing Materials",
    "referred-users": "کاربران معرفی‌شده",
    payouts: "اعتبار کارمزد معرفی",
    withdrawals: "اعتبار کارمزد معرفی",
  };
  return titles[mode] ?? "Referral Dashboard";
}

function displaySupportAuthor(user?: AdminTicketDetail["messages"][number]["author"]) {
  const profile = user?.profile;
  return [profile?.firstName, profile?.lastName].filter(Boolean).join(" ") || user?.email || "Support";
}

function displayLiveChatUser(user: AdminLiveChatDetail["assignedAgent"] | AdminLiveChatDetail["messages"][number]["sender"] | undefined, fallback: string) {
  const profile = user?.profile;
  return [profile?.firstName, profile?.lastName].filter(Boolean).join(" ") || user?.email || fallback;
}

async function openLiveChatAttachment(conversationId: string, attachmentId: string, admin: boolean) {
  const t = (text: string) => translateUiText(text, localStorage.getItem("lang") ?? "fa");
  try {
    const signed = await getLiveChatAttachmentSignedUrl(conversationId, attachmentId, { admin });
    window.open(resolveApiUrl(signed.url), "_blank", "noopener,noreferrer");
  } catch (error) {
    toast.error(error instanceof Error ? error.message : t("Attachment download failed"));
  }
}

function resolveApiUrl(value: string) {
  if (/^https?:\/\//i.test(value)) return value;
const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://noghre.land/api/v1";
  return new URL(value, apiBase).toString();
}

function friendlyUserAgent(userAgent?: string | null) {
  if (!userAgent) return "Unknown device";
  if (userAgent.includes("Firefox")) return "Firefox browser";
  if (userAgent.includes("Edg/")) return "Edge browser";
  if (userAgent.includes("Chrome")) return "Chrome browser";
  if (userAgent.includes("Safari")) return "Safari browser";
  return userAgent.slice(0, 64);
}

function prefKey(event: string, channel: NotificationPreferenceInput["channel"]) {
  return `${event}:${channel}`;
}

function notificationEventMeta(event: string) {
  const records: Record<string, { description: string; label: string }> = {
    live_chat: { description: "Conversation replies, assignment updates, and closed chat notices.", label: "Live Chat" },
    order: { description: "Order creation, processing, fulfillment, cancellation, and delivery states.", label: "Orders" },
    payment: { description: "Paid invoices, failed payments, refunds, wallet movement, and payment actions.", label: "Payments" },
    referral: { description: "Referral clicks, conversions, commission changes, and payout state.", label: "Referrals" },
    system: { description: "Security, account, policy, and platform operation notifications.", label: "System" },
    ticket: { description: "Ticket replies, status changes, private support requests, and staff actions.", label: "Support Tickets" },
  };
  return records[event] ?? { description: "Customer account notifications.", label: event.replace("_", " ") };
}

function notificationChannelMeta(channel: NotificationPreferenceInput["channel"]) {
  const records: Record<NotificationPreferenceInput["channel"], { description: string; label: string }> = {
    EMAIL: { description: "Inbox", label: "Email" },
    IN_APP: { description: "Top menu", label: "In-app" },
    PUSH: { description: "Device", label: "Push" },
    SMS: { description: "Mobile", label: "SMS" },
    TELEGRAM: { description: "Bot", label: "Telegram" },
  };
  return records[channel];
}

function modeLabel(mode: "invoices" | "orders" | "payments") {
  if (mode === "orders") return "Orders";
  if (mode === "invoices") return "Invoices";
  return "Payments";
}

function routeScopedLabel(title: string | undefined, mode: "invoices" | "orders" | "payments") {
  return title || modeLabel(mode);
}

function statusOptions(mode: "invoices" | "orders" | "payments") {
  if (mode === "orders") return ["PENDING", "PROCESSING", "COMPLETED", "CANCELLED", "REFUNDED"];
  if (mode === "invoices") return ["DRAFT", "PENDING", "ISSUED", "PAID", "OVERDUE", "VOID", "CANCELLED"];
  return ["PENDING", "PROCESSING", "PAID", "FAILED", "CANCELLED", "REFUNDED"];
}

function assetModeLabel(mode: "downloads" | "licenses" | "purchases") {
  if (mode === "downloads") return "Downloads";
  if (mode === "licenses") return "Licenses";
  return "Purchases";
}

function activityStatuses(mode: "questions" | "reviews") {
  return mode === "reviews" ? ["PENDING", "APPROVED", "REJECTED", "SPAM"] : ["PENDING", "ANSWERED", "CLOSED", "SPAM"];
}

function formatBytes(value: string) {
  const bytes = Number(value);
  if (!Number.isFinite(bytes)) return value;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
}

function localizedText(value: Record<string, string>, lang: string) {
  return value[lang] ?? value.en ?? value.fa ?? value.ar ?? Object.values(value).find(Boolean) ?? "";
}
