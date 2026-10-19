"use client";

import { FileText, Loader2, Paperclip, X } from "lucide-react";
import { useEffect, useRef, useState, type ChangeEvent } from "react";

import { useI18n } from "@/shared/i18n";
import { translateUiText } from "@/shared/i18n/ui-copy";
import { Button } from "@/shared/ui/button";
import { uploadFile, type UploadApiResult } from "@/shared/uploads/upload-api";

const DEFAULT_MAX_FILES = 5;
const DEFAULT_MAX_SIZE = 50 * 1024 * 1024;

interface PendingUpload {
  id: string;
  name: string;
  progress: number;
}

interface TicketAttachmentFieldProps {
  disabled?: boolean;
  entityId?: string;
  maxFiles?: number;
  onChange: (attachments: UploadApiResult[]) => void;
  onUploadingChange?: (uploading: boolean) => void;
  value: UploadApiResult[];
}

export function TicketAttachmentField({
  disabled = false,
  entityId,
  maxFiles = DEFAULT_MAX_FILES,
  onChange,
  onUploadingChange,
  value,
}: TicketAttachmentFieldProps) {
  const { lang } = useI18n();
  const t = (text: string) => translateUiText(text, lang);
  const inputRef = useRef<HTMLInputElement>(null);
  const valueRef = useRef(value);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingUpload[]>([]);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  useEffect(() => {
    onUploadingChange?.(pending.length > 0);
    return () => onUploadingChange?.(false);
  }, [onUploadingChange, pending.length]);

  const handleFiles = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files ?? []);
    event.target.value = "";
    setError(null);
    if (!selected.length) return;

    const remaining = Math.max(0, maxFiles - valueRef.current.length - pending.length);
    if (!remaining) {
      setError(t(`You can attach up to ${maxFiles} files.`));
      return;
    }

    const accepted = selected.slice(0, remaining).filter((file) => {
      if (file.size <= DEFAULT_MAX_SIZE) return true;
      setError(t(`${file.name}: Maximum file size is ${formatBytes(DEFAULT_MAX_SIZE)}.`));
      return false;
    });
    if (selected.length > remaining) setError(t(`You can attach up to ${maxFiles} files.`));

    for (const file of accepted) {
      const pendingId = `${file.name}-${file.lastModified}-${crypto.randomUUID()}`;
      setPending((current) => [...current, { id: pendingId, name: file.name, progress: 0 }]);
      void uploadFile({
        entityId,
        entityType: "support-ticket",
        file,
        onProgress: (progress) => setPending((current) => current.map((item) => (item.id === pendingId ? { ...item, progress } : item))),
        visibility: "PRIVATE",
      })
        .then((upload) => {
          const next = [...valueRef.current, upload];
          valueRef.current = next;
          onChange(next);
        })
        .catch((uploadError) => setError(uploadError instanceof Error ? uploadError.message : t("Attachment upload failed")))
        .finally(() => setPending((current) => current.filter((item) => item.id !== pendingId)));
    }
  };

  const remove = (uploadId: string) => {
    const next = valueRef.current.filter((upload) => upload.id !== uploadId);
    valueRef.current = next;
    onChange(next);
  };

  return (
    <div className="space-y-3 rounded-xl border border-dashed border-border bg-background/30 p-4">
      <input className="sr-only" disabled={disabled} multiple onChange={handleFiles} ref={inputRef} type="file" />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold"><Paperclip className="size-4 text-primary" />{t("Attachments")}</p>
          <p className="mt-1 text-xs text-muted-foreground">{t("Add screenshots, documents, or other files that help explain the request.")}</p>
        </div>
        <Button disabled={disabled || value.length + pending.length >= maxFiles} onClick={() => inputRef.current?.click()} size="sm" type="button" variant="outline">
          <Paperclip className="size-4" />
          {t("Attach files")}
        </Button>
      </div>

      {value.length || pending.length ? (
        <div className="grid gap-2 sm:grid-cols-2">
          {value.map((upload) => (
            <div className="flex min-w-0 items-center gap-2 rounded-lg border border-border bg-card/70 px-3 py-2" key={upload.id}>
              <FileText className="size-4 shrink-0 text-primary" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium">{upload.originalName || upload.fileName}</p>
                <p className="text-[11px] text-muted-foreground">{formatBytes(Number(upload.sizeBytes))}</p>
              </div>
              <Button aria-label={t("Remove attachment")} disabled={disabled} onClick={() => remove(upload.id)} size="icon" type="button" variant="ghost">
                <X className="size-4" />
              </Button>
            </div>
          ))}
          {pending.map((upload) => (
            <div className="flex min-w-0 items-center gap-2 rounded-lg border border-border bg-card/70 px-3 py-2" key={upload.id}>
              <Loader2 className="size-4 shrink-0 animate-spin text-primary" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium">{upload.name}</p>
                <p className="text-[11px] text-muted-foreground">{t("Uploading")} · {upload.progress}%</p>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      <p className="text-[11px] text-muted-foreground">{t(`Maximum file size: ${formatBytes(DEFAULT_MAX_SIZE)} · ${maxFiles} files maximum`)}</p>
    </div>
  );
}

function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}
