import { adminApiRequest } from "./admin-api-request";

export type CmsPageStatus = "ARCHIVED" | "DRAFT" | "PUBLISHED";

export interface AdminCmsContact {
  href?: string | null;
  key: string;
  label: Record<string, string> | string;
  type: string;
  value: string;
}

export interface AdminCmsPage {
  contacts?: AdminCmsContact[];
  id: string;
  sections: Array<{
    content: Record<string, unknown>;
    id: string;
    key: string;
  }>;
  slug: string;
  status: CmsPageStatus;
  summary?: Record<string, string> | string | null;
  title: Record<string, string> | string;
  updatedAt: string;
}

export interface AdminCmsPageInput {
  body?: string;
  contacts?: Array<{
    href?: string;
    key: string;
    label: string;
    type: string;
    value: string;
  }>;
  description: string;
  eyebrow?: string;
  image?: string;
  points?: string[];
  status: CmsPageStatus;
  title: string;
}

export function getAdminCmsPage(slug: string) {
  return adminApiRequest<AdminCmsPage>(`/admin/cms/pages/${encodeURIComponent(slug)}`);
}

export function updateAdminCmsPage(slug: string, input: AdminCmsPageInput) {
  return adminApiRequest<AdminCmsPage>(`/admin/cms/pages/${encodeURIComponent(slug)}`, {
    body: input,
    method: "PATCH",
  });
}
