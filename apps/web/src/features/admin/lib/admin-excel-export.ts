export interface AdminExportPage<T> {
  items: T[];
  totalPages?: number;
}

export interface AdminExcelColumn<T> {
  header: string;
  key: string;
  value?: (row: T) => unknown;
  width?: number;
}

const EXPORT_PAGE_SIZE = 100;
const EXPORT_PAGE_BATCH = 4;
const MAX_EXPORT_PAGES = 10_000;

export async function fetchAllAdminExportRows<T>(
  fetchPage: (page: number, pageSize: number) => Promise<AdminExportPage<T>>,
) {
  const first = await fetchPage(1, EXPORT_PAGE_SIZE);
  const totalPages = Math.min(Math.max(1, first.totalPages ?? 1), MAX_EXPORT_PAGES);
  if (totalPages === 1) return first.items;

  const rows = [...first.items];
  for (let start = 2; start <= totalPages; start += EXPORT_PAGE_BATCH) {
    const pages = Array.from(
      { length: Math.min(EXPORT_PAGE_BATCH, totalPages - start + 1) },
      (_, index) => start + index,
    );
    const results = await Promise.all(pages.map((page) => fetchPage(page, EXPORT_PAGE_SIZE)));
    results.forEach((result) => rows.push(...result.items));
  }
  return rows;
}

export async function downloadAdminExcel<T>({
  columns,
  filename,
  rows,
  sheetName,
}: {
  columns?: AdminExcelColumn<T>[];
  filename: string;
  rows: T[];
  sheetName: string;
}) {
  if (typeof window === "undefined" || !rows.length) return;
  const ExcelJS = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Noghre Admin";
  workbook.created = new Date();
  workbook.modified = new Date();

  const normalizedRows = rows.map((row) => flattenRecord(row));
  const exportColumns = columns?.length
    ? columns
    : inferColumns(normalizedRows);
  const sheet = workbook.addWorksheet(safeSheetName(sheetName), {
    views: [{ rightToLeft: true, state: "frozen", ySplit: 1 }],
  });
  sheet.columns = exportColumns.map((column) => ({
    header: column.header,
    key: column.key,
    width: column.width ?? Math.min(45, Math.max(14, column.header.length + 4)),
  }));
  rows.forEach((row, index) => {
    const flattened = normalizedRows[index];
    const values: Record<string, unknown> = {};
    exportColumns.forEach((column) => {
      values[column.key] = excelValue(column.value ? column.value(row) : flattened[column.key]);
    });
    sheet.addRow(values);
  });

  const header = sheet.getRow(1);
  header.height = 28;
  header.font = { bold: true, color: { argb: "FFFFFFFF" } };
  header.alignment = { horizontal: "center", vertical: "middle" };
  header.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF202735" } };
  header.eachCell((cell) => {
    cell.border = { bottom: { color: { argb: "FFD3A833" }, style: "medium" } };
  });
  if (exportColumns.length) {
    sheet.autoFilter = { from: { column: 1, row: 1 }, to: { column: exportColumns.length, row: 1 } };
  }
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1 && rowNumber % 2 === 0) {
      row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF4F6F8" } };
    }
    row.alignment = { vertical: "middle", wrapText: true };
  });

  const report = workbook.addWorksheet("Report", { views: [{ rightToLeft: true }] });
  report.columns = [{ width: 25 }, { width: 42 }];
  report.addRows([
    ["Generated at", new Date()],
    ["Record count", rows.length],
    ["Source", sheetName],
  ]);
  report.getColumn(1).font = { bold: true };
  report.getCell("B1").numFmt = "yyyy-mm-dd hh:mm:ss";

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${safeFilename(filename)}-${new Date().toISOString().slice(0, 10)}.xlsx`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

function flattenRecord(value: unknown, prefix = "", output: Record<string, unknown> = {}) {
  if (!value || typeof value !== "object" || value instanceof Date) {
    if (prefix) output[prefix] = value;
    return output;
  }
  if (Array.isArray(value)) {
    if (prefix) output[prefix] = value.map((item) => primitiveOrJson(item)).join(" | ");
    return output;
  }
  Object.entries(value as Record<string, unknown>).forEach(([key, item]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (item && typeof item === "object" && !Array.isArray(item) && !(item instanceof Date)) {
      flattenRecord(item, path, output);
    } else {
      output[path] = Array.isArray(item) ? item.map((entry) => primitiveOrJson(entry)).join(" | ") : item;
    }
  });
  return output;
}

function inferColumns(rows: Array<Record<string, unknown>>): AdminExcelColumn<unknown>[] {
  const keys: string[] = [];
  const seen = new Set<string>();
  rows.forEach((row) => Object.keys(row).forEach((key) => {
    if (!seen.has(key)) {
      seen.add(key);
      keys.push(key);
    }
  }));
  return keys.map((key) => ({ header: key, key, width: suggestedWidth(key, rows) }));
}

function suggestedWidth(key: string, rows: Array<Record<string, unknown>>) {
  const longest = rows.slice(0, 200).reduce((length, row) => Math.max(length, String(excelValue(row[key]) ?? "").length), key.length);
  return Math.min(45, Math.max(14, longest + 2));
}

function excelValue(value: unknown): string | number | boolean | Date {
  if (value instanceof Date) return value;
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (value === null || value === undefined) return "";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function primitiveOrJson(value: unknown) {
  return value === null || value === undefined || ["string", "number", "boolean"].includes(typeof value)
    ? String(value ?? "")
    : JSON.stringify(value);
}

function safeFilename(value: string) {
  return value.trim().toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "") || "admin-export";
}

function safeSheetName(value: string) {
  return value.replace(/[\\/*?:[\]]/g, " ").trim().slice(0, 31) || "Records";
}
