"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, PackagePlus, Pencil, Search, TriangleAlert } from "lucide-react";
import { useState } from "react";
import { toast } from "@/shared/ui/sonner";

import { adminApiRequest } from "@/features/admin/api/admin-api-request";
import { getAdminOverview } from "@/features/admin/api/admin-dashboard-api";
import { AdminShell } from "@/features/admin/components/AdminShell";
import { AdminExcelExportButton } from "@/features/admin/components/AdminExcelExportButton";
import { fetchAllAdminExportRows } from "@/features/admin/lib/admin-excel-export";
import { useI18n } from "@/shared/i18n";
import { translateUiText } from "@/shared/i18n/ui-copy";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { ShadowSkeleton } from "@/shared/ui/skeleton-state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";

type InventoryProduct = { id: string; lowStockThreshold: number; sku?: string | null; slug: string; status: string; stockQuantity: number; title: string; weightGrams?: string | number | null };
type InventoryPage = { items: InventoryProduct[]; total: number; totalPages: number };

export function ProductInventoryPage() {
  const { dir, lang } = useI18n();
  const t = (value: string) => translateUiText(value, lang);
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<InventoryProduct | null>(null);
  const [stockQuantity, setStockQuantity] = useState(0);
  const [lowStockThreshold, setLowStockThreshold] = useState(5);
  const overview = useQuery({ queryFn: () => getAdminOverview(), queryKey: ["admin-dashboard-overview"], retry: 1 });
  const list = useQuery({
    enabled: !!overview.data,
    queryFn: () => adminApiRequest<InventoryPage>("/admin/products/inventory", { query: { page: 1, pageSize: 100, search } }),
    queryKey: ["product-inventory", search],
    retry: 1,
  });
  const canEdit = !!overview.data?.access && (overview.data.access.isSuperAdmin || overview.data.access.permissions.includes("products.update"));
  const save = useMutation({
    mutationFn: () => adminApiRequest(`/admin/products/inventory/${editing?.id}`, { body: { lowStockThreshold, stockQuantity }, method: "PATCH" }),
    onError: (error) => toast.error(error instanceof Error ? error.message : t("Inventory could not be saved")),
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ["product-inventory"] }); setEditing(null); toast.success(t("Inventory saved")); },
  });
  const openEditor = (product: InventoryProduct) => {
    setEditing(product);
    setStockQuantity(product.stockQuantity);
    setLowStockThreshold(product.lowStockThreshold);
  };

  if (overview.isLoading) return <AdminShell><ShadowSkeleton className="h-[34rem]" /></AdminShell>;
  return (
    <AdminShell access={overview.data?.access}>
      <div className="space-y-6" dir={dir}>
        <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div><h1 className="text-3xl font-bold">{t("Product inventory")}</h1><p className="mt-2 text-muted-foreground">{t("Manage available stock and low-stock alerts for every silver product.")}</p></div>
          <div className="flex flex-wrap gap-2">
            <AdminExcelExportButton
              disabled={list.isLoading || (list.data?.total ?? 0) === 0}
              fetchRows={() => fetchAllAdminExportRows((page, pageSize) => adminApiRequest<InventoryPage>("/admin/products/inventory", { query: { page, pageSize, search } }))}
              filename="product-inventory"
              sheetName={t("Product inventory")}
            />
            <Button asChild><Link href="/admin/products/create"><PackagePlus className="size-4" />{t("Add silver product")}</Link></Button>
          </div>
        </section>
        <Card>
          <CardHeader><CardTitle>{t("Inventory records")}</CardTitle><div className="relative max-w-md"><Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input className="ps-9" onChange={(event) => setSearch(event.target.value)} placeholder={t("Search products")} value={search} /></div></CardHeader>
          <CardContent>
            {list.isLoading ? <div className="space-y-3">{Array.from({ length: 6 }).map((_, index) => <ShadowSkeleton className="h-12" key={index} />)}</div> : list.isError ? <Alert variant="destructive"><AlertTitle>{t("List unavailable")}</AlertTitle><AlertDescription>{list.error.message}</AlertDescription></Alert> : list.data?.items.length ? (
              <Table dir={dir}><TableHeader><TableRow><TableHead>{t("Product")}</TableHead><TableHead>{t("SKU")}</TableHead><TableHead>{t("Weight")}</TableHead><TableHead>{t("Available stock")}</TableHead><TableHead>{t("Low-stock alert at")}</TableHead><TableHead>{t("Status")}</TableHead><TableHead>{t("Actions")}</TableHead></TableRow></TableHeader><TableBody>{list.data.items.map((product) => { const low = product.stockQuantity <= product.lowStockThreshold; return <TableRow key={product.id}><TableCell className="font-medium">{product.title}</TableCell><TableCell dir="ltr">{product.sku ?? "—"}</TableCell><TableCell>{product.weightGrams ? `${product.weightGrams} ${t("grams")}` : "—"}</TableCell><TableCell><span className="inline-flex items-center gap-2">{low ? <TriangleAlert className="size-4 text-amber-500" /> : null}{product.stockQuantity}</span></TableCell><TableCell>{product.lowStockThreshold}</TableCell><TableCell><Badge variant="outline">{t(product.status)}</Badge></TableCell><TableCell><Button disabled={!canEdit} onClick={() => openEditor(product)} size="sm" variant="outline"><Pencil className="size-4" />{t("Edit")}</Button></TableCell></TableRow>; })}</TableBody></Table>
            ) : <div className="grid min-h-48 place-items-center rounded-lg border border-dashed text-muted-foreground">{t("No products found")}</div>}
          </CardContent>
        </Card>
      </div>
      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}><DialogContent dir={dir}><DialogHeader><DialogTitle>{t("Edit product inventory")}</DialogTitle><DialogDescription>{editing?.title}</DialogDescription></DialogHeader><div className="grid gap-4 sm:grid-cols-2"><label className="grid gap-2 text-sm"><span>{t("Available stock")}</span><Input min={0} onChange={(event) => setStockQuantity(Number(event.target.value))} type="number" value={stockQuantity} /></label><label className="grid gap-2 text-sm"><span>{t("Low-stock alert at")}</span><Input min={0} onChange={(event) => setLowStockThreshold(Number(event.target.value))} type="number" value={lowStockThreshold} /></label></div><DialogFooter><Button disabled={save.isPending || stockQuantity < 0 || lowStockThreshold < 0} onClick={() => save.mutate()}>{save.isPending ? <Loader2 className="size-4 animate-spin" /> : null}{t("Save")}</Button></DialogFooter></DialogContent></Dialog>
    </AdminShell>
  );
}
