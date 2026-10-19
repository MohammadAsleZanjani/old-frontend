"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Eye, Filter, Globe2, Languages, Loader2, Save, Search, Sparkles } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "@/shared/ui/sonner";

import { getAdminOverview } from "@/features/admin/api/admin-dashboard-api";
import {
  generateAdminAiTranslation,
  getAdminAiTranslationLogs,
  getAdminLanguages,
  getAdminTranslations,
  upsertAdminLanguage,
  upsertAdminTranslation,
  type AiTranslationLogItem,
  type LanguageDirection,
  type LanguageItem,
  type TranslationRecordItem,
  type TranslationStatus,
} from "@/features/admin/api/admin-localization-api";
import { AdminShell } from "@/features/admin/components/AdminShell";
import { AdminExcelExportButton } from "@/features/admin/components/AdminExcelExportButton";
import { fetchAllAdminExportRows } from "@/features/admin/lib/admin-excel-export";
import { hasAdminPermission } from "@/features/admin/lib/admin-permissions";
import { useI18n } from "@/shared/i18n";
import { translateUiText } from "@/shared/i18n/ui-copy";
import { formatPlatformDate } from "@/shared/lib/date-format";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Checkbox } from "@/shared/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { ShadowSkeleton } from "@/shared/ui/skeleton-state";
import { Switch } from "@/shared/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { Textarea } from "@/shared/ui/textarea";

type LocalizationMode = "languages" | "translations" | "ai-logs";

const statuses: Array<"all" | TranslationStatus> = ["all", "MISSING", "DRAFT", "MACHINE_TRANSLATED", "MANUAL", "REVIEWED", "PUBLISHED"];
const emptyLanguage = { code: "", direction: "RTL" as LanguageDirection, isDefault: false, isEnabled: true, name: "", nativeName: "", sortOrder: 0 };
const emptyTranslation = { key: "", languageCode: "fa", namespace: "common", status: "MANUAL" as TranslationStatus, valueText: "{}" };
const emptyAi = { entityId: "", entityType: "Page", field: "title", force: false, sourceLanguage: "fa", sourceValueText: "{\"title\":\"\"}", targetLanguage: "en" };

export function AdminLocalizationPage({ mode }: { mode: LocalizationMode }) {
  const { dir, lang } = useI18n();
  const t = (text: string) => translateUiText(text, lang);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [language, setLanguage] = useState("all");
  const [status, setStatus] = useState<"all" | TranslationStatus>("all");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [activeRecord, setActiveRecord] = useState<LanguageItem | TranslationRecordItem | AiTranslationLogItem | null>(null);
  const [languageForm, setLanguageForm] = useState(emptyLanguage);
  const [translationForm, setTranslationForm] = useState(emptyTranslation);
  const [aiForm, setAiForm] = useState(emptyAi);
  const queryClient = useQueryClient();
  const overview = useQuery({ queryFn: () => getAdminOverview(), queryKey: ["admin-dashboard-overview"], retry: 1 });
  const access = overview.data?.access;
  const viewPermission: Record<LocalizationMode, string> = {
    "ai-logs": "localization.ai.view",
    languages: "localization.languages.view",
    translations: "localization.translations.view",
  };
  const allowed = hasAdminPermission(access, viewPermission[mode]);
  const canManage = mode === "languages"
    ? hasAdminPermission(access, "localization.languages.manage")
    : mode === "translations"
      ? hasAdminPermission(access, "localization.translations.manage")
      : hasAdminPermission(access, "localization.ai.generate");
  const languages = useQuery({
    enabled: allowed,
    queryFn: () => getAdminLanguages({ page: 1, pageSize: 100, search: mode === "languages" ? search : undefined, sortOrder }),
    queryKey: ["admin-localization-languages", mode === "languages" ? search : "", sortOrder],
    retry: 1,
  });
  const translations = useQuery({
    enabled: allowed && mode === "translations",
    queryFn: () => getAdminTranslations({ language: language === "all" ? undefined : language, page, pageSize: 10, search, sortOrder, status: status === "all" ? undefined : status }),
    queryKey: ["admin-localization-translations", language, page, search, sortOrder, status],
    retry: 1,
  });
  const aiLogs = useQuery({
    enabled: allowed && mode === "ai-logs",
    queryFn: () => getAdminAiTranslationLogs({ language: language === "all" ? undefined : language, page, pageSize: 10, search, sortOrder }),
    queryKey: ["admin-localization-ai-logs", language, page, search, sortOrder],
    retry: 1,
  });
  const activeQuery = mode === "languages" ? languages : mode === "translations" ? translations : aiLogs;
  const rows = useMemo(() => activeQuery.data?.items ?? [], [activeQuery.data?.items]);
  const languageOptions = languages.data?.items ?? [];
  const total = mode === "languages" ? languages.data?.total ?? rows.length : activeQuery.data?.total ?? 0;
  const totalPages = mode === "languages" ? languages.data?.totalPages ?? 1 : activeQuery.data?.totalPages ?? 1;
  const metrics = buildMetrics(mode, rows, total, t);
  const saveLanguage = useMutation({
    mutationFn: () => upsertAdminLanguage(languageForm),
    onError: (error) => toast.error(error instanceof Error ? error.message : t("Language save failed")),
    onSuccess: () => {
      toast.success(t("Language saved."));
      setLanguageForm(emptyLanguage);
      void queryClient.invalidateQueries({ queryKey: ["admin-localization-languages"] });
    },
  });
  const saveTranslation = useMutation({
    mutationFn: () => upsertAdminTranslation({
      key: translationForm.key.trim(),
      languageCode: translationForm.languageCode.trim(),
      namespace: translationForm.namespace.trim(),
      status: translationForm.status,
      value: parseRecord(translationForm.valueText),
    }),
    onError: (error) => toast.error(error instanceof Error ? error.message : t("Translation save failed")),
    onSuccess: () => {
      toast.success(t("Translation saved."));
      setTranslationForm(emptyTranslation);
      void queryClient.invalidateQueries({ queryKey: ["admin-localization-translations"] });
    },
  });
  const generateAi = useMutation({
    mutationFn: () => generateAdminAiTranslation({
      entityId: aiForm.entityId.trim() || undefined,
      entityType: aiForm.entityType.trim(),
      field: aiForm.field.trim() || undefined,
      force: aiForm.force,
      sourceLanguage: aiForm.sourceLanguage.trim(),
      sourceValue: parseRecord(aiForm.sourceValueText),
      targetLanguage: aiForm.targetLanguage.trim(),
    }),
    onError: (error) => toast.error(error instanceof Error ? error.message : t("AI translation failed")),
    onSuccess: (result) => {
      toast.success(result.applied ? t("AI translation generated.") : t("Manual translation preserved."));
      void queryClient.invalidateQueries({ queryKey: ["admin-localization-ai-logs"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-localization-translations"] });
    },
  });

  if (overview.isLoading) return <AdminShell><LocalizationSkeleton /></AdminShell>;
  if (overview.isError) return <AdminShell><Alert variant="destructive"><AlertTitle>{t("Localization unavailable")}</AlertTitle><AlertDescription>{t(overview.error.message)}</AlertDescription></Alert></AdminShell>;
  if (!allowed) return <AdminShell access={access}><Alert><AlertTitle>{t("Permission required")}</AlertTitle><AlertDescription>{t("Your account cannot use this section. Ask a senior administrator to review your role.")}</AlertDescription></Alert></AdminShell>;

  return (
    <AdminShell access={access}>
      <div className="space-y-6">
        <section className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl space-y-2">
            <Badge className="w-fit" variant="outline">{t("Localization")}</Badge>
            <h2 className="text-2xl font-bold md:text-3xl">{pageTitle(mode, t)}</h2>
            <p className="text-sm leading-7 text-muted-foreground">{pageDescription(mode, t)}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <AdminExcelExportButton
              disabled={activeQuery.isLoading || total === 0}
              fetchRows={() => fetchAllAdminExportRows<unknown>((exportPage, pageSize) => mode === "languages"
                ? getAdminLanguages({ page: exportPage, pageSize, search, sortOrder })
                : mode === "translations"
                  ? getAdminTranslations({ language: language === "all" ? undefined : language, page: exportPage, pageSize, search, sortOrder, status: status === "all" ? undefined : status })
                  : getAdminAiTranslationLogs({ language: language === "all" ? undefined : language, page: exportPage, pageSize, search, sortOrder }))}
              filename={pageTitle(mode, t)}
              sheetName={pageTitle(mode, t)}
            />
            <Button disabled={!selectedRows.length} onClick={() => downloadJson(`${pageTitle(mode, t)} ${t("selected")}`, rows.filter((row) => selectedRows.includes(row.id)), t)} variant="outline"><Download className="size-4" />{t("Export selected")}</Button>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          {metrics.map((metric) => (
            <Card className="rounded-lg border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]" key={metric.label}>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">{metric.label}</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-bold">{metric.value}</div><p className="mt-1 text-xs text-muted-foreground">{metric.meta}</p></CardContent>
            </Card>
          ))}
        </section>

        <Tabs dir={dir} value={mode}>
          <TabsList className="flex h-auto w-full flex-wrap justify-start rtl:[direction:rtl] ltr:[direction:ltr]" dir={dir}>
            {hasAdminPermission(access, "localization.languages.view") ? <TabsTrigger asChild value="languages"><Link href={"/admin/localization" as never}>{t("Languages")}</Link></TabsTrigger> : null}
            {hasAdminPermission(access, "localization.translations.view") ? <TabsTrigger asChild value="translations"><Link href={"/admin/localization/translations" as never}>{t("Translations")}</Link></TabsTrigger> : null}
            {hasAdminPermission(access, "localization.ai.view") ? <TabsTrigger asChild value="ai-logs"><Link href={"/admin/localization/ai-logs" as never}>{t("AI Logs")}</Link></TabsTrigger> : null}
          </TabsList>
          <TabsContent dir={dir} value={mode}>
            <section className="grid gap-4 xl:grid-cols-[1fr_430px]">
              <Card className="rounded-lg border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]">
                <CardHeader className="space-y-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <CardTitle className="flex items-center gap-2">{mode === "languages" ? <Languages className="size-5 text-primary" /> : mode === "ai-logs" ? <Sparkles className="size-5 text-primary" /> : <Globe2 className="size-5 text-primary" />}{pageTitle(mode, t)} {t("registry")}</CardTitle>
                    <Button onClick={() => setShowAdvancedFilters((current) => !current)} variant="outline">{t("Advanced filters")}</Button>
                  </div>
                  <div className="grid gap-3 lg:grid-cols-[1fr_150px_170px_150px]">
                    <div className="relative">
                      <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input className="ps-9" onChange={(event) => { setPage(1); setSearch(event.target.value); }} placeholder={t("Search languages, keys, namespaces, entities")} value={search} />
                    </div>
                    <Select dir={dir} disabled={mode === "languages"} onValueChange={(value) => { setPage(1); setLanguage(value); }} value={language}>
                      <SelectTrigger><Filter className="size-4" /><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="all">{t("All languages")}</SelectItem>{languageOptions.map((item) => <SelectItem key={item.code} value={item.code}>{item.code} · {item.nativeName}</SelectItem>)}</SelectContent>
                    </Select>
                    <Select dir={dir} disabled={mode !== "translations"} onValueChange={(value) => { setPage(1); setStatus(value as "all" | TranslationStatus); }} value={status}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{statuses.map((item) => <SelectItem key={item} value={item}>{item === "all" ? t("All statuses") : t(labelize(item))}</SelectItem>)}</SelectContent>
                    </Select>
                    <Select dir={dir} onValueChange={(value: "asc" | "desc") => setSortOrder(value)} value={sortOrder}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="asc">{t("Oldest first")}</SelectItem><SelectItem value="desc">{t("Newest first")}</SelectItem></SelectContent>
                    </Select>
                  </div>
                  {showAdvancedFilters ? <AdvancedSummary language={language} mode={mode} search={search} selected={selectedRows.length} status={status} /> : null}
                </CardHeader>
                <CardContent>
                  {activeQuery.isLoading ? <TableSkeleton /> : null}
                  {activeQuery.isError ? <Alert variant="destructive"><AlertTitle>{t("List unavailable")}</AlertTitle><AlertDescription>{t(activeQuery.error.message)}</AlertDescription></Alert> : null}
                  {!activeQuery.isLoading && !activeQuery.isError && rows.length ? <LocalizationTable canEdit={canManage} mode={mode} onEdit={(row) => { if (mode === "languages") setLanguageForm(fromLanguage(row as LanguageItem)); if (mode === "translations") setTranslationForm(fromTranslation(row as TranslationRecordItem)); }} onRecord={setActiveRecord} rows={rows} selectedRows={selectedRows} setSelectedRows={setSelectedRows} /> : null}
                  {!activeQuery.isLoading && !activeQuery.isError && !rows.length ? <EmptyState /> : null}
                  <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-muted-foreground">{t("Showing")} {rows.length} {t("of")} {total} {t("records")}.</p>
                    <div className="flex gap-2">
                      <Button disabled={page <= 1 || activeQuery.isLoading || mode === "languages"} onClick={() => setPage((current) => Math.max(1, current - 1))} size="sm" variant="outline">{t("Previous")}</Button>
                      <Button disabled={page >= totalPages || activeQuery.isLoading || mode === "languages"} onClick={() => setPage((current) => current + 1)} size="sm" variant="outline">{t("Next")}</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              {canManage ? mode === "languages" ? <LanguageEditor form={languageForm} isPending={saveLanguage.isPending} onChange={setLanguageForm} onSubmit={() => saveLanguage.mutate()} /> : mode === "translations" ? <TranslationEditor form={translationForm} isPending={saveTranslation.isPending} languages={languageOptions} onChange={setTranslationForm} onSubmit={() => saveTranslation.mutate()} /> : <AiGenerator form={aiForm} isPending={generateAi.isPending} languages={languageOptions} onChange={setAiForm} onSubmit={() => generateAi.mutate()} /> : null}
            </section>
          </TabsContent>
        </Tabs>
      </div>
      <RecordDialog record={activeRecord} onOpenChange={(open) => !open && setActiveRecord(null)} />
    </AdminShell>
  );
}

function LocalizationTable(props: { canEdit: boolean; mode: LocalizationMode; onEdit: (row: LanguageItem | TranslationRecordItem | AiTranslationLogItem) => void; onRecord: (row: LanguageItem | TranslationRecordItem | AiTranslationLogItem) => void; rows: Array<LanguageItem | TranslationRecordItem | AiTranslationLogItem>; selectedRows: string[]; setSelectedRows: (rows: string[]) => void }) {
  const { dir } = useI18n();
  const t = useAdminLocalizationT();
  const allSelected = props.rows.length > 0 && props.rows.every((row) => props.selectedRows.includes(row.id));
  return (
    <Table dir={dir}>
      <TableHeader><TableRow><TableHead className="w-10"><Checkbox checked={allSelected} onCheckedChange={(checked) => props.setSelectedRows(checked ? props.rows.map((row) => row.id) : [])} /></TableHead><TableHead>{t("Record")}</TableHead><TableHead>{t("Language")}</TableHead><TableHead>{t("Status")}</TableHead><TableHead>{t("Updated")}</TableHead><TableHead className="text-start">{t("Actions")}</TableHead></TableRow></TableHeader>
      <TableBody>{props.rows.map((row) => <TableRow key={row.id}><TableCell><Checkbox checked={props.selectedRows.includes(row.id)} onCheckedChange={(checked) => props.setSelectedRows(checked ? [...props.selectedRows, row.id] : props.selectedRows.filter((id) => id !== row.id))} /></TableCell><TableCell><div className="space-y-1"><p className="font-semibold">{recordTitle(row)}</p><p className="line-clamp-1 text-xs text-muted-foreground">{recordSubtitle(row, t)}</p></div></TableCell><TableCell>{languageBadge(row)}</TableCell><TableCell>{statusBadge(row, t)}</TableCell><TableCell className="text-muted-foreground">{formatDate("updatedAt" in row ? row.updatedAt : row.createdAt)}</TableCell><TableCell className="text-start"><div className="flex justify-end gap-2"><Button onClick={() => props.onRecord(row)} size="sm" variant="outline"><Eye className="size-4" />{t("View")}</Button>{props.canEdit && props.mode !== "ai-logs" ? <Button onClick={() => props.onEdit(row)} size="sm" variant="outline">{t("Edit")}</Button> : null}</div></TableCell></TableRow>)}</TableBody>
    </Table>
  );
}

function LanguageEditor(props: { form: typeof emptyLanguage; isPending: boolean; onChange: (form: typeof emptyLanguage) => void; onSubmit: () => void }) {
  const { dir } = useI18n();
  const t = useAdminLocalizationT();
  return <Card className="rounded-lg border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]"><CardHeader><CardTitle>{t("Language editor")}</CardTitle></CardHeader><CardContent className="space-y-4"><div className="grid gap-3 md:grid-cols-2"><Label className="space-y-2"><span>{t("Code")}</span><Input onChange={(e) => props.onChange({ ...props.form, code: e.target.value })} value={props.form.code} /></Label><Label className="space-y-2"><span>{t("Sort order")}</span><Input onChange={(e) => props.onChange({ ...props.form, sortOrder: Number(e.target.value) })} type="number" value={props.form.sortOrder} /></Label></div><Label className="space-y-2"><span>{t("Name")}</span><Input onChange={(e) => props.onChange({ ...props.form, name: e.target.value })} value={props.form.name} /></Label><Label className="space-y-2"><span>{t("Native name")}</span><Input onChange={(e) => props.onChange({ ...props.form, nativeName: e.target.value })} value={props.form.nativeName} /></Label><Select dir={dir} onValueChange={(value) => props.onChange({ ...props.form, direction: value as LanguageDirection })} value={props.form.direction}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="RTL">RTL</SelectItem><SelectItem value="LTR">LTR</SelectItem></SelectContent></Select><ToggleRow checked={props.form.isDefault} label={t("Default language")} onCheckedChange={(checked) => props.onChange({ ...props.form, isDefault: checked })} /><ToggleRow checked={props.form.isEnabled} label={t("Enabled")} onCheckedChange={(checked) => props.onChange({ ...props.form, isEnabled: checked })} /><Button className="w-full" disabled={props.isPending || !props.form.code.trim() || !props.form.name.trim() || !props.form.nativeName.trim()} onClick={props.onSubmit}>{props.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}{t("Save language")}</Button></CardContent></Card>;
}

function TranslationEditor(props: { form: typeof emptyTranslation; isPending: boolean; languages: LanguageItem[]; onChange: (form: typeof emptyTranslation) => void; onSubmit: () => void }) {
  const { dir } = useI18n();
  const t = useAdminLocalizationT();
  return <Card className="rounded-lg border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]"><CardHeader><CardTitle>{t("Translation editor")}</CardTitle></CardHeader><CardContent className="space-y-4"><div className="grid gap-3 md:grid-cols-2"><Select dir={dir} onValueChange={(value) => props.onChange({ ...props.form, languageCode: value })} value={props.form.languageCode}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{props.languages.map((item) => <SelectItem key={item.code} value={item.code}>{item.code} · {item.nativeName}</SelectItem>)}</SelectContent></Select><Select dir={dir} onValueChange={(value) => props.onChange({ ...props.form, status: value as TranslationStatus })} value={props.form.status}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{statuses.filter((item) => item !== "all").map((item) => <SelectItem key={item} value={item}>{t(labelize(item))}</SelectItem>)}</SelectContent></Select></div><Label className="space-y-2"><span>{t("Namespace")}</span><Input onChange={(e) => props.onChange({ ...props.form, namespace: e.target.value })} value={props.form.namespace} /></Label><Label className="space-y-2"><span>{t("Key")}</span><Input onChange={(e) => props.onChange({ ...props.form, key: e.target.value })} value={props.form.key} /></Label><Label className="space-y-2"><span>{t("Value JSON")}</span><Textarea className="min-h-56 font-mono text-xs" onChange={(e) => props.onChange({ ...props.form, valueText: e.target.value })} value={props.form.valueText} /></Label><Button className="w-full" disabled={props.isPending || !props.form.key.trim() || !props.form.namespace.trim() || !isValidJson(props.form.valueText)} onClick={props.onSubmit}>{props.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}{t("Save translation")}</Button></CardContent></Card>;
}

function AiGenerator(props: { form: typeof emptyAi; isPending: boolean; languages: LanguageItem[]; onChange: (form: typeof emptyAi) => void; onSubmit: () => void }) {
  const { dir } = useI18n();
  const t = useAdminLocalizationT();
  return <Card className="rounded-lg border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]"><CardHeader><CardTitle>{t("AI translation generator")}</CardTitle></CardHeader><CardContent className="space-y-4"><div className="grid gap-3 md:grid-cols-2"><Select dir={dir} onValueChange={(value) => props.onChange({ ...props.form, sourceLanguage: value })} value={props.form.sourceLanguage}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{props.languages.map((item) => <SelectItem key={item.code} value={item.code}>{item.code}</SelectItem>)}</SelectContent></Select><Select dir={dir} onValueChange={(value) => props.onChange({ ...props.form, targetLanguage: value })} value={props.form.targetLanguage}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{props.languages.map((item) => <SelectItem key={item.code} value={item.code}>{item.code}</SelectItem>)}</SelectContent></Select></div><div className="grid gap-3 md:grid-cols-2"><Label className="space-y-2"><span>{t("Entity type")}</span><Input onChange={(e) => props.onChange({ ...props.form, entityType: e.target.value })} value={props.form.entityType} /></Label><Label className="space-y-2"><span>{t("Field")}</span><Input onChange={(e) => props.onChange({ ...props.form, field: e.target.value })} value={props.form.field} /></Label></div><Label className="space-y-2"><span>{t("Entity ID")}</span><Input onChange={(e) => props.onChange({ ...props.form, entityId: e.target.value })} value={props.form.entityId} /></Label><Label className="space-y-2"><span>{t("Source value JSON")}</span><Textarea className="min-h-48 font-mono text-xs" onChange={(e) => props.onChange({ ...props.form, sourceValueText: e.target.value })} value={props.form.sourceValueText} /></Label><ToggleRow checked={props.form.force} label={t("Force overwrite manual translations")} onCheckedChange={(checked) => props.onChange({ ...props.form, force: checked })} /><Button className="w-full" disabled={props.isPending || !props.form.entityType.trim() || !props.form.sourceLanguage.trim() || !props.form.targetLanguage.trim() || !isValidJson(props.form.sourceValueText)} onClick={props.onSubmit}>{props.isPending ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}{t("Generate translation")}</Button></CardContent></Card>;
}

function ToggleRow({ checked, label, onCheckedChange }: { checked: boolean; label: string; onCheckedChange: (checked: boolean) => void }) {
  return <div className="flex items-center justify-between rounded-lg border border-border bg-background/35 p-3"><span className="text-sm font-medium">{label}</span><Switch checked={checked} onCheckedChange={onCheckedChange} /></div>;
}

function AdvancedSummary(props: { language: string; mode: LocalizationMode; search: string; selected: number; status: string }) {
  const t = useAdminLocalizationT();
  return <div className="grid gap-3 rounded-lg border border-border bg-background/35 p-3 text-sm md:grid-cols-4"><Summary label={t("Mode")} value={pageTitle(props.mode, t)} /><Summary label={t("Language")} value={props.language === "all" ? t("All languages") : props.language} /><Summary label={t("Status")} value={props.status === "all" ? t("All statuses") : t(labelize(props.status))} /><Summary label={t("Selection")} value={`${props.selected} ${t("selected")}; ${t("search")} ${props.search || t("none")}`} /></div>;
}

function Summary({ label, value }: { label: string; value: string }) {
  return <div><p className="font-medium">{label}</p><p className="mt-1 text-muted-foreground">{value}</p></div>;
}

function RecordDialog(props: { onOpenChange: (open: boolean) => void; record: LanguageItem | TranslationRecordItem | AiTranslationLogItem | null }) {
  const t = useAdminLocalizationT();
  return <Dialog onOpenChange={props.onOpenChange} open={!!props.record}><DialogContent className="max-w-3xl"><DialogHeader><DialogTitle>{t("Localization record")}</DialogTitle><DialogDescription>{t("Full localization payload for audit inspection.")}</DialogDescription></DialogHeader><pre className="max-h-[60vh] overflow-auto rounded-lg border border-border bg-muted/40 p-4 text-xs leading-6">{JSON.stringify(props.record, null, 2)}</pre></DialogContent></Dialog>;
}

function buildMetrics(mode: LocalizationMode, rows: Array<LanguageItem | TranslationRecordItem | AiTranslationLogItem>, total: number, t: (text: string) => string) {
  return [
    { label: t("Total"), meta: `${pageTitle(mode, t)} ${t("in scope")}`, value: total },
    { label: t("Enabled"), meta: t("Enabled languages or applied records"), value: rows.filter((row) => "isEnabled" in row ? row.isEnabled : row.status !== "MISSING").length },
    { label: "RTL", meta: t("RTL languages on page"), value: rows.filter((row) => ("direction" in row ? row.direction : row.language.direction) === "RTL").length },
    { label: t("Manual"), meta: t("Manual translation records"), value: rows.filter((row) => "isManual" in row && row.isManual).length },
  ];
}

function fromLanguage(item: LanguageItem) {
  return { code: item.code, direction: item.direction, isDefault: item.isDefault, isEnabled: item.isEnabled, name: item.name, nativeName: item.nativeName, sortOrder: item.sortOrder };
}

function fromTranslation(item: TranslationRecordItem) {
  return { key: item.key, languageCode: item.language.code, namespace: item.namespace ?? "common", status: item.status, valueText: JSON.stringify(item.value, null, 2) };
}

function recordTitle(row: LanguageItem | TranslationRecordItem | AiTranslationLogItem) {
  if ("nativeName" in row) return `${row.nativeName} (${row.code})`;
  if ("key" in row) return `${row.namespace}.${row.key}`;
  return `${row.entityType}${row.field ? ` · ${row.field}` : ""}`;
}

function recordSubtitle(row: LanguageItem | TranslationRecordItem | AiTranslationLogItem, t: (text: string) => string) {
  if ("nativeName" in row) return `${row.name} · ${row.direction}`;
  if ("key" in row) return JSON.stringify(row.value);
  return row.error ? t(row.error) : t(`Translated from ${row.sourceLanguage} to ${row.language.code} via ${row.provider}`);
}

function languageBadge(row: LanguageItem | TranslationRecordItem | AiTranslationLogItem) {
  const language = "nativeName" in row ? row : row.language;
  return <div className="flex flex-wrap gap-1"><Badge variant="outline">{language.code}</Badge><Badge variant={language.direction === "RTL" ? "secondary" : "outline"}>{language.direction}</Badge></div>;
}

function statusBadge(row: LanguageItem | TranslationRecordItem | AiTranslationLogItem, t: (text: string) => string) {
  if ("isEnabled" in row) return <Badge variant={row.isEnabled ? "outline" : "destructive"}>{row.isEnabled ? t("Enabled") : t("Disabled")}</Badge>;
  return <Badge variant={row.status === "MISSING" ? "destructive" : "secondary"}>{t(labelize(row.status))}</Badge>;
}

function pageTitle(mode: LocalizationMode, t: (text: string) => string = (text) => text) {
  if (mode === "translations") return t("Translations");
  if (mode === "ai-logs") return t("AI Translation Logs");
  return t("Languages");
}

function pageDescription(mode: LocalizationMode, t: (text: string) => string) {
  if (mode === "ai-logs") return t("Review AI translation generation, preserved manual translations, force operations, and result payloads.");
  if (mode === "translations") return t("Manage namespace translation records, statuses, manual overrides, and language-specific values.");
  return t("Manage enabled languages, default language, RTL/LTR direction, native names, and public sort order.");
}

function parseRecord(value: string) {
  const parsed = JSON.parse(value) as unknown;
  return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : {};
}

function isValidJson(value: string) {
  try {
    JSON.parse(value);
    return true;
  } catch {
    return false;
  }
}

function labelize(value: string) {
  return value.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value: string) {
  return formatPlatformDate(value, { dateStyle: "medium", timeStyle: "short" });
}

function downloadJson(label: string, items: unknown[], t: (text: string) => string) {
  if (typeof window === "undefined" || !items.length) return;
  const blob = new Blob([JSON.stringify({ generatedAt: new Date().toISOString(), items }, null, 2)], { type: "application/json;charset=utf-8" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
  toast.success(t("Export downloaded."));
}

function EmptyState() {
  const t = useAdminLocalizationT();
  return <div className="grid min-h-56 place-items-center rounded-lg border border-dashed border-border bg-background/30 p-6 text-center text-sm text-muted-foreground">{t("No localization records match the current filters.")}</div>;
}

function TableSkeleton() {
  return <div className="space-y-3">{Array.from({ length: 8 }).map((_, index) => <ShadowSkeleton className="h-12" key={index} />)}</div>;
}

function LocalizationSkeleton() {
  return <div className="space-y-6"><ShadowSkeleton className="h-28" /><div className="grid gap-4 md:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => <ShadowSkeleton className="h-28" key={index} />)}</div><ShadowSkeleton className="h-[40rem]" /></div>;
}

function useAdminLocalizationT() {
  const { lang } = useI18n();
  return (text: string) => translateUiText(text, lang);
}
