"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "@/shared/ui/sonner";

import { adminApiRequest } from "@/features/admin/api/admin-api-request";
import { getAdminOverview } from "@/features/admin/api/admin-dashboard-api";
import { AdminShell } from "@/features/admin/components/AdminShell";
import { AdminExcelExportButton } from "@/features/admin/components/AdminExcelExportButton";
import { fetchAllAdminExportRows } from "@/features/admin/lib/admin-excel-export";
import {
  preferredWeightUnit,
  productWeightGrams,
  productWeightLabel,
  productWeightSlug,
  taxonomyWeightGrams,
  weightInputValue,
  type ProductWeightUnit,
} from "@/features/admin/lib/product-weight";
import { useI18n } from "@/shared/i18n";
import { translateUiText } from "@/shared/i18n/ui-copy";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { ShadowSkeleton } from "@/shared/ui/skeleton-state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";

type TaxonomyKind = "categories" | "manufacturers" | "purities" | "silver-types" | "sizes" | "tags" | "tech-stacks";
type TaxonomyItem = { _count?: { products?: number }; id: string; name?: string; slug: string; title?: Record<string, string>; weightGrams?: number | string | null };
type TaxonomyPage = { items: TaxonomyItem[]; total: number; totalPages: number };

const configs: Record<TaxonomyKind, { description: string; endpoint: string; label: string; localized: boolean }> = {
  categories: { description: "Create and manage the categories available in the product form.", endpoint: "/admin/products/taxonomy/categories", label: "Product categories", localized: true },
  "silver-types": { description: "Create and manage silver product types available in the product form.", endpoint: "/admin/products/taxonomy/silver-types", label: "Silver product types", localized: false },
  sizes: { description: "Manage standard silver product weights and sizes.", endpoint: "/admin/products/taxonomy/sizes", label: "Weights and sizes", localized: false },
  purities: { description: "Manage silver purity standards.", endpoint: "/admin/products/taxonomy/purities", label: "Purities", localized: false },
  manufacturers: { description: "Manage mints and silver product manufacturers.", endpoint: "/admin/products/taxonomy/manufacturers", label: "Manufacturers", localized: false },
  tags: { description: "Create and manage searchable product tags.", endpoint: "/admin/products/taxonomy/tags", label: "Product tags", localized: true },
  "tech-stacks": { description: "Manage additional technical product attributes.", endpoint: "/admin/products/taxonomy/attributes", label: "Product attributes", localized: false },
};

export function ProductTaxonomyPage({ kind }: { kind: TaxonomyKind }) {
  const config = configs[kind];
  const { dir, lang } = useI18n();
  const t = (value: string) => translateUiText(value, lang);
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [editor, setEditor] = useState<TaxonomyItem | "new" | null>(null);
  const [removeItem, setRemoveItem] = useState<TaxonomyItem | null>(null);
  const [slug, setSlug] = useState("");
  const [nameFa, setNameFa] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [weightValue, setWeightValue] = useState("");
  const [weightUnit, setWeightUnit] = useState<ProductWeightUnit>("GRAM");
  const isWeightTaxonomy = kind === "sizes";
  const overview = useQuery({ queryFn: () => getAdminOverview(), queryKey: ["admin-dashboard-overview"], retry: 1 });
  const list = useQuery({
    enabled: !!overview.data,
    queryFn: () => adminApiRequest<TaxonomyPage>(config.endpoint, { query: { page: 1, pageSize: 100, search } }),
    queryKey: ["product-taxonomy", kind, search],
    retry: 1,
  });
  const canCreate = !!overview.data?.access && (overview.data.access.isSuperAdmin || overview.data.access.permissions.includes("products.create"));
  const canUpdate = !!overview.data?.access && (overview.data.access.isSuperAdmin || overview.data.access.permissions.includes("products.update"));
  const rows = useMemo(() => list.data?.items ?? [], [list.data?.items]);
  const save = useMutation({
    mutationFn: () => {
      const grams = isWeightTaxonomy ? productWeightGrams(weightValue, weightUnit) : undefined;
      if (isWeightTaxonomy && !grams) throw new Error(t("Enter a positive product weight."));
      const body = isWeightTaxonomy
        ? { name: `${grams} گرم`, slug: productWeightSlug(grams ?? 0) }
        : config.localized ? { slug, title: { en: nameEn || nameFa, fa: nameFa } } : { name: nameFa, slug };
      return adminApiRequest(editor === "new" ? config.endpoint : `${config.endpoint}/${editor?.id}`, { body, method: editor === "new" ? "POST" : "PATCH" });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t("Record could not be saved")),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["product-taxonomy", kind] }),
        queryClient.invalidateQueries({ queryKey: ["admin-product-taxonomy"] }),
      ]);
      setEditor(null);
      toast.success(t("Record saved"));
    },
  });
  const remove = useMutation({
    mutationFn: (id: string) => adminApiRequest(`${config.endpoint}/${id}`, { method: "DELETE" }),
    onError: (error) => toast.error(error instanceof Error ? error.message : t("Record could not be removed")),
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ["product-taxonomy", kind] }); setRemoveItem(null); toast.success(t("Record removed")); },
  });

  const openEditor = (item: TaxonomyItem | "new") => {
    setEditor(item);
    setSlug(item === "new" ? "" : item.slug);
    setNameFa(item === "new" ? "" : item.title?.fa ?? item.name ?? "");
    setNameEn(item === "new" ? "" : item.title?.en ?? "");
    if (isWeightTaxonomy) {
      const grams = item === "new" ? 0 : taxonomyWeightGrams(item) ?? 0;
      const unit = item === "new" ? "GRAM" : preferredWeightUnit(grams, `${item.name ?? ""} ${item.slug}`);
      setWeightUnit(unit);
      setWeightValue(weightInputValue(grams, unit));
    }
  };

  if (overview.isLoading) return <AdminShell><ShadowSkeleton className="h-[34rem]" /></AdminShell>;
  return (
    <AdminShell access={overview.data?.access}>
      <div className="space-y-6" dir={dir}>
        <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div><h1 className="text-3xl font-bold">{t(config.label)}</h1><p className="mt-2 text-muted-foreground">{t(config.description)}</p></div>
          <div className="flex flex-wrap gap-2">
            <AdminExcelExportButton
              disabled={list.isLoading || (list.data?.total ?? 0) === 0}
              fetchRows={() => fetchAllAdminExportRows((page, pageSize) => adminApiRequest<TaxonomyPage>(config.endpoint, { query: { page, pageSize, search } }))}
              filename={config.label}
              sheetName={t(config.label)}
            />
            <Button disabled={!canCreate} onClick={() => openEditor("new")}><Plus className="size-4" />{t(isWeightTaxonomy ? "Define product weight" : "Add record")}</Button>
          </div>
        </section>
        {!canCreate && !canUpdate ? <Alert><AlertTitle>{t("Permission required")}</AlertTitle><AlertDescription>{t("You do not have permission to change these records.")}</AlertDescription></Alert> : null}
        <Card>
          <CardHeader><CardTitle>{t("Database records")}</CardTitle><div className="relative max-w-md"><Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input className="ps-9" onChange={(event) => setSearch(event.target.value)} placeholder={t("Search records")} value={search} /></div></CardHeader>
          <CardContent>
            {list.isLoading ? <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <ShadowSkeleton className="h-12" key={i} />)}</div> : list.isError ? <Alert variant="destructive"><AlertTitle>{t("List unavailable")}</AlertTitle><AlertDescription>{list.error.message}</AlertDescription></Alert> : rows.length ? (
              isWeightTaxonomy ? (
                <Table dir={dir}>
                  <TableHeader><TableRow><TableHead>{t("Defined product weight")}</TableHead><TableHead>{t("Exact weight in grams")}</TableHead><TableHead>{t("Display unit")}</TableHead><TableHead>{t("Products")}</TableHead><TableHead>{t("Actions")}</TableHead></TableRow></TableHeader>
                  <TableBody>{rows.map((item) => {
                    const grams = taxonomyWeightGrams(item);
                    return <TableRow key={item.id}>
                      <TableCell className="font-medium">{grams ? productWeightLabel(grams, lang === "fa" ? "fa-IR" : "en-US") : item.name ?? item.slug}</TableCell>
                      <TableCell className="tabular-nums">{grams ? new Intl.NumberFormat(lang === "fa" ? "fa-IR" : "en-US", { maximumFractionDigits: 3 }).format(grams) : <span className="text-destructive">{t("Weight value is missing")}</span>}</TableCell>
                      <TableCell>{t(grams && grams >= 1_000 ? "Kilogram" : "Gram")}</TableCell>
                      <TableCell>{item._count?.products ?? 0}</TableCell>
                      <TableCell><div className="flex gap-2"><Button disabled={!canUpdate} onClick={() => openEditor(item)} size="icon" variant="ghost"><Pencil className="size-4" /></Button><Button disabled={!canUpdate} onClick={() => setRemoveItem(item)} size="icon" variant="ghost"><Trash2 className="size-4 text-destructive" /></Button></div></TableCell>
                    </TableRow>;
                  })}</TableBody>
                </Table>
              ) : <Table dir={dir}><TableHeader><TableRow><TableHead>{t("Name")}</TableHead><TableHead>{t("Slug")}</TableHead><TableHead>{t("Products")}</TableHead><TableHead>{t("Actions")}</TableHead></TableRow></TableHeader><TableBody>{rows.map((item) => <TableRow key={item.id}><TableCell className="font-medium">{item.title?.[lang] ?? item.title?.fa ?? item.title?.en ?? item.name ?? item.slug}</TableCell><TableCell dir="ltr" className="text-start text-muted-foreground">{item.slug}</TableCell><TableCell>{item._count?.products ?? 0}</TableCell><TableCell><div className="flex gap-2"><Button disabled={!canUpdate} onClick={() => openEditor(item)} size="icon" variant="ghost"><Pencil className="size-4" /></Button><Button disabled={!canUpdate} onClick={() => setRemoveItem(item)} size="icon" variant="ghost"><Trash2 className="size-4 text-destructive" /></Button></div></TableCell></TableRow>)}</TableBody></Table>
            ) : <div className="grid min-h-48 place-items-center rounded-lg border border-dashed text-muted-foreground">{t("No database records found")}</div>}
          </CardContent>
        </Card>
      </div>

      <Dialog open={editor !== null} onOpenChange={(open) => !open && setEditor(null)}><DialogContent dir={dir}><DialogHeader><DialogTitle>{t(isWeightTaxonomy ? editor === "new" ? "Define product weight" : "Edit product weight" : editor === "new" ? "Add record" : "Edit record")}</DialogTitle><DialogDescription>{t(isWeightTaxonomy ? "Enter the numeric weight and choose its unit. The exact gram value will be stored and added to the product form." : "Changes are stored in the database and immediately become available in product forms.")}</DialogDescription></DialogHeader>{isWeightTaxonomy ? <div className="space-y-4"><div className="grid gap-3 sm:grid-cols-[1fr_180px]"><label className="grid gap-2 text-sm"><span>{t("Weight value")}</span><Input autoFocus dir="ltr" inputMode="decimal" min="0.001" onChange={(event) => setWeightValue(event.target.value)} placeholder={weightUnit === "GRAM" ? "250" : "1"} step="0.001" type="number" value={weightValue} /></label><label className="grid gap-2 text-sm"><span>{t("Weight unit")}</span><Select dir={dir} onValueChange={(unit: ProductWeightUnit) => setWeightUnit(unit)} value={weightUnit}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="GRAM">{t("Gram")}</SelectItem><SelectItem value="KILOGRAM">{t("Kilogram")}</SelectItem></SelectContent></Select></label></div>{productWeightGrams(weightValue, weightUnit) ? <div className="rounded-lg border border-primary/25 bg-primary/5 p-4"><p className="text-xs text-muted-foreground">{t("Weight preview")}</p><p className="mt-1 text-lg font-bold">{productWeightLabel(productWeightGrams(weightValue, weightUnit) ?? 0, lang === "fa" ? "fa-IR" : "en-US")}</p><p className="mt-1 text-xs text-muted-foreground">{t("Stored value")}: {productWeightGrams(weightValue, weightUnit)} {t("grams")}</p></div> : null}</div> : <div className="space-y-4"><label className="grid gap-2 text-sm"><span>{t("Persian name")}</span><Input onChange={(e) => setNameFa(e.target.value)} value={nameFa} /></label>{config.localized ? <label className="grid gap-2 text-sm"><span>{t("English name")}</span><Input dir="ltr" onChange={(e) => setNameEn(e.target.value)} value={nameEn} /></label> : null}<label className="grid gap-2 text-sm"><span>{t("Slug")}</span><Input dir="ltr" disabled={editor !== "new"} onChange={(e) => setSlug(e.target.value)} value={slug} /></label></div>}<DialogFooter><Button disabled={save.isPending || (isWeightTaxonomy ? !productWeightGrams(weightValue, weightUnit) : !slug.trim() || !nameFa.trim())} onClick={() => save.mutate()}>{save.isPending ? <Loader2 className="size-4 animate-spin" /> : null}{t("Save")}</Button></DialogFooter></DialogContent></Dialog>
      <Dialog open={!!removeItem} onOpenChange={(open) => !open && setRemoveItem(null)}><DialogContent dir={dir}><DialogHeader><DialogTitle>{t("Remove record")}</DialogTitle><DialogDescription>{t("The record will be archived and will no longer appear in product forms.")}</DialogDescription></DialogHeader><DialogFooter><Button onClick={() => setRemoveItem(null)} variant="outline">{t("Cancel")}</Button><Button disabled={remove.isPending} onClick={() => removeItem && remove.mutate(removeItem.id)} variant="destructive">{remove.isPending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}{t("Remove")}</Button></DialogFooter></DialogContent></Dialog>
    </AdminShell>
  );
}

export type { TaxonomyKind };
