"use client";

import { useMutation } from "@tanstack/react-query";
import { FileSpreadsheet, Loader2 } from "lucide-react";
import { toast } from "@/shared/ui/sonner";

import { downloadAdminExcel, type AdminExcelColumn } from "@/features/admin/lib/admin-excel-export";
import { useI18n } from "@/shared/i18n";
import { translateUiText } from "@/shared/i18n/ui-copy";
import { Button } from "@/shared/ui/button";

export function AdminExcelExportButton({
  columns,
  disabled,
  fetchRows,
  filename,
  label,
  sheetName,
}: {
  columns?: AdminExcelColumn<unknown>[];
  disabled?: boolean;
  fetchRows: () => Promise<unknown[]>;
  filename: string;
  label?: string;
  sheetName: string;
}) {
  const { lang } = useI18n();
  const t = (text: string) => translateUiText(text, lang);
  const exportRows = useMutation({
    mutationFn: async () => {
      const rows = await fetchRows();
      await downloadAdminExcel({ columns, filename, rows, sheetName });
      return rows.length;
    },
    onError: (error) => toast.error(t(error instanceof Error ? error.message : "Excel export failed.")),
    onSuccess: (count) => toast.success(`${count.toLocaleString(lang)} ${t("records exported to Excel.")}`),
  });

  return (
    <Button disabled={disabled || exportRows.isPending} onClick={() => exportRows.mutate()} variant="outline">
      {exportRows.isPending ? <Loader2 className="size-4 animate-spin" /> : <FileSpreadsheet className="size-4" />}
      {label ?? t("Export all filtered records to Excel")}
    </Button>
  );
}
