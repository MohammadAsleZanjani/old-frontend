"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, ExternalLink, FileJson, Filter, Link2, Loader2, Plus, Search, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { toast } from "@/shared/ui/sonner";

import { getAdminOverview } from "@/features/admin/api/admin-dashboard-api";
import {
  getSeoAudits,
  getSeoMetadata,
  getSeoRedirects,
  upsertSeoMetadata,
  upsertSeoRedirect,
  type RedirectItem,
  type SeoMetadataItem,
  type UpsertSeoMetadataInput,
  type UpsertRedirectInput,
} from "@/features/admin/api/admin-seo-api";
import { AdminShell } from "@/features/admin/components/AdminShell";
import { AdminExcelExportButton } from "@/features/admin/components/AdminExcelExportButton";
import { fetchAllAdminExportRows } from "@/features/admin/lib/admin-excel-export";
import { hasAdminPermission, hasAnyAdminPermission } from "@/features/admin/lib/admin-permissions";
import { languageLabel, useI18n } from "@/shared/i18n";
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

const emptyMetadataForm: UpsertSeoMetadataInput = {
  canonicalUrl: "",
  description: "",
  entityId: "homepage",
  entityType: "landing_page",
  keywords: [],
  languageCode: "fa",
  ogImage: "",
  path: "/",
  robots: "index,follow,max-image-preview:large,max-snippet:-1",
  title: "",
};

const emptyRedirectForm: UpsertRedirectInput = {
  languageCode: "",
  sourcePath: "",
  status: "ACTIVE",
  statusCode: 301,
  targetPath: "",
};

export function AdminSeoPage() {
  const { dir, lang, languages } = useI18n();
  const t = (text: string) => translateUiText(text, lang);
  const [search, setSearch] = useState("");
  const [language, setLanguage] = useState("all");
  const [metadataPage, setMetadataPage] = useState(1);
  const [redirectPage, setRedirectPage] = useState(1);
  const [metadataForm, setMetadataForm] = useState<UpsertSeoMetadataInput>(emptyMetadataForm);
  const [redirectForm, setRedirectForm] = useState<UpsertRedirectInput>(emptyRedirectForm);
  const overview = useQuery({ queryFn: () => getAdminOverview(), queryKey: ["admin-dashboard-overview"], retry: 1 });
  const access = overview.data?.access;
  const canViewMetadata = hasAdminPermission(access, "seo.metadata.view");
  const canManageMetadata = hasAdminPermission(access, "seo.metadata.manage");
  const canViewRedirects = hasAdminPermission(access, "seo.redirects.view");
  const canManageRedirects = hasAdminPermission(access, "seo.redirects.manage");
  const canViewAudits = hasAdminPermission(access, "seo.audits.view");
  const allowed = hasAnyAdminPermission(access, ["seo.metadata.view", "seo.redirects.view", "seo.audits.view"]);
  const query = { language: language === "all" ? undefined : language, pageSize: 8, search };
  const metadata = useQuery({
    enabled: canViewMetadata,
    queryFn: () => getSeoMetadata({ ...query, page: metadataPage }),
    queryKey: ["admin-seo-metadata", metadataPage, search, language],
    retry: 1,
  });
  const redirects = useQuery({
    enabled: canViewRedirects,
    queryFn: () => getSeoRedirects({ page: redirectPage, pageSize: 8, search }),
    queryKey: ["admin-seo-redirects", redirectPage, search],
    retry: 1,
  });
  const audits = useQuery({
    enabled: canViewAudits,
    queryFn: () => getSeoAudits({ page: 1, pageSize: 8, search }),
    queryKey: ["admin-seo-audits", search],
    retry: 1,
  });
  const metrics = [
    { label: t("Metadata"), meta: t("Managed records"), value: metadata.data?.total ?? 0 },
    { label: t("Average score"), meta: t("Current page"), value: averageScore(metadata.data?.items ?? []) },
    { label: t("Redirects"), meta: t("Clean URL coverage"), value: redirects.data?.total ?? 0 },
    { label: t("Audits"), meta: t("Generated checks"), value: audits.data?.total ?? 0 },
  ];

  if (overview.isLoading) {
    return (
      <AdminShell>
        <SeoSkeleton />
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

  if (!allowed) {
    return (
      <AdminShell access={access}>
        <Alert>
          <AlertTitle>{t("Permission required")}</AlertTitle>
          <AlertDescription>{t("Your account cannot use this section. Ask a senior administrator to review your role.")}</AlertDescription>
        </Alert>
      </AdminShell>
    );
  }

  return (
    <AdminShell access={access}>
      <div className="space-y-6">
        <section className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl space-y-2">
            <Badge className="w-fit" variant="outline">{t("Content / SEO")}</Badge>
            <h2 className="text-2xl font-bold md:text-3xl">{t("SEO control center")}</h2>
            <p className="text-sm leading-7 text-muted-foreground">
              {t("Manage metadata, canonical URLs, robots directives, hreflang, structured data, redirect rules, sitemap readiness, and audit scores.")}
            </p>
          </div>
          {canManageMetadata ? <Button onClick={() => setMetadataForm(emptyMetadataForm)}>
            <Plus className="size-4" />
            {t("New metadata")}
          </Button> : null}
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          {metrics.map((metric) => (
            <MetricCard key={metric.label} {...metric} />
          ))}
        </section>

        <Card className="rounded-lg border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]">
          <CardHeader className="space-y-4">
            <CardTitle>{t("SEO filters")}</CardTitle>
            <div className="grid gap-3 lg:grid-cols-[1fr_180px_180px]">
              <div className="relative">
                <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="ps-9"
                  onChange={(event) => {
                    setMetadataPage(1);
                    setRedirectPage(1);
                    setSearch(event.target.value);
                  }}
                  placeholder={t("Search paths, titles, descriptions, redirects")}
                  value={search}
                />
              </div>
              <Select dir={dir} onValueChange={setLanguage} value={language}>
                <SelectTrigger>
                  <Filter className="size-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("All languages")}</SelectItem>
                  {languages.map((option) => (
                    <SelectItem key={option.code} value={option.code}>{languageLabel(option)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <AdminExcelExportButton
                disabled={metadata.isLoading || redirects.isLoading || audits.isLoading || ((metadata.data?.total ?? 0) + (redirects.data?.total ?? 0) + (audits.data?.total ?? 0) === 0)}
                fetchRows={async () => {
                  const [allMetadata, allRedirects, allAudits] = await Promise.all([
                    canViewMetadata ? fetchAllAdminExportRows((exportPage, pageSize) => getSeoMetadata({ language: language === "all" ? undefined : language, page: exportPage, pageSize, search })) : [],
                    canViewRedirects ? fetchAllAdminExportRows((exportPage, pageSize) => getSeoRedirects({ page: exportPage, pageSize, search })) : [],
                    canViewAudits ? fetchAllAdminExportRows((exportPage, pageSize) => getSeoAudits({ page: exportPage, pageSize, search })) : [],
                  ]);
                  return [
                    ...allMetadata.map((item) => ({ section: "metadata", ...item })),
                    ...allRedirects.map((item) => ({ section: "redirect", ...item })),
                    ...allAudits.map((item) => ({ section: "audit", ...item })),
                  ];
                }}
                filename="seo-report"
                label={t("Export SEO report")}
                sheetName={t("SEO report")}
              />
            </div>
          </CardHeader>
        </Card>

        {canViewMetadata ? <section className="grid gap-4 xl:grid-cols-[1fr_420px]">
          <SeoMetadataTable
            canEdit={canManageMetadata}
            error={metadata.error?.message}
            isError={metadata.isError}
            isLoading={metadata.isLoading}
            items={metadata.data?.items ?? []}
            onEdit={setMetadataForm}
            page={metadataPage}
            setPage={setMetadataPage}
            total={metadata.data?.total ?? 0}
            totalPages={metadata.data?.totalPages ?? 1}
          />
          {canManageMetadata ? <SeoMetadataForm form={metadataForm} setForm={setMetadataForm} /> : null}
        </section> : null}

        {canViewRedirects ? <section className="grid gap-4 xl:grid-cols-[1fr_420px]">
          <RedirectTable
            canEdit={canManageRedirects}
            error={redirects.error?.message}
            isError={redirects.isError}
            isLoading={redirects.isLoading}
            items={redirects.data?.items ?? []}
            onEdit={setRedirectForm}
            page={redirectPage}
            setPage={setRedirectPage}
            total={redirects.data?.total ?? 0}
            totalPages={redirects.data?.totalPages ?? 1}
          />
          {canManageRedirects ? <RedirectForm form={redirectForm} setForm={setRedirectForm} /> : null}
        </section> : null}

        {canViewAudits ? <Card className="rounded-lg border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="size-5 text-primary" />
              {t("Recent SEO audits")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {audits.isLoading ? (
              <TableSkeleton rows={5} />
            ) : audits.isError ? (
              <Alert variant="destructive">
                <AlertTitle>{t("Audits unavailable")}</AlertTitle>
                <AlertDescription>{audits.error.message}</AlertDescription>
              </Alert>
            ) : audits.data?.items.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("Entity")}</TableHead>
                    <TableHead>{t("Language")}</TableHead>
                    <TableHead>{t("Score")}</TableHead>
                    <TableHead>{t("Created")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {audits.data.items.map((audit) => (
                    <TableRow key={audit.id}>
                      <TableCell className="font-medium">{t(audit.entityType)} / {audit.entityId}</TableCell>
                      <TableCell>{audit.language}</TableCell>
                      <TableCell><ScoreBadge score={audit.score} /></TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(audit.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <EmptyBox label={t("No SEO audits have been generated yet.")} />
            )}
          </CardContent>
        </Card> : null}
      </div>
    </AdminShell>
  );
}

function SeoMetadataTable(props: {
  canEdit: boolean;
  error?: string;
  isError: boolean;
  isLoading: boolean;
  items: SeoMetadataItem[];
  onEdit: (item: UpsertSeoMetadataInput) => void;
  page: number;
  setPage: (page: number) => void;
  total: number;
  totalPages: number;
}) {
  const { lang } = useI18n();
  const t = (text: string) => translateUiText(text, lang);
  return (
    <Card className="rounded-lg border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileJson className="size-5 text-primary" />
          {t("Metadata manager")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {props.isLoading ? <TableSkeleton rows={8} /> : null}
        {props.isError ? (
          <Alert variant="destructive">
            <AlertTitle>{t("Metadata unavailable")}</AlertTitle>
            <AlertDescription>{props.error}</AlertDescription>
          </Alert>
        ) : null}
        {!props.isLoading && !props.isError && props.items.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("Path")}</TableHead>
                <TableHead>{t("Title")}</TableHead>
                <TableHead>{t("Language")}</TableHead>
                <TableHead>{t("Score")}</TableHead>
                <TableHead className="text-start">{t("Actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {props.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.path}</TableCell>
                  <TableCell className="max-w-xs truncate">{item.title}</TableCell>
                  <TableCell>{item.language?.code ?? t("global")}</TableCell>
                  <TableCell><ScoreBadge score={item.score} /></TableCell>
                  <TableCell className="text-start">
                    <div className="flex gap-2">
                      {props.canEdit ? <Button onClick={() => props.onEdit(fromMetadata(item))} size="sm" variant="outline">{t("Edit")}</Button> : null}
                      <Button asChild size="sm" variant="ghost">
                        <a href={item.path} target="_blank">
                          <ExternalLink className="size-4" />
                        </a>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : null}
        {!props.isLoading && !props.isError && !props.items.length ? <EmptyBox label={t("No metadata records match the current filters.")} /> : null}
        <Pager page={props.page} setPage={props.setPage} total={props.total} totalPages={props.totalPages} />
      </CardContent>
    </Card>
  );
}

function SeoMetadataForm({ form, setForm }: { form: UpsertSeoMetadataInput; setForm: (form: UpsertSeoMetadataInput) => void }) {
  const queryClient = useQueryClient();
  const { lang } = useI18n();
  const t = (text: string) => translateUiText(text, lang);
  const mutation = useMutation({
    mutationFn: () => upsertSeoMetadata({
      ...form,
      keywords: keywordsToArray(form.keywords),
      structuredData: parseJsonField(form.structuredData),
    }),
    onError: (error) => toast.error(error instanceof Error ? error.message : t("Metadata save failed")),
    onSuccess: () => {
      toast.success(t("SEO metadata saved."));
      void queryClient.invalidateQueries({ queryKey: ["admin-seo-metadata"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-seo-audits"] });
    },
  });
  return (
    <Card className="rounded-lg border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]">
      <CardHeader>
        <CardTitle>{t("Metadata editor")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={t("Language")}><Input value={form.languageCode} onChange={(event) => setForm({ ...form, languageCode: event.target.value })} /></Field>
          <Field label={t("Path")}><Input value={form.path} onChange={(event) => setForm({ ...form, path: event.target.value })} /></Field>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={t("Entity type")}><Input value={form.entityType} onChange={(event) => setForm({ ...form, entityType: event.target.value })} /></Field>
          <Field label={t("Entity ID")}><Input value={form.entityId} onChange={(event) => setForm({ ...form, entityId: event.target.value })} /></Field>
        </div>
        <Field label={t("Title")}><Input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></Field>
        <Field label={t("Description")}><Textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></Field>
        <Field label={t("Keywords")}><Input value={Array.isArray(form.keywords) ? form.keywords.join(", ") : ""} onChange={(event) => setForm({ ...form, keywords: event.target.value.split(",").map((item) => item.trim()).filter(Boolean) })} /></Field>
        <Field label={t("Canonical URL")}><Input value={form.canonicalUrl ?? ""} onChange={(event) => setForm({ ...form, canonicalUrl: event.target.value })} /></Field>
        <Field label={t("OpenGraph image")}><Input value={form.ogImage ?? ""} onChange={(event) => setForm({ ...form, ogImage: event.target.value })} /></Field>
        <Field label={t("Robots")}><Input value={form.robots ?? ""} onChange={(event) => setForm({ ...form, robots: event.target.value })} /></Field>
        <Button disabled={mutation.isPending || !form.title || !form.description || !form.path} onClick={() => mutation.mutate()}>
          {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
          {t("Save metadata")}
        </Button>
      </CardContent>
    </Card>
  );
}

function RedirectTable(props: {
  canEdit: boolean;
  error?: string;
  isError: boolean;
  isLoading: boolean;
  items: RedirectItem[];
  onEdit: (item: UpsertRedirectInput) => void;
  page: number;
  setPage: (page: number) => void;
  total: number;
  totalPages: number;
}) {
  const { lang } = useI18n();
  const t = (text: string) => translateUiText(text, lang);
  return (
    <Card className="rounded-lg border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link2 className="size-5 text-primary" />
          {t("Redirect manager")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {props.isLoading ? <TableSkeleton rows={6} /> : null}
        {props.isError ? (
          <Alert variant="destructive">
            <AlertTitle>{t("Redirects unavailable")}</AlertTitle>
            <AlertDescription>{props.error}</AlertDescription>
          </Alert>
        ) : null}
        {!props.isLoading && !props.isError && props.items.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("Source")}</TableHead>
                <TableHead>{t("Target")}</TableHead>
                <TableHead>{t("Status")}</TableHead>
                <TableHead>{t("Hits")}</TableHead>
                <TableHead className="text-start">{t("Actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {props.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.sourcePath}</TableCell>
                  <TableCell>{item.targetPath}</TableCell>
                  <TableCell><Badge variant="outline">{item.statusCode} {t(item.status)}</Badge></TableCell>
                  <TableCell>{item.hits}</TableCell>
                  <TableCell className="text-start">
                    {props.canEdit ? <Button onClick={() => props.onEdit(fromRedirect(item))} size="sm" variant="outline">{t("Edit")}</Button> : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : null}
        {!props.isLoading && !props.isError && !props.items.length ? <EmptyBox label={t("No redirects match the current filters.")} /> : null}
        <Pager page={props.page} setPage={props.setPage} total={props.total} totalPages={props.totalPages} />
      </CardContent>
    </Card>
  );
}

function RedirectForm({ form, setForm }: { form: UpsertRedirectInput; setForm: (form: UpsertRedirectInput) => void }) {
  const queryClient = useQueryClient();
  const { dir, lang } = useI18n();
  const t = (text: string) => translateUiText(text, lang);
  const mutation = useMutation({
    mutationFn: () => upsertSeoRedirect({ ...form, languageCode: form.languageCode || undefined }),
    onError: (error) => toast.error(error instanceof Error ? error.message : t("Redirect save failed")),
    onSuccess: () => {
      toast.success(t("Redirect saved."));
      void queryClient.invalidateQueries({ queryKey: ["admin-seo-redirects"] });
    },
  });
  return (
    <Card className="rounded-lg border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]">
      <CardHeader>
        <CardTitle>{t("Redirect editor")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Field label={t("Language")}><Input value={form.languageCode ?? ""} onChange={(event) => setForm({ ...form, languageCode: event.target.value })} placeholder={t("optional")} /></Field>
        <Field label={t("Source path")}><Input value={form.sourcePath} onChange={(event) => setForm({ ...form, sourcePath: event.target.value })} /></Field>
        <Field label={t("Target path")}><Input value={form.targetPath} onChange={(event) => setForm({ ...form, targetPath: event.target.value })} /></Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={t("Status code")}><Input type="number" value={form.statusCode ?? 301} onChange={(event) => setForm({ ...form, statusCode: Number(event.target.value) })} /></Field>
          <Field label={t("Status")}>
            <Select dir={dir} onValueChange={(value) => setForm({ ...form, status: value as "ACTIVE" | "DISABLED" })} value={form.status ?? "ACTIVE"}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">{t("Active")}</SelectItem>
                <SelectItem value="DISABLED">{t("Disabled")}</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>
        <Button disabled={mutation.isPending || !form.sourcePath || !form.targetPath} onClick={() => mutation.mutate()}>
          {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
          {t("Save redirect")}
        </Button>
      </CardContent>
    </Card>
  );
}

function MetricCard({ label, meta, value }: { label: string; meta: string; value: number | string }) {
  return (
    <Card className="rounded-lg border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="mt-1 text-xs text-muted-foreground">{meta}</p>
      </CardContent>
    </Card>
  );
}

function Field({ children, label }: { children: ReactNode; label: string }) {
  return (
    <label className="block space-y-1.5 text-sm">
      <span className="font-medium">{label}</span>
      {children}
    </label>
  );
}

function Pager({ page, setPage, total, totalPages }: { page: number; setPage: (page: number) => void; total: number; totalPages: number }) {
  const { lang } = useI18n();
  const t = (text: string) => translateUiText(text, lang);
  return (
    <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">{t("Total")} {total} {t("records")}.</p>
      <div className="flex gap-2">
        <Button disabled={page <= 1} onClick={() => setPage(Math.max(1, page - 1))} size="sm" variant="outline">{t("Previous")}</Button>
        <Button disabled={page >= totalPages} onClick={() => setPage(page + 1)} size="sm" variant="outline">{t("Next")}</Button>
      </div>
    </div>
  );
}

function TableSkeleton({ rows }: { rows: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, index) => (
        <ShadowSkeleton className="h-12" key={index} />
      ))}
    </div>
  );
}

function SeoSkeleton() {
  return (
    <div className="space-y-6">
      <ShadowSkeleton className="h-28" />
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => <ShadowSkeleton className="h-28" key={index} />)}
      </div>
      <ShadowSkeleton className="h-[36rem]" />
    </div>
  );
}

function EmptyBox({ label }: { label: string }) {
  return <div className="grid min-h-36 place-items-center rounded-lg border border-dashed border-border bg-background/30 px-4 text-center text-sm text-muted-foreground">{label}</div>;
}

function ScoreBadge({ score }: { score: number }) {
  return <Badge variant={score >= 80 ? "default" : "outline"}>{score}/100</Badge>;
}

function fromMetadata(item: SeoMetadataItem): UpsertSeoMetadataInput {
  return {
    canonicalUrl: item.canonicalUrl ?? "",
    description: item.description,
    entityId: item.entityId,
    entityType: item.entityType,
    keywords: item.keywords ?? [],
    languageCode: item.language?.code ?? "fa",
    ogImage: item.ogImage ?? "",
    path: item.path,
    robots: item.robots,
    title: item.title,
  };
}

function fromRedirect(item: RedirectItem): UpsertRedirectInput {
  return {
    languageCode: item.language?.code ?? "",
    sourcePath: item.sourcePath,
    status: item.status,
    statusCode: item.statusCode,
    targetPath: item.targetPath,
  };
}

function averageScore(items: SeoMetadataItem[]) {
  if (!items.length) return 0;
  return Math.round(items.reduce((sum, item) => sum + item.score, 0) / items.length);
}

function keywordsToArray(value: UpsertSeoMetadataInput["keywords"]) {
  return Array.isArray(value) ? value : [];
}

function parseJsonField(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : undefined;
}

function formatDate(value: string) {
  return formatPlatformDate(value, { dateStyle: "medium", timeStyle: "short" });
}

function downloadSeoReport(
  metadata: SeoMetadataItem[],
  redirects: RedirectItem[],
  audits: Array<{ createdAt: string; entityId: string; entityType: string; language: string; score: number }>,
  t: (text: string) => string,
) {
  if (typeof window === "undefined") return;
  const blob = new Blob([JSON.stringify({ audits, generatedAt: new Date().toISOString(), metadata, redirects }, null, 2)], {
    type: "application/json;charset=utf-8",
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "seo-report.json";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
  toast.success(t("SEO report downloaded."));
}
