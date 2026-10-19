"use client";

import { useCallback, useState, type Dispatch, type SetStateAction } from "react";
import { FileArchive, Loader2, UploadCloud, X } from "lucide-react";
import { useDropzone } from "react-dropzone";

import { useI18n } from "@/shared/i18n";
import { translateUiText } from "@/shared/i18n/ui-copy";
import { Button } from "@/shared/ui/button";
import { Progress } from "@/shared/ui/progress";
import { ShadowSkeleton } from "@/shared/ui/skeleton-state";
import { cn } from "@/shared/lib/utils";

import { uploadFile, type UploadApiResult } from "./upload-api";

interface UploadItem {
  error?: string;
  file: File;
  id: string;
  progress: number;
  result?: UploadApiResult;
  status: "queued" | "uploading" | "done" | "error";
}

interface DropzoneUploaderProps {
  accept?: Record<string, string[]>;
  accessToken?: string;
  className?: string;
  entityId?: string;
  entityType?: string;
  loading?: boolean;
  maxFiles?: number;
  maxSize?: number;
  onUploaded?: (upload: UploadApiResult) => void;
  visibility?: "PRIVATE" | "PUBLIC";
}

export function DropzoneUploader({
  accept,
  accessToken,
  className,
  entityId,
  entityType,
  loading = false,
  maxFiles = 8,
  maxSize = 50 * 1024 * 1024,
  onUploaded,
  visibility = "PRIVATE",
}: DropzoneUploaderProps) {
  const { lang } = useI18n();
  const t = useCallback((text: string) => translateUiText(text, lang), [lang]);
  const [items, setItems] = useState<UploadItem[]>([]);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const queued = acceptedFiles.map((file) => ({
        file,
        id: `${file.name}-${file.lastModified}-${crypto.randomUUID()}`,
        progress: 0,
        status: "queued" as const,
      }));

      setItems((current) => [...queued, ...current]);
      for (const item of queued) {
        void uploadQueuedItem(item, {
          accessToken,
          entityId,
          entityType,
          onUploaded,
          setItems,
          visibility,
        });
      }
    },
    [accessToken, entityId, entityType, onUploaded, visibility],
  );

  const { getInputProps, getRootProps, isDragActive, fileRejections } = useDropzone({
    accept,
    maxFiles,
    maxSize,
    onDrop,
  });

  if (loading) {
    return <ShadowSkeleton className={cn("h-44 rounded-lg", className)} />;
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div
        {...getRootProps()}
        className={cn(
          "flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-border bg-background/80 p-6 text-center shadow-sm transition-colors",
          isDragActive && "border-primary bg-primary/5 shadow-md",
        )}
      >
        <input {...getInputProps()} />
        <UploadCloud className="mb-3 size-8 text-primary" aria-hidden="true" />
        <p className="text-sm font-medium text-foreground">
          {isDragActive ? t("Drop files to upload") : t("Drag files here or choose files")}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">{t("Maximum file size:")} {formatBytes(maxSize)}.</p>
      </div>

      {fileRejections.length > 0 ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive shadow-sm">
          {fileRejections[0]?.errors[0]?.message ? t(fileRejections[0].errors[0].message) : t("One or more files could not be accepted.")}
        </div>
      ) : null}

      {items.length === 0 ? (
        <div className="rounded-lg border bg-card p-4 text-sm text-muted-foreground shadow-sm">
          {t("No files have been selected yet.")}
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <UploadRow key={item.id} item={item} onRemove={() => setItems((current) => current.filter((entry) => entry.id !== item.id))} t={t} />
          ))}
        </div>
      )}
    </div>
  );
}

function UploadRow({ item, onRemove, t }: { item: UploadItem; onRemove: () => void; t: (text: string) => string }) {
  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <FileArchive className="mt-0.5 size-5 text-primary" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-card-foreground">{item.file.name}</p>
              <p className="text-xs text-muted-foreground">{formatBytes(item.file.size)}</p>
            </div>
            <Button aria-label="Remove file" onClick={onRemove} size="icon" type="button" variant="ghost">
              <X aria-hidden="true" />
            </Button>
          </div>

          <div className="mt-3 flex items-center gap-3">
            {item.status === "uploading" ? <Loader2 className="size-4 animate-spin text-primary" aria-hidden="true" /> : null}
            <Progress value={item.progress} className="h-2 flex-1 shadow-inner" />
            <span className="w-12 text-right text-xs text-muted-foreground">{item.progress}%</span>
          </div>

          {item.status === "error" ? <p className="mt-2 text-xs text-destructive">{item.error}</p> : null}
          {item.status === "done" ? <p className="mt-2 text-xs text-muted-foreground">{t("Upload complete.")}</p> : null}
        </div>
      </div>
    </div>
  );
}

async function uploadQueuedItem(
  item: UploadItem,
  options: {
    accessToken?: string;
    entityId?: string;
    entityType?: string;
    onUploaded?: (upload: UploadApiResult) => void;
    setItems: Dispatch<SetStateAction<UploadItem[]>>;
    visibility: "PRIVATE" | "PUBLIC";
  },
) {
  options.setItems((current) => updateItem(current, item.id, { status: "uploading" }));
  try {
    const result = await uploadFile({
      accessToken: options.accessToken,
      entityId: options.entityId,
      entityType: options.entityType,
      file: item.file,
      onProgress: (progress) => options.setItems((current) => updateItem(current, item.id, { progress })),
      visibility: options.visibility,
    });
    options.setItems((current) => updateItem(current, item.id, { progress: 100, result, status: "done" }));
    options.onUploaded?.(result);
  } catch (error) {
    options.setItems((current) =>
      updateItem(current, item.id, {
        error: error instanceof Error ? error.message : "Upload failed",
        status: "error",
      }),
    );
  }
}

function updateItem(items: UploadItem[], id: string, patch: Partial<UploadItem>) {
  return items.map((item) => (item.id === id ? { ...item, ...patch } : item));
}

function formatBytes(bytes: number) {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const sizeIndex = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** sizeIndex).toFixed(sizeIndex === 0 ? 0 : 1)} ${units[sizeIndex]}`;
}
