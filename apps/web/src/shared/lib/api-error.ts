import { translateErrorText } from "@/shared/i18n/ui-copy";

export function extractApiError(payload: unknown): string | undefined {
  if (!payload || typeof payload !== "object") return undefined;
  const record = payload as Record<string, unknown>;
  const message = readMessage(record.message) ?? (isRecord(record.error) ? readMessage(record.error.message) : undefined);
  return message ? translateErrorText(message) : undefined;
}

function readMessage(message: unknown) {
  if (typeof message === "string" && message.trim()) return message;
  if (Array.isArray(message)) {
    const messages = message.filter((item): item is string => typeof item === "string" && Boolean(item.trim()));
    return messages.length ? messages.join("، ") : undefined;
  }
  return undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}
