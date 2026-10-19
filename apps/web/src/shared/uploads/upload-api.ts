export interface UploadApiResult {
  altText?: string | null;
  caption?: string | null;
  createdAt: string;
  entityId?: string | null;
  entityType?: string | null;
  extension: string;
  fileName: string;
  height?: number | null;
  id: string;
  mimeType: string;
  originalName: string;
  publicUrl?: string | null;
  sizeBytes: string;
  thumbnailUrl?: string | null;
  visibility: "PRIVATE" | "PUBLIC";
  width?: number | null;
}

export interface UploadFileInput {
  accessToken?: string;
  altText?: string;
  caption?: string;
  entityId?: string;
  entityType?: string;
  file: File;
  onProgress?: (progress: number) => void;
  visibility?: "PRIVATE" | "PUBLIC";
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://noghre.land/api/v1";

export function uploadFile(input: UploadFileInput) {
  return new Promise<UploadApiResult>((resolve, reject) => {
    const formData = new FormData();
    formData.append("file", input.file);
    if (input.entityType) formData.append("entityType", input.entityType);
    if (input.entityId) formData.append("entityId", input.entityId);
    if (input.altText) formData.append("altText", input.altText);
    if (input.caption) formData.append("caption", input.caption);
    if (input.visibility) formData.append("visibility", input.visibility);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_BASE}/uploads`);

    const token = input.accessToken ?? getStoredAccessToken();
    if (token) {
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    }

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        input.onProgress?.(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      const payload = parseJson(xhr.responseText);
      if (xhr.status >= 200 && xhr.status < 300) {
        input.onProgress?.(100);
        resolve(payload as UploadApiResult);
        return;
      }
      reject(new Error(readApiError(payload) ?? `Upload failed with status ${xhr.status}`));
    };

    xhr.onerror = () => reject(new Error("Upload failed because the network request could not be completed"));
    xhr.send(formData);
  });
}

function getStoredAccessToken() {
  if (typeof window === "undefined") {
    return undefined;
  }
  return (
    window.localStorage.getItem("noghre:accessToken") ??
    window.localStorage.getItem("accessToken") ??
    undefined
  );
}

function parseJson(value: string) {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return undefined;
  }
}

function readApiError(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return undefined;
  }
  const record = payload as Record<string, unknown>;
  const message = record.message ?? ((record.error && typeof record.error === "object") ? (record.error as Record<string, unknown>).message : undefined);
  if (typeof message === "string") {
    return message;
  }
  if (Array.isArray(message)) {
    return message.filter((item): item is string => typeof item === "string").join(", ");
  }
  return undefined;
}
