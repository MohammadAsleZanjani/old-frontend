"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Download, ExternalLink, Filter, Loader2, MessageSquareReply, Search, SlidersHorizontal, XCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "@/shared/ui/sonner";

import { getAdminOverview } from "@/features/admin/api/admin-dashboard-api";
import {
  answerProductQuestion,
  getBlogComments,
  getProductQuestions,
  getProductReviews,
  moderateBlogComment,
  moderateProductReview,
  replyToBlogComment,
  type BlogCommentModerationItem,
  type BlogCommentStatus,
  type ModerationList,
  type ProductQuestionModerationItem,
  type ProductQuestionStatus,
  type ProductReviewModerationItem,
  type ProductReviewStatus,
} from "@/features/admin/api/admin-moderation-api";
import { AdminShell } from "@/features/admin/components/AdminShell";
import { AdminExcelExportButton } from "@/features/admin/components/AdminExcelExportButton";
import { fetchAllAdminExportRows } from "@/features/admin/lib/admin-excel-export";
import { AdminUserLink } from "@/features/admin/components/AdminUserLink";
import { useI18n } from "@/shared/i18n";
import { translateUiText } from "@/shared/i18n/ui-copy";
import { formatPlatformDate } from "@/shared/lib/date-format";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { ShadowSkeleton } from "@/shared/ui/skeleton-state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";
import { Textarea } from "@/shared/ui/textarea";

type ModerationKind = "blog-comments" | "product-questions" | "product-reviews";

const config = {
  "blog-comments": {
    description: "Moderate blog comments, approve useful discussion, reject spam, and reply with staff context.",
    group: "Content / Blog",
    permission: "blog.moderate_comments",
    statuses: ["PENDING", "APPROVED", "REJECTED", "SPAM"] satisfies BlogCommentStatus[],
    title: "Comment moderation",
  },
  "product-questions": {
    description: "Answer product questions, close duplicates, and keep marketplace Q&A accurate for buyers.",
    group: "Shop / Products",
    permission: "products.view",
    statuses: ["PENDING", "ANSWERED", "CLOSED", "SPAM"] satisfies ProductQuestionStatus[],
    title: "Product Q&A moderation",
  },
  "product-reviews": {
    description: "Review customer ratings, approve authentic feedback, reject abuse, and protect product trust signals.",
    group: "Shop / Products",
    permission: "products.view",
    statuses: ["PENDING", "APPROVED", "REJECTED", "SPAM"] satisfies ProductReviewStatus[],
    title: "Review moderation",
  },
};

export function AdminModerationPage({ kind }: { kind: ModerationKind }) {
  const { dir, lang } = useI18n();
  const t = (text: string) => translateUiText(text, lang);
  const pageConfig = config[kind];
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [status, setStatus] = useState("all");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showMessageColumn, setShowMessageColumn] = useState(true);
  const overview = useQuery({
    queryFn: () => getAdminOverview(),
    queryKey: ["admin-dashboard-overview"],
    retry: 1,
  });
  const access = overview.data?.access;
  const canView = !!access && (access.isSuperAdmin || access.permissions.includes(pageConfig.permission));
  const canModerate = !!access && (access.isSuperAdmin || access.permissions.includes("blog.moderate_comments") || access.permissions.includes("products.update"));
  const listQuery = useQuery<ModerationList<ModerationItem>>({
    enabled: canView,
    queryFn: () => fetchModerationItems(kind, { page, pageSize: 10, search, sortOrder, status: status === "all" ? undefined : status }),
    queryKey: ["admin-moderation", kind, page, search, sortOrder, status],
    retry: 1,
  });
  const items = useMemo(() => listQuery.data?.items ?? [], [listQuery.data?.items]);
  const metrics = useMemo(() => moderationMetrics(items, listQuery.data?.total ?? items.length), [items, listQuery.data?.total]);

  if (overview.isLoading) {
    return (
      <AdminShell>
        <ModerationSkeleton />
      </AdminShell>
    );
  }

  if (overview.isError) {
    return (
      <AdminShell>
        <Alert variant="destructive">
          <AlertTitle>{t("Admin page unavailable")}</AlertTitle>
          <AlertDescription>{overview.error.message}</AlertDescription>
        </Alert>
      </AdminShell>
    );
  }

  if (!canView) {
    return (
      <AdminShell access={access}>
        <Alert>
          <AlertTitle>{t("Permission required")}</AlertTitle>
          <AlertDescription>{t("You do not have access to this moderation queue.")}</AlertDescription>
        </Alert>
      </AdminShell>
    );
  }

  return (
    <AdminShell access={access}>
      <div className="space-y-6">
        <section className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl space-y-2">
            <Badge className="w-fit" variant="outline">{t(pageConfig.group)}</Badge>
            <h2 className="text-2xl font-bold md:text-3xl">{t(pageConfig.title)}</h2>
            <p className="text-sm leading-7 text-muted-foreground">{t(pageConfig.description)}</p>
          </div>
          <AdminExcelExportButton
            disabled={listQuery.isLoading || (listQuery.data?.total ?? 0) === 0}
            fetchRows={() => fetchAllAdminExportRows((exportPage, pageSize) => fetchModerationItems(kind, { page: exportPage, pageSize, search, sortOrder, status: status === "all" ? undefined : status }))}
            filename={pageConfig.title}
            sheetName={t(pageConfig.title)}
          />
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          {metrics.map((metric) => (
            <Card className="rounded-lg border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]" key={metric.label}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">{t(metric.label)}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metric.value}</div>
                <p className="mt-1 text-xs text-muted-foreground">{t(metric.meta)}</p>
              </CardContent>
            </Card>
          ))}
        </section>

        <Card className="rounded-lg border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]">
          <CardHeader className="space-y-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <CardTitle>{t("Moderation queue")}</CardTitle>
              <div className="flex flex-wrap gap-2">
                <Button disabled={!items.length} onClick={() => downloadModerationCsv(`${pageConfig.title}-current-page`, items, t)} size="sm" variant="outline">{t("Export page")}</Button>
                <Button onClick={() => setShowMessageColumn((current) => !current)} size="sm" variant="outline">
                  <SlidersHorizontal className="size-4" />
                  {t("Columns")}
                </Button>
              </div>
            </div>
            <div className="grid gap-3 lg:grid-cols-[1fr_180px_180px_180px]">
              <div className="relative">
                <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="ps-9"
                  onChange={(event) => {
                    setPage(1);
                    setSearch(event.target.value);
                  }}
                  placeholder={t("Search author, product, post, or message")}
                  value={search}
                />
              </div>
              <Select
                dir={dir}
                onValueChange={(value) => {
                  setPage(1);
                  setStatus(value);
                }}
                value={status}
              >
                <SelectTrigger>
                  <Filter className="size-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("All statuses")}</SelectItem>
                  {pageConfig.statuses.map((option) => (
                    <SelectItem key={option} value={option}>{t(formatLabel(option))}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select dir={dir} onValueChange={(value) => setSortOrder(value as "asc" | "desc")} value={sortOrder}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">{t("Newest first")}</SelectItem>
                  <SelectItem value="asc">{t("Oldest first")}</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={() => setShowAdvancedFilters((current) => !current)} variant="outline">{t("Advanced filters")}</Button>
            </div>
            {showAdvancedFilters ? (
              <div className="grid gap-3 rounded-lg border border-border bg-background/35 p-3 text-sm md:grid-cols-3">
                <div>
                  <p className="font-medium">{t("Queue")}</p>
                  <p className="mt-1 text-muted-foreground">{t(pageConfig.title)}</p>
                </div>
                <div>
                  <p className="font-medium">{t("Status scope")}</p>
                  <p className="mt-1 text-muted-foreground">{status === "all" ? t("All statuses") : t(formatLabel(status))}</p>
                </div>
                <div>
                  <p className="font-medium">{t("Ordering")}</p>
                  <p className="mt-1 text-muted-foreground">{sortOrder === "desc" ? t("Newest first") : t("Oldest first")}</p>
                </div>
              </div>
            ) : null}
          </CardHeader>
          <CardContent>
            {listQuery.isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 8 }).map((_, index) => (
                  <ShadowSkeleton className="h-16" key={index} />
                ))}
              </div>
            ) : listQuery.isError ? (
              <Alert variant="destructive">
                <AlertTitle>{t("Moderation queue unavailable")}</AlertTitle>
                <AlertDescription>{listQuery.error.message}</AlertDescription>
              </Alert>
            ) : items.length ? (
              <ModerationTable canModerate={canModerate} items={items} kind={kind} showMessageColumn={showMessageColumn} />
            ) : (
              <div className="grid min-h-56 place-items-center rounded-lg border border-dashed border-border bg-background/30 text-sm text-muted-foreground">
                {t("No moderation items match the current filters.")}
              </div>
            )}
            <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                {t("Showing")} {items.length} {t("of")} {listQuery.data?.total ?? 0} {t("moderation records")}.
              </p>
              <div className="flex gap-2">
                <Button disabled={page <= 1 || listQuery.isLoading} onClick={() => setPage((current) => Math.max(1, current - 1))} size="sm" variant="outline">
                  {t("Previous")}
                </Button>
                <Button disabled={page >= (listQuery.data?.totalPages ?? 1) || listQuery.isLoading} onClick={() => setPage((current) => current + 1)} size="sm" variant="outline">
                  {t("Next")}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}

function ModerationTable({
  canModerate,
  items,
  kind,
  showMessageColumn,
}: {
  canModerate: boolean;
  items: ModerationItem[];
  kind: ModerationKind;
  showMessageColumn: boolean;
}) {
  const { lang } = useI18n();
  const t = (text: string) => translateUiText(text, lang);
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12">#</TableHead>
          <TableHead>{t("Context")}</TableHead>
          {showMessageColumn ? <TableHead>{t("Message")}</TableHead> : null}
          <TableHead>{t("Status")}</TableHead>
          <TableHead>{t("Created")}</TableHead>
          <TableHead className="text-start">{t("Actions")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item, index) => (
          <ModerationRow canModerate={canModerate} index={index} item={item} key={item.id} kind={kind} showMessageColumn={showMessageColumn} />
        ))}
      </TableBody>
    </Table>
  );
}

function ModerationRow({
  canModerate,
  index,
  item,
  kind,
  showMessageColumn,
}: {
  canModerate: boolean;
  index: number;
  item: ModerationItem;
  kind: ModerationKind;
  showMessageColumn: boolean;
}) {
  const { lang } = useI18n();
  const t = (text: string) => translateUiText(text, lang);
  const queryClient = useQueryClient();
  const [reply, setReply] = useState("");
  const [answer, setAnswer] = useState(isQuestion(item) ? item.answer ?? "" : "");
  const invalidate = () => void queryClient.invalidateQueries({ queryKey: ["admin-moderation", kind] });
  const blogAction = useMutation({
    mutationFn: (status: BlogCommentStatus) => moderateBlogComment(item.id, status),
    onError: (error) => toast.error(error instanceof Error ? error.message : t("Comment moderation failed")),
    onSuccess: () => {
      toast.success(t("Comment status updated."));
      invalidate();
    },
  });
  const reviewAction = useMutation({
    mutationFn: (status: ProductReviewStatus) => moderateProductReview(item.id, status),
    onError: (error) => toast.error(error instanceof Error ? error.message : t("Review moderation failed")),
    onSuccess: () => {
      toast.success(t("Review status updated."));
      invalidate();
    },
  });
  const replyAction = useMutation({
    mutationFn: () => replyToBlogComment({ body: reply.trim(), parentId: item.id, postId: isBlogComment(item) ? item.postId : "" }),
    onError: (error) => toast.error(error instanceof Error ? error.message : t("Comment reply failed")),
    onSuccess: () => {
      setReply("");
      toast.success(t("Reply published."));
      invalidate();
    },
  });
  const questionAction = useMutation({
    mutationFn: (status: ProductQuestionStatus) => answerProductQuestion(item.id, answer.trim() || t("Handled by moderation."), status),
    onError: (error) => toast.error(error instanceof Error ? error.message : t("Question update failed")),
    onSuccess: () => {
      toast.success(t("Question updated."));
      invalidate();
    },
  });

  const busy = blogAction.isPending || reviewAction.isPending || replyAction.isPending || questionAction.isPending;

  return (
    <TableRow>
      <TableCell>{index + 1}</TableCell>
      <TableCell>
        <div className="min-w-56 space-y-1">
          <p className="font-medium">{itemTitle(item)}</p>
          <p className="text-xs text-muted-foreground"><AdminUserLink className="text-xs" userId={itemOwnerUserId(item)}>{itemOwner(item)}</AdminUserLink></p>
          {itemHref(item) ? (
            <Button asChild size="sm" variant="link">
              <Link href={itemHref(item) as never}>
                <ExternalLink className="size-3.5" />
                {t("View on site")}
              </Link>
            </Button>
          ) : null}
        </div>
      </TableCell>
      {showMessageColumn ? (
        <TableCell>
          <div className="max-w-xl space-y-2">
            <p className="line-clamp-3 text-sm text-muted-foreground">{itemBody(item)}</p>
            {isBlogComment(item) ? (
              <div className="flex gap-2">
                <Input disabled={!canModerate || busy} onChange={(event) => setReply(event.target.value)} placeholder={t("Staff reply")} value={reply} />
                <Button disabled={!canModerate || !reply.trim() || busy} onClick={() => replyAction.mutate()} size="sm" variant="outline">
                  {replyAction.isPending ? <Loader2 className="size-4 animate-spin" /> : <MessageSquareReply className="size-4" />}
                  {t("Reply")}
                </Button>
              </div>
            ) : null}
            {isQuestion(item) ? (
              <Textarea disabled={!canModerate || busy} onChange={(event) => setAnswer(event.target.value)} placeholder={t("Answer product question")} value={answer} />
            ) : null}
          </div>
        </TableCell>
      ) : null}
      <TableCell>
        <Badge variant="outline">{t(formatLabel(item.status))}</Badge>
      </TableCell>
      <TableCell className="text-muted-foreground">{formatDate(item.createdAt)}</TableCell>
      <TableCell className="min-w-52">
        <div className="flex flex-wrap gap-2">
          {kind === "blog-comments" ? (
            <>
              <Button disabled={!canModerate || busy} onClick={() => blogAction.mutate("APPROVED")} size="sm" variant="outline"><CheckCircle2 className="size-4" />{t("Approve")}</Button>
              <Button disabled={!canModerate || busy} onClick={() => blogAction.mutate("REJECTED")} size="sm" variant="outline"><XCircle className="size-4" />{t("Reject")}</Button>
              <Button disabled={!canModerate || busy} onClick={() => blogAction.mutate("SPAM")} size="sm" variant="outline">{t("Spam")}</Button>
            </>
          ) : null}
          {kind === "product-reviews" ? (
            <>
              <Button disabled={!canModerate || busy} onClick={() => reviewAction.mutate("APPROVED")} size="sm" variant="outline"><CheckCircle2 className="size-4" />{t("Approve")}</Button>
              <Button disabled={!canModerate || busy} onClick={() => reviewAction.mutate("REJECTED")} size="sm" variant="outline"><XCircle className="size-4" />{t("Reject")}</Button>
              <Button disabled={!canModerate || busy} onClick={() => reviewAction.mutate("SPAM")} size="sm" variant="outline">{t("Spam")}</Button>
            </>
          ) : null}
          {kind === "product-questions" ? (
            <>
              <Button disabled={!canModerate || busy || !answer.trim()} onClick={() => questionAction.mutate("ANSWERED")} size="sm" variant="outline"><CheckCircle2 className="size-4" />{t("Answer")}</Button>
              <Button disabled={!canModerate || busy} onClick={() => questionAction.mutate("CLOSED")} size="sm" variant="outline"><XCircle className="size-4" />{t("Close")}</Button>
              <Button disabled={!canModerate || busy} onClick={() => questionAction.mutate("SPAM")} size="sm" variant="outline">{t("Spam")}</Button>
            </>
          ) : null}
        </div>
      </TableCell>
    </TableRow>
  );
}

type ModerationItem = BlogCommentModerationItem | ProductQuestionModerationItem | ProductReviewModerationItem;

async function fetchModerationItems(kind: ModerationKind, query: { page: number; pageSize: number; search: string; sortOrder: "asc" | "desc"; status?: string }): Promise<ModerationList<ModerationItem>> {
  if (kind === "blog-comments") return getBlogComments(query);
  if (kind === "product-reviews") return getProductReviews(query);
  return getProductQuestions(query);
}

function moderationMetrics(items: ModerationItem[], total: number) {
  return [
    { label: "Total", meta: "Latest recorded information", value: total },
    { label: "Pending", meta: "Awaiting moderation", value: items.filter((item) => item.status === "PENDING").length },
    { label: "Approved", meta: "Visible or answered", value: items.filter((item) => item.status === "APPROVED" || item.status === "ANSWERED").length },
    { label: "Attention", meta: "Rejected, spam, or closed", value: items.filter((item) => ["REJECTED", "SPAM", "CLOSED"].includes(item.status)).length },
  ];
}

function itemTitle(item: ModerationItem) {
  if (isBlogComment(item)) return item.post?.title ?? "Blog comment";
  return item.product?.title ?? "Product moderation item";
}

function itemOwner(item: ModerationItem) {
  if (isBlogComment(item)) return item.authorEmail || item.authorName;
  return item.user?.email ?? "Customer";
}

function itemOwnerUserId(item: ModerationItem) {
  return isBlogComment(item) ? undefined : item.user?.id;
}

function itemBody(item: ModerationItem) {
  if (isBlogComment(item)) return item.body;
  if (isQuestion(item)) return item.question;
  return `${item.title ? `${item.title}: ` : ""}${item.body ?? ""}${item.rating ? ` · ${item.rating}/5` : ""}`;
}

function itemHref(item: ModerationItem) {
  if (isBlogComment(item) && item.post?.slug) return `/blog/${item.post.slug}#comments`;
  if (!isBlogComment(item) && item.product?.slug) return `/products/${item.product.slug}`;
  return undefined;
}

function isBlogComment(item: ModerationItem): item is BlogCommentModerationItem {
  return "postId" in item;
}

function isQuestion(item: ModerationItem): item is ProductQuestionModerationItem {
  return "question" in item;
}

function downloadModerationCsv(label: string, items: ModerationItem[], t: (text: string) => string) {
  if (!items.length || typeof window === "undefined") return;
  const headers = ["id", "context", "owner", "status", "createdAt", "body"];
  const body = items.map((item) =>
    [item.id, itemTitle(item), itemOwner(item), item.status, item.createdAt, itemBody(item)].map(csvCell).join(","),
  );
  const blob = new Blob([[headers.join(","), ...body].join("\n")], { type: "text/csv;charset=utf-8" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${label.toLowerCase().replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "moderation-queue"}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
  toast.success(t("Moderation export downloaded."));
}

function csvCell(value: string) {
  return `"${value.replaceAll("\"", "\"\"")}"`;
}

function ModerationSkeleton() {
  return (
    <div className="space-y-6">
      <ShadowSkeleton className="h-28" />
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <ShadowSkeleton className="h-28" key={index} />
        ))}
      </div>
      <ShadowSkeleton className="h-[36rem]" />
    </div>
  );
}

function formatDate(value: string) {
  return formatPlatformDate(value, { dateStyle: "medium", timeStyle: "short" });
}

function formatLabel(value: string) {
  return value.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}
